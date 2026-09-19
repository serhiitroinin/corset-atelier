// Virtual try-on proxy. Holds the provider key server-side so the static site never sees it.
// POST { person: <data URL jpeg|png|webp>, garment: <id> }  ->  { image: <data URL> } | { error }
// Env: OPENAI_API_KEY (preferred) or GEMINI_API_KEY; optional OPENAI_IMAGE_MODEL, GEMINI_IMAGE_MODEL,
//      GARMENT_BASE, ALLOWED_ORIGINS (comma separated), DAILY_LIMIT, PER_IP_LIMIT.

const GARMENT_BASE = process.env.GARMENT_BASE || 'https://serhiitroinin.github.io/corset-atelier/assets/img/maison/';
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://serhiitroinin.github.io').split(',').map(s => s.trim());
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 150);
const PER_IP_LIMIT = Number(process.env.PER_IP_LIMIT || 8);

const GARMENTS = {
  severine: { file: 'g1.jpg', d: 'the Séverine, an underbust corset in bone-coloured cotton coutil with a front busk, sitting from under the bust to the top of the hip' },
  aurele:   { file: 'g2.jpg', d: 'the Aurèle, a strapless overbust corset top in ivory satin with a gentle sweetheart neckline' },
  odile:    { file: 'g3.jpg', d: 'the Odile, a waspie: a short waist-cincher about 18 cm tall in sand-beige cotton sateen, worn over clothing at the waist' },
  maren:    { file: 'g4.jpg', d: 'the Maren, a longline underbust corset in caramel tan that extends over the hip' },
  colombe:  { file: 'g5.jpg', d: 'the Colombe, an overbust corset top in soft black satin with a sweetheart neckline' },
  isaure:   { file: 'g6.jpg', d: 'the Isaure, a square-neck corset top in champagne satin with two slim shoulder straps' }
};

const prompt = d => `Virtual try-on. Image 1 is a photo of a person. Image 2 is a product photo of a corset: ${d}. Produce a photorealistic photo of the SAME person from image 1 wearing the corset from image 2 as a top layer. Keep the person's face, hair, skin tone, body shape, pose, the rest of their outfit, the background and the lighting unchanged. Reproduce the corset's exact colour, fabric, neckline, length and closure; fit it naturally to their body with realistic folds and shadows. Do not slim or reshape the body. Do not add text or logos. Tasteful, fully clothed fashion e-commerce image.`;

// Best-effort limits: per warm instance only. Put a real store (Upstash/KV) in front before real traffic.
const hits = { day: '', total: 0, ip: new Map() };
function limited(ip) {
  const day = new Date().toISOString().slice(0, 10);
  if (hits.day !== day) { hits.day = day; hits.total = 0; hits.ip.clear(); }
  const n = (hits.ip.get(ip) || 0) + 1;
  hits.ip.set(ip, n); hits.total++;
  return n > PER_IP_LIMIT || hits.total > DAILY_LIMIT;
}

function cors(req, res) {
  const o = req.headers.origin || '';
  const ok = ORIGINS.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
  if (ok) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return ok;
}

async function viaOpenAI(person, garment, text) {
  const form = new FormData();
  form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1');
  form.append('image[]', new Blob([person.buf], { type: person.mime }), 'person.' + person.ext);
  form.append('image[]', new Blob([garment], { type: 'image/jpeg' }), 'garment.jpg');
  form.append('prompt', text);
  form.append('size', '1024x1536');
  form.append('quality', 'medium');
  form.append('input_fidelity', 'high');
  const r = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY }, body: form });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error?.message || 'Image provider error'), { status: r.status === 400 ? 422 : 502 });
  return 'data:image/png;base64,' + j.data[0].b64_json;
}

async function viaGemini(person, garment, text) {
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [
      { text },
      { inline_data: { mime_type: person.mime, data: person.buf.toString('base64') } },
      { inline_data: { mime_type: 'image/jpeg', data: Buffer.from(garment).toString('base64') } }
    ] }] })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error?.message || 'Image provider error'), { status: 502 });
  const part = (j.candidates?.[0]?.content?.parts || []).find(p => p.inlineData || p.inline_data);
  if (!part) throw Object.assign(new Error('The image could not be generated from this photo. Try a different one.'), { status: 422 });
  const d = part.inlineData || part.inline_data;
  return `data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}`;
}

export default async function handler(req, res) {
  const okOrigin = cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!okOrigin) return res.status(403).json({ error: 'Origin not allowed' });
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Try-on is not configured yet.' });

  const { person, garment } = req.body || {};
  const g = GARMENTS[garment];
  const m = typeof person === 'string' && person.match(/^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!g) return res.status(400).json({ error: 'Unknown piece.' });
  if (!m) return res.status(400).json({ error: 'Send the photo as a JPEG, PNG or WebP.' });
  const buf = Buffer.from(m[3], 'base64');
  if (buf.length > 4 * 1024 * 1024) return res.status(413).json({ error: 'Photo is too large.' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'The fitting room is busy. Please try again tomorrow.' });

  try {
    const gr = await fetch(GARMENT_BASE + g.file);
    if (!gr.ok) throw Object.assign(new Error('Garment image unavailable.'), { status: 502 });
    const garmentBuf = await gr.arrayBuffer();
    const p = { buf, mime: m[1], ext: m[2] === 'jpeg' ? 'jpg' : m[2] };
    const image = process.env.OPENAI_API_KEY ? await viaOpenAI(p, garmentBuf, prompt(g.d)) : await viaGemini(p, garmentBuf, prompt(g.d));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ image });
  } catch (e) {
    console.error('tryon failed:', e.status || 500, e.message);
    return res.status(e.status || 500).json({ error: e.status === 422 ? e.message : 'The fitting room could not finish this one. Please try again.' });
  }
}
