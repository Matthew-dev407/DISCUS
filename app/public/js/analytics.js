// ── Analytics Module ──
const Analytics = {
  charts: [],

  async render() {
    let overview = { totalMinutes: 0, averageScore: 0, sessionsCount: 0, streak: 0 };
    let progress = [];
    let subjects = [];
    try { overview = await API.get('/analytics/overview'); } catch {}
    try { progress = await API.get('/analytics/progress'); } catch {}
    try { subjects = await API.get('/analytics/subjects'); } catch {}

    const hours = Math.floor(overview.totalMinutes / 60);

    return `
      <div class="page active" id="analyticsPage">
        <div class="page-header">
          <h1>📊 Sua Evolução</h1>
          <p>Acompanhe seu progresso com dados criados em parceria com professores</p>
        </div>

        <div class="card-grid card-grid-4" style="margin-bottom:28px">
          <div class="card stat-card"><div class="stat-icon">⏱️</div><div class="stat-value">${hours}h</div><div class="stat-label">Total estudado</div></div>
          <div class="card stat-card"><div class="stat-icon">📝</div><div class="stat-value">${overview.sessionsCount}</div><div class="stat-label">Sessões</div></div>
          <div class="card stat-card"><div class="stat-icon">🎯</div><div class="stat-value">${overview.averageScore}%</div><div class="stat-label">Média geral</div></div>
          <div class="card stat-card"><div class="stat-icon">🔥</div><div class="stat-value">${overview.streak}</div><div class="stat-label">Sequência</div></div>
        </div>

        <div class="card-grid card-grid-2" style="margin-bottom:28px">
          <div class="card">
            <h3 style="margin-bottom:8px">📈 Progresso (30 dias)</h3>
            <div class="chart-container"><canvas id="progressChart"></canvas></div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:8px">📊 Desempenho por Disciplina</h3>
            <div class="chart-container"><canvas id="subjectsChart"></canvas></div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom:8px">🎓 Registrar Sessão de Estudo</h3>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px">
            <select id="sessionSubject" style="padding:10px 16px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);flex:1">
              <option>Matemática</option><option>Português</option><option>Física</option><option>Química</option><option>Biologia</option><option>História</option><option>Redação</option><option>Geografia</option>
            </select>
            <input type="number" id="sessionDuration" placeholder="Minutos" value="30" style="padding:10px 16px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);width:120px"/>
            <select id="sessionType" style="padding:10px 16px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text)">
              <option value="study">Estudo</option><option value="simulado">Simulado</option>
            </select>
            <input type="number" id="sessionScore" placeholder="Nota (%)" value="75" style="padding:10px 16px;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);width:120px"/>
            <button class="btn btn-p" id="logSessionBtn">Registrar</button>
          </div>
        </div>

        <div class="card" style="margin-top:20px">
          <h3 style="margin-bottom:16px">📋 Detalhamento por Disciplina</h3>
          ${subjects.map(s => `
            <div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:1px solid var(--border)">
              <div style="flex:1"><strong>${s.subject}</strong><br/><span style="font-size:.82rem;color:var(--text-muted)">${s.sessions} sessões • ${Math.round(s.total_minutes)}min</span></div>
              <div style="text-align:right"><span class="text-gradient" style="font-size:1.2rem;font-weight:700">${Math.round(s.avg_score)}%</span></div>
              <div style="width:120px"><div class="progress-bar"><div class="progress-fill" style="width:${Math.round(s.avg_score)}%"></div></div></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  async bind() {
    // Destroy old charts
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    let progress = [], subjects = [];
    try { progress = await API.get('/analytics/progress'); } catch {}
    try { subjects = await API.get('/analytics/subjects'); } catch {}

    const isDark = ['noturno', 'neon'].includes(ThemeManager.current);
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#94A3B8' : '#64748B';

    // Progress Chart
    const pCtx = document.getElementById('progressChart');
    if (pCtx) {
      const pStyle = getComputedStyle(document.documentElement);
      this.charts.push(new Chart(pCtx, {
        type: 'line',
        data: {
          labels: progress.map(d => new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
          datasets: [{
            label: 'Minutos de estudo',
            data: progress.map(d => d.minutes),
            borderColor: pStyle.getPropertyValue('--p').trim(),
            backgroundColor: pStyle.getPropertyValue('--p').trim() + '20',
            fill: true, tension: 0.4, pointRadius: 3
          }, {
            label: 'Nota média (%)',
            data: progress.map(d => Math.round(d.avg_score)),
            borderColor: pStyle.getPropertyValue('--s').trim(),
            backgroundColor: 'transparent',
            tension: 0.4, pointRadius: 3, yAxisID: 'y1'
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } }, scales: { x: { grid: { color: gridColor }, ticks: { color: textColor, maxTicksLimit: 8 } }, y: { grid: { color: gridColor }, ticks: { color: textColor } }, y1: { position: 'right', grid: { display: false }, ticks: { color: textColor }, max: 100 } } }
      }));
    }

    // Subjects Chart
    const sCtx = document.getElementById('subjectsChart');
    if (sCtx) {
      const colors = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
      this.charts.push(new Chart(sCtx, {
        type: 'bar',
        data: {
          labels: subjects.map(s => s.subject),
          datasets: [{ label: 'Média (%)', data: subjects.map(s => Math.round(s.avg_score)), backgroundColor: subjects.map((_, i) => colors[i % colors.length] + '80'), borderColor: subjects.map((_, i) => colors[i % colors.length]), borderWidth: 2, borderRadius: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor }, max: 100 } } }
      }));
    }

    // Log session
    document.getElementById('logSessionBtn')?.addEventListener('click', async () => {
      try {
        const res = await API.post('/analytics/session', {
          subject: document.getElementById('sessionSubject').value,
          duration_min: parseInt(document.getElementById('sessionDuration').value),
          type: document.getElementById('sessionType').value,
          score: parseFloat(document.getElementById('sessionScore').value)
        });
        App.showToast(res.message, 'success');
        App.refreshPoints();
        App.navigate('analytics');
      } catch (e) { App.showToast(e.message, 'error'); }
    });
  }
};
