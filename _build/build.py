# Сборщик данных интерактивной карты: читает скрипты и тексты игры, пишет Map/data.js.
# Запуск из папки игры:  python -I Map\_build\build.py
import re, os, json, sys
import numpy as np
from PIL import Image

GAME = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MAP = os.path.join(GAME, 'Map')
P = lambda *a: os.path.join(GAME, *a)

def read(path):
    return open(path, encoding='utf-8-sig', errors='replace').read()

def strip_comments(s):
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
    return re.sub(r'//[^\n]*', '', s)

def loclables(lang):
    t = read(P('Resource', 'INI', 'texts', lang, 'LocLables.txt'))
    return {k.strip(): v.strip() for k, v in re.findall(r'^([^{\n]+?)\s*\{([^}]*)\}', t, re.M)}

def items_names(lang):
    t = read(P('Resource', 'INI', 'texts', lang, 'ItemsDescribe.txt'))
    return {k.strip(): v.strip() for k, v in re.findall(r'^([^{\n]+?)\s*\{([^}]*)\}', t, re.M)}

LL = {'ru': loclables('russian'), 'en': loclables('english')}
IT = {'ru': items_names('russian'), 'en': items_names('english')}

# --- worldmap_init.c: метки и позиции -------------------------------------
wm = strip_comments(read(P('Program', 'worldmap', 'worldmap_init.c')))
labels = {}
for lid, key, val in re.findall(r'worldMap\.labels\.(\w+)\.(\w+)\s*=\s*([^;]+);', wm):
    labels.setdefault(lid, {})[key] = val.strip()
pos = {}
for isl, sub, ax, v in re.findall(r'worldMap\.islands\.(\w+)\.(?:(\w+)\.)?position\.([xz])\s*=\s*(-?[\d.]+)', wm):
    pos.setdefault((isl, sub or None), {})[ax] = float(v)

# --- islands_init.c: id -> name ------------------------------------------
ii = strip_comments(read(P('Program', 'islands', 'islands_init.c')))
isl_name = dict(re.findall(r'Islands\[n\]\.id\s*=\s*"(\w+)";\s*Islands\[n\]\.name\s*=\s*"(\w+)"', ii))

NATIONS = {'ENGLAND': 'england', 'FRANCE': 'france', 'SPAIN': 'spain', 'HOLLAND': 'holland', 'PIRATE': 'pirate'}
MAINLAND = {'Beliz', 'Cartahena', 'Maracaibo', 'Caracas', 'Cumana', 'PortoBello', 'Panama', 'SantaCatalina'}

def name(key, *fallback):
    out = {}
    for lang in ('ru', 'en'):
        for k in (key,) + fallback:
            if k and k in LL[lang]:
                out[lang] = LL[lang][k]; break
        else:
            out[lang] = key
    return out

def label_text(lid):
    lb = labels.get(lid)
    if not lb or 'text' not in lb: return None
    m = re.match(r'(\w+)\("(\w+)"\)', lb['text'])
    if not m: return None
    fn, arg = m.groups()
    if fn == 'GetIslandNameByID': return name(isl_name.get(arg, arg))
    return name(arg)

# --- колонии: нация на начало игры ------------------------------------------
ci = strip_comments(read(P('Program', 'colonies', 'Colonies_init.c')))
colony_nation, colony_island = {}, {}
for cid, body in re.findall(r'Colonies\[n\]\.id\s*=\s*"(\w+)";(.*?)(?=Colonies\[n\]\.id\s*=|\Z)', ci, re.S):
    m = re.search(r'Colonies\[n\]\.nation\s*=\s*(\w+)', body)
    colony_nation[cid] = NATIONS.get(m.group(1)) if m else None
    m = re.search(r'Colonies\[n\]\.island\s*=\s*"(\w+)"', body)
    if m: colony_island[cid] = m.group(1)

# острова, которых нет на бумажной карте (квестовые/скрытые); координаты у них условные (сетка 2048/24)
HIDDEN = {'LostShipsCity', 'RockIsland', 'Ksochitam', 'KhaelRoa', 'Providence', 'SantaQuiteria',
          'IslaDeVieques', 'IslaMona', 'IslaDeCoche'}

