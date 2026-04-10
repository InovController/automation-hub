import { app } from '../core/dom.js';
import { renderFileCard, renderLogs } from '../components/render-helpers.js';
import { notify } from '../components/feedback.js';
import { api } from '../services/api.js';
import { refreshExecutions } from '../services/hub-service.js';
import { state, clearPoller, setPoller } from '../state/app-state.js';
import { formatDate, statusClass, statusLabel } from '../utils/formatters.js';
import { isRouteStillActive } from '../utils/route.js';

export async function renderExecutionDetail(executionId, routeToken) {
  const execution = await api(`/executions/${executionId}`);
  if (!isRouteStillActive(routeToken, `#/executions/${executionId}`)) {
    return;
  }

  state.execution = execution;
  const isLive = execution.status === 'queued' || execution.status === 'running';

  app.innerHTML = `
    <section class="page">
      <div class="execution-head">
        <div class="execution-title">
          <div class="breadcrumbs">Início / Automation HUB / Status da Execução</div>
          <h1>Execução: ${execution.robot.name}</h1>
          <p>ID: ${execution.id} | Início: ${formatDate(execution.startedAt || execution.createdAt)}</p>
        </div>
        <div class="button-row">
          <span class="status-badge ${statusClass(execution.status)}">${statusLabel(execution.status)}</span>
          ${isLive ? '<button id="cancelExecution" class="danger-button">Parar processo</button>' : ''}
        </div>
      </div>

      <section class="status-shell">
        <div class="progress-header">
          <strong>${execution.currentStep || 'Aguardando início'}</strong>
          <strong>${execution.progress}%</strong>
        </div>
        <div class="progress-track">
          <div class="progress-value" style="width:${execution.progress}%"></div>
        </div>
        <div class="inline-meta">
          <span>Solicitado por: ${execution.requestedByName || execution.requestedByEmail || 'Usuário não identificado'}</span>
          <span>Status: ${statusLabel(execution.status)}</span>
          ${execution.errorMessage ? `<span>Erro: ${execution.errorMessage}</span>` : ''}
        </div>
      </section>

      <div class="execution-grid">
        <section class="log-panel">
          <pre class="terminal">${renderLogs(execution.logs)}</pre>
        </section>
        <section class="split-panel">
          <div class="section-card">
            <div class="section-title">
              <h2>Arquivos de Saída</h2>
              <p>Baixe arquivos individuais ou o pacote zipado gerado.</p>
            </div>
            <div class="files-list">
              ${execution.files.filter((file) => file.kind !== 'input').length > 0
                ? execution.files.filter((file) => file.kind !== 'input').map(renderFileCard).join('')
                : '<div class="empty-state">Ainda não há arquivos de saída disponíveis.</div>'}
            </div>
          </div>
          <div class="section-card">
            <div class="section-title">
              <h2>Arquivos de Entrada</h2>
            </div>
            <div class="files-list">
              ${execution.files.filter((file) => file.kind === 'input').length > 0
                ? execution.files.filter((file) => file.kind === 'input').map(renderFileCard).join('')
                : '<div class="empty-state">Esta execução não recebeu arquivos enviados.</div>'}
            </div>
          </div>
        </section>
      </div>
    </section>
  `;

  const terminal = document.querySelector('.terminal');
  if (terminal) {
    terminal.scrollTop = terminal.scrollHeight;
  }

  if (!isLive) {
    return;
  }

  document.querySelector('#cancelExecution')?.addEventListener('click', async () => {
    await api(`/executions/${executionId}/cancel`, { method: 'POST' });
    notify('Execução cancelada.');
    await refreshExecutions();
    await renderExecutionDetail(executionId, routeToken);
  });

  setPoller(
    window.setInterval(async () => {
      if (!isRouteStillActive(routeToken, `#/executions/${executionId}`)) {
        clearPoller();
        return;
      }

      await refreshExecutions();
      await renderExecutionDetail(executionId, routeToken);
    }, 2500),
  );
}
