'use strict';
// Интерактивная карта Вест-Индии. Данные — data.js (MAPDATA, из файлов игры), свои метки — extra.js (MAPEXTRA).

const D = MAPDATA, C = D.calib, S = 2048;           // S — размер сцены в px (= ширине очищенной карты)
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- тексты интерфейса ----------
const T = {
  ru: { title: 'Карта Вест-Индии', searchPh: 'Поиск: город, остров, бухта…', filterMap: 'фильтровать карту', groups: 'Слои',
    view: 'Вид', bgClean: 'очищенная карта', bgPaper: 'карта игры с надписями', grid: 'сетка широт и долгот',
    bounds: 'границы акваторий', shoreText: 'подписи бухт при любом масштабе', goto: 'Точка по координатам',
    lat: 'Широта N', lon: 'Долгота W', show: 'Показать',
    coordHint: 'Градусы и минуты через пробел, или «15°28\'», или дробью 15.47. Правый клик по карте — поставить точку.',
    modalHint: 'колесо — масштаб, перетаскивание — сдвиг, Esc — закрыть',
    g_island: 'Острова', g_region: 'Регионы', g_town: 'Поселения', g_lighthouse: 'Маяки', g_shore: 'Места высадки',
    g_hidden: 'Скрытые острова (квестовые)', g_custom: 'Свои метки',
    t_island: 'остров', t_region: 'регион', t_town: 'поселение', t_lighthouse: 'маяк', t_shore: 'место высадки',
    t_custom: 'своя метка', t_pin: 'точка',
    n_england: 'Англия', n_france: 'Франция', n_spain: 'Испания', n_holland: 'Голландия', n_pirate: 'Пираты',
    towns: 'Поселения', lighthouses: 'Маяки', shores: 'Места высадки', regions: 'Части', custom: 'Свои метки',
    maps: 'Карты-предметы', k_common: 'обычная', k_admiral: 'адмиральская', k_region: 'общая',
    where: 'Где', nation: 'нация на начало игры', game: 'игровые', hiddenNote: 'нет на бумажной карте; координаты условные',
    paperNote: 'позиция взята с бумажной карты (на глобальной карте отдельной метки нет)', badCoord: 'Не понял координаты',
    outside: 'вне карты', nothing: 'ничего не найдено', pin: 'Точка' },
  en: { title: 'West Indies Map', searchPh: 'Search: town, island, cove…', filterMap: 'filter the map', groups: 'Layers',
    view: 'View', bgClean: 'clean map', bgPaper: 'game map with labels', grid: 'latitude / longitude grid',
    bounds: 'sea zone boundaries', shoreText: 'cove labels at any zoom', goto: 'Point by coordinates',
    lat: 'Latitude N', lon: 'Longitude W', show: 'Show',
    coordHint: 'Degrees and minutes separated by space, or 15°28\', or decimal 15.47. Right-click the map to drop a point.',
    modalHint: 'wheel — zoom, drag — pan, Esc — close',
    g_island: 'Islands', g_region: 'Regions', g_town: 'Settlements', g_lighthouse: 'Lighthouses', g_shore: 'Landing spots',
    g_hidden: 'Hidden islands (quest)', g_custom: 'Custom marks',
    t_island: 'island', t_region: 'region', t_town: 'settlement', t_lighthouse: 'lighthouse', t_shore: 'landing spot',
    t_custom: 'custom mark', t_pin: 'point',
    n_england: 'England', n_france: 'France', n_spain: 'Spain', n_holland: 'Holland', n_pirate: 'Pirates',
    towns: 'Settlements', lighthouses: 'Lighthouses', shores: 'Landing spots', regions: 'Parts', custom: 'Custom marks',
    maps: 'Map items', k_common: 'common', k_admiral: 'admiral', k_region: 'general',
    where: 'Location', nation: 'nation at game start', game: 'game', hiddenNote: 'not on the paper map; coordinates are approximate',
    paperNote: 'position taken from the paper map (no own label on the world map)', badCoord: 'Cannot parse coordinates',
    outside: 'off the map', nothing: 'nothing found', pin: 'Point' },
};
const NATIONS = ['england', 'france', 'spain', 'holland', 'pirate'];
const GROUPS = [
  { id: 'island', ico: '🏝' }, { id: 'region', ico: '▭' }, { id: 'town', ico: '⚑' },
  { id: 'lighthouse', ico: '♜' }, { id: 'shore', ico: '⚓' }, { id: 'hidden', ico: '?' }, { id: 'custom', ico: '✦' },
];
const ICO = { lighthouse: '♜', shore: '⚓', custom: '✦' };
// где стоит название острова на бумажной карте игры (px сцены) — чтобы не налезать на города
const LABEL_AT = {
  Cuba: [490, 176], Tortuga: [1086, 164], Terks: [1590, 144], Bermudes: [1816, 120], Hispaniola: [1106, 396],
  PuertoRico: [1470, 596], SentMartin: [1896, 596], Caiman: [516, 674], Nevis: [1800, 770], Antigua: [1904, 934],
  Guadeloupe: [1484, 1010], Jamaica: [700, 1122], Dominica: [1800, 1234], Martinique: [1470, 1328],
  Barbados: [1900, 1412], Curacao: [1360, 1612], Trinidad: [1800, 1728],
};

