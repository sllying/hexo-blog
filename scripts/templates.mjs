const VERSION = '20261003-generated-gallery';

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

function header(ctx) {
    const links = [['home', '首页', 'index.html'], ['articles', '文章', 'index.html#articles'], ['archive', '归档', 'archives/index.html'], ['tags', '标签', 'tags/index.html'], ['about', '关于', 'about/index.html']];
    return `<header class="site-header"><div class="header-inner">
        <a class="brand" href="${path(ctx, 'index.html')}" aria-label="SLLYING 首页"><img src="${path(ctx, 'images/neuro-chibi-avatar.webp')}" width="28" height="28" alt=""><span>SLLYING<span class="brand-period">.</span></span></a>
        <nav class="desktop-nav" aria-label="主导航">${links.map(([id, label, href]) => `<a href="${path(ctx, href)}"${ctx.page === id ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
        <div class="header-actions"><button class="icon-button" data-action="search" title="搜索文章" aria-label="搜索文章">${icon('search')}</button><button class="icon-button" data-action="theme" title="切换明暗主题" aria-label="切换明暗主题">${icon('moon', 'theme-moon')}${icon('sun', 'theme-sun')}</button><button class="icon-button menu-toggle" data-action="menu" title="打开菜单" aria-label="打开菜单" aria-expanded="false" aria-controls="mobile-menu">${icon('menu')}</button></div>
    </div><nav id="mobile-menu" class="mobile-menu" aria-label="移动端导航" hidden>${links.map(([, label, href]) => `<a href="${path(ctx, href)}">${label}</a>`).join('')}</nav></header>`;
}

function intro(ctx) {
    const covers = [
    {
        "image": "generated/youmu-moonlit-lake.webp",
        "mobile": "generated/youmu-moonlit-lake-mobile.webp",
        "alt": "妖梦 · 月夜湖畔",
        "position": "center 35%",
        "mobilePosition": "center"
    },
    {
        "image": "generated/neuro-evil-midnight-workbench.webp",
        "mobile": "generated/neuro-evil-midnight-workbench-mobile.webp",
        "alt": "Neuro / Evil · 深夜工作台",
        "position": "center 35%",
        "mobilePosition": "center"
    },
    {
        "image": "generated/reimu-marisa-autumn-library.webp",
        "mobile": "generated/reimu-marisa-autumn-library-mobile.webp",
        "alt": "灵梦与魔理沙 · 秋日书屋",
        "position": "center 35%",
        "mobilePosition": "center"
    },
    {
        "image": "generated/neuro-evil-seaside.webp",
        "mobile": "generated/neuro-evil-seaside-mobile.webp",
        "alt": "Neuro / Evil · 海边晚霞",
        "position": "center 35%",
        "mobilePosition": "center"
    },
    {
        "image": "generated/marisa-comet-observatory.webp",
        "mobile": "generated/marisa-comet-observatory-mobile.webp",
        "alt": "魔理沙 · 彗星观测",
        "position": "center 35%",
        "mobilePosition": "center"
    },
    {
        "image": "generated/neuro-evil-chibi-garden.webp",
        "mobile": "generated/neuro-evil-chibi-garden-mobile.webp",
        "alt": "Neuro / Evil · Q版花园",
        "position": "center 35%",
        "mobilePosition": "center"
    },
    {
        "image": "generated/sanae-rain-city.webp",
        "mobile": "generated/sanae-rain-city-mobile.webp",
        "alt": "早苗 · 雨夜城市",
        "position": "center 35%",
        "mobilePosition": "center"
    },
    {
        "image": "generated/neuro-evil-neon-arcade.webp",
        "mobile": "generated/neuro-evil-neon-arcade-mobile.webp",
        "alt": "Neuro / Evil · 霓虹街机房",
        "position": "center 35%",
        "mobilePosition": "center"
    },
    {
        "image": "generated/remilia-sakuya-clocktower.webp",
        "mobile": "generated/remilia-sakuya-clocktower-mobile.webp",
        "alt": "蕾米莉亚与咲夜 · 钟楼",
        "position": "center 35%",
        "mobilePosition": "center"
    },
    {
        "image": "generated/reimu-youmu-winter-teahouse.webp",
        "mobile": "generated/reimu-youmu-winter-teahouse-mobile.webp",
        "alt": "灵梦与妖梦 · 冬日茶屋",
        "position": "center 35%",
        "mobilePosition": "center"
    }
];
    return `<section class="landing" aria-labelledby="landing-title">
        <div class="landing-nebula" aria-hidden="true"></div><div class="landing-grid" aria-hidden="true"></div>
        <div class="landing-visual"><div class="orbit-fallback" aria-hidden="true"></div><div class="landing-art" role="region" aria-roledescription="轮播" aria-label="首页封面" tabindex="0">${covers.map((cover, index) => `<picture class="landing-slide${index === 0 ? ' active' : ''}" aria-hidden="${index !== 0}" style="--cover-position:${cover.position};--mobile-cover-position:${cover.mobilePosition}">${cover.mobile ? `<source media="(max-width: 680px)" srcset="${path(ctx, `images/${cover.mobile}`)}">` : ''}<img src="${path(ctx, `images/${cover.image}`)}" alt="${cover.alt}" width="1920" height="1080" fetchpriority="${index === 0 ? 'high' : 'low'}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async"></picture>`).join('')}</div></div>
        <canvas class="landing-fx" aria-hidden="true"></canvas><div class="landing-vignette" aria-hidden="true"></div>
        <div class="landing-inner"><div class="landing-copy"><h1 id="landing-title">SLLYING<span>.</span></h1><div class="landing-actions"><a class="landing-primary" href="#articles">文章 ${icon('arrow-down-right')}</a><a class="landing-secondary" href="${path(ctx, 'about/index.html')}">关于 ${icon('arrow-up-right')}</a></div></div>
        <div class="cover-controls" role="group" aria-label="封面轮播控制"><button data-cover="previous" aria-label="上一张封面">${icon('chevron-left')}</button><div class="cover-dots">${covers.map((cover, index) => `<button data-cover-index="${index}" aria-label="第 ${index + 1} 张封面：${cover.alt}" aria-pressed="${index === 0}"></button>`).join('')}</div><button data-cover="next" aria-label="下一张封面">${icon('chevron-right')}</button><button data-cover="play" aria-label="暂停轮播" aria-pressed="false">${icon('pause', 'cover-pause')}${icon('play', 'cover-play')}</button><span class="cover-status sr-only" role="status"></span></div>
        <a class="landing-scroll" href="#articles" aria-label="向下查看文章">${icon('arrow-down')}</a></div>
    </section>`;
}

function postCard(ctx, post) {
    return `<article class="post-card" data-category="${escapeHtml(post.category)}" data-post-id="${escapeHtml(post.id)}">
        <div class="post-index"><time datetime="${post.date}">${date(post.date)}</time><a href="${categoryPath(ctx, post.category)}">${escapeHtml(post.category)}</a><span class="post-meta">${readingTime(post)} 分钟阅读</span></div><div class="post-summary"><h3><a href="${postPath(ctx, post)}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt)}</p><div class="post-bottom">${post.featured ? `<span class="pin-label">${icon('pin')} 置顶</span>` : '<span></span>'}<a class="read-arrow" href="${postPath(ctx, post)}" aria-label="阅读：${escapeHtml(post.title)}">阅读 ${icon('arrow-up-right')}</a></div></div>
    </article>`;
}

function home(ctx) {
    const filtered = ctx.posts.filter(post => (!ctx.category || ctx.category === post.category) && (!ctx.tag || post.tags.includes(ctx.tag)));
    const posts = [...filtered].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.date.localeCompare(a.date));
    const isFiltered = Boolean(ctx.category || ctx.tag);
    return `${isFiltered ? `<div class="page-heading page-width"><a class="breadcrumb" href="${path(ctx, 'index.html#articles')}">${icon('arrow-left')} 全部文章</a><p class="eyebrow">${ctx.tag ? '标签' : '分类'}</p><h1>${escapeHtml(ctx.category || ctx.tag)}</h1><p>${posts.length} 篇文章</p></div>` : intro(ctx)}
        <div class="home-layout page-width" id="articles"><section class="article-feed" aria-labelledby="feed-title"><div class="feed-heading"><h2 id="feed-title">${isFiltered ? '文章列表' : '最新文章'}</h2><span class="feed-count">${posts.length} 篇记录</span></div>
            <nav class="filter-tabs" aria-label="文章分类"><a href="${path(ctx, 'index.html#articles')}" class="${isFiltered ? '' : 'selected'}" data-filter="all">全部</a>${categoriesOf(ctx.posts).map(category => `<a href="${categoryPath(ctx, category)}" data-filter="${escapeHtml(category)}"${ctx.category === category ? ' class="selected"' : ''}>${escapeHtml(category)}</a>`).join('')}</nav>
            <div class="posts-list" id="posts-list">${posts.map(post => postCard(ctx, post)).join('')}</div><p class="empty-state" id="feed-empty" hidden>这里暂时没有文章。</p><nav class="pagination" id="pagination" aria-label="文章分页" hidden></nav>
        </section></div>`;
}

function archive(ctx) {
    const posts = [...ctx.posts].filter(post => !ctx.year || post.date.startsWith(String(ctx.year))).sort((a, b) => b.date.localeCompare(a.date));
    const years = [...new Set(posts.map(post => post.date.slice(0, 4)))];
    return `<main class="page-width interior-layout archive-content" id="main-content"><div class="page-heading"><p class="eyebrow">ARCHIVE</p><h1>文章归档</h1><p>${posts.length} 篇记录，按时间慢慢翻阅。</p></div><div class="archive-timeline">${years.map(year => `<section class="archive-year"><h2>${year}<span>${posts.filter(post => post.date.startsWith(year)).length} 篇</span></h2><div>${posts.filter(post => post.date.startsWith(year)).map(post => `<a class="archive-entry" href="${postPath(ctx, post)}"><time datetime="${post.date}">${post.date.slice(5).replace('-', '.')}</time><span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.category)}</small></span>${icon('arrow-up-right')}</a>`).join('')}</div></section>`).join('')}</div></main>`;
}

function taxonomy(ctx) {
    const useTags = ctx.page === 'tags';
    const values = useTags ? tagsOf(ctx.posts) : categoriesOf(ctx.posts);
    return `<main class="page-width interior-layout" id="main-content"><div class="page-heading"><p class="eyebrow">${useTags ? 'TAGS' : 'CATEGORIES'}</p><h1>${useTags ? '文章标签' : '文章分类'}</h1><p>${values.length} 个${useTags ? '标签' : '分类'}，从感兴趣的地方开始。</p></div><div class="topic-index${useTags ? ' tag-index' : ''}">${values.map(value => `<a href="${useTags ? tagPath(ctx, value) : categoryPath(ctx, value)}"><strong>${escapeHtml(value)}</strong><span>${ctx.posts.filter(post => useTags ? post.tags.includes(value) : post.category === value).length}</span>${icon('arrow-up-right')}</a>`).join('')}</div></main>`;
}

function about(ctx) {
    return `<main id="main-content" class="about-page page-width interior-layout">
        <div class="about-intro"><div class="page-heading"><p class="eyebrow">ABOUT</p><h1>你好，我是 SLLYING。</h1><p>一个写代码、喜欢二次元的人。</p></div><img class="about-avatar" src="${path(ctx, 'images/neuro-chibi-avatar.webp')}" alt="Neuro-sama Q 版头像" width="72" height="72"></div>
        <div class="about-body"><section><h2>把好奇心，留在这里。</h2><p>这里记录我在工程开发、AI 工具和创作过程中的探索。喜欢东方 Project，也关注 Neuro-sama 和 Evil。闲下来的时候，常常在技术与二次元之间来回走动。</p><p>写博客是为了把“当时怎么解决的”留给以后的自己。能跑通的代码、踩过的坑、重新想明白的事情，都值得认真记一笔。</p><div class="about-interests">${['Java', 'Unity', 'Live2D', 'Codex', 'Claude Code', '东方 Project', 'Neuro-sama', 'Evil'].map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div></section>
        <section><h2>关于这些文章</h2><p>技术复盘根据实际项目与协作记录整理，保留问题背景、排查过程和工程判断。示例中的账号、令牌、内部地址、个人路径等关键信息已替换；原始对话不会随站点发布。整理示例和历史笔记会在正文中注明。</p><a class="text-link" href="${path(ctx, 'archives/index.html')}">看看全部文章 ${icon('arrow-up-right')}</a></section>
        <div class="about-signoff"><span>SLLYING.</span><a href="${path(ctx, 'feed.xml')}">${icon('rss')} 订阅更新</a></div></div></main>`;
}

function article(ctx) {
    const post = ctx.post;
    const headings = [];
    const body = post.body.replace(/<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (_, level, content) => {
        const id = `section-${headings.length + 1}`;
        headings.push({ id, level, text: content.replace(/<[^>]+>/g, '') });
        return `<h${level} id="${id}">${content}</h${level}>`;
    }).replace(/<table\b[\s\S]*?<\/table>/g, table => `<div class="table-scroll" role="region" aria-label="文章表格" tabindex="0">${table}</div>`);
    const sorted = [...ctx.posts].sort((a, b) => b.date.localeCompare(a.date));
    const index = sorted.findIndex(item => item.id === post.id);
    const neighbors = [sorted[index - 1], sorted[index + 1]];
    const related = ctx.posts.filter(item => item.id !== post.id && (item.category === post.category || item.tags.some(tag => post.tags.includes(tag)))).slice(0, 2);
    return `<div class="reading-progress" id="reading-progress"></div><main class="article-page page-width" id="main-content">
        <a class="breadcrumb" href="${path(ctx, 'index.html#articles')}">${icon('arrow-left')} 返回文章</a>
        <article class="article"><header class="article-header"><a class="eyebrow" href="${categoryPath(ctx, post.category)}">${escapeHtml(post.category)}</a><h1>${post.title.split(/(?<=[：:])/).map(part => `<span class="title-fragment">${escapeHtml(part)}</span>`).join('')}</h1><div class="article-meta"><span class="article-author">SLLYING</span><time datetime="${post.date}">${date(post.date)}</time><span>${readingTime(post)} 分钟阅读</span></div><p class="article-excerpt">${escapeHtml(post.excerpt)}</p></header>
        <details class="article-toc"><summary>${icon('list')} 文章目录 <span class="toc-progress" aria-hidden="true" id="read-percent">0%</span>${icon('chevron-down')}</summary><nav aria-label="文章目录"><ol>${headings.map(heading => `<li class="toc-level-${heading.level}"><a href="#${heading.id}">${escapeHtml(heading.text)}</a></li>`).join('')}</ol></nav></details>
        <div class="article-body" id="article-body">${body}</div>
        <footer class="article-footer"><div class="article-tags">${post.tags.map(tag => `<a href="${tagPath(ctx, tag)}"># ${escapeHtml(tag)}</a>`).join('')}</div><button class="text-button" data-action="share">${icon('link')} 复制文章链接</button></footer>
        <nav class="post-neighbors" aria-label="相邻文章">${neighbors.map((item, i) => item ? `<a href="${postPath(ctx, item)}"><span>${i === 0 ? '上一篇' : '下一篇'}</span><strong>${escapeHtml(item.title)}</strong></a>` : '<span></span>').join('')}</nav>
        ${related.length ? `<section class="related-posts"><h2>继续阅读</h2>${related.map(item => postCard(ctx, item)).join('')}</section>` : ''}</article></main>`;
}

function notFound(ctx) {
    return `<main class="not-found page-width" id="main-content"><span class="eyebrow">PAGE NOT FOUND</span><h1>404<span>.</span></h1><h2>这页笔记还没有写下。</h2><a class="button-primary" href="${path(ctx, 'index.html')}">${icon('arrow-left')} 回到首页</a></main>`;
}

function footer(ctx) {
    return `<footer class="site-footer"><div class="page-width footer-inner"><p class="copyright">SLLYING © 2022–2026</p><div class="footer-links"><a href="${path(ctx, 'categories/index.html')}">分类</a><a href="${path(ctx, 'archives/index.html')}">归档</a><a href="${path(ctx, 'feed.xml')}">${icon('rss')} RSS</a></div></div></footer><a class="back-top icon-button" id="back-top" href="#top" aria-label="回到顶部" title="回到顶部">${icon('arrow-up')}</a>`;
}

export function renderPage(input) {
    const ctx = { base: '', posts: [], page: 'home', ...input };
    const names = { archive: '文章归档', about: '关于这里', topics: '文章分类', categories: '文章分类', tags: '文章标签', notFound: '页面未找到', '404': '页面未找到' };
    const title = ctx.post?.title || ctx.category || ctx.tag || names[ctx.page];
    const description = ctx.post?.excerpt || 'SLLYING 的个人博客。记录工程实践、AI 协作、创作工具与二次元日常。';
    const content = ctx.page === 'post' ? article(ctx) : ctx.page === 'archive' ? archive(ctx) : ctx.page === 'about' ? about(ctx) : ['topics', 'categories', 'tags'].includes(ctx.page) ? taxonomy(ctx) : ['notFound', '404'].includes(ctx.page) ? notFound(ctx) : home(ctx);
    const canonical = ctx.file && ctx.site?.url ? new URL(ctx.file, ctx.site.url).href : '';
    const robots = ctx.page === '404' || ctx.page === 'notFound' ? 'noindex,follow' : 'index,follow';
    const socialImage = ctx.post?.cover || 'images/generated/youmu-moonlit-lake.webp';
    return `<!doctype html>
<html lang="zh-CN" data-theme="light">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b1421"><meta name="robots" content="${robots}"><title>${title ? `${escapeHtml(title)} | ` : ''}SLLYING</title><meta name="description" content="${escapeHtml(description)}"><meta property="og:title" content="${escapeHtml(title || 'SLLYING')}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="${ctx.post ? 'article' : 'website'}"><meta property="og:image" content="${canonical ? new URL(socialImage, ctx.site.url).href : path(ctx, socialImage)}">${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ''}<link rel="icon" type="image/png" href="${path(ctx, 'images/neuro-chibi-favicon.png')}"><link rel="alternate" type="application/rss+xml" title="SLLYING RSS" href="${path(ctx, 'feed.xml')}"><link rel="stylesheet" href="${path(ctx, `css/main.css?v=${VERSION}`)}"><script>document.documentElement.classList.add('js');try{document.documentElement.dataset.theme=localStorage.getItem('sllying-theme')||'light'}catch{}</script><script defer src="${path(ctx, 'js/lib/lucide.min.js')}"></script><script defer src="${path(ctx, `js/search-index.js?v=${VERSION}`)}"></script><script defer src="${path(ctx, `js/main.js?v=${VERSION}`)}"></script>${ctx.page === 'home' && !ctx.category && !ctx.tag ? `<script defer src="${path(ctx, `js/landing.js?v=${VERSION}`)}"></script>` : ''}</head>
<body id="top" data-page="${ctx.page}" data-base="${ctx.base}"${ctx.page === 'home' && !ctx.category && !ctx.tag ? ' data-landing="true"' : ''}${ctx.category || ctx.tag ? ' data-filtered="true"' : ''}><a class="skip-link" href="#${ctx.page === 'home' ? 'articles' : 'main-content'}">跳到正文</a>${header(ctx)}${ctx.page === 'home' ? `<main id="main-content">${content}</main>` : content}${footer(ctx)}
<dialog class="search-dialog" id="search-dialog" aria-labelledby="search-title"><div class="search-heading"><h2 id="search-title">搜索笔记</h2><button class="icon-button" data-action="close-search" aria-label="关闭搜索" title="关闭搜索">${icon('x')}</button></div><label class="search-input">${icon('search')}<input id="search-input" type="search" placeholder="搜索文章、标签、正文…" autocomplete="off" aria-label="搜索文章、标签、正文"></label><div class="search-result-heading" id="search-status">最近的笔记</div><div class="search-results" id="search-results"></div></dialog><div class="toast" id="toast" role="status" hidden></div>
</body></html>`;
}
