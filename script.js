/* script.js — Versão refeita, robusta e responsiva
   Funcionalidades:
   - calcula e define --header-height (offset seguro)
   - header scrolled / hide-on-scroll / show-on-scroll
   - mobile nav (toggle, overlay clone, foco, ESC, clique fora)
   - smooth scroll (considera header height)
   - active nav highlighting (IntersectionObserver)
   - back-to-top button (visível após scroll)
   - fade-up reveal (IntersectionObserver)
   - particles init (se existir canvas e support)
   - respeito a prefers-reduced-motion
   - proteção contra erros e listeners otimizados (throttle/debounce)
*/

(function () {
  'use strict';

  /* ---------- utilitários ---------- */
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function throttle(fn, wait = 120) {
    let last = 0, scheduled = null;
    return function (...args) {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        if (scheduled) { cancelAnimationFrame(scheduled); scheduled = null; }
        last = now;
        fn.apply(this, args);
      } else if (!scheduled) {
        scheduled = requestAnimationFrame(() => {
          last = Date.now();
          scheduled = null;
          fn.apply(this, args);
        });
      }
    };
  }

  function debounce(fn, wait = 120) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /* ---------- elementos ---------- */
  const header = $('header');
  const main = $('main') || document.body;
  const desktopNav = $('nav'); // nav desktop
  const desktopNavList = $('#navList');
  const backToTopBtn = $('#backToTop');
  const canvasBg = $('#backgroundParticles');
  const canvasVideo = $('#particles');

  /* variáveis de estado */
  let headerHeight = 0;
  let lastScrollY = window.scrollY || 0;
  let ticking = false;

  /* ---------- calcula e aplica altura do header (CSS var) ---------- */
  function updateHeaderHeight() {
    if (!header) return;
    const h = Math.ceil(header.getBoundingClientRect().height);
    headerHeight = h;
    document.documentElement.style.setProperty('--header-height', `${h}px`);
    // fallback inline padding-top para main (se desejar)
    if (main) main.style.paddingTop = `var(--header-height, ${h}px)`;
  }

  /* ---------- mostrar/ocultar header ao rolar ---------- */
  const SCROLL_DELTA = 12;
  function handleHeaderOnScroll() {
    if (!header) return;
    const currentY = window.scrollY || 0;

    // adição visual quando passa um ponto
    if (currentY > 20) header.classList.add('scrolled'); else header.classList.remove('scrolled');

    // hide/show inteligente
    const delta = currentY - lastScrollY;
    if (Math.abs(delta) > SCROLL_DELTA) {
      if (delta > 0 && currentY > headerHeight + 60) {
        header.classList.add('hidden');
      } else {
        header.classList.remove('hidden');
      }
      lastScrollY = currentY;
    }

    // back to top visibility
    if (backToTopBtn) {
      if (currentY > 320) backToTopBtn.classList.add('visible');
      else backToTopBtn.classList.remove('visible');
    }
  }

  /* ---------- active link via IntersectionObserver (mais eficiente) ---------- */
  function setupActiveSectionObserver() {
    try {
      const sections = $$('section[id]');
      if (!sections.length || !desktopNavList) return;

      const linkMap = new Map();
      $$('a', desktopNavList).forEach(a => {
        const href = a.getAttribute('href') || '';
        const id = href.includes('#') ? href.split('#')[1] : null;
        if (id) linkMap.set(id, a);
      });

      // garante que só 1 link fique ativo: quando uma seção está suficientemente visível
      const observer = new IntersectionObserver((entries) => {
        // ordena por interseção para escolher o mais visível
        entries.forEach(entry => {
          const id = entry.target.id;
          const link = linkMap.get(id);
          if (!link) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
            // remove active de todos e aplica neste
            linkMap.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
          } else {
            // se não é intersecting, só remove desta (não limpa todo o mapa)
            link.classList.remove('active');
          }
        });
      }, { root: null, rootMargin: `-${Math.round(headerHeight * 0.25)}px 0px -40% 0px`, threshold: [0.25, 0.35, 0.6] });

      sections.forEach(s => observer.observe(s));
    } catch (e) {
      // fallback leve: ativa por scroll position (mais simples)
      // console.warn('Active observer failed', e);
    }
  }

  /* ---------- smooth scroll para âncoras internas (considera header) ---------- */
  function initSmoothAnchors() {
    // usa delegation para pegar todos os links internos, inclusive mobile cloned
    document.addEventListener('click', function (ev) {
      const a = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      ev.preventDefault();
      // calcula posição considerando headerHeight (lê var atual)
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight - 8);
      if (isReducedMotion) window.scrollTo(0, top);
      else window.scrollTo({ top, behavior: 'smooth' });

      // se mobile nav estiver aberta, fecha
      if (document.body.classList.contains('nav-open')) {
        closeMobileNav();
      }

      // acessibilidade: colocar foco programático
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ---------- fade-up reveal ---------- */
  function initFadeUp() {
    try {
      const els = $$('.fade-up');
      if (!els.length) return;
      const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            o.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18 });
      els.forEach(el => obs.observe(el));
    } catch (e) { /* silently fail */ }
  }

  /* ---------- BACK TO TOP ---------- */
  function initBackToTop() {
    if (!backToTopBtn) return;
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isReducedMotion) window.scrollTo(0, 0);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      // foco em main por accessibilidade
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
    });
    // teclado
    backToTopBtn.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' || e.key === ' ') backToTopBtn.click();
    });
  }

  /* ---------- PARTICULAS (optimizado) ---------- */
  function initBgParticles() {
    if (!canvasBg || !canvasBg.getContext) return;
    try {
      const ctx = canvasBg.getContext('2d');
      let W = 0, H = 0, particles = [], raf = null;
      const deviceRatio = Math.max(1, window.devicePixelRatio || 1);

      function createParticles() {
        W = canvasBg.clientWidth * deviceRatio;
        H = canvasBg.clientHeight * deviceRatio;
        canvasBg.width = W;
        canvasBg.height = H;
        const count = Math.max(20, Math.floor((canvasBg.clientWidth || window.innerWidth) / 30));
        particles = [];
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: (Math.random() * 1.6 + 0.6) * deviceRatio,
            vx: (Math.random() - 0.5) * 0.6 * deviceRatio,
            vy: (Math.random() - 0.5) * 0.6 * deviceRatio,
            a: 0.12 + Math.random() * 0.5
          });
        }
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(165,167,214,${Math.max(0, Math.min(1, p.a))})`;
          ctx.fill();
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -20) p.x = W + 20;
          if (p.x > W + 20) p.x = -20;
          if (p.y < -20) p.y = H + 20;
          if (p.y > H + 20) p.y = -20;
        }
        raf = requestAnimationFrame(draw);
      }

      createParticles();
      draw();

      const onResize = debounce(() => {
        cancelAnimationFrame(raf);
        createParticles();
        draw();
      }, 140);

      window.addEventListener('resize', onResize, { passive: true });

      // cleanup if needed (not strictly necessary for single page)
    } catch (e) {
      // console.warn('bg particles failed', e);
    }
  }

  function initVideoParticles() {
    if (!canvasVideo || !canvasVideo.getContext) return;
    try {
      const ctx = canvasVideo.getContext('2d');
      let W = 0, H = 0, particles = [], raf = null;
      function create() {
        W = Math.round(canvasVideo.clientWidth);
        H = Math.round(canvasVideo.clientHeight);
        canvasVideo.width = W;
        canvasVideo.height = H;
        particles = [];
        const count = Math.max(12, Math.floor((W * H) / (30000)));
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.2 + 0.3,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            a: 0.04 + Math.random() * 0.35
          });
        }
      }
      function draw() {
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(160,200,200,${p.a})`;
          ctx.fill();
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = W + 10;
          if (p.x > W + 10) p.x = -10;
          if (p.y < -10) p.y = H + 10;
          if (p.y > H + 10) p.y = -10;
        }
        raf = requestAnimationFrame(draw);
      }
      create();
      draw();
      window.addEventListener('resize', debounce(() => {
        cancelAnimationFrame(raf);
        create();
        draw();
      }, 140), { passive: true });
    } catch (e) {
      // console.warn('video particles failed', e);
    }
  }

  /* ---------- MOBILE NAV (cria toggle + overlay se não existir) ---------- */
  let navToggle = $('.nav-toggle');
  let mobileNav = $('.mobile-nav');

  function createMobileNavIfNeeded() {
    const headerInner = $('.header-inner');
    if (!headerInner) return;

    // cria botão toggle se não existir
    if (!navToggle) {
      navToggle = document.createElement('button');
      navToggle.className = 'nav-toggle';
      navToggle.type = 'button';
      navToggle.setAttribute('aria-label', 'Abrir menu');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.innerHTML = `<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="22" height="2" rx="1" fill="currentColor"/><rect y="6" width="22" height="2" rx="1" fill="currentColor"/><rect y="12" width="22" height="2" rx="1" fill="currentColor"/></svg>`;
      // inserir antes do nav (se existir) ou ao final do headerInner
      const navEl = $('nav');
      if (navEl) headerInner.insertBefore(navToggle, navEl);
      else headerInner.appendChild(navToggle);
    }

    // cria overlay mobileNav se não existir (clona ul)
    if (!mobileNav) {
      mobileNav = document.createElement('nav');
      mobileNav.className = 'mobile-nav';
      mobileNav.setAttribute('aria-label', 'Menu móvel');
      mobileNav.setAttribute('id', 'mobile-nav');

      // clona lista do desktop
      const desktopUl = $('#navList');
      const clone = desktopUl ? desktopUl.cloneNode(true) : document.createElement('ul');
      clone.id = 'mobileNavList';
      mobileNav.appendChild(clone);

      // close btn
      const closeBtn = document.createElement('button');
      closeBtn.className = 'close-btn';
      closeBtn.setAttribute('aria-label', 'Fechar menu');
      closeBtn.innerHTML = '&times;';
      mobileNav.appendChild(closeBtn);

      document.body.appendChild(mobileNav);

      // eventos do overlay
      closeBtn.addEventListener('click', () => {
        closeMobileNav();
        navToggle.focus();
      });

      // click em links fecha
      mobileNav.addEventListener('click', (ev) => {
        const a = ev.target.closest && ev.target.closest('a');
        if (!a) return;
        document.body.classList.remove('nav-open');
      });
    }
  }

  function openMobileNav() {
    document.body.classList.add('nav-open');
    document.documentElement.style.overflow = 'hidden';
    if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
    // foco no primeiro link
    const firstLink = mobileNav && mobileNav.querySelector('a');
    if (firstLink) firstLink.focus();
  }
  function closeMobileNav() {
    document.body.classList.remove('nav-open');
    document.documentElement.style.overflow = '';
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMobileNav() {
    if (document.body.classList.contains('nav-open')) closeMobileNav();
    else openMobileNav();
  }

  /* fechar mobile nav se clicar fora (overlay) */
  function clickOutsideToClose(e) {
    if (!document.body.classList.contains('nav-open')) return;
    if (!mobileNav) return;
    if (mobileNav.contains(e.target)) return;
    if (navToggle && navToggle.contains(e.target)) return;
    closeMobileNav();
  }

  /* ---------- inicialização geral ---------- */
  function init() {
    if (!header) return;

    // setup
    updateHeaderHeight();
    createMobileNavIfNeeded();
    initSmoothAnchors();
    initSmoothAnchors = initSmoothAnchors; // keep linter happy if referenced
    initBackToTop();
    initFadeUp();
    initBgParticles();
    initVideoParticles();
    setupActiveSectionObserver();

    // eventos otimizado
    window.addEventListener('scroll', throttle(() => {
      handleHeaderOnScroll();
    }, 100), { passive: true });

    window.addEventListener('resize', debounce(() => {
      updateHeaderHeight();
      // se o menu mobile estiver aberto e aumentou largura, fechar
      if (window.innerWidth > 880 && document.body.classList.contains('nav-open')) {
        closeMobileNav();
      }
    }, 150), { passive: true });

    // delegation: close mobile if click outside
    document.addEventListener('click', clickOutsideToClose, { passive: true });

    // keyboard: ESC fecha mobile nav; Home tecla leva ao topo
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        closeMobileNav();
        if (navToggle) navToggle.focus();
      }
      if (e.key === 'Home') {
        if (isReducedMotion) window.scrollTo(0, 0);
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // navToggle events
    if (navToggle) {
      navToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMobileNav();
      });
    }

    // assegura que backToTop esteja acessível via teclado
    if (backToTopBtn) backToTopBtn.setAttribute('aria-label', backToTopBtn.getAttribute('title') || 'Voltar ao topo');

    // ativa estado inicial de active link (fallback)
    handleHeaderOnScroll();

    // safe init de funções externas (ex.: particles libs)
    if (typeof initParticles === 'function') {
      try { initParticles(); } catch (e) { /* ignore */ }
    }

    // log opcional
    // console.log('script.js inicializado');
  }

  /* ---------- pequenas ligações: smooth anchors (separado porque usado dentro) ---------- */
  function initSmoothAnchors() {
    // já implementado acima? usamos delegation aqui
    document.addEventListener('click', function (ev) {
      const a = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      ev.preventDefault();
      const rect = target.getBoundingClientRect();
      const top = Math.max(0, rect.top + window.scrollY - headerHeight - 8);
      if (isReducedMotion) window.scrollTo(0, top);
      else window.scrollTo({ top, behavior: 'smooth' });
      // close mobile nav if open
      if (document.body.classList.contains('nav-open')) closeMobileNav();
      // focus target for a11y
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  // inicializa quando DOM pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
