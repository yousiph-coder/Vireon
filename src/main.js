import { supabase } from './supabaseClient.js';
import './style.css'

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------------
  // Global Auth / Spinner Elements
  // -------------------------------------------------------------
  const globalAuthSpinner = document.getElementById('globalAuthSpinner');
  const authSpinnerText = document.getElementById('authSpinnerText');

  function showGlobalSpinner(text = 'جار�Š ا�„تح�‚�‚...') {
    if (globalAuthSpinner && authSpinnerText) {
      authSpinnerText.textContent = text;
      globalAuthSpinner.classList.remove('hidden');
    }
  }

  function hideGlobalSpinner() {
    if (globalAuthSpinner) {
      globalAuthSpinner.classList.add('hidden');
    }
  }

  // -------------------------------------------------------------
  // Mobile Menu Attachment Helper (Landing Page Only)
  // -------------------------------------------------------------
  function attachMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
      const newToggle = menuToggle.cloneNode(true);
      menuToggle.parentNode.replaceChild(newToggle, menuToggle);

      newToggle.addEventListener('click', () => {
        newToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });

      navMenu.querySelectorAll('.nav-link, .btn').forEach(link => {
        link.addEventListener('click', () => {
          newToggle.classList.remove('active');
          navMenu.classList.remove('active');
        });
      });
    }
  }

  // -------------------------------------------------------------
  // Dynamic Navbar Auth States (Landing Page Only)
  // -------------------------------------------------------------
  function updateNavbarAuth() {
    const token = localStorage.getItem('token');
    const desktopAuth = document.getElementById('desktopAuthLinks');
    const mobileAuth = document.getElementById('mobileAuthLinks');

    if (token) {
      if (desktopAuth) {
        desktopAuth.innerHTML = `
          <a href="/dashboard" class="nav-link nav-route" style="margin-left:1.5rem;">�„�ˆحة ا�„تح�ƒ�…</a>
          <button class="btn btn-secondary btn-nav" id="btnNavbarLogout">تسج�Š�„ ا�„خر�ˆج</button>
          <button class="mobile-menu-toggle" id="menuToggle" aria-label="Open menu" style="margin-right:1rem;">
            <span></span><span></span><span></span>
          </button>
        `;
      }
      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <a href="/dashboard" class="nav-link nav-route">�„�ˆحة ا�„تح�ƒ�…</a>
          <button class="btn btn-secondary btn-nav btn-block" id="btnMobileNavbarLogout">تسج�Š�„ ا�„خر�ˆج</button>
        `;
      }
    } else {
      if (desktopAuth) {
        desktopAuth.innerHTML = `
          <a href="/login" class="nav-link login-link desktop-only nav-route" style="margin-left:1.5rem;">تسج�Š�„ ا�„دخ�ˆ�„</a>
          <a href="/signup" class="btn btn-primary desktop-only nav-route">ابدأ �…جا�†ا�‹</a>
          <button class="mobile-menu-toggle" id="menuToggle" aria-label="Open menu" style="margin-right:1rem;">
            <span></span><span></span><span></span>
          </button>
        `;
      }
      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <a href="/login" class="nav-link login-link nav-route">تسج�Š�„ ا�„دخ�ˆ�„</a>
          <a href="/signup" class="btn btn-primary btn-nav nav-route">ابدأ �…جا�†ا�‹</a>
        `;
      }
    }

    attachMenuToggle();
    attachNavbarLogoutEvents();
  }

  function attachNavbarLogoutEvents() {
    const btnNavbarLogout = document.getElementById('btnNavbarLogout');
    const btnMobileNavbarLogout = document.getElementById('btnMobileNavbarLogout');

    [btnNavbarLogout, btnMobileNavbarLogout].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          logoutUser();
        });
      }
    });
  }

  // -------------------------------------------------------------
  // Router System (History API) with Subrouting support
  // -------------------------------------------------------------
  const routes = {
    '/': { viewId: 'view-landing', requiresAuth: false, title: 'CutFlow | استوديو المونتاج الذكي' },
    '/login': { viewId: 'view-login', requiresAuth: false, title: 'تسجيل الدخول | CutFlow' },
    '/signup': { viewId: 'view-signup', requiresAuth: false, title: 'إنشاء حساب | CutFlow' },
    '/forgot-password': { viewId: 'view-forgot-password', requiresAuth: false, title: 'استعادة كلمة المرور | CutFlow' },
    '/pricing': { viewId: 'view-pricing', requiresAuth: false, title: 'الأسعار | CutFlow' },
    '/dashboard': { viewId: 'view-dashboard', subviewId: 'dash-subview-home', requiresAuth: true, title: 'لوحة التحكم | CutFlow' },
    '/dashboard/editor': { viewId: 'view-dashboard', subviewId: 'dash-subview-editor', requiresAuth: true, title: 'الاستوديو الذكي | CutFlow' },
    '/dashboard/videos': { viewId: 'view-dashboard', subviewId: 'dash-subview-videos', requiresAuth: true, title: 'فيديوهاتي | CutFlow' },
    '/dashboard/settings': { viewId: 'view-dashboard', subviewId: 'dash-subview-settings', requiresAuth: true, title: 'إعدادات الحساب | CutFlow' },
    '/dashboard/account': { viewId: 'view-dashboard', subviewId: 'dash-subview-account', requiresAuth: true, title: 'حسابي | CutFlow' },
    '/dashboard/timeline': { viewId: 'view-timeline', requiresAuth: true, title: 'المحرر | CutFlow' }
  };

