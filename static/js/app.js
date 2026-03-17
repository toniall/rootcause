/**
 * STRYKR Knowledge Base - Frontend
 */

const API = '';
const PER_PAGE = 30;
const PAL = ['#00f0ff','#ff3358','#00ff88','#ffaa00','#b44dff','#38bdf8','#f472b6','#a3e635','#fb923c','#c084fc','#34d399','#fbbf24','#818cf8','#f87171','#22d3ee'];
const CYAN='#00f0ff',RED='#ff3358',GREEN='#00ff88',AMBER='#ffaa00',PURPLE='#b44dff';

// ── Helpers ──

async function api(path) {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function html(el, h) { if (typeof el === 'string') el = $(el); el.innerHTML = h; }
function show(el) { $(el).classList.add('show'); }
function hide(el) { $(el).classList.remove('show'); }
function fmt(n) { return n == null ? '-' : Number(n).toLocaleString(); }
function money(n) { return n ? `$${fmt(n)}` : '-'; }
function trunc(s, n) { return s && s.length > n ? s.slice(0, n) + '...' : (s || ''); }
function tagHtml(items, cls, maxN) {
  if (!items || !items.length) return '<span style="color:var(--text-muted)">-</span>';
  const shown = maxN ? items.slice(0, maxN) : items;
  let h = shown.map(t => `<span class="tag ${cls}">${String(t).replace(/_/g, ' ')}</span>`).join('');
  if (maxN && items.length > maxN) h += `<span class="tag t-muted">+${items.length - maxN}</span>`;
  return h;
}
function osClass(os) { return 'os-' + (os || 'unknown').toLowerCase().replace(/\s/g,''); }
function diffClass(d) { return d ? 'diff-' + d.toLowerCase() : ''; }
function loading(el) { html(el, '<div class="loading"><div class="spinner"></div><div>Loading...</div></div>'); }

// ── Tabs ──

$$('.tab').forEach(t => {
  t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $(`#panel-${t.dataset.tab}`).classList.add('active');
  });
});

// ── Chart Builders ──

Chart.defaults.color = '#8892a8';
Chart.defaults.borderColor = '#1e293b';
Chart.defaults.font.family = "'Outfit', sans-serif";
Chart.defaults.font.size = 12;

const charts = {};

function makeChart(id, type, labels, data, opts = {}) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  if (charts[id]) charts[id].destroy();

  const cfg = {
    type,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: opts.colors || PAL,
        borderRadius: opts.borderRadius ?? (type === 'bar' ? 4 : 0),
        barThickness: opts.barThickness || 18,
        borderWidth: opts.borderWidth ?? 0,
        hoverOffset: opts.hoverOffset || 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: opts.horizontal ? 'y' : 'x',
      plugins: {
        legend: { display: !!opts.legend, position: 'right', labels: { padding: 10, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } } },
      },
      scales: type === 'doughnut' ? {} : {
        x: { grid: { color: opts.horizontal ? '#1e293b44' : 'transparent' } },
        y: { grid: { color: opts.horizontal ? 'transparent' : '#1e293b44' } },
      },
      ...(type === 'doughnut' ? { cutout: '62%' } : {}),
    }
  };

  charts[id] = new Chart(canvas, cfg);
}

// ── OVERVIEW ──

