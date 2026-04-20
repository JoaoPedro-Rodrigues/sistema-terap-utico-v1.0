// ─── Relatórios ──────────────────────────────────────

let chartEvolucao = null;
let chartDistribuicao = null;

function initRelatorios() {
  const page = document.body.dataset.page;
  if (page !== 'relatorios') return;

  const pacientes = DB.get('pacientes') || [];
  const sel = document.getElementById('rel-paciente');

  if (sel) {
    sel.innerHTML = '<option value="">Todos os pacientes</option>' +
      pacientes.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    sel.addEventListener('change', () => renderRelatorios(sel.value));
  }

  // Check se veio com parâmetro de URL
  const params = new URLSearchParams(window.location.search);
  const pacParam = params.get('paciente');
  if (pacParam && sel) {
    sel.value = pacParam;
  }

  renderRelatorios(pacParam || '');
  renderKPIs();
}

function renderKPIs() {
  const pacientes = DB.get('pacientes') || [];
  const sessoes   = DB.get('sessoes') || [];

  const totalPac    = pacientes.length;
  const ativos      = pacientes.filter(p => p.status === 'ativo').length;
  const concluidos  = pacientes.filter(p => p.status === 'concluido').length;
  const totalSess   = sessoes.length;

  const scores = pacientes
    .filter(p => p.score && (p.score.ansiedade + p.score.sono + p.score.humor) > 0)
    .map(p => scoreMediaPaciente(p));

  const mediaGeral = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
    : 0;

  setEl('kpi-total',    totalPac);
  setEl('kpi-ativos',   ativos);
  setEl('kpi-sessoes',  totalSess);
  setEl('kpi-score',    mediaGeral > 0 ? mediaGeral + '/10' : '—');
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderRelatorios(pacId) {
  const pacientes = DB.get('pacientes') || [];
  const sessoes   = DB.get('sessoes')   || [];
  const checkins  = DB.get('checkins')  || [];

  const pacFiltro = pacId ? pacientes.filter(p => p.id === pacId) : pacientes;
  const sesFiltro = pacId ? sessoes.filter(s => s.pacienteId === pacId) : sessoes;
  const ciFiltro  = pacId ? checkins.filter(c => c.pacienteId === pacId) : checkins;

  renderChartEvolucao(pacFiltro, ciFiltro, pacId);
  renderChartDistribuicao(pacFiltro);
  renderTabelaDetalhada(pacFiltro, sesFiltro);

  if (pacId) {
    renderRelatorioFinalCard(pacId);
  } else {
    const rfCard = document.getElementById('relatorio-final-card');
    if (rfCard) rfCard.innerHTML = '';
  }
}

function renderChartEvolucao(pacientes, checkins, pacId) {
  const canvas = document.getElementById('chart-evolucao');
  if (!canvas) return;

  if (chartEvolucao) { chartEvolucao.destroy(); chartEvolucao = null; }

  let labels = [];
  let datasets = [];

  if (pacId && pacientes.length === 1) {
    // Gráfico individual: checkins ao longo do tempo
    const cis = checkins.sort((a, b) => a.data.localeCompare(b.data));
    labels = cis.map(c => formatDate(c.data));

    datasets = [
      {
        label: 'Ansiedade (inverso)',
        data: cis.map(c => 10 - c.ansiedade),
        borderColor: '#4A8A6A',
        backgroundColor: 'rgba(74,138,106,.08)',
        tension: .4, fill: true, pointRadius: 4,
      },
      {
        label: 'Sono',
        data: cis.map(c => c.sono),
        borderColor: '#4A7AA3',
        backgroundColor: 'rgba(74,122,163,.06)',
        tension: .4, fill: false, pointRadius: 4,
      },
      {
        label: 'Humor',
        data: cis.map(c => c.humor),
        borderColor: '#C4943A',
        backgroundColor: 'rgba(196,148,58,.06)',
        tension: .4, fill: false, pointRadius: 4,
      },
    ];

    if (labels.length === 0) {
      labels = ['Sem dados'];
      datasets.forEach(d => d.data = [0]);
    }
  } else {
    // Gráfico geral: score médio por paciente
    const top8 = pacientes.slice(0, 8);
    labels = top8.map(p => p.nome.split(' ')[0]);
    datasets = [{
      label: 'Score médio',
      data: top8.map(p => scoreMediaPaciente(p)),
      backgroundColor: top8.map((_, i) =>
        ['#5C7A6B','#8B6F5E','#C4943A','#4A7AA3','#4A8A6A','#C45A4A','#7A6A9A','#6A8A7A'][i % 8]
      ),
      borderRadius: 6,
    }];
  }

  chartEvolucao = new Chart(canvas, {
    type: pacId ? 'line' : 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'DM Sans', size: 12 }, padding: 16 } },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        y: {
          min: 0, max: 10,
          ticks: { font: { family: 'DM Sans', size: 11 }, stepSize: 2 },
          grid: { color: 'rgba(0,0,0,.04)' },
        },
        x: {
          ticks: { font: { family: 'DM Sans', size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

function renderChartDistribuicao(pacientes) {
  const canvas = document.getElementById('chart-distribuicao');
  if (!canvas) return;

  if (chartDistribuicao) { chartDistribuicao.destroy(); chartDistribuicao = null; }

  const status = {
    ativo: pacientes.filter(p => p.status === 'ativo').length,
    aguardando: pacientes.filter(p => p.status === 'aguardando').length,
    concluido: pacientes.filter(p => p.status === 'concluido').length,
    pausado: pacientes.filter(p => p.status === 'pausado').length,
  };

  chartDistribuicao = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Ativos', 'Aguardando', 'Concluídos', 'Pausados'],
      datasets: [{
        data: Object.values(status),
        backgroundColor: ['#4A8A6A', '#C4943A', '#5C7A6B', '#8B8680'],
        borderWidth: 0,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'DM Sans', size: 12 }, padding: 12, boxWidth: 12, borderRadius: 4 } },
      },
    },
  });
}