function renderRoute(path) {
    const cleanPath = path.split('#')[0].split('?')[0] || '/';
    const route = routes[cleanPath] || routes['/'];

    const token = localStorage.getItem('token');

    if (route.requiresAuth && !token) {
      showGlobalSpinner('غير مصرح بالدخول. جاري توجيهك لصفحة تسجيل الدخول...');
      setTimeout(() => {
        hideGlobalSpinner();
        navigate('/login');
      }, 1000);
      return;
    }

    if ((cleanPath === '/login' || cleanPath === '/signup') && token) {
      navigate('/dashboard');
      return;
    }

    executeRouteRender(route, cleanPath);
  }

  function executeRouteRender(route, path) {
    // Remove editor mode when leaving timeline
    document.body.classList.remove('in-editor-mode');

    document.querySelectorAll('.route-view').forEach(view => {
      view.classList.remove('active');
    });

    const activeView = document.getElementById(route.viewId);
    if (activeView) {
      activeView.classList.add('active');
    }

    document.title = route.title;
    updateNavbarAuth();
    window.scrollTo({ top: 0 });

    // Initialize timeline editor when entering timeline view
    if (route.viewId === 'view-timeline') {
      document.body.classList.add('in-editor-mode');
      if (typeof window.initCapCutEditor === 'function') {
        window.initCapCutEditor();
      }
    }

    if (route.viewId === 'view-dashboard') {
      document.querySelectorAll('.dash-subview').forEach(subview => {
        subview.classList.remove('active');
      });

      const activeSubview = document.getElementById(route.subviewId);
      if (activeSubview) {
        activeSubview.classList.add('active');
      }

      document.querySelectorAll('.dash-nav-item, .mobile-nav-item').forEach(navItem => {
        const itemHref = navItem.getAttribute('href');
        if (itemHref === path) {
          navItem.classList.add('active');
        } else {
          navItem.classList.remove('active');
        }
      });

      initDashboard();
    }
  }

  function navigate(path) {
    window.history.pushState({}, '', path);
    renderRoute(path);
  }

  // Intercept navigation links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-route');
    if (link) {
      e.preventDefault();
      const path = link.getAttribute('href');
      navigate(path);
    }
  });

  window.addEventListener('popstate', () => {
    renderRoute(window.location.pathname);
  });

  // -------------------------------------------------------------
  // Authentication Actions
  // -------------------------------------------------------------
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const btnGoogleLogin = document.getElementById('btnGoogleLogin');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        showError(loginError, 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
        return;
      }

      showGlobalSpinner('جاري التحقق من الحساب وتسجيل الدخول...');
      
      // Supabase Login
      supabase.auth.signInWithPassword({ email, password }).then(({ data, error }) => {
        hideGlobalSpinner();
        if (error) {
          showError(loginError, error.message);
        } else {
          localStorage.setItem('token', data.session.access_token);
          const namePrefix = email.split('@')[0];
          localStorage.setItem('user_name', data.user.user_metadata?.full_name || namePrefix);
          navigate('/dashboard');
          loginForm.reset();
        }
      });
    });
  }

  const signupForm = document.getElementById('signupForm');
  const signupError = document.getElementById('signupError');
  const btnGoogleSignup = document.getElementById('btnGoogleSignup');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;

      if (!name || !email || !password || !confirmPassword) {
        showError(signupError, 'الرجاء ملء جميع الحقول المطلوبة.');
        return;
      }

      if (password !== confirmPassword) {
        showError(signupError, 'عذراً، كلمة المرور وتأكيدها غير متطابقين.');
        return;
      }

      showGlobalSpinner('جاري إنشاء حسابك الخاص وتهيئة بيئة العمل...');
      
      // Supabase Signup
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      }).then(({ data, error }) => {
        hideGlobalSpinner();
        if (error) {
          showError(signupError, error.message);
        } else {
          if (data.session) {
            localStorage.setItem('token', data.session.access_token);
            localStorage.setItem('user_name', name);
            navigate('/dashboard');
          } else {
            showError(signupError, 'يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
          }
          signupForm.reset();
        }
      });
    });
  }

  [btnGoogleLogin, btnGoogleSignup].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        showGlobalSpinner('اتصال آمن بـ Google OAuth...');
        setTimeout(() => {
          hideGlobalSpinner();
          localStorage.setItem('token', 'google-oauth-mock-jwt-token-xyz');
          localStorage.setItem('user_name', 'مستخدم جوجل');
          navigate('/dashboard');
        }, 1100);
      });
    }
  });

  const forgotForm = document.getElementById('forgotForm');
  const forgotSuccess = document.getElementById('forgotSuccess');
  const forgotGroupInput = document.getElementById('forgotGroupInput');
  const btnForgotSubmit = document.getElementById('btnForgotSubmit');

  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim();
      if (!email) return;

      showGlobalSpinner('جاري إرسال تعليمات الاستعادة...');
      setTimeout(() => {
        hideGlobalSpinner();
        forgotSuccess.classList.remove('hidden');
        if (forgotGroupInput) forgotGroupInput.classList.add('hidden');
        if (btnForgotSubmit) btnForgotSubmit.classList.add('hidden');
      }, 900);
    });
  }

  function logoutUser() {
    showGlobalSpinner('جاري تسجيل الخروج...');
    supabase.auth.signOut().then(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user_name');
      hideGlobalSpinner();
      navigate('/login');
    });
  }

  function showError(element, msg) {
    if (element) {
      element.textContent = msg;
      element.classList.remove('hidden');
      setTimeout(() => {
        element.classList.add('hidden');
      }, 4000);
    }
  }

  // -------------------------------------------------------------
  // Dashboard Home, Editor, Videos, Settings & Account Logic
  // -------------------------------------------------------------
  function initDashboard() {
    const welcomeName = document.getElementById('dashWelcomeName');
    const sidebarProfileName = document.getElementById('sidebarProfileName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');

    const btnSidebarLogout = document.getElementById('btnSidebarLogout');
    if (btnSidebarLogout) {
      btnSidebarLogout.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
      });
    }

    renderDashboardStats(welcomeName, sidebarProfileName, sidebarAvatar);
    initDashboardUploader();
  }

  async function renderDashboardStats(welcomeName, sidebarProfileName, sidebarAvatar) {
    // Show some loading state or keep existing until loaded
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;
    
    const userId = sessionData.session.user.id;
    
    // Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, plan_tier, minutes_used')
      .eq('id', userId)
      .single();
      
    if (profile) {
      const storedName = profile.full_name || 'صانع المحتوى';
      const currentPlan = profile.plan_tier || 'Free';
      const minutesUsed = profile.minutes_used || 0;
      
      if (welcomeName) welcomeName.textContent = storedName;
      if (sidebarProfileName) sidebarProfileName.textContent = storedName;
      if (sidebarAvatar) sidebarAvatar.textContent = storedName.charAt(0).toUpperCase();

      const statMinutes = document.getElementById('statMinutes');
      const statPlanTier = document.getElementById('statPlanTier');
      const accPlanTier = document.getElementById('accPlanTier');
      const accCredits = document.getElementById('accCredits');

      if (statMinutes) statMinutes.textContent = minutesUsed;
      if (statPlanTier) statPlanTier.textContent = currentPlan;
      if (accPlanTier) accPlanTier.textContent = `${currentPlan} (مخطط تجريبي)`;
      
      // Calculate remaining minutes based on plan
      const limit = currentPlan === 'Free' ? 30 : 9999;
      if (accCredits) accCredits.textContent = currentPlan === 'Free' ? `${limit - minutesUsed} دقيقة` : 'غير محدود';
    }

    // Fetch Video History
    const { data: videos } = await supabase
      .from('video_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const videosList = videos || [];
    
    const statVideosCount = document.getElementById('statVideosCount');
    if (statVideosCount) statVideosCount.textContent = videosList.length;

    const dashHomeEmptyState = document.getElementById('dashHomeEmptyState');
    const dashHomeRecentTable = document.getElementById('dashHomeRecentTable');
    const homeRecentVideosList = document.getElementById('homeRecentVideosList');

    const dashVideosEmptyState = document.getElementById('dashVideosEmptyState');
    const dashVideosListFilled = document.getElementById('dashVideosListFilled');
    const videosListFullContainer = document.getElementById('videosListFullContainer');

    if (videosList.length > 0) {
      if (dashHomeEmptyState) dashHomeEmptyState.classList.add('hidden');
      if (dashHomeRecentTable) dashHomeRecentTable.classList.remove('hidden');

      if (dashVideosEmptyState) dashVideosEmptyState.classList.add('hidden');
      if (dashVideosListFilled) dashVideosListFilled.classList.remove('hidden');

      const renderItemMarkup = (v) => `
        <div class="video-list-item glass-panel">
          <div class="video-item-icon">🎬</div>
          <div class="video-item-details">
            <h4 class="video-item-title">${v.filename}</h4>
            <p class="video-item-meta">${new Date(v.created_at).toLocaleDateString()} • ${v.duration_original || 'N/A'} • تم توفير: ${v.time_saved || '0ث'}</p>
          </div>
          <button class="btn btn-secondary btn-nav download-list-item-btn" data-name="${v.filename}">تحميل</button>
        </div>
      `;

      if (homeRecentVideosList) {
        homeRecentVideosList.innerHTML = videosList.slice(0, 3).map(renderItemMarkup).join('');
      }

      if (videosListFullContainer) {
        videosListFullContainer.innerHTML = videosList.map(renderItemMarkup).join('');
      }

      document.querySelectorAll('.download-list-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const fName = btn.getAttribute('data-name');
          triggerMockFileDownload(fName);
        });
      });

    } else {
      if (dashHomeEmptyState) dashHomeEmptyState.classList.remove('hidden');
      if (dashHomeRecentTable) dashHomeRecentTable.classList.add('hidden');

      if (dashVideosEmptyState) dashVideosEmptyState.classList.remove('hidden');
      if (dashVideosListFilled) dashVideosListFilled.classList.add('hidden');
    }
  }

  // -------------------------------------------------------------
  // Dashboard Uploader — 4-State Flow
  // Upload Zone → Settings Panel → Processing → Done
  // -------------------------------------------------------------
  function initDashboardUploader() {
    const dashUploadZone = document.getElementById('dashUploadZone');
    const btnDashUploadTrigger = document.getElementById('btnDashUploadTrigger');
    const dashFileInput = document.getElementById('dashFileInput');

    const dashSettingsPanel = document.getElementById('dashSettingsPanel');
    const previewFileName = document.getElementById('previewFileName');
    const previewFileMeta = document.getElementById('previewFileMeta');
    const btnRemoveFile = document.getElementById('btnRemoveFile');
    const btnCancelUpload = document.getElementById('btnCancelUpload');
    const btnStartProcessing = document.getElementById('btnStartProcessing');

    const silenceThresholdSlider = document.getElementById('silenceThresholdSlider');
    const silenceThresholdValue = document.getElementById('silenceThresholdValue');
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    const sensitivityValue = document.getElementById('sensitivityValue');

    const langBtns = document.querySelectorAll('.lang-btn');

    const dashProcessingZone = document.getElementById('dashProcessingZone');
    const dashDoneZone = document.getElementById('dashDoneZone');

    const dashProgressBar = document.getElementById('dashProgressBar');
    const dashProgressPercent = document.getElementById('dashProgressPercent');

    const dashProcTitle = document.getElementById('dashProcTitle');
    const dashProcSub = document.getElementById('dashProcSub');

    const resFileName = document.getElementById('resFileName');
    const resSavedTime = document.getElementById('resSavedTime');
    const resFinalLen = document.getElementById('resFinalLen');
    const resSizeSaved = document.getElementById('resSizeSaved');

    const btnDashDownloadResult = document.getElementById('btnDashDownloadResult');
    const btnDashResetUploader = document.getElementById('btnDashResetUploader');

    if (!dashUploadZone) return;

    let currentFile = null;

    // ---- State helpers ----
    function showOnly(el) {
      [dashUploadZone, dashSettingsPanel, dashProcessingZone, dashDoneZone].forEach(z => {
        if (z) z.classList.add('hidden');
      });
      if (el) el.classList.remove('hidden');
    }

    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // ---- Show Settings Panel after file select ----
    function showSettingsPanel(file) {
      currentFile = file;
      if (previewFileName) previewFileName.textContent = file.name;
      if (previewFileMeta) previewFileMeta.textContent = formatBytes(file.size);
      showOnly(dashSettingsPanel);
    }

    // ---- Language selector ----
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        langBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // ---- Silence threshold slider ----
    if (silenceThresholdSlider && silenceThresholdValue) {
      silenceThresholdSlider.addEventListener('input', () => {
        const val = (parseInt(silenceThresholdSlider.value) / 10).toFixed(1);
        silenceThresholdValue.textContent = `${val} ث`;
      });
    }

    // ---- Sensitivity slider ----
    const sensitivityLabels = { '1': 'منخفض', '2': 'متوسط', '3': 'عالي' };
    
    if (sensitivitySlider && sensitivityValue) {
      sensitivitySlider.addEventListener('input', () => {
        sensitivityValue.textContent = sensitivityLabels[sensitivitySlider.value] || 'متوسط';
      });
    }

    // ---- Cancel / remove file ----
    function goBackToUpload() {
      showOnly(dashUploadZone);
      if (dashFileInput) dashFileInput.value = '';
      currentFile = null;
    }

    if (btnRemoveFile) btnRemoveFile.addEventListener('click', goBackToUpload);
    if (btnCancelUpload) btnCancelUpload.addEventListener('click', goBackToUpload);

    // ---- Processing Engine ----
    async function triggerDashProcessing(file) {
      if (!file) return;
      currentFile = file;

      showOnly(dashProcessingZone);

      if (dashProgressBar) dashProgressBar.style.width = '0%';
      if (dashProgressPercent) dashProgressPercent.textContent = '0%';

      const procSteps = [
        { id: 'procStep1', title: 'جاري رفع الفيديو...', sub: 'يرجى الانتظار، جاري نقل البيانات.' },
        { id: 'procStep2', title: 'جاري تحليل الصوت...', sub: 'الذكاء الاصطناعي يستمع للمقاطع.' },
        { id: 'procStep3', title: 'جاري قص السكتات...', sub: 'تحديد لحظات الصمت وإزالتها.' },
        { id: 'procStep4', title: 'اللمسات الأخيرة...', sub: 'تجهيز الملف للتحميل والمونتاج.' }
      ];

      procSteps.forEach((s, idx) => {
        const el = document.getElementById(s.id);
        if (el) { 
          el.classList.remove('active', 'done'); 
          if(idx === 0) el.classList.add('active');
        }
      });

      if (dashProcTitle) dashProcTitle.textContent = procSteps[0].title;
      if (dashProcSub) dashProcSub.textContent = procSteps[0].sub;

      const formData = new FormData();
      formData.append('video', file);
      
      const langActive = document.querySelector('.lang-btn.active');
      const langMap = { '🇺🇸 English': 'en', '🇸🇦 عربي': 'ar', '🌐 كلاهما': 'both' };
      formData.append('language', langActive ? langMap[langActive.textContent.trim()] : 'both');
      formData.append('silenceThreshold', (parseInt(silenceThresholdSlider.value) / 10).toString());
      
      // Get filler toggle
      const toggles = document.querySelectorAll('.toggle-switch input');
      formData.append('removeFillers', toggles[0] ? toggles[0].checked : 'false');

      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:3000/api/process', true);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 50); // First 50% is upload
            if (dashProgressBar) dashProgressBar.style.width = `${percentComplete}%`;
            if (dashProgressPercent) dashProgressPercent.textContent = `${percentComplete}%`;
            
            if (percentComplete > 20 && percentComplete <= 50) {
              document.getElementById('procStep1')?.classList.replace('active', 'done');
              document.getElementById('procStep2')?.classList.add('active');
              if (dashProcTitle) dashProcTitle.textContent = procSteps[1].title;
              if (dashProcSub) dashProcSub.textContent = procSteps[1].sub;
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            
            // Mark all steps done
            procSteps.forEach(s => {
              const el = document.getElementById(s.id);
              if (el) { el.classList.add('done'); el.classList.remove('active'); }
            });

            if (dashProgressBar) dashProgressBar.style.width = '100%';
            if (dashProgressPercent) dashProgressPercent.textContent = '100%';

            setTimeout(async () => {
              localStorage.setItem('cutflow_video_url', response.streamUrl);
              localStorage.setItem('cutflow_segments', JSON.stringify(response.timeline));
              localStorage.setItem('cutflow_original_url', response.streamUrl);
              localStorage.setItem('cutflow_job_id', response.jobId);
              localStorage.setItem('cutflow_stats', JSON.stringify(response.stats));
              
              // Insert into Supabase video_history
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData && sessionData.session) {
                await supabase.from('video_history').insert({
                  user_id: sessionData.session.user.id,
                  filename: file.name || 'مقطع جديد',
                  duration_original: 'N/A',
                  duration_processed: 'N/A',
                  time_saved: response.stats ? response.stats.saved + 'ث' : '0ث',
                  silences_removed: response.stats ? response.stats.removed : 0
                });
              }
              
              navigate('/dashboard/timeline');
            }, 500);

          } else {
            console.error('Server error:', xhr.responseText);
            alert('حدث خطأ أثناء معالجة الفيديو.');
            goBackToUpload();
          }
        };

        xhr.onerror = () => {
          console.error('Request failed');
          alert('فشل الاتصال بالخادم.');
          goBackToUpload();
        };

        xhr.send(formData);

        // Simulate backend steps 50% to 100% since we don't have SSE setup for real time backend logs
        let fakeProgress = 50;
        const fakeInterval = setInterval(() => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            clearInterval(fakeInterval);
            return;
          }
          if (fakeProgress < 95) {
             fakeProgress += Math.floor(Math.random() * 5);
             if (dashProgressBar) dashProgressBar.style.width = `${fakeProgress}%`;
             if (dashProgressPercent) dashProgressPercent.textContent = `${fakeProgress}%`;
             
             if (fakeProgress > 60 && fakeProgress <= 90) {
                document.getElementById('procStep2')?.classList.replace('active', 'done');
                document.getElementById('procStep3')?.classList.add('active');
                if (dashProcTitle) dashProcTitle.textContent = procSteps[2].title;
                if (dashProcSub) dashProcSub.textContent = procSteps[2].sub;
             } else if (fakeProgress > 90) {
                document.getElementById('procStep3')?.classList.replace('active', 'done');
                document.getElementById('procStep4')?.classList.add('active');
                if (dashProcTitle) dashProcTitle.textContent = procSteps[3].title;
                if (dashProcSub) dashProcSub.textContent = procSteps[3].sub;
             }
          }
        }, 1000);

      } catch (err) {
         console.error(err);
         alert('حدث خطأ.');
         goBackToUpload();
      }
    }

    // ---- File Selection (Button) ----
    if (btnDashUploadTrigger) {
      btnDashUploadTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dashFileInput) dashFileInput.click();
      });
    }

    // ---- File Input Change ----
    if (dashFileInput) {
      dashFileInput.addEventListener('change', () => {
        if (dashFileInput.files.length > 0) {
          showSettingsPanel(dashFileInput.files[0]);
        }
      });
    }

    // ---- Drag zone click -> trigger file browse ----
    dashUploadZone.addEventListener('click', (e) => {
      if (e.target === btnDashUploadTrigger) return;
      if (dashFileInput) dashFileInput.click();
    });

    // ---- Drag & Drop ----
    ['dragenter', 'dragover'].forEach(eventName => {
      dashUploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dashUploadZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dashUploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dashUploadZone.classList.remove('dragover');
      });
    });

    dashUploadZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        showSettingsPanel(files[0]);
      }
    });

    // ---- Settings Panel: Start Processing ----
    if (btnStartProcessing) {
      btnStartProcessing.addEventListener('click', () => {
        if (currentFile) triggerDashProcessing(currentFile);
      });
    }

    // ---- Done zone: Reset or Download ----
    if (btnDashResetUploader) {
      btnDashResetUploader.addEventListener('click', () => {
        showOnly(dashUploadZone);
        if (dashFileInput) dashFileInput.value = '';
        currentFile = null;
        // Clear the download URL stored on the button
        if (btnDashDownloadResult) btnDashDownloadResult.dataset.url = '';
      });
    }

    // Default handler �€” overridden after each successful process with the real URL
    if (btnDashDownloadResult) {
      btnDashDownloadResult.addEventListener('click', () => {
        const url = btnDashDownloadResult.dataset.url;
        const fmt = btnDashDownloadResult.dataset.fmt || 'mp4';
        if (url) {
          triggerFileDownload(url, `cutflow_export.${fmt}`);
        }
      });
    }
  }

  // �”€�”€�”€ Real file download helper �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
  // Uses a hidden <a> tag with the backend URL and the `download` attribute.
  // The backend sets Content-Disposition: attachment so the browser saves it.
  function triggerFileDownload(url, filename = 'cutflow_processed.mp4') {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;        // hint for file name
    a.target = '_blank';          // open in new tab as fallback if CORS blocks inline
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 200);
  }

  // -------------------------------------------------------------
  // Landing Page Scripts
  // -------------------------------------------------------------
  function initWaveformDemo() {
    const waveformContainer = document.getElementById('waveformContainer');
    const playhead = document.getElementById('playhead');
    const btnPlayWaveform = document.getElementById('btnPlayWaveform');
    const modeOriginal = document.getElementById('modeOriginal');
    const modeCleaned = document.getElementById('modeCleaned');
    const waveformStatus = document.getElementById('waveformStatus');
    const savedTimeBadge = document.getElementById('savedTime');

    if (!btnPlayWaveform || !playhead || !waveformContainer) return;

    let isPlayingWaveform = false;
    let playheadProgress = 0;
    let isCleanedMode = false;
    let animFrameId = null;
    let lastTime = 0;

    const speedOriginal = 15;
    const speedCleaned = 25;

    function updatePlayhead(timestamp) {
      if (!isPlayingWaveform) return;

      if (!lastTime) lastTime = timestamp;
      const delta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      const currentSpeed = isCleanedMode ? speedCleaned : speedOriginal;
      playheadProgress += currentSpeed * delta;

      if (playheadProgress >= 100) {
        playheadProgress = 0;
      }

      playhead.style.left = `${playheadProgress}%`;
      updateStatusText();

      animFrameId = requestAnimationFrame(updatePlayhead);
    }

    function updateStatusText() {
      if (!isPlayingWaveform) {
        waveformStatus.textContent = 'ا�„حا�„ة: �…ت�ˆ�‚ف. اضغط تشغ�Š�„ �„�…شا�‡دة ا�„حر�ƒة.';
        return;
      }

      if (isCleanedMode) {
        waveformStatus.textContent = 'ا�„حا�„ة: تشغ�Š�„ ا�„ف�Šد�Š�ˆ ا�„�†ظ�Šف (ت�… �‚ص 3 س�ƒتات ت�„�‚ائ�Šا�‹) �š�';
      } else {
        if (
          (playheadProgress >= 15 && playheadProgress <= 25) ||
          (playheadProgress >= 50 && playheadProgress <= 62) ||
          (playheadProgress >= 82 && playheadProgress <= 90)
        ) {
          waveformStatus.textContent = 'ا�„حا�„ة: جار�Š �ƒت�…/�‚ص ا�„س�ƒتة ا�„حا�„�Šة... �Ÿ›‘';
        } else {
          waveformStatus.textContent = 'ا�„حا�„ة: تشغ�Š�„ ا�„ص�ˆت ا�„أص�„�Š... �Ÿ—�️';
        }
      }
    }

    btnPlayWaveform.addEventListener('click', () => {
      if (isPlayingWaveform) {
        isPlayingWaveform = false;
        btnPlayWaveform.querySelector('.play-icon').classList.remove('hidden');
        btnPlayWaveform.querySelector('.pause-icon').classList.add('hidden');
        btnPlayWaveform.querySelector('.btn-text').textContent = 'شغ�‘�„ ا�„عرض ا�„تجر�Šب�Š';
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
        updateStatusText();
      } else {
        isPlayingWaveform = true;
        lastTime = 0;
        btnPlayWaveform.querySelector('.play-icon').classList.add('hidden');
        btnPlayWaveform.querySelector('.pause-icon').classList.remove('hidden');
        btnPlayWaveform.querySelector('.btn-text').textContent = 'إ�Š�‚اف �…ؤ�‚ت';
        animFrameId = requestAnimationFrame(updatePlayhead);
      }
    });

    modeOriginal.addEventListener('click', () => {
      isCleanedMode = false;
      modeOriginal.classList.add('active');
      modeCleaned.classList.remove('active');
      waveformContainer.classList.remove('cleaned-mode');
      savedTimeBadge.classList.add('hidden');
      playheadProgress = 0;
      playhead.style.left = '0%';
      updateStatusText();
    });

    modeCleaned.addEventListener('click', () => {
      isCleanedMode = true;
      modeOriginal.classList.remove('active');
      modeCleaned.classList.add('active');
      waveformContainer.classList.add('cleaned-mode');
      savedTimeBadge.classList.remove('hidden');
      playheadProgress = 0;
      playhead.style.left = '0%';
      updateStatusText();
    });
  }

  function initLandingUploader() {
    const dragDropZone = document.getElementById('dragDropZone');
    const btnSimUpload = document.getElementById('btnSimUpload');
    const hiddenFileInput = document.getElementById('hiddenFileInput');

    const simStep1 = document.getElementById('simStep1');
    const simStep2 = document.getElementById('simStep2');
    const simStep3 = document.getElementById('simStep3');

    const simProgressBar = document.getElementById('simProgressBar');
    const simProgressPercentage = document.getElementById('simProgressPercentage');
    const processingStatusText = document.getElementById('processingStatusText');

    const dot1 = document.getElementById('dot1');
    const dot2 = document.getElementById('dot2');
    const dot3 = document.getElementById('dot3');

    const btnSimDownload = document.getElementById('btnSimDownload');
    const btnSimReset = document.getElementById('btnSimReset');

    if (!dragDropZone || !btnSimUpload || !hiddenFileInput) return;

    function triggerUpload() {
      simStep1.classList.remove('active');
      simStep2.classList.add('active');
      dot1.classList.remove('active');
      dot1.classList.add('success');
      dot2.classList.add('active');

      let progress = 0;
      simProgressBar.style.width = '0%';
      simProgressPercentage.textContent = '0%';

      const statusMessages = [
        { min: 0, max: 25, text: 'جار�Š رفع ا�„�…�„ف �ˆتح�„�Š�„�‡ ع�„�‰ خ�ˆاد�… �ƒ�ˆت ف�„�ˆ...' },
        { min: 25, max: 55, text: 'ا�„�€ AI �Šبحث ع�† ا�„فترات ا�„صا�…تة �ˆا�„س�ƒتات با�„�„غت�Š�† ا�„عرب�Šة �ˆا�„إ�†ج�„�Šز�Šة...' },
        { min: 55, max: 80, text: 'جارٍ �‚ص ا�„س�ƒتات �ˆإجراء تحس�Š�† �„تدف�‚ ا�„ص�ˆت �ˆت�†ع�Š�… ا�„ا�†ت�‚ا�„ات...' },
        { min: 80, max: 100, text: 'جارٍ إعادة ا�„تشف�Šر �ˆحفظ ا�„ف�Šد�Š�ˆ ا�„�†�‡ائ�Š �„�„تح�…�Š�„...' }
      ];

      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 8) + 4;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          setTimeout(() => {
            simStep2.classList.remove('active');
            simStep3.classList.add('active');
            dot2.classList.remove('active');
            dot2.classList.add('success');
            dot3.classList.add('active');
            dot3.classList.add('success');
          }, 600);
        }

        simProgressBar.style.width = `${progress}%`;
        simProgressPercentage.textContent = `${progress}%`;

        const msg = statusMessages.find(m => progress >= m.min && progress <= m.max);
        if (msg) {
          processingStatusText.textContent = msg.text;
        }
      }, 150);
    }

    btnSimUpload.onclick = (e) => {
      e.stopPropagation();
      hiddenFileInput.click();
    };

    dragDropZone.onclick = () => {
      hiddenFileInput.click();
    };

    hiddenFileInput.onchange = () => {
      if (hiddenFileInput.files.length > 0) {
        triggerUpload();
      }
    };

    ['dragenter', 'dragover'].forEach(eventName => {
      dragDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dragDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDropZone.classList.remove('dragover');
      });
    });

    dragDropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        triggerUpload();
      }
    });

    if (btnSimReset) {
      btnSimReset.onclick = () => {
        simStep3.classList.remove('active');
        simStep1.classList.add('active');
        dot1.classList.add('active');
        dot1.classList.remove('success');
        dot2.classList.remove('active', 'success');
        dot3.classList.remove('active', 'success');
        hiddenFileInput.value = '';
      };
    }

    if (btnSimDownload) {
      btnSimDownload.onclick = () => {
        alert('ش�ƒر�‹ا �„تجربت�ƒ ا�„عرض ا�„ت�ˆض�Šح�Š! �Šت�… ا�„آ�† تح�…�Š�„ �…�„ف �…حا�ƒاة: "CutFlow_demo_clean.mp4"');
        const element = document.createElement('a');
        const file = new Blob(['ش�ƒرا�‹ �„استخدا�…�ƒ �ƒ�ˆت ف�„�ˆ! �‡ذا �…�„ف تجر�Šب�Š �Š�…ث�„ ا�„ف�Šد�Š�ˆ ا�„�…�‚ص�ˆص ب�†جاح.'], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'CutFlow_demo_clean.mp4.txt';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      };
    }
  }

  function initPricingToggle() {
    const billingToggle = document.getElementById('billingToggle');
    const labelMonthly = document.getElementById('labelMonthly');
    const labelYearly = document.getElementById('labelYearly');
    const priceValues = document.querySelectorAll('.price-value');

    if (!billingToggle) return;

    labelMonthly.classList.add('active');

    billingToggle.addEventListener('click', () => {
      const isActive = billingToggle.classList.toggle('active');

      if (isActive) {
        labelMonthly.classList.remove('active');
        labelYearly.classList.add('active');
      } else {
        labelMonthly.classList.add('active');
        labelYearly.classList.remove('active');
      }

      priceValues.forEach(priceEl => {
        const monthlyPrice = priceEl.getAttribute('data-monthly');
        const yearlyPrice = priceEl.getAttribute('data-yearly');

        priceEl.style.transform = 'scale(0.8)';
        priceEl.style.opacity = '0.5';

        setTimeout(() => {
          priceEl.textContent = isActive ? yearlyPrice : monthlyPrice;
          priceEl.style.transform = 'scale(1)';
          priceEl.style.opacity = '1';
        }, 150);
      });
    });
  }

  function initFaqAccordion() {
    const faqTriggers = document.querySelectorAll('.faq-trigger');

    faqTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const faqItem = trigger.parentElement;
        const isOpen = faqItem.classList.contains('open');

        document.querySelectorAll('.faq-item').forEach(item => {
          if (item !== faqItem) {
            item.classList.remove('open');
            item.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
          }
        });

        if (isOpen) {
          faqItem.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          faqItem.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // -------------------------------------------------------------
  // Initial Bootup
  // -------------------------------------------------------------
  renderRoute(window.location.pathname);

  initWaveformDemo();
  initLandingUploader();
  initPricingToggle();
  initFaqAccordion();

});

