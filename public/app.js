// ====================================================
// Seret — Apple/A24 premium cinema app
// ====================================================

// ===== State =====
let sb = null;
let currentUser = null;
let userProfile = null;
let userProfiles = []; // sub-profiles
let activeProfile = null; // currently selected sub-profile
let currentLang = localStorage.getItem('seret-lang') || 'en';
let library = [];
let calibrationData = [];
let heroItem = null;
let currentFilter = 'all';
let currentCategory = 'all';
let currentLibSection = 'watched';
let currentViewingContext = 'solo';
let currentMood = null;
let pendingAddItem = null;
let userStats = { points: 0, streak_days: 0, badges: [], last_activity_date: null };
let friendsData = [];
let selectedGroupFriends = new Set();
let searchTimeout = null;
let recoTargetItem = null;

// ===== i18n =====
const i18n = {
  en: {
    search_placeholder: 'Search films & series...',
    nav_home: 'Home', nav_library: 'Library', nav_ai: 'Seret AI', nav_friends: 'Friends', nav_wrapped: 'Wrapped',
    trending: 'Trending This Week',
    my_library: 'My Library', all: 'All', movies: 'Movies', series: 'Series',
    cat_all: 'All', cat_movies: 'Films', cat_series: 'Series', cat_docs: 'Docs', cat_anime: 'Anime',
    seen: 'Seen', to_watch: 'To Watch', seen_list: 'Seen', watchlist: 'To Watch',
    empty_library: 'Your library is empty. Search for titles or scan a poster to add them.',
    details: 'Details', added: 'Added', already_in: 'Already saved', removed: 'Removed',
    ai_sub: 'Cinematic intelligence tuned to your taste.',
    loading_recs: 'Seret AI is thinking...',
    get_recs: 'Get Recommendations', surprise_me: 'Surprise me',
    mood_label: "Tonight you feel",
    mood_happy: 'Happy', mood_sad: 'Emotional', mood_scared: 'Thrilled', mood_mind: 'Mind-bending', mood_tired: 'Chill',
    tonight_with: 'Tonight you watch with',
    ctx_solo: 'Solo', ctx_couple: 'Couple', ctx_family: 'Family', ctx_friends: 'Friends',
    watched_how: 'How did you watch it?', skip: 'Skip',
    sign_in: 'Sign in', sign_out: 'Sign out',
    sign_in_title: 'Sign in to Seret', sign_in_sub: 'Save your library and share with friends',
    email_placeholder: 'Email', password_placeholder: 'Password',
    no_account: 'No account?', create_account: 'Create one',
    create_account_title: 'Create your account', has_account: 'Already have an account?',
    fill_fields: 'Please fill in all fields',
    password_min: 'Password must be at least 6 characters',
    account_created: 'Account created', signed_in: 'Signed in',
    friends_title: 'Friends',
    friends_sign_in: 'Sign in to connect with friends',
    your_share_code: 'Your share code', copy: 'Copy', invite: 'Invite',
    enter_friend_code: "Enter a friend's code...",
    add_friend: 'Add', pending_requests: 'Pending',
    accept: 'Accept', decline: 'Decline',
    my_friends: 'My Friends', view_library: 'Library', remove_friend: 'Remove',
    back: 'Back', no_friends: 'No friends yet. Share your code to connect.',
    friend_added: 'Request sent', friend_accepted: 'Accepted',
    code_copied: 'Code copied', friend_not_found: 'User not found',
    library_of: "'s Library",
    group_watch: "Tonight we watch...",
    group_watch_sub: 'Pick friends and let Seret AI find one for all.',
    find_film: 'Find a Film', pick_friends: 'Pick at least one friend',
    wrapped_title: 'Your Year in Cinema', generate_wrapped: 'Generate',
    total_watched: 'Total', movies_count: 'Movies', series_count: 'Series',
    five_stars: 'Favorites', avg_rating: 'Avg rating', top_picks: 'Your top picks',
    share_whatsapp: 'Share on WhatsApp',
    your_stats: 'Your Stats', points: 'Points', streak: 'Streak', badges: 'Badges',
    badge_beginner: 'Beginner', badge_confirmed: 'Confirmed', badge_expert: 'Expert',
    badge_legend: 'Legend', badge_100: '100 Films', badge_rater: 'Big Rater',
    new_season: 'New season available',
    new_season_msg: 'Season', add_to_watchlist: 'Add to To-Watch',
    your_profile: 'Your cinematic DNA',
    available_on: 'Available on', recommend_friend: 'Recommend',
    reco_title: 'Recommend to...', send_reco: 'Send', reco_msg_ph: 'Why should they watch it?',
    reco_sent: 'Sent!', overview: 'Overview', cast: 'Cast', similar: 'Similar',
    welcome_title: 'Welcome to Seret',
    welcome_sub: 'Your cinema, curated. Let\'s set up your experience.',
    continue: 'Continue', done: 'Done',
    create_profile: 'Who\'s watching?',
    create_profile_sub: 'Create up to 5 profiles. Each has its own library and AI.',
    new_profile: 'New profile', profile_name: 'Profile name',
    profile_kind: 'Type', kind_solo: 'Solo', kind_couple: 'Couple',
    kind_family: 'Family', kind_kid: 'Kid',
    calibrate_title: 'Calibrate Seret AI', calibrate_sub: 'Swipe or tap to tell us what you like.',
    calibrate_done: 'You\'re set. Seret AI knows your taste now.',
    trailer: 'Trailer', watch_trailer: 'Watch Trailer',
    journal_label: 'Journal (private)', journal_ph: 'A personal note about this film...',
    save: 'Save', saved: 'Saved',
    cultural_title: 'Cultural Context', cultural_btn: 'Learn more',
    debate_title: 'Debate with Seret AI', debate_ph: 'Share your take on this film...',
    debate_btn: 'Start debate',
    scan_title: 'Scan a film', scan_hint: 'Photograph a poster, a DVD cover, or a playing screen.',
    take_photo: 'Take Photo', scanning: 'Analyzing...', scan_found: 'Found:',
    scan_not_found: 'Couldn\'t recognize this image.',
    select_profile: 'Who\'s watching?', add_profile: 'Add profile',
    from_friend: 'From',
    upload_photo: 'Upload photo', or_choose: 'or choose an avatar',
    edit_profile: 'Edit profile',
  },
  fr: {
    search_placeholder: 'Rechercher films & series...',
    nav_home: 'Accueil', nav_library: 'Bibliotheque', nav_ai: 'Seret AI', nav_friends: 'Amis', nav_wrapped: 'Wrapped',
    trending: 'Tendances',
    my_library: 'Ma Bibliotheque', all: 'Tout', movies: 'Films', series: 'Series',
    cat_all: 'Tout', cat_movies: 'Films', cat_series: 'Series', cat_docs: 'Docs', cat_anime: 'Anime',
    seen: 'Vu', to_watch: 'A voir', seen_list: 'Deja vu', watchlist: 'A voir',
    empty_library: 'Votre bibliotheque est vide. Cherchez ou scannez une affiche.',
    details: 'Details', added: 'Ajoute', already_in: 'Deja ajoute', removed: 'Retire',
    ai_sub: 'Intelligence cinematographique accordee a ton gout.',
    loading_recs: 'Seret AI reflechit...',
    get_recs: 'Obtenir des recos', surprise_me: 'Surprends-moi',
    mood_label: 'Ce soir tu te sens',
    mood_happy: 'Joyeux', mood_sad: 'Emotif', mood_scared: 'Sensations', mood_mind: 'Profond', mood_tired: 'Leger',
    tonight_with: 'Ce soir tu regardes avec',
    ctx_solo: 'Solo', ctx_couple: 'En couple', ctx_family: 'En famille', ctx_friends: 'Entre amis',
    watched_how: "C'etait comment ?", skip: 'Passer',
    sign_in: 'Connexion', sign_out: 'Deconnexion',
    sign_in_title: 'Connectez-vous a Seret', sign_in_sub: 'Sauvegardez votre bibliotheque',
    email_placeholder: 'Email', password_placeholder: 'Mot de passe',
    no_account: 'Pas de compte ?', create_account: 'Creer un compte',
    create_account_title: 'Creez votre compte', has_account: 'Deja un compte ?',
    fill_fields: 'Remplissez tous les champs',
    password_min: 'Mot de passe : 6 caracteres min',
    account_created: 'Compte cree', signed_in: 'Connecte',
    friends_title: 'Amis', friends_sign_in: 'Connectez-vous pour retrouver vos amis',
    your_share_code: 'Votre code', copy: 'Copier', invite: 'Inviter',
    enter_friend_code: "Code d'un ami...",
    add_friend: 'Ajouter', pending_requests: 'Demandes',
    accept: 'Accepter', decline: 'Refuser',
    my_friends: 'Mes amis', view_library: 'Bibliotheque', remove_friend: 'Retirer',
    back: 'Retour', no_friends: 'Aucun ami. Partagez votre code pour connecter.',
    friend_added: 'Demande envoyee', friend_accepted: 'Acceptee',
    code_copied: 'Copie', friend_not_found: 'Utilisateur introuvable',
    library_of: ' — Bibliotheque',
    group_watch: 'Ce soir on regarde...',
    group_watch_sub: 'Choisis tes amis, Seret AI trouve un film pour tous.',
    find_film: 'Trouver', pick_friends: 'Choisis au moins un ami',
    wrapped_title: 'Ton annee cinema', generate_wrapped: 'Generer',
    total_watched: 'Total', movies_count: 'Films', series_count: 'Series',
    five_stars: 'Coups de coeur', avg_rating: 'Note moyenne', top_picks: 'Tes preferes',
    share_whatsapp: 'Partager sur WhatsApp',
    your_stats: 'Tes stats', points: 'Points', streak: 'Jours', badges: 'Badges',
    badge_beginner: 'Debutant', badge_confirmed: 'Confirme', badge_expert: 'Expert',
    badge_legend: 'Legende', badge_100: '100 Films', badge_rater: 'Grand Noteur',
    new_season: 'Nouvelle saison', new_season_msg: 'Saison',
    add_to_watchlist: 'Ajouter a ma liste',
    your_profile: 'Ton ADN cinematographique',
    available_on: 'Disponible sur', recommend_friend: 'Recommander',
    reco_title: 'Recommander a...', send_reco: 'Envoyer', reco_msg_ph: 'Pourquoi il doit le voir ?',
    reco_sent: 'Envoye !', overview: 'Synopsis', cast: 'Casting', similar: 'Similaires',
    welcome_title: 'Bienvenue sur Seret',
    welcome_sub: 'Ton cinema, curate. Configurons ton experience.',
    continue: 'Continuer', done: 'Termine',
    create_profile: 'Qui regarde ?',
    create_profile_sub: 'Cree jusqu\'a 5 profils. Chacun a sa bibliotheque et son IA.',
    new_profile: 'Nouveau profil', profile_name: 'Nom du profil',
    profile_kind: 'Type', kind_solo: 'Solo', kind_couple: 'Couple',
    kind_family: 'Famille', kind_kid: 'Enfant',
    calibrate_title: 'Calibrer Seret AI', calibrate_sub: 'Swipe ou tape pour nous dire ce que tu aimes.',
    calibrate_done: "C'est pret. Seret AI connait ton gout.",
    trailer: 'Bande-annonce', watch_trailer: 'Voir la bande-annonce',
    journal_label: 'Journal (prive)', journal_ph: 'Une note personnelle sur ce film...',
    save: 'Enregistrer', saved: 'Enregistre',
    cultural_title: 'Contexte culturel', cultural_btn: 'En savoir plus',
    debate_title: 'Debattre avec Seret AI', debate_ph: 'Partage ton avis sur ce film...',
    debate_btn: 'Lancer le debat',
    scan_title: 'Scanner un film', scan_hint: 'Prends une affiche, une jaquette, ou un ecran en cours.',
    take_photo: 'Prendre une photo', scanning: 'Analyse en cours...', scan_found: 'Trouve :',
    scan_not_found: 'Impossible de reconnaitre.',
    select_profile: 'Qui regarde ?', add_profile: 'Ajouter un profil',
    from_friend: 'De',
    upload_photo: 'Importer une photo', or_choose: 'ou choisis un avatar',
    edit_profile: 'Modifier le profil',
  }
};
const t = k => i18n[currentLang]?.[k] || i18n.en[k] || k;

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.getElementById('langBtn').textContent = currentLang === 'en' ? 'FR' : 'EN';
}
function toggleLang() {
  currentLang = currentLang === 'en' ? 'fr' : 'en';
  localStorage.setItem('seret-lang', currentLang);
  applyLang();
  loadTrending();
}

