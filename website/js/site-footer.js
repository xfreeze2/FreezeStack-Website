/**
 * Freezestack site footer - render, active link, crypto copy
 */
(function () {
  'use strict';

  var PAGE_MAP = {
    'home': 'home',
    'templates': 'templates',
    'about': 'about',
    'skills': 'skills',
    'skill-builder': 'skills',
    'prompt-library': 'prompts',
    'contact': 'contact',
    'pricing': 'pricing',
    'workflows': 'workflows',
    'use-cases': 'use-cases',
    'account': 'account',
    'privacy': 'privacy',
    'terms': 'terms',
    'refund': 'refund',
  };

  var CRYPTO_ADDRESSES = {
    solana: 'EYTx9xJrpB3NiTmLSWQUf4pVksN2naRKXTezZfa6VjWb',
    bitcoin: 'bc1q4ntsw4f9a6vqm5yuzy9h3zd5sc44zk870ncjwy',
    ethereum: '0x22614C159AC3226Ce92E99905EA7A401fa6e6d12',
  };

  var FOOTER_SECTIONS = [
    {
      title: 'Explore',
      links: [
        { href: 'templates', label: 'Templates', nav: 'templates' },
        { href: 'prompt-library', label: 'Motion prompts', nav: 'prompts' },
        { href: 'about', label: 'About', nav: 'about' },
        { href: 'contact', label: 'Contact', nav: 'contact' },
      ],
    },
    {
      title: 'Templates',
      links: [
        { href: 'templates?cat=Product', label: 'Product' },
        { href: 'templates?cat=Mockup%27s', label: "Mockup's" },
        { href: 'templates?cat=Style+Edit', label: 'Style Edit' },
        { href: 'templates?cat=Make-up', label: 'Make-up' },
        { href: 'templates?cat=Filters', label: 'Filters' },
        { href: 'templates?cat=Common+Uses', label: 'Common Uses' },
      ],
    },
    {
      title: 'Guides',
      links: [
        { href: 'skill-builder', label: 'Skill Builder' },
        { href: 'connector-setup', label: 'Connector setup' },
        { href: 'use-cases', label: 'Use cases', nav: 'use-cases' },
        { href: 'workflows', label: 'Workflow collections', nav: 'workflows' },
        { href: 'account', label: 'My Library', nav: 'account' },
      ],
    },
    {
      title: 'Connect',
      links: [
        { href: 'https://x.com/Freezestack', label: 'Freezestack', external: true },
        { href: 'https://grok.com', label: 'grok.com', external: true },
        { href: 'https://grok.com/imagine', label: 'Grok Imagine', external: true },
        { href: 'privacy', label: 'Privacy', nav: 'privacy' },
        { href: 'terms', label: 'Terms', nav: 'terms' },
        { href: 'refund', label: 'Refunds', nav: 'refund' },
        { href: 'mailto:contact@freezestack.com', label: 'contact@freezestack.com' },
      ],
    },
  ];

  function basePath() {
    var path = location.pathname || '';
    return (path.indexOf('/blog/') !== -1) ? '../' : '';
  }

  function currentPageKey() {
    var file = (location.pathname.split('/').pop() || 'home').split('?')[0];
    if (file.length > 5 && file.slice(-5) === '.html') file = file.slice(0, -5);
    return PAGE_MAP[file] || '';
  }

  function linkAttrs(link, base, activeKey) {
    var attrs = ' href="' + base + link.href + '"';
    if (link.external) {
      attrs += ' target="_blank" rel="noopener noreferrer"';
    }
    if (link.nav && link.nav === activeKey) {
      attrs += ' class="is-active" aria-current="page"';
    } else if (link.nav) {
      attrs += ' data-xf-nav="' + link.nav + '"';
    }
    return attrs;
  }

  function renderColumn(section, base, activeKey) {
    var items = section.links
      .map(function (link) {
        return '<li><a' + linkAttrs(link, base, activeKey) + '>' + link.label + '</a></li>';
      })
      .join('');

    return (
      '<div class="xf-footer-col">' +
      '<h3 class="xf-footer-heading">' + section.title + '</h3>' +
      '<ul class="xf-footer-list">' + items + '</ul>' +
      (section.title === 'Connect' ? renderCryptoTip() : '') +
      '</div>'
    );
  }

  function renderCryptoTip() {
    return (
      '<details class="xf-crypto-tip">' +
      '<summary class="xf-crypto-tip__summary">Optional tip · wallets</summary>' +
      '<div class="xf-crypto-tip__panel">' +
      '<p class="xf-crypto-tip__note">Totally optional - helps keep the library free.</p>' +
      '<div class="xf-crypto-tip__row">' +
      '<button type="button" class="xf-crypto-chip" data-xf-crypto="solana">' +
      '<span>◎ SOL</span><span class="xf-crypto-chip__addr">EYTx…VjWb</span></button>' +
      '<button type="button" class="xf-crypto-chip" data-xf-crypto="bitcoin">' +
      '<span>₿ BTC</span><span class="xf-crypto-chip__addr">bc1q…cjwy</span></button>' +
      '<button type="button" class="xf-crypto-chip" data-xf-crypto="ethereum">' +
      '<span>Ξ ETH</span><span class="xf-crypto-chip__addr">0x22…6d12</span></button>' +
      '</div></div></details>'
    );
  }

  function renderFooter() {
    var root = document.querySelector('[data-xf-footer-root]');
    if (!root) return;

    var base = basePath();
    var activeKey = currentPageKey();
    var columns = FOOTER_SECTIONS.map(function (section) {
      return renderColumn(section, base, activeKey);
    }).join('');

    root.innerHTML =
      '<div class="scroll-reveal-in content-container xf-site-footer__inner">' +
      '<div class="xf-footer-shell">' +
      '<div class="xf-footer-brand">' +
      '<p class="xf-footer-eyebrow">AI library for</p>' +
      '<a href="' + base + 'templates" class="xf-footer-logo">Freezestack</a>' +
      '<p class="xf-footer-tagline" data-xf-tagline>Ready-made AI assets for everything you ship.</p>' +
      renderFooterThemeSwitch() +
      '</div>' +
      '<div class="xf-footer-columns">' + columns + '</div>' +
      '</div>' +
      '<div class="xf-footer-bottom">' +
      '<p class="xf-footer-copy">© 2026 Freezestack</p>' +
      '<p class="xf-footer-note">' +
      'Not affiliated with xAI. Templates open in ' +
      '<a href="https://grok.com/imagine" target="_blank" rel="noopener noreferrer">Grok Imagine</a>.' +
      '</p></div></div>';

    root.querySelectorAll('[data-xf-crypto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyCrypto(btn.getAttribute('data-xf-crypto'), btn);
      });
    });

    syncFooterThemeSwitch(root);

    if (window.XFreezeSite && window.XFreezeSite.applyCounts) {
      window.XFreezeSite.applyCounts();
    }
  }

  function renderFooterThemeSwitch() {
    /* Plain footer toggle only - flat track, simple sun/moon (not crystal nav switch) */
    return (
      '<div class="xf-footer-theme">' +
      '<button type="button" onclick="typeof toggleTheme===\'function\'&&toggleTheme()" ' +
      'class="xf-footer-theme-switch theme-toggle" ' +
      'role="switch" aria-checked="false" aria-label="Switch to dark mode" title="Dark mode">' +
      '<span class="xf-footer-theme-switch__track" aria-hidden="true">' +
      '<span class="xf-footer-theme-switch__thumb">' +
      '<span class="xf-footer-theme-switch__icon xf-footer-theme-switch__icon--sun">' +
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-16h1.5v3H12V2zm0 19h1.5v3H12v-3zM2 12h3v1.5H2V12zm19 0h3v1.5h-3V12zM4.22 4.22l2.12 2.12-1.06 1.06L3.16 5.28l1.06-1.06zm15.56 15.56 2.12 2.12-1.06 1.06-2.12-2.12 1.06-1.06zM19.78 4.22l1.06 1.06-2.12 2.12-1.06-1.06 2.12-2.12zM6.34 17.66l1.06 1.06-2.12 2.12-1.06-1.06 2.12-2.12z"/>' +
      '</svg></span>' +
      '<span class="xf-footer-theme-switch__icon xf-footer-theme-switch__icon--moon">' +
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12.1 2.2a9.8 9.8 0 1 0 9.7 12.4A7.5 7.5 0 1 1 12.1 2.2z"/>' +
      '</svg></span>' +
      '</span></span></button></div>'
    );
  }

  function syncFooterThemeSwitch(root) {
    var isDark = document.documentElement.classList.contains('dark');
    var btns = (root || document).querySelectorAll('.xf-footer-theme .theme-toggle');
    btns.forEach(function (btn) {
      btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', isDark ? 'Light mode' : 'Dark mode');
    });
  }

  function initFooterNav() {
    var key = currentPageKey();
    if (!key) return;

    document.querySelectorAll('.xf-footer-list a[data-xf-nav="' + key + '"]').forEach(function (link) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    });
  }

  function initTopNav() {
    var key = currentPageKey();
    if (!key) return;

    var hrefMap = {
      home: 'templates',
      templates: 'templates',
      about: 'about',
      contact: 'contact',
      workflows: 'workflows',
      'use-cases': 'use-cases',
      account: 'account',
    };

    var target = hrefMap[key];
    if (!target) return;

    document.querySelectorAll('.site-nav-pill a.site-nav-pill-link').forEach(function (link) {
      var href = (link.getAttribute('href') || '').split('?')[0];
      var normalized = href.replace(/^\.\.\//, '');
      if (normalized === target || href === target) {
        link.classList.add('site-nav-pill-link--active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function copyCrypto(coin, btnEl) {
    var full = CRYPTO_ADDRESSES[coin];
    if (!full || !btnEl) return;

    var original = btnEl.innerHTML;

    function onSuccess() {
      btnEl.classList.add('is-copied');
      btnEl.innerHTML = '<span>Copied</span>';
      if (window.XFreezeSupportToast) {
        window.XFreezeSupportToast.afterCopy({
          subtitle: 'Wallet address copied.',
        });
      }
      setTimeout(function () {
        btnEl.classList.remove('is-copied');
        btnEl.innerHTML = original;
      }, 1600);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(full).then(onSuccess).catch(function () {
        window.prompt('Copy this address:', full);
      });
      return;
    }

    window.prompt('Copy this address:', full);
  }

  function loadFaqBot() {
    if (document.getElementById('xf-faq-bot')) return;

    var base = basePath();

    if (!document.querySelector('link[data-xf-faq-bot-css]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = base + 'css/faq-assistant.css?v=10';
      link.setAttribute('data-xf-faq-bot-css', '');
      document.head.appendChild(link);
    }

    function loadAssistant() {
      var script = document.createElement('script');
      script.src = base + 'js/faq-assistant.js?v=10';
      script.defer = true;
      document.body.appendChild(script);
    }

    if (window.XFreezeFaqBotData) {
      loadAssistant();
      return;
    }

    var dataScript = document.createElement('script');
    dataScript.src = base + 'data/faq-bot-data.js?v=2';
    dataScript.onload = loadAssistant;
    dataScript.onerror = loadAssistant;
    document.body.appendChild(dataScript);
  }

  /**
   * Vercel Speed Insights for static HTML (not Next.js).
   * Do not use: import { SpeedInsights } from "@vercel/speed-insights/next"
   * Enable Speed Insights in the Vercel project dashboard as well.
   */
  function injectSpeedInsights() {
    if (document.querySelector('script[src*="speed-insights/script.js"]')) return;
    try {
      window.si =
        window.si ||
        function () {
          (window.siq = window.siq || []).push(arguments);
        };
    } catch (e) {}
    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/speed-insights/script.js';
    document.head.appendChild(s);
  }

  function init() {
    renderFooter();
    initFooterNav();
    initTopNav();
    loadFaqBot();
    injectSpeedInsights();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.XFreezeFooter = {
    copyCrypto: copyCrypto,
    init: init,
    renderFooter: renderFooter,
    syncTheme: function (root) {
      syncFooterThemeSwitch(root);
    },
  };
})();