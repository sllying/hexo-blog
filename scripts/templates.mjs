const VERSION = '20260908';

export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const icon = (name, className = '') => `<i data-lucide="${name}" class="${className}" aria-hidden="true"></i>`;
const path = (ctx, value) => `${ctx.base || ''}${value}`;
const postPath = (ctx, post) => path(ctx, `posts/${encodeURIComponent(post.id)}/index.html`);
const tagPath = (ctx, tag) => path(ctx, `tags/${encodeURIComponent(tag)}/index.html`);
const categoryPath = (ctx, category) => path(ctx, `categories/${encodeURIComponent(category)}/index.html`);
const categoriesOf = posts => [...new Set(posts.map(post => post.category))];
const tagsOf = posts => [...new Set(posts.flatMap(post => post.tags || []))];
const date = value => String(value).replaceAll('-', '.');
const readingTime = post => Math.max(1, Math.ceil(post.body.replace(/<[^>]*>/g, '').length / 450));

const cover = (ctx, post) => path(ctx, post.cover);

function header(ctx) {
    const links = [['home', 'house', '首页', 'index.html'], ['articles', 'notebook-pen', '文章', 'index.html#articles'], ['archive', 'archive', '归档', 'archives/index.html'], ['about', 'user-round', '关于', 'about/index.html']];
    return `<header class="site-header"><div class="header-inner">
        <a class="brand" href="${path(ctx, 'index.html')}" aria-label="SLLYING 首页"><span class="brand-symbol">${icon('asterisk')}</span><span>SLLYING<span class="brand-period">.</span></span></a>
        <nav class="desktop-nav" aria-label="主导航">${links.map(([id, symbol, label, href]) => `<a href="${path(ctx, href)}"${ctx.page === id ? ' class="active" aria-current="page"' : ''}>${icon(symbol)}${label}</a>`).join('')}</nav>
        <div class="header-actions"><button class="icon-button" data-action="search" title="搜索文章" aria-label="搜索文章">${icon('search')}</button><button class="icon-button" data-action="theme" title="切换明暗主题" aria-label="切换明暗主题">${icon('moon', 'theme-moon')}${icon('sun', 'theme-sun')}</button><button class="icon-button menu-toggle" data-action="menu" title="打开菜单" aria-label="打开菜单" aria-expanded="false" aria-controls="mobile-menu">${icon('menu')}</button></div>
    </div><nav id="mobile-menu" class="mobile-menu" aria-label="移动端导航" hidden>${links.map(([, symbol, label, href]) => `<a href="${path(ctx, href)}">${icon(symbol)}${label}</a>`).join('')}</nav></header>`;
}

function hero(ctx) {
    return `<section class="hero" aria-labelledby="hero-title">
        <picture id="hero-picture"><source media="(max-width: 640px)" srcset="${path(ctx, 'images/touhou-hero-mobile.webp')}"><img class="hero-image" src="${path(ctx, 'images/touhou-hero.webp')}" width="1920" height="1080" alt="魂魄妖梦与开满鲜花的山野，东方 Project 同人插画" fetchpriority="high"></picture>
        <div class="hero-tint"></div>
        <div class="hero-content page-width"><div class="hero-kicker"><span></span> A PERSONAL SPACE FOR CURIOSITY</div><h1 id="hero-title">SLLYING<span>.</span></h1><p>写代码，也收藏幻想。</p><div class="hero-subtitle">一些技术实践，一些二次元，还有一路上的奇思妙想。</div><a class="hero-link" href="#articles">翻开我的笔记 ${icon('arrow-down-right')}</a></div>
        <div class="hero-caption page-width"><a id="hero-credit" href="${path(ctx, 'about/index.html#illustrations')}">${icon('image')}<span>东方 Project · 插画来源</span></a><div class="scene-switch" role="group" aria-label="主视觉题材"><button data-scene="touhou" aria-pressed="true" title="东方 Project 插画"><img src="${path(ctx, 'images/touhou-reimu.webp')}" width="28" height="28" alt="">幻想乡</button><button data-scene="neuro" aria-pressed="false" title="Neuro-sama 与 Evil 插画"><img src="${path(ctx, 'images/neuro-avatar.webp')}" width="28" height="28" alt="">Neuro &amp; Evil</button></div></div>
    </section>`;
}

