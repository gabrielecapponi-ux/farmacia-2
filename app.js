const root = document.documentElement;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 820px)');
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const animations = new Map();
const clamp = value => Math.min(1, Math.max(0, value));
root.classList.add('has-js');

// Navigation remains ordinary links. Closing a menu never waits for motion.
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const setMenu = open => {
  if (!menu || !nav) return;
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
};
if (menu && nav) {
  menu.hidden = false;
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menu.focus();
    }
  });
  mobile.addEventListener('change', () => setMenu(false));
}
document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  if (!event.target.closest('.site-header')) setMenu(false);
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.getElementById(link.hash.slice(1));
  setMenu(false);
  if (target) {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
});

const cancelMotion = () => {
  animations.forEach(animation => animation.cancel());
  animations.clear();
};
document.addEventListener('focusin', event => {
  animations.forEach((animation, node) => {
    if (node.contains(event.target)) { animation.cancel(); animations.delete(node); }
  });
});

// One short reveal per visual. Content is visible even before the observer runs.
if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveals.unobserve(entry.target);
      const node = entry.target;
      if (preference.matches || document.hidden || !node.animate || node.contains(document.activeElement)) continue;
      const animation = node.animate([
        { opacity: .72, transform: 'translateY(22px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
      animations.set(node, animation);
      const forget = () => { if (animations.get(node) === animation) animations.delete(node); };
      animation.addEventListener('finish', forget, { once: true });
      animation.addEventListener('cancel', forget, { once: true });
    }
  }, { threshold: .12 });
  document.querySelectorAll('.visual-reveal').forEach(node => reveals.observe(node));
}

// The film follows native page scrolling. There is no autoplay loop, wheel
// interception or render loop: one pending frame and one pending video seek.
const stage = document.querySelector('[data-film-stage]');
const sticky = document.querySelector('[data-film-sticky]');
const video = document.querySelector('[data-hero-video]');
const toggle = document.querySelector('[data-motion-toggle]');
const status = document.querySelector('[data-film-status]');
const progressBar = document.querySelector('[data-film-progress]');
const chapters = [...document.querySelectorAll('[data-film-chapter]')];
let frame = 0;
let nearFilm = false;
let inFilm = true;
let paused = false;
let failed = false;
let filmState = '';
let progress = 0;
let desiredTime = 0;
let currentSource = '';
const savingData = () => Boolean(connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || ''));
const allowed = () => !preference.matches && !savingData();
const setFilmState = next => {
  if (!stage || next === filmState) return;
  filmState = next;
  stage.dataset.filmState = next;
  if (status) status.textContent = {
    idle: 'Scorri per esplorare',
    loading: 'Il film si sta preparando',
    ready: 'Scorri per esplorare',
    paused: 'Movimento in pausa',
    reduced: 'Movimento ridotto: immagine fissa',
    saving: 'Risparmio dati: immagine fissa',
    error: 'Video non disponibile: immagine fissa'
  }[next];
  if (toggle) {
    const disabled = ['reduced', 'saving', 'error'].includes(next);
    toggle.disabled = disabled;
    toggle.setAttribute('aria-pressed', String(paused || disabled));
    toggle.textContent = next === 'reduced' ? 'Animazioni ridotte'
      : next === 'saving' ? 'Risparmio dati'
      : next === 'error' ? 'Immagine fissa'
      : paused ? 'Riprendi il movimento' : 'Ferma il movimento';
  }
};
const filmGeometry = () => {
  if (!stage || !sticky) return { top: 0, range: 0 };
  const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
  const top = window.scrollY + stage.getBoundingClientRect().top - stickyTop;
  return { top, range: Math.max(0, stage.offsetHeight - sticky.offsetHeight) };
};
const seek = () => {
  if (!video || !allowed() || paused || failed || document.hidden || !inFilm || video.seeking || video.readyState < 1 || !Number.isFinite(video.duration)) return;
  if (Math.abs(video.currentTime - desiredTime) < .035) return;
  try { video.currentTime = desiredTime; } catch { /* Keep the poster until media is seekable. */ }
};
const updateFilm = () => {
  frame = 0;
  if (!stage || !sticky) return;
  const geometry = filmGeometry();
  progress = geometry.range ? clamp((window.scrollY - geometry.top) / geometry.range) : 0;
  stage.style.setProperty('--film-progress', progress.toFixed(4));
  if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
  const index = Math.min(2, Math.floor(progress * 3));
  chapters.forEach((chapter, i) => {
    chapter.classList.toggle('is-active', i === index);
    if (i === index) chapter.setAttribute('aria-current', 'step');
    else chapter.removeAttribute('aria-current');
  });
  if (video && Number.isFinite(video.duration)) {
    desiredTime = progress * Math.max(0, video.duration - .05);
    seek();
  }
};
const scheduleFilm = () => { if (!frame) frame = requestAnimationFrame(updateFilm); };
const loadFilm = () => {
  if (!video || !stage || !allowed() || !nearFilm || failed) return;
  const source = mobile.matches ? video.dataset.srcMobile : video.dataset.srcDesktop;
  if (!source || source === currentSource) return;
  currentSource = source;
  stage.classList.remove('is-film-ready');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = source;
  setFilmState(paused ? 'paused' : 'loading');
  video.load();
};
const updatePreference = () => {
  root.classList.toggle('reduced-motion', preference.matches);
  root.classList.toggle('saving-data', savingData());
  if (!allowed()) {
    cancelMotion();
    if (video) {
      video.pause();
      // Detaching the source also aborts a download on a live preference change.
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        currentSource = '';
        video.load();
      }
    }
    stage?.classList.remove('is-film-ready');
    setFilmState(preference.matches ? 'reduced' : 'saving');
  } else {
    setFilmState(failed ? 'error' : paused ? 'paused' : video?.readyState >= 2 ? 'ready' : 'idle');
    loadFilm();
  }
  scheduleFilm();
};
if (stage && sticky && video) {
  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      if (!allowed() || failed) return;
      paused = !paused;
      video.pause();
      setFilmState(paused ? 'paused' : video.readyState >= 2 ? 'ready' : 'loading');
      if (!paused) { loadFilm(); scheduleFilm(); }
    });
  }
  const decoded = () => {
    if (!allowed() || failed || !currentSource) return;
    stage.classList.add('is-film-ready');
    setFilmState(paused ? 'paused' : 'ready');
    scheduleFilm();
  };
  video.addEventListener('loadedmetadata', scheduleFilm);
  video.addEventListener('loadeddata', decoded);
  video.addEventListener('seeked', decoded);
  video.addEventListener('error', () => {
    if (!currentSource || !allowed()) return;
    failed = true;
    stage.classList.remove('is-film-ready');
    setFilmState('error');
    scheduleFilm();
  });
  chapters.forEach((chapter, i) => {
    chapter.hidden = false;
    chapter.addEventListener('click', () => {
      const geometry = filmGeometry();
      window.scrollTo({ top: geometry.top + geometry.range * i / Math.max(1, chapters.length - 1), behavior: allowed() ? 'smooth' : 'instant' });
    });
  });
  if ('IntersectionObserver' in window) {
    const preload = new IntersectionObserver(entries => {
      nearFilm = entries[0].isIntersecting;
      if (nearFilm) loadFilm();
    }, { rootMargin: '240px 0px' });
    preload.observe(stage);
    const visibility = new IntersectionObserver(entries => {
      inFilm = entries[0].isIntersecting;
      if (!inFilm) video.pause();
      else scheduleFilm();
    });
    visibility.observe(sticky);
  } else { nearFilm = true; loadFilm(); }
  window.addEventListener('scroll', scheduleFilm, { passive: true });
  window.addEventListener('resize', scheduleFilm, { passive: true });
  mobile.addEventListener('change', () => { loadFilm(); scheduleFilm(); });
}
preference.addEventListener('change', updatePreference);
connection?.addEventListener?.('change', updatePreference);
updatePreference();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelMotion(); video?.pause(); }
  else scheduleFilm();
});
window.addEventListener('pagehide', () => {
  cancelMotion();
  video?.pause();
  cancelAnimationFrame(frame);
  frame = 0;
});
window.addEventListener('pageshow', scheduleFilm);