const state = Object.assign({
  lang: 'ru', bg: 'clean', grid: true, bounds: false, shoreText: false, qfilter: true,
  groups: { island: true, region: true, town: true, lighthouse: true, shore: true, hidden: false, custom: true },
  nations: Object.fromEntries(NATIONS.map(n => [n, true])),
}, JSON.parse(localStorage.getItem('clmap') || '{}'));
const save = () => localStorage.setItem('clmap', JSON.stringify(state));
const t = k => T[state.lang][k] ?? k;
const nm = o => (o.name && (o.name[state.lang] || o.name.ru)) || o.id;

// ---------- координаты ----------
// мир (x, z ∈ [-1024..1024]) <-> пиксели сцены (калибровка build.py) <-> широта/долгота (worldmap_coords.c)
const toPx = (x, z) => [(C.ax * x + C.bx) * S, (C.az * z + C.bz) * S];
const fromPx = (px, py) => [(px / S - C.bx) / C.ax, (py / S - C.bz) / C.az];
const K = D.coords;
const toLL = (x, z) => ({ lon: K.lonStart + (K.shift - x) / K.scale * (K.lonEnd - K.lonStart),
                          lat: K.latStart + (K.shift + z) / K.scale * (K.latEnd - K.latStart) });
const fromLL = (lat, lon) => [K.shift - (lon - K.lonStart) / (K.lonEnd - K.lonStart) * K.scale,
                              (lat - K.latStart) / (K.latEnd - K.latStart) * K.scale - K.shift];
const dm = v => { const d = Math.floor(v + 1e-9); return `${d}°${String(Math.floor((v - d) * 60 + 1e-6)).padStart(2, '0')}'`; };
const fmtLL = (x, z) => { const { lat, lon } = toLL(x, z); return `N ${dm(lat)}  W ${dm(lon)}`; };
function parseAngle(s) {
  s = String(s).trim().replace(',', '.').replace(/[NSWEСЮЗВnswe]/g, ' ');
  const n = s.match(/\d+(\.\d+)?/g); if (!n) return NaN;
  if (n.length === 1) return +n[0];
  return +n[0] + (+n[1] || 0) / 60 + (+n[2] || 0) / 3600;
}

// ---------- модель: острова как объекты с вложенными сущностями ----------
const W = { all: [], byId: {}, islands: {}, regions: {} };
function add(e) { W.all.push(e); W.byId[e.type + ':' + e.id] = e; return e; }
for (const i of D.islands) W.islands[i.id] = add({ ...i, type: 'island', group: i.hidden ? 'hidden' : 'island',
  regionsList: [], towns: [], lighthouses: [], shores: [], custom: [], maps: [] });
