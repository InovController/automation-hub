import { app } from '../core/dom.js';
import { notify } from '../components/feedback.js';
import { loginAccount, registerAccount } from '../services/auth-service.js';
import { loadHub } from '../services/hub-service.js';
import { renderRoute } from '../router.js';
import { updateUserChip } from '../ui-shell.js';

export function renderAuthPage() {
  app.innerHTML = `
    <section class="page">
      <section class="auth-shell">
        <div class="auth-hero section-card">
          <div class="section-title">
            <h2>Entrar no Automation HUB</h2>
            <p>Cadastre sua conta ou faça login para executar automações e registrar o histórico por usuário.</p>
          </div>
          <div class="auth-hero-points">
            <div class="summary-card">
              <strong>Execução centralizada</strong>
              <span>Dispare robôs com histórico e rastreabilidade.</span>
            </div>
            <div class="summary-card">
              <strong>Arquivos controlados</strong>
              <span>Envio de bases e download de saídas em um só lugar.</span>
            </div>
          </div>
        </div>

        <div class="auth-grid">
          <form id="loginForm" class="section-card auth-card">
            <div class="section-title">
              <h2>Login</h2>
            </div>
            <div class="field">
              <label>Email</label>
              <input name="email" type="email" placeholder="voce@empresa.com" required />
            </div>
            <div class="field">
              <label>Senha</label>
              <input name="password" type="password" placeholder="Sua senha" required />
            </div>
            <div class="button-row button-row-start">
              <button class="button" type="submit">Entrar</button>
            </div>
          </form>

          <form id="registerForm" class="section-card auth-card">
            <div class="section-title">
              <h2>Criar conta</h2>
            </div>
            <div class="field">
              <label>Nome</label>
              <input name="name" placeholder="Seu nome" required />
            </div>
            <div class="field">
              <label>Email</label>
              <input name="email" type="email" placeholder="voce@empresa.com" required />
            </div>
            <div class="field">
              <label>Senha</label>
              <input name="password" type="password" placeholder="Mínimo de 6 caracteres" required />
            </div>
            <div class="button-row button-row-start">
              <button class="button" type="submit">Cadastrar</button>
            </div>
          </form>
        </div>
      </section>
    </section>
  `;

  document.querySelector('#loginForm').addEventListener('submit', handleLoginSubmit);
  document.querySelector('#registerForm').addEventListener('submit', handleRegisterSubmit);
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    await loginAccount({
      email: form.email.value,
      password: form.password.value,
    });
    updateUserChip();
    await loadHub();
    renderRoute();
    notify('Login realizado com sucesso.');
  } catch (error) {
    notify(error.message || 'Não foi possível entrar.');
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;

  try {
    await registerAccount({
      name: form.name.value,
      email: form.email.value,
      password: form.password.value,
    });
    updateUserChip();
    await loadHub();
    renderRoute();
    notify('Conta criada com sucesso.');
  } catch (error) {
    notify(error.message || 'Não foi possível criar a conta.');
  }
}
