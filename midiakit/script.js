/* ==========================================================================
   CARNINHA · MÍDIA KIT 2026 — interações e motion
   ========================================================================== */
window.__kit = true;

/* PREENCHER: contatos da gestão. Enquanto estiverem vazios, os botões de
   WhatsApp e e-mail ficam escondidos e o contato vai pelo Direct. */
const CONTATO = {
  instagram: 'carninha',
  whatsapp: '',   // só números, com DDI e DDD. Ex.: '5561999999999'
  email: 'carninhaltda@gmail.com'
};

(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Capa personalizada: ?marca=Nome ---------- */
  const brand = (new URLSearchParams(location.search).get('marca') || '').trim().slice(0, 40);
  if (brand) {
    $$('[data-brand]').forEach((el) => { el.textContent = brand; });
    document.title = `Carninha × ${brand} · Mídia kit 2026`;
  }

  /* ---------- Contatos ---------- */
  const igDM = `https://ig.me/m/${CONTATO.instagram}`;
  const greeting = brand
    ? `Olá, equipe do Carninha! Sou da ${brand}, vi o mídia kit e quero conversar sobre uma parceria.`
    : 'Olá, equipe do Carninha! Vi o mídia kit e quero conversar sobre uma parceria.';
  $$('[data-contact]').forEach((a) => {
    const kind = a.dataset.contact;
    if (kind === 'instagram') a.href = igDM;
    if (kind === 'whatsapp') {
      if (CONTATO.whatsapp) a.href = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(greeting)}`;
      else a.hidden = true;
    }
    if (kind === 'email') {
      if (CONTATO.email) {
        const subject = brand ? `Parceria Carninha × ${brand}` : 'Parceria com o Carninha';
        a.href = `mailto:${CONTATO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(greeting)}`;
      } else a.hidden = true;
    }
  });

  /* ---------- Ícones decorativos fora da leitura de tela ---------- */
  $$('svg.ico').forEach((svg) => {
    if (svg.hasAttribute('aria-label')) svg.setAttribute('role', 'img');
    else svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  });

  /* ---------- Delays declarados no HTML ---------- */
  $$('[data-delay]').forEach((el) => el.style.setProperty('--d', `${el.dataset.delay}ms`));

  /* ---------- Títulos: palavras com máscara (leitor de tela lê a frase inteira) ---------- */
  $$('[data-split]').forEach((title) => {
    const full = title.textContent.replace(/\s+/g, ' ').trim();
    const base = title.classList.contains('cover__title') ? 200 : 0;
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--d', `${base + i * 70}ms`);
            w.appendChild(inner);
            frag.appendChild(w);
            i += 1;
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
      });
    };
    walk(title);
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.style.display = 'block';
    while (title.firstChild) visual.appendChild(title.firstChild);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = full;
    title.append(sr, visual);
  });

  /* ---------- Fotos: placeholder some quando a imagem carrega ---------- */
  const whenLoaded = (img, box) => {
    const done = () => box.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', () => box.classList.add('is-loaded', 'is-missing'), { once: true });
    }
  };
  $$('.frame img').forEach((img) => whenLoaded(img, img.closest('.frame')));
  $$('.cover__media img, .inter__media img, .closing__media img').forEach((img) => whenLoaded(img, img.parentElement));

  /* ---------- Capa: entrada (não espera a foto) ---------- */
  const coverTitle = $('.cover__title');
  const coverCorners = $('.cover .corners');
  const ready = () => {
    root.classList.add('is-ready');
    coverTitle && coverTitle.classList.add('is-in');
    coverCorners && coverCorners.classList.add('is-in');
  };
  $$('[data-hero]').forEach((el, k) => el.style.setProperty('--d', `${550 + k * 130}ms`));
  if (reduce) ready(); else setTimeout(ready, 80);

  /* ---------- Reveal ao rolar ---------- */
  const settle = (el) => {
    // depois da entrada, devolve o elemento às regras normais (hover, transições próprias)
    const d = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    setTimeout(() => { el.removeAttribute('data-reveal'); el.classList.add('is-done'); }, d + 1200);
  };
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('is-in');
      revealIO.unobserve(el);
      if (el.hasAttribute('data-reveal')) settle(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal], [data-split]:not(.cover__title)').forEach((el) => revealIO.observe(el));
  $$('.corners').filter((c) => c !== coverCorners).forEach((el) => revealIO.observe(el));

  /* ---------- Contadores (começam quando o bloco já está visível) ---------- */
  const fmt = (n, dec) => n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const runCount = (el) => {
    const to = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    if (reduce) { el.textContent = fmt(to, dec); return; }
    const host = el.closest('[data-reveal]');
    const wait = host ? (parseFloat(getComputedStyle(host).getPropertyValue('--d')) || 0) + 250 : 0;
    el.textContent = fmt(0, dec);
    setTimeout(() => {
      const dur = 1600;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = fmt(to * eased, dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, wait);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      runCount(e.target);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- Contador de seções (HUD) ---------- */
  const sections = $$('main > section[data-title]');
  const hudN = $('.hud__n');
  const hudT = $('.hud__t');
  const hudL = $('.hud__lbl');
  hudT.textContent = String(sections.length).padStart(2, '0');
  const hudIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const k = sections.indexOf(e.target);
      hudN.textContent = String(k + 1).padStart(2, '0');
      hudL.textContent = e.target.dataset.title;
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  sections.forEach((s) => hudIO.observe(s));

  /* ---------- Gráfico: visualizações por dia ---------- */
  const chart = $('#chart');
  const dataEl = $('#views-data');
  if (chart && dataEl) {
    const data = JSON.parse(dataEl.textContent);
    const NS = 'http://www.w3.org/2000/svg';
    const W = 640, H = 250, L = 46, R = 14, T = 22, B = 30;
    const max = 13e6;
    const ticks = [0, 6e6, 12e6];
    const x = (k) => L + (k * (W - L - R)) / (data.length - 1);
    const y = (v) => T + (1 - v / max) * (H - T - B);
    const mi = (v) => `${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
    const el = (tag, attrs, parent) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (parent) parent.appendChild(n);
      return n;
    };

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', focusable: 'false' });
    const defs = el('defs', {}, svg);
    const grad = el('linearGradient', { id: 'areaFill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ff3366', 'stop-opacity': '.22' }, grad);
    el('stop', { offset: '100%', 'stop-color': '#ff3366', 'stop-opacity': '0' }, grad);

    const g = el('g', { class: 'grid' }, svg);
    ticks.forEach((t) => {
      el('line', { x1: L, x2: W - R, y1: y(t), y2: y(t) }, g);
      const lbl = el('text', { class: 'tick', x: L - 10, y: y(t) + 4, 'text-anchor': 'end' }, svg);
      lbl.textContent = t === 0 ? '0' : mi(t);
    });
    data.forEach(([d], k) => {
      if (k % 3 !== 0 && k !== data.length - 1) return;
      const lbl = el('text', { class: 'tick', x: x(k), y: H - 8, 'text-anchor': k === 0 ? 'start' : k === data.length - 1 ? 'end' : 'middle' }, svg);
      lbl.textContent = d;
    });

    const pts = data.map(([, v], k) => [x(k), y(v)]);
    const path = pts.map(([px, py], k) => `${k ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join('');
    el('path', { class: 'area', d: `${path}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z` }, svg);
    const line = el('path', { class: 'line', d: path }, svg);

    const peak = data.reduce((m, p, k) => (p[1] > data[m][1] ? k : m), 0);
    el('circle', { class: 'dot', cx: pts[peak][0], cy: pts[peak][1], r: 4.5 }, svg);
    const pl = el('text', { class: 'peak-lbl', x: pts[peak][0] + 10, y: pts[peak][1] + 4 }, svg);
    pl.textContent = `≈${mi(data[peak][1])}`;

    const cross = el('line', { class: 'cross', y1: T, y2: y(0) }, svg);
    const hdot = el('circle', { class: 'hover-dot', r: 5 }, svg);
    chart.prepend(svg);
    chart.style.setProperty('--len', String(Math.ceil(line.getTotalLength())));

    const tip = $('.chart__tip', chart);
    const show = (k) => {
      const [px, py] = pts[k];
      cross.setAttribute('x1', px); cross.setAttribute('x2', px);
      hdot.setAttribute('cx', px); hdot.setAttribute('cy', py);
      const box = chart.getBoundingClientRect();
      const sx = (px / W) * box.width;
      const sy = (py / H) * box.height;
      tip.querySelector('b').textContent = `≈${mi(data[k][1])}`;
      tip.querySelector('span').textContent = `${data[k][0]} · visualizações`;
      tip.style.left = `${Math.min(box.width - 70, Math.max(70, sx))}px`;
      tip.style.top = `${Math.max(46, sy - 12)}px`;
      chart.classList.add('is-hover');
    };
    let cur = peak;
    const nearest = (clientX) => {
      const box = chart.getBoundingClientRect();
      const vx = ((clientX - box.left) / box.width) * W;
      return Math.max(0, Math.min(data.length - 1, Math.round(((vx - L) / (W - L - R)) * (data.length - 1))));
    };
    chart.addEventListener('pointermove', (e) => { cur = nearest(e.clientX); show(cur); });
    chart.addEventListener('pointerleave', () => chart.classList.remove('is-hover'));
    chart.addEventListener('focus', () => show(cur));
    chart.addEventListener('blur', () => chart.classList.remove('is-hover'));
    chart.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      cur = Math.max(0, Math.min(data.length - 1, cur + (e.key === 'ArrowRight' ? 1 : -1)));
      show(cur);
    });

    const tbody = $('#chart-table tbody');
    data.forEach(([d, v]) => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td'); td1.textContent = d;
      const td2 = document.createElement('td'); td2.textContent = `aproximadamente ${mi(v)}`;
      tr.append(td1, td2);
      tbody.appendChild(tr);
    });

    if (reduce) chart.classList.add('is-drawn');
    else {
      const drawIO = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        chart.classList.add('is-drawn');
        drawIO.disconnect();
      }, { threshold: 0.4 });
      drawIO.observe(chart);
    }
  }

  /* ---------- Scroll: progresso, chrome, parallax e zoom das telas cheias ---------- */
  const chrome = $('.chrome');
  const bar = $('.progress span');
  const parallax = $$('[data-parallax]');
  const zooms = $$('[data-zoom]');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      const vh = window.innerHeight;
      chrome.classList.toggle('is-scrolled', y > 40);
      const max = document.documentElement.scrollHeight - vh;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (reduce) return;

      parallax.forEach((el) => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -100 || box.top > vh + 100) return;
        const limit = box.height * 0.065; // folga do .frame__in (inset -7%)
        const off = (box.top + box.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0,${Math.max(-limit, Math.min(limit, off)).toFixed(1)}px,0)`;
      });

      zooms.forEach((el) => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) return;
        const p = Math.min(1, Math.max(0, (vh - box.top) / (vh + box.height)));
        el.style.transform = `scale(${(1.14 - 0.12 * p).toFixed(4)})`;
      });
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
