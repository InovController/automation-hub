import { api } from './api.js';
import { setHubData } from '../state/app-state.js';

export async function loadHub() {
  const [hub, executions] = await Promise.all([api('/robots/hub'), api('/executions')]);
  setHubData(hub, executions);
}

export async function refreshExecutions() {
  await loadHub();
}
