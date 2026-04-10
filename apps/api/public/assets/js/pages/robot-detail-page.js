import { app } from '../core/dom.js';
import { renderField, renderFileInput, renderHistoryRow } from '../components/render-helpers.js';
import { api } from '../services/api.js';
import { refreshExecutions } from '../services/hub-service.js';
import { state } from '../state/app-state.js';
import { notify } from '../components/feedback.js';
import { iconFor } from '../utils/formatters.js';
import { isRouteStillActive } from '../utils/route.js';

export async function renderRobotDetail(robotId, routeToken) {
  const robot = await api(`/robots/${robotId}`);
  if (!isRouteStillActive(routeToken, `#/robots/${robotId}`)) {
    return;
  }

  state.robot = robot;
  const schema = robot.schema || {};
  const fields = schema.fields || [];
  const fileInputs = schema.fileInputs || [];

  app.innerHTML = `
    <section class="page">
      <div class="breadcrumbs">Robôs / ${robot.name}</div>

      <section class="section-card">
        <div class="detail-header">
          <div class="inline-meta">
            <div class="icon-box">${iconFor(robot.icon)}</div>
            <div>
              <h1>${robot.name}</h1>
              <div class="inline-meta">
                <span class="muted">v${robot.version}</span>
                <span class="status-badge ${robot.isActive ? 'status-ready' : 'status-maintenance'}">
                  ${robot.isActive ? 'Pronto para executar' : 'Manutenção'}
                </span>
              </div>
            </div>
          </div>
          <div class="button-row">
            <a class="ghost-button" href="#/history">Ver histórico</a>
          </div>
        </div>
        <hr />
        <div class="split-panel">
          <div>
            <h3>Descrição do Robô</h3>
            <p>${robot.description || robot.summary || ''}</p>
          </div>
        </div>
      </section>

      <div class="details-grid">
        <section class="section-card">
          <div class="section-title">
            <h2>Parâmetros de Execução</h2>
            <p>Configure os campos abaixo para iniciar o processo.</p>
          </div>
          <form id="executionForm" class="field-grid">
            <div class="field full">
              <label>Conta Responsável</label>
              <input value="${state.currentUser?.name || ''} (${state.currentUser?.email || ''})" disabled />
            </div>
            ${fields.map(renderField).join('')}
            ${fileInputs.map(renderFileInput).join('')}
            <div class="field full">
              <label>Observações Internas</label>
              <textarea name="notes" rows="4" placeholder="Adicione qualquer contexto para esta execução..."></textarea>
            </div>
            <div class="field full">
              <div class="button-row">
                <button class="ghost-button" type="reset">Limpar formulário</button>
                <button class="button" type="submit">Executar robô</button>
              </div>
            </div>
          </form>
        </section>

        <section class="split-panel">
          <div class="section-card">
            <div class="section-title">
              <h2>Resumo da Execução</h2>
            </div>
            <p><strong>Tempo estimado:</strong> ~${robot.estimatedMinutes || 5} minutos</p>
            <p><strong>Categoria:</strong> ${robot.category || 'Geral'}</p>
            <p><strong>Suporte a upload:</strong> ${fileInputs.length > 0 ? 'Sim' : 'Não'}</p>
          </div>

          <div class="section-card">
            <div class="section-title">
              <h2>Links Rápidos</h2>
            </div>
            <p><strong>${robot.documentationLabel || 'Documentação'}:</strong> ${robot.documentationUrl || 'Não configurado'}</p>
            <p><strong>${robot.supportLabel || 'Suporte'}:</strong> ${robot.supportValue || 'Não configurado'}</p>
            <p><strong>Política de dados:</strong> ${robot.dataPolicy || 'Uso interno apenas.'}</p>
          </div>

          <div class="section-card">
            <div class="section-title">
              <h2>Execuções Recentes</h2>
            </div>
            <div class="history-grid">
              ${robot.executions.length > 0 ? robot.executions.map(renderHistoryRow).join('') : '<div class="empty-state">Ainda não há execuções para este robô.</div>'}
            </div>
          </div>
        </section>
      </div>
    </section>
  `;

  document.querySelector('#executionForm').addEventListener('submit', (event) =>
    handleExecutionSubmit(event, robot, fileInputs),
  );
}

async function handleExecutionSubmit(event, robot, fileInputs) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData();
  const payload = {};

  formData.append('robotId', robot.id);
  formData.append('notes', form.notes.value);
  formData.append('priority', '0');

  for (const field of robot.schema?.fields || []) {
    if (field.type === 'checkbox') {
      payload[field.name] = form.elements[field.name].checked;
    } else {
      payload[field.name] = form.elements[field.name]?.value || '';
    }
  }

  formData.append('parameters', JSON.stringify(payload));

  for (const fileConfig of fileInputs) {
    const input = form.querySelector(`[name="${fileConfig.name}"]`);
    for (const file of input.files) {
      formData.append(fileConfig.name, file);
    }
  }

  try {
    const execution = await api('/executions', {
      method: 'POST',
      body: formData,
    });
    notify('Execução criada com sucesso.');
    await refreshExecutions();
    window.location.hash = `#/executions/${execution.id}`;
  } catch (error) {
    notify(error.message || 'Não foi possível criar a execução.');
  }
}
