const { json } = require('../_lib/http');
const { handlePreflight } = require('../_lib/cors');
const { getUserFromRequest } = require('../_lib/supabase');
const { userIsPro } = require('../_lib/entitlements');
const catalogue = require('../_lib/catalogue');

function createHandler({
  getTemplateMetadata = catalogue.getTemplateMetadata,
  getTemplate = catalogue.getTemplate,
  authenticate = getUserFromRequest,
  isPro = userIsPro,
} = {}) {
  return async function handler(req, res) {
    if (handlePreflight(req, res, 'GET,OPTIONS')) return;
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
    try {
      const url = new URL(req.url, 'http://localhost');
      const id = (url.searchParams.get('id') || '').trim();
      if (!/^\d{4}$/.test(id)) return json(res, 400, { error: 'A four-digit template id is required' });
      const meta = getTemplateMetadata(id);
      if (!meta || meta.published !== true) return json(res, 404, { error: 'Template not found' });
      if (meta.tier !== 'free') {
        if (meta.tier !== 'premium') throw new Error('Invalid catalogue tier');
        const user = await authenticate(req);
        if (!user || !user.id) return json(res, 401, { error: 'Sign in required', code: 'auth_required' });
        if (!(await isPro(user.id))) return json(res, 403, { error: 'Pro plan required', code: 'pro_required' });
      }
      // Fetch premium content only AFTER entitlement validation. Template usage is not consumed.
      const template = await getTemplate(id);
      if (!template) return json(res, 404, { error: 'Template not found' });
      return json(res, 200, { template, access: { tier: meta.tier } });
    } catch {
      // Do not return private file paths, prompt fragments, service responses, or credentials.
      return json(res, 500, { error: 'Failed to load template', code: 'catalogue_unavailable' });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
