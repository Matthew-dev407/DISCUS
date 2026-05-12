// ── Rewards Module ──
const Rewards = {
  async render() {
    let rewards = [], sponsors = [], history = [];
    try { rewards = await API.get('/sponsors/rewards'); } catch {}
    try { sponsors = await API.get('/sponsors'); } catch {}
    try { history = await API.get('/sponsors/rewards/history'); } catch {}
    const userPts = Auth.user ? Auth.user.points : 0;

    return `
      <div class="page active" id="rewardsPage">
        <div class="page-header">
          <h1>🎁 Recompensas</h1>
          <p>Converta seus pontos em benefícios reais dos nossos patrocinadores</p>
        </div>

        <div class="card" style="margin-bottom:28px;background:linear-gradient(135deg,var(--p),var(--s));color:#fff;border:none">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
            <div><h2 style="margin:0;color:#fff">Seus Pontos</h2><p style="opacity:.8">Use para resgatar benefícios</p></div>
            <div style="font-size:2.5rem;font-weight:800" id="rewardsPtsDisplay">⭐ ${userPts}</div>
          </div>
        </div>

        <h2 style="margin-bottom:20px">🛍️ Catálogo de Recompensas</h2>
        <div class="card-grid card-grid-3" style="margin-bottom:28px">
          ${rewards.map(r => `
            <div class="card reward-card">
              <div class="reward-icon">${r.icon}</div>
              <h3>${r.title}</h3>
              <p>${r.description}</p>
              <div class="reward-cost">⭐ ${r.cost} pts</div>
              <button class="reward-btn" data-redeem="${r.id}" ${userPts < r.cost ? 'disabled' : ''}>${userPts >= r.cost ? 'Resgatar' : 'Pts insuficientes'}</button>
              <div style="font-size:.75rem;color:var(--text-muted);margin-top:8px">por ${r.sponsor_name}</div>
            </div>
          `).join('')}
        </div>

        <h2 style="margin-bottom:20px">🏢 Patrocinadores Parceiros</h2>
        <div class="card-grid card-grid-2" style="margin-bottom:28px">
          ${sponsors.map(s => `
            <div class="card sponsor-card">
              <div class="sponsor-icon">${s.icon}</div>
              <div><h3 style="margin:0">${s.name}</h3><p style="color:var(--text-muted);font-size:.88rem">${s.description}</p></div>
            </div>
          `).join('')}
        </div>

        ${history.length ? `
          <h2 style="margin-bottom:20px">📜 Seus Resgates</h2>
          <div class="card">
            ${history.map(h => `
              <div class="points-history-item">
                <div class="ph-icon" style="background:var(--glow)">${h.icon}</div>
                <div class="ph-info"><h4>${h.title}</h4><p>por ${h.sponsor_name} • ${new Date(h.created_at).toLocaleDateString('pt-BR')}</p></div>
                <div style="color:#EF4444;font-weight:700">-${h.points_spent} pts</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  bind() {
    document.querySelectorAll('[data-redeem]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        try {
          const res = await API.post(`/sponsors/rewards/${btn.dataset.redeem}/redeem`);
          App.showToast(res.message, 'success');
          Auth.user.points = res.points;
          App.refreshPoints();
          App.navigate('rewards');
        } catch (e) { App.showToast(e.message, 'error'); }
      });
    });
  }
};
