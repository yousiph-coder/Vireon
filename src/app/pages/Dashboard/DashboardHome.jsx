import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function DashboardHome() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { lang, t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({ plan_tier: 'Free', minutes_used: 0 });
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, plan_tier, minutes_used')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setProfileData(profile);
        }

        const { data: history } = await supabase
          .from('video_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (history) {
          setVideos(history);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 640);

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth > 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('dash.welcome.name');

  const triggerMockDownload = (filename) => {
    const msg = lang === 'ar' 
      ? `جاري بدء تحميل الملف ${filename} لمشروعك المحلي... 🚀`
      : `Starting download of ${filename} to your local project... 🚀`;
    showToast(msg, 'success');
  };

  return (
    <div id="dash-subview-home" className="dash-subview active">
      <div className="subview-header">
        <h1 className="subview-title">
          {lang === 'ar' ? `أهلاً ${userName} 👋` : `Welcome, ${userName} 👋`}
        </h1>
        <p className="subview-subtitle">
          {lang === 'ar' ? 'استوديو التحكم الذكي لقص الفيديوهات بأعلى جودة' : 'Smart control studio for high quality video cutting'}
        </p>
      </div>

      {/* Waveform timeline strip */}
      <div className="vr-waveform-strip" aria-hidden="true">
        {[40,65,30,80,55,90,35,70,50,85,45,75,60,95,40,70,55,80,35,65,90,50,75,45,85,60,30,70].map((h, i) => (
          <div
            key={i}
            className="vr-bar"
            style={{ height: `${h}%`, animationDelay: `${(i * 0.08).toFixed(2)}s` }}
          />
        ))}
        <div className="vr-head" />
      </div>

      {/* Stats Grid */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card glass-panel">
          <div className="stat-card-icon-wrapper"><span className="stat-card-icon">⏳</span></div>
          <div className="stat-card-details">
            <span className="stat-card-label">{t('dash.stat.minutes')}</span>
            <strong className="stat-card-value">
              <span>{profileData.minutes_used}</span> / {profileData.plan_tier === 'Free' ? '30' : '9999'}
            </strong>
          </div>
        </div>
        <div className="dash-stat-card glass-panel">
          <div className="stat-card-icon-wrapper"><span className="stat-card-icon">🎬</span></div>
          <div className="stat-card-details">
            <span className="stat-card-label">{t('dash.stat.videos')}</span>
            <strong className="stat-card-value">{videos.length}</strong>
          </div>
        </div>
        <div className="dash-stat-card glass-panel">
          <div className="stat-card-icon-wrapper"><span className="stat-card-icon">💎</span></div>
          <div className="stat-card-details">
            <span className="stat-card-label">{t('dash.stat.plan')}</span>
            <strong className="stat-card-value">{profileData.plan_tier}</strong>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="dash-quick-action-banner">
        <div className="banner-text-group">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="vr-dot" />
            {t('dash.banner.title')}
          </h3>
          <p>{t('dash.banner.sub')}</p>
        </div>
        <div className="banner-waveform" aria-hidden="true">
          <div className="wm-bar"></div>
          <div className="wm-bar"></div>
          <div className="wm-bar"></div>
          <div className="wm-bar"></div>
          <div className="wm-bar"></div>
          <div className="wm-bar"></div>
          <div className="wm-bar"></div>
        </div>
        <Link to="/dashboard/fulledit" className="btn btn-primary btn-lg">
          <span className="vr-up" style={{ display: 'inline-flex', marginInlineEnd: '6px' }}>⬆️</span>
          {t('dash.banner.btn')}
        </Link>
      </div>

      {/* AI Features Grid / المميزات الأدوات الذكية */}
      <div style={{ marginTop: '45px', marginBottom: '25px', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', padding: '0 10px' }}>
        {/* Neon Gradients for SVG strokes */}
        <svg style={{ width: 0, height: 0, position: 'absolute' }}>
          <defs>
            <linearGradient id="purpleNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="cyanNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
            <linearGradient id="coralNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
        </svg>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--text)' }}>
          {lang === 'ar' ? 'المميزات والأدوات الذكية ✨' : 'AI Creative Tools ✨'}
        </h3>
        <div className="dash-features-grid" style={{ display: 'grid', gridTemplateColumns: isLargeScreen ? 'repeat(2, 1fr)' : '1fr', gap: '20px' }}>
          
          {/* Card 1: التعديل الكامل */}
          <Link 
            to="/dashboard/fulledit" 
            className="glass-panel feature-card-item vr-card" 
            style={{ 
              textDecoration: 'none', 
              color: 'inherit', 
              padding: '25px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              borderRadius: 'var(--radius-lg)', 
              background: 'rgba(122, 69, 160, 0.12)', 
              border: '1px solid rgba(122, 69, 160, 0.25)',
            }}
          >
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', boxShadow: '0 0 15px rgba(124, 58, 237, 0.15)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#purpleNeon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(192, 132, 252, 0.5))' }}>
                <line x1="18" y1="2" x2="22" y2="6"></line>
                <path d="M7.5 16.5L16.5 7.5"></path>
                <path d="M15 11l-8 8H3v-4l8-8"></path>
                <path d="M19 13.5v2.5M17.5 15h3M4.5 5.5v2M3.5 6.5h2M12 3v1.5M11.25 3.75h1.5"></path>
              </svg>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text)' }}>
              {lang === 'ar' ? 'التعديل الكامل بـ AI' : 'AI Full Edit'}
            </h4>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: '1.4', margin: 0 }}>
              {lang === 'ar' ? 'القص والزوم والترجمة وإزالة التكرار معاً بضغطة زر.' : 'Automatic silence cutting, zoom, repetitions and subtitles combined.'}
            </p>
          </Link>

          {/* Card 2: إزالة السكتات */}
          <Link 
            to="/dashboard/editor" 
            className="glass-panel feature-card-item vr-card" 
            style={{ 
              textDecoration: 'none', 
              color: 'inherit', 
              padding: '25px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border-soft)',
            }}
          >
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)', boxShadow: '0 0 15px rgba(34, 211, 238, 0.15)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#cyanNeon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(34, 211, 238, 0.5))' }}>
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <line x1="9.8" y1="8.2" x2="20" y2="18"></line>
                <line x1="9.8" y1="15.8" x2="20" y2="6"></line>
                <path d="M14 14v-4M17 16v-8M20 15v-6" opacity="0.8"></path>
              </svg>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text)' }}>
              {lang === 'ar' ? 'إزالة السكتات' : 'Silence Removal'}
            </h4>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: '1.4', margin: 0 }}>
              {lang === 'ar' ? 'تحديد لحظات الصمت والوقفات الطويلة وإزالتها.' : 'Detect and trim silent parts and long pauses.'}
            </p>
          </Link>

          {/* Card 3: توليد النصوص */}
          <Link 
            to="/dashboard/captions" 
            className="glass-panel feature-card-item vr-card" 
            style={{ 
              textDecoration: 'none', 
              color: 'inherit', 
              padding: '25px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border-soft)',
            }}
          >
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.15)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#coralNeon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(252, 165, 165, 0.5))' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text)' }}>
              {lang === 'ar' ? 'توليد النصوص' : 'Auto Captions'}
            </h4>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: '1.4', margin: 0 }}>
              {lang === 'ar' ? 'ترجمة وكتابة نصوص الشاشة التلقائية بـ AI.' : 'Automatically generate and sync text subtitles.'}
            </p>
          </Link>

          {/* Card 4: إزالة التكرارات */}
          <Link 
            to="/dashboard/repetitions" 
            className="glass-panel feature-card-item vr-card" 
            style={{ 
              textDecoration: 'none', 
              color: 'inherit', 
              padding: '25px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border-soft)',
            }}
          >
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', boxShadow: '0 0 15px rgba(168, 85, 247, 0.15)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#purpleNeon)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px rgba(192, 132, 252, 0.5))' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73"></path>
                <line x1="8" y1="16" x2="16" y2="8" strokeWidth="2"></line>
              </svg>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text)' }}>
              {lang === 'ar' ? 'إزالة التكرارات' : 'Remove Repetitions'}
            </h4>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: '1.4', margin: 0 }}>
              {lang === 'ar' ? 'تنظيف التكرار اللفظي وتلعثم الكلام تلقائياً.' : 'Automatically clean stuttering and repetitions.'}
            </p>
          </Link>

        </div>
      </div>

      {/* Recent Videos Wrapper (Moved to bottom) */}
      <div className="dash-recent-videos-wrapper" style={{ marginTop: '80px', paddingTop: '30px', borderTop: '1px solid var(--border-soft)' }}>
        <h3 className="recent-videos-title">{t('dash.recent.title')}</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
            {lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
          </div>
        ) : videos.length === 0 ? (
          /* Empty State */
          <div className="table-empty-state glass-panel" id="dashHomeEmptyState">
            <div className="empty-illustration-wrapper">
              <svg className="empty-svg" viewBox="0 0 100 100" width="120" height="120">
                <defs>
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9F67FF" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>
                <rect x="15" y="45" width="6" height="10" rx="3" fill="url(#purpleGrad)"/>
                <rect x="25" y="30" width="6" height="40" rx="3" fill="url(#purpleGrad)"/>
                <rect x="35" y="48" width="6" height="4" rx="2" fill="#EF4444" opacity="0.8"/>
                <rect x="45" y="35" width="6" height="30" rx="3" fill="url(#purpleGrad)"/>
                <rect x="55" y="48" width="6" height="4" rx="2" fill="#EF4444" opacity="0.8"/>
                <rect x="65" y="20" width="6" height="60" rx="3" fill="url(#purpleGrad)"/>
                <rect x="75" y="40" width="6" height="20" rx="3" fill="url(#purpleGrad)"/>
                <path d="M50 55 C60 55, 65 65, 58 72 C55 75, 45 75, 42 72 C35 65, 40 55, 50 55 Z" fill="#7C3AED" opacity="0.4"/>
                <path d="M47 62 L50 59 L53 62 M50 59 L50 69" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <h4>{t('dash.empty.title')}</h4>
            <p>{t('dash.empty.sub')}</p>
            <Link to="/dashboard/fulledit" className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
              {lang === 'ar' ? 'ابدأ تعديل مقطع 🚀' : 'Start editing a clip 🚀'}
            </Link>
          </div>
        ) : (
          /* Filled List */
          <div className="dash-home-filled-list" id="dashHomeRecentTable">
            <div className="recent-videos-list" id="homeRecentVideosList">
              {videos.slice(0, 3).map((v) => (
                <div key={v.id} className="video-list-item glass-panel">
                  <div className="video-item-icon">🎬</div>
                  <div className="video-item-details">
                    <h4 className="video-item-title">{v.filename}</h4>
                    <p className="video-item-meta">
                      {new Date(v.created_at).toLocaleDateString()} • {v.duration_original || 'N/A'} • {lang === 'ar' ? 'تم توفير:' : 'Saved:'} {v.time_saved || '0ث'}
                    </p>
                  </div>
                  <button 
                    className="btn btn-secondary btn-nav download-list-item-btn"
                    onClick={() => triggerMockDownload(v.filename)}
                  >
                    {lang === 'ar' ? 'تحميل' : 'Download'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
