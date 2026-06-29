const fs = require('fs');

let mainJs = fs.readFileSync('src/../src/main.js', 'utf8');

// Replace initDashboard and renderDashboardStats
const oldCodeRegex = /function initDashboard\(\) \{[\s\S]*?function renderDashboardStats\(\) \{[\s\S]*?if \(dashVideosListFilled\) dashVideosListFilled\.classList\.add\('hidden'\);\s*\}\s*\}/;

const newCode = `function initDashboard() {
    const welcomeName = document.getElementById('dashWelcomeName');
    const sidebarProfileName = document.getElementById('sidebarProfileName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');

    const btnSidebarLogout = document.getElementById('btnSidebarLogout');
    if (btnSidebarLogout) {
      btnSidebarLogout.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
      });
    }

    renderDashboardStats(welcomeName, sidebarProfileName, sidebarAvatar);
    initDashboardUploader();
  }

  async function renderDashboardStats(welcomeName, sidebarProfileName, sidebarAvatar) {
    // Show some loading state or keep existing until loaded
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;
    
    const userId = sessionData.session.user.id;
    
    // Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, plan_tier, minutes_used')
      .eq('id', userId)
      .single();
      
    if (profile) {
      const storedName = profile.full_name || 'صانع المحتوى';
      const currentPlan = profile.plan_tier || 'Free';
      const minutesUsed = profile.minutes_used || 0;
      
      if (welcomeName) welcomeName.textContent = storedName;
      if (sidebarProfileName) sidebarProfileName.textContent = storedName;
      if (sidebarAvatar) sidebarAvatar.textContent = storedName.charAt(0).toUpperCase();

      const statMinutes = document.getElementById('statMinutes');
      const statPlanTier = document.getElementById('statPlanTier');
      const accPlanTier = document.getElementById('accPlanTier');
      const accCredits = document.getElementById('accCredits');

      if (statMinutes) statMinutes.textContent = minutesUsed;
      if (statPlanTier) statPlanTier.textContent = currentPlan;
      if (accPlanTier) accPlanTier.textContent = \`\${currentPlan} (مخطط تجريبي)\`;
      
      // Calculate remaining minutes based on plan
      const limit = currentPlan === 'Free' ? 30 : 9999;
      if (accCredits) accCredits.textContent = currentPlan === 'Free' ? \`\${limit - minutesUsed} دقيقة\` : 'غير محدود';
    }

    // Fetch Video History
    const { data: videos } = await supabase
      .from('video_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const videosList = videos || [];
    
    const statVideosCount = document.getElementById('statVideosCount');
    if (statVideosCount) statVideosCount.textContent = videosList.length;

    const dashHomeEmptyState = document.getElementById('dashHomeEmptyState');
    const dashHomeRecentTable = document.getElementById('dashHomeRecentTable');
    const homeRecentVideosList = document.getElementById('homeRecentVideosList');

    const dashVideosEmptyState = document.getElementById('dashVideosEmptyState');
    const dashVideosListFilled = document.getElementById('dashVideosListFilled');
    const videosListFullContainer = document.getElementById('videosListFullContainer');

    if (videosList.length > 0) {
      if (dashHomeEmptyState) dashHomeEmptyState.classList.add('hidden');
      if (dashHomeRecentTable) dashHomeRecentTable.classList.remove('hidden');

      if (dashVideosEmptyState) dashVideosEmptyState.classList.add('hidden');
      if (dashVideosListFilled) dashVideosListFilled.classList.remove('hidden');

      const renderItemMarkup = (v) => \`
        <div class="video-list-item glass-panel">
          <div class="video-item-icon">🎬</div>
          <div class="video-item-details">
            <h4 class="video-item-title">\${v.filename}</h4>
            <p class="video-item-meta">\${new Date(v.created_at).toLocaleDateString()} • \${v.duration_original || 'N/A'} • تم توفير: \${v.time_saved || '0ث'}</p>
          </div>
          <button class="btn btn-secondary btn-nav download-list-item-btn" data-name="\${v.filename}">تحميل</button>
        </div>
      \`;

      if (homeRecentVideosList) {
        homeRecentVideosList.innerHTML = videosList.slice(0, 3).map(renderItemMarkup).join('');
      }

      if (videosListFullContainer) {
        videosListFullContainer.innerHTML = videosList.map(renderItemMarkup).join('');
      }

      document.querySelectorAll('.download-list-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const fName = btn.getAttribute('data-name');
          triggerMockFileDownload(fName);
        });
      });

    } else {
      if (dashHomeEmptyState) dashHomeEmptyState.classList.remove('hidden');
      if (dashHomeRecentTable) dashHomeRecentTable.classList.add('hidden');

      if (dashVideosEmptyState) dashVideosEmptyState.classList.remove('hidden');
      if (dashVideosListFilled) dashVideosListFilled.classList.add('hidden');
    }
  }`;

if (mainJs.match(oldCodeRegex)) {
    mainJs = mainJs.replace(oldCodeRegex, newCode);
    fs.writeFileSync('src/../src/main.js', mainJs, 'utf8');
    console.log('Dashboard logic successfully updated to use Supabase.');
} else {
    console.error('Could not find the target code to replace.');
}
