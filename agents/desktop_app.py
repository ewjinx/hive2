"""
Hive Node Manager — Desktop Application
Serves a local web UI via Flask and opens it in a pywebview window.
System tray icon with pystray for background operation.
"""

import os
import sys
import threading
import time
import requests
import psutil
import pystray
from PIL import Image, ImageDraw
import json
from flask import Flask, send_from_directory, jsonify, request as flask_request, Response

import config
from main import manager

# ─── Flask App ────────────────────────────────────────────────

app = Flask(__name__, static_folder=None)
app.config['JSON_SORT_KEYS'] = False

UI_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui')
PORT = 5173


# ── Static UI files ──────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(UI_DIR, 'index.html')


@app.route('/ui/<path:filename>')
def ui_static(filename):
    return send_from_directory(UI_DIR, filename)


# ── API: Status ──────────────────────────────────────────────

@app.route('/api/status')
def api_status():
    return jsonify({
        'logged_in': bool(config.TOKEN),
        'agents_count': len(config.AGENTS),
    })


# ── API: System Info ─────────────────────────────────────────

@app.route('/api/system-info')
def api_system_info():
    return jsonify({
        'max_cpu': psutil.cpu_count(),
        'max_ram': round(psutil.virtual_memory().total / (1024**3), 1),
    })


# ── API: Login ───────────────────────────────────────────────

