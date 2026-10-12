'use strict';

// ═══════════════════════════════════════
// REDUCED MOTION CHECK
// ═══════════════════════════════════════
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;



// ═══════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════
(function initReveal() {
  if (prefersReducedMotion) return;

  const targets = document.querySelectorAll([
    '#about',
    '#projects',
    '#skills',
    '#contact',
    '.proj-featured',
    '.proj-card',
    '.wip-list li',
    '.skill-row',
    '.social-btn',
    '.about-text',
    '.about-gallery',
  ].join(','));

  targets.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings slightly
        const delay = (i % 4) * 80;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  targets.forEach(el => io.observe(el));
})();

// ═══════════════════════════════════════
// ACTIVE NAV LINK
// ═══════════════════════════════════════
(function initActiveNav() {
  const sections   = Array.from(document.querySelectorAll('section[id]'));
  const navLinks   = document.querySelectorAll('.nav-links a');

  function update() {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 80) current = sec.id;
    });
    navLinks.forEach(a => {
      const active = a.getAttribute('href') === `#${current}`;
      a.style.color = active ? 'var(--text)' : '';
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// ═══════════════════════════════════════
// MWALI — MASCOT
// ═══════════════════════════════════════
(function initMwali() {
  const wrap    = document.getElementById('mwali-wrap');
  const caption = document.getElementById('mwali-caption');
  const svg     = document.getElementById('mwali-svg');
  const eyes    = document.getElementById('ml-eyes');
  if (!wrap || !caption || !svg) return;

  // Section config: which side Mwali enters from, which pose, what to say
  const SECTIONS = [
    { id: 'hero',     side: 'right', pose: 'mwali-pr', text: "oh! it's beginning. this is my favorite part." },
    { id: 'about',    side: 'left',  pose: 'mwali-pl', text: "signal. noise. long exposures. this person gets it." },
    { id: 'projects', side: 'right', pose: 'mwali-pr', text: "wait — okay look at this. an insurance engine with NO adjuster." },
    { id: 'skills',   side: 'left',  pose: 'mwali-pl', text: "Prophet! FastAPI! WorldQuant BRAIN! all of them!" },
    { id: 'contact',  side: 'right', pose: 'mwali-pr', text: "you should probably reach out. i'm just saying." },
  ];

  const HIDDEN_X = 140;   // px translateX when off-screen (right side)
  const SHOWN_X  = 0;     // px translateX when visible

  // Spring state for X position
  const sp = { cur: HIDDEN_X, vel: 0, target: HIDDEN_X };
  const K = 0.11, D = 0.70; // stiffness, damping

  let activeSection = null;
  let clickLock     = false;
  let currentSide   = 'right';

  function stepSpring() {
    const f = (sp.target - sp.cur) * K;
    sp.vel  = sp.vel * D + f;
    sp.cur += sp.vel;
  }

  // Work out which section owns the most viewport, return it + progress (0-1)
  function getActiveSection() {
    const vh = window.innerHeight;
    let best = null, bestCoverage = 0;
    for (const sec of SECTIONS) {
      const el = document.getElementById(sec.id);
      if (!el) continue;
      const r   = el.getBoundingClientRect();
      const top = Math.max(0, r.top);
      const bot = Math.min(vh, r.bottom);
      const cov = Math.max(0, bot - top) / vh;
      if (cov > bestCoverage) { bestCoverage = cov; best = sec; }
    }
    return bestCoverage > 0.18 ? { sec: best, cov: bestCoverage } : null;
  }

  function clearPoses() {
    wrap.classList.remove('mwali-pr','mwali-pl','mwali-excited','mwali-wave');
  }

  function tick() {
    const hit = getActiveSection();

    if (hit) {
      // Map coverage (0.18 → 0.55+) to x (HIDDEN → SHOWN)
      const progress = Math.min(1, (hit.cov - 0.18) / 0.37);
      sp.target = HIDDEN_X + (SHOWN_X - HIDDEN_X) * progress;
    } else {
      sp.target = HIDDEN_X;
    }

    if (prefersReducedMotion) {
      sp.cur = sp.target;
    } else {
      stepSpring();
    }

    wrap.style.transform = `translateX(${sp.cur}px)`;

    // Activate section when mostly visible
    if (hit && hit.cov > 0.42) {
      const sec = hit.sec;
      if (sec !== activeSection) {
        activeSection = sec;

        // Side positioning
        if (sec.side !== currentSide) {
          currentSide = sec.side;
          if (sec.side === 'left') {
            wrap.classList.add('mwali-left');
          } else {
            wrap.classList.remove('mwali-left');
          }
        }

        // Pose
        clearPoses();
        wrap.classList.add(sec.pose);
        wrap.classList.add('mwali-interactive');

        // Caption
        caption.textContent = sec.text;
        caption.classList.add('mwali-cap-show');
      }
    } else if (!hit || hit.cov < 0.2) {
      if (activeSection) {
        activeSection = null;
        clearPoses();
        caption.classList.remove('mwali-cap-show');
        wrap.classList.remove('mwali-interactive');
      }
    }

    requestAnimationFrame(tick);
  }

  tick();

  // Hover — excited pose
  svg.addEventListener('mouseenter', () => {
    if (!activeSection) return;
    clearPoses();
    wrap.classList.add('mwali-excited');
  });
  svg.addEventListener('mouseleave', () => {
    if (!activeSection) return;
    clearPoses();
    wrap.classList.add(activeSection.pose);
  });

  // Click — wave once
  svg.addEventListener('click', () => {
    if (clickLock || !activeSection) return;
    clickLock = true;
    clearPoses();
    wrap.classList.add('mwali-wave');
    setTimeout(() => {
      clearPoses();
      if (activeSection) wrap.classList.add(activeSection.pose);
      clickLock = false;
    }, 650);
  });

  // Eye tracking — follows cursor subtly
  if (!prefersReducedMotion && eyes) {
    document.addEventListener('mousemove', (e) => {
      const r  = svg.getBoundingClientRect();
      const cx = r.left + r.width  * 0.5;
      const cy = r.top  + r.height * 0.41;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.min(1, Math.sqrt(dx*dx + dy*dy) / 320);
      const ang  = Math.atan2(dy, dx);
      eyes.style.transform = `translate(${Math.cos(ang)*dist*2.2}px,${Math.sin(ang)*dist*2.2}px)`;
    }, { passive: true });
  }
})();

// ═══════════════════════════════════════
// MINI MWALI — PROJECT HOVER TOOLTIPS
// ═══════════════════════════════════════
(function initMiniMwali() {
  const wrap   = document.getElementById('mwali-mini-wrap');
  const bubble = document.getElementById('mwali-mini-bubble');
  if (!wrap || !bubble) return;

  // What Mwali says about each project
  const LINES = {
    'proj-idcs':      "no adjuster. no forms. income drops → payout fires. that's it.",
    'proj-dip':       "extracted the actuarial core so anyone can plug it in. clean.",
    'proj-farehaven': "millennials deserve good events too. FastAPI + Vercel, shipped.",
    'proj-ttech':     "solo build. scoped it, designed it, deployed it. done.",
    'proj-emotions':  "lower the friction on human connection. that's the whole mission.",
    'proj-tenthline': "every 10th line, stamped. courts love it. took real patience.",
  };

  const MINI_W = 52;   // SVG width in px
  const MINI_H = 84;   // SVG height in px
  const BUBBLE_GAP = 8;

  let hideTimer = null;

  function showFor(card) {
    const id   = card.id;
    const text = LINES[id];
    if (!text) return;

    clearTimeout(hideTimer);

    // Position: centered above the card
    const r   = card.getBoundingClientRect();
    const bw  = 200; // max bubble width
    const bh  = 60;  // estimated bubble height
    const totalH = bh + BUBBLE_GAP + MINI_H;

    let left = r.left + r.width / 2 - MINI_W / 2;
    let top  = r.top - totalH - 10;

    // If too high, flip below
    if (top < 8) top = r.bottom + 10;

    // Clamp horizontally inside viewport
    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));

    wrap.style.left = left + 'px';
    wrap.style.top  = top  + 'px';

    bubble.textContent = text;
    wrap.classList.add('mini-point');
    wrap.classList.add('mini-visible');
  }

  function hide() {
    hideTimer = setTimeout(() => {
      wrap.classList.remove('mini-visible');
      // Reset pose after fade
      setTimeout(() => wrap.classList.remove('mini-point'), 220);
    }, 80);
  }

  // Attach to all project cards + the featured article
  const cards = document.querySelectorAll('.proj-card, .proj-featured');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => showFor(card));
    card.addEventListener('mouseleave', hide);
    card.addEventListener('focusin',   () => showFor(card));
    card.addEventListener('focusout',  hide);
  });

  // Reposition on scroll / resize while visible
  window.addEventListener('scroll', () => {
    if (wrap.classList.contains('mini-visible')) {
      const hovered = document.querySelector('.proj-card:hover, .proj-featured:hover');
      if (hovered) showFor(hovered);
    }
  }, { passive: true });
})();
