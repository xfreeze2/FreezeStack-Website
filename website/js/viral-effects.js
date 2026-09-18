/* Manually reviewed visual picks. No popularity claims or premium prompt data. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.FreezeStackViral = api;
    const section = document.querySelector('[data-viral-effects]');
    if (section && document.body.dataset.page !== 'templates') api.mount(section);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function arrange(templates, picks, random = Math.random, previous = '') {
    const byId = new Map(templates.filter(t => t.published === true && t.thumbnail && t.preview).map(t => [t.id, t]));
    const seen = new Set(), effects = [], groups = new Map();
    for (const pick of picks) {
      const t = byId.get(pick.id);
      if (!t || seen.has(t.id)) continue;
      seen.add(t.id);
      if (pick.spotlight) effects.push(t);
      else { if (!groups.has(t.category)) groups.set(t.category, []); groups.get(t.category).push(t); }
    }
    const diverse = [], buckets = shuffle([...groups.values()], random).map(group => shuffle(group, random));
    while (buckets.some(group => group.length)) for (const group of buckets) if (group.length) diverse.push(group.pop());
    const featured = shuffle(effects, random), result = [];
    while (featured.length || diverse.length) {
      if (featured.length) result.push(featured.pop());
      if (featured.length) result.push(featured.pop());
      if (diverse.length) result.push(diverse.shift());
    }
    if (result.length > 1 && result.slice(0, 6).map(t => t.id).join(',') === previous) result.push(result.shift());
    return result;
  }
  async function mount(section, templates) {
    if (section.dataset.mounted) return;
    section.dataset.mounted = 'true';
    const grid = section.querySelector('.viral-grid'), status = section.querySelector('.viral-status');
    const more = section.querySelector('[data-viral-more]'), remix = section.querySelector('[data-viral-shuffle]');
    const initial = () => matchMedia('(max-width: 600px)').matches ? 4 : 6;
    function element(tag, className, text) {
      const node = document.createElement(tag); if (className) node.className = className;
      if (text) node.textContent = text; return node;
    }
    function card(t) {
      const link = element('a', 'viral-card'); link.href = '/templates/' + encodeURIComponent(t.id); link.dataset.viralId = t.id;
      const frame = element('div', 'viral-image');
      const image = element('img'); image.src = t.thumbnail; image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.width = 640; image.height = 960;
      image.addEventListener('error', () => { image.hidden = true; frame.append(element('span', 'viral-image-error', 'Open template')); }, { once: true });
      frame.append(image, element('span', 'viral-tier', t.tier === 'free' ? 'Free' : 'Premium'));
      link.append(frame, element('h3', '', t.title), element('p', 'viral-category', t.category_name));
      return link;
    }
    async function json(url) {
      const response = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Collection unavailable');
      return response.json();
    }
    try {
      const [catalogue, selection] = await Promise.all([templates ? { templates } : json('/api/templates'), json('/data/viral-effects.json')]);
      let deck, limit;
      function render() {
        const focusIndex = grid.contains(document.activeElement) ? [...grid.children].indexOf(document.activeElement) : -1;
        grid.replaceChildren(...deck.slice(0, limit).map(card)); grid.setAttribute('aria-busy', 'false');
        more.hidden = limit >= deck.length; more.textContent = `Show more looks (${Math.max(0, deck.length - limit)})`;
        status.textContent = `${Math.min(limit, deck.length)} of ${deck.length} most used looks`;
        if (focusIndex >= 0) grid.children[focusIndex]?.focus({ preventScroll: true });
      }
      function mix() {
        let previous = ''; try { previous = sessionStorage.getItem('freezestack-viral-last') || ''; } catch {}
        deck = arrange(catalogue.templates, selection.templates, Math.random, previous); limit = initial();
        try { sessionStorage.setItem('freezestack-viral-last', deck.slice(0, 6).map(t => t.id).join(',')); } catch {}
        if (!deck.length) throw new Error('No curated previews are available');
        render();
      }
      mix(); remix.disabled = false;
      remix.addEventListener('click', mix);
      more.addEventListener('click', () => { const firstNew = limit; limit += initial(); render(); grid.children[firstNew]?.focus({ preventScroll: true }); });
    } catch {
      grid.replaceChildren(); grid.setAttribute('aria-busy', 'false');
      status.textContent = 'These picks couldn’t load. You can still browse the full library.';
      more.hidden = true; remix.hidden = true;
    }
  }
  return { arrange, mount };
});
