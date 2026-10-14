import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(here, '../../frontend');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const plannedRoutes = [
  ['POST', /^\/api\/algorithms\/binary-search\/runs$/, 'M04'],
  ['GET', /^\/api\/runs\/[^/]+(?:\/steps\/\d+)?$/, 'M04'],
  ['POST', /^\/api\/agent\/explain$/, 'M05'],
  ['GET', /^\/api\/knowledge\/cards$/, 'M06'],
  ['GET', /^\/api\/exercises$/, 'M04+M06'],
  ['POST', /^\/api\/exercises\/check$/, 'M04+M07']
];

function json(response, code, value) {
  response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/health' && request.method === 'GET') {
      return json(response, 200, { ok: true, stage: 'scaffold', implemented: ['static-page', 'health'], modelCallsEnabled: false });
    }
    const planned = plannedRoutes.find(([method, pattern]) => method === request.method && pattern.test(pathname));
    if (planned) {
      request.resume();
      return json(response, 501, { error: { code: 'NOT_IMPLEMENTED', message: '当前仅为协作骨架，业务功能待实现。', owner: planned[2] } });
    }
    if (pathname.startsWith('/api/')) return json(response, 404, { error: { code: 'NOT_FOUND', message: '接口不存在。' } });
    if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '请求方法不支持。' } });
    const file = resolve(frontendRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(frontendRoot + sep)) return json(response, 403, { error: { code: 'FORBIDDEN', message: '路径不允许。' } });
    const type = mime[extname(file)];
    if (!type) return json(response, 404, { error: { code: 'NOT_FOUND', message: '文件不存在。' } });
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code)) return json(response, 404, { error: { code: 'NOT_FOUND', message: '文件不存在。' } });
      throw error;
    }
  } catch {
    json(response, 400, { error: { code: 'INVALID_REQUEST', message: '请求无法处理。' } });
  }
});

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer between 0 and 65535');
server.listen(port, process.env.HOST ?? '127.0.0.1', () => {
  console.log(`Scaffold running at http://${process.env.HOST ?? '127.0.0.1'}:${server.address().port}`);
});
server.on('error', (error) => { console.error(`Server startup failed: ${error.code}`); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
