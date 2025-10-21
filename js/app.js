// =====================
// Zeke Dashboard App.js
// =====================

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjeHpnaHBjZm9icG5sdmx2dGliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjQ5ODgsImV4cCI6MjA2NzE0MDk4OH0.frunhRobCUlKGCz1IgnuXtoGyMBUKwQQ3xQc_iFyEMg');

async function fetchData(endpoint) {
  try {
    const res = await fetch(`https://ZekeBot.wispbyte.cc/${endpoint}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!res.ok) throw new Error(`Error fetching ${endpoint}: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// ---------------------
// Tab Switching Logic
// ---------------------
const tabs = document.querySelectorAll('.tabs button');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active-panel'));
    document.querySelector(`#${tab.dataset.tab}`).classList.add('active-panel');
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// ---------------------
// Populate Quotas
// ---------------------
async function populateQuotasTable(data) {
  const tableBody = document.querySelector('#quotas tbody');
  if (!tableBody) return;

  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 10);
  tableBody.innerHTML = '';

  sorted.forEach(([user, count], idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx === 0 ? '🥇' : idx+1}</td>
      <td>${user}</td>
      <td>${count}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// ---------------------
// Populate Vouches
// ---------------------
async function populateVouches(data) {
  const vouchList = document.getElementById('vouchList');
  if (!vouchList) return;
  vouchList.innerHTML = '';

  for (const [user, vouchData] of Object.entries(data)) {
    const container = document.createElement('div');
    container.classList.add('card');

    const entries = vouchData.entries || [];
    const content = entries.length ? entries.map(e => `<li>By ${e.by} at ${new Date(e.time).toLocaleString()} (<a href="${e.source}" target="_blank">link</a>)</li>`).join('') : '<li>No Vouches</li>';

    container.innerHTML = `
      <h3>${user} - Total: ${vouchData.all_time || 0}</h3>
      <ul>${content}</ul>
    `;
    vouchList.appendChild(container);
  }
}

// ---------------------
// Populate Pity Queue
// ---------------------
async function populatePity(data) {
  const pityCards = document.getElementById('pityCards');
  if (!pityCards) return;
  pityCards.innerHTML = '';

  for (const [user, entry] of Object.entries(data)) {
    const card = document.createElement('div');
    card.classList.add('card');

    const startTime = new Date(entry.timestamp);
    const endTime = new Date(startTime.getTime() + 48*60*60*1000);
    const now = new Date();
    const status = now < endTime ? '<span style="color:lime">Active</span>' : '<span style="color:red">Expired</span>';

    card.innerHTML = `
      <h3>${user} - ${status}</h3>
      <p>Start Raids: ${entry.start}</p>
      <a href="${entry.start_screenshot}" target="_blank">Screenshot</a>
      <p>Requested: ${startTime.toLocaleString()}</p>
    `;
    pityCards.appendChild(card);
  }
}

// ---------------------
// Populate Warnings
// ---------------------
async function populateWarnings(data) {
  const tableBody = document.querySelector('#warningsTable tbody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  for (const [user, warnings] of Object.entries(data)) {
    warnings.sort((a,b) => new Date(b.time) - new Date(a.time));
    warnings.forEach(w => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user}</td>
        <td title="${w.reason}">${w.reason.length > 20 ? w.reason.slice(0,20)+'...' : w.reason}</td>
        <td>${w.by}</td>
        <td>${new Date(w.time).toLocaleString()}</td>
      `;
      if (warnings.length >= 3) tr.style.borderLeft = '3px solid red';
      tableBody.appendChild(tr);
    });
  }
}

// ---------------------
// Populate Ranks
// ---------------------
async function populateRanks(data) {
  const ranksList = document.getElementById('ranksList');
  if (!ranksList) return;
  ranksList.innerHTML = '';

  for (const [user, rank] of Object.entries(data)) {
    const li = document.createElement('li');
    li.textContent = rank.includes('Elite') ? `⭐ ${user} - ${rank}` : `${user} - ${rank}`;
    ranksList.appendChild(li);
  }
}

// ---------------------
// Analytics Charts
// ---------------------
async function populateCharts(quotas, vouches) {
  const ctxQ = document.getElementById('quotasChart');
  const ctxV = document.getElementById('vouchesChart');

  if (ctxQ && quotas) {
    const weekly = Object.values(quotas); // Simplified aggregation
    new Chart(ctxQ, { type: 'line', data: { labels: weekly.map((_,i)=>`Week ${i+1}`), datasets:[{label:'Quotas', data:weekly, borderColor:'#5865F2', backgroundColor:'rgba(88,101,242,0.2)'}]} });
  }

  if (ctxV && vouches) {
    const monthly = Object.values(vouches).map(v=>v.all_time);
    new Chart(ctxV, { type: 'bar', data:{ labels: monthly.map((_,i)=>`Month ${i+1}`), datasets:[{label:'Vouches', data:monthly, backgroundColor:'rgba(130,0,255,0.5)'}] } });
  }
}

// ---------------------
// Init Dashboard
// ---------------------
async function init() {
  const quotas = await fetchData('quotas');
  const vouches = await fetchData('vouches');
  const pity = await fetchData('pity');
  const warnings = await fetchData('warnings');
  const ranks = await fetchData('ranks');

  populateQuotasTable(quotas);
  populateVouches(vouches);
  populatePity(pity);
  populateWarnings(warnings);
  populateRanks(ranks);
  populateCharts(quotas, vouches);

  // Today date
  document.getElementById('today').textContent = new Date().toLocaleDateString();
}

init();
