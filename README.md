# 🌿 Sistema de Atendimento Terapêutico Online

Sistema completo com **autenticação**, banco **SQLite3**, prontuário digital, protocolo de 3 meses e relatórios.

## 🚀 Iniciar

```bash
# Mac/Linux
bash iniciar.sh

# Windows
iniciar.bat

# Manual
pip install flask werkzeug
python backend/server.py
```

Acesse **http://localhost:5000**

## 🔐 Login de demonstração

| Campo  | Valor           |
|--------|-----------------|
| E-mail | ana@terapia.com |
| Senha  | senha123        |

## 🗄️ Banco SQLite3

Arquivo: `backend/terapia.db` (criado automaticamente)

Tabelas: `usuarios`, `sessoes`, `auditoria`

Senhas com hash **PBKDF2-SHA256** — nunca armazenadas em texto plano.

## 🔗 API

| Método | Rota                        | Descrição              |
|--------|-----------------------------|------------------------|
| POST   | `/api/auth/cadastro`        | Criar conta            |
| POST   | `/api/auth/login`           | Autenticar             |
| POST   | `/api/auth/logout`          | Encerrar sessão        |
| GET    | `/api/auth/me`              | Usuário logado         |
| POST   | `/api/auth/verificar-email` | Checar disponibilidade |
| PUT    | `/api/usuarios/perfil`      | Atualizar perfil       |
| POST   | `/api/usuarios/trocar-senha`| Trocar senha           |

## 📁 Estrutura

```
terapia-online/
├── backend/
│   ├── server.py       ← Flask + SQLite3
│   ├── terapia.db      ← Banco (gerado automaticamente)
│   └── requirements.txt
├── css/style.css
├── js/{app,pacientes,sessoes,relatorios,mobile}.js
├── pages/{pacientes,sessoes,acompanhamento,relatorios,ficha}.html
├── index.html          ← Dashboard
├── login.html          ← Login
├── cadastro.html       ← Cadastro 3 etapas
├── iniciar.sh          ← Mac/Linux
└── iniciar.bat         ← Windows
```

## Stack

Python 3 + Flask · SQLite3 · HTML/CSS/JS puro · Chart.js · Mobile-first

## Licença

MIT
