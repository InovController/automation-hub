import { app } from '../core/dom.js';
import { state } from '../state/app-state.js';
import { renderHistoryRow, renderMetric } from '../components/render-helpers.js';

export function renderDashboard() {
  const hub = state.hub;
  const categories = [...new Set(state.robots.map((robot) => robot.category).filter(Boolean))];

  app.innerHTML = `
    <section class="page">
      <div class="hero">
        <div>
          <div class="breadcrumbs">Automation HUB / Painel</div>
          <h1>Visão Geral</h1>
          <p>Acompanhe o hub, veja a saúde das automações e monitore as últimas execuções.</p>
        </div>
        <div class="status-badge status-ready">Plataforma interna online</div>
      </div>

      <section class="metrics">
        ${renderMetric('Robôs disponíveis', hub.stats.totalRobots)}
        ${renderMetric('Prontos para executar', hub.stats.readyRobots)}
        ${renderMetric('Execuções em andamento', hub.stats.runningExecutions)}
        ${renderMetric('Sucessos recentes', hub.stats.successfulExecutions)}
      </section>

      <section class="section-card dashboard-section">
        <div class="section-title">
          <h2>Resumo por Área</h2>
          <p>Veja rapidamente quais áreas já possuem automações publicadas no hub.</p>
        </div>
        <div class="summary-grid">
          ${categories
            .map(
              (category) => `
                <article class="summary-card">
                  <strong>${category}</strong>
                  <span>${state.robots.filter((robot) => robot.category === category).length} automações</span>
                </article>
              `,
            )
            .join('')}
        </div>
      </section>

      <section class="section-card">
        <div class="section-title">
          <h2>Execuções Recentes</h2>
          <p>Acompanhe quem executou cada robô, o status atual e os arquivos gerados.</p>
        </div>
        <div class="history-grid">
          ${state.executions.slice(0, 6).map(renderHistoryRow).join('')}
        </div>
      </section>

      <section class="section-card">
        <div class="section-title">
          <h2>Acesso Rápido</h2>
          <p>Abra o catálogo completo para encontrar e iniciar uma automação.</p>
        </div>
        <div class="button-row button-row-start">
          <a class="button" href="#/robots">Ir para Robôs</a>
        </div>
      </section>
    </section>
  `;
}
