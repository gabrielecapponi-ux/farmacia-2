import { copyFile, lstat, mkdir, readFile, realpath, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateSchema } from './validate-schema.mjs';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const dist = path.join(root, 'dist');
const files = [
  'index.html',
  'styles.css',
  'app.js',
  'immersive.css',
  'history.css',
  'history.js',
  'robots.txt',
  'assets/mark.svg',
  'assets/fonts/dm-sans.woff2',
  'assets/fonts/dm-sans-LICENSE.txt',
  'assets/images/interno-mobile.avif',
  'assets/images/interno-mobile.webp',
  'assets/images/ecg-640.webp',
  'assets/images/ecg-960.webp',
  'assets/images/pelle-640.webp',
  'assets/images/pelle-960.webp',
  'assets/images/pressione-640.webp',
  'assets/images/pressione-960.webp',
  'assets/images/cuore-640.webp',
  'assets/images/cuore-960.webp',
  'assets/images/prodotti-640.webp',
  'assets/images/prodotti-960.webp',
  'assets/images/botanica-640.webp',
  'assets/images/botanica-960.webp',
  'assets/images/storia-640.webp',
  'assets/images/storia-960.webp',
  'assets/images/facciata-640.webp',
  'assets/images/facciata-960.webp',
  'assets/motion/entrata-desktop.webp',
  'assets/motion/entrata-mobile.webp',
  'assets/motion/entrata-desktop.mp4',
  'assets/motion/entrata-mobile.mp4',
  'assets/images/ecg-640.avif',
  'assets/images/ecg-960.avif',
  'assets/images/pelle-640.avif',
  'assets/images/pelle-960.avif',
  'assets/images/pressione-640.avif',
  'assets/images/pressione-960.avif',
  'assets/images/cuore-640.avif',
  'assets/images/cuore-960.avif',
  'assets/images/prodotti-640.avif',
  'assets/images/prodotti-960.avif',
  'assets/images/botanica-640.avif',
  'assets/images/botanica-960.avif',
  'assets/images/storia-640.avif',
  'assets/images/storia-960.avif',
  'assets/images/facciata-640.avif',
  'assets/images/facciata-960.avif',
  'assets/motion/entrata-desktop.avif',
  'assets/motion/entrata-mobile.avif',
  'assets/history/1966-640.avif',
  'assets/history/1966-640.webp',
  'assets/history/1966-1200.avif',
  'assets/history/1966-1200.webp',
  'assets/history/1988-640.avif',
  'assets/history/1988-640.webp',
  'assets/history/1988-1200.avif',
  'assets/history/1988-1200.webp',
  'assets/history/1999-640.avif',
  'assets/history/1999-640.webp',
  'assets/history/1999-1200.avif',
  'assets/history/1999-1200.webp',
  'assets/history/2026-640.avif',
  'assets/history/2026-640.webp',
  'assets/history/2026-1200.avif',
  'assets/history/2026-1200.webp',
];

const html = await readFile(path.join(root, 'index.html'), 'utf8');
validateSchema(html);

// Check all inputs before replacing the previous build.
for (const file of files) {
  const source = path.join(root, file);
  if ((await realpath(source)) !== source || !(await lstat(source)).isFile()) {
    throw new Error(`File di build non valido: ${file}`);
  }
}

// Only the generated directory directly under this project may be cleared.
try {
  const existing = await lstat(dist);
  if (!existing.isDirectory() || (await realpath(dist)) !== dist) {
    throw new Error(`Destinazione di build non valida: ${dist}`);
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await rm(dist, { recursive: true, force: true });

for (const file of files) {
  const destination = path.join(dist, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(root, file), destination);
}
console.log(`Farmacia 2: ${files.length} file in dist/. JSON-LD verificato.`);
