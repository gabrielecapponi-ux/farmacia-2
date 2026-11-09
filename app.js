import { initHistory } from './history.js?v=0.9.0';
const root = document.documentElement;
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 820px)');
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const animations = new Map();
const clamp = value => Math.min(1, Math.max(0, value));
const header = document.querySelector('.site-header');
const dock = document.querySelector('.mobile-contact-dock');
root.classList.add('has-js');
const historyMotion = initHistory({ reducedMotion: preference, connection });

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
const video = document.querySelector('[data-hero-video]');
const camera = document.querySelector('.entry-camera');
const entryCopy = document.querySelector('.entry-copy');
const progressBar = document.querySelector('.entry-progress > span');
const toggle = document.querySelector('[data-motion-toggle]');
const status = document.querySelector('[data-film-status]');
const navItems = [...document.querySelectorAll('.site-nav a[href^="#"]')]
  .map(link => ({ link, section: document.getElementById(link.hash.slice(1)) }))
  .filter(item => item.section);
const galleryMeasurements = [];
const galleryMotionStops = [];
let frame = 0;
let layoutDirty = true;
let navStops = [];
let headerHeight = 0;
let currentNav = null;
let compact = true;
let nearFilm = false;
let manualPaused = false;
let failed = false;
let filmPageActive = true;
let currentSource = '';
let useCompatibleVideo = false;
let filmState = '';
let desiredTime = 0;
let displayedProgress = 0;
let entryBounds = { top: 0, bottom: 0, range: 1 };
const savingData = () => Boolean(connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || ''));
const allowed = () => !preference.matches && !savingData();
const canScrub = () => allowed() && !compact && !failed && filmPageActive && !document.hidden;
const setPixelProperty = (element, name, value) => {
  const next = `${Math.ceil(value)}px`;
  if (element.style.getPropertyValue(name) !== next) element.style.setProperty(name, next);
};
const scheduleNavigation = () => { if (!frame) frame = requestAnimationFrame(updateNavigation); };
const invalidateLayout = () => { layoutDirty = true; scheduleNavigation(); };
const setFilmState = next => {
  if (!stage || next === filmState) return;
  filmState = next;
  stage.dataset.filmState = next;
  if (status) status.textContent = {
    idle: 'Scorri per entrare nella farmacia.', loading: 'L’interno si sta preparando.',
    scrubbing: 'L’interno segue lo scorrimento.', paused: 'Movimento dell’interno in pausa.',
    compact: 'Interno illustrativo, immagine fissa.', reduced: 'Movimento ridotto: immagine fissa.',
    saving: 'Risparmio dati: immagine fissa.', error: 'Video non disponibile: immagine fissa.'
  }[next];
  if (toggle) {
    toggle.disabled = ['reduced', 'saving', 'error', 'compact'].includes(next);
    toggle.setAttribute('aria-pressed', String(manualPaused || toggle.disabled));
    toggle.textContent = next === 'reduced' ? 'Movimento ridotto'
      : next === 'saving' ? 'Risparmio dati' : ['error', 'compact'].includes(next) ? 'Immagine fissa'
      : manualPaused ? 'Riprendi il movimento' : 'Ferma il movimento';
  }
};
function unloadFilm() {
  video?.pause();
  if (video?.hasAttribute('src')) {
    video.removeAttribute('src');
    currentSource = '';
    video.load();
  }
  stage?.classList.remove('is-film-ready');
}
function loadFilm() {
  if (!video || !nearFilm || !canScrub()) return;
  const source = useCompatibleVideo
    ? mobile.matches ? video.dataset.srcMobileFallback : video.dataset.srcDesktopFallback
    : mobile.matches ? video.dataset.srcMobile : video.dataset.srcDesktop;
  if (!source || source === currentSource) return;
  video.pause();
  stage.classList.remove('is-film-ready');
  currentSource = source;
  stage.dataset.videoQuality = useCompatibleVideo ? '1080p' : '4k';
  video.muted = true;
  video.playsInline = true;
  video.loop = false;
  video.preload = 'auto';
  video.src = source;
  setFilmState('loading');
  video.load();
}
// Only one decoded seek may be in flight. Each completion consumes the latest
// requested scroll position, so rapid gestures never create a seek queue.
function flushSeek() {
  if (!video || !canScrub() || !currentSource || video.readyState < 1 || video.seeking) return;
  if (Math.abs(video.currentTime - desiredTime) > 1 / 48) video.currentTime = desiredTime;
}
function measureLayout() {
  layoutDirty = false;
  headerHeight = header?.getBoundingClientRect().height || 0;
  setPixelProperty(root, '--header-space', headerHeight);
  setPixelProperty(root, '--dock-space', dock?.getBoundingClientRect().height || 0);
  if (stage && entryCopy) {
    const vh = window.innerHeight;
    const style = getComputedStyle(entryCopy);
    const contentHeight = entryCopy.getBoundingClientRect().height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const nextCompact = !allowed() || failed || !('IntersectionObserver' in window)
      || vh < 650 || headerHeight + contentHeight + 235 > vh;
    const changed = nextCompact !== compact;
    compact = nextCompact;
    stage.classList.toggle('is-entry-scroll', !compact);
    stage.classList.toggle('is-entry-compact', compact);
    if (changed && compact) { unloadFilm(); if (camera) camera.style.transform = ''; }
    const box = stage.getBoundingClientRect();
    entryBounds = { top: window.scrollY + box.top, bottom: window.scrollY + box.bottom, range: Math.max(1, box.height - vh) };
  }
  navStops = navItems.map(item => ({ ...item, top: window.scrollY + item.section.getBoundingClientRect().top }));
  galleryMeasurements.forEach(measure => measure());
}
function syncFilm() {
  if (!stage || !video) return;
  if (preference.matches) { setFilmState('reduced'); return; }
  if (savingData()) { setFilmState('saving'); return; }
  if (failed) { setFilmState('error'); return; }
  if (compact) { setFilmState('compact'); return; }
  loadFilm();
  const scrollProgress = clamp((window.scrollY - entryBounds.top) / entryBounds.range);
  stage.dataset.scrollProgress = scrollProgress.toFixed(4);
  if (!manualPaused && filmPageActive && !document.hidden) displayedProgress = scrollProgress;
  stage.dataset.progress = displayedProgress.toFixed(4);
  if (camera) camera.style.transform = `scale(${(1 + displayedProgress * .08).toFixed(4)})`;
  if (progressBar) progressBar.style.transform = `scaleX(${displayedProgress})`;
  if (Number.isFinite(video.duration)) desiredTime = displayedProgress * Math.max(0, video.duration - .05);
  flushSeek();
  setFilmState(manualPaused ? 'paused' : video.readyState >= 2 ? 'scrubbing' : currentSource ? 'loading' : 'idle');
}
function updateNavigation() {
  frame = 0;
  if (layoutDirty) measureLayout();
  const position = window.scrollY;
  header?.classList.toggle('is-paper', position + headerHeight >= entryBounds.bottom - 4);
  let active = null;
  for (const item of navStops) if (item.top <= position + headerHeight + 100) active = item;
  if (active?.link !== currentNav) {
    currentNav = active?.link || null;
    navItems.forEach(({ link }) => {
      if (link === currentNav) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  syncFilm();
}
const updatePreference = () => {
  root.classList.toggle('reduced-motion', preference.matches);
  root.classList.toggle('saving-data', savingData());
  if (!allowed()) {
    cancelMotion();
    galleryMotionStops.forEach(stop => stop());
    unloadFilm();
    displayedProgress = 0;
    if (camera) camera.style.transform = '';
  }
  invalidateLayout();
};
if (stage && video) {
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    if (!canScrub()) return;
    manualPaused = !manualPaused;
    syncFilm();
  });
  video.addEventListener('loadedmetadata', syncFilm);
  const decoded = () => {
    if (!currentSource || !canScrub()) return;
    if (video.readyState >= 2) stage.classList.add('is-film-ready');
    flushSeek();
    setFilmState(manualPaused ? 'paused' : 'scrubbing');
  };
  video.addEventListener('loadeddata', decoded);
  video.addEventListener('seeked', decoded);
  video.addEventListener('error', () => {
    if (!currentSource || !allowed()) return;
    // One bounded compatibility fallback; never retry a failed source forever.
    if (!useCompatibleVideo && (video.error?.code === 3 || video.error?.code === 4)) {
      useCompatibleVideo = true;
      unloadFilm();
      loadFilm();
      return;
    }
    failed = true;
    unloadFilm();
    setFilmState('error');
    invalidateLayout();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      nearFilm = entries[0].isIntersecting;
      if (nearFilm) { loadFilm(); syncFilm(); }
    }, { rootMargin: '200px 0px' });
    observer.observe(stage);
  }
  mobile.addEventListener('change', invalidateLayout);
}
preference.addEventListener('change', updatePreference);
connection?.addEventListener?.('change', updatePreference);
updatePreference();
window.addEventListener('scroll', scheduleNavigation, { passive: true });
window.addEventListener('resize', invalidateLayout, { passive: true });
window.visualViewport?.addEventListener('resize', invalidateLayout, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelMotion();
  if (!document.hidden) invalidateLayout();
});
window.addEventListener('pagehide', () => {
  filmPageActive = false;
  cancelMotion();
  cancelAnimationFrame(frame);
  frame = 0;
});
window.addEventListener('pageshow', () => { filmPageActive = true; invalidateLayout(); });

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
  [header, dock, document.body]
    .filter(Boolean).forEach(node => sizing.observe(node));
}
if ('IntersectionObserver' in window) {
  const sections = new IntersectionObserver(scheduleNavigation, { threshold: [0, .2, .6, 1] });
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
  completed: false,
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
    : visualPaused ? 'Riprendi le immagini' : state === 'complete' ? 'Rianima le immagini' : 'Ferma le immagini';
  const explanation = state === 'reduced' ? 'Immagini fisse: movimento ridotto attivo.'
    : state === 'saving' ? 'Immagini fisse: risparmio dati attivo.'
    : state === 'unsupported' ? 'Immagini fisse in questo browser.'
    : visualPaused ? 'Movimento delle immagini in pausa.' : state === 'complete' ? 'Movimento completato. Puoi rivederlo.' : 'Brevi movimenti delle immagini.';
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
    { transform: 'translate3d(0,0,0) scale(1)' },
    { transform: `translate3d(${.25 * horizontal}%, ${.15 * vertical}%, 0) scale(1.025)` }
  ], {
    duration: 1400,
    easing: 'cubic-bezier(.22,1,.36,1)',
    iterations: 1,
    fill: 'both'
  });
  // The synchronization below decides when to run, including the first frame.
  animation.pause();
  animation.addEventListener('finish', () => { entry.completed = true; syncAmbientImages(); });
  return animation;
};

