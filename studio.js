(() => {
  'use strict';
  const API = 'https://alab-reviews-api.edanovanton.workers.dev';
  const isEnglish = document.documentElement.lang === 'en';
  const t = isEnglish ? {
    empty: 'No reviews submitted on this site have been published yet. Reviews from Avito are shown above.',
    unavailable: 'Site reviews could not be loaded. Please try again later.',
    sending: 'Sending…',
    success: 'Review received. It will appear after moderation. Thank you!',
    error: 'Could not submit the review. Please try again.',
    service: {stream:'OBS and streaming',pc:'PC setup',automation:'Automation'}
  } : {
    empty: 'Опубликованных отзывов с этого сайта пока нет. Отзывы с Авито размещены вверху страницы.',
    unavailable: 'Не удалось загрузить отзывы с сайта. Попробуйте позже.',
    sending: 'Отправляем…',
    success: 'Отзыв получен и ожидает модерации. Спасибо!',
    error: 'Не удалось отправить отзыв. Попробуйте ещё раз.',
    service: {stream:'OBS и трансляции',pc:'Настройка ПК',automation:'Автоматизация'}
  };

  const list = document.getElementById('site-review-list');
  const el = (tag, className, contents) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (contents !== undefined) n.textContent = contents;
    return n;
  };

  async function loadPublished() {
    if (!list) return;
    try {
      const response = await fetch(API + '/reviews', {headers:{'Accept':'application/json'},cache:'no-store'});
      if (!response.ok) throw new Error('API unavailable');
      const payload = await response.json();
      list.replaceChildren();
      if (!Array.isArray(payload.reviews) || !payload.reviews.length) {
        list.append(el('p','empty-reviews',t.empty)); return;
      }
      for (const review of payload.reviews) {
        const score = Math.max(1, Math.min(5, Number(review.rating) || 5));
        const card = el('article','site-review');
        const top = el('div','site-review-head');
        top.append(el('strong','',String(review.name||'')),el('span','stars','★'.repeat(score)+'☆'.repeat(5-score)));
        card.append(top,el('p','',String(review.body||'')),el('small','',t.service[review.project]||''));
        list.append(card);
      }
    } catch (_) {
      list.replaceChildren(el('p','empty-reviews',t.unavailable));
    }
  }
  loadPublished();

  const form = document.getElementById('review-form');
  if (!form) return;
  const submit = document.getElementById('review-submit');
  const status = document.getElementById('review-status');
  const starButtons = [...document.querySelectorAll('[data-star]')];
  let rating = 5;
  let opened = performance.now();
  function setRating(score) {
    rating = score;
    for (const star of starButtons) {
      const current = Number(star.dataset.star);
      star.classList.toggle('selected',current <= rating);
      star.setAttribute('aria-pressed',String(current === rating));
    }
  }
  starButtons.forEach(button => button.addEventListener('click', () => setRating(Number(button.dataset.star))));
  setRating(5);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || submit.disabled) return;
    const data = new FormData(form);
    const payload = {
      name:String(data.get('name')||'').trim(),
      project:String(data.get('project')||''),
      body:String(data.get('body')||'').trim(),
      website:String(data.get('website')||''),
      rating,
      elapsed:Math.round(performance.now()-opened)
    };
    submit.disabled = true;
    status.textContent = t.sending;
    try {
      const response = await fetch(API+'/reviews',{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : t.error);
      status.textContent = t.success;
      form.reset(); setRating(5); opened=performance.now();
    } catch (err) {
      status.textContent = (err && typeof err.message === 'string' && err.message) || t.error;
    } finally {
      submit.disabled = false;
    }
  });
})();