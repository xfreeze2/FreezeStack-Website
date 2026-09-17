const fs = require('fs');
const path = require('path');
const { json } = require('../_lib/http');
const { handlePreflight, applyCors } = require('../_lib/cors');
const { getUserFromRequest } = require('../_lib/supabase');
const { userIsPro } = require('../_lib/entitlements');
const { consumeUsage } = require('../_lib/usage');
const catalogue = require('../_lib/catalogue');

let grokCache = null;

function loadGrokTemplates() {
  if (grokCache) return grokCache;
  const file = path.join(__dirname, '..', '_private', 'premium-templates.json');
  grokCache = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  return grokCache;
}

function usageError(res, usage) {
  return json(res, usage.code === 'limit_exceeded' ? 429 : 400, {
    error: usage.error || 'Daily limit reached for templates.',
    code: usage.code || 'limit_exceeded',
    kind: 'templates',
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    isPro: usage.isPro,
    day: usage.day,
  });
}

function createHandler({
  getTemplateMetadata = catalogue.getTemplateMetadata,
  getTemplate = catalogue.getTemplate,
  authenticate = getUserFromRequest,
  isPro = userIsPro,
  takeUsage = consumeUsage,
} = {}) {
  return async function handler(req, res) {
    if (handlePreflight(req, res, 'GET,OPTIONS')) return;
    applyCors(req, res, 'GET,OPTIONS');
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

    try {
      const url = new URL(req.url, 'http://localhost');
      const id = String(url.searchParams.get('id') || url.searchParams.get('code') || '').trim();
      if (!id) return json(res, 400, { error: 'Missing template code' });

      if (/^\d{4}$/.test(id)) {
        const meta = getTemplateMetadata(id);
        if (!meta || meta.published !== true) return json(res, 404, { error: 'Template not found' });
        let user = null;
        if (meta.tier !== 'free') {
          if (meta.tier !== 'premium') throw new Error('Invalid catalogue tier');
          user = await authenticate(req);
          if (!user || !user.id) return json(res, 401, { error: 'Sign in required', code: 'auth_required' });
          if (!(await isPro(user.id))) return json(res, 403, { error: 'Pro plan required', code: 'pro_required' });
          const usage = await takeUsage(user.id, 'templates', id);
          if (!usage.ok) return usageError(res, usage);
        }
        const template = await getTemplate(id);
        if (!template) return json(res, 404, { error: 'Template not found' });
        res.setHeader('Cache-Control', 'private, no-store');
        return json(res, 200, { template, access: { tier: meta.tier } });
      }

      const user = await authenticate(req);
      if (!user || !user.id) return json(res, 401, { error: 'Sign in required', code: 'auth_required' });
      if (!(await isPro(user.id))) return json(res, 403, { error: 'Pro plan required', code: 'pro_required' });
      const entry = loadGrokTemplates()[id];
      if (!entry || !entry.link) return json(res, 404, { error: 'Template not found' });
      const usage = await takeUsage(user.id, 'templates', id);
      if (!usage.ok) return usageError(res, usage);
      res.setHeader('Cache-Control', 'private, no-store');
      return json(res, 200, {
        code: id,
        link: entry.link,
        name: entry.name || null,
        usage,
      });
    } catch {
      return json(res, 500, { error: 'Failed to load template', code: 'catalogue_unavailable' });
    }
  };
}

module.exports = createHandler();
module.exports.createHandler = createHandler;
