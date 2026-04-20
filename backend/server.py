"""
Servidor Flask — Sistema de Atendimento Terapêutico Online
Autenticação com SQLite3, sessões seguras, hash bcrypt-like via werkzeug
"""

import sqlite3
import os
import re
import json
import secrets
from datetime import datetime, timedelta
from functools import wraps

from flask import (Flask, request, jsonify, session,
                   send_from_directory, redirect, url_for)
from werkzeug.security import generate_password_hash, check_password_hash

# ─── Config ──────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
FRONTEND    = os.path.join(BASE_DIR, '..')          # pasta raiz do projeto
DB_PATH     = os.path.join(BASE_DIR, 'terapia.db')

app = Flask(__name__, static_folder=FRONTEND)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# ─── Banco de Dados ───────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    """Cria todas as tabelas se não existirem."""
    with get_db() as conn:
        conn.executescript("""
        -- Tabela de usuários (terapeutas)
        CREATE TABLE IF NOT EXISTS usuarios (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nome        TEXT    NOT NULL,
            email       TEXT    NOT NULL UNIQUE,
            senha_hash  TEXT    NOT NULL,
            especialidade TEXT  DEFAULT '',
            crp         TEXT    DEFAULT '',
            telefone    TEXT    DEFAULT '',
            avatar_ini  TEXT    DEFAULT '',
            plano       TEXT    DEFAULT 'gratuito',
            ativo       INTEGER DEFAULT 1,
            criado_em   TEXT    DEFAULT (datetime('now','localtime')),
            ultimo_acesso TEXT  DEFAULT NULL
        );

        -- Tabela de tokens de sessão (refresh tokens)
        CREATE TABLE IF NOT EXISTS sessoes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            token       TEXT    NOT NULL UNIQUE,
            ip          TEXT    DEFAULT '',
            user_agent  TEXT    DEFAULT '',
            criado_em   TEXT    DEFAULT (datetime('now','localtime')),
            expira_em   TEXT    NOT NULL
        );

        -- Tabela de log de auditoria
        CREATE TABLE IF NOT EXISTS auditoria (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id  INTEGER REFERENCES usuarios(id),
            acao        TEXT    NOT NULL,
            detalhes    TEXT    DEFAULT '',
            ip          TEXT    DEFAULT '',
            criado_em   TEXT    DEFAULT (datetime('now','localtime'))
        );

        -- Índices de performance
        CREATE INDEX IF NOT EXISTS idx_usuarios_email  ON usuarios(email);
        CREATE INDEX IF NOT EXISTS idx_sessoes_token   ON sessoes(token);
        CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
        """)
    print(f"[DB] Banco inicializado em: {DB_PATH}")

# ─── Helpers ──────────────────────────────────────────────────────────────
def log_auditoria(usuario_id, acao, detalhes=''):
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO auditoria (usuario_id, acao, detalhes, ip) VALUES (?,?,?,?)",
                (usuario_id, acao, detalhes, request.remote_addr)
            )
    except Exception:
        pass

def validar_email(email: str) -> bool:
    return bool(re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email))

def iniciais(nome: str) -> str:
    partes = nome.strip().split()
    if len(partes) >= 2:
        return (partes[0][0] + partes[-1][0]).upper()
    return nome[:2].upper()

def usuario_para_dict(row) -> dict:
    return {
        'id':           row['id'],
        'nome':         row['nome'],
        'email':        row['email'],
        'especialidade':row['especialidade'],
        'crp':          row['crp'],
        'telefone':     row['telefone'],
        'avatar_ini':   row['avatar_ini'],
        'plano':        row['plano'],
        'criado_em':    row['criado_em'],
    }

# ─── Decorador de autenticação ────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'usuario_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'erro': 'Não autenticado'}), 401
            return redirect('/login.html')
        return f(*args, **kwargs)
    return decorated

# ─── Rotas da API ─────────────────────────────────────────────────────────

