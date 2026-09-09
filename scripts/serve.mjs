import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

function publicPath(file) {
  if (file === 'images/SOURCES.md') return true;
  if (['index.html', '404.html', 'feed.xml', 'sitemap.xml', 'robots.txt'].includes(file)) return true;
  if (/^(?:posts|archives|categories|tags|about|\d{4})\//.test(file)) return file.endsWith('/index.html');
  if (/^css\//.test(file)) return /\.(?:css|woff2?)$/i.test(file);
  if (/^js\//.test(file)) return file.endsWith('.js');
  if (/^images\//.test(file)) return /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(file);
  return false;
}

export async function startServer({ root = projectRoot, port = Number(process.env.PORT || 4173), host = '127.0.0.1', maxPortAttempts = 40 } = {}) {
  root = await realpath(root);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer between 0 and 65535.');
  const server = http.createServer(async (request, response) => {
    const send = (status, body, type = 'text/plain; charset=utf-8', headers = {}) => {
      response.writeHead(status, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache', ...headers });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    const notFound = async () => {
      const page = await readFile(path.join(root, '404.html'), 'utf8').catch(() => '404 Not Found');
      const body = page.replace('<head>', '<head><base href="/">');
      send(404, body, 'text/html; charset=utf-8');
    };
    if (!['GET', 'HEAD'].includes(request.method)) return send(405, 'Method Not Allowed', undefined, { Allow: 'GET, HEAD' });
    try {
      const rawPath = request.url.split('?')[0];
      let pathname;
      try { pathname = decodeURIComponent(rawPath); } catch { return send(400, 'Bad Request'); }
      if (!pathname.startsWith('/') || /[\\\u0000-\u001f]/.test(pathname) || pathname.split('/').some((segment) => segment.startsWith('.') || segment.includes(':'))) return await notFound();
      let relative = pathname.replace(/^\/+/, '');
      let absolute = path.resolve(root, relative || '.');
      let info = await stat(absolute).catch(() => null);
      if (info?.isDirectory()) {
        if (!pathname.endsWith('/')) {
          const query = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
          return send(308, '', undefined, { Location: `${rawPath}/${query}` });
        }
        relative = `${relative}index.html`;
        absolute = path.join(absolute, 'index.html');
        info = await stat(absolute).catch(() => null);
      }
      if (!publicPath(relative) || !info?.isFile()) return await notFound();
      const resolved = await realpath(absolute);
      const within = path.relative(root, resolved);
      if (within.startsWith(`..${path.sep}`) || within === '..' || path.isAbsolute(within)) return await notFound();
      send(200, await readFile(resolved), mimeTypes[path.extname(resolved).toLowerCase()] || 'application/octet-stream');
    } catch (error) {
      if (!response.headersSent) send(500, 'Internal Server Error');
      else response.end();
      console.error(`Preview request failed: ${error.code || error.message}`);
    }
  });
  for (let attempt = 0; attempt < maxPortAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const onError = (error) => { server.off('listening', onListening); reject(error); };
        const onListening = () => { server.off('error', onError); resolve(); };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, host);
      });
      const actualPort = server.address().port;
      return { server, port: actualPort, url: `http://${host}:${actualPort}/`, close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) };
    } catch (error) {
      if (error.code !== 'EADDRINUSE' || port === 0 || port === 65535 || attempt === maxPortAttempts - 1) throw error;
      port++;
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { url, server } = await startServer();
    console.log(`SLLYING preview: ${url}`);
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
  } catch (error) {
    console.error(`Preview failed: ${error.message}`);
    process.exitCode = 1;
  }
}