async function loadOverview() {
  const [stats, osDist, diffDist, foothold, privesc, tools, h1Weak, bountyDist] = await Promise.all([
    api('/api/stats'),
    api('/api/charts/os'),
    api('/api/charts/difficulty'),
    api('/api/charts/foothold_types'),
    api('/api/charts/privesc_types'),
    api('/api/charts/top_tools'),
    api('/api/charts/h1_weaknesses'),
    api('/api/charts/bounty_distribution'),
  ]);

  const cards = [
    { l: 'HTB Boxes', v: fmt(stats.htb_boxes), c: 'v-cyan' },
    { l: 'HackerOne Reports', v: fmt(stats.h1_reports), c: 'v-red' },
    { l: 'Exploit Scripts', v: fmt(stats.script_files + stats.inline_scripts), c: 'v-green' },
    { l: 'Commands Indexed', v: fmt(stats.commands), c: 'v-amber' },
    { l: 'Attack Chains', v: fmt(stats.attack_chains), c: 'v-purple' },
    { l: 'Ports Indexed', v: fmt(stats.ports_indexed), c: 'v-cyan' },
    { l: 'Total Bounties', v: '$' + fmt(Math.round(stats.total_bounty)), c: 'v-green' },
    { l: 'Max Single Bounty', v: '$' + fmt(stats.max_bounty), c: 'v-amber' },
  ];
  html('#stat-cards', cards.map(c => `<div class="stat-card"><div class="stat-label">${c.l}</div><div class="stat-value ${c.c}">${c.v}</div></div>`).join(''));

  makeChart('chart-foothold', 'bar',
    foothold.map(x => x.type.replace(/_/g, ' ')),
    foothold.map(x => x.count),
    { horizontal: true });

  makeChart('chart-privesc', 'bar',
    privesc.map(x => x.type.replace(/_/g, ' ')),
    privesc.map(x => x.count),
    { horizontal: true });

  makeChart('chart-os', 'doughnut',
    osDist.map(x => x.os),
    osDist.map(x => x.count),
    { colors: [GREEN, '#60a5fa', RED, '#94a3b8'], legend: true });

  makeChart('chart-diff', 'doughnut',
    diffDist.map(x => x.difficulty),
    diffDist.map(x => x.count),
    { colors: [GREEN, AMBER, RED, PURPLE], legend: true });

  makeChart('chart-tools', 'bar',
    tools.map(x => x.tool),
    tools.map(x => x.count),
    { horizontal: true });

  makeChart('chart-h1weak', 'bar',
    h1Weak.map(x => trunc(x.weakness_name, 35)),
    h1Weak.map(x => x.count),
    { horizontal: true });

  makeChart('chart-bounty', 'bar',
    bountyDist.map(x => x.range),
    bountyDist.map(x => x.count),
    { colors: [GREEN, GREEN, CYAN, CYAN, AMBER, AMBER, RED] });
}

// ── HTB BOXES ──

let htbState = { page: 0, q: '', os: '', diff: '', sort: 'name', order: 'asc' };

async function loadHtbBoxes() {
  const s = htbState;
  const params = new URLSearchParams({
    page: s.page, per_page: PER_PAGE, q: s.q, os: s.os, difficulty: s.diff, sort: s.sort, order: s.order
  });
  const data = await api(`/api/htb/boxes?${params}`);
  const { total, boxes } = data;
  const start = s.page * PER_PAGE;

  html('#htb-count', `Showing ${total ? start + 1 : 0}-${Math.min(start + PER_PAGE, total)} of ${fmt(total)} boxes`);

  html('#htb-tbody', boxes.map(b => `
    <tr class="clickable" onclick="openBox('${b.name.replace(/'/g, "\\'")}')">
      <td><strong style="color:var(--cyan)">${b.name}</strong></td>
      <td><span class="os-badge ${osClass(b.os)}">${b.os || '?'}</span></td>
      <td>${b.difficulty ? `<span class="diff-badge ${diffClass(b.difficulty)}">${b.difficulty}</span>` : '-'}</td>
      <td>${tagHtml(b.foothold_types, 't-red', 3)}</td>
      <td>${tagHtml(b.privesc_types, 't-purple', 2)}</td>
      <td>${tagHtml(b.tools_used, 't-muted', 4)}</td>
      <td style="font-family:var(--mono);font-size:.72rem;color:var(--text-dim)">${(b.port_numbers || []).slice(0, 6).join(', ') || '-'}</td>
    </tr>
  `).join(''));

  renderPagination('#htb-pagination', total, s.page, p => { htbState.page = p; loadHtbBoxes(); });
}

