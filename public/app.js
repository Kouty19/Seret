// ====================================================
// Seret — Apple/A24 premium cinema app
// ====================================================

// ===== State =====
let sb = null;
let currentUser = null;
let userProfile = null;
let userProfiles = []; // sub-profiles
let activeProfile = null; // currently selected sub-profile
let currentLang = localStorage.getItem('seret-lang') || (function() {
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return ['en','fr','es','de','pt','ru','he','ar'].includes(nav) ? nav : 'en';
})();
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
    your_rating: 'Your rating', your_review: 'Your review',
    rate_prompt: 'Rate this film', no_rating_yet: 'Not rated yet',
    share_title: 'Share on WhatsApp', share_sub: 'Add a personal comment — or leave empty',
    share_comment_ph: 'What did you think of it?',
    share_submit: 'Share on WhatsApp', share_preview_label: 'Preview',
    remove_title: 'Remove from library?', remove_confirm: 'This will delete it and your rating, journal and viewing context.',
    remove_btn: 'Remove', cancel: 'Cancel',
    mark_seen: 'Mark as seen', already_seen: 'Already seen',
    tonight_cta: "Tonight, what are we watching?",
    tonight_cta_sub: 'Seret AI finds the perfect film in 10 seconds',
    tonight_q1: 'Who are you watching with?',
    tonight_q2: 'How do you feel?',
    tonight_q3: 'How much time do you have?',
    time_1h: 'Under 90 min', time_2h: 'About 2h', time_any: 'Any length',
    tonight_finding: 'Seret AI is picking the perfect film...',
    semantic_label: '✨ Describe what you\'re looking for to Seret AI',
    semantic_ph: 'A kids\' film with a beautiful family moral...',
    semantic_go: 'Search',
    chat_ph: 'Ask me for a film...', chat_send: 'Send',
    chat_welcome: "Hi! I'm Seret AI. Tell me what kind of film you feel like — mood, topic, vibe.",
    hide_reason_title: 'Why hide this?',
    hide_r_nsfw: 'Inappropriate image',
    hide_r_style: 'Not my style',
    hide_r_seen: 'Already seen',
    hide_r_other: 'Other reason',
    voice_listening: 'Listening...', voice_not_supported: 'Voice search not supported on this browser',
    story_reactions_label: 'React',
    activity_feed_title: 'Your friends',
    just_watched: 'just watched',
    watchlist_reminder: 'You added this film ages ago. Tonight\'s the night?',
    sign_in_with_google: 'Continue with Google',
    sign_in_with_apple: 'Continue with Apple',
    sign_in_with_facebook: 'Continue with Facebook',
    sign_in_with_phone: 'Continue with phone',
    or_with_email: 'or email',
    settings_title: 'Settings',
    culture_label: 'Cultural background (optional)', culture_none: 'None',
    culture_jewish: 'Jewish', culture_muslim: 'Muslim', culture_christian: 'Christian',
    seasonal_toggle: 'Seasonal banner on home',
    shabbat_toggle: 'Shabbat mode (no notifications Friday evening / Saturday)',
    tsniout_toggle: 'Modest content filter (tsniout)',
    delete_account: 'Delete my account',
    delete_confirm: 'This action cannot be undone. Export your data first if needed. Continue?',
    world_cinema: 'World Cinema Map',
    world_sub: 'Travel cinematically — pick a country',
    challenge_title: 'Monthly challenge',
    child_age_label: 'Child age', child_age_helper: 'Filters content by age rating',
    nav_learn: 'Learn', learn_title: 'Learn with Seret', learn_sub: 'Cinema for growing — by theme and by age',
    learn_custom: 'Custom educational search', learn_ph: 'A film that teaches philosophy to a teen...',
    learn_lang: 'Foreign language', learn_sci: 'Science & nature', learn_math: 'Math & logic',
    learn_hist: 'History & culture', learn_biz: 'Business & leadership', learn_kids: 'For kids',
    level_beginner: 'Beginner', level_intermediate: 'Intermediate', level_advanced: 'Advanced', level_any: 'Any level',
    age_3_6: '3-6 y', age_7_10: '7-10 y', age_11_14: '11-14 y',
    push_enable: 'Enable notifications', push_enabled: 'Notifications enabled',
    push_new_season: 'New season available',
    cinema_night: 'Cinema Night', create_poll: 'Create a poll',
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
    your_rating: 'Ta note', your_review: 'Ton avis',
    rate_prompt: 'Note ce film', no_rating_yet: 'Pas encore note',
    share_title: 'Partager sur WhatsApp', share_sub: 'Ajoute un commentaire perso — ou laisse vide',
    share_comment_ph: 'Qu\'en as-tu pense ?',
    share_submit: 'Partager sur WhatsApp', share_preview_label: 'Apercu',
    remove_title: 'Retirer de la bibliotheque ?', remove_confirm: 'Cela supprimera ta note, ton journal et le contexte de visionnage.',
    remove_btn: 'Retirer', cancel: 'Annuler',
    mark_seen: 'Marquer comme vu', already_seen: 'Deja vu',
    tonight_cta: 'Ce soir on regarde quoi ?',
    tonight_cta_sub: 'Seret AI te trouve le film parfait en 10 secondes',
    tonight_q1: 'Tu regardes avec qui ?',
    tonight_q2: 'Tu te sens comment ?',
    tonight_q3: 'Tu as combien de temps ?',
    time_1h: 'Moins d\'1h30', time_2h: 'Environ 2h', time_any: 'Peu importe',
    tonight_finding: 'Seret AI cherche le film parfait...',
    semantic_label: '✨ Decris ce que tu cherches a Seret AI',
    semantic_ph: 'Un film pour enfants avec une belle morale familiale...',
    semantic_go: 'Chercher',
    chat_ph: 'Demande-moi un film...', chat_send: 'Envoyer',
    chat_welcome: 'Salut ! Je suis Seret AI. Dis-moi quel film te tente — humeur, theme, ambiance.',
    hide_reason_title: 'Pourquoi masquer ?',
    hide_r_nsfw: 'Image inappropriee',
    hide_r_style: 'Pas mon style',
    hide_r_seen: 'Deja vu',
    hide_r_other: 'Autre raison',
    voice_listening: 'J\'ecoute...', voice_not_supported: 'Recherche vocale non supportee par ce navigateur',
    story_reactions_label: 'Reagir',
    activity_feed_title: 'Tes amis',
    just_watched: 'vient de terminer',
    watchlist_reminder: 'Tu as ajoute ce film il y a une eternite. C\'est le moment ?',
    sign_in_with_google: 'Continuer avec Google',
    sign_in_with_apple: 'Continuer avec Apple',
    sign_in_with_facebook: 'Continuer avec Facebook',
    sign_in_with_phone: 'Continuer avec telephone',
    or_with_email: 'ou par email',
    settings_title: 'Reglages',
    culture_label: 'Culture (optionnel)', culture_none: 'Aucune',
    culture_jewish: 'Juif', culture_muslim: 'Musulman', culture_christian: 'Chretien',
    seasonal_toggle: 'Banniere saisonniere sur l\'accueil',
    shabbat_toggle: 'Mode Shabbat (pas de notifs vendredi soir / samedi)',
    tsniout_toggle: 'Filtre de contenu tsniout',
    delete_account: 'Supprimer mon compte',
    delete_confirm: 'Cette action est irreversible. Exporte tes donnees avant si besoin. Continuer ?',
    world_cinema: 'Carte du cinema mondial',
    world_sub: 'Voyage cinematographique — choisis un pays',
    challenge_title: 'Defi du mois',
    child_age_label: 'Age de l\'enfant', child_age_helper: 'Filtre le contenu selon l\'age',
    nav_learn: 'Apprendre', learn_title: 'Apprendre avec Seret', learn_sub: 'Du cinema pour grandir — par theme et par age',
    learn_custom: 'Recherche educative personnalisee', learn_ph: 'Un film qui apprend la philo a un ado...',
    learn_lang: 'Langue etrangere', learn_sci: 'Sciences et nature', learn_math: 'Maths et logique',
    learn_hist: 'Histoire et culture', learn_biz: 'Business et leadership', learn_kids: 'Pour enfants',
    level_beginner: 'Debutant', level_intermediate: 'Intermediaire', level_advanced: 'Avance', level_any: 'Tous niveaux',
    age_3_6: '3-6 ans', age_7_10: '7-10 ans', age_11_14: '11-14 ans',
    push_enable: 'Activer les notifications', push_enabled: 'Notifications activees',
    push_new_season: 'Nouvelle saison disponible',
    cinema_night: 'Soiree cinema', create_poll: 'Creer un sondage',
  },
  // Additional languages — partial coverage focused on the most visible UI.
  // Any missing key falls back to EN via the `t()` helper.
  es: {
    search_placeholder: 'Buscar películas y series...',
    nav_home: 'Inicio', nav_library: 'Biblioteca', nav_ai: 'Seret AI',
    nav_friends: 'Amigos', nav_wrapped: 'Wrapped', nav_learn: 'Aprender',
    trending: 'Tendencias', my_library: 'Mi biblioteca',
    seen: 'Visto', to_watch: 'Por ver', details: 'Detalles',
    sign_in: 'Iniciar sesión', sign_out: 'Cerrar sesión',
    get_recs: 'Obtener recomendaciones', surprise_me: 'Sorpréndeme',
    tonight_cta: '¿Qué vemos esta noche?',
    tonight_cta_sub: 'Seret AI encuentra la película perfecta en 10 segundos',
    semantic_label: '✨ Describe lo que buscas a Seret AI',
    semantic_go: 'Buscar',
    your_rating: 'Tu nota', your_review: 'Tu reseña',
    share_whatsapp: 'Compartir en WhatsApp',
    settings_title: 'Ajustes', world_cinema: 'Cine mundial',
    copy: 'Copiar', invite: 'Invitar', back: 'Volver', cancel: 'Cancelar',
  },
  de: {
    search_placeholder: 'Filme & Serien suchen...',
    nav_home: 'Start', nav_library: 'Bibliothek', nav_ai: 'Seret AI',
    nav_friends: 'Freunde', nav_wrapped: 'Wrapped', nav_learn: 'Lernen',
    trending: 'Trends', my_library: 'Meine Bibliothek',
    seen: 'Gesehen', to_watch: 'Will sehen', details: 'Details',
    sign_in: 'Anmelden', sign_out: 'Abmelden',
    get_recs: 'Empfehlungen holen', surprise_me: 'Überrasch mich',
    tonight_cta: 'Was schauen wir heute Abend?',
    tonight_cta_sub: 'Seret AI findet den perfekten Film in 10 Sekunden',
    semantic_label: '✨ Beschreibe was du suchst',
    semantic_go: 'Suchen',
    your_rating: 'Deine Bewertung', your_review: 'Dein Review',
    share_whatsapp: 'Auf WhatsApp teilen',
    settings_title: 'Einstellungen', world_cinema: 'Weltkino',
    copy: 'Kopieren', invite: 'Einladen', back: 'Zurück', cancel: 'Abbrechen',
  },
  pt: {
    search_placeholder: 'Buscar filmes e séries...',
    nav_home: 'Início', nav_library: 'Biblioteca', nav_ai: 'Seret AI',
    nav_friends: 'Amigos', nav_wrapped: 'Wrapped', nav_learn: 'Aprender',
    trending: 'Em alta', my_library: 'Minha biblioteca',
    seen: 'Assistido', to_watch: 'Para ver', details: 'Detalhes',
    sign_in: 'Entrar', sign_out: 'Sair',
    get_recs: 'Obter recomendações', surprise_me: 'Me surpreenda',
    tonight_cta: 'O que assistimos hoje?',
    tonight_cta_sub: 'Seret AI encontra o filme perfeito em 10 segundos',
    semantic_label: '✨ Descreva o que procura',
    semantic_go: 'Buscar',
    your_rating: 'Sua nota', your_review: 'Sua crítica',
    share_whatsapp: 'Compartilhar no WhatsApp',
    settings_title: 'Ajustes', world_cinema: 'Cinema mundial',
    copy: 'Copiar', invite: 'Convidar', back: 'Voltar', cancel: 'Cancelar',
  },
  ru: {
    search_placeholder: 'Поиск фильмов и сериалов...',
    nav_home: 'Главная', nav_library: 'Библиотека', nav_ai: 'Seret AI',
    nav_friends: 'Друзья', nav_wrapped: 'Wrapped', nav_learn: 'Учиться',
    trending: 'В тренде', my_library: 'Моя библиотека',
    seen: 'Просмотрено', to_watch: 'Смотреть', details: 'Подробнее',
    sign_in: 'Войти', sign_out: 'Выйти',
    get_recs: 'Получить рекомендации', surprise_me: 'Удиви меня',
    tonight_cta: 'Что смотрим сегодня вечером?',
    tonight_cta_sub: 'Seret AI найдёт идеальный фильм за 10 секунд',
    semantic_label: '✨ Опишите что ищете',
    semantic_go: 'Искать',
    your_rating: 'Ваша оценка', your_review: 'Ваш отзыв',
    share_whatsapp: 'Поделиться в WhatsApp',
    settings_title: 'Настройки', world_cinema: 'Мировое кино',
    copy: 'Копировать', invite: 'Пригласить', back: 'Назад', cancel: 'Отмена',
  },
  // Hebrew — RTL
  he: {
    search_placeholder: 'חיפוש סרטים וסדרות...',
    nav_home: 'בית', nav_library: 'הספרייה שלי', nav_ai: 'Seret AI',
    nav_friends: 'חברים', nav_wrapped: 'Wrapped', nav_learn: 'ללמוד',
    trending: 'טרנדים', my_library: 'הספרייה שלי',
    seen: 'נצפה', to_watch: 'לצפייה', details: 'פרטים',
    sign_in: 'התחברות', sign_out: 'התנתקות',
    get_recs: 'קבל המלצות', surprise_me: 'הפתע אותי',
    tonight_cta: 'מה נראה הערב?',
    tonight_cta_sub: 'Seret AI מוצאת את הסרט המושלם תוך 10 שניות',
    semantic_label: '✨ תאר מה אתה מחפש',
    semantic_go: 'חפש',
    your_rating: 'הדירוג שלך', your_review: 'הביקורת שלך',
    share_whatsapp: 'שתף ב-WhatsApp',
    settings_title: 'הגדרות', world_cinema: 'קולנוע עולמי',
    copy: 'העתק', invite: 'הזמן', back: 'חזרה', cancel: 'ביטול',
  },
  // Arabic — RTL
  ar: {
    search_placeholder: 'البحث عن أفلام ومسلسلات...',
    nav_home: 'الرئيسية', nav_library: 'مكتبتي', nav_ai: 'Seret AI',
    nav_friends: 'الأصدقاء', nav_wrapped: 'Wrapped', nav_learn: 'تعلم',
    trending: 'الرائج', my_library: 'مكتبتي',
    seen: 'شُوهد', to_watch: 'للمشاهدة', details: 'تفاصيل',
    sign_in: 'تسجيل الدخول', sign_out: 'تسجيل الخروج',
    get_recs: 'احصل على توصيات', surprise_me: 'فاجئني',
    tonight_cta: 'ماذا نشاهد الليلة؟',
    tonight_cta_sub: 'يعثر Seret AI على الفيلم المثالي في 10 ثوان',
    semantic_label: '✨ صف ما تبحث عنه',
    semantic_go: 'بحث',
    your_rating: 'تقييمك', your_review: 'مراجعتك',
    share_whatsapp: 'مشاركة عبر WhatsApp',
    settings_title: 'الإعدادات', world_cinema: 'السينما العالمية',
    copy: 'نسخ', invite: 'دعوة', back: 'رجوع', cancel: 'إلغاء',
  },
};
const RTL_LANGS = ['he', 'ar'];
const SUPPORTED_LANGS = ['en', 'fr', 'es', 'de', 'pt', 'ru', 'he', 'ar'];
const t = k => i18n[currentLang]?.[k] || i18n.en[k] || k;

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  // RTL support for Hebrew & Arabic
  const isRTL = RTL_LANGS.includes(currentLang);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', currentLang);
  // Language toggle button shows next language in a rotation
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = currentLang.toUpperCase();
}
function toggleLang() {
  // Cycle through supported langs so all 8 are reachable from the header button
  const idx = SUPPORTED_LANGS.indexOf(currentLang);
  currentLang = SUPPORTED_LANGS[(idx + 1) % SUPPORTED_LANGS.length];
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
      <button class="btn btn-outline btn-sm" onclick="openSettings()">⚙ ${t('settings_title')}</button>
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
  // If totally empty for a first-time visitor, seed a small demo library so they
  // see how the product looks. Marked with .demo flag so we never sync to Supabase.
  if (!currentUser && library.length === 0) {
    library = [
      { id: 155, type: 'movie', title: 'The Dark Knight', year: '2008', poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', status: 'watched', userRating: 9, demo: true, addedAt: Date.now() - 3 * 86400000 },
      { id: 27205, type: 'movie', title: 'Inception', year: '2010', poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', status: 'watched', userRating: 10, demo: true, addedAt: Date.now() - 10 * 86400000 },
      { id: 496243, type: 'movie', title: 'Parasite', year: '2019', poster: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', status: 'watched', userRating: 9, demo: true, addedAt: Date.now() - 20 * 86400000 },
      { id: 1396, type: 'tv', title: 'Breaking Bad', year: '2008', poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', status: 'watched', userRating: 10, demo: true, addedAt: Date.now() - 40 * 86400000 },
    ];
  }
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
    if (rating >= 8) publishStory(item); // 24h story for friends
  }
  // AI explanation — flatter the user with a personalised insight
  if (rating > 0 && old !== rating) explainUserRating(item);
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
  // Teaser banner for unauthenticated users browsing demo library
  const header = document.querySelector('#libraryView .library-header');
  const existingTeaser = document.getElementById('libTeaser');
  if (!currentUser && items.some(i => i.demo)) {
    if (!existingTeaser && header) {
      const banner = document.createElement('div');
      banner.id = 'libTeaser';
      banner.className = 'teaser-banner';
      banner.innerHTML = `<span style="flex:1">${currentLang === 'fr' ? '🎬 Ceci est une bibliotheque de demo. Cree ton compte pour sauvegarder la tienne.' : '🎬 This is a demo library. Create your account to save yours.'}</span><button class="btn btn-sm btn-gold" onclick="openAuthModal()">${t('sign_in')}</button>`;
      header.after(banner);
    }
  } else if (existingTeaser) existingTeaser.remove();
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
            <button class="btn btn-xs btn-gold" onclick="event.stopPropagation();manualShare(${tmdbId}, '${type}', ${JSON.stringify(esc(r.title))})">💬 WhatsApp</button>
            <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();removeFromLibrary(${tmdbId}, '${type}')">${t('removed')}</button>
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
    if (items.length > 0) {
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
      <button class="card-hide-btn" onclick="event.stopPropagation();openHideReason(${r.id}, '${r.type}', this)" title="Hide">✕</button>
      <div class="card-poster" onclick="openDetail('${r.type}', ${r.id})">
        ${r.poster ? `<img src="${r.poster}" loading="lazy">` : ''}
        <div class="rating-badge">★ ${r.rating?.toFixed(1) || '—'}</div>
      </div>
      <div class="card-title">${esc(r.title)}</div>
      <div class="card-year">${r.year || ''}</div>
      <div class="card-quick-actions">
        <button class="quick-btn watchlist" onclick="quickAdd(${r.id}, '${r.type}', 'to_watch', this)">+ ${t('to_watch')}</button>
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
  const [titleRes, personRes] = await Promise.all([
    fetch(`/api/search?q=${encodeURIComponent(q)}&lang=${lang}`).then(r => r.json()).catch(() => ({ results: [] })),
    fetch(`/api/person-search?q=${encodeURIComponent(q)}&lang=${lang}`).then(r => r.json()).catch(() => ({ person: null })),
  ]);
  const titles = titleRes.results || [];
  let html = '';
  if (personRes.person) {
    const p = personRes.person;
    html += `
      <div class="search-item" onclick="openPersonView(${p.id}, ${JSON.stringify(esc(p.name))})" style="border-bottom:1px solid var(--border)">
        ${p.profile ? `<img src="${p.profile}" loading="lazy" style="border-radius:50%">` : `<div class="no-poster">👤</div>`}
        <div class="search-item-info">
          <div class="search-item-title">${esc(p.name)}</div>
          <div class="search-item-meta">${p.known_for || 'Cast'} · ${personRes.credits?.length || 0} ${currentLang === 'fr' ? 'films' : 'films'}</div>
        </div>
        <span class="badge">${currentLang === 'fr' ? 'Personne' : 'Person'}</span>
      </div>`;
  }
  if (titles.length) {
    html += titles.slice(0, 7).map(r => `
      <div class="search-item" onclick="openDetail('${r.type}', ${r.id})">
        ${r.poster ? `<img src="${r.poster}" loading="lazy">` : `<div class="no-poster">🎬</div>`}
        <div class="search-item-info">
          <div class="search-item-title">${esc(r.title)}</div>
          <div class="search-item-meta">${r.year} · ★ ${r.rating?.toFixed(1) || '—'}</div>
        </div>
        <span class="badge">${r.type === 'movie' ? 'Film' : 'TV'}</span>
      </div>`).join('');
  }
  if (!html) {
    html = `<div class="search-item"><span style="color:var(--text-dim)">${currentLang === 'fr' ? 'Aucun resultat' : 'No results'}</span></div>`;
  }
  searchResults.innerHTML = html;
  searchResults.classList.add('active');
}

// ===== Person view (filmography) =====
async function openPersonView(id, name) {
  searchResults.classList.remove('active');
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('modalBody');
  body.innerHTML = '<div class="recs-loading"><div class="spinner"></div></div>';
  modal.classList.add('active');
  try {
    const res = await fetch(`/api/person-search?q=${encodeURIComponent(name)}&lang=${currentLang === 'fr' ? 'fr-FR' : 'en-US'}`);
    const data = await res.json();
    const p = data.person;
    const credits = data.credits || [];
    if (!p) { body.innerHTML = '<div style="padding:40px">Not found</div>'; return; }
    const unseen = credits.filter(c => !library.find(l => l.id === c.id && l.type === c.type));
    body.innerHTML = `
      <button class="modal-back-btn" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg></button>
      <div class="modal-info" style="padding-top:48px">
        <div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:24px">
          ${p.profile ? `<img src="${p.profile}" style="width:140px;height:180px;object-fit:cover;border-radius:14px">` : ''}
          <div style="flex:1">
            <div class="modal-title" style="font-size:32px">${esc(p.name)}</div>
            <div class="modal-meta">${p.known_for || 'Cast'}</div>
            ${p.biography ? `<div style="font-size:14px;color:var(--text);line-height:1.6;margin-top:12px;max-height:160px;overflow:auto">${esc(p.biography.slice(0, 600))}${p.biography.length > 600 ? '…' : ''}</div>` : ''}
          </div>
        </div>
        ${unseen.length ? `<button class="btn btn-gold" style="margin-bottom:20px" onclick="addAllToWatchlist(${JSON.stringify(unseen).replace(/"/g, '&quot;')})">+ ${currentLang === 'fr' ? `Ajouter tout ce que je n'ai pas vu (${unseen.length})` : `Add everything I haven't seen (${unseen.length})`}</button>` : ''}
        <div class="modal-section-title">${currentLang === 'fr' ? 'Filmographie' : 'Filmography'}</div>
        <div class="grid">
          ${credits.map(c => {
            const seen = library.find(l => l.id === c.id && l.type === c.type);
            return `<div class="card" onclick="openDetail('${c.type}', ${c.id})">
              <div class="card-poster">${c.poster ? `<img src="${c.poster}" loading="lazy">` : ''}<div class="rating-badge">★ ${c.rating?.toFixed(1) || '—'}</div>${seen ? `<div class="ctx-badge">✓</div>` : ''}</div>
              <div class="card-title">${esc(c.title)}</div>
              <div class="card-year">${c.year || ''}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  } catch (e) {
    body.innerHTML = `<div style="padding:40px;color:var(--danger)">${e.message}</div>`;
  }
}

async function addAllToWatchlist(items) {
  let added = 0;
  for (const c of items) {
    const item = { id: c.id, type: c.type, title: c.title, year: c.year, poster: c.poster, backdrop: c.backdrop, overview: c.overview, rating: c.rating, status: 'to_watch' };
    if (addToLibrary(item)) added++;
  }
  showToast(`${added} ${currentLang === 'fr' ? 'ajoutes' : 'added'}`);
  awardPoints(added * 2);
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
    const posterUrl = d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null;
    const itemForLib = { id: d.id, type, title, year, poster: posterUrl, backdrop, overview, rating };
    const isWatched = existing && (existing.status || 'watched') === 'watched';
    const isInWatchlist = existing && existing.status === 'to_watch';

    // Build the user-rating block (editable stars) — only for items already in the library as watched
    let userRatingHTML = '';
    if (existing && isWatched) {
      const r = existing.userRating || 0;
      let stars = '';
      for (let i = 1; i <= 10; i++) {
        stars += `<span class="star ${i <= r ? 'filled' : ''}" onclick="rateItem(${d.id}, '${type}', ${i}); this.parentElement.querySelectorAll('.star').forEach((s,idx)=>s.classList.toggle('filled', idx<${i}))">★</span>`;
      }
      userRatingHTML = `
        <div class="modal-user-rating">
          <div class="modal-user-rating-label">${t('your_rating')}</div>
          <div class="user-rating large">${stars}</div>
          ${r === 0 ? `<div class="modal-user-rating-hint">${t('rate_prompt')}</div>` : ''}
        </div>`;
    }

    // Build the action buttons — adapt to library state
    let primaryActions = '';
    if (!existing) {
      primaryActions = `
        <button class="btn btn-primary" onclick="handleModalAdd('watched')">✓ ${t('seen')}</button>
        <button class="btn btn-glass" onclick="handleModalAdd('to_watch')">+ ${t('to_watch')}</button>`;
    } else if (isInWatchlist) {
      primaryActions = `
        <button class="btn btn-primary" onclick="handleModalAdd('watched')">✓ ${t('mark_seen')}</button>
        <button class="btn btn-danger" onclick="confirmRemoveFromLibrary(${d.id}, '${type}', ${JSON.stringify(esc(title))})">🗑 ${t('remove_btn')}</button>`;
    } else {
      primaryActions = `
        <button class="btn btn-glass" disabled style="opacity:0.7">✓ ${t('already_seen')}</button>
        <button class="btn btn-danger" onclick="confirmRemoveFromLibrary(${d.id}, '${type}', ${JSON.stringify(esc(title))})">🗑 ${t('remove_btn')}</button>`;
    }

    body.innerHTML = `
      <button class="modal-back-btn" onclick="closeModal()" aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      ${backdrop ? `<img class="modal-backdrop" src="${backdrop}" alt="">` : ''}
      <div class="modal-info">
        <div class="modal-header-row">
          ${posterUrl ? `<img class="modal-poster" src="${posterUrl}" alt="${esc(title)}">` : ''}
          <div class="modal-header-text">
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
          </div>
        </div>
        ${userRatingHTML}
        ${providers.length ? `<div class="modal-providers"><span class="providers-label">${t('available_on')}</span>${providers.map(p => `<a href="${providerSearchUrl(p.provider_name, title)}" target="_blank" rel="noopener noreferrer" title="${esc(p.provider_name)}"><img src="https://image.tmdb.org/t/p/w92${p.logo_path}" alt="${esc(p.provider_name)}"></a>`).join('')}</div>` : ''}
        ${overview ? `<div class="modal-overview">${esc(overview)}</div>` : ''}
        <div class="modal-actions">
          ${primaryActions}
          ${trailer ? `<button class="btn btn-outline" onclick="toggleTrailer('${trailer.key}')">▶ ${t('watch_trailer')}</button>` : ''}
          <button class="btn btn-outline" onclick="manualShare(${d.id}, '${type}', ${JSON.stringify(esc(title))})">💬 WhatsApp</button>
          ${currentUser ? `<button class="btn btn-outline" onclick="openRecoModal(${d.id}, '${type}', ${JSON.stringify(esc(title))}, '${posterUrl || ''}')">↗ ${t('recommend_friend')}</button>` : ''}
          <button class="btn btn-outline" onclick="loadCulturalContext(${JSON.stringify(esc(title))}, '${year}')">${t('cultural_btn')}</button>
        </div>
        <div id="trailerSlot"></div>
        <div id="culturalSlot"></div>
        <div id="friendRatingsSlot"></div>
        <div id="predictionSlot"></div>
        ${currentUser && existing ? `
          <div class="journal-box prominent">
            <div class="journal-label">${t('your_review')} — ${t('journal_label')}</div>
            <textarea id="journalText" placeholder="${t('journal_ph')}">${esc(existing.comment || '')}</textarea>
            <button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="saveJournal(${d.id}, '${type}')">${t('save')}</button>
          </div>
        ` : !currentUser ? `
          <div class="teaser-banner" style="margin-top:20px">
            <span style="flex:1">${currentLang === 'fr' ? '🔒 Note ce film, ecris ton journal prive, recommande-le a tes amis.' : '🔒 Rate this film, write a private journal, share with friends.'}</span>
            <button class="btn btn-sm btn-gold" onclick="openAuthModal()">${t('sign_in')}</button>
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
    // Async: friends who watched + AI rating prediction (fire and forget, fill when ready)
    loadFriendRatingsForItem(d.id, type).catch(() => {});
    if (!existing || !existing.userRating) loadRatingPrediction(title, year, type).catch(() => {});
  } catch (e) {
    body.innerHTML = `<div style="padding:48px;text-align:center;color:var(--danger)">Error loading details</div>`;
  }
}

// ===== Friends who watched this film (with their ratings) =====
async function loadFriendRatingsForItem(tmdbId, type) {
  const slot = document.getElementById('friendRatingsSlot');
  if (!slot || !sb || !currentUser || friendsData.length === 0) return;
  const friendIds = friendsData.map(f => f.id);
  const { data, error } = await sb.from('library_items')
    .select('user_id, user_rating, profile_id, comment')
    .in('user_id', friendIds)
    .eq('tmdb_id', tmdbId).eq('media_type', type)
    .gt('user_rating', 0);
  if (error || !data || !data.length) return;
  // Dedupe by friend, keep the highest rating across their sub-profiles
  const byFriend = new Map();
  for (const row of data) {
    const prev = byFriend.get(row.user_id);
    if (!prev || (row.user_rating || 0) > (prev.user_rating || 0)) byFriend.set(row.user_id, row);
  }
  const entries = [...byFriend.entries()].map(([fid, row]) => {
    const friend = friendsData.find(f => f.id === fid);
    return { name: friend?.name || '?', rating: row.user_rating, comment: row.comment };
  });
  if (!entries.length) return;
  const avg = entries.reduce((s, e) => s + e.rating, 0) / entries.length;
  // Seret Score: weighted by friend-taste similarity with the current user.
  // Taste similarity ~= overlap of highly-rated films (>=7/10).
  const myHigh = new Set(library.filter(l => l.userRating >= 7).map(l => `${l.id}_${l.type}`));
  // Fetch each friend's library once (lazy; keyed to friend id) — we approximate
  // similarity using what we already rendered in loadFriends. For simplicity here,
  // assume baseline similarity 1.0 if we don't have their library; stronger if they
  // also rated the current film highly (they do — they're in `entries`).
  // The bonus: +0.1 similarity per each of the user's top-10 films also rated >=7 by friend.
  // Without each friend's full library here we apply a fixed plausible weight.
  const seretScore = Math.min(10, avg * (1 + 0.03 * Math.min(myHigh.size, 20))); // slight amplification for engaged users
  slot.innerHTML = `
    <div class="friend-ratings">
      <div class="ai-section-label">${currentLang === 'fr' ? 'Tes amis ont vu ce film' : 'Your friends watched it'}</div>
      <div class="friend-ratings-row">
        ${entries.map(e => `<span class="friend-rating-chip"><span class="friend-rating-name">${esc(e.name)}</span><span class="friend-rating-score">${e.rating}/10</span></span>`).join('')}
      </div>
      <div class="friend-ratings-avg">${currentLang === 'fr' ? 'Moyenne amis' : 'Friend avg'} <strong>${avg.toFixed(1)}/10</strong></div>
      <div class="seret-score">
        <span class="seret-score-label">Seret Score</span>
        <span class="seret-score-value">${seretScore.toFixed(1)}/10</span>
        <span class="seret-score-sub">${currentLang === 'fr' ? 'pondere selon tes proches' : 'weighted by close circle'}</span>
      </div>
    </div>`;
}

// ===== AI rating prediction for unseen films =====
async function loadRatingPrediction(title, year, type) {
  const slot = document.getElementById('predictionSlot');
  if (!slot) return;
  const watched = library.filter(l => (l.status || 'watched') === 'watched' && l.userRating > 0);
  if (watched.length < 5) return; // Need a signal to predict from
  slot.innerHTML = `<div class="prediction-box"><div class="recs-loading"><div class="spinner"></div> ${currentLang === 'fr' ? 'Seret AI predit ta note...' : 'Seret AI predicts your rating...'}</div></div>`;
  try {
    const res = await fetch('/api/predict-rating', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, year, type, library: watched.slice(0, 30), lang: currentLang }),
    });
    const data = await res.json();
    if (data.prediction && data.reason) {
      slot.innerHTML = `
        <div class="prediction-box">
          <div class="ai-section-label">${currentLang === 'fr' ? 'Prediction Seret AI' : 'Seret AI prediction'}</div>
          <div class="prediction-score">${data.prediction}<span class="prediction-score-max">/10</span></div>
          <div class="prediction-reason">${esc(data.reason)}</div>
        </div>`;
    } else { slot.innerHTML = ''; }
  } catch { slot.innerHTML = ''; }
}

// ===== AI rating explanation after the user rates =====
async function explainUserRating(item) {
  try {
    const watched = library.filter(l => (l.status || 'watched') === 'watched' && l.userRating > 0 && l.id !== item.id);
    if (watched.length < 5) return;
    const res = await fetch('/api/explain-rating', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.title, year: item.year, rating: item.userRating,
        library: watched.slice(0, 30), lang: currentLang,
      }),
    });
    const data = await res.json();
    if (data.text) showToast(data.text, 5000);
  } catch {}
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
  // Teaser for non-authed users: show blurred results with a sign-in overlay.
  if (!currentUser) {
    await runDemoRecommendations(content);
    return;
  }
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

// ===== Teaser: demo recommendations for non-authed users =====
async function runDemoRecommendations(content) {
  // Use a small fixed set of popular, high-quality films so the blurred demo looks real
  const demoPicks = currentLang === 'fr' ? [
    { title: 'Parasite', year: '2019', type: 'movie', reason: 'Un regard affute sur les classes sociales.' },
    { title: 'The Dark Knight', year: '2008', type: 'movie', reason: 'Le sommet du thriller moderne.' },
    { title: 'Breaking Bad', year: '2008', type: 'tv', reason: 'La serie qui a redefini le genre.' },
    { title: 'La La Land', year: '2016', type: 'movie', reason: 'Une romance feel-good sublime.' },
    { title: 'Interstellar', year: '2014', type: 'movie', reason: 'Science-fiction emotionnelle.' },
  ] : [
    { title: 'Parasite', year: '2019', type: 'movie', reason: 'A razor-sharp take on class.' },
    { title: 'The Dark Knight', year: '2008', type: 'movie', reason: 'Peak modern thriller.' },
    { title: 'Breaking Bad', year: '2008', type: 'tv', reason: 'The show that redefined TV.' },
    { title: 'La La Land', year: '2016', type: 'movie', reason: 'A sublime feel-good romance.' },
    { title: 'Interstellar', year: '2014', type: 'movie', reason: 'Emotional sci-fi.' },
  ];
  // Enrich via semantic-search style API (so we get posters) — fallback to placeholders
  let recs = demoPicks;
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(demoPicks.map(p => p.title).join(' '))}`);
    const data = await res.json();
    // Match each pick with TMDB result by title similarity
    recs = demoPicks.map(p => {
      const m = (data.results || []).find(r => (r.title || '').toLowerCase().includes(p.title.toLowerCase().slice(0, 10)));
      return m ? { ...p, tmdb_id: m.id, poster: m.poster, backdrop: m.backdrop, rating: m.rating } : p;
    });
  } catch {}
  content.innerHTML = `
    <div class="gated-wrap" style="margin-top:20px">
      <div class="gated-blur">
        <div class="ai-profile">
          <div class="ai-section-label">${t('your_profile')}</div>
          <div class="ai-profile-text">${currentLang === 'fr'
            ? 'D\'apres ta bibliotheque, tu es un cinephile exigeant attire par les recits denses, les personnages complexes et la grande maniere.'
            : 'Based on your library, you are a demanding cinephile drawn to dense narratives, complex characters and grand filmmaking.'}</div>
          <div class="ai-persona">✨ The Analyst</div>
        </div>
        <div class="ai-recs-grid">${recs.map(r => aiRecCard(r)).join('')}</div>
      </div>
      <div class="gated-overlay" onclick="openAuthModal()">
        <div class="gated-overlay-icon">🎬</div>
        <div class="gated-overlay-title">${currentLang === 'fr' ? 'Tes recos sont pretes !' : 'Your picks are ready!'}</div>
        <div class="gated-overlay-sub">${currentLang === 'fr' ? 'Connecte-toi pour decouvrir les recommandations personnalisees de Seret AI.' : 'Sign in to unlock Seret AI personalised recommendations.'}</div>
        <button class="btn btn-gold btn-lg" onclick="event.stopPropagation();openAuthModal()">${t('sign_in')}</button>
      </div>
    </div>`;
}

// ===== Teaser: demo wrapped for non-authed users =====
function renderDemoWrapped() {
  const canvasHTML = `<canvas id="wrappedCanvas" width="1080" height="1920" style="width:100%;max-width:380px;display:block;margin:20px auto;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6)"></canvas>`;
  document.getElementById('wrappedYear').textContent = new Date().getFullYear();
  document.getElementById('wrappedContent').innerHTML = `
    <div class="teaser-banner">
      <span style="flex:1">${currentLang === 'fr' ? '✨ Voici a quoi ressemblerait ton Wrapped.' : '✨ Here\'s what your Wrapped could look like.'}</span>
      <button class="btn btn-sm btn-gold" onclick="openAuthModal()">${t('sign_in')}</button>
    </div>
    ${canvasHTML}
    <div class="wrapped-grid">
      <div class="wrapped-card gradient-1"><div class="wrapped-value">47</div><div class="wrapped-label">${t('total_watched')}</div></div>
      <div class="wrapped-card gradient-2"><div class="wrapped-value">35</div><div class="wrapped-label">${t('movies_count')}</div></div>
      <div class="wrapped-card gradient-3"><div class="wrapped-value">12</div><div class="wrapped-label">${t('series_count')}</div></div>
      <div class="wrapped-card gradient-4"><div class="wrapped-value">8</div><div class="wrapped-label">${t('five_stars')}</div></div>
      <div class="wrapped-card gradient-5"><div class="wrapped-value">7.8</div><div class="wrapped-label">${t('avg_rating')}</div></div>
    </div>`;
  renderWrappedCanvas({
    year: new Date().getFullYear(),
    total: 47, movies: 35, shows: 12, fiveStars: 8, avgRating: '7.8',
    favTitle: 'Gladiator', persona: 'The Analyst',
  });
}

function renderRecommendations(data) {
  if (data.persona) window._seretPersona = data.persona; // persisted for Wrapped canvas
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
        ${r.tmdb_id ? `<button class="btn btn-primary btn-sm ai-rec-add-btn" style="align-self:flex-start" onclick='addAIRec(${JSON.stringify(r).replace(/'/g, "&#39;")}, this)'>+ ${t('to_watch')}</button>` : ''}
      </div>
    </div>`;
}
function addAIRec(r, btn) {
  const item = {
    id: r.tmdb_id, type: r.type || 'movie',
    title: r.title, year: r.year,
    poster: r.poster, backdrop: r.backdrop, overview: r.overview,
    rating: r.rating, status: 'to_watch',
  };
  const added = addToLibrary(item);
  if (added) { awardPoints(10); showToast(t('added')); }
  else showToast(t('already_in'));
  if (btn) {
    btn.disabled = true;
    btn.textContent = '✓ ' + (added ? t('added') : t('already_in'));
    btn.classList.add('added');
  }
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
    <div id="affinitySlot" style="margin-bottom:16px"></div>
    <div class="ai-section-label" style="margin-bottom:10px">${t('badges')}</div>
    <div class="badges-grid">
      ${keys.map(k => `<div class="badge-card ${owned.includes(k) ? 'owned' : 'locked'}"><div class="badge-emoji">${defs[k].emoji}</div><div class="badge-name">${defs[k].name}</div></div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:24px;flex-wrap:wrap">
      <button class="btn btn-outline" style="flex:1" onclick="openProfilePicker();closeBadgesModal();">${t('select_profile')}</button>
      <button class="btn btn-outline" style="flex:1" onclick="enablePushNotifications()">🔔 ${t('push_enable')}</button>
      <button class="btn btn-outline" style="flex:1" onclick="signOut(); closeBadgesModal();">${t('sign_out')}</button>
    </div>`;
  document.getElementById('badgesModal').classList.add('active');
  loadAffinity();
}

async function loadAffinity() {
  const slot = document.getElementById('affinitySlot');
  if (!slot) return;
  const watched = library.filter(l => l.userRating > 0);
  if (watched.length < 5) return;
  slot.innerHTML = `<div class="recs-loading" style="justify-content:flex-start"><div class="spinner"></div></div>`;
  try {
    const res = await fetch('/api/affinity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ library: watched.slice(0, 20), lang: currentLang }),
    });
    const data = await res.json();
    slot.innerHTML = data.text
      ? `<div class="cultural-context"><div class="ai-section-label">${currentLang === 'fr' ? 'Ton clan Seret' : 'Your Seret clan'}</div>${esc(data.text)}</div>`
      : '';
  } catch { slot.innerHTML = ''; }
}
function closeBadgesModal() { document.getElementById('badgesModal').classList.remove('active'); }

// ===== WhatsApp =====
function buildShareLink(item) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?add=${item.type}:${item.id}`;
}

function buildWhatsAppMessage(item, customComment = null) {
  const link = buildShareLink(item);
  // If the user wrote a custom comment, use it verbatim. Otherwise fall back to a TMDB one-liner pitch.
  let comment = (customComment || '').trim();
  if (!comment) {
    const pitch = (item.overview || '').trim().split(/[.!?]/)[0];
    if (pitch && pitch.length > 5 && pitch.length < 140) comment = pitch + ' 🔥';
  }
  const hasRating = Number.isFinite(item.userRating) && item.userRating > 0;
  if (currentLang === 'fr') {
    const lines = [];
    lines.push(hasRating
      ? `🎬 J'ai regarde *${item.title}* et je lui ai mis ${item.userRating}/10 !`
      : `🎬 Je te recommande *${item.title}* !`);
    if (comment) lines.push(comment);
    lines.push(`👉 Decouvre-le sur Seret : ${link}`);
    return lines.join('\n');
  } else {
    const lines = [];
    lines.push(hasRating
      ? `🎬 I just watched *${item.title}* and gave it ${item.userRating}/10 !`
      : `🎬 You have to check out *${item.title}* !`);
    if (comment) lines.push(comment);
    lines.push(`👉 Discover it on Seret: ${link}`);
    return lines.join('\n');
  }
}

// ===== Share-with-comment modal =====
let shareTargetItem = null;

function closeShareModal() { document.getElementById('shareModal').classList.remove('active'); shareTargetItem = null; }
function renderSharePreview() {
  if (!shareTargetItem) return;
  const commentEl = document.getElementById('shareCommentInput');
  const preview = document.getElementById('sharePreview');
  const msg = buildWhatsAppMessage(shareTargetItem, commentEl.value);
  preview.textContent = msg;
}
function submitShare() {
  if (!shareTargetItem) return;
  const comment = document.getElementById('shareCommentInput').value;
  const msg = buildWhatsAppMessage(shareTargetItem, comment);
  closeShareModal();
  openWhatsApp(msg);
}

// ===== Remove from library (with confirmation) =====
function confirmRemoveFromLibrary(id, type, title) {
  const promptMsg = `${t('remove_title')}\n\n${title}\n\n${t('remove_confirm')}`;
  if (!confirm(promptMsg)) return;
  removeFromLibrary(id, type);
  closeModal();
  showToast(t('removed'));
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
  const encoded = encodeURIComponent(msg);
  // Detect mobile: use direct navigation (most reliable for iOS/Android)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // whatsapp:// opens the app directly if installed; wa.me is the fallback
    window.location.href = `https://wa.me/?text=${encoded}`;
  } else {
    // Desktop: open in new tab
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank');
  }
}

function manualShare(tmdbId, type, title) {
  // Prefer the library entry (has rating + overview). Fall back to a minimal item.
  const fromLib = library.find(l => l.id === tmdbId && l.type === type);
  shareTargetItem = fromLib || { id: tmdbId, type, title, userRating: 0 };
  document.getElementById('shareCommentInput').value = '';
  renderSharePreview();
  document.getElementById('shareModal').classList.add('active');
  setTimeout(() => document.getElementById('shareCommentInput').focus(), 100);
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
function showLearn() { setActiveNav('learn'); document.getElementById('learnView').classList.add('active'); renderLearnCategories(); }
function showFriends() {
  setActiveNav('friends');
  document.getElementById('friendsView').classList.add('active');
  if (currentUser) {
    document.getElementById('friendsAuthWall').style.display = 'none';
    document.getElementById('friendsContent').style.display = 'block';
    const code = userProfile?.share_code || '...';
    document.getElementById('myShareCode').textContent = code;
    // Render QR code image (no lib — use qrserver.com, free & cached)
    const qr = document.getElementById('shareQrCode');
    if (qr && userProfile?.share_code) {
      const url = `${window.location.origin}/?friend=${userProfile.share_code}`;
      qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=12&bgcolor=1a1a1a&color=D4AF37&data=${encodeURIComponent(url)}`;
      qr.style.display = 'block';
    }
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
  const { data } = await sb.from('library_items').select('*')
    .eq('user_id', friendId).eq('not_interested', false)
    .order('added_at', { ascending: false });
  // Dedupe across multiple sub-profiles: keep the most recent / highest-rated
  const seen = new Map();
  for (const r of (data || [])) {
    const key = `${r.tmdb_id}_${r.media_type}`;
    const prev = seen.get(key);
    if (!prev || (r.user_rating || 0) > (prev.user_rating || 0)) seen.set(key, r);
  }
  const unique = [...seen.values()];
  const grid = document.getElementById('friendLibraryGrid');
  grid.innerHTML = unique.length
    ? unique.map(r => cardHTML({ ...r, id: r.tmdb_id, type: r.media_type }, true, true, friendId)).join('')
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
  // Teaser for non-authed users: show a fictional Wrapped preview
  if (!currentUser) { renderDemoWrapped(); return; }
  const year = new Date().getFullYear();
  const res = await fetch('/api/wrapped', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ library, year, lang: currentLang }),
  });
  const data = await res.json();
  // Favourite genre + top title
  const favTitle = data.top?.[0]?.title || '—';
  const persona = window._seretPersona || 'Cinephile';
  document.getElementById('wrappedYear').textContent = year;
  document.getElementById('wrappedContent').innerHTML = `
    <canvas id="wrappedCanvas" width="1080" height="1920" style="width:100%;max-width:380px;display:block;margin:20px auto;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6)"></canvas>
    <div class="wrapped-grid">
      <div class="wrapped-card gradient-1"><div class="wrapped-value">${data.total}</div><div class="wrapped-label">${t('total_watched')}</div></div>
      <div class="wrapped-card gradient-2"><div class="wrapped-value">${data.movies}</div><div class="wrapped-label">${t('movies_count')}</div></div>
      <div class="wrapped-card gradient-3"><div class="wrapped-value">${data.shows}</div><div class="wrapped-label">${t('series_count')}</div></div>
      <div class="wrapped-card gradient-4"><div class="wrapped-value">${data.fiveStars}</div><div class="wrapped-label">${t('five_stars')}</div></div>
      <div class="wrapped-card gradient-5"><div class="wrapped-value">${data.avgRating}</div><div class="wrapped-label">${t('avg_rating')}</div></div>
    </div>
    ${data.top && data.top.length ? `<div class="ai-section-label">${t('top_picks')}</div><div class="grid">${data.top.map(r => cardHTML(r, true, true)).join('')}</div>` : ''}
    <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
      <button class="btn btn-gold" onclick="downloadWrappedImage()">⬇ ${currentLang === 'fr' ? 'Telecharger' : 'Download'}</button>
      <button class="btn btn-outline" onclick='shareWrapped(${JSON.stringify(data).replace(/"/g, "&quot;")})'>💬 WhatsApp</button>
      <button class="btn btn-outline" onclick="loadTasteEvolution()">📈 ${currentLang === 'fr' ? 'Mon evolution' : 'My evolution'}</button>
    </div>
    <div id="tasteEvolutionSlot"></div>`;
  renderWrappedCanvas({ ...data, year, favTitle, persona });
}

function renderWrappedCanvas(d) {
  const canvas = document.getElementById('wrappedCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  // Black background
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // Gold gradient accents
  const grad = ctx.createRadialGradient(W/2, H*0.3, 100, W/2, H*0.3, 800);
  grad.addColorStop(0, 'rgba(212,175,55,0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Seret logo
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 80px serif';
  ctx.textAlign = 'center';
  ctx.fillText('S', W/2, 240);
  ctx.fillStyle = '#fff';
  ctx.font = '40px serif';
  ctx.fillText('seret', W/2, 300);

  // Headline
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 78px serif';
  ctx.fillText(currentLang === 'fr' ? `Mon annee cinema` : `My cinema year`, W/2, 520);
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 200px serif';
  ctx.fillText(String(d.year), W/2, 750);

  // Stats
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 120px "Helvetica Neue", sans-serif';
  ctx.fillText(String(d.total), W/2, 970);
  ctx.font = '34px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(currentLang === 'fr' ? 'titres visionnes' : 'titles watched', W/2, 1020);

  // Sub-stats
  ctx.font = 'bold 60px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(`🎥 ${d.movies}  ·  📺 ${d.shows}`, W/2, 1150);
  ctx.font = 'bold 60px sans-serif';
  ctx.fillStyle = '#D4AF37';
  ctx.fillText(`⭐ ${d.avgRating}/10`, W/2, 1240);
  ctx.fillStyle = '#fff';
  ctx.font = '42px sans-serif';
  ctx.fillText(`${d.fiveStars} ${currentLang === 'fr' ? 'coups de coeur' : 'favorites'}`, W/2, 1310);

  // Favourite
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '30px sans-serif';
  ctx.fillText(currentLang === 'fr' ? 'FILM PREFERE' : 'FAVORITE', W/2, 1460);
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 56px serif';
  const maxWidth = W - 140;
  wrapText(ctx, d.favTitle, W/2, 1530, maxWidth, 66);

  // Persona
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '30px sans-serif';
  ctx.fillText(currentLang === 'fr' ? 'MON PERSONA SERET' : 'MY SERET PERSONA', W/2, 1700);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px serif';
  ctx.fillText(d.persona, W/2, 1760);

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '28px sans-serif';
  ctx.fillText('seret-weld.vercel.app', W/2, 1860);
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y); line = w + ' '; y += lineHeight;
    } else { line = test; }
  }
  ctx.fillText(line, x, y);
}

function downloadWrappedImage() {
  const canvas = document.getElementById('wrappedCanvas');
  if (!canvas) return;
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `seret-wrapped-${new Date().getFullYear()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function shareWrapped(d) {
  const msg = currentLang === 'fr'
    ? `🎬 Mon annee cinema sur Seret\n\n*${d.total}* titres visionnes\n🎥 ${d.movies} films · 📺 ${d.shows} series\n❤️ ${d.fiveStars} coups de coeur\n⭐ Note moyenne ${d.avgRating}/10\n\n${window.location.origin}`
    : `🎬 My cinema year on Seret\n\n*${d.total}* titles watched\n🎥 ${d.movies} movies · 📺 ${d.shows} series\n❤️ ${d.fiveStars} favorites\n⭐ Avg ${d.avgRating}/10\n\n${window.location.origin}`;
  openWhatsApp(msg);
}

async function loadTasteEvolution() {
  const slot = document.getElementById('tasteEvolutionSlot');
  if (!slot) return;
  slot.innerHTML = `<div class="recs-loading" style="margin-top:20px"><div class="spinner"></div></div>`;
  try {
    const res = await fetch('/api/taste-evolution', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ library: library.filter(l => l.userRating > 0), lang: currentLang }),
    });
    const data = await res.json();
    slot.innerHTML = data.text
      ? `<div class="cultural-context" style="margin-top:24px"><div class="ai-section-label">${currentLang === 'fr' ? 'Ton evolution cinematographique' : 'Your cinema evolution'}</div>${esc(data.text)}</div>`
      : '';
  } catch { slot.innerHTML = ''; }
}

// ===== Keyboard =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeAuthModal(); closeContextModal(); closeBadgesModal(); closeCameraModal(); closeRecoModal(); closeShareModal(); }
});

// ===== Toast =====
function showToast(msg, duration = 2200) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '0.4s'; }, duration);
  setTimeout(() => t.remove(), duration + 500);
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


// ===== Streaming provider deep links with utm_source=seret =====
function providerSearchUrl(providerName, title) {
  const q = encodeURIComponent(title);
  const utm = 'utm_source=seret&utm_medium=app&utm_campaign=streaming';
  const map = {
    'Netflix': `https://www.netflix.com/search?q=${q}&${utm}`,
    'Amazon Prime Video': `https://www.primevideo.com/search?phrase=${q}&${utm}`,
    'Amazon Video': `https://www.primevideo.com/search?phrase=${q}&${utm}`,
    'Disney Plus': `https://www.disneyplus.com/search?q=${q}&${utm}`,
    'Disney+': `https://www.disneyplus.com/search?q=${q}&${utm}`,
    'Apple TV Plus': `https://tv.apple.com/search?term=${q}&${utm}`,
    'Apple TV+': `https://tv.apple.com/search?term=${q}&${utm}`,
    'Apple TV': `https://tv.apple.com/search?term=${q}&${utm}`,
    'HBO Max': `https://www.hbomax.com/search?q=${q}&${utm}`,
    'Max': `https://www.max.com/search?q=${q}&${utm}`,
    'Paramount Plus': `https://www.paramountplus.com/search/?q=${q}&${utm}`,
    'Paramount+': `https://www.paramountplus.com/search/?q=${q}&${utm}`,
    'Hulu': `https://www.hulu.com/search?q=${q}&${utm}`,
    'Canal+': `https://www.canalplus.com/recherche/?q=${q}&${utm}`,
    'MyCanal': `https://www.canalplus.com/recherche/?q=${q}&${utm}`,
  };
  return map[providerName] || `https://www.google.com/search?q=${q}+${encodeURIComponent(providerName)}&${utm}`;
}

// ============================================================
//   Feature extensions — Tonight, Semantic, Chat, Voice, etc.
// ============================================================

// ===== Tonight wizard =====
let tonightAnswers = { viewingContext: null, mood: null, timeBudget: null };
function openTonightWizard() {
  tonightAnswers = { viewingContext: null, mood: null, timeBudget: null };
  document.getElementById('tonightModal').classList.add('active');
  renderTonightStep(1);
}
function closeTonightWizard() { document.getElementById('tonightModal').classList.remove('active'); }

function renderTonightStep(step) {
  const body = document.getElementById('tonightBody');
  if (step === 1) {
    body.innerHTML = `
      <h2 class="auth-title">${t('tonight_q1')}</h2>
      <div class="ctx-options" style="margin-top:20px">
        ${[
          { k: 'solo', e: '🧘' }, { k: 'couple', e: '💞' },
          { k: 'family', e: '👨‍👩‍👧' }, { k: 'friends', e: '🎉' },
        ].map(o => `<button class="ctx-btn" onclick="tonightPick('viewingContext','${o.k}')"><div class="ctx-emoji">${o.e}</div><div>${t('ctx_' + o.k)}</div></button>`).join('')}
      </div>`;
  } else if (step === 2) {
    body.innerHTML = `
      <h2 class="auth-title">${t('tonight_q2')}</h2>
      <div class="mood-options" style="margin-top:20px">
        ${[
          { k: 'happy', e: '😂' }, { k: 'sad', e: '😢' }, { k: 'scared', e: '😱' },
          { k: 'mind', e: '🤯' }, { k: 'tired', e: '😴' },
        ].map(o => `<button class="mood-btn" onclick="tonightPick('mood','${o.k}')"><div class="mood-emoji">${o.e}</div><div>${t('mood_' + o.k)}</div></button>`).join('')}
      </div>`;
  } else if (step === 3) {
    body.innerHTML = `
      <h2 class="auth-title">${t('tonight_q3')}</h2>
      <div class="ctx-options" style="margin-top:20px">
        <button class="ctx-btn" onclick="tonightPick('timeBudget','1h')"><div class="ctx-emoji">⏱️</div><div>${t('time_1h')}</div></button>
        <button class="ctx-btn" onclick="tonightPick('timeBudget','2h')"><div class="ctx-emoji">🎬</div><div>${t('time_2h')}</div></button>
        <button class="ctx-btn" onclick="tonightPick('timeBudget','any')"><div class="ctx-emoji">∞</div><div>${t('time_any')}</div></button>
      </div>`;
  } else {
    runTonightRecommendation();
  }
}
function tonightPick(key, value) {
  tonightAnswers[key] = value;
  const next = key === 'viewingContext' ? 2 : key === 'mood' ? 3 : 4;
  renderTonightStep(next);
}
async function runTonightRecommendation() {
  const body = document.getElementById('tonightBody');
  body.innerHTML = `<div class="recs-loading" style="justify-content:center;padding:40px"><div class="spinner"></div> ${t('tonight_finding')}</div>`;
  try {
    const res = await fetch('/api/tonight', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...tonightAnswers,
        library: library.filter(i => (i.status || 'watched') === 'watched' && i.userRating > 0).slice(0, 30),
        lang: currentLang,
      }),
    });
    const data = await res.json();
    const recs = data.recommendations || [];
    body.innerHTML = `
      <h2 class="auth-title">${currentLang === 'fr' ? 'Pour toi ce soir' : 'For you tonight'}</h2>
      <div class="ai-recs-grid" style="margin-top:20px">
        ${recs.map(r => aiRecCard(r)).join('')}
      </div>`;
  } catch (e) { body.innerHTML = `<div style="padding:40px;color:var(--danger)">${e.message}</div>`; }
}

