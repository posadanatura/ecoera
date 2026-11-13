// Builds the deployable site into dist/.
// index.html is the single source. For every view listed in its
// <script id="ee-pages"> block, this writes a copy with that view's
// title, description and canonical address, so /science, /species and
// the rest are real pages Google can index. It also writes sitemap.xml.
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'dist';
const ORIGIN = 'https://www.ecoera.org';
const COPY = [
  'support.js', 'eco-era-logo.svg', 'yoga-mud4l3vg-03w2.webp', 'assets',
  'favicon.svg', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png',
  'robots.txt', '404.html', 'privacy.html',
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const f of COPY) fs.cpSync(f, path.join(OUT, f), { recursive: true });

const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script type="application\/json" id="ee-pages">([\s\S]*?)<\/script>/);
if (!m) throw new Error('index.html is missing the ee-pages block');
const pages = JSON.parse(m[1]);

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function withHead(src, p) {
  const url = ORIGIN + p.path;
  const swaps = [
    [/<title>[^<]*<\/title>/, `<title>${attr(p.title)}</title>`],
    [/(<meta name="description" content=")[^"]*(")/, `$1${attr(p.desc)}$2`],
    [/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`],
    [/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`],
    [/(<meta property="og:title" content=")[^"]*(")/, `$1${attr(p.title)}$2`],
    [/(<meta property="og:description" content=")[^"]*(")/, `$1${attr(p.desc)}$2`],
    [/(<meta name="twitter:title" content=")[^"]*(")/, `$1${attr(p.title)}$2`],
    [/(<meta name="twitter:description" content=")[^"]*(")/, `$1${attr(p.desc)}$2`],
  ];
  let out = src;
  for (const [re, to] of swaps) {
    if (!re.test(out)) throw new Error(`head tag not found: ${re}`);
    out = out.replace(re, to);
  }
  return out;
}

// Photos: serve the WebP copy of a JPG wherever one exists next to it in assets/.
// Absolute addresses (share images, structured data) keep the JPG.
const webp = (src) => src.replace(/(^|[^\w/.-])(assets\/[\w./-]+?)\.jpg\b/g,
  (all, pre, base) => (fs.existsSync(base + '.webp') ? pre + base + '.webp' : all));

// Every page file carries the template for all seven views. Photos that load
// straight away in another view's section would download on every page, so on
// each page those become lazy; the page's own photos are left as they are.
const VIEW = { home: 'isHome', species: 'isSpecies', science: 'isScience', posada: 'isPosada', about: 'isAbout', support: 'isSupport', funders: 'isFunders' };
function viewRanges(src) {
  const out = [], open = /<sc-if value="\{\{ (is[A-Za-z]+) \}\}"[^>]*>/g;
  let m;
  while ((m = open.exec(src))) {
    if (!Object.values(VIEW).includes(m[1])) continue;
    const tag = /<sc-if\b|<\/sc-if>/g; tag.lastIndex = open.lastIndex;
    let depth = 1, t;
    while ((t = tag.exec(src))) { depth += t[0] === '</sc-if>' ? -1 : 1; if (!depth) break; }
    if (!t) throw new Error('unclosed view block ' + m[1]);
    out.push({ flag: m[1], start: m.index, end: t.index });
    open.lastIndex = t.index;
  }
  return out;
}
function forPage(src, id) {
  const ranges = viewRanges(src), mine = VIEW[id];
  if (ranges.length !== Object.keys(VIEW).length) throw new Error('expected one block per view, found ' + ranges.length);
  let hero = null;
  const out = src.replace(/<img\b[^>]*>/g, (tag, at) => {
    const r = ranges.find((x) => at > x.start && at < x.end);
    if (!r) return tag;
    if (r.flag === mine) { if (!hero && /fetchpriority="high"/.test(tag)) hero = (tag.match(/ src="([^"]+)"/) || [])[1]; return tag; }
    return /\sloading=/.test(tag) ? tag : tag.replace('<img ', '<img loading="lazy" ');
  });
  // start the page's main photo as soon as the head arrives
  return hero ? out.replace('</head>', `<link rel="preload" as="image" href="/${hero}" fetchpriority="high">\n</head>`) : out;
}

const today = new Date().toISOString().slice(0, 10);
const urls = [];
for (const [id, p] of Object.entries(pages)) {
  const file = p.path === '/' ? 'index.html' : p.path.slice(1) + '.html';
  fs.writeFileSync(path.join(OUT, file), forPage(webp(withHead(html, p)), id));
  urls.push(`  <url><loc>${ORIGIN}${p.path}</loc><lastmod>${today}</lastmod></url>`);
  console.log(`${id.padEnd(8)} ${p.path.padEnd(15)} -> ${file}`);
}
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`sitemap.xml: ${urls.length} pages`);
