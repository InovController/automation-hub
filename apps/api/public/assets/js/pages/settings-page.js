import { app } from '../core/dom.js';
import { notify } from '../components/feedback.js';
import { api } from '../services/api.js';
import { loadHub } from '../services/hub-service.js';
import { state } from '../state/app-state.js';

let selectedRobotId = null;

export function renderSettings() {
  const robots = state.robots || [];
  const selectedRobot =
    robots.find((robot) => robot.id === selectedRobotId) || robots[0] || null;

  if (!selectedRobotId && selectedRobot) {
    selectedRobotId = selectedRobot.id;
  }

  const draft = selectedRobot ? mapRobotToDraft(selectedRobot) : emptyDraft();

  app.innerHTML = `
    <section class="page">
      <div class="hero">
        <div>
          <div class="breadcrumbs">Automation HUB / Administração</div>
          <h1>Cadastro de Automações</h1>
          <p>Cadastre novas automações, defina o comando de execução e monte o formulário exibido para o usuário.</p>
        </div>
        <div class="button-row">
          ${draft.id ? '<button id="deleteRobotButton" type="button" class="danger-button">Excluir automação</button>' : ''}
          <button id="newRobotButton" class="button">Nova automação</button>
        </div>
      </div>

      <div class="admin-layout">
        <section class="section-card admin-sidebar">
          <div class="section-title">
            <h2>Automações cadastradas</h2>
            <p>Selecione uma automação para editar ou crie uma nova.</p>
          </div>
          <div class="admin-list">
            ${robots
              .map(
                (robot) => `
                  <button class="admin-list-item ${robot.id === selectedRobotId ? 'active' : ''}" data-robot-id="${robot.id}">
                    <strong>${robot.name}</strong>
                    <span>${robot.category || 'Sem categoria'} • ${robot.isActive ? 'Ativa' : 'Inativa'}</span>
                  </button>
                `,
              )
              .join('')}
          </div>
        </section>

        <form id="robotAdminForm" class="section-card admin-form">
          <div class="section-title">
            <h2>${draft.id ? 'Editar automação' : 'Nova automação'}</h2>
            <p>Preencha os dados abaixo para publicar a automação no hub.</p>
          </div>

          <div class="field-grid">
            <div class="field">
              <label>Nome</label>
              <input name="name" value="${escapeHtml(draft.name)}" placeholder="Ex: Conciliação Financeira" required />
            </div>
            <div class="field">
              <label>Slug</label>
              <input name="slug" value="${escapeHtml(draft.slug)}" placeholder="conciliacao-financeira" required />
            </div>
            <div class="field">
              <label>Categoria</label>
              <input name="category" value="${escapeHtml(draft.category)}" placeholder="Financeiro" />
            </div>
            <div class="field">
              <label>Ícone</label>
              <select name="icon">
                ${['bot', 'bank', 'receipt', 'chart']
                  .map(
                    (icon) =>
                      `<option value="${icon}" ${draft.icon === icon ? 'selected' : ''}>${icon}</option>`,
                  )
                  .join('')}
              </select>
            </div>
            <div class="field">
              <label>Versão</label>
              <input name="version" value="${escapeHtml(draft.version)}" placeholder="1.0.0" />
            </div>
            <div class="field">
              <label>Tempo estimado (min)</label>
              <input name="estimatedMinutes" type="number" value="${draft.estimatedMinutes ?? ''}" placeholder="10" />
            </div>
            <div class="field">
              <label>Concorrência máxima</label>
              <input name="maxConcurrency" type="number" min="1" value="${draft.maxConcurrency ?? 1}" placeholder="1" />
              <small>Quantas execuções deste mesmo robô podem rodar ao mesmo tempo neste servidor.</small>
            </div>
            <div class="field">
              <label>Grupos de conflito</label>
              <input name="conflictKeys" value="${escapeHtml(draft.conflictKeys)}" placeholder="Ex: sefaz, conta-fiscal" />
              <small>Use tags separadas por vírgula para impedir que robôs diferentes rodem juntos quando compartilham conta, sessão ou sistema.</small>
            </div>
            <div class="field full">
              <label>Resumo</label>
              <input name="summary" value="${escapeHtml(draft.summary)}" placeholder="Resumo exibido no card do robô" />
            </div>
            <div class="field full">
              <label>Descrição</label>
              <textarea name="description" rows="4" placeholder="Descrição detalhada da automação">${escapeHtml(draft.description)}</textarea>
            </div>
            <div class="field full">
              <label>Comando de execução</label>
              <input name="command" value="${escapeHtml(draft.command)}" placeholder="Ex: python main.py" />
            </div>
            <div class="field full">
              <label>Pasta de execução</label>
              <input name="workingDirectory" value="${escapeHtml(draft.workingDirectory)}" placeholder="Ex: C:\\Robos\\conciliacao" />
            </div>
            <div class="field">
              <label>Status</label>
              <select name="isActive">
                <option value="true" ${draft.isActive ? 'selected' : ''}>Ativa</option>
                <option value="false" ${!draft.isActive ? 'selected' : ''}>Inativa</option>
              </select>
            </div>
            <div class="field">
              <label>Label da documentação</label>
              <input name="documentationLabel" value="${escapeHtml(draft.documentationLabel)}" placeholder="Documentação" />
            </div>
            <div class="field full">
              <label>Link da documentação</label>
              <input name="documentationUrl" value="${escapeHtml(draft.documentationUrl)}" placeholder="https://..." />
            </div>
            <div class="field">
              <label>Label do suporte</label>
              <input name="supportLabel" value="${escapeHtml(draft.supportLabel)}" placeholder="Suporte" />
            </div>
            <div class="field">
              <label>Contato do suporte</label>
              <input name="supportValue" value="${escapeHtml(draft.supportValue)}" placeholder="rpa@empresa.com" />
            </div>
            <div class="field full">
              <label>Política de dados</label>
              <textarea name="dataPolicy" rows="3" placeholder="Mensagem sobre tratamento dos dados">${escapeHtml(draft.dataPolicy)}</textarea>
            </div>
          </div>

          <section class="admin-builder">
            <div class="section-title">
              <h2>Campos do formulário</h2>
              <p>Monte os parâmetros que o usuário deverá preencher antes de executar o robô.</p>
            </div>
            <div id="fieldsBuilder" class="admin-builder-list">
              ${draft.schema.fields.map((field, index) => renderFieldBuilderRow(field, index)).join('')}
            </div>
            <div class="button-row button-row-start">
              <button type="button" id="addFieldButton" class="ghost-button">Adicionar campo</button>
            </div>
          </section>

          <section class="admin-builder">
            <div class="section-title">
              <h2>Uploads de arquivo</h2>
              <p>Configure arquivos obrigatórios ou opcionais que o usuário deve enviar.</p>
            </div>
            <div id="fileInputsBuilder" class="admin-builder-list">
              ${draft.schema.fileInputs.map((fileInput, index) => renderFileInputBuilderRow(fileInput, index)).join('')}
            </div>
            <div class="button-row button-row-start">
              <button type="button" id="addFileInputButton" class="ghost-button">Adicionar upload</button>
            </div>
          </section>

          <div class="button-row">
            <button type="submit" class="button">Salvar automação</button>
          </div>
        </form>
      </div>
    </section>
  `;

  bindAdminEvents(draft);
}