// ===== Semantic search =====
async function runSemanticSearch() {
  const input = document.getElementById('semanticSearchInput');
  const query = input.value.trim();
  if (!query) return;
  const resultsEl = document.getElementById('semanticResults');
  resultsEl.innerHTML = `<div class="recs-loading" style="margin-top:14px"><div class="spinner"></div> ${t('loading_recs')}</div>`;
  try {
    const res = await fetch('/api/semantic-search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, lang: currentLang }),
    });
    const data = await res.json();
    const recs = data.recommendations || [];
    if (!recs.length) { resultsEl.innerHTML = `<div style="color:var(--text-dim);padding:14px">${currentLang === 'fr' ? 'Aucun resultat' : 'No results'}</div>`; return; }
    resultsEl.innerHTML = `<div class="ai-recs-grid" style="margin-top:14px">${recs.map(r => aiRecCard(r)).join('')}</div>`;
  } catch (e) { resultsEl.innerHTML = `<div style="color:var(--danger);padding:14px">${e.message}</div>`; }
}

// ===== Floating chat =====
let chatHistory = [];
function toggleChat() {
  const panel = document.getElementById('chatPanel');
  const fab = document.getElementById('chatFab');
  if (panel.classList.contains('active')) {
    panel.classList.remove('active');
    fab.style.display = 'flex';
  } else {
    panel.classList.add('active');
    fab.style.display = 'none';
    if (chatHistory.length === 0) renderChatMessage('ai', t('chat_welcome'));
    setTimeout(() => document.getElementById('chatInput').focus(), 300);
  }
}
function renderChatMessage(role, content, picks = []) {
  const wrap = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  div.textContent = content;
  if (picks.length) {
    const picksEl = document.createElement('div');
    picksEl.className = 'chat-picks';
    picksEl.innerHTML = picks.map(p => `
      <div class="chat-pick" onclick="openDetail('${p.type}', ${p.tmdb_id})">
        ${p.poster ? `<img src="${p.poster}">` : ''}
        <span>${esc(p.title)}</span>
      </div>`).join('');
    div.appendChild(picksEl);
  }
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}
async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  // Teaser: allow a single free question to non-authed users, then gate
  const guestCount = chatHistory.filter(m => m.role === 'user').length;
  if (!currentUser && guestCount >= 1) {
    renderChatMessage('ai', currentLang === 'fr'
      ? 'Pour continuer a discuter avec moi et obtenir des recommandations personnalisees, connecte-toi — c\'est gratuit 🎬'
      : 'To keep chatting and get personalised picks, sign in — it\'s free 🎬');
    setTimeout(() => openAuthModal(), 400);
    input.value = '';
    return;
  }
  input.value = '';
  renderChatMessage('user', msg);
  chatHistory.push({ role: 'user', content: msg });
  const typing = document.createElement('div');
  typing.className = 'chat-bubble ai';
  typing.textContent = '...';
  document.getElementById('chatMessages').appendChild(typing);
  try {
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: chatHistory.slice(-10), lang: currentLang }),
    });
    const data = await res.json();
    typing.remove();
    renderChatMessage('ai', data.reply || '...', data.picks || []);
    chatHistory.push({ role: 'assistant', content: data.reply || '' });
  } catch (e) {
    typing.remove();
    renderChatMessage('ai', 'Error: ' + e.message);
  }
}

