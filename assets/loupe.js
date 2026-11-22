const viewer = document.querySelector('.viewer');
const links = [...document.querySelectorAll('.shot-link')];
const strip = document.querySelector('.shot-strip');
const stripControls = document.querySelector('.strip-controls');

const LOUPE_ZOOM = 2;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (strip && stripControls) {
  const prevButton = stripControls.querySelector('[data-scroll="prev"]');
  const nextButton = stripControls.querySelector('[data-scroll="next"]');

  const isScrollable = () => strip.scrollWidth - strip.clientWidth > 2;

  const syncStripControls = () => {
    stripControls.hidden = !isScrollable();
    prevButton.disabled = strip.scrollLeft <= 2;
    nextButton.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
  };

  const handleStripButtonClick = (event) => {
    const direction = event.currentTarget.dataset.scroll === 'prev' ? -1 : 1;
    strip.scrollBy({
      left: direction * strip.clientWidth * 0.8,
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  };

  prevButton.addEventListener('click', handleStripButtonClick);
  nextButton.addEventListener('click', handleStripButtonClick);
  strip.addEventListener('scroll', syncStripControls, { passive: true });
  new ResizeObserver(syncStripControls).observe(strip);
  syncStripControls();
}

if (viewer && typeof viewer.showModal === 'function' && links.length) {
  const image = document.createElement('img');
  image.className = 'viewer-img';
  viewer.querySelector('.viewer-figure').prepend(image);
  const caption = viewer.querySelector('.viewer-caption');
  const count = viewer.querySelector('.viewer-count');
  const loupe = viewer.querySelector('.viewer-loupe');
  let current = 0;

  const hideLoupe = () => {
    loupe.hidden = true;
    viewer.classList.remove('has-loupe');
  };

  const show = (index) => {
    current = (index + links.length) % links.length;
    const link = links[current];
    const thumb = link.querySelector('img');
    hideLoupe();
    image.src = link.href;
    image.width = Number(link.dataset.fullWidth);
    image.height = Number(link.dataset.fullHeight);
    image.alt = thumb.alt;
    caption.textContent = thumb.alt;
    count.textContent = `${current + 1} / ${links.length}`;
    loupe.style.backgroundImage = `url("${link.href}")`;
  };

  const handleImagePointerMove = (event) => {
    if (event.pointerType !== 'mouse' || !finePointer.matches) return;
    const box = image.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    if (x < 0 || y < 0 || x > box.width || y > box.height) {
      hideLoupe();
      return;
    }
    const size = loupe.offsetWidth || 220;
    loupe.hidden = false;
    viewer.classList.add('has-loupe');
    loupe.style.translate = `${event.clientX - size / 2}px ${event.clientY - size / 2}px`;
    loupe.style.backgroundSize = `${box.width * LOUPE_ZOOM}px ${box.height * LOUPE_ZOOM}px`;
    loupe.style.backgroundPosition = `${size / 2 - x * LOUPE_ZOOM}px ${size / 2 - y * LOUPE_ZOOM}px`;
  };

  const handleLinkClick = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    show(links.indexOf(event.currentTarget));
    viewer.showModal();
  };

  const handleControlClick = (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) {
      if (event.target === viewer || event.target.classList.contains('viewer-figure')) viewer.close();
      return;
    }
    const { action } = button.dataset;
    if (action === 'close') viewer.close();
    if (action === 'prev') show(current - 1);
    if (action === 'next') show(current + 1);
  };

  const handleKeydown = (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  };

  const handleClose = () => {
    hideLoupe();
    links[current].focus();
  };

  links.forEach((link) => link.addEventListener('click', handleLinkClick));
  viewer.addEventListener('click', handleControlClick);
  viewer.addEventListener('keydown', handleKeydown);
  viewer.addEventListener('close', handleClose);
  image.addEventListener('pointermove', handleImagePointerMove);
  image.addEventListener('pointerleave', hideLoupe);
}