for (const r of D.regions) {
  const e = add({ ...r, type: 'region', group: r.hidden ? 'hidden' : 'region', towns: [], lighthouses: [], shores: [], custom: [], maps: [] });
  W.regions[r.id] = e;
  e.isl = r.island ? W.islands[r.island] : null;
  if (e.isl) e.isl.regionsList.push(e);
  // одиночный остров = один регион: отдельную подпись региона не рисуем
  e.noLabel = e.isl && e.isl.regions.length === 1;
}
for (const s of [...D.towns.map(x => ({ ...x, type: 'town', group: 'town' })),
                 ...D.shores.map(x => ({ ...x, type: x.kind, group: x.hidden ? 'hidden' : x.kind }))]) {
  const e = add(s);
  e.reg = W.regions[s.region]; e.isl = e.reg && e.reg.isl;
  const key = { town: 'towns', lighthouse: 'lighthouses', shore: 'shores' }[e.type];
  e.reg && e.reg[key].push(e); e.isl && e.isl[key].push(e);
}
for (const m of D.maps) {
  const tgt = W.islands[m.area] || W.regions[m.area];
  if (tgt) { tgt.maps.push(m); if (tgt.type === 'region' && tgt.isl) tgt.isl.maps.push(m); }
}
(typeof MAPEXTRA !== 'undefined' ? MAPEXTRA : []).forEach((c, k) => {
  let x = c.x, z = c.z; if (c.lat != null) [x, z] = fromLL(c.lat, c.lon);
  const e = add({ ...c, id: c.id || 'custom' + k, x, z, type: 'custom', group: 'custom',
    name: typeof c.name === 'string' ? { ru: c.name } : c.name });
  e.reg = W.regions[c.region] || null; e.isl = W.islands[c.island] || (e.reg && e.reg.isl) || null;
  (e.reg || e.isl) && (e.reg || e.isl).custom.push(e); e.reg && e.isl && e.isl.custom.push(e);
});
const parentOf = e => e.type === 'island' ? null : e.type === 'region' ? e.isl : (e.reg || e.isl);
const where = e => { const p = parentOf(e); if (!p) return ''; const i = p.type === 'region' && p.isl ? p.isl : p;
  return p !== i && p.isl && p.isl.regions.length > 1 ? `${nm(i)}, ${nm(p)}` : nm(i); };

// ---------- маркеры ----------
const marks = $('#marks');
const flag = n => `img/flags/${n}.png`;
for (const e of W.all) {
  const [px, py] = e.type === 'island' && LABEL_AT[e.id] || toPx(e.x, e.z);
  if (e.type === 'region' && e.isl) e.part = true;      // часть острова (Западная Куба…) — подпись только вблизи
  const m = el('div', `mk ${e.type} ${e.part ? 'part' : ''}${e.group === 'hidden' ? 'hidden' : ''} ${e.type === 'lighthouse' || e.type === 'shore' || e.type === 'custom' ? 'pt' : ''} ${e.fromPaper ? 'fromPaper' : ''}`);
  m.style.left = px + 'px'; m.style.top = py + 'px';
  const inn = el('div', 'in');
  if (e.type === 'town') {
    inn.append(el('div', 'dot'));
    if (e.nation) { const f = el('img', 'flag'); f.src = flag(e.nation); inn.append(f); }
  } else if (ICO[e.type]) inn.append(el('div', 'ico', ICO[e.type]));
  const lbl = el('div', 'lbl'); inn.append(lbl); m.append(inn);
  m.addEventListener('click', ev => { ev.stopPropagation(); select(e); });
  m.addEventListener('pointerdown', ev => ev.stopPropagation());
  e.mk = m; e.lbl = lbl; marks.append(m);
}

// ---------- сетка ----------
function drawGrid() {
  const g = $('#grid'); let h = '';
  for (let lon = K.lonStart; lon <= K.lonEnd; lon++) {
    const [px] = toPx(fromLL(K.latStart, lon)[0], 0);
    h += `<line x1="${px}" y1="0" x2="${px}" y2="${S}"/>`;
    if (lon > K.lonStart && lon < K.lonEnd) h += `<text x="${px + 4}" y="${S - 8}">${lon}°</text>`;
  }
  for (let lat = K.latStart; lat <= K.latEnd; lat++) {
    const [, py] = toPx(0, fromLL(lat, K.lonStart)[1]);
    h += `<line x1="0" y1="${py}" x2="${S}" y2="${py}"/>`;
    if (lat > K.latStart && lat < K.latEnd) h += `<text x="6" y="${py - 5}">${lat}°</text>`;
  }
  g.innerHTML = h;
}