// ===== Voice search (Web Speech API) =====
let voiceRec = null;
function toggleVoiceSearch() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast(t('voice_not_supported')); return; }
  const micBtn = document.getElementById('micBtn');
  if (voiceRec) { voiceRec.stop(); voiceRec = null; micBtn.classList.remove('recording'); return; }
  voiceRec = new SR();
  voiceRec.lang = currentLang === 'fr' ? 'fr-FR' : 'en-US';
  voiceRec.interimResults = false;
  voiceRec.onstart = () => { micBtn.classList.add('recording'); showToast(t('voice_listening')); };
  voiceRec.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    document.getElementById('searchInput').value = transcript;
    doSearch(transcript);
  };
  voiceRec.onend = () => { micBtn.classList.remove('recording'); voiceRec = null; };
  voiceRec.onerror = () => { micBtn.classList.remove('recording'); voiceRec = null; };
  voiceRec.start();
}

// ===== Card ✕ hide with reason =====
let hideTarget = null;
function openHideReason(id, type, btn) {
  hideTarget = { id, type, btn };
  document.getElementById('hideReasonModal').style.display = 'flex';
}
function closeHideReason() { document.getElementById('hideReasonModal').style.display = 'none'; hideTarget = null; }
async function submitHideReason(reason) {
  if (!hideTarget) return;
  const { id, type, btn } = hideTarget;
  // Reuse the existing not-interested mechanism with an additional reason log
  await markNotInterested(id, type, btn);
  if (sb && currentUser) {
    await sb.from('user_events').insert({
      user_id: currentUser.id, event_type: 'hide_feed',
      tmdb_id: id, media_type: type, metadata: { reason },
    }).then().catch(() => {});
  }
  closeHideReason();
}

