# 🌿 Sistema de Atendimento Terapêutico Online

Sistema completo de gestão terapêutica com integração WhatsApp, prontuário digital, acompanhamento de 3 meses e relatórios automáticos.

## 📋 Módulos

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão geral de pacientes, sessões e score emocional |
| **Pacientes** | Cadastro, fichas e histórico completo |
| **Sessões** | Registro de atendimentos e relatórios |
| **Acompanhamento** | Protocolo de 3 meses com check-ins automáticos |
| **Relatórios** | Score emocional e evolução com gráficos |
| **Agendamento** | Calendário de sessões integrado |

## 🚀 Como usar

```bash
git clone https://github.com/seu-usuario/terapia-online
cd terapia-online
# Abra index.html no navegador
```

## 🔧 Stack

- HTML5 + CSS3 + JavaScript puro (sem dependências)
- Chart.js para gráficos de evolução emocional
- LocalStorage para persistência de dados (demo)
- Design responsivo mobile-first

## 🔗 Integrações previstas

- WhatsApp Business API (via Zapier/Make)
- Google Calendar (agendamento)
- Typeform (ficha inicial)
- ManyChat / WATI (check-ins automáticos)
- Mercado Pago / Stripe (pagamentos)

## 📁 Estrutura

```
terapia-online/
├── index.html          # Dashboard principal
├── css/
│   └── style.css       # Estilos globais
├── js/
│   ├── app.js          # Lógica principal
│   ├── pacientes.js    # Gestão de pacientes
│   ├── sessoes.js      # Registro de sessões
│   └── relatorios.js   # Gráficos e relatórios
└── pages/
    ├── pacientes.html
    ├── sessoes.html
    ├── acompanhamento.html
    └── relatorios.html
```

## 📄 Licença

MIT — use livremente para seu consultório.
