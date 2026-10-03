(function () {
    'use strict';
    const landing = document.querySelector('.landing');
    if (!landing) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const carousel = createCarousel(landing, reducedMotion);
    const canvas = landing?.querySelector('.landing-fx');
    const context = canvas?.getContext('2d');
    if (!context) {
        let onScreen = true;
        const sync = () => carousel.sync(onScreen && !document.hidden);
        new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; sync(); }).observe(landing);
        document.addEventListener('visibilitychange', sync);
        reducedMotion.addEventListener('change', sync);
        window.addEventListener('pagehide', () => carousel.sync(false));
        window.addEventListener('pageshow', sync);
        sync();
        return;
    }

    let width = 0;
    let height = 0;
    let radius = 0;
    let centerX = 0;
    let centerY = 0;
    let visible = true;
    let frame = 0;
    let lastTime = 0;
    let elapsed = 0;
    let stars = [];
    const rings = [
        { size: .95, tilt: .72, rotation: -.35, color: '139,203,255', offset: 0 },
        { size: 1.08, tilt: 1.15, rotation: .52, color: '180,161,255', offset: 2.3 },
        { size: 1.15, tilt: .48, rotation: -.16, color: '114,155,255', offset: 4.1 },
    ];

    function resize() {
        width = landing.clientWidth;
        height = landing.clientHeight;
        const mobile = width <= 680;
        const ratio = Math.min(devicePixelRatio || 1, mobile ? 1 : 1.5);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        radius = landing.querySelector('.landing-visual').offsetWidth * .5;
        centerX = width * (mobile ? .58 : .74);
        centerY = height * (mobile ? .34 : .5);
        let seed = 8217;
        const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
        stars = Array.from({ length: mobile ? 32 : 76 }, () => ({ x: random() * width, y: random() * height, size: .4 + random(), phase: random() * Math.PI * 2, speed: .15 + random() * .4 }));
        render(elapsed);
    }

    function render(time) {
        context.clearRect(0, 0, width, height);
        const shiftX = Number.parseFloat(landing.style.getPropertyValue('--parallax-x')) || 0;
        const shiftY = Number.parseFloat(landing.style.getPropertyValue('--parallax-y')) || 0;
        const pointerTilt = (Number.parseFloat(landing.style.getPropertyValue('--tilt-x')) || 0) * Math.PI / 180;
        const cx = centerX + shiftX;
        const cy = centerY + shiftY;

        context.fillStyle = '#c6d7ff';
        for (const star of stars) {
            context.globalAlpha = .16 + (Math.sin(time * star.speed + star.phase) + 1) * .17;
            context.beginPath();
            context.arc(star.x + shiftX * .25, (star.y - time * star.speed * 3 % height + height) % height, star.size, 0, Math.PI * 2);
            context.fill();
        }
        context.globalAlpha = 1;

        for (const ring of rings) {
            const tilt = ring.tilt + pointerTilt;
            const rotation = ring.rotation + Math.sin(time * .13 + ring.offset) * .09;
            const cosR = Math.cos(rotation);
            const sinR = Math.sin(rotation);
            const project = angle => {
                const x = Math.cos(angle) * radius * ring.size;
                const y = Math.sin(angle) * radius * ring.size;
                const z = Math.sin(angle * 3 + time * .2) * radius * .025;
                const tiltedY = y * Math.cos(tilt) - z * Math.sin(tilt);
                const depth = y * Math.sin(tilt) + z * Math.cos(tilt);
                const perspective = 1 / (1 + depth / (radius * 4));
                return { x: cx + (x * cosR - tiltedY * sinR) * perspective, y: cy + (x * sinR + tiltedY * cosR) * perspective, depth };
            };
            const phase = time * (.11 + ring.size * .04) + ring.offset;
            const gradient = context.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
            gradient.addColorStop(0, `rgba(${ring.color},.08)`);
            gradient.addColorStop(.4, `rgba(${ring.color},.65)`);
            gradient.addColorStop(.7, `rgba(${ring.color},.25)`);
            gradient.addColorStop(1, `rgba(${ring.color},.1)`);
            context.beginPath();
            for (let i = 0; i <= 144; i++) {
                const point = project(phase + i / 144 * Math.PI * 1.85);
                if (i === 0) context.moveTo(point.x, point.y);
                else context.lineTo(point.x, point.y);
            }
            context.strokeStyle = gradient;
            context.lineWidth = ring.size > 1.1 ? .65 : 1.15;
            context.shadowColor = `rgba(${ring.color},.6)`;
            context.shadowBlur = 9;
            context.stroke();

            const head = project(phase + Math.PI * 1.85);
            const glow = context.createRadialGradient(head.x, head.y, 0, head.x, head.y, 18);
            glow.addColorStop(0, `rgba(${ring.color},.75)`);
            glow.addColorStop(.2, `rgba(${ring.color},.28)`);
            glow.addColorStop(1, `rgba(${ring.color},0)`);
            context.fillStyle = glow;
            context.fillRect(head.x - 18, head.y - 18, 36, 36);
            context.fillStyle = '#e4f3ff';
            context.beginPath();
            context.arc(head.x, head.y, 1.4, 0, Math.PI * 2);
            context.fill();
            context.shadowBlur = 0;
        }
    }

    function animate(timestamp) {
        frame = 0;
        if (!visible || document.hidden || reducedMotion.matches) return;
        if (!lastTime) lastTime = timestamp;
        const delta = timestamp - lastTime;
        if (delta >= 1000 / 30) {
            elapsed += Math.min(delta, 100) / 1000;
            lastTime = timestamp;
            render(elapsed);
        }
        frame = requestAnimationFrame(animate);
    }

    function updateMotion() {
        carousel.sync(visible && !document.hidden);
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        const running = visible && !document.hidden && !reducedMotion.matches;
        canvas.dataset.motion = reducedMotion.matches ? 'static' : running ? 'running' : 'paused';
        if (running) frame = requestAnimationFrame(animate);
        else if (visible && !document.hidden) render(elapsed);
    }

    resize();
    landing.classList.add('fx-ready');
    new ResizeObserver(resize).observe(landing);
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; updateMotion(); }).observe(landing);
    document.addEventListener('visibilitychange', updateMotion);
    reducedMotion.addEventListener('change', updateMotion);
    window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; carousel.sync(false); });
    window.addEventListener('pageshow', updateMotion);
    updateMotion();

    function createCarousel(region, motionPreference) {
        const art = region.querySelector('.landing-art');
        const controls = region.querySelector('.cover-controls');
        const slides = Array.from(art.querySelectorAll('.landing-slide'));
        const dots = Array.from(controls.querySelectorAll('[data-cover-index]'));
        const playButton = controls.querySelector('[data-cover="play"]');
        const status = controls.querySelector('.cover-status');
        let selected = 0;
        let requested = 0;
        let sequence = 0;
        let timer;
        let onScreen = false;
        let playing = true;
        let explicitStart = false;
        let startPoint;
        const hoverTargets = new Set();
        const focused = () => art.contains(document.activeElement) || controls.contains(document.activeElement);

        function schedule() {
            clearTimeout(timer);
            const paused = !playing || motionPreference.matches;
            controls.classList.toggle('is-paused', paused);
            playButton.disabled = motionPreference.matches;
            playButton.setAttribute('aria-pressed', String(paused));
            playButton.setAttribute('aria-label', motionPreference.matches ? '减少动画模式下已暂停轮播' : playing ? '暂停轮播' : '播放轮播');
            const running = onScreen && !document.hidden && !paused && (explicitStart || (!hoverTargets.size && !focused())) && !startPoint;
            region.dataset.carousel = running ? 'playing' : 'paused';
            if (running) timer = setTimeout(() => show(selected + 1, false), 6500);
        }

        async function show(index, manual = true) {
            if (manual) explicitStart = false;
            requested = (index + slides.length) % slides.length;
            const target = requested;
            const token = ++sequence;
            clearTimeout(timer);
            const image = slides[target].querySelector('img');
            image.loading = 'eager';
            try { await image.decode(); } catch { if (token === sequence) schedule(); return; }
            if (token !== sequence) return;
            selected = target;
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === selected);
                slide.setAttribute('aria-hidden', String(i !== selected));
            });
            dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === selected)));
            if (manual) status.textContent = `第 ${selected + 1} 张，共 ${slides.length} 张封面`;
            schedule();
        }

        controls.addEventListener('click', event => {
            const dot = event.target.closest('[data-cover-index]');
            if (dot) { show(Number(dot.dataset.coverIndex)); return; }
            const button = event.target.closest('[data-cover]');
            if (!button) return;
            if (button.dataset.cover === 'play') { playing = !playing; explicitStart = playing; schedule(); }
            else show(requested + (button.dataset.cover === 'next' ? 1 : -1));
        });
        for (const target of [art, controls]) {
            target.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { explicitStart = false; hoverTargets.add(target); schedule(); } });
            target.addEventListener('pointerleave', () => { hoverTargets.delete(target); schedule(); });
            target.addEventListener('focusin', () => { explicitStart = false; schedule(); });
            target.addEventListener('focusout', () => queueMicrotask(schedule));
            target.addEventListener('keydown', event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                show(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : requested + (event.key === 'ArrowRight' ? 1 : -1));
            });
        }
        art.addEventListener('pointerdown', event => {
            if (event.pointerType !== 'touch') return;
            startPoint = { x: event.clientX, y: event.clientY };
            art.setPointerCapture(event.pointerId);
            schedule();
        });
        art.addEventListener('pointerup', event => {
            if (!startPoint) return;
            const dx = event.clientX - startPoint.x;
            const dy = event.clientY - startPoint.y;
            startPoint = undefined;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) show(requested + (dx < 0 ? 1 : -1));
            else schedule();
        });
        art.addEventListener('pointercancel', () => { startPoint = undefined; schedule(); });
        region.classList.add('carousel-ready');
        return { sync: active => { onScreen = active; schedule(); } };
    }
})();