// ===== Supabase =====
async function initSupabase() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    if (config.supabaseUrl && config.supabaseAnonKey && window.supabase) {
      sb = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      sb.auth.onAuthStateChange(async (event, session) => {
        currentUser = session?.user || null;
        await onAuthChange();
      });
      const { data: { session } } = await sb.auth.getSession();
      currentUser = session?.user || null;
      await onAuthChange();
    } else {
      loadLocalLibrary();
    }
  } catch (e) { console.warn('Supabase not configured', e); loadLocalLibrary(); }
}

async function onAuthChange() {
  updateAuthUI();
  if (currentUser) {
    await loadProfile();
    await loadSubProfiles();
    await loadStats();
    loadFriends().catch(e => console.warn('friends preload failed', e));
    subscribeToRealtime(); // live updates across tabs/devices
    if (userProfiles.length === 0) {
      openOnboarding();
    } else if (!activeProfile) {
      openProfilePicker();
    } else {
      await loadLibraryForProfile();
      loadTrending(); // re-render trending now that library is ready (filters skipped)
      checkDailyStreak();
      checkNewSeasons();
      loadIncomingRecos();
      processPendingAdd();
    }
  } else {
    activeProfile = null;
    unsubscribeFromRealtime();
    loadLocalLibrary();
    document.getElementById('statsPill').style.display = 'none';
    document.getElementById('profilePill').style.display = 'none';
  }
}

// ===== Realtime =====
let realtimeChannels = [];

function unsubscribeFromRealtime() {
  realtimeChannels.forEach(ch => { try { sb.removeChannel(ch); } catch {} });
  realtimeChannels = [];
}

function subscribeToRealtime() {
  if (!sb || !currentUser) return;
  unsubscribeFromRealtime();

  // Library changes for the current user (any profile)
  const libCh = sb.channel('rt-library-' + currentUser.id)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'library_items',
      filter: `user_id=eq.${currentUser.id}`,
    }, (payload) => {
      if (!activeProfile) return;
      const row = payload.new || payload.old;
      if (!row || row.profile_id !== activeProfile.id) return;
      if (payload.eventType === 'DELETE') {
        library = library.filter(l => !(l.id === row.tmdb_id && l.type === row.media_type));
      } else {
        const item = {
          id: row.tmdb_id, type: row.media_type, title: row.title, year: row.year,
          poster: row.poster, backdrop: row.backdrop, overview: row.overview, rating: row.rating,
          userRating: row.user_rating, status: row.status || 'watched',
          viewing_context: row.viewing_context, priority: row.priority, comment: row.comment,
          addedAt: new Date(row.added_at).getTime(),
        };
        const idx = library.findIndex(l => l.id === item.id && l.type === item.type);
        if (idx >= 0) library[idx] = item;
        else library.unshift(item);
      }
      localStorage.setItem('seret-library', JSON.stringify(library));
      renderLibrary();
    })
    .subscribe();
  realtimeChannels.push(libCh);

  // Incoming recommendations
  const recoCh = sb.channel('rt-recos-' + currentUser.id)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'recommendations',
      filter: `to_user_id=eq.${currentUser.id}`,
    }, (payload) => {
      const r = payload.new;
      showToast(`📩 ${r.title}`);
      loadIncomingRecos();
    })
    .subscribe();
  realtimeChannels.push(recoCh);

  // Friendships changes
  const friendCh = sb.channel('rt-friends-' + currentUser.id)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'friendships',
    }, (payload) => {
      const row = payload.new || payload.old;
      if (row.user_id === currentUser.id || row.friend_id === currentUser.id) {
        loadFriends();
      }
    })
    .subscribe();
  realtimeChannels.push(friendCh);

  // Stats (points/streak/badges) changes
  const statsCh = sb.channel('rt-stats-' + currentUser.id)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'user_stats',
      filter: `user_id=eq.${currentUser.id}`,
    }, (payload) => {
      userStats = payload.new;
      renderStatsPill();
    })
    .subscribe();
  realtimeChannels.push(statsCh);
}

function updateAuthUI() {
  const btn = document.getElementById('authBtn');
  if (currentUser) {
    const name = userProfile?.display_name || currentUser.email?.split('@')[0] || '';
    btn.classList.add('logged-in');
    btn.innerHTML = `<span>${esc(name)}</span>`;
  } else {
    btn.classList.remove('logged-in');
    btn.innerHTML = `<span>${t('sign_in')}</span>`;
  }
}

async function loadProfile() {
  if (!sb || !currentUser) return;
  const { data } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
  userProfile = data;
}

async function loadSubProfiles() {
  if (!sb || !currentUser) return;
  const { data } = await sb.from('user_profiles').select('*').eq('account_id', currentUser.id).order('created_at');
  userProfiles = data || [];
  // Seamless access: always restore last-used profile so user goes straight to dashboard
  const lastId = sessionStorage.getItem('seret-session-profile') || localStorage.getItem('seret-active-profile');
  if (lastId) {
    activeProfile = userProfiles.find(p => String(p.id) === lastId) || null;
  }
  // Fallback: if only one profile exists, auto-select it
  if (!activeProfile && userProfiles.length === 1) activeProfile = userProfiles[0];
  if (activeProfile) {
    localStorage.setItem('seret-active-profile', String(activeProfile.id));
    sessionStorage.setItem('seret-session-profile', String(activeProfile.id));
    showProfilePill();
  }
}

function isImageAvatar(a) { return a && (a.startsWith('data:') || a.startsWith('http')); }
function avatarHTML(a) {
  if (!a) return '🧘';
  if (isImageAvatar(a)) return `<img src="${a}" alt="">`;
  return a;
}

function showProfilePill() {
  if (!activeProfile) { document.getElementById('profilePill').style.display = 'none'; return; }
  document.getElementById('profilePill').style.display = 'flex';
  const emoji = document.getElementById('profilePillEmoji');
  emoji.innerHTML = avatarHTML(activeProfile.avatar);
  document.getElementById('profilePillName').textContent = activeProfile.name;
}

// ===== Auth =====
let authMode = 'login';
function handleAuthClick() { currentUser ? openProfilePicker() : openAuthModal(); }
function openAuthModal() { document.getElementById('authModal').classList.add('active'); }
function closeAuthModal() { document.getElementById('authModal').classList.remove('active'); }
function showUserMenu() {
  if (confirm(currentLang === 'fr' ? 'Se deconnecter ?' : 'Sign out?')) signOut();
}
function toggleAuthMode() {
  authMode = authMode === 'login' ? 'signup' : 'login';
  document.getElementById('authError').textContent = '';
  const isSignup = authMode === 'signup';
  document.getElementById('authModalTitle').textContent = isSignup ? t('create_account_title') : t('sign_in_title');
  document.getElementById('authSubmitText').textContent = isSignup ? t('create_account') : t('sign_in');
  document.getElementById('authSwitchText').textContent = isSignup ? t('has_account') : t('no_account');
  document.getElementById('authSwitchLink').textContent = isSignup ? t('sign_in') : t('create_account');
}
async function submitAuth() {
  if (!sb) return showToast('Supabase not configured');
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errorEl = document.getElementById('authError');
  errorEl.textContent = '';
  if (!email || !password) return (errorEl.textContent = t('fill_fields'));
  if (password.length < 6) return (errorEl.textContent = t('password_min'));
  const btn = document.getElementById('authSubmitBtn');
  btn.disabled = true;
  const result = authMode === 'signup'
    ? await sb.auth.signUp({ email, password })
    : await sb.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  if (result.error) { errorEl.textContent = result.error.message; return; }
  closeAuthModal();
  document.getElementById('authEmail').value = '';
  document.getElementById('authPassword').value = '';
  showToast(authMode === 'signup' ? t('account_created') : t('signed_in'));
}
function signOut() {
  try {
    // Keep 'seret-active-profile' so we highlight last-used on next login
    localStorage.removeItem('seret-library');
    Object.keys(localStorage).forEach(k => { if (k.startsWith('sb-')) localStorage.removeItem(k); });
    sessionStorage.removeItem('seret-session-profile');
  } catch (e) { console.error(e); }
  if (sb) { try { sb.auth.signOut(); } catch (e) { console.error(e); } }
  setTimeout(() => location.reload(), 50);
}

// ===== Onboarding =====
const AVATAR_EMOJIS = ['🧘', '💞', '👨‍👩‍👧', '🧒', '🎭', '🎬', '🍿', '🌟', '🦁', '🐺', '🦊', '🐧'];

function openOnboarding() {
  document.getElementById('onboarding').classList.add('active');
  renderOnboardingWelcome();
}
function closeOnboarding() { document.getElementById('onboarding').classList.remove('active'); }

function renderOnboardingWelcome() {
  document.getElementById('onboardingInner').innerHTML = `
    <div class="logo" style="justify-content:center;margin-bottom:40px"><span class="logo-icon" style="width:64px;height:64px;font-size:36px">S</span></div>
    <h1 class="onboarding-title">${t('welcome_title')}</h1>
    <p class="onboarding-sub">${t('welcome_sub')}</p>
    <button class="btn btn-primary btn-lg" onclick="renderOnboardingProfile()">${t('continue')}</button>
  `;
}

