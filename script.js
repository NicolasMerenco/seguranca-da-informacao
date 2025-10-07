/* -------------------------
   script.js - Header fix, offset dinâmico, particles, animações
   Substitua todo o arquivo atual por este.
------------------------- */

(() => {
  /* -------------------------
     SELECTORS E VARIÁVEIS GLOBAIS
  ------------------------- */
  const header = document.querySelector('header');
  const navLinks = document.querySelectorAll('#navList a');
  const sections = document.querySelectorAll('section[id]');
  const backToTopBtn = document.getElementById('backToTop');
  const canvasBg = document.getElementById('backgroundParticles');
  const canvasVideo = document.getElementById('particles');

  let headerHeight = 0;
  let lastScrollY = window.scrollY;
  let ticking = false;

  /* -------------------------
     FUNÇÃO: Atualiza altura do header e aplica padding-top ao body
     -> evita que o header "coma" o conteúdo
  ------------------------- */
  function updateHeaderHeight() {
    headerHeight = Math.ceil(header.getBoundingClientRect().height);
    // aplica padding-top ao <main> ou ao body para deslocar o conteúdo
    const main = document.querySelector('main');
    if (main) main.style.paddingTop = (headerHeight + 10) + 'px';
    // define também uma variável CSS (útil para o CSS)
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
  }

  /* -------------------------
     FUNÇÃO: Mostrar / esconder header ao rolar
     -> comportamento: esconder ao rolar para baixo, mostrar ao rolar para cima
  ------------------------- */
  function handleScrollHeader() {
    const currentY = window.scrollY;
    // adicionar classe 'scrolled' quando passou um limite (apenas visual)
    if (currentY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    // esconder em scroll down, mostrar em scroll up (com threshold)
    const delta = currentY - lastScrollY;
    if (Math.abs(delta) < 10) { lastScrollY = currentY; return; } // muito pequeno, ignora

    if (delta > 0 && currentY > headerHeight + 80) {
      // rolando para baixo
      header.classList.add('hidden'); // CSS -> transform: translateY(-100%)
    } else {
      // rolando para cima
      header.classList.remove('hidden');
    }
    lastScrollY = currentY;
  }

  /* -------------------------
     FUNÇÃO: Active link baseado em scroll (com offset do header)
  ------------------------- */
  function activateMenuOnScroll() {
    const scrollPos = window.scrollY + headerHeight + 12; // considera header
    sections.forEach(section => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector(`#navList a[href="#${id}"]`);
      if (!link) return;
      if (scrollPos >= top && scrollPos < bottom) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* -------------------------
     SMOOTH SCROLL PARA LINKS (CONSIDERA HEADER)
  ------------------------- */
  function initSmoothScrollLinks() {
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return; // externo
        e.preventDefault();
        const id = href.substring(1);
        const target = document.getElementById(id);
        if (!target) return;
        const top = target.offsetTop - headerHeight - 10;
        window.scrollTo({ top, behavior: 'smooth' });
        // em mobile, após clicar, ocultar o header momentaneamente (se estiver visível)
        header.classList.remove('hidden');
      });
    });
  }

  /* -------------------------
     BOTÃO VOLTAR AO TOPO (fade in/out)
  ------------------------- */
  function initBackToTop() {
    // mostra/esconde com classe para permitir animação via CSS
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) backToTopBtn.classList.add('visible');
      else backToTopBtn.classList.remove('visible');
    });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* -------------------------
     FADE-UP: IntersectionObserver para revelar seções
  ------------------------- */
  function initFadeUp() {
    const faders = document.querySelectorAll('.fade-up');
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    faders.forEach(el => obs.observe(el));
  }

  /* -------------------------
     PARTICULAS OTIMIZADAS - FUNDO
     Nota: simples, leve, usa requestAnimationFrame e resize handler
  ------------------------- */
  function initBgParticles() {
    if (!canvasBg) return;
    const ctx = canvasBg.getContext('2d');
    let particles = [];
    let W = 0, H = 0;
    const COUNT = Math.max(40, Math.floor(window.innerWidth / 25)); // escala com largura

    function setup() {
      W = canvasBg.width = window.innerWidth;
      H = canvasBg.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random()*W,
          y: Math.random()*H,
          r: Math.random()*1.8 + 0.6,
          vx: (Math.random()-0.5)*0.8,
          vy: (Math.random()-0.5)*0.8,
          a: 0.15 + Math.random()*0.5
        });
      }
    }

    function step() {
      ctx.clearRect(0,0,W,H);
      for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(165,167,214,${p.a})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }
      requestAnimationFrame(step);
    }

    setup();
    step();
    window.addEventListener('resize', () => {
      // debounce leve
      clearTimeout(window._bgResizeTimer);
      window._bgResizeTimer = setTimeout(setup, 120);
    });
  }

  /* -------------------------
     PARTICULAS SOBRE O VÍDEO (opcional)
  ------------------------- */
  function initVideoParticles() {
    if (!canvasVideo) return;
    const ctx = canvasVideo.getContext('2d');
    let particles = [];
    let W = 0, H = 0;
    const COUNT = 28;

    function setup() {
      W = canvasVideo.width = canvasVideo.offsetWidth || 600;
      H = canvasVideo.height = canvasVideo.offsetHeight || 340;
      particles = [];
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random()*W,
          y: Math.random()*H,
          r: Math.random()*1.2 + 0.4,
          vx: (Math.random()-0.5)*0.4,
          vy: (Math.random()-0.5)*0.4,
          a: 0.06 + Math.random()*0.35
        });
      }
    }

    function step() {
      ctx.clearRect(0,0,W,H);
      for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(160,200,200,${p.a})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }
      requestAnimationFrame(step);
    }

    setup();
    step();
    window.addEventListener('resize', () => {
      clearTimeout(window._vidResizeTimer);
      window._vidResizeTimer = setTimeout(setup, 120);
    });
  }

  /* -------------------------
     INICIALIZAÇÃO E EVENTOS PRINCIPAIS
  ------------------------- */
  function onScrollMain() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScrollHeader();
        activateMenuOnScroll();
        // optionally other scroll-related things
        ticking = false;
      });
      ticking = true;
    }
  }

  function onResizeMain() {
    updateHeaderHeight();
    // re-ativa observadores se necessário
  }

  function init() {
    // pequenas segurancas
    if (!header) return;

    updateHeaderHeight();
    initSmoothScrollLinks();
    initBackToTop();
    initFadeUp();
    initBgParticles();
    initVideoParticles();

    // listeners
    window.addEventListener('scroll', onScrollMain, { passive: true });
    window.addEventListener('resize', onResizeMain);

    // inicial ativacao de menu (estado inicial)
    activateMenuOnScroll();

    // accessibility: allow keyboard "Home" quick scroll to top
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Home') window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // remover display none do botão (caso CSS controle via classes)
    if (backToTopBtn) backToTopBtn.classList.remove('visible');
    console.log('script.js inicializado com sucesso ✅');
  }

  // rodar init quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ====== MOBILE NAV TOGGLE (cole no final do script.js) ====== */