# --- регионы (острова глобальной карты), группировка в острова ------------
regions, islands, towns, shores = [], {}, [], []
for (isl, sub), p in pos.items():
    if sub is not None: continue
    nm = isl_name.get(isl, isl)
    mainland = isl in MAINLAND
    regions.append({'id': isl, 'x': p['x'], 'z': p['z'], 'island': None if mainland else nm,
                    'mainland': mainland, 'hidden': isl in HIDDEN, 'name': name(isl)})
    if not mainland:
        I = islands.setdefault(nm, {'id': nm, 'regions': [], 'name': name(nm), 'pts': [], 'hidden': isl in HIDDEN})
        I['regions'].append(isl); I['pts'].append((p['x'], p['z']))

for I in islands.values():                       # у составных (Куба, Эспаньола) — центр между частями
    I['x'], I['z'] = (round(float(v), 3) for v in np.mean(I.pop('pts'), axis=0))

for (isl, sub), p in pos.items():
    if sub is None: continue
    rec = {'id': sub, 'region': isl, 'x': p['x'], 'z': p['z']}
    if sub.endswith('_town') or sub.endswith('_port'):
        cid = sub.rsplit('_', 1)[0]
        rec['colony'] = cid
        rec['name'] = label_text(sub) or name(sub, cid + ' Town')
        rec['nation'] = colony_nation.get(cid)
        towns.append(rec)
    else:
        rec['kind'] = 'lighthouse' if sub.startswith('Mayak') else 'shore'
        rec['name'] = label_text(sub) or name(sub)
        if isl in HIDDEN: rec['hidden'] = True
        shores.append(rec)

# --- карты-предметы ---------------------------------------------------------
it = strip_comments(read(P('Program', 'items', 'initItems.c')))
ITL = {lang: {k.lower(): v for k, v in IT[lang].items()} for lang in IT}
maps = []
for iid, tga, atlas, area in re.findall(r'InitStdMap\(n,\s*"(\w+)",\s*"\w+",\s*\d+,[^,]+,[^,]+,[^,]+,\s*"(\w+)",\s*"\w*",\s*"(\w+)",\s*"\w*",\s*"(\w*)"\)', it):
    if tga == 'none': continue
    f = tga.lower()
    files = {lang: next((x for x in os.listdir(os.path.join(MAP, 'img', lang)) if x.lower().startswith(f + '.')), None)
             for lang in ('ru', 'en')}
    if not files['ru']: print('нет картинки', tga, file=sys.stderr); continue
    nm = {lang: ITL[lang].get('itmname_' + iid.lower()) for lang in ('ru', 'en')}
    if iid == 'map_LSC': area = 'LostShipsCity'
    maps.append({'item': iid, 'kind': atlas, 'area': area, 'files': files, 'name': nm})

# --- калибровка: точки поселений на очищенной карте -> координаты мира -----
def detect_dots(path):
    from scipy import ndimage
    im = np.asarray(Image.open(path).convert('L')).astype(int)
    m = im < 50
    lab, n = ndimage.label(m)
    out = []
    for i, s in enumerate(ndimage.find_objects(lab)):
        h, w = s[0].stop - s[0].start, s[1].stop - s[1].start
        if 7 <= h <= 30 and 7 <= w <= 30 and (lab[s] == i + 1).sum() > 40:
            cy, cx = ndimage.center_of_mass(m, lab, i + 1)
            out.append((cx, cy))
    return np.array(out)

dots = detect_dots(os.path.join(MAP, 'img', 'map_clean.jpg'))
W = Image.open(os.path.join(MAP, 'img', 'map_clean.jpg')).size[0]
pts = np.array([(t['x'], t['z']) for t in towns])
ax, bx, az, bz = W / 2048 * 0.96, W / 2 , -W / 2048 * 0.94, W / 2 * 0.99   # первое приближение
pairs = None
for it_ in range(6):
    pred = np.c_[ax * pts[:, 0] + bx, az * pts[:, 1] + bz]
    cand = []
    for i, p in enumerate(pred):
        d = np.hypot(*(dots - p).T); j = d.argmin()
        cand.append((i, j, d[j]))
    lim = max(6.0, 2.5 * np.median([c[2] for c in cand]))
    pairs = [(i, j) for i, j, dd in cand if dd < lim]
    A = pts[[i for i, _ in pairs]]; D = dots[[j for _, j in pairs]]
    ax, bx = np.polyfit(A[:, 0], D[:, 0], 1); az, bz = np.polyfit(A[:, 1], D[:, 1], 1)
