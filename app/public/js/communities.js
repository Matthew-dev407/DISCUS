// ── Communities Module ──
const Communities = {
  data: [],
  currentCommunity: null,

  async render() {
    try { this.data = await API.get('/communities'); } catch { this.data = []; }
    return `
      <div class="page active" id="communitiesPage">
        <div class="page-header">
          <h1>💬 Comunidades</h1>
          <p>Encontre grupos de estudo e aprenda junto</p>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
          <button class="btn btn-p" id="createCommunityBtn">+ Criar Comunidade</button>
          <div class="filter-row" id="commFilters">
            <button class="filter-btn active" data-cat="todos">Todas</button>
            <button class="filter-btn" data-cat="enem">ENEM</button>
            <button class="filter-btn" data-cat="exatas">Exatas</button>
            <button class="filter-btn" data-cat="humanas">Humanas</button>
            <button class="filter-btn" data-cat="biologicas">Biológicas</button>
          </div>
        </div>
        <div class="card-grid card-grid-2" id="commGrid">
          ${this.renderCards(this.data)}
        </div>
      </div>
      <!-- Community Detail Modal -->
      <div class="modal-overlay" id="commDetailModal">
        <div class="modal" id="commDetailContent"></div>
      </div>
      <!-- Create Community Modal -->
      <div class="modal-overlay" id="createCommModal">
        <div class="modal">
          <h2>Criar Comunidade</h2>
          <div class="form-group"><label>Nome</label><input id="newCommName" placeholder="Ex: ENEM 2026"/></div>
          <div class="form-group"><label>Descrição</label><input id="newCommDesc" placeholder="Sobre o que é..."/></div>
          <div class="form-group"><label>Categoria</label>
            <select id="newCommCat" style="width:100%;padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--bg);color:var(--text)">
              <option value="geral">Geral</option><option value="enem">ENEM</option><option value="exatas">Exatas</option><option value="humanas">Humanas</option><option value="biologicas">Biológicas</option>
            </select>
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-p" id="confirmCreateComm" style="flex:1">Criar</button>
            <button class="btn btn-ghost" onclick="document.getElementById('createCommModal').classList.remove('open')">Cancelar</button>
          </div>
        </div>
      </div>
    `;
  },

  renderCards(list) {
    if (!list.length) return '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">💬</div><h3>Nenhuma comunidade encontrada</h3></div>';
    return list.map(c => `
      <div class="card community-card" data-comm-id="${c.id}">
        <div class="comm-icon" style="background:${c.color}22;color:${c.color}">${c.icon}</div>
        <div class="comm-info">
          <h3>${c.name}</h3>
          <p>${c.description}</p>
          <div class="comm-meta">👥 ${c.member_count} membros • ${c.category}</div>
        </div>
        ${c.is_member ? '<span class="comm-badge member">Membro</span>' : `<button class="comm-badge join" data-join="${c.id}">Entrar</button>`}
      </div>
    `).join('');
  },

  bind() {
    // Filters
    document.querySelectorAll('#commFilters .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#commFilters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat;
        const filtered = cat === 'todos' ? this.data : this.data.filter(c => c.category === cat);
        document.getElementById('commGrid').innerHTML = this.renderCards(filtered);
        this.bindCards();
      });
    });
    this.bindCards();
    // Create
    document.getElementById('createCommunityBtn').addEventListener('click', () => document.getElementById('createCommModal').classList.add('open'));
    document.getElementById('confirmCreateComm').addEventListener('click', async () => {
      try {
        await API.post('/communities', { name: document.getElementById('newCommName').value, description: document.getElementById('newCommDesc').value, category: document.getElementById('newCommCat').value });
        document.getElementById('createCommModal').classList.remove('open');
        App.showToast('Comunidade criada! 🎉', 'success');
        App.navigate('communities');
      } catch (e) { App.showToast(e.message, 'error'); }
    });
  },

  bindCards() {
    // Join buttons
    document.querySelectorAll('[data-join]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          const res = await API.post(`/communities/${btn.dataset.join}/join`);
          App.showToast(res.message, 'success');
          App.refreshPoints();
          App.navigate('communities');
        } catch (e) { App.showToast(e.message, 'error'); }
      });
    });
    // Click card to view detail
    document.querySelectorAll('.community-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-join]')) return;
        this.showDetail(card.dataset.commId);
      });
    });
  },

  async showDetail(id) {
    try {
      const c = await API.get(`/communities/${id}`);
      this.currentCommunity = c;
      document.getElementById('commDetailContent').innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <div class="comm-icon" style="background:${c.color}22;color:${c.color};font-size:2rem;width:60px;height:60px">${c.icon}</div>
          <div>
            <h2 style="margin:0">${c.name}</h2>
            <p style="color:var(--text-muted);font-size:.88rem">${c.description} • 👥 ${c.member_count} membros</p>
          </div>
        </div>
        ${c.is_member ? `
          <div class="post-input-box">
            <input id="postInput" placeholder="Escreva algo para a comunidade..."/>
            <button id="postSendBtn">Enviar</button>
          </div>
        ` : `<button class="btn btn-p" id="joinFromDetail" style="width:100%;margin-bottom:20px;justify-content:center">Entrar nesta comunidade</button>`}
        <h3 style="margin-bottom:16px">Publicações</h3>
        <div id="postsList">
          ${c.posts.length ? c.posts.map(p => `
            <div class="post-item">
              <div class="post-avatar" style="background:${p.avatar_color || 'var(--p)'}">${p.author_name ? p.author_name.charAt(0) : '?'}</div>
              <div class="post-body">
                <span class="post-author">${p.author_name}</span>
                <span class="post-time">${new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                <div class="post-content">${p.content}</div>
              </div>
            </div>
          `).join('') : '<p style="color:var(--text-muted)">Nenhuma publicação ainda. Seja o primeiro!</p>'}
        </div>
      `;
      document.getElementById('commDetailModal').classList.add('open');
      // Bind events inside modal
      document.getElementById('commDetailModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('commDetailModal')) document.getElementById('commDetailModal').classList.remove('open');
      });
      const sendBtn = document.getElementById('postSendBtn');
      if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
          const input = document.getElementById('postInput');
          if (!input.value.trim()) return;
          try {
            await API.post(`/communities/${id}/posts`, { content: input.value });
            App.showToast('Post publicado! +5 pts', 'success');
            App.refreshPoints();
            this.showDetail(id);
          } catch (e) { App.showToast(e.message, 'error'); }
        });
      }
      const joinBtn = document.getElementById('joinFromDetail');
      if (joinBtn) {
        joinBtn.addEventListener('click', async () => {
          try {
            const res = await API.post(`/communities/${id}/join`);
            App.showToast(res.message, 'success');
            App.refreshPoints();
            this.showDetail(id);
          } catch (e) { App.showToast(e.message, 'error'); }
        });
      }
    } catch (e) { App.showToast(e.message, 'error'); }
  }
};