(() => {
  const body = document.body;
  const header = document.querySelector('header');
  const container = document.querySelector('.header-inner');
  if (!header || !container) return;

  // criar botão toggle se não existir (insere antes do nav)
  let toggle = document.querySelector('.nav-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-label', 'Abrir menu');
    toggle.innerHTML = `<svg width="22" height="14" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="22" height="2" rx="1" fill="currentColor"/><rect y="6" width="22" height="2" rx="1" fill="currentColor"/><rect y="12" width="22" height="2" rx="1" fill="currentColor"/></svg>`;
    // inserir antes do nav
    const nav = document.querySelector('nav');
    container.insertBefore(toggle, nav);
  }

  // criar overlay mobile nav se não existir
  let mobileNav = document.querySelector('.mobile-nav');
  if (!mobileNav) {
    mobileNav = document.createElement('nav');
    mobileNav.className = 'mobile-nav';
    mobileNav.setAttribute('aria-label', 'Menu móvel');
    // clonar o conteúdo do menu desktop (ul)
    const desktopUl = document.querySelector('#navList');
    const clone = desktopUl ? desktopUl.cloneNode(true) : document.createElement('ul');
    // remove bullets / keep structure
    clone.id = 'mobileNavList';
    mobileNav.appendChild(clone);

    // close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.setAttribute('aria-label', 'Fechar menu');
    closeBtn.innerHTML = '&times;';
    mobileNav.appendChild(closeBtn);

    document.body.appendChild(mobileNav);

    // close handler
    closeBtn.addEventListener('click', () => {
      body.classList.remove('nav-open');
      toggle.focus();
    });
  }

  // toggle open/close
  toggle.addEventListener('click', () => {
    if (body.classList.contains('nav-open')) {
      body.classList.remove('nav-open');
      toggle.setAttribute('aria-label', 'Abrir menu');
    } else {
      body.classList.add('nav-open');
      toggle.setAttribute('aria-label', 'Fechar menu');
      // foco no primeiro link do menu para acessibilidade
      const firstLink = mobileNav.querySelector('a');
      if (firstLink) firstLink.focus();
    }
  });

  // fechar menu ao clicar em um link (mobile)
  mobileNav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      body.classList.remove('nav-open');
    }
  });

  // tecla ESC fecha o menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) {
      body.classList.remove('nav-open');
      toggle.focus();
    }
  });

  // garantir que nav desktop reapareça corretamente ao redimensionar
  window.addEventListener('resize', () => {
    if (window.innerWidth > 880 && body.classList.contains('nav-open')) {
      body.classList.remove('nav-open');
    }
  });

})();
