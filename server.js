const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
// Behind Vercel, trust the X-Forwarded-For header so rate-limiting uses the real client IP
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// ===== Security headers =====
// Written manually so we avoid an extra dependency on Helmet. These are the
// same defaults Helmet would set, minus anything that breaks the app.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  // Vercel already sets HSTS on HTTPS; setting here is a belt-and-suspenders
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // CSP: allow our own assets + jsdelivr (supabase SDK) + Google Fonts + TMDB images + qrserver (friend QR) + youtube embeds
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://image.tmdb.org https://api.qrserver.com https://api.tvmaze.com https://*.supabase.co https://static-cdn.jtvnw.net",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://api.anthropic.com https://api.tvmaze.com https://api.qrserver.com",
    "media-src 'self' https:",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  next();
});

// ===== Rate limiting =====
// Zero-dep sliding window limiter. Fine for Vercel's serverless warm boundaries
// (same instance handles multiple requests). Real protection against bursts comes
// from Vercel's own DDoS shield; this is a second layer for sane per-IP quotas.
const rateStore = new Map(); // ip + bucket -> { count, resetAt }
function rateLimit({ max, windowMs, bucket = 'default', message = 'Too many requests' }) {
  return (req, res, next) => {
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim() || 'unknown';
    const key = `${bucket}:${ip}`;
    const now = Date.now();
    const rec = rateStore.get(key);
    if (!rec || rec.resetAt < now) {
      rateStore.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      rec.count++;
      if (rec.count > max) {
        const retry = Math.ceil((rec.resetAt - now) / 1000);
        res.setHeader('Retry-After', retry);
        return res.status(429).json({ error: message, retry_after: retry });
      }
    }
    next();
  };
}
// Periodic cleanup so the map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateStore) if (v.resetAt < now) rateStore.delete(k);
}, 60_000).unref?.();

// Global limiter — 100 req / min / IP
app.use('/api/', rateLimit({ max: 100, windowMs: 60_000, bucket: 'global' }));
// AI limiter — 10 req / min / IP (applied to the AI-heavy routes further down)
const aiLimiter = rateLimit({ max: 10, windowMs: 60_000, bucket: 'ai', message: 'AI rate limit exceeded — please wait a minute.' });

app.use(express.static(path.join(__dirname, 'public')));

// ===== Input sanitisation helpers =====
// Cap strings to avoid log-injection / memory abuse; strip obvious HTML.
function sanitizeString(s, max = 500) {
  if (typeof s !== 'string') return '';
  return s.slice(0, max).replace(/[<>]/g, '');
}
function sanitizeBody(obj, maxFieldLen = 3000) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string') obj[k] = v.length > maxFieldLen ? v.slice(0, maxFieldLen) : v;
  }
  return obj;
}
app.use((req, res, next) => { if (req.body) sanitizeBody(req.body); next(); });

// ===== Typed input validators (reject early with 400 on malformed input) =====
class ValidationError extends Error { constructor(m) { super(m); this.status = 400; } }
const MEDIA_TYPE_ENUM = new Set(['movie', 'tv']);
const LANG_ENUM = new Set(['en', 'fr', 'es', 'de', 'pt', 'ru', 'he', 'ar']);
const COUNTRY_RE = /^[A-Z]{2}$/;
const ID_RE = /^\d{1,12}$/;
function needString(v, field, maxLen = 500) {
  if (typeof v !== 'string' || v.length === 0) throw new ValidationError(`${field} required`);
  if (v.length > maxLen) throw new ValidationError(`${field} too long`);
  return v;
}
function needEnum(v, set, field) {
  if (!set.has(v)) throw new ValidationError(`${field} invalid`);
  return v;
}

// ===== Health check (for monitoring, uptime probes, Vercel status dashboard) =====
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    uptime_s: Math.round(process.uptime()),
    now: new Date().toISOString(),
    tmdb: !!TMDB_API_KEY,
    claude: !!CLAUDE_API_KEY,
    supabase: !!SUPABASE_URL,
    node: process.version,
  });
});

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

app.get('/api/config', (req, res) => {
  res.json({ supabaseUrl: SUPABASE_URL, supabaseAnonKey: SUPABASE_ANON_KEY });
});

// TMDB supports two auth schemes: v3 api_key (short hex string) or v4 Bearer token (JWT starting with eyJ).
// We auto-detect which one the user configured so either works.
const TMDB_IS_V4 = TMDB_API_KEY.startsWith('eyJ');

function tmdbFetch(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const headers = { Accept: 'application/json' };
    if (TMDB_IS_V4) headers.Authorization = `Bearer ${TMDB_API_KEY}`;
    else url.searchParams.set('api_key', TMDB_API_KEY);
    https.get(url.toString(), { headers }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400 || json.success === false) {
            console.error(`[TMDB] ${res.statusCode} on ${endpoint}: ${json.status_message || data.slice(0, 200)}`);
          }
          resolve(json);
        } catch {
          console.error(`[TMDB] Parse fail on ${endpoint}: ${data.slice(0, 200)}`);
          resolve({ results: [] });
        }
      });
    }).on('error', (err) => {
      console.error(`[TMDB] Network error on ${endpoint}:`, err.message);
      reject(err);
    });
  });
}

