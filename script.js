(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* -------------------------
     Smooth scroll para âncoras (apenas hrefs iniciando com #)
  ------------------------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href === "#") return;
    const el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveLink(href);
  });

  /* -------------------------
     Menu links ativos (scroll spy)
  ------------------------- */
  const sections = $$("section[id]");
  const navLinks = $$("nav a");

  function updateActiveLinkScroll() {
    if (!sections.length) return; // nada a fazer em páginas sem seções
    const fromTop = window.scrollY + 120;
    let current = null;
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const top = s.offsetTop;
      const bottom = top + s.offsetHeight;
      if (top <= fromTop && bottom > fromTop) { current = s; break; }
    }
    navLinks.forEach(a => a.classList.remove("active"));
    if (current) {
      const id = "#" + current.id;
      const active = navLinks.find(a => a.getAttribute("href") === id);
      if (active) active.classList.add("active");
    }
  }

  function setActiveLink(href) {
    navLinks.forEach(a => a.classList.remove("active"));
    const active = navLinks.find(a => a.getAttribute("href") === href);
    if (active) active.classList.add("active");
  }

  window.addEventListener("scroll", throttle(updateActiveLinkScroll, 100));
  window.addEventListener("resize", throttle(updateActiveLinkScroll, 300));
  // roda uma vez após o DOM estar pronto
  document.addEventListener("DOMContentLoaded", updateActiveLinkScroll);

  /* -------------------------
     Fade-up animações com IntersectionObserver (ou fallback)
  ------------------------- */
  const fadeElems = $$(".fade-up");
  if ("IntersectionObserver" in window && fadeElems.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // pequena aleatoriedade para stagger
          setTimeout(() => entry.target.classList.add("in"), Math.random() * 200);
        }
      });
    }, { threshold: 0.15 });
    fadeElems.forEach(el => observer.observe(el));
  } else {
    fadeElems.forEach(el => el.classList.add("in"));
  }

  /* -------------------------
     Animação de cards no load (se houver)
  ------------------------- */
  window.addEventListener("load", () => {
    const cards = $$(".card, .overview-card, .icon-card");
    cards.forEach((c, i) => {
      c.classList.add("fade-up");
      setTimeout(() => c.classList.add("in"), 150 + i * 60);
    });
  });

  /* -------------------------
     Utilitários: debounce / throttle
  ------------------------- */
  function debounce(fn, wait = 100) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, arguments), wait);
    };
  }
  function throttle(fn, wait = 100) {
    let last = 0;
    return function () {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  /* -------------------------
     Função utilitária: lê variáveis CSS com fallback
  ------------------------- */
  function cssVar(name, fallback) {
    try {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name);
      return val ? val.trim() : fallback;
    } catch (e) {
      return fallback;
    }
  }

  /* -------------------------
     Partículas do vídeo (canvas dentro da .video-wrapper)
     - usa devicePixelRatio corretamente
     - tolerante à ausência do canvas
  ------------------------- */
  (function setupVideoParticles() {
    const videoCanvas = $("#particles");
    if (!videoCanvas) return;

    const ctx = videoCanvas.getContext("2d");
    if (!ctx) return;

    let DPR = window.devicePixelRatio || 1;
    let W = 0, H = 0;
    let t = 0;
    const NUM_PARTICLES = 70;
    const particles = [];
    let mouse = { x: -9999, y: -9999 };

    // cor baseada em variável CSS (fallback azul-esverdeado)
    const particleColorA = cssVar("--particle-video-color", "rgba(59,140,110,0.6)");

    function resizeCanvas() {
      DPR = window.devicePixelRatio || 1;
      // clientWidth/clientHeight dão tamanho CSS real (sem DPR)
      W = Math.max(100, videoCanvas.clientWidth);
      H = Math.max(60, videoCanvas.clientHeight);
      videoCanvas.width = Math.round(W * DPR);
      videoCanvas.height = Math.round(H * DPR);
      videoCanvas.style.width = W + "px";
      videoCanvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function createParticle() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.15 + Math.random() * 0.9;
      const radius = 2 + Math.random() * 10;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: radius,
        alpha: 0.05 + Math.random() * 0.45
      };
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < NUM_PARTICLES; i++) particles.push(createParticle());
    }

    function drawParticles() {
      // reduzir chamadas caras: cache length
      const len = particles.length;
      for (let i = 0; i < len; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // interação com mouse (se dentro do canvas)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          const force = (120 - dist) / 120 * 0.0009;
          p.vx += dx * force;
          p.vy += dy * force;
        }

        // wrap-around suave
        if (p.x < -60) p.x = W + 60;
        if (p.x > W + 60) p.x = -60;
        if (p.y < -60) p.y = H + 60;
        if (p.y > H + 60) p.y = -60;

        // gradiente circular (usa variável CSS para controlar cor)
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        // derivar tons a partir de particleColorA (usamos RGBA fornecida no CSS)
        // fallback já é um rgba string
        grad.addColorStop(0, `rgba(255,255,255,${Math.min(0.95, p.alpha + 0.15)})`);
        grad.addColorStop(0.35, particleColorA.replace(/,[^)]+\)/, `,${Math.max(0.15, p.alpha)})`));
        grad.addColorStop(1, `rgba(10,42,63,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.8 + Math.random() * 0.4), 0, Math.PI * 2);
        ctx.fill();

        // linhas entre partículas próximas (O(n^2) mas com baixa constante e poucas partículas)
        for (let j = i + 1; j < len; j++) {
          const p2 = particles[j];
          const d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 110) {
            const alphaLine = (0.16 * (110 - d) / 110) * Math.min(1, (p.alpha + p2.alpha));
            ctx.strokeStyle = `rgba(22,71,115,${alphaLine.toFixed(3)})`;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    }

    function drawWave() {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      const amp = Math.min(22, H * 0.05);
      const freq = 0.0045;
      ctx.moveTo(0, H * 0.65);
      for (let x = 0; x <= W; x += 16) {
        const y = H * 0.65 + Math.sin((x * freq) + t * 0.015) * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, H * 0.55, 0, H);
      grad.addColorStop(0, "rgba(22,71,115,0.05)");
      grad.addColorStop(1, "rgba(30,89,89,0.03)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    function render() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      drawParticles();
      drawWave();
      t++;
      requestAnimationFrame(render);
    }

    // eventos do mouse
    videoCanvas.addEventListener("mousemove", (e) => {
      const rect = videoCanvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left);
      mouse.y = (e.clientY - rect.top);
    });
    videoCanvas.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });

    function start() {
      resizeCanvas();
      initParticles();
      // garantir que não haja múltiplos loops ao re-executar
      requestAnimationFrame(render);
    }

    window.addEventListener("resize", debounce(() => {
      // recalcula e reinicia partículas para ajustar densidade se precisar
      resizeCanvas();
      initParticles();
    }, 150));

    // kickoff
    start();
  })(); // fim setupVideoParticles

  /* -------------------------
     Partículas de fundo (canvas full-screen)
     - também usa devicePixelRatio e variáveis CSS
  ------------------------- */
  (function setupBackgroundParticles() {
    const bgCanvas = $("#backgroundParticles");
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext("2d");
    if (!ctx) return;

    let DPR = window.devicePixelRatio || 1;
    let W = window.innerWidth;
    let H = window.innerHeight;
    const NUM_PARTICLES = 50;
    let particles = [];

    // cores a partir do CSS
    const particleBgColor = cssVar("--particle-bg", "rgba(22,71,115,0.18)");
    const particleFillFallback = "rgba(22,71,115,0.12)";

    function resize() {
      DPR = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      bgCanvas.width = Math.round(W * DPR);
      bgCanvas.height = Math.round(H * DPR);
      bgCanvas.style.width = W + "px";
      bgCanvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function init() {
      particles = [];
      for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 1 + Math.random() * 3,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          alpha: 0.04 + Math.random() * 0.25
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        ctx.beginPath();
        // tenta usar a variável CSS, senão fallback
        ctx.fillStyle = particleBgColor || particleFillFallback;
        ctx.globalAlpha = p.alpha;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(draw);
    }

    window.addEventListener("resize", debounce(() => {
      resize();
      init();
    }, 120));

    // inicializa
    resize();
    init();
    draw();
  })(); // fim setupBackgroundParticles

})(); // fim IIFE
