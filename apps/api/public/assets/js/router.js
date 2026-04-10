import { nextRouteToken, clearPoller } from './state/app-state.js';
import { state } from './state/app-state.js';
import { routeParts } from './utils/route.js';
import { renderDashboard } from './pages/dashboard-page.js';
import { renderAuthPage } from './pages/auth-page.js';
import { renderRobotsPage } from './pages/robots-page.js';
import { renderRobotDetail } from './pages/robot-detail-page.js';
import { renderExecutionDetail } from './pages/execution-page.js';
import { renderHistory } from './pages/history-page.js';
import { renderSettings } from './pages/settings-page.js';

export function setActiveNav() {
  const current = routeParts()[0] || 'dashboard';
  document.querySelectorAll('[data-nav]').forEach((item) => {
    item.classList.toggle('active', item.dataset.nav === current);
  });
}

export function renderRoute() {
  const routeToken = nextRouteToken();
  const parts = routeParts();

  setActiveNav();
  clearPoller();

  if (!state.currentUser) {
    renderAuthPage();
    return;
  }

  if (parts[0] === 'robots' && parts[1]) {
    void renderRobotDetail(parts[1], routeToken);
    return;
  }

  if (parts[0] === 'robots') {
    renderRobotsPage();
    return;
  }

  if (parts[0] === 'executions' && parts[1]) {
    void renderExecutionDetail(parts[1], routeToken);
    return;
  }

  if (parts[0] === 'history') {
    renderHistory();
    return;
  }

  if (parts[0] === 'settings') {
    renderSettings();
    return;
  }

  renderDashboard();
}