function renderOnboardingProfile(editProfile = null) {
  const inner = document.getElementById('onboardingInner');
  const isEditing = !!editProfile;
  const initialKind = editProfile?.kind || 'solo';
  const initialName = editProfile?.name || t('kind_' + initialKind);
  const initialAvatar = editProfile?.avatar || AVATAR_EMOJIS[0];
  const initialIsImage = isImageAvatar(initialAvatar);

  inner.innerHTML = `
    <h1 class="onboarding-title">${isEditing ? t('edit_profile') : t('create_profile')}</h1>
    <p class="onboarding-sub">${t('create_profile_sub')}</p>
    <div class="profile-form">
      <div class="avatar-upload-wrap">
        <div class="avatar-preview ${initialIsImage ? 'has-image' : ''}" id="avatarPreview">${initialIsImage ? `<img src="${initialAvatar}">` : initialAvatar}</div>
        <input type="file" id="avatarFileInput" accept="image/*" style="display:none" onchange="handleAvatarUpload(event)">
        <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('avatarFileInput').click()">📷 ${t('upload_photo')}</button>
      </div>
      <div class="avatar-or">${t('or_choose')}</div>
      <div class="emoji-picker" id="emojiPicker">
        ${AVATAR_EMOJIS.map(e => `<button type="button" class="emoji-option ${!initialIsImage && e === initialAvatar ? 'selected' : ''}" onclick="selectEmoji('${e}', this)">${e}</button>`).join('')}
      </div>
      <input type="text" id="newProfileName" placeholder="${t('profile_name')}" value="${esc(initialName)}">
      <div class="kind-presets">
        ${[
          { k: 'solo', e: '🧘' },
          { k: 'couple', e: '💞' },
          { k: 'family', e: '👨‍👩‍👧' },
          { k: 'kid', e: '🧒' },
        ].map(({ k, e }) => `<button type="button" class="kind-btn ${initialKind === k ? 'selected' : ''}" data-kind="${k}" onclick="selectKind('${k}', this)">${e} ${t('kind_' + k)}</button>`).join('')}
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-glass btn-lg" style="flex:1;justify-content:center" onclick="backFromProfileForm()">${t('back')}</button>
        <button class="btn btn-primary btn-lg" style="flex:2;justify-content:center" id="profileContinueBtn" onclick="${isEditing ? `saveEditedProfile(${editProfile.id})` : 'createProfileAndCalibrate()'}">${isEditing ? t('save') : t('continue')}</button>
      </div>
    </div>
  `;
  window._selectedEmoji = initialIsImage ? null : initialAvatar;
  window._customAvatar = initialIsImage ? initialAvatar : null;
  window._selectedKind = initialKind;
}

