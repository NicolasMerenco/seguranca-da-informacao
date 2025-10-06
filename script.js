(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* -------------------------
     Smooth scroll para âncoras
  ------------------------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const href = a.getAttribute("href");
    const el = document.querySelector(href);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveLink(href);
  });

  /* -------------------------
     Menu links ativos
  ------------------------- */
  const sections = $$("section[id]");
  const navLinks = $$("nav a");

  function updateActiveLinkScroll() {
    const fromTop = window.scrollY + 120;
    const current = sections.find(
      s => s.offsetTop <= fromTop && (s.offsetTop + s.offsetHeight) > fromTop
    );
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
  updateActiveLinkScroll();

  /* -------------------------
     Fade-up animações
  ------------------------- */
  const fadeElems = $$(".fade-up");
  if ("IntersectionObserver" in window && fadeElems.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) setTimeout(()=>entry.target.classList.add("in"), Math.random()*200);
      });
    }, { threshold: 0.15 });
    fadeElems.forEach(el => observer.observe(el));
  } else fadeElems.forEach(el => el.classList.add("in"));

  /* -------------------------
     Fade-up cards on load
  ------------------------- */
  window.addEventListener("load", () => {
    const cards = $$(".card, .overview-card, .icon-card");
    cards.forEach((c,i)=>{
      c.classList.add("fade-up");
      setTimeout(()=> c.classList.add("in"), 150 + i*60);
    });
  });

  /* -------------------------
     Partículas do vídeo
  ------------------------- */
  const videoCanvas = $("#particles");
  if(videoCanvas){
    const ctx = videoCanvas.getContext("2d");
    let W, H, DPR, t = 0;
    const NUM_PARTICLES = 70;
    const particles = [];
    let mouse = { x: -9999, y: -9999 };

    function resizeVideoCanvas(){
      DPR = window.devicePixelRatio || 1;
      W = videoCanvas.clientWidth;
      H = videoCanvas.clientHeight;
      videoCanvas.width = W * DPR;
      videoCanvas.height = H * DPR;
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }

    function createParticle(){
      const angle = Math.random() * Math.PI*2;
      const speed = 0.2 + Math.random();
      const radius = 2 + Math.random()*12;
      return {
        x: Math.random()*W,
        y: Math.random()*H,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        r: radius,
        alpha: 0.05 + Math.random()*0.45
      };
    }

    function initParticles(){ particles.length=0; for(let i=0;i<NUM_PARTICLES;i++) particles.push(createParticle()); }

    function drawParticles(){
      particles.forEach((p, idx)=>{
        p.x += p.vx;
        p.y += p.vy;

        // interação com mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if(dist<100){
          p.vx += dx*0.0005;
          p.vy += dy*0.0005;
        }

        // reaparecer bordas
        if(p.x<-50) p.x=W+50;
        if(p.x>W+50) p.x=-50;
        if(p.y<-50) p.y=H+50;
        if(p.y>H+50) p.y=-50;

        // círculo principal
        const grad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2);
        grad.addColorStop(0, `rgba(137,217,156,${p.alpha})`);
        grad.addColorStop(0.4, `rgba(59,140,110,${p.alpha*0.7})`);
        grad.addColorStop(1, "rgba(10,42,63,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fill();

        // linhas entre partículas próximas
        for(let j=idx+1;j<particles.length;j++){
          const p2 = particles[j];
          const d = Math.hypot(p.x-p2.x, p.y-p2.y);
          if(d<100){
            ctx.strokeStyle = `rgba(59,140,110,${(0.2*(100-d)/100).toFixed(2)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x,p.y);
            ctx.lineTo(p2.x,p2.y);
            ctx.stroke();
          }
        }
      });
    }

    function drawWave(){
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      const amp = Math.min(20,H*0.05);
      const freq = 0.0045;
      ctx.moveTo(0,H*0.65);
      for(let x=0;x<=W;x+=16){
        const y = H*0.65 + Math.sin((x*freq)+t*0.015)*amp;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H);
      ctx.lineTo(0,H);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0,H*0.55,0,H);
      grad.addColorStop(0,"rgba(22,71,115,0.06)");
      grad.addColorStop(1,"rgba(30,89,89,0.04)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    function renderVideoCanvas(){
      ctx.clearRect(0,0,W,H);
      drawParticles();
      drawWave();
      t++;
      requestAnimationFrame(renderVideoCanvas);
    }

    videoCanvas.addEventListener("mousemove", e=>{
      const rect = videoCanvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    videoCanvas.addEventListener("mouseleave", ()=>{ mouse.x=-9999; mouse.y=-9999; });

    function startVideoCanvas(){ resizeVideoCanvas(); initParticles(); renderVideoCanvas(); }
    window.addEventListener("resize", debounce(startVideoCanvas,150));
    setTimeout(startVideoCanvas,150);
  }

  /* -------------------------
     Partículas de fundo
  ------------------------- */
  const bgCanvas = $("#backgroundParticles");
  if(bgCanvas){
    const ctx = bgCanvas.getContext("2d");
    let W = window.innerWidth;
    let H = window.innerHeight;
    let particles = [];
    const NUM_PARTICLES = 50;

    for(let i=0;i<NUM_PARTICLES;i++){
      particles.push({
        x: Math.random()*W,
        y: Math.random()*H,
        r: 1 + Math.random()*3,
        vx: (Math.random()-0.5)*0.2,
        vy: (Math.random()-0.5)*0.2,
        alpha: 0.05 + Math.random()*0.2
      });
    }

    function resizeBg(){ W=window.innerWidth; H=window.innerHeight; bgCanvas.width=W; bgCanvas.height=H; }
    window.addEventListener("resize", resizeBg);
    resizeBg();

    function drawBg(){
      ctx.clearRect(0,0,W,H);
      particles.forEach(p=>{
        p.x += p.vx;
        p.y += p.vy;
        if(p.x<0)p.x=W;
        if(p.x>W)p.x=0;
        if(p.y<0)p.y=H;
        if(p.y>H)p.y=0;

        ctx.fillStyle = `rgba(30,150,100,${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fill();
      });
      requestAnimationFrame(drawBg);
    }
    drawBg();
  }

  /* -------------------------
     Utilitários
  ------------------------- */
  function debounce(fn, wait=100){
    let t;
    return function(){ clearTimeout(t); t=setTimeout(()=>fn.apply(this, arguments), wait);}
  }
  function throttle(fn, wait=100){
    let last=0;
    return function(){
      const now = Date.now();
      if(now - last >= wait){
        last = now;
        fn.apply(this, arguments);
      }
    }
  }

})();
