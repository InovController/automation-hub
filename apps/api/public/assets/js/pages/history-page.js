import { app } from '../core/dom.js';
import { state } from '../state/app-state.js';
import { renderHistoryRow } from '../components/render-helpers.js';

export function renderHistory() {
  app.innerHTML = `
    <section class="page">
      <div class="hero">
        <div>
          <div class="breadcrumbs">Automation HUB / Histórico de Execuções</div>
          <h1>Histórico de Execuções</h1>
          <p>Acompanhe quem executou cada automação, o status, a duração e os arquivos gerados.</p>
        </div>
      </div>
      <section class="section-card">
        <div class="history-grid">
          ${state.executions.length > 0 ? state.executions.map(renderHistoryRow).join('') : '<div class="empty-state">Nenhuma execução encontrada.</div>'}
        </div>
      </section>
    </section>
  `;
}
