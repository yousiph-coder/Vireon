const fs = require('fs');

const cssToAppend = `
/* =========================================================================
   PRICING PAGE & UPGRADE MODAL
   ========================================================================= */

.pricing-page-section { padding: 80px 0 120px; position: relative; min-height: 100vh; display: flex; align-items: center; }
.pricing-glow-1 { position: absolute; width: 600px; height: 600px; background: rgba(124,58,237,0.15); filter: blur(150px); border-radius: 50%; top: 20%; left: 50%; transform: translateX(-50%); pointer-events: none; z-index: -1; }

.pricing-cards-container { display: flex; justify-content: center; gap: 30px; margin-top: 40px; flex-wrap: wrap; }
.pricing-plan-card { 
  background: rgba(255,255,255,0.03); 
  border: 1px solid rgba(124,58,237,0.2); 
  border-radius: 20px; 
  padding: 40px 30px; 
  width: 100%; 
  max-width: 380px; 
  display: flex; 
  flex-direction: column; 
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.pricing-plan-card.featured {
  border: 1px solid #EC4899;
  box-shadow: 0 0 40px rgba(236,72,153,0.2);
  transform: scale(1.05);
}
.pricing-plan-card:hover { transform: translateY(-5px); }
.pricing-plan-card.featured:hover { transform: scale(1.05) translateY(-5px); }

.savings-badge { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: rgba(16,185,129,0.15); color: #10B981; border: 1px solid rgba(16,185,129,0.3); padding: 5px 15px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; white-space: nowrap; }
.plan-name { font-size: 1.5rem; margin-bottom: 20px; color: var(--text-secondary); text-align: center; }
.plan-price { text-align: center; margin-bottom: 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.price-row { display: flex; align-items: baseline; justify-content: center; }
.currency { font-size: 1.5rem; color: #fff; font-weight: 700; margin-right: 5px; }
.price-val { font-size: 48px; font-weight: 900; color: #fff; line-height: 1; }
.period { font-size: 1rem; color: var(--text-muted); margin-left: 5px; }
.billing-note { font-size: 0.85rem; color: var(--color-pink); margin-top: 10px; font-weight: 600; background: rgba(236,72,153,0.1); padding: 4px 10px; border-radius: 8px; }

.plan-features { margin-bottom: 40px; flex-grow: 1; display: flex; flex-direction: column; gap: 15px; }
.plan-features li { display: flex; align-items: center; gap: 10px; font-size: 0.95rem; color: var(--text-primary); }

.btn-subscribe { background: linear-gradient(135deg, #7C3AED, #EC4899); border: none; color: #fff; padding: 15px; border-radius: 12px; font-size: 1.1rem; font-weight: 700; transition: all 0.3s; }
.btn-subscribe:hover { box-shadow: 0 0 20px rgba(124,58,237,0.5); }

/* Upgrade Modal */
.upgrade-modal { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; }
.upgrade-modal-overlay { position: absolute; inset: 0; background: rgba(13,13,13,0.8); backdrop-filter: blur(8px); }
.upgrade-modal-content { position: relative; z-index: 1; width: 90%; max-width: 900px; max-height: 90vh; overflow-y: auto; padding: 40px; border-radius: 24px; background: rgba(22,22,42,0.95); border: 1px solid var(--border-color); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.btn-close-modal { position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.1); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; }
.btn-close-modal:hover { background: rgba(239,68,68,0.2); color: #EF4444; }
.upgrade-header { text-align: center; margin-bottom: 30px; }
.upgrade-header h2 { font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #7C3AED, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
.upgrade-header p { color: var(--text-secondary); font-size: 1.1rem; }
.modal-pricing { margin-top: 20px; }
.modal-pricing .pricing-plan-card { padding: 30px 20px; }
.modal-pricing .plan-features { display: none; } /* Hide features in modal to save space if needed, or keep them. The prompt says "show both plan cards inside the modal". Let's keep them compact. */
@media (max-width: 768px) {
  .pricing-cards-container { flex-direction: column; align-items: center; }
  .pricing-plan-card.featured { transform: scale(1); }
  .pricing-plan-card.featured:hover { transform: translateY(-5px); }
}

/* Toast */
.toast-container { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; display: flex; flex-direction: column; gap: 10px; }
.toast { background: rgba(13,13,13,0.9); backdrop-filter: blur(10px); border: 1px solid var(--border-color); color: #fff; padding: 12px 24px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-weight: 600; display: flex; align-items: center; gap: 10px; animation: fadeSlideUp 0.3s ease forwards; }
.toast.hide { animation: fadeOutDown 0.3s ease forwards; }
@keyframes fadeOutDown { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }
`;

fs.appendFileSync('src/../src/style.css', '\n' + cssToAppend, 'utf8');
console.log('Appended pricing styles to style.css');
