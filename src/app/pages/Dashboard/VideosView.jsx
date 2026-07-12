import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function VideosView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    async function loadVideos() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('video_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (data) setVideos(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, [user]);

  const triggerMockDownload = (filename) => {
    showToast(`جاري بدء تحميل الملف ${filename} لمشروعك المحلي... 🚀`, 'success');
  };

  return (
    <div id="dash-subview-videos" className="dash-subview active">
      <div className="subview-header">
        <h1 className="subview-title">فيديوهاتي 🎬</h1>
        <p className="subview-subtitle">مكتبة مقاطع الفيديو المعالجة الخاصة بك</p>
      </div>

      <div className="dash-recent-videos-wrapper">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>جاري تحميل البيانات...</div>
        ) : videos.length === 0 ? (
          <div className="table-empty-state glass-panel" id="dashVideosEmptyState">
            <div className="empty-illustration-wrapper">
              <svg className="empty-svg" viewBox="0 0 100 100" width="120" height="120">
                <defs>
                  <linearGradient id="purpleGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9F67FF" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>
                <rect x="15" y="45" width="6" height="10" rx="3" fill="url(#purpleGrad2)"/>
                <rect x="25" y="30" width="6" height="40" rx="3" fill="url(#purpleGrad2)"/>
                <rect x="35" y="48" width="6" height="4" rx="2" fill="#EF4444" opacity="0.8"/>
                <rect x="45" y="35" width="6" height="30" rx="3" fill="url(#purpleGrad2)"/>
                <rect x="55" y="48" width="6" height="4" rx="2" fill="#EF4444" opacity="0.8"/>
                <rect x="65" y="20" width="6" height="60" rx="3" fill="url(#purpleGrad2)"/>
                <rect x="75" y="40" width="6" height="20" rx="3" fill="url(#purpleGrad2)"/>
                <path d="M50 55 C60 55, 65 65, 58 72 C55 75, 45 75, 42 72 C35 65, 40 55, 50 55 Z" fill="#7C3AED" opacity="0.4"/>
                <path d="M47 62 L50 59 L53 62 M50 59 L50 69" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <h4>لا توجد فيديوهات معالجة بعد</h4>
            <p>ارفع أول فيديو لك بالذكاء الاصطناعي لتجربة ميزة إزالة الفراغات الفائقة</p>
            <Link to="/dashboard/editor" className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>ارفع فيديو الآن</Link>
          </div>
        ) : (
          <div className="dash-home-filled-list">
            <div className="recent-videos-list" id="videosListFullContainer">
              {videos.map((v) => (
                <div key={v.id} className="video-list-item glass-panel">
                  <div className="video-item-icon">🎬</div>
                  <div className="video-item-details">
                    <h4 className="video-item-title">{v.filename}</h4>
                    <p className="video-item-meta">
                      {new Date(v.created_at).toLocaleDateString()} • {v.duration_original || 'N/A'} • تم توفير: {v.time_saved || '0ث'}
                    </p>
                  </div>
                  <button 
                    className="btn btn-secondary btn-nav download-list-item-btn"
                    onClick={() => triggerMockDownload(v.filename)}
                  >
                    تحميل
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