function bindAdminEvents(draft) {
  document.querySelectorAll('[data-robot-id]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedRobotId = button.dataset.robotId;
      renderSettings();
    });
  });

  document.querySelector('#newRobotButton')?.addEventListener('click', () => {
    selectedRobotId = null;
    renderFreshSettings();
  });

  document.querySelector('#deleteRobotButton')?.addEventListener('click', async () => {
    if (!draft.id) {
      return;
    }

    const confirmed = window.confirm(`Deseja excluir a automação "${draft.name}"? Esta ação remove o cadastro e o histórico dela.`);
    if (!confirmed) {
      return;
    }

    try {
      await api(`/robots/${draft.id}`, { method: 'DELETE' });
      await loadHub();
      selectedRobotId = state.robots[0]?.id || null;
      renderSettings();
      notify('Automação excluída com sucesso.');
    } catch (error) {
      notify(error.message || 'Não foi possível excluir a automação.');
    }
  });

  const fieldsBuilder = document.querySelector('#fieldsBuilder');
  const fileInputsBuilder = document.querySelector('#fileInputsBuilder');

  document.querySelector('#addFieldButton')?.addEventListener('click', () => {
    if (!fieldsBuilder) {
      return;
    }

    fieldsBuilder.insertAdjacentHTML(
      'beforeend',
      renderFieldBuilderRow(
        {
          name: '',
          label: '',
          type: 'text',
          required: false,
          placeholder: '',
          options: [],
          defaultValue: '',
        },
        fieldsBuilder.children.length,
      ),
    );
  });

  document.querySelector('#addFileInputButton')?.addEventListener('click', () => {
    if (!fileInputsBuilder) {
      return;
    }

    fileInputsBuilder.insertAdjacentHTML(
      'beforeend',
      renderFileInputBuilderRow(
        {
          name: '',
          label: '',
          accept: '',
          multiple: false,
          required: false,
          helperText: '',
        },
        fileInputsBuilder.children.length,
      ),
    );
  });

  app.querySelectorAll('[data-remove-row]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.builder-row')?.remove();
    });
  });

  app.querySelectorAll('.admin-builder-list').forEach((builder) => {
    builder.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches('[data-remove-row]')) {
        return;
      }

      target.closest('.builder-row')?.remove();
    });
  });

  document.querySelector('#robotAdminForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!fieldsBuilder || !fileInputsBuilder) {
      notify('Nao foi possivel montar o formulario da automacao.');
      return;
    }

    const payload = {
      id: draft.id || undefined,
      name: fieldValue(form, 'name'),
      slug: fieldValue(form, 'slug'),
      category: fieldValue(form, 'category'),
      icon: fieldValue(form, 'icon'),
      version: fieldValue(form, 'version'),
      estimatedMinutes: fieldValue(form, 'estimatedMinutes'),
      maxConcurrency: fieldValue(form, 'maxConcurrency'),
      conflictKeys: fieldValue(form, 'conflictKeys'),
      summary: fieldValue(form, 'summary'),
      description: fieldValue(form, 'description'),
      command: fieldValue(form, 'command'),
      workingDirectory: fieldValue(form, 'workingDirectory'),
      isActive: fieldValue(form, 'isActive') === 'true',
      documentationLabel: fieldValue(form, 'documentationLabel'),
      documentationUrl: fieldValue(form, 'documentationUrl'),
      supportLabel: fieldValue(form, 'supportLabel'),
      supportValue: fieldValue(form, 'supportValue'),
      dataPolicy: fieldValue(form, 'dataPolicy'),
      schema: {
        fields: collectFieldRows(fieldsBuilder),
        fileInputs: collectFileInputRows(fileInputsBuilder),
      },
    };

    try {
      const saved = await api('/robots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await loadHub();
      selectedRobotId = saved.id;
      renderSettings();
      notify('Automação salva com sucesso.');
    } catch (error) {
      notify(error.message || 'Não foi possível salvar a automação.');
    }
  });
}

