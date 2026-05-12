// ── DISCUS — Main App Module ──
const App = {
  currentPage: 'dashboard',

  async init() {
    // Check existing token
    if (API.token) {
      try {
        await Auth.loadProfile();
        if (Auth.user) { this.showApp(); return; }
      } catch {}
    }
    // Show auth screen
    document.getElementById('authScreen').style.display = '';
    document.getElementById('appShell').style.display = 'none';
    Auth.init();
  },

  async showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
    this.updateUserUI();
    this.bindSidebar();
    this.bindGlobalSearch();
    await this.navigate('dashboard');
  },

  updateUserUI() {
    if (!Auth.user) return;
    const initial = Auth.getInitial();
    const els = {
      sidebarUsername: Auth.user.name,
      sidebarPts: `${Auth.user.points} pts`,
      topbarPoints: `⭐ ${Auth.user.points}`
    };
    Object.entries(els).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
    ['sidebarAvatar', 'topbarAvatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = initial; el.style.background = `linear-gradient(135deg, ${Auth.user.avatar_color || 'var(--p)'}, var(--s))`; }
    });
  },

  bindSidebar() {
    // Toggle
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle) toggle.addEventListener('click', () => sidebar.classList.toggle('open'));

    // Navigation items
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigate(page);
        sidebar.classList.remove('open');
      });
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      Auth.logout();
      this.showToast('Até logo! 👋', 'info');
    });

    // Close sidebar on overlay click (mobile)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('open');
      }
    });
  },

  bindGlobalSearch() {
    const input = document.getElementById('globalSearch');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        this.navigate('search');
        setTimeout(() => {
          const si = document.getElementById('searchInput');
          if (si) { si.value = input.value; document.getElementById('searchBtn')?.click(); }
        }, 200);
      }
    });
  },

  async navigate(page) {
    this.currentPage = page;
    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    const container = document.getElementById('pageContainer');
    // Loading state
    container.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

    let html = '';
    try {
      switch (page) {
        case 'dashboard': html = await Dashboard.render(); break;
        case 'communities': html = await Communities.render(); break;
        case 'materials': html = await Materials.render(); break;
        case 'analytics': html = await Analytics.render(); break;
        case 'points': html = await Points.render(); break;
        case 'rewards': html = await Rewards.render(); break;
        case 'search': html = await Search.render(); break;
        case 'themes': html = ThemeManager.render(); break;
        default: html = await Dashboard.render();
      }
    } catch (err) {
      html = `<div class="page active"><div class="empty-state"><div class="empty-icon">⚠️</div><h3>Erro ao carregar</h3><p>${err.message}</p></div></div>`;
    }

    container.innerHTML = html;

    // Bind page events
    try {
      switch (page) {
        case 'dashboard': Dashboard.bind(); break;
        case 'communities': Communities.bind(); break;
        case 'materials': Materials.bind(); break;
        case 'analytics': await Analytics.bind(); break;
        case 'points': Points.bind(); break;
        case 'rewards': Rewards.bind(); break;
        case 'search': Search.bind(); break;
        case 'themes': ThemeManager.bind(); break;
      }
    } catch (err) { console.error('Bind error:', err); }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Animate cards entrance
    requestAnimationFrame(() => {
      container.querySelectorAll('.card, .stat-card, .theme-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 60);
      });
    });
  },

  async refreshPoints() {
    try {
      const profile = await API.get('/auth/profile');
      Auth.user.points = profile.points;
      this.updateUserUI();
    } catch {}
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3200);
  }
};

// ── Bootstrap ──
document.addEventListener('DOMContentLoaded', () => App.init());