function selectKind(k, btn) {
  window._selectedKind = k;
  document.querySelectorAll('.kind-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  // Auto-fill name if empty
  const nameInput = document.getElementById('newProfileName');
  if (nameInput && !nameInput.value.trim()) nameInput.value = t('kind_' + k);
}

function backFromProfileForm() {
  if (userProfiles.length > 0) openProfilePicker();
  else renderOnboardingWelcome();
}
function selectEmoji(e, btn) {
  document.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window._selectedEmoji = e;
  window._customAvatar = null;
  document.getElementById('avatarPreview').innerHTML = e;
  document.getElementById('avatarPreview').classList.remove('has-image');
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    // Resize image to keep it small (200x200 max)
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 220;
      const scale = Math.min(max / img.width, max / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      window._customAvatar = dataUrl;
      const preview = document.getElementById('avatarPreview');
      preview.innerHTML = `<img src="${dataUrl}">`;
      preview.classList.add('has-image');
      document.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function createProfileAndCalibrate() {
  console.log('[createProfile] clicked');
  const btn = document.getElementById('profileContinueBtn');
  const nameEl = document.getElementById('newProfileName');
  const name = (nameEl?.value || '').trim();
  console.log('[createProfile] name:', name, 'kind:', window._selectedKind, 'sb:', !!sb, 'user:', !!currentUser);
  if (!name) {
    showToast(t('fill_fields'));
    if (nameEl) { nameEl.focus(); nameEl.style.borderColor = 'var(--danger)'; }
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  const kind = window._selectedKind || 'solo';
  const avatar = window._customAvatar || window._selectedEmoji || '🧘';
  if (!sb || !currentUser) { showToast('Not signed in'); return; }
  const { data, error } = await sb.from('user_profiles').insert({
    account_id: currentUser.id, name, avatar, kind,
  }).select().single();
  if (error) {
    console.error('[createProfile] error:', error);
    showToast('Error: ' + error.message);
    if (btn) { btn.disabled = false; btn.textContent = t('continue'); }
    return;
  }
  if (data) {
    userProfiles.push(data);
    activeProfile = data;
    localStorage.setItem('seret-active-profile', String(data.id));
    sessionStorage.setItem('seret-session-profile', String(data.id));
    showProfilePill();
  }
  // For first profile ever: do calibration. Otherwise skip straight to picker.
  if (userProfiles.length === 1) {
    renderCalibration();
  } else {
    closeOnboarding();
    await loadLibraryForProfile();
    loadTrending();
    showToast(`${isImageAvatar(data.avatar) ? '' : data.avatar} ${data.name}`);
  }
}

async function saveEditedProfile(id) {
  const btn = document.getElementById('profileContinueBtn');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  const name = (document.getElementById('newProfileName').value || '').trim();
  if (!name) { showToast(t('fill_fields')); if (btn) { btn.disabled = false; btn.textContent = t('save'); } return; }
  const kind = window._selectedKind || 'solo';
  const avatar = window._customAvatar || window._selectedEmoji || '🧘';
  if (!sb || !currentUser) return;
  const { error } = await sb.from('user_profiles').update({ name, avatar, kind }).eq('id', id);
  if (error) { showToast('Error: ' + error.message); if (btn) { btn.disabled = false; btn.textContent = t('save'); } return; }
  const p = userProfiles.find(x => x.id === id);
  if (p) { p.name = name; p.avatar = avatar; p.kind = kind; }
  if (activeProfile?.id === id) { activeProfile = p; showProfilePill(); }
  openProfilePicker();
}

// ===== Calibration swipe =====
let swipeItems = [];
let swipeIdx = 0;
async function renderCalibration() {
  const inner = document.getElementById('onboardingInner');
  inner.innerHTML = `
    <h1 class="onboarding-title">${t('calibrate_title')}</h1>
    <p class="onboarding-sub">${t('calibrate_sub')}</p>
    <div class="recs-loading" style="justify-content:center"><div class="spinner"></div></div>
  `;
  try {
    const res = await fetch(`/api/calibration-set?lang=${currentLang === 'fr' ? 'fr-FR' : 'en-US'}`);
    const data = await res.json();
    if (data.error || !data.results || data.results.length === 0) {
      inner.innerHTML = `
        <h1 class="onboarding-title">${t('calibrate_done')}</h1>
        <p class="onboarding-sub">${data.error || 'No calibration available'}</p>
        <button class="btn btn-gold btn-lg" onclick="closeOnboarding();loadTrending();">${t('done')}</button>
      `;
      return;
    }
    swipeItems = data.results;
    swipeIdx = 0;
    inner.innerHTML = `
      <button class="btn btn-outline btn-sm" style="position:absolute;top:24px;right:24px" onclick="closeOnboarding();loadTrending();">${t('skip')} →</button>
      <h1 class="onboarding-title">${t('calibrate_title')}</h1>
      <p class="onboarding-sub">${t('calibrate_sub')}</p>
      <div class="swipe-progress" id="swipeProgress">1 / ${swipeItems.length}</div>
      <div class="swipe-stack" id="swipeStack"></div>
      <div class="swipe-actions">
        <button class="swipe-btn nope" onclick="swipeDecide(false)">✕</button>
        <button class="swipe-btn like" onclick="swipeDecide(true)">♥</button>
      </div>
    `;
    renderSwipeCard();
  } catch (e) {
    console.error('Calibration error:', e);
    inner.innerHTML = `
      <h1 class="onboarding-title">${t('calibrate_done')}</h1>
      <button class="btn btn-gold btn-lg" onclick="closeOnboarding();loadTrending();">${t('done')}</button>
    `;
  }
}

function renderSwipeCard() {
  const stack = document.getElementById('swipeStack');
  if (!stack) return;
  if (swipeIdx >= swipeItems.length) {
    finishCalibration();
    return;
  }
  const item = swipeItems[swipeIdx];
  stack.innerHTML = `
    <div class="swipe-card">
      <div class="swipe-hint like">LIKE</div>
      <div class="swipe-hint nope">NOPE</div>
      <img src="${item.poster}" alt="${esc(item.title)}">
      <div class="swipe-card-info">
        <div class="swipe-card-title">${esc(item.title)}</div>
        <div class="swipe-card-year">${item.year}</div>
      </div>
    </div>
  `;
  document.getElementById('swipeProgress').textContent = `${swipeIdx + 1} / ${swipeItems.length}`;
}

async function swipeDecide(liked) {
  if (swipeIdx >= swipeItems.length) return;
  const item = swipeItems[swipeIdx];
  const card = document.querySelector('.swipe-card');
  if (card) {
    card.style.transform = liked ? 'translateX(120%) rotate(20deg)' : 'translateX(-120%) rotate(-20deg)';
    card.style.opacity = '0';
  }
  calibrationData.push({ tmdb_id: item.id, media_type: item.type, liked, title: item.title });
  if (sb && currentUser && activeProfile) {
    sb.from('calibration').upsert({
      user_id: currentUser.id, profile_id: activeProfile.id,
      tmdb_id: item.id, media_type: item.type, liked,
    }).then();
  }
  swipeIdx++;
  setTimeout(renderSwipeCard, 300);
}

function finishCalibration() {
  const inner = document.getElementById('onboardingInner');
  inner.innerHTML = `
    <div style="font-size:60px;margin-bottom:20px">✨</div>
    <h1 class="onboarding-title">${t('calibrate_done')}</h1>
    <p class="onboarding-sub"></p>
    <button class="btn btn-gold btn-lg" onclick="closeOnboarding();loadTrending();">${t('done')}</button>
  `;
}

// ===== Profile picker =====
function openProfilePicker() {
  const overlay = document.getElementById('onboarding');
  overlay.classList.add('active');
  const inner = document.getElementById('onboardingInner');
  const lastUsedId = localStorage.getItem('seret-active-profile');
  const langOther = currentLang === 'en' ? 'FR' : 'EN';
  inner.innerHTML = `
    <h1 class="onboarding-title">${t('select_profile')}</h1>
    <p class="onboarding-sub" style="margin-bottom:32px">${userProfile?.display_name || ''}</p>
    ${currentUser ? `
      <div class="picker-stats">
        <div class="picker-stat"><span>🔥</span> ${userStats.streak_days || 0}</div>
        <div class="picker-stat"><span>⭐</span> ${userStats.points || 0}</div>
        <div class="picker-stat"><span>🏅</span> ${(userStats.badges || []).length}</div>
      </div>` : ''}
    <div class="profiles-grid">
      ${userProfiles.map(p => {
        const isActive = activeProfile?.id === p.id;
        const isLastUsed = !activeProfile && String(p.id) === lastUsedId;
        const highlight = isActive || isLastUsed;
        return `
        <div class="profile-tile ${highlight ? 'active' : ''}">
          <div style="width:100%;cursor:pointer" onclick="selectSubProfile(${p.id})">
            <div class="profile-tile-emoji ${isImageAvatar(p.avatar) ? 'has-image' : ''}">${avatarHTML(p.avatar)}</div>
            <div class="profile-tile-name">${esc(p.name)}</div>
          </div>
          <div class="profile-tile-actions">
            <button class="profile-tile-edit" onclick="event.stopPropagation();editSubProfile(${p.id})" title="Edit">✎</button>
            ${userProfiles.length > 1 ? `<button class="profile-tile-delete" onclick="event.stopPropagation();deleteSubProfile(${p.id})" title="Delete">×</button>` : ''}
          </div>
        </div>`;
      }).join('')}
      ${userProfiles.length < 5 ? `
        <div class="profile-tile add" onclick="renderOnboardingProfile(null)">
          <div class="profile-tile-emoji">+</div>
          <div class="profile-tile-name">${t('add_profile')}</div>
        </div>` : ''}
    </div>
    <div class="picker-actions">
      ${activeProfile ? `<button class="btn btn-glass btn-sm" onclick="closeOnboarding()">${t('back')}</button>` : ''}
      <button class="btn btn-outline btn-sm" onclick="toggleLang()">${langOther}</button>
      <button class="btn btn-outline btn-sm" onclick="showStatsMenu();closeOnboarding()">🏆 ${t('your_stats')}</button>
      <button class="btn btn-outline btn-sm" onclick="confirmSignOut()">${t('sign_out')}</button>
    </div>
  `;
}

function confirmSignOut() {
  signOut();
}

async function deleteSubProfile(id) {
  if (!sb || !currentUser) return;
  if (!confirm(currentLang === 'fr' ? 'Supprimer ce profil et toute sa bibliotheque ?' : 'Delete this profile and all its library?')) return;
  await sb.from('user_profiles').delete().eq('id', id);
  userProfiles = userProfiles.filter(p => p.id !== id);
  if (activeProfile?.id === id) {
    activeProfile = null;
    localStorage.removeItem('seret-active-profile');
    sessionStorage.removeItem('seret-session-profile');
  }
  openProfilePicker();
}

function editSubProfile(id) {
  const p = userProfiles.find(x => x.id === id);
  if (!p) return;
  renderOnboardingProfile(p);
}

async function selectSubProfile(id) {
  activeProfile = userProfiles.find(p => p.id === id);
  if (!activeProfile) return;
  // Cancel any pending sync that could write with the previous profile
  clearTimeout(syncDebounce);
  localStorage.setItem('seret-active-profile', String(id));
  sessionStorage.setItem('seret-session-profile', String(id));
  showProfilePill();
  closeOnboarding();
  library = [];
  document.getElementById('libraryGrid').innerHTML = '';
  await loadLibraryForProfile();
  checkDailyStreak();
  checkNewSeasons();
  loadIncomingRecos();
  loadTrending();
  processPendingAdd();
  const emoji = isImageAvatar(activeProfile.avatar) ? '👤' : activeProfile.avatar;
  showToast(`${emoji} ${activeProfile.name}`);
}

// ===== Library =====
function loadLocalLibrary() {
  library = JSON.parse(localStorage.getItem('seret-library') || '[]');
  renderLibrary();
}
async function loadLibraryForProfile() {
  if (!sb || !currentUser || !activeProfile) return;
  const { data, error } = await sb.from('library_items').select('*')
    .eq('user_id', currentUser.id).eq('profile_id', activeProfile.id)
    .order('added_at', { ascending: false });
  if (error) { console.error('[load] error:', error); return; }
  library = (data || []).map(row => ({
    id: row.tmdb_id, type: row.media_type, title: row.title, year: row.year,
    poster: row.poster, backdrop: row.backdrop, overview: row.overview, rating: row.rating,
    userRating: row.user_rating, status: row.status || 'watched',
    viewing_context: row.viewing_context, priority: row.priority, comment: row.comment,
    not_interested: row.not_interested, addedAt: new Date(row.added_at).getTime(),
  }));
  renderLibrary();
}

let syncDebounce = null; // legacy placeholder (profile switch still clears it)

function saveLibrary() {
  localStorage.setItem('seret-library', JSON.stringify(library));
}

function itemToRow(item) {
  return {
    user_id: currentUser.id,
    profile_id: activeProfile.id,
    tmdb_id: item.id,
    media_type: item.type,
    title: item.title || '',
    year: item.year || '',
    poster: item.poster || '',
    backdrop: item.backdrop || '',
    overview: item.overview || '',
    rating: item.rating || 0,
    user_rating: item.userRating || 0,
    status: item.status || 'watched',
    viewing_context: item.viewing_context || null,
    priority: item.priority || 0,
    comment: item.comment || null,
    not_interested: item.not_interested === true ? true : false,
  };
}

async function syncItemToSupabase(item) {
  if (!sb || !currentUser || !activeProfile) return;
  const { error } = await sb.from('library_items').upsert(itemToRow(item), {
    onConflict: 'user_id,profile_id,tmdb_id,media_type',
  });
  if (error) console.error('[sync-item] error:', error);
}

function addToLibrary(item) {
  const idx = library.findIndex(l => l.id === item.id && l.type === item.type);
  if (idx >= 0 && !library[idx].not_interested) return false;
  if (idx >= 0) library.splice(idx, 1);
  const newItem = {
    ...item, userRating: item.userRating || 0,
    addedAt: Date.now(), status: item.status || 'watched',
    viewing_context: item.viewing_context || null,
  };
  library.push(newItem);
  saveLibrary();
  // Immediate sync to Supabase so refresh doesn't lose it
  syncItemToSupabase(newItem);
  return true;
}

async function removeFromLibrary(id, type) {
  library = library.filter(l => !(l.id === id && l.type === type));
  localStorage.setItem('seret-library', JSON.stringify(library));
  if (sb && currentUser && activeProfile) {
    const { error } = await sb.from('library_items').delete()
      .eq('user_id', currentUser.id).eq('profile_id', activeProfile.id)
      .eq('tmdb_id', id).eq('media_type', type);
    if (error) console.error('[remove] error:', error);
  }
  logEvent('removed', id, type);
  renderLibrary();
}

function rateItem(id, type, rating) {
  const item = library.find(l => l.id === id && l.type === type);
  if (!item) return;
  const old = item.userRating || 0;
  item.userRating = rating;
  saveLibrary();
  syncItemToSupabase(item); // immediate sync
  logEvent('rated', id, type, { rating });
  if (old < 9 && rating >= 9) {
    awardPoints(20);
    showWhatsAppSharePrompt(item);
  }
  renderLibrary();
}

function openAddModal(item) {
  pendingAddItem = item;
  if (item.status === 'to_watch') { doAddItem(); }
  else { document.getElementById('contextModal').classList.add('active'); }
}
function closeContextModal() { document.getElementById('contextModal').classList.remove('active'); }
function saveWithContext(ctx) {
  if (pendingAddItem) { pendingAddItem.viewing_context = ctx; doAddItem(); }
  closeContextModal();
}
function doAddItem() {
  if (!pendingAddItem) return;
  if (addToLibrary(pendingAddItem)) {
    awardPoints(10);
    logEvent('added', pendingAddItem.id, pendingAddItem.type, { status: pendingAddItem.status });
    showToast(t('added'));
  } else {
    showToast(t('already_in'));
  }
  pendingAddItem = null;
}

function selectLibrarySection(s, btn) {
  currentLibSection = s;
  document.querySelectorAll('.lib-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLibrary();
}
function filterLibrary(type, btn) {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLibrary();
}

function renderLibrary() {
  let items = library.filter(l => !l.not_interested);
  items = items.filter(l => (l.status || 'watched') === currentLibSection);
  if (currentFilter !== 'all') items = items.filter(l => l.type === currentFilter);
  if (currentLibSection === 'to_watch') items.sort((a, b) => (b.priority || 0) - (a.priority || 0) || b.addedAt - a.addedAt);
  const grid = document.getElementById('libraryGrid');
  const empty = document.getElementById('emptyLibrary');
  if (items.length === 0) { grid.innerHTML = ''; empty.style.display = 'flex'; }
  else { empty.style.display = 'none'; grid.innerHTML = items.map(r => cardHTML(r, true)).join(''); }
}

// ===== Cards =====
function cardHTML(r, isLibrary = false, readonly = false, friendId = null) {
  const tmdbId = r.tmdb_id || r.id;
  const type = r.media_type || r.type;
  return `
    <div class="card">
      <div class="card-poster" onclick="openDetail('${type}', ${tmdbId})">
        ${r.poster ? `<img src="${r.poster}" alt="" loading="lazy">` : ''}
        <div class="rating-badge">★ ${r.rating != null ? Number(r.rating).toFixed(1) : '—'}</div>
        ${r.viewing_context ? `<div class="ctx-badge">${ctxEmoji(r.viewing_context)}</div>` : ''}
        ${isLibrary && !readonly ? `
          <div class="card-library-actions" onclick="event.stopPropagation()">
            <button class="btn btn-xs btn-gold" onclick="manualShare(${tmdbId}, '${type}', ${JSON.stringify(esc(r.title))})">💬 WhatsApp</button>
            <button class="btn btn-xs btn-danger" onclick="removeFromLibrary(${tmdbId}, '${type}')">${t('removed')}</button>
          </div>` : ''}
      </div>
      <div class="card-title">${esc(r.title)}</div>
      <div class="card-year">${r.year || ''}</div>
      ${isLibrary && (r.status || 'watched') !== 'to_watch' ? renderStars(r, readonly) : ''}
      ${friendId ? renderReactions(friendId, tmdbId, type) : ''}
    </div>`;
}
function ctxEmoji(c) { return { solo: '🧘', couple: '💞', family: '👨‍👩‍👧', friends: '🎉' }[c] || ''; }
function renderStars(item, readonly = false) {
  const r = item.user_rating ?? item.userRating ?? 0;
  const id = item.tmdb_id || item.id;
  const type = item.media_type || item.type;
  let h = '<div class="user-rating" onclick="event.stopPropagation()">';
  for (let i = 1; i <= 10; i++) {
    h += readonly
      ? `<span class="star ${i <= r ? 'filled' : ''}">★</span>`
      : `<span class="star ${i <= r ? 'filled' : ''}" onclick="rateItem(${id}, '${type}', ${i})">★</span>`;
  }
  return h + '</div>';
}
function renderReactions(friendId, id, type) {
  return `<div class="reactions" onclick="event.stopPropagation()">
    ${['🔥', '❤️', '😱', '😂'].map(e => `<button class="reaction-btn" onclick="toggleReaction('${friendId}', ${id}, '${type}', '${e}', this)">${e}</button>`).join('')}
  </div>`;
}

// ===== Home trending =====
function selectCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadTrending();
}
async function loadTrending() {
  const lang = currentLang === 'fr' ? 'fr-FR' : 'en-US';
  try {
    const res = await fetch(`/api/trending?lang=${lang}&category=${currentCategory}`);
    const data = await res.json();
    if (data.error) return console.warn(data.error);
    const items = data.results || [];
    if (items.length > 0 && currentCategory === 'all') {
      heroItem = items[0];
      const hero = document.getElementById('heroSection');
      hero.style.backgroundImage = `url(${heroItem.backdrop || heroItem.poster || ''})`;
      document.getElementById('heroTitle').textContent = heroItem.title;
      document.getElementById('heroMeta').innerHTML = `${heroItem.year} &middot; <span class="star">★</span> ${heroItem.rating?.toFixed(1) || '—'}`;
      document.getElementById('heroDesc').textContent = heroItem.overview || '';
    }
    document.getElementById('trendingGrid').innerHTML = items.map(r => trendingCardHTML(r)).filter(Boolean).join('');
  } catch (e) { console.error(e); }
}
function trendingCardHTML(r) {
  const key = `${r.id}_${r.type}`;
  const skipped = getNotInterested().includes(key);
  // Also check library_items flag
  const inLibSkipped = library.some(l => l.id === r.id && l.type === r.type && l.not_interested);
  if (skipped || inLibSkipped) return '';
  return `
    <div class="card trending-card">
      <div class="card-poster" onclick="openDetail('${r.type}', ${r.id})">
        ${r.poster ? `<img src="${r.poster}" loading="lazy">` : ''}
        <div class="rating-badge">★ ${r.rating?.toFixed(1) || '—'}</div>
      </div>
      <div class="card-title">${esc(r.title)}</div>
      <div class="card-year">${r.year || ''}</div>
      <div class="card-quick-actions">
        <button class="quick-btn watchlist" onclick="quickAdd(${r.id}, '${r.type}', 'to_watch', this)">+ ${t('to_watch')}</button>
        <button class="quick-btn skip" onclick="markNotInterested(${r.id}, '${r.type}', this)">✕</button>
      </div>
    </div>`;
}
async function quickAdd(id, type, status, btn) {
  try {
    const res = await fetch(`/api/details/${type}/${id}?lang=${currentLang === 'fr' ? 'fr-FR' : 'en-US'}`);
    const d = await res.json();
    const item = {
      id, type,
      title: d.title || d.name,
      year: (d.release_date || d.first_air_date || '').slice(0, 4),
      poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : '',
      backdrop: d.backdrop_path ? `https://image.tmdb.org/t/p/original${d.backdrop_path}` : '',
      overview: d.overview, rating: d.vote_average, status,
    };
    if (addToLibrary(item)) {
      awardPoints(10); logEvent('added', id, type, { status });
      showToast(t('added'));
      if (btn) btn.closest('.trending-card').style.opacity = '0.4';
    } else showToast(t('already_in'));
  } catch (e) { console.error(e); }
}
function notInterestedKey() {
  return `seret-not-interested-${currentUser?.id || 'local'}-${activeProfile?.id || 'none'}`;
}
function getNotInterested() {
  // Prefer in-memory library flags (from Supabase) for connected users
  const fromLib = library.filter(l => l.not_interested).map(l => `${l.id}_${l.type}`);
  try {
    const fromLocal = JSON.parse(localStorage.getItem(notInterestedKey()) || '[]');
    return [...new Set([...fromLib, ...fromLocal])];
  } catch { return fromLib; }
}
async function markNotInterested(id, type, btn) {
  // Local cache
  const skipped = JSON.parse(localStorage.getItem(notInterestedKey()) || '[]');
  const key = `${id}_${type}`;
  if (!skipped.includes(key)) {
    skipped.push(key);
    localStorage.setItem(notInterestedKey(), JSON.stringify(skipped));
  }
  // Persist to Supabase so it sticks across devices
  if (sb && currentUser && activeProfile) {
    const existing = library.find(l => l.id === id && l.type === type);
    if (existing) {
      existing.not_interested = true;
      await sb.from('library_items').update({ not_interested: true })
        .eq('user_id', currentUser.id).eq('profile_id', activeProfile.id)
        .eq('tmdb_id', id).eq('media_type', type);
    } else {
      library.push({ id, type, title: '', not_interested: true, addedAt: Date.now() });
      await sb.from('library_items').insert({
        user_id: currentUser.id, profile_id: activeProfile.id,
        tmdb_id: id, media_type: type, title: '',
        status: 'watched', not_interested: true,
      });
    }
  }
  logEvent('skipped', id, type);
  if (btn) btn.closest('.trending-card').style.display = 'none';
}

function addHeroToLibrary(status) {
  if (!heroItem) return;
  const item = { ...heroItem, status };
  if (status === 'watched') openAddModal(item);
  else { pendingAddItem = item; doAddItem(); }
}
function openHeroDetail() { if (heroItem) openDetail(heroItem.type, heroItem.id); }

// ===== Search =====
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  if (q.length < 2) { searchResults.classList.remove('active'); return; }
  searchTimeout = setTimeout(() => doSearch(q), 300);
});
searchInput.addEventListener('focus', () => { if (searchResults.innerHTML) searchResults.classList.add('active'); });
document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrapper')) searchResults.classList.remove('active'); });
async function doSearch(q) {
  const lang = currentLang === 'fr' ? 'fr-FR' : 'en-US';
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&lang=${lang}`);
  const data = await res.json();
  if (!data.results?.length) {
    searchResults.innerHTML = `<div class="search-item"><span style="color:var(--text-dim)">${currentLang === 'fr' ? 'Aucun resultat' : 'No results'}</span></div>`;
  } else {
    searchResults.innerHTML = data.results.slice(0, 8).map(r => `
      <div class="search-item" onclick="openDetail('${r.type}', ${r.id})">
        ${r.poster ? `<img src="${r.poster}" loading="lazy">` : `<div class="no-poster">🎬</div>`}
        <div class="search-item-info">
          <div class="search-item-title">${esc(r.title)}</div>
          <div class="search-item-meta">${r.year} · ★ ${r.rating?.toFixed(1) || '—'}</div>
        </div>
        <span class="badge">${r.type === 'movie' ? 'Film' : 'TV'}</span>
      </div>`).join('');
  }
  searchResults.classList.add('active');
}

// ===== Detail Modal =====
async function openDetail(type, id) {
  searchResults.classList.remove('active');
  const lang = currentLang === 'fr' ? 'fr-FR' : 'en-US';
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('modalBody');
  body.innerHTML = '<div class="recs-loading"><div class="spinner"></div></div>';
  modal.classList.add('active');
  try {
    const res = await fetch(`/api/details/${type}/${id}?lang=${lang}`);
    const d = await res.json();
    const title = d.title || d.name;
    const year = (d.release_date || d.first_air_date || '').slice(0, 4);
    const backdrop = d.backdrop_path ? `https://image.tmdb.org/t/p/original${d.backdrop_path}` : null;
    const rating = d.vote_average;
    const genres = (d.genres || []).map(g => g.name);
    const overview = d.overview;
    const cast = (d.credits?.cast || []).slice(0, 10);
    const similar = (d.similar?.results || []).slice(0, 6);
    const wp = d['watch/providers']?.results?.FR || d['watch/providers']?.results?.US || {};
    const providers = (wp.flatrate || []).slice(0, 4);
    const videos = d.videos?.results || [];
    const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');
    const existing = library.find(l => l.id === d.id && l.type === type);
    const itemForLib = { id: d.id, type, title, year,
      poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
      backdrop, overview, rating };

    body.innerHTML = `
      <button class="modal-back-btn" onclick="closeModal()" aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      ${backdrop ? `<img class="modal-backdrop" src="${backdrop}" alt="">` : ''}
      <div class="modal-info">
        <div class="modal-title">${esc(title)}</div>
        <div class="modal-meta">
          <span>${year}</span>
          ${d.runtime ? `<span>${d.runtime} min</span>` : ''}
          ${d.number_of_seasons ? `<span>${d.number_of_seasons} ${currentLang === 'fr' ? 'saisons' : 'seasons'}</span>` : ''}
          ${d.origin_country?.length ? `<span>${d.origin_country.join(', ')}</span>` : ''}
          <span><span class="star">★</span> ${rating?.toFixed(1) || '—'}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
          ${genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
        </div>
        ${providers.length ? `<div class="modal-providers"><span class="providers-label">${t('available_on')}</span>${providers.map(p => `<img src="https://image.tmdb.org/t/p/w92${p.logo_path}" alt="${esc(p.provider_name)}" title="${esc(p.provider_name)}">`).join('')}</div>` : ''}
        ${overview ? `<div class="modal-overview">${esc(overview)}</div>` : ''}
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="handleModalAdd('watched')">✓ ${t('seen')}</button>
          <button class="btn btn-glass" onclick="handleModalAdd('to_watch')">+ ${t('to_watch')}</button>
          ${trailer ? `<button class="btn btn-outline" onclick="toggleTrailer('${trailer.key}')">▶ ${t('watch_trailer')}</button>` : ''}
          <button class="btn btn-outline" onclick="manualShare(${d.id}, '${type}', ${JSON.stringify(esc(title))})">💬 WhatsApp</button>
          ${currentUser ? `<button class="btn btn-outline" onclick="openRecoModal(${d.id}, '${type}', ${JSON.stringify(esc(title))}, '${itemForLib.poster || ''}')">↗ ${t('recommend_friend')}</button>` : ''}
          <button class="btn btn-outline" onclick="loadCulturalContext(${JSON.stringify(esc(title))}, '${year}')">${t('cultural_btn')}</button>
        </div>
        <div id="trailerSlot"></div>
        <div id="culturalSlot"></div>
        ${currentUser && existing ? `
          <div class="journal-box">
            <div class="journal-label">${t('journal_label')}</div>
            <textarea id="journalText" placeholder="${t('journal_ph')}">${esc(existing.comment || '')}</textarea>
            <button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="saveJournal(${d.id}, '${type}')">${t('save')}</button>
          </div>
        ` : ''}
        <div class="debate-box">
          <div class="ai-section-label">${t('debate_title')}</div>
          <textarea id="debateInput" placeholder="${t('debate_ph')}"></textarea>
          <button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="startDebate(${JSON.stringify(esc(title))})">${t('debate_btn')}</button>
          <div id="debateResponse"></div>
        </div>
        ${cast.length ? `<div class="modal-section-title">${t('cast')}</div><div class="cast-grid">${cast.map(c => `
          <div class="cast-item">
            <img src="${c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect fill=%22%23141414%22 width=%2264%22 height=%2264%22/><text x=%2232%22 y=%2238%22 text-anchor=%22middle%22 fill=%22%23555%22 font-size=%2224%22>?</text></svg>'}" alt="">
            <div class="cast-name">${esc(c.name)}</div>
            <div class="cast-char">${esc(c.character || '')}</div>
          </div>`).join('')}</div>` : ''}
        ${similar.length ? `<div class="modal-section-title">${t('similar')}</div><div class="carousel">${similar.map(s => {
          const sType = s.media_type || type;
          return `<div class="card" onclick="openDetail('${sType}', ${s.id})" style="width:150px">
            <div class="card-poster">${s.poster_path ? `<img src="https://image.tmdb.org/t/p/w300${s.poster_path}" loading="lazy">` : ''}</div>
            <div class="card-title" style="font-size:13px">${esc(s.title || s.name)}</div>
          </div>`;
        }).join('')}</div>` : ''}
      </div>`;
    window._modalItem = itemForLib;
  } catch (e) {
    body.innerHTML = `<div style="padding:48px;text-align:center;color:var(--danger)">Error loading details</div>`;
  }
}
function toggleTrailer(key) {
  const slot = document.getElementById('trailerSlot');
  if (!slot) return;
  if (slot.innerHTML) { slot.innerHTML = ''; return; }
  slot.innerHTML = `<div class="trailer-wrap"><iframe src="https://www.youtube.com/embed/${key}?autoplay=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div>`;
}
async function loadCulturalContext(title, year) {
  const slot = document.getElementById('culturalSlot');
  if (!slot) return;
  if (slot.innerHTML) { slot.innerHTML = ''; return; }
  slot.innerHTML = `<div class="cultural-context"><div class="recs-loading"><div class="spinner"></div></div></div>`;
  try {
    const res = await fetch('/api/context', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, year, lang: currentLang }),
    });
    const data = await res.json();
    slot.innerHTML = `<div class="cultural-context"><div class="ai-section-label">${t('cultural_title')}</div>${esc(data.text)}</div>`;
  } catch (e) { slot.innerHTML = ''; }
}
async function startDebate(title) {
  const opinion = document.getElementById('debateInput').value.trim();
  if (!opinion) return;
  const resEl = document.getElementById('debateResponse');
  resEl.innerHTML = `<div class="recs-loading"><div class="spinner"></div></div>`;
  try {
    const res = await fetch('/api/debate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, opinion, lang: currentLang }),
    });
    const data = await res.json();
    resEl.innerHTML = `<div class="debate-response">${esc(data.response)}</div>`;
    awardPoints(5);
  } catch (e) { resEl.innerHTML = ''; }
}
async function saveJournal(id, type) {
  const text = document.getElementById('journalText').value;
  const item = library.find(l => l.id === id && l.type === type);
  if (item) { item.comment = text; saveLibrary(); awardPoints(5); }
  if (sb && currentUser && activeProfile) {
    await sb.from('journal_entries').upsert({
      user_id: currentUser.id, profile_id: activeProfile.id,
      tmdb_id: id, media_type: type, entry: text,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,profile_id,tmdb_id,media_type' });
  }
  showToast(t('saved'));
}
function handleModalAdd(status) {
  if (!window._modalItem) return;
  const item = { ...window._modalItem, status };
  closeModal();
  if (status === 'watched') openAddModal(item);
  else { pendingAddItem = item; doAddItem(); }
}
function closeModal() { document.getElementById('detailModal').classList.remove('active'); }

// ===== Camera / Photo recognition =====
function openCameraModal() { document.getElementById('cameraModal').classList.add('active'); document.getElementById('cameraResult').innerHTML = ''; document.getElementById('cameraPreview').innerHTML = '<div style="color:var(--text-dim)">📷</div>'; }
function closeCameraModal() { document.getElementById('cameraModal').classList.remove('active'); }

function handlePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    document.getElementById('cameraPreview').innerHTML = `<img src="${base64}">`;
    document.getElementById('cameraResult').innerHTML = `<div class="recs-loading"><div class="spinner"></div> ${t('scanning')}</div>`;
    try {
      const res = await fetch('/api/recognize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, lang: currentLang }),
      });
      const data = await res.json();
      if (data.title && data.tmdb_id) {
        const existing = library.find(l => l.id === data.tmdb_id && l.type === data.type);
        document.getElementById('cameraResult').innerHTML = `
          <div class="camera-result">
            <div style="display:flex;gap:12px;align-items:center">
              ${data.poster ? `<img src="${data.poster}" style="width:80px;border-radius:8px">` : ''}
              <div style="flex:1">
                <div style="font-family:var(--serif);font-size:18px;font-weight:700">${esc(data.title)} (${data.year})</div>
                ${existing ? `<div style="color:var(--gold);font-size:13px;margin-top:4px">${t('already_in')}</div>` : ''}
              </div>
            </div>
            ${!existing ? `<div style="display:flex;gap:8px;margin-top:12px">
              <button class="btn btn-primary btn-sm" onclick='addScannedItem(${JSON.stringify(data)}, "watched")'>✓ ${t('seen')}</button>
              <button class="btn btn-glass btn-sm" onclick='addScannedItem(${JSON.stringify(data)}, "to_watch")'>+ ${t('to_watch')}</button>
            </div>` : ''}
          </div>`;
      } else {
        document.getElementById('cameraResult').innerHTML = `<div class="camera-result"><div style="color:var(--text-dim)">${t('scan_not_found')}</div></div>`;
      }
    } catch (e) {
      document.getElementById('cameraResult').innerHTML = `<div class="camera-result"><div style="color:var(--danger)">${e.message}</div></div>`;
    }
  };
  reader.readAsDataURL(file);
}

