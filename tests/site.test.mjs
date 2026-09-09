import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import http from 'node:http';
import { loadContent, createRoutes, discoverLegacyRoutes, plainText, projectRoot, resolveSiteUrl } from '../scripts/build.mjs';
import { startServer } from '../scripts/serve.mjs';

const content = await loadContent();
const legacy = await discoverLegacyRoutes();
const { routes } = createRoutes(content.posts, legacy);
const rootUrl = 'https://site.test/';
const localReferences = (html) => [...html.matchAll(/\b(?:src|href|poster)\s*=\s*(["'])(.*?)\1/gi)].map((match) => match[2].replaceAll('&amp;', '&'));

test('every article has readable HTML and every local reference resolves', async () => {
  const seenAssets = new Set();
  for (const route of routes) {
    const html = await readFile(path.join(projectRoot, route.file), 'utf8');
    assert.match(html, /<!doctype html>/i, route.file);
    assert.match(html, /<html\b[^>]*\blang=["']zh-CN["']/i, route.file);
    assert.match(html, /<meta\b[^>]*\bname=["']viewport["']/i, route.file);
    if (route.post) {
      assert.ok(plainText(html).includes(route.post.title), `Missing title in ${route.file}`);
      const firstParagraph = plainText(route.post.body).slice(0, 60);
      assert.ok(plainText(html).includes(firstParagraph), `Article relies on client rendering: ${route.file}`);
    }
    for (const reference of localReferences(html)) {
      if (!reference || reference.startsWith('#') || /^(?:mailto|tel|data|javascript):/i.test(reference)) continue;
      const url = new URL(reference, new URL(route.file, rootUrl));
      if (url.origin !== new URL(rootUrl).origin) continue;
      const pathname = decodeURIComponent(url.pathname).replace(/^\//, '');
      const file = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
      const fullPath = path.join(projectRoot, file);
      assert.ok((await stat(fullPath).catch(() => null))?.isFile(), `${route.file} has a broken local reference: ${reference}`);
      if (/\.(?:css|js|png|jpe?g|webp|svg|avif)$/i.test(file)) seenAssets.add(file);
    }
  }
  assert.ok(seenAssets.has('css/main.css'), 'The generated site does not load its stylesheet.');
  assert.ok(seenAssets.has('js/main.js'), 'The generated site does not load its interaction script.');
});

test('legacy article and monthly archive URLs lead to existing canonical pages', async () => {
  assert.ok(legacy.posts.length >= 8, 'Original article entries were lost.');
  for (const route of routes.filter((item) => item.redirect)) {
    const html = await readFile(path.join(projectRoot, route.file), 'utf8');
    const destination = html.match(/http-equiv=["']refresh["'][^>]*content=["']0;url=([^"']+)/i)?.[1];
    assert.ok(destination, `Missing redirect: ${route.file}`);
    const url = new URL(destination, new URL(route.file, rootUrl));
    assert.equal(decodeURIComponent(url.pathname), `/${route.redirect}`);
    assert.equal(url.search, '', 'Legacy redirects must not depend on a client-side query reader.');
    assert.ok((await stat(path.join(projectRoot, decodeURIComponent(url.pathname)))).isFile());
  }
});

test('search covers published bodies without executable markup or private source fields', async () => {
  const sandbox = vm.createContext({ window: {} });
  new vm.Script(await readFile(path.join(projectRoot, 'js/search-index.js'), 'utf8')).runInContext(sandbox, { timeout: 1000 });
  const search = JSON.parse(JSON.stringify(sandbox.window.BLOG_SEARCH));
  assert.equal(search.length, content.posts.length);
  assert.equal(new Set(search.map((post) => post.id)).size, content.posts.length);
  for (const post of search) {
    assert.deepEqual(Object.keys(post).sort(), ['id', 'title', 'excerpt', 'category', 'tags', 'date', 'text'].sort());
    assert.ok(post.text.length > post.excerpt.length, `Body missing from search: ${post.id}`);
    assert.doesNotMatch(post.text, /<\/?(?:p|script|div|h[1-6]|blockquote)\b/i);
    assert.equal(post.text, plainText(content.posts.find((entry) => entry.id === post.id).body));
  }
});

test('feed and sitemap contain absolute URLs for all articles', async () => {
  const feed = await readFile(path.join(projectRoot, 'feed.xml'), 'utf8');
  const sitemap = await readFile(path.join(projectRoot, 'sitemap.xml'), 'utf8');
  assert.match(feed, /<rss\b[^>]*version="2\.0"/);
  assert.match(feed, /xmlns:content="http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/"/);
  assert.equal([...feed.matchAll(/<item>/g)].length, content.posts.length);
  assert.equal([...feed.matchAll(/<content:encoded>/g)].length, content.posts.length);
  assert.match(sitemap, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
  for (const post of content.posts) {
    assert.ok(locations.some((url) => url.pathname.endsWith(`/posts/${post.id}/index.html`)), `Missing sitemap article: ${post.id}`);
    assert.match(feed, new RegExp(`/posts/${post.id}/index\\.html`));
  }
  assert.ok(locations.every((url) => ['http:', 'https:'].includes(url.protocol)));
  assert.ok(!locations.some((url) => url.pathname.endsWith('/404.html')));
  const robots = await readFile(path.join(projectRoot, 'robots.txt'), 'utf8');
  assert.doesNotMatch(robots, /Disallow: \/(?:archives|tags|categories)\//);
});

test('content validation rejects collisions, invalid dates, missing images, and empty bodies', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'sllying-validation-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'js'));
  await mkdir(path.join(root, 'images'));
  await writeFile(path.join(root, 'images/cover.png'), 'fixture');
  const post = { id: 'test-post', title: 'A title', excerpt: 'An excerpt', date: '2026-09-08', category: 'Engineering', tags: ['Node'], cover: 'images/cover.png', body: '<p>A readable article.</p>' };
  const save = (posts) => writeFile(path.join(root, 'js/content.js'), `window.BLOG_DATA = ${JSON.stringify({ site: {}, posts })};`);
  await save([post, post]);
  await assert.rejects(loadContent(root), /Duplicate post ID/);
  await save([{ ...post, date: '2026-02-30' }]);
  await assert.rejects(loadContent(root), /not a real date/);
  await save([{ ...post, cover: 'images/missing.png' }]);
  await assert.rejects(loadContent(root), /cover is missing/);
  await save([{ ...post, body: '<p> </p>' }]);
  await assert.rejects(loadContent(root), /no readable content/);
  await save([{ ...post, category: '../private' }]);
  await assert.rejects(loadContent(root), /static URL/);
  assert.equal((await resolveSiteUrl({}, root, 'https://blog.example.test/subdir')).url, 'https://blog.example.test/subdir/');
  await assert.rejects(resolveSiteUrl({}, root, 'file:///private'), /HTTP\(S\)/);
});

function request(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('preview server serves pages, handles HEAD and 404, and keeps source paths private', async (t) => {
  const preview = await startServer({ port: 0 });
  t.after(() => preview.close());
  const homepage = await request(preview.url);
  assert.equal(homepage.status, 200);
  assert.match(homepage.headers['content-type'], /text\/html/);
  const head = await request(preview.url, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.equal(head.headers['content-length'], homepage.headers['content-length']);
  assert.match((await request(`${preview.url}js/search-index.js`)).headers['content-type'], /javascript/);
  assert.equal((await request(`${preview.url}archives`)).status, 308);
  for (const pathname of ['.git/config', 'scripts/build.mjs', 'tests/site.test.mjs', 'README.md', 'images/README.md', 'private/chat.json', 'missing/', '%2e%2e%5c.git/config']) {
    assert.equal((await request(`${preview.url}${pathname}`)).status, 404, `Exposed path: ${pathname}`);
  }
  assert.equal((await request(`${preview.url}%ZZ`)).status, 400);
  assert.equal((await request(preview.url, 'POST')).status, 405);
});

test('preview automatically chooses another port when the requested port is busy', async (t) => {
  const first = await startServer({ port: 0 });
  t.after(() => first.close());
  const second = await startServer({ port: first.port });
  t.after(() => second.close());
  assert.ok(second.port > first.port);
  assert.equal((await request(second.url)).status, 200);
});