function renderPagination(el, total, current, onPage) {
  const pages = Math.ceil(total / PER_PAGE);
  if (pages <= 1) { html(el, ''); return; }
  let h = '';
  h += `<button class="pg-btn" ${current === 0 ? 'disabled' : ''} onclick="void(0)">&laquo;</button>`;
  const range = [];
  for (let i = Math.max(0, current - 3); i < Math.min(pages, current + 4); i++) range.push(i);
  range.forEach(i => {
    h += `<button class="pg-btn ${i === current ? 'active' : ''}">${i + 1}</button>`;
  });
  h += `<button class="pg-btn" ${current >= pages - 1 ? 'disabled' : ''}>&raquo;</button>`;
  html(el, h);

  $(el).querySelectorAll('.pg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent.trim();
      if (btn.disabled) return;
      if (text === '\u00AB') onPage(0);
      else if (text === '\u00BB') onPage(pages - 1);
      else onPage(parseInt(text) - 1);
    });
  });
}

// HTB Search/Filter handlers
let htbDebounce;
$('#htb-search').addEventListener('input', () => {
  clearTimeout(htbDebounce);
  htbDebounce = setTimeout(() => { htbState.q = $('#htb-search').value; htbState.page = 0; loadHtbBoxes(); }, 300);
});
$('#htb-os').addEventListener('change', () => { htbState.os = $('#htb-os').value; htbState.page = 0; loadHtbBoxes(); });
$('#htb-diff').addEventListener('change', () => { htbState.diff = $('#htb-diff').value; htbState.page = 0; loadHtbBoxes(); });

// ── HTB Box Detail Modal ──

