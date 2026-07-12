import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import UpgradeModal from '../../components/UpgradeModal';

export default function AccountView() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({ plan_tier: 'Free', minutes_used: 0 });
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, plan_tier, minutes_used')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfileData(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProfile();
  }, [user]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'صانع المحتوى';
  const avatarLetter = userName.charAt(0).toUpperCase();
  const email = user?.email || 'user@example.com';
  
  const limit = profileData.plan_tier === 'Free' ? 30 : 9999;
  const remainingMinutes = profileData.plan_tier === 'Free' ? `${limit - profileData.minutes_used} دقيقة` : 'غير محدود';

  return (
    <div id="dash-subview-account" className="dash-subview active">
      <div className="subview-header">
        <h1 className="subview-title">حسابي 👤</h1>
        <p className="subview-subtitle">إدارة بيانات حسابك والاشتراكات الحالية وتراخيص الاستخدام</p>
      </div>

      <div className="uploader-studio-card glass-panel" style={{ maxWidth: '650px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', align_items: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="sidebar-avatar" style={{ width: '64px', height: '64px', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{avatarLetter}</div>
          <div>
            <h3 style={{ color: 'var(--text)', marginBottom: '0.2rem' }}>{userName}</h3>
            <span className="profile-plan">{profileData.plan_tier} (مخطط تجريبي)</span>
          </div>
        </div>

        <div className="settings-divider"></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>البريد الإلكتروني:</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>الرصيد المتبقي:</span>
            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{remainingMinutes}</span>
          </div>
        </div>

        <div className="settings-divider"></div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsUpgradeOpen(true)}>ترقية الباقة الآن 💎</button>
      </div>

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </div>
  );
}
