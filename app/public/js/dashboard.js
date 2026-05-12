// ── Dashboard Module ──
const Dashboard = {
  async render() {
    const user = Auth.user;
    let stats = { totalMinutes: 0, averageScore: 0, sessionsCount: 0, streak: 0 };
    let pointsData = { current: 0, totalEarned: 0, history: [] };
    try { stats = await API.get('/analytics/overview'); } catch {}
    try { pointsData = await API.get('/points'); } catch {}
    const hours = Math.floor(stats.totalMinutes / 60);
    const recentPts = pointsData.history.slice(0, 5);

    return `
      <div class="page active" id="dashboardPage">
        <div class="page-header">
          <h1>Olá, <span class="text-gradient">${user.name}</span> 👋</h1>
          <p>${user.school ? user.school + ' • ' : ''}${user.grade || 'Estudante'}</p>
        </div>

        <div class="card-grid card-grid-4" style="margin-bottom:28px">
          <div class="card stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">${pointsData.current}</div>
            <div class="stat-label">Pontos atuais</div>
          </div>
          <div class="card stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">${hours}h</div>
            <div class="stat-label">Horas de estudo</div>
          </div>
          <div class="card stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value">${stats.averageScore}%</div>
            <div class="stat-label">Média simulados</div>
          </div>
          <div class="card stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">${stats.streak}</div>
            <div class="stat-label">Dias seguidos</div>
          </div>
        </div>

        <div class="card-grid card-grid-2">
          <div class="card">
            <div class="section-header">
              <h2>📈 Atividades Recentes</h2>
            </div>
            ${recentPts.length ? recentPts.map(p => `
              <div class="points-history-item">
                <div class="ph-icon" style="background:var(--glow)">${p.action === 'simulado' ? '📝' : p.action === 'leitura' ? '📖' : p.action === 'videoaula' ? '🎥' : p.action === 'ajuda' ? '🤝' : '📤'}</div>
                <div class="ph-info">
                  <h4>${p.description}</h4>
                  <p>${new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="ph-amount">+${p.amount} pts</div>
              </div>
            `).join('') : '<div class="empty-state"><div class="empty-icon">📭</div><h3>Nenhuma atividade ainda</h3></div>'}
          </div>

          <div class="card">
            <div class="section-header">
              <h2>🚀 Ações Rápidas</h2>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px">
              <button class="btn btn-p" onclick="App.navigate('communities')" style="width:100%;justify-content:center">💬 Entrar em Comunidade</button>
              <button class="btn btn-p" onclick="App.navigate('materials')" style="width:100%;justify-content:center">📚 Explorar Materiais</button>
              <button class="btn btn-ghost" onclick="App.navigate('analytics')" style="width:100%;justify-content:center">📊 Ver Evolução</button>
              <button class="btn btn-ghost" onclick="App.navigate('rewards')" style="width:100%;justify-content:center">🎁 Resgatar Recompensas</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  bind() {}
};
