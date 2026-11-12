// One decoder follows the visible chapter. Pictures remain the complete fallback.
export function initStoryPlayback({ section, steps, frames, isEnhanced, activeIndex, canPlay }) {
  if (!('IntersectionObserver' in window)) return { refresh() {}, destroy() {} };
  const video = document.createElement('video');
  video.className = 'story-walking-video';
  video.dataset.storyVideo = '';
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'none';
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('disablepictureinpicture', '');
  video.tabIndex = -1;
  const controls = document.createElement('div');
  controls.className = 'shell story-playback-controls';
  controls.dataset.historyPlayback = '';
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.dataset.storyPause = '';
  pause.setAttribute('aria-pressed', 'false');
  const replay = document.createElement('button');
  replay.type = 'button';
  replay.dataset.storyReplay = '';
  replay.textContent = 'Rivedi la scena';
  const status = document.createElement('span');
  status.className = 'story-playback-status';
  controls.append(pause, replay, status);
  section.querySelector('.story-layout').before(controls);
  let paused = false, destroyed = false, current = null, serial = 0, raf = 0, inViewport = false;
  const failed = new Set();
  const disposers = [];
  const on = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    disposers.push(() => target.removeEventListener(event, handler, options));
  };
  const setState = state => {
    section.dataset.storyPlayback = state;
    pause.textContent = paused ? 'Riprendi le scene' : 'Pausa scene';
    pause.setAttribute('aria-pressed', String(paused));
    pause.disabled = !canPlay();
    replay.disabled = !canPlay() || paused || !current;
    status.textContent = state === 'blocked' ? 'Immagini statiche' : state === 'ended' ? 'Scena completata' : 'Scene illustrative animate';
  };
  const release = () => {
    serial += 1;
    video.pause();
    video.classList.remove('is-ready');
    video.removeAttribute('src');
    video.load();
    video.remove();
    current = null;
  };
  const visibleArea = node => {
    const b = node.getBoundingClientRect();
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-space')) || 0;
    const h = Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, header));
    return b.width > 0 && b.height > 0 ? h / b.height : 0;
  };
  const choose = () => {
    if (isEnhanced()) {
      const index = activeIndex();
      if (index < 0 || visibleArea(frames[index]) < .18) return null;
      return { index, target: frames[index].querySelector('picture') };
    }
    const options = steps.map((step,index) => ({index,target:step.querySelector('picture')}))
      .map(item => ({...item,visible:visibleArea(item.target)})).filter(item => item.visible >= .35)
      .sort((a,b) => b.visible-a.visible);
    return options[0] || null;
  };
  const play = () => {
    if (!current || paused || !canPlay()) return;
    const token = serial;
    video.play()?.catch(() => {
      if (token !== serial || destroyed) return;
      video.classList.remove('is-ready');
      setState('autoplay-blocked');
      status.textContent = 'Premi Rivedi la scena per animare';
    });
  };
  const update = () => {
    raf = 0;
    if (destroyed) return;
    if (!canPlay()) {
      // Pause preserves the current frame; preferences and hidden pages release it.
      if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || '')) release();
      else video.pause();
      setState('blocked');
      return;
    }
    const next = inViewport ? choose() : null;
    if (!next || failed.has(next.index)) {
      if (current) release();
      setState('idle');
      return;
    }
    if (paused && current?.index !== next.index) {
      if (current) release();
      setState('paused');
      return;
    }
    const width = next.target.getBoundingClientRect().width;
    const network = navigator.connection;
    const demand = width * Math.min(devicePixelRatio || 1, 3);
    const quality = network?.effectiveType === '3g' || demand <= 1280 ? '720' : demand <= 1920 ? '1080' : '4k';
    const rank = {720:0, 1080:1, '4k':2};
    if (current?.index === next.index && rank[quality] <= rank[current.quality]) {
      if (video.parentElement !== next.target) next.target.append(video);
      if (paused) { video.pause(); setState('paused'); }
      else if (!video.ended && video.paused) play();
      return;
    }
    const resumeTime = current?.index === next.index ? video.currentTime : 0;
    release();
    const token = serial;
    current = { ...next, quality };
    video.dataset.storyYear = steps[next.index].dataset.historyYear;
    video.dataset.storyQuality = quality;
    next.target.append(video);
    video.src = new URL(`./assets/story-motion/storia-${video.dataset.storyYear}-${quality}.mp4`, import.meta.url).href;
    if (resumeTime) video.addEventListener('loadedmetadata', () => {
      if (token === serial) video.currentTime = Math.min(resumeTime, video.duration);
    }, {once:true});
    setState(paused ? 'paused' : 'loading');
    if (!paused) play();
  };
  const refresh = () => { if (!raf && !destroyed) raf = requestAnimationFrame(update); };
  on(video, 'playing', () => {
    if (!current) return;
    video.classList.add('is-ready');
    setState('playing');
  });
  on(video, 'ended', () => setState('ended'));
  on(video, 'error', () => {
    if (!current) return;
    failed.add(current.index);
    release();
    setState('image-fallback');
  });
  on(pause, 'click', () => { paused = !paused; refresh(); });
  on(replay, 'click', () => {
    if (current && canPlay() && !paused) { video.currentTime = 0; play(); }
  });
  on(window, 'scroll', refresh, {passive:true});
  on(window, 'resize', refresh, {passive:true});
  on(document, 'visibilitychange', () => {
    if (document.hidden) { release(); setState('blocked'); }
    else refresh();
  });
  on(window, 'pagehide', release);
  on(window, 'pageshow', refresh);
  const observer = new IntersectionObserver(entries => {
    inViewport = entries[0].isIntersecting;
    refresh();
  });
  observer.observe(section);
  disposers.push(() => observer.disconnect());
  setState('idle');
  return {
    refresh,
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      release();
      disposers.forEach(dispose => dispose());
      controls.remove();
      delete section.dataset.storyPlayback;
    }
  };
}