function addScannedItem(data, status) {
  const item = {
    id: data.tmdb_id, type: data.type,
    title: data.title, year: data.year,
    poster: data.poster, backdrop: data.backdrop,
    overview: data.overview, rating: data.rating, status,
  };
  closeCameraModal();
  if (status === 'watched') openAddModal(item);
  else { pendingAddItem = item; doAddItem(); }
}

// ===== Seret AI recommendations =====
function selectMood(m, btn) {
  if (currentMood === m) {
    currentMood = null;
    btn.classList.remove('active');
    return;
  }
  currentMood = m;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
function selectViewingContext(ctx, btn) {
  currentViewingContext = ctx;
  document.querySelectorAll('#recommendView .ctx-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function getRecommendations(surprise = false) {
  const content = document.getElementById('recsContent');
  content.innerHTML = `<div class="recs-loading"><div class="spinner"></div> ${t('loading_recs')}</div>`;
  const watched = library.filter(i => (i.status || 'watched') === 'watched');
  const watchlist = library.filter(i => i.status === 'to_watch');
  const skippedKeys = getNotInterested();
  const skipped = skippedKeys.map(k => { const [id, type] = k.split('_'); return { id: Number(id), type, title: '' }; });
  try {
    const res = await fetch('/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        library: watched, watchlist, skipped, calibration: calibrationData,
        lang: currentLang, viewingContext: currentViewingContext,
        mood: currentMood, surprise,
      }),
    });
    const data = await res.json();
    if (data.error) { content.textContent = data.error; return; }
    renderRecommendations(data);
  } catch (e) { content.textContent = 'Error: ' + e.message; }
}

