import { searchInput } from './core/dom.js';
import { renderRoute } from './router.js';
import { loadHub } from './services/hub-service.js';
import { restoreSession } from './services/auth-service.js';
import { state } from './state/app-state.js';
import { bindUserChipActions, initializeTheme, updateUserChip } from './ui-shell.js';

searchInput.addEventListener('input', (event) => {
  state.search = event.target.value.toLowerCase();
  renderRoute();
});

window.addEventListener('hashchange', renderRoute);
bindUserChipActions();
initializeTheme();

void bootstrap();

async function bootstrap() {
  await restoreSession();
  updateUserChip();
  if (state.currentUser) {
    await loadHub();
  }
  renderRoute();
}
