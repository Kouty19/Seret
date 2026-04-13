const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

app.get('/api/config', (req, res) => {
  res.json({ supabaseUrl: SUPABASE_URL, supabaseAnonKey: SUPABASE_ANON_KEY });
});

function tmdbFetch(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    https.get(url.toString(), { headers: { Accept: 'application/json' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ results: [] }); }
      });
    }).on('error', reject);
  });
}

function isAppropriate(r) {
  if (r.adult === true) return false;
  // Block NSFW genres: Adult (film) = no explicit genre id, but many adult content
  // has genre_ids = [10749, 18] + adult=true. We also filter by keywords.
  const blockedKeywords = ['xxx', 'porn', 'porno', 'adult', 'erotic', 'nude', 'nudity'];
  const text = ((r.title || r.name || '') + ' ' + (r.overview || '')).toLowerCase();
  if (blockedKeywords.some(k => text.includes(k))) return false;
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
      const data = await tmdbFetch('/trending/all/week', { language: lang });
      raw = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
    } else if (category === 'movie') {
      const data = await tmdbFetch('/trending/movie/week', { language: lang });
      raw = (data.results || []).map(r => ({ ...r, media_type: 'movie' }));
    } else if (category === 'tv') {
      const data = await tmdbFetch('/trending/tv/week', { language: lang });
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
      model: 'claude-sonnet-4-20250514',
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
    const search = await tmdbFetch('/search/multi', { query: rec.title, language: lang === 'fr' ? 'fr-FR' : 'en-US' });
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
app.post('/api/recommend', async (req, res) => {
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
    happy: lang === 'fr' ? 'de bonne humeur' : 'happy', sad: lang === 'fr' ? 'emotif' : 'emotional',
    scared: lang === 'fr' ? 'envie de sensations fortes' : 'wants thrills', mind: lang === 'fr' ? 'envie de se faire retourner le cerveau' : 'wants mind-bending',
    tired: lang === 'fr' ? 'fatigue veut quelque chose de leger' : 'tired wants something light',
  };

  const baseJSON = lang === 'fr'
    ? `Reponds STRICTEMENT au format JSON:\n{\n  "profile": "Analyse poetique de son ADN cinematographique, ses obsessions, 2-3 phrases, commence par 'D'apres ta bibliotheque,'",\n  "persona": "Le Justicier" ou "L'Analyste" ou "L'Empathique" ou "L'Adrenaline" ou "Le Reveur" ou "L'Esthete",\n  "personaReason": "1 phrase expliquant pourquoi",\n  "dna": "Tu adores X (acteur/realisateur/pays). Voici Y de ses oeuvres que tu n'as pas vues : ..." ou null,\n  "recommendations": [{"title": "titre exact", "year": "YYYY", "type": "movie ou tv", "reason": "pourquoi ca va le toucher, 1-2 phrases"}]\n}\n\nDonne 5 recommandations. Reponds uniquement le JSON.`
    : `Respond STRICTLY in JSON:\n{\n  "profile": "Poetic analysis of their cinematic DNA, obsessions, 2-3 sentences, starts with 'Based on your library,'",\n  "persona": "The Vigilante" or "The Analyst" or "The Empath" or "The Adrenaline" or "The Dreamer" or "The Aesthete",\n  "personaReason": "1 sentence why",\n  "dna": "You love X (actor/director/country). Here are Y of their works you haven't seen: ..." or null,\n  "recommendations": [{"title": "exact title", "year": "YYYY", "type": "movie or tv", "reason": "why it hits, 1-2 sentences"}]\n}\n\nGive 5 recommendations. Return only JSON.`;

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

// ===== Debate with AI =====
app.post('/api/debate', async (req, res) => {
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
app.post('/api/context', async (req, res) => {
  const { title, year, lang = 'en' } = req.body;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Seret AI not configured' });
  const prompt = lang === 'fr'
    ? `Donne le contexte historique et culturel de "${title}" (${year}) en 4-5 phrases: contexte de sortie, impact culturel, references artistiques, pourquoi c'est important.`
    : `Give the historical and cultural context of "${title}" (${year}) in 4-5 sentences: release context, cultural impact, artistic references, why it matters.`;
  try { const text = await callClaude(prompt, 500); res.json({ text }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== Photo recognition =====
app.post('/api/recognize', async (req, res) => {
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
app.post('/api/group-recommend', async (req, res) => {
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

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`\n  🎬 Seret is running at http://localhost:${PORT}\n`);
  if (!TMDB_API_KEY) console.log('  ⚠  Set TMDB_API_KEY');
  if (!CLAUDE_API_KEY) console.log('  ⚠  Set CLAUDE_API_KEY');
  if (!SUPABASE_URL) console.log('  ⚠  Set SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) console.log('  ⚠  Set SUPABASE_ANON_KEY');
  console.log('');
});
