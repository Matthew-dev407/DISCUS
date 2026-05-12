// ── Theme System ──
const ThemeManager = {
  themes: [
    { id: 'oceano', name: 'Oceano', icon: '🌊', desc: 'Azul + Verde', colors: ['#0EA5E9', '#10B981', '#06B6D4'] },
    { id: 'floresta', name: 'Floresta', icon: '🌿', desc: 'Verde + Lima', colors: ['#059669', '#84CC16', '#10B981'] },
    { id: 'pordosol', name: 'Pôr do Sol', icon: '🌅', desc: 'Laranja + Roxo', colors: ['#F97316', '#8B5CF6', '#F59E0B'] },
    { id: 'sakura', name: 'Sakura', icon: '🌸', desc: 'Rosa + Lavanda', colors: ['#EC4899', '#A78BFA', '#F9A8D4'] },
    { id: 'noturno', name: 'Noturno', icon: '🌙', desc: 'Dark Mode', colors: ['#6366F1', '#22D3EE', '#A78BFA'] },
    { id: 'neon', name: 'Neon', icon: '⚡', desc: 'Ciano + Magenta', colors: ['#06B6D4', '#D946EF', '#14B8A6'] },
  ],

  current: localStorage.getItem('discus_theme') || 'oceano',

  init() { this.apply(this.current); },

  apply(themeId) {
    this.current = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('discus_theme', themeId);
  },

  render() {
    return `
      <div class="page active" id="themesPage">
        <div class="page-header">
          <h1>🎨 Personalizar Tema</h1>
          <p>Escolha a paleta de cores que mais combina com você</p>
        </div>
        <div class="theme-grid">
          ${this.themes.map(t => `
            <div class="theme-card ${t.id === this.current ? 'selected' : ''}" data-theme-id="${t.id}">
              <div class="theme-preview">
                ${t.colors.map(c => `<div class="theme-dot" style="background:${c}"></div>`).join('')}
              </div>
              <h4>${t.icon} ${t.name}</h4>
              <p>${t.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  bind() {
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.themeId;
        this.apply(id);
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        App.showToast(`Tema ${this.themes.find(t => t.id === id).name} aplicado!`, 'success');
      });
    });
  }
};

ThemeManager.init();
