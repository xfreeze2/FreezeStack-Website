/**
 * Browse freely - all content pages are public.
 * Login is required only when using a resource (copy prompt, open template, etc.).
 * account.html is the only page that still requires sign-in on load.
 */
var XF_PUBLIC_PAGES = [
  'login',
  'signup',
  'home',
  'index',
  'terms',
  'privacy',
  'templates',
  'template',
  'skills',
  'prompt-library',
  'bundles',
  'contact',
  'connector-setup',
  'about',
  'pricing',
  'skill-builder',
  'workflows',
  'use-cases',
  'checkout-success',
  'checkout-cancel',
];

/**
 * Pages that redirect to login on load when requireAuth is on.
 * Resource actions are gated separately in auth.js (copy / open / use).
 */
var XF_PROTECTED_PAGES = [
  'account',
];

/**
 * Hide only account until auth check completes (prevents private content flash).
 */
(function () {
  var page = (location.pathname.split('/').pop() || '').split('?')[0];
  if (!page || page === 'index' || page === 'index.html' || page === 'home') page = 'templates';
  if (page.length > 5 && page.slice(-5) === '.html') page = page.slice(0, -5);
  if (XF_PROTECTED_PAGES.indexOf(page) !== -1) {
    document.documentElement.classList.add('xf-auth-pending');
  }
})();

/**
 * BUILD MODE: set XF_REQUIRE_AUTH_LIVE to false while finishing the site.
 * LAUNCH: set XF_REQUIRE_AUTH_LIVE to true before going public.
 * Localhost always skips auth so you can preview every page while editing.
 * When true: resource use (copy/open) requires login on the live site.
 */
var XF_IS_LOCAL_DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
var XF_REQUIRE_AUTH_LIVE = true;

/**
 * Freezestack Supabase auth config - freezestack.com
 */
window.XFreezeAuthConfig = {
  supabaseUrl: 'https://ekmllicbgmuodptvgxsl.supabase.co',
  supabaseAnonKey: 'sb_publishable_hwfaIz4HJxim1Rb3o04-UA_jyyoJgfY',
  siteUrl: 'https://freezestack.com',
  loginPath: 'login',
  defaultRedirect: 'templates',

  /* Same Google OAuth Web Client ID as Supabase (for One Tap / GIS). */
  googleClientId: '420941566311-7ms3q9vd5p6er0j1lmvnumug51c6dsqb.apps.googleusercontent.com',
  googleOneTap: true,

  requireAuth: XF_IS_LOCAL_DEV ? false : XF_REQUIRE_AUTH_LIVE,
  publicPages: XF_PUBLIC_PAGES,
  protectedPages: XF_PROTECTED_PAGES,

  providers: {
    /* Supabase: enable "X / Twitter (OAuth 2.0)" (provider id: x) */
    x: true,
    google: true,
  },
};
