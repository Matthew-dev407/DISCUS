// ── Search Module ──
const Search = {
  async render() {
    return `
      <div class="page active" id="searchPage">
        <div class="page-header">
          <h1>🔍 Buscar</h1>
          <p>Encontre materiais, comunidades e tópicos de estudo</p>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:24px">
          <input type="text" id="searchInput" placeholder="O que você quer estudar?" style="flex:1;padding:14px 20px;border:1px solid var(--border);border-radius:14px;background:var(--bg);color:var(--text);font-size:1rem"/>
          <button class="btn btn-p" id="searchBtn">Buscar</button>
        </div>
        <div class="filter-row" style="margin-bottom:20px">
          <button class="filter-btn active" data-stype="all">Tudo</button>
          <button class="filter-btn" data-stype="materials">📚 Materiais</button>
          <button class="filter-btn" data-stype="communities">💬 Comunidades</button>
        </div>
        <div id="searchResults">
          <div class="empty-state"><div class="empty-icon">🔍</div><h3>Digite algo para buscar</h3><p>Busque por qualquer assunto que deseja estudar</p></div>
        </div>
      </div>
    `;
  },

  bind() {
    const input = document.getElementById('searchInput');
    const doSearch = async () => {
      const q = input.value.trim();
      if (!q) return;
      const resultsDiv = document.getElementById('searchResults');
      resultsDiv.innerHTML = '<p style="color:var(--text-muted)">Buscando...</p>';
      try {
        const [materials, communities] = await Promise.all([
          API.get(`/materials?search=${encodeURIComponent(q)}`),
          API.get('/communities')
        ]);
        const filteredComm = communities.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase()));
        let html = '';
        if (filteredComm.length) {
          html += `<h3 style="margin:16px 0">💬 Comunidades (${filteredComm.length})</h3><div class="card-grid card-grid-2">`;
          html += filteredComm.map(c => `<div class="card community-card" onclick="App.navigate('communities')"><div class="comm-icon" style="background:${c.color}22">${c.icon}</div><div class="comm-info"><h3>${c.name}</h3><p>${c.description}</p></div></div>`).join('');
          html += '</div>';
        }
        if (materials.length) {
          html += `<h3 style="margin:16px 0">📚 Materiais (${materials.length})</h3><div class="card-grid card-grid-3">`;
          html += materials.map(m => `<div class="card material-card"><span class="mat-category ${m.category}">${m.category}</span><h3>${m.title}</h3><p>${m.description}</p></div>`).join('');
          html += '</div>';
        }
        if (!html) html = '<div class="empty-state"><div class="empty-icon">😕</div><h3>Nenhum resultado encontrado</h3></div>';
        resultsDiv.innerHTML = html;
      } catch (e) { resultsDiv.innerHTML = '<p style="color:#EF4444">Erro na busca</p>'; }
    };
    document.getElementById('searchBtn').addEventListener('click', doSearch);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  }
};
