import React from 'react';

export default function Spinner({ text = 'جاري التحقق...' }) {
  return (
    <div className="auth-loading-overlay">
      <div className="spinner-container">
        <div className="auth-spinner"></div>
        <p className="auth-spinner-text">{text}</p>
      </div>
    </div>
  );
}