function sidebar(ctx) {
    const categories = categoriesOf(ctx.posts);
    const tags = tagsOf(ctx.posts);
    return `<aside class="sidebar" aria-label="博客信息">
        <section class="profile"><a class="profile-avatar" href="${path(ctx, 'about/index.html')}"><img src="${path(ctx, 'images/neuro-avatar.webp')}" width="88" height="88" alt="Neuro-sama 头像" loading="lazy"></a><h2>SLLYING<span>.</span></h2><p>在代码与幻想之间，<br>慢慢积累自己的小宇宙。</p><div class="profile-stats"><a href="${path(ctx, 'archives/index.html')}"><strong>${ctx.posts.length}</strong><span>文章</span></a><a href="${path(ctx, 'categories/index.html')}"><strong>${categories.length}</strong><span>分类</span></a><a href="${path(ctx, 'tags/index.html')}"><strong>${tags.length}</strong><span>标签</span></a></div><a class="profile-rss" href="${path(ctx, 'feed.xml')}">${icon('rss')} RSS 订阅 ${icon('arrow-up-right')}</a></section>
        <section class="sidebar-section"><h2>${icon('folder-open')} 随便逛逛</h2><ul class="category-list">${categories.map(category => `<li><a href="${categoryPath(ctx, category)}"><span>${escapeHtml(category)}</span><span>${ctx.posts.filter(post => post.category === category).length}</span></a></li>`).join('')}</ul></section>
        <section class="sidebar-section"><h2>${icon('hash')} 兴趣坐标</h2><div class="tag-cloud">${tags.slice(0, 16).map(tag => `<a href="${tagPath(ctx, tag)}">${escapeHtml(tag)}</a>`).join('')}</div></section>
        <div class="sidebar-note"><span class="note-mark">${icon('sparkles')}</span><p>保持好奇，<br>下一次探索正在路上。</p><span class="mono">HAVE A NICE DAY :)</span></div>
    </aside>`;
}

function postCard(ctx, post, index) {
    return `<article class="post-card" data-category="${escapeHtml(post.category)}" data-post-id="${escapeHtml(post.id)}">
        <a class="post-image" href="${postPath(ctx, post)}" tabindex="-1" aria-hidden="true"><img src="${cover(ctx, post)}" alt="" width="660" height="420" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async"></a>
        <div class="post-summary"><div class="post-eyebrow"><a href="${categoryPath(ctx, post.category)}">${escapeHtml(post.category)}</a>${post.featured ? `<span class="pin-label">${icon('pin')} 置顶</span>` : ''}</div><h3><a href="${postPath(ctx, post)}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt)}</p><div class="post-bottom"><div class="post-meta"><time datetime="${post.date}">${icon('calendar-days')}${date(post.date)}</time><span>${icon('clock-3')}${readingTime(post)} 分钟</span></div><a class="read-arrow" href="${postPath(ctx, post)}" title="阅读：${escapeHtml(post.title)}" aria-label="阅读：${escapeHtml(post.title)}">${icon('arrow-up-right')}</a></div></div>
    </article>`;
}

function home(ctx) {
    const filtered = ctx.posts.filter(post => (!ctx.category || ctx.category === post.category) && (!ctx.tag || post.tags.includes(ctx.tag)));
    const posts = [...filtered].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.date.localeCompare(a.date));
    const isFiltered = Boolean(ctx.category || ctx.tag);
    return `${isFiltered ? `<div class="page-heading page-width"><a class="breadcrumb" href="${path(ctx, 'index.html#articles')}">${icon('arrow-left')} 全部文章</a><p class="eyebrow">${ctx.tag ? 'TAG' : 'CATEGORY'}</p><h1>${escapeHtml(ctx.category || ctx.tag)}</h1><p>${posts.length} 篇文章</p></div>` : hero(ctx)}
        <div class="home-layout page-width" id="articles"><section class="article-feed" aria-labelledby="feed-title"><div class="feed-heading"><div><span class="eyebrow">THE NOTEBOOK</span><h2 id="feed-title">${isFiltered ? '文章列表' : '最近写下的'}<span class="heading-dot">.</span></h2></div><span class="feed-count">${posts.length} 篇记录</span></div>
            <nav class="filter-tabs" aria-label="文章分类"><a href="${path(ctx, 'index.html#articles')}" class="${isFiltered ? '' : 'selected'}" data-filter="all">全部</a>${categoriesOf(ctx.posts).map(category => `<a href="${categoryPath(ctx, category)}" data-filter="${escapeHtml(category)}"${ctx.category === category ? ' class="selected"' : ''}>${escapeHtml(category)}</a>`).join('')}</nav>
            <div class="posts-list" id="posts-list">${posts.map((post, index) => postCard(ctx, post, index)).join('')}</div><p class="empty-state" id="feed-empty" hidden>这里暂时没有文章。</p><nav class="pagination" id="pagination" aria-label="文章分页" hidden></nav>
        </section>${sidebar(ctx)}</div>`;
}

