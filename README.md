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

## Analytics

Google Analytics 4 is set up in the `<head>` of `index.html`. Put the web stream's Measurement
ID in `window.EE_GA_ID` to switch it on (empty = off). It records page views and a
`donation_checkout` event (type, amount, sponsorship tier) for every Stripe donation link
(named differently from posadanatura.org's `donate_click`, so one donor isn't counted twice).
Visits that cross between posadanatura.org and ecoera.org stay one visit. If a
donation link changes, update the link list in that script too.

The Google Ad Grant campaign "Eco Era - Year-End Giving" (run from the Posada Natura
marketing chat) sends visitors to /support and /funders and counts `donation_checkout`
as its conversion. Tell that chat before changing those pages or their addresses, the
Stripe donation links, or the event's name or parameters.

`privacy.html` (www.ecoera.org/privacy, linked in the footer) describes this tracking,
Stripe and the other services the site uses. Update it if any of that changes.

## Links between pages

Menu and button links are real `<a href="/page">` links (so search engines can follow
them) with an `onClick` handler that switches pages without a reload.
