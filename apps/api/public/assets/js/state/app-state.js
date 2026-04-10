export const state = {
  hub: null,
  robots: [],
  executions: [],
  robot: null,
  execution: null,
  currentUser: null,
  selectedCategory: 'Todos',
  search: '',
  poller: null,
  routeToken: 0,
};

export function setHubData(hub, executions) {
  state.hub = hub;
  state.robots = hub.robots;
  state.executions = executions;
}

export function nextRouteToken() {
  state.routeToken += 1;
  return state.routeToken;
}

export function clearPoller() {
  if (state.poller) {
    window.clearInterval(state.poller);
    state.poller = null;
  }
}

export function setPoller(poller) {
  clearPoller();
  state.poller = poller;
}
