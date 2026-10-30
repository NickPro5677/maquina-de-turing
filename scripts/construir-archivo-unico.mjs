/**
 * Construye dist/maquina-turing.html: UN solo archivo con todo dentro (HTML, CSS, JS y Three.js).
 * Se puede abrir con doble clic o desde el teléfono (file://), sin internet y sin servidor.
 *
 * Uso: npm run build   (necesita esbuild: npm install)
 */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => readFile(join(raiz, r), 'utf8');

// 1. Todo el JavaScript (app + motor + Three.js) en un solo bloque clásico (IIFE): sin módulos ni CORS.
const js = await build({
  entryPoints: [join(raiz, 'src/app.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['es2020'],
  write: false,
  legalComments: 'inline',
});
const codigo = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// 2. CSS y el ícono como texto dentro del HTML.
const css = await leer('css/estilos.css');
const icono = `data:image/svg+xml;base64,${Buffer.from(await leer('icons/icono.svg')).toString('base64')}`;

let html = await leer('index.html');
const reemplazar = (buscar, poner) => {
  if (!html.includes(buscar)) throw new Error(`No se encontró en index.html: ${buscar}`);
  html = html.replace(buscar, () => poner);
};
reemplazar('<link rel="stylesheet" href="css/estilos.css">', `<style>\n${css}\n</style>`);
reemplazar('<link rel="icon" href="icons/icono.svg" type="image/svg+xml">', `<link rel="icon" href="${icono}" type="image/svg+xml">`);
reemplazar('<link rel="apple-touch-icon" href="icons/icono-192.png">\n', '');
reemplazar('<link rel="manifest" href="manifest.webmanifest">\n', '');
reemplazar('<script type="module" src="src/app.js"></script>', `<script>window.ARCHIVO_UNICO = true;</script>\n<script>\n${codigo}\n</script>`);

await mkdir(join(raiz, 'dist'), { recursive: true });
await writeFile(join(raiz, 'dist/maquina-turing.html'), html);
console.log(`dist/maquina-turing.html listo (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