// ---------- пан/зум (общий для карты и окна просмотра) ----------
function panzoom(view, stage, w, h, onChange) {
  const z = { s: 1, x: 0, y: 0, min: .1, max: 8 };
  const apply = () => { stage.style.transform = `translate(${z.x}px,${z.y}px) scale(${z.s})`; onChange && onChange(z); };
  z.fit = () => { const r = view.getBoundingClientRect(); z.s = Math.min(r.width / w(), r.height / h());
    z.min = z.s * .5; z.x = (r.width - w() * z.s) / 2; z.y = (r.height - h() * z.s) / 2; apply(); };
  z.zoomAt = (k, cx, cy) => { const ns = Math.max(z.min, Math.min(z.max, z.s * k)); k = ns / z.s;
    z.x = cx - (cx - z.x) * k; z.y = cy - (cy - z.y) * k; z.s = ns; apply(); };
  z.center = (px, py, s) => { const r = view.getBoundingClientRect(); if (s) z.s = Math.max(z.s, s);
    z.x = r.width / 2 - px * z.s; z.y = r.height / 2 - py * z.s; apply(); };
  z.toStage = (cx, cy) => [(cx - z.x) / z.s, (cy - z.y) / z.s];
  view.addEventListener('wheel', ev => { ev.preventDefault(); const r = view.getBoundingClientRect();
    z.zoomAt(Math.exp(-ev.deltaY * (ev.deltaMode ? 0.05 : 0.0015)), ev.clientX - r.left, ev.clientY - r.top); }, { passive: false });
  const ptrs = new Map(); let last = null, pinch = null;
  view.addEventListener('pointerdown', ev => { if (ev.button > 0) return; view.setPointerCapture(ev.pointerId);
    ptrs.set(ev.pointerId, [ev.clientX, ev.clientY]); last = [ev.clientX, ev.clientY]; view.classList.add('drag'); });
  view.addEventListener('pointermove', ev => {
    if (!ptrs.has(ev.pointerId)) return; ptrs.set(ev.pointerId, [ev.clientX, ev.clientY]);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const r = view.getBoundingClientRect();
      if (pinch) z.zoomAt(d / pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); pinch = d; return; }
    z.x += ev.clientX - last[0]; z.y += ev.clientY - last[1]; last = [ev.clientX, ev.clientY]; apply(); });
  const up = ev => { ptrs.delete(ev.pointerId); pinch = null; if (!ptrs.size) view.classList.remove('drag');
    else last = [...ptrs.values()][0]; };
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
  return z;
}

const view = $('#view');
const Z = panzoom(view, $('#stage'), () => S, () => S, z => {
  document.documentElement.style.setProperty('--inv', (1 / z.s).toFixed(4));
  view.classList.toggle('near', z.s >= Z0() * 2.2);
});
let fitScale = 1; const Z0 = () => fitScale;
$('#zIn').onclick = () => { const r = view.getBoundingClientRect(); Z.zoomAt(1.5, r.width / 2, r.height / 2); };
$('#zOut').onclick = () => { const r = view.getBoundingClientRect(); Z.zoomAt(1 / 1.5, r.width / 2, r.height / 2); };
$('#zFit').onclick = () => { Z.fit(); fitScale = Z.s; };
addEventListener('resize', () => {           // сохраняем масштаб относительно «вписать» и точку в центре
  const r = view.getBoundingClientRect(), k = Z.s / fitScale, c = Z.toStage(r.width / 2, r.height / 2);
  Z.fit(); fitScale = Z.s; if (k > 1.01) Z.center(c[0], c[1], fitScale * k);
});

