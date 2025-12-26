from flask import Flask, request, jsonify, send_from_directory, Response
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime
import json
import io
import csv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'local.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS applicants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            data TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    # seed a demo user if not exists
    cur.execute('SELECT id FROM users WHERE email = ?', ('demo@local.test',))
    if not cur.fetchone():
        cur.execute('INSERT INTO users (email, password_hash, name, created_at) VALUES (?,?,?,?)', (
            'demo@local.test', generate_password_hash('Password123'), 'Demo User', datetime.utcnow().isoformat()
        ))
    conn.commit()
    conn.close()

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/api/applicant', methods=['POST'])
def applicant():
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({'ok': False, 'error': 'Invalid JSON'}), 400

    email = (data.get('email') or '').strip() or None
    # Require Gmail address for signup (assessment responses are sent via Gmail)
    if email and not email.lower().endswith('@gmail.com'):
        return jsonify({'ok': False, 'error': 'Please provide a Gmail address (example@gmail.com)'}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO applicants (email, data, created_at) VALUES (?,?,?)', (
        email, json_dump(data), datetime.utcnow().isoformat()
    ))
    conn.commit()
    aid = cur.lastrowid

    # If signup included a password, create a user account (if email provided)
    user_created = False
    user_exists = False
    password = data.get('password')
    if email and password:
        try:
            cur.execute('INSERT INTO users (email, password_hash, name, created_at) VALUES (?,?,?,?)', (
                email, generate_password_hash(password), data.get('firstName') or None, datetime.utcnow().isoformat()
            ))
            conn.commit()
            user_created = True
        except sqlite3.IntegrityError:
            # user with that email already exists
            user_exists = True

    conn.close()
    return jsonify({'ok': True, 'id': aid, 'user_created': user_created, 'user_exists': user_exists})

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({'ok': False, 'error': 'Invalid JSON'}), 400

    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'ok': False, 'error': 'Missing credentials'}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE email = ?', (email,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return jsonify({'ok': False, 'error': 'Invalid email or password'}), 401

    if check_password_hash(row['password_hash'], password):
        user = {'id': row['id'], 'email': row['email'], 'name': row['name']}
        return jsonify({'ok': True, 'token': 'mock-token', 'user': user})
    else:
        return jsonify({'ok': False, 'error': 'Invalid email or password'}), 401

@app.route('/', defaults={'path': 'index.htm'})
@app.route('/<path:path>')
def static_proxy(path):
    # Serve files from the workspace root
    full = os.path.join(BASE_DIR, path)
    if os.path.isdir(full):
        # if directory, serve index.htm inside
        candidate = os.path.join(full, 'index.htm')
        if os.path.exists(candidate):
            full = candidate
        else:
            full = os.path.join(BASE_DIR, 'index.htm')

    if os.path.exists(full):
        # If serving an HTML file, read and clean it before returning
        if full.lower().endswith(('.htm', '.html')):
            with open(full, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            cleaned = clean_html(content)
            return Response(cleaned, mimetype='text/html')
        return send_from_directory(BASE_DIR, path)

    # fallback to index
    index_full = os.path.join(BASE_DIR, 'index.htm')
    with open(index_full, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    return Response(clean_html(content), mimetype='text/html')

def json_dump(obj):
    import json
    return json.dumps(obj, ensure_ascii=False)


def clean_html(content: str) -> str:
    """Remove known analytics and tracking script blocks and noscript iframes.

    This strips Google Tag Manager snippets, pi/pd.js includes, and any
    inline script blocks containing those hostnames/identifiers.
    """
    import re

    # Remove script tags that reference googletagmanager, pd.js, engage.werner, or piHostname/piAId
    patterns = [
        r"<script[\s\S]*?googletagmanager\.com[\s\S]*?<\/script>",
        r"<script[\s\S]*?pd\.js[\s\S]*?<\/script>",
        r"<script[\s\S]*?engage\.werner\.com[\s\S]*?<\/script>",
        r"<script[\s\S]*?piAId[\s\S]*?<\/script>",
        r"<script[\s\S]*?piHostname[\s\S]*?<\/script>",
    ]

    for p in patterns:
        content = re.sub(p, '', content, flags=re.IGNORECASE | re.DOTALL)

    # Remove noscript iframes used by GTM
    content = re.sub(r"<noscript>[\s\S]*?googletagmanager\.com/ns\.html[\s\S]*?<\/noscript>", '', content, flags=re.IGNORECASE | re.DOTALL)
    content = re.sub(r"<iframe[^>]*googletagmanager\.com[^>]*>[\s\S]*?<\/iframe>", '', content, flags=re.IGNORECASE | re.DOTALL)

    return content


@app.route('/api/applicants', methods=['GET'])
def list_applicants():
    gmail_only = request.args.get('gmail_only', '').lower() in ('1', 'true', 'yes')
    fmt = request.args.get('format', '').lower()
    conn = get_db()
    cur = conn.cursor()
    rows = cur.execute('SELECT id,email,data,created_at FROM applicants ORDER BY created_at DESC').fetchall()
    conn.close()

    results = []
    for r in rows:
        try:
            data_obj = json.loads(r['data']) if r['data'] else {}
        except Exception:
            data_obj = r['data']
        results.append({'id': r['id'], 'email': r['email'], 'data': data_obj, 'created_at': r['created_at']})

    if gmail_only:
        results = [it for it in results if it['email'] and it['email'].lower().endswith('@gmail.com')]

    if fmt == 'csv':
        si = io.StringIO()
        writer = csv.writer(si)
        writer.writerow(['id', 'email', 'created_at', 'data'])
        for it in results:
            writer.writerow([it['id'], it['email'] or '', it['created_at'] or '', json.dumps(it['data'], ensure_ascii=False)])
        output = si.getvalue()
        return Response(output, mimetype='text/csv', headers={'Content-Disposition': 'attachment; filename="applicants.csv"'})

    return jsonify({'ok': True, 'count': len(results), 'results': results})

if __name__ == '__main__':
    init_db()
    print('Starting local Flask server on http://127.0.0.1:8080')
    app.run(host='127.0.0.1', port=8080)
