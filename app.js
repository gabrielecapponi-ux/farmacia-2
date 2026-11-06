const root = document.documentElement;
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const motion = document.querySelector('.motion-toggle');
const media = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 700px)');
const video = document.querySelector('.hero-video');
const connection = navigator.connection;
const arrivals = new Map();
let manualReduced = false;
let heroVisible = true;
let videoReady = false;
let videoEpoch = 0;
let failedVideo = '';
const reduced = () => manualReduced || media.matches;
const saveData = () => connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');
root.classList.add('has-js');
menu.hidden = false;
motion.hidden = false;

const cancelArrivals = () => { arrivals.forEach(animation => animation.cancel()); arrivals.clear(); };
const arrive = (node, { duration = 750, delay = 0, distance = 28, opacity = .25 } = {}) => {
  if (!node?.animate || reduced() || document.hidden || node.contains(document.activeElement)) return;
  arrivals.get(node)?.cancel();
  const animation = node.animate([{ opacity, transform: `translateY(${distance}px)` }, { opacity: 1, transform: 'translateY(0)' }], { duration, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
  arrivals.set(node, animation);
  const forget = () => { if (arrivals.get(node) === animation) arrivals.delete(node); };
  animation.addEventListener('finish', forget, { once: true });
  animation.addEventListener('cancel', forget, { once: true });
};

const setMenu = open => {
  const changed = menu.getAttribute('aria-expanded') !== String(open);
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  if (open && changed) arrive(nav, { duration: 260, distance: -10 });
  if (!open) arrivals.get(nav)?.cancel();
};
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); } });
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) setMenu(false);
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.getElementById(link.hash.slice(1));
  setMenu(false);
  if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
});
document.addEventListener('focusin', event => arrivals.forEach((animation, node) => { if (node.contains(event.target)) { animation.cancel(); arrivals.delete(node); } }));
matchMedia('(min-width: 761px)').addEventListener('change', () => setMenu(false));

// A real video is an enhancement: no source is requested until the poster is
// painted, and none is requested under reduced motion or data saving.
const updateVideo = () => {
  const permitted = videoReady && !reduced() && !saveData();
  const canPlay = permitted && heroVisible && !document.hidden;
  if (!canPlay) {
    videoEpoch++;
    video.pause();
    if (!permitted) video.classList.remove('is-playing');
    return;
  }
  const source = compact.matches ? video.dataset.mobile : video.dataset.desktop;
  if (failedVideo === source) return;
  if (video.getAttribute('src') !== source) {
    video.classList.remove('is-playing');
    video.src = source;
    video.load();
  }
  const epoch = ++videoEpoch;
  video.play().then(() => {
    if (epoch === videoEpoch && !reduced() && !saveData() && heroVisible && !document.hidden) video.classList.add('is-playing');
    else if (epoch === videoEpoch) video.pause();
  }).catch(() => { if (epoch === videoEpoch) video.classList.remove('is-playing'); });
};
video.addEventListener('error', () => { failedVideo = video.getAttribute('src') || ''; video.classList.remove('is-playing'); });
compact.addEventListener('change', updateVideo);
connection?.addEventListener?.('change', updateVideo);
const updateMotion = () => {
  const value = reduced();
  root.classList.toggle('reduced-motion', value);
  motion.setAttribute('aria-pressed', String(value));
  motion.querySelector('.motion-label').textContent = media.matches ? 'Movimento ridotto dal dispositivo' : value ? 'Riattiva animazioni' : 'Pausa animazioni';
  motion.querySelector('.motion-icon').textContent = value ? '▷' : 'Ⅱ';
  motion.disabled = media.matches;
  if (value) cancelArrivals();
  updateVideo();
};
motion.addEventListener('click', () => { manualReduced = !manualReduced; updateMotion(); });
media.addEventListener('change', updateMotion);
updateMotion();
const updateVisibility = () => { root.classList.toggle('page-hidden', document.hidden); if (document.hidden) cancelArrivals(); updateVideo(); };
document.addEventListener('visibilitychange', updateVisibility);
updateVisibility();
const startVideo = () => {
  const start = () => { videoReady = true; updateVideo(); };
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1300 });
  else setTimeout(start, 250);
};
if (document.readyState === 'complete') startVideo();
else window.addEventListener('load', startVideo, { once: true });