@app.route('/api/login', methods=['POST'])
def api_login():
    data = flask_request.get_json(silent=True) or {}
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({'ok': False, 'error': 'Email and password required'}), 400

    try:
        r = requests.post(
            f"{config.API_URL}/login/access-token",
            data={"username": email, "password": password},
            timeout=10,
        )
        if r.status_code == 200:
            token = r.json().get("access_token")
            config.save_config(token=token)

            # Fetch agents assigned to this user
            fetch_r = requests.get(
                f"{config.API_URL}/agents",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            if fetch_r.status_code == 200:
                config.save_config(agents=fetch_r.json())

            manager.start()
            return jsonify({'ok': True})
        else:
            return jsonify({'ok': False, 'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'ok': False, 'error': f'Connection error: {e}'}), 500


# ── API: Logout ──────────────────────────────────────────────

@app.route('/api/logout', methods=['POST'])
def api_logout():
    manager.stop()
    config.save_config(token="", agents=[])
    return jsonify({'ok': True})


# ── API: List Nodes ──────────────────────────────────────────

@app.route('/api/nodes')
def api_list_nodes():
    nodes = []
    for agent in config.AGENTS:
        aid = agent.get('id')
        live_status = manager.statuses.get(aid, 'Idle') if agent.get('status') != 'offline' else 'Offline'
        nodes.append({
            'id': aid,
            'name': agent.get('name', 'Unknown'),
            'status': agent.get('status', 'offline'),
            'cpu_cores': agent.get('cpu_cores', 1),
            'ram_gb': agent.get('ram_gb', 1.0),
            'live_status': live_status,
        })
    return jsonify(nodes)


# ── API: SSE Stream (replaces polling) ───────────────────────

@app.route('/api/nodes/stream')
def api_nodes_stream():
    """Server-Sent Events endpoint — pushes node updates only when data changes."""
    def generate():
        last_payload = None
        while True:
            nodes = []
            for agent in config.AGENTS:
                aid = agent.get('id')
                live_status = manager.statuses.get(aid, 'Idle') if agent.get('status') != 'offline' else 'Offline'
                nodes.append({
                    'id': aid,
                    'name': agent.get('name', 'Unknown'),
                    'status': agent.get('status', 'offline'),
                    'cpu_cores': agent.get('cpu_cores', 1),
                    'ram_gb': agent.get('ram_gb', 1.0),
                    'live_status': live_status,
                })
            payload = json.dumps(nodes, sort_keys=True)
            # Only send if data actually changed
            if payload != last_payload:
                last_payload = payload
                yield f"data: {payload}\n\n"
            time.sleep(2)

    return Response(generate(), mimetype='text/event-stream', headers={
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
    })


# ── API: Add Node ────────────────────────────────────────────

@app.route('/api/nodes', methods=['POST'])
def api_add_node():
    if not config.TOKEN:
        return jsonify({'error': 'Not logged in'}), 401

    max_cpu = psutil.cpu_count()
    max_ram = round(psutil.virtual_memory().total / (1024**3), 1)

    payload = {
        "name": f"Node-{len(config.AGENTS) + 1}",
        "cpu_cores": max(1, max_cpu - 1),
        "ram_gb": max(1.0, max_ram / 2),
        "status": "idle",
    }

    headers = {"Authorization": f"Bearer {config.TOKEN}"}

    try:
        r = requests.post(f"{config.API_URL}/agents", json=payload, headers=headers, timeout=10)
        if r.status_code == 200:
            agent = r.json()
            config.AGENTS.append(agent)
            config.save_config(agents=config.AGENTS)
            return jsonify({'ok': True, 'agent': agent})
        else:
            return jsonify({'error': f'Server error: {r.text}'}), r.status_code
    except Exception as e:
        return jsonify({'error': f'Connection error: {e}'}), 500


# ── API: Update Node Settings ────────────────────────────────

@app.route('/api/nodes/<node_id>', methods=['PATCH'])
def api_update_node(node_id):
    data = flask_request.get_json(silent=True) or {}
    headers = {"Authorization": f"Bearer {config.TOKEN}"}

    for agent in config.AGENTS:
        if str(agent.get('id')) == str(node_id):
            if 'name' in data:
                agent['name'] = data['name']
            if 'cpu_cores' in data:
                agent['cpu_cores'] = int(data['cpu_cores'])
            if 'ram_gb' in data:
                agent['ram_gb'] = round(float(data['ram_gb']), 1)

            config.save_config(agents=config.AGENTS)

            try:
                update = {k: v for k, v in data.items() if k in ('name', 'cpu_cores', 'ram_gb')}
                if 'cpu_cores' in update:
                    update['cpu_cores'] = int(update['cpu_cores'])
                if 'ram_gb' in update:
                    update['ram_gb'] = round(float(update['ram_gb']), 1)
                requests.patch(f"{config.API_URL}/agents/{node_id}", json=update, headers=headers, timeout=10)
            except:
                pass

            return jsonify({'ok': True})

    return jsonify({'error': 'Node not found'}), 404


# ── API: Delete Node ─────────────────────────────────────────

@app.route('/api/nodes/<node_id>', methods=['DELETE'])
def api_delete_node(node_id):
    headers = {"Authorization": f"Bearer {config.TOKEN}"}

    for i, agent in enumerate(config.AGENTS):
        if str(agent.get('id')) == str(node_id):
            config.AGENTS.pop(i)
            config.save_config(agents=config.AGENTS)

            try:
                requests.delete(f"{config.API_URL}/agents/{node_id}", headers=headers, timeout=10)
            except:
                pass

            return jsonify({'ok': True})

    return jsonify({'error': 'Node not found'}), 404


# ── API: Toggle Node Power ───────────────────────────────────

@app.route('/api/nodes/<node_id>/toggle', methods=['POST'])
def api_toggle_node(node_id):
    headers = {"Authorization": f"Bearer {config.TOKEN}"}

    for agent in config.AGENTS:
        if str(agent.get('id')) == str(node_id):
            new_status = "idle" if agent.get("status") == "offline" else "offline"
            agent["status"] = new_status
            config.save_config(agents=config.AGENTS)

            try:
                requests.patch(
                    f"{config.API_URL}/agents/{node_id}",
                    json={"status": new_status},
                    headers=headers,
                    timeout=10,
                )
            except:
                pass

            return jsonify({'ok': True, 'status': new_status})

    return jsonify({'error': 'Node not found'}), 404


# ─── System Tray ──────────────────────────────────────────────

class TrayManager:
    def __init__(self):
        self.icon = None
        self.icon_state = "offline"
        self.rotation = 0
        self.running = True

    def create_image(self, state, rotation=0):
        color = "red"
        if state == "running":
            color = "orange"
        elif state == "idle":
            color = "#3CCD71"

        image = Image.new('RGBA', (64, 64), (255, 255, 255, 0))
        dc = ImageDraw.Draw(image)
        dc.ellipse((8, 8, 56, 56), fill=color, outline="black")

        if state == "running":
            dc.pieslice((16, 16, 48, 48), start=rotation, end=rotation + 270, fill="#cc5500")

        return image

    def show_window(self, icon=None, item=None):
        try:
            import webbrowser
            webbrowser.open(f"http://localhost:{PORT}")
        except:
            pass

    def stop_app(self, icon=None, item=None):
        self.running = False
        manager.stop()
        if self.icon:
            self.icon.stop()
        os._exit(0)

    def update_loop(self):
        while self.running:
            if config.TOKEN:
                is_run = manager.is_any_running()
                new_state = "running" if is_run else "idle"
            else:
                new_state = "offline"

            if new_state == "running":
                self.rotation = (self.rotation + 30) % 360

            if self.icon_state != new_state or new_state == "running":
                self.icon_state = new_state
                if self.icon:
                    self.icon.icon = self.create_image(new_state, self.rotation)
                    self.icon.title = f"Hive Node: {new_state.capitalize()}"

            time.sleep(0.5)

    def run(self):
        menu = pystray.Menu(
            pystray.MenuItem("Open Dashboard", self.show_window, default=True),
            pystray.MenuItem("Exit", self.stop_app),
        )
        self.icon = pystray.Icon("HiveAgent", self.create_image("offline"), "Hive Node", menu)

        # Start update loop in background
        threading.Thread(target=self.update_loop, daemon=True).start()

        self.icon.run()


# ─── Main ─────────────────────────────────────────────────────

def run_flask():
    """Run Flask in a thread (no reloader, quiet logging)."""
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.run(host='127.0.0.1', port=PORT, debug=False, use_reloader=False)


def main():
    # Start Flask server in background thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # Give Flask a moment to start
    time.sleep(0.5)

    # Auto-start manager if already logged in
    if config.TOKEN:
        manager.start()

    import platform
    is_macos = platform.system() == "Darwin"

    if not is_macos:
        # On non-macOS, try pywebview for a native window
        try:
            import webview
            tray = TrayManager()
            tray_thread = threading.Thread(target=tray.run, daemon=True)
            tray_thread.start()

            window = webview.create_window(
                'Hive Node Manager',
                f'http://localhost:{PORT}',
                width=440,
                height=640,
                resizable=True,
                min_size=(400, 500),
            )
            webview.start()
            tray.stop_app()
            return
        except ImportError:
            pass

    # macOS (or pywebview unavailable): open browser + run tray on main thread
    import webbrowser
    webbrowser.open(f"http://localhost:{PORT}")

    tray = TrayManager()
    tray.run()  # Blocking on main thread — required by macOS AppKit


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        manager.stop()
        os._exit(0)
