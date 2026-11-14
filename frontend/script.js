(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  const header = document.querySelector('[data-header]');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const sections = [...document.querySelectorAll('[data-section]')];

  if (menuButton && nav) {
    const closeMenu = () => {
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
    };
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        menuButton.focus();
      }
    });
  }

  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -10% 0px' }) : null;
  const scrollReveals = document.querySelectorAll('.reveal:not(.hero-copy):not(.dashboard-hero)');
  scrollReveals.forEach((element) => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('is-visible');
  });
  const revealPastViewport = () => {
    const revealLine = window.innerHeight * 0.92;
    scrollReveals.forEach((element) => {
      if (element.getBoundingClientRect().top < revealLine) element.classList.add('is-visible');
    });
  };
  window.addEventListener('scroll', revealPastViewport, { passive: true });
  revealPastViewport();

  const activeObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const activeId = entry.target.id;
      navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${activeId}`));
    });
  }, { rootMargin: '-35% 0px -55% 0px' }) : null;
  sections.forEach((section) => activeObserver?.observe(section));

  window.addEventListener('scroll', () => header?.classList.toggle('is-scrolled', window.scrollY > 8), { passive: true });
})();
