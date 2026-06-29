const fs = require('fs');

let mainJs = fs.readFileSync('src/../src/main.js', 'utf8');

// 1. Add pricing route
if (!mainJs.includes("'/pricing':")) {
    mainJs = mainJs.replace(
        "'/dashboard': { viewId: 'view-dashboard'",
        "'/pricing': { viewId: 'view-pricing', requiresAuth: false, title: 'الأسعار | CutFlow' },\n    '/dashboard': { viewId: 'view-dashboard'"
    );
}

// 2. Append JS logic for toast and modal
const logicToAppend = `
/* =========================================================================
   PRICING & UPGRADE LOGIC
   ========================================================================= */

function showToast(message) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = \`<span>ℹ️</span> <span>\${message}</span>\`;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.querySelectorAll('.btn-payment-toast').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('قريباً! سيتم إضافة الدفع قريباً — تواصل معنا على info@cutflow.io');
  });
});

const upgradeModal = document.getElementById('upgradeModal');
const closeUpgradeModal = document.getElementById('closeUpgradeModal');

window.openUpgradeModal = function() {
  if (upgradeModal) {
    upgradeModal.classList.remove('hidden');
  }
};

if (closeUpgradeModal) {
  closeUpgradeModal.addEventListener('click', () => {
    upgradeModal.classList.add('hidden');
  });
}

const btnAccountUpgrade = document.getElementById('btnAccountUpgrade');
if (btnAccountUpgrade) {
  btnAccountUpgrade.addEventListener('click', (e) => {
    e.preventDefault();
    window.openUpgradeModal();
  });
}

// Add event listener to any link pointing to #pricing or /pricing
document.querySelectorAll('a[href="/pricing"], a[href="#pricing"]').forEach(link => {
  link.addEventListener('click', (e) => {
    // Let the router handle /pricing, but if we need a quick nav for anchor links:
    if (link.getAttribute('href') === '#pricing') {
      e.preventDefault();
      window.history.pushState({}, '', '/pricing');
      renderRoute('/pricing');
    }
  });
});
`;

if (!mainJs.includes('function showToast')) {
    mainJs += '\n' + logicToAppend;
}

fs.writeFileSync('src/../src/main.js', mainJs, 'utf8');
console.log('Successfully updated main.js with pricing/modal logic');
