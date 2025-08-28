
export function pickLocalized(obj, path, lang = 'it', fallback = 'it') {
  if (!obj || !path) return null;
  const node = path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), obj);
  if (!node || typeof node !== 'object') return null;
  return node[lang] ?? node[fallback] ?? null;
}