function renderFreshSettings() {
  const current = state.robots || [];
  const draft = emptyDraft();

  app.innerHTML = `
    <section class="page">
      <div class="hero">
        <div>
          <div class="breadcrumbs">Automation HUB / Administração</div>
          <h1>Cadastro de Automações</h1>
          <p>Cadastre novas automações, defina o comando de execução e monte o formulário exibido para o usuário.</p>
        </div>
        <div class="button-row">
          <button id="backToListButton" class="ghost-button">Voltar para lista</button>
        </div>
      </div>

      <div class="admin-layout">
        <section class="section-card admin-sidebar">
          <div class="section-title">
            <h2>Automações cadastradas</h2>
            <p>${current.length} automações no hub.</p>
          </div>
        </section>

        <form id="robotAdminForm" class="section-card admin-form">
          <div class="section-title">
            <h2>Nova automação</h2>
            <p>Preencha os dados abaixo para publicar a automação no hub.</p>
          </div>

          <div class="field-grid">
            <div class="field">
              <label>Nome</label>
              <input name="name" placeholder="Ex: Conciliação Financeira" required />
            </div>
            <div class="field">
              <label>Slug</label>
              <input name="slug" placeholder="conciliacao-financeira" required />
            </div>
            <div class="field">
              <label>Categoria</label>
              <input name="category" placeholder="Financeiro" />
            </div>
            <div class="field">
              <label>Ícone</label>
              <select name="icon">
                <option value="bot">bot</option>
                <option value="bank">bank</option>
                <option value="receipt">receipt</option>
                <option value="chart">chart</option>
              </select>
            </div>
            <div class="field">
              <label>Versão</label>
              <input name="version" value="1.0.0" />
            </div>
            <div class="field">
              <label>Tempo estimado (min)</label>
              <input name="estimatedMinutes" type="number" placeholder="10" />
            </div>
            <div class="field">
              <label>Concorrência máxima</label>
              <input name="maxConcurrency" type="number" min="1" value="1" />
              <small>Quantas execuções deste mesmo robô podem rodar ao mesmo tempo neste servidor.</small>
            </div>
            <div class="field">
              <label>Grupos de conflito</label>
              <input name="conflictKeys" placeholder="Ex: sefaz, conta-fiscal" />
              <small>Use tags separadas por vírgula para impedir que robôs diferentes rodem juntos quando compartilham conta, sessão ou sistema.</small>
            </div>
            <div class="field full">
              <label>Resumo</label>
              <input name="summary" placeholder="Resumo exibido no card do robô" />
            </div>
            <div class="field full">
              <label>Descrição</label>
              <textarea name="description" rows="4" placeholder="Descrição detalhada da automação"></textarea>
            </div>
            <div class="field full">
              <label>Comando de execução</label>
              <input name="command" placeholder="Ex: python main.py" />
            </div>
            <div class="field full">
              <label>Pasta de execução</label>
              <input name="workingDirectory" placeholder="Ex: C:\\Robos\\conciliacao" />
            </div>
            <div class="field">
              <label>Status</label>
              <select name="isActive">
                <option value="true">Ativa</option>
                <option value="false">Inativa</option>
              </select>
            </div>
            <div class="field">
              <label>Label da documentação</label>
              <input name="documentationLabel" placeholder="Documentação" />
            </div>
            <div class="field full">
              <label>Link da documentação</label>
              <input name="documentationUrl" placeholder="https://..." />
            </div>
            <div class="field">
              <label>Label do suporte</label>
              <input name="supportLabel" placeholder="Suporte" />
            </div>
            <div class="field">
              <label>Contato do suporte</label>
              <input name="supportValue" placeholder="rpa@empresa.com" />
            </div>
            <div class="field full">
              <label>Política de dados</label>
              <textarea name="dataPolicy" rows="3" placeholder="Mensagem sobre tratamento dos dados"></textarea>
            </div>
          </div>

          <section class="admin-builder">
            <div class="section-title">
              <h2>Campos do formulário</h2>
              <p>Monte os parâmetros que o usuário deverá preencher antes de executar o robô.</p>
            </div>
            <div id="fieldsBuilder" class="admin-builder-list"></div>
            <div class="button-row button-row-start">
              <button type="button" id="addFieldButton" class="ghost-button">Adicionar campo</button>
            </div>
          </section>

          <section class="admin-builder">
            <div class="section-title">
              <h2>Uploads de arquivo</h2>
              <p>Configure arquivos obrigatórios ou opcionais que o usuário deve enviar.</p>
            </div>
            <div id="fileInputsBuilder" class="admin-builder-list"></div>
            <div class="button-row button-row-start">
              <button type="button" id="addFileInputButton" class="ghost-button">Adicionar upload</button>
            </div>
          </section>

          <div class="button-row">
            <button type="submit" class="button">Salvar automação</button>
          </div>
        </form>
      </div>
    </section>
  `;

  document.querySelector('#backToListButton').addEventListener('click', () => {
    selectedRobotId = state.robots[0]?.id || null;
    renderSettings();
  });

  bindAdminEvents(draft);
}