function surpriseMe() { getRecommendations(true); }

function renderRecommendations(data) {
  const content = document.getElementById('recsContent');
  const recs = data.recommendations || [];
  content.innerHTML = `
    ${data.profile ? `
      <div class="ai-profile">
        <div class="ai-section-label">${t('your_profile')}</div>
        <div class="ai-profile-text">${esc(data.profile)}</div>
        ${data.persona ? `<div class="ai-persona">✨ ${esc(data.persona)} — <span style="color:var(--text-dim);font-weight:400">${esc(data.personaReason || '')}</span></div>` : ''}
        ${data.dna ? `<div class="ai-dna">🧬 ${esc(data.dna)}</div>` : ''}
      </div>` : ''}
    ${recs.length ? `<div class="ai-recs-grid">${recs.map(r => aiRecCard(r)).join('')}</div>` : ''}
  `;
}
function aiRecCard(r) {
  return `
    <div class="ai-rec-card">
      ${r.poster ? `<img class="ai-rec-poster" src="${r.poster}" onclick="openDetail('${r.type || 'movie'}', ${r.tmdb_id || 0})">` : '<div class="ai-rec-poster-empty">🎬</div>'}
      <div class="ai-rec-body">
        <div class="ai-rec-title">${esc(r.title)} <span class="ai-rec-year">(${r.year})</span></div>
        <div class="ai-rec-reason">${esc(r.reason || '')}</div>
        ${r.providers && r.providers.length ? `
          <div class="ai-rec-providers">
            <span class="providers-label">${t('available_on')}</span>
            ${r.providers.map(p => `<img src="${p.logo}" alt="${esc(p.name)}" title="${esc(p.name)}">`).join('')}
          </div>` : ''}
        ${r.tmdb_id ? `<button class="btn btn-primary btn-sm" style="align-self:flex-start" onclick='addAIRec(${JSON.stringify(r).replace(/'/g, "&#39;")})'>+ ${t('to_watch')}</button>` : ''}
      </div>
    </div>`;
}
function addAIRec(r) {
  const item = {
    id: r.tmdb_id, type: r.type || 'movie',
    title: r.title, year: r.year,
    poster: r.poster, backdrop: r.backdrop, overview: r.overview,
    rating: r.rating, status: 'to_watch',
  };
  if (addToLibrary(item)) { awardPoints(10); showToast(t('added')); }
  else showToast(t('already_in'));
}

// ===== Events & stats =====
async function logEvent(type, tmdbId, mediaType, metadata = {}) {
  if (!sb || !currentUser) return;
  await sb.from('user_events').insert({
    user_id: currentUser.id, event_type: type,
    tmdb_id: tmdbId, media_type: mediaType, metadata,
  });
}

async function loadStats() {
  if (!sb || !currentUser) return;
  const { data } = await sb.from('user_stats').select('*').eq('user_id', currentUser.id).single();
  if (data) userStats = data;
  else {
    await sb.from('user_stats').insert({ user_id: currentUser.id });
    userStats = { points: 0, streak_days: 0, badges: [], last_activity_date: null };
  }
  renderStatsPill();
}
function renderStatsPill() {
  if (!currentUser) { document.getElementById('statsPill').style.display = 'none'; return; }
  document.getElementById('statsPill').style.display = 'flex';
  document.getElementById('streakCount').textContent = userStats.streak_days || 0;
  document.getElementById('pointsCount').textContent = userStats.points || 0;
}
async function awardPoints(amount) {
  userStats.points = (userStats.points || 0) + amount;
  checkBadges();
  renderStatsPill();
  if (sb && currentUser) {
    await sb.from('user_stats').update({
      points: userStats.points, badges: userStats.badges,
      updated_at: new Date().toISOString(),
    }).eq('user_id', currentUser.id);
  }
}
function checkBadges() {
  const count = library.filter(i => !i.not_interested && (i.status || 'watched') === 'watched').length;
  const rated = library.filter(i => i.userRating > 0).length;
  const b = [...(userStats.badges || [])];
  if (count >= 5 && !b.includes('beginner')) b.push('beginner');
  if (count >= 25 && !b.includes('confirmed')) b.push('confirmed');
  if (count >= 50 && !b.includes('expert')) b.push('expert');
  if (count >= 100 && !b.includes('legend')) { b.push('legend'); b.push('100'); }
  if (rated >= 20 && !b.includes('rater')) b.push('rater');
  if (b.length !== (userStats.badges || []).length) {
    userStats.badges = b;
    showToast('🏆 ' + (currentLang === 'fr' ? 'Nouveau badge !' : 'New badge!'));
  }
}
function checkDailyStreak() {
  if (!userStats) return;
  const today = new Date().toISOString().slice(0, 10);
  if (userStats.last_activity_date === today) return;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  userStats.streak_days = userStats.last_activity_date === y ? (userStats.streak_days || 0) + 1 : 1;
  userStats.last_activity_date = today;
  renderStatsPill();
  if (sb && currentUser) {
    sb.from('user_stats').update({
      streak_days: userStats.streak_days, last_activity_date: today,
    }).eq('user_id', currentUser.id).then();
  }
}
function showStatsMenu() {
  const defs = {
    beginner: { emoji: '🌱', name: t('badge_beginner') },
    confirmed: { emoji: '🎬', name: t('badge_confirmed') },
    expert: { emoji: '🏆', name: t('badge_expert') },
    legend: { emoji: '👑', name: t('badge_legend') },
    '100': { emoji: '💯', name: t('badge_100') },
    rater: { emoji: '⭐', name: t('badge_rater') },
  };
  const keys = Object.keys(defs);
  const owned = (userStats.badges || []);
  document.getElementById('statsBody').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-emoji">⭐</div><div class="stat-value">${userStats.points || 0}</div><div class="stat-label">${t('points')}</div></div>
      <div class="stat-card"><div class="stat-emoji">🔥</div><div class="stat-value">${userStats.streak_days || 0}</div><div class="stat-label">${t('streak')}</div></div>
      <div class="stat-card"><div class="stat-emoji">🏅</div><div class="stat-value">${owned.length}/${keys.length}</div><div class="stat-label">${t('badges')}</div></div>
    </div>
    <div class="ai-section-label" style="margin-bottom:10px">${t('badges')}</div>
    <div class="badges-grid">
      ${keys.map(k => `<div class="badge-card ${owned.includes(k) ? 'owned' : 'locked'}"><div class="badge-emoji">${defs[k].emoji}</div><div class="badge-name">${defs[k].name}</div></div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:24px">
      <button class="btn btn-outline" style="flex:1" onclick="openProfilePicker();closeBadgesModal();">${t('select_profile')}</button>
      <button class="btn btn-outline" style="flex:1" onclick="signOut(); closeBadgesModal();">${t('sign_out')}</button>
    </div>`;
  document.getElementById('badgesModal').classList.add('active');
}
function closeBadgesModal() { document.getElementById('badgesModal').classList.remove('active'); }

// ===== WhatsApp =====
function buildShareLink(item) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?add=${item.type}:${item.id}`;
}

