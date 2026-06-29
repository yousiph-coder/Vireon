import "./style.css";
document.addEventListener("DOMContentLoaded", () => {
  const globalAuthSpinner = document.getElementById("globalAuthSpinner");
  const authSpinnerText = document.getElementById("authSpinnerText");
  function showGlobalSpinner(text = "\u062C\u0627\u0631\uFFFD\u0160 \u0627\uFFFD\u201E\u062A\u062D\uFFFD\u201A\uFFFD\u201A...") {
    if (globalAuthSpinner && authSpinnerText) {
      authSpinnerText.textContent = text;
      globalAuthSpinner.classList.remove("hidden");
    }
  }
  function hideGlobalSpinner() {
    if (globalAuthSpinner) {
      globalAuthSpinner.classList.add("hidden");
    }
  }
  function attachMenuToggle() {
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");
    if (menuToggle && navMenu) {
      const newToggle = menuToggle.cloneNode(true);
      menuToggle.parentNode.replaceChild(newToggle, menuToggle);
      newToggle.addEventListener("click", () => {
        newToggle.classList.toggle("active");
        navMenu.classList.toggle("active");
      });
      navMenu.querySelectorAll(".nav-link, .btn").forEach((link) => {
        link.addEventListener("click", () => {
          newToggle.classList.remove("active");
          navMenu.classList.remove("active");
        });
      });
    }
  }
  function updateNavbarAuth() {
    const token = localStorage.getItem("token");
    const desktopAuth = document.getElementById("desktopAuthLinks");
    const mobileAuth = document.getElementById("mobileAuthLinks");
    if (token) {
      if (desktopAuth) {
        desktopAuth.innerHTML = `
          <a href="/dashboard" class="nav-link nav-route" style="margin-left:1.5rem;">\uFFFD\u201E\uFFFD\u02C6\u062D\u0629 \u0627\uFFFD\u201E\u062A\u062D\uFFFD\u0192\uFFFD\u2026</a>
          <button class="btn btn-secondary btn-nav" id="btnNavbarLogout">\u062A\u0633\u062C\uFFFD\u0160\uFFFD\u201E \u0627\uFFFD\u201E\u062E\u0631\uFFFD\u02C6\u062C</button>
          <button class="mobile-menu-toggle" id="menuToggle" aria-label="Open menu" style="margin-right:1rem;">
            <span></span><span></span><span></span>
          </button>
        `;
      }
      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <a href="/dashboard" class="nav-link nav-route">\uFFFD\u201E\uFFFD\u02C6\u062D\u0629 \u0627\uFFFD\u201E\u062A\u062D\uFFFD\u0192\uFFFD\u2026</a>
          <button class="btn btn-secondary btn-nav btn-block" id="btnMobileNavbarLogout">\u062A\u0633\u062C\uFFFD\u0160\uFFFD\u201E \u0627\uFFFD\u201E\u062E\u0631\uFFFD\u02C6\u062C</button>
        `;
      }
    } else {
      if (desktopAuth) {
        desktopAuth.innerHTML = `
          <a href="/login" class="nav-link login-link desktop-only nav-route" style="margin-left:1.5rem;">\u062A\u0633\u062C\uFFFD\u0160\uFFFD\u201E \u0627\uFFFD\u201E\u062F\u062E\uFFFD\u02C6\uFFFD\u201E</a>
          <a href="/signup" class="btn btn-primary desktop-only nav-route">\u0627\u0628\u062F\u0623 \uFFFD\u2026\u062C\u0627\uFFFD\u2020\u0627\uFFFD\u2039</a>
          <button class="mobile-menu-toggle" id="menuToggle" aria-label="Open menu" style="margin-right:1rem;">
            <span></span><span></span><span></span>
          </button>
        `;
      }
      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <a href="/login" class="nav-link login-link nav-route">\u062A\u0633\u062C\uFFFD\u0160\uFFFD\u201E \u0627\uFFFD\u201E\u062F\u062E\uFFFD\u02C6\uFFFD\u201E</a>
          <a href="/signup" class="btn btn-primary btn-nav nav-route">\u0627\u0628\u062F\u0623 \uFFFD\u2026\u062C\u0627\uFFFD\u2020\u0627\uFFFD\u2039</a>
        `;
      }
    }
    attachMenuToggle();
    attachNavbarLogoutEvents();
  }
  function attachNavbarLogoutEvents() {
    const btnNavbarLogout = document.getElementById("btnNavbarLogout");
    const btnMobileNavbarLogout = document.getElementById("btnMobileNavbarLogout");
    [btnNavbarLogout, btnMobileNavbarLogout].forEach((btn) => {
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          logoutUser();
        });
      }
    });
  }
  const routes = {
    "/": { viewId: "view-landing", requiresAuth: false, title: "CutFlow | \u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0645\u0648\u0646\u062A\u0627\u062C \u0627\u0644\u0630\u0643\u064A" },
    "/login": { viewId: "view-login", requiresAuth: false, title: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 | CutFlow" },
    "/signup": { viewId: "view-signup", requiresAuth: false, title: "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628 | CutFlow" },
    "/forgot-password": { viewId: "view-forgot-password", requiresAuth: false, title: "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 | CutFlow" },
    "/dashboard": { viewId: "view-dashboard", subviewId: "dash-subview-home", requiresAuth: true, title: "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 | CutFlow" },
    "/dashboard/editor": { viewId: "view-dashboard", subviewId: "dash-subview-editor", requiresAuth: true, title: "\u0627\u0644\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0630\u0643\u064A | CutFlow" },
    "/dashboard/videos": { viewId: "view-dashboard", subviewId: "dash-subview-videos", requiresAuth: true, title: "\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A\u064A | CutFlow" },
    "/dashboard/settings": { viewId: "view-dashboard", subviewId: "dash-subview-settings", requiresAuth: true, title: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062D\u0633\u0627\u0628 | CutFlow" },
    "/dashboard/account": { viewId: "view-dashboard", subviewId: "dash-subview-account", requiresAuth: true, title: "\u062D\u0633\u0627\u0628\u064A | CutFlow" },
    "/dashboard/timeline": { viewId: "view-timeline", requiresAuth: true, title: "\u0627\u0644\u0645\u062D\u0631\u0631 | CutFlow" }
  };
  function renderRoute(path) {
    const cleanPath = path.split("#")[0].split("?")[0] || "/";
    const route = routes[cleanPath] || routes["/"];
    const token = localStorage.getItem("token");
    if (route.requiresAuth && !token) {
      showGlobalSpinner("\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0628\u0627\u0644\u062F\u062E\u0648\u0644. \u062C\u0627\u0631\u064A \u062A\u0648\u062C\u064A\u0647\u0643 \u0644\u0635\u0641\u062D\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644...");
      setTimeout(() => {
        hideGlobalSpinner();
        navigate("/login");
      }, 1e3);
      return;
    }
    if ((cleanPath === "/login" || cleanPath === "/signup") && token) {
      navigate("/dashboard");
      return;
    }
    executeRouteRender(route, cleanPath);
  }
  function executeRouteRender(route, path) {
    document.querySelectorAll(".route-view").forEach((view) => {
      view.classList.remove("active");
    });
    const activeView = document.getElementById(route.viewId);
    if (activeView) {
      activeView.classList.add("active");
    }
    document.title = route.title;
    updateNavbarAuth();
    window.scrollTo({ top: 0 });
    if (route.viewId === "view-dashboard") {
      document.querySelectorAll(".dash-subview").forEach((subview) => {
        subview.classList.remove("active");
      });
      const activeSubview = document.getElementById(route.subviewId);
      if (activeSubview) {
        activeSubview.classList.add("active");
      }
      document.querySelectorAll(".dash-nav-item, .mobile-nav-item").forEach((navItem) => {
        const itemHref = navItem.getAttribute("href");
        if (itemHref === path) {
          navItem.classList.add("active");
        } else {
          navItem.classList.remove("active");
        }
      });
      initDashboard();
    }
  }
  function navigate(path) {
    window.history.pushState({}, "", path);
    renderRoute(path);
  }
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-route");
    if (link) {
      e.preventDefault();
      const path = link.getAttribute("href");
      navigate(path);
    }
  });
  window.addEventListener("popstate", () => {
    renderRoute(window.location.pathname);
  });
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const btnGoogleLogin = document.getElementById("btnGoogleLogin");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;
      if (!email || !password) {
        showError(loginError, "\u0627\u0644\u0631\u062C\u0627\u0621 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.");
        return;
      }
      showGlobalSpinner("\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644...");
      setTimeout(() => {
        hideGlobalSpinner();
        const mockJWT = `header.${btoa(JSON.stringify({ email, role: "creator" }))}.signature`;
        localStorage.setItem("token", mockJWT);
        const namePrefix = email.split("@")[0];
        const displayName = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);
        localStorage.setItem("user_name", displayName);
        navigate("/dashboard");
        loginForm.reset();
      }, 1e3);
    });
  }
  const signupForm = document.getElementById("signupForm");
  const signupError = document.getElementById("signupError");
  const btnGoogleSignup = document.getElementById("btnGoogleSignup");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;
      const confirmPassword = document.getElementById("signupConfirmPassword").value;
      if (!name || !email || !password || !confirmPassword) {
        showError(signupError, "\u0627\u0644\u0631\u062C\u0627\u0621 \u0645\u0644\u0621 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.");
        return;
      }
      if (password !== confirmPassword) {
        showError(signupError, "\u0639\u0630\u0631\u0627\u064B\u060C \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0648\u062A\u0623\u0643\u064A\u062F\u0647\u0627 \u063A\u064A\u0631 \u0645\u062A\u0637\u0627\u0628\u0642\u064A\u0646.");
        return;
      }
      showGlobalSpinner("\u062C\u0627\u0631\u064A \u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u062E\u0627\u0635 \u0648\u062A\u0647\u064A\u0626\u0629 \u0628\u064A\u0626\u0629 \u0627\u0644\u0639\u0645\u0644...");
      setTimeout(() => {
        hideGlobalSpinner();
        const mockJWT = `header.${btoa(JSON.stringify({ email, name }))}.signature`;
        localStorage.setItem("token", mockJWT);
        localStorage.setItem("user_name", name);
        navigate("/dashboard");
        signupForm.reset();
      }, 1200);
    });
  }
  [btnGoogleLogin, btnGoogleSignup].forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showGlobalSpinner("\u0627\u062A\u0635\u0627\u0644 \u0622\u0645\u0646 \u0628\u0640 Google OAuth...");
        setTimeout(() => {
          hideGlobalSpinner();
          localStorage.setItem("token", "google-oauth-mock-jwt-token-xyz");
          localStorage.setItem("user_name", "\u0645\u0633\u062A\u062E\u062F\u0645 \u062C\u0648\u062C\u0644");
          navigate("/dashboard");
        }, 1100);
      });
    }
  });
  const forgotForm = document.getElementById("forgotForm");
  const forgotSuccess = document.getElementById("forgotSuccess");
  const forgotGroupInput = document.getElementById("forgotGroupInput");
  const btnForgotSubmit = document.getElementById("btnForgotSubmit");
  if (forgotForm) {
    forgotForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("forgotEmail").value.trim();
      if (!email) return;
      showGlobalSpinner("\u062C\u0627\u0631\u064A \u0625\u0631\u0633\u0627\u0644 \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629...");
      setTimeout(() => {
        hideGlobalSpinner();
        forgotSuccess.classList.remove("hidden");
        if (forgotGroupInput) forgotGroupInput.classList.add("hidden");
        if (btnForgotSubmit) btnForgotSubmit.classList.add("hidden");
      }, 900);
    });
  }
  function logoutUser() {
    showGlobalSpinner("\u062C\u0627\u0631\u064A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0648\u062A\u0637\u0647\u064A\u0631 \u0627\u0644\u062C\u0644\u0633\u0629...");
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user_name");
      hideGlobalSpinner();
      updateNavbarAuth();
      navigate("/login");
    }, 800);
  }
  function showError(element, msg) {
    if (element) {
      element.textContent = msg;
      element.classList.remove("hidden");
      setTimeout(() => {
        element.classList.add("hidden");
      }, 4e3);
    }
  }
  function initDashboard() {
    const storedName = localStorage.getItem("user_name") || "\u0635\u0627\u0646\u0639 \u0627\u0644\u0645\u062D\u062A\u0648\u0649";
    const welcomeName = document.getElementById("dashWelcomeName");
    const sidebarProfileName = document.getElementById("sidebarProfileName");
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    if (welcomeName) welcomeName.textContent = storedName;
    if (sidebarProfileName) sidebarProfileName.textContent = storedName;
    if (sidebarAvatar) sidebarAvatar.textContent = storedName.charAt(0).toUpperCase();
    const btnSidebarLogout = document.getElementById("btnSidebarLogout");
    if (btnSidebarLogout) {
      btnSidebarLogout.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
      });
    }
    renderDashboardStats();
    initDashboardUploader();
  }
  function renderDashboardStats() {
    const minutesUsed = parseInt(localStorage.getItem("stats_minutes")) || 0;
    const videosCount = parseInt(localStorage.getItem("stats_videos")) || 0;
    const currentPlan = localStorage.getItem("stats_plan") || "Free";
    const statMinutes = document.getElementById("statMinutes");
    const statVideosCount = document.getElementById("statVideosCount");
    const statPlanTier = document.getElementById("statPlanTier");
    const accPlanTier = document.getElementById("accPlanTier");
    const accCredits = document.getElementById("accCredits");
    if (statMinutes) statMinutes.textContent = minutesUsed;
    if (statVideosCount) statVideosCount.textContent = videosCount;
    if (statPlanTier) statPlanTier.textContent = currentPlan;
    if (accPlanTier) accPlanTier.textContent = `${currentPlan} (\u0645\u062E\u0637\u0637 \u062A\u062C\u0631\u064A\u0628\u064A)`;
    if (accCredits) accCredits.textContent = `${30 - minutesUsed} \u062F\u0642\u064A\u0642\u0629`;
    const rawVideos = localStorage.getItem("processed_videos") || "[]";
    const videosList = JSON.parse(rawVideos);
    const dashHomeEmptyState = document.getElementById("dashHomeEmptyState");
    const dashHomeRecentTable = document.getElementById("dashHomeRecentTable");
    const homeRecentVideosList = document.getElementById("homeRecentVideosList");
    const dashVideosEmptyState = document.getElementById("dashVideosEmptyState");
    const dashVideosListFilled = document.getElementById("dashVideosListFilled");
    const videosListFullContainer = document.getElementById("videosListFullContainer");
    if (videosList.length > 0) {
      if (dashHomeEmptyState) dashHomeEmptyState.classList.add("hidden");
      if (dashHomeRecentTable) dashHomeRecentTable.classList.remove("hidden");
      if (dashVideosEmptyState) dashVideosEmptyState.classList.add("hidden");
      if (dashVideosListFilled) dashVideosListFilled.classList.remove("hidden");
      const renderItemMarkup = (v) => `
        <div class="video-list-item glass-panel">
          <div class="video-item-icon">\u{1F3AC}</div>
          <div class="video-item-details">
            <h4 class="video-item-title">${v.name}</h4>
            <p class="video-item-meta">${v.timeStr} \u2022 \u0627\u0644\u062D\u062C\u0645: ${v.sizeMB} \u0645\u064A\u062C\u0627\u0628\u0627\u064A\u062A \u2022 \u062A\u0645 \u062A\u0648\u0641\u064A\u0631: ${v.savedSec}\u062B</p>
          </div>
          <button class="btn btn-secondary btn-nav download-list-item-btn" data-name="${v.name}">\u062A\u062D\u0645\u064A\u0644</button>
        </div>
      `;
      if (homeRecentVideosList) {
        homeRecentVideosList.innerHTML = videosList.slice(0, 3).map(renderItemMarkup).join("");
      }
      if (videosListFullContainer) {
        videosListFullContainer.innerHTML = videosList.map(renderItemMarkup).join("");
      }
      document.querySelectorAll(".download-list-item-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const fName = btn.getAttribute("data-name");
          triggerMockFileDownload(fName);
        });
      });
    } else {
      if (dashHomeEmptyState) dashHomeEmptyState.classList.remove("hidden");
      if (dashHomeRecentTable) dashHomeRecentTable.classList.add("hidden");
      if (dashVideosEmptyState) dashVideosEmptyState.classList.remove("hidden");
      if (dashVideosListFilled) dashVideosListFilled.classList.add("hidden");
    }
  }
  function initDashboardUploader() {
    const dashUploadZone = document.getElementById("dashUploadZone");
    const btnDashUploadTrigger = document.getElementById("btnDashUploadTrigger");
    const dashFileInput = document.getElementById("dashFileInput");
    const dashSettingsPanel = document.getElementById("dashSettingsPanel");
    const previewFileName = document.getElementById("previewFileName");
    const previewFileMeta = document.getElementById("previewFileMeta");
    const btnRemoveFile = document.getElementById("btnRemoveFile");
    const btnCancelUpload = document.getElementById("btnCancelUpload");
    const btnStartProcessing = document.getElementById("btnStartProcessing");
    const silenceThresholdSlider = document.getElementById("silenceThresholdSlider");
    const silenceThresholdValue = document.getElementById("silenceThresholdValue");
    const sensitivitySlider = document.getElementById("sensitivitySlider");
    const sensitivityValue = document.getElementById("sensitivityValue");
    const langBtns = document.querySelectorAll(".lang-btn");
    const dashProcessingZone = document.getElementById("dashProcessingZone");
    const dashDoneZone = document.getElementById("dashDoneZone");
    const dashProgressBar = document.getElementById("dashProgressBar");
    const dashProgressPercent = document.getElementById("dashProgressPercent");
    const dashProcTitle = document.getElementById("dashProcTitle");
    const dashProcSub = document.getElementById("dashProcSub");
    const resFileName = document.getElementById("resFileName");
    const resSavedTime = document.getElementById("resSavedTime");
    const resFinalLen = document.getElementById("resFinalLen");
    const resSizeSaved = document.getElementById("resSizeSaved");
    const btnDashDownloadResult = document.getElementById("btnDashDownloadResult");
    const btnDashResetUploader = document.getElementById("btnDashResetUploader");
    if (!dashUploadZone) return;
    let currentFile = null;
    function showOnly(el) {
      [dashUploadZone, dashSettingsPanel, dashProcessingZone, dashDoneZone].forEach((z) => {
        if (z) z.classList.add("hidden");
      });
      if (el) el.classList.remove("hidden");
    }
    function formatBytes(bytes) {
      if (!bytes || bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }
    function showSettingsPanel(file) {
      currentFile = file;
      if (previewFileName) previewFileName.textContent = file.name;
      if (previewFileMeta) previewFileMeta.textContent = formatBytes(file.size);
      showOnly(dashSettingsPanel);
    }
    langBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        langBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
    if (silenceThresholdSlider && silenceThresholdValue) {
      silenceThresholdSlider.addEventListener("input", () => {
        const val = (parseInt(silenceThresholdSlider.value) / 10).toFixed(1);
        silenceThresholdValue.textContent = `${val} \u062B`;
      });
    }
    const sensitivityLabels = { "1": "\u0645\u0646\u062E\u0641\u0636", "2": "\u0645\u062A\u0648\u0633\u0637", "3": "\u0639\u0627\u0644\u064A" };
    if (sensitivitySlider && sensitivityValue) {
      sensitivitySlider.addEventListener("input", () => {
        sensitivityValue.textContent = sensitivityLabels[sensitivitySlider.value] || "\u0645\u062A\u0648\u0633\u0637";
      });
    }
    function goBackToUpload() {
      showOnly(dashUploadZone);
      if (dashFileInput) dashFileInput.value = "";
      currentFile = null;
    }
    if (btnRemoveFile) btnRemoveFile.addEventListener("click", goBackToUpload);
    if (btnCancelUpload) btnCancelUpload.addEventListener("click", goBackToUpload);
    async function triggerDashProcessing(file) {
      if (!file) return;
      currentFile = file;
      showOnly(dashProcessingZone);
      if (dashProgressBar) dashProgressBar.style.width = "0%";
      if (dashProgressPercent) dashProgressPercent.textContent = "0%";
      const procSteps = [
        { id: "procStep1", title: "\u{1F4E4} \u062C\u0627\u0631\u064A \u0631\u0641\u0639 \u0627\u0644\u0641\u064A\u062F\u064A\u0648...", sub: "\u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641 \u0625\u0644\u0649 \u062E\u0648\u0627\u062F\u0645 \u0643\u0648\u062A \u0641\u0644\u0648..." },
        { id: "procStep2", title: "\u{1F9E0} \u0627\u0644\u0640 AI \u0628\u064A\u062D\u0644\u0644 \u0627\u0644\u0635\u0648\u062A...", sub: "\u0643\u0634\u0641 \u0627\u0644\u0633\u0643\u062A\u0627\u062A \u0648\u0627\u0644\u0648\u0642\u0641\u0627\u062A..." },
        { id: "procStep3", title: "\u2702\uFE0F \u0628\u064A\u0634\u064A\u0644 \u0627\u0644\u0633\u0643\u062A\u0627\u062A...", sub: "\u0642\u0635 \u0648\u062A\u0646\u0639\u064A\u0645 \u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644\u0627\u062A (Crossfades)..." },
        { id: "procStep4", title: "\u2705 \u062C\u0627\u0647\u0632 \u0644\u0644\u062A\u062D\u0645\u064A\u0644!", sub: "\u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0646\u0638\u064A\u0641 \u062A\u0645\u0627\u0645\u0627\u064B \u0648\u062C\u0627\u0647\u0632 \u0644\u0644\u0645\u0634\u0627\u0647\u062F\u0629..." }
      ];
      procSteps.forEach((s, idx) => {
        const el = document.getElementById(s.id);
        if (el) {
          el.classList.remove("active", "done");
          if (idx === 0) el.classList.add("active");
        }
      });
      if (dashProcTitle) dashProcTitle.textContent = procSteps[0].title;
      if (dashProcSub) dashProcSub.textContent = procSteps[0].sub;
      const formData = new FormData();
      formData.append("video", file);
      const langActive = document.querySelector(".lang-btn.active");
      const langMap = { "\uFFFD\u0178\u2021\uFFFD\uFFFD\u0178\u2021\uFFFD \u0639\u0631\u0628\uFFFD\u0160": "ar", "\uFFFD\u0178\u2021\uFFFD\uFFFD\u0178\u2021\uFFFD English": "en", "\uFFFD\u0178\u201D\u20AC \uFFFD\u0192\uFFFD\u201E\u0627\uFFFD\u2021\uFFFD\u2026\u0627": "both" };
      formData.append("language", langActive ? langMap[langActive.textContent.trim()] : "both");
      formData.append("silenceThreshold", (parseInt(silenceThresholdSlider.value) / 10).toString());
      const toggles = document.querySelectorAll(".toggle-switch input");
      formData.append("removeFillers", toggles[0] ? toggles[0].checked : "false");
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:3000/api/process", true);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round(e.loaded / e.total * 50);
            if (dashProgressBar) dashProgressBar.style.width = `${percentComplete}%`;
            if (dashProgressPercent) dashProgressPercent.textContent = `${percentComplete}%`;
            if (percentComplete > 20 && percentComplete <= 50) {
              document.getElementById("procStep1")?.classList.replace("active", "done");
              document.getElementById("procStep2")?.classList.add("active");
              if (dashProcTitle) dashProcTitle.textContent = procSteps[1].title;
              if (dashProcSub) dashProcSub.textContent = procSteps[1].sub;
            }
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            procSteps.forEach((s) => {
              const el = document.getElementById(s.id);
              if (el) {
                el.classList.add("done");
                el.classList.remove("active");
              }
            });
            if (dashProgressBar) dashProgressBar.style.width = "100%";
            if (dashProgressPercent) dashProgressPercent.textContent = "100%";
            setTimeout(() => {
              localStorage.setItem("cutflow_video_url", response.streamUrl);
              localStorage.setItem("cutflow_segments", JSON.stringify(response.timeline));
              localStorage.setItem("cutflow_original_url", response.streamUrl);
              localStorage.setItem("cutflow_job_id", response.jobId);
              localStorage.setItem("cutflow_stats", JSON.stringify(response.stats));
              navigate("/dashboard/timeline");
            }, 500);
          } else {
            console.error("Server error:", xhr.responseText);
            alert("\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\uFFFD\u2020\u0627\u0621 \uFFFD\u2026\u0639\u0627\uFFFD\u201E\u062C\u0629 \u0627\uFFFD\u201E\u0641\uFFFD\u0160\u062F\uFFFD\u0160\uFFFD\u02C6.");
            goBackToUpload();
          }
        };
        xhr.onerror = () => {
          console.error("Request failed");
          alert("\u0641\u0634\uFFFD\u201E \u0627\uFFFD\u201E\u0627\u062A\u0635\u0627\uFFFD\u201E \u0628\u0627\uFFFD\u201E\u062E\u0627\u062F\uFFFD\u2026.");
          goBackToUpload();
        };
        xhr.send(formData);
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
              document.getElementById("procStep2")?.classList.replace("active", "done");
              document.getElementById("procStep3")?.classList.add("active");
              if (dashProcTitle) dashProcTitle.textContent = procSteps[2].title;
              if (dashProcSub) dashProcSub.textContent = procSteps[2].sub;
            } else if (fakeProgress > 90) {
              document.getElementById("procStep3")?.classList.replace("active", "done");
              document.getElementById("procStep4")?.classList.add("active");
              if (dashProcTitle) dashProcTitle.textContent = procSteps[3].title;
              if (dashProcSub) dashProcSub.textContent = procSteps[3].sub;
            }
          }
        }, 1e3);
      } catch (err) {
        console.error(err);
        alert("\u062D\u062F\u062B \u062E\u0637\u0623.");
        goBackToUpload();
      }
    }
    if (btnDashUploadTrigger) {
      btnDashUploadTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        if (dashFileInput) dashFileInput.click();
      });
    }
    if (dashFileInput) {
      dashFileInput.addEventListener("change", () => {
        if (dashFileInput.files.length > 0) {
          showSettingsPanel(dashFileInput.files[0]);
        }
      });
    }
    dashUploadZone.addEventListener("click", (e) => {
      if (e.target === btnDashUploadTrigger) return;
      if (dashFileInput) dashFileInput.click();
    });
    ["dragenter", "dragover"].forEach((eventName) => {
      dashUploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dashUploadZone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      dashUploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dashUploadZone.classList.remove("dragover");
      });
    });
    dashUploadZone.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        showSettingsPanel(files[0]);
      }
    });
    if (btnStartProcessing) {
      btnStartProcessing.addEventListener("click", () => {
        if (currentFile) triggerDashProcessing(currentFile);
      });
    }
    if (btnDashResetUploader) {
      btnDashResetUploader.addEventListener("click", () => {
        showOnly(dashUploadZone);
        if (dashFileInput) dashFileInput.value = "";
        currentFile = null;
        if (btnDashDownloadResult) btnDashDownloadResult.dataset.url = "";
      });
    }
    if (btnDashDownloadResult) {
      btnDashDownloadResult.addEventListener("click", () => {
        const url = btnDashDownloadResult.dataset.url;
        const fmt = btnDashDownloadResult.dataset.fmt || "mp4";
        if (url) {
          triggerFileDownload(url, `cutflow_export.${fmt}`);
        }
      });
    }
  }
  function triggerFileDownload(url, filename = "cutflow_processed.mp4") {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 200);
  }
  function initWaveformDemo() {
    const waveformContainer = document.getElementById("waveformContainer");
    const playhead = document.getElementById("playhead");
    const btnPlayWaveform = document.getElementById("btnPlayWaveform");
    const modeOriginal = document.getElementById("modeOriginal");
    const modeCleaned = document.getElementById("modeCleaned");
    const waveformStatus = document.getElementById("waveformStatus");
    const savedTimeBadge = document.getElementById("savedTime");
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
      const delta = (timestamp - lastTime) / 1e3;
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
        waveformStatus.textContent = "\u0627\uFFFD\u201E\u062D\u0627\uFFFD\u201E\u0629: \uFFFD\u2026\u062A\uFFFD\u02C6\uFFFD\u201A\u0641. \u0627\u0636\u063A\u0637 \u062A\u0634\u063A\uFFFD\u0160\uFFFD\u201E \uFFFD\u201E\uFFFD\u2026\u0634\u0627\uFFFD\u2021\u062F\u0629 \u0627\uFFFD\u201E\u062D\u0631\uFFFD\u0192\u0629.";
        return;
      }
      if (isCleanedMode) {
        waveformStatus.textContent = "\u0627\uFFFD\u201E\u062D\u0627\uFFFD\u201E\u0629: \u062A\u0634\u063A\uFFFD\u0160\uFFFD\u201E \u0627\uFFFD\u201E\u0641\uFFFD\u0160\u062F\uFFFD\u0160\uFFFD\u02C6 \u0627\uFFFD\u201E\uFFFD\u2020\u0638\uFFFD\u0160\u0641 (\u062A\uFFFD\u2026 \uFFFD\u201A\u0635 3 \u0633\uFFFD\u0192\u062A\u0627\u062A \u062A\uFFFD\u201E\uFFFD\u201A\u0627\u0626\uFFFD\u0160\u0627\uFFFD\u2039) \uFFFD\u0161\uFFFD";
      } else {
        if (playheadProgress >= 15 && playheadProgress <= 25 || playheadProgress >= 50 && playheadProgress <= 62 || playheadProgress >= 82 && playheadProgress <= 90) {
          waveformStatus.textContent = "\u0627\uFFFD\u201E\u062D\u0627\uFFFD\u201E\u0629: \u062C\u0627\u0631\uFFFD\u0160 \uFFFD\u0192\u062A\uFFFD\u2026/\uFFFD\u201A\u0635 \u0627\uFFFD\u201E\u0633\uFFFD\u0192\u062A\u0629 \u0627\uFFFD\u201E\u062D\u0627\uFFFD\u201E\uFFFD\u0160\u0629... \uFFFD\u0178\u203A\u2018";
        } else {
          waveformStatus.textContent = "\u0627\uFFFD\u201E\u062D\u0627\uFFFD\u201E\u0629: \u062A\u0634\u063A\uFFFD\u0160\uFFFD\u201E \u0627\uFFFD\u201E\u0635\uFFFD\u02C6\u062A \u0627\uFFFD\u201E\u0623\u0635\uFFFD\u201E\uFFFD\u0160... \uFFFD\u0178\u2014\uFFFD\uFE0F";
        }
      }
    }
    btnPlayWaveform.addEventListener("click", () => {
      if (isPlayingWaveform) {
        isPlayingWaveform = false;
        btnPlayWaveform.querySelector(".play-icon").classList.remove("hidden");
        btnPlayWaveform.querySelector(".pause-icon").classList.add("hidden");
        btnPlayWaveform.querySelector(".btn-text").textContent = "\u0634\u063A\uFFFD\u2018\uFFFD\u201E \u0627\uFFFD\u201E\u0639\u0631\u0636 \u0627\uFFFD\u201E\u062A\u062C\u0631\uFFFD\u0160\u0628\uFFFD\u0160";
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
        updateStatusText();
      } else {
        isPlayingWaveform = true;
        lastTime = 0;
        btnPlayWaveform.querySelector(".play-icon").classList.add("hidden");
        btnPlayWaveform.querySelector(".pause-icon").classList.remove("hidden");
        btnPlayWaveform.querySelector(".btn-text").textContent = "\u0625\uFFFD\u0160\uFFFD\u201A\u0627\u0641 \uFFFD\u2026\u0624\uFFFD\u201A\u062A";
        animFrameId = requestAnimationFrame(updatePlayhead);
      }
    });
    modeOriginal.addEventListener("click", () => {
      isCleanedMode = false;
      modeOriginal.classList.add("active");
      modeCleaned.classList.remove("active");
      waveformContainer.classList.remove("cleaned-mode");
      savedTimeBadge.classList.add("hidden");
      playheadProgress = 0;
      playhead.style.left = "0%";
      updateStatusText();
    });
    modeCleaned.addEventListener("click", () => {
      isCleanedMode = true;
      modeOriginal.classList.remove("active");
      modeCleaned.classList.add("active");
      waveformContainer.classList.add("cleaned-mode");
      savedTimeBadge.classList.remove("hidden");
      playheadProgress = 0;
      playhead.style.left = "0%";
      updateStatusText();
    });
  }
  function initLandingUploader() {
    const dragDropZone = document.getElementById("dragDropZone");
    const btnSimUpload = document.getElementById("btnSimUpload");
    const hiddenFileInput = document.getElementById("hiddenFileInput");
    const simStep1 = document.getElementById("simStep1");
    const simStep2 = document.getElementById("simStep2");
    const simStep3 = document.getElementById("simStep3");
    const simProgressBar = document.getElementById("simProgressBar");
    const simProgressPercentage = document.getElementById("simProgressPercentage");
    const processingStatusText = document.getElementById("processingStatusText");
    const dot1 = document.getElementById("dot1");
    const dot2 = document.getElementById("dot2");
    const dot3 = document.getElementById("dot3");
    const btnSimDownload = document.getElementById("btnSimDownload");
    const btnSimReset = document.getElementById("btnSimReset");
    if (!dragDropZone || !btnSimUpload || !hiddenFileInput) return;
    function triggerUpload() {
      simStep1.classList.remove("active");
      simStep2.classList.add("active");
      dot1.classList.remove("active");
      dot1.classList.add("success");
      dot2.classList.add("active");
      let progress = 0;
      simProgressBar.style.width = "0%";
      simProgressPercentage.textContent = "0%";
      const statusMessages = [
        { min: 0, max: 25, text: "\u062C\u0627\u0631\uFFFD\u0160 \u0631\u0641\u0639 \u0627\uFFFD\u201E\uFFFD\u2026\uFFFD\u201E\u0641 \uFFFD\u02C6\u062A\u062D\uFFFD\u201E\uFFFD\u0160\uFFFD\u201E\uFFFD\u2021 \u0639\uFFFD\u201E\uFFFD\u2030 \u062E\uFFFD\u02C6\u0627\u062F\uFFFD\u2026 \uFFFD\u0192\uFFFD\u02C6\u062A \u0641\uFFFD\u201E\uFFFD\u02C6..." },
        { min: 25, max: 55, text: "\u0627\uFFFD\u201E\uFFFD\u20AC AI \uFFFD\u0160\u0628\u062D\u062B \u0639\uFFFD\u2020 \u0627\uFFFD\u201E\u0641\u062A\u0631\u0627\u062A \u0627\uFFFD\u201E\u0635\u0627\uFFFD\u2026\u062A\u0629 \uFFFD\u02C6\u0627\uFFFD\u201E\u0633\uFFFD\u0192\u062A\u0627\u062A \u0628\u0627\uFFFD\u201E\uFFFD\u201E\u063A\u062A\uFFFD\u0160\uFFFD\u2020 \u0627\uFFFD\u201E\u0639\u0631\u0628\uFFFD\u0160\u0629 \uFFFD\u02C6\u0627\uFFFD\u201E\u0625\uFFFD\u2020\u062C\uFFFD\u201E\uFFFD\u0160\u0632\uFFFD\u0160\u0629..." },
        { min: 55, max: 80, text: "\u062C\u0627\u0631\u064D \uFFFD\u201A\u0635 \u0627\uFFFD\u201E\u0633\uFFFD\u0192\u062A\u0627\u062A \uFFFD\u02C6\u0625\u062C\u0631\u0627\u0621 \u062A\u062D\u0633\uFFFD\u0160\uFFFD\u2020 \uFFFD\u201E\u062A\u062F\u0641\uFFFD\u201A \u0627\uFFFD\u201E\u0635\uFFFD\u02C6\u062A \uFFFD\u02C6\u062A\uFFFD\u2020\u0639\uFFFD\u0160\uFFFD\u2026 \u0627\uFFFD\u201E\u0627\uFFFD\u2020\u062A\uFFFD\u201A\u0627\uFFFD\u201E\u0627\u062A..." },
        { min: 80, max: 100, text: "\u062C\u0627\u0631\u064D \u0625\u0639\u0627\u062F\u0629 \u0627\uFFFD\u201E\u062A\u0634\u0641\uFFFD\u0160\u0631 \uFFFD\u02C6\u062D\u0641\u0638 \u0627\uFFFD\u201E\u0641\uFFFD\u0160\u062F\uFFFD\u0160\uFFFD\u02C6 \u0627\uFFFD\u201E\uFFFD\u2020\uFFFD\u2021\u0627\u0626\uFFFD\u0160 \uFFFD\u201E\uFFFD\u201E\u062A\u062D\uFFFD\u2026\uFFFD\u0160\uFFFD\u201E..." }
      ];
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 8) + 4;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            simStep2.classList.remove("active");
            simStep3.classList.add("active");
            dot2.classList.remove("active");
            dot2.classList.add("success");
            dot3.classList.add("active");
            dot3.classList.add("success");
          }, 600);
        }
        simProgressBar.style.width = `${progress}%`;
        simProgressPercentage.textContent = `${progress}%`;
        const msg = statusMessages.find((m) => progress >= m.min && progress <= m.max);
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
    ["dragenter", "dragover"].forEach((eventName) => {
      dragDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDropZone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      dragDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragDropZone.classList.remove("dragover");
      });
    });
    dragDropZone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        triggerUpload();
      }
    });
    if (btnSimReset) {
      btnSimReset.onclick = () => {
        simStep3.classList.remove("active");
        simStep1.classList.add("active");
        dot1.classList.add("active");
        dot1.classList.remove("success");
        dot2.classList.remove("active", "success");
        dot3.classList.remove("active", "success");
        hiddenFileInput.value = "";
      };
    }
    if (btnSimDownload) {
      btnSimDownload.onclick = () => {
        alert('\u0634\uFFFD\u0192\u0631\uFFFD\u2039\u0627 \uFFFD\u201E\u062A\u062C\u0631\u0628\u062A\uFFFD\u0192 \u0627\uFFFD\u201E\u0639\u0631\u0636 \u0627\uFFFD\u201E\u062A\uFFFD\u02C6\u0636\uFFFD\u0160\u062D\uFFFD\u0160! \uFFFD\u0160\u062A\uFFFD\u2026 \u0627\uFFFD\u201E\u0622\uFFFD\u2020 \u062A\u062D\uFFFD\u2026\uFFFD\u0160\uFFFD\u201E \uFFFD\u2026\uFFFD\u201E\u0641 \uFFFD\u2026\u062D\u0627\uFFFD\u0192\u0627\u0629: "CutFlow_demo_clean.mp4"');
        const element = document.createElement("a");
        const file = new Blob(["\u0634\uFFFD\u0192\u0631\u0627\uFFFD\u2039 \uFFFD\u201E\u0627\u0633\u062A\u062E\u062F\u0627\uFFFD\u2026\uFFFD\u0192 \uFFFD\u0192\uFFFD\u02C6\u062A \u0641\uFFFD\u201E\uFFFD\u02C6! \uFFFD\u2021\u0630\u0627 \uFFFD\u2026\uFFFD\u201E\u0641 \u062A\u062C\u0631\uFFFD\u0160\u0628\uFFFD\u0160 \uFFFD\u0160\uFFFD\u2026\u062B\uFFFD\u201E \u0627\uFFFD\u201E\u0641\uFFFD\u0160\u062F\uFFFD\u0160\uFFFD\u02C6 \u0627\uFFFD\u201E\uFFFD\u2026\uFFFD\u201A\u0635\uFFFD\u02C6\u0635 \u0628\uFFFD\u2020\u062C\u0627\u062D."], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = "CutFlow_demo_clean.mp4.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      };
    }
  }
  function initPricingToggle() {
    const billingToggle = document.getElementById("billingToggle");
    const labelMonthly = document.getElementById("labelMonthly");
    const labelYearly = document.getElementById("labelYearly");
    const priceValues = document.querySelectorAll(".price-value");
    if (!billingToggle) return;
    labelMonthly.classList.add("active");
    billingToggle.addEventListener("click", () => {
      const isActive = billingToggle.classList.toggle("active");
      if (isActive) {
        labelMonthly.classList.remove("active");
        labelYearly.classList.add("active");
      } else {
        labelMonthly.classList.add("active");
        labelYearly.classList.remove("active");
      }
      priceValues.forEach((priceEl) => {
        const monthlyPrice = priceEl.getAttribute("data-monthly");
        const yearlyPrice = priceEl.getAttribute("data-yearly");
        priceEl.style.transform = "scale(0.8)";
        priceEl.style.opacity = "0.5";
        setTimeout(() => {
          priceEl.textContent = isActive ? yearlyPrice : monthlyPrice;
          priceEl.style.transform = "scale(1)";
          priceEl.style.opacity = "1";
        }, 150);
      });
    });
  }
  function initFaqAccordion() {
    const faqTriggers = document.querySelectorAll(".faq-trigger");
    faqTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const faqItem = trigger.parentElement;
        const isOpen = faqItem.classList.contains("open");
        document.querySelectorAll(".faq-item").forEach((item) => {
          if (item !== faqItem) {
            item.classList.remove("open");
            item.querySelector(".faq-trigger").setAttribute("aria-expanded", "false");
          }
        });
        if (isOpen) {
          faqItem.classList.remove("open");
          trigger.setAttribute("aria-expanded", "false");
        } else {
          faqItem.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });
    });
  }
  renderRoute(window.location.pathname);
  initWaveformDemo();
  initLandingUploader();
  initPricingToggle();
  initFaqAccordion();
});
window.initCapCutEditor = function() {
  console.log("Timeline data:", localStorage.getItem("cutflow_segments"));
  console.log("Video URL:", localStorage.getItem("cutflow_video_url"));
  try {
    let formatTC = function(secs) {
      if (isNaN(secs) || secs < 0) secs = 0;
      const h = Math.floor(secs / 3600);
      const m = Math.floor(secs % 3600 / 60);
      const s = Math.floor(secs % 60);
      const f = Math.floor(secs % 1 * FPS);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
    }, pxPerSec = function() {
      return PX_PER_SEC_BASE * zoomLevel;
    }, trackWidth = function() {
      return DURATION * pxPerSec();
    }, secToPx = function(s) {
      return s * pxPerSec();
    }, pxToSec = function(px) {
      return px / pxPerSec();
    }, ctToPx = function() {
      return secToPx(video.currentTime);
    }, saveState = function() {
      undoStack.push(JSON.parse(JSON.stringify(segments)));
      if (undoStack.length > 50) undoStack.shift();
      redoStack = [];
      updateUndoRedoUI();
    }, updateUndoRedoUI = function() {
      btnUndo.disabled = undoStack.length === 0;
      btnRedo.disabled = redoStack.length === 0;
    }, snapEdges = function() {
      const edges = [0, DURATION];
      segments.forEach((s) => {
        edges.push(s.start);
        edges.push(s.end);
      });
      return edges;
    }, snapSec = function(sec, excludeId) {
      const edges = snapEdges().filter((e) => {
        if (!excludeId) return true;
        const seg = segments.find((s) => s.id === excludeId);
        return seg ? Math.abs(e - seg.start) > 1e-3 && Math.abs(e - seg.end) > 1e-3 : true;
      });
      const snapThresholdSec = SNAP_PX / pxPerSec();
      let closest = null;
      let minDist = Infinity;
      edges.forEach((e) => {
        const d = Math.abs(e - sec);
        if (d < minDist) {
          minDist = d;
          closest = e;
        }
      });
      if (minDist <= snapThresholdSec) {
        showSnap(closest);
        return closest;
      }
      hideSnap();
      return sec;
    }, showSnap = function(sec) {
      snapIndicator.style.left = secToPx(sec) + "px";
      snapIndicator.classList.remove("hidden");
    }, hideSnap = function() {
      snapIndicator.classList.add("hidden");
    }, applyZoom = function(newZoom, pivotSec) {
      newZoom = Math.max(1, Math.min(50, newZoom));
      if (newZoom === zoomLevel) return;
      if (pivotSec === void 0) {
        const visCenter = scrollArea.scrollLeft + scrollArea.clientWidth / 2;
        pivotSec = pxToSec(visCenter);
      }
      const pivotPxBefore = secToPx(pivotSec);
      const visibleOffset = pivotPxBefore - scrollArea.scrollLeft;
      zoomLevel = newZoom;
      renderTimeline();
      const pivotPxAfter = secToPx(pivotSec);
      scrollArea.scrollLeft = pivotPxAfter - visibleOffset;
      zoomSlider.value = zoomLevel;
      if (zoomLabel) zoomLabel.textContent = zoomLevel % 1 === 0 ? `${zoomLevel}x` : `${zoomLevel.toFixed(1)}x`;
    }, toggleBlade = function() {
      bladeMode = !bladeMode;
      document.body.classList.toggle("blade-mode", bladeMode);
      [btnBlade1, btnBlade2].forEach((b) => b && b.classList.toggle("blade-active", bladeMode));
      if (bladeModeLabel) bladeModeLabel.classList.toggle("hidden", !bladeMode);
    }, renderTimeline = function() {
      track.innerHTML = "";
      ruler.innerHTML = "";
      canvas.style.width = trackWidth() + "px";
      playhead.style.left = secToPx(video.currentTime) + "px";
      const pps = pxPerSec();
      const rawInterval = 80 / pps;
      const roundedIntervals = [0.033, 0.1, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
      let tickInterval = roundedIntervals.reduce((a, b) => Math.abs(b - rawInterval) < Math.abs(a - rawInterval) ? b : a);
      if (tickInterval < 1 / FPS) tickInterval = 1 / FPS;
      for (let t = 0; t <= DURATION + tickInterval; t += tickInterval) {
        if (t > DURATION) t = DURATION;
        const x = secToPx(t);
        const isMajor = Math.round(t * 10) % Math.round(tickInterval * 2 * 10) === 0 || t === 0 || t === DURATION;
        const tick = document.createElement("div");
        tick.className = "ruler-tick";
        tick.style.cssText = `left:${x}px;height:${isMajor ? "16px" : "8px"};position:absolute;bottom:0;width:1px;background:rgba(255,255,255,${isMajor ? "0.4" : "0.15"});`;
        ruler.appendChild(tick);
        if (isMajor) {
          const lbl = document.createElement("div");
          lbl.className = "ruler-label";
          lbl.style.cssText = `left:${x}px;position:absolute;bottom:18px;font-size:10px;color:rgba(255,255,255,0.5);font-family:monospace;transform:translateX(-50%);white-space:nowrap;`;
          lbl.textContent = t < 60 ? `${t.toFixed(t < 1 ? 2 : 0)}s` : `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
          ruler.appendChild(lbl);
        }
        if (t === DURATION) break;
      }
      segments.sort((a, b) => a.start - b.start).forEach((seg, i) => {
        const el = document.createElement("div");
        const isSelected = selectedIds.has(seg.id) && !bladeMode;
        const isMulti = selectedIds.size > 1 && isSelected;
        el.className = `cc-segment ${seg.type}${isSelected ? isMulti ? " multi-selected" : " selected" : ""}`;
        const left = secToPx(seg.start);
        const width = Math.max(secToPx(seg.end) - left, 2);
        el.style.cssText = `left:${left}px;width:${width}px;position:absolute;top:0;height:100%;`;
        el.dataset.id = seg.id;
        if (width > 30) {
          const lbl = document.createElement("div");
          lbl.className = "seg-label";
          const dur = (seg.end - seg.start).toFixed(1) + "s";
          const textColor = seg.type === "keep" ? "#ffffff" : "#ff9999";
          lbl.style.cssText = `padding:3px 5px;font-size:10px;color:${textColor};text-shadow:0 1px 2px #000;pointer-events:none;user-select:none;white-space:nowrap;overflow:hidden;`;
          lbl.textContent = dur;
          el.appendChild(lbl);
        }
        if (isSelected && !bladeMode && selectedIds.size === 1) {
          ["left", "right"].forEach((side) => {
            const h = document.createElement("div");
            h.className = `handle ${side}`;
            h.style.cssText = `position:absolute;top:0;bottom:0;width:12px;cursor:col-resize;z-index:10;${side === "left" ? "left:0;" : "right:0;"}background:rgba(234,179,8,0.5);`;
            h.onmousedown = (e) => startTrim(e, seg, i, side);
            el.appendChild(h);
          });
        }
        el.onmousedown = (e) => {
          if (e.button === 1) return;
          if (e.button === 2) return;
          e.stopPropagation();
          if (bladeMode) {
            const rect = el.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickSec = seg.start + pxToSec(clickX);
            doBladeCut(seg, i, clickSec, el, left);
            return;
          }
          if (e.ctrlKey || e.metaKey) {
            if (selectedIds.has(seg.id)) selectedIds.delete(seg.id);
            else selectedIds.add(seg.id);
          } else if (e.shiftKey && selectedIds.size > 0) {
            const lastId = [...selectedIds].pop();
            const lastIdx = segments.findIndex((s) => s.id === lastId);
            const [from, to] = [Math.min(i, lastIdx), Math.max(i, lastIdx)];
            for (let j = from; j <= to; j++) selectedIds.add(segments[j].id);
          } else {
            selectedIds.clear();
            selectedIds.add(seg.id);
            video.currentTime = seg.start;
          }
          renderTimeline();
        };
        el.oncontextmenu = (e) => {
          e.preventDefault();
          e.stopPropagation();
          selectedIds.clear();
          selectedIds.add(seg.id);
          renderTimeline();
          ctxMenu.style.left = `${e.clientX}px`;
          ctxMenu.style.top = `${e.clientY}px`;
          ctxMenu.classList.remove("hidden");
        };
        track.appendChild(el);
      });
    }, startTrim = function(e, seg, segIdx, side) {
      e.stopPropagation();
      e.preventDefault();
      saveState();
      activeTrimmingInfo = { segId: seg.id, side, origStart: seg.start, origEnd: seg.end, startX: e.clientX };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      const ghost = document.createElement("div");
      ghost.className = "cc-segment-ghost";
      ghost.id = "ccTrimGhost";
      track.appendChild(ghost);
      function onMove(mv) {
        const { segId, side: s, origStart, origEnd, startX } = activeTrimmingInfo;
        const theSeg = segments.find((seg2) => seg2.id === segId);
        if (!theSeg) return;
        const deltaX = mv.clientX - startX;
        const deltaSec = pxToSec(deltaX);
        if (s === "left") {
          let newStart = Math.max(0, origStart + deltaSec);
          const prevSeg = segments[segments.indexOf(theSeg) - 1];
          if (prevSeg) newStart = Math.max(newStart, prevSeg.end);
          newStart = Math.min(newStart, theSeg.end - 1 / FPS);
          newStart = snapSec(newStart, segId);
          theSeg.start = newStart;
          const gLeft = secToPx(newStart);
          const gWidth = secToPx(origStart) - gLeft;
          if (gWidth > 0) {
            ghost.style.cssText = `left:${gLeft}px;width:${secToPx(origStart) - gLeft}px;top:0;height:100%;position:absolute;`;
          }
          showTrimTooltip(mv.clientX, mv.clientY, newStart);
        } else {
          let newEnd = Math.min(DURATION, origEnd + deltaSec);
          const nextSeg = segments[segments.indexOf(theSeg) + 1];
          if (nextSeg) newEnd = Math.min(newEnd, nextSeg.start);
          newEnd = Math.max(newEnd, theSeg.start + 1 / FPS);
          newEnd = snapSec(newEnd, segId);
          theSeg.end = newEnd;
          const gLeft = secToPx(origEnd);
          const gWidth = secToPx(newEnd) - gLeft;
          if (gWidth > 0) {
            ghost.style.cssText = `left:${gLeft}px;width:${gWidth}px;top:0;height:100%;position:absolute;`;
          }
          showTrimTooltip(mv.clientX, mv.clientY, newEnd);
        }
        renderTimeline();
        track.appendChild(ghost);
      }
      function onUp() {
        activeTrimmingInfo = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.getElementById("ccTrimGhost")?.remove();
        hideTrimTooltip();
        hideSnap();
        renderTimeline();
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }, showTrimTooltip = function(x, y, sec) {
      trimTooltip.textContent = formatTC(sec);
      trimTooltip.style.left = `${x + 14}px`;
      trimTooltip.style.top = `${y - 30}px`;
      trimTooltip.classList.remove("hidden");
    }, hideTrimTooltip = function() {
      trimTooltip.classList.add("hidden");
    }, doBladeCut = function(seg, segIdx, cutSec, el, elLeft) {
      if (cutSec <= seg.start + 1 / FPS || cutSec >= seg.end - 1 / FPS) return;
      saveState();
      const flash = document.createElement("div");
      flash.className = "cc-split-flash";
      flash.style.left = secToPx(cutSec) + "px";
      track.appendChild(flash);
      setTimeout(() => flash.remove(), 350);
      const newSeg = { id: uid(), start: cutSec, end: seg.end, type: seg.type };
      seg.end = cutSec;
      segments.splice(segIdx + 1, 0, newSeg);
      selectedIds.clear();
      selectedIds.add(newSeg.id);
      renderTimeline();
    }, doSplit = function() {
      const ct = video.currentTime;
      let targetSegs = segments.filter((s) => selectedIds.has(s.id) && ct > s.start + 1 / FPS && ct < s.end - 1 / FPS);
      if (targetSegs.length === 0) {
        const under = segments.find((s) => ct > s.start && ct < s.end);
        if (under) targetSegs = [under];
      }
      if (targetSegs.length === 0) return;
      saveState();
      targetSegs.forEach((seg) => {
        const idx = segments.findIndex((s) => s.id === seg.id);
        const newSeg = { id: uid(), start: ct, end: seg.end, type: seg.type };
        seg.end = ct;
        segments.splice(idx + 1, 0, newSeg);
        const flash = document.createElement("div");
        flash.className = "cc-split-flash";
        flash.style.left = secToPx(ct) + "px";
        track.appendChild(flash);
        setTimeout(() => flash.remove(), 350);
      });
      selectedIds.clear();
      renderTimeline();
    }, doDelete = function() {
      if (selectedIds.size === 0) return;
      saveState();
      segments.filter((s) => selectedIds.has(s.id)).forEach((s) => {
        s.type = "remove";
      });
      selectedIds.clear();
      renderTimeline();
    }, doRippleDelete = function() {
      if (selectedIds.size === 0) return;
      saveState();
      segments = segments.filter((s) => !selectedIds.has(s.id));
      segments.sort((a, b) => a.start - b.start);
      let cursor = 0;
      segments = segments.map((s) => {
        const len = s.end - s.start;
        const newSeg = { ...s, start: cursor, end: cursor + len };
        cursor += len;
        return newSeg;
      });
      selectedIds.clear();
      renderTimeline();
    }, doToggle = function() {
      if (selectedIds.size === 0) return;
      saveState();
      segments.filter((s) => selectedIds.has(s.id)).forEach((s) => {
        s.type = s.type === "keep" ? "remove" : "keep";
      });
      renderTimeline();
    }, doUndo = function() {
      if (!undoStack.length) return;
      redoStack.push(JSON.parse(JSON.stringify(segments)));
      segments = undoStack.pop();
      selectedIds.clear();
      updateUndoRedoUI();
      renderTimeline();
    }, doRedo = function() {
      if (!redoStack.length) return;
      undoStack.push(JSON.parse(JSON.stringify(segments)));
      segments = redoStack.pop();
      selectedIds.clear();
      updateUndoRedoUI();
      renderTimeline();
    }, scrubTo = function(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollArea.scrollLeft;
      video.currentTime = Math.max(0, Math.min(DURATION, pxToSec(x)));
    };
    const rawSegments = localStorage.getItem("cutflow_segments");
    const streamUrl = localStorage.getItem("cutflow_video_url");
    const jobId = localStorage.getItem("cutflow_job_id");
    const statsStr = localStorage.getItem("cutflow_stats");
    if (!rawSegments || !streamUrl) {
      document.getElementById("view-timeline").innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
          <div style="font-size:3rem;">\uFFFD\u0178\u201C\u201A</div>
          <h2 style="margin:1rem 0;">\uFFFD\u201E\u0627 \uFFFD\u0160\uFFFD\u02C6\u062C\u062F \u0641\uFFFD\u0160\u062F\uFFFD\u0160\uFFFD\u02C6 \uFFFD\u2026\u062D\uFFFD\u2026\uFFFD\u201E</h2>
          <button class="btn btn-primary" onclick="window.location.href='/dashboard'">\u0627\uFFFD\u201E\u0639\uFFFD\u02C6\u062F\u0629 \uFFFD\u201E\uFFFD\u201E\uFFFD\u02C6\u062D\u0629 \u0627\uFFFD\u201E\u062A\u062D\uFFFD\u0192\uFFFD\u2026</button>
        </div>`;
      return;
    }
    const initialTimeline = JSON.parse(rawSegments);
    const stats = statsStr ? JSON.parse(statsStr) : { originalDuration: 1 };
    const DURATION = stats.originalDuration || 1;
    const FPS = 30;
    const SNAP_PX = 8;
    let segments = JSON.parse(JSON.stringify(initialTimeline));
    let undoStack = [];
    let redoStack = [];
    let selectedIds = /* @__PURE__ */ new Set();
    let zoomLevel = 1;
    let bladeMode = false;
    let isScrubbing = false;
    let isPanning = false;
    let panStartX = 0;
    let panStartScroll = 0;
    let activeTrimmingInfo = null;
    const PX_PER_SEC_BASE = 100;
    const video = document.getElementById("ccVideo");
    const playOverlay = document.getElementById("ccPlayOverlay");
    const track = document.getElementById("ccTrackVideo");
    const ruler = document.getElementById("ccRuler");
    const playhead = document.getElementById("ccPlayhead");
    const scrollArea = document.getElementById("ccTimelineScrollArea");
    const canvas = document.getElementById("ccTimelineCanvas");
    const timecodeEl = document.getElementById("ccTimecode");
    const ctxMenu = document.getElementById("ccContextMenu");
    const snapIndicator = document.getElementById("ccSnapIndicator");
    const trimTooltip = document.getElementById("ccTrimTooltip");
    const zoomLabel = document.getElementById("ccZoomLabel");
    const bladeModeLabel = document.getElementById("ccBladeModeLabel");
    const btnPlay = document.getElementById("ccBtnPlayPause");
    const btnUndo = document.getElementById("ccBtnUndo");
    const btnRedo = document.getElementById("ccBtnRedo");
    const btnZoomIn = document.getElementById("ccBtnZoomIn");
    const btnZoomOut = document.getElementById("ccBtnZoomOut");
    const zoomSlider = document.getElementById("ccZoomSlider");
    const volumeSlider = document.getElementById("ccVolume");
    const btnExport = document.getElementById("ccBtnExport");
    const exportMenu = document.getElementById("ccExportMenu");
    const btnBlade1 = document.getElementById("ccBtnBladeMode");
    const btnBlade2 = document.getElementById("ccBtnBladeTimeline");
    video.src = streamUrl;
    const uid = () => Math.random().toString(36).substr(2, 9);
    ruler.style.cursor = "col-resize";
    ruler.onmousedown = (e) => {
      if (e.button !== 0) return;
      isScrubbing = true;
      scrubTo(e);
    };
    scrollArea.onmousedown = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        isPanning = true;
        panStartX = e.clientX;
        panStartScroll = scrollArea.scrollLeft;
        scrollArea.style.cursor = "grabbing";
      }
    };
    window.addEventListener("mousemove", (e) => {
      if (isScrubbing) scrubTo(e);
      if (isPanning) {
        scrollArea.scrollLeft = panStartScroll - (e.clientX - panStartX);
      }
    });
    window.addEventListener("mouseup", (e) => {
      isScrubbing = false;
      if (isPanning) {
        isPanning = false;
        scrollArea.style.cursor = "";
      }
    });
    scrollArea.addEventListener("wheel", (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left + scrollArea.scrollLeft;
        const pivotSec = pxToSec(mouseX);
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        applyZoom(zoomLevel * factor, pivotSec);
      }
    }, { passive: false });
    video.addEventListener("timeupdate", () => {
      const ct = video.currentTime;
      timecodeEl.textContent = `${formatTC(ct)} / ${formatTC(DURATION)}`;
      playhead.style.left = secToPx(ct) + "px";
      const phPx = secToPx(ct);
      if (phPx > scrollArea.scrollLeft + scrollArea.clientWidth * 0.85) {
        scrollArea.scrollLeft = phPx - scrollArea.clientWidth * 0.15;
      } else if (phPx < scrollArea.scrollLeft + 20) {
        scrollArea.scrollLeft = Math.max(0, phPx - scrollArea.clientWidth * 0.15);
      }
      if (!video.paused && !isScrubbing) {
        const cur = segments.find((s) => ct >= s.start && ct < s.end);
        if (cur && cur.type === "remove") {
          const nextKeep = segments.find((s) => s.start >= cur.end && s.type === "keep");
          if (nextKeep) video.currentTime = nextKeep.start;
          else video.pause();
        }
      }
    });
    video.addEventListener("play", () => {
      playOverlay.classList.add("hidden");
      btnPlay.textContent = "\u23F8";
    });
    video.addEventListener("pause", () => {
      playOverlay.classList.remove("hidden");
      btnPlay.textContent = "\u25B6\uFE0F";
    });
    playOverlay.onclick = () => video.play();
    btnPlay.onclick = () => video.paused ? video.play() : video.pause();
    document.getElementById("ccBtnStart").onclick = () => {
      video.currentTime = 0;
    };
    document.getElementById("ccBtnEnd").onclick = () => {
      video.currentTime = DURATION;
    };
    document.getElementById("ccBtnBack5").onclick = () => {
      video.currentTime = Math.max(0, video.currentTime - 5);
    };
    document.getElementById("ccBtnFwd5").onclick = () => {
      video.currentTime = Math.min(DURATION, video.currentTime + 5);
    };
    volumeSlider.oninput = (e) => {
      video.volume = parseFloat(e.target.value);
    };
    document.getElementById("ccBtnSplitTool").onclick = doSplit;
    document.getElementById("ccBtnDeleteTool").onclick = doDelete;
    document.getElementById("ccBtnRippleDelete").onclick = doRippleDelete;
    document.getElementById("ccBtnRestoreTool").onclick = doToggle;
    if (btnBlade1) btnBlade1.onclick = toggleBlade;
    if (btnBlade2) btnBlade2.onclick = toggleBlade;
    btnUndo.onclick = doUndo;
    btnRedo.onclick = doRedo;
    btnZoomIn.onclick = () => applyZoom(zoomLevel * 1.5, pxToSec(secToPx(video.currentTime)));
    btnZoomOut.onclick = () => applyZoom(zoomLevel / 1.5, pxToSec(secToPx(video.currentTime)));
    zoomSlider.oninput = (e) => applyZoom(parseFloat(e.target.value), pxToSec(secToPx(video.currentTime)));
    document.getElementById("ctxSplit").onclick = doSplit;
    document.getElementById("ctxToggle").onclick = doToggle;
    document.getElementById("ctxDelete").onclick = doDelete;
    document.addEventListener("click", () => ctxMenu.classList.add("hidden"));
    ctxMenu.addEventListener("click", (e) => e.stopPropagation());
    const onKeyDown = (e) => {
      if (!document.body.classList.contains("in-editor-mode")) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const ct = video.currentTime;
      switch (true) {
        case e.code === "Space":
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case e.code === "KeyS":
        case (e.ctrlKey && e.code === "KeyB"):
          e.preventDefault();
          doSplit();
          break;
        case e.code === "KeyB":
          e.preventDefault();
          toggleBlade();
          break;
        case ((e.code === "Delete" || e.code === "Backspace") && e.shiftKey):
          e.preventDefault();
          doRippleDelete();
          break;
        case (e.code === "Delete" || e.code === "Backspace"):
          e.preventDefault();
          doDelete();
          break;
        case (e.code === "KeyZ" && e.ctrlKey && !e.shiftKey):
          e.preventDefault();
          doUndo();
          break;
        case (e.code === "KeyZ" && e.ctrlKey && e.shiftKey):
        case (e.code === "KeyY" && e.ctrlKey):
          e.preventDefault();
          doRedo();
          break;
        case (e.code === "ArrowRight" && e.shiftKey):
          e.preventDefault();
          video.currentTime = Math.min(DURATION, ct + 5);
          break;
        case (e.code === "ArrowLeft" && e.shiftKey):
          e.preventDefault();
          video.currentTime = Math.max(0, ct - 5);
          break;
        case e.code === "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(DURATION, ct + 1 / FPS);
          break;
        case e.code === "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, ct - 1 / FPS);
          break;
        case e.code === "Home":
          e.preventDefault();
          video.currentTime = 0;
          break;
        case e.code === "End":
          e.preventDefault();
          video.currentTime = DURATION;
          break;
        case (e.key === "+" || e.key === "="):
          e.preventDefault();
          applyZoom(zoomLevel * 1.5, ct);
          break;
        case (e.key === "-" || e.key === "_"):
          e.preventDefault();
          applyZoom(zoomLevel / 1.5, ct);
          break;
        case e.code === "Escape":
          if (bladeMode) toggleBlade();
          selectedIds.clear();
          renderTimeline();
          break;
        case (e.code === "KeyA" && e.ctrlKey):
          e.preventDefault();
          segments.forEach((s) => selectedIds.add(s.id));
          renderTimeline();
          break;
      }
    };
    window.removeEventListener("keydown", window._ccKeyHandler);
    window._ccKeyHandler = onKeyDown;
    window.addEventListener("keydown", onKeyDown);
    document.querySelectorAll(".cc-tab").forEach((tab) => {
      tab.onclick = () => {
        document.querySelectorAll(".cc-tab").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".cc-tab-content").forEach((c) => c.classList.add("hidden"));
        tab.classList.add("active");
        const target = document.getElementById(tab.dataset.target);
        if (target) target.classList.remove("hidden");
      };
    });
    btnExport.onclick = (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle("hidden");
    };
    exportMenu.querySelectorAll(".cc-dropdown-item").forEach((item) => {
      item.onclick = async () => {
        const fmt = item.dataset.fmt;
        const origText = btnExport.textContent;
        btnExport.textContent = "\u23F3 \u062C\u0627\u0631\uFFFD\u0160 \u0627\uFFFD\u201E\u062A\u0635\u062F\uFFFD\u0160\u0631...";
        btnExport.disabled = true;
        exportMenu.classList.add("hidden");
        try {
          if (fmt === "mp4") {
            const res = await fetch(`/api/render/${jobId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ timeline: segments })
            });
            if (!res.ok) throw new Error("\u0641\u0634\uFFFD\u201E \u0627\uFFFD\u201E\u0631\uFFFD\u2020\u062F\u0631");
            const data = await res.json();
            const a = Object.assign(document.createElement("a"), { href: data.downloadUrl, download: `cutflow_${jobId}.mp4` });
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            const res = await fetch(`/api/export/${jobId}/${fmt}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ timeline: segments })
            });
            if (!res.ok) throw new Error("\u0641\u0634\uFFFD\u201E \u0627\uFFFD\u201E\u062A\u0635\u062F\uFFFD\u0160\u0631");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement("a"), { href: url, download: `cutflow_export.${fmt}` });
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
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
    renderTimeline();
    updateUndoRedoUI();
  } catch (err) {
    console.error("Timeline initialization error:", err);
    const view = document.getElementById("view-timeline");
    if (view) {
      view.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0A0A0F;color:#fff;">
          <div style="font-size:3rem;margin-bottom:1rem;">\uFFFD\u0161\uFFFD\uFE0F</div>
          <h2 style="margin-bottom:0.5rem;">\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\uFFFD\u2020\u0627\u0621 \u062A\u062D\uFFFD\u2026\uFFFD\u0160\uFFFD\u201E \u0627\uFFFD\u201E\uFFFD\u2026\u062D\u0631\u0631</h2>
          <p style="color:#888;margin-bottom:1.5rem;direction:ltr;">${err.message}</p>
          <button onclick="window.location.href='/dashboard'" style="background:#7C3AED;color:#fff;border:none;padding:0.8rem 2rem;border-radius:8px;cursor:pointer;font-size:1rem;">\u0627\uFFFD\u201E\u0639\uFFFD\u02C6\u062F\u0629 \uFFFD\u201E\uFFFD\u201E\uFFFD\u02C6\u062D\u0629 \u0627\uFFFD\u201E\u062A\u062D\uFFFD\u0192\uFFFD\u2026</button>
        </div>`;
    }
  }
};
