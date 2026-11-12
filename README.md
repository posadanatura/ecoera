# Eco Era website

www.ecoera.org — hosted on Vercel, which rebuilds the site on every push to `main`.

- `index.html` is the single source for all seven pages (home, wildlife, science,
  visit, about, donate, funders).
- `node build.mjs` writes the deployable site to `dist/`: one HTML file per page with
  its own title, description and canonical address, plus `sitemap.xml`. It also serves
  the WebP copy of each photo and makes sure each page downloads only its own photos
  up front.
- `vercel.json` holds clean addresses and redirects from old addresses.

## Photos

Put photos in `assets/` as JPG, then make the lighter WebP copies:

    python3 tools/make-webp.py

If a WebP copy is missing, the site simply uses the JPG.

In `index.html`, keep `loading="lazy"` before `src` on any new `<img>`; otherwise the
browser downloads the photo immediately instead of when it scrolls into view.

## Links between pages

Menu and button links are real `<a href="/page">` links (so search engines can follow
them) with an `onClick` handler that switches pages without a reload.
