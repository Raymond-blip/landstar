import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'local.db')

def list_applicants():
    if not os.path.exists(DB_PATH):
        print('Database not found at', DB_PATH)
        return
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT id, email, data, created_at FROM applicants ORDER BY id DESC')
    rows = cur.fetchall()
    if not rows:
        print('No applicants found.')
        return
    for r in rows:
        aid, email, data_text, created_at = r
        try:
            data = json.loads(data_text) if data_text else {}
        except Exception:
            data = {'raw': data_text}
        print('---')
        print('id:', aid)
        print('email:', email)
        print('created_at:', created_at)
        print('data:')
        for k, v in data.items():
            print('  ', k, ':', v)
    conn.close()

if __name__ == '__main__':
    list_applicants()
