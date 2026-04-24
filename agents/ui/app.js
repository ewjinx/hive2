// ─── Hive Node Manager — Frontend Logic ──────────────────────
// Communicates with the local Flask API on the same origin.

const API = '';  // Same origin

// ─── State ───────────────────────────────────────────────────

let systemInfo = { max_cpu: 8, max_ram: 16 };
let pollInterval = null;

// ─── DOM Helpers ─────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showView(name) {
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`#${name}View`).classList.add('active');
}

// ─── Theme Toggle ────────────────────────────────────────────

$('#themeToggle').addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  $('#moonIcon').style.display = isDark ? 'none' : 'block';
  $('#sunIcon').style.display = isDark ? 'block' : 'none';
  localStorage.setItem('hive-theme', isDark ? 'dark' : 'light');
});

// Restore saved theme
if (localStorage.getItem('hive-theme') === 'dark') {
  document.documentElement.classList.add('dark');
  $('#moonIcon').style.display = 'none';
  $('#sunIcon').style.display = 'block';
}

// ─── Login ───────────────────────────────────────────────────

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const password = $('#loginPassword').value.trim();
  const btn = $('#loginBtn');
  const err = $('#loginError');

  btn.disabled = true;
  btn.textContent = 'Connecting...';
  err.textContent = '';

  try {
    const res = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      showView('dash');
      await fetchSystemInfo();
      refreshNodes();
      startPolling();
    } else {
      err.textContent = data.error || 'Login failed';
    }
  } catch (ex) {
    err.textContent = 'Connection error: ' + ex.message;
  }

  btn.disabled = false;
  btn.textContent = 'Log In';
});

// ─── Logout ──────────────────────────────────────────────────

$('#logoutBtn').addEventListener('click', async () => {
  try {
    await fetch(`${API}/api/logout`, { method: 'POST' });
  } catch {}
  stopPolling();
  showView('login');
  $('#loginEmail').value = '';
  $('#loginPassword').value = '';
});

// ─── Add Node ────────────────────────────────────────────────

$('#addNodeBtn').addEventListener('click', async () => {
  const btn = $('#addNodeBtn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    const res = await fetch(`${API}/api/nodes`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      refreshNodes();
    } else {
      alert(data.error || 'Failed to create node');
    }
  } catch (ex) {
    alert('Connection error: ' + ex.message);
  }

  btn.disabled = false;
  btn.textContent = '+ Add Node';
});

// ─── Fetch System Info ───────────────────────────────────────

async function fetchSystemInfo() {
  try {
    const res = await fetch(`${API}/api/system-info`);
    if (res.ok) {
      systemInfo = await res.json();
    }
  } catch {}
}

// ─── Refresh Nodes ───────────────────────────────────────────

async function refreshNodes() {
  try {
    const res = await fetch(`${API}/api/nodes`);
    if (!res.ok) return;
    const nodes = await res.json();
    renderNodes(nodes);
  } catch {}
}

// ─── Render Nodes ────────────────────────────────────────────

function renderNodes(nodes) {
  const container = $('#nodesList');
  const empty = $('#emptyState');

  if (!nodes || nodes.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  container.innerHTML = nodes.map((node, idx) => {
    const isOnline = node.status !== 'offline';
    const statusClass = node.live_status === 'Error' ? 'offline' :
                        (node.live_status || '').includes('Running') ? 'running' :
                        isOnline ? 'idle' : 'offline';
    const displayStatus = node.live_status || (isOnline ? 'Idle' : 'Offline');

    return `
      <div class="node-card animate-in" style="animation-delay: ${idx * 0.05}s" data-id="${node.id}">
        <div class="node-header">
          <div class="flex items-center gap-3">
            <input class="node-name-input" value="${escapeHtml(node.name)}" data-field="name" data-id="${node.id}">
            <span class="badge badge-${statusClass}">
              <span class="badge-dot"></span>
              ${escapeHtml(displayStatus)}
            </span>
          </div>
          <div class="node-controls">
            <label class="toggle" title="${isOnline ? 'Turn off' : 'Turn on'}">
              <input type="checkbox" ${isOnline ? 'checked' : ''} onchange="toggleNode('${node.id}')">
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
          </div>
        </div>

        <div class="node-sliders">
          <div class="slider-group">
            <span class="slider-label">CPU</span>
            <input type="range" min="1" max="${systemInfo.max_cpu}" step="1" value="${node.cpu_cores}"
                   data-field="cpu" data-id="${node.id}"
                   oninput="this.closest('.slider-group').querySelector('.slider-value').textContent = this.value + ' cores'">
            <span class="slider-value">${node.cpu_cores} cores</span>
          </div>
          <div class="slider-group">
            <span class="slider-label">RAM</span>
            <input type="range" min="1" max="${Math.round(systemInfo.max_ram)}" step="0.5" value="${node.ram_gb}"
                   data-field="ram" data-id="${node.id}"
                   oninput="this.closest('.slider-group').querySelector('.slider-value').textContent = parseFloat(this.value).toFixed(1) + ' GB'">
            <span class="slider-value">${parseFloat(node.ram_gb).toFixed(1)} GB</span>
          </div>
        </div>

        <div class="node-actions">
          <button class="btn btn-primary btn-sm flex-1" onclick="applySettings('${node.id}')">Apply Settings</button>
          <button class="btn btn-destructive btn-sm" onclick="deleteNode('${node.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Node Actions ────────────────────────────────────────────

async function toggleNode(id) {
  try {
    await fetch(`${API}/api/nodes/${id}/toggle`, { method: 'POST' });
    setTimeout(refreshNodes, 300);
  } catch {}
}

async function applySettings(id) {
  const card = document.querySelector(`.node-card[data-id="${id}"]`);
  if (!card) return;

  const name = card.querySelector('input[data-field="name"]').value;
  const cpu = parseInt(card.querySelector('input[data-field="cpu"]').value);
  const ram = parseFloat(card.querySelector('input[data-field="ram"]').value);

  try {
    const res = await fetch(`${API}/api/nodes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cpu_cores: cpu, ram_gb: ram }),
    });
    const data = await res.json();
    if (res.ok) {
      // Brief success flash
      const btn = card.querySelector('.btn-primary');
      btn.textContent = '✓ Applied';
      setTimeout(() => { btn.textContent = 'Apply Settings'; }, 1500);
    } else {
      alert(data.error || 'Failed to apply settings');
    }
  } catch (ex) {
    alert('Connection error: ' + ex.message);
  }
}

async function deleteNode(id) {
  if (!confirm('Permanently remove this node?')) return;

  try {
    await fetch(`${API}/api/nodes/${id}`, { method: 'DELETE' });
    refreshNodes();
  } catch {}
}

// ─── Polling ─────────────────────────────────────────────────

function startPolling() {
  stopPolling();
  pollInterval = setInterval(refreshNodes, 2000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// ─── Init ────────────────────────────────────────────────────

async function init() {
  try {
    const res = await fetch(`${API}/api/status`);
    if (res.ok) {
      const data = await res.json();
      if (data.logged_in) {
        showView('dash');
        await fetchSystemInfo();
        refreshNodes();
        startPolling();
        return;
      }
    }
  } catch {}
  showView('login');
}

// ─── Util ────────────────────────────────────────────────────

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// Start
init();
