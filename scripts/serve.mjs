import http from 'node:http';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createReadStream } from 'node:fs';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)), process.argv[2] || '.');
const port = Number(process.argv[3] || 4421);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.avif': 'image/avif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer(async (request, response) => {
  try {
    const route = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(root, `.${route}`);
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end(); return;
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const { size } = await stat(file);
    const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' };
    const range = request.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match?.[1] ? Number(match[1]) : Math.max(0, size - Number(match?.[2]));
      const end = match?.[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || start < 0 || start >= size || end < start) {
        response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }).end(); return;
      }
      response.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
      if (request.method === 'HEAD') response.end();
      else createReadStream(file, { start, end }).pipe(response);
      return;
    }
    response.writeHead(200, { ...headers, 'Content-Length': size });
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Pagina non trovata');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Farmacia 2: http://127.0.0.1:${port}/ (${root})`));