const syncAmbientImages = () => {
  const reset = !ambientSupported || !allowed();
  const visible = ambientEntries.filter(entry => entry.visible && entry.image.complete);
  const complete = visible.length > 0 && visible.every(entry => entry.completed);
  setVisualState(!ambientSupported ? 'unsupported' : preference.matches ? 'reduced'
    : savingData() ? 'saving' : visualPaused ? 'paused' : complete ? 'complete' : 'running');
  for (const entry of ambientEntries) {
    if (reset) {
      entry.animation?.cancel();
      entry.animation = null;
      entry.completed = false;
      entry.image.dataset.ambientState = 'static';
      continue;
    }
    const focused = entry.link?.contains(document.activeElement);
    const shouldRun = entry.visible && visualPageActive && !document.hidden
      && !visualPaused && !focused && pointerImage !== entry.image
      && entry.image.complete && entry.image.naturalWidth > 0;
    if (entry.completed) {
      entry.image.dataset.ambientState = 'complete';
    } else if (shouldRun) {
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
    if (visualState === 'complete') {
      ambientEntries.forEach(entry => { entry.animation?.cancel(); entry.animation = null; entry.completed = false; });
      visualPaused = false;
    } else visualPaused = !visualPaused;
    historyMotion?.setPaused(visualPaused);
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
