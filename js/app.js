// ─── App State ───────────────────────────────────────
const APP = {
  version: '1.0.0',
  therapist: { name: 'Dra. Ana Lima', initials: 'AL', specialty: 'Terapeuta Holística' },
  currentPage: 'dashboard',
};

// ─── Demo Data ────────────────────────────────────────
const DEMO_PACIENTES = [
  {
    id: 'p1', nome: 'Carla Mendes', idade: 34, whatsapp: '(85) 99101-2233',
    email: 'carla@email.com', queixa: 'Ansiedade e insônia frequente',
    status: 'ativo', inicio: '2025-01-15', semana: 8,
    score: { ansiedade: 3, sono: 6, humor: 7 },
    sessoes: 8, avatar: 'CM', cor: 'sage',
    historico: 'Relata melhora significativa nos ataques de ansiedade após auriculoterapia.'
  },
  {
    id: 'p2', nome: 'Bruno Alves', idade: 28, whatsapp: '(85) 98877-6655',
    email: 'bruno@email.com', queixa: 'Estresse pós-pandemia e burnout',
    status: 'ativo', inicio: '2025-02-01', semana: 5,
    score: { ansiedade: 5, sono: 5, humor: 6 },
    sessoes: 5, avatar: 'BA', cor: 'bark',
    historico: 'Iniciou protocolo de respiração. Progresso moderado.'
  },
  {
    id: 'p3', nome: 'Fernanda Costa', idade: 42, whatsapp: '(85) 97766-4433',
    email: 'fer@email.com', queixa: 'Luto e depressão leve',
    status: 'ativo', inicio: '2025-02-15', semana: 3,
    score: { ansiedade: 6, sono: 4, humor: 4 },
    sessoes: 3, avatar: 'FC', cor: 'gold',
    historico: 'Fase inicial. Muito resistente, mas abrindo espaço na última sessão.'
  },
  {
    id: 'p4', nome: 'Ricardo Souza', idade: 51, whatsapp: '(85) 96655-3322',
    email: 'ri@email.com', queixa: 'Dores crônicas e tensão muscular',
    status: 'concluido', inicio: '2024-10-01', semana: 12,
    score: { ansiedade: 8, sono: 8, humor: 9 },
    sessoes: 12, avatar: 'RS', cor: 'info',
    historico: 'Protocolo de 3 meses concluído com sucesso. Relatório final entregue.'
  },
  {
    id: 'p5', nome: 'Juliana Ferreira', idade: 29, whatsapp: '(85) 95544-2211',
    email: 'ju@email.com', queixa: 'Fobia social e ansiedade de desempenho',
    status: 'aguardando', inicio: '2025-03-10', semana: 0,
    score: { ansiedade: 0, sono: 0, humor: 0 },
    sessoes: 0, avatar: 'JF', cor: 'sage',
    historico: 'Ficha inicial recebida. Aguardando primeira sessão.'
  },
];

const DEMO_SESSOES = [
  {
    id: 's1', pacienteId: 'p1', data: '2025-03-10', duracao: 60,
    tecnica: 'Auriculoterapia + Escuta ativa',
    scorePre: { ansiedade: 7, humor: 4 }, scorePos: { ansiedade: 3, humor: 7 },
    notas: 'Paciente chegou muito agitada. Após auriculoterapia relaxou significativamente. Identificamos gatilho: pressão no trabalho.',
    recomendacoes: 'Exercício de respiração 4-7-8 antes de reuniões. Aromaterapia com lavanda.',
    evolucao: 'Boa'
  },
  {
    id: 's2', pacienteId: 'p2', data: '2025-03-08', duracao: 50,
    tecnica: 'Técnica de Respiração + EFT',
    scorePre: { ansiedade: 8, humor: 4 }, scorePos: { ansiedade: 5, humor: 6 },
    notas: 'Bruno relatou semana difícil no trabalho. Aplicamos EFT para memórias de burnout.',
    recomendacoes: 'Diário de gratidão. Pausas de 5min a cada 2h no trabalho.',
    evolucao: 'Moderada'
  },
  {
    id: 's3', pacienteId: 'p3', data: '2025-03-07', duracao: 70,
    tecnica: 'Escuta ativa + Aromaterapia',
    scorePre: { ansiedade: 8, humor: 3 }, scorePos: { ansiedade: 6, humor: 5 },
    notas: 'Primeira vez que Fernanda falou abertamente sobre o luto. Sessão emocionalmente intensa.',
    recomendacoes: 'Permitir o processo. Evitar forçar positividade. Ritual de despedida simbólico.',
    evolucao: 'Em processo'
  },
];

const DEMO_CHECKINS = [
  { id: 'c1', pacienteId: 'p1', data: '2025-03-12', ansiedade: 3, sono: 7, humor: 8, nota: 'Me senti bem essa semana!' },
  { id: 'c2', pacienteId: 'p2', data: '2025-03-11', ansiedade: 6, sono: 5, humor: 5, nota: 'Dificuldade em aplicar as técnicas no trabalho.' },
  { id: 'c3', pacienteId: 'p1', data: '2025-03-05', ansiedade: 5, sono: 5, humor: 6, nota: 'Semana normal' },
];

// ─── Storage ──────────────────────────────────────────
const DB = {
  get(key) {
    try {
      const raw = localStorage.getItem('terapia_' + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem('terapia_' + key, JSON.stringify(val)); } catch {}
  },
  init() {
    if (!this.get('pacientes')) this.set('pacientes', DEMO_PACIENTES);
    if (!this.get('sessoes'))   this.set('sessoes', DEMO_SESSOES);
    if (!this.get('checkins'))  this.set('checkins', DEMO_CHECKINS);
  }
};

// ─── Helpers ──────────────────────────────────────────
function scoreColor(v) {
  if (v <= 3) return 'low';
  if (v <= 6) return 'mid';
  return 'high';
}

function scoreMediaPaciente(p) {
  if (!p.score) return 0;
  const vals = Object.values(p.score).filter(v => v > 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

function statusBadge(s) {
  const map = {
    ativo: '<span class="badge badge-green">Ativo</span>',
    concluido: '<span class="badge badge-sage">Concluído</span>',
    aguardando: '<span class="badge badge-gold">Aguardando</span>',
    pausado: '<span class="badge badge-muted">Pausado</span>',
  };
  return map[s] || '';
}

function evolucaoBadge(e) {
  const map = {
    'Boa': '<span class="badge badge-green">Boa</span>',
    'Moderada': '<span class="badge badge-gold">Moderada</span>',
    'Em processo': '<span class="badge badge-bark">Em processo</span>',
    'Difícil': '<span class="badge badge-red">Difícil</span>',
  };
  return map[e] || '<span class="badge badge-muted">' + e + '</span>';
}

function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function gerarId(prefix) {
  return prefix + Date.now().toString(36);
}

function iniciais(nome) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Notification Toast ───────────────────────────────
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:999;
    background:${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)'};
    color:#fff;padding:12px 20px;border-radius:10px;font-size:.875rem;
    font-family:var(--font-body);font-weight:500;
    box-shadow:0 4px 20px rgba(0,0,0,.18);
    animation:slideUp .25s ease;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ─── Modal Helpers ────────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

// ─── Tabs ─────────────────────────────────────────────
function initTabs(container) {
  const tabs   = container.querySelectorAll('.tab');
  const panels = container.querySelectorAll('.tab-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ─── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  document.querySelectorAll('[data-tabs]').forEach(c => initTabs(c));
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('open');
    });
  });
});

// CSS keyframe for toast
const style = document.createElement('style');
style.textContent = `@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`;
document.head.appendChild(style);