async function openBox(name) {
  show('#modal-overlay');
  html('#modal-content', '<div class="loading"><div class="spinner"></div><div>Loading box data...</div></div>');
  try {
    const b = await api(`/api/htb/boxes/${encodeURIComponent(name)}`);
    let h = `<button class="modal-close" onclick="closeModal()">&times;</button>`;
    h += `<h2>${b.name}</h2>`;
    h += `<div class="meta">
      <span class="os-badge ${osClass(b.os)}">${b.os || 'Unknown'}</span>
      ${b.difficulty ? `<span class="diff-badge ${diffClass(b.difficulty)}">${b.difficulty}</span>` : ''}
      ${b.machine_author ? `<span style="color:var(--text-dim)">by ${b.machine_author}</span>` : ''}
      ${b.date ? `<span style="color:var(--text-muted)">${b.date}</span>` : ''}
    </div>`;

    if (b.synopsis) h += `<div class="section"><div class="sec-title">Synopsis</div><div class="synopsis">${b.synopsis}</div></div>`;

    h += `<div class="section"><div class="sec-title">Foothold Vectors</div>${tagHtml(b.foothold_types, 't-red')}</div>`;
    h += `<div class="section"><div class="sec-title">Privilege Escalation</div>${tagHtml(b.privesc_types, 't-purple')}</div>`;
    h += `<div class="section"><div class="sec-title">Tools Used</div>${tagHtml(b.tools_used, 't-cyan')}</div>`;

    if (b.port_details && b.port_details.length) {
      h += `<div class="section"><div class="sec-title">Ports &amp; Services</div>`;
      h += b.port_details.map(p => `<span class="tag t-amber">${p.port}/${p.service || '?'}${p.version ? ' - ' + trunc(p.version, 30) : ''}</span>`).join(' ');
      h += `</div>`;
    }

    if (b.cves && b.cves.length) h += `<div class="section"><div class="sec-title">CVEs</div>${tagHtml(b.cves, 't-amber')}</div>`;
    if (b.msf_modules && b.msf_modules.length) h += `<div class="section"><div class="sec-title">Metasploit Modules</div>${tagHtml(b.msf_modules, 't-green')}</div>`;
    if (b.skills_required && b.skills_required.length) h += `<div class="section"><div class="sec-title">Skills Required</div>${tagHtml(b.skills_required, 't-muted')}</div>`;
    if (b.skills_learned && b.skills_learned.length) h += `<div class="section"><div class="sec-title">Skills Learned</div>${tagHtml(b.skills_learned, 't-muted')}</div>`;

    // Attack Chain
    if (b.attack_chain && b.attack_chain.length) {
      h += `<div class="section"><div class="sec-title">Attack Chain</div><div class="chain">`;
      b.attack_chain.forEach((c, i) => {
        h += `<div class="chain-step">
          <div class="chain-dot">${i + 1}</div>
          <div class="chain-body">
            <div class="chain-phase">${c.phase || 'Phase ' + (i+1)}</div>
            ${c.tools && c.tools.length ? '<div style="margin-bottom:.3rem">' + tagHtml(c.tools, 't-cyan') + '</div>' : ''}
            <div class="chain-desc">${trunc(c.description, 400)}</div>
          </div>
        </div>`;
      });
      h += `</div></div>`;
    }

    // Commands
    if (b.commands && b.commands.length) {
      h += `<div class="section"><div class="sec-title">Commands (${b.commands.length})</div>`;
      h += `<div class="code-block">${b.commands.map(c =>
        `<span style="color:var(--text-muted)"># ${c.tool || ''}</span>\n${escHtml(c.command || '')}`
      ).join('\n\n')}</div></div>`;
    }

    // Scripts
    const sanitized = (b.scripts || []).filter(s => s.is_sanitized);
    const scriptsToShow = sanitized.length ? sanitized : (b.scripts || []);
    if (scriptsToShow.length) {
      h += `<div class="section"><div class="sec-title">Scripts (${scriptsToShow.length})</div>`;
      scriptsToShow.forEach(s => {
        h += `<div style="margin-bottom:.75rem">
          <div style="margin-bottom:.3rem">${tagHtml(s.purposes, 't-green')} <span class="tag t-muted">${s.language || '?'}</span> <span style="color:var(--text-muted);font-size:.72rem">${s.line_count} lines</span></div>
          <div class="code-block">${escHtml(s.code || '')}</div>
        </div>`;
      });
      h += `</div>`;
    }

    html('#modal-content', h);
  } catch (e) {
    html('#modal-content', `<button class="modal-close" onclick="closeModal()">&times;</button><div class="loading">Error loading box: ${e.message}</div>`);
  }
}
window.openBox = openBox;

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function closeModal() { hide('#modal-overlay'); }
window.closeModal = closeModal;
$('#modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── HACKERONE ──

let h1State = { page: 0, q: '', prog: '', weak: '', sort: 'bounty_amount', order: 'desc' };

async function loadH1Reports() {
  const s = h1State;
  const params = new URLSearchParams({
    page: s.page, per_page: PER_PAGE, q: s.q, program: s.prog, weakness: s.weak, sort: s.sort, order: s.order
  });
  const data = await api(`/api/h1/reports?${params}`);
  const { total, reports } = data;
  const start = s.page * PER_PAGE;

  html('#h1-count', `Showing ${total ? start + 1 : 0}-${Math.min(start + PER_PAGE, total)} of ${fmt(total)} reports`);

  html('#h1-tbody', reports.map(r => `
    <tr class="clickable" onclick="openReport(${r.id})">
      <td><a href="https://hackerone.com/reports/${r.id}" target="_blank" class="link" onclick="event.stopPropagation()">#${r.id}</a></td>
      <td><span class="truncate">${r.title || ''}</span></td>
      <td>${r.weakness_name ? `<span class="tag t-red">${trunc(r.weakness_name, 35)}</span>` : '-'}</td>
      <td><span class="tag t-cyan">${r.program_handle || ''}</span></td>
      <td>${r.bounty_amount ? `<span class="money">${money(r.bounty_amount)}</span>` : '<span style="color:var(--text-muted)">-</span>'}</td>
    </tr>
  `).join(''));

  renderPagination('#h1-pagination', total, s.page, p => { h1State.page = p; loadH1Reports(); });
}

async function loadH1Filters() {
  const f = await api('/api/h1/filters');
  const pSel = $('#h1-prog');
  f.programs.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; pSel.appendChild(o); });
  const wSel = $('#h1-weak');
  f.weaknesses.forEach(w => { const o = document.createElement('option'); o.value = w; o.textContent = trunc(w, 45); wSel.appendChild(o); });
}

let h1Debounce;
$('#h1-search').addEventListener('input', () => {
  clearTimeout(h1Debounce);
  h1Debounce = setTimeout(() => { h1State.q = $('#h1-search').value; h1State.page = 0; loadH1Reports(); }, 300);
});
$('#h1-prog').addEventListener('change', () => { h1State.prog = $('#h1-prog').value; h1State.page = 0; loadH1Reports(); });
$('#h1-weak').addEventListener('change', () => { h1State.weak = $('#h1-weak').value; h1State.page = 0; loadH1Reports(); });

// ── H1 Report Detail ──

async function openReport(id) {
  show('#modal-overlay');
  html('#modal-content', '<div class="loading"><div class="spinner"></div><div>Loading report...</div></div>');
  try {
    const r = await api(`/api/h1/reports/${id}`);
    let h = `<button class="modal-close" onclick="closeModal()">&times;</button>`;
    h += `<h2><a href="https://hackerone.com/reports/${r.id}" target="_blank" class="link">#${r.id}</a> ${escHtml(r.title || '')}</h2>`;
    h += `<div class="meta">
      <span class="tag t-cyan">${r.program_handle || ''}</span>
      ${r.weakness_name ? `<span class="tag t-red">${r.weakness_name}</span>` : ''}
      ${r.bounty_amount ? `<span class="money" style="font-size:1rem">${money(r.bounty_amount)}</span>` : ''}
    </div>`;

    if (r.asset_identifier) h += `<div class="section"><div class="sec-title">Asset</div><span style="color:var(--amber)">${r.asset_identifier}</span> ${r.asset_type ? `<span class="tag t-muted">${r.asset_type}</span>` : ''}</div>`;
    if (r.cve_ids && r.cve_ids.length) h += `<div class="section"><div class="sec-title">CVEs</div>${tagHtml(r.cve_ids, 't-amber')}</div>`;

    if (r.vulnerability_information) {
      h += `<div class="section"><div class="sec-title">Vulnerability Details</div>
        <div class="code-block" style="max-height:500px;white-space:pre-wrap">${escHtml(r.vulnerability_information)}</div>
      </div>`;
    }

    html('#modal-content', h);
  } catch (e) {
    html('#modal-content', `<button class="modal-close" onclick="closeModal()">&times;</button><div class="loading">Error: ${e.message}</div>`);
  }
}
window.openReport = openReport;

