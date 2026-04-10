import { app } from '../core/dom.js';
import { state } from '../state/app-state.js';
import { renderRobotCard } from '../components/render-helpers.js';

function filteredRobots() {
  return state.robots.filter((robot) => {
    const matchesCategory =
      state.selectedCategory === 'Todos' || robot.category === state.selectedCategory;
    const haystack = `${robot.name} ${robot.summary || ''} ${robot.category || ''}`.toLowerCase();
    const matchesSearch = !state.search || haystack.includes(state.search);
    return matchesCategory && matchesSearch;
  });
}

export function renderRobotsPage() {
  const categories = ['Todos', ...new Set(state.robots.map((robot) => robot.category).filter(Boolean))];

  app.innerHTML = `
    <section class="page">
      <div class="hero">
        <div>
          <div class="breadcrumbs">Automation HUB / Robôs</div>
          <h1>Catálogo de Robôs</h1>
          <p>Encontre a automação certa, filtre por categoria e acesse a configuração de execução.</p>
        </div>
        <div class="status-badge status-ready">${state.robots.length} robôs disponíveis</div>
      </div>

      <section class="section-card">
        <div class="section-title">
          <h2>Explorar Robôs</h2>
          <p>Use os filtros abaixo para localizar o processo ideal para sua demanda.</p>
        </div>
        <div class="filters">
          ${categories
            .map(
              (category) => `
                <button class="pill ${state.selectedCategory === category ? 'active' : ''}" data-category="${category}">
                  ${category}
                </button>
              `,
            )
            .join('')}
        </div>
        <div class="robot-grid">
          ${filteredRobots().map(renderRobotCard).join('')}
        </div>
      </section>
    </section>
  `;

  document.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCategory = button.dataset.category;
      renderRobotsPage();
    });
  });
}
