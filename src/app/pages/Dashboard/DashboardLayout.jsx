import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, toggleLang, t } = useTranslation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ── Theme toggle ──────────────────────────────────────────────────────────
  const getInitialTheme = () => {
    const saved = localStorage.getItem('vireon-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vireon-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/login');
  };

  const getPageMeta = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return { title: t('topbar.home'), subtitle: t('dash.topbar.sub') };
      case '/dashboard/fulledit':
        return { title: t('topbar.fulledit'), subtitle: lang === 'ar' ? 'تحرير المقطع بالكامل بالذكاء الاصطناعي (قص + زوم + ترجمة)' : 'Full video processing (cut + zoom + captions)' };
      case '/dashboard/editor':
        return { title: t('topbar.editor'), subtitle: t('editor.sub') };
      case '/dashboard/captions':
        return { title: t('topbar.captions'), subtitle: lang === 'ar' ? 'توليد نصوص الشاشة التلقائية بـ AI' : 'AI-generated automatic video captions' };
      case '/dashboard/repetitions':
        return { title: t('topbar.repetitions'), subtitle: lang === 'ar' ? 'تنظيف التكرارات اللفظية والتلعثم من المقطع' : 'Clean stuttering and repetitions from video' };
      case '/dashboard/videos':
        return { title: t('topbar.videos'), subtitle: t('videos.sub') };
      case '/dashboard/settings':
        return { title: t('topbar.settings'), subtitle: t('settings.sub') };
      case '/dashboard/account':
        return { title: t('topbar.account'), subtitle: t('account.sub') };
      case '/dashboard/admin':
        return { title: t('topbar.admin'), subtitle: t('admin.sub') };
      default:
        return { title: t('topbar.home'), subtitle: t('dash.topbar.sub') };
    }
  };

  const getActiveIcon = (pathname) => {
    const iconProps = { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
    switch (pathname) {
      case '/dashboard':
        return (
          <svg {...iconProps} style={{ color: '#C084FC', filter: 'drop-shadow(0 0 4px rgba(192, 132, 252, 0.4))' }}>
            <rect x="3" y="3" width="7" height="9" rx="1"></rect>
            <rect x="14" y="3" width="7" height="5" rx="1"></rect>
            <rect x="14" y="12" width="7" height="9" rx="1"></rect>
            <rect x="3" y="16" width="7" height="5" rx="1"></rect>
          </svg>
        );
      case '/dashboard/fulledit':
        return (
          <svg {...iconProps} style={{ color: '#C084FC', filter: 'drop-shadow(0 0 4px rgba(192, 132, 252, 0.4))' }}>
            <path d="m19 2 3 3L6 21H3v-3L19 2Z"></path>
            <path d="M19 9h2M15 5h2M19 5h.01M9 2h.01M1 7h.01M5 3h.01"></path>
          </svg>
        );
      case '/dashboard/editor':
        return (
          <svg {...iconProps} style={{ color: '#22D3EE', filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.4))' }}>
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <line x1="9.8" y1="8.2" x2="20" y2="18"></line>
            <line x1="9.8" y1="15.8" x2="20" y2="6"></line>
          </svg>
        );
      case '/dashboard/captions':
        return (
          <svg {...iconProps} style={{ color: '#EF4444', filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.4))' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        );
      case '/dashboard/repetitions':
        return (
          <svg {...iconProps} style={{ color: '#A855F7', filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.4))' }}>
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73"></path>
            <line x1="8" y1="16" x2="16" y2="8"></line>
          </svg>
        );
      case '/dashboard/videos':
        return (
          <svg {...iconProps} style={{ color: '#C084FC' }}>
            <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
          </svg>
        );
      case '/dashboard/settings':
        return (
          <svg {...iconProps} style={{ color: '#94A3B8' }}>
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        );
      case '/dashboard/account':
        return (
          <svg {...iconProps} style={{ color: '#94A3B8' }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        );
      case '/dashboard/admin':
        return (
          <svg {...iconProps} style={{ color: '#F59E0B', filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))' }}>
            <path d="M4 17l6-6-6-6M12 19h8"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  const { title, subtitle } = getPageMeta(location.pathname);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('dash.welcome.name');
  const avatarLetter = userName.charAt(0).toUpperCase();
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('acsds') || localStorage.getItem('vireon_admin_mode') === 'true';

  return (
    <div className="dashboard-root-layout">
      {/* Sidebar */}
      <aside className={`dash-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`} id="dashSidebar">
        <button 
          className="sidebar-collapse-btn" 
          id="btnSidebarCollapse" 
          title={lang === 'ar' ? 'طي الشريط الجانبي' : 'Toggle Sidebar'}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>

        <div className="sidebar-top">
          <div className="sidebar-logo">
            <div className="logo-monogram">
              <div className="logo-monogram-ring"></div>
              <span className="logo-monogram-letter">V</span>
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">Vireon</span>
              <span className="sidebar-brand-tag">AI Video Studio</span>
            </div>
          </div>
          <nav className="sidebar-menu">
            <NavLink 
              to="/dashboard" 
              end
              className={({ isActive }) => `dash-nav-item nav-route ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                  <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                  <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                </svg>
              </span>
              <span className="nav-text">{t('nav.dash.home')}</span>
            </NavLink>
            <NavLink 
              to="/dashboard/fulledit" 
              className={({ isActive }) => `dash-nav-item nav-route ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 2 3 3L6 21H3v-3L19 2Z"></path>
                  <path d="M19 9h2M15 5h2M19 5h.01M9 2h.01M1 7h.01M5 3h.01"></path>
                </svg>
              </span>
              <span className="nav-text">{t('nav.dash.fulledit')}</span>
            </NavLink>
            <NavLink 
              to="/dashboard/editor" 
              className={({ isActive }) => `dash-nav-item nav-route ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3"></circle>
                  <circle cx="6" cy="18" r="3"></circle>
                  <line x1="9.8" y1="8.2" x2="20" y2="18"></line>
                  <line x1="9.8" y1="15.8" x2="20" y2="6"></line>
                </svg>
              </span>
              <span className="nav-text">{t('nav.dash.editor')}</span>
            </NavLink>
            <NavLink 
              to="/dashboard/captions" 
              className={({ isActive }) => `dash-nav-item nav-route ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </span>
              <span className="nav-text">{t('nav.dash.captions')}</span>
            </NavLink>
            <NavLink 
              to="/dashboard/repetitions" 
              className={({ isActive }) => `dash-nav-item nav-route ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73"></path>
                  <line x1="8" y1="16" x2="16" y2="8"></line>
                </svg>
              </span>
              <span className="nav-text">{t('nav.dash.repetitions')}</span>
            </NavLink>
            <NavLink 
              to="/dashboard/videos" 
              className={({ isActive }) => `dash-nav-item nav-route ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                  <line x1="7" y1="2" x2="7" y2="22"></line>
                  <line x1="17" y1="2" x2="17" y2="22"></line>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <line x1="2" y1="7" x2="7" y2="7"></line>
                  <line x1="2" y1="17" x2="7" y2="17"></line>
                  <line x1="17" y1="17" x2="22" y2="17"></line>
                  <line x1="17" y1="7" x2="22" y2="7"></line>
                </svg>
              </span>
              <span className="nav-text">{t('nav.dash.videos')}</span>
            </NavLink>
            <NavLink 
              to="/dashboard/settings" 
              className={({ isActive }) => `dash-nav-item nav-route ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span>
              <span className="nav-text">{t('nav.dash.settings')}</span>
            </NavLink>
            <NavLink 
              to="/dashboard/account" 
              className={({ isActive }) => `dash-nav-item nav-route ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <span className="nav-text">{t('nav.dash.account')}</span>
            </NavLink>
            {isAdmin && (
              <NavLink 
                to="/dashboard/admin" 
                className={({ isActive }) => `dash-nav-item nav-route ${isActive ? 'active' : ''}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 17l6-6-6-6M12 19h8"></path>
                  </svg>
                </span>
                <span className="nav-text">{t('nav.dash.admin')}</span>
              </NavLink>
            )}
          </nav>
        </div>
        
        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div className="sidebar-avatar" id="sidebarAvatar">{avatarLetter}</div>
            <div className="sidebar-profile-info">
              <span className="profile-name" id="sidebarProfileName">{userName}</span>
              <span className="profile-plan" id="userBadgeEl">باقة Free</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-block btn-logout-sidebar" id="btnSidebarLogout" onClick={handleLogout}>
            {t('dash.logout')}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`} 
        id="sidebarOverlay"
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Mobile Bottom Nav (Cleaned to show 5 primary items) */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/dashboard" end className={({ isActive }) => `mobile-nav-item nav-route ${isActive ? 'active' : ''}`}>
          <span className="mob-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1"></rect>
              <rect x="14" y="3" width="7" height="5" rx="1"></rect>
              <rect x="14" y="12" width="7" height="9" rx="1"></rect>
              <rect x="3" y="16" width="7" height="5" rx="1"></rect>
            </svg>
          </span>
          <span className="mob-text">{t('nav.dash.home')}</span>
        </NavLink>
        <NavLink to="/dashboard/fulledit" className={({ isActive }) => `mobile-nav-item nav-route ${isActive ? 'active' : ''}`}>
              <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 2 3 3L6 21H3v-3L19 2Z"></path>
                  <path d="M19 9h2M15 5h2M19 5h.01M9 2h.01M1 7h.01M5 3h.01"></path>
                </svg>
              </span>
          <span className="mob-text">{lang === 'ar' ? 'تعديل كامل' : 'Full Edit'}</span>
        </NavLink>
        <NavLink to="/dashboard/videos" className={({ isActive }) => `mobile-nav-item nav-route ${isActive ? 'active' : ''}`}>
          <span className="mob-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
              <line x1="17" y1="2" x2="17" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
          </span>
          <span className="mob-text">{t('nav.dash.videos')}</span>
        </NavLink>
        <NavLink to="/dashboard/settings" className={({ isActive }) => `mobile-nav-item nav-route ${isActive ? 'active' : ''}`}>
          <span className="mob-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </span>
          <span className="mob-text">{lang === 'ar' ? 'الإعدادات' : 'Settings'}</span>
        </NavLink>
        <NavLink to="/dashboard/account" className={({ isActive }) => `mobile-nav-item nav-route ${isActive ? 'active' : ''}`}>
          <span className="mob-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
          <span className="mob-text">{lang === 'ar' ? 'حسابي' : 'Account'}</span>
        </NavLink>
      </nav>

      {/* Main Content */}
      <div className="dash-main-layout">
        <div className="dash-topbar" id="dashTopbar">
          <div className="topbar-left">
            <span className="topbar-title" id="topbarTitle" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {getActiveIcon(location.pathname)}
              <span>{title}</span>
            </span>
            <span className="topbar-subtitle" style={{ fontSize: '0.8rem', opacity: 0.6 }}>{subtitle}</span>
          </div>
          <div className="topbar-actions">
            <button className="lang-toggle-btn" id="dashLangToggle" onClick={toggleLang}>
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>
            <button
              className="theme-toggle-btn topbar-icon-btn"
              id="btnThemeToggle"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="topbar-icon-btn" id="btnNotifications" onClick={() => showToast(lang === 'ar' ? 'لا توجد إشعارات جديدة 🔔' : 'No new notifications 🔔', 'info')}>🔔</button>
            <button className="topbar-icon-btn hamburger-btn" id="btnMobileMenu" onClick={() => setIsMobileOpen(true)}>☰</button>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