// Diagnostic endpoint: surfaces TMDB auth errors instead of silently returning empty.
app.get('/api/tmdb-debug', async (req, res) => {
  if (!TMDB_API_KEY) return res.json({ ok: false, reason: 'TMDB_API_KEY not set' });
  try {
    const data = await tmdbFetch('/movie/popular', { page: 1 });
    res.json({
      ok: data.success !== false && Array.isArray(data.results),
      auth_scheme: TMDB_IS_V4 ? 'v4-bearer' : 'v3-api-key',
      key_prefix: TMDB_API_KEY.slice(0, 8) + '…',
      tmdb_response: data.success === false ? data : { results_count: (data.results || []).length },
    });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// NSFW keyword list — multilingual. Used as a belt-and-suspenders filter
// on top of TMDB's `adult=false`. Edge-cases guarded (e.g. "young adult").
const BLOCKED_NSFW = [
  // EN
  'xxx', 'porn', 'porno', 'hardcore', 'erotic', 'erotica', 'sexploitation',
  'softcore', 'nude', 'nudity', 'nudist', 'fetish', 'bdsm', 'hentai',
  'incest', 'orgy', 'threesome', 'striptease',
  // FR
  'pornographique', 'erotique', 'erotisme', 'nudisme',
  // ES / IT / PT
  'pornografico', 'erotica', 'sexo explicito',
  // DE
  'pornografie', 'erotisch',
];
function isAppropriate(r) {
  if (r.adult === true) return false;
  const text = ((r.title || r.name || '') + ' ' + (r.overview || '')).toLowerCase();
  // Avoid false positive: "young adult" / "adult animation" should pass
  if (BLOCKED_NSFW.some(k => text.includes(k))) return false;
  return true;
}

function mapItem(r) {
  return {
    id: r.id,
    type: r.media_type || (r.first_air_date ? 'tv' : 'movie'),
    title: r.title || r.name,
    year: (r.release_date || r.first_air_date || '').slice(0, 4),
    poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
    backdrop: r.backdrop_path ? `https://image.tmdb.org/t/p/original${r.backdrop_path}` : null,
    overview: r.overview,
    rating: r.vote_average,
  };
}

app.get('/api/search', async (req, res) => {
  const { q, lang = 'en-US' } = req.query;
  if (!q) return res.json({ results: [] });
  if (typeof q !== 'string' || q.length > 200) return res.status(400).json({ error: 'query too long' });
  if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not set' });
  const data = await tmdbFetch('/search/multi', { query: q, language: lang, include_adult: 'false' });
  const results = (data.results || [])
    .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
    .filter(isAppropriate)
    .map(mapItem);
  res.json({ results });
});

app.get('/api/trending', async (req, res) => {
  const { lang = 'en-US', category = 'all' } = req.query;
  if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not set' });
  try {
    let raw = [];
    if (category === 'all') {
      const data = await tmdbFetch('/trending/all/week', { language: lang, include_adult: 'false' });
      raw = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
    } else if (category === 'movie') {
      const data = await tmdbFetch('/trending/movie/week', { language: lang, include_adult: 'false' });
      raw = (data.results || []).map(r => ({ ...r, media_type: 'movie' }));
    } else if (category === 'tv') {
      const data = await tmdbFetch('/trending/tv/week', { language: lang, include_adult: 'false' });
      raw = (data.results || []).map(r => ({ ...r, media_type: 'tv' }));
    } else if (category === 'documentary') {
      const data = await tmdbFetch('/discover/movie', { language: lang, with_genres: '99', sort_by: 'popularity.desc', include_adult: 'false' });
      raw = (data.results || []).map(r => ({ ...r, media_type: 'movie' }));
    } else if (category === 'anime') {
      const data = await tmdbFetch('/discover/tv', { language: lang, with_genres: '16', with_origin_country: 'JP', sort_by: 'popularity.desc', include_adult: 'false' });
      raw = (data.results || []).map(r => ({ ...r, media_type: 'tv' }));
    }
    const results = raw.filter(isAppropriate).map(mapItem);
    res.json({ results: results.slice(0, 30) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Popular titles for onboarding calibration
app.get('/api/calibration-set', async (req, res) => {
  const { lang = 'en-US' } = req.query;
  if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not set' });
  try {
    const pages = await Promise.all([1, 2].map(p => tmdbFetch('/movie/popular', { language: lang, page: p, include_adult: 'false' })));
    const all = pages.flatMap(p => p.results || []).filter(r => r.poster_path).filter(isAppropriate);
    // Shuffle and pick 20
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    res.json({ results: all.slice(0, 5).map(r => ({ ...mapItem(r), type: 'movie' })) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/details/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const { lang = 'en-US' } = req.query;
  if (!MEDIA_TYPE_ENUM.has(type)) return res.status(400).json({ error: 'invalid type' });
  if (!ID_RE.test(id)) return res.status(400).json({ error: 'invalid id' });
  if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not set' });
  try {
    const data = await tmdbFetch(`/${type}/${id}`, {
      language: lang,
      append_to_response: 'credits,similar,videos,watch/providers',
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Claude wrapper (never expose "Claude" to user) =====
function callClaude(messages, maxTokens = 2000, system = null) {
  return new Promise((resolve, reject) => {
    if (!CLAUDE_API_KEY) return reject(new Error('Seret AI not configured'));
    const payload = {
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
    };
    if (system) payload.system = system;
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    };
    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', c => data += c);
      apiRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.content?.[0]?.text || '');
        } catch (e) { reject(e); }
      });
    });
    apiReq.on('error', reject);
    apiReq.write(body);
    apiReq.end();
  });
}

function parseJSON(text) {
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();
  return JSON.parse(clean);
}

async function enrichWithTMDB(rec, lang) {
  try {
    const search = await tmdbFetch('/search/multi', { query: rec.title, language: lang === 'fr' ? 'fr-FR' : 'en-US', include_adult: 'false' });
    const match = (search.results || []).find(r =>
      (r.media_type === 'movie' || r.media_type === 'tv') &&
      ((r.release_date || r.first_air_date || '').startsWith(rec.year))
    ) || (search.results || []).find(r => r.media_type === 'movie' || r.media_type === 'tv');
    if (!match) return { ...rec, poster: null };

    let providers = [];
    try {
      const wp = await tmdbFetch(`/${match.media_type}/${match.id}/watch/providers`);
      const list = wp.results?.FR || wp.results?.US || {};
      providers = (list.flatrate || []).slice(0, 4).map(p => ({
        name: p.provider_name,
        logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
      }));
    } catch {}

    return {
      ...rec,
      tmdb_id: match.id,
      type: match.media_type,
      poster: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
      backdrop: match.backdrop_path ? `https://image.tmdb.org/t/p/original${match.backdrop_path}` : null,
      overview: match.overview,
      rating: match.vote_average,
      providers,
    };
  } catch {
    return { ...rec, poster: null };
  }
}

// ===== Seret AI: recommendations with mood, viewing context, persona =====
app.post('/api/recommend', aiLimiter, async (req, res) => {
  const {
    library = [], watchlist = [], skipped = [], calibration = [],
    lang = 'en', viewingContext = 'solo', mood = null, surprise = false,
  } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });

  const watched = library.filter(i => i.status !== 'to_watch');
  if (watched.length === 0 && calibration.length === 0 && watchlist.length === 0) {
    return res.json({
      profile: lang === 'fr' ? 'Ajoute quelques titres pour que je puisse te cerner.' : 'Add a few titles so I can read your taste.',
      persona: null, recommendations: []
    });
  }

  const watchedList = watched.slice(0, 50).map(i => `${i.title} (${i.year}) [${i.type}] — ${i.userRating || '?'}/10${i.viewing_context ? ' — ' + i.viewing_context : ''}`).join('\n');
  const wishList = watchlist.slice(0, 20).map(i => `${i.title} (${i.year})`).join('\n');
  const skippedList = skipped.slice(0, 15).map(i => i.title).filter(Boolean).join(', ');
  const calibList = calibration.slice(0, 20).map(c => `${c.title} ${c.liked ? '👍' : '👎'}`).join(', ');

  const contextMap = {
    solo: lang === 'fr' ? 'regarde seul' : 'watches alone',
    couple: lang === 'fr' ? 'regarde en couple' : 'watches with partner',
    family: lang === 'fr' ? 'regarde en famille' : 'watches with family',
    friends: lang === 'fr' ? 'regarde entre amis' : 'watches with friends',
  };
  const moodMap = {
    happy: lang === 'fr'
      ? 'joyeux — il veut une comedie legere feel-good, pas de drame lourd, pas d\'horreur'
      : 'happy — wants light feel-good comedies only, no heavy drama, no horror',
    sad: lang === 'fr'
      ? 'emotif — il veut un drame puissant qui fait pleurer, tearjerker, pas de comedie'
      : 'emotional — wants a powerful tearjerker drama, no comedies',
    scared: lang === 'fr'
      ? 'veut des frissons — pur thriller, horreur, suspense, tension, pas de comedie romantique'
      : 'wants thrills — pure thriller, horror, suspense, tension, no romcom',
    mind: lang === 'fr'
      ? 'veut un mindfuck — film complexe avec twist, non-lineaire, philo, sci-fi cerebrale'
      : 'wants a mindfuck — complex twisty non-linear cerebral sci-fi',
    tired: lang === 'fr'
      ? 'fatigue — chill, slow cinema, nature, rythme lent, pas de thriller'
      : 'tired — chill slow cinema, nature, slow pace, no thrillers',
  };

  const noAdultRule = lang === 'fr'
    ? '\nSTRICT: Exclus tout contenu adulte, pornographique, erotique ou non tsniout. Uniquement du cinema grand public, arthouse, classique ou genre.'
    : '\nSTRICT: Exclude any adult, pornographic, or erotic content. Only mainstream, arthouse, classic or genre cinema.';
  const baseJSON = lang === 'fr'
    ? `Reponds STRICTEMENT au format JSON:\n{\n  "profile": "Analyse poetique de son ADN cinematographique, ses obsessions, 2-3 phrases, commence par 'D'apres ta bibliotheque,'",\n  "persona": "Le Justicier" ou "L'Analyste" ou "L'Empathique" ou "L'Adrenaline" ou "Le Reveur" ou "L'Esthete",\n  "personaReason": "1 phrase expliquant pourquoi",\n  "dna": "Tu adores X (acteur/realisateur/pays). Voici Y de ses oeuvres que tu n'as pas vues : ..." ou null,\n  "recommendations": [{"title": "titre exact", "year": "YYYY", "type": "movie ou tv", "reason": "pourquoi ca va le toucher, 1-2 phrases"}]\n}\n\nDonne 5 recommandations. Reponds uniquement le JSON.${noAdultRule}`
    : `Respond STRICTLY in JSON:\n{\n  "profile": "Poetic analysis of their cinematic DNA, obsessions, 2-3 sentences, starts with 'Based on your library,'",\n  "persona": "The Vigilante" or "The Analyst" or "The Empath" or "The Adrenaline" or "The Dreamer" or "The Aesthete",\n  "personaReason": "1 sentence why",\n  "dna": "You love X (actor/director/country). Here are Y of their works you haven't seen: ..." or null,\n  "recommendations": [{"title": "exact title", "year": "YYYY", "type": "movie or tv", "reason": "why it hits, 1-2 sentences"}]\n}\n\nGive 5 recommendations. Return only JSON.${noAdultRule}`;

  const prompt = `You are Seret AI, a premium cinema concierge with encyclopedic knowledge and psychological insight. The user ${contextMap[viewingContext]}${mood ? `, ${moodMap[mood] || mood}` : ''}${surprise ? '. They said SURPRISE ME — pick something unexpected but perfectly tuned.' : ''}.

Watched (with ratings):
${watchedList || '(empty)'}

Watchlist:
${wishList || '(empty)'}

Not interested: ${skippedList || '(none)'}
${calibList ? 'Calibration preferences: ' + calibList : ''}

${baseJSON}`;

  try {
    const text = await callClaude(prompt, 2000);
    let parsed;
    try { parsed = parseJSON(text); }
    catch { return res.json({ profile: text, persona: null, recommendations: [] }); }

    const enriched = await Promise.all((parsed.recommendations || []).map(r => enrichWithTMDB(r, lang)));
    res.json({ ...parsed, recommendations: enriched });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== AI rating prediction =====
app.post('/api/predict-rating', aiLimiter, async (req, res) => {
  const { title, year, type, library = [], lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const summary = library.slice(0, 25).map(i => `${i.title} (${i.year}) — ${i.userRating}/10`).join('\n');
  const prompt = lang === 'fr'
    ? `Voici les notes de l'utilisateur :\n${summary}\n\nPredis la note qu'il donnera a "${title}" (${year}, ${type}). Reponds STRICTEMENT en JSON: {"prediction": 8, "reason": "courte phrase personnalisee, max 140 caracteres"}. La prediction est un entier entre 1 et 10. JSON uniquement.`
    : `Here are the user's ratings:\n${summary}\n\nPredict the rating they'll give "${title}" (${year}, ${type}). Respond STRICTLY in JSON: {"prediction": 8, "reason": "short personalised line, max 140 chars"}. Prediction is an integer 1-10. JSON only.`;
  try {
    const text = await callClaude(prompt, 200);
    const parsed = parseJSON(text);
    res.json(parsed);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== AI rating explanation after rating =====
app.post('/api/explain-rating', aiLimiter, async (req, res) => {
  const { title, year, rating, library = [], lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const summary = library.slice(0, 20).map(i => `${i.title} (${i.year}) — ${i.userRating}/10`).join(', ');
  const prompt = lang === 'fr'
    ? `Ses notes: ${summary}. Il vient de mettre ${rating}/10 a "${title}" (${year}). En UNE phrase flatteuse de max 140 caracteres, explique pourquoi cette note est coherente avec ses gouts. Style "Tu as mis X/10 — c'est coherent avec ton amour des thrillers psychologiques...". Commence par "Tu as mis" ou "${rating}/10". Reponds juste la phrase, sans guillemets.`
    : `Their ratings: ${summary}. They just rated "${title}" (${year}) ${rating}/10. In ONE flattering sentence (max 140 chars), explain why this rating fits their taste. Style: "You rated X/10 — that matches your love of psychological thrillers...". Start with "You rated" or "${rating}/10". Just the sentence, no quotes.`;
  try {
    const text = (await callClaude(prompt, 200)).trim().replace(/^["']|["']$/g, '');
    res.json({ text });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Semantic natural-language search =====
app.post('/api/semantic-search', aiLimiter, async (req, res) => {
  const { query, lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const noAdult = lang === 'fr'
    ? '\nSTRICT: Exclus tout contenu adulte, pornographique, erotique.'
    : '\nSTRICT: Exclude adult/pornographic/erotic content.';
  const prompt = lang === 'fr'
    ? `L'utilisateur cherche : "${query}"\n\nPropose 5 films/series parfaitement adaptes. STRICT JSON:\n{"recommendations":[{"title":"exact","year":"YYYY","type":"movie ou tv","reason":"pourquoi ca correspond, 1 phrase"}]}\nJSON uniquement.${noAdult}`
    : `User query: "${query}"\n\nReturn 5 perfectly matched films/shows. STRICT JSON:\n{"recommendations":[{"title":"exact","year":"YYYY","type":"movie or tv","reason":"why it fits, 1 sentence"}]}\nJSON only.${noAdult}`;
  try {
    const text = await callClaude(prompt, 1200);
    let parsed;
    try { parsed = parseJSON(text); } catch { return res.json({ recommendations: [] }); }
    const enriched = await Promise.all((parsed.recommendations || []).map(r => enrichWithTMDB(r, lang)));
    res.json({ recommendations: enriched });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Actor / director search =====
app.get('/api/person-search', async (req, res) => {
  const { q, lang = 'en-US' } = req.query;
  if (!q) return res.json({ person: null });
  if (typeof q !== 'string' || q.length > 200) return res.status(400).json({ error: 'query too long' });
  if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not set' });
  try {
    const search = await tmdbFetch('/search/person', { query: q, language: lang, include_adult: 'false' });
    const p = (search.results || [])[0];
    if (!p) return res.json({ person: null });
    const details = await tmdbFetch(`/person/${p.id}`, { language: lang, append_to_response: 'combined_credits' });
    const credits = (details.combined_credits?.cast || [])
      .concat(details.combined_credits?.crew || [])
      .filter(c => c.media_type === 'movie' || c.media_type === 'tv')
      .filter(isAppropriate);
    // Dedupe by id, sort by popularity
    const seen = new Set();
    const unique = credits
      .filter(c => { const k = `${c.id}_${c.media_type}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 40)
      .map(mapItem);
    res.json({
      person: {
        id: p.id, name: p.name, known_for: p.known_for_department,
        profile: p.profile_path ? `https://image.tmdb.org/t/p/w342${p.profile_path}` : null,
        biography: details.biography,
      },
      credits: unique,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== "Tonight we watch" wizard =====
app.post('/api/tonight', aiLimiter, async (req, res) => {
  const { viewingContext = 'solo', mood = null, timeBudget = null, library = [], lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const watchedSummary = library.slice(0, 30).map(i => `${i.title} (${i.year}) ${i.userRating || ''}`).join(', ');
  const moodMap = {
    happy: lang === 'fr' ? 'joyeux veut une comedie feel-good legere' : 'happy wants a feel-good comedy',
    sad: lang === 'fr' ? 'emotif veut un drame puissant qui fait pleurer' : 'emotional wants a powerful tearjerker drama',
    scared: lang === 'fr' ? 'veut frissons thriller horreur ou suspense' : 'wants thrills horror or suspense',
    mind: lang === 'fr' ? 'veut un film complexe qui retourne le cerveau' : 'wants a mind-bending complex film',
    tired: lang === 'fr' ? 'fatigue veut quelque chose de calme et leger' : 'tired wants calm and light',
  };
  const ctxMap = {
    solo: lang === 'fr' ? 'seul' : 'alone', couple: lang === 'fr' ? 'en couple' : 'with partner',
    family: lang === 'fr' ? 'en famille' : 'with family', friends: lang === 'fr' ? 'entre amis' : 'with friends',
  };
  const timeMap = {
    '1h': lang === 'fr' ? 'moins de 90 minutes' : 'under 90 minutes',
    '2h': lang === 'fr' ? 'environ 2h (90-150 min)' : 'about 2h (90-150 min)',
    'any': lang === 'fr' ? 'peu importe la duree' : 'any length',
  };
  const prompt = lang === 'fr'
    ? `L'utilisateur regarde ${ctxMap[viewingContext]}, ${moodMap[mood] || 'humeur neutre'}, ${timeMap[timeBudget] || 'duree libre'}.\nDeja vus (exclure) : ${watchedSummary}\n\nPropose 5 films/series parfaits ce soir. STRICT JSON: {"recommendations":[{"title":"exact","year":"YYYY","type":"movie ou tv","reason":"pourquoi c'est parfait ce soir, 1 phrase"}]}. JSON uniquement.`
    : `User watches ${ctxMap[viewingContext]}, ${moodMap[mood] || 'neutral mood'}, ${timeMap[timeBudget] || 'any length'}.\nAlready watched (exclude): ${watchedSummary}\n\nReturn 5 perfect picks for tonight. STRICT JSON: {"recommendations":[{"title":"exact","year":"YYYY","type":"movie or tv","reason":"why perfect tonight, 1 sentence"}]}. JSON only.`;
  try {
    const text = await callClaude(prompt, 1200);
    const parsed = parseJSON(text);
    const enriched = await Promise.all((parsed.recommendations || []).map(r => enrichWithTMDB(r, lang)));
    res.json({ recommendations: enriched });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Chat with Seret AI =====
app.post('/api/chat', aiLimiter, async (req, res) => {
  const { message, history = [], lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const system = lang === 'fr'
    ? `Tu es Seret AI, un ami cinephile passionne et bienveillant. Tu reponds en francais. Tu proposes des films/series concrets quand c'est pertinent (titre exact + annee). Ne mentionne JAMAIS Claude ou Anthropic. Sois chaleureux, pas prescripteur. Si l'utilisateur demande une recommandation, termine toujours par une ligne JSON cachee entre balises <seret-picks>...</seret-picks> avec max 3 films: [{"title":"exact","year":"YYYY","type":"movie ou tv"}]`
    : `You are Seret AI, a passionate, warm cinephile friend. Reply in English. Propose concrete films/shows when relevant (exact title + year). NEVER mention Claude or Anthropic. Be warm, not pushy. If the user asks for a recommendation, always end with a hidden JSON line between <seret-picks>...</seret-picks> tags with max 3 films: [{"title":"exact","year":"YYYY","type":"movie or tv"}]`;
  const messages = [
    ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];
  try {
    const text = await callClaude(messages, 1000, system);
    // Extract hidden picks
    const pickMatch = text.match(/<seret-picks>([\s\S]*?)<\/seret-picks>/i);
    let picks = [];
    if (pickMatch) {
      try { picks = JSON.parse(pickMatch[1].trim()); } catch {}
    }
    const enrichedPicks = await Promise.all(picks.map(p => enrichWithTMDB(p, lang)));
    const reply = text.replace(/<seret-picks>[\s\S]*?<\/seret-picks>/i, '').trim();
    res.json({ reply, picks: enrichedPicks });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Seasonal / cultural banner =====
app.get('/api/seasonal', (req, res) => {
  const { lang = 'en', culture = '' } = req.query;
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  const d = now.getDate();
  const fr = lang === 'fr';
  // Order matters: cultural overrides first, then calendar
  const isMuslim = culture === 'muslim';
  const isJewish = culture === 'jewish';
  const isChristian = culture === 'christian';

  // Calendar-based seasons (rough, good enough without a religious-calendar dep)
  if ((m === 10 && d >= 20) || (m === 11 && d === 1)) {
    return res.json({ tag: 'halloween', emoji: '🎃', title: fr ? 'Halloween' : 'Halloween',
      subtitle: fr ? 'Horreur, thrillers et frissons' : 'Horror, thrillers and chills',
      genres: [27, 53], query: 'horror' });
  }
  if (m === 12) {
    return res.json({ tag: 'christmas', emoji: '🎄', title: fr ? 'Noel' : 'Christmas',
      subtitle: fr ? 'Feel-good en famille' : 'Feel-good with family',
      genres: [10751, 35], query: 'christmas' });
  }
  if (m === 2 && d >= 7 && d <= 14) {
    return res.json({ tag: 'valentines', emoji: '💕', title: fr ? 'Saint Valentin' : 'Valentine\'s',
      subtitle: fr ? 'Romance et comedies romantiques' : 'Romance and romcoms',
      genres: [10749] });
  }
  if (isJewish && (m === 9 || m === 10)) {
    return res.json({ tag: 'high-holidays', emoji: '🍎', title: fr ? 'Tichri' : 'Tishrei',
      subtitle: fr ? 'Famille, pardon et redemption' : 'Family, forgiveness and redemption' });
  }
  if (isJewish && m === 12) {
    return res.json({ tag: 'hanukkah', emoji: '🕎', title: fr ? 'Hanouka' : 'Hanukkah',
      subtitle: fr ? 'Lumiere et espoir' : 'Light and hope' });
  }
  if (isMuslim && (m === 3 || m === 4)) {
    return res.json({ tag: 'ramadan', emoji: '🌙', title: fr ? 'Ramadan' : 'Ramadan',
      subtitle: fr ? 'Famille et spiritualite' : 'Family and spirituality' });
  }
  if (isChristian && (m === 3 || m === 4)) {
    return res.json({ tag: 'easter', emoji: '✝️', title: fr ? 'Paques' : 'Easter',
      subtitle: fr ? 'Renouveau et foi' : 'Renewal and faith' });
  }
  if (m >= 6 && m <= 8) {
    return res.json({ tag: 'summer', emoji: '☀️', title: fr ? 'Ete' : 'Summer',
      subtitle: fr ? 'Blockbusters et aventures' : 'Blockbusters and adventure',
      genres: [28, 12] });
  }
  if (m === 9 || m === 10 || m === 11) {
    return res.json({ tag: 'autumn', emoji: '🍂', title: fr ? 'Automne' : 'Autumn',
      subtitle: fr ? 'Films contemplatifs et cozy' : 'Contemplative and cozy',
      genres: [18] });
  }
  return res.json({ tag: null });
});

// ===== Taste evolution =====
app.post('/api/taste-evolution', aiLimiter, async (req, res) => {
  const { library = [], lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  if (library.length < 10) return res.json({ text: null });
  // Group by year of adding
  const byYear = {};
  for (const i of library) {
    const year = new Date(i.addedAt || Date.now()).getFullYear();
    (byYear[year] = byYear[year] || []).push(i);
  }
  const summary = Object.entries(byYear).sort().map(([y, items]) =>
    `${y}: ${items.slice(0, 10).map(i => i.title).join(', ')}`).join('\n');
  const prompt = lang === 'fr'
    ? `Voici l'historique cinematographique de l'utilisateur par annee :\n${summary}\n\nEn 3-4 phrases, decris comment ses gouts ont evolue. Style "En 2024 tu aimais l'action. En 2026 tu explores le cinema asiatique." Sois precis, personnel, flatteur. Reponds juste le paragraphe.`
    : `User's cinema history by year:\n${summary}\n\nIn 3-4 sentences, describe how their taste evolved. Style "In 2024 you loved action. In 2026 you explore Asian cinema." Precise, personal, flattering. Just the paragraph.`;
  try {
    const text = await callClaude(prompt, 400);
    res.json({ text });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Debate with AI =====
app.post('/api/debate', aiLimiter, async (req, res) => {
  const { title, opinion, lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const prompt = lang === 'fr'
    ? `L'utilisateur dit a propos de "${title}": "${opinion}"\n\nEn tant que Seret AI, repond en 3-4 phrases: d'abord reconnais son point de vue, puis challenge-le intelligemment en proposant un angle auquel il n'a peut-etre pas pense. Sois passionne, respectueux, cinephile.`
    : `User says about "${title}": "${opinion}"\n\nAs Seret AI, respond in 3-4 sentences: first acknowledge their view, then intelligently challenge it by offering an angle they may not have considered. Be passionate, respectful, cinephile.`;
  try {
    const text = await callClaude(prompt, 500);
    res.json({ response: text });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Cultural context =====
app.post('/api/context', aiLimiter, async (req, res) => {
  const { title, year, lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const prompt = lang === 'fr'
    ? `Donne le contexte historique et culturel de "${title}" (${year}) en 4-5 phrases: contexte de sortie, impact culturel, references artistiques, pourquoi c'est important.`
    : `Give the historical and cultural context of "${title}" (${year}) in 4-5 sentences: release context, cultural impact, artistic references, why it matters.`;
  try { const text = await callClaude(prompt, 500); res.json({ text }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Photo recognition =====
app.post('/api/recognize', aiLimiter, async (req, res) => {
  const { imageBase64, lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  if (!imageBase64) return res.status(400).json({ error: 'No image' });

  // Extract pure base64 if data URL
  const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
  const mediaType = match ? match[1] : 'image/jpeg';
  const data = match ? match[2] : imageBase64;

  const prompt = lang === 'fr'
    ? `Cette image peut contenir: une affiche de film, une photo d'ecran pendant un film, une jaquette DVD, une pochette Blu-ray, etc. Identifie le film ou la serie. Reponds STRICTEMENT en JSON:\n{"title": "titre exact", "year": "YYYY", "type": "movie ou tv", "confidence": "high|medium|low", "detected": "ce que tu as vu dans l'image"}\n\nSi tu ne reconnais pas, reponds {"title": null, "detected": "description"}.`
    : `This image may contain: a movie poster, a screenshot of a film playing, a DVD cover, a Blu-ray sleeve. Identify the movie or TV show. Respond STRICTLY in JSON:\n{"title": "exact title", "year": "YYYY", "type": "movie or tv", "confidence": "high|medium|low", "detected": "what you saw"}\n\nIf not recognized, respond {"title": null, "detected": "description"}.`;

  try {
    const messages = [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
        { type: 'text', text: prompt },
      ],
    }];
    const text = await callClaude(messages, 600);
    let parsed;
    try { parsed = parseJSON(text); }
    catch { return res.json({ title: null, detected: text }); }

    if (parsed.title) {
      const enriched = await enrichWithTMDB(parsed, lang);
      return res.json({ ...parsed, ...enriched });
    }
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Group recommendation =====
app.post('/api/group-recommend', aiLimiter, async (req, res) => {
  const { libraries = [], lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  if (libraries.length < 2) return res.json({ error: 'Need at least 2 people' });

  const summaries = libraries.map((lib, i) => {
    const titles = (lib.items || []).slice(0, 25).map(t => `${t.title} (${t.year}) ${t.userRating || '?'}/10`).join(', ');
    return `${lib.name}: ${titles}`;
  }).join('\n\n');

  const prompt = lang === 'fr'
    ? `Voici les bibliotheques de ${libraries.length} amis qui regardent ensemble ce soir:\n\n${summaries}\n\nTrouve UN SEUL film/serie que TOUS vont adorer. JSON:\n{"title":"","year":"YYYY","type":"movie ou tv","reason":"pourquoi, max 3 phrases", "seretScore": 85}\nseretScore est une note pondere 0-100 selon les gouts communs. JSON uniquement.`
    : `Here are ${libraries.length} friends' libraries watching together tonight:\n\n${summaries}\n\nFind ONE movie/show they'll ALL love. JSON:\n{"title":"","year":"YYYY","type":"movie or tv","reason":"why, max 3 sentences","seretScore": 85}\nseretScore is 0-100 weighted by common taste. JSON only.`;

  try {
    const text = await callClaude(prompt, 800);
    const rec = parseJSON(text);
    const enriched = await enrichWithTMDB(rec, lang);
    res.json({ recommendation: { ...rec, ...enriched } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== Wrapped =====
app.post('/api/wrapped', async (req, res) => {
  const { library = [], year = new Date().getFullYear() } = req.body;
  try {
    const yearMs = new Date(year, 0, 1).getTime();
    const nextYearMs = new Date(year + 1, 0, 1).getTime();
    const thisYear = library.filter(i => i.addedAt >= yearMs && i.addedAt < nextYearMs);
    const movies = thisYear.filter(i => i.type === 'movie').length;
    const shows = thisYear.filter(i => i.type === 'tv').length;
    const rated = thisYear.filter(i => (i.userRating || 0) > 0);
    const fiveStars = thisYear.filter(i => (i.userRating || 0) >= 9).length;
    const avgRating = rated.length ? (rated.reduce((s, i) => s + i.userRating, 0) / rated.length).toFixed(1) : '0';
    const top = [...thisYear].sort((a, b) => (b.userRating || 0) - (a.userRating || 0)).slice(0, 5);
    res.json({ year, total: thisYear.length, movies, shows, fiveStars, avgRating, top });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Educational recommendations =====
app.post('/api/learn', aiLimiter, async (req, res) => {
  const { category, level = 'any', ageRange = null, query = '', lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const catMap = {
    language: lang === 'fr' ? 'apprendre une langue etrangere' : 'learn a foreign language',
    science: lang === 'fr' ? 'sciences et nature' : 'science and nature',
    math: lang === 'fr' ? 'maths et logique' : 'math and logic',
    history: lang === 'fr' ? 'histoire et culture' : 'history and culture',
    business: lang === 'fr' ? 'business et leadership' : 'business and leadership',
    kids: lang === 'fr' ? 'enfants' : 'kids',
  };
  const ageHint = ageRange ? (lang === 'fr' ? ` pour enfants de ${ageRange} ans` : ` for kids aged ${ageRange}`) : '';
  const prompt = lang === 'fr'
    ? `Propose 5 films/series/documentaires educatifs sur "${catMap[category] || category}"${ageHint}, niveau ${level}. ${query ? 'Precision: ' + query : ''}\n\nSTRICT JSON:\n{"recommendations":[{"title":"exact","year":"YYYY","type":"movie ou tv","reason":"ce qu'on apprend, 1 phrase","level":"debutant/intermediaire/avance","skills":["compétence1","compétence2"]}]}\nUniquement contenu approprie (pas d'horreur, pas de scenes adultes). JSON uniquement.`
    : `Propose 5 educational films/shows/docs on "${catMap[category] || category}"${ageHint}, level ${level}. ${query ? 'Detail: ' + query : ''}\n\nSTRICT JSON:\n{"recommendations":[{"title":"exact","year":"YYYY","type":"movie or tv","reason":"what you learn, 1 sentence","level":"beginner/intermediate/advanced","skills":["skill1","skill2"]}]}\nOnly appropriate content (no horror, no adult scenes). JSON only.`;
  try {
    const text = await callClaude(prompt, 1500);
    const parsed = parseJSON(text);
    const enriched = await Promise.all((parsed.recommendations || []).map(r => enrichWithTMDB(r, lang)));
    // Preserve educational meta fields from the parsed recs (enrichWithTMDB overwrites some fields)
    const merged = enriched.map((e, i) => ({ ...e, level: parsed.recommendations[i]?.level, skills: parsed.recommendations[i]?.skills }));
    res.json({ recommendations: merged });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Taste affinity analysis =====
app.post('/api/affinity', aiLimiter, async (req, res) => {
  const { library = [], lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  if (library.length < 5) return res.json({ text: null });
  const top = library.filter(l => l.userRating >= 8).slice(0, 15).map(l => `${l.title} (${l.year})`).join(', ');
  const prompt = lang === 'fr'
    ? `Top films de l'utilisateur : ${top}.\n\nGenere une analyse d'affinite a la "Spotify Wrapped" en 2 lignes maximum : combien de cinephiles dans le monde partagent ses gouts (chiffre plausible entre 200 et 5000), et quel "clan" il rejoint. Format : "Tu partages les gouts de X utilisateurs Seret. Ton clan : <nom court>". Juste ces 2 phrases.`
    : `User's top films: ${top}.\n\nGenerate a "Spotify Wrapped"-style affinity insight in max 2 lines: how many cinephiles worldwide share their taste (plausible number 200-5000), and what "clan" they belong to. Format: "You share the taste of X Seret users. Your clan: <short name>". Just those 2 sentences.`;
  try {
    const text = await callClaude(prompt, 200);
    res.json({ text: text.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Seret for Schools (classrooms, assignments, answers) — minimal MVP =====
app.post('/api/class/create', aiLimiter, async (req, res) => {
  // Class creation/join is handled client-side via Supabase RLS; this endpoint
  // exists only to suggest 5 age-appropriate educational films for a topic.
  const { topic, ageRange = '11-14', lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const prompt = lang === 'fr'
    ? `Un enseignant cherche des films a montrer a une classe (age ${ageRange}) sur le theme "${topic}". Propose 5 films/docs approprie et inspirant. STRICT JSON: {"films":[{"title":"exact","year":"YYYY","type":"movie ou tv","question":"une question de comprehension a poser apres visionnage"}]}. JSON uniquement.`
    : `A teacher is looking for films to show a class (age ${ageRange}) on topic "${topic}". Propose 5 age-appropriate, inspiring films/docs. STRICT JSON: {"films":[{"title":"exact","year":"YYYY","type":"movie or tv","question":"one comprehension question to ask after viewing"}]}. JSON only.`;
  try {
    const text = await callClaude(prompt, 1200);
    const parsed = parseJSON(text);
    const enriched = await Promise.all((parsed.films || []).map(async (f) => {
      const tmdb = await enrichWithTMDB(f, lang);
      return { ...tmdb, question: f.question };
    }));
    res.json({ films: enriched });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Web Push VAPID public key (client subscribes with it) =====
app.get('/api/vapid-public-key', (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY || '';
  res.json({ key });
});

// ===== Stripe Premium checkout (DISABLED for freemium launch) =====
// All Seret features are free for the moment. Premium gating will activate
// when we reach 500–1000 monthly active users. This endpoint now returns
// 503 instead of creating a Stripe session, so accidental UI calls are inert.
app.post('/api/stripe/create-checkout', (req, res) => {
  res.status(503).json({ error: 'Premium is currently free — no checkout needed.' });
});

// ===== TV Guide — tonight on TV (via TVmaze) =====
// Lightweight proxy around api.tvmaze.com/schedule to power a "Ce soir a la TV" section.
function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: 'application/json', 'User-Agent': 'Seret/1.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Primary channels we want to surface first per country (order = priority)
const TV_CHANNELS_BY_COUNTRY = {
  FR: ['TF1', 'France 2', 'France 3', 'France 5', 'M6', 'Arte', 'Canal+', 'W9', 'TMC', 'C8'],
  US: ['NBC', 'ABC', 'CBS', 'FOX', 'HBO', 'AMC', 'FX', 'Showtime'],
  GB: ['BBC One', 'BBC Two', 'ITV', 'Channel 4', 'Channel 5', 'Sky One'],
  ES: ['Antena 3', 'Telecinco', 'La 1', 'La 2', 'Cuatro', 'La Sexta'],
  DE: ['ARD', 'ZDF', 'RTL', 'ProSieben', 'Sat.1', 'VOX'],
  IT: ['Rai 1', 'Rai 2', 'Rai 3', 'Canale 5', 'Italia 1', 'Rete 4'],
  IL: ['Keshet 12', 'Kan 11', 'Reshet 13', 'HOT'],
  BR: ['Globo', 'SBT', 'Record TV', 'Band'],
};

app.get('/api/tv-tonight', async (req, res) => {
  const country = String(req.query.country || 'FR').toUpperCase();
  if (!COUNTRY_RE.test(country)) return res.status(400).json({ error: 'invalid country' });
  const today = new Date().toISOString().slice(0, 10);
  try {
    const data = await httpGetJson(`https://api.tvmaze.com/schedule?country=${country}&date=${today}`);
    const priority = TV_CHANNELS_BY_COUNTRY[country] || [];
    // Keep evening primetime (18:00–23:59)
    const tonight = (Array.isArray(data) ? data : []).filter(ep => {
      const time = ep.airtime || '';
      return time >= '18:00' && time <= '23:59';
    });
    // Sort by channel priority then by time
    tonight.sort((a, b) => {
      const ca = a.show?.network?.name || a.show?.webChannel?.name || '';
      const cb = b.show?.network?.name || b.show?.webChannel?.name || '';
      const ia = priority.findIndex(p => ca.includes(p));
      const ib = priority.findIndex(p => cb.includes(p));
      const wa = ia === -1 ? 99 : ia;
      const wb = ib === -1 ? 99 : ib;
      if (wa !== wb) return wa - wb;
      return (a.airtime || '').localeCompare(b.airtime || '');
    });
    const items = tonight.slice(0, 30).map(ep => ({
      title: ep.show?.name || ep.name,
      episode: ep.name,
      season: ep.season, number: ep.number,
      time: ep.airtime || '',
      channel: ep.show?.network?.name || ep.show?.webChannel?.name || '',
      image: ep.show?.image?.medium || null,
      summary: (ep.show?.summary || '').replace(/<[^>]+>/g, '').slice(0, 200),
      genres: ep.show?.genres || [],
      type: ep.show?.type || 'Scripted',
      // TVmaze embeds imdb id we can use to link to TMDB later
      imdb: ep.show?.externals?.imdb || null,
    }));
    res.json({ country, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== World cinema — films from a given country =====
app.get('/api/world-cinema', async (req, res) => {
  const country = String(req.query.country || 'FR').toUpperCase();
  const { lang = 'en-US' } = req.query;
  if (!COUNTRY_RE.test(country)) return res.status(400).json({ error: 'invalid country' });
  if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not set' });
  try {
    const data = await tmdbFetch('/discover/movie', {
      language: lang, sort_by: 'popularity.desc',
      with_origin_country: country, include_adult: 'false',
      'vote_count.gte': 100,
    });
    const results = (data.results || []).filter(isAppropriate).map(r => ({ ...mapItem(r), type: 'movie' }));
    res.json({ results: results.slice(0, 24) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Monthly challenge (deterministic from current month) =====
app.get('/api/challenge', (req, res) => {
  const { lang = 'en' } = req.query;
  const month = new Date().getMonth() + 1;
  const fr = lang === 'fr';
  const challenges = [
    { key: 'jan', title: fr ? 'Un film de chaque continent' : 'One film from each continent', sub: fr ? '6 continents, 6 films' : '6 continents, 6 films' },
    { key: 'feb', title: fr ? 'Romance hors-sentier' : 'Romance off the beaten path', sub: fr ? 'Pas de rom-com US' : 'No US romcoms' },
    { key: 'mar', title: fr ? 'Cinema de femmes' : 'Cinema by women directors', sub: fr ? '5 films realises par des femmes' : '5 films directed by women' },
    { key: 'apr', title: fr ? 'Documentaires' : 'Documentaries', sub: fr ? '3 docs cette semaine' : '3 docs this week' },
    { key: 'may', title: fr ? 'Animation adulte' : 'Adult animation', sub: fr ? 'Pas que pour les enfants' : 'Not just for kids' },
    { key: 'jun', title: fr ? 'Films de moins de 90 minutes' : 'Under 90 min', sub: fr ? 'Concision appreciee' : 'Short and sharp' },
    { key: 'jul', title: fr ? 'Blockbuster oublie' : 'Forgotten blockbusters', sub: fr ? 'Annees 80-90' : '80s-90s' },
    { key: 'aug', title: fr ? 'Cinema asiatique' : 'Asian cinema', sub: fr ? 'Japon Coree HK' : 'Japan Korea HK' },
    { key: 'sep', title: fr ? 'Un classique par decennie' : 'One classic per decade', sub: fr ? '50s 60s 70s 80s 90s' : '50s 60s 70s 80s 90s' },
    { key: 'oct', title: fr ? 'Horreur intelligente' : 'Smart horror', sub: fr ? 'Pas que du jumpscare' : 'No cheap jumpscares' },
    { key: 'nov', title: fr ? 'Biopic' : 'Biopic', sub: fr ? 'Personnages reels' : 'Real figures' },
    { key: 'dec', title: fr ? 'Feel-good de fin d\'annee' : 'Year-end feel-good', sub: fr ? 'Pour finir l\'annee tranquille' : 'Close the year calmly' },
  ];
  res.json({ ...challenges[month - 1], month });
});

// ===== Legal pages =====
function legalPage(title, bodyFr, bodyEn) {
  return `<!doctype html>
<html lang="en" data-theme="dark"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} — Seret</title>
<link rel="stylesheet" href="/style.css">
<style>
  body{padding:40px 20px;max-width:760px;margin:0 auto;line-height:1.7}
  h1{font-family:var(--serif);font-size:36px;color:var(--text-bright);margin-bottom:8px}
  h2{font-family:var(--serif);font-size:22px;color:var(--text-bright);margin-top:32px}
  p,li{color:var(--text)}
  a{color:var(--gold)}
  .back{color:var(--text-dim);font-size:13px;margin-bottom:20px;display:inline-block}
  .lang{float:right;color:var(--text-dim);font-size:13px}
</style></head><body>
<a class="back" href="/">← Seret</a>
<span class="lang"><a href="?lang=en">EN</a> · <a href="?lang=fr">FR</a></span>
<div id="en">${bodyEn}</div>
<div id="fr" style="display:none">${bodyFr}</div>
<script>
  const p = new URLSearchParams(location.search);
  const lang = p.get('lang') || (navigator.language || '').startsWith('fr') ? 'fr' : 'en';
  if (lang === 'fr') { document.getElementById('fr').style.display = 'block'; document.getElementById('en').style.display = 'none'; }
</script>
</body></html>`;
}

app.get('/privacy', (req, res) => {
  const enBody = `
<h1>Privacy Policy</h1>
<p><em>Last updated: ${new Date().toLocaleDateString('en-GB')}</em></p>
<h2>What we collect</h2>
<ul>
  <li><strong>Account info</strong> — email, display name, avatar (if you sign up)</li>
  <li><strong>Your library</strong> — films/series you add, your ratings, your private journal entries</li>
  <li><strong>Social data</strong> — your friends connections, recommendations you send/receive</li>
  <li><strong>Usage analytics</strong> — events (rate, add, skip) to improve Seret AI recommendations</li>
</ul>
<h2>What we DON'T collect</h2>
<ul>
  <li>No tracking cookies beyond your session</li>
  <li>No ad networks, no third-party analytics that profile you</li>
  <li>We never sell your data</li>
</ul>
<h2>Third-party services</h2>
<ul>
  <li><strong>TMDB</strong> — film metadata. This product uses the TMDB API but is not endorsed or certified by TMDB.</li>
  <li><strong>Supabase</strong> — database and authentication</li>
  <li><strong>Anthropic Claude</strong> — powers Seret AI recommendations. Your messages are sent to them for processing; no user identifiers are attached.</li>
</ul>
<h2>Your rights</h2>
<ul>
  <li>Export your data at any time — contact us</li>
  <li>Delete your account from Settings → Sign out → "Delete my account" (or email us)</li>
</ul>
<h2>Contact</h2>
<p>Questions or data requests: <a href="mailto:kouty@elevon.fr">kouty@elevon.fr</a></p>`;

  const frBody = `
<h1>Politique de confidentialité</h1>
<p><em>Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}</em></p>
<h2>Ce que nous collectons</h2>
<ul>
  <li><strong>Infos compte</strong> — email, nom affiché, avatar (si inscription)</li>
  <li><strong>Votre bibliothèque</strong> — films/séries ajoutés, notes, journal privé</li>
  <li><strong>Données sociales</strong> — amis, recommandations envoyées/reçues</li>
  <li><strong>Analytics d'usage</strong> — événements (noter, ajouter, passer) pour améliorer Seret AI</li>
</ul>
<h2>Ce que nous NE collectons PAS</h2>
<ul>
  <li>Pas de cookies de tracking au-delà de votre session</li>
  <li>Pas de régies publicitaires, pas d'analytics tiers qui vous profilent</li>
  <li>Nous ne vendons jamais vos données</li>
</ul>
<h2>Services tiers</h2>
<ul>
  <li><strong>TMDB</strong> — métadonnées films. Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.</li>
  <li><strong>Supabase</strong> — base de données et authentification</li>
  <li><strong>Anthropic Claude</strong> — propulse Seret AI. Vos messages sont envoyés pour traitement ; aucun identifiant utilisateur n'est joint.</li>
</ul>
<h2>Vos droits</h2>
<ul>
  <li>Export de vos données à tout moment — contactez-nous</li>
  <li>Suppression de compte dans Paramètres → Déconnexion → "Supprimer mon compte" (ou par email)</li>
</ul>
<h2>Contact</h2>
<p>Questions ou demandes RGPD : <a href="mailto:kouty@elevon.fr">kouty@elevon.fr</a></p>`;

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(legalPage('Privacy', frBody, enBody));
});

app.get('/schools', (req, res) => {
  const html = `<!doctype html>
<html lang="en" data-theme="dark"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Seret for Schools</title>
<link rel="stylesheet" href="/style.css">
<style>
  body { padding: 60px 20px; max-width: 860px; margin: 0 auto; }
  .hero-school { text-align: center; padding: 40px 0; }
  .hero-school h1 { font-family: var(--serif); font-size: 48px; color: var(--text-bright); margin-bottom: 12px; }
  .hero-school p { color: var(--text); font-size: 18px; max-width: 560px; margin: 0 auto; line-height: 1.6; }
  .school-form { background: var(--bg-2); border: 1px solid var(--border); border-radius: 18px; padding: 28px; margin: 30px 0; }
  .school-form label { display: block; font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin: 14px 0 6px; }
  .school-form input, .school-form select { width: 100%; padding: 12px 14px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; color: var(--text); font-size: 14px; outline: none; }
  .film-card { display: flex; gap: 16px; padding: 18px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 14px; margin-bottom: 12px; }
  .film-card img { width: 90px; height: 135px; border-radius: 10px; object-fit: cover; }
  .film-card-body { flex: 1; }
  .film-card h3 { font-family: var(--serif); font-size: 18px; margin: 0 0 6px; color: var(--text-bright); }
  .film-card .q { margin-top: 10px; padding: 10px 14px; background: var(--bg); border-left: 3px solid var(--gold); border-radius: 8px; font-style: italic; }
  .back { color: var(--text-dim); font-size: 13px; }
  .pricing { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin: 30px 0; }
  .tier { background: var(--bg-2); border: 1px solid var(--border); border-radius: 16px; padding: 24px; text-align: center; }
  .tier h4 { font-family: var(--serif); font-size: 20px; color: var(--text-bright); margin: 0 0 4px; }
  .tier .p { font-size: 28px; color: var(--gold); font-family: var(--serif); font-weight: 800; margin: 6px 0; }
</style></head><body>
<a class="back" href="/">← Seret</a>
<div class="hero-school">
  <h1>🎓 Seret for Schools</h1>
  <p>Du cinéma au service de l'apprentissage. Sélections pédagogiques par thème, âge et discipline — avec questions de compréhension prêtes à l'emploi.</p>
</div>
<div class="school-form">
  <label>Thème du cours</label>
  <input type="text" id="topic" placeholder="La Révolution française, le cycle de l'eau, la Shoah...">
  <label>Tranche d'âge</label>
  <select id="ageRange">
    <option value="7-10">7-10 ans</option>
    <option value="11-14" selected>11-14 ans</option>
    <option value="15-18">15-18 ans</option>
    <option value="adult">Adultes / université</option>
  </select>
  <button class="btn btn-gold btn-lg" style="margin-top:20px;width:100%;justify-content:center" onclick="runClass()">
    Générer une sélection
  </button>
  <div id="classResults" style="margin-top:20px"></div>
</div>
<div class="pricing">
  <div class="tier">
    <h4>Classe</h4>
    <div class="p">500€<span style="font-size:14px;color:var(--text-dim)">/an</span></div>
    <div style="color:var(--text-dim);font-size:13px">Jusqu'à 30 élèves</div>
  </div>
  <div class="tier">
    <h4>École</h4>
    <div class="p">1500€<span style="font-size:14px;color:var(--text-dim)">/an</span></div>
    <div style="color:var(--text-dim);font-size:13px">Jusqu'à 300 élèves</div>
  </div>
  <div class="tier">
    <h4>Académie</h4>
    <div class="p">2000€<span style="font-size:14px;color:var(--text-dim)">/an</span></div>
    <div style="color:var(--text-dim);font-size:13px">Illimité + support</div>
  </div>
</div>
<p style="text-align:center;color:var(--text-dim);font-size:13px;margin-top:40px">
  Pour souscrire ou découvrir une démo personnalisée :
  <a href="mailto:kouty@elevon.fr?subject=Seret%20for%20Schools" style="color:var(--gold)">kouty@elevon.fr</a>
</p>
<script>
async function runClass() {
  const topic = document.getElementById('topic').value.trim();
  const ageRange = document.getElementById('ageRange').value;
  if (!topic) return;
  const results = document.getElementById('classResults');
  results.innerHTML = '<div class="recs-loading"><div class="spinner"></div> Sélection en cours...</div>';
  try {
    const r = await fetch('/api/class/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, ageRange, lang: (navigator.language || '').startsWith('fr') ? 'fr' : 'en' }),
    });
    const d = await r.json();
    results.innerHTML = (d.films || []).map(f => \`
      <div class="film-card">
        \${f.poster ? \`<img src="\${f.poster}">\` : ''}
        <div class="film-card-body">
          <h3>\${f.title} <span style="color:var(--text-dim);font-weight:400;font-size:14px">(\${f.year})</span></h3>
          <div style="font-size:13px;color:var(--text)">\${(f.overview || '').slice(0, 200)}\${(f.overview || '').length > 200 ? '...' : ''}</div>
          <div class="q"><strong>Question après visionnage :</strong> \${f.question}</div>
        </div>
      </div>\`).join('') || '<p style="color:var(--text-dim)">Aucun résultat.</p>';
  } catch (e) { results.innerHTML = '<p style="color:var(--danger)">' + e.message + '</p>'; }
}
</script>
</body></html>`;
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.get('/premium', (req, res) => {
  // Freemium launch — everything is free. /premium shows a "thank you, enjoy"
  // teaser with the upcoming Premium feature list. No checkout button.
  const html = `<!doctype html>
<html lang="en" data-theme="dark"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Seret — 100% gratuit</title>
<link rel="stylesheet" href="/style.css">
<style>
  body { padding: 60px 20px; max-width: 720px; margin: 0 auto; }
  .hero-premium { text-align: center; padding: 40px 0; }
  .hero-premium h1 { font-family: var(--serif); font-size: 56px; font-weight: 800; background: linear-gradient(135deg, var(--gold), #fff); -webkit-background-clip: text; background-clip: text; color: transparent; margin-bottom: 12px; }
  .hero-premium p { font-size: 18px; color: var(--text); line-height: 1.6; }
  .free-badge { display: inline-block; padding: 10px 22px; background: rgba(212,175,55,0.15); border: 1px solid var(--gold); border-radius: 100px; color: var(--gold); font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-size: 12px; margin: 20px 0; }
  .premium-features { list-style: none; padding: 0; margin: 40px 0; display: grid; gap: 12px; }
  .premium-features li { padding: 14px 18px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 14px; font-size: 15px; }
  .premium-features li::before { content: '✓ '; color: var(--gold); font-weight: 700; margin-right: 8px; }
  .back { color: var(--text-dim); font-size: 13px; }
</style></head><body>
<a class="back" href="/">← Seret</a>
<div class="hero-premium">
  <h1>Merci d'utiliser Seret</h1>
  <div class="free-badge">🎬 100% gratuit</div>
  <p>Toutes les fonctionnalités sont gratuites pendant la phase de lancement.<br>
  Aucune carte bancaire, aucun abonnement, aucune publicité.</p>
  <p style="color:var(--text-dim);font-size:14px;margin-top:30px">Un jour, certaines features passeront sur un plan premium à 4,99€/mois — mais pas aujourd'hui.</p>
</div>
<h2 style="font-family:var(--serif);text-align:center;color:var(--text-bright);margin-top:60px">Tout est inclus :</h2>
<ul class="premium-features">
  <li>Seret AI illimitée — recommandations, chat, prédictions, débat</li>
  <li>Profils multiples (jusqu'à 5)</li>
  <li>Statistiques avancées — analyse d'évolution, ADN cinéma</li>
  <li>Guide TV intelligent</li>
  <li>Stories, Friends, Cinema Night</li>
  <li>Scan d'affiches par IA</li>
  <li>Wrapped annuel téléchargeable</li>
  <li>Multi-langues (8 langues dont hébreu & arabe)</li>
</ul>
<p style="text-align:center;color:var(--text-dim);font-size:13px;margin-top:40px">
  Un bug ? Une idée ? <a href="mailto:kouty@elevon.fr" style="color:var(--gold)">kouty@elevon.fr</a>
</p>
</body></html>`;
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.get('/terms', (req, res) => {
  const enBody = `
<h1>Terms of Service</h1>
<p><em>Last updated: ${new Date().toLocaleDateString('en-GB')}</em></p>
<h2>Using Seret</h2>
<p>Seret is a personal cinema library and AI recommendation service. You agree to use it respectfully and not for illegal purposes.</p>
<h2>Your content</h2>
<p>Your journal entries, ratings, comments remain yours. You grant us the right to store and display them within Seret (to you and, if you choose, to your friends).</p>
<h2>Age</h2>
<p>You must be 13 or older to use Seret. Minors should have parental supervision.</p>
<h2>No warranty</h2>
<p>Seret is provided "as is". AI recommendations are opinions, not professional advice.</p>
<h2>Termination</h2>
<p>You can delete your account at any time. We reserve the right to suspend accounts that violate these terms.</p>
<h2>TMDB</h2>
<p>This product uses the TMDB API but is not endorsed or certified by TMDB. Film metadata belongs to TMDB and its contributors.</p>
<h2>Changes</h2>
<p>These terms may evolve. Material changes will be announced via in-app notice.</p>
<h2>Contact</h2>
<p><a href="mailto:kouty@elevon.fr">kouty@elevon.fr</a></p>`;

  const frBody = `
<h1>Conditions d'utilisation</h1>
<p><em>Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}</em></p>
<h2>Utiliser Seret</h2>
<p>Seret est une bibliothèque de cinéma personnelle avec recommandations IA. Vous vous engagez à l'utiliser avec respect et à des fins légales.</p>
<h2>Votre contenu</h2>
<p>Vos notes, journaux, commentaires vous appartiennent. Vous nous accordez le droit de les stocker et afficher dans Seret (à vous et, si vous le souhaitez, à vos amis).</p>
<h2>Âge</h2>
<p>Vous devez avoir 13 ans ou plus pour utiliser Seret. Les mineurs doivent être accompagnés par leurs parents.</p>
<h2>Sans garantie</h2>
<p>Seret est fourni "tel quel". Les recommandations IA sont des opinions, pas des conseils professionnels.</p>
<h2>Résiliation</h2>
<p>Vous pouvez supprimer votre compte à tout moment. Nous nous réservons le droit de suspendre les comptes qui violent ces conditions.</p>
<h2>TMDB</h2>
<p>Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB. Les métadonnées appartiennent à TMDB et ses contributeurs.</p>
<h2>Modifications</h2>
<p>Ces conditions peuvent évoluer. Les changements significatifs seront annoncés dans l'app.</p>
<h2>Contact</h2>
<p><a href="mailto:kouty@elevon.fr">kouty@elevon.fr</a></p>`;

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(legalPage('Terms', frBody, enBody));
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`\n  🎬 Seret is running at http://localhost:${PORT}\n`);
  if (!TMDB_API_KEY) console.log('  ⚠  Set TMDB_API_KEY');
  if (!CLAUDE_API_KEY) console.log('  ⚠  Set CLAUDE_API_KEY');
  if (!SUPABASE_URL) console.log('  ⚠  Set SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) console.log('  ⚠  Set SUPABASE_ANON_KEY');
  console.log('');
});
