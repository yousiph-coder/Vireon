import React, { useState } from 'react';
import { useTranslation } from '../../context/I18nContext';

export default function ToolsPanel({
  bladeMode,
  onSplit,
  onToggleBlade,
  onDelete,
  onRippleDelete,
  onDeleteForward,
  onDeleteBackward,
  onRestore,
  // Caption styling props
  captionsEnabled,
  setCaptionsEnabled,
  captionStyle,
  setCaptionStyle,
  // Auto Zoom props
  autoZoomEnabled,
  setAutoZoomEnabled
}) {
  const { lang } = useTranslation();
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'tools' | 'captions'

  const alignment = lang === 'ar' ? 'right' : 'left';

  return (
    <div className="cc-left-panel">
      <div className="cc-tabs">
        <div 
          className={`cc-tab ${activeTab === 'media' ? 'active' : ''}`} 
          onClick={() => setActiveTab('media')}
        >
          {lang === 'ar' ? '📁 المقاطع' : '📁 Media'}
        </div>
        <div 
          className={`cc-tab ${activeTab === 'tools' ? 'active' : ''}`} 
          onClick={() => setActiveTab('tools')}
        >
          {lang === 'ar' ? '✂️ أدوات' : '✂️ Tools'}
        </div>
        <div 
          className={`cc-tab ${activeTab === 'captions' ? 'active' : ''}`} 
          onClick={() => setActiveTab('captions')}
        >
          {lang === 'ar' ? '📝 نصوص' : '📝 Texts'}
        </div>
      </div>
      
      {activeTab === 'media' && (
        <div className="cc-tab-content active" id="cc-tab-media">
          <div className="cc-media-grid" id="ccMediaGrid">
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem' }}>
              {lang === 'ar' ? 'الفيديو الأصلي متصل وجاهز للقص' : 'Original video connected and ready to cut'}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'tools' && (
        <div className="cc-tab-content active" id="cc-tab-tools">
          <button 
            className="btn btn-secondary btn-block" 
            id="ccBtnSplitTool" 
            style={{ marginBottom: '0.5rem', textAlign: alignment, background: 'rgba(255,255,255,0.05)' }}
            onClick={onSplit}
          >
            {lang === 'ar' ? '✂️ تقسيم المقطع (S)' : '✂️ Split Segment (S)'}
          </button>
          
          <button 
            className="btn btn-secondary btn-block" 
            id="ccBtnBladeMode" 
            style={{ 
              marginBottom: '0.5rem', 
              textAlign: alignment, 
              background: bladeMode ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)' 
            }}
            onClick={onToggleBlade}
          >
            {lang === 'ar' ? '🔪 وضع الشفرة (B)' : '🔪 Blade Mode (B)'}
          </button>
          
          <button 
            className="btn btn-secondary btn-block" 
            id="ccBtnDeleteTool" 
            style={{ marginBottom: '0.5rem', textAlign: alignment, background: 'rgba(239,68,68,0.15)' }}
            onClick={onDelete}
          >
            {lang === 'ar' ? '🗑️ قص / حذف الجزء (Del)' : '🗑️ Cut / Delete Segment (Del)'}
          </button>
          
          <button 
            className="btn btn-secondary btn-block" 
            id="ccBtnRippleDelete" 
            style={{ marginBottom: '0.5rem', textAlign: alignment, background: 'rgba(239,68,68,0.1)' }}
            onClick={onRippleDelete}
          >
            {lang === 'ar' ? '⚡ حذف وإغلاق الفراغ (Shift+Del)' : '⚡ Ripple Delete (Shift+Del)'}
          </button>
          
          <button 
            className="btn btn-secondary btn-block" 
            id="ccBtnDeleteForward" 
            style={{ marginBottom: '0.5rem', textAlign: alignment, background: 'rgba(239,68,68,0.1)' }}
            onClick={onDeleteForward}
          >
            {lang === 'ar' ? '🗑️ حذف ما بعد المؤشر (D)' : '🗑️ Delete Forward (D)'}
          </button>
          
          <button 
            className="btn btn-secondary btn-block" 
            id="ccBtnDeleteBackward" 
            style={{ marginBottom: '0.5rem', textAlign: alignment, background: 'rgba(239,68,68,0.1)' }}
            onClick={onDeleteBackward}
          >
            {lang === 'ar' ? '🗑️ حذف ما قبل المؤشر (Shift+D)' : '🗑️ Delete Backward (Shift+D)'}
          </button>
          
          <button 
            className="btn btn-secondary btn-block" 
            id="ccBtnRestoreTool" 
            style={{ marginBottom: '0.5rem', textAlign: alignment, background: 'rgba(16,185,129,0.1)' }}
            onClick={onRestore}
          >
            {lang === 'ar' ? '♻️ استعادة الجزء المحذوف' : '♻️ Restore Deleted Segment'}
          </button>
          
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            {lang === 'ar' ? 'اختصارات لوحة المفاتيح:' : 'Keyboard Shortcuts:'}
          </p>
          {lang === 'ar' ? (
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: '1.8' }}>
              Space = تشغيل/إيقاف<br />
              S = تقسيم<br />
              B = وضع الشفرة<br />
              Del = حذف<br />
              Shift+Del = حذف + إغلاق<br />
              D = حذف ما بعد المؤشر<br />
              Shift+D = حذف ما قبل المؤشر<br />
              Ctrl+Z = تراجع<br />
              ← → = إطار واحد<br />
              Shift+← → = 5 ثواني
            </p>
          ) : (
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: '1.8' }}>
              Space = Play / Pause<br />
              S = Split Segment<br />
              B = Blade Mode<br />
              Del = Delete Segment<br />
              Shift+Del = Ripple Delete<br />
              D = Delete Forward<br />
              Shift+D = Delete Backward<br />
              Ctrl+Z = Undo<br />
              ← → = 1 Frame Seek<br />
              Shift+← → = 5 Seconds Seek
            </p>
          )}
        </div>
      )}

      {activeTab === 'captions' && (
        <div className="cc-tab-content active" style={{ padding: '15px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              {lang === 'ar' ? 'عرض نصوص الشاشة' : 'Show Auto Captions'}
            </span>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={captionsEnabled}
                onChange={(e) => setCaptionsEnabled(e.target.checked)}
              />
              <span className="toggle-thumb"></span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              {lang === 'ar' ? 'معاينة التكبير التلقائي' : 'Preview Auto Zoom'}
            </span>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={autoZoomEnabled}
                onChange={(e) => setAutoZoomEnabled(e.target.checked)}
              />
              <span className="toggle-thumb"></span>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', pointerEvents: captionsEnabled ? 'auto' : 'none', opacity: captionsEnabled ? 1 : 0.5 }}>
            {/* Font Family */}
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px', display: 'block' }}>
                {lang === 'ar' ? '🔤 نوع الخط' : '🔤 Font Family'}
              </label>
              <select 
                value={captionStyle.fontName} 
                onChange={(e) => setCaptionStyle({ ...captionStyle, fontName: e.target.value })}
                style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', outline: 'none' }}
              >
                <option value="Cairo">Cairo (عربي)</option>
                <option value="Arial">Arial</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>

            {/* Font Color */}
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px', display: 'block' }}>
                {lang === 'ar' ? '🎨 لون النص' : '🎨 Text Color'}
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="color" 
                  value={captionStyle.fontColor} 
                  onChange={(e) => setCaptionStyle({ ...captionStyle, fontColor: e.target.value })}
                  style={{ width: '40px', height: '30px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem' }}>{captionStyle.fontColor}</span>
              </div>
            </div>

            {/* Position */}
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px', display: 'block' }}>
                {lang === 'ar' ? '📍 موضع النص' : '📍 Position'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['top', 'center', 'bottom'].map((pos) => (
                  <button 
                    key={pos}
                    className={`btn ${captionStyle.position === pos ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '6px', fontSize: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    onClick={() => setCaptionStyle({ ...captionStyle, position: pos })}
                  >
                    {pos === 'top' ? (lang === 'ar' ? 'أعلى' : 'Top') : pos === 'center' ? (lang === 'ar' ? 'منتصف' : 'Center') : (lang === 'ar' ? 'أسفل' : 'Bottom')}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>
                <span>{lang === 'ar' ? '📐 حجم الخط' : '📐 Font Size'}</span>
                <span>{captionStyle.fontSize}px</span>
              </div>
              <input 
                type="range" 
                min="16" 
                max="48" 
                value={captionStyle.fontSize}
                onChange={(e) => setCaptionStyle({ ...captionStyle, fontSize: parseInt(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