// ── SCRIPTS TAB ──

let scriptState = { page: 0, q: '', cat: '', lang: '' };

async function loadScripts() {
  const s = scriptState;
  const params = new URLSearchParams({ page: s.page, per_page: PER_PAGE, q: s.q, category: s.cat, language: s.lang });
  const data = await api(`/api/scripts?${params}`);
  const { total, scripts } = data;
  const start = s.page * PER_PAGE;

  html('#script-count', `Showing ${total ? start + 1 : 0}-${Math.min(start + PER_PAGE, total)} of ${fmt(total)} scripts`);

  html('#script-tbody', scripts.map(sc => `
    <tr class="clickable" onclick="openScript(${sc.id})">
      <td><span class="tag t-cyan">${sc.category || ''}</span></td>
      <td><strong style="color:var(--text)">${sc.box_name || '?'}</strong></td>
      <td><span class="tag t-muted">${sc.language || '?'}</span></td>
      <td>${tagHtml(sc.purposes, 't-green', 3)}</td>
      <td style="font-family:var(--mono);font-size:.72rem">${sc.line_count || '?'}</td>
      <td style="color:var(--text-dim);font-size:.78rem">${trunc(sc.context, 80)}</td>
    </tr>
  `).join(''));

  renderPagination('#script-pagination', total, s.page, p => { scriptState.page = p; loadScripts(); });
}

async function loadScriptFilters() {
  const f = await api('/api/scripts/filters');
  const cSel = $('#script-cat');
  f.categories.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c.replace(/_/g, ' '); cSel.appendChild(o); });
  const lSel = $('#script-lang');
  f.languages.forEach(l => { const o = document.createElement('option'); o.value = l; o.textContent = l; lSel.appendChild(o); });
}

