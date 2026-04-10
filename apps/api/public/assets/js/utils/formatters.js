export function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString('pt-BR');
}

export function statusClass(status) {
  if (status === 'success') return 'status-success';
  if (status === 'running') return 'status-running';
  if (status === 'queued') return 'status-queued';
  if (status === 'error') return 'status-error';
  if (status === 'canceled') return 'status-canceled';
  return 'status-maintenance';
}

export function statusLabel(status) {
  return {
    success: 'Concluído',
    running: 'Em andamento',
    queued: 'Na fila',
    error: 'Erro',
    canceled: 'Cancelado',
  }[status] || 'Indisponível';
}

export function iconFor(icon) {
  return {
    bank: `
      <svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 9L12 4L21 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 10V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M9 10V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M15 10V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M19 10V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M3 20H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `,
    receipt: `
      <svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3H17V21L14.5 19.5L12 21L9.5 19.5L7 21V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M10 8H14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M10 12H14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M10 16H13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `,
    chart: `
      <svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M6 16L10 12L13 14L18 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 8H18V11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    bot: `
      <svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M8 3H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="5" y="7" width="14" height="10" rx="3" stroke="currentColor" stroke-width="1.8"/>
        <path d="M9 12H9.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M15 12H15.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M9 17V20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M15 17V20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M5 10H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M21 10H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `,
  }[icon] || `
    <svg class="icon-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/>
      <path d="M12 8V12L15 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}
