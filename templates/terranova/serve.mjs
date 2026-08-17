/* Dependency-free static server. ES modules need HTTP — file:// will not work.
   node serve.mjs   →   http://127.0.0.1:8123 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

/* fileURLToPath, not new URL('.', import.meta.url).pathname — .pathname leaves
   spaces percent-encoded, so every request 404s when the folder name has one. */
const ROOT = fileURLToPath(new URL('.', import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = url === '/' ? '/index.html' : url;
    const file = normalize(join(ROOT, rel));

    /* directory-traversal guard */
    if (!file.startsWith(ROOT)) throw new Error('outside root');

    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  }
});

const port = Number(process.env.PORT) || 8123;
server.listen(port, '127.0.0.1', () => {
  console.log(`http://127.0.0.1:${port}`);
});