async function loadScriptCharts() {
  const [cats, services, progs] = await Promise.all([
    api('/api/charts/script_categories'),
    api('/api/charts/services'),
    api('/api/charts/h1_programs'),
  ]);

  makeChart('chart-scriptcats', 'bar',
    cats.map(x => x.category.replace(/_/g, ' ')),
    cats.map(x => x.count),
    { horizontal: true });

  makeChart('chart-services', 'bar',
    services.map(x => x.service),
    services.map(x => x.count),
    { horizontal: true });

  makeChart('chart-programs', 'bar',
    progs.map(x => x.program_handle),
    progs.map(x => x.count));
}

let scriptDebounce;
$('#script-search').addEventListener('input', () => {
  clearTimeout(scriptDebounce);
  scriptDebounce = setTimeout(() => { scriptState.q = $('#script-search').value; scriptState.page = 0; loadScripts(); }, 300);
});
$('#script-cat').addEventListener('change', () => { scriptState.cat = $('#script-cat').value; scriptState.page = 0; loadScripts(); });
$('#script-lang').addEventListener('change', () => { scriptState.lang = $('#script-lang').value; scriptState.page = 0; loadScripts(); });

async function openScript(id) {
  show('#modal-overlay');
  html('#modal-content', '<div class="loading"><div class="spinner"></div><div>Loading script...</div></div>');
  try {
    const s = await api(`/api/scripts/${id}`);
    let h = `<button class="modal-close" onclick="closeModal()">&times;</button>`;
    h += `<h2>${s.file_path}</h2>`;
    h += `<div class="meta">
      <span class="tag t-cyan">${s.category || ''}</span>
      <span class="tag t-muted">${s.language || '?'}</span>
      ${s.box_name ? `<span>from <strong style="color:var(--cyan)">${s.box_name}</strong></span>` : ''}
      <span style="color:var(--text-muted)">${s.line_count || '?'} lines</span>
    </div>`;
    if (s.purposes) h += `<div class="section"><div class="sec-title">Purposes</div>${tagHtml(s.purposes, 't-green')}</div>`;
    if (s.libs && s.libs.length) h += `<div class="section"><div class="sec-title">Libraries</div>${tagHtml(s.libs, 't-amber')}</div>`;
    if (s.context) h += `<div class="section"><div class="sec-title">Context</div><div style="color:var(--text-dim);font-size:.85rem;line-height:1.5">${escHtml(s.context)}</div></div>`;
    if (s.source_code) h += `<div class="section"><div class="sec-title">Source Code</div><div class="code-block" style="max-height:500px">${escHtml(s.source_code)}</div></div>`;
    html('#modal-content', h);
  } catch (e) {
    html('#modal-content', `<button class="modal-close" onclick="closeModal()">&times;</button><div class="loading">Error: ${e.message}</div>`);
  }
}
window.openScript = openScript;

// ── ARCHETYPES ──