// ==========================================
// INTERACTIVE TIMELINE EDITOR LOGIC
// ==========================================

window.initCapCutEditor = function() {
  console.log('Timeline data:', localStorage.getItem('cutflow_segments'));
  console.log('Video URL:', localStorage.getItem('cutflow_video_url'));

  try {
    const rawSegments = localStorage.getItem('cutflow_segments');
    const streamUrl   = localStorage.getItem('cutflow_video_url');
    const jobId       = localStorage.getItem('cutflow_job_id');
    const statsStr    = localStorage.getItem('cutflow_stats');

    if (!rawSegments || !streamUrl) {
      document.getElementById('view-timeline').innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
          <div style="font-size:3rem;">�Ÿ“‚</div>
          <h2 style="margin:1rem 0;">�„ا �Š�ˆجد ف�Šد�Š�ˆ �…ح�…�„</h2>
          <button class="btn btn-primary" onclick="window.location.href='/dashboard'">ا�„ع�ˆدة �„�„�ˆحة ا�„تح�ƒ�…</button>
        </div>`;
      return;
    }

    const initialTimeline = JSON.parse(rawSegments);
    const stats = statsStr ? JSON.parse(statsStr) : { originalDuration: 1 };
    let DURATION = stats.originalDuration || 1;
    const FPS = 30;
    const SNAP_PX = 8; // snap threshold in pixels

    // �”€�”€ State �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    let segments         = JSON.parse(JSON.stringify(initialTimeline)).map(seg => {
      const removed = seg.removed === true || seg.type === 'remove';
      return {
        ...seg,
        type: removed ? 'remove' : 'keep',
        removed
      };
    });
    let undoStack        = [];
    let redoStack        = [];
    let selectedIds      = new Set();   // multi-select
    let zoomLevel        = 1;           // 1x �†’ 50x
    let bladeMode        = false;
    let isScrubbing      = false;
    let isPanning        = false;
    let panStartX        = 0;
    let panStartScroll   = 0;
    let activeTrimmingInfo = null;      // {segId, side, origStart, origEnd, startX}
    let rafId            = null;
    const PX_PER_SEC_BASE = 100;        // base pixels per second at zoom=1

    // �”€�”€ DOM refs �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    const video          = document.getElementById('ccVideo');
    const playOverlay    = document.getElementById('ccPlayOverlay');
    const track          = document.getElementById('ccTrackVideo');
    const ruler          = document.getElementById('ccRuler');
    const playhead       = document.getElementById('ccPlayhead');
    const scrollArea     = document.getElementById('ccTimelineScrollArea');
    const canvas         = document.getElementById('ccTimelineCanvas');
    const timecodeEl     = document.getElementById('ccTimecode');
    const ctxMenu        = document.getElementById('ccContextMenu');
    const snapIndicator  = document.getElementById('ccSnapIndicator');
    const trimTooltip    = document.getElementById('ccTrimTooltip');
    const zoomLabel      = document.getElementById('ccZoomLabel');
    const bladeModeLabel = document.getElementById('ccBladeModeLabel');

    // Controls
    const btnPlay        = document.getElementById('ccBtnPlayPause');
    const btnUndo        = document.getElementById('ccBtnUndo');
    const btnRedo        = document.getElementById('ccBtnRedo');
    const btnZoomIn      = document.getElementById('ccBtnZoomIn');
    const btnZoomOut     = document.getElementById('ccBtnZoomOut');
    const zoomSlider     = document.getElementById('ccZoomSlider');
    const volumeSlider   = document.getElementById('ccVolume');
    const btnExport      = document.getElementById('ccBtnExport');
    const exportMenu     = document.getElementById('ccExportMenu');
    const btnBlade1      = document.getElementById('ccBtnBladeMode');       // left panel
    const btnBlade2      = document.getElementById('ccBtnBladeTimeline');   // toolbar

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // HELPERS
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    const uid = () => Math.random().toString(36).substr(2, 9);

    function formatTC(secs) {
      if (isNaN(secs) || secs < 0) secs = 0;
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = Math.floor(secs % 60);
      const f = Math.floor((secs % 1) * FPS);
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(f).padStart(2,'0')}`;
    }

    function pxPerSec()  { return PX_PER_SEC_BASE * zoomLevel; }
    function trackWidth(){ return DURATION * pxPerSec(); }
    function secToPx(s)  { return s * pxPerSec(); }
    function pxToSec(px) { return px / pxPerSec(); }

    /** pixel position of current time within track canvas */
    function ctToPx() { return secToPx(video.currentTime); }

    function saveState() {
      undoStack.push(JSON.parse(JSON.stringify(segments)));
      if (undoStack.length > 50) undoStack.shift();
      redoStack = [];
      updateUndoRedoUI();
    }
    function updateUndoRedoUI() {
      btnUndo.disabled = undoStack.length === 0;
      btnRedo.disabled = redoStack.length === 0;
    }

    /** Find all edge positions (starts + ends) for snapping */
    function snapEdges() {
      const edges = [0, DURATION];
      segments.forEach(s => { edges.push(s.start); edges.push(s.end); });
      return edges;
    }

    function snapSec(sec, excludeId) {
      const edges = snapEdges().filter(e => {
        // Don't snap to the edges of the segment being trimmed
        if (!excludeId) return true;
        const seg = segments.find(s => s.id === excludeId);
        return seg ? (Math.abs(e - seg.start) > 0.001 && Math.abs(e - seg.end) > 0.001) : true;
      });
      const snapThresholdSec = SNAP_PX / pxPerSec();
      let closest = null; let minDist = Infinity;
      edges.forEach(e => { const d = Math.abs(e - sec); if (d < minDist) { minDist = d; closest = e; } });
      if (minDist <= snapThresholdSec) {
        showSnap(closest);
        return closest;
      }
      hideSnap();
      return sec;
    }
    function showSnap(sec) {
      snapIndicator.style.left = secToPx(sec) + 'px';
      snapIndicator.classList.remove('hidden');
    }
    function hideSnap() { snapIndicator.classList.add('hidden'); }

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // ZOOM (keep playhead centered)
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    function applyZoom(newZoom, pivotSec) {
      newZoom = Math.max(1, Math.min(50, newZoom));
      if (newZoom === zoomLevel) return;

      // If no pivot given, use center of visible area
      if (pivotSec === undefined) {
        const visCenter = scrollArea.scrollLeft + scrollArea.clientWidth / 2;
        pivotSec = pxToSec(visCenter);
      }

      const pivotPxBefore = secToPx(pivotSec);
      const visibleOffset  = pivotPxBefore - scrollArea.scrollLeft;

      zoomLevel = newZoom;
      renderTimeline();

      const pivotPxAfter = secToPx(pivotSec);
      scrollArea.scrollLeft = pivotPxAfter - visibleOffset;

      zoomSlider.value = zoomLevel;
      if (zoomLabel) zoomLabel.textContent = zoomLevel % 1 === 0 ? `${zoomLevel}x` : `${zoomLevel.toFixed(1)}x`;
    }

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // BLADE MODE
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    function toggleBlade() {
      bladeMode = !bladeMode;
      document.body.classList.toggle('blade-mode', bladeMode);
      [btnBlade1, btnBlade2].forEach(b => b && b.classList.toggle('blade-active', bladeMode));
      if (bladeModeLabel) bladeModeLabel.classList.toggle('hidden', !bladeMode);
    }

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // RENDER TIMELINE
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    function renderTimeline() {
      track.innerHTML = '';
      ruler.innerHTML = '';
      canvas.style.width = trackWidth() + 'px';
      updatePlaybackUI(false);

      // �”€�”€ Ruler �”€�”€
      const pps = pxPerSec();
      // Choose tick interval based on zoom: aim for ~80px between major ticks
      const rawInterval = 80 / pps; // seconds
      const roundedIntervals = [0.033, 0.1, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
      let tickInterval = roundedIntervals.reduce((a, b) => Math.abs(b - rawInterval) < Math.abs(a - rawInterval) ? b : a);
      if (tickInterval < 1/FPS) tickInterval = 1/FPS;

      for (let t = 0; t <= DURATION + tickInterval; t += tickInterval) {
        if (t > DURATION) t = DURATION;
        const x = secToPx(t);
        const isMajor = Math.round(t * 10) % Math.round(tickInterval * 2 * 10) === 0 || t === 0 || t === DURATION;
        const tick = document.createElement('div');
        tick.className = 'ruler-tick';
        tick.style.cssText = `left:${x}px;height:${isMajor ? '16px' : '8px'};position:absolute;bottom:0;width:1px;background:rgba(255,255,255,${isMajor ? '0.4' : '0.15'});`;
        ruler.appendChild(tick);
        if (isMajor) {
          const lbl = document.createElement('div');
          lbl.className = 'ruler-label';
          lbl.style.cssText = `left:${x}px;position:absolute;bottom:18px;font-size:10px;color:rgba(255,255,255,0.5);font-family:monospace;transform:translateX(-50%);white-space:nowrap;`;
          lbl.textContent = t < 60 ? `${t.toFixed(t < 1 ? 2 : 0)}s` : `${Math.floor(t/60)}:${String(Math.round(t%60)).padStart(2,'0')}`;
          ruler.appendChild(lbl);
        }
        if (t === DURATION) break;
      }

      // �”€�”€ Segments �”€�”€
      segments.sort((a, b) => a.start - b.start).forEach((seg, i) => {
        const el = document.createElement('div');
        const isSelected  = selectedIds.has(seg.id) && !bladeMode;
        const isMulti     = selectedIds.size > 1 && isSelected;
        const segType = isSegmentRemoved(seg) ? 'remove' : 'keep';
        el.className = `cc-segment ${segType}${isSelected ? (isMulti ? ' multi-selected' : ' selected') : ''}`;
        const left  = secToPx(seg.start);
        const width = Math.max(secToPx(seg.end) - left, 2);
        el.style.cssText = `left:${left}px;width:${width}px;position:absolute;top:0;height:100%;`;
        el.dataset.id = seg.id;

        // Label
        if (width > 30) {
          const lbl = document.createElement('div');
          lbl.className = 'seg-label';
          const dur = (seg.end - seg.start).toFixed(1) + 's';
          const textColor = segType === 'keep' ? '#ffffff' : '#ff9999';
          lbl.style.cssText = `padding:3px 5px;font-size:10px;color:${textColor};text-shadow:0 1px 2px #000;pointer-events:none;user-select:none;white-space:nowrap;overflow:hidden;`;
          lbl.textContent = dur;
          el.appendChild(lbl);
        }

        // Trim handles (only when selected and not in blade mode)
        if (isSelected && !bladeMode && selectedIds.size === 1) {
          ['left','right'].forEach(side => {
            const h = document.createElement('div');
            h.className = `handle ${side}`;
            h.style.cssText = `position:absolute;top:0;bottom:0;width:12px;cursor:col-resize;z-index:10;${side === 'left' ? 'left:0;' : 'right:0;'}background:rgba(234,179,8,0.5);`;
            h.onmousedown = (e) => startTrim(e, seg, i, side);
            el.appendChild(h);
          });
        }

        // Click / mousedown
        el.onmousedown = (e) => {
          if (e.button === 1) return; // middle mouse = pan
          if (e.button === 2) return;
          e.stopPropagation();

          if (bladeMode) {
            // Blade cut at click position
            const rect = el.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickSec = seg.start + pxToSec(clickX);
            doBladeCut(seg, i, clickSec, el, left);
            return;
          }

          if (e.ctrlKey || e.metaKey) {
            // Multi-select toggle
            if (selectedIds.has(seg.id)) selectedIds.delete(seg.id);
            else selectedIds.add(seg.id);
          } else if (e.shiftKey && selectedIds.size > 0) {
            // Range select: select all between last selected and this
            const lastId = [...selectedIds].pop();
            const lastIdx = segments.findIndex(s => s.id === lastId);
            const [from, to] = [Math.min(i, lastIdx), Math.max(i, lastIdx)];
            for (let j = from; j <= to; j++) selectedIds.add(segments[j].id);
          } else {
            selectedIds.clear();
            selectedIds.add(seg.id);
            const rect = el.getBoundingClientRect();
            seekToTime(seg.start + pxToSec(e.clientX - rect.left), true);
          }
          renderTimeline();
        };

        el.oncontextmenu = (e) => {
          e.preventDefault(); e.stopPropagation();
          selectedIds.clear(); selectedIds.add(seg.id);
          renderTimeline();
          ctxMenu.style.left  = `${e.clientX}px`;
          ctxMenu.style.top   = `${e.clientY}px`;
          ctxMenu.classList.remove('hidden');
        };

        track.appendChild(el);
      });
    }

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // TRIMMING with ghost + tooltip + snap
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    function startTrim(e, seg, segIdx, side) {
      e.stopPropagation();
      e.preventDefault();
      saveState();

      activeTrimmingInfo = { segId: seg.id, side, origStart: seg.start, origEnd: seg.end, startX: e.clientX };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      // Create ghost
      const ghost = document.createElement('div');
      ghost.className = 'cc-segment-ghost';
      ghost.id = 'ccTrimGhost';
      track.appendChild(ghost);

      function onMove(mv) {
        const { segId, side: s, origStart, origEnd, startX } = activeTrimmingInfo;
        const theSeg = segments.find(seg => seg.id === segId);
        if (!theSeg) return;

        const deltaX   = mv.clientX - startX;
        const deltaSec = pxToSec(deltaX);

        if (s === 'left') {
          let newStart = Math.max(0, origStart + deltaSec);
          const prevSeg = segments[segments.indexOf(theSeg) - 1];
          if (prevSeg) newStart = Math.max(newStart, prevSeg.end);
          newStart = Math.min(newStart, theSeg.end - 1/FPS);
          newStart = snapSec(newStart, segId);
          theSeg.start = newStart;

          const gLeft  = secToPx(newStart);
          const gWidth = secToPx(origStart) - gLeft;
          if (gWidth > 0) {
            ghost.style.cssText = `left:${gLeft}px;width:${secToPx(origStart) - gLeft}px;top:0;height:100%;position:absolute;`;
          }
          showTrimTooltip(mv.clientX, mv.clientY, newStart);
        } else {
          let newEnd = Math.min(DURATION, origEnd + deltaSec);
          const nextSeg = segments[segments.indexOf(theSeg) + 1];
          if (nextSeg) newEnd = Math.min(newEnd, nextSeg.start);
          newEnd = Math.max(newEnd, theSeg.start + 1/FPS);
          newEnd = snapSec(newEnd, segId);
          theSeg.end = newEnd;

          const gLeft  = secToPx(origEnd);
          const gWidth = secToPx(newEnd) - gLeft;
          if (gWidth > 0) {
            ghost.style.cssText = `left:${gLeft}px;width:${gWidth}px;top:0;height:100%;position:absolute;`;
          }
          showTrimTooltip(mv.clientX, mv.clientY, newEnd);
        }
        renderTimeline();
        track.appendChild(ghost); // keep ghost on top
      }

      function onUp() {
        activeTrimmingInfo = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.getElementById('ccTrimGhost')?.remove();
        hideTrimTooltip();
        hideSnap();
        renderTimeline();
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }

    function showTrimTooltip(x, y, sec) {
      trimTooltip.textContent = formatTC(sec);
      trimTooltip.style.left = `${x + 14}px`;
      trimTooltip.style.top  = `${y - 30}px`;
      trimTooltip.classList.remove('hidden');
    }
    function hideTrimTooltip() { trimTooltip.classList.add('hidden'); }

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // BLADE CUT �€” visual flash then split
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    function doBladeCut(seg, segIdx, cutSec, el, elLeft) {
      if (cutSec <= seg.start + 1/FPS || cutSec >= seg.end - 1/FPS) return;
      saveState();

      // Flash line
      const flash = document.createElement('div');
      flash.className = 'cc-split-flash';
      flash.style.left = secToPx(cutSec) + 'px';
      track.appendChild(flash);
      setTimeout(() => flash.remove(), 350);

      const newSeg = { id: uid(), start: cutSec, end: seg.end, type: seg.type, removed: isSegmentRemoved(seg) };
      seg.end = cutSec;
      segments.splice(segIdx + 1, 0, newSeg);
      selectedIds.clear(); selectedIds.add(newSeg.id);
      renderTimeline();
    }

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // ACTIONS
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    function doSplit() {
      // Split ALL selected segments at playhead �€” or the segment under playhead
      const ct = video.currentTime;
      let targetSegs = segments.filter(s => selectedIds.has(s.id) && ct > s.start + 1/FPS && ct < s.end - 1/FPS);
      if (targetSegs.length === 0) {
        // Find segment under playhead
        const under = segments.find(s => ct > s.start && ct < s.end);
        if (under) targetSegs = [under];
      }
      if (targetSegs.length === 0) return;
      saveState();
      targetSegs.forEach(seg => {
        const idx = segments.findIndex(s => s.id === seg.id);
        const newSeg = { id: uid(), start: ct, end: seg.end, type: seg.type, removed: isSegmentRemoved(seg) };
        seg.end = ct;
        segments.splice(idx + 1, 0, newSeg);

        // Flash
        const flash = document.createElement('div');
        flash.className = 'cc-split-flash';
        flash.style.left = secToPx(ct) + 'px';
        track.appendChild(flash);
        setTimeout(() => flash.remove(), 350);
      });
      selectedIds.clear();
      renderTimeline();
    }

    function doDelete() {
      if (selectedIds.size === 0) return;
      saveState();
      segments.filter(s => selectedIds.has(s.id)).forEach(s => {
        s.type = 'remove';
        s.removed = true;
      });
      selectedIds.clear();
      renderTimeline();
    }

    function doRippleDelete() {
      if (selectedIds.size === 0) return;
      saveState();
      segments = segments.filter(s => !selectedIds.has(s.id));
      // Re-stitch remaining segments (close gaps)
      segments.sort((a, b) => a.start - b.start);
      let cursor = 0;
      segments = segments.map(s => {
        const len = s.end - s.start;
        const newSeg = { ...s, start: cursor, end: cursor + len };
        cursor += len;
        return newSeg;
      });
      selectedIds.clear();
      renderTimeline();
    }

    function doToggle() {
      if (selectedIds.size === 0) return;
      saveState();
      segments.filter(s => selectedIds.has(s.id)).forEach(s => {
        const nextType = isSegmentRemoved(s) ? 'keep' : 'remove';
        s.type = nextType;
        s.removed = nextType === 'remove';
      });
      renderTimeline();
    }

    function doUndo() {
      if (!undoStack.length) return;
      redoStack.push(JSON.parse(JSON.stringify(segments)));
      segments = undoStack.pop();
      selectedIds.clear();
      updateUndoRedoUI();
      renderTimeline();
    }
    function doRedo() {
      if (!redoStack.length) return;
      undoStack.push(JSON.parse(JSON.stringify(segments)));
      segments = redoStack.pop();
      selectedIds.clear();
      updateUndoRedoUI();
      renderTimeline();
    }

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // SCRUBBING �€” click/drag ruler
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    ruler.style.cursor = 'col-resize';
    ruler.onmousedown = (e) => {
      if (e.button !== 0) return;
      isScrubbing = true;
      scrubTo(e);
    };

    function scrubTo(e) {
      const rect  = canvas.getBoundingClientRect();
      const x     = e.clientX - rect.left;
      seekToTime(pxToSec(x), true);
    }

    canvas.addEventListener('click', (e) => {
      if (e.button !== 0 || isPanning || activeTrimmingInfo) return;
      if (e.target.closest('.cc-segment') || e.target.closest('.handle') || e.target.closest('.cc-playhead-head')) return;

      const rect = canvas.getBoundingClientRect();
      seekToTime(pxToSec(e.clientX - rect.left), true);
    });

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // MIDDLE-MOUSE PAN
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    scrollArea.onmousedown = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        isPanning     = true;
        panStartX     = e.clientX;
        panStartScroll = scrollArea.scrollLeft;
        scrollArea.style.cursor = 'grabbing';
      }
    };

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // GLOBAL MOUSE MOVE / UP
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    window.addEventListener('mousemove', (e) => {
      if (isScrubbing) scrubTo(e);
      if (isPanning) {
        scrollArea.scrollLeft = panStartScroll - (e.clientX - panStartX);
      }
    });
    window.addEventListener('mouseup', (e) => {
      isScrubbing = false;
      if (isPanning) {
        isPanning = false;
        scrollArea.style.cursor = '';
      }
    });

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // CTRL + SCROLL to zoom (centred on cursor)
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    scrollArea.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const rect     = canvas.getBoundingClientRect();
        const mouseX   = e.clientX - rect.left;
        const pivotSec = pxToSec(mouseX);
        const factor   = e.deltaY < 0 ? 1.15 : 1/1.15;
        applyZoom(zoomLevel * factor, pivotSec);
      }
    }, { passive: false });

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // VIDEO SYNC
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    function isSegmentRemoved(seg) {
      return seg.removed === true || seg.type === 'remove';
    }

    function seekToTime(time, autoScroll = true) {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : DURATION;
      video.currentTime = Math.max(0, Math.min(duration, time));
      updatePlaybackUI(autoScroll);
    }

    function updatePlaybackUI(autoScroll = false) {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : DURATION;
      const ct = Math.max(0, Math.min(duration, video.currentTime || 0));
      const newLeft = duration > 0 ? (ct / duration) * trackWidth() : 0;

      timecodeEl.textContent = `${formatTC(ct)} / ${formatTC(duration)}`;
      playhead.style.left = `${newLeft}px`;

      if (autoScroll) {
        const containerLeft = scrollArea.scrollLeft;
        const containerRight = containerLeft + scrollArea.clientWidth;
        if (newLeft < containerLeft + 50 || newLeft > containerRight - 50) {
          scrollArea.scrollLeft = Math.max(0, newLeft - scrollArea.clientWidth / 2);
        }
      }
    }

    function stopPlayheadSync() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function skipRemovedSegments() {
      if (video.paused || isScrubbing) return;

      const current = video.currentTime;
      const removedSeg = segments.find(s => isSegmentRemoved(s) && current >= s.start && current < s.end);
      if (!removedSeg) return;

      const next = segments
        .filter(s => !isSegmentRemoved(s) && s.start >= removedSeg.end)
        .sort((a, b) => a.start - b.start)[0];

      if (next) seekToTime(next.start, true);
      else video.pause();
    }

    function syncPlayhead() {
      updatePlaybackUI(true);
      skipRemovedSegments();
      rafId = requestAnimationFrame(syncPlayhead);
    }

    function handleVideoMetadata() {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        DURATION = video.duration;
      }
      seekToTime(0, false);
      scrollArea.scrollLeft = 0;
      renderTimeline();
    }

    video.addEventListener('loadedmetadata', handleVideoMetadata);
    video.addEventListener('timeupdate', () => {
      updatePlaybackUI(false);
      skipRemovedSegments();
    });
    video.addEventListener('seeked', () => updatePlaybackUI(true));
    video.addEventListener('play', () => {
      stopPlayheadSync();
      syncPlayhead();
    });
    video.addEventListener('pause', () => {
      stopPlayheadSync();
      updatePlaybackUI(true);
    });
    video.addEventListener('ended', stopPlayheadSync);

    video.addEventListener('play',  () => { playOverlay.classList.add('hidden');    btnPlay.textContent = '⏸'; });
    video.addEventListener('pause', () => { playOverlay.classList.remove('hidden'); btnPlay.textContent = '▶️'; });

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // PLAYBACK CONTROLS
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    playOverlay.onclick = () => video.play();
    btnPlay.onclick     = () => video.paused ? video.play() : video.pause();
    document.getElementById('ccBtnStart').onclick  = () => seekToTime(0, true);
    document.getElementById('ccBtnEnd').onclick    = () => seekToTime(DURATION, true);
    document.getElementById('ccBtnBack5').onclick  = () => seekToTime(video.currentTime - 5, true);
    document.getElementById('ccBtnFwd5').onclick   = () => seekToTime(video.currentTime + 5, true);
    volumeSlider.oninput = (e) => { video.volume = parseFloat(e.target.value); };

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // TOOL BUTTONS
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    document.getElementById('ccBtnSplitTool').onclick   = doSplit;
    document.getElementById('ccBtnDeleteTool').onclick  = doDelete;
    document.getElementById('ccBtnRippleDelete').onclick = doRippleDelete;
    document.getElementById('ccBtnRestoreTool').onclick = doToggle;
    if (btnBlade1) btnBlade1.onclick = toggleBlade;
    if (btnBlade2) btnBlade2.onclick = toggleBlade;

    btnUndo.onclick = doUndo;
    btnRedo.onclick = doRedo;

    btnZoomIn.onclick  = () => applyZoom(zoomLevel * 1.5, pxToSec(secToPx(video.currentTime)));
    btnZoomOut.onclick = () => applyZoom(zoomLevel / 1.5, pxToSec(secToPx(video.currentTime)));
    zoomSlider.oninput = (e) => applyZoom(parseFloat(e.target.value), pxToSec(secToPx(video.currentTime)));

    document.getElementById('ctxSplit').onclick  = doSplit;
    document.getElementById('ctxToggle').onclick = doToggle;
    document.getElementById('ctxDelete').onclick = doDelete;
    document.addEventListener('click', () => ctxMenu.classList.add('hidden'));
    // Don't close ctx on click inside it
    ctxMenu.addEventListener('click', (e) => e.stopPropagation());

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // KEYBOARD SHORTCUTS
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    const onKeyDown = (e) => {
      if (!document.body.classList.contains('in-editor-mode')) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const ct = video.currentTime;
      switch(true) {
        case e.code === 'Space':
          e.preventDefault(); video.paused ? video.play() : video.pause(); break;
        case e.code === 'KeyS':
        case (e.ctrlKey && e.code === 'KeyB'):
          e.preventDefault(); doSplit(); break;
        case e.code === 'KeyB':
          e.preventDefault(); toggleBlade(); break;
        case (e.code === 'Delete' || e.code === 'Backspace') && e.shiftKey:
          e.preventDefault(); doRippleDelete(); break;
        case (e.code === 'Delete' || e.code === 'Backspace'):
          e.preventDefault(); doDelete(); break;
        case e.code === 'KeyZ' && e.ctrlKey && !e.shiftKey:
          e.preventDefault(); doUndo(); break;
        case e.code === 'KeyZ' && e.ctrlKey && e.shiftKey:
        case e.code === 'KeyY' && e.ctrlKey:
          e.preventDefault(); doRedo(); break;
        case e.code === 'ArrowRight' && e.shiftKey:
          e.preventDefault(); seekToTime(ct + 5, true); break;
        case e.code === 'ArrowLeft' && e.shiftKey:
          e.preventDefault(); seekToTime(ct - 5, true); break;
        case e.code === 'ArrowRight':
          e.preventDefault(); seekToTime(ct + 1/FPS, true); break;
        case e.code === 'ArrowLeft':
          e.preventDefault(); seekToTime(ct - 1/FPS, true); break;
        case e.code === 'Home':
          e.preventDefault(); seekToTime(0, true); break;
        case e.code === 'End':
          e.preventDefault(); seekToTime(DURATION, true); break;
        case e.key === '+' || e.key === '=':
          e.preventDefault(); applyZoom(zoomLevel * 1.5, ct); break;
        case e.key === '-' || e.key === '_':
          e.preventDefault(); applyZoom(zoomLevel / 1.5, ct); break;
        case e.code === 'Escape':
          if (bladeMode) toggleBlade();
          selectedIds.clear(); renderTimeline(); break;
        case e.code === 'KeyA' && e.ctrlKey:
          e.preventDefault(); segments.forEach(s => selectedIds.add(s.id)); renderTimeline(); break;
      }
    };

    window.removeEventListener('keydown', window._ccKeyHandler);
    window._ccKeyHandler = onKeyDown;
    window.addEventListener('keydown', onKeyDown);

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // TABS
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    document.querySelectorAll('.cc-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.cc-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.cc-tab-content').forEach(c => c.classList.add('hidden'));
        tab.classList.add('active');
        const target = document.getElementById(tab.dataset.target);
        if (target) target.classList.remove('hidden');
      };
    });

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // EXPORT
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    btnExport.onclick = (e) => { e.stopPropagation(); exportMenu.classList.toggle('hidden'); };

    exportMenu.querySelectorAll('.cc-dropdown-item').forEach(item => {
      item.onclick = async () => {
        const fmt = item.dataset.fmt;
        const origText = btnExport.textContent;
        btnExport.textContent = '⏳ جار�Š ا�„تصد�Šر...';
        btnExport.disabled = true;
        exportMenu.classList.add('hidden');
        try {
          if (fmt === 'mp4') {
            const res = await fetch(`/api/render/${jobId}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ timeline: segments })
            });
            if (!res.ok) throw new Error('فش�„ ا�„ر�†در');
            const data = await res.json();
            const a = Object.assign(document.createElement('a'), { href: data.downloadUrl, download: `cutflow_${jobId}.mp4` });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          } else {
            const res = await fetch(`/api/export/${jobId}/${fmt}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ timeline: segments })
            });
            if (!res.ok) throw new Error('فش�„ ا�„تصد�Šر');
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = Object.assign(document.createElement('a'), { href: url, download: `cutflow_export.${fmt}` });
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          alert(err.message);
        } finally {
          btnExport.textContent = origText;
          btnExport.disabled = false;
        }
      };
    });

    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    // INIT
    // �”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€�”€
    video.src = streamUrl;
    if (video.readyState >= 1) {
      handleVideoMetadata();
    }
    updateUndoRedoUI();

  } catch (err) {
    console.error('Timeline initialization error:', err);
    const view = document.getElementById('view-timeline');
    if (view) {
      view.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0A0A0F;color:#fff;">
          <div style="font-size:3rem;margin-bottom:1rem;">�š�️</div>
          <h2 style="margin-bottom:0.5rem;">حدث خطأ أث�†اء تح�…�Š�„ ا�„�…حرر</h2>
          <p style="color:#888;margin-bottom:1.5rem;direction:ltr;">${err.message}</p>
          <button onclick="window.location.href='/dashboard'" style="background:#7C3AED;color:#fff;border:none;padding:0.8rem 2rem;border-radius:8px;cursor:pointer;font-size:1rem;">ا�„ع�ˆدة �„�„�ˆحة ا�„تح�ƒ�…</button>
        </div>`;
    }
  }
}



/* =========================================================================
   PRICING & UPGRADE LOGIC
   ========================================================================= */

function showToast(message) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>ℹ️</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.querySelectorAll('.btn-payment-toast').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('قريباً! سيتم إضافة الدفع قريباً — تواصل معنا على info@cutflow.io');
  });
});

const upgradeModal = document.getElementById('upgradeModal');
const closeUpgradeModal = document.getElementById('closeUpgradeModal');

window.openUpgradeModal = function() {
  if (upgradeModal) {
    upgradeModal.classList.remove('hidden');
  }
};

if (closeUpgradeModal) {
  closeUpgradeModal.addEventListener('click', () => {
    upgradeModal.classList.add('hidden');
  });
}

const btnAccountUpgrade = document.getElementById('btnAccountUpgrade');
if (btnAccountUpgrade) {
  btnAccountUpgrade.addEventListener('click', (e) => {
    e.preventDefault();
    window.openUpgradeModal();
  });
}

// Add event listener to any link pointing to #pricing or /pricing
document.querySelectorAll('a[href="/pricing"], a[href="#pricing"]').forEach(link => {
  link.addEventListener('click', (e) => {
    // Let the router handle /pricing, but if we need a quick nav for anchor links:
    if (link.getAttribute('href') === '#pricing') {
      e.preventDefault();
      window.history.pushState({}, '', '/pricing');
      renderRoute('/pricing');
    }
  });
});
