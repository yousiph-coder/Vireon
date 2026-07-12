/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║   Vireon — Bilingual i18n System (Arabic / English)     ║
 * ║   Usage: import and call initI18n() on DOMContentLoaded ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Any element with data-i18n="key" gets its textContent
 * swapped when the user toggles language.
 * Elements with data-i18n-placeholder="key" get their
 * placeholder attribute swapped.
 * Elements with data-i18n-html="key" get innerHTML swapped.
 */

export const translations = {
  ar: {
    // ── Navbar (Landing) ──────────────────────────────────────
    'nav.features':   'المميزات',
    'nav.how':        'كيف يعمل؟',
    'nav.pricing':    'الأسعار',
    'nav.faq':        'الأسئلة الشائعة',
    'nav.login':      'تسجيل الدخول',
    'nav.signup':     'نسخة تجريبية مجانية ✦',
    'nav.badge':      '🔥 أول silence remover عربي',
    'nav.lang':       'EN',

    // ── Hero ──────────────────────────────────────────────────
    'hero.headline':  'اشيل السكتات<br><span class="text-gradient">بـ AI فعلي</span>',
    'hero.sub':       'AI يفهم العربي والإنجليزي — بدون ما تفتح أي برنامج ثاني',
    'hero.badge1.title': 'لا يطلب خبرة مونتاج',
    'hero.badge1.desc':  'سهل وسريع',
    'hero.badge2.title': 'يدعم اللهجات العربية',
    'hero.badge2.desc':  'ودقة عالية',
    'hero.cta.primary':  'ابدأ مجاناً ✨',
    'hero.cta.secondary':'▷ شوف كيف يعمل',
    'hero.spec1':        'تصدير بجودة 4K',
    'hero.spec2':        'يدعم الصيغ الشائعة',
    'hero.waveform.status': 'المعالجة الجارية: إزالة السكتات تلقائياً',
    'hero.waveform.dur': 'المدة: (1:15)',
    'hero.waveform.removed': '3 سكتات تم إزالتها',
    'hero.waveform.saved': 'الوقت المحفوظ: 4.5 ث',

    // ── How it works ──────────────────────────────────────────
    'how.badge':  '⚡ ثلاث خطوات بسيطة',
    'how.title':  'كيف يعمل Vireon؟',
    'how.sub':    'أذكى وأسرع طريقة لتنظيف مقاطع الصوت والفيديو بالذكاء الاصطناعي',
    'how.step1.title': 'ارفع الفيديو',
    'how.step1.desc':  'اسحب أي فيديو بصيغة MP4 أو MOV أو AVI أو MKV — حتى 2 جيجابايت',
    'how.step2.title': 'الـ AI يحلل',
    'how.step2.desc':  'نموذج Whisper يكتشف كل لحظة صمت بدقة ملي-ثانية عبر تحليل الموجة الصوتية',
    'how.step3.title': 'حمّل النتيجة',
    'how.step3.desc':  'فيديو نظيف بدون سكتات جاهز للتصدير فوراً — MP4 أو XML أو EDL',

    // ── Features ──────────────────────────────────────────────
    'feat.badge': '🚀 المميزات الحصرية',
    'feat.title': 'المميزات التي تميّزنا',
    'feat.sub':   'أدوات احترافية مبنية خصيصاً لصانعي المحتوى العرب',
    'feat.1.title': 'دعم اللغة العربية 100%',
    'feat.1.desc':  'الوحيد في المنطقة الذي يفهم اللهجات العربية المختلفة بدقة عالية',
    'feat.2.title': 'كشف الصمت الذكي',
    'feat.2.desc':  'يكتشف ويزيل السكتات الصوتية تلقائياً بدقة تصل إلى 0.1 ثانية',
    'feat.3.title': 'Timeline تفاعلية',
    'feat.3.desc':  'راجع وعدّل القطعات يدوياً قبل التصدير النهائي',
    'feat.4.title': 'صيغ تصدير متعددة',
    'feat.4.desc':  'صدّر الفيديو المقطوع أو XML لـ Premiere أو EDL لـ DaVinci',
    'feat.5.title': 'معالجة سريعة بالسحابة',
    'feat.5.desc':  'لا تحتاج لتثبيت أي برنامج — كل شيء يعمل من المتصفح مباشرة',
    'feat.6.title': 'خصوصية تامة',
    'feat.6.desc':  'ملفاتك تُحذف تلقائياً بعد 24 ساعة من الرفع',

    // ── Pricing ───────────────────────────────────────────────
    'pricing.badge':  '💎 اختر الباقة المناسبة',
    'pricing.title':  'أسعار تناسب الجميع',
    'pricing.sub':    'ابدأ مجاناً وطوّر تجربتك عند الحاجة',

    // ── FAQ ───────────────────────────────────────────────────
    'faq.badge':  '❓ أسئلة شائعة',
    'faq.title':  'أسئلة يسألها الجميع',
    'faq.sub':    'إجابات واضحة لأكثر الأسئلة شيوعاً',

    // ── CTA Bottom ────────────────────────────────────────────
    'cta.title':  'جاهز تبدأ الآن؟',
    'cta.sub':    'انضم لآلاف صانعي المحتوى اللي شالوا السكتات من مقاطعهم',
    'cta.btn':    'ابدأ مجاناً ✨',

    // ── Footer ────────────────────────────────────────────────
    'footer.tagline': 'أذكى أداة لإزالة السكتات الصوتية تلقائياً بالذكاء الاصطناعي',
    'footer.col2':    'المنتج',
    'footer.col3':    'الشركة',
    'footer.col4':    'قانوني',
    'footer.rights':  '© 2025 Vireon. جميع الحقوق محفوظة.',

    // ── Auth ──────────────────────────────────────────────────
    'login.title':    'مرحباً بعودتك 👋',
    'login.sub':      'سجّل دخولك للوصول لاستوديو التحرير الذكي',
    'login.email':    'البريد الإلكتروني',
    'login.password': 'كلمة المرور',
    'login.forgot':   'نسيت كلمة المرور؟',
    'login.btn':      'تسجيل الدخول',
    'login.no.account': 'ليس لديك حساب؟',
    'login.signup':   'أنشئ حساباً مجانياً',

    'signup.title':   'إنشاء حساب جديد',
    'signup.sub':     'انضم وابدأ تجربتك المجانية الآن',
    'signup.name':    'الاسم الكامل',
    'signup.email':   'البريد الإلكتروني',
    'signup.password':'كلمة المرور',
    'signup.btn':     'إنشاء الحساب',
    'signup.has.account': 'لديك حساب بالفعل؟',
    'signup.login':   'تسجيل الدخول',
    'forgot.sub':     'أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين',
    'forgot.btn':      'إرسال رابط الاستعادة',
    'forgot.back':     'العودة إلى تسجيل الدخول',

    // ── Dashboard ─────────────────────────────────────────────
    'dash.welcome':        'الرئيسية 🏠',
    'dash.topbar.sub':     'استوديو التحكم الذكي لقص الفيديوهات',
    'dash.stat.minutes':   'الدقائق المستخدمة',
    'dash.stat.videos':    'الفيديوهات المعالجة',
    'dash.stat.plan':      'الباقة الحالية',
    'dash.banner.title':   'جاهز تشيل السكتات؟',
    'dash.banner.sub':     'ارفع فيديو جديد وخلي الذكاء الاصطناعي يعمل اللازم في ثواني',
    'dash.banner.btn':     'ارفع فيديو جديد ✂️',
    'dash.recent.title':   'آخر المقاطع المعالجة',
    'dash.empty.title':    'لا توجد فيديوهات معالجة بعد',
    'dash.empty.sub':      'ارفع أول فيديو لك بالذكاء الاصطناعي لتجربة ميزة إزالة الفراغات الفائقة',
    'dash.empty.btn':      'ارفع فيديو الآن',
    'dash.logout':         'تسجيل الخروج',

    // ── Sidebar nav ───────────────────────────────────────────
    'nav.dash.home':     'الرئيسية',
    'nav.dash.fulledit': 'التعديل الكامل (AI Full Edit)',
    'nav.dash.editor':   'إزالة السكتات',
    'nav.dash.captions': 'توليد النصوص',
    'nav.dash.repetitions': 'إزالة التكرارات',
    'nav.dash.videos':   'فيديوهاتي',
    'nav.dash.settings': 'الإعدادات',
    'nav.dash.account':  'حسابي',
    'nav.dash.admin':    'إدارة المنصة',
    'topbar.home':       'الرئيسية',
    'topbar.fulledit':   'التعديل الكامل بـ AI',
    'topbar.editor':     'استوديو إزالة السكتات',
    'topbar.captions':   'توليد نصوص الشاشة',
    'topbar.repetitions':'إزالة التكرارات بـ AI',
    'topbar.videos':     'فيديوهاتي',
    'topbar.settings':   'الإعدادات',
    'topbar.account':    'حسابي',
    'topbar.admin':      'إدارة المنصة',
    'admin.sub':         'لوحة تحكم إدارية شاملة لمراقبة المستخدمين والتكاليف والمفاتيح',

    // ── Editor ────────────────────────────────────────────────
    'editor.title':   'استوديو إزالة السكتات الذكي',
    'editor.sub':     'ارفع المقطع الخاص بك وسيقوم الـ AI بإزالة الفراغات الصوتية تلقائياً في ثوانٍ',
    'editor.drop':    '☁️ اسحب ملف الفيديو وضعه هنا',
    'editor.drop.sub':'الصيغ المدعومة: MP4, MOV, AVI, MKV — الحد الأقصى: 2 جيجابايت',
    'editor.browse':  'استعرض الملفات من جهازك',
    'editor.lang.label': '🌐 لغة المحتوى',
    'editor.start':   'ابدأ المعالجة',
    'editor.cancel':  'إلغاء',
    'proc.uploading': 'جاري رفع الفيديو...',
    'proc.analyzing': 'الـ AI بيحلل الصوت...',

    // ── Videos ────────────────────────────────────────────────
    'videos.title':   'مكتبة فيديوهاتي المعالجة',
    'videos.sub':     'استعرض وحمّل مقاطعك التي تمت إزالة السكتات منها',

    // ── Settings ──────────────────────────────────────────────
    'settings.title': 'إعدادات المونتاج الذكي ⚙️',
    'settings.sub':   'خصّص تفضيلات خوارزميات الـ AI وطريقة قطع وسحب الفراغات',
    'settings.save':  'حفظ إعدادات المونتاج',

    // ── Account ───────────────────────────────────────────────
    'account.title':  'إعدادات حسابي الشخصي 👤',
    'account.sub':    'تفاصيل اشتراكك، الرصيد المتبقي، والوصول البرمجي للـ API',
    'account.upgrade':'الترقية الآن ✨',
    'account.upgrade2':'ترقية الباقة الآن 🔥',
  },

  en: {
    // ── Navbar (Landing) ──────────────────────────────────────
    'nav.features':   'Features',
    'nav.how':        'How it works',
    'nav.pricing':    'Pricing',
    'nav.faq':        'FAQ',
    'nav.login':      'Log in',
    'nav.signup':     'Free Trial ✦',
    'nav.badge':      '🔥 First Arabic silence remover',
    'nav.lang':       'AR',

    // ── Hero ──────────────────────────────────────────────────
    'hero.headline':  'Remove Silences<br><span class="text-gradient">with Real AI</span>',
    'hero.sub':       'AI that understands Arabic & English — no extra software needed',
    'hero.badge1.title': 'Zero editing experience needed',
    'hero.badge1.desc':  'Simple & fast',
    'hero.badge2.title': 'Supports Arabic dialects',
    'hero.badge2.desc':  'With high accuracy',
    'hero.cta.primary':  'Start for Free ✨',
    'hero.cta.secondary':'▷ See how it works',
    'hero.spec1':        '4K export quality',
    'hero.spec2':        'All major formats',
    'hero.waveform.status': 'Processing: Removing silences automatically',
    'hero.waveform.dur': 'Duration: (1:15)',
    'hero.waveform.removed': '3 silences removed',
    'hero.waveform.saved': 'Time saved: 4.5s',

    // ── How it works ──────────────────────────────────────────
    'how.badge':  '⚡ Three simple steps',
    'how.title':  'How does Vireon work?',
    'how.sub':    'The smartest & fastest way to clean audio and video using AI',
    'how.step1.title': 'Upload your video',
    'how.step1.desc':  'Drag any MP4, MOV, AVI or MKV file — up to 2 GB',
    'how.step2.title': 'AI analyzes',
    'how.step2.desc':  "Whisper AI detects every silence with millisecond precision by analyzing the audio waveform",
    'how.step3.title': 'Download the result',
    'how.step3.desc':  'A clean video without silences, ready to export instantly — MP4, XML, or EDL',

    // ── Features ──────────────────────────────────────────────
    'feat.badge': '🚀 Exclusive features',
    'feat.title': 'Features that set us apart',
    'feat.sub':   'Professional tools built specifically for Arabic content creators',
    'feat.1.title': '100% Arabic language support',
    'feat.1.desc':  'The only tool in the region that understands different Arabic dialects with high accuracy',
    'feat.2.title': 'Smart silence detection',
    'feat.2.desc':  'Automatically detects and removes audio silences with 0.1-second precision',
    'feat.3.title': 'Interactive timeline',
    'feat.3.desc':  'Review and edit cuts manually before the final export',
    'feat.4.title': 'Multiple export formats',
    'feat.4.desc':  'Export the cut video, XML for Premiere, or EDL for DaVinci',
    'feat.5.title': 'Fast cloud processing',
    'feat.5.desc':  'No software to install — everything works directly in your browser',
    'feat.6.title': 'Full privacy',
    'feat.6.desc':  'Your files are automatically deleted 24 hours after upload',

    // ── Pricing ───────────────────────────────────────────────
    'pricing.badge':  '💎 Choose your plan',
    'pricing.title':  'Pricing for everyone',
    'pricing.sub':    'Start free and upgrade when you need more',

    // ── FAQ ───────────────────────────────────────────────────
    'faq.badge':  '❓ Frequently asked questions',
    'faq.title':  'Questions everyone asks',
    'faq.sub':    'Clear answers to the most common questions',

    // ── CTA Bottom ────────────────────────────────────────────
    'cta.title':  'Ready to get started?',
    'cta.sub':    'Join thousands of content creators who removed silences from their videos',
    'cta.btn':    'Start for Free ✨',

    // ── Footer ────────────────────────────────────────────────
    'footer.tagline': 'The smartest AI-powered tool for automatic silence removal',
    'footer.col2':    'Product',
    'footer.col3':    'Company',
    'footer.col4':    'Legal',
    'footer.rights':  '© 2025 Vireon. All rights reserved.',

    // ── Auth ──────────────────────────────────────────────────
    'login.title':    'Welcome back 👋',
    'login.sub':      'Log in to access your AI editing studio',
    'login.email':    'Email address',
    'login.password': 'Password',
    'login.forgot':   'Forgot password?',
    'login.btn':      'Log in',
    'login.no.account': "Don't have an account?",
    'login.signup':   'Create a free account',

    'signup.title':   'Create a new account',
    'signup.sub':     'Join and start your free trial now',
    'signup.name':    'Full name',
    'signup.email':   'Email address',
    'signup.password':'Password',
    'signup.btn':     'Create account',
    'signup.has.account': 'Already have an account?',
    'signup.login':   'Log in',
    'forgot.sub':     'Enter your email address to receive a recovery link',
    'forgot.btn':      'Send Recovery Link',
    'forgot.back':     'Back to login',

    // ── Dashboard ─────────────────────────────────────────────
    'dash.welcome':        'Home 🏠',
    'dash.topbar.sub':     'Your AI-powered video editing studio',
    'dash.stat.minutes':   'Minutes used',
    'dash.stat.videos':    'Videos processed',
    'dash.stat.plan':      'Current plan',
    'dash.banner.title':   'Ready to remove silences?',
    'dash.banner.sub':     'Upload a new video and let the AI do the work in seconds',
    'dash.banner.btn':     'Upload New Video ✂️',
    'dash.recent.title':   'Recently Processed Videos',
    'dash.empty.title':    'No processed videos yet',
    'dash.empty.sub':      'Upload your first AI-powered video to experience automatic silence removal',
    'dash.empty.btn':      'Upload a video now',
    'dash.logout':         'Log out',

    // ── Sidebar nav ───────────────────────────────────────────
    'nav.dash.home':     'Home',
    'nav.dash.fulledit': 'AI Full Edit',
    'nav.dash.editor':   'Remove Silences',
    'nav.dash.captions': 'Auto Captions',
    'nav.dash.repetitions': 'Remove Repetitions',
    'nav.dash.videos':   'My Videos',
    'nav.dash.settings': 'Settings',
    'nav.dash.account':  'My Account',
    'nav.dash.admin':    'Platform Admin',
    'topbar.home':       'Home',
    'topbar.fulledit':   'AI Full Edit',
    'topbar.editor':     'Remove Silences',
    'topbar.captions':   'Auto Captions Studio',
    'topbar.repetitions':'Remove Repetitions',
    'topbar.videos':     'My Videos',
    'topbar.settings':   'Settings',
    'topbar.account':    'My Account',
    'topbar.admin':      'Platform Admin',
    'admin.sub':         'Comprehensive control console for users, costs, and keys',

    // ── Editor ────────────────────────────────────────────────
    'editor.title':   'AI Silence Removal Studio',
    'editor.sub':     'Upload your clip and the AI will automatically remove audio gaps in seconds',
    'editor.drop':    '☁️ Drag & drop your video file here',
    'editor.drop.sub':'Supported formats: MP4, MOV, AVI, MKV — Max: 2 GB',
    'editor.browse':  'Browse files on your device',
    'editor.lang.label': '🌐 Content language',
    'editor.start':   'Start Processing',
    'editor.cancel':  'Cancel',
    'proc.uploading': 'Uploading video...',
    'proc.analyzing': 'AI is analyzing audio...',

    // ── Videos ────────────────────────────────────────────────
    'videos.title':   'My Processed Videos Library',
    'videos.sub':     'Browse and download your silence-removed clips',

    // ── Settings ──────────────────────────────────────────────
    'settings.title': 'AI Editing Preferences ⚙️',
    'settings.sub':   'Customize AI algorithm preferences and silence cutting behavior',
    'settings.save':  'Save Editing Settings',

    // ── Account ───────────────────────────────────────────────
    'account.title':  'My Account Settings 👤',
    'account.sub':    'Your subscription details, remaining balance, and API access',
    'account.upgrade':'Upgrade Now ✨',
    'account.upgrade2':'Upgrade Plan Now 🔥',
  }
};

// ─── Core i18n Engine ────────────────────────────────────────────────────────

let currentLang = localStorage.getItem('vireon_lang') || 'ar';

/** Apply all translations for the given language */
export function applyTranslations(lang) {
  const t = translations[lang];
  if (!t) return;
  currentLang = lang;

  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // innerHTML (allows inline elements like <br> <span>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // Placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  // Update html element
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';

  // Update all toggle buttons
  document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
    btn.textContent = t['nav.lang'];
    btn.setAttribute('data-current-lang', lang);
  });

  // Update page title
  document.title = lang === 'ar'
    ? 'Vireon | استوديو المونتاج الذكي'
    : 'Vireon | AI Video Editing Studio';

  // Persist preference
  localStorage.setItem('vireon_lang', lang);
}

/** Toggle between AR ↔ EN */
export function toggleLanguage() {
  applyTranslations(currentLang === 'ar' ? 'en' : 'ar');
}

export function getCurrentLang() { return currentLang; }

/** Initialize — call once on DOMContentLoaded */
export function initI18n() {
  // Wire up all toggle buttons (by class)
  document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
    btn.addEventListener('click', toggleLanguage);
  });

  // Apply saved language (or default ar)
  applyTranslations(currentLang);
}