function archive(ctx) {
    const posts = [...ctx.posts].filter(post => !ctx.year || post.date.startsWith(String(ctx.year))).sort((a, b) => b.date.localeCompare(a.date));
    const years = [...new Set(posts.map(post => post.date.slice(0, 4)))];
    return `<div class="page-width interior-layout"><main class="archive-content" id="main-content"><div class="page-heading"><p class="eyebrow">THE ARCHIVE</p><h1>时光归档<span>.</span></h1><p>${posts.length} 篇记录。走过的路，写下的答案。</p></div><div class="archive-timeline">${years.map(year => `<section class="archive-year"><h2>${year}<span>${posts.filter(post => post.date.startsWith(year)).length} 篇</span></h2><div>${posts.filter(post => post.date.startsWith(year)).map(post => `<a class="archive-entry" href="${postPath(ctx, post)}"><time datetime="${post.date}">${post.date.slice(5).replace('-', '.')}</time><span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.category)}</small></span>${icon('arrow-up-right')}</a>`).join('')}</div></section>`).join('')}</div></main>${sidebar(ctx)}</div>`;
}

function taxonomy(ctx) {
    const useTags = ctx.page === 'tags';
    const values = useTags ? tagsOf(ctx.posts) : categoriesOf(ctx.posts);
    return `<div class="page-width interior-layout"><main id="main-content"><div class="page-heading"><p class="eyebrow">${useTags ? 'TAGS' : 'TOPICS'}</p><h1>${useTags ? '兴趣坐标' : '主题分类'}<span>.</span></h1><p>${values.length} 个${useTags ? '标签' : '主题'}，从感兴趣的地方开始。</p></div><div class="topic-index">${values.map((value, index) => `<a href="${useTags ? tagPath(ctx, value) : categoryPath(ctx, value)}"><span class="topic-num">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(value)}</strong><span>${ctx.posts.filter(post => useTags ? post.tags.includes(value) : post.category === value).length} 篇</span>${icon('arrow-up-right')}</a>`).join('')}</div></main>${sidebar(ctx)}</div>`;
}

function about(ctx) {
    return `<main id="main-content" class="about-page"><div class="about-banner"><img src="${path(ctx, 'images/touhou-sakura.webp')}" alt="东方 Project 角色插画" width="1920" height="1080"><div class="page-width"><p class="eyebrow">HELLO, WORLD</p><h1>这里是 SLLYING<span>.</span></h1><p>一个写代码、喜欢二次元的人。</p></div></div><div class="about-body"><section><p class="eyebrow">ABOUT ME</p><h2>把好奇心，留在这里。</h2><p>你好，我是 SLLYING。这里记录我在工程开发、AI 工具和创作过程中的一些探索。喜欢东方 Project，也关注 Neuro-sama 和 Evil。闲下来的时候，常常在技术与二次元之间来回走动。</p><p>写博客是为了把“当时怎么解决的”留给以后的自己。能跑通的代码、踩过的坑、重新想明白的事情，都值得认真记一笔。</p><div class="about-interests">${['Java', 'Unity', 'Live2D', 'Codex', 'Claude Code', '东方 Project', 'Neuro-sama', 'Evil'].map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div></section><section><p class="eyebrow">ON THE NOTEBOOK</p><h2>关于这些文章</h2><p>技术复盘根据实际项目与协作记录整理，保留问题背景、排查过程和工程判断。示例中的账号、令牌、内部地址、个人路径等关键信息已替换；原始对话不会随站点发布。整理示例和历史笔记会在正文中注明。</p><a class="text-link" href="${path(ctx, 'archives/index.html')}">看看全部文章 ${icon('arrow-up-right')}</a></section><section id="illustrations"><p class="eyebrow">ILLUSTRATIONS</p><h2>幻想的另一半</h2><p>页面使用东方 Project、Neuro-sama 与 Evil 的同人插画。东方角色属于上海爱丽丝幻乐团；其他角色与插画的版权归各自权利人所有。原作链接收录于素材清单。</p><a class="text-link" href="${path(ctx, 'images/SOURCES.md')}">插画来源 ${icon('external-link')}</a></section><div class="about-signoff"><span>SLLYING.</span><a href="${path(ctx, 'feed.xml')}">${icon('rss')} 订阅更新</a></div></div></main>`;
}