res = np.hypot(ax * A[:, 0] + bx - D[:, 0], az * A[:, 1] + bz - D[:, 1])
print(f'калибровка: {len(pairs)} пар, px = {ax:.5f}*x + {bx:.2f}, py = {az:.5f}*z + {bz:.2f}; '
      f'невязка ср {res.mean():.1f} макс {res.max():.1f} px', file=sys.stderr)
for (i, j), r in zip(pairs, res):
    if r > 6: print('  ', towns[i]['id'], round(r, 1), file=sys.stderr)
unmatched = set(range(len(towns))) - {i for i, _ in pairs}
for i in unmatched: print('  без точки на карте:', towns[i]['id'], file=sys.stderr)

# поселения без позиции на глобальной карте (Марун-Таун) — берём свободную точку на бумажной карте
used = {j for _, j in pairs}
for cid, isl in colony_island.items():
    if any(t['colony'] == cid for t in towns) or (isl, None) not in pos or colony_nation.get(cid) is None: continue
    c = pos[(isl, None)]
    best = None
    for j, (dx, dy) in enumerate(dots):
        if j in used: continue
        x, z = (dx - bx) / ax, (dy - bz) / az
        d = np.hypot(x - c['x'], z - c['z'])
        if d < 250 and (best is None or d < best[0]): best = (d, x, z, j)
    if best:
        used.add(best[3])
        towns.append({'id': cid + '_town', 'colony': cid, 'region': isl, 'x': round(best[1], 2), 'z': round(best[2], 2),
                      'name': name(cid + ' Town', cid), 'nation': colony_nation[cid], 'fromPaper': True})
        print('  позиция по бумажной карте:', cid, file=sys.stderr)

# --- значки наций: флажки глобальной карты (32x32, строка = нация, кадр 0) ----
sys.path.insert(0, os.path.dirname(__file__))
from tx2img import load_tx
ic = load_tx(P('Resource', 'Textures', 'Interfaces', 'LE', 'Battle_interface', 'Worldmap', 'icons.tga.tx'))
big = load_tx(P('Resource', 'Textures', 'Interfaces', 'LE', 'nations.tga.tx'))
os.makedirs(os.path.join(MAP, 'img', 'flags'), exist_ok=True)
for k, n in enumerate(['england', 'france', 'spain', 'holland', 'pirate']):
    ic.crop((0, k * 32, 32, 32 + k * 32)).save(os.path.join(MAP, 'img', 'flags', n + '.png'))
    big.crop((k * 128, 0, k * 128 + 128, 128)).save(os.path.join(MAP, 'img', 'flags', n + '_big.png'))

data = {
    'calib': {'w': W, 'ax': ax / W, 'bx': bx / W, 'az': az / W, 'bz': bz / W},  # доли ширины картинки
    'coords': {'lonStart': 60, 'lonEnd': 85, 'latStart': 10, 'latEnd': 25, 'shift': 1024, 'scale': 2048},
    'islands': sorted(islands.values(), key=lambda i: i['name']['ru']),
    'regions': regions, 'towns': towns, 'shores': shores, 'maps': maps,
}
with open(os.path.join(MAP, 'data.js'), 'w', encoding='utf-8') as f:
    f.write('// Сгенерировано _build/build.py из файлов игры. Не править руками.\nconst MAPDATA = ')
    json.dump(data, f, ensure_ascii=False, indent=1)
    f.write(';\n')
print(f"islands {len(islands)}, regions {len(regions)}, towns {len(towns)}, shores {len(shores)}, maps {len(maps)}", file=sys.stderr)
