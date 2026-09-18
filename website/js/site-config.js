/**
 * Freezestack site config - single source for counts, copy, and featured content.
 */
(function (global) {
  var TEMPLATE_COUNT = 502;
  var SKILL_COUNT = 1186;
  var DISPLAY_TEMPLATE_COUNT = 1000;
  var DISPLAY_SKILL_COUNT = 1200;
  var DISPLAY_INSTANT_SKILL_COUNT = 980;
  var MOTION_PROMPT_COUNT = 393;
  var MOTION_CATEGORY_COUNT = 39;
  var DISPLAY_MOTION_PROMPT_COUNT = 390;
  var DISPLAY_MOTION_CATEGORY_COUNT = 37;

  var config = {
    siteName: 'Freezestack',
    siteUrl: 'https://freezestack.com',
    templates: TEMPLATE_COUNT,
    skills: SKILL_COUNT,
    motionPrompts: MOTION_PROMPT_COUNT,
    motionCategories: MOTION_CATEGORY_COUNT,
    display: {
      templates: DISPLAY_TEMPLATE_COUNT,
      skills: DISPLAY_SKILL_COUNT,
      instantSkills: DISPLAY_INSTANT_SKILL_COUNT,
      motionPrompts: DISPLAY_MOTION_PROMPT_COUNT,
      motionCategories: DISPLAY_MOTION_CATEGORY_COUNT,
    },
    tagline: 'Ready-made AI assets for everything you ship.',
    heroTitle: {
      line1: 'The Ultimate',
      line2: 'AI Creation Library',
    },
    /* Applied with <br> for \n in applyCounts() */
    heroLead:
      'A curated library of Grok Imagine templates, cinematic prompt packs,\n' +
      'and portable AI skills for creators, developers, founders, and AI-powered teams.',

    templateCategories: {
      Product: 122,
      "Mockup's": 122,
      'Style Edit': 56,
      'Common Uses': 17,
      'Make-up': 12,
      Filters: 7,
    },

    weeklyPicks: {
      template: {
        code: 'P-15',
        name: 'High-End Perfume Campaign',
        cat: 'Product',
        img: 'grok-templates/product/P-15.png',
        link: 'https://grok.com/imagine/templates/587400c3-9c62-4e2c-9fa3-cfae3a8794d8',
      },
      skill: {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        slash: '/meeting-notes',
        pack: 'business-pack',
        desc: 'Turn raw notes into decisions, owners, and action items.',
      },
    },

    spotlightSkills: [
      { id: 'meeting-notes', name: 'Meeting Notes', slash: '/meeting-notes', pack: 'business-pack', instant: true },
      { id: 'x-post-draft', name: 'X Post Draft', slash: '/x-post-draft', pack: 'social-media-pack', instant: true },
      { id: 'gmail-inbox-summarize', name: 'Gmail Inbox Summarize', slash: '/gmail-inbox-summarize', pack: 'google-gmail-pack', instant: false },
      { id: 'canva-social-post', name: 'Canva Social Post', slash: '/canva-social-post', pack: 'canva-pack', instant: false },
      { id: 'content-pipeline', name: 'Content Pipeline', slash: '/content-pipeline', pack: 'workflow-combos-pack', instant: false },
      { id: 'prd-draft', name: 'PRD Draft', slash: '/prd-draft', pack: 'product-pack', instant: true },
    ],

    /** Homepage: 3 free + 3 premium workflow combos (AI SKILLS section) */
    featuredCombos: {
      free: [
        {
          id: 'content-pipeline',
          name: 'Content Pipeline',
          slash: '/content-pipeline',
          pack: 'workflow-combos-pack',
          desc: 'Brief → Canva → Drive → schedule posts.',
          steps: ['Brief in Notion', 'Design in Canva', 'Export to Drive', 'Schedule via Zapier'],
          connector: true,
        },
        {
          id: 'meeting-closed-loop',
          name: 'Meeting Closed Loop',
          slash: '/meeting-closed-loop',
          pack: 'workflow-combos-pack',
          desc: 'Prep, notes, follow-up, and file - one meeting workflow.',
          steps: ['Prep from calendar', 'Capture notes', 'Send follow-up', 'File to Drive'],
          connector: true,
        },
        {
          id: 'design-to-dev',
          name: 'Design to Dev',
          slash: '/design-to-dev',
          pack: 'workflow-combos-pack',
          desc: 'Ship design handoffs into tickets and code without losing context.',
          steps: ['Figma handoff', 'Linear tickets', 'GitHub PR', 'Slack update'],
          connector: true,
        },
      ],
      premium: [
        {
          id: 'gmail-drive-handoff',
          name: 'Gmail + Drive Handoff',
          slash: '/automation-connector-playbooks-gmail-drive-handoff-brief',
          pack: 'premium-automation-connector-playbooks-pack',
          desc: 'Cross-app handoff package for mail and file workflows.',
          steps: ['Scan Gmail threads', 'Pull Drive assets', 'Handoff brief'],
          connector: true,
        },
        {
          id: 'slack-notion-handoff',
          name: 'Slack + Notion Handoff',
          slash: '/automation-connector-playbooks-slack-notion-handoff-brief',
          pack: 'premium-automation-connector-playbooks-pack',
          desc: 'Turn channel context into a structured Notion handoff.',
          steps: ['Gather Slack context', 'Structure in Notion', 'Handoff brief'],
          connector: true,
        },
        {
          id: 'github-linear-handoff',
          name: 'GitHub + Linear Handoff',
          slash: '/automation-connector-playbooks-github-linear-handoff-brief',
          pack: 'premium-automation-connector-playbooks-pack',
          desc: 'Bridge issues, PRs, and engineering tickets in one pass.',
          steps: ['Read Linear scope', 'Map GitHub changes', 'Handoff brief'],
          connector: true,
        },
      ],
    },

    /** Homepage: 3 featured motion prompts (MOTION PROMPT LIBRARY section) */
    featuredMotionPrompts: [
      {
        id: 'product-360-showcase',
        title: 'Product 360 Showcase',
        category: 'Best Combo Recipes',
        hue: 165,
        text: "The camera orbits a full 360 degrees around the product at a constant height and distance, the surface catching a slow, continuous highlight sweep as a soft studio key light rotates in sync with the camera, before settling back at the starting angle with the light in its original position. Keep the rotation speed even throughout with no acceleration, and do not let reflections or highlights jump or flicker as they travel across the surface.",
      },
      {
        id: 'portrait-hero-reveal',
        title: 'Portrait Hero Reveal',
        category: 'Best Combo Recipes',
        hue: 165,
        text: "The camera performs a slow 360-degree orbit around the subject at a constant radius, beginning at a low angle looking slightly upward, then gradually rising to eye level as the orbit completes a quarter turn, before pushing into an extreme close-up on the skin and eyes that holds long enough for fine texture - pores, fine hair, natural sheen - to read clearly, with only a soft natural blink animating within the hold. Keep the orbit's speed and radius constant throughout, and do not let the skin texture smear, flatten, or resample into a plastic surface as the camera closes in.",
      },
      {
        id: 'golden-hour-transition',
        title: 'Golden Hour Transition',
        category: 'Lighting',
        hue: 38,
        text: "The scene starts in the flat, neutral daylight of the source photo, then the light gradually warms into deep amber and gold tones as the sun angle appears to lower, with long soft shadows slowly stretching across the ground by the end of the clip. The color temperature shift should be gradual and continuous, not a sudden color swap. Keep the composition and object positions completely fixed during the transition, and avoid any exposure flicker or banding as the warmer tones take over.",
      },
    ],

    workflows: [
      {
        id: 'content-pipeline',
        name: 'Content Pipeline',
        slash: '/content-pipeline',
        steps: ['Brief in Notion', 'Design in Canva', 'Export to Drive', 'Schedule via Zapier'],
        connectors: ['notion', 'canva', 'google-drive', 'zapier'],
      },
      {
        id: 'contract-review-loop',
        name: 'Contract Review Loop',
        slash: '/contract-review-loop',
        steps: ['Find contract in Drive', 'Summarize in Word', 'Log decision in Notion'],
        connectors: ['google-drive', 'microsoft-word', 'notion'],
      },
      {
        id: 'meeting-closed-loop',
        name: 'Meeting Closed Loop',
        slash: '/meeting-closed-loop',
        steps: ['Prep from calendar', 'Capture notes', 'Send follow-up', 'File to Drive'],
        connectors: ['google-calendar', 'gmail', 'google-drive'],
      },
      {
        id: 'finance-closed-loop',
        name: 'Finance Closed Loop',
        slash: '/finance-closed-loop',
        steps: ['Harvest receipts from Gmail', 'Log in Sheets', 'Monthly P&L summary'],
        connectors: ['gmail', 'google-sheets'],
      },
      {
        id: 'sales-closed-loop',
        name: 'Sales Closed Loop',
        slash: '/sales-closed-loop',
        steps: ['CRM note from call', 'Follow-up email draft', 'Update deal stage'],
        connectors: ['hubspot', 'gmail'],
      },
      {
        id: 'hire-loop',
        name: 'Hire Loop',
        slash: '/hire-loop',
        steps: ['Job description', 'Interview questions', 'Scorecard', 'Offer draft'],
        connectors: [],
      },
    ],

    useCases: [
      {
        id: 'ecommerce',
        title: 'E-commerce & product ads',
        desc: 'Launch-ready product shots, mockups, and ad variations without reshooting.',
        templates: ['Product', "Mockup's"],
        skills: ['ad-copy', 'canva-social-post', 'product-pack'],
        templateCodes: ['P-15', 'P-60', 'P-9', 'P-117'],
      },
      {
        id: 'social',
        title: 'Social & content creators',
        desc: 'Style edits, filters, and skills that turn one idea into a week of posts.',
        templates: ['Style Edit', 'Filters', 'Make-up'],
        skills: ['linkedin-post', 'instagram-caption', 'content-pipeline'],
        templateCodes: ['S-16', 'F-1', 'M-7', 'S-10'],
      },
      {
        id: 'agency',
        title: 'Agencies & freelancers',
        desc: 'Client-ready deliverables, meeting loops, and connector workflows in one library.',
        templates: ['Product', 'Common Uses', "Mockup's"],
        skills: ['meeting-notes', 'proposal-draft', 'contract-review-loop'],
        templateCodes: ['P-1', 'C-17', 'P-30', 'C-15'],
      },
      {
        id: 'ops',
        title: 'Ops & business teams',
        desc: 'Instant skills for docs, email, and planning - plus Gmail/Outlook connectors.',
        templates: ['Common Uses'],
        skills: ['business-requirements', 'status-update', 'gmail-inbox-summarize'],
        templateCodes: ['C-2', 'C-15', 'C-17'],
      },
    ],

    compareRows: [
      {
        feature: 'Grok Imagine templates',
        free: '500+ links - open in Grok',
        bundles: 'Offline packs from $9',
        skills: '-',
      },
      {
        feature: 'AI skills (Grok / Cursor / Claude)',
        free: '1000+ skills - copy & paste',
        bundles: '-',
        skills: 'Included in Creator Pro guide',
      },
      {
        feature: 'Best for',
        free: 'Try before you buy',
        bundles: 'Bulk download & archive',
        skills: 'Daily work automation',
      },
      {
        feature: 'Setup',
        free: 'One tap',
        bundles: 'Checkout → My Library',
        skills: 'Instant or connector setup',
      },
    ],

    changelog: [
      { date: '2026-06-29', title: 'Site refresh: search, guides & My Library', items: ['Template search on gallery', 'Start-here onboarding', 'Account page for purchases', '3 new guides in the journal'] },
      { date: '2026-06-22', title: '+24 Style Edit templates', items: ['Cinematic lighting variants', 'Editorial mood presets', 'Updated marquee on homepage'] },
      { date: '2026-06-15', title: 'Skills library v2', items: ['284 skills across 27 packs', 'Connector vs instant badges', 'Copy-paste install prompts'] },
      { date: '2026-06-08', title: 'Mockup catalog expansion', items: ['214 Mockup templates', 'Category filters on templates page', 'Bundle pricing from $9'] },
      { date: '2026-05-28', title: 'Freezestack library launch', items: ['First 200+ product templates', 'Dark mode', 'Free Grok deep links'] },
    ],

    startHere: [
      {
        step: 1,
        title: 'Browse templates',
        desc: 'Pick a look on the Templates page. Every card opens the original in Grok Imagine - free, one tap.',
        cta: 'Open templates',
        href: 'templates',
        icon: 'fa-wand-magic-sparkles',
      },
      {
        step: 2,
        title: 'Copy a skill',
        desc: 'Find a skill pack, hit Copy prompt, and paste into Grok, Cursor, or Claude. Run slash commands like /meeting-notes.',
        cta: 'Browse skills',
        href: 'skills',
        icon: 'fa-bolt',
      },
      {
        step: 3,
        title: 'Learn the library',
        desc: 'See how Freezestack is built, what updates weekly, and how it relates to Grok Imagine.',
        cta: 'About Freezestack',
        href: 'about',
        icon: 'fa-circle-info',
      },
    ],
  };

  function formatCount(n) {
    return String(n);
  }

  function applyCounts() {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('[data-xf-count]').forEach(function (el) {
      var key = el.getAttribute('data-xf-count');
      var value = null;
      if (key === 'templates') value = DISPLAY_TEMPLATE_COUNT;
      else if (key === 'skills') value = DISPLAY_SKILL_COUNT;
      else if (key === 'motion-prompts') value = DISPLAY_MOTION_PROMPT_COUNT;
      if (value === null) return;

      el.setAttribute('data-xf-count-value', String(value));
      var prefix = el.getAttribute('data-xf-count-prefix') || '';
      var suffix = el.getAttribute('data-xf-count-suffix') || '';

      if (reducedMotion || el.dataset.xfCounted) {
        el.textContent = prefix + formatCount(value) + suffix;
      } else {
        el.textContent = prefix + '0' + suffix;
      }
    });
    document.querySelectorAll('.xf-footer-tagline, [data-xf-tagline]').forEach(function (el) {
      el.textContent = config.tagline;
    });
    document.querySelectorAll('[data-xf-hero-title]').forEach(function (el) {
      var line = el.getAttribute('data-xf-hero-title');
      if (line === '1') el.textContent = config.heroTitle.line1;
      else if (line === '2') el.textContent = config.heroTitle.line2;
    });
    document.querySelectorAll('[data-xf-hero-lead]').forEach(function (el) {
      /* Preserve intentional line breaks as <br> (textContent would collapse them) */
      var lead = config.heroLead || '';
      el.innerHTML = lead
        .split(/\n+/)
        .map(function (line) {
          return line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        })
        .join('<br>');
    });
    document.querySelectorAll('[data-xf-templates-count]').forEach(function (el) {
      el.textContent = String(DISPLAY_TEMPLATE_COUNT);
    });
    document.querySelectorAll('[data-xf-skills-count]').forEach(function (el) {
      el.textContent = String(DISPLAY_SKILL_COUNT);
    });
    document.querySelectorAll('[data-xf-motion-prompt-count]').forEach(function (el) {
      var suffix = el.getAttribute('data-xf-suffix');
      if (suffix === null) suffix = '+';
      el.textContent = String(DISPLAY_MOTION_PROMPT_COUNT) + suffix;
    });
    document.querySelectorAll('[data-xf-motion-category-count]').forEach(function (el) {
      var suffix = el.getAttribute('data-xf-suffix');
      if (suffix === null) suffix = '+';
      el.textContent = String(DISPLAY_MOTION_CATEGORY_COUNT) + suffix;
    });
  }

  function init() {
    applyCounts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  config.formatCount = formatCount;
  config.applyCounts = applyCounts;
  global.XFreezeSite = config;
})(typeof window !== 'undefined' ? window : globalThis);
