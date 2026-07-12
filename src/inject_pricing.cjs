const fs = require('fs');

let indexHtml = fs.readFileSync('src/../index.html', 'utf8');

// HTML to inject
const pricingViewHTML = `
    <!-- ------------------------------------------------------------- -->
    <!-- ROUTE VIEW: PRICING -->
    <!-- ------------------------------------------------------------- -->
    <div id="view-pricing" class="route-view">
      <header class="navbar-wrapper">
        <div class="container navbar-container">
          <a href="/" class="logo nav-route">Vireon <span>✂️</span></a>
          <div class="nav-actions">
            <a href="/login" class="nav-link login-link nav-route">تسجيل الدخول</a>
            <a href="/signup" class="btn btn-primary nav-route">ابدأ مجاناً ✨</a>
          </div>
        </div>
      </header>

      <section class="pricing-page-section">
        <div class="pricing-glow-1"></div>
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">اختر الباقة المناسبة لك</h2>
            <p class="section-subtitle">لا توجد حدود للإبداع مع Vireon</p>
            <div class="pricing-toggle-wrapper">
              <span class="toggle-label" id="labelMonthlyPricing">شهرياً</span>
              <button class="pricing-toggle-btn active" id="billingTogglePricing" aria-label="Toggle billing period">
                <span class="toggle-dot"></span>
              </button>
              <span class="toggle-label" id="labelYearlyPricing">كل 3 شهور <span class="discount-badge">خصم 33% 🔥</span></span>
            </div>
          </div>
          
          <div class="pricing-cards-container">
            <!-- Monthly Plan -->
            <div class="pricing-plan-card glass-panel monthly-plan">
              <h3 class="plan-name">شهري</h3>
              <div class="plan-price">
                <span class="currency">$</span><span class="price-val">12</span><span class="period">/شهر</span>
              </div>
              <ul class="plan-features">
                <li>✅ ساعات غير محدودة</li>
                <li>✅ إزالة السكتات بالـ AI</li>
                <li>✅ إزالة كلمات الحشو (آه، يعني، امممم)</li>
                <li>✅ تصدير MP4 + EDL + XML + SRT</li>
                <li>✅ Timeline Editor كامل</li>
                <li>✅ دعم العربي والإنجليزي</li>
                <li>✅ أولوية في المعالجة</li>
              </ul>
              <button class="btn btn-subscribe btn-block btn-payment-toast">اشترك الآن</button>
            </div>
            
            <!-- Quarterly Plan -->
            <div class="pricing-plan-card glass-panel quarterly-plan featured">
              <div class="savings-badge">الأوفر 🔥</div>
              <h3 class="plan-name">ربع سنوي (كل 3 شهور)</h3>
              <div class="plan-price">
                <span class="currency">$</span><span class="price-val">8</span><span class="period">/شهر</span>
                <div class="billing-note">(تُدفع $24 كل 3 شهور)</div>
              </div>
              <ul class="plan-features">
                <li>✅ ساعات غير محدودة</li>
                <li>✅ إزالة السكتات بالـ AI</li>
                <li>✅ إزالة كلمات الحشو (آه، يعني، امممم)</li>
                <li>✅ تصدير MP4 + EDL + XML + SRT</li>
                <li>✅ Timeline Editor كامل</li>
                <li>✅ دعم العربي والإنجليزي</li>
                <li>✅ أولوية في المعالجة</li>
              </ul>
              <button class="btn btn-subscribe btn-block btn-payment-toast">اشترك الآن</button>
            </div>
          </div>
        </div>
      </section>
    </div>
`;

const upgradeModalHTML = `
    <!-- Upgrade Modal -->
    <div id="upgradeModal" class="upgrade-modal hidden">
      <div class="upgrade-modal-overlay"></div>
      <div class="upgrade-modal-content glass-panel">
        <button class="btn-close-modal" id="closeUpgradeModal">✕</button>
        <div class="upgrade-header">
          <h2>وصلت للحد المجاني ✂️</h2>
          <p>رقّي باقتك عشان تكمل بدون حدود</p>
        </div>
        <div class="pricing-cards-container modal-pricing">
            <!-- Monthly Plan -->
            <div class="pricing-plan-card glass-panel monthly-plan">
              <h3 class="plan-name">شهري</h3>
              <div class="plan-price">
                <span class="currency">$</span><span class="price-val">12</span><span class="period">/شهر</span>
              </div>
              <button class="btn btn-subscribe btn-block btn-payment-toast">اشترك الآن</button>
            </div>
            
            <!-- Quarterly Plan -->
            <div class="pricing-plan-card glass-panel quarterly-plan featured">
              <div class="savings-badge">الأوفر 🔥</div>
              <h3 class="plan-name">ربع سنوي</h3>
              <div class="plan-price">
                <span class="currency">$</span><span class="price-val">8</span><span class="period">/شهر</span>
                <div class="billing-note">(تُدفع $24 كل 3 شهور)</div>
              </div>
              <button class="btn btn-subscribe btn-block btn-payment-toast">اشترك الآن</button>
            </div>
        </div>
      </div>
    </div>
`;

// Insert view-pricing before view-signup
if (!indexHtml.includes('id="view-pricing"')) {
    indexHtml = indexHtml.replace(
        '    <!-- ROUTE VIEW: SIGN UP PAGE -->', 
        pricingViewHTML + '\n\n    <!-- ROUTE VIEW: SIGN UP PAGE -->'
    );
}

// Insert upgradeModal before script tag
if (!indexHtml.includes('id="upgradeModal"')) {
    indexHtml = indexHtml.replace(
        '    <script type="module" src="/src/main.js"></script>',
        upgradeModalHTML + '\n    <script type="module" src="/src/main.js"></script>'
    );
}

// Add upgrade button to dashboard account view
const upgradeBtnHTML = `
                  <div class="results-row" id="upgradeBtnContainer" style="margin-top: 15px; border-top: none; justify-content: flex-end;">
                    <button class="btn btn-primary" id="btnAccountUpgrade" style="background: linear-gradient(135deg, #7C3AED, #EC4899);">الترقية الآن ✨</button>
                  </div>`;
if (!indexHtml.includes('id="btnAccountUpgrade"')) {
    indexHtml = indexHtml.replace(
        '                  </div>\r\n                  <div class="results-row">\r\n                    <span>',
        '                  </div>\r\n                  <div class="results-row">\r\n                    <span>'
    ).replace(
        '<strong id="accCredits">300',
        '<strong id="accCredits">300'
    );
    
    // Better replacement strategy for the account card:
    const accCardPattern = /<strong id="accCredits">.*?<\/strong>\s*<\/div>/;
    indexHtml = indexHtml.replace(accCardPattern, match => match + '\n' + upgradeBtnHTML);
}

fs.writeFileSync('src/../index.html', indexHtml, 'utf8');
console.log('Successfully injected pricing HTML');
