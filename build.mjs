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
  'robots.txt', '404.html',
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

const today = new Date().toISOString().slice(0, 10);
const urls = [];
for (const [id, p] of Object.entries(pages)) {
  const file = p.path === '/' ? 'index.html' : p.path.slice(1) + '.html';
  fs.writeFileSync(path.join(OUT, file), withHead(html, p));
  urls.push(`  <url><loc>${ORIGIN}${p.path}</loc><lastmod>${today}</lastmod></url>`);
  console.log(`${id.padEnd(8)} ${p.path.padEnd(15)} -> ${file}`);
}
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`sitemap.xml: ${urls.length} pages`);
