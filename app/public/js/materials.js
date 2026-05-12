// ── Materials Module ──
const Materials = {
  data: [],
  filter: 'todos',

  async render() {
    try { this.data = await API.get('/materials'); } catch { this.data = []; }
    return `
      <div class="page active" id="materialsPage">
        <div class="page-header">
          <h1>📚 Biblioteca de Materiais</h1>
          <p>PDFs, simulados, videoaulas e resumos compartilhados pela comunidade</p>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-p" id="uploadMaterialBtn">📤 Enviar Material</button>
          <div class="filter-row" id="matFilters">
            <button class="filter-btn active" data-cat="todos">Todos</button>
            <button class="filter-btn" data-cat="pdf">📄 PDFs</button>
            <button class="filter-btn" data-cat="simulado">📝 Simulados</button>
            <button class="filter-btn" data-cat="video">🎬 Vídeos</button>
            <button class="filter-btn" data-cat="resumo">📋 Resumos</button>
          </div>
        </div>
        <div class="card-grid card-grid-3" id="matGrid">${this.renderCards(this.data)}</div>
      </div>
      <!-- Upload Modal -->
      <div class="modal-overlay" id="uploadModal">
        <div class="modal">
          <h2>Enviar Material</h2>
          <div class="form-group"><label>Título</label><input id="matTitle" placeholder="Nome do material"/></div>
          <div class="form-group"><label>Descrição</label><input id="matDesc" placeholder="Breve descrição"/></div>
          <div class="form-group"><label>Categoria</label>
            <select id="matCat" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--bg);color:var(--text)">
              <option value="pdf">PDF</option><option value="simulado">Simulado</option><option value="video">Videoaula</option><option value="resumo">Resumo</option>
            </select>
          </div>
          <div class="form-group"><label>Arquivo (PDF)</label><input type="file" id="matFile" accept=".pdf,.doc,.docx,.ppt,.pptx" style="padding:10px"/></div>
          <div class="form-group"><label>Ou URL (para vídeos)</label><input id="matUrl" placeholder="https://..."/></div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-p" id="confirmUpload" style="flex:1">Enviar</button>
            <button class="btn btn-ghost" onclick="document.getElementById('uploadModal').classList.remove('open')">Cancelar</button>
          </div>
        </div>
      </div>
    `;
  },

  renderCards(list) {
    if (!list.length) return '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📦</div><h3>Nenhum material encontrado</h3></div>';
    return list.map(m => `
      <div class="card material-card" data-mat-id="${m.id}">
        <span class="mat-category ${m.category}">${m.category.toUpperCase()}</span>
        <h3>${m.title}</h3>
        <p>${m.description}</p>
        <div class="mat-footer">
          <span class="mat-author">por ${m.author_name || 'Anônimo'}</span>
          <span>📥 ${m.download_count}</span>
        </div>
      </div>
    `).join('');
  },

  bind() {
    // Filters
    document.querySelectorAll('#matFilters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#matFilters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat;
        const filtered = cat === 'todos' ? this.data : this.data.filter(m => m.category === cat);
        document.getElementById('matGrid').innerHTML = this.renderCards(filtered);
        this.bindCards();
      });
    });
    this.bindCards();
    // Upload
    document.getElementById('uploadMaterialBtn').addEventListener('click', () => document.getElementById('uploadModal').classList.add('open'));
    document.getElementById('confirmUpload').addEventListener('click', async () => {
      const form = new FormData();
      form.append('title', document.getElementById('matTitle').value);
      form.append('description', document.getElementById('matDesc').value);
      form.append('category', document.getElementById('matCat').value);
      form.append('url', document.getElementById('matUrl').value);
      const file = document.getElementById('matFile').files[0];
      if (file) form.append('file', file);
      try {
        const res = await API.post('/materials', form, true);
        document.getElementById('uploadModal').classList.remove('open');
        App.showToast(res.message, 'success');
        App.refreshPoints();
        App.navigate('materials');
      } catch (e) { App.showToast(e.message, 'error'); }
    });
  },

  bindCards() {
    document.querySelectorAll('.material-card').forEach(card => {
      card.addEventListener('click', async () => {
        try {
          const res = await API.get(`/materials/${card.dataset.matId}/download`);
          if (res.url) window.open(res.url, '_blank');
          App.showToast(res.message || 'Material acessado! +10 pts', 'success');
          App.refreshPoints();
        } catch {}
      });
    });
  }
};
