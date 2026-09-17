/* Shared, deterministic catalogue filtering. No prompts or account data. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FreezeStackBrowse = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const normalized = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  function read(search) {
    const p = new URLSearchParams(search);
    return {
      search: (p.get('q') || '').slice(0, 200), category: p.get('category') || 'all',
      tier: ['free', 'premium'].includes(p.get('tier')) ? p.get('tier') : 'all',
      view: p.get('favorites') === '1' ? 'saved' : ['saved', 'recent'].includes(p.get('view')) ? p.get('view') : 'all',
      references: ['1', 'multiple'].includes(p.get('references')) ? p.get('references') : 'all',
      sort: p.get('sort') === 'title' ? 'title' : 'default',
      limit: Math.min(1296, Math.max(24, Math.ceil((Number(p.get('shown')) || 24) / 24) * 24))
    };
  }
  function url(state) {
    const p = new URLSearchParams();
    if (state.search.trim()) p.set('q', state.search.trim());
    if (state.category !== 'all') p.set('category', state.category);
    if (state.tier !== 'all') p.set('tier', state.tier);
    if (state.view !== 'all') p.set('view', state.view);
    if (state.references !== 'all') p.set('references', state.references);
    if (state.sort !== 'default') p.set('sort', state.sort);
    if (state.limit > 24) p.set('shown', String(state.limit));
    return `/templates${p.size ? '?' + p : ''}`;
  }
  function select(items, state, favorites, recent) {
    const words = normalized(state.search).split(' ').filter(Boolean);
    const positions = new Map(recent.map((id, i) => [String(id), i]));
    const available = items.filter(t => {
      const id = String(t.id), count = Number(t.image_count) || 0;
      const text = normalized(`${t.title} ${t.short_description || ''} ${t.category_name || ''} ${(t.slots || []).map(s => s.name || '').join(' ')}`);
      return (state.view !== 'saved' || favorites.has(id)) &&
        (state.view !== 'recent' || positions.has(id)) &&
        (state.tier === 'all' || t.tier === state.tier) &&
        (state.references === 'all' || (state.references === '1' ? count === 1 : count > 1)) &&
        words.every(word => /^\d{1,4}$/.test(word) ? Number(id) === Number(word) || text.split(' ').includes(word) : text.includes(word));
    });
    const counts = new Map([['all', available.length]]);
    available.forEach(t => counts.set(t.category, (counts.get(t.category) || 0) + 1));
    const matches = available.filter(t => state.category === 'all' || t.category === state.category);
    if (state.sort === 'title') matches.sort((a, b) => a.title.localeCompare(b.title) || String(a.id).localeCompare(String(b.id)));
    else if (state.view === 'recent') matches.sort((a, b) => positions.get(String(a.id)) - positions.get(String(b.id)));
    return { matches, counts };
  }
  return { read, url, select };
});
