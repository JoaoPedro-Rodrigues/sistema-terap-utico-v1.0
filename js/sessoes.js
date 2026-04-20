// ─── Sessões ─────────────────────────────────────────

function renderSessoes(filtro = '') {
  const sessoes   = DB.get('sessoes') || [];
  const pacientes = DB.get('pacientes') || [];

  const lista = sessoes
    .map(s => ({ ...s, pac: pacientes.find(p => p.id === s.pacienteId) }))
    .filter(s => !filtro || s.pac?.nome.toLowerCase().includes(filtro.toLowerCase()))
    .sort((a, b) => b.data.localeCompare(a.data));

  const tbody = document.getElementById('sessoes-tbody');
  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">Nenhuma sessão registrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(s => {
    const antes = s.scorePre ? Math.round((s.scorePre.ansiedade + s.scorePre.humor) / 2) : 0;
    const depois = s.scorePos ? Math.round((s.scorePos.ansiedade + s.scorePos.humor) / 2) : 0;
    const delta = depois - antes;
    return `
      <tr>
        <td><span style="font-size:.875rem;font-weight:500">${formatDate(s.data)}</span></td>
        <td>
          ${s.pac ? `<div class="avatar-group">
            <div class="avatar ${s.pac.cor}">${s.pac.avatar}</div>
            <span class="avatar-group-name">${s.pac.nome}</span>
          </div>` : '—'}
        </td>
        <td><span class="text-sm">${s.tecnica}</span></td>
        <td><span class="text-sm text-muted">${s.duracao} min</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="text-sm text-muted">${antes > 0 ? antes : '—'}</span>
            ${antes > 0 ? '<span style="font-size:.7rem;color:var(--muted)">→</span>' : ''}
            <span class="text-sm" style="font-weight:500;color:${delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--muted)'}">${depois > 0 ? depois : '—'}</span>
            ${delta !== 0 && depois > 0 ? `<span style="font-size:.72rem;color:${delta > 0 ? 'var(--success)' : 'var(--danger)'}">${delta > 0 ? '+' : ''}${delta}</span>` : ''}
          </div>
        </td>
        <td>${evolucaoBadge(s.evolucao)}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="verSessao('${s.id}')">Detalhes</button>
        </td>
      </tr>
    `;
  }).join('');
}

