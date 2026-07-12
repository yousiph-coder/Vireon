import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export default function SettingsView() {
  const { showToast } = useToast();
  const [silenceThreshold, setSilenceThreshold] = useState(5);
  const [sensitivity, setSensitivity] = useState(2);
  const [fillerWords, setFillerWords] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vireon_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.silenceThreshold !== undefined) setSilenceThreshold(parsed.silenceThreshold);
        if (parsed.sensitivity !== undefined) setSensitivity(parsed.sensitivity);
        if (parsed.fillerWords !== undefined) setFillerWords(parsed.fillerWords);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const preferences = { silenceThreshold, sensitivity, fillerWords };
    localStorage.setItem('vireon_preferences', JSON.stringify(preferences));
    showToast('تم حفظ إعدادات التفضيلات الافتراضية بنجاح! ⚙️', 'success');
  };

  const sensitivityLabels = { 1: 'منخفض', 2: 'متوسط', 3: 'عالي' };

  return (
    <div id="dash-subview-settings" className="dash-subview active">
      <div className="subview-header">
        <h1 className="subview-title">إعدادات الذكاء الاصطناعي ⚙️</h1>
        <p className="subview-subtitle">تعديل سلوك معالجة المقاطع وتحديد الخصائص الافتراضية</p>
      </div>

      <div className="uploader-studio-card glass-panel" style={{ maxWidth: '650px', margin: '0 auto', padding: '2rem' }}>
        <form onSubmit={handleSave}>
          <div className="settings-group">
            <div className="settings-slider-row">
              <label className="settings-label">⏱️ طول الصمت الافتراضي</label>
              <span className="settings-slider-value" id="prefSilenceVal">{(silenceThreshold / 10).toFixed(1)} ث</span>
            </div>
            <input 
              type="range" 
              className="settings-slider" 
              id="prefSilenceSlider" 
              min="1" 
              max="30" 
              value={silenceThreshold}
              onChange={(e) => setSilenceThreshold(parseInt(e.target.value))}
            />
          </div>

          <div className="settings-group">
            <div className="settings-slider-row">
              <label className="settings-label">🎚️ حساسية الالتقاط الافتراضية</label>
              <span className="settings-slider-value" id="prefSensitivityVal">{sensitivityLabels[sensitivity]}</span>
            </div>
            <input 
              type="range" 
              className="settings-slider" 
              id="prefSensitivitySlider" 
              min="1" 
              max="3" 
              value={sensitivity}
              onChange={(e) => setSensitivity(parseInt(e.target.value))}
            />
          </div>

          <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label className="settings-label" style={{ margin: 0 }}>🗣️ إزالة كلمات الحشو تلقائياً</label>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  id="prefFillerWords" 
                  checked={fillerWords}
                  onChange={(e) => setFillerWords(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>حفظ الإعدادات</button>
        </form>
      </div>
    </div>
  );
}
