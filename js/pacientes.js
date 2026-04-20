// ─── Pacientes Page ──────────────────────────────────

function renderPacientes(filtro = '') {
  const lista = DB.get('pacientes') || [];
  const filtrada = filtro
    ? lista.filter(p =>
        p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        p.queixa.toLowerCase().includes(filtro.toLowerCase())
      )
    : lista;

  const tbody = document.getElementById('pacientes-tbody');
  if (!tbody) return;

  if (filtrada.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">Nenhum paciente encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtrada.map(p => {
    const media = scoreMediaPaciente(p);
    const barClass = scoreColor(media);
    const semanaLabel = p.semana > 0 ? `Semana ${p.semana}/12` : 'Não iniciado';
    return `
      <tr>
        <td>
          <div class="avatar-group">
            <div class="avatar ${p.cor || 'sage'}">${p.avatar}</div>
            <div>
              <div class="avatar-group-name">${p.nome}</div>
              <div class="avatar-group-sub">${p.idade} anos · ${p.email}</div>
            </div>
          </div>
        </td>
        <td style="max-width:200px">
          <span style="font-size:.8rem;color:var(--muted)">${p.queixa}</span>
        </td>
        <td>${statusBadge(p.status)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;min-width:120px">
            <div class="score-bar-wrap" style="flex:1;min-width:60px">
              <div class="score-bar ${barClass}" style="width:${media * 10}%"></div>
            </div>
            <span style="font-size:.8rem;font-weight:500;color:var(--text)">${media > 0 ? media + '/10' : '—'}</span>
          </div>
        </td>
        <td><span class="text-sm text-muted">${semanaLabel}</span></td>
        <td><span class="text-sm">${p.sessoes} sessões</span></td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-outline" onclick="verPaciente('${p.id}')">Ver</button>
            <button class="btn btn-sm btn-primary" onclick="novaSessaoParaPaciente('${p.id}')">+ Sessão</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function verPaciente(id) {
  const pacientes = DB.get('pacientes') || [];
  const p = pacientes.find(x => x.id === id);
  if (!p) return;

  const sessoes = (DB.get('sessoes') || []).filter(s => s.pacienteId === id);
  const checkins = (DB.get('checkins') || []).filter(c => c.pacienteId === id);

  const media = scoreMediaPaciente(p);

  document.getElementById('modal-paciente-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      <div class="avatar ${p.cor}" style="width:52px;height:52px;font-size:1rem">${p.avatar}</div>
      <div>
        <h3 style="font-family:var(--font-display);font-size:1.2rem">${p.nome}</h3>
        <p class="text-muted text-sm">${p.idade} anos · ${p.whatsapp} · ${p.email}</p>
      </div>
      <div style="margin-left:auto">${statusBadge(p.status)}</div>
    </div>

    <div class="grid-3 mb-16">
      <div style="background:var(--cream);border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Sessões</div>
        <div style="font-family:var(--font-display);font-size:1.6rem">${p.sessoes}</div>
      </div>
      <div style="background:var(--cream);border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Semana</div>
        <div style="font-family:var(--font-display);font-size:1.6rem">${p.semana || 0}/12</div>
      </div>
      <div style="background:var(--cream);border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Score médio</div>
        <div style="font-family:var(--font-display);font-size:1.6rem;color:${media >= 7 ? 'var(--success)' : media >= 4 ? 'var(--gold)' : 'var(--danger)'}">${media > 0 ? media : '—'}</div>
      </div>
    </div>

    <div class="mb-16">
      <p class="text-xs text-muted mb-4">QUEIXA PRINCIPAL</p>
      <p style="font-size:.875rem;background:var(--cream);padding:12px;border-radius:8px">${p.queixa}</p>
    </div>

    ${p.historico ? `
    <div class="mb-16">
      <p class="text-xs text-muted mb-4">OBSERVAÇÕES DO TERAPEUTA</p>
      <p style="font-size:.875rem;background:var(--cream);padding:12px;border-radius:8px">${p.historico}</p>
    </div>` : ''}

    ${sessoes.length > 0 ? `
    <div class="mb-16">
      <p class="text-xs text-muted mb-8">ÚLTIMAS SESSÕES</p>
      ${sessoes.slice(-3).reverse().map(s => `
        <div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:.8rem;font-weight:500">${formatDate(s.data)}</span>
            ${evolucaoBadge(s.evolucao)}
          </div>
          <p style="font-size:.8rem;color:var(--muted)">${s.tecnica}</p>
          <p style="font-size:.8rem;margin-top:4px">${s.notas.substring(0, 100)}${s.notas.length > 100 ? '...' : ''}</p>
        </div>
      `).join('')}
    </div>` : ''}

    ${checkins.length > 0 ? `
    <div>
      <p class="text-xs text-muted mb-8">ÚLTIMOS CHECK-INS</p>
      ${checkins.slice(-3).reverse().map(c => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--cream);border-radius:8px;margin-bottom:6px">
          <span style="font-size:.8rem;color:var(--muted)">${formatDate(c.data)}</span>
          <div style="display:flex;gap:12px">
            <span style="font-size:.78rem">😰 ${c.ansiedade}/10</span>
            <span style="font-size:.78rem">😴 ${c.sono}/10</span>
            <span style="font-size:.78rem">😊 ${c.humor}/10</span>
          </div>
        </div>
      `).join('')}
    </div>` : ''}
  `;
  openModal('modal-paciente');
}

function novaSessaoParaPaciente(id) {
  const select = document.getElementById('sessao-paciente');
  if (select) { select.value = id; openModal('modal-sessao'); }
}

function salvarPaciente(e) {
  e.preventDefault();
  const pacientes = DB.get('pacientes') || [];
  const novoPaciente = {
    id: gerarId('p'),
    nome: document.getElementById('pac-nome').value,
    idade: parseInt(document.getElementById('pac-idade').value),
    whatsapp: document.getElementById('pac-whatsapp').value,
    email: document.getElementById('pac-email').value,
    queixa: document.getElementById('pac-queixa').value,
    status: 'aguardando',
    inicio: todayStr(),
    semana: 0,
    score: { ansiedade: 0, sono: 0, humor: 0 },
    sessoes: 0,
    avatar: iniciais(document.getElementById('pac-nome').value),
    cor: ['sage','bark','gold','info'][Math.floor(Math.random()*4)],
    historico: '',
  };
  pacientes.push(novoPaciente);
  DB.set('pacientes', pacientes);
  closeModal('modal-novo-paciente');
  renderPacientes();
  toast('Paciente cadastrado com sucesso!');
  e.target.reset();
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page !== 'pacientes') return;

  renderPacientes();

  const busca = document.getElementById('busca-paciente');
  if (busca) busca.addEventListener('input', () => renderPacientes(busca.value));

  const form = document.getElementById('form-paciente');
  if (form) form.addEventListener('submit', salvarPaciente);
});