function buildWhatsAppMessage(item) {
  const link = buildShareLink(item);
  const pitch = (item.overview || '').trim().split(/[.!?]/)[0];
  const shortPitch = pitch && pitch.length > 5 && pitch.length < 140 ? pitch : '';
  if (currentLang === 'fr') {
    const lines = [];
    lines.push(`🎬 J'ai regarde *${item.title}* et je lui ai mis ${item.userRating}/10 !`);
    if (shortPitch) lines.push(`${shortPitch} 🔥`);
    lines.push(`👉 Regarde-le sur Seret : ${link}`);
    return lines.join('\n');
  } else {
    const lines = [];
    lines.push(`🎬 I just watched *${item.title}* and gave it ${item.userRating}/10 !`);
    if (shortPitch) lines.push(`${shortPitch} 🔥`);
    lines.push(`👉 Watch it on Seret: ${link}`);
    return lines.join('\n');
  }
}

function showWhatsAppSharePrompt(item) {
  const msg = buildWhatsAppMessage(item);
  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  const toast = document.createElement('div');
  toast.className = 'share-toast';
  toast.innerHTML = `
    <span>${item.userRating}/10 ★</span>
    <a href="${url}" target="_blank" class="btn btn-sm btn-gold" onclick="this.parentElement.remove()">${t('share_whatsapp')}</a>
    <button class="share-close" onclick="this.parentElement.remove()">×</button>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 10000);
}

function openWhatsApp(msg) {
  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  // iOS-friendly: trigger via anchor element click
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 100);
}

function manualShare(tmdbId, type, title) {
  const item = library.find(l => l.id === tmdbId && l.type === type) || { id: tmdbId, type, title, userRating: 0 };
  const msg = buildWhatsAppMessage(item);
  openWhatsApp(msg);
}
function shareInvite() {
  const code = userProfile?.share_code;
  if (!code) return;
  const origin = window.location.origin;
  const msg = currentLang === 'fr'
    ? `Rejoins-moi sur Seret 🎬\nMon code: *${code}*\n${origin}`
    : `Join me on Seret 🎬\nMy code: *${code}*\n${origin}`;
  openWhatsApp(msg);
}

// ===== Seasons =====
async function checkNewSeasons() {
  const tvShows = library.filter(i => i.type === 'tv' && !i.not_interested);
  if (!tvShows.length) return;
  const alertedKey = `seret-alerts-${currentUser?.id}`;
  const alerted = JSON.parse(localStorage.getItem(alertedKey) || '{}');
  for (const show of tvShows.slice(0, 10)) {
    try {
      const res = await fetch(`/api/details/tv/${show.id}`);
      const d = await res.json();
      const seasons = d.number_of_seasons;
      if (seasons && seasons > (alerted[show.id] || 1)) {
        showSeasonAlert({ id: show.id, title: show.title || d.name, season: seasons });
        alerted[show.id] = seasons;
      }
    } catch {}
  }
  localStorage.setItem(alertedKey, JSON.stringify(alerted));
}
function showSeasonAlert(a) {
  const el = document.createElement('div');
  el.className = 'season-alert';
  el.innerHTML = `
    <div class="season-alert-icon">🎬</div>
    <div class="season-alert-body">
      <div class="season-alert-title">${t('new_season')}</div>
      <div class="season-alert-msg">${t('new_season_msg')} ${a.season} — ${esc(a.title)}</div>
    </div>
    <button class="btn btn-sm btn-gold" onclick="quickAdd(${a.id}, 'tv', 'to_watch', null); this.parentElement.remove()">+</button>
    <button class="season-close" onclick="this.parentElement.remove()">×</button>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 20000);
}

