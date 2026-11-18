/* A-LAB motion controller: progressive enhancement, no dependencies. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canAnimate = !reducedMotion.matches && 'IntersectionObserver' in window;
  const header = document.querySelector('.site-header');

  // One passive scroll listener, scheduled on the next animation frame.
  if (header) {
    let ticking = false;
    const syncHeader = () => {
      header.classList.toggle('has-scrolled', window.scrollY > 20);
      ticking = false;
    };
    syncHeader();
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(syncHeader);
      }
    }, {passive:true});
  }

  if (!canAnimate) return;
  const targets = [
    '.review-card',
    '.section-heading h2',
    '.case-grid .case-card',
    '.services-header h2',
    '.service-row',
    '.process-top',
    '.process-card',
    '.feedback-intro h2',
    '.form-card',
    '.contact-layout > *',
    '.cable-section .cable-heading',
    '.cable-demo-section .cable-heading',
    '.case-gallery-section .cable-heading',
    '.cable-step',
    '.cable-feature',
    '.case-gallery-item',
    '.story-diagram',
    '.cable-dashboard'
  ];
  const elements = [...new Set(targets.flatMap(selector => [...document.querySelectorAll(selector)]))];
  if (!elements.length) return;

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }
  }, {threshold:0.07,rootMargin:'0px 0px -22px 0px'});

  document.documentElement.classList.add('motion-enabled');
  for (const element of elements) {
    // Stagger only groups of siblings; avoid long cascading delays.
    const group = element.parentElement;
    const staggerGroups = ['case-grid','review-grid','process-grid','cable-steps','cable-features','case-gallery-grid','story-flow'];
    const delay = group && staggerGroups.some(cls => group.classList.contains(cls))
      ? (Array.prototype.indexOf.call(group.children, element) % 4) * 85
      : 0;
    element.style.setProperty('--motion-delay', delay + 'ms');
    element.classList.add('motion-reveal');
    observer.observe(element);
  }

  // If accessibility preference changes mid-session, reveal all content immediately.
  const onPreferenceChange = event => {
    if (event.matches) {
      observer.disconnect();
      document.documentElement.classList.remove('motion-enabled');
      elements.forEach(element => element.classList.add('is-revealed'));
    }
  };
  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener('change', onPreferenceChange, {once:true});
  }
})();