function collectFieldRows(root) {
  return Array.from(root.querySelectorAll('.builder-row[data-kind="field"]'))
    .map((row) => ({
      name: row.querySelector('[name="field-name"]').value.trim(),
      label: row.querySelector('[name="field-label"]').value.trim(),
      type: row.querySelector('[name="field-type"]').value,
      required: row.querySelector('[name="field-required"]').checked,
      placeholder: row.querySelector('[name="field-placeholder"]').value.trim(),
      options: row.querySelector('[name="field-options"]').value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      defaultValue: row.querySelector('[name="field-default"]').value.trim(),
    }))
    .filter((field) => field.name && field.label);
}

function collectFileInputRows(root) {
  return Array.from(root.querySelectorAll('.builder-row[data-kind="file"]'))
    .map((row) => ({
      name: row.querySelector('[name="file-name"]').value.trim(),
      label: row.querySelector('[name="file-label"]').value.trim(),
      accept: row.querySelector('[name="file-accept"]').value.trim(),
      multiple: row.querySelector('[name="file-multiple"]').checked,
      required: row.querySelector('[name="file-required"]').checked,
      helperText: row.querySelector('[name="file-helper"]').value.trim(),
    }))
    .filter((fileInput) => fileInput.name && fileInput.label);
}

function renderFieldBuilderRow(field, index) {
  return `
    <div class="builder-row" data-kind="field" data-index="${index}">
      <div class="field-grid admin-builder-grid">
        <div class="field">
          <label>Nome interno</label>
          <input name="field-name" value="${escapeHtml(field.name || '')}" placeholder="dataInicio" />
        </div>
        <div class="field">
          <label>Label</label>
          <input name="field-label" value="${escapeHtml(field.label || '')}" placeholder="Data inicial" />
        </div>
        <div class="field">
          <label>Tipo</label>
          <select name="field-type">
            ${['text', 'date', 'select', 'radio', 'textarea', 'checkbox']
              .map(
                (type) =>
                  `<option value="${type}" ${field.type === type ? 'selected' : ''}>${type}</option>`,
              )
              .join('')}
          </select>
        </div>
        <div class="field">
          <label>Valor padrão</label>
          <input name="field-default" value="${escapeHtml(field.defaultValue || '')}" placeholder="Opcional" />
        </div>
        <div class="field full">
          <label>Placeholder</label>
          <input name="field-placeholder" value="${escapeHtml(field.placeholder || '')}" placeholder="Texto de apoio" />
        </div>
        <div class="field full">
          <label>Opções</label>
          <input name="field-options" value="${escapeHtml((field.options || []).join(', '))}" placeholder="Separadas por vírgula" />
        </div>
        <label class="checkbox-chip">
          <input name="field-required" type="checkbox" ${field.required ? 'checked' : ''} />
          Obrigatório
        </label>
        <button type="button" class="danger-button" data-remove-row>Remover campo</button>
      </div>
    </div>
  `;
}

