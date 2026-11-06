import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateSchema } from './validate-schema.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
validateSchema(html);
await rm(path.join(root, 'dist'), { recursive: true, force: true });
await mkdir(path.join(root, 'dist'), { recursive: true });
for (const item of ['index.html', 'styles.css', 'app.js', 'assets', 'robots.txt']) {
  await cp(path.join(root, item), path.join(root, 'dist', item), { recursive: true });
}
console.log('Farmacia 2: build statica pronta in dist; JSON-LD verificato.');
