import { formatDate, iconFor, statusClass, statusLabel } from '../utils/formatters.js';

export function renderMetric(label, value) {
  return `<article class="metric-card"><span>${label}</span><strong>${value}</strong></article>`;
}

export function renderRobotCard(robot) {
  const activeClass = robot.isActive ? 'status-ready' : 'status-maintenance';
  const activeLabel = robot.isActive ? 'Pronto' : 'Manutenção';

  return `
    <article class="robot-card">
      <div class="robot-card-header">
        <div class="icon-box">${iconFor(robot.icon)}</div>
        <span class="status-badge ${activeClass}">${activeLabel}</span>
      </div>
      <div>
        <h3>${robot.name}</h3>
        <p>${robot.summary || ''}</p>
      </div>
      <div class="card-footer">
        <span class="card-meta">${robot.category || 'Geral'}</span>
        <a class="button" href="#/robots/${robot.id}">Abrir</a>
      </div>
    </article>
  `;
}

export function renderHistoryRow(execution) {
  return `
    <article class="history-row">
      <div class="history-main">
        <strong>${execution.robot?.name || 'Execução de robô'}</strong>
        <span class="muted">${execution.requestedByName || execution.requestedByEmail || 'Usuário interno'} | ${formatDate(execution.createdAt)}</span>
        <span class="muted">${execution.currentStep || 'Aguardando na fila'}</span>
      </div>
      <div class="button-row">
        <span class="status-badge ${statusClass(execution.status)}">${statusLabel(execution.status)}</span>
        <a class="ghost-button" href="#/executions/${execution.id}">Abrir</a>
      </div>
    </article>
  `;
}

export function renderField(field) {
  if (field.type === 'textarea') {
    return `
      <div class="field full">
        <label>${field.label}</label>
        <textarea name="${field.name}" rows="4" placeholder="${field.placeholder || ''}"></textarea>
      </div>
    `;
  }

  if (field.type === 'select') {
    return `
      <div class="field">
        <label>${field.label}</label>
        <select name="${field.name}">
          ${(field.options || []).map((option) => `<option value="${option}">${option}</option>`).join('')}
        </select>
      </div>
    `;
  }

  if (field.type === 'radio') {
    return `
      <div class="field full">
        <label>${field.label}</label>
        <div class="radio-group">
          ${(field.options || [])
            .map(
              (option) => `
                <label class="radio-chip">
                  <input type="radio" name="${field.name}" value="${option}" ${option === field.defaultValue ? 'checked' : ''} />
                  ${option}
                </label>
              `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  if (field.type === 'checkbox') {
    return `
      <div class="field full">
        <label>${field.label}</label>
        <label class="checkbox-chip">
          <input type="checkbox" name="${field.name}" />
          Ativar
        </label>
      </div>
    `;
  }

  return `
    <div class="field">
      <label>${field.label}</label>
      <input name="${field.name}" type="${field.type || 'text'}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} />
    </div>
  `;
}

export function renderFileInput(fileInput) {
  return `
    <div class="field full">
      <label>${fileInput.label}</label>
      <input name="${fileInput.name}" type="file" ${fileInput.multiple ? 'multiple' : ''} ${fileInput.accept ? `accept="${fileInput.accept}"` : ''} ${fileInput.required ? 'required' : ''} />
      <small>${fileInput.helperText || 'Envie os arquivos de apoio, se necessário.'}</small>
    </div>
  `;
}

export function renderLogs(logs) {
  if (!logs || logs.length === 0) {
    return '[aguardando] Ainda não há logs.';
  }

  return logs
    .map((log) => `[${new Date(log.timestamp).toLocaleTimeString()}] ${String(log.level).toUpperCase()}: ${log.message}`)
    .join('\n');
}

export function renderFileCard(file) {
  return `
    <article class="file-card">
      <strong>${file.downloadName || file.originalName || file.filename}</strong>
      <p class="muted">${file.kind}</p>
      <a class="button" href="${file.downloadUrl}" target="_blank" rel="noreferrer">Baixar</a>
    </article>
  `;
}
