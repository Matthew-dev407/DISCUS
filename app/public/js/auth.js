// ── Auth Module ──
const Auth = {
  user: null,

  init() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    document.getElementById('showRegister').addEventListener('click', (e) => { e.preventDefault(); loginForm.style.display = 'none'; registerForm.style.display = 'block'; });
    document.getElementById('showLogin').addEventListener('click', (e) => { e.preventDefault(); registerForm.style.display = 'none'; loginForm.style.display = 'block'; });
    loginForm.addEventListener('submit', (e) => this.login(e));
    registerForm.addEventListener('submit', (e) => this.register(e));
  },

  async login(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Entrando...'; btn.disabled = true;
    try {
      const data = await API.post('/auth/login', {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPass').value,
      });
      API.setToken(data.token);
      this.user = data.user;
      App.showApp();
      App.showToast(`Bem-vindo, ${data.user.name}!`, 'success');
    } catch (err) {
      App.showToast(err.message, 'error');
    }
    btn.textContent = 'Entrar'; btn.disabled = false;
  },

  async register(e) {
    e.preventDefault();
    const btn = document.getElementById('regBtn');
    btn.textContent = 'Criando...'; btn.disabled = true;
    try {
      const data = await API.post('/auth/register', {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPass').value,
        school: document.getElementById('regSchool').value,
        grade: document.getElementById('regGrade').value,
        goals: document.getElementById('regGoals').value,
      });
      API.setToken(data.token);
      this.user = data.user;
      App.showApp();
      App.showToast('Conta criada com sucesso! 🎉', 'success');
    } catch (err) {
      App.showToast(err.message, 'error');
    }
    btn.textContent = 'Criar Conta'; btn.disabled = false;
  },

  async loadProfile() {
    try {
      this.user = await API.get('/auth/profile');
    } catch { this.logout(); }
  },

  logout() {
    API.clearToken();
    this.user = null;
    document.getElementById('authScreen').style.display = '';
    document.getElementById('appShell').style.display = 'none';
  },

  getInitial() { return this.user ? this.user.name.charAt(0).toUpperCase() : '?'; }
};
