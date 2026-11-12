import { initStoryPlayback } from './story-playback.js?v=0.9.2';
// Scroll changes the visual; dates and photographic provenance remain ordinary HTML.
// No continuous render loop, wheel interception or scroll locking is used.
export function initHistory({ reducedMotion, connection } = {}) {
  const section = document.querySelector('[data-history]');
  const layout = section?.querySelector('.story-layout');
  const steps = [...(section?.querySelectorAll('[data-history-step]') || [])];
  if (!section || !layout || steps.length !== 4) return { destroy() {}, setPaused() {}, refresh() {} };
  const query = reducedMotion?.matches !== undefined ? reducedMotion : matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 1000px) and (min-height: 650px)');
  const network = connection || navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isReduced = () => typeof reducedMotion === 'function' ? reducedMotion() : typeof reducedMotion === 'boolean' ? reducedMotion : query.matches;
  const isSaving = () => Boolean(network?.saveData || /(^|-)2g$/.test(network?.effectiveType || ''));
  const disposers = [];
  const stage = document.createElement('div');
  stage.className = 'story-stage';
  stage.dataset.historyStage = '';
  stage.setAttribute('aria-hidden', 'true');
  const frames = steps.map((step, index) => {
    const frame = document.createElement('div');
    frame.className = 'story-frame';
    frame.dataset.historyFrame = String(index);
    frame.dataset.historyKind = step.dataset.historyKind || 'illustration';
    frame.classList.toggle('is-document', frame.dataset.historyKind === 'document');
    const picture = step.querySelector('picture').cloneNode(true);
    picture.querySelector('img').alt = '';
    picture.querySelector('img').loading = 'eager';
    picture.querySelectorAll('[srcset],[src]').forEach(node => {
      for (const name of ['srcset', 'src']) if (node.hasAttribute(name)) {
        node.dataset[`history${name === 'src' ? 'Src' : 'Srcset'}`] = node.getAttribute(name);
        node.removeAttribute(name);
      }
    });
    frame.append(picture);
    stage.append(frame);
    return frame;
  });
  const label = document.createElement('div');
  label.className = 'story-stage-label';
  const yearLabel = document.createElement('span');
  yearLabel.className = 'story-stage-year';
  const note = document.createElement('span');
  note.className = 'story-stage-note';
  note.textContent = '';
  label.append(yearLabel, note);
  stage.append(label);
  layout.prepend(stage);
  let enhanced = false;
  let near = false;
  let paused = false;
  let interactiveFocus = false;
  let destroyed = false;
  let mediaFailed = false;
  let active = -1;
  let requested = -1;
  let request = 0;
  let raf = 0;
  let dirty = true;
  let stops = [];
  const on = (target, event, handler, options) => {
    target?.addEventListener?.(event, handler, options);
    disposers.push(() => target?.removeEventListener?.(event, handler, options));
  };
  let playback;
  const mayAnimate = () => !destroyed && !paused && !interactiveFocus && !isReduced() && !isSaving() && !document.hidden;
  const hydrate = index => {
    const frame = frames[index];
    if (!frame) return;
    frame.querySelectorAll('[data-history-srcset],[data-history-src]').forEach(node => {
      if (node.dataset.historySrcset) node.setAttribute('srcset', node.dataset.historySrcset);
      if (node.dataset.historySrc) node.setAttribute('src', node.dataset.historySrc);
      delete node.dataset.historySrcset;
      delete node.dataset.historySrc;
    });
  };
  const show = (index, serial) => {
    if (!enhanced || serial !== request) return;
    const changed = active !== index;
    active = index;
    section.dataset.activeIndex = String(index);
    yearLabel.textContent = steps[index].dataset.historyYear;
    const documentPhoto = steps[index].dataset.historyKind === 'document';
    stage.classList.toggle('is-document', documentPhoto);
    note.textContent = steps[index].dataset.historyCaption
      || steps[index].querySelector('figcaption')?.textContent
      || (documentPhoto ? 'Foto pubblicata nel 2016 · restauro digitale' : 'Visual illustrativo IA');
    frames.forEach((frame, i) => frame.classList.toggle('is-active', i === index));
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    if (changed) playback?.refresh();
    // Decode one upcoming scene while the visitor reads the present chapter.
    if (near && !isSaving()) hydrate(index + 1);
  };
  const activate = index => {
    if (requested === index && active === index) return;
    requested = index;
    const serial = ++request;
    hydrate(index);
    const image = frames[index].querySelector('img');
    if (image.complete && image.naturalWidth) show(index, serial);
    else if (image.decode) image.decode().then(() => show(index, serial)).catch(() => {
      if (image.complete && image.naturalWidth) show(index, serial);
    });
    else image.addEventListener('load', () => show(index, serial), { once: true });
  };
  const measure = () => {
    dirty = false;
    const centers = steps.map(step => {
      const box = step.getBoundingClientRect();
      return scrollY + box.top + box.height * .5;
    });
    stops = centers.slice(1).map((center, i) => (centers[i] + center) / 2);
  };
  const update = () => {
    raf = 0;
    if (!enhanced || !near || document.hidden) return;
    if (dirty) measure();
    const line = scrollY + innerHeight * .52;
    let index = 0;
    for (const stop of stops) if (line >= stop) index += 1;
    activate(index);
  };
  const schedule = () => {
    if (enhanced && near && !document.hidden && !raf) raf = requestAnimationFrame(update);
  };
  const configure = () => {
    if (destroyed) return;
    const headerSpace = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-space')) || 0;
    const available = innerHeight - headerSpace - 48;
    const tallestCopy = Math.max(...steps.map(step => step.querySelector('.story-copy').scrollHeight));
    // A tall header or enlarged text may leave too little room for a sticky scene.
    // Keep every scene in the ordinary flow rather than squeezing its content.
    const photoWidth = layout.getBoundingClientRect().width * .56;
    const imageHeight = photoWidth / 1.6;
    const comfortable = available >= 300 && imageHeight <= available && tallestCopy <= available;
    const next = wide.matches && comfortable && !mediaFailed && !isReduced() && !isSaving() && 'IntersectionObserver' in window;
    enhanced = next;
    section.classList.toggle('is-history-enhanced', next);
    section.classList.toggle('is-history-still', !mayAnimate());
    if (!next) {
      request += 1;
      requested = -1;
      active = -1;
      playback?.refresh();
      frames.forEach(frame => frame.classList.remove('is-active'));
      stage.classList.remove('is-document');
      steps.forEach(step => step.classList.remove('is-active'));
      delete section.dataset.activeIndex;
    }
    dirty = true;
    playback?.refresh();
    schedule();
  };
  frames.forEach(frame => on(frame.querySelector('img'), 'error', () => {
    mediaFailed = true;
    section.dataset.historyFallback = 'image-error';
    configure();
  }));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      near = entries[0].isIntersecting;
      if (near) schedule();
      else playback?.refresh();
    }, { rootMargin: '180px 0px' });
    observer.observe(section);
    disposers.push(() => observer.disconnect());

  }
  on(window, 'scroll', schedule, { passive: true });
  on(window, 'resize', configure, { passive: true });
  on(query, 'change', configure);
  on(wide, 'change', configure);
  on(network, 'change', configure);
  on(section, 'focusin', event => {
    interactiveFocus = !event.target.closest('[data-history-playback]') && event.target.matches('a,button,summary,input,select,textarea,[tabindex="0"]');
    playback?.refresh();
    section.classList.toggle('is-history-still', !mayAnimate());
  });
  on(section, 'focusout', event => {
    interactiveFocus = Boolean(section.contains(event.relatedTarget) && !event.relatedTarget?.closest('[data-history-playback]') && event.relatedTarget?.matches('a,button,summary,input,select,textarea,[tabindex="0"]'));
    section.classList.toggle('is-history-still', !mayAnimate());
    playback?.refresh();
  });
  on(document, 'visibilitychange', () => {
    playback?.refresh();
    section.classList.toggle('is-history-still', !mayAnimate());
    schedule();
  });
  let resizeObserver;
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(configure);
    resizeObserver.observe(section);
    steps.forEach(step => resizeObserver.observe(step.querySelector('.story-copy')));
    disposers.push(() => resizeObserver.disconnect());
  }
  playback = initStoryPlayback({ section, steps, frames,
    isEnhanced: () => enhanced, activeIndex: () => active, canPlay: mayAnimate });
  document.fonts?.ready.then(configure);
  configure();
  return {
    setPaused(value) {
      paused = Boolean(value);
      playback?.refresh();
      section.classList.toggle('is-history-still', !mayAnimate());
    },
    refresh() { configure(); },
    destroy() {
      destroyed = true;
      enhanced = false;
      near = false;
      request += 1;
      if (raf) cancelAnimationFrame(raf);
      playback?.destroy();
      disposers.forEach(dispose => dispose());
      stage.remove();
      section.classList.remove('is-history-enhanced', 'is-history-still');
      steps.forEach(step => step.classList.remove('is-active'));
      delete section.dataset.activeIndex;
      delete section.dataset.historyFallback;
    }
  };
}