function renderFileInputBuilderRow(fileInput, index) {
  return `
    <div class="builder-row" data-kind="file" data-index="${index}">
      <div class="field-grid admin-builder-grid">
        <div class="field">
          <label>Nome interno</label>
          <input name="file-name" value="${escapeHtml(fileInput.name || '')}" placeholder="arquivosBase" />
        </div>
        <div class="field">
          <label>Label</label>
          <input name="file-label" value="${escapeHtml(fileInput.label || '')}" placeholder="Arquivos base" />
        </div>
        <div class="field full">
          <label>Tipos aceitos</label>
          <input name="file-accept" value="${escapeHtml(fileInput.accept || '')}" placeholder=".xlsx,.csv,.zip" />
        </div>
        <div class="field full">
          <label>Texto de ajuda</label>
          <input name="file-helper" value="${escapeHtml(fileInput.helperText || '')}" placeholder="Explique o que o usuário deve enviar" />
        </div>
        <label class="checkbox-chip">
          <input name="file-multiple" type="checkbox" ${fileInput.multiple ? 'checked' : ''} />
          Permitir múltiplos arquivos
        </label>
        <label class="checkbox-chip">
          <input name="file-required" type="checkbox" ${fileInput.required ? 'checked' : ''} />
          Obrigatório
        </label>
        <button type="button" class="danger-button" data-remove-row>Remover upload</button>
      </div>
    </div>
  `;
}

function emptyDraft() {
  return {
    id: '',
    slug: '',
    name: '',
    summary: '',
    description: '',
    category: '',
    icon: 'bot',
    isActive: true,
    version: '1.0.0',
    estimatedMinutes: '',
    maxConcurrency: 1,
    conflictKeys: '',
    command: '',
    workingDirectory: '',
    documentationUrl: '',
    documentationLabel: 'Documentação',
    supportLabel: 'Suporte',
    supportValue: '',
    dataPolicy: '',
    schema: {
      fields: [],
      fileInputs: [],
    },
  };
}

function mapRobotToDraft(robot) {
  return {
    id: robot.id,
    slug: robot.slug || '',
    name: robot.name || '',
    summary: robot.summary || '',
    description: robot.description || '',
    category: robot.category || '',
    icon: robot.icon || 'bot',
    isActive: Boolean(robot.isActive),
    version: robot.version || '1.0.0',
    estimatedMinutes: robot.estimatedMinutes ?? '',
    maxConcurrency: robot.maxConcurrency ?? 1,
    conflictKeys: robot.conflictKeys || '',
    command: robot.command || '',
    workingDirectory: robot.workingDirectory || '',
    documentationUrl: robot.documentationUrl || '',
    documentationLabel: robot.documentationLabel || 'Documentação',
    supportLabel: robot.supportLabel || 'Suporte',
    supportValue: robot.supportValue || '',
    dataPolicy: robot.dataPolicy || '',
    schema: {
      fields: Array.isArray(robot.schema?.fields) ? robot.schema.fields : [],
      fileInputs: Array.isArray(robot.schema?.fileInputs) ? robot.schema.fileInputs : [],
    },
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function fieldValue(form, name) {
  const field = form.elements.namedItem(name);
  return field && 'value' in field ? field.value : '';
}
