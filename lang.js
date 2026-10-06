(() => {
  const key = 'alab-language';
  const root = document.documentElement;
  const current = root.dataset.lang || 'en';
  const page = root.dataset.page || 'home';
  const routes = {
    home: { en: 'index.html', ru: 'index-ru.html' },
    cs2: { en: 'cs2.html', ru: 'cs2-ru.html' },
    football: { en: 'football.html', ru: 'football-ru.html' }
  };

  const go = (lang, remember = true) => {
    if (remember) localStorage.setItem(key, lang);
    const target = routes[page] && routes[page][lang];
    if (!target) return;
    if (lang === current) {
      document.querySelector('.language-prompt')?.remove();
      document.body.classList.remove('language-prompt-open');
      return;
    }
    location.href = target + location.hash;
  };

  document.querySelectorAll('[data-lang-switch]').forEach((button) => {
    button.addEventListener('click', () => go(button.dataset.langSwitch));
  });

  const saved = localStorage.getItem(key);
  if (saved === 'ru' || saved === 'en') {
    if (saved !== current) go(saved, false);
    return;
  }

  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  const suggested = browserLanguages.some((lang) => String(lang).toLowerCase().startsWith('ru')) ? 'ru' : 'en';

  const modal = document.createElement('div');
  modal.className = 'language-prompt';
  modal.innerHTML = `
    <div class="language-dialog" role="dialog" aria-modal="true" aria-labelledby="language-title">
      <span class="language-kicker">A-LAB / LANGUAGE</span>
      <h2 id="language-title">${suggested === 'ru' ? 'Продолжить на русском?' : 'Continue in English?'}</h2>
      <p>${suggested === 'ru'
        ? 'Язык браузера похож на русский. Выбор можно изменить в любой момент в шапке сайта.'
        : 'Your browser language looks like English. You can change the language anytime from the site header.'}</p>
      <div class="language-options">
        <button type="button" class="${suggested === 'ru' ? 'recommended' : ''}" data-choice="ru"><b>Русский</b><span>${suggested === 'ru' ? 'Рекомендуется' : 'Russian'}</span></button>
        <button type="button" class="${suggested === 'en' ? 'recommended' : ''}" data-choice="en"><b>English</b><span>${suggested === 'en' ? 'Recommended' : 'Английский'}</span></button>
      </div>
      <small>Only your language preference is stored in this browser.</small>
    </div>`;
  document.body.appendChild(modal);
  document.body.classList.add('language-prompt-open');
  modal.querySelectorAll('[data-choice]').forEach((button) => {
    button.addEventListener('click', () => go(button.dataset.choice));
  });
})();