// статус: координаты под курсором
const status = $('#status');
view.addEventListener('pointermove', ev => {
  const r = view.getBoundingClientRect(); const [px, py] = Z.toStage(ev.clientX - r.left, ev.clientY - r.top);
  const [x, z] = fromPx(px, py);
  status.textContent = Math.abs(x) > 1024 || Math.abs(z) > 1024 ? t('outside')
    : `${fmtLL(x, z)}   ·   ${t('game')} x ${x.toFixed(0)}, z ${z.toFixed(0)}`;
});
view.addEventListener('contextmenu', ev => { ev.preventDefault(); const r = view.getBoundingClientRect();
  const [x, z] = fromPx(...Z.toStage(ev.clientX - r.left, ev.clientY - r.top)); setPin(x, z, false); });

// ---------- точка по координатам ----------
let pin = null;
function setPin(x, z, center = true) {
  if (!pin) { pin = { id: 'pin', type: 'pin', name: null };
    pin.mk = el('div', 'mk pin'); const inn = el('div', 'in'); inn.append(el('div', 'ico', '📍'));
    pin.lbl = el('div', 'lbl'); inn.append(pin.lbl); pin.mk.append(inn); marks.append(pin.mk);
    pin.lbl.addEventListener('click', ev => { ev.stopPropagation(); pin.mk.classList.add('hide'); }); }
  pin.x = x; pin.z = z; const [px, py] = toPx(x, z);
  pin.mk.style.left = px + 'px'; pin.mk.style.top = py + 'px'; pin.mk.classList.remove('hide');
  const near = nearest(x, z);
  pin.lbl.innerHTML = `${esc(fmtLL(x, z))}${near ? `<br><small>≈ ${esc(nm(near))} (${esc(t('t_' + near.type))})</small>` : ''}`;
  pin.lbl.title = '✕';
  if (center) Z.center(px, py, fitScale * 2);
  const ll = toLL(x, z); history.replaceState(null, '', `#ll=${ll.lat.toFixed(4)},${ll.lon.toFixed(4)}`);
}
function nearest(x, z) {
  let best = null;
  for (const e of W.all) { if (e.type === 'island' && e.regions.length > 1) continue;
    const d = Math.hypot(e.x - x, e.z - z); if (!best || d < best.d) best = { ...e, d }; }
  return best;
}
$('#goCoord').onclick = () => {
  const lat = parseAngle($('#inLat').value), lon = parseAngle($('#inLon').value);
  if (!(lat >= 0) || !(lon >= 0)) { alert(t('badCoord')); return; }
  setPin(...fromLL(lat, lon));
};
for (const i of ['#inLat', '#inLon']) $(i).addEventListener('keydown', ev => ev.key === 'Enter' && $('#goCoord').click());