async function loadArchetypes() {
  const archetypes = await api('/api/archetypes');
  const maxCount = Math.max(...archetypes.map(a => a.box_count));

  html('#arch-grid', archetypes.map(a => {
    const topPorts = Object.entries(a.common_ports || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topPriv = Object.entries(a.common_privesc || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return `
      <div class="arch-card">
        <div class="arch-name">${a.archetype.replace(/_/g, ' ')}</div>
        <div class="arch-meta">
          <span class="os-badge ${osClass(a.os)}">${a.os}</span>
          <strong>${a.box_count}</strong> boxes
        </div>
        <div class="arch-bar"><div class="arch-fill" style="width:${(a.box_count / maxCount * 100).toFixed(0)}%"></div></div>
        ${topPorts.length ? `<div style="margin-top:.4rem"><span style="font-size:.65rem;color:var(--text-muted)">PORTS:</span> ${topPorts.map(([p, c]) => `<span class="tag t-amber">${p} (${c})</span>`).join(' ')}</div>` : ''}
        ${topPriv.length ? `<div style="margin-top:.3rem"><span style="font-size:.65rem;color:var(--text-muted)">PRIVESC:</span> ${topPriv.map(([p, c]) => `<span class="tag t-purple">${p.replace(/_/g, ' ')} (${c})</span>`).join(' ')}</div>` : ''}
      </div>
    `;
  }).join(''));
}

// ── GLOBAL SEARCH ──

const gsInput = $('#gs-input');
const gsResults = $('#gs-results');
let gsDebounce;

gsInput.addEventListener('input', () => {
  clearTimeout(gsDebounce);
  const q = gsInput.value.trim();
  if (!q) { gsResults.classList.remove('open'); return; }
  gsDebounce = setTimeout(async () => {
    try {
      const data = await api(`/api/search?q=${encodeURIComponent(q)}`);
      let h = '';
      if (data.boxes.length) {
        h += `<div class="gs-section"><div class="gs-section-title">HTB Boxes</div>`;
        data.boxes.slice(0, 8).forEach(b => {
          h += `<div class="gs-item" onclick="gsNav('htb','${b.name.replace(/'/g,"\\'")}')">
            <span class="gs-type t-cyan">BOX</span>
            <span class="gs-title">${b.name} <span style="color:var(--text-muted);font-size:.72rem">${b.os || ''} ${b.difficulty || ''}</span></span>
          </div>`;
        });
        h += `</div>`;
      }
      if (data.reports.length) {
        h += `<div class="gs-section"><div class="gs-section-title">HackerOne Reports</div>`;
        data.reports.slice(0, 8).forEach(r => {
          h += `<div class="gs-item" onclick="gsNav('h1',${r.id})">
            <span class="gs-type t-red">H1</span>
            <span class="gs-title">${trunc(r.title, 60)} ${r.bounty_amount ? `<span class="money" style="font-size:.72rem">${money(r.bounty_amount)}</span>` : ''}</span>
          </div>`;
        });
        h += `</div>`;
      }
      if (data.scripts.length) {
        h += `<div class="gs-section"><div class="gs-section-title">Scripts</div>`;
        data.scripts.slice(0, 6).forEach(s => {
          h += `<div class="gs-item" onclick="gsNav('script',${s.id})">
            <span class="gs-type t-green">SCR</span>
            <span class="gs-title">${s.box_name || '?'} - ${(s.purposes || []).join(', ')} <span style="color:var(--text-muted)">${s.language || ''}</span></span>
          </div>`;
        });
        h += `</div>`;
      }
      if (!h) h = '<div class="gs-empty">No results found</div>';
      html('#gs-results', h);
      gsResults.classList.add('open');
    } catch (e) {
      html('#gs-results', '<div class="gs-empty">Search error</div>');
      gsResults.classList.add('open');
    }
  }, 300);
});

gsInput.addEventListener('blur', () => { setTimeout(() => gsResults.classList.remove('open'), 200); });
gsInput.addEventListener('focus', () => { if (gsInput.value.trim() && gsResults.innerHTML) gsResults.classList.add('open'); });

function gsNav(type, id) {
  gsResults.classList.remove('open');
  gsInput.value = '';
  if (type === 'htb') {
    switchTab('htb');
    openBox(id);
  } else if (type === 'h1') {
    switchTab('hackerone');
    openReport(id);
  } else if (type === 'script') {
    switchTab('scripts');
    openScript(id);
  }
}
window.gsNav = gsNav;

function switchTab(name) {
  $$('.tab').forEach(t => t.classList.remove('active'));
  $$('.panel').forEach(p => p.classList.remove('active'));
  const tab = document.querySelector(`.tab[data-tab="${name}"]`);
  if (tab) tab.classList.add('active');
  $(`#panel-${name}`).classList.add('active');
}

// ── INIT ──

(async function init() {
  try {
    await loadOverview();
    loadHtbBoxes();
    loadH1Reports();
    loadH1Filters();
    loadScripts();
    loadScriptFilters();
    loadScriptCharts();
    loadArchetypes();
  } catch (e) {
    console.error('Init error:', e);
  }
})();
