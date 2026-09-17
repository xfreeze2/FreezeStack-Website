/* Freezestack static frontend. Public catalogue rendering never waits for auth.
 * Generation contract: /api/generation/{models,upload,quote,generate,jobs}.
 * Local drafts contain editable text/options. Session recovery stores the exact quoted
 * request and idempotency key, including private asset paths; never raw prompts or image bytes.
 */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = document.body.dataset.page;
  const RATIOS = ['1:1', '2:3', '3:4', '4:3', '9:16', '16:9'];
  const storage = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  };
  const savedFavorites = storage.get('freezestack-favorites', []);
  const favorites = new Set(Array.isArray(savedFavorites) ? savedFavorites.map(String) : []);
  let cataloguePromise, toastTimer;
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === 'class') node.className = value;
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value === true ? '' : String(value));
    });
    children.flat().forEach(child => { if (child != null) node.append(child instanceof Node ? child : document.createTextNode(String(child))); });
    return node;
  }
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', name === 'heart' ? 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z' : 'M8 3h12v14H8zM4 7v14h12M11 13l2-3 4 4');
    svg.append(path); return svg;
  }
  function safeURL(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try { const url = new URL(value, location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  }
  function img(src, alt, eager = false) {
    const node = el('img', { src: safeURL(src) || undefined, alt, loading: eager ? 'eager' : 'lazy', decoding: 'async' });
    node.addEventListener('error', () => { node.hidden = true; node.parentElement?.classList.add('asset-unavailable'); }, { once: true });
    return node;
  }
  function toast(message) { const node = $('#toast'); node.textContent = message; node.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 3500); }
  function currentReturn() { return location.pathname + location.search; }
  function rememberReturn(path = currentReturn()) { try { sessionStorage.setItem('xf-auth-redirect', path); } catch {} }
  function accessLink(status, path = currentReturn()) {
    return el('a', { class: 'button', href: `${status === 401 ? '/login' : '/pricing'}?returnTo=${encodeURIComponent(path)}`, onclick: () => rememberReturn(path) }, status === 401 ? 'Sign in to continue' : 'Explore membership', ' ↗');
  }
  async function token() {
    // Auth is loaded independently after this script; wait only for protected actions.
    for (let i = 0; i < 80 && !window.XFreezeAuth; i++) await new Promise(resolve => setTimeout(resolve, 50));
    const client = window.XFreezeAuth?.getClient?.();
    if (!client) return null;
    const result = await Promise.race([client.auth.getSession(), new Promise(resolve => setTimeout(() => resolve(null), 6000))]);
    return result?.data?.session?.access_token || null;
  }
  async function request(path, { auth = false, method = 'GET', body, headers = {} } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const jwt = auth ? await token() : null;
      const response = await fetch(path, { method, headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal, cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { const error = new Error(typeof data.error === 'string' ? data.error : data.error?.message || 'This request could not be completed. Please try again.'); error.status = response.status; error.code = data.error?.code || data.code; throw error; }
      if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('The service is not available yet. Please try again shortly.');
      return data;
    } catch (error) { if (error.name === 'AbortError') throw new Error('The request timed out. Check your connection and try again.'); throw error; }
    finally { clearTimeout(timer); }
  }
  function catalogue() { return cataloguePromise ||= request('/api/templates').then(data => { if (!Array.isArray(data.templates)) throw new Error('The catalogue is not available yet.'); return data; }).catch(error => { cataloguePromise = null; throw error; }); }
  function published(data) { return data.templates.filter(t => t.published === true && t.thumbnail && t.preview); }
  function empty(title, description, action) { return el('div', { class: 'empty-state' }, el('span', { class: 'empty-symbol', 'aria-hidden': 'true' }, '↗'), el('h2', {}, title), el('p', {}, description), action); }
  function skeletons(container, count = 8) { container.replaceChildren(...Array.from({ length: count }, () => el('div', { 'aria-hidden': 'true' }, el('div', { class: 'skeleton card-skeleton' }), el('div', { class: 'skeleton line-skeleton' }), el('div', { class: 'skeleton line-skeleton short' })))); }
  function badge(tier) { return el('span', { class: `badge${tier === 'free' ? ' badge-free' : ''}` }, tier === 'free' ? 'Free' : 'Premium'); }
  function favoriteButton(template) {
    const id = String(template.id), active = favorites.has(id);
    const button = el('button', { class: 'favorite-button', 'data-favorite-id': id, 'data-favorite-title': template.title, 'aria-label': `${active ? 'Remove' : 'Save'} ${template.title} ${active ? 'from' : 'to'} favorites`, 'aria-pressed': String(active), type: 'button' }, icon('heart'));
    button.addEventListener('click', () => {
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      const saved = storage.set('freezestack-favorites', [...favorites]);
      const selected = favorites.has(id);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${selected ? 'Remove' : 'Save'} ${template.title} ${selected ? 'from' : 'to'} favorites`);
      toast(saved ? selected ? 'Saved to favorites on this device' : 'Removed from favorites' : 'Saved for this visit. Browser storage is unavailable.');
      refreshFavoriteButtons();
      document.dispatchEvent(new CustomEvent('favoriteschange'));
    }); return button;
  }
  function syncFavorites() {
    const saved = storage.get('freezestack-favorites', null);
    if (Array.isArray(saved)) { favorites.clear(); saved.forEach(id => favorites.add(String(id))); }
  }
  function refreshFavoriteButtons() {
    $$('[data-favorite-id]').forEach(button => {
      const selected = favorites.has(button.dataset.favoriteId);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${selected ? 'Remove' : 'Save'} ${button.dataset.favoriteTitle} ${selected ? 'from' : 'to'} favorites`);
      const label = $('span', button); if (label) label.textContent = selected ? 'Saved' : 'Save';
    });
  }
  window.addEventListener('storage', event => {
    if (event.key === 'freezestack-favorites' || event.key === null) { if (event.newValue === null) favorites.clear(); syncFavorites(); refreshFavoriteButtons(); document.dispatchEvent(new CustomEvent('favoriteschange')); }
    if (event.key === 'freezestack-recent' || event.key === null) document.dispatchEvent(new CustomEvent('recentchange'));
  });
  window.addEventListener('pageshow', event => { if (event.persisted) { syncFavorites(); refreshFavoriteButtons(); } });
  function templateCard(t) {
    const count = Number(t.image_count) || 1;
    return el('article', { class: 'template-card', 'data-template-id': t.id }, el('a', { class: 'card-link', href: `/templates/${encodeURIComponent(t.id)}` }, el('div', { class: 'card-visual' }, img(t.thumbnail, t.title), el('span', { class: 'card-image-count' }, icon('images'), `${count} reference${count === 1 ? '' : 's'}`)), el('div', { class: 'card-heading' }, el('h3', {}, t.title), badge(t.tier)), el('p', { class: 'card-description' }, t.short_description || t.category_name)), favoriteButton(t));
  }
  function featured(items) {
    const preferred = ['portraits-headshots', 'products-ecommerce', 'real-estate-interiors'];
    const chosen = preferred.map(category => items.find(t => t.category === category)).filter(Boolean);
    for (const t of items) { if (chosen.length >= 3) break; if (!chosen.includes(t)) chosen.push(t); }
    return chosen;
  }
  function recentIds() {
    const saved = storage.get('freezestack-recent', []);
    return Array.isArray(saved) ? [...new Set(saved.filter(id => typeof id === 'string' && /^\d{4}$/.test(id)))].slice(0, 40) : [];
  }
  function recordVisit(id) { storage.set('freezestack-recent', [id, ...recentIds().filter(old => old !== id)].slice(0, 40)); }
  function lastLibrary() {
    try { const path = sessionStorage.getItem('freezestack-last-library'); return /^\/templates(?:\?[^#]*)?$/.test(path || '') ? path : '/templates'; } catch { return '/templates'; }
  }
  async function galleryPage() {
    const grid = $('#gallery'), browse = window.FreezeStackBrowse;
    let state = browse.read(location.search), timer;
    const filterOptions = $('#filter-options'), mobileFilters = matchMedia('(max-width: 760px)');
    const fitFilters = () => { filterOptions.open = !mobileFilters.matches; };
    fitFilters(); mobileFilters.addEventListener('change', fitFilters);
    document.addEventListener('click', event => { if (mobileFilters.matches && !filterOptions.contains(event.target)) filterOptions.open = false; });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && mobileFilters.matches && filterOptions.open) { filterOptions.open = false; $('summary', filterOptions).focus(); } });
    skeletons(grid);
    try {
      const data = await catalogue(), items = published(data);
      const categories = [{ slug: 'all', name: 'All categories' }, ...(data.categories || []).filter(c => typeof c === 'string' ? items.some(t => t.category === c) : items.some(t => t.category === (c.slug || c.id))).map(c => typeof c === 'string' ? { slug: c, name: c } : { slug: c.slug || c.id, name: c.name || c.title || c.slug })];
      const categoryLabels = { all: 'All categories', 'portraits-headshots': 'Portraits', 'beauty-grooming': 'Beauty & grooming', 'fashion-try-on': 'Fashion & try-on', 'creative-style-edits': 'Creative edits', 'characters-avatars': 'Characters & avatars', 'photo-editing-restoration': 'Photo editing', 'products-ecommerce': 'Products', mockups: 'Mockups', 'branding-logos-typography': 'Branding & logos', 'real-estate-interiors': 'Interiors', 'social-media-content': 'Social content', 'ads-campaigns': 'Ads & campaigns', 'posters-covers-invitations': 'Posters & invites' };
      $('#categories').replaceChildren(...categories.map(c => el('button', { type: 'button', class: 'category', title: c.name, 'data-category': c.slug, 'data-label': c.name, onclick: () => { state.category = c.slug; update(); } }, el('span', { class: 'category-name' }, categoryLabels[c.slug] || c.name), el('span', { class: 'category-count' }))));
      function syncControls() {
        $('#search').value = state.search; $('#tier').value = state.tier;
        $('#references').value = state.references; $('#sort').value = state.sort;
      }
      function render(writeHistory = 'replace') {
        if (!categories.some(c => c.slug === state.category)) state.category = 'all';
        const viral = $('[data-viral-effects]');
        if (viral) {
          viral.hidden = state.view !== 'all' || state.category !== 'all' || !!state.search.trim() || state.tier !== 'all' || state.references !== 'all' || state.limit > 24;
          if (!viral.hidden) window.FreezeStackViral?.mount(viral, items);
        }
        const recent = recentIds(), { matches, counts } = browse.select(items, state, favorites, recent);
        const focus = document.activeElement, focusedId = focus?.closest('.template-card')?.dataset.templateId;
        grid.replaceChildren(...matches.slice(0, state.limit).map(templateCard)); grid.setAttribute('aria-busy', 'false');
        if (focusedId && focus?.classList.contains('favorite-button')) {
          const cards = $$('.template-card', grid);
          (cards.find(card => card.dataset.templateId === focusedId)?.querySelector('.favorite-button') || cards[0]?.querySelector('.favorite-button') || $('#search')).focus({ preventScroll: true });
        }
        const personalCount = items.filter(t => state.view === 'saved' ? favorites.has(String(t.id)) : recent.includes(String(t.id))).length;
        if (!matches.length) {
          const noPersonal = state.view !== 'all' && !personalCount;
          grid.append(empty(noPersonal ? state.view === 'saved' ? 'Keep the looks you love.' : 'Pick up where you left off.' : 'No templates match these filters.', noPersonal ? state.view === 'saved' ? 'Tap the heart on any template to find it here. Saved templates stay in this browser.' : 'Open a template and it will appear here. Your last 40 viewed templates stay in this browser.' : 'Try fewer search words or remove a filter. Your saved templates are still safe.', el('button', { class: 'button button-secondary', onclick: () => { if (noPersonal) state.view = 'all'; reset(); } }, noPersonal ? 'Discover templates' : 'Clear filters')));
        }
        $('#result-count').textContent = `${matches.length.toLocaleString()} template${matches.length === 1 ? '' : 's'} · ${Math.min(matches.length, state.limit)} shown`;
        $('#load-more').hidden = matches.length <= state.limit;
        const optionCount = Number(state.tier !== 'all') + Number(state.references !== 'all');
        $('#filter-options-count').hidden = !optionCount; $('#filter-options-count').textContent = optionCount;
        $('#discover-count').textContent = items.length.toLocaleString();
        $('#saved-count').textContent = items.filter(t => favorites.has(String(t.id))).length.toLocaleString();
        $('#view-note').hidden = state.view === 'all';
        $('#view-note').textContent = state.view === 'recent' ? 'Last 40 opened templates · stored in this browser' : 'Saved in this browser · not synced to your account';
        $('#sort option[value=default]').textContent = state.view === 'recent' ? 'Last viewed' : 'Catalogue order';
        $$('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
        $$('.category', $('#categories')).forEach(button => {
          const active = button.dataset.category === state.category, count = counts.get(button.dataset.category) || 0;
          button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
          $('.category-count', button).textContent = `(${count.toLocaleString()})`;
          button.setAttribute('aria-label', `${button.dataset.label}, ${count.toLocaleString()} template${count === 1 ? '' : 's'}`);
        });
        const filters = [];
        if (state.search.trim()) filters.push(['search', `“${state.search.trim()}”`, '']);
        if (state.category !== 'all') filters.push(['category', categories.find(c => c.slug === state.category).name, 'all']);
        if (state.tier !== 'all') filters.push(['tier', state.tier === 'free' ? 'Free prompts' : 'Premium prompts', 'all']);
        if (state.references !== 'all') filters.push(['references', state.references === '1' ? '1 reference image' : '2+ reference images', 'all']);
        $('#active-filters').replaceChildren(...filters.map(([key, label, value]) => el('button', { type: 'button', class: 'filter-chip', 'aria-label': `Remove filter: ${label}`, onclick: () => { state[key] = value; syncControls(); update(); $('#search').focus({ preventScroll: true }); } }, label, el('span', { 'aria-hidden': 'true' }, '×'))));
        $('.active-filter-row').hidden = !filters.length; $('#clear-filters').hidden = !filters.length;
        const next = browse.url(state);
        if (writeHistory) {
          if (writeHistory === 'push' && next !== currentReturn()) history.pushState(null, '', next);
          else history.replaceState(null, '', next);
        }
        try { sessionStorage.setItem('freezestack-last-library', next); } catch {}
      }
      function update(mode = 'push') { clearTimeout(timer); state.limit = 24; render(mode); }
      function reset() { Object.assign(state, { search: '', category: 'all', tier: 'all', references: 'all' }); syncControls(); update(); $('#search').focus({ preventScroll: true }); }
      $('#search').addEventListener('input', event => { state.search = event.target.value; clearTimeout(timer); timer = setTimeout(() => update('replace'), 140); });
      ['tier', 'references', 'sort'].forEach(key => $('#' + key).addEventListener('change', event => { state[key] = event.target.value; update(); }));
      $$('[data-view]').forEach(button => button.addEventListener('click', () => { state.view = button.dataset.view; update(); }));
      $('#clear-filters').addEventListener('click', reset);
      $('#load-more').addEventListener('click', () => { clearTimeout(timer); const firstNew = state.limit; state.limit += 24; render(); $$('.card-link', grid)[firstNew]?.focus({ preventScroll: true }); });
      document.addEventListener('favoriteschange', () => {
        if (state.view === 'saved') render();
        else $('#saved-count').textContent = items.filter(t => favorites.has(String(t.id))).length.toLocaleString();
      });
      window.addEventListener('popstate', () => { clearTimeout(timer); state = browse.read(location.search); syncControls(); render(false); });
      window.addEventListener('pageshow', event => { if (event.persisted) render(false); });
      document.addEventListener('recentchange', () => { if (state.view === 'recent') render(false); });
      syncControls(); render();
    } catch (error) {
      grid.setAttribute('aria-busy', 'false'); $('#result-count').textContent = 'Collection unavailable';
      grid.replaceChildren(empty('The collection couldn’t load.', error.message, el('button', { class: 'button', onclick: () => location.reload() }, 'Try again')));
    }
  }
  function selectedId() { const params = new URLSearchParams(location.search); const raw = params.get('template') || params.get('id') || location.pathname.match(/\/templates\/([^/]+)\/?$/)?.[1] || ''; return /^\d{1,4}$/.test(raw) ? raw.padStart(4, '0') : ''; }
  function slots(t) { return Array.isArray(t.slots) && t.slots.length ? t.slots.slice(0, 5) : Array.from({ length: Math.min(5, Number(t.image_count) || 1) }, (_, i) => ({ name: `Reference image ${i + 1}`, required: true })); }
  function fields(t) { return Array.isArray(t.fields) ? t.fields : []; }
  function requirements(t) { return el('section', { class: 'requirements' }, el('h2', {}, `What you’ll need · ${slots(t).length} reference${slots(t).length === 1 ? '' : 's'}`), el('ol', {}, ...slots(t).map(slot => el('li', {}, el('div', {}, el('strong', {}, slot.name || slot.label || 'Reference image'), slot.guidance || slot.description || 'Upload a clear image of your subject.'))))); }
  function preview(t) {
    const frame = el('div', { class: 'preview-frame' });
    const before = (Array.isArray(t.before) ? t.before : t.before ? [t.before] : []).map(value => typeof value === 'string' ? value : value.url || value.src).filter(Boolean);
    const images = [{ label: 'After', src: t.preview || t.thumbnail, alt: `${t.title} — example result` }, ...before.map((src, i) => ({ label: `Before${before.length > 1 ? ` ${i + 1}` : ''}`, src, alt: `${t.title} — reference ${i + 1}` }))];
    const buttons = images.map((entry, index) => el('button', { type: 'button', class: 'button button-secondary', 'aria-pressed': String(index === 0), onclick: () => show(index) }, entry.label));
    function show(index) { frame.replaceChildren(img(images[index].src, images[index].alt, true), el('span', { class: 'preview-label' }, images[index].label === 'After' ? 'EXAMPLE RESULT' : images[index].label.toUpperCase())); buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index))); }
    show(0);
    return el('div', { class: 'preview-area' }, before.length ? el('div', { class: 'preview-tabs', 'aria-label': 'Example views' }, ...buttons) : null, frame, el('div', { class: 'preview-caption' }, el('span', {}, 'Template example. Your result will vary.')));
  }
  function gate(error, path = currentReturn()) {
    if (![401, 403].includes(error.status)) return el('div', { class: 'gate' }, el('h2', {}, 'Prompt unavailable'), el('p', {}, error.message), el('button', { class: 'button button-secondary', onclick: () => location.reload() }, 'Try again'));
    return el('div', { class: 'gate' }, el('p', { class: 'eyebrow' }, 'PREMIUM TEMPLATE'), el('h2', {}, error.status === 401 ? 'Sign in to access this premium prompt.' : 'Premium access required.'), el('p', {}, error.status === 401 ? 'Sign in to check your membership and unlock this template’s full prompt.' : 'This template is part of the premium collection. Explore membership to unlock the full prompt.'), accessLink(error.status, path));
  }
  async function content(id) { const data = await request(`/api/content/template?id=${encodeURIComponent(id)}`, { auth: true }); if (!data.template || typeof data.template.prompt !== 'string') throw new Error('The full prompt is not available yet.'); return data.template; }
  function fieldControls(t, values, onChange) {
    return fields(t).map((field, index) => {
      const key = field.name || field.key || field.id, id = `template-field-${index}`;
      const label = field.input_label || field.label || key;
      const control = el(field.type === 'textarea' || field.recommended_max_words > 20 ? 'textarea' : 'input', { id, name: key, type: 'text', required: field.required === true, placeholder: field.placeholder || '', 'data-field-key': key, maxlength: field.max_length || 5000 });
      control.value = values[key] ?? field.default ?? '';
      values[key] = control.value;
      control.addEventListener('input', () => { values[key] = control.value; onChange(); });
      return el('div', { class: 'field-group' }, el('label', { for: id }, label, field.required ? el('span', { class: 'required-mark', 'aria-label': 'required' }, '*') : el('span', { class: 'muted' }, ' · optional')), control, field.recommended_max_words ? el('p', { class: 'field-help' }, `Recommended: ${field.recommended_max_words} words or fewer.`) : null);
    });
  }
  function composedPrompt(t, values) {
    let result = t.prompt;
    const supplied = [];
    fields(t).forEach(field => {
      const key = field.name || field.key || field.id;
      if (!Object.hasOwn(values, key)) return;
      const value = String(values[key] || field.default || '');
      let substituted = false;
      if (field.placeholder && result.includes(field.placeholder)) {
        result = result.split(field.placeholder).join(value);
        substituted = true;
      }
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}|\\{${escaped}\\}|\\[${escaped}\\]`, 'gi');
      result = result.replace(pattern, () => { substituted = true; return value; });
      if (!substituted && value.trim()) supplied.push(`${field.input_label || field.label || key}: ${value}`);
    });
    return result + (supplied.length ? '\n\nSUPPLIED DETAILS\n' + supplied.join('\n') : '');
  }
  function promptPanel(t, values = {}, customize = false) {
    const text = el('pre', { class: 'prompt-text', tabindex: '0', 'aria-label': 'Full template prompt' });
    const copy = el('button', { type: 'button', class: 'button button-secondary' }, 'Copy prompt');
    const fieldForm = el('div', { class: 'form-section' });
    const update = () => { text.textContent = composedPrompt(t, values); };
    if (customize && fields(t).length) fieldForm.append(...fieldControls(t, values, update));
    update();
    copy.addEventListener('click', async () => {
      const invalid = $$('input,textarea', fieldForm).find(input => !input.checkValidity());
      if (invalid) { invalid.reportValidity(); return; }
      try { await navigator.clipboard.writeText(text.textContent); toast('Prompt copied'); } catch { const range = document.createRange(); range.selectNodeContents(text); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); toast('Copy unavailable. The prompt is selected for manual copying.'); }
    });
    return el('details', { class: 'prompt-panel' }, el('summary', {}, 'View & customize the prompt'), customize && fields(t).length ? fieldForm : null, text, copy);
  }
  async function templatePage() {
    const root = $('#template-detail'), id = selectedId();
    if (!id) { root.replaceChildren(empty('Choose a template.', 'Find a look, then review its prompt and required images.', el('a', { class: 'button', href: '/templates' }, 'Browse templates'))); root.setAttribute('aria-busy', 'false'); return; }
    try {
      const data = await catalogue(), t = data.templates.find(item => String(item.id) === id && item.published);
      if (!t) throw new Error('This template is not published or could not be found.');
      recordVisit(id);
      document.title = `${t.title} — Freezestack`; $('#breadcrumb-title').textContent = t.title;
      const back = $('.breadcrumb a'); back.href = lastLibrary(); back.textContent = 'Back to library';
      const save = favoriteButton(t); save.classList.add('detail-save'); save.append(el('span', {}, favorites.has(id) ? 'Saved' : 'Save'));
      const protectedArea = el('div', { class: 'template-options', id: 'template-options' }, el('p', { class: 'small muted', role: 'status' }, 'Checking prompt access…'));
      const info = el('div', { class: 'detail-copy' },
        el('a', { class: 'detail-category', href: `/templates?category=${encodeURIComponent(t.category)}` }, t.category_name, ' ↗'),
        el('h1', {}, t.title), el('p', { class: 'lead' }, t.short_description),
        el('div', { class: 'detail-meta' }, badge(t.tier), save),
        requirements(t), protectedArea);
      root.replaceChildren(el('div', { class: 'detail-layout' }, preview(t), info)); root.setAttribute('aria-busy', 'false');
      const related = published(data).filter(item => item.category === t.category && String(item.id) !== id).slice(0, 4);
      if (related.length) root.append(el('section', { class: 'related-templates', 'aria-labelledby': 'related-title' },
        el('div', { class: 'section-top' }, el('h2', { id: 'related-title' }, 'More in this category'), el('a', { class: 'text-link', href: `/templates?category=${encodeURIComponent(t.category)}` }, 'View category ↗')),
        el('div', { class: 'template-grid' }, ...related.map(templateCard))));
      try {
        const full = await content(id), panel = promptPanel(full, {}, true);
        panel.id = 'template-prompt';
        const usePrompt = el('button', { type: 'button', class: 'button', 'aria-controls': panel.id, 'aria-expanded': 'false', onclick: () => { panel.open = true; $('summary', panel).focus(); panel.scrollIntoView({ block: 'nearest' }); } }, 'Use this prompt', ' ↗');
        panel.addEventListener('toggle', () => usePrompt.setAttribute('aria-expanded', String(panel.open)));
        protectedArea.replaceChildren(el('h2', {}, 'Use this template'),
          el('div', { class: 'creation-paths' },
            el('div', {}, usePrompt, el('p', {}, 'Customize and copy the prompt for ChatGPT, Grok, or another AI. Attach your references there.'))),
          panel, el('p', { class: 'external-note' }, 'External AI tools use their own accounts and limits.'));
      } catch (error) { protectedArea.replaceChildren(gate(error)); }
    } catch (error) { root.replaceChildren(empty('Template unavailable.', error.message, el('a', { class: 'button', href: lastLibrary() }, 'Back to templates'))); root.setAttribute('aria-busy', 'false'); }
  }
  async function createPage() {
    const root = $('#studio'), id = selectedId();
    if (!id) { root.replaceChildren(empty('Start with a look you love.', 'Choose a template, then add your images and details here.', el('a', { class: 'button', href: '/templates' }, 'Find a template'))); root.setAttribute('aria-busy', 'false'); return; }
    $('#create-back').href = `/templates/${id}`;
    try {
      const data = await catalogue(), metadata = data.templates.find(t => String(t.id) === id && t.published);
      if (!metadata) throw new Error('This template is not available. Please choose another.');
      recordVisit(id);
      $('#create-back').textContent = metadata.title;
      const controls = el('div', { class: 'studio-controls' }, el('div', { class: 'skeleton line-skeleton' }));
      const visual = el('div', {}, preview(metadata), el('div', { class: 'studio-preview-info' }, el('h3', {}, metadata.title), el('p', {}, 'Use this example as your starting point. Your uploaded references guide the result.')));
      root.replaceChildren(el('div', { class: 'studio-layout' }, visual, controls)); root.setAttribute('aria-busy', 'false');
      let t;
      try { t = await content(id); } catch (error) { controls.replaceChildren(gate(error)); return; }
      const draftKey = `freezestack-draft-${id}`, stored = storage.get(draftKey, {});
      const draft = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
      const values = Object.create(null);
      fields(t).forEach(f => { const key = f.name || f.key || f.id; values[key] = typeof draft.fields?.[key] === 'string' ? draft.fields[key] : f.default ?? ''; });
      const uploads = new Array(slots(t).length).fill(null), uploadPaths = new Map();
      const attemptKey = `freezestack-pending-${id}`;
      let pendingAttempt = null;
      try { pendingAttempt = JSON.parse(sessionStorage.getItem(attemptKey)); } catch {}
      let capability = null, quote = null, quoteInputs = null, quoteTimer, busy = false, uncertain = !!pendingAttempt;
      function saveAttempt(attempt) {
        try { sessionStorage.setItem(attemptKey, JSON.stringify(attempt)); pendingAttempt = attempt; }
        catch { throw new Error('This browser cannot preserve request recovery details. Enable session storage before generating.'); }
      }
      function clearAttempt() { try { sessionStorage.removeItem(attemptKey); } catch {} pendingAttempt = null; }

      const form = el('form', { novalidate: true });
      const status = el('p', { class: 'generation-status', role: 'status', 'aria-live': 'polite' }, 'Checking generation availability…');
      const action = el('button', { class: 'button', type: 'submit', disabled: true }, 'Checking availability…');
      const errorArea = el('div', { role: 'alert' });
      const balanceNode = el('p', { class: 'generation-balance small muted', hidden: true, 'aria-live': 'polite' });
      function canResumeAttempt() {
        const body = pendingAttempt?.body;
        const keys = ['templateId', 'fields', 'inputPaths', 'model', 'aspectRatio', 'resolution', 'quality', 'quoteToken'];
        return pendingAttempt?.templateId === id && typeof pendingAttempt.id === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pendingAttempt.id) &&
          body && Object.keys(body).length === keys.length && Object.keys(body).every(key => keys.includes(key)) &&
          body.templateId === id && body.fields && typeof body.fields === 'object' && !Array.isArray(body.fields) &&
          Object.values(body.fields).every(value => typeof value === 'string') &&
          Array.isArray(body.inputPaths) && body.inputPaths.length > 0 && body.inputPaths.length <= 5 &&
          body.inputPaths.every(path => typeof path === 'string' && path.length > 0) &&
          ['model', 'aspectRatio', 'resolution', 'quality', 'quoteToken'].every(key => typeof body[key] === 'string' && body[key].length > 0);
      }
      function showPendingAttempt() {
        action.disabled = true; action.textContent = 'Request awaiting confirmation';
        const resumable = canResumeAttempt();
        status.textContent = resumable
          ? 'An earlier request may still be processing. Resume the same request with its original references, text, settings, and credit quote. Changes in this form will not affect it.'
          : 'An earlier request may still be processing, but its original request details were not saved. Check your creations before starting another image.';
        errorArea.replaceChildren();
        if (resumable && capability?.enabled === true) {
          errorArea.append(el('button', { type: 'button', class: 'button button-secondary', 'data-resume-attempt': '', disabled: busy, onclick: resumeAttempt }, 'Resume same request'));
        } else if (resumable) {
          errorArea.append(el('p', { class: 'small muted' }, 'Resume will be available when image generation is enabled.'));
        }
        errorArea.append(el('a', { class: 'text-link', href: '/creations' }, 'Check your creations ↗'));
      }
      async function resumeAttempt() {
        if (busy || !uncertain || capability?.enabled !== true || !canResumeAttempt()) return;
        busy = true;
        const resumeButton = $('[data-resume-attempt]', form);
        if (resumeButton) { resumeButton.disabled = true; resumeButton.textContent = 'Resuming your request…'; }
        status.textContent = 'Checking the original request. No new request ID or quote will be created.';
        try {
          // Reuse the saved body verbatim, including an expired quote. The server looks up
          // a committed job by this key before validating quote expiry for an uncommitted one.
          const result = await request('/api/generation/generate', { auth: true, method: 'POST', body: pendingAttempt.body, headers: { 'Idempotency-Key': pendingAttempt.id } });
          if (!result.job?.id) throw new Error('A job confirmation was not returned.');
          clearAttempt();
          location.assign(`/creations?job=${encodeURIComponent(result.job.id)}`);
        } catch (error) {
          if (error.status === 409 && ['quote_expired', 'quote_changed'].includes(error.code)) {
            clearAttempt(); uncertain = false; clearQuote();
            errorArea.replaceChildren(el('p', { class: 'inline-error' }, 'The original request was not committed and its quote is no longer valid. Reattach your references if needed, then review a new quote.'));
            status.textContent = 'Ready for a new quote. No image will be generated until you confirm its cost.';
          } else {
            showPendingAttempt();
            errorArea.append(el('p', { class: 'inline-error' }, error.message));
            if ([401, 403].includes(error.status)) errorArea.append(accessLink(error.status));
          }
        } finally {
          busy = false;
          const button = $('[data-resume-attempt]', form);
          if (button) { button.disabled = false; button.textContent = 'Resume same request'; }
          action.disabled = uncertain || capability?.enabled !== true;
          if (!uncertain) action.textContent = 'Review generation cost';
        }
      }

      const ratioGroup = el('div', { class: 'ratio-options' }, ...RATIOS.map(ratio => el('label', {}, el('input', { type: 'radio', name: 'aspectRatio', value: ratio, checked: ratio === (RATIOS.includes(draft.aspectRatio) ? draft.aspectRatio : '1:1') }), el('span', { class: `ratio-shape r${ratio.replace(':', '')}`, 'aria-hidden': 'true' }), ratio)));
      const modelSelect = el('select', { id: 'generation-model', disabled: true }, el('option', {}, 'Checking models…'));
      const resolutionSelect = el('select', { id: 'generation-resolution', disabled: true });
      const qualitySelect = el('select', { id: 'generation-quality', disabled: true });
      function options() { return { model: modelSelect.value, aspectRatio: $('input[name=aspectRatio]:checked', form)?.value || '1:1', resolution: resolutionSelect.value, quality: qualitySelect.value }; }
      function saveDraft() { storage.set(draftKey, { fields: values, ...options() }); }
      function clearQuote() { quote = null; quoteInputs = null; clearTimeout(quoteTimer); if (!busy && capability?.enabled && !uncertain) { action.textContent = 'Review generation cost'; action.disabled = false; status.textContent = 'Get an exact credit quote before you generate. One image per request.'; } }
      function changed() { clearQuote(); saveDraft(); }
      const uploadList = el('div', { class: 'upload-list' });
      slots(t).forEach((slot, index) => {
        const fileInput = el('input', { id: `upload-${index}`, type: 'file', accept: 'image/png,image/jpeg,image/webp', required: slot.required !== false, 'aria-describedby': `upload-guidance-${index}` });
        const thumbnail = el('img', { alt: `Your reference for ${slot.name}`, hidden: true });
        const marker = el('span', { class: 'upload-index', 'aria-hidden': 'true' }, String(index + 1).padStart(2, '0'));
        const remove = el('button', { class: 'remove-file', type: 'button', hidden: true, 'aria-label': `Remove ${slot.name || `reference ${index + 1}`}` }, '×');
        const wrapper = el('div', { class: 'upload-slot' }, marker, thumbnail, el('label', { for: `upload-${index}` }, slot.name || `Reference ${index + 1}`, el('span', { id: `upload-guidance-${index}` }, slot.guidance || 'PNG, JPEG, or WebP · up to 10 MB'), fileInput), remove);
        let objectURL;
        function clearFile() { if (objectURL) URL.revokeObjectURL(objectURL); uploads[index] = null; fileInput.value = ''; thumbnail.hidden = true; marker.hidden = false; remove.hidden = true; changed(); }
        remove.addEventListener('click', clearFile);
        fileInput.addEventListener('change', () => {
          const file = fileInput.files?.[0];
          if (!file) { clearFile(); return; }
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024 || file.size === 0) { clearFile(); toast('Choose a PNG, JPEG, or WebP image up to 10 MB.'); return; }
          if (objectURL) URL.revokeObjectURL(objectURL);
          uploads[index] = file; objectURL = URL.createObjectURL(file); thumbnail.src = objectURL; thumbnail.hidden = false; marker.hidden = true; remove.hidden = false; changed();
        });
        uploadList.append(wrapper);
      });
      form.append(el('h2', {}, 'Set up your image'), el('p', { class: 'small muted' }, `${slots(t).length} reference image${slots(t).length === 1 ? '' : 's'} · 1 output image`), el('section', { class: 'form-section' }, el('h3', {}, 'Your reference images'), uploadList, el('p', { class: 'draft-notice' }, 'PNG, JPEG, or WebP · up to 10 MB each. Text and settings save on this device. Images must be reattached after leaving or refreshing.')));
      if (fields(t).length) form.append(el('section', { class: 'form-section' }, el('h3', {}, 'Your text and details'), ...fieldControls(t, values, changed)));
      form.append(el('fieldset', { class: 'form-section shape-section' }, el('legend', {}, 'Image shape'), ratioGroup));
      const settingsSummary = el('summary', {}, 'Resolution & quality');
      const advancedSettings = el('details', { class: 'advanced-settings' }, settingsSummary, el('div', { class: 'model-row' }, el('div', { class: 'field-group' }, el('label', { for: 'generation-resolution' }, 'Resolution'), resolutionSelect), el('div', { class: 'field-group' }, el('label', { for: 'generation-quality' }, 'Quality'), qualitySelect)));
      function summarizeSettings() { settingsSummary.textContent = `Resolution & quality · ${resolutionSelect.selectedOptions[0]?.textContent || 'unavailable'} / ${qualitySelect.selectedOptions[0]?.textContent || 'unavailable'}`; }
      resolutionSelect.addEventListener('change', summarizeSettings); qualitySelect.addEventListener('change', summarizeSettings);
      form.append(el('section', { class: 'form-section' }, el('div', { class: 'field-group' }, el('label', { for: 'generation-model' }, 'Image model'), modelSelect), advancedSettings));
      form.append(el('div', { class: 'generation-action' }, balanceNode, status, errorArea, action));
      controls.replaceChildren(form);
      (async () => {
        if (!await token()) return;
        try { const data = await request('/api/generation/jobs', { auth: true }); showBalance(balanceNode, data.balance); } catch {}
      })();

      const studioPrompt = promptPanel(t, values);
      studioPrompt.id = 'studio-prompt'; visual.append(studioPrompt);
      const promptFallback = el('button', { type: 'button', class: 'text-button studio-prompt-link', 'aria-controls': studioPrompt.id, 'aria-expanded': 'false', onclick: () => { studioPrompt.open = true; $('summary', studioPrompt).focus(); studioPrompt.scrollIntoView({ block: 'nearest' }); } }, 'Use the prompt in another AI ↗');
      studioPrompt.addEventListener('toggle', () => promptFallback.setAttribute('aria-expanded', String(studioPrompt.open)));
      $('.generation-action', form).append(promptFallback);
      form.addEventListener('input', () => { const pre = $('.prompt-text', visual); if (pre) pre.textContent = composedPrompt(t, values); });
      ratioGroup.addEventListener('change', changed); resolutionSelect.addEventListener('change', changed); qualitySelect.addEventListener('change', changed);
      function fillModelOptions() {
        const model = capability.models.find(m => m.id === modelSelect.value);
        if (!model) return;
        resolutionSelect.replaceChildren(...(model.resolutions || []).map(value => el('option', { value }, value.toUpperCase())));
        qualitySelect.replaceChildren(...(model.qualities || []).map(value => el('option', { value }, value.charAt(0).toUpperCase() + value.slice(1))));
        resolutionSelect.value = model.resolutions.includes(draft.resolution) ? draft.resolution : capability.defaults?.resolution || model.resolutions[0];
        qualitySelect.value = model.qualities.includes(draft.quality) ? draft.quality : capability.defaults?.quality || model.qualities[0];
        summarizeSettings();
        $$('input[name=aspectRatio]', form).forEach(input => { input.disabled = !model.aspectRatios.includes(input.value); });
        const selected = $('input[name=aspectRatio]:checked', form);
        if (selected?.disabled) { selected.checked = false; $('input[name=aspectRatio]:not(:disabled)', form)?.click(); }
      }
      modelSelect.addEventListener('change', () => { fillModelOptions(); changed(); });
      try {
        capability = await request('/api/generation/models');
        capability.models = (capability.models || []).filter(m => m.inputCount?.max >= uploads.length && m.inputCount?.min <= uploads.length && Array.isArray(m.resolutions) && Array.isArray(m.qualities) && m.aspectRatios?.some(r => RATIOS.includes(r)));
        modelSelect.replaceChildren(...capability.models.map(model => el('option', { value: model.id }, model.name || model.id)));
        if (!capability.models.length) { modelSelect.append(el('option', {}, 'No compatible model available')); summarizeSettings(); }
        if (capability.models.length) { modelSelect.value = capability.models.some(m => m.id === draft.model) ? draft.model : capability.models.some(m => m.id === capability.defaults?.model) ? capability.defaults.model : capability.models[0].id; fillModelOptions(); }
        if (capability.enabled === true && capability.models.length) { modelSelect.disabled = false; resolutionSelect.disabled = false; qualitySelect.disabled = false; clearQuote(); }
        else { capability.enabled = false; action.textContent = 'Generation not available yet'; status.textContent = 'Image generation is not enabled. You can prepare your references and text, or copy the template prompt. No credits will be charged.'; }
      } catch { action.textContent = 'Generation unavailable'; status.textContent = 'The generation service could not be reached. Your text can still be prepared here. No credits will be charged.'; }
      if (uncertain) showPendingAttempt();
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (busy || uncertain || !capability?.enabled) return;
        if (!form.reportValidity()) return;
        if (uploads.some((file, i) => !file && slots(t)[i].required !== false)) { toast('Add each required reference image in order.'); return; }
        busy = true; action.disabled = true; errorArea.replaceChildren();
        // Freeze controls so uploaded references and quote inputs cannot diverge mid-request.
        const enabledControls = $$('input,select,textarea,button', form).filter(control => !control.disabled && control !== action);
        enabledControls.forEach(control => { control.disabled = true; });
        let submitted = false;
        try {
          if (!await token()) { errorArea.append(el('p', { class: 'inline-error' }, 'Sign in to get a credit quote and create an image.'), accessLink(401)); return; }
          if (quote && Date.parse(quote.expiresAt) <= Date.now()) { clearQuote(); }
          if (!quote) {
            status.textContent = 'Uploading references securely and checking the cost…'; action.textContent = 'Preparing your quote…';
            const paths = [];
            for (const file of uploads) {
              if (!file) continue;
              if (!uploadPaths.has(file)) {
                const ticket = await request('/api/generation/upload', { auth: true, method: 'POST', body: { contentType: file.type, sizeBytes: file.size } });
                const target = safeURL(ticket.uploadUrl); if (!target || !ticket.path || ticket.method !== 'PUT') throw new Error('The upload service returned an invalid destination.');
                const response = await fetch(target, { method: 'PUT', headers: ticket.headers || { 'Content-Type': file.type }, body: file });
                if (!response.ok) throw new Error('A reference image could not be uploaded. Please try again.');
                uploadPaths.set(file, ticket.path);
              }
              paths.push(uploadPaths.get(file));
            }
            quoteInputs = { templateId: id, fields: { ...values }, inputPaths: paths, ...options() };
            quote = await request('/api/generation/quote', { auth: true, method: 'POST', body: quoteInputs });
            if (!quote.quoteToken || !Number.isFinite(quote.credits) || !Number.isFinite(Date.parse(quote.expiresAt))) { quote = null; throw new Error('An exact credit quote is not available. Please try again.'); }
            action.textContent = `Generate image — ${quote.credits} credits`;
            status.textContent = `One image · ${quote.credits} credits. This quote expires at ${new Date(quote.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Select Generate to confirm.`;
            quoteTimer = setTimeout(() => { clearQuote(); status.textContent = 'Your quote expired. Review the current cost before generating.'; }, Math.max(0, Date.parse(quote.expiresAt) - Date.now()));
          } else {
            clearTimeout(quoteTimer); action.textContent = 'Submitting your creation…'; status.textContent = 'Your request is being submitted. Keep this page open.';
            const key = crypto.randomUUID();
            saveAttempt({ id: key, templateId: id, time: new Date().toISOString(), body: { ...quoteInputs, quoteToken: quote.quoteToken } });
            submitted = true;
            const result = await request('/api/generation/generate', { auth: true, method: 'POST', body: pendingAttempt.body, headers: { 'Idempotency-Key': pendingAttempt.id } });
            if (!result.job?.id) throw new Error('A job confirmation was not returned.');
            clearAttempt();
            location.assign(`/creations?job=${encodeURIComponent(result.job.id)}`);
          }
        } catch (error) {
          if (submitted && (!error.status || error.status >= 500 || error.code === 'idempotency_conflict')) {
            uncertain = true; clearTimeout(quoteTimer); showPendingAttempt();
          } else { if (submitted) clearAttempt(); clearQuote(); errorArea.append(el('p', { class: 'inline-error' }, error.message)); if ([401, 403].includes(error.status)) errorArea.append(accessLink(error.status)); status.textContent = 'Review the message above before continuing.'; }
        } finally { busy = false; const resumeButton = $('[data-resume-attempt]', form); if (resumeButton) resumeButton.disabled = false; enabledControls.forEach(control => { control.disabled = false; }); action.disabled = uncertain || !capability?.enabled; if (!quote && !uncertain && capability?.enabled) action.textContent = 'Review generation cost'; }
      });
    } catch (error) { root.replaceChildren(empty('The studio couldn’t load.', error.message, el('a', { class: 'button', href: '/templates' }, 'Choose a template'))); root.setAttribute('aria-busy', 'false'); }
  }
  function showBalance(node, balance) {
    const available = balance?.available, reserved = balance?.reserved;
    if (!Number.isFinite(available) || !Number.isFinite(reserved)) { node.hidden = true; return; }
    node.textContent = `${available.toLocaleString()} credits available · ${reserved.toLocaleString()} reserved`;
    node.hidden = false;
  }
  const jobLabels = { queued: 'Queued', running: 'Creating your image', saving: 'Saving your image', succeeded: 'Ready to download', failed: 'Generation failed', reconciliation_required: 'Needs review' };
  function jobCard(job, templates) {
    const t = templates.find(t => String(t.id) === String(job.templateId));
    const output = safeURL(job.output?.url);
    const body = el('div', { class: 'job-info' }, el('span', { class: 'badge' }, jobLabels[job.status] || 'Checking status'), el('h3', {}, t?.title || `Template ${job.templateId || ''}`), el('p', {}, Number.isFinite(Date.parse(job.createdAt)) ? new Date(job.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Creation request'));
    if (job.status === 'reconciliation_required') body.append(el('p', { class: 'notice' }, 'This request needs review. Credits remain reserved while its outcome is checked. Please do not resubmit it.'));
    if (job.status === 'failed') body.append(el('p', {}, 'This image could not be completed. Check your account for the reservation status.'));
    if (job.status === 'succeeded' && output) {
      const download = el('button', { class: 'button button-secondary', type: 'button' }, 'Download image ↓');
      download.addEventListener('click', async () => {
        download.disabled = true;
        try {
          const fresh = await request(`/api/generation/jobs?id=${encodeURIComponent(job.id)}`, { auth: true });
          const url = safeURL(fresh.job?.output?.url); if (!url) throw new Error('The download is not available yet. Please refresh.');
          const response = await fetch(url); if (!response.ok) throw new Error('The image could not be downloaded. Please try again.');
          const blob = await response.blob(); const local = URL.createObjectURL(blob);
          const link = el('a', { href: local, download: `freezestack-${job.templateId}-${job.id}.${blob.type.includes('jpeg') ? 'jpg' : blob.type.includes('webp') ? 'webp' : 'png'}` }); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(local), 10000); toast('Image downloaded');
        } catch (error) { toast(error.message); } finally { download.disabled = false; }
      }); body.append(download, el('a', { class: 'text-link', href: `/create?template=${encodeURIComponent(job.templateId)}` }, 'Create again ↗'));
    }
    return el('article', { class: 'job-card' }, job.status === 'succeeded' && output ? img(output, t?.title || 'Your generated image') : el('div', { class: 'job-placeholder' }, jobLabels[job.status] || 'Checking status'), body);
  }
  async function creationsPage() {
    const root = $('#jobs'), refresh = $('#refresh-jobs'); let polling, loading = false, templates = [], nextCursor = null, allJobs = [];
    const balanceNode = el('p', { class: 'generation-balance small muted', hidden: true, 'aria-live': 'polite' });
    $('.creations-top').before(balanceNode);
    const more = el('button', { class: 'button button-secondary', hidden: true }, 'Load older creations');
    root.after(el('div', { class: 'load-more-wrap' }, more)); skeletons(root, 3);
    catalogue().then(data => { templates = data.templates; }).catch(() => {});
    function render() { root.replaceChildren(...allJobs.map(job => jobCard(job, templates))); if (!allJobs.length) root.append(empty('Your first creation starts here.', 'Pick a template, add your references, and make an image. Completed images and active requests will appear here.', el('a', { class: 'button', href: '/templates' }, 'Explore templates'))); more.hidden = !nextCursor; }
    async function load(append = false, quiet = false) {
      if (loading) return; loading = true; refresh.disabled = true; more.disabled = true; clearTimeout(polling);
      try {
        const data = await request(`/api/generation/jobs${append && nextCursor ? '?cursor=' + encodeURIComponent(nextCursor) : ''}`, { auth: true });
        if (!Array.isArray(data.jobs)) throw new Error('Your creations are not available yet.');
        showBalance(balanceNode, data.balance);
        allJobs = append ? [...allJobs, ...data.jobs.filter(job => !allJobs.some(old => old.id === job.id))] : data.jobs;
        nextCursor = data.nextCursor || null; render();
        if (allJobs.some(job => ['queued', 'running', 'saving'].includes(job.status))) polling = setTimeout(() => { if (!document.hidden) load(false, true); }, 8000);
      } catch (error) {
        if (quiet && allJobs.length) { toast('Couldn’t refresh your creations. Use Refresh to check again.'); return; }
        if (error.status === 401) root.replaceChildren(empty('A home for everything you make.', 'Sign in to see your images and follow active requests across visits.', accessLink(401)));
        else if (error.status === 503 || error.code === 'generation_disabled') root.replaceChildren(empty('Your creative workspace is getting ready.', 'Image generation is not enabled yet. Browse the collection and save your next starting point.', el('a', { class: 'button', href: '/templates' }, 'Explore templates')));
        else root.replaceChildren(empty('Your creations couldn’t load.', error.message, el('button', { class: 'button button-secondary', onclick: () => load() }, 'Try again')));
        more.hidden = true;
      } finally { root.setAttribute('aria-busy', 'false'); loading = false; refresh.disabled = false; more.disabled = false; }
    }
    refresh.addEventListener('click', () => load()); more.addEventListener('click', () => load(true));
    document.addEventListener('visibilitychange', () => { if (!document.hidden && allJobs.some(j => ['queued', 'running', 'saving'].includes(j.status))) load(false, true); });
    await load();
  }
  async function extensionPage() {
    try { const data = await catalogue(); const items = featured(published(data)); $('#extension-previews').replaceChildren(...items.slice(0, 2).map(t => el('a', { href: `/templates/${encodeURIComponent(t.id)}` }, img(t.thumbnail, t.title, true), el('p', {}, t.title)))); }
    catch { $('#extension-previews').replaceChildren(el('p', { class: 'muted small' }, 'Catalogue previews are temporarily unavailable.')); }
  }
  $$('[data-nav]').forEach(link => { if (link.dataset.nav === page || ['template', 'create'].includes(page) && link.dataset.nav === 'templates') link.setAttribute('aria-current', 'page'); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable && $('#search')) { event.preventDefault(); $('#search').focus(); }
    if (event.key === 'Escape') $$('.more-menu[open]').forEach(menu => { menu.open = false; $('summary', menu).focus(); });
  });
  document.addEventListener('click', event => { $$('.more-menu[open]').forEach(menu => { if (!menu.contains(event.target)) menu.open = false; }); });
  // Immediately render public pages; protected content waits for auth only when fetched.
  ({ templates: galleryPage, template: templatePage, create: createPage, creations: creationsPage, extension: extensionPage }[page] || (() => {}))();
  window.addEventListener('load', () => {
    const client = window.XFreezeAuth?.getClient?.();
    client?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && ['template', 'create', 'creations'].includes(page)) location.reload();
    });
  });
})();