// A native touch-scroll gallery with ordinary buttons and keyboard support.
document.querySelectorAll('[data-gallery]').forEach(gallery => {
  const controls = [...document.querySelectorAll('[data-gallery-prev], [data-gallery-next]')]
    .filter(button => !button.getAttribute('aria-controls') || button.getAttribute('aria-controls') === gallery.id);
  const update = () => {
    const end = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
    controls.forEach(button => { button.disabled = button.hasAttribute('data-gallery-prev') ? gallery.scrollLeft <= 2 : gallery.scrollLeft >= end - 2; });
  };
  const move = direction => {
    gallery.scrollBy({ left: direction * gallery.clientWidth * .8, behavior: preference.matches ? 'instant' : 'smooth' });
  };
  controls.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => move(button.hasAttribute('data-gallery-prev') ? -1 : 1));
  });
  gallery.addEventListener('keydown', event => {
    if (event.target !== gallery) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  gallery.addEventListener('scroll', update, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(gallery);
  update();
});

// Reserve actual sticky header/dock sizes, including safe areas and large text.
const header = document.querySelector('.site-header');
const dock = document.querySelector('.mobile-contact-dock');
const measure = () => {
  root.style.setProperty('--header-space', `${header?.getBoundingClientRect().height || 0}px`);
  root.style.setProperty('--dock-space', `${dock?.getBoundingClientRect().height || 0}px`);
  scheduleFilm();
};
if ('ResizeObserver' in window) {
  const sizing = new ResizeObserver(measure);
  if (header) sizing.observe(header);
  if (dock) sizing.observe(dock);
  if (stage) sizing.observe(stage);
}
measure();
