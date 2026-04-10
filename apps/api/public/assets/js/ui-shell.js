import { state } from './state/app-state.js';
import { logoutAccount } from './services/auth-service.js';
import { loadHub } from './services/hub-service.js';
import { renderRoute } from './router.js';

const userName = document.querySelector('#userName');
const userEmail = document.querySelector('#userEmail');
const avatar = document.querySelector('.avatar');
const themeToggle = document.querySelector('#themeToggle');
const THEME_STORAGE_KEY = 'automation-hub-theme';

export function updateUserChip() {
  if (!state.currentUser) {
    userName.textContent = 'Visitante';
    userEmail.textContent = 'Faça login para continuar';
    avatar.textContent = 'AH';
    return;
  }

  userName.textContent = state.currentUser.name;
  userEmail.textContent = state.currentUser.email;
  avatar.textContent = initialsFor(state.currentUser.name);
}

export function bindUserChipActions() {
  document.querySelector('.user-chip').addEventListener('click', async () => {
    if (!state.currentUser) {
      window.location.hash = '#/login';
      renderRoute();
      return;
    }

    const shouldLogout = window.confirm('Deseja sair da sua conta?');
    if (!shouldLogout) {
      return;
    }

    await logoutAccount();
    await loadHub().catch(() => null);
    updateUserChip();
    window.location.hash = '#/login';
    renderRoute();
  });
}

export function initializeTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  applyTheme(savedTheme);

  themeToggle?.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  });
}

function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
  }
}

function initialsFor(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}
