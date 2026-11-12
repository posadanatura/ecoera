"""Make a WebP copy of every JPG photo in assets/ that doesn't have an up-to-date one.

The build (build.mjs) serves assets/<name>.webp in place of assets/<name>.jpg
whenever the WebP file exists, so after adding or replacing a photo run:

    python3 tools/make-webp.py

Quality 80 keeps the photos visually identical to the JPGs at about 20% less
weight. Colour profiles are kept. JPGs stay in place: share previews and the
site editor still use them.
"""
import glob
import os

from PIL import Image, ImageOps

made = 0
for jpg in sorted(glob.glob('assets/**/*.jpg', recursive=True)):
    webp = jpg[:-4] + '.webp'
    if os.path.exists(webp) and os.path.getmtime(webp) >= os.path.getmtime(jpg):
        continue
    im = Image.open(jpg)
    icc = im.info.get('icc_profile')
    im = ImageOps.exif_transpose(im)
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGB')
    kw = {'quality': 80, 'method': 6}
    if icc:
        kw['icc_profile'] = icc
    im.save(webp, 'WEBP', **kw)
    made += 1
    print(f'{jpg} -> {webp}')
print(f'{made} WebP file(s) written')
