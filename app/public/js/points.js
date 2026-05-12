// ── Points Module ──
const Points = {
  async render() {
    let data = { current: 0, totalEarned: 0, totalSpent: 0, history: [], byAction: [] };
    try { data = await API.get('/points'); } catch {}
    const actionIcons = { simulado: '📝', leitura: '📖', videoaula: '🎥', ajuda: '🤝', compartilhar: '📤', post: '💬', comunidade: '🏠' };
    const actionNames = { simulado: 'Simulados', leitura: 'Leituras', videoaula: 'Videoaulas', ajuda: 'Ajudas', compartilhar: 'Compartilhamentos', post: 'Publicações', comunidade: 'Comunidades' };

    return `
      <div class="page active" id="pointsPage">
        <div class="page-header">
          <h1>⭐ Sistema de Pontos</h1>
          <p>Acompanhe seus pontos e veja como ganhá-los</p>
        </div>

        <div class="card-grid card-grid-3" style="margin-bottom:28px">
          <div class="card stat-card"><div class="stat-icon">⭐</div><div class="stat-value">${data.current}</div><div class="stat-label">Pontos disponíveis</div></div>
          <div class="card stat-card"><div class="stat-icon">📈</div><div class="stat-value">${data.totalEarned}</div><div class="stat-label">Total ganho</div></div>
          <div class="card stat-card"><div class="stat-icon">🎁</div><div class="stat-value">${data.totalSpent}</div><div class="stat-label">Total resgatado</div></div>
        </div>

        <div class="card-grid card-grid-2">
          <div class="card">
            <h3 style="margin-bottom:16px">🏆 Pontos por Atividade</h3>
            ${data.byAction.map(a => `
              <div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border)">
                <span style="font-size:1.3rem">${actionIcons[a.action] || '⭐'}</span>
                <div style="flex:1"><strong>${actionNames[a.action] || a.action}</strong><br/><span style="font-size:.8rem;color:var(--text-muted)">${a.count} vezes</span></div>
                <span class="text-gradient" style="font-weight:700">${a.total} pts</span>
              </div>
            `).join('')}
          </div>

          <div class="card">
            <h3 style="margin-bottom:16px">📜 Histórico Recente</h3>
            ${data.history.length ? data.history.map(h => `
              <div class="points-history-item">
                <div class="ph-icon" style="background:var(--glow)">${actionIcons[h.action] || '⭐'}</div>
                <div class="ph-info">
                  <h4>${h.description}</h4>
                  <p>${new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div class="ph-amount">+${h.amount}</div>
              </div>
            `).join('') : '<div class="empty-state"><div class="empty-icon">📭</div><h3>Nenhum ponto ainda</h3></div>'}
          </div>
        </div>

        <div class="card" style="margin-top:20px">
          <h3 style="margin-bottom:16px">💡 Como ganhar pontos</h3>
          <div class="card-grid card-grid-4">
            <div style="text-align:center;padding:16px"><div style="font-size:2rem">📖</div><strong>Ler Material</strong><br/><span style="color:var(--s);font-weight:700">+10 pts</span></div>
            <div style="text-align:center;padding:16px"><div style="font-size:2rem">📝</div><strong>Simulado</strong><br/><span style="color:var(--s);font-weight:700">+25 pts</span></div>
            <div style="text-align:center;padding:16px"><div style="font-size:2rem">🎥</div><strong>Videoaula</strong><br/><span style="color:var(--s);font-weight:700">+15 pts</span></div>
            <div style="text-align:center;padding:16px"><div style="font-size:2rem">🤝</div><strong>Ajudar Colega</strong><br/><span style="color:var(--s);font-weight:700">+20 pts</span></div>
          </div>
        </div>
      </div>
    `;
  },
  bind() {}
};