function article(ctx) {
    const post = ctx.post;
    const headings = [];
    const body = post.body.replace(/<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (_, level, content) => {
        const id = `section-${headings.length + 1}`;
        headings.push({ id, level, text: content.replace(/<[^>]+>/g, '') });
        return `<h${level} id="${id}">${content}</h${level}>`;
    });
    const sorted = [...ctx.posts].sort((a, b) => b.date.localeCompare(a.date));
    const index = sorted.findIndex(item => item.id === post.id);
    const neighbors = [sorted[index - 1], sorted[index + 1]];
    const related = ctx.posts.filter(item => item.id !== post.id && (item.category === post.category || item.tags.some(tag => post.tags.includes(tag)))).slice(0, 2);
    return `<div class="reading-progress" id="reading-progress"></div><main class="article-page page-width" id="main-content"><a class="breadcrumb" href="${path(ctx, 'index.html#articles')}">${icon('arrow-left')} 返回文章</a><div class="reading-layout"><article class="article"><header class="article-header"><a class="eyebrow" href="${categoryPath(ctx, post.category)}">${escapeHtml(post.category)}</a><h1>${escapeHtml(post.title)}</h1><div class="article-meta"><span class="article-author"><img src="${path(ctx, 'images/neuro-avatar.webp')}" width="28" height="28" alt="">SLLYING</span><time datetime="${post.date}">${icon('calendar-days')}${date(post.date)}</time><span>${icon('clock-3')}${readingTime(post)} 分钟</span></div><p class="article-excerpt">${escapeHtml(post.excerpt)}</p><img class="article-cover" src="${cover(ctx, post)}" alt="东方 Project / Neuro-sama 同人插画" width="1200" height="650" fetchpriority="high"></header><details class="mobile-toc"><summary>${icon('list')} 文章目录 ${icon('chevron-down')}</summary><ol>${headings.map(heading => `<li><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join('')}</ol></details><div class="article-body" id="article-body">${body}</div><footer class="article-footer"><div class="article-tags">${post.tags.map(tag => `<a href="${tagPath(ctx, tag)}"># ${escapeHtml(tag)}</a>`).join('')}</div><button class="text-button" data-action="share">${icon('link')} 复制文章链接</button></footer><nav class="post-neighbors" aria-label="相邻文章">${neighbors.map((item, i) => item ? `<a href="${postPath(ctx, item)}"><span>${icon(i === 0 ? 'arrow-left' : 'arrow-right')}${i === 0 ? '上一篇' : '下一篇'}</span><strong>${escapeHtml(item.title)}</strong></a>` : '<span></span>').join('')}</nav>${related.length ? `<section class="related-posts"><h2>再读一篇</h2>${related.map((item, i) => postCard(ctx, item, i)).join('')}</section>` : ''}</article><aside class="toc-sidebar"><div class="toc-inner"><a class="toc-brand" href="${path(ctx, 'index.html')}">${icon('asterisk')} SLLYING.</a><h2>${icon('list')} 这篇笔记</h2><nav aria-label="文章目录"><ol>${headings.map((heading, i) => `<li class="toc-level-${heading.level}"><a href="#${heading.id}"><span>${String(i + 1).padStart(2, '0')}</span>${escapeHtml(heading.text)}</a></li>`).join('')}</ol></nav><div class="toc-status"><span>阅读进度</span><strong id="read-percent">0%</strong></div><a class="toc-top" href="#main-content">${icon('arrow-up')} 回到开头</a></div></aside></div></main>`;
}

function notFound(ctx) {
    return `<main class="not-found page-width" id="main-content"><span class="eyebrow">PAGE NOT FOUND</span><h1>404<span>.</span></h1><h2>这页笔记还没有写下。</h2><a class="button-primary" href="${path(ctx, 'index.html')}">${icon('arrow-left')} 回到首页</a></main>`;
}

function footer(ctx) {
    return `<footer class="site-footer"><div class="page-width footer-inner"><div><a class="footer-brand" href="${path(ctx, 'index.html')}">SLLYING<span>.</span></a><p>写代码，也收藏幻想。</p></div><div class="footer-links"><a href="${path(ctx, 'archives/index.html')}">文章归档</a><a href="${path(ctx, 'about/index.html')}">关于这里</a><a href="${path(ctx, 'feed.xml')}">${icon('rss')} RSS</a></div><p class="copyright">© 2022–2026 SLLYING<br><span>Stay curious. Keep creating.</span></p></div></footer><a class="back-top icon-button" id="back-top" href="#top" aria-label="回到顶部" title="回到顶部">${icon('arrow-up')}</a>`;
}

export function renderPage(input) {
    const ctx = { base: '', posts: [], page: 'home', ...input };
    const names = { archive: '时光归档', about: '关于这里', topics: '主题分类', categories: '主题分类', tags: '兴趣坐标', notFound: '页面未找到', '404': '页面未找到' };
    const title = ctx.post?.title || ctx.category || ctx.tag || names[ctx.page];
    const description = ctx.post?.excerpt || 'SLLYING 的个人博客。记录工程实践、AI 协作、创作工具与二次元日常。';
    const content = ctx.page === 'post' ? article(ctx) : ctx.page === 'archive' ? archive(ctx) : ctx.page === 'about' ? about(ctx) : ['topics', 'categories', 'tags'].includes(ctx.page) ? taxonomy(ctx) : ['notFound', '404'].includes(ctx.page) ? notFound(ctx) : home(ctx);
    const canonical = ctx.file && ctx.site?.url ? new URL(ctx.file, ctx.site.url).href : '';
    const robots = ctx.page === '404' || ctx.page === 'notFound' ? 'noindex,follow' : 'index,follow';
    const socialImage = ctx.post?.cover || 'images/touhou-hero.webp';
    return `<!doctype html>