@app.route('/api/auth/cadastro', methods=['POST'])
def cadastro():
    """Cria nova conta de terapeuta."""
    data = request.get_json(silent=True) or {}

    nome        = (data.get('nome', '') or '').strip()
    email       = (data.get('email', '') or '').strip().lower()
    senha       = data.get('senha', '') or ''
    especialidade = (data.get('especialidade', '') or '').strip()
    crp         = (data.get('crp', '') or '').strip()
    telefone    = (data.get('telefone', '') or '').strip()

    # Validações
    erros = {}
    if len(nome) < 3:
        erros['nome'] = 'Nome deve ter pelo menos 3 caracteres.'
    if not validar_email(email):
        erros['email'] = 'E-mail inválido.'
    if len(senha) < 8:
        erros['senha'] = 'Senha deve ter pelo menos 8 caracteres.'
    if not any(c.isdigit() for c in senha):
        erros['senha'] = erros.get('senha', '') or 'Senha deve conter pelo menos 1 número.'

    if erros:
        return jsonify({'erro': 'Dados inválidos', 'campos': erros}), 422

    senha_hash  = generate_password_hash(senha, method='pbkdf2:sha256', salt_length=16)
    avatar_ini  = iniciais(nome)

    try:
        with get_db() as conn:
            conn.execute(
                """INSERT INTO usuarios
                   (nome, email, senha_hash, especialidade, crp, telefone, avatar_ini)
                   VALUES (?,?,?,?,?,?,?)""",
                (nome, email, senha_hash, especialidade, crp, telefone, avatar_ini)
            )
            usuario_id = conn.execute(
                "SELECT id FROM usuarios WHERE email = ?", (email,)
            ).fetchone()['id']

        log_auditoria(usuario_id, 'CADASTRO', f'Novo cadastro: {email}')

        session.permanent = True
        session['usuario_id']   = usuario_id
        session['usuario_nome'] = nome
        session['usuario_email'] = email

        return jsonify({
            'mensagem': 'Conta criada com sucesso!',
            'usuario': {
                'id': usuario_id, 'nome': nome,
                'email': email, 'avatar_ini': avatar_ini,
            }
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({'erro': 'E-mail já cadastrado.', 'campos': {'email': 'Este e-mail já está em uso.'}}), 409

    except Exception as e:
        return jsonify({'erro': f'Erro interno: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Autentica terapeuta existente."""
    data  = request.get_json(silent=True) or {}
    email = (data.get('email', '') or '').strip().lower()
    senha = data.get('senha', '') or ''

    if not email or not senha:
        return jsonify({'erro': 'E-mail e senha são obrigatórios.'}), 400

    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM usuarios WHERE email = ? AND ativo = 1", (email,)
        ).fetchone()

    if not row or not check_password_hash(row['senha_hash'], senha):
        return jsonify({'erro': 'E-mail ou senha incorretos.'}), 401

    # Atualiza último acesso
    with get_db() as conn:
        conn.execute(
            "UPDATE usuarios SET ultimo_acesso = datetime('now','localtime') WHERE id = ?",
            (row['id'],)
        )

    log_auditoria(row['id'], 'LOGIN', f'Login: {email}')

    session.permanent = True
    session['usuario_id']    = row['id']
    session['usuario_nome']  = row['nome']
    session['usuario_email'] = row['email']

    return jsonify({
        'mensagem': 'Login realizado!',
        'usuario': usuario_para_dict(row)
    })


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    uid = session.get('usuario_id')
    if uid:
        log_auditoria(uid, 'LOGOUT', '')
    session.clear()
    return jsonify({'mensagem': 'Logout realizado.'})


@app.route('/api/auth/me', methods=['GET'])
@login_required
def me():
    """Retorna dados do usuário autenticado."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM usuarios WHERE id = ?", (session['usuario_id'],)
        ).fetchone()
    if not row:
        session.clear()
        return jsonify({'erro': 'Usuário não encontrado.'}), 404
    return jsonify({'usuario': usuario_para_dict(row)})


@app.route('/api/auth/verificar-email', methods=['POST'])
def verificar_email():
    """Verifica se e-mail já está em uso (para validação em tempo real)."""
    data  = request.get_json(silent=True) or {}
    email = (data.get('email', '') or '').strip().lower()
    with get_db() as conn:
        existe = conn.execute(
            "SELECT 1 FROM usuarios WHERE email = ?", (email,)
        ).fetchone()
    return jsonify({'disponivel': not bool(existe)})


@app.route('/api/usuarios/perfil', methods=['PUT'])
@login_required
def atualizar_perfil():
    """Atualiza dados do perfil do terapeuta."""
    data = request.get_json(silent=True) or {}
    uid  = session['usuario_id']

    campos_permitidos = ['nome', 'especialidade', 'crp', 'telefone']
    updates = {k: v.strip() for k, v in data.items() if k in campos_permitidos and v}

    if not updates:
        return jsonify({'erro': 'Nenhum campo para atualizar.'}), 400

    set_clause = ', '.join(f'{k} = ?' for k in updates)
    values     = list(updates.values()) + [uid]

    with get_db() as conn:
        conn.execute(f"UPDATE usuarios SET {set_clause} WHERE id = ?", values)

    log_auditoria(uid, 'ATUALIZAR_PERFIL', str(list(updates.keys())))
    return jsonify({'mensagem': 'Perfil atualizado.'})


@app.route('/api/usuarios/trocar-senha', methods=['POST'])
@login_required
def trocar_senha():
    """Troca a senha do usuário autenticado."""
    data         = request.get_json(silent=True) or {}
    senha_atual  = data.get('senha_atual', '')
    senha_nova   = data.get('senha_nova', '')

    if len(senha_nova) < 8 or not any(c.isdigit() for c in senha_nova):
        return jsonify({'erro': 'Nova senha deve ter ≥ 8 caracteres e pelo menos 1 número.'}), 422

    uid = session['usuario_id']
    with get_db() as conn:
        row = conn.execute("SELECT senha_hash FROM usuarios WHERE id = ?", (uid,)).fetchone()

    if not row or not check_password_hash(row['senha_hash'], senha_atual):
        return jsonify({'erro': 'Senha atual incorreta.'}), 401

    novo_hash = generate_password_hash(senha_nova, method='pbkdf2:sha256', salt_length=16)
    with get_db() as conn:
        conn.execute("UPDATE usuarios SET senha_hash = ? WHERE id = ?", (novo_hash, uid))

    log_auditoria(uid, 'TROCAR_SENHA', '')
    return jsonify({'mensagem': 'Senha alterada com sucesso.'})


@app.route('/api/admin/usuarios', methods=['GET'])
@login_required
def listar_usuarios():
    """Lista todos os usuários (somente para fins de debug/admin)."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, nome, email, especialidade, plano, criado_em, ultimo_acesso FROM usuarios ORDER BY criado_em DESC"
        ).fetchall()
    return jsonify({'usuarios': [dict(r) for r in rows]})


# ─── Servir Frontend ──────────────────────────────────────────────────────

@app.route('/')
def index():
    if 'usuario_id' not in session:
        return send_from_directory(FRONTEND, 'login.html')
    return send_from_directory(FRONTEND, 'index.html')

@app.route('/login.html')
def login_page():
    return send_from_directory(FRONTEND, 'login.html')

@app.route('/cadastro.html')
def cadastro_page():
    return send_from_directory(FRONTEND, 'cadastro.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(FRONTEND, filename)


# ─── CORS manual (sem flask-cors) ─────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin']  = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 204


# ─── Main ─────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print("\n🌿 Sistema Terapêutico Online")
    print("=" * 40)
    print(f"  Banco: {DB_PATH}")
    print(f"  URL:   http://localhost:5000")
    print("=" * 40 + "\n")
    app.run(debug=True, port=5000, host='0.0.0.0')