function verSessao(id) {
  const sessoes   = DB.get('sessoes') || [];
  const pacientes = DB.get('pacientes') || [];
  const s = sessoes.find(x => x.id === id);
  if (!s) return;
  const p = pacientes.find(x => x.id === s.pacienteId);

  document.getElementById('modal-sessao-detalhe-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
      ${p ? `<div class="avatar ${p.cor}">${p.avatar}</div>` : ''}
      <div>
        <p style="font-weight:500">${p ? p.nome : 'Paciente'}</p>
        <p class="text-sm text-muted">${formatDate(s.data)} · ${s.duracao} minutos</p>
      </div>
      <div style="margin-left:auto">${evolucaoBadge(s.evolucao)}</div>
    </div>

    <div class="mb-16">
      <p class="text-xs text-muted mb-4">TÉCNICA APLICADA</p>
      <p style="font-size:.875rem;font-weight:500">${s.tecnica}</p>
    </div>

    ${s.scorePre ? `
    <div class="grid-2 mb-16">
      <div style="background:var(--cream);border-radius:10px;padding:14px">
        <p class="text-xs text-muted mb-8">ESTADO ANTES</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="text-sm">Ansiedade</span>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="score-bar-wrap" style="width:80px"><div class="score-bar ${scoreColor(10 - s.scorePre.ansiedade)}" style="width:${s.scorePre.ansiedade*10}%"></div></div>
              <span class="text-sm font-weight:500">${s.scorePre.ansiedade}</span>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="text-sm">Humor</span>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="score-bar-wrap" style="width:80px"><div class="score-bar ${scoreColor(s.scorePre.humor)}" style="width:${s.scorePre.humor*10}%"></div></div>
              <span class="text-sm">${s.scorePre.humor}</span>
            </div>
          </div>
        </div>
      </div>
      <div style="background:var(--sage-lt);border-radius:10px;padding:14px">
        <p class="text-xs text-muted mb-8">ESTADO DEPOIS</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="text-sm">Ansiedade</span>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="score-bar-wrap" style="width:80px"><div class="score-bar ${scoreColor(10 - s.scorePos.ansiedade)}" style="width:${s.scorePos.ansiedade*10}%"></div></div>
              <span class="text-sm">${s.scorePos.ansiedade}</span>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="text-sm">Humor</span>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="score-bar-wrap" style="width:80px"><div class="score-bar ${scoreColor(s.scorePos.humor)}" style="width:${s.scorePos.humor*10}%"></div></div>
              <span class="text-sm">${s.scorePos.humor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>` : ''}

    <div class="mb-16">
      <p class="text-xs text-muted mb-4">NOTAS DA SESSÃO</p>
      <p style="font-size:.875rem;line-height:1.7;background:var(--cream);padding:14px;border-radius:8px">${s.notas}</p>
    </div>

    <div>
      <p class="text-xs text-muted mb-4">RECOMENDAÇÕES</p>
      <p style="font-size:.875rem;line-height:1.7;background:var(--sage-lt);padding:14px;border-radius:8px;border-left:3px solid var(--sage)">${s.recomendacoes}</p>
    </div>
  `;
  openModal('modal-sessao-detalhe');
}

function salvarSessao(e) {
  e.preventDefault();
  const sessoes   = DB.get('sessoes') || [];
  const pacientes = DB.get('pacientes') || [];

  const pacId = document.getElementById('sessao-paciente').value;
  const novaSessao = {
    id: gerarId('s'),
    pacienteId: pacId,
    data: document.getElementById('sessao-data').value,
    duracao: parseInt(document.getElementById('sessao-duracao').value),
    tecnica: document.getElementById('sessao-tecnica').value,
    scorePre: {
      ansiedade: parseInt(document.getElementById('sessao-pre-ans').value),
      humor: parseInt(document.getElementById('sessao-pre-humor').value),
    },
    scorePos: {
      ansiedade: parseInt(document.getElementById('sessao-pos-ans').value),
      humor: parseInt(document.getElementById('sessao-pos-humor').value),
    },
    notas: document.getElementById('sessao-notas').value,
    recomendacoes: document.getElementById('sessao-recom').value,
    evolucao: document.getElementById('sessao-evolucao').value,
  };

  sessoes.push(novaSessao);
  DB.set('sessoes', sessoes);

  // Atualizar contagem de sessões do paciente
  const pIdx = pacientes.findIndex(p => p.id === pacId);
  if (pIdx >= 0) {
    pacientes[pIdx].sessoes = (pacientes[pIdx].sessoes || 0) + 1;
    if (pacientes[pIdx].status === 'aguardando') pacientes[pIdx].status = 'ativo';
    pacientes[pIdx].semana = Math.min((pacientes[pIdx].semana || 0) + 1, 12);
    pacientes[pIdx].score.humor    = novaSessao.scorePos.humor;
    pacientes[pIdx].score.ansiedade = novaSessao.scorePos.ansiedade;
    DB.set('pacientes', pacientes);
  }

  closeModal('modal-sessao');
  renderSessoes();
  toast('Sessão registrada com sucesso!');
  e.target.reset();
}

// ─── Acompanhamento ───────────────────────────────────
function renderAcompanhamento() {
  const pacientes = DB.get('pacientes') || [];
  const ativos    = pacientes.filter(p => p.status === 'ativo');

  const container = document.getElementById('acomp-lista');
  if (!container) return;

  container.innerHTML = ativos.map(p => {
    const progresso = Math.round((p.semana / 12) * 100);
    const fase = p.semana <= 4 ? 'Intensivo' : 'Manutenção';
    const faseColor = p.semana <= 4 ? 'badge-bark' : 'badge-sage';
    const media = scoreMediaPaciente(p);

    return `
      <div class="card mb-16">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="avatar-group">
            <div class="avatar ${p.cor}" style="width:40px;height:40px">${p.avatar}</div>
            <div>
              <p style="font-weight:500">${p.nome}</p>
              <p class="text-sm text-muted">Início: ${formatDate(p.inicio)}</p>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge ${faseColor}">${fase}</span>
            <span class="badge badge-muted">Semana ${p.semana}/12</span>
          </div>
        </div>

        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span class="text-xs text-muted">Progresso do protocolo</span>
            <span class="text-xs" style="font-weight:500">${progresso}%</span>
          </div>
          <div style="background:var(--warm);border-radius:20px;height:6px;overflow:hidden">
            <div style="width:${progresso}%;height:100%;background:${progresso >= 80 ? 'var(--success)' : progresso >= 40 ? 'var(--gold)' : 'var(--sage)'};border-radius:20px;transition:width .5s ease"></div>
          </div>
        </div>

        <div class="grid-3 mb-16" style="gap:12px">
          <div style="text-align:center;padding:10px;background:var(--cream);border-radius:8px">
            <p class="text-xs text-muted mb-4">Ansiedade</p>
            <p style="font-family:var(--font-display);font-size:1.3rem;color:${p.score.ansiedade <= 4 ? 'var(--success)' : p.score.ansiedade <= 7 ? 'var(--gold)' : 'var(--danger)'}">${p.score.ansiedade || '—'}</p>
          </div>
          <div style="text-align:center;padding:10px;background:var(--cream);border-radius:8px">
            <p class="text-xs text-muted mb-4">Sono</p>
            <p style="font-family:var(--font-display);font-size:1.3rem;color:${p.score.sono >= 6 ? 'var(--success)' : p.score.sono >= 4 ? 'var(--gold)' : 'var(--danger)'}">${p.score.sono || '—'}</p>
          </div>
          <div style="text-align:center;padding:10px;background:var(--cream);border-radius:8px">
            <p class="text-xs text-muted mb-4">Humor</p>
            <p style="font-family:var(--font-display);font-size:1.3rem;color:${p.score.humor >= 6 ? 'var(--success)' : p.score.humor >= 4 ? 'var(--gold)' : 'var(--danger)'}">${p.score.humor || '—'}</p>
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm btn-outline" onclick="verPaciente('${p.id}')">Ver histórico</button>
          <button class="btn btn-sm btn-primary" onclick="novaSessaoParaPaciente('${p.id}')">+ Sessão</button>
          <button class="btn btn-sm btn-outline" onclick="registrarCheckin('${p.id}')">Check-in</button>
          ${p.semana >= 12 ? `<button class="btn btn-sm btn-gold" onclick="gerarRelatorioFinal('${p.id}')">📄 Relatório final</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (ativos.length === 0) {
    container.innerHTML = `<div class="alert alert-info">Nenhum paciente ativo no protocolo de 3 meses.</div>`;
  }
}

function registrarCheckin(pacId) {
  document.getElementById('checkin-pac').value = pacId;
  openModal('modal-checkin');
}

function salvarCheckin(e) {
  e.preventDefault();
  const checkins = DB.get('checkins') || [];
  const pacId = document.getElementById('checkin-pac').value;
  const novoCheckin = {
    id: gerarId('c'),
    pacienteId: pacId,
    data: todayStr(),
    ansiedade: parseInt(document.getElementById('ci-ansiedade').value),
    sono: parseInt(document.getElementById('ci-sono').value),
    humor: parseInt(document.getElementById('ci-humor').value),
    nota: document.getElementById('ci-nota').value,
  };

  checkins.push(novoCheckin);
  DB.set('checkins', checkins);

  // Atualizar score do paciente
  const pacientes = DB.get('pacientes') || [];
  const pIdx = pacientes.findIndex(p => p.id === pacId);
  if (pIdx >= 0) {
    pacientes[pIdx].score = {
      ansiedade: novoCheckin.ansiedade,
      sono: novoCheckin.sono,
      humor: novoCheckin.humor,
    };
    DB.set('pacientes', pacientes);
  }

  closeModal('modal-checkin');
  renderAcompanhamento();
  toast('Check-in registrado!');
  e.target.reset();
}

function gerarRelatorioFinal(pacId) {
  window.location.href = `relatorios.html?paciente=${pacId}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'sessoes') {
    // Popular select de pacientes
    const pacientes = DB.get('pacientes') || [];
    const sel = document.getElementById('sessao-paciente');
    if (sel) {
      sel.innerHTML = '<option value="">Selecione o paciente</option>' +
        pacientes.filter(p => p.status !== 'concluido').map(p =>
          `<option value="${p.id}">${p.nome}</option>`
        ).join('');
    }
    renderSessoes();

    const busca = document.getElementById('busca-sessao');
    if (busca) busca.addEventListener('input', () => renderSessoes(busca.value));

    const form = document.getElementById('form-sessao');
    if (form) form.addEventListener('submit', salvarSessao);
  }

  if (page === 'acompanhamento') {
    // Popular select de check-in
    const pacientes = DB.get('pacientes') || [];
    const sel = document.getElementById('checkin-pac');
    if (sel) {
      sel.innerHTML = '<option value="">Selecione o paciente</option>' +
        pacientes.filter(p => p.status === 'ativo').map(p =>
          `<option value="${p.id}">${p.nome}</option>`
        ).join('');
    }

    renderAcompanhamento();

    const formCi = document.getElementById('form-checkin');
    if (formCi) formCi.addEventListener('submit', salvarCheckin);
  }
});
