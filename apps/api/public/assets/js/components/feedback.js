import { toast } from '../core/dom.js';

export function notify(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => toast.classList.add('hidden'), 2600);
}