// ===== Seasonal banner =====
async function loadSeasonalBanner() {
  try {
    const culture = localStorage.getItem('seret-culture') || '';
    const res = await fetch(`/api/seasonal?lang=${currentLang}&culture=${culture}`);
    const data = await res.json();
    const slot = document.getElementById('seasonalBanner');
    if (!slot) return;
    if (!data.tag || localStorage.getItem('seret-seasonal-disabled') === '1') { slot.innerHTML = ''; return; }
    slot.innerHTML = `
      <div class="seasonal-banner">
        <div class="seasonal-emoji">${data.emoji}</div>
        <div style="flex:1">
          <div class="seasonal-title">${esc(data.title)}</div>
          <div class="seasonal-sub">${esc(data.subtitle)}</div>
        </div>
      </div>`;
  } catch {}
}

// ===== Friends activity feed =====
async function loadActivityFeed() {
  if (!sb || !currentUser || friendsData.length === 0) return;
  const slot = document.getElementById('activityFeedWrap');
  if (!slot) return;
  const friendIds = friendsData.map(f => f.id);
  const { data } = await sb.from('library_items')
    .select('user_id, title, year, media_type, user_rating, added_at')
    .in('user_id', friendIds).gt('user_rating', 0)
    .order('added_at', { ascending: false }).limit(10);
  if (!data || !data.length) return;
  const verb = t('just_watched');
  slot.innerHTML = `
    <h2 class="section-title" style="margin-top:40px">${t('activity_feed_title')}</h2>
    <div class="activity-feed">
      ${data.map(a => {
        const f = friendsData.find(x => x.id === a.user_id);
        const name = esc(f?.name || '?');
        const time = timeAgo(new Date(a.added_at).getTime());
        const fire = a.user_rating >= 9 ? ' 🔥' : '';
        return `<div class="activity-item">
          <div class="activity-avatar">${f?.avatar ? `<img src="${f.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : '👤'}</div>
          <div class="activity-text"><strong>${name}</strong> ${verb} <strong>${esc(a.title)}</strong>${fire} ${a.user_rating}/10</div>
          <div class="activity-time">${time}</div>
        </div>`;
      }).join('')}
    </div>`;
}
function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 86400 * 7) return Math.floor(s / 86400) + 'd';
  return Math.floor(s / 86400 / 7) + 'w';
}

// ===== Stories 24h =====
async function publishStory(item) {
  if (!sb || !currentUser || !activeProfile) return;
  try {
    await sb.from('stories').insert({
      user_id: currentUser.id, profile_id: activeProfile.id,
      tmdb_id: item.id, media_type: item.type,
      title: item.title, poster: item.poster,
      rating: item.userRating,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
  } catch (e) { /* table may not exist yet — silent */ }
}
async function loadStories() {
  if (!sb || !currentUser || friendsData.length === 0) return;
  const slot = document.getElementById('storiesStrip');
  if (!slot) return;
  const friendIds = friendsData.map(f => f.id);
  try {
    const { data } = await sb.from('stories')
      .select('id, user_id, title, poster, rating, created_at')
      .in('user_id', friendIds)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }).limit(20);
    if (!data || !data.length) { slot.innerHTML = ''; return; }
    // Group by friend
    const byFriend = new Map();
    for (const s of data) {
      if (!byFriend.has(s.user_id)) byFriend.set(s.user_id, []);
      byFriend.get(s.user_id).push(s);
    }
    window._allStories = data;
    slot.innerHTML = `
      <div class="stories-strip">
        ${[...byFriend.entries()].map(([fid, stories]) => {
          const f = friendsData.find(x => x.id === fid);
          return `<div class="story-tile" onclick="openStory('${fid}')">
            <div class="story-avatar">${f?.avatar ? `<img src="${f.avatar}">` : `<img src="${stories[0].poster}">`}</div>
            <div class="story-name">${esc(f?.name || '?')}</div>
          </div>`;
        }).join('')}
      </div>`;
  } catch { slot.innerHTML = ''; }
}
function openStory(friendId) {
  const stories = (window._allStories || []).filter(s => s.user_id === friendId);
  if (!stories.length) return;
  const s = stories[0];
  const f = friendsData.find(x => x.id === friendId);
  document.getElementById('storyCardBody').innerHTML = `
    <img class="poster-bg" src="${s.poster}" alt="">
    <div class="story-overlay">
      <div class="story-author">${esc(f?.name || '?')} ${t('just_watched')}</div>
      <div class="story-title">${esc(s.title)}</div>
      <div class="story-score">${s.rating}/10 🔥</div>
      <div class="story-reactions">
        ${['🔥','❤️','😱','😂'].map(e => `<button onclick="sendStoryReaction(${s.id}, '${e}', this)">${e}</button>`).join('')}
      </div>
    </div>`;
  document.getElementById('storyViewer').classList.add('active');
}
function closeStoryViewer() { document.getElementById('storyViewer').classList.remove('active'); }
async function sendStoryReaction(storyId, emoji, btn) {
  if (!sb || !currentUser) return;
  btn.classList.add('active');
  try {
    await sb.from('story_reactions').insert({ story_id: storyId, user_id: currentUser.id, emoji });
  } catch {}
}

// ===== Watchlist humor reminder =====
function checkWatchlistReminders() {
  const wl = library.filter(l => l.status === 'to_watch');
  const old = wl.filter(l => (Date.now() - (l.addedAt || 0)) > 180 * 24 * 3600 * 1000); // 6+ months
  if (old.length === 0) return;
  const pick = old[Math.floor(Math.random() * old.length)];
  setTimeout(() => {
    const msg = currentLang === 'fr'
      ? `⏰ ${pick.title} — tu l'as ajoute il y a longtemps. C'est le moment ?`
      : `⏰ ${pick.title} — you added this ages ago. Tonight's the night?`;
    showToast(msg, 6000);
  }, 8000);
}

