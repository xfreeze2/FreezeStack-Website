const fs = require('node:fs');
const path = require('node:path');
const { rest, hasServiceRole } = require('./supabase');

const WEBSITE = path.resolve(__dirname, '../..');
const PUBLIC_KEYS = Object.freeze([
  'id', 'title', 'short_description', 'category', 'category_name', 'tier',
  'thumbnail', 'preview', 'before', 'slots', 'fields', 'image_count', 'published',
]);
const SLOT_KEYS = ['name', 'required', 'guidance'];
const FIELD_KEYS = ['name', 'required', 'use', 'render_as', 'default',
  'recommended_max_words', 'input_label', 'placeholder'];
const CATEGORY_KEYS = ['slug', 'name', 'count', 'published_count', 'free_count'];

function pick(record, keys) {
  return Object.fromEntries(keys.filter((key) => Object.hasOwn(record, key)).map((key) => [key, record[key]]));
}

function publicTemplate(record) {
  const result = pick(record, PUBLIC_KEYS);
  result.slots = (record.slots || []).map((slot) => pick(slot, SLOT_KEYS));
  result.fields = (record.fields || []).map((field) => pick(field, FIELD_KEYS));
  return result;
}

function within(filename, directory) {
  const relative = path.relative(directory, filename);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function assertPrivatePath(filename, website = WEBSITE, env = process.env) {
  if (env.NODE_ENV === 'production' || env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME || env.NETLIFY) {
    throw new Error('FREEZESTACK_CATALOGUE_PATH is only supported in local development');
  }
  if (!path.isAbsolute(filename)) throw new Error('Private catalogue path must be absolute');
  const resolved = path.resolve(filename);
  const realWebsite = fs.realpathSync(website);
  if (within(resolved, path.resolve(website)) || within(fs.realpathSync(resolved), realWebsite)) {
    throw new Error('Private catalogue path must be outside website');
  }
  return fs.realpathSync(resolved);
}

// Factory permits isolated endpoint tests without changing shared auth helpers.
function createCatalogue({
  publicPath = path.join(WEBSITE, 'data/freezestack-catalogue.json'),
  freePath = path.join(WEBSITE, 'data/free-prompts.json'),
  website = WEBSITE,
  env = process.env,
  query = rest,
  serviceRoleAvailable = hasServiceRole,
} = {}) {
  let catalogue;
  let metadata;
  let catalogueStamp;
  const read = (filename) => JSON.parse(fs.readFileSync(filename, 'utf8'));

  function load() {
    const stat = fs.statSync(publicPath);
    const stamp = `${stat.mtimeMs}:${stat.size}`;
    if (!catalogue || catalogueStamp !== stamp) {
      const raw = read(publicPath);
      catalogue = {
        version: raw.version,
        categories: raw.categories.map((category) => pick(category, CATEGORY_KEYS)),
        templates: raw.templates.map(publicTemplate),
      };
      metadata = new Map(catalogue.templates.map((entry) => [entry.id, entry]));
      if (metadata.size !== catalogue.templates.length) throw new Error('Duplicate catalogue IDs');
      catalogueStamp = stamp;
    }
    return catalogue;
  }

  function getCatalogue({ includeUnpublished = false } = {}) {
    const data = load();
    return {
      version: data.version,
      categories: data.categories,
      templates: data.templates.filter((entry) => includeUnpublished || entry.published === true),
    };
  }

  function getTemplateMetadata(id) {
    load();
    return metadata.get(id) || null;
  }

  async function getTemplate(id) {
    const meta = getTemplateMetadata(id);
    if (!meta || meta.published !== true) return null;
    let record;
    // Free prompts are intentionally deployable and work without auth or private storage.
    if (meta.tier === 'free') {
      record = read(freePath).templates.find((entry) => entry.id === id && entry.tier === 'free');
    } else if (meta.tier === 'premium') {
      if (env.FREEZESTACK_CATALOGUE_PATH) {
        const filename = assertPrivatePath(env.FREEZESTACK_CATALOGUE_PATH, website, env);
        record = read(filename).templates.find((entry) => entry.id === id);
      } else {
        if (!serviceRoleAvailable()) throw new Error('Private catalogue storage is not configured');
        const rows = await query(`freezestack_templates?id=eq.${encodeURIComponent(id)}&select=template&limit=1`);
        record = Array.isArray(rows) && rows[0] ? rows[0].template : null;
      }
    } else {
      throw new Error('Invalid catalogue tier');
    }
    if (!record) return null;
    if (record.id !== id || typeof record.prompt !== 'string' || !record.prompt.trim()) {
      throw new Error('Invalid private template record');
    }
    // Public catalogue is authoritative for tier, publication, input UI, and asset URLs.
    return { ...record, ...meta };
  }

  return { getCatalogue, getTemplateMetadata, getTemplate };
}

module.exports = { ...createCatalogue(), createCatalogue, publicTemplate, PUBLIC_KEYS, assertPrivatePath };
