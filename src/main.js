import { initI18n, applyTranslations, toggleLanguage, getCurrentLang } from './i18n.js';
import './theme.css';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize bilingual support first
  initI18n();

  // Minimal routing for Landing page & Pricing page
  const routes = {
    '/': 'view-landing',
    '/pricing': 'view-pricing'
  };

  function renderRoute(path) {
    document.querySelectorAll('.route-view').forEach(view => {
      view.classList.remove('active');
    });

    const viewId = routes[path] || 'view-landing';
    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.add('active');
    }
  }

  window.addEventListener('popstate', () => {
    renderRoute(window.location.pathname);
  });

  // Intercept navigation links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.classList.contains('nav-route')) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('/app.html')) {
        e.preventDefault();
        window.history.pushState({}, '', href);
        renderRoute(href);
      }
    }
  });

  // Mobile Menu Attachment Helper (Landing Page Only)
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

  // Dynamic Navbar Auth States (Landing Page Only)
  function updateNavbarAuth() {
    const token = localStorage.getItem('token');
    const desktopAuth = document.getElementById('desktopAuthLinks');
    const mobileAuth = document.getElementById('mobileAuthLinks');

    if (token) {
      if (desktopAuth) {
        desktopAuth.innerHTML = `
          <a href="/app.html#/dashboard" class="nav-link" style="margin-left:1.5rem;">لوحة التحكم</a>
          <button class="btn btn-secondary btn-nav" id="btnNavbarLogout">تسجيل الخروج</button>
          <button class="mobile-menu-toggle" id="menuToggle" aria-label="Open menu" style="margin-right:1rem;">
            <span></span><span></span><span></span>
          </button>
        `;
      }
      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <a href="/app.html#/dashboard" class="nav-link">لوحة التحكم</a>
          <button class="btn btn-secondary btn-nav btn-block" id="btnMobileNavbarLogout">تسجيل الخروج</button>
        `;
      }

      // Attach logout event
      const btnNavbarLogout = document.getElementById('btnNavbarLogout');
      const btnMobileNavbarLogout = document.getElementById('btnMobileNavbarLogout');
      [btnNavbarLogout, btnMobileNavbarLogout].forEach(btn => {
        if (btn) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user_name');
            window.location.reload();
          });
        }
      });
    }
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
        waveformStatus.textContent = 'الحالة: متوقف. اضغط تشغيل لمشاهدة الحركة.';
        return;
      }

      if (isCleanedMode) {
        waveformStatus.textContent = 'الحالة: تشغيل الفيديو النظيف (تم قص 3 سكتات تلقائياً) ✂️';
      } else {
        if (
          (playheadProgress >= 15 && playheadProgress <= 25) ||
          (playheadProgress >= 50 && playheadProgress <= 62) ||
          (playheadProgress >= 82 && playheadProgress <= 90)
        ) {
          waveformStatus.textContent = 'الحالة: جاري كتم/قص السكتة الحالية... 🔇';
        } else {
          waveformStatus.textContent = 'الحالة: تشغيل الصوت الأصلي... 🗣️';
        }
      }
    }

    btnPlayWaveform.addEventListener('click', () => {
      if (isPlayingWaveform) {
        isPlayingWaveform = false;
        btnPlayWaveform.querySelector('.play-icon').classList.remove('hidden');
        btnPlayWaveform.querySelector('.pause-icon').classList.add('hidden');
        btnPlayWaveform.querySelector('.btn-text').textContent = 'شغّل العرض التجريبي';
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
        btnPlayWaveform.querySelector('.btn-text').textContent = 'إيقاف مؤقت';
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
        { min: 0, max: 25, text: 'جاري رفع الملف وتحليله على خوادم كوت فلو...' },
        { min: 25, max: 55, text: 'الـ AI يبحث عن الفترات الصامتة والسكتات باللغتين العربية والإنجليزية...' },
        { min: 55, max: 80, text: 'جارٍ قص السكتات وإجراء تحسين لتدفق الصوت وتنعيم الانتقالات...' },
        { min: 80, max: 100, text: 'جارٍ إعادة التشفير وحفظ الفيديو النهائي للتحميل...' }
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
        alert('شكراً لتجربتك العرض التوضيحي! يتم الآن تحميل ملف محاكاة: "Vireon_demo_clean.mp4"');
        const element = document.createElement('a');
        const file = new Blob(['شكراً لاستخدامك كوت فلو! هذا ملف تجريبي يمثل الفيديو المقصوص بنجاح.'], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'Vireon_demo_clean.mp4.txt';
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
  // Bootup
  // -------------------------------------------------------------
  renderRoute(window.location.pathname);
  updateNavbarAuth();
  attachMenuToggle();
  initWaveformDemo();
  initLandingUploader();
  initPricingToggle();
  initFaqAccordion();

  // Upgrade Modal triggers on landing page
  const upgradeModal = document.getElementById('upgradeModal');
  const closeUpgradeModal = document.getElementById('closeUpgradeModal');

  window.openUpgradeModal = function() {
    if (upgradeModal) {
      upgradeModal.classList.remove('hidden');
    }
  };

  if (closeUpgradeModal) {
    closeUpgradeModal.addEventListener('click', () => {
      if (upgradeModal) upgradeModal.classList.add('hidden');
    });
  }

  document.querySelectorAll('.btn-payment-toast').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Show payment toast
      let toastContainer = document.querySelector('.toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
      }
      
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<span>ℹ️</span> <span>الدفع قيد التطوير حالياً، ترقبوا التحديث القادم! 🚀</span>`;
      toastContainer.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    });
  });
});