<html lang="zh-CN" data-theme="light">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f8faf9"><meta name="robots" content="${robots}"><title>${title ? `${escapeHtml(title)} | ` : ''}SLLYING · 写代码，也收藏幻想</title><meta name="description" content="${escapeHtml(description)}"><meta property="og:title" content="${escapeHtml(title || 'SLLYING')}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="${ctx.post ? 'article' : 'website'}"><meta property="og:image" content="${canonical ? new URL(socialImage, ctx.site.url).href : path(ctx, socialImage)}">${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ''}<link rel="icon" href="${path(ctx, 'images/neuro-avatar.webp')}"><link rel="alternate" type="application/rss+xml" title="SLLYING RSS" href="${path(ctx, 'feed.xml')}"><link rel="stylesheet" href="${path(ctx, `css/main.css?v=${VERSION}`)}"><script>try{document.documentElement.dataset.theme=localStorage.getItem('sllying-theme')||'light'}catch{}</script><script defer src="${path(ctx, 'js/lib/lucide.min.js')}"></script><script defer src="${path(ctx, `js/search-index.js?v=${VERSION}`)}"></script><script defer src="${path(ctx, `js/main.js?v=${VERSION}`)}"></script></head>
<body id="top" data-page="${ctx.page}" data-base="${ctx.base}"${ctx.category || ctx.tag ? ' data-filtered="true"' : ''}><a class="skip-link" href="#${ctx.page === 'home' ? 'articles' : 'main-content'}">跳到正文</a>${header(ctx)}${ctx.page === 'home' ? `<main>${content}</main>` : content}${footer(ctx)}
<dialog class="search-dialog" id="search-dialog" aria-labelledby="search-title"><div class="search-heading"><h2 id="search-title">搜索笔记</h2><button class="icon-button" data-action="close-search" aria-label="关闭搜索" title="关闭搜索">${icon('x')}</button></div><label class="search-input">${icon('search')}<input id="search-input" type="search" placeholder="搜索文章、标签、正文…" autocomplete="off" aria-label="搜索文章、标签、正文"></label><div class="search-result-heading" id="search-status">最近的笔记</div><div class="search-results" id="search-results"></div></dialog><div class="toast" id="toast" role="status" hidden></div>
</body></html>`;
}