// Services keep native details semantics. The enhanced visual changes on demand;
// source photos remain available in the native panels without JavaScript.
const services = [...document.querySelectorAll('.service')];
const shortcuts = document.querySelector('.service-shortcuts');
const stage = document.querySelector('.service-stage');
const stageImage = stage.querySelector('img');
const serviceImages = ['ecg', 'pelle', 'pressione', 'cuore'];
let serviceImageEpoch = 0;
let stageIndex = 0;
shortcuts.hidden = false;
stage.hidden = false;
const showServiceImage = index => {
  shortcuts.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  if (index === stageIndex) return;
  stageIndex = index;
  stage.querySelector('.stage-number').textContent = `0${index + 1} / 04`;
  stage.querySelector('.stage-name').textContent = services[index].querySelector('summary strong').textContent;
  const epoch = ++serviceImageEpoch;
  const next = new Image();
  next.src = `./assets/images/${serviceImages[index]}-${compact.matches ? '640' : '960'}.webp`;
  next.decode().then(() => {
    if (epoch !== serviceImageEpoch) return;
    stageImage.srcset = `./assets/images/${serviceImages[index]}-640.webp 640w, ./assets/images/${serviceImages[index]}-960.webp 960w`;
    stageImage.src = next.src;
    arrive(stageImage, { duration: 650, distance: 10, opacity: .1 });
  }).catch(() => {});
};
const nativeDetailsMotion = CSS.supports('selector(details::details-content)') && CSS.supports('interpolate-size', 'allow-keywords');
services.forEach((detail, index) => {
  const content = detail.querySelector('.service-content');
  const sync = () => { content.inert = !detail.open; };
  sync();
  detail.querySelector('summary').addEventListener('click', () => {
    if (!detail.open) services.forEach(other => { if (other !== detail) { other.open = false; other.querySelector('.service-content').inert = true; } });
  });
  detail.addEventListener('toggle', () => {
    sync();
    if (!detail.open) { arrivals.get(content)?.cancel(); return; }
    services.forEach(other => { if (other !== detail) { other.open = false; other.querySelector('.service-content').inert = true; } });
    showServiceImage(index);
    if (!nativeDetailsMotion) arrive(content, { duration: 300, distance: 9 });
  });
});
shortcuts.addEventListener('click', event => {
  const button = event.target.closest('button[data-service]');
  if (!button) return;
  const index = Number(button.dataset.service);
  services.forEach((detail, i) => { detail.open = i === index; detail.querySelector('.service-content').inert = i !== index; });
  showServiceImage(index);
});

// A user-controlled timeline: all three stories are visible without JavaScript.
const historyPanels = [...document.querySelectorAll('.history-panel')];
const historyButtons = [...document.querySelectorAll('.timeline li')].map((item, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.innerHTML = item.innerHTML;
  button.dataset.year = item.dataset.year;
  button.setAttribute('aria-controls', `history-${item.dataset.year}`);
  button.setAttribute('aria-pressed', String(index === 0));
  item.replaceChildren(button);
  return button;
});
const setHistory = index => {
  historyPanels.forEach((panel, i) => { panel.hidden = i !== index; });
  historyButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  arrive(historyPanels[index], { duration: 600, distance: 18, opacity: .15 });
};
historyPanels.forEach((panel, index) => { panel.hidden = index !== 0; });
historyButtons.forEach((button, index) => {
  button.addEventListener('click', () => setHistory(index));
  button.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? (index + 1) % historyButtons.length : event.key === 'ArrowLeft' ? (index + historyButtons.length - 1) % historyButtons.length : event.key === 'Home' ? 0 : event.key === 'End' ? historyButtons.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); historyButtons[next].focus(); setHistory(next);
  });
});

if (!location.hash && scrollY < 60) {
  arrive(document.querySelector('h1'), { duration: 1050, distance: 42, opacity: .1 });
  arrive(document.querySelector('.hero-bottom'), { duration: 950, delay: 160, distance: 24 });
}
if ('IntersectionObserver' in window) {
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('has-arrived');
      arrive(entry.target, { delay: Number(entry.target.dataset.arrivalDelay || 0) });
      reveal.unobserve(entry.target);
    });
  }, { threshold: .1, rootMargin: '0px 0px -25px 0px' });
  document.querySelectorAll('.path-heading, .path-card, .section-intro, .service-stage, .service-list, .story-heading, .archive-picture, .story-copy, .timeline, .advice-heading, .advice-card, .journal-link, .contact-main, .contact-photo').forEach((node, i) => {
    if (node.matches('.path-card')) node.dataset.arrivalDelay = (i % 3) * 75;
    reveal.observe(node);
  });
  const botanical = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-in-view', entry.isIntersecting)), { threshold: .15 });
  document.querySelectorAll('.botanical-motion').forEach(node => botanical.observe(node));
  const heroObserver = new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; root.classList.toggle('hero-in-view', heroVisible); updateVideo(); }, { threshold: .08 });
  heroObserver.observe(document.querySelector('.hero'));
  const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    nav.querySelectorAll('a').forEach(link => { if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }), { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('#servizi, #storia, #consigli, #contatti').forEach(node => navObserver.observe(node));
}
let scrollScheduled = false;
const updateScroll = () => {
  scrollScheduled = false;
  root.classList.toggle('is-scrolled', scrollY > 20);
  const available = document.documentElement.scrollHeight - innerHeight;
  document.querySelector('.reading-progress').style.transform = `scaleX(${available > 0 ? Math.min(1, Math.max(0, scrollY / available)) : 0})`;
};
window.addEventListener('scroll', () => { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateScroll); } }, { passive: true });
window.addEventListener('resize', updateScroll, { passive: true });
updateScroll();
// Reflow and safe-area changes must never leave content behind sticky controls.
if ('ResizeObserver' in window) {
  const header = document.querySelector('.site-header');
  const dock = document.querySelector('.mobile-contact-dock');
  const measureChrome = () => {
    root.style.setProperty('--header-space', `${header.getBoundingClientRect().height}px`);
    root.style.setProperty('--dock-space', `${dock.getBoundingClientRect().height}px`);
  };
  const chromeSize = new ResizeObserver(measureChrome);
  chromeSize.observe(header); chromeSize.observe(dock); measureChrome();
}