// ---------- поиск/фильтр ----------
const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[-‑'’`]/g, ' ').replace(/\s+/g, ' ').trim();
let query = '';
function matches(e, q) {
  if (!q) return true;
  const n = e.name || {};
  return [n.ru, n.en, e.id, e.note].some(v => norm(v).includes(q));
}
function visibleByFilter(e) {
  if (!query || !state.qfilter) return true;
  if (matches(e, query)) return true;
  // найден остров/регион — показываем и его содержимое
  for (let p = parentOf(e); p; p = parentOf(p)) if (matches(p, query)) return true;
  return false;
}

// ---------- отрисовка состояния ----------
function refresh() {
  for (const e of W.all) {
    let on = state.groups[e.group];
    if (e.type === 'town' && e.nation && !state.nations[e.nation]) on = false;
    if (e.noLabel) on = false;
    on = on && visibleByFilter(e);
    if (e === sel || (pin && e === pin)) on = true;
    e.mk.classList.toggle('hide', !on);
    e.mk.classList.toggle('hit', !!query && matches(e, query));
    e.lbl.textContent = nm(e) + (e.group === 'hidden' && e.type !== 'shore' ? ' ?' : '');
  }
  $('#bgClean').hidden = state.bg !== 'clean';
  const bp = $('#bgPaper'); bp.hidden = state.bg !== 'paper';
  if (state.bg === 'paper') bp.src = `img/${state.lang}/map_good.jpg`;
  $('#grid').style.display = state.grid ? '' : 'none';
  $('#bounds').hidden = !state.bounds;
  view.classList.toggle('shoretext', state.shoreText);
  renderResults();
  if (sel) renderInfo(sel);
  save();
}

function renderResults() {
  const ul = $('#results'); ul.innerHTML = '';
  if (!query) return;
  const hits = W.all.filter(e => matches(e, query) && !e.noLabel)
    .sort((a, b) => (norm(nm(a)).startsWith(query) ? 0 : 1) - (norm(nm(b)).startsWith(query) ? 0 : 1) || nm(a).localeCompare(nm(b)));
  if (!hits.length) { ul.append(el('li', 'sub', t('nothing'))); return; }
  for (const e of hits.slice(0, 80)) ul.append(itemLi(e, true));
}
function itemLi(e, withWhere) {
  const li = el('li');
  const ico = e.type === 'town' && e.nation ? `<img src="${flag(e.nation)}" width="16" height="16">`
    : `<span class="grp-ico">${GROUPS.find(g => g.id === (e.type === 'island' || e.type === 'region' ? e.type : e.group))?.ico || ''}</span>`;
  li.innerHTML = `${ico}<span>${esc(nm(e))}</span><span class="sub">${esc(withWhere ? (where(e) || t('t_' + e.type)) : t('t_' + e.type))}</span>`;
  li.onclick = () => select(e, true);
  li.onmouseenter = () => e.mk.classList.add('hl'); li.onmouseleave = () => e.mk.classList.remove('hl');
  return li;
}

// ---------- карточка выбранного объекта ----------
let sel = null;
function select(e, center) {
  if (sel) { sel.mk.classList.remove('sel'); hlChildren(sel, false); }
  sel = e; e.mk.classList.add('sel'); hlChildren(e, true);
  renderInfo(e); refresh();
  history.replaceState(null, '', '#sel=' + e.type + ':' + e.id);
  if (center) { const [px, py] = toPx(e.x, e.z); Z.center(px, py, fitScale * (e.type === 'island' || e.type === 'region' ? 2.2 : 3)); }
}
function hlChildren(e, on) {
  for (const k of ['towns', 'lighthouses', 'shores', 'custom']) (e[k] || []).forEach(c => c.mk.classList.toggle('hl', on));
}
function renderInfo(e) {
  const box = $('#info'); box.hidden = false;
  const parent = parentOf(e);
  let h = `<button class="close" title="✕">✕</button><h3>${e.type === 'town' && e.nation ? `<img src="img/flags/${e.nation}_big.png">` : ''}${esc(nm(e))}</h3>`;
  const other = state.lang === 'ru' ? e.name?.en : e.name?.ru;
  h += `<div class="meta">${esc(t('t_' + e.type))}${other && other !== nm(e) ? ' · ' + esc(other) : ''} · <code>${esc(e.id)}</code><br>`;
  h += `${esc(fmtLL(e.x, e.z))} · ${t('game')} x ${Math.round(e.x)}, z ${Math.round(e.z)}`;
  if (e.type === 'town' && e.nation) h += `<br>${esc(t('n_' + e.nation))} — ${esc(t('nation'))}`;
  if (e.group === 'hidden') h += `<br><i>${esc(t('hiddenNote'))}</i>`;
  if (e.fromPaper) h += `<br><i>${esc(t('paperNote'))}</i>`;
  if (e.note) h += `<br>${esc(e.note)}`;
  h += `</div>`;
  box.innerHTML = h;
  box.querySelector('.close').onclick = () => { e.mk.classList.remove('sel'); hlChildren(e, false); sel = null; box.hidden = true; refresh(); };
  const list = (title, arr) => { if (!arr || !arr.length) return; box.append(el('h4', null, esc(title)));
    const ul = el('ul', 'ilist'); arr.forEach(c => ul.append(itemLi(c, false))); box.append(ul); };
  list(t('where'), [...new Set([e.isl, parent])].filter(x => x && x !== e && !x.noLabel));
  if (e.type === 'island' && e.regionsList.length > 1) list(t('regions'), e.regionsList);
  list(t('towns'), e.towns); list(t('lighthouses'), e.lighthouses); list(t('shores'), e.shores); list(t('custom'), e.custom);
  const maps = e.maps || (parent && parent.maps) || [];
  if (maps.length) {
    box.append(el('h4', null, esc(t('maps'))));
    const th = el('div', 'thumbs');
    for (const m of maps) {
      const file = m.files[state.lang] || m.files.ru, title = (m.name[state.lang] || m.name.ru || m.item);
      const f = el('figure', null, `<img loading="lazy" src="img/${state.lang}/${esc(file)}"><figcaption>${esc(title)} · ${esc(t('k_' + m.kind))}</figcaption>`);
      f.onclick = () => openMap(`img/${state.lang}/${file}`, title);
      th.append(f);
    }
    box.append(th);
  }
}

// ---------- окно просмотра карты острова ----------
const modal = $('#modal'), mImg = $('#mImg');
const MZ = panzoom($('#mView'), mImg, () => mImg.naturalWidth || 1024, () => mImg.naturalHeight || 1024);
function openMap(src, title) { $('#mTitle').textContent = title; modal.hidden = false; mImg.onload = () => MZ.fit(); mImg.src = src;
  if (mImg.complete) MZ.fit(); }
$('#mClose').onclick = () => modal.hidden = true;
addEventListener('keydown', ev => { if (ev.key === 'Escape') { if (!modal.hidden) modal.hidden = true; else if ($('#q').value) { $('#q').value = ''; $('#q').dispatchEvent(new Event('input')); } } });

// ---------- панель ----------
function buildPanel() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-t]').forEach(n => n.textContent = t(n.dataset.t));
  document.querySelectorAll('[data-tp]').forEach(n => n.placeholder = t(n.dataset.tp));
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === state.lang));
  document.title = t('title') + ' — Caribbean Legend';
  const g = $('#groups'); g.innerHTML = '';
  for (const gr of GROUPS) {
    const n = W.all.filter(e => e.group === gr.id && !e.noLabel).length; if (!n && gr.id === 'custom') continue;
    const l = el('label', 'chk', `<input type="checkbox" ${state.groups[gr.id] ? 'checked' : ''}><span class="grp-ico">${gr.ico}</span><span>${esc(t('g_' + gr.id))}</span><span class="cnt">${n}</span>`);
    l.querySelector('input').onchange = ev => { state.groups[gr.id] = ev.target.checked; refresh(); };
    g.append(l);
    if (gr.id === 'town') {
      const nb = el('div', 'nations'); g.append(nb);
      for (const nat of NATIONS) {
        const c = W.all.filter(e => e.type === 'town' && e.nation === nat).length;
        const l2 = el('label', 'chk', `<input type="checkbox" ${state.nations[nat] ? 'checked' : ''}><img src="${flag(nat)}" title="${esc(t('n_' + nat))}"><span>${esc(t('n_' + nat))}</span><span class="cnt">${c}</span>`);
        l2.querySelector('input').onchange = ev => { state.nations[nat] = ev.target.checked; refresh(); };
        nb.append(l2);
      }
    }
  }
  document.querySelectorAll('input[name=bg]').forEach(r => { r.checked = r.value === state.bg; r.onchange = () => { state.bg = r.value; refresh(); }; });
  const bind = (id, key) => { const c = $(id); c.checked = state[key]; c.onchange = () => { state[key] = c.checked; refresh(); }; };
  bind('#lyGrid', 'grid'); bind('#lyBounds', 'bounds'); bind('#lyShoreText', 'shoreText'); bind('#qfilter', 'qfilter');
}
document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { state.lang = b.dataset.lang; buildPanel(); refresh(); });
$('#q').addEventListener('input', ev => { query = norm(ev.target.value); refresh(); });

drawGrid(); buildPanel(); refresh();
Z.fit(); fitScale = Z.s;

// адрес страницы: #sel=island:Jamaica | #ll=15.4667,63.4667 | #q=текст
const H = new URLSearchParams(decodeURIComponent(location.hash.slice(1)));
if (H.get('q')) { $('#q').value = H.get('q'); query = norm(H.get('q')); refresh(); }
if (H.get('sel') && W.byId[H.get('sel')]) select(W.byId[H.get('sel')], true);
if (H.get('ll')) { const [la, lo] = H.get('ll').split(',').map(Number); if (la >= 0 && lo >= 0) setPin(...fromLL(la, lo)); }
