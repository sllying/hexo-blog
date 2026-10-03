(function () {
    'use strict';

    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
    const base = document.body.dataset.base || '';
    const posts = Array.isArray(window.BLOG_SEARCH) ? window.BLOG_SEARCH : [];
    const dialog = $('#search-dialog');
    const searchInput = $('#search-input');
    const feedCards = $$('#posts-list > .post-card');
    const localFilters = feedCards.length && !document.body.dataset.filtered;
    const state = { category: 'all', page: 1 };
    const pageSize = 8;
    let toastTimer;
    let searchTrigger;

    const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
    const refreshIcons = () => window.lucide?.createIcons({ attrs: { 'stroke-width': 1.7 } });
    const plainClick = event => event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

    function toast(message) {
        const element = $('#toast');
        element.textContent = message;
        element.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { element.hidden = true; }, 2500);
    }

    async function copy(text, success) {
        try {
            await navigator.clipboard.writeText(text);
            toast(success);
        } catch {
            const input = document.createElement('textarea');
            input.value = text;
            input.style.cssText = 'position:fixed;top:-9999px;left:0';
            document.body.append(input);
            input.select();
            const copied = document.execCommand('copy');
            input.remove();
            toast(copied ? success : '复制失败');
        }
    }

    function highlighted(text, query) {
        const position = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
        if (!query || position < 0) return escapeHtml(text);
        return `${escapeHtml(text.slice(0, position))}<mark>${escapeHtml(text.slice(position, position + query.length))}</mark>${escapeHtml(text.slice(position + query.length))}`;
    }

    function search(query = '') {
        const normalized = query.trim().toLocaleLowerCase();
        const terms = normalized.split(/\s+/).filter(Boolean);
        const results = posts.map(post => {
            const title = post.title.toLocaleLowerCase();
            const tags = [post.category, ...post.tags].join(' ').toLocaleLowerCase();
            const all = `${title} ${tags} ${post.excerpt} ${post.text}`.toLocaleLowerCase();
            return { post, match: terms.every(term => all.includes(term)), score: terms.reduce((score, term) => score + (title.includes(term) ? 4 : tags.includes(term) ? 2 : 1), 0) };
        }).filter(item => item.match).sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date));
        $('#search-status').textContent = normalized ? `${results.length} 篇相关笔记` : '最近的笔记';
        $('#search-results').innerHTML = (normalized ? results : results.slice(0, 6)).map(({ post }) => {
            let snippet = post.excerpt;
            if (normalized && !snippet.toLocaleLowerCase().includes(normalized)) {
                const at = post.text.toLocaleLowerCase().indexOf(normalized);
                if (at >= 0) snippet = `${at > 30 ? '…' : ''}${post.text.slice(Math.max(0, at - 30), at + 90)}…`;
            }
            return `<a class="search-result" href="${base}posts/${encodeURIComponent(post.id)}/index.html"><small>${escapeHtml(post.category)} · ${escapeHtml(post.date)}</small><strong>${highlighted(post.title, normalized)}</strong><p>${highlighted(snippet, normalized)}</p></a>`;
        }).join('') || '<p class="empty-state">没有找到相关笔记。</p>';
    }

    function openSearch(trigger) {
        searchTrigger = trigger || document.activeElement;
        closeMenu();
        search(searchInput.value);
        if (!dialog.open) dialog.showModal();
        searchInput.focus();
    }

    function closeMenu() {
        $('#mobile-menu').hidden = true;
        $('[data-action="menu"]').setAttribute('aria-expanded', 'false');
    }

    function filterUrl(page, category = state.category) {
        const url = new URL(location.href);
        url.searchParams.delete('post');
        if (category === 'all') url.searchParams.delete('category');
        else url.searchParams.set('category', category);
        if (page === 1) url.searchParams.delete('page');
        else url.searchParams.set('page', String(page));
        url.hash = 'articles';
        return url.href;
    }

    function renderFeed(scroll = false) {
        if (!feedCards.length) return;
        const filtered = feedCards.filter(card => state.category === 'all' || card.dataset.category === state.category);
        const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
        state.page = Math.max(1, Math.min(pages, state.page));
        const visible = new Set(filtered.slice((state.page - 1) * pageSize, state.page * pageSize));
        feedCards.forEach(card => { card.hidden = !visible.has(card); });
        if (localFilters) $$('[data-filter]').forEach(link => {
            const active = link.dataset.filter === state.category;
            link.classList.toggle('selected', active);
            if (active) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
        $('.feed-count').textContent = `${filtered.length} 篇记录`;
        $('#feed-empty').hidden = filtered.length > 0;
        const pagination = $('#pagination');
        pagination.hidden = pages <= 1;
        pagination.innerHTML = `${state.page > 1 ? `<a href="${escapeHtml(filterUrl(state.page - 1))}" data-page-link="${state.page - 1}" aria-label="上一页" title="上一页">${icon('chevron-left')}</a>` : `<button disabled aria-label="上一页">${icon('chevron-left')}</button>`}${Array.from({ length: pages }, (_, index) => `<a href="${escapeHtml(filterUrl(index + 1))}" data-page-link="${index + 1}" aria-label="第 ${index + 1} 页"${state.page === index + 1 ? ' aria-current="page"' : ''}>${index + 1}</a>`).join('')}${state.page < pages ? `<a href="${escapeHtml(filterUrl(state.page + 1))}" data-page-link="${state.page + 1}" aria-label="下一页" title="下一页">${icon('chevron-right')}</a>` : `<button disabled aria-label="下一页">${icon('chevron-right')}</button>`}`;
        refreshIcons();
        if (scroll) $('#articles').scrollIntoView({ behavior: 'instant' });
    }

    function readLocation() {
        const params = new URLSearchParams(location.search);
        state.page = Number.parseInt(params.get('page'), 10) || 1;
        state.category = localFilters ? params.get('category') || 'all' : 'all';
        if (state.category !== 'all' && !feedCards.some(card => card.dataset.category === state.category)) state.category = 'all';
        renderFeed();
    }

    function updateScroll() {
        $('#back-top').classList.toggle('visible', window.scrollY > 500);
        $('.site-header').classList.toggle('scrolled', window.scrollY > 30);
        const body = $('#article-body');
        if (!body) return;
        const start = body.getBoundingClientRect().top + window.scrollY - 130;
        const distance = Math.max(1, body.offsetHeight - window.innerHeight + 180);
        const percentage = Math.round(Math.max(0, Math.min(1, (window.scrollY - start) / distance)) * 100);
        $('#reading-progress').style.width = `${percentage}%`;
        $('#read-percent').textContent = `${percentage}%`;
        const headings = $$('h2[id], h3[id]', body);
        let active = headings[0]?.id;
        headings.forEach(heading => { if (heading.getBoundingClientRect().top <= 150) active = heading.id; });
        $$('.article-toc nav a').forEach(link => {
            const current = link.hash === `#${active}`;
            link.classList.toggle('active', current);
            if (current) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }

    document.addEventListener('click', event => {
        const action = event.target.closest('[data-action]');
        if (action) {
            switch (action.dataset.action) {
                case 'search': openSearch(action); break;
                case 'close-search': dialog.close(); break;
                case 'menu': {
                    const open = $('#mobile-menu').hidden;
                    $('#mobile-menu').hidden = !open;
                    action.setAttribute('aria-expanded', String(open));
                    break;
                }
                case 'theme': {
                    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
                    document.documentElement.dataset.theme = theme;
                    action.setAttribute('aria-pressed', String(theme === 'dark'));
                    try { localStorage.setItem('sllying-theme', theme); } catch { /* Storage is optional for local previews. */ }
                    break;
                }
                case 'share': copy(location.href, '文章链接已复制'); break;
                case 'copy-code': copy(action.parentElement.querySelector('code').textContent, '代码已复制'); break;
            }
        }
        if (event.target.closest('#mobile-menu a')) closeMenu();
        const filter = event.target.closest('[data-filter]');
        if (filter && localFilters && plainClick(event)) {
            event.preventDefault();
            state.category = filter.dataset.filter;
            state.page = 1;
            history.pushState({}, '', filterUrl(1));
            renderFeed();
        }
        const page = event.target.closest('[data-page-link]');
        if (page && plainClick(event)) {
            event.preventDefault();
            state.page = Number(page.dataset.pageLink);
            history.pushState({}, '', page.href);
            renderFeed(true);
        }
    });

    dialog.addEventListener('click', event => {
        const rect = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => searchTrigger?.focus());
    searchInput.addEventListener('input', event => search(event.target.value));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMenu();
            if (dialog.open) { event.preventDefault(); dialog.close(); }
        }
        const editing = event.target.closest('input, textarea, select, [contenteditable="true"]');
        if (event.key === '/' && !editing) { event.preventDefault(); openSearch(); }
    });
    window.addEventListener('popstate', readLocation);
    window.addEventListener('resize', () => { if (window.innerWidth > 680) closeMenu(); });
    let scrollScheduled = false;
    window.addEventListener('scroll', () => {
        if (scrollScheduled) return;
        scrollScheduled = true;
        requestAnimationFrame(() => { updateScroll(); scrollScheduled = false; });
    }, { passive: true });

    $$('.article-body pre').forEach(pre => {
        const code = $('code', pre);
        if (!code) return;
        pre.dataset.language = (code.className.match(/language-([\w-]+)/)?.[1] || 'code').toUpperCase();
        const button = document.createElement('button');
        button.className = 'code-copy';
        button.dataset.action = 'copy-code';
        button.title = '复制代码';
        button.setAttribute('aria-label', '复制代码');
        button.innerHTML = icon('copy');
        pre.append(button);
    });
    $('[data-action="theme"]').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
    const legacyPost = new URLSearchParams(location.search).get('post');
    if (legacyPost && posts.some(post => post.id === legacyPost)) {
        location.replace(`${base}posts/${encodeURIComponent(legacyPost)}/index.html${location.hash}`);
        return;
    }
    if (document.body.dataset.page === 'home') {
        if (location.hash === '#signal') location.hash = 'articles';
        if (location.hash === '#archive') location.replace(`${base}archives/index.html`);
        if (location.hash === '#about') location.replace(`${base}about/index.html`);
    }
    readLocation();
    refreshIcons();
    updateScroll();

    const landing = $('.landing');
    if (landing) {
        let inView = true;
        const updateMotion = () => landing.classList.toggle('in-view', inView && !document.hidden);
        const observer = new IntersectionObserver(entries => {
            inView = entries[0].isIntersecting;
            updateMotion();
        });
        observer.observe(landing);
        document.addEventListener('visibilitychange', updateMotion);
        updateMotion();
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        let frame;
        let pointerX = 0;
        let pointerY = 0;
        const resetParallax = () => {
            cancelAnimationFrame(frame);
            frame = undefined;
            landing.style.removeProperty('--parallax-x');
            landing.style.removeProperty('--parallax-y');
            landing.style.removeProperty('--tilt-x');
            landing.style.removeProperty('--tilt-y');
        };
        landing.addEventListener('pointermove', event => {
            if (event.pointerType !== 'mouse' || reducedMotion.matches || !inView) return;
            const rect = landing.getBoundingClientRect();
            pointerX = ((event.clientX - rect.left) / rect.width - .5) * -24;
            pointerY = ((event.clientY - rect.top) / rect.height - .5) * -18;
            if (frame) return;
            frame = requestAnimationFrame(() => {
                landing.style.setProperty('--parallax-x', `${pointerX.toFixed(2)}px`);
                landing.style.setProperty('--parallax-y', `${pointerY.toFixed(2)}px`);
                landing.style.setProperty('--tilt-x', `${(-pointerX * .42).toFixed(2)}deg`);
                landing.style.setProperty('--tilt-y', `${(pointerY * .3).toFixed(2)}deg`);
                frame = undefined;
            });
        }, { passive: true });
        landing.addEventListener('pointerleave', resetParallax);
        reducedMotion.addEventListener('change', resetParallax);
    }
})();
