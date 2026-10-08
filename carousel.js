(() => {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('.carousel-track');
    const slides = [...root.querySelectorAll('.carousel-slide')];
    const prev = root.parentElement?.querySelector('[data-carousel-prev]');
    const next = root.parentElement?.querySelector('[data-carousel-next]');
    const counter = root.parentElement?.querySelector('[data-carousel-counter]');
    const dotsWrap = root.parentElement?.querySelector('[data-carousel-dots]');
    if (!track || slides.length < 1) return;

    let index = 0;
    const dots = [];

    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', () => go(i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    const render = () => {
      track.style.transform = 'translate3d(-' + (index * 100) + '%,0,0)';
      slides.forEach((slide, i) => slide.setAttribute('aria-hidden', i === index ? 'false' : 'true'));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      if (counter) counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    };

    const go = (i) => {
      index = clamp(i, 0, slides.length - 1);
      render();
    };

    prev?.addEventListener('click', () => go(index === 0 ? slides.length - 1 : index - 1));
    next?.addEventListener('click', () => go(index === slides.length - 1 ? 0 : index + 1));

    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prev?.click();
      if (e.key === 'ArrowRight') next?.click();
    });

    let startX = null;
    root.addEventListener('touchstart', (e) => { startX = e.touches[0]?.clientX ?? null; }, {passive:true});
    root.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const endX = e.changedTouches[0]?.clientX ?? startX;
      const dx = endX - startX;
      if (Math.abs(dx) > 45) (dx < 0 ? next : prev)?.click();
      startX = null;
    }, {passive:true});

    render();
  });
})();