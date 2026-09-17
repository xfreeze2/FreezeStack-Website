const { json } = require('./_lib/http');
const { handlePreflight } = require('./_lib/cors');
const catalogue = require('./_lib/catalogue');

function createHandler({ getCatalogue = catalogue.getCatalogue } = {}) {
  return async function handler(req, res) {
    if (handlePreflight(req, res, 'GET,OPTIONS')) return;
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
    try {
      const url = new URL(req.url, 'http://localhost');
      // Even all=1 exposes only the same metadata allowlist, never draft prompts.
      const all = url.searchParams.get('all');
      return json(res, 200, getCatalogue({ includeUnpublished: all === '1' || all === 'true' }));
    } catch {
      return json(res, 500, { error: 'Failed to load catalogue', code: 'catalogue_unavailable' });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
