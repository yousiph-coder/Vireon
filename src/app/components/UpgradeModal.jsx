import React from 'react';
import { useToast } from '../context/ToastContext';

export default function UpgradeModal({ isOpen, onClose }) {
  const { showToast } = useToast();

  const handleSubscribe = () => {
    showToast('هذه الميزة قيد التطوير حالياً، ترقبوا التحديث القادم! 🚀', 'info');
  };

  return (
    <div className={`upgrade-modal ${isOpen ? '' : 'hidden'}`}>
      <div className="upgrade-modal-overlay" onClick={onClose}></div>
      <div className="upgrade-modal-content glass-panel">
        <button className="btn-close-modal" onClick={onClose}>✕</button>
        <div className="upgrade-header">
          <h2>وصلت للحد المجاني ✂️</h2>
          <p>رقّي باقتك عشان تكمل بدون حدود</p>
        </div>
        <div className="pricing-cards-container modal-pricing">
          {/* Monthly Plan */}
          <div className="pricing-plan-card glass-panel monthly-plan">
            <h3 className="plan-name">شهري</h3>
            <div className="plan-price">
              <span className="currency">$</span><span className="price-val">12</span><span className="period">/شهر</span>
            </div>
            <button className="btn btn-subscribe btn-block btn-payment-toast" onClick={handleSubscribe}>اشترك الآن</button>
          </div>
          
          {/* Quarterly Plan */}
          <div className="pricing-plan-card glass-panel quarterly-plan featured">
            <div className="savings-badge">الأوفر 🔥</div>
            <h3 className="plan-name">ربع سنوي</h3>
            <div className="plan-price">
              <span className="currency">$</span><span className="price-val">8</span><span class="period">/شهر</span>
              <div className="billing-note">(تُدفع $24 كل 3 شهور)</div>
            </div>
            <button className="btn btn-subscribe btn-block btn-payment-toast" onClick={handleSubscribe}>اشترك الآن</button>
          </div>
        </div>
      </div>
    </div>
  );
}
