import { state } from '../state/app-state.js';

export function currentRoute() {
  return window.location.hash || '#/dashboard';
}

export function routeParts() {
  return currentRoute().replace('#', '').split('/').filter(Boolean);
}

export function isRouteStillActive(routeToken, expectedHash) {
  return state.routeToken === routeToken && window.location.hash === expectedHash;
}