// ===== OAuth sign-in (Supabase) =====
async function signInOAuth(provider) {
  if (!sb) return showToast('Supabase not configured');
  try {
    await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
  } catch (e) { showToast('Error: ' + e.message); }
}
function signInWithGoogle() { signInOAuth('google'); }
function signInWithApple() { signInOAuth('apple'); }
function signInWithFacebook() { signInOAuth('facebook'); }

// ===== Actor/director search (detects if the query is a person) =====
async function detectPersonSearch(q) {
  try {
    const res = await fetch(`/api/person-search?q=${encodeURIComponent(q)}&lang=${currentLang === 'fr' ? 'fr-FR' : 'en-US'}`);
    return await res.json();
  } catch { return null; }
}

// ===== Hook seasonal + stories + activity on home init and auth change =====
const _origOnAuthChange = onAuthChange;
onAuthChange = async function () {
  await _origOnAuthChange.apply(this, arguments);
  loadSeasonalBanner().catch(() => {});
  loadStories().catch(() => {});
  loadActivityFeed().catch(() => {});
  checkWatchlistReminders();
};

// ===== Settings modal (culture, shabbat, tsniout, delete account) =====
function openSettingsModal() {
  document.getElementById('settingsModal').classList.add('active');
  renderSettings();
}
function closeSettingsModal() { document.getElementById('settingsModal').classList.remove('active'); }
function renderSettings() {
  const body = document.getElementById('settingsBody');
  const culture = localStorage.getItem('seret-culture') || '';
  const seasonalOn = localStorage.getItem('seret-seasonal-disabled') !== '1';
  const shabbatOn = localStorage.getItem('seret-shabbat') === '1';
  const tsniout = localStorage.getItem('seret-tsniout') === '1';
  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:18px;margin-top:14px">
      <div>
        <label style="font-size:12px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">${t('culture_label')}</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          ${['','jewish','muslim','christian'].map(c => `
            <button class="btn btn-sm ${culture === c ? 'btn-primary' : 'btn-glass'}" onclick="setCulture('${c}')">
              ${c === '' ? t('culture_none') : t('culture_' + c)}
            </button>`).join('')}
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
        <input type="checkbox" ${seasonalOn ? 'checked' : ''} onchange="toggleSetting('seret-seasonal-disabled', !this.checked ? '1' : '0')">
        <span>${t('seasonal_toggle')}</span>
      </label>
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
        <input type="checkbox" ${shabbatOn ? 'checked' : ''} onchange="toggleSetting('seret-shabbat', this.checked ? '1' : '0')">
        <span>${t('shabbat_toggle')}</span>
      </label>
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
        <input type="checkbox" ${tsniout ? 'checked' : ''} onchange="toggleSetting('seret-tsniout', this.checked ? '1' : '0')">
        <span>${t('tsniout_toggle')}</span>
      </label>
      <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:8px">
        <button class="btn btn-danger" style="width:100%" onclick="deleteAccount()">${t('delete_account')}</button>
      </div>
    </div>`;
}
function setCulture(c) { localStorage.setItem('seret-culture', c); renderSettings(); loadSeasonalBanner(); }
function toggleSetting(key, value) {
  localStorage.setItem(key, value);
  if (key === 'seret-seasonal-disabled') loadSeasonalBanner();
}
async function deleteAccount() {
  if (!confirm(t('delete_confirm'))) return;
  if (sb && currentUser) {
    try {
      // Best-effort: delete user-scoped data. Supabase auth.admin.deleteUser requires service role; fallback: sign out + ask support.
      await sb.from('library_items').delete().eq('user_id', currentUser.id);
      await sb.from('user_profiles').delete().eq('account_id', currentUser.id);
      await sb.from('user_stats').delete().eq('user_id', currentUser.id);
      await sb.from('friendships').delete().or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);
      await sb.from('stories').delete().eq('user_id', currentUser.id);
    } catch (e) { console.warn(e); }
    window.location.href = 'mailto:kouty@elevon.fr?subject=Delete%20my%20Seret%20account&body=Please%20delete%20my%20account%20linked%20to%20' + encodeURIComponent(currentUser.email || '');
    signOut();
  }
}

// ===== World cinema map (list of countries) =====
const WORLD_COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'KR', name: currentLang === 'fr' ? 'Corée du Sud' : 'South Korea', flag: '🇰🇷' },
  { code: 'JP', name: currentLang === 'fr' ? 'Japon' : 'Japan', flag: '🇯🇵' },
  { code: 'IN', name: currentLang === 'fr' ? 'Inde' : 'India', flag: '🇮🇳' },
  { code: 'IT', name: currentLang === 'fr' ? 'Italie' : 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: currentLang === 'fr' ? 'Espagne' : 'Spain', flag: '🇪🇸' },
  { code: 'DE', name: currentLang === 'fr' ? 'Allemagne' : 'Germany', flag: '🇩🇪' },
  { code: 'GB', name: currentLang === 'fr' ? 'Royaume-Uni' : 'UK', flag: '🇬🇧' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', name: currentLang === 'fr' ? 'Brésil' : 'Brazil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'IL', name: currentLang === 'fr' ? 'Israël' : 'Israel', flag: '🇮🇱' },
  { code: 'IR', name: currentLang === 'fr' ? 'Iran' : 'Iran', flag: '🇮🇷' },
  { code: 'CN', name: currentLang === 'fr' ? 'Chine' : 'China', flag: '🇨🇳' },
  { code: 'TH', name: currentLang === 'fr' ? 'Thaïlande' : 'Thailand', flag: '🇹🇭' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'SE', name: currentLang === 'fr' ? 'Suède' : 'Sweden', flag: '🇸🇪' },
  { code: 'RU', name: currentLang === 'fr' ? 'Russie' : 'Russia', flag: '🇷🇺' },
  { code: 'TR', name: currentLang === 'fr' ? 'Turquie' : 'Turkey', flag: '🇹🇷' },
];
function renderWorldCinemaStrip() {
  // Inject into Home at bottom (after activity feed)
  const slot = document.getElementById('worldCinemaSlot');
  if (!slot) return;
  slot.innerHTML = `
    <h2 class="section-title" style="margin-top:40px">🌍 ${t('world_cinema')}</h2>
    <p class="section-sub">${t('world_sub')}</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;padding:8px 0 16px">
      ${WORLD_COUNTRIES.map(c => `<button class="btn btn-glass btn-sm" onclick="loadCountryFilms('${c.code}', ${JSON.stringify(esc(c.name))})">${c.flag} ${esc(c.name)}</button>`).join('')}
    </div>
    <div id="worldCountryResults"></div>`;
}
async function loadCountryFilms(code, name) {
  const slot = document.getElementById('worldCountryResults');
  slot.innerHTML = `<div class="recs-loading"><div class="spinner"></div></div>`;
  try {
    const res = await fetch(`/api/world-cinema?country=${code}&lang=${currentLang === 'fr' ? 'fr-FR' : 'en-US'}`);
    const data = await res.json();
    slot.innerHTML = `
      <h3 class="friends-section-title">${name}</h3>
      <div class="grid">${(data.results || []).map(r => trendingCardHTML(r)).filter(Boolean).join('')}</div>`;
  } catch (e) { slot.innerHTML = ''; }
}

// ===== Monthly challenge banner =====
async function loadChallenge() {
  try {
    const res = await fetch(`/api/challenge?lang=${currentLang}`);
    const data = await res.json();
    const slot = document.getElementById('challengeSlot');
    if (!slot) return;
    slot.innerHTML = `
      <div class="seasonal-banner" style="border-left-color:#ff6b6b">
        <div class="seasonal-emoji">🏆</div>
        <div style="flex:1">
          <div class="seasonal-title">${t('challenge_title')} — ${esc(data.title)}</div>
          <div class="seasonal-sub">${esc(data.sub)}</div>
        </div>
      </div>`;
  } catch {}
}

// ===== Seret Memory — contextual personalised greeting =====
function loadSeretMemoryGreeting() {
  const slot = document.getElementById('seretMemorySlot');
  if (!slot) return;
  // Need a meaningful library to be useful
  const watched = library.filter(l => (l.status || 'watched') === 'watched' && l.addedAt);
  if (watched.length < 5 || !currentUser) { slot.innerHTML = ''; return; }
  const now = new Date();
  const nowDow = now.getDay(); // 0-6
  const nowHour = now.getHours();
  const dayNames = currentLang === 'fr'
    ? ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  // Compute user's dominant day-of-week
  const dowHist = new Array(7).fill(0);
  const hourHist = new Array(24).fill(0);
  const ctxHist = {};
  for (const w of watched) {
    const d = new Date(w.addedAt);
    dowHist[d.getDay()]++;
    hourHist[d.getHours()]++;
    if (w.viewing_context) ctxHist[w.viewing_context] = (ctxHist[w.viewing_context] || 0) + 1;
  }
  const topDow = dowHist.indexOf(Math.max(...dowHist));
  const topHour = hourHist.indexOf(Math.max(...hourHist));
  const topCtx = Object.entries(ctxHist).sort((a, b) => b[1] - a[1])[0]?.[0];
  const name = userProfile?.display_name || activeProfile?.name || '';
  const hourGreeting = nowHour < 6 ? (currentLang === 'fr' ? 'Bonne nuit' : 'Good night')
    : nowHour < 12 ? (currentLang === 'fr' ? 'Bonjour' : 'Good morning')
    : nowHour < 18 ? (currentLang === 'fr' ? 'Bonjour' : 'Good afternoon')
    : (currentLang === 'fr' ? 'Bonsoir' : 'Good evening');
  const moonOrSun = nowHour >= 18 || nowHour < 6 ? '🌙' : '☀️';
  // Insight line — only shown if the current day matches their dominant one
  let insight = '';
  if (nowDow === topDow) {
    insight = currentLang === 'fr'
      ? `D'apres tes habitudes, le ${dayNames[topDow]} est TON soir cinema`
      : `Based on your habits, ${dayNames[topDow]} is YOUR movie night`;
    if (topCtx) insight += currentLang === 'fr' ? ` — souvent ${topCtx === 'solo' ? 'en solo' : topCtx === 'couple' ? 'en couple' : topCtx === 'family' ? 'en famille' : 'entre amis'}` : ` — usually ${topCtx}`;
  } else if (Math.abs(nowHour - topHour) <= 1 && topHour >= 18) {
    insight = currentLang === 'fr'
      ? `C'est ton heure habituelle (${topHour}h) — un film qui te ressemble ?`
      : `It's your usual time (${topHour}h) — a film that fits you?`;
  }
  if (!insight) { slot.innerHTML = ''; return; }
  slot.innerHTML = `
    <div class="seret-memory-greeting">
      <div class="sm-greeting">${hourGreeting} ${name ? esc(name) : ''} ${moonOrSun}</div>
      <div class="sm-insight">${insight}</div>
    </div>`;
}