function renderTabelaDetalhada(pacientes, sessoes) {
  const tbody = document.getElementById('rel-tbody');
  if (!tbody) return;

  tbody.innerHTML = pacientes.map(p => {
    const sesPac  = sessoes.filter(s => s.pacienteId === p.id);
    const media   = scoreMediaPaciente(p);
    const progresso = Math.round((p.semana / 12) * 100);
    const deltaScore = sesPac.length >= 2 ? 2 : 0; // simplificado para demo

    return `
      <tr>
        <td>
          <div class="avatar-group">
            <div class="avatar ${p.cor}">${p.avatar}</div>
            <span class="avatar-group-name">${p.nome}</span>
          </div>
        </td>
        <td>${statusBadge(p.status)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="score-bar-wrap" style="width:70px">
              <div class="score-bar ${scoreColor(progresso/10)}" style="width:${progresso}%"></div>
            </div>
            <span class="text-sm">${progresso}%</span>
          </div>
        </td>
        <td><span style="font-family:var(--font-display);font-size:1.1rem;color:${media >= 7 ? 'var(--success)' : media >= 4 ? 'var(--gold)' : 'var(--danger)'}">${media > 0 ? media : '—'}</span></td>
        <td>${sesPac.length}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="document.getElementById('rel-paciente').value='${p.id}';renderRelatorios('${p.id}')">Analisar</button>
        </td>
      </tr>
    `;
  }).join('');

  if (pacientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">Nenhum dado.</td></tr>`;
  }
}

function renderRelatorioFinalCard(pacId) {
  const container = document.getElementById('relatorio-final-card');
  if (!container) return;

  const pacientes = DB.get('pacientes') || [];
  const p = pacientes.find(x => x.id === pacId);
  if (!p) return;

  const media = scoreMediaPaciente(p);
  const evolucaoTexto = media >= 7
    ? 'Excelente evolução terapêutica. Paciente atingiu os objetivos propostos.'
    : media >= 5
    ? 'Boa evolução. Continuar com técnicas de manutenção.'
    : 'Evolução em andamento. Considerar ajuste no plano terapêutico.';

  container.innerHTML = `
    <div class="card mt-24" style="border:2px solid var(--gold);background:linear-gradient(135deg,#fdf9f2 0%,var(--white) 100%)">
      <div class="card-header">
        <div>
          <p class="text-xs" style="color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:500;margin-bottom:4px">Relatório Premium</p>
          <h3 class="card-title">Relatório Final — ${p.nome}</h3>
          <p class="card-subtitle">Protocolo de 3 meses · ${p.sessoes} sessões realizadas</p>
        </div>
        <button class="btn btn-gold" onclick="imprimirRelatorio('${pacId}')">📄 Exportar PDF</button>
      </div>
      <div class="grid-3 mb-24" style="gap:16px">
        <div style="text-align:center;padding:16px;background:var(--cream);border-radius:10px">
          <p class="text-xs text-muted mb-4">Sessões realizadas</p>
          <p style="font-family:var(--font-display);font-size:2rem">${p.sessoes}</p>
        </div>
        <div style="text-align:center;padding:16px;background:var(--cream);border-radius:10px">
          <p class="text-xs text-muted mb-4">Score final</p>
          <p style="font-family:var(--font-display);font-size:2rem;color:${media >= 7 ? 'var(--success)' : media >= 4 ? 'var(--gold)' : 'var(--danger)'}">${media}/10</p>
        </div>
        <div style="text-align:center;padding:16px;background:var(--cream);border-radius:10px">
          <p class="text-xs text-muted mb-4">Protocolo</p>
          <p style="font-family:var(--font-display);font-size:2rem">${Math.round((p.semana/12)*100)}%</p>
        </div>
      </div>
      <div class="alert alert-success mb-16">
        <span>✓</span>
        <p>${evolucaoTexto}</p>
      </div>
      <div class="grid-2" style="gap:16px">
        <div>
          <p class="text-xs text-muted mb-8">EVOLUÇÃO EMOCIONAL</p>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${['Ansiedade (↓ melhor)', 'Sono (↑ melhor)', 'Humor (↑ melhor)'].map((label, i) => {
              const keys = ['ansiedade', 'sono', 'humor'];
              const val = p.score[keys[i]] || 0;
              const pct = i === 0 ? (10 - val) * 10 : val * 10;
              return `
                <div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span class="text-sm">${label}</span>
                    <span class="text-sm" style="font-weight:500">${val}/10</span>
                  </div>
                  <div class="score-bar-wrap"><div class="score-bar ${scoreColor(pct/10)}" style="width:${pct}%"></div></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div>
          <p class="text-xs text-muted mb-8">RECOMENDAÇÕES FUTURAS</p>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:8px">
            ${[
              'Manter práticas de respiração diárias',
              'Sessão de manutenção mensal',
              'Diário emocional 3x por semana',
              media < 7 ? 'Reavaliar plano terapêutico em 30 dias' : 'Alta terapêutica com suporte disponível',
            ].map(r => `<li style="font-size:.8rem;display:flex;gap:8px;align-items:flex-start"><span style="color:var(--sage);margin-top:2px">▸</span><span>${r}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}

function imprimirRelatorio(pacId) {
  toast('Preparando relatório para impressão...', 'info');
  setTimeout(() => window.print(), 500);
}

document.addEventListener('DOMContentLoaded', initRelatorios);
