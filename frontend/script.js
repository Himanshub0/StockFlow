/* ══════════════════════════════════════════════════════════════════════════════
   StockFlow — Motion Choreography & Interaction Engine
   ──────────────────────────────────────────────────────────────────────────────
   Animation/UX Principles Applied:
     1. Exaggeration        — count-up numbers, oversized transitions
     2. Origin Awareness     — transforms from element center
     3. Staggering           — sequential cascade IntersectionObserver reveals
     4. Squash & Stretch     — button deformations (CSS-driven)
     5. Rubber Banding       — elastic overscroll containment on mobile nav
     6. Doherty Threshold    — all interactions respond < 400ms
     7. Anticipation         — hover pre-glow, pre-click scale
     8. Fitts's Law          — large touch targets, full-width mobile buttons
     9. Slow In, Slow Out    — custom cubic-bezier spring curves (CSS-driven)
    10. Hick's Law           — progressive disclosure, minimal nav
    11. Follow-through       — overshoot-then-settle on reveals (CSS spring)
    12. Arcs                 — curved reveal paths (CSS transform)
    13. Von Restorff Effect  — accent highlights, warning pulses
    14. Timing               — calibrated durations per element weight
    15. Interruptible Motion  — animations cancel on user input
    16. Secondary Action     — supporting micro-animations (CSS)
    17. Solid Drawings       — 3D perspective transforms (CSS)
    18. Frequency of Use     — most-used links prominent
    19. Peak-end Rule        — memorable closing section experience
   ══════════════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ── Doherty Threshold: ensure all interaction callbacks fire in < 10ms ── */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ══════════════════════════════════════════════════════════════════════════
     NAVIGATION — Hick's Law (minimal choices) + Staggering (cascade)
     ══════════════════════════════════════════════════════════════════════════ */

  const header = $('[data-header]');
  const menuToggle = $('.menu-toggle');
  const mobileOverlay = $('#mobile-menu');
  const mobileLinks = $$('.mobile-link, .button-mobile, .mobile-divider');
  const navLinks = $$('.nav-link');
  const sections = $$('[data-section]');

  // ── Mobile menu: fullscreen overlay with staggered reveals ──
  if (menuToggle && mobileOverlay) {
    const openMenu = () => {
      mobileOverlay.classList.add('is-open');
      mobileOverlay.setAttribute('aria-hidden', 'false');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close navigation');
      document.body.style.overflow = 'hidden'; // Rubber Banding: prevent background scroll
    };

    const closeMenu = () => {
      mobileOverlay.classList.remove('is-open');
      mobileOverlay.setAttribute('aria-hidden', 'true');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      document.body.style.overflow = '';
    };

    menuToggle.addEventListener('click', () => {
      const isOpen = mobileOverlay.classList.contains('is-open');
      if (isOpen) closeMenu(); else openMenu();
    });

    // Close on link click
    $$('a', mobileOverlay).forEach(link =>
      link.addEventListener('click', closeMenu)
    );

    // Close on Escape — Interruptible Motion: user can cancel animation
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileOverlay.classList.contains('is-open')) {
        closeMenu();
        menuToggle.focus();
      }
    });
  }

  // ── Scroll state for header ──
  // Doherty Threshold: passive listener, simple toggle, < 1ms
  let lastScrollY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 10);
    lastScrollY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial check

  // ── Active nav link tracking ──
  // Timing: rootMargin calibrated for section visibility
  if ('IntersectionObserver' in window) {
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        if (!id) return;
        navLinks.forEach(link =>
          link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`)
        );
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    sections.forEach(section => activeObserver.observe(section));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SCROLL REVEALS — Staggering + Follow-through + Arcs + Timing
     ══════════════════════════════════════════════════════════════════════════ */

  // Collect all revealable elements
  const revealElements = $$('.reveal-arc, .reveal-stagger');

  if ('IntersectionObserver' in window && revealElements.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        // Interruptible Motion: use requestAnimationFrame for smooth timing
        requestAnimationFrame(() => {
          entry.target.classList.add('is-visible');
        });

        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Fallback: reveal elements already in viewport on load
    // Doherty Threshold: immediate reveal for above-fold content
    const revealImmediate = () => {
      const viewH = window.innerHeight;
      revealElements.forEach(el => {
        if (el.getBoundingClientRect().top < viewH * 0.92) {
          el.classList.add('is-visible');
        }
      });
    };
    revealImmediate();
    window.addEventListener('scroll', revealImmediate, { passive: true, once: false });
  } else {
    // No IntersectionObserver: show everything immediately
    revealElements.forEach(el => el.classList.add('is-visible'));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     COUNT-UP ANIMATION — Exaggeration + Timing + Doherty Threshold
     ══════════════════════════════════════════════════════════════════════════ */

  const countUpElements = $$('.count-up');

  if ('IntersectionObserver' in window && countUpElements.length) {
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10);
        if (isNaN(target)) return;

        // Timing: 1.2s count-up with ease-out
        const duration = 1200;
        const startTime = performance.now();

        const animate = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Slow In, Slow Out: ease-out-quart
          const eased = 1 - Math.pow(1 - progress, 4);
          const current = Math.round(eased * target);

          el.textContent = current.toLocaleString();

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    countUpElements.forEach(el => countObserver.observe(el));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MAGNETIC BUTTON HOVER — Anticipation + Squash & Stretch
     Buttons subtly track the cursor for a "magnetic" attraction effect
     ══════════════════════════════════════════════════════════════════════════ */

  const heroButtons = $$('.button-hero, .button-light');

  heroButtons.forEach(btn => {
    const maxMove = 6; // px — subtle enough to feel alive, not distracting

    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Origin Awareness: movement emanates from cursor position relative to center
      const moveX = (x / rect.width) * maxMove;
      const moveY = (y / rect.height) * maxMove;

      btn.style.transform = `translate(${moveX}px, ${moveY}px) scaleX(1.01) scaleY(0.99)`;
    });

    btn.addEventListener('mouseleave', () => {
      // Follow-through: spring back to rest
      btn.style.transform = '';
    });
  });

  /* ══════════════════════════════════════════════════════════════════════════
     SMOOTH SCROLL — Slow In, Slow Out
     Custom smooth scroll with spring easing for anchor links
     ══════════════════════════════════════════════════════════════════════════ */

  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = $(targetId);
      if (!target) return;

      e.preventDefault();

      // Doherty Threshold: start scrolling immediately
      const targetY = target.getBoundingClientRect().top + window.scrollY - 100;

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });

      // Update URL without scroll jump
      history.pushState(null, '', targetId);
    });
  });

  /* ══════════════════════════════════════════════════════════════════════════
     INVENTORY BAR ANIMATION — Timing + Exaggeration
     Animate the inventory percentage bars when visible
     ══════════════════════════════════════════════════════════════════════════ */

  const barContainers = $$('.inventory-bars');

  if ('IntersectionObserver' in window && barContainers.length) {
    const barObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const bars = $$('span', entry.target);
        bars.forEach((bar, i) => {
          // Staggering: each bar animates with delay
          setTimeout(() => {
            bar.style.setProperty('--bar-animate', '1');
          }, i * 150);
        });

        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    barContainers.forEach(el => barObserver.observe(el));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CHART LINE DRAW — Anticipation + Timing
     Draw the SVG chart line progressively when visible
     ══════════════════════════════════════════════════════════════════════════ */

  const chartLines = $$('.chart-line');

  if ('IntersectionObserver' in window && chartLines.length) {
    // Set up initial state: dashed to full
    chartLines.forEach(line => {
      const length = line.getTotalLength ? line.getTotalLength() : 800;
      line.style.strokeDasharray = length;
      line.style.strokeDashoffset = length;
      line.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    const chartObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        // Anticipation: slight delay before draw begins
        setTimeout(() => {
          entry.target.style.strokeDashoffset = '0';
        }, 300);

        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    chartLines.forEach(line => chartObserver.observe(line));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PARALLAX MESH ORBS — Secondary Action
     Subtle parallax movement on the hero background orbs
     ══════════════════════════════════════════════════════════════════════════ */

  const meshOrbs = $$('.mesh-orb');

  if (meshOrbs.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;

    const updateOrbs = () => {
      const scrollY = window.scrollY;
      const heroHeight = $('.hero')?.offsetHeight || 800;

      if (scrollY < heroHeight) {
        const factor = scrollY / heroHeight;
        meshOrbs.forEach((orb, i) => {
          const speed = (i + 1) * 0.08;
          orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateOrbs);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PEAK-END RULE — Closing Section Entrance
     The closing section gets a special, more dramatic reveal
     ══════════════════════════════════════════════════════════════════════════ */

  const closingSection = $('.closing-section');

  if (closingSection && 'IntersectionObserver' in window) {
    const closingObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          closingSection.classList.add('is-revealed');
        }
      });
    }, { threshold: 0.15 });

    closingObserver.observe(closingSection);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INTERACTIVE SHOWCASE TABLE — Doherty Threshold (< 30ms reactive search)
     & Hick's Law (clear status categorization)
     ══════════════════════════════════════════════════════════════════════════ */

  const productSearch = $('#productSearchInput');
  const clearSearch = $('#clearSearchBtn');
  const filterBtns = $$('.filter-btn');
  const tableRows = $$('#interactiveProductTable .table-row:not(.table-head)');
  const resultsCountText = $('#tableResultsCount');
  const countBadge = $('#catalog-count-badge');

  if (tableRows.length) {
    let currentFilter = 'all';
    let currentQuery = '';

    const applyTableFilters = () => {
      let visibleCount = 0;

      tableRows.forEach(row => {
        const rowStatus = row.getAttribute('data-status') || '';
        const rowName = (row.getAttribute('data-name') || '').toLowerCase();
        const rowCategory = (row.getAttribute('data-category') || '').toLowerCase();

        const matchesFilter = currentFilter === 'all' || rowStatus === currentFilter;
        const matchesQuery = !currentQuery || rowName.includes(currentQuery) || rowCategory.includes(currentQuery);

        if (matchesFilter && matchesQuery) {
          row.classList.remove('is-hidden');
          visibleCount++;
        } else {
          row.classList.add('is-hidden');
        }
      });

      if (resultsCountText) {
        resultsCountText.textContent = `Showing ${visibleCount} of ${tableRows.length} demo items (248 total in live store)`;
      }
      if (countBadge) {
        countBadge.textContent = `${visibleCount} of 248 products shown`;
      }
    };

    // Filter pill buttons
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        applyTableFilters();
      });
    });

    // Real-time search input (Doherty Threshold: sub-30ms)
    if (productSearch) {
      productSearch.addEventListener('input', () => {
        currentQuery = productSearch.value.trim().toLowerCase();
        if (clearSearch) {
          clearSearch.style.display = currentQuery ? 'inline-flex' : 'none';
        }
        applyTableFilters();
      });
    }

    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        if (productSearch) {
          productSearch.value = '';
          currentQuery = '';
          clearSearch.style.display = 'none';
          productSearch.focus();
          applyTableFilters();
        }
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     3D INTERACTIVE TILT ON DASHBOARD HERO — Solid Drawings & Tactility
     Subtly tilts the perspective window based on mouse position
     ══════════════════════════════════════════════════════════════════════════ */

  const dashboardShell = $('.dashboard-shell');
  const dashboardHero = $('.dashboard-hero');

  if (dashboardShell && dashboardHero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let isHovering = false;
    let targetX = -4; // default base angle
    let targetY = 2;
    let currentX = targetX;
    let currentY = targetY;

    dashboardHero.addEventListener('mouseenter', () => {
      isHovering = true;
    });

    dashboardHero.addEventListener('mousemove', (e) => {
      const rect = dashboardHero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Restrain rotation within subtle, calm bounds
      targetX = x * 4 - 2;
      targetY = -y * 3 + 1;
      dashboardShell.style.transform = `rotateY(${targetX}deg) rotateX(${targetY}deg)`;
    });

    dashboardHero.addEventListener('mouseleave', () => {
      isHovering = false;
      dashboardShell.style.transform = ''; // revert to CSS default
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DASHBOARD PREVIEW SIDEBAR TABS — Micro-Interactions
     ══════════════════════════════════════════════════════════════════════════ */

  const sideItems = $$('.dashboard-sidebar .side-item');
  const dashHeadingText = $('.dashboard-heading h2');

  sideItems.forEach(item => {
    item.addEventListener('click', () => {
      sideItems.forEach(si => si.classList.remove('active'));
      item.classList.add('active');

      const label = item.textContent.trim();
      if (dashHeadingText) {
        dashHeadingText.style.opacity = '0.5';
        setTimeout(() => {
          dashHeadingText.textContent = `${label} summary`;
          dashHeadingText.style.opacity = '1';
        }, 120);
      }
    });
  });

  /* ══════════════════════════════════════════════════════════════════════════
     THEME MANAGEMENT — Dark/Light Mode Sync with app.html & app.js
     ══════════════════════════════════════════════════════════════════════════ */

  const themeToggle = $('#theme-toggle');
  const mobileThemeToggle = $('#mobile-theme-toggle');
  const mobileThemeLabel = $('#mobile-theme-label');

  const SUN_PATH = 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m0-12.8L7 7m10 10 1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z';
  const MOON_PATH = 'M20.6 15.7A8.5 8.5 0 0 1 8.3 3.4 8.5 8.5 0 1 0 20.6 15.7Z';

  const syncThemeUI = (theme) => {
    const isDark = theme === 'dark';
    const targetPath = isDark ? SUN_PATH : MOON_PATH;
    const nextLabel = `Switch to ${isDark ? 'light' : 'dark'} mode`;

    if (themeToggle) {
      themeToggle.setAttribute('aria-label', nextLabel);
      themeToggle.setAttribute('title', nextLabel);
      const pathEl = $('path', themeToggle);
      if (pathEl) pathEl.setAttribute('d', targetPath);
    }

    if (mobileThemeToggle) {
      mobileThemeToggle.setAttribute('aria-label', nextLabel);
      const pathEl = $('path', mobileThemeToggle);
      if (pathEl) pathEl.setAttribute('d', targetPath);
      if (mobileThemeLabel) {
        mobileThemeLabel.textContent = `Switch to ${isDark ? 'Light' : 'Dark'} Mode`;
      }
    }
  };

  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('stockflow-theme', next);
    } catch (_) {}
    syncThemeUI(next);
  };

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', toggleTheme);
  }

  // Initialize theme UI matching existing dataset theme or stored preference
  const initTheme = document.documentElement.dataset.theme || 'light';
  syncThemeUI(initTheme);

  /* ══════════════════════════════════════════════════════════════════════════
     BACK TO TOP BUTTON
     ══════════════════════════════════════════════════════════════════════════ */

  const backToTopBtn = $('#backToTop');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

})();