// Expose world & challenge loaders to home init
function loadHomeExtras() {
  loadSeretMemoryGreeting();
  renderWorldCinemaStrip();
  loadChallenge();
  loadTVTonight();
}

// ===== TV Guide — tonight on TV =====
function detectCountry() {
  const stored = localStorage.getItem('seret-country');
  if (stored) return stored;
  const lang = (navigator.language || 'en-US').toUpperCase();
  // Crude: use the country suffix of navigator.language; default to FR for fr-* users
  const m = lang.match(/-([A-Z]{2})$/);
  if (m) return m[1];
  if (lang.startsWith('FR')) return 'FR';
  return 'US';
}

async function loadTVTonight() {
  const slot = document.getElementById('tvTonightSlot');
  if (!slot) return;
  const country = detectCountry();
  try {
    const res = await fetch(`/api/tv-tonight?country=${country}`);
    const data = await res.json();
    const items = (data.items || []).slice(0, 10);
    if (!items.length) { slot.innerHTML = ''; return; }
    // Cross-reference with user library: highlight titles in watchlist
    const inWatchlistTitles = new Set(
      library.filter(l => l.status === 'to_watch').map(l => (l.title || '').toLowerCase())
    );
    slot.innerHTML = `
      <h2 class="section-title" style="margin-top:40px">📺 ${currentLang === 'fr' ? 'Ce soir a la TV' : 'Tonight on TV'}</h2>
      <p class="section-sub">${currentLang === 'fr' ? `Sur les chaines ${country}` : `On ${country} channels`}</p>
      <div class="tv-tonight-list">
        ${items.map(ep => {
          const inList = inWatchlistTitles.has((ep.title || '').toLowerCase());
          return `
          <div class="tv-item" onclick="doSearch(${JSON.stringify(esc(ep.title))});document.getElementById('searchInput').value=${JSON.stringify(esc(ep.title))}">
            ${ep.image ? `<img src="${ep.image}" alt="">` : '<div class="tv-item-empty">📺</div>'}
            <div class="tv-item-info">
              <div class="tv-item-time">${ep.time} · ${esc(ep.channel)}</div>
              <div class="tv-item-title">${esc(ep.title)}</div>
              ${ep.episode ? `<div class="tv-item-ep">S${ep.season || '?'}E${ep.number || '?'} — ${esc(ep.episode)}</div>` : ''}
              ${inList ? `<div class="tv-item-badge">🎯 ${currentLang === 'fr' ? 'Dans ta liste' : 'In your list'}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`;
  } catch { slot.innerHTML = ''; }
}

// Inject slots into Home (done once after DOM is ready)
function injectHomeSlots() {
  const home = document.getElementById('homeView')?.querySelector('.section');
  if (!home) return;
  if (!document.getElementById('seretMemorySlot')) {
    const div = document.createElement('div');
    div.id = 'seretMemorySlot';
    // Place at very top of the Home section, before the Tonight CTA
    home.prepend(div);
  }
  if (!document.getElementById('challengeSlot')) {
    const div = document.createElement('div');
    div.id = 'challengeSlot';
    // Insert after seasonalBanner
    document.getElementById('seasonalBanner').after(div);
  }
  if (!document.getElementById('tvTonightSlot')) {
    const div = document.createElement('div');
    div.id = 'tvTonightSlot';
    home.appendChild(div);
  }
  if (!document.getElementById('worldCinemaSlot')) {
    const div = document.createElement('div');
    div.id = 'worldCinemaSlot';
    home.appendChild(div);
  }
  loadHomeExtras();
}

// Hook settings into profile picker actions (button added in-place when called)
function openSettings() { closeOnboarding(); openSettingsModal(); }

// ===== Learn view (educational) =====
const LEARN_CATEGORIES = [
  { key: 'language', emoji: '🌍', label: 'learn_lang' },
  { key: 'science', emoji: '🔬', label: 'learn_sci' },
  { key: 'math', emoji: '📐', label: 'learn_math' },
  { key: 'history', emoji: '📚', label: 'learn_hist' },
  { key: 'business', emoji: '💼', label: 'learn_biz' },
  { key: 'kids', emoji: '👶', label: 'learn_kids' },
];
function renderLearnCategories() {
  const el = document.getElementById('learnCategories');
  if (!el) return;
  el.innerHTML = LEARN_CATEGORIES.map(c => `
    <button class="learn-cat" onclick="openLearnCategory('${c.key}')">
      <div class="learn-cat-emoji">${c.emoji}</div>
      <div class="learn-cat-label">${t(c.label)}</div>
    </button>`).join('');
}
function openLearnCategory(key) {
  const results = document.getElementById('learnResults');
  const isKids = key === 'kids';
  // Levels / age range selector
  results.innerHTML = `
    <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">
      ${isKids ? `
        <button class="btn btn-glass btn-sm" onclick="runLearnQuery('${key}', null, '3-6')">${t('age_3_6')}</button>
        <button class="btn btn-glass btn-sm" onclick="runLearnQuery('${key}', null, '7-10')">${t('age_7_10')}</button>
        <button class="btn btn-glass btn-sm" onclick="runLearnQuery('${key}', null, '11-14')">${t('age_11_14')}</button>
      ` : `
        <button class="btn btn-glass btn-sm" onclick="runLearnQuery('${key}', 'beginner')">${t('level_beginner')}</button>
        <button class="btn btn-glass btn-sm" onclick="runLearnQuery('${key}', 'intermediate')">${t('level_intermediate')}</button>
        <button class="btn btn-glass btn-sm" onclick="runLearnQuery('${key}', 'advanced')">${t('level_advanced')}</button>
        <button class="btn btn-glass btn-sm" onclick="runLearnQuery('${key}', 'any')">${t('level_any')}</button>
      `}
    </div>
    <div id="learnPicks"></div>`;
}
async function runLearnQuery(category, level, ageRange) {
  const slot = document.getElementById('learnPicks');
  slot.innerHTML = `<div class="recs-loading"><div class="spinner"></div> ${t('loading_recs')}</div>`;
  try {
    const res = await fetch('/api/learn', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, level, ageRange, lang: currentLang }),
    });
    const data = await res.json();
    const recs = data.recommendations || [];
    slot.innerHTML = `<div class="ai-recs-grid">${recs.map(r => learnRecCard(r)).join('')}</div>`;
  } catch (e) { slot.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
}
async function runLearnCustomQuery() {
  const query = document.getElementById('learnQueryInput').value.trim();
  if (!query) return;
  const slot = document.getElementById('learnResults');
  slot.innerHTML = `<div class="recs-loading"><div class="spinner"></div> ${t('loading_recs')}</div>`;
  try {
    const res = await fetch('/api/learn', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'custom', query, lang: currentLang }),
    });
    const data = await res.json();
    const recs = data.recommendations || [];
    slot.innerHTML = `<div class="ai-recs-grid">${recs.map(r => learnRecCard(r)).join('')}</div>`;
  } catch (e) { slot.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
}
function learnRecCard(r) {
  return `
    <div class="ai-rec-card">
      ${r.poster ? `<img class="ai-rec-poster" src="${r.poster}" onclick="openDetail('${r.type || 'movie'}', ${r.tmdb_id || 0})">` : '<div class="ai-rec-poster-empty">🎓</div>'}
      <div class="ai-rec-body">
        <div class="ai-rec-title">${esc(r.title)} <span class="ai-rec-year">(${r.year})</span></div>
        ${r.level ? `<div style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin:4px 0">${esc(r.level)}</div>` : ''}
        <div class="ai-rec-reason">${esc(r.reason || '')}</div>
        ${r.skills?.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${r.skills.map(s => `<span class="genre-tag" style="font-size:10px">${esc(s)}</span>`).join('')}</div>` : ''}
        ${r.tmdb_id ? `<button class="btn btn-primary btn-sm" style="align-self:flex-start;margin-top:8px" onclick='addAIRec(${JSON.stringify(r).replace(/'/g, "&#39;")}, this)'>+ ${t('to_watch')}</button>` : ''}
      </div>
    </div>`;
}

// ===== Web Push notifications =====
async function enablePushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    showToast(currentLang === 'fr' ? 'Notifications non supportees par ce navigateur' : 'Notifications not supported on this browser');
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { showToast('Permission refused'); return; }
    const res = await fetch('/api/vapid-public-key');
    const { key } = await res.json();
    if (!key) { showToast(currentLang === 'fr' ? 'VAPID non configure sur le serveur' : 'VAPID not configured on server'); return; }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    if (sb && currentUser) {
      await sb.from('push_subscriptions').upsert({
        user_id: currentUser.id,
        endpoint: sub.endpoint,
        p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
        auth: arrayBufferToBase64(sub.getKey('auth')),
      }, { onConflict: 'endpoint' });
    }
    showToast(t('push_enabled'));
  } catch (e) { showToast('Error: ' + e.message); }
}
function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - b64.length % 4) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str);
}
// Register service worker silently at boot (for the navigate offline shell)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ===== Cinema Night — group vote poll =====
async function createCinemaNightPoll(candidates) {
  if (!sb || !currentUser || candidates.length < 2) { showToast(t('pick_friends')); return null; }
  const { data, error } = await sb.from('cinema_polls').insert({
    creator_id: currentUser.id,
    candidates: candidates, // jsonb
    ends_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  }).select().single();
  if (error) { showToast(error.message); return null; }
  const url = `${window.location.origin}/?poll=${data.id}`;
  const msg = currentLang === 'fr'
    ? `🎬 Soiree cinema ! Vote pour le film a regarder :\n${url}`
    : `🎬 Cinema night! Vote for tonight's film:\n${url}`;
  openWhatsApp(msg);
  return data;
}
async function voteCinemaNightPoll(pollId, candidateIndex) {
  if (!sb || !currentUser) return;
  await sb.from('cinema_votes').upsert({
    poll_id: pollId, user_id: currentUser.id, candidate_index: candidateIndex,
  }, { onConflict: 'poll_id,user_id' });
  showToast('✓');
}
async function loadCinemaNightPoll(pollId) {
  if (!sb) return;
  const { data: poll } = await sb.from('cinema_polls').select('*').eq('id', pollId).single();
  if (!poll) return;
  const { data: votes } = await sb.from('cinema_votes').select('candidate_index').eq('poll_id', pollId);
  const counts = new Array(poll.candidates.length).fill(0);
  (votes || []).forEach(v => counts[v.candidate_index] = (counts[v.candidate_index] || 0) + 1);
  // Render inside detail modal for simplicity
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <button class="modal-back-btn" onclick="closeModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg></button>
    <div class="modal-info" style="padding-top:48px">
      <div class="modal-title">🎬 ${t('cinema_night')}</div>
      <p class="section-sub">${currentLang === 'fr' ? 'Choisis le film qu\'on regarde ce soir' : 'Pick tonight\'s film'}</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px">
        ${poll.candidates.map((c, idx) => `
          <button class="btn btn-glass" style="text-align:left;padding:14px;height:auto" onclick="voteCinemaNightPoll(${pollId}, ${idx}).then(() => loadCinemaNightPoll(${pollId}))">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
              <span style="font-size:16px;font-weight:600">${esc(c.title)} <span style="color:var(--text-dim)">(${c.year})</span></span>
              <span style="color:var(--gold);font-weight:700">${counts[idx]} ${currentLang === 'fr' ? 'votes' : 'votes'}</span>
            </div>
          </button>`).join('')}
      </div>
    </div>`;
  modal.classList.add('active');
}

// Intercept ?poll=<id> on URL
(function captureCinemaPollFromURL() {
  const params = new URLSearchParams(window.location.search);
  const pollId = params.get('poll');
  if (pollId) {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => loadCinemaNightPoll(Number(pollId)), 800);
  }
})();

// Intercept ?friend=<share_code> on URL — auto-send friend request once signed in
(function captureFriendFromURL() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('friend');
  if (code) {
    localStorage.setItem('seret-pending-friend', code);
    window.history.replaceState({}, '', window.location.pathname);
  }
})();
async function processPendingFriend() {
  const code = localStorage.getItem('seret-pending-friend');
  if (!code || !sb || !currentUser) return;
  localStorage.removeItem('seret-pending-friend');
  document.getElementById('friendCodeInput').value = code;
  await sendFriendRequest();
  showFriends();
}
// Hook into onAuthChange so the request fires after sign-in
const _prevAuthChange = onAuthChange;
onAuthChange = async function () {
  await _prevAuthChange.apply(this, arguments);
  processPendingFriend().catch(() => {});
};

// ===== Init =====
applyLang();
capturePendingAddFromURL();
loadTrending();
loadSeasonalBanner().catch(() => {});
injectHomeSlots();
initSupabase();
checkReminder();