// ===== Friends =====
function showHome() { setActiveNav('home'); document.getElementById('homeView').classList.add('active'); }
function showLibrary() { setActiveNav('library'); document.getElementById('libraryView').classList.add('active'); renderLibrary(); }
function showRecommend() { setActiveNav('recommend'); document.getElementById('recommendView').classList.add('active'); }
function showWrapped() { setActiveNav('wrapped'); document.getElementById('wrappedView').classList.add('active'); }
function showFriends() {
  setActiveNav('friends');
  document.getElementById('friendsView').classList.add('active');
  if (currentUser) {
    document.getElementById('friendsAuthWall').style.display = 'none';
    document.getElementById('friendsContent').style.display = 'block';
    document.getElementById('myShareCode').textContent = userProfile?.share_code || '...';
    loadFriends();
    loadIncomingRecos();
  } else {
    document.getElementById('friendsAuthWall').style.display = 'flex';
    document.getElementById('friendsContent').style.display = 'none';
  }
}
function setActiveNav(v) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.querySelectorAll('.mbn-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.querySelectorAll('.view').forEach(v2 => v2.classList.remove('active'));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

async function loadFriends() {
  if (!sb || !currentUser) return;
  const { data: pending } = await sb.from('friendships')
    .select('id, user_id, profiles!friendships_user_id_fkey(display_name, avatar_url)')
    .eq('friend_id', currentUser.id).eq('status', 'pending');
  const pendingEl = document.getElementById('pendingRequests');
  pendingEl.innerHTML = pending && pending.length
    ? `<h3 class="friends-section-title">${t('pending_requests')}</h3>${pending.map(r => `
      <div class="friend-row">
        <div class="friend-info"><div class="friend-avatar-placeholder">?</div><span class="friend-name">${esc(r.profiles?.display_name || '?')}</span></div>
        <div class="friend-actions">
          <button class="btn btn-sm btn-primary" onclick="acceptFriend(${r.id})">${t('accept')}</button>
          <button class="btn btn-sm btn-outline" onclick="declineFriend(${r.id})">${t('decline')}</button>
        </div>
      </div>`).join('')}`
    : '';

  const { data: friends } = await sb.from('friendships')
    .select('id, user_id, friend_id, profiles!friendships_user_id_fkey(id, display_name, avatar_url), friend:profiles!friendships_friend_id_fkey(id, display_name, avatar_url)')
    .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`).eq('status', 'accepted');

  if (friends && friends.length) {
    friendsData = friends.map(f => {
      const isMe = f.user_id === currentUser.id;
      const other = isMe ? f.friend : f.profiles;
      return { id: isMe ? f.friend_id : f.user_id, friendshipId: f.id, name: other?.display_name || '?', avatar: other?.avatar_url };
    });
    document.getElementById('friendsList').innerHTML = `<h3 class="friends-section-title">${t('my_friends')}</h3>${friendsData.map(f => `
      <div class="friend-row">
        <div class="friend-info">${f.avatar ? `<img class="friend-avatar" src="${f.avatar}">` : `<div class="friend-avatar-placeholder">?</div>`}<span class="friend-name">${esc(f.name)}</span></div>
        <div class="friend-actions">
          <button class="btn btn-sm btn-primary" onclick="viewFriendLibrary('${f.id}', '${esc(f.name)}')">${t('view_library')}</button>
          <button class="btn btn-sm btn-outline" onclick="removeFriend(${f.friendshipId})">${t('remove_friend')}</button>
        </div>
      </div>`).join('')}`;
    renderGroupPicker();
  } else {
    friendsData = [];
    document.getElementById('friendsList').innerHTML = `<p class="friends-empty">${t('no_friends')}</p>`;
    document.getElementById('groupPicker').innerHTML = '';
  }
}
function renderGroupPicker() {
  document.getElementById('groupPicker').innerHTML = friendsData.map(f => `
    <label class="group-chip ${selectedGroupFriends.has(f.id) ? 'selected' : ''}" onclick="toggleGroupFriend('${f.id}', this)">
      ${f.avatar ? `<img src="${f.avatar}">` : '<span>👤</span>'}
      <span>${esc(f.name)}</span>
    </label>`).join('');
}
function toggleGroupFriend(id, el) {
  selectedGroupFriends.has(id) ? selectedGroupFriends.delete(id) : selectedGroupFriends.add(id);
  el.classList.toggle('selected');
}

async function getGroupRecommendation() {
  if (selectedGroupFriends.size === 0) { showToast(t('pick_friends')); return; }
  const resultEl = document.getElementById('groupResult');
  resultEl.innerHTML = `<div class="recs-loading"><div class="spinner"></div> ${t('loading_recs')}</div>`;
  const watched = library.filter(i => !i.not_interested && (i.status || 'watched') === 'watched');
  const libraries = [{ name: userProfile?.display_name || 'You', items: watched }];
  for (const fid of selectedGroupFriends) {
    const { data } = await sb.from('library_items').select('*').eq('user_id', fid).limit(30);
    const f = friendsData.find(x => x.id === fid);
    libraries.push({ name: f?.name || '?', items: (data || []).map(r => ({ title: r.title, year: r.year, type: r.media_type, userRating: r.user_rating })) });
  }
  try {
    const res = await fetch('/api/group-recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ libraries, lang: currentLang }),
    });
    const data = await res.json();
    if (data.error) { resultEl.textContent = data.error; return; }
    const r = data.recommendation;
    resultEl.innerHTML = `<div class="ai-rec-card" style="max-width:520px;margin:20px auto">
      ${r.poster ? `<img class="ai-rec-poster" src="${r.poster}" onclick="openDetail('${r.type}', ${r.tmdb_id})">` : '<div class="ai-rec-poster-empty">🎬</div>'}
      <div class="ai-rec-body">
        <div class="ai-rec-title">${esc(r.title)} <span class="ai-rec-year">(${r.year})</span></div>
        ${r.seretScore ? `<div style="font-size:12px;color:var(--gold);font-weight:700;letter-spacing:1px">SERET SCORE ${r.seretScore}</div>` : ''}
        <div class="ai-rec-reason">${esc(r.reason)}</div>
      </div>
    </div>`;
  } catch (e) { resultEl.textContent = 'Error: ' + e.message; }
}

async function sendFriendRequest() {
  if (!sb || !currentUser) return;
  const code = document.getElementById('friendCodeInput').value.trim();
  if (!code) return;
  const { data: target } = await sb.from('profiles').select('id').eq('share_code', code).single();
  if (!target) return showToast(t('friend_not_found'));
  if (target.id === currentUser.id) return;
  const { error } = await sb.from('friendships').insert({ user_id: currentUser.id, friend_id: target.id, status: 'pending' });
  if (error) { if (error.code === '23505') showToast(t('already_in')); else showToast(error.message); return; }
  document.getElementById('friendCodeInput').value = '';
  showToast(t('friend_added'));
  loadFriends();
}
async function acceptFriend(id) { await sb.from('friendships').update({ status: 'accepted' }).eq('id', id); showToast(t('friend_accepted')); loadFriends(); }
async function declineFriend(id) { await sb.from('friendships').delete().eq('id', id); loadFriends(); }
async function removeFriend(id) { await sb.from('friendships').delete().eq('id', id); loadFriends(); }
function copyShareCode() {
  const code = userProfile?.share_code;
  if (code) navigator.clipboard.writeText(code).then(() => showToast(t('code_copied')));
}
async function viewFriendLibrary(friendId, friendName) {
  document.getElementById('friendLibrarySection').style.display = 'block';
  document.getElementById('friendLibraryName').textContent = friendName + t('library_of');
  const { data } = await sb.from('library_items').select('*').eq('user_id', friendId).order('added_at', { ascending: false });
  const grid = document.getElementById('friendLibraryGrid');
  grid.innerHTML = data && data.length
    ? data.map(r => cardHTML({ ...r, id: r.tmdb_id, type: r.media_type }, true, true, friendId)).join('')
    : `<div class="empty-state"><p>${currentLang === 'fr' ? 'Vide' : 'Empty'}</p></div>`;
}
function closeFriendLibrary() { document.getElementById('friendLibrarySection').style.display = 'none'; }

async function toggleReaction(friendId, id, type, emoji, btn) {
  if (!sb || !currentUser) return;
  if (btn.classList.contains('active')) {
    await sb.from('reactions').delete()
      .eq('user_id', currentUser.id).eq('target_user_id', friendId)
      .eq('tmdb_id', id).eq('media_type', type).eq('emoji', emoji);
    btn.classList.remove('active');
  } else {
    await sb.from('reactions').insert({ user_id: currentUser.id, target_user_id: friendId, tmdb_id: id, media_type: type, emoji });
    btn.classList.add('active');
  }
}

// ===== Recommend to friend =====
function openRecoModal(tmdbId, type, title, poster) {
  if (friendsData.length === 0) { showToast(t('no_friends')); return; }
  recoTargetItem = { tmdb_id: tmdbId, media_type: type, title, poster };
  document.getElementById('recoFriendsList').innerHTML = friendsData.map(f => `
    <label class="group-chip" style="margin-bottom:6px" onclick="this.classList.toggle('selected')">
      ${f.avatar ? `<img src="${f.avatar}">` : '<span>👤</span>'}
      <span data-friend-id="${f.id}">${esc(f.name)}</span>
    </label>`).join('');
  document.getElementById('recoMessage').value = '';
  document.getElementById('recoModal').classList.add('active');
}
function closeRecoModal() { document.getElementById('recoModal').classList.remove('active'); }
async function sendRecoToFriend() {
  const selected = [...document.querySelectorAll('#recoFriendsList .group-chip.selected span[data-friend-id]')].map(s => s.dataset.friendId);
  if (selected.length === 0) return showToast(t('pick_friends'));
  const message = document.getElementById('recoMessage').value.trim();
  for (const fid of selected) {
    await sb.from('recommendations').insert({
      from_user_id: currentUser.id, to_user_id: fid,
      tmdb_id: recoTargetItem.tmdb_id, media_type: recoTargetItem.media_type,
      title: recoTargetItem.title, poster: recoTargetItem.poster,
      message,
    });
  }
  awardPoints(15 * selected.length);
  closeRecoModal();
  showToast(t('reco_sent'));
}
async function loadIncomingRecos() {
  if (!sb || !currentUser) return;
  const { data } = await sb.from('recommendations')
    .select('id, from_user_id, tmdb_id, media_type, title, poster, message, status, profiles!recommendations_from_user_id_fkey(display_name)')
    .eq('to_user_id', currentUser.id).in('status', ['sent', 'seen']).order('created_at', { ascending: false }).limit(5);
  const el = document.getElementById('incomingRecos');
  if (!el) return;
  if (!data || data.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = data.map(r => `
    <div class="reco-banner">
      ${r.poster ? `<img src="${r.poster}" style="width:50px;border-radius:6px" onclick="openDetail('${r.media_type}', ${r.tmdb_id})">` : ''}
      <div style="flex:1">
        <div class="reco-from">${t('from_friend')} ${esc(r.profiles?.display_name || '?')}</div>
        <div style="font-weight:600;margin-top:2px">${esc(r.title)}</div>
        ${r.message ? `<div class="reco-msg">"${esc(r.message)}"</div>` : ''}
      </div>
      <button class="btn btn-sm btn-gold" onclick="acceptReco(${r.id}, ${r.tmdb_id}, '${r.media_type}', '${esc(r.title)}')">+ ${t('to_watch')}</button>
    </div>`).join('');
}
async function acceptReco(recoId, tmdbId, type, title) {
  quickAdd(tmdbId, type, 'to_watch', null);
  await sb.from('recommendations').update({ status: 'watched' }).eq('id', recoId);
  loadIncomingRecos();
}

// ===== Wrapped =====
async function loadWrapped() {
  const year = new Date().getFullYear();
  const res = await fetch('/api/wrapped', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ library, year, lang: currentLang }),
  });
  const data = await res.json();
  document.getElementById('wrappedYear').textContent = year;
  document.getElementById('wrappedContent').innerHTML = `
    <div class="wrapped-grid">
      <div class="wrapped-card gradient-1"><div class="wrapped-value">${data.total}</div><div class="wrapped-label">${t('total_watched')}</div></div>
      <div class="wrapped-card gradient-2"><div class="wrapped-value">${data.movies}</div><div class="wrapped-label">${t('movies_count')}</div></div>
      <div class="wrapped-card gradient-3"><div class="wrapped-value">${data.shows}</div><div class="wrapped-label">${t('series_count')}</div></div>
      <div class="wrapped-card gradient-4"><div class="wrapped-value">${data.fiveStars}</div><div class="wrapped-label">${t('five_stars')}</div></div>
      <div class="wrapped-card gradient-5"><div class="wrapped-value">${data.avgRating}</div><div class="wrapped-label">${t('avg_rating')}</div></div>
    </div>
    ${data.top && data.top.length ? `<div class="ai-section-label">${t('top_picks')}</div><div class="grid">${data.top.map(r => cardHTML(r, true, true)).join('')}</div>` : ''}
    <button class="btn btn-gold" style="margin-top:20px" onclick='shareWrapped(${JSON.stringify(data).replace(/"/g, "&quot;")})'>${t('share_whatsapp')}</button>`;
}
function shareWrapped(d) {
  const msg = currentLang === 'fr'
    ? `🎬 Mon annee cinema sur Seret\n\n*${d.total}* titres visionnes\n🎥 ${d.movies} films · 📺 ${d.shows} series\n❤️ ${d.fiveStars} coups de coeur\n⭐ Note moyenne ${d.avgRating}/10\n\n${window.location.origin}`
    : `🎬 My cinema year on Seret\n\n*${d.total}* titles watched\n🎥 ${d.movies} movies · 📺 ${d.shows} series\n❤️ ${d.fiveStars} favorites\n⭐ Avg ${d.avgRating}/10\n\n${window.location.origin}`;
  openWhatsApp(msg);
}

// ===== Keyboard =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeAuthModal(); closeContextModal(); closeBadgesModal(); closeCameraModal(); closeRecoModal(); }
});

// ===== Toast =====
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '0.4s'; }, 2200);
  setTimeout(() => t.remove(), 2700);
}

// ===== Utility =====
function esc(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

function checkReminder() {
  const last = Math.max(0, ...library.map(i => i.addedAt || 0));
  const days = (Date.now() - last) / 86400000;
  if (days > 5 && library.length > 0) {
    setTimeout(() => showToast(currentLang === 'fr' ? '🎬 5 jours sans film ? Seret AI a une idee pour toi.' : "🎬 It's been 5 days! Seret AI has an idea for you."), 3000);
  }
}

// ===== Pending share-link add =====
function capturePendingAddFromURL() {
  const params = new URLSearchParams(window.location.search);
  const add = params.get('add');
  if (add) {
    const [type, id] = add.split(':');
    if ((type === 'movie' || type === 'tv') && id && /^\d+$/.test(id)) {
      localStorage.setItem('seret-pending-add', JSON.stringify({ type, id: Number(id), ts: Date.now() }));
    }
    // Clean the URL
    const clean = window.location.pathname;
    window.history.replaceState({}, '', clean);
  }
}

async function processPendingAdd() {
  const raw = localStorage.getItem('seret-pending-add');
  if (!raw) return;
  let pending;
  try { pending = JSON.parse(raw); } catch { localStorage.removeItem('seret-pending-add'); return; }
  // Need logged-in user with a selected profile to persist. Otherwise wait.
  if (!currentUser || !activeProfile) {
    // If not logged in, prompt login. The item stays in localStorage for later.
    if (!currentUser) {
      showToast(currentLang === 'fr' ? '🎬 Connecte-toi pour ajouter ce film' : '🎬 Sign in to add this film');
      setTimeout(() => openAuthModal(), 500);
    }
    return;
  }
  // Fetch details and add to watchlist
  try {
    const res = await fetch(`/api/details/${pending.type}/${pending.id}?lang=${currentLang === 'fr' ? 'fr-FR' : 'en-US'}`);
    const d = await res.json();
    const item = {
      id: pending.id, type: pending.type,
      title: d.title || d.name,
      year: (d.release_date || d.first_air_date || '').slice(0, 4),
      poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : '',
      backdrop: d.backdrop_path ? `https://image.tmdb.org/t/p/original${d.backdrop_path}` : '',
      overview: d.overview, rating: d.vote_average,
      status: 'to_watch',
    };
    const added = addToLibrary(item);
    localStorage.removeItem('seret-pending-add');
    if (added) {
      awardPoints(10);
      const msg = currentLang === 'fr'
        ? `✨ ${item.title} ajoute a ta liste !`
        : `✨ ${item.title} added to your watchlist!`;
      showToast(msg);
      setTimeout(() => { showLibrary(); }, 800);
    }
  } catch (e) {
    console.error('[pending add] error:', e);
    localStorage.removeItem('seret-pending-add');
  }
}


// ===== Init =====
applyLang();
capturePendingAddFromURL();
loadTrending();
initSupabase();
checkReminder();
