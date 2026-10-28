# Конвертер игровых текстур .tga.tx в PNG/JPG.
# Заголовок 24 байта: flags, width, height, mips, format(fourcc или D3DFMT), size первого мипа.
#   python -I tx2img.py <папка .tx> <папка вывода>    — все карты папки (JPG, прозрачные — PNG)
#   python -I tx2img.py <файл.tga.tx> <файл.png>      — один файл
import struct, sys, io, os
import numpy as np
from PIL import Image

def load_tx(path):
    b = open(path, 'rb').read()
    _, w, h, mips, fourcc, size = struct.unpack('<IIII4sI', b[:24])
    data = b[24:24 + size]
    fmt = struct.unpack('<I', fourcc)[0]
    if fmt == 21:                                    # D3DFMT_A8R8G8B8
        return Image.frombuffer('RGBA', (w, h), data, 'raw', 'BGRA', 0, 1)
    if fmt == 26:                                    # D3DFMT_A4R4G4B4
        a = np.frombuffer(data, '<u2').reshape(h, w)
        ch = [((a >> s) & 15) * 17 for s in (8, 4, 0, 12)]
        return Image.fromarray(np.dstack(ch).astype('uint8'), 'RGBA')
    # DXT1/3/5 — через DDS-заголовок
    hdr = struct.pack('<4sIIIIIII44xII4s20xI16x', b'DDS ', 124, 0x1007 | 0x80000, h, w, size, 0, 1,
                      32, 0x4, fourcc, 0x1000)
    return Image.open(io.BytesIO(hdr + data)).convert('RGBA')

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    if src.endswith('.tx'):
        load_tx(src).save(dst); sys.exit()
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.endswith('.tga.tx'): continue
        im = load_tx(os.path.join(src, f))
        name = f[:-7]
        if 'boundaries' in name:
            im.save(os.path.join(dst, name + '.png'))
        else:
            im.convert('RGB').save(os.path.join(dst, name + '.jpg'), quality=88)
        print(name, im.size)
