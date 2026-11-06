const root = document.documentElement;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 820px)');
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const animations = new Map();
const clamp = value => Math.min(1, Math.max(0, value));
const header = document.querySelector('.site-header');
const dock = document.querySelector('.mobile-contact-dock');
root.classList.add('has-js');

// Ordinary links and immediate menu state remain usable during any animation.
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
const rememberAnimation = (node, animation) => {
  animations.get(node)?.cancel();
  animations.set(node, animation);
  const forget = () => { if (animations.get(node) === animation) animations.delete(node); };
  animation.addEventListener('finish', forget, { once: true });
  animation.addEventListener('cancel', forget, { once: true });
};
document.addEventListener('focusin', event => {
  animations.forEach((animation, node) => {
    if (node.contains(event.target)) { animation.cancel(); animations.delete(node); }
  });
});

// Reveals enhance an already visible page; focus and reduced motion cancel them.
if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveals.unobserve(entry.target);
      const node = entry.target;
      if (preference.matches || document.hidden || !node.animate || node.contains(document.activeElement)) continue;
      rememberAnimation(node, node.animate([
        { opacity: .76, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 540, easing: 'cubic-bezier(.22,1,.36,1)' }));
    }
  }, { threshold: .1 });
  document.querySelectorAll('.visual-reveal').forEach(node => reveals.observe(node));
}

const stage = document.querySelector('[data-film-stage]');
const sticky = document.querySelector('[data-film-sticky]');
const video = document.querySelector('[data-hero-video]');
const toggle = document.querySelector('[data-motion-toggle]');
const status = document.querySelector('[data-film-status]');
const progressBar = document.querySelector('[data-film-progress]');
const chapters = [...document.querySelectorAll('[data-film-chapter]')];
const navItems = [...document.querySelectorAll('.site-nav a[href^="#"]')]
  .map(link => ({ link, section: document.getElementById(link.hash.slice(1)) }))
  .filter(item => item.section);
const galleryMeasurements = [];
const galleryMotionStops = [];
let frame = 0;
let layoutDirty = true;
let geometry = { top: 0, range: 0 };
let navStops = [];
let headerHeight = 0;
let nearFilm = false;
let inFilm = true;
let paused = false;
let failed = false;
let filmState = '';
let progress = -1;
let desiredTime = 0;
let currentSource = '';
let currentChapter = -1;
let currentNav = null;
const savingData = () => Boolean(connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || ''));
const allowed = () => !preference.matches && !savingData();
const setPixelProperty = (element, name, value) => {
  const next = `${Math.ceil(value)}px`;
  if (element.style.getPropertyValue(name) !== next) element.style.setProperty(name, next);
};
const scheduleFilm = () => { if (!frame) frame = requestAnimationFrame(updateFilm); };
const invalidateLayout = () => { layoutDirty = true; scheduleFilm(); };
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
  invalidateLayout();
};

