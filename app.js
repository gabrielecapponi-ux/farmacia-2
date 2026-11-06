const root = document.documentElement;
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const animations = new Map();
root.classList.add('has-js');
menu.hidden = false;
const setMenu = open => {
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
};
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) setMenu(false);
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  setMenu(false);
  const target = document.getElementById(link.hash.slice(1));
  if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
});
matchMedia('(min-width: 821px)').addEventListener('change', () => setMenu(false));
const cancelMotion = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
const updatePreference = () => {
  root.classList.toggle('reduced-motion', preference.matches);
  if (preference.matches) cancelMotion();
};
preference.addEventListener('change', updatePreference);
updatePreference();
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelMotion(); });
document.addEventListener('focusin', event => {
  animations.forEach((animation, node) => { if (node.contains(event.target)) { animation.cancel(); animations.delete(node); } });
});
// The hero and all four services are static and visible immediately. Only
// secondary sections receive a brief enhancement when entering the viewport.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const node = entry.target;
      if (preference.matches || document.hidden || !node.animate || node.contains(document.activeElement)) return;
      const animation = node.animate([{ opacity: .8, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'none' });
      animations.set(node, animation);
      const forget = () => { if (animations.get(node) === animation) animations.delete(node); };
      animation.addEventListener('finish', forget, { once: true });
      animation.addEventListener('cancel', forget, { once: true });
    });
  }, { threshold: .1 });
  document.querySelectorAll('.about-copy, .about-picture, .advice-heading, .advice-list, .contact-location, .contact-links').forEach(node => observer.observe(node));
}
// Reserve the actual size of the header and contact dock, including safe areas
// and enlarged text; anchors and the footer remain reachable.
if ('ResizeObserver' in window) {
  const header = document.querySelector('.site-header');
  const dock = document.querySelector('.mobile-contact-dock');
  const measure = () => {
    root.style.setProperty('--header-space', `${header.getBoundingClientRect().height}px`);
    root.style.setProperty('--dock-space', `${dock.getBoundingClientRect().height}px`);
  };
  const observer = new ResizeObserver(measure);
  observer.observe(header); observer.observe(dock); measure();
}
