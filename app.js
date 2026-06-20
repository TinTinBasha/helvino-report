/* ═══════════════════════════════════════════════════════════
   El Niño HEAT WAVE REPORT TOOL — APP.JS
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── Global State ─────────────────────────────────────────────
const APP = {
  incidents: [],
  shelters: [],
  activeTab: 'dashboard',
  reportType: 'executive',
  currentModalId: null,
  map: null,
  mapLayers: { risk: null, shelters: null, incidents: null },
  charts: {}
};

// ── Sample El Niño Data ───────────────────────────────────────
const REGIONS = [
  { name: 'Zone A – Ardena',    temp: 48.7, humidity: 22, population: '1.2M', risk: 'extreme', lat: 37.5,  lng: 15.1  },
  { name: 'Zone B – Braxton',   temp: 46.3, humidity: 25, population: '890K', risk: 'extreme', lat: 38.0,  lng: 15.8  },
  { name: 'Zone C – Cordell',   temp: 44.1, humidity: 28, population: '2.1M', risk: 'high',    lat: 36.8,  lng: 14.5  },
  { name: 'Zone D – Delvar',    temp: 47.5, humidity: 19, population: '560K', risk: 'extreme', lat: 37.9,  lng: 14.0  },
  { name: 'Zone E – Elvira',    temp: 41.8, humidity: 33, population: '3.4M', risk: 'high',    lat: 38.5,  lng: 16.2  },
  { name: 'Zone F – Farentino', temp: 39.2, humidity: 38, population: '780K', risk: 'moderate',lat: 36.2,  lng: 15.5  },
  { name: 'Zone G – Gorvia',    temp: 37.6, humidity: 42, population: '1.5M', risk: 'moderate',lat: 37.2,  lng: 16.8  },
];

const TEMP_HOURS = (() => {
  const now = new Date();
  const labels = [];
  const maxTemps = [], avgTemps = [], minTemps = [];
  for (let i = 72; i >= 0; i -= 3) {
    const d = new Date(now - i * 3600000);
    labels.push(`${d.getDate()}/${d.getMonth()+1} ${String(d.getHours()).padStart(2,'0')}:00`);
    const base = 35 + Math.sin((72-i)/10) * 8 + (Math.random() - 0.5) * 2;
    const peak = 48.7 - (i / 72) * 14;
    maxTemps.push(+(peak + (Math.random() - 0.5) * 2).toFixed(1));
    avgTemps.push(+(base + (Math.random()-0.5)).toFixed(1));
    minTemps.push(+(base - 5 + (Math.random()-0.5)).toFixed(1));
  }
  return { labels, maxTemps, avgTemps, minTemps };
})();

const HUMIDITY_DATA = TEMP_HOURS.labels.map((_, i) => +(45 - i * 0.3 + (Math.random()-0.5)*6).toFixed(1));
const HEAT_INDEX_DATA = TEMP_HOURS.maxTemps.map((t, i) => +(t + HUMIDITY_DATA[i] * 0.1).toFixed(1));

const HISTORICAL = {
  labels: ['El Niño 2026', 'Torrefina 2022', 'Brazzos 2019', 'Calida 2017', 'Ignear 2015'],
  peakTemps: [48.7, 44.1, 42.8, 45.3, 41.2],
  fatalities: [12, 38, 19, 54, 22],
  duration: [9, 12, 7, 14, 8]
};

// ── India Country Data ────────────────────────────────────
const INDIA_STATES = [
  { name: 'Rajasthan',       region: 'North',     temp: 50.5, alert: 'Red',    deaths: 68,  hosp: 3420, ndrf: 'Deployed',  hap: 'Active',  lat: 27.0238, lng: 74.2179, pop: '8.1 Cr' },
  { name: 'Uttar Pradesh',   region: 'North',     temp: 47.8, alert: 'Red',    deaths: 54,  hosp: 4210, ndrf: 'Deployed',  hap: 'Active',  lat: 26.8467, lng: 80.9462, pop: '23.5 Cr' },
  { name: 'Bihar',           region: 'East',      temp: 46.2, alert: 'Red',    deaths: 41,  hosp: 2890, ndrf: 'Deployed',  hap: 'Partial', lat: 25.0961, lng: 85.3131, pop: '12.4 Cr' },
  { name: 'Jharkhand',       region: 'East',      temp: 45.8, alert: 'Red',    deaths: 29,  hosp: 1780, ndrf: 'Deployed',  hap: 'Partial', lat: 23.6102, lng: 85.2799, pop: '3.8 Cr' },
  { name: 'Odisha',          region: 'East',      temp: 45.3, alert: 'Red',    deaths: 22,  hosp: 1540, ndrf: 'Deployed',  hap: 'Active',  lat: 20.9517, lng: 85.0985, pop: '4.6 Cr' },
  { name: 'Madhya Pradesh',  region: 'Central',   temp: 48.1, alert: 'Red',    deaths: 37,  hosp: 2640, ndrf: 'Deployed',  hap: 'Active',  lat: 22.9734, lng: 78.6569, pop: '8.5 Cr' },
  { name: 'Chhattisgarh',    region: 'Central',   temp: 45.1, alert: 'Red',    deaths: 18,  hosp: 1210, ndrf: 'Standby',   hap: 'Partial', lat: 21.2787, lng: 81.8661, pop: '3.2 Cr' },
  { name: 'Delhi',           region: 'North',     temp: 48.4, alert: 'Red',    deaths: 14,  hosp: 1890, ndrf: 'Deployed',  hap: 'Active',  lat: 28.7041, lng: 77.1025, pop: '3.3 Cr' },
  { name: 'Haryana',         region: 'North',     temp: 47.2, alert: 'Orange', deaths: 11,  hosp: 980,  ndrf: 'Standby',   hap: 'Active',  lat: 29.0588, lng: 76.0856, pop: '3.0 Cr' },
  { name: 'Punjab',          region: 'North',     temp: 44.9, alert: 'Orange', deaths: 8,   hosp: 720,  ndrf: 'Standby',   hap: 'Active',  lat: 31.1471, lng: 75.3412, pop: '3.0 Cr' },
  { name: 'Gujarat',         region: 'West',      temp: 46.8, alert: 'Orange', deaths: 16,  hosp: 1350, ndrf: 'Standby',   hap: 'Active',  lat: 22.2587, lng: 71.1924, pop: '6.9 Cr' },
  { name: 'Maharashtra',     region: 'West',      temp: 44.5, alert: 'Orange', deaths: 12,  hosp: 1680, ndrf: 'Standby',   hap: 'Active',  lat: 19.7515, lng: 75.7139, pop: '12.4 Cr' },
  { name: 'Telangana',       region: 'South',     temp: 44.2, alert: 'Orange', deaths: 9,   hosp: 980,  ndrf: 'Standby',   hap: 'Active',  lat: 18.1124, lng: 79.0193, pop: '3.8 Cr' },
  { name: 'Andhra Pradesh',  region: 'South',     temp: 43.8, alert: 'Orange', deaths: 7,   hosp: 840,  ndrf: 'Standby',   hap: 'Active',  lat: 15.9129, lng: 79.7400, pop: '5.4 Cr' },
  { name: 'West Bengal',     region: 'East',      temp: 43.1, alert: 'Orange', deaths: 6,   hosp: 910,  ndrf: 'Standby',   hap: 'Partial', lat: 22.9868, lng: 87.8550, pop: '10.0 Cr' },
  { name: 'Uttarakhand',     region: 'North',     temp: 40.5, alert: 'Yellow', deaths: 3,   hosp: 290,  ndrf: 'Standby',   hap: 'Partial', lat: 30.0668, lng: 79.0193, pop: '1.1 Cr' },
  { name: 'Himachal Pradesh',region: 'North',     temp: 37.2, alert: 'Yellow', deaths: 1,   hosp: 120,  ndrf: 'NotReq',    hap: 'Partial', lat: 31.1048, lng: 77.1734, pop: '0.73 Cr' },
  { name: 'Karnataka',       region: 'South',     temp: 40.8, alert: 'Yellow', deaths: 4,   hosp: 560,  ndrf: 'NotReq',    hap: 'Active',  lat: 15.3173, lng: 75.7139, pop: '6.7 Cr' },
  { name: 'Tamil Nadu',      region: 'South',     temp: 39.5, alert: 'Yellow', deaths: 2,   hosp: 410,  ndrf: 'NotReq',    hap: 'Active',  lat: 11.1271, lng: 78.6569, pop: '7.9 Cr' },
  { name: 'Kerala',          region: 'South',     temp: 36.8, alert: 'Normal', deaths: 0,   hosp: 140,  ndrf: 'NotReq',    hap: 'Active',  lat: 10.8505, lng: 76.2711, pop: '3.5 Cr' },
  { name: 'J&K',             region: 'North',     temp: 36.1, alert: 'Yellow', deaths: 1,   hosp: 90,   ndrf: 'NotReq',    hap: 'None',   lat: 33.7782, lng: 76.5762, pop: '1.3 Cr' },
  { name: 'Assam',           region: 'Northeast', temp: 35.4, alert: 'Normal', deaths: 0,   hosp: 110,  ndrf: 'NotReq',    hap: 'None',   lat: 26.2006, lng: 92.9376, pop: '3.5 Cr' },
];

const INDIA_DISTRICTS = [
  { rank:1,  name:'Churu',      state:'Rajasthan',      maxTemp:50.5, avg5d:49.1, humidity:12, heatIdx:58.2, alert:'Red' },
  { rank:2,  name:'Banda',      state:'Uttar Pradesh',  maxTemp:49.8, avg5d:48.4, humidity:15, heatIdx:57.1, alert:'Red' },
  { rank:3,  name:'Phalodi',    state:'Rajasthan',      maxTemp:49.3, avg5d:48.7, humidity:11, heatIdx:56.4, alert:'Red' },
  { rank:4,  name:'Titlagarh',  state:'Odisha',         maxTemp:48.9, avg5d:47.8, humidity:18, heatIdx:55.8, alert:'Red' },
  { rank:5,  name:'Barmer',     state:'Rajasthan',      maxTemp:48.7, avg5d:47.9, humidity:13, heatIdx:55.5, alert:'Red' },
  { rank:6,  name:'Prayagraj',  state:'Uttar Pradesh',  maxTemp:48.4, avg5d:47.2, humidity:22, heatIdx:55.1, alert:'Red' },
  { rank:7,  name:'Gwalior',    state:'Madhya Pradesh', maxTemp:48.1, avg5d:47.0, humidity:20, heatIdx:54.7, alert:'Red' },
  { rank:8,  name:'Khammam',    state:'Telangana',      maxTemp:47.9, avg5d:46.5, humidity:24, heatIdx:54.2, alert:'Red' },
  { rank:9,  name:'Nagpur',     state:'Maharashtra',    maxTemp:47.5, avg5d:46.2, humidity:23, heatIdx:53.8, alert:'Orange' },
  { rank:10, name:'Daltonganj', state:'Jharkhand',      maxTemp:47.2, avg5d:46.0, humidity:28, heatIdx:53.4, alert:'Orange' },
  { rank:11, name:'Kanpur',     state:'Uttar Pradesh',  maxTemp:47.0, avg5d:45.8, humidity:26, heatIdx:53.1, alert:'Orange' },
  { rank:12, name:'Ahmedabad',  state:'Gujarat',        maxTemp:46.8, avg5d:45.5, humidity:22, heatIdx:52.8, alert:'Orange' },
  { rank:13, name:'Bhopal',     state:'Madhya Pradesh', maxTemp:46.5, avg5d:45.1, humidity:25, heatIdx:52.4, alert:'Orange' },
  { rank:14, name:'Nanded',     state:'Maharashtra',    maxTemp:46.2, avg5d:44.8, humidity:27, heatIdx:52.0, alert:'Orange' },
  { rank:15, name:'Aurangabad', state:'Maharashtra',    maxTemp:45.9, avg5d:44.5, humidity:29, heatIdx:51.6, alert:'Orange' },
];

const INDIA_HISTORICAL_EVENTS = [
  {
    year: '2026', name: 'El Niño / National Crisis', states: 22, peakTemp: 50.5,
    deaths: 312, hosp: 18450, duration: 'Ongoing',
    lesson: '<strong>Ongoing event.</strong> Unprecedented multi-state coverage. IMD Red Alert across North & Central India. NDRF deployed in 14 states. Largest cooling centre network ever activated (4,820 centres).',
    current: true
  },
  {
    year: '2024', name: 'Pre-monsoon Multi-State', states: 15, peakTemp: 47.8,
    deaths: 218, hosp: 9800, duration: '18 days',
    lesson: '<strong>Key lesson:</strong> Early warning systems improved outcomes in Gujarat and Maharashtra. HAPs in urban areas showed 40% lower mortality vs non-HAP districts.',
    current: false
  },
  {
    year: '2022', name: 'March–May Heat Event', states: 12, peakTemp: 46.0,
    deaths: 90, hosp: 4200, duration: '21 days',
    lesson: '<strong>Key lesson:</strong> Unprecedented March heat caught systems unprepared. Highlighted need for year-round HAP activation, not just summer-only response.',
    current: false
  },
  {
    year: '2015', name: 'Andhra–Telangana Disaster', states: 4, peakTemp: 48.0,
    deaths: 2541, hosp: 41000, duration: '14 days',
    lesson: '<strong>Key lesson:</strong> Absence of structured HAP in Andhra Pradesh led to highest death toll in a century. Led to formation of NDMA Heat Action Plan guidelines.',
    current: false
  },
  {
    year: '2010', name: 'Ahmedabad Heat Wave', states: 3, peakTemp: 46.8,
    deaths: 1344, hosp: 22000, duration: '10 days',
    lesson: '<strong>Key lesson:</strong> Ahmedabad developed India\'s first Heat Action Plan (HAP) in 2013 as direct response. Became national model. Night cooling centres introduced.',
    current: false
  },
  {
    year: '2002', name: 'Andhra Pradesh Crisis', states: 2, peakTemp: 45.9,
    deaths: 1030, hosp: 16000, duration: '12 days',
    lesson: '<strong>Key lesson:</strong> First major documented Indian heat wave. Revealed critical gaps in rural health infrastructure and drinking water access during extreme heat.',
    current: false
  },
];

const INDIA_HOSPITALS = [
  { region: 'North India',   pct: 94, beds: 12400, demand: 11650, status: 'critical' },
  { region: 'Central India', pct: 87, beds: 7200,  demand: 6264,  status: 'high'     },
  { region: 'East India',    pct: 78, beds: 9600,  demand: 7488,  status: 'high'     },
  { region: 'West India',    pct: 65, beds: 8900,  demand: 5785,  status: 'moderate' },
  { region: 'South India',   pct: 42, beds: 11200, demand: 4704,  status: 'moderate' },
  { region: 'Northeast',     pct: 18, beds: 3200,  demand: 576,   status: 'low'      },
];

const INDIA_HEALTH_TOP10 = {
  states:  ['Rajasthan','UP','Bihar','MP','Delhi','Jharkhand','Odisha','Gujarat','Haryana','Maharashtra'],
  deaths:  [68, 54, 41, 37, 14, 29, 22, 16, 11, 12],
  hosp:    [3420, 4210, 2890, 2640, 1890, 1780, 1540, 1350, 980, 1680]
};

const INDIA_FATALITY_TREND = (() => {
  const labels = [], vals = [];
  for (let d = 1; d <= 18; d++) {
    labels.push(`Jun ${d}`);
    const base = 5 + d * 2.8 + (Math.random()-0.5)*4;
    vals.push(Math.round(Math.max(3, base)));
  }
  return { labels, vals };
})();

// ── Utilities ─────────────────────────────────────────────────
function uuid() {
  return 'inc-' + Math.random().toString(36).substr(2, 9);
}

function formatDate(d = new Date()) {
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function formatDateISO(d = new Date()) {
  return d.toISOString().split('T')[0];
}

function showToast(message, type = 'info', icon = '') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon || icons[type]}</span><span>${message}</span>`;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function saveData() {
  localStorage.setItem('elnino_incidents', JSON.stringify(APP.incidents));
  localStorage.setItem('elnino_shelters', JSON.stringify(APP.shelters));
}

function loadData() {
  try {
    // Support both old 'helvino_*' keys and new 'elnino_*' keys for backwards compat
    APP.incidents = JSON.parse(localStorage.getItem('elnino_incidents') || localStorage.getItem('helvino_incidents') || '[]');
    APP.shelters  = JSON.parse(localStorage.getItem('elnino_shelters')  || localStorage.getItem('helvino_shelters')  || '[]');
  } catch (e) {
    APP.incidents = [];
    APP.shelters  = [];
  }
}

// ── Live Clock ────────────────────────────────────────────────
function startClock() {
  const clockEl = document.getElementById('liveClock');
  const dateEl  = document.getElementById('liveDate');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function tick() {
    const n = new Date();
    const h = String(n.getHours()).padStart(2,'0');
    const m = String(n.getMinutes()).padStart(2,'0');
    const s = String(n.getSeconds()).padStart(2,'0');
    clockEl.textContent = `${h}:${m}:${s}`;
    dateEl.textContent  = `${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}, ${n.getFullYear()}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── Tab Navigation ────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      switchTab(item.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  // Deactivate all
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));

  // Activate target
  document.getElementById(`nav-${tabName}`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');

  // Update topbar title
  const titles = {
    dashboard: 'Command Dashboard',
    map: 'Risk Zone Map',
    incidents: 'Incident Tracker',
    shelters: 'Shelter & Resources',
    india: '🇮🇳 India Country Analysis',
    reports: 'Report Generator'
  };
  document.getElementById('topbarTitle').textContent = titles[tabName] || '';

  APP.activeTab = tabName;

  // Init map on first visit
  if (tabName === 'map' && !APP.map) {
    setTimeout(initMap, 100);
  }

  // Init India map on first visit
  if (tabName === 'india' && !APP.indiaMap) {
    setTimeout(initIndiaMap, 100);
  }

  // On mobile, close sidebar after tab switch
  if (APP._closeSidebar) {
    APP._closeSidebar();
  }
}

// ── Sidebar Toggle ────────────────────────────────────────────
function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const mainCont = document.querySelector('.main-content');
  const toggleBtn = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');

  APP._closeSidebar = () => {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  };

  toggleBtn.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open');
      if (overlay) {
        if (sidebar.classList.contains('open')) {
          overlay.classList.add('visible');
        } else {
          overlay.classList.remove('visible');
        }
      }
    } else {
      sidebar.classList.toggle('collapsed');
      mainCont.classList.toggle('expanded');
    }
  });

  const closeBtn = document.getElementById('sidebarClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (APP._closeSidebar) APP._closeSidebar();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      if (APP._closeSidebar) APP._closeSidebar();
    });
  }

  document.getElementById('bannerClose').addEventListener('click', () => {
    document.getElementById('alertBanner').classList.add('hidden');
  });

  document.getElementById('refreshBtn').addEventListener('click', () => {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('refreshing');
    showToast('Data refreshed successfully', 'success');
    setTimeout(() => btn.classList.remove('refreshing'), 800);
  });
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════

function renderRiskTable() {
  const tbody = document.getElementById('riskTableBody');
  tbody.innerHTML = '';
  REGIONS.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color: var(--text-primary); font-weight:600">${r.name}</td>
      <td style="color: var(--heat-orange); font-weight:700">${r.temp}°</td>
      <td>${r.humidity}%</td>
      <td>${r.population}</td>
      <td><span class="risk-badge ${r.risk}">${r.risk.charAt(0).toUpperCase() + r.risk.slice(1)}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function updateDashboardStats() {
  const activeInc = APP.incidents.filter(i => i.status === 'Active').length;
  const totalShelterCap  = APP.shelters.reduce((a, s) => a + Number(s.capacity), 0);
  const totalShelterOcc  = APP.shelters.reduce((a, s) => a + Number(s.occupancy), 0);
  const pct = totalShelterCap ? Math.round(totalShelterOcc / totalShelterCap * 100) : 0;

  document.getElementById('statIncidents').textContent = activeInc;
  document.getElementById('statIncidentSub').textContent = activeInc
    ? `${activeInc} requiring attention`
    : 'No active incidents';

  if (totalShelterCap > 0) {
    document.getElementById('statShelters').textContent = `${pct}%`;
    document.getElementById('statShelterSub').textContent = `${totalShelterOcc.toLocaleString()} / ${totalShelterCap.toLocaleString()} occupied`;
  }

  // Update nav badge
  document.getElementById('incidentCountBadge').textContent = APP.incidents.length;
}

// ══════════════════════════════════════════════════════════════
//  CHARTS
// ══════════════════════════════════════════════════════════════

const CHART_DEFAULTS = {
  color: '#F0F4FF',
  grid: 'rgba(36,45,66,0.6)',
  tick: '#4E5E7A',
  font: "'Inter', sans-serif"
};

function chartDefaults() {
  Chart.defaults.color = CHART_DEFAULTS.color;
  Chart.defaults.font.family = CHART_DEFAULTS.font;
}

function initTempChart() {
  const ctx = document.getElementById('tempChart').getContext('2d');
  APP.charts.temp = new Chart(ctx, {
    type: 'line',
    data: {
      labels: TEMP_HOURS.labels,
      datasets: [
        {
          label: 'Max Temp (°C)',
          data: TEMP_HOURS.maxTemps,
          borderColor: '#FF6B35',
          backgroundColor: 'rgba(255,107,53,0.08)',
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Avg Temp (°C)',
          data: TEMP_HOURS.avgTemps,
          borderColor: '#4CC9F0',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          borderDash: [4, 4]
        },
        {
          label: 'Min Temp (°C)',
          data: TEMP_HOURS.minTemps,
          borderColor: '#2EC4B6',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.4,
          borderDash: [2, 3]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161C2B',
          borderColor: '#242D42',
          borderWidth: 1,
          titleFont: { weight: '700' },
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}°C`
          }
        }
      },
      scales: {
        x: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: {
            color: CHART_DEFAULTS.tick, maxTicksLimit: 12, font: { size: 10 }
          }
        },
        y: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: {
            color: CHART_DEFAULTS.tick, font: { size: 11 },
            callback: v => v + '°C'
          },
          min: 20, max: 55
        }
      }
    }
  });
}

function initHumidityChart() {
  const ctx = document.getElementById('humidityChart').getContext('2d');
  APP.charts.humidity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: TEMP_HOURS.labels,
      datasets: [
        {
          label: 'Humidity %',
          data: HUMIDITY_DATA,
          borderColor: '#4CC9F0',
          backgroundColor: 'rgba(76,201,240,0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Heat Index °C',
          data: HEAT_INDEX_DATA,
          borderColor: '#F7A731',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 12, font: { size: 11 }, color: '#8A9BB8' }
        },
        tooltip: {
          backgroundColor: '#161C2B',
          borderColor: '#242D42',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: { color: CHART_DEFAULTS.tick, maxTicksLimit: 8, font: { size: 10 } }
        },
        y: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: { color: CHART_DEFAULTS.tick, font: { size: 11 }, callback: v => v + '%' },
          position: 'left'
        },
        y2: {
          grid: { drawOnChartArea: false },
          ticks: { color: CHART_DEFAULTS.tick, font: { size: 11 }, callback: v => v + '°' },
          position: 'right'
        }
      }
    }
  });
}

function initHistoricalChart() {
  const ctx = document.getElementById('historicalChart').getContext('2d');
  APP.charts.historical = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: HISTORICAL.labels,
      datasets: [
        {
          label: 'Peak Temp (°C)',
          data: HISTORICAL.peakTemps,
          backgroundColor: [
            'rgba(255,107,53,0.8)',
            'rgba(255,107,53,0.4)',
            'rgba(255,107,53,0.4)',
            'rgba(255,107,53,0.4)',
            'rgba(255,107,53,0.4)'
          ],
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161C2B',
          borderColor: '#242D42',
          borderWidth: 1,
          callbacks: {
            afterLabel: (ctx) => {
              const i = ctx.dataIndex;
              return [
                `Fatalities: ${HISTORICAL.fatalities[i]}`,
                `Duration: ${HISTORICAL.duration[i]} days`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: { color: CHART_DEFAULTS.tick, font: { size: 10 } }
        },
        y: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: { color: CHART_DEFAULTS.tick, callback: v => v + '°C', font: { size: 11 } },
          min: 35, max: 55
        }
      }
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  MAP
// ══════════════════════════════════════════════════════════════

function initMap() {
  if (APP.map) return;

  APP.map = L.map('heatMap', {
    center: [37.6, 15.4],
    zoom: 8,
    zoomControl: true
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(APP.map);

  renderMapLayers();

  // Layer toggles
  document.getElementById('layerRisk').addEventListener('change', e => {
    if (e.target.checked) { APP.mapLayers.risk && APP.map.addLayer(APP.mapLayers.risk); }
    else { APP.mapLayers.risk && APP.map.removeLayer(APP.mapLayers.risk); }
  });
  document.getElementById('layerShelters').addEventListener('change', e => {
    if (e.target.checked) { APP.mapLayers.shelters && APP.map.addLayer(APP.mapLayers.shelters); }
    else { APP.mapLayers.shelters && APP.map.removeLayer(APP.mapLayers.shelters); }
  });
  document.getElementById('layerIncidents').addEventListener('change', e => {
    if (e.target.checked) { APP.mapLayers.incidents && APP.map.addLayer(APP.mapLayers.incidents); }
    else { APP.mapLayers.incidents && APP.map.removeLayer(APP.mapLayers.incidents); }
  });
}

const RISK_COLORS = {
  extreme:  { color: '#D62839', fillOpacity: 0.35 },
  high:     { color: '#FF6B35', fillOpacity: 0.28 },
  moderate: { color: '#F7A731', fillOpacity: 0.22 },
  low:      { color: '#2EC4B6', fillOpacity: 0.18 }
};

const ZONE_OFFSETS = [
  [0, 0], [0.12, 0.18], [-0.15, -0.1], [0.2, -0.25],
  [-0.08, 0.3], [-0.25, 0.12], [0.1, 0.4]
];

function renderMapLayers() {
  // Remove existing layers
  Object.values(APP.mapLayers).forEach(l => l && APP.map.removeLayer(l));

  // Risk zone circles
  const riskGroup = L.layerGroup();
  REGIONS.forEach((r, i) => {
    const off = ZONE_OFFSETS[i] || [0, 0];
    const cfg = RISK_COLORS[r.risk];
    const circle = L.circle(
      [r.lat + off[0], r.lng + off[1]],
      {
        radius: 18000,
        color: cfg.color,
        fillColor: cfg.color,
        fillOpacity: cfg.fillOpacity,
        weight: 2,
        dashArray: r.risk === 'extreme' ? '6 4' : ''
      }
    );
    circle.bindPopup(`
      <div class="map-popup">
        <h4>${r.name}</h4>
        <div class="pop-row"><span class="pop-label">Temperature</span><span class="pop-val" style="color:#FF6B35">${r.temp}°C</span></div>
        <div class="pop-row"><span class="pop-label">Humidity</span><span class="pop-val">${r.humidity}%</span></div>
        <div class="pop-row"><span class="pop-label">Population</span><span class="pop-val">${r.population}</span></div>
        <div class="pop-row"><span class="pop-label">Risk Level</span><span class="pop-val" style="color:${cfg.color}">${r.risk.toUpperCase()}</span></div>
      </div>
    `, { maxWidth: 220 });
    riskGroup.addLayer(circle);

    // Region label marker
    const labelIcon = L.divIcon({
      className: '',
      html: `<div style="background:rgba(0,0,0,0.75);color:#F0F4FF;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;font-family:Inter,sans-serif;white-space:nowrap;border:1px solid ${cfg.color}">${r.name.split('–')[0].trim()}</div>`,
      iconAnchor: [30, 10]
    });
    L.marker([r.lat + off[0], r.lng + off[1]], { icon: labelIcon, interactive: false }).addTo(riskGroup);
  });
  APP.mapLayers.risk = riskGroup;
  riskGroup.addTo(APP.map);

  // Shelter markers
  refreshMapShelters();

  // Incident markers
  refreshMapIncidents();
}

function refreshMapShelters() {
  if (APP.mapLayers.shelters) APP.map.removeLayer(APP.mapLayers.shelters);

  const group = L.layerGroup();
  const shelterIcon = L.divIcon({
    className: '',
    html: `<div style="background:#2EC4B6;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 0 8px rgba(46,196,182,0.5);border:2px solid rgba(46,196,182,0.8)">🏥</div>`,
    iconAnchor: [11, 11]
  });

  APP.shelters.forEach((s, idx) => {
    const region = REGIONS.find(r => r.name === s.region) || REGIONS[idx % REGIONS.length];
    const off = ZONE_OFFSETS[idx % ZONE_OFFSETS.length];
    const pct = Math.round(Number(s.occupancy) / Number(s.capacity) * 100);
    const marker = L.marker(
      [region.lat + off[0] + 0.05, region.lng + off[1] + 0.05],
      { icon: shelterIcon }
    );
    marker.bindPopup(`
      <div class="map-popup">
        <h4>🏥 ${s.name}</h4>
        <div class="pop-row"><span class="pop-label">Region</span><span class="pop-val">${s.region}</span></div>
        <div class="pop-row"><span class="pop-label">Occupancy</span><span class="pop-val">${s.occupancy} / ${s.capacity} (${pct}%)</span></div>
        <div class="pop-row"><span class="pop-label">Water</span><span class="pop-val">${s.water}</span></div>
        <div class="pop-row"><span class="pop-label">Medical</span><span class="pop-val">${s.medical}</span></div>
      </div>
    `, { maxWidth: 220 });
    group.addLayer(marker);
  });

  APP.mapLayers.shelters = group;
  if (document.getElementById('layerShelters').checked) group.addTo(APP.map);

  // Update map stat
  document.getElementById('mapShelterCount').textContent = APP.shelters.length;
}

function refreshMapIncidents() {
  if (APP.mapLayers.incidents) APP.map.removeLayer(APP.mapLayers.incidents);

  const group = L.layerGroup();
  const COLORS = { Critical: '#D62839', High: '#FF6B35', Moderate: '#F7A731', Low: '#2EC4B6' };

  APP.incidents.filter(i => i.status !== 'Resolved').forEach((inc, idx) => {
    const region = REGIONS.find(r => r.name === inc.region) || REGIONS[0];
    const col = COLORS[inc.severity] || '#8A9BB8';
    const iconHtml = `<div style="background:${col};width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 8px ${col}66;display:flex;align-items:center;justify-content:center;font-size:10px">⚠</div>`;
    const icon = L.divIcon({ className: '', html: iconHtml, iconAnchor: [9, 9] });
    const marker = L.marker(
      [region.lat + (Math.random()-0.5)*0.1, region.lng + (Math.random()-0.5)*0.1],
      { icon }
    );
    marker.bindPopup(`
      <div class="map-popup">
        <h4>⚠️ ${inc.type}</h4>
        <div class="pop-row"><span class="pop-label">Region</span><span class="pop-val">${inc.region}</span></div>
        <div class="pop-row"><span class="pop-label">Severity</span><span class="pop-val" style="color:${col}">${inc.severity}</span></div>
        <div class="pop-row"><span class="pop-label">Casualties</span><span class="pop-val">${inc.casualties}</span></div>
        <div class="pop-row"><span class="pop-label">Status</span><span class="pop-val">${inc.status}</span></div>
      </div>
    `, { maxWidth: 220 });
    group.addLayer(marker);
  });

  APP.mapLayers.incidents = group;
  if (document.getElementById('layerIncidents') && document.getElementById('layerIncidents').checked) {
    group.addTo(APP.map);
  }
}

// ══════════════════════════════════════════════════════════════
//  INCIDENTS
// ══════════════════════════════════════════════════════════════

function initIncidentForm() {
  document.getElementById('incidentForm').addEventListener('submit', e => {
    e.preventDefault();
    const inc = {
      id: uuid(),
      type: document.getElementById('incType').value,
      region: document.getElementById('incRegion').value,
      severity: document.getElementById('incSeverity').value,
      casualties: Number(document.getElementById('incCasualties').value) || 0,
      reporter: document.getElementById('incReporter').value,
      notes: document.getElementById('incNotes').value,
      status: 'Active',
      timestamp: new Date().toISOString()
    };

    APP.incidents.unshift(inc);
    saveData();
    renderIncidents();
    updateDashboardStats();
    if (APP.map) refreshMapIncidents();

    document.getElementById('incidentForm').reset();
    showToast(`Incident logged: ${inc.type} in ${inc.region}`, 'warning', '🚨');
  });

  document.getElementById('filterSeverity').addEventListener('change', renderIncidents);
  document.getElementById('filterRegion').addEventListener('change', renderIncidents);
}

function renderIncidents() {
  const list  = document.getElementById('incidentList');
  const empty = document.getElementById('incidentEmpty');
  const total = document.getElementById('incidentTotal');

  const sevFilter = document.getElementById('filterSeverity').value;
  const regFilter = document.getElementById('filterRegion').value;

  let filtered = APP.incidents;
  if (sevFilter !== 'all') filtered = filtered.filter(i => i.severity === sevFilter);
  if (regFilter !== 'all') filtered = filtered.filter(i => i.region === regFilter);

  total.textContent = filtered.length;

  // Remove existing items (keep empty state)
  list.querySelectorAll('.incident-item').forEach(el => el.remove());

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(inc => {
    const div = document.createElement('div');
    div.className = `incident-item ${inc.severity.toLowerCase()}${inc.status === 'Resolved' ? ' resolved' : ''}`;
    div.dataset.id = inc.id;
    const ts = new Date(inc.timestamp);
    div.innerHTML = `
      <div class="incident-top">
        <span class="incident-type">${inc.type}</span>
        <span class="sev-pill ${inc.severity}">${inc.severity}</span>
      </div>
      <div class="incident-meta">
        <span>📍 ${inc.region}</span>
        <span>⏱ ${formatDate(ts)}</span>
        ${inc.casualties > 0 ? `<span>💀 ${inc.casualties}</span>` : ''}
        <span class="incident-status ${inc.status}">${inc.status}</span>
      </div>
    `;
    div.addEventListener('click', () => openIncidentModal(inc.id));
    list.appendChild(div);
  });
}

function openIncidentModal(id) {
  const inc = APP.incidents.find(i => i.id === id);
  if (!inc) return;
  APP.currentModalId = id;

  document.getElementById('modalTitle').textContent = `${inc.type} — ${inc.severity}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-detail"><label>Type</label><p>${inc.type}</p></div>
    <div class="modal-detail"><label>Region</label><p>${inc.region}</p></div>
    <div class="modal-detail"><label>Severity</label><p><span class="sev-pill ${inc.severity}">${inc.severity}</span></p></div>
    <div class="modal-detail"><label>Status</label><p><span class="incident-status ${inc.status}">${inc.status}</span></p></div>
    <div class="modal-detail"><label>Casualties</label><p>${inc.casualties}</p></div>
    <div class="modal-detail"><label>Reported By</label><p>${inc.reporter || '—'}</p></div>
    <div class="modal-detail"><label>Time</label><p>${formatDate(new Date(inc.timestamp))}</p></div>
    ${inc.notes ? `<div class="modal-detail"><label>Notes</label><p>${inc.notes}</p></div>` : ''}
  `;

  document.getElementById('incidentModal').classList.add('open');
}

function initIncidentModal() {
  document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('incidentModal').classList.remove('open');
  });

  document.getElementById('incidentModal').addEventListener('click', e => {
    if (e.target === document.getElementById('incidentModal')) {
      document.getElementById('incidentModal').classList.remove('open');
    }
  });

  document.getElementById('modalResolve').addEventListener('click', () => {
    const inc = APP.incidents.find(i => i.id === APP.currentModalId);
    if (inc) {
      inc.status = 'Resolved';
      saveData();
      renderIncidents();
      updateDashboardStats();
      if (APP.map) refreshMapIncidents();
      document.getElementById('incidentModal').classList.remove('open');
      showToast('Incident marked as resolved', 'success');
    }
  });

  document.getElementById('modalDelete').addEventListener('click', () => {
    APP.incidents = APP.incidents.filter(i => i.id !== APP.currentModalId);
    saveData();
    renderIncidents();
    updateDashboardStats();
    if (APP.map) refreshMapIncidents();
    document.getElementById('incidentModal').classList.remove('open');
    showToast('Incident deleted', 'error');
  });
}

// ══════════════════════════════════════════════════════════════
//  SHELTERS
// ══════════════════════════════════════════════════════════════

function initShelterForm() {
  document.getElementById('shelterForm').addEventListener('submit', e => {
    e.preventDefault();
    const cap = Number(document.getElementById('shelCapacity').value);
    const occ = Number(document.getElementById('shelOccupancy').value);

    if (occ > cap) {
      showToast('Occupancy cannot exceed capacity', 'error');
      return;
    }

    const shelter = {
      id: uuid(),
      name: document.getElementById('shelName').value,
      region: document.getElementById('shelRegion').value,
      capacity: cap,
      occupancy: occ,
      water: document.getElementById('shelWater').value,
      medical: document.getElementById('shelMedical').value,
      contact: document.getElementById('shelContact').value,
      timestamp: new Date().toISOString()
    };

    APP.shelters.push(shelter);
    saveData();
    renderShelters();
    updateDashboardStats();
    if (APP.map) refreshMapShelters();

    document.getElementById('shelterForm').reset();
    showToast(`Shelter "${shelter.name}" registered`, 'success', '🏥');
  });
}

function renderShelters() {
  const list    = document.getElementById('shelterList');
  const empty   = document.getElementById('shelterEmpty');
  const total   = document.getElementById('shelterTotal');
  const capText = document.getElementById('overallCapText');
  const capBar  = document.getElementById('overallCapBar');

  total.textContent = APP.shelters.length;

  const totalCap = APP.shelters.reduce((a, s) => a + Number(s.capacity), 0);
  const totalOcc = APP.shelters.reduce((a, s) => a + Number(s.occupancy), 0);
  const pct = totalCap ? Math.round(totalOcc / totalCap * 100) : 0;
  capText.textContent = `${totalOcc.toLocaleString()} / ${totalCap.toLocaleString()} total occupancy (${pct}%)`;
  capBar.style.width = pct + '%';
  capBar.style.background = pct > 80 ? '#D62839' : pct > 60 ? '#F7A731' : '#2EC4B6';

  list.querySelectorAll('.shelter-card').forEach(el => el.remove());

  if (APP.shelters.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  APP.shelters.forEach(s => {
    const cap = Number(s.capacity);
    const occ = Number(s.occupancy);
    const pct = cap ? Math.round(occ / cap * 100) : 0;
    const capClass = pct > 80 ? 'cap-high' : pct > 60 ? 'cap-medium' : 'cap-low';

    const div = document.createElement('div');
    div.className = `shelter-card ${capClass}`;
    div.innerHTML = `
      <div class="shelter-top">
        <div>
          <div class="shelter-name">${s.name}</div>
          <div class="shelter-region">📍 ${s.region}</div>
        </div>
        <button class="shelter-delete" data-id="${s.id}" title="Remove shelter">✕</button>
      </div>
      <div class="shelter-cap-row">
        <span>Occupancy: <strong>${occ.toLocaleString()} / ${cap.toLocaleString()}</strong></span>
        <strong style="color: ${pct > 80 ? 'var(--danger-light)' : pct > 60 ? 'var(--warning-amber)' : 'var(--safe-teal)'}">${pct}%</strong>
      </div>
      <div class="capacity-bar-wrap">
        <div class="capacity-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="shelter-resources">
        <span class="resource-pill ${s.water}">💧 Water: ${s.water}</span>
        <span class="resource-pill ${s.medical}">🏥 Medical: ${s.medical}</span>
        ${s.contact ? `<span class="resource-pill Adequate">📞 ${s.contact}</span>` : ''}
      </div>
    `;
    div.querySelector('.shelter-delete').addEventListener('click', e => {
      e.stopPropagation();
      APP.shelters = APP.shelters.filter(sh => sh.id !== s.id);
      saveData();
      renderShelters();
      updateDashboardStats();
      if (APP.map) refreshMapShelters();
      showToast(`Shelter "${s.name}" removed`, 'info');
    });
    list.appendChild(div);
  });
}

// ══════════════════════════════════════════════════════════════
//  REPORT GENERATOR
// ══════════════════════════════════════════════════════════════

function initReportGenerator() {
  // Set default dates
  const today = formatDateISO();
  const weekAgo = formatDateISO(new Date(Date.now() - 7 * 86400000));
  document.getElementById('rptDateFrom').value = weekAgo;
  document.getElementById('rptDateTo').value   = today;

  // Report type selector
  document.querySelectorAll('.report-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.report-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP.reportType = btn.dataset.type;
    });
  });

  document.getElementById('generateReportBtn').addEventListener('click', generateReportPreview);
  document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
  document.getElementById('printBtn').addEventListener('click', () => window.print());
}

function generateReportPreview() {
  const from    = document.getElementById('rptDateFrom').value;
  const to      = document.getElementById('rptDateTo').value;
  const region  = document.getElementById('rptRegion').value;
  const author  = document.getElementById('rptAuthor').value || 'El Niño Emergency Operations Center';
  const notes   = document.getElementById('rptNotes').value;
  const type    = APP.reportType;
  const now     = new Date();

  const filteredIncidents = APP.incidents.filter(i => {
    const d = i.timestamp.split('T')[0];
    const inDate = (!from || d >= from) && (!to || d <= to);
    const inRegion = region === 'all' || i.region === region;
    return inDate && inRegion;
  });

  const filteredShelters = APP.shelters.filter(s => {
    return region === 'all' || s.region === region;
  });

  const activeInc   = filteredIncidents.filter(i => i.status === 'Active').length;
  const resolvedInc = filteredIncidents.filter(i => i.status === 'Resolved').length;
  const criticalInc = filteredIncidents.filter(i => i.severity === 'Critical').length;
  const totalCasualties = filteredIncidents.reduce((a, i) => a + i.casualties, 0);
  const totalShelterCap = filteredShelters.reduce((a, s) => a + Number(s.capacity), 0);
  const totalShelterOcc = filteredShelters.reduce((a, s) => a + Number(s.occupancy), 0);
  const shelterPct = totalShelterCap ? Math.round(totalShelterOcc / totalShelterCap * 100) : 0;

  const regionStr = region === 'all' ? 'All Regions' : region;
  const reportTitles = {
    executive: 'Executive Summary Report',
    field: 'Field Operations Report',
    public: 'Public Information Bulletin'
  };

  let html = `
    <div class="rpt-header">
      <span class="rpt-logo">El Niño</span>
      <h1>${reportTitles[type]}</h1>
      <div class="rpt-meta">
        Heat Wave El Niño — ${regionStr}<br>
        Period: ${from || 'N/A'} to ${to || 'N/A'} &nbsp;|&nbsp;
        Generated: ${formatDate(now)}<br>
        Prepared by: <strong>${author}</strong>
      </div>
    </div>
  `;

  if (type === 'executive') {
    html += `
      <div class="rpt-section">
        <h2>Situation Overview</h2>
        <p>Heat Wave El Niño continues to impact ${regionStr} with peak temperatures reaching <strong>48.7°C</strong> in Zone A–Ardena. This event is classified as <strong>EXTREME</strong> and poses severe risk to public health and critical infrastructure.</p>
        <div class="rpt-stat-row">
          <div class="rpt-stat-box"><span class="val">48.7°C</span><span class="lbl">Peak Temp</span></div>
          <div class="rpt-stat-box"><span class="val">7</span><span class="lbl">Affected Zones</span></div>
          <div class="rpt-stat-box"><span class="val">12</span><span class="lbl">Fatalities</span></div>
          <div class="rpt-stat-box"><span class="val">347</span><span class="lbl">Hospitalized</span></div>
          <div class="rpt-stat-box"><span class="val">${filteredIncidents.length}</span><span class="lbl">Total Incidents</span></div>
          <div class="rpt-stat-box"><span class="val">${totalCasualties}</span><span class="lbl">Casualties</span></div>
        </div>
      </div>

      <div class="rpt-section">
        <h2>Risk Zone Summary</h2>
        <table class="rpt-table">
          <thead><tr><th>Region</th><th>Temp (°C)</th><th>Humidity</th><th>Population</th><th>Risk</th></tr></thead>
          <tbody>
            ${REGIONS.filter(r => region === 'all' || r.name === region).map(r =>
              `<tr><td>${r.name}</td><td>${r.temp}°C</td><td>${r.humidity}%</td><td>${r.population}</td><td>${r.risk.toUpperCase()}</td></tr>`
            ).join('')}
          </tbody>
        </table>
      </div>

      <div class="rpt-section">
        <h2>Incident Summary</h2>
        <p>Total Incidents: <strong>${filteredIncidents.length}</strong> | Active: <strong>${activeInc}</strong> | Resolved: <strong>${resolvedInc}</strong> | Critical: <strong>${criticalInc}</strong></p>
        ${filteredIncidents.length > 0 ? `
        <table class="rpt-table">
          <thead><tr><th>Type</th><th>Region</th><th>Severity</th><th>Status</th><th>Casualties</th><th>Time</th></tr></thead>
          <tbody>
            ${filteredIncidents.slice(0, 10).map(i =>
              `<tr><td>${i.type}</td><td>${i.region}</td><td>${i.severity}</td><td>${i.status}</td><td>${i.casualties}</td><td>${formatDate(new Date(i.timestamp))}</td></tr>`
            ).join('')}
            ${filteredIncidents.length > 10 ? `<tr><td colspan="6" style="text-align:center;color:#999">... and ${filteredIncidents.length - 10} more incidents</td></tr>` : ''}
          </tbody>
        </table>` : '<p style="color:#999">No incidents logged for this period.</p>'}
      </div>

      <div class="rpt-section">
        <h2>Shelter Status</h2>
        ${filteredShelters.length > 0 ? `
        <p>Total Shelters: <strong>${filteredShelters.length}</strong> | Overall Occupancy: <strong>${totalShelterOcc.toLocaleString()} / ${totalShelterCap.toLocaleString()} (${shelterPct}%)</strong></p>
        <table class="rpt-table">
          <thead><tr><th>Shelter</th><th>Region</th><th>Occupancy</th><th>Water</th><th>Medical</th></tr></thead>
          <tbody>
            ${filteredShelters.map(s =>
              `<tr><td>${s.name}</td><td>${s.region}</td><td>${s.occupancy}/${s.capacity} (${Math.round(Number(s.occupancy)/Number(s.capacity)*100)}%)</td><td>${s.water}</td><td>${s.medical}</td></tr>`
            ).join('')}
          </tbody>
        </table>` : '<p style="color:#999">No shelters registered for this region.</p>'}
      </div>

      ${notes ? `<div class="rpt-section"><h2>Additional Notes</h2><p>${notes}</p></div>` : ''}

      <div class="rpt-section">
        <h2>Key Recommendations</h2>
        <ol>
          <li>Immediately enforce mandatory evacuation in Zones A and D (temperatures exceeding 47°C).</li>
          <li>Increase shelter capacity in high-density zones — current utilization at ${shelterPct}%.</li>
          <li>Deploy additional medical personnel to Zones A, B, and D.</li>
          <li>Issue public cooling center locations via all media channels.</li>
          <li>Coordinate water distribution to all affected zones by 06:00 daily.</li>
        </ol>
      </div>
    `;
  } else if (type === 'field') {
    html += `
      <div class="rpt-section">
        <h2>Field Operations Status</h2>
        <p><strong>Operational Period:</strong> ${from} to ${to} | <strong>AO:</strong> ${regionStr}</p>
        <p>This report provides field-level intelligence for emergency responders operating within the El Niño heat wave event zone.</p>
      </div>

      <div class="rpt-section">
        <h2>Active Incidents (${activeInc})</h2>
        ${filteredIncidents.filter(i => i.status === 'Active').length > 0 ? `
        <table class="rpt-table">
          <thead><tr><th>ID</th><th>Type</th><th>Region</th><th>Severity</th><th>Casualties</th><th>Reporter</th><th>Notes</th></tr></thead>
          <tbody>
            ${filteredIncidents.filter(i => i.status === 'Active').map(i =>
              `<tr><td style="font-size:10px">${i.id}</td><td>${i.type}</td><td>${i.region}</td><td>${i.severity}</td><td>${i.casualties}</td><td>${i.reporter||'—'}</td><td>${i.notes||'—'}</td></tr>`
            ).join('')}
          </tbody>
        </table>` : '<p style="color:#999">No active incidents.</p>'}
      </div>

      <div class="rpt-section">
        <h2>Shelter Locations & Capacity</h2>
        ${filteredShelters.length > 0 ? `
        <table class="rpt-table">
          <thead><tr><th>Shelter</th><th>Region</th><th>Capacity</th><th>Occupancy</th><th>Water</th><th>Medical</th><th>Contact</th></tr></thead>
          <tbody>
            ${filteredShelters.map(s =>
              `<tr><td>${s.name}</td><td>${s.region}</td><td>${s.capacity}</td><td>${s.occupancy}</td><td>${s.water}</td><td>${s.medical}</td><td>${s.contact||'—'}</td></tr>`
            ).join('')}
          </tbody>
        </table>` : '<p style="color:#999">No shelters in this area.</p>'}
      </div>

      <div class="rpt-section">
        <h2>Danger Zone Temperatures</h2>
        <table class="rpt-table">
          <thead><tr><th>Zone</th><th>Temp</th><th>Humidity</th><th>Risk</th></tr></thead>
          <tbody>
            ${REGIONS.filter(r => region === 'all' || r.name === region)
              .filter(r => r.risk === 'extreme' || r.risk === 'high')
              .map(r => `<tr><td>${r.name}</td><td><strong>${r.temp}°C</strong></td><td>${r.humidity}%</td><td>${r.risk.toUpperCase()}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>

      ${notes ? `<div class="rpt-section"><h2>Commander's Notes</h2><p>${notes}</p></div>` : ''}
    `;
  } else {
    // Public bulletin
    html += `
      <div class="rpt-section">
        <h2>⚠️ Public Safety Advisory</h2>
        <p><strong>EXTREME HEAT WARNING</strong> in effect for ${regionStr}. Heat Wave El Niño is producing dangerous temperatures. All residents are urged to take immediate precautions.</p>
        <div class="rpt-stat-row">
          <div class="rpt-stat-box"><span class="val">48.7°C</span><span class="lbl">Max Temp Today</span></div>
          <div class="rpt-stat-box"><span class="val">7</span><span class="lbl">Zones Affected</span></div>
          <div class="rpt-stat-box"><span class="val">${filteredShelters.length}</span><span class="lbl">Cooling Centers</span></div>
        </div>
      </div>

      <div class="rpt-section">
        <h2>🏥 Cooling Center Locations</h2>
        ${filteredShelters.length > 0 ? `
        <table class="rpt-table">
          <thead><tr><th>Name</th><th>Area</th><th>Availability</th><th>Contact</th></tr></thead>
          <tbody>
            ${filteredShelters.map(s => {
              const pct = Math.round(Number(s.occupancy)/Number(s.capacity)*100);
              const avail = pct < 60 ? '✅ Open' : pct < 90 ? '⚠️ Limited' : '❌ Full';
              return `<tr><td>${s.name}</td><td>${s.region}</td><td>${avail}</td><td>${s.contact||'—'}</td></tr>`;
            }).join('')}
          </tbody>
        </table>` : '<p style="color:#999">No cooling centers currently registered in this area.</p>'}
      </div>

      <div class="rpt-section">
        <h2>🛡️ Safety Guidelines</h2>
        <ol>
          <li><strong>Stay indoors</strong> during peak hours (11:00–18:00). Use air conditioning or fans.</li>
          <li><strong>Stay hydrated</strong> — drink water every 20 minutes even if not thirsty.</li>
          <li><strong>Avoid outdoor exercise</strong> or strenuous activity in the heat.</li>
          <li><strong>Check on vulnerable neighbors</strong> — elderly, children, and those with chronic illness.</li>
          <li><strong>Use cooling centers</strong> — listed above, open 24 hours.</li>
          <li><strong>Emergency: Call 112</strong> for medical emergencies related to heat.</li>
        </ol>
      </div>

      <div class="rpt-section">
        <h2>🌡️ What to Watch For</h2>
        <p><strong>Heatstroke symptoms:</strong> High body temperature, confusion, loss of consciousness, dry skin. Call emergency services immediately.</p>
        <p><strong>Heat exhaustion:</strong> Heavy sweating, weakness, cold/pale skin, nausea. Move to cool area and hydrate.</p>
      </div>

      ${notes ? `<div class="rpt-section"><h2>Additional Information</h2><p>${notes}</p></div>` : ''}
    `;
  }

  html += `
    <div class="rpt-footer">
      El Niño HEAT WAVE OPERATIONS CENTER &nbsp;|&nbsp; Report generated ${formatDate(now)} &nbsp;|&nbsp; CONFIDENTIAL
    </div>
  `;

  document.getElementById('reportPreview').innerHTML = html;
  showToast('Report preview generated', 'success', '📊');
}

function exportPdf() {
  const preview = document.getElementById('reportPreview');
  if (!preview.querySelector('.rpt-header')) {
    showToast('Please generate a report preview first', 'warning');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const margin = 14;
  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  let yPos = margin;

  const addPage = () => { doc.addPage(); yPos = margin; };
  const checkPage = (h) => { if (yPos + h > pageH - margin) addPage(); };

  // Header
  doc.setFillColor(255, 107, 53);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('El Niño', margin, 12);
  doc.setFontSize(11);
  const titles = { executive: 'Executive Summary Report', field: 'Field Operations Report', public: 'Public Information Bulletin' };
  doc.text(titles[APP.reportType] || 'Heat Wave Report', margin, 20);

  // Meta
  doc.setFontSize(9);
  const now = new Date();
  doc.text(`Generated: ${formatDate(now)}  |  Prepared by: ${document.getElementById('rptAuthor').value || 'El Niño EOC'}`, margin, 26);

  yPos = 36;
  doc.setTextColor(30, 30, 30);

  // Region info
  const region = document.getElementById('rptRegion').value;
  const regionStr = region === 'all' ? 'All Regions' : region;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Region: ${regionStr}  |  Period: ${document.getElementById('rptDateFrom').value} to ${document.getElementById('rptDateTo').value}`, margin, yPos);
  yPos += 10;

  // Key Stats
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 107, 53);
  doc.text('KEY STATISTICS', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);

  const stats = [
    ['Peak Temperature', '48.7°C'],
    ['Affected Regions', '7'],
    ['Total Incidents', APP.incidents.length.toString()],
    ['Active Incidents', APP.incidents.filter(i => i.status === 'Active').length.toString()],
    ['Confirmed Fatalities', '12'],
    ['Hospitalized', '347'],
    ['Registered Shelters', APP.shelters.length.toString()],
  ];

  stats.forEach(([label, val]) => {
    checkPage(7);
    doc.text(`• ${label}: ${val}`, margin + 4, yPos);
    yPos += 6;
  });

  yPos += 4;

  // Regional risk table
  checkPage(12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 107, 53);
  doc.text('REGIONAL RISK SUMMARY', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);

  REGIONS.filter(r => region === 'all' || r.name === region).forEach(r => {
    checkPage(7);
    doc.text(`• ${r.name}: ${r.temp}°C | Humidity: ${r.humidity}% | Pop: ${r.population} | Risk: ${r.risk.toUpperCase()}`, margin + 4, yPos);
    yPos += 6;
  });

  yPos += 4;

  // Incidents
  checkPage(12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 107, 53);
  doc.text('INCIDENTS', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);

  if (APP.incidents.length === 0) {
    doc.text('No incidents logged.', margin + 4, yPos);
    yPos += 7;
  } else {
    APP.incidents.slice(0, 20).forEach(i => {
      checkPage(7);
      doc.text(`• [${i.severity}] ${i.type} — ${i.region} | Status: ${i.status} | Casualties: ${i.casualties}`, margin + 4, yPos);
      yPos += 6;
    });
  }

  yPos += 4;

  // Shelters
  checkPage(12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 107, 53);
  doc.text('SHELTER & RESOURCES', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);

  if (APP.shelters.length === 0) {
    doc.text('No shelters registered.', margin + 4, yPos);
    yPos += 7;
  } else {
    APP.shelters.forEach(s => {
      const pct = Math.round(Number(s.occupancy) / Number(s.capacity) * 100);
      checkPage(7);
      doc.text(`• ${s.name} (${s.region}): ${s.occupancy}/${s.capacity} occupied (${pct}%) | Water: ${s.water} | Medical: ${s.medical}`, margin + 4, yPos);
      yPos += 6;
    });
  }

  // Notes
  const notes = document.getElementById('rptNotes').value;
  if (notes) {
    yPos += 4;
    checkPage(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 107, 53);
    doc.text('ADDITIONAL NOTES', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    const splitNotes = doc.splitTextToSize(notes, pageW - margin * 2);
    doc.text(splitNotes, margin + 4, yPos);
    yPos += splitNotes.length * 5 + 4;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `El Niño HEAT WAVE OPERATIONS CENTER  |  CONFIDENTIAL  |  Page ${p} of ${totalPages}`,
      margin, pageH - 8
    );
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  }

  const filename = `El-Nino_${titles[APP.reportType].replace(/\s+/g, '_')}_${formatDateISO()}.pdf`;
  doc.save(filename);
  showToast(`PDF exported: ${filename}`, 'success', '📥');
}

// ══════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════
//  INDIA MODULE
// ══════════════════════════════════════════════════════════════

function initIndiaModule() {
  // Sub-tab pill switching
  document.querySelectorAll('.india-subtab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.india-subtab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.india-sub').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`isub-${btn.dataset.subtab}`).classList.add('active');

      // Lazy init charts when sub-tabs first open
      if (btn.dataset.subtab === 'districts' && !APP.charts.districtTemp) initDistrictTempChart();
      if (btn.dataset.subtab === 'health' && !APP.charts.healthImpact) { initHealthImpactChart(); initFatalityTrendChart(); }
      if (btn.dataset.subtab === 'history' && !APP.charts.indiaHistorical) initIndiaHistoricalChart();
      if (btn.dataset.subtab === 'tamilnadu') {
        if (!APP._tnMapInitialized && window.initTNMap) {
          initTNMap();
          APP._tnMapInitialized = true;
        }
      }

      // Live data refresh button
      if (btn.dataset.subtab === 'livedata') {
        const refreshBtn = document.getElementById('refreshLiveBtn');
        if (refreshBtn && !refreshBtn._wired) {
          refreshBtn._wired = true;
          refreshBtn.addEventListener('click', async () => {
            refreshBtn.textContent = '⏳ Fetching…';
            refreshBtn.disabled = true;
            if (window.fetchOpenMeteo) await fetchOpenMeteo();
            if (window.fetchOpenMeteoArchive) await fetchOpenMeteoArchive();
            if (window.fetchNASAPower) await fetchNASAPower();
            if (window.fetchNOAAEnso) await fetchNOAAEnso();
            if (window.fetchTNDistrictWeather) await fetchTNDistrictWeather();
            if (window.fetchTNAirQuality) await fetchTNAirQuality();
            refreshBtn.textContent = '🔄 Refresh';
            refreshBtn.disabled = false;
            showToast('Live data refreshed!', 'success', '🌐');
          });
        }
      }
    });
  });

  // State table filters & sort
  ['filterStateRegion','filterIMDAlert','sortStates'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderStateTable);
  });

  renderStateTable();
  renderDistrictTable();
  renderHospitalGauges();
  renderHistoricalTimeline();
  initAlertDonutChart();
  initStateTempBarChart();
}


// ── India Map ─────────────────────────────────────────────────
function initIndiaMap() {
  if (APP.indiaMap) return;

  APP.indiaMap = L.map('indiaMap', {
    center: [22.5, 82.5],
    zoom: 4.5,
    zoomControl: true,
    attributionControl: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 10
  }).addTo(APP.indiaMap);

  const ALERT_CFG = {
    Red:    { color: '#D62839', fillOpacity: 0.45, radius: 70000 },
    Orange: { color: '#FF6B35', fillOpacity: 0.35, radius: 60000 },
    Yellow: { color: '#F7A731', fillOpacity: 0.28, radius: 55000 },
    Normal: { color: '#2EC4B6', fillOpacity: 0.20, radius: 50000 },
  };

  INDIA_STATES.forEach(s => {
    const cfg = ALERT_CFG[s.alert];
    const circle = L.circle([s.lat, s.lng], {
      radius: cfg.radius,
      color: cfg.color,
      fillColor: cfg.color,
      fillOpacity: cfg.fillOpacity,
      weight: s.alert === 'Red' ? 2 : 1,
      dashArray: s.alert === 'Red' ? '6 4' : ''
    });

    circle.bindPopup(`
      <div class="map-popup">
        <h4>${s.name}</h4>
        <div class="pop-row"><span class="pop-label">Peak Temp</span><span class="pop-val" style="color:#FF6B35">${s.temp}°C</span></div>
        <div class="pop-row"><span class="pop-label">IMD Alert</span><span class="pop-val" style="color:${cfg.color}">${s.alert}</span></div>
        <div class="pop-row"><span class="pop-label">Heat Deaths</span><span class="pop-val">${s.deaths}</span></div>
        <div class="pop-row"><span class="pop-label">Hospitalized</span><span class="pop-val">${s.hosp.toLocaleString()}</span></div>
        <div class="pop-row"><span class="pop-label">NDRF</span><span class="pop-val">${s.ndrf}</span></div>
        <div class="pop-row"><span class="pop-label">Population</span><span class="pop-val">${s.pop}</span></div>
      </div>
    `, { maxWidth: 240 });

    circle.addTo(APP.indiaMap);

    // State label
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:rgba(0,0,0,0.75);color:#F0F4FF;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;font-family:Inter,sans-serif;white-space:nowrap;border:1px solid ${cfg.color}">${s.name}</div>`,
      iconAnchor: [28, 8]
    });
    L.marker([s.lat, s.lng], { icon, interactive: false }).addTo(APP.indiaMap);
  });
}

// ── Alert Donut Chart ─────────────────────────────────────────
function initAlertDonutChart() {
  const ctx = document.getElementById('alertDonutChart').getContext('2d');
  const counts = { Red: 0, Orange: 0, Yellow: 0, Normal: 0 };
  INDIA_STATES.forEach(s => counts[s.alert]++);

  APP.charts.alertDonut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Red Alert', 'Orange Alert', 'Yellow Alert', 'Normal'],
      datasets: [{
        data: [counts.Red, counts.Orange, counts.Yellow, counts.Normal],
        backgroundColor: ['rgba(214,40,57,0.85)', 'rgba(255,107,53,0.85)', 'rgba(247,167,49,0.85)', 'rgba(38,222,129,0.75)'],
        borderColor: ['#D62839','#FF6B35','#F7A731','#26de81'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161C2B',
          borderColor: '#242D42',
          borderWidth: 1,
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} states` }
        }
      }
    }
  });
}

// ── State Temp Bar Chart ──────────────────────────────────────
function initStateTempBarChart() {
  const ctx = document.getElementById('stateTempBarChart').getContext('2d');
  const sorted = [...INDIA_STATES].sort((a,b) => b.temp - a.temp).slice(0,15);
  const ALERT_COLORS = { Red: 'rgba(214,40,57,0.85)', Orange: 'rgba(255,107,53,0.80)', Yellow: 'rgba(247,167,49,0.80)', Normal: 'rgba(38,222,129,0.70)' };

  APP.charts.stateTempBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(s => s.name),
      datasets: [{
        label: 'Peak Temp (°C)',
        data: sorted.map(s => s.temp),
        backgroundColor: sorted.map(s => ALERT_COLORS[s.alert]),
        borderRadius: 5,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161C2B', borderColor: '#242D42', borderWidth: 1,
          callbacks: {
            label: ctx => ` Peak: ${ctx.parsed.y}°C`,
            afterLabel: ctx => {
              const s = sorted[ctx.dataIndex];
              return [`Alert: ${s.alert}`, `Deaths: ${s.deaths}`, `Hosp: ${s.hosp.toLocaleString()}`];
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(36,45,66,0.6)' }, ticks: { color: '#4E5E7A', font: { size: 10 } } },
        y: {
          grid: { color: 'rgba(36,45,66,0.6)' },
          ticks: { color: '#4E5E7A', callback: v => v + '°C', font: { size: 10 } },
          min: 32, max: 54
        }
      }
    }
  });
}

// ── State Table ───────────────────────────────────────────────
function renderStateTable() {
  const regionFilter = document.getElementById('filterStateRegion').value;
  const alertFilter  = document.getElementById('filterIMDAlert').value;
  const sortBy       = document.getElementById('sortStates').value;

  let data = [...INDIA_STATES];
  if (regionFilter !== 'all') data = data.filter(s => s.region === regionFilter);
  if (alertFilter  !== 'all') data = data.filter(s => s.alert  === alertFilter);

  const sortKeys = { temp: 'temp', deaths: 'deaths', hosp: 'hosp' };
  data.sort((a,b) => b[sortKeys[sortBy]] - a[sortKeys[sortBy]]);

  document.getElementById('stateCount').textContent = data.length;

  const ALERT_EMOJIS = { Red:'🔴', Orange:'🟠', Yellow:'🟡', Normal:'🟢' };
  const NDRF_CLASS   = { Deployed:'Deployed', 'On Standby':'Standby', 'Not Required':'NotReq', Standby:'Standby', NotReq:'NotReq' };

  const tbody = document.getElementById('stateTableBody');
  tbody.innerHTML = '';

  data.forEach(s => {
    const tr = document.createElement('tr');
    const ndrfCls = s.ndrf === 'Deployed' ? 'Deployed' : s.ndrf === 'Standby' ? 'Standby' : 'NotReq';
    tr.innerHTML = `
      <td style="color:var(--text-primary);font-weight:700">${s.name}</td>
      <td style="color:var(--text-muted);font-size:12px">${s.region}</td>
      <td style="color:var(--heat-orange);font-weight:800;font-size:15px">${s.temp}°C</td>
      <td><span class="imd-alert-pill ${s.alert}">${ALERT_EMOJIS[s.alert]} ${s.alert}</span></td>
      <td style="color:${s.deaths>30?'var(--danger-light)':s.deaths>10?'var(--warning-amber)':'var(--text-primary)'};font-weight:700">${s.deaths}</td>
      <td style="color:var(--text-secondary)">${s.hosp.toLocaleString()}</td>
      <td><span class="ndrf-pill ${ndrfCls}">${s.ndrf}</span></td>
      <td><span class="hap-pill ${s.hap}">${s.hap}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ── District Table ────────────────────────────────────────────
function renderDistrictTable() {
  const tbody = document.getElementById('districtTableBody');
  tbody.innerHTML = '';
  const ALERT_EMOJIS = { Red:'🔴', Orange:'🟠', Yellow:'🟡', Normal:'🟢' };

  INDIA_DISTRICTS.forEach(d => {
    const rankCls = d.rank <= 3 ? 'top3' : 'rest';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="district-rank ${rankCls}">${d.rank}</span></td>
      <td style="color:var(--text-primary);font-weight:700">${d.name}</td>
      <td style="color:var(--text-muted);font-size:12px">${d.state}</td>
      <td style="color:var(--heat-orange);font-weight:800">${d.maxTemp}°C</td>
      <td style="color:var(--text-secondary)">${d.avg5d}°C</td>
      <td style="color:var(--info-blue)">${d.humidity}%</td>
      <td style="color:var(--danger-light);font-weight:700">${d.heatIdx}°C</td>
      <td>${ALERT_EMOJIS[d.alert]} ${d.alert}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── District Temp Chart ───────────────────────────────────────
function initDistrictTempChart() {
  const ctx = document.getElementById('districtTempChart').getContext('2d');
  const ALERT_COLORS = { Red:'rgba(214,40,57,0.85)',Orange:'rgba(255,107,53,0.80)',Yellow:'rgba(247,167,49,0.80)',Normal:'rgba(38,222,129,0.70)' };

  APP.charts.districtTemp = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: INDIA_DISTRICTS.map(d => d.name),
      datasets: [
        {
          label: 'Max Temp',
          data: INDIA_DISTRICTS.map(d => d.maxTemp),
          backgroundColor: INDIA_DISTRICTS.map(d => ALERT_COLORS[d.alert]),
          borderRadius: 5,
          borderSkipped: false
        },
        {
          label: 'Heat Index',
          data: INDIA_DISTRICTS.map(d => d.heatIdx),
          backgroundColor: 'rgba(123,47,190,0.5)',
          borderRadius: 5,
          borderSkipped: false
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 }, color: '#8A9BB8' } },
        tooltip: { backgroundColor: '#161C2B', borderColor: '#242D42', borderWidth: 1 }
      },
      scales: {
        x: {
          grid: { color: 'rgba(36,45,66,0.6)' },
          ticks: { color: '#4E5E7A', callback: v => v + '°C', font: { size: 10 } },
          min: 40
        },
        y: { grid: { color: 'rgba(36,45,66,0.4)' }, ticks: { color: '#8A9BB8', font: { size: 10 } } }
      }
    }
  });
}

// ── Health Impact Chart ───────────────────────────────────────
function initHealthImpactChart() {
  const ctx = document.getElementById('healthImpactChart').getContext('2d');
  APP.charts.healthImpact = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: INDIA_HEALTH_TOP10.states,
      datasets: [
        {
          label: 'Deaths',
          data: INDIA_HEALTH_TOP10.deaths,
          backgroundColor: 'rgba(214,40,57,0.8)',
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y'
        },
        {
          label: 'Hospitalizations',
          data: INDIA_HEALTH_TOP10.hosp,
          backgroundColor: 'rgba(76,201,240,0.5)',
          borderRadius: 4,
          borderSkipped: false,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 }, color: '#8A9BB8' } },
        tooltip: { backgroundColor: '#161C2B', borderColor: '#242D42', borderWidth: 1 }
      },
      scales: {
        x: { grid: { color: 'rgba(36,45,66,0.6)' }, ticks: { color: '#4E5E7A', font: { size: 10 } } },
        y: {
          grid: { color: 'rgba(36,45,66,0.6)' },
          ticks: { color: '#D62839', font: { size: 10 } },
          position: 'left', title: { display: true, text: 'Deaths', color: '#D62839', font: { size: 10 } }
        },
        y2: {
          grid: { drawOnChartArea: false },
          ticks: { color: '#4CC9F0', font: { size: 10 } },
          position: 'right', title: { display: true, text: 'Hospitalizations', color: '#4CC9F0', font: { size: 10 } }
        }
      }
    }
  });
}

// ── Fatality Trend Chart ──────────────────────────────────────
function initFatalityTrendChart() {
  const ctx = document.getElementById('fatalityTrendChart').getContext('2d');
  APP.charts.fatalityTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: INDIA_FATALITY_TREND.labels,
      datasets: [{
        label: 'Daily Deaths',
        data: INDIA_FATALITY_TREND.vals,
        borderColor: '#D62839',
        backgroundColor: 'rgba(214,40,57,0.12)',
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#D62839',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161C2B', borderColor: '#242D42', borderWidth: 1,
          callbacks: { label: ctx => ` Deaths: ${ctx.parsed.y}` }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(36,45,66,0.6)' }, ticks: { color: '#4E5E7A', font: { size: 10 }, maxTicksLimit: 10 } },
        y: {
          grid: { color: 'rgba(36,45,66,0.6)' },
          ticks: { color: '#4E5E7A', font: { size: 10 } },
          min: 0
        }
      }
    }
  });
}

// ── Hospital Gauges ───────────────────────────────────────────
function renderHospitalGauges() {
  const container = document.getElementById('hospitalGauges');
  container.innerHTML = '';
  const STATUS_COLORS = {
    critical: '#D62839',
    high:     '#FF6B35',
    moderate: '#F7A731',
    low:      '#2EC4B6'
  };

  INDIA_HOSPITALS.forEach(h => {
    const col = STATUS_COLORS[h.status];
    const div = document.createElement('div');
    div.className = 'hospital-gauge';
    div.innerHTML = `
      <div class="gauge-region">${h.region}</div>
      <div class="gauge-pct" style="color:${col}">${h.pct}%</div>
      <div class="gauge-sub">ICU Demand: ${h.demand.toLocaleString()} / ${h.beds.toLocaleString()} beds</div>
      <div class="gauge-bar-wrap">
        <div class="gauge-bar-fill" style="width:${h.pct}%;background:${col}"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

// ── India Historical Chart ────────────────────────────────────
function initIndiaHistoricalChart() {
  const ctx = document.getElementById('indiaHistoricalChart').getContext('2d');
  const sorted = [...INDIA_HISTORICAL_EVENTS].sort((a,b) => Number(a.year) - Number(b.year));

  APP.charts.indiaHistorical = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(e => `${e.year}\n${e.name.split(' ').slice(0,2).join(' ')}`),
      datasets: [
        {
          label: 'Deaths',
          data: sorted.map(e => e.deaths),
          backgroundColor: sorted.map(e => e.current ? 'rgba(214,40,57,0.9)' : 'rgba(214,40,57,0.4)'),
          borderRadius: 5,
          borderSkipped: false,
          yAxisID: 'y'
        },
        {
          label: 'Peak Temp (°C)',
          data: sorted.map(e => e.peakTemp),
          type: 'line',
          borderColor: '#FF9933',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 5,
          pointBackgroundColor: sorted.map(e => e.current ? '#FF9933' : '#555'),
          tension: 0.3,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 }, color: '#8A9BB8' } },
        tooltip: {
          backgroundColor: '#161C2B', borderColor: '#242D42', borderWidth: 1,
          callbacks: {
            afterLabel: ctx => {
              const e = sorted[ctx.dataIndex];
              return [`States: ${e.states}`, `Hospitalized: ${e.hosp.toLocaleString()}`, `Duration: ${e.duration}`];
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(36,45,66,0.6)' }, ticks: { color: '#4E5E7A', font: { size: 10 } } },
        y: {
          grid: { color: 'rgba(36,45,66,0.6)' },
          ticks: { color: '#D62839', font: { size: 10 } },
          position: 'left', title: { display: true, text: 'Deaths', color: '#D62839', font: { size: 10 } }
        },
        y2: {
          grid: { drawOnChartArea: false },
          ticks: { color: '#FF9933', callback: v => v + '°C', font: { size: 10 } },
          position: 'right', min: 40, max: 54
        }
      }
    }
  });
}

// ── Historical Timeline Cards ─────────────────────────────────
function renderHistoricalTimeline() {
  const container = document.getElementById('historicalTimeline');
  container.innerHTML = '';

  INDIA_HISTORICAL_EVENTS.forEach(e => {
    const div = document.createElement('div');
    div.className = `timeline-card ${e.current ? 'current' : 'past'}`;
    div.innerHTML = `
      <div class="tl-year ${e.current ? 'current' : 'past'}">${e.year} ${e.current ? '🔴 ONGOING' : ''}</div>
      <div class="tl-name">${e.name}</div>
      <div class="tl-stats">
        <div class="tl-stat"><span class="tl-stat-val" style="color:${e.current ? '#D62839' : 'var(--text-primary)'}">${e.deaths.toLocaleString()}</span><span class="tl-stat-lbl">Deaths</span></div>
        <div class="tl-stat"><span class="tl-stat-val">${e.peakTemp}°C</span><span class="tl-stat-lbl">Peak Temp</span></div>
        <div class="tl-stat"><span class="tl-stat-val">${e.states}</span><span class="tl-stat-lbl">States Hit</span></div>
        <div class="tl-stat"><span class="tl-stat-val">${e.duration}</span><span class="tl-stat-lbl">Duration</span></div>
      </div>
      <div class="tl-lesson">${e.lesson}</div>
    `;
    container.appendChild(div);
  });
}

// ══════════════════════════════════════════════════════════════

function init() {
  loadData();
  startClock();
  initSidebar();
  initTabs();

  chartDefaults();
  initTempChart();
  initHumidityChart();
  initHistoricalChart();

  renderRiskTable();
  renderIncidents();
  renderShelters();
  updateDashboardStats();

  initIncidentForm();
  initIncidentModal();
  initShelterForm();
  initReportGenerator();
  initIndiaModule();

  // Seed some demo incidents if empty
  if (APP.incidents.length === 0) {
    const demo = [
      { id: uuid(), type: 'Heatstroke', region: 'Zone A – Ardena',    severity: 'Critical', casualties: 3, reporter: 'Unit Alpha-1', notes: 'Multiple heatstroke victims at central market. Ambulances dispatched.', status: 'Active',    timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: uuid(), type: 'Power Outage', region: 'Zone D – Delvar',  severity: 'High',     casualties: 0, reporter: 'Grid Control', notes: 'Major substation failure. ~12,000 households affected.', status: 'Active',    timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: uuid(), type: 'Water Shortage', region: 'Zone B – Braxton', severity: 'High',   casualties: 0, reporter: 'Unit Bravo-3', notes: 'Municipal water pressure dropping. Emergency tankers deployed.', status: 'Monitoring', timestamp: new Date(Date.now() - 18000000).toISOString() },
      { id: uuid(), type: 'Wildfire', region: 'Zone F – Farentino', severity: 'Moderate',   casualties: 0, reporter: 'Fire Brigade', notes: 'Small brush fire 2km north of Route 14. Contained to 3 hectares.', status: 'Resolved', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: uuid(), type: 'Mass Evacuation', region: 'Zone A – Ardena', severity: 'Critical', casualties: 1, reporter: 'Commander Reyes', notes: 'Mandatory evacuation of 3 residential blocks. 420 residents displaced.', status: 'Active', timestamp: new Date(Date.now() - 1800000).toISOString() },
    ];
    APP.incidents = demo;
    saveData();
    renderIncidents();
    updateDashboardStats();
  }

  // Seed demo shelters if empty
  if (APP.shelters.length === 0) {
    const demoShelters = [
      { id: uuid(), name: 'Ardena Community Center', region: 'Zone A – Ardena', capacity: 800, occupancy: 612, water: 'Adequate', medical: 'Present', contact: 'Maria Santos — +1-555-0101', timestamp: new Date().toISOString() },
      { id: uuid(), name: 'St. Luke School Gymnasium', region: 'Zone B – Braxton', capacity: 500, occupancy: 487, water: 'Limited', medical: 'Limited', contact: 'John Ferraz — +1-555-0202', timestamp: new Date().toISOString() },
      { id: uuid(), name: 'Delvar Sports Complex', region: 'Zone D – Delvar', capacity: 1200, occupancy: 340, water: 'Adequate', medical: 'Present', contact: 'Ana Lima — +1-555-0303', timestamp: new Date().toISOString() },
    ];
    APP.shelters = demoShelters;
    saveData();
    renderShelters();
    updateDashboardStats();
  }
}

document.addEventListener('DOMContentLoaded', init);