// Layout is measured only when it changes. A scroll frame uses these cached
// coordinates rather than reading computed styles or element boxes repeatedly.
function measureLayout() {
  layoutDirty = false;
  headerHeight = header?.getBoundingClientRect().height || 0;
  const dockHeight = dock?.getBoundingClientRect().height || 0;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  setPixelProperty(root, '--header-space', headerHeight);
  setPixelProperty(root, '--dock-space', dockHeight);
  if (stage && sticky) {
    const available = Math.max(0, viewportHeight - headerHeight - dockHeight - 24);
    const contentHeight = ['.film-top', '.film-copy', '.film-bottom']
      .reduce((total, selector) => total + (stage.querySelector(selector)?.getBoundingClientRect().height || 0), 96);
    setPixelProperty(stage, '--film-content-min', contentHeight);
    setPixelProperty(stage, '--film-available', available);
    const compact = available < 360 || contentHeight > available;
    root.classList.toggle('film-compact', compact);
    stage.classList.toggle('film-compact', compact);
    const stageTop = window.scrollY + stage.getBoundingClientRect().top;
    if (compact && allowed() && !failed) {
      // On short screens the film moves through the normal page flow, without
      // a tall pinned runway. Scroll still advances its four-second camera.
      geometry = { top: stageTop - available * .5, range: Math.max(1, stage.offsetHeight - available * .25) };
    } else {
      const stickyTop = parseFloat(getComputedStyle(sticky).top) || 0;
      geometry = { top: stageTop - stickyTop, range: Math.max(0, stage.offsetHeight - sticky.offsetHeight) };
    }
  }
  navStops = navItems.map(item => ({ ...item, top: window.scrollY + item.section.getBoundingClientRect().top }));
  galleryMeasurements.forEach(measure => measure());
}
const seek = () => {
  if (!video || !allowed() || paused || failed || document.hidden || !inFilm || video.seeking || video.readyState < 1 || !Number.isFinite(video.duration)) return;
  if (Math.abs(video.currentTime - desiredTime) < .035) return;
  try { video.currentTime = desiredTime; } catch { /* The poster stays until media is seekable. */ }
};
function updateFilm() {
  frame = 0;
  if (layoutDirty) measureLayout();
  const position = window.scrollY;
  const nextProgress = geometry.range ? clamp((position - geometry.top) / geometry.range) : 0;
  if (stage && nextProgress !== progress) {
    progress = nextProgress;
    stage.style.setProperty('--film-progress', progress.toFixed(4));
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    const index = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
    if (index !== currentChapter) {
      currentChapter = index;
      chapters.forEach((chapter, i) => {
        chapter.classList.toggle('is-active', i === index);
        if (i === index) chapter.setAttribute('aria-current', 'step');
        else chapter.removeAttribute('aria-current');
      });
    }
  }
  if (video && Number.isFinite(video.duration)) {
    desiredTime = Math.max(0, nextProgress) * Math.max(0, video.duration - .05);
    seek();
  }
  let active = null;
  for (const item of navStops) {
    if (item.top <= position + headerHeight + 100) active = item;
  }
  if (active?.link !== currentNav) {
    currentNav = active?.link || null;
    navItems.forEach(({ link }) => {
      if (link === currentNav) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}
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
    galleryMotionStops.forEach(stop => stop());
    if (video) {
      video.pause();
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
  invalidateLayout();
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
  video.addEventListener('loadedmetadata', invalidateLayout);
  video.addEventListener('loadeddata', decoded);
  video.addEventListener('seeked', decoded);
  video.addEventListener('error', () => {
    if (!currentSource || !allowed()) return;
    failed = true;
    stage.classList.remove('is-film-ready');
    setFilmState('error');
  });
  chapters.forEach((chapter, i) => {
    chapter.hidden = false;
    chapter.addEventListener('click', () => {
      if (layoutDirty) measureLayout();
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
  mobile.addEventListener('change', () => { loadFilm(); invalidateLayout(); });
}
preference.addEventListener('change', updatePreference);
connection?.addEventListener?.('change', updatePreference);
updatePreference();
window.addEventListener('scroll', scheduleFilm, { passive: true });
window.addEventListener('resize', invalidateLayout, { passive: true });
window.visualViewport?.addEventListener('resize', invalidateLayout, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelMotion(); video?.pause(); }
  else invalidateLayout();
});
window.addEventListener('pagehide', () => {
  cancelMotion();
  video?.pause();
  cancelAnimationFrame(frame);
  frame = 0;
});
window.addEventListener('pageshow', invalidateLayout);

// Native details change state immediately; the content receives a brief,
// interruptible opening transition. Closing never waits for an animation.
document.querySelectorAll('.service-details, .faq-item').forEach(details => {
  details.addEventListener('toggle', () => {
    const content = details.querySelector('.service-detail-content, .faq-answer')
      || [...details.children].find(child => child.tagName !== 'SUMMARY');
    if (content) {
      animations.get(content)?.cancel();
      if (details.open && !preference.matches && !document.hidden && content.animate && !content.contains(document.activeElement)) {
        rememberAnimation(content, content.animate([
          { opacity: .6, transform: 'translateY(-5px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 180, easing: 'cubic-bezier(.22,1,.36,1)' }));
      }
    }
    invalidateLayout();
  });
});

// Native touch scrolling, exact card snap stops and retargetable buttons.
// A range counter describes all currently visible photographs on wide screens.
document.querySelectorAll('[data-gallery]').forEach(gallery => {
  const cards = [...gallery.querySelectorAll('.gallery-card')];
  const controls = [...document.querySelectorAll('[data-gallery-prev], [data-gallery-next]')]
    .filter(button => !button.getAttribute('aria-controls') || button.getAttribute('aria-controls') === gallery.id);
  const scope = gallery.closest('section') || document;
  const current = scope.querySelector('[data-gallery-current]');
  const total = scope.querySelector('[data-gallery-total]');
  let stops = [0];
  let bounds = [];
  let width = 0;
  let maximum = 0;
  let planned = 0;
  let moving = false;
  let galleryFrame = 0;
  let settleTimer;
  const nearest = left => stops.reduce((best, value, index) => Math.abs(value - left) < Math.abs(stops[best] - left) ? index : best, 0);
  const format = value => String(value).padStart(2, '0');
  if (total) total.textContent = format(cards.length);
  const update = () => {
    galleryFrame = 0;
    const left = gallery.scrollLeft;
    const visible = bounds.map((bound, index) => ({ ...bound, index }))
      .filter(bound => {
        const visibleWidth = Math.min(bound.end, left + width) - Math.max(bound.start, left);
        return visibleWidth >= Math.max(8, (bound.end - bound.start) * .05);
      });
    if (current && visible.length) {
      const first = visible[0].index + 1;
      const last = visible[visible.length - 1].index + 1;
      const text = first === last ? format(first) : `${format(first)}–${format(last)}`;
      if (current.textContent !== text) current.textContent = text;
      current.setAttribute('aria-label', first === last ? `Immagine ${first} di ${cards.length}` : `Immagini da ${first} a ${last} di ${cards.length}`);
    }
    controls.forEach(button => {
      button.disabled = moving
        ? button.hasAttribute('data-gallery-prev') ? planned === 0 : planned === stops.length - 1
        : button.hasAttribute('data-gallery-prev') ? left <= 2 : left >= maximum - 2;
    });
  };
  const scheduleGallery = () => { if (!galleryFrame) galleryFrame = requestAnimationFrame(update); };
  const settled = () => {
    clearTimeout(settleTimer);
    moving = false;
    planned = nearest(gallery.scrollLeft);
    scheduleGallery();
  };
  const measure = () => {
    const left = gallery.getBoundingClientRect().left;
    const scrollLeft = gallery.scrollLeft;
    width = gallery.clientWidth;
    maximum = Math.max(0, gallery.scrollWidth - width);
    bounds = cards.map(card => {
      const box = card.getBoundingClientRect();
      return { start: box.left - left + scrollLeft, end: box.right - left + scrollLeft };
    });
    const firstStart = bounds[0]?.start || 0;
    stops = [...new Set([0, ...bounds.map(bound => Math.min(maximum, Math.max(0, bound.start - firstStart))), maximum])].sort((a, b) => a - b);
    planned = nearest(scrollLeft);
    moving = false;
    update();
  };
  galleryMeasurements.push(measure);
  galleryMotionStops.push(() => {
    gallery.scrollTo({ left: gallery.scrollLeft, behavior: 'instant' });
    settled();
  });
  const go = index => {
    if (layoutDirty) measureLayout();
    planned = Math.min(stops.length - 1, Math.max(0, index));
    moving = true;
    gallery.scrollTo({ left: stops[planned], behavior: preference.matches ? 'instant' : 'smooth' });
    scheduleGallery();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settled, 250);
  };
  const move = direction => go((moving ? planned : nearest(gallery.scrollLeft)) + direction);
  controls.forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => move(button.hasAttribute('data-gallery-prev') ? -1 : 1));
  });
  gallery.addEventListener('keydown', event => {
    if (event.target !== gallery) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') go(event.key === 'Home' ? 0 : stops.length - 1);
    else move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  gallery.addEventListener('pointerdown', () => { moving = false; clearTimeout(settleTimer); }, { passive: true });
  gallery.addEventListener('scroll', () => {
    scheduleGallery();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settled, 150);
  }, { passive: true });
  gallery.addEventListener('scrollend', settled, { passive: true });
});

// Measurements cover font loading, menu reflow, native details and lazy media,
// while scroll itself only consumes cached coordinates.
if ('ResizeObserver' in window) {
  const sizing = new ResizeObserver(invalidateLayout);
  [header, dock, stage, document.body, stage?.querySelector('.film-top'), stage?.querySelector('.film-copy'), stage?.querySelector('.film-bottom')]
    .filter(Boolean).forEach(node => sizing.observe(node));
}
if ('IntersectionObserver' in window) {
  const sections = new IntersectionObserver(scheduleFilm, { threshold: [0, .2, .6, 1] });
  navItems.forEach(({ section }) => sections.observe(section));
}
document.fonts?.ready.then(invalidateLayout);
window.addEventListener('load', invalidateLayout, { once: true });
invalidateLayout();

// Every content photograph receives its own slow camera movement. This does
// not request another image or movie, and only visible photographs animate.
// Keep these instances separate from the short reveal/details animations.
const ambientImages = [...new Set(document.querySelectorAll(
  '.service-image img, .gallery-image img, .contact-image img, [data-ambient-image]'
))].filter(node => node instanceof HTMLImageElement);
const visualToggles = [...document.querySelectorAll('[data-visual-motion-toggle]')];
const visualStatuses = [...document.querySelectorAll('[data-visual-motion-status]')];
const ambientEntries = ambientImages.map((image, index) => ({
  image,
  index,
  visible: false,
  animation: null,
  link: image.closest('a')
}));
let visualPaused = false;
let visualPageActive = true;
let pointerImage = null;
let visualState = '';
const ambientSupported = 'IntersectionObserver' in window && typeof Element.prototype.animate === 'function';

const setVisualState = state => {
  if (state === visualState) return;
  visualState = state;
  root.dataset.visualMotionState = state;
  const disabled = ['reduced', 'saving', 'unsupported'].includes(state);
  const label = state === 'reduced' ? 'Animazioni ridotte'
    : state === 'saving' ? 'Risparmio dati'
    : state === 'unsupported' ? 'Immagini fisse'
    : visualPaused ? 'Anima le immagini' : 'Ferma le immagini';
  const explanation = state === 'reduced' ? 'Immagini fisse: movimento ridotto attivo.'
    : state === 'saving' ? 'Immagini fisse: risparmio dati attivo.'
    : state === 'unsupported' ? 'Immagini fisse in questo browser.'
    : visualPaused ? 'Movimento delle immagini in pausa.' : 'Immagini in movimento';
  visualToggles.forEach(button => {
    button.disabled = disabled;
    button.textContent = label;
    button.setAttribute('aria-pressed', String(visualPaused || disabled));
    button.setAttribute('title', explanation);
  });
  visualStatuses.forEach(node => { node.textContent = explanation; });
};

const createAmbientAnimation = entry => {
  const horizontal = entry.index % 2 ? -1 : 1;
  const vertical = entry.index % 3 ? 1 : -1;
  const animation = entry.image.animate([
    { transform: `translate3d(${-.8 * horizontal}%, ${-.4 * vertical}%, 0) scale(1.025)` },
    { transform: `translate3d(${.8 * horizontal}%, ${.4 * vertical}%, 0) scale(1.085)` }
  ], {
    duration: 9000 + entry.index % 3 * 1500,
    easing: 'ease-in-out',
    iterations: Infinity,
    direction: 'alternate',
    fill: 'both'
  });
  // The synchronization below decides when to run, including the first frame.
  animation.pause();
  return animation;
};

const syncAmbientImages = () => {
  const reset = !ambientSupported || !allowed();
  setVisualState(!ambientSupported ? 'unsupported' : preference.matches ? 'reduced'
    : savingData() ? 'saving' : visualPaused ? 'paused' : 'running');
  for (const entry of ambientEntries) {
    if (reset) {
      entry.animation?.cancel();
      entry.animation = null;
      entry.image.dataset.ambientState = 'static';
      continue;
    }
    const focused = entry.link?.contains(document.activeElement);
    const shouldRun = entry.visible && visualPageActive && !document.hidden
      && !visualPaused && !focused && pointerImage !== entry.image
      && entry.image.complete && entry.image.naturalWidth > 0;
    if (shouldRun) {
      entry.animation ||= createAmbientAnimation(entry);
      if (entry.animation.playState !== 'running') entry.animation.play();
      entry.image.dataset.ambientState = 'running';
    } else {
      entry.animation?.pause();
      entry.image.dataset.ambientState = entry.animation ? 'paused' : 'idle';
    }
  }
};

ambientEntries.forEach(entry => {
  entry.image.classList.add('ambient-image');
  entry.image.dataset.ambientState = 'idle';
  entry.image.addEventListener('load', syncAmbientImages);
});
visualToggles.forEach(button => {
  button.hidden = false;
  button.addEventListener('click', () => {
    if (!ambientSupported || !allowed()) return;
    visualPaused = !visualPaused;
    syncAmbientImages();
  });
});
if (ambientSupported) {
  const ambientObserver = new IntersectionObserver(entries => {
    entries.forEach(observation => {
      const entry = ambientEntries.find(item => item.image === observation.target);
      if (entry) entry.visible = observation.isIntersecting && observation.intersectionRatio >= .1;
    });
    syncAmbientImages();
  }, { threshold: [0, .1] });
  ambientEntries.forEach(({ image }) => ambientObserver.observe(image));
}
document.addEventListener('focusin', syncAmbientImages);
document.addEventListener('focusout', () => queueMicrotask(syncAmbientImages));
document.addEventListener('pointerdown', event => {
  if (!(event.target instanceof Element)) return;
  pointerImage = event.target.closest('.service-image, .gallery-image, .contact-image')?.querySelector('img') || null;
  if (pointerImage) syncAmbientImages();
}, { passive: true });
const releaseImagePointer = () => { pointerImage = null; syncAmbientImages(); };
document.addEventListener('pointerup', releaseImagePointer, { passive: true });
document.addEventListener('pointercancel', releaseImagePointer, { passive: true });
preference.addEventListener('change', syncAmbientImages);
connection?.addEventListener?.('change', syncAmbientImages);
document.addEventListener('visibilitychange', syncAmbientImages);
window.addEventListener('pagehide', () => {
  visualPageActive = false;
  ambientEntries.forEach(entry => {
    entry.animation?.cancel();
    entry.animation = null;
    entry.image.dataset.ambientState = 'idle';
  });
});
window.addEventListener('pageshow', () => { visualPageActive = true; syncAmbientImages(); });
syncAmbientImages();
