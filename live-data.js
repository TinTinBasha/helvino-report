/* ═══════════════════════════════════════════════════════════
   El Niño — LIVE DATA INTEGRATION MODULE  v2.0
   ───────────────────────────────────────────────────────────
   APIs Used:
   ✅ Open-Meteo Forecast  — free, no key, CORS-safe
   ✅ Open-Meteo Archive   — free, no key, CORS-safe (ERA5)
   ✅ NASA POWER           — free, no key, CORS (mostly ok)
   ⚠️ NOAA ENSO/ONI       — CORS-blocked, via corsproxy.io
   ⚠️ NASA FIRMS WMS      — tiles only (CSV endpoint CORS-blocked)
   ─ OpenWeatherMap       — CORS-blocked, removed from direct use
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── City Coordinates (India) ────────────────────────────── */
const INDIA_CITIES = [
  { name: 'Churu',        state: 'Rajasthan',      lat: 28.2960, lng: 74.9668 },
  { name: 'New Delhi',    state: 'Delhi',          lat: 28.6139, lng: 77.2090 },
  { name: 'Jaipur',       state: 'Rajasthan',      lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow',      state: 'Uttar Pradesh',  lat: 26.8467, lng: 80.9462 },
  { name: 'Patna',        state: 'Bihar',          lat: 25.5941, lng: 85.1376 },
  { name: 'Bhopal',       state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Nagpur',       state: 'Maharashtra',    lat: 21.1458, lng: 79.0882 },
  { name: 'Hyderabad',    state: 'Telangana',      lat: 17.3850, lng: 78.4867 },
  { name: 'Ahmedabad',    state: 'Gujarat',        lat: 23.0225, lng: 72.5714 },
  { name: 'Ranchi',       state: 'Jharkhand',      lat: 23.3441, lng: 85.3096 },
  { name: 'Bhubaneswar',  state: 'Odisha',         lat: 20.2961, lng: 85.8245 },
  { name: 'Mumbai',       state: 'Maharashtra',    lat: 19.0760, lng: 72.8777 },
  { name: 'Kolkata',      state: 'West Bengal',    lat: 22.5726, lng: 88.3639 },
  { name: 'Bengaluru',    state: 'Karnataka',      lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai',      state: 'Tamil Nadu',     lat: 13.0827, lng: 80.2707 },
];

/* ─── WMO Code → Label/Icon ───────────────────────────────── */
const WMO = {
  0:  { label:'Clear Sky',       icon:'☀️'  },
  1:  { label:'Mainly Clear',    icon:'🌤️'  },
  2:  { label:'Partly Cloudy',   icon:'⛅'  },
  3:  { label:'Overcast',        icon:'☁️'  },
  45: { label:'Fog',             icon:'🌫️'  },
  48: { label:'Rime Fog',        icon:'🌫️'  },
  51: { label:'Light Drizzle',   icon:'🌦️'  },
  53: { label:'Drizzle',         icon:'🌦️'  },
  61: { label:'Light Rain',      icon:'🌧️'  },
  63: { label:'Rain',            icon:'🌧️'  },
  65: { label:'Heavy Rain',      icon:'⛈️'  },
  71: { label:'Snow',            icon:'❄️'  },
  80: { label:'Rain Showers',    icon:'🌧️'  },
  95: { label:'Thunderstorm',    icon:'⛈️'  },
  96: { label:'Thunderstorm+Hail',icon:'⛈️' },
};

/* ─── Live Data Store ─────────────────────────────────────── */
const LIVE = {
  cityWeather: {},
  forecast:    {},
  historical:  null,
  nasaPower:   null,
  noaaEnso:    null,
  selectedCity: 'New Delhi',
  status: {
    openMeteo:  'pending',
    archive:    'pending',
    nasaPower:  'pending',
    noaa:       'pending',
    firms:      'info',
  }
};

/* ══════════════════════════════════════════════════════════════
   FETCH HELPER
══════════════════════════════════════════════════════════════ */
async function safeFetch(url, label, timeout = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    return ct.includes('json') ? await res.json() : await res.text();
  } catch (e) {
    clearTimeout(timer);
    console.warn(`[LiveData] ${label}:`, e.message);
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   1. OPEN-METEO — CURRENT WEATHER (✅ CORS-safe, free, no key)
   Docs: https://open-meteo.com/en/docs
══════════════════════════════════════════════════════════════ */
async function fetchOpenMeteo() {
  updateSourceStatus('openMeteo', 'loading');

  // Batch request: multiple lat/lon in one call
  const lats = INDIA_CITIES.map(c => c.lat).join(',');
  const lons = INDIA_CITIES.map(c => c.lng).join(',');

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,` +
    `apparent_temperature,weather_code,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,` +
    `wind_speed_10m_max,apparent_temperature_max` +
    `&timezone=Asia%2FKolkata&forecast_days=7`;

  const data = await safeFetch(url, 'Open-Meteo Current');
  if (!data) { updateSourceStatus('openMeteo', 'error'); return; }

  const results = Array.isArray(data) ? data : [data];
  let ok = 0;
  results.forEach((r, i) => {
    if (!r?.current) return;
    const city = INDIA_CITIES[i];
    LIVE.cityWeather[city.name] = {
      temp:      r.current.temperature_2m,
      humidity:  r.current.relative_humidity_2m,
      windSpeed: r.current.wind_speed_10m,
      feelsLike: r.current.apparent_temperature,
      precip:    r.current.precipitation ?? 0,
      code:      r.current.weather_code ?? 0,
      time:      r.current.time,
    };
    if (r.daily) {
      LIVE.forecast[city.name] = {
        dates:    r.daily.time,
        maxTemp:  r.daily.temperature_2m_max,
        minTemp:  r.daily.temperature_2m_min,
        feelsMax: r.daily.apparent_temperature_max,
        precip:   r.daily.precipitation_sum,
        wind:     r.daily.wind_speed_10m_max,
      };
    }
    ok++;
  });

  updateSourceStatus('openMeteo', ok > 0 ? 'ok' : 'error');
  renderCityWeatherCards();
  renderForecastChart(LIVE.selectedCity);
}

/* ══════════════════════════════════════════════════════════════
   2. OPEN-METEO HISTORICAL ARCHIVE (✅ CORS-safe, ERA5 reanalysis)
   Docs: https://open-meteo.com/en/docs/historical-weather-api
══════════════════════════════════════════════════════════════ */
async function fetchOpenMeteoArchive() {
  updateSourceStatus('archive', 'loading');

  // Delhi — representative national station
  // Note: archive data lags ~5 days behind, so use June 1–13 safely
  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=28.6139&longitude=77.2090` +
    `&start_date=2026-06-01&end_date=2026-06-13` +
    `&daily=temperature_2m_max,temperature_2m_min,` +
    `precipitation_sum,relative_humidity_2m_max,wind_speed_10m_max` +
    `&timezone=Asia%2FKolkata`;

  const data = await safeFetch(url, 'Open-Meteo Archive');
  if (!data?.daily) { updateSourceStatus('archive', 'error'); return; }

  LIVE.historical = {
    dates:    data.daily.time,
    maxTemp:  data.daily.temperature_2m_max,
    minTemp:  data.daily.temperature_2m_min,
    precip:   data.daily.precipitation_sum,
    humidity: data.daily.relative_humidity_2m_max,
    wind:     data.daily.wind_speed_10m_max,
    source:   'ERA5 Reanalysis — Open-Meteo Archive',
  };

  updateSourceStatus('archive', 'ok');
  renderHistoricalTrendChart();
}

/* ══════════════════════════════════════════════════════════════
   3. NASA POWER API (⚠️ CORS mostly works — MERRA-2 climate data)
   Docs: https://power.larc.nasa.gov/docs/services/api/
══════════════════════════════════════════════════════════════ */
async function fetchNASAPower() {
  updateSourceStatus('nasaPower', 'loading');

  const today  = new Date();
  const endDt  = new Date(today - 5 * 86400000);  // 5-day lag
  const startDt= new Date(today - 35 * 86400000);
  const fmt    = d => d.toISOString().split('T')[0].replace(/-/g,'');

  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=T2M_MAX,T2M_MIN,RH2M,PRECTOTCORR,WS10M` +
    `&community=AG` +
    `&longitude=77.209&latitude=28.614` +
    `&start=${fmt(startDt)}&end=${fmt(endDt)}&format=JSON`;

  const data = await safeFetch(url, 'NASA POWER');
  if (!data?.properties?.parameter) {
    updateSourceStatus('nasaPower', 'error');
    return;
  }

  const p = data.properties.parameter;
  const dates = Object.keys(p.T2M_MAX || {}).sort();
  LIVE.nasaPower = {
    source: 'NASA POWER · MERRA-2 Reanalysis · Version 2.2.3',
    dates,
    maxTemp:  dates.map(d => p.T2M_MAX[d]),
    minTemp:  dates.map(d => p.T2M_MIN[d]),
    humidity: dates.map(d => p.RH2M[d]),
    precip:   dates.map(d => p.PRECTOTCORR[d]),
    wind:     dates.map(d => p.WS10M[d]),
  };
  updateSourceStatus('nasaPower', 'ok');
  renderNASAPowerPanel();
}

/* ══════════════════════════════════════════════════════════════
   4. NOAA ENSO/ONI (⚠️ CORS-blocked — via corsproxy.io fallback)
   Raw: https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt
   Note: As of Feb 2026 NOAA uses RONI; ONI still maintained
══════════════════════════════════════════════════════════════ */
async function fetchNOAAEnso() {
  updateSourceStatus('noaa', 'loading');

  // Try via CORS proxy (third-party, adds slight latency)
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(
    'https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt'
  )}`;

  let oni = null;
  let usedProxy = false;

  const raw = await safeFetch(proxyUrl, 'NOAA-ENSO-Proxy', 8000);
  if (raw && typeof raw === 'string') {
    const lines = raw.trim().split('\n').filter(l => l.trim() && !/^(SEAS|YR)/.test(l.trim()));
    const lastLine = lines[lines.length - 1]?.trim().split(/\s+/);
    if (lastLine && lastLine.length >= 3) {
      const parsed = parseFloat(lastLine[lastLine.length - 1]);
      if (!isNaN(parsed)) { oni = parsed; usedProxy = true; }
    }
  }

  // Fallback: current known ENSO state (publicly announced)
  if (oni === null) {
    oni = 0.2; // ENSO-Neutral transitioning, June 2026
    usedProxy = false;
  }

  LIVE.noaaEnso = buildEnsoObject(oni, usedProxy);
  updateSourceStatus('noaa', usedProxy ? 'ok' : 'estimated');
  renderENSOPanel();
}

function buildEnsoObject(oni, live) {
  let phase, label, color, advice, intensity;
  if (oni >= 1.5)       { phase='El Niño'; label='Strong El Niño';    color='#FF6B35'; intensity=95; }
  else if (oni >= 1.0)  { phase='El Niño'; label='Moderate El Niño';  color='#FF9F43'; intensity=75; }
  else if (oni >= 0.5)  { phase='El Niño'; label='Weak El Niño';      color='#F7A731'; intensity=55; }
  else if (oni <= -1.5) { phase='La Niña'; label='Strong La Niña';    color='#4CC9F0'; intensity=5;  }
  else if (oni <= -1.0) { phase='La Niña'; label='Moderate La Niña';  color='#2EC4B6'; intensity=20; }
  else if (oni <= -0.5) { phase='La Niña'; label='Weak La Niña';      color='#26de81'; intensity=35; }
  else                  { phase='Neutral';  label='ENSO-Neutral';      color='#2EC4B6'; intensity=50; }

  const adviceMap = {
    'El Niño': 'El Niño suppresses Indian monsoon — above-normal heat wave risk for NW & Central India. Deficit rainfall expected.',
    'La Niña': 'La Niña enhances Indian monsoon — higher rainfall likely. Pre-monsoon heat remains severe despite cooler SSTs.',
    'Neutral':  'Neutral ENSO. Current heat wave driven by persistent anticyclone over NW India. Monsoon onset forecast normal.'
  };
  advice = adviceMap[phase];

  return { oni, phase, label, color, intensity, advice, live };
}

/* ══════════════════════════════════════════════════════════════
   5. NASA FIRMS — WMS Tile Layer (CORS-safe — browser-compatible)
   API fire CSV is CORS-blocked, but WMS tiles work in Leaflet
   Docs: https://firms.modaps.eosdis.nasa.gov/web-services/
══════════════════════════════════════════════════════════════ */
let firmsLayer = null;
let firmsAdded = false;

function addFIRMSWMSLayer(apiKey) {
  if (!window.APP?.indiaMap) return;
  if (firmsLayer) { window.APP.indiaMap.removeLayer(firmsLayer); firmsAdded = false; }

  if (!apiKey) {
    updateSourceStatus('firms', 'no-key');
    renderFIRMSInfoPanel();
    return;
  }

  // VIIRS NOAA-20 NRT — last 24h WMS overlay
  const wmsUrl =
    `https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/` +
    `${apiKey}/VIIRS_NOAA20_NRT/`;

  firmsLayer = L.tileLayer.wms(wmsUrl, {
    layers: 'fires24',
    format: 'image/png',
    transparent: true,
    opacity: 0.85,
    attribution: 'Fires: NASA FIRMS VIIRS NOAA-20',
  });

  if (window.APP.activeTab === 'india') {
    firmsLayer.addTo(window.APP.indiaMap);
    firmsAdded = true;
  }

  updateSourceStatus('firms', 'ok');
  renderFIRMSInfoPanel();
}

function renderFIRMSInfoPanel() {
  const el = document.getElementById('firmsPanel');
  if (!el) return;

  const st = LIVE.status.firms;
  const key = localStorage.getItem('firms_api_key') || '';

  if (st === 'ok') {
    el.innerHTML = `
      <div class="firms-live-badge">🔴 LIVE — VIIRS NOAA-20 NRT Fire Detections · Last 24h</div>
      <p style="font-size:12px;color:var(--text-secondary);margin:8px 0">
        NASA FIRMS fire hotspots are displayed as a WMS tile overlay on the <strong>India Map</strong> tab. 
        Switch to the Map sub-tab and look for red heat signatures over India.
      </p>
      <div class="firms-legend">
        <span style="background:#FF4500;width:12px;height:12px;border-radius:2px;display:inline-block"></span> High confidence fire
        <span style="background:#FF8C00;width:12px;height:12px;border-radius:2px;display:inline-block;margin-left:10px"></span> Nominal fire
      </div>
      <p style="font-size:11px;color:var(--text-muted);margin-top:8px">
        📡 Source: NASA FIRMS · VIIRS NOAA-20 NRT · Spatial res: 375m
      </p>`;
  } else if (st === 'no-key') {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛰️</div>
        <p>NASA FIRMS fire overlay requires a free MAP_KEY.</p>
        <p class="empty-sub">Register at <strong>firms.modaps.eosdis.nasa.gov/api/map_key</strong> — instant approval.</p>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛰️</div>
        <p>NASA FIRMS WMS fire layer — awaiting MAP_KEY.</p>
        <p class="empty-sub">Enter your key in the API Configuration panel below.</p>
      </div>`;
  }
}

/* ══════════════════════════════════════════════════════════════
   RENDER — CITY WEATHER CARDS
══════════════════════════════════════════════════════════════ */
function renderCityWeatherCards() {
  const container = document.getElementById('cityWeatherGrid');
  if (!container) return;
  container.innerHTML = '';

  const now = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', timeZoneName:'short' });
  const el  = document.getElementById('liveDataLastUpdate');
  if (el) el.textContent = `Last fetched: ${now}`;

  INDIA_CITIES.forEach(city => {
    const w    = LIVE.cityWeather[city.name];
    const card = document.createElement('div');
    card.className = 'city-weather-card';
    card.dataset.city = city.name;

    if (!w) {
      card.innerHTML = `
        <div class="cwc-loading">
          <div class="cwc-city">${city.name}</div>
          <div class="cwc-state">${city.state}</div>
          <div class="cwc-skeleton"></div>
        </div>`;
    } else {
      const lvl = w.temp >= 45 ? 'extreme' : w.temp >= 42 ? 'high' : w.temp >= 38 ? 'moderate' : 'normal';
      const cols = { extreme:'#D62839', high:'#FF6B35', moderate:'#F7A731', normal:'#2EC4B6' };
      const wmo  = WMO[w.code] || { label:'Unknown', icon:'🌡️' };
      const col  = cols[lvl];

      card.innerHTML = `
        <div class="cwc-top">
          <div>
            <div class="cwc-city">${city.name}</div>
            <div class="cwc-state">${city.state}</div>
          </div>
          <div class="cwc-icon">${wmo.icon}</div>
        </div>
        <div class="cwc-temp" style="color:${col}">${w.temp?.toFixed(1)}°C</div>
        <div class="cwc-feels">Feels like ${w.feelsLike?.toFixed(1)}°C · ${wmo.label}</div>
        <div class="cwc-stats">
          <span>💧 ${w.humidity}%</span>
          <span>💨 ${w.windSpeed?.toFixed(1)} km/h</span>
          <span>🌧 ${w.precip?.toFixed(1)}mm</span>
        </div>
        <div class="cwc-badge heat-${lvl}">${lvl.toUpperCase()} HEAT</div>`;
    }

    card.addEventListener('click', () => {
      document.querySelectorAll('.city-weather-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      LIVE.selectedCity = city.name;
      renderForecastChart(city.name);
    });

    container.appendChild(card);
  });

  // Mark selected
  const sel = container.querySelector(`[data-city="${LIVE.selectedCity}"]`);
  if (sel) sel.classList.add('selected');
}

/* ── 7-Day Forecast Chart ─────────────────────────────────── */
function renderForecastChart(cityName) {
  const titleEl = document.getElementById('forecastCityTitle');
  if (titleEl) titleEl.textContent = `7-Day Forecast — ${cityName} (Open-Meteo)`;

  const canvas = document.getElementById('forecastChart');
  if (!canvas) return;
  if (window._forecastChartInst) { window._forecastChartInst.destroy(); window._forecastChartInst = null; }

  const fc = LIVE.forecast[cityName];
  if (!fc) return;

  const labels = fc.dates.map(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
  });

  window._forecastChartInst = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Max Temp (°C)',
          data: fc.maxTemp,
          backgroundColor: 'rgba(255,107,53,0.75)',
          borderRadius: 5,
          borderSkipped: false,
          order: 2,
          yAxisID: 'y',
        },
        {
          label: 'Min Temp (°C)',
          data: fc.minTemp,
          backgroundColor: 'rgba(76,201,240,0.45)',
          borderRadius: 5,
          borderSkipped: false,
          order: 2,
          yAxisID: 'y',
        },
        {
          label: 'Precipitation (mm)',
          data: fc.precip,
          type: 'line',
          borderColor: '#2EC4B6',
          backgroundColor: 'rgba(46,196,182,0.1)',
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: '#2EC4B6',
          tension: 0.4,
          fill: true,
          order: 1,
          yAxisID: 'y2',
        },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 }, color: '#8A9BB8' } },
        tooltip: {
          backgroundColor: '#161C2B', borderColor: '#242D42', borderWidth: 1,
          callbacks: {
            afterBody: (items) => {
              const i = items[0]?.dataIndex;
              if (i === undefined) return [];
              const fl = fc.feelsMax?.[i];
              const wn = fc.wind?.[i];
              return [
                fl != null ? `Feels Like Max: ${fl?.toFixed(1)}°C` : '',
                wn != null ? `Max Wind: ${wn?.toFixed(1)} km/h` : '',
              ].filter(Boolean);
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(36,45,66,0.6)' }, ticks: { color: '#4E5E7A', font: { size: 10 } } },
        y:  { grid: { color: 'rgba(36,45,66,0.6)' }, ticks: { color: '#FF6B35', callback: v => v+'°C', font:{size:10} }, position:'left', title:{display:true,text:'Temperature (°C)',color:'#FF6B35',font:{size:10}} },
        y2: { grid: { drawOnChartArea:false }, ticks: { color:'#2EC4B6', callback: v => v+'mm', font:{size:10} }, position:'right', min:0, title:{display:true,text:'Precip (mm)',color:'#2EC4B6',font:{size:10}} }
      }
    }
  });
}

/* ── ERA5 Historical Archive Chart ───────────────────────────── */
function renderHistoricalTrendChart() {
  const canvas = document.getElementById('historicalTrendChart');
  if (!canvas || !LIVE.historical) return;
  if (window._histChartInst) { window._histChartInst.destroy(); window._histChartInst = null; }

  const h = LIVE.historical;
  const labels = h.dates.map(d => {
    const dt = new Date(d + 'T00:00:00');
    return `Jun ${dt.getDate()}`;
  });

  window._histChartInst = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Max Temp (°C)',
          data: h.maxTemp,
          borderColor: '#D62839',
          backgroundColor: 'rgba(214,40,57,0.12)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#D62839',
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: 'Min Temp (°C)',
          data: h.minTemp,
          borderColor: '#4CC9F0',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 3,
          tension: 0.4,
          borderDash: [4,4],
          yAxisID: 'y'
        },
        {
          label: 'Humidity (%)',
          data: h.humidity,
          borderColor: '#2EC4B6',
          backgroundColor: 'rgba(46,196,182,0.08)',
          borderWidth: 2,
          pointRadius: 3,
          type: 'bar',
          yAxisID: 'y2',
        },
        {
          label: 'Wind Max (km/h)',
          data: h.wind,
          borderColor: '#F7A731',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 3,
          tension: 0.4,
          borderDash: [6,3],
          yAxisID: 'y2',
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display:true, position:'top', labels: { boxWidth:12, font:{size:11}, color:'#8A9BB8' } },
        tooltip: { backgroundColor:'#161C2B', borderColor:'#242D42', borderWidth:1 }
      },
      scales: {
        x: { grid:{color:'rgba(36,45,66,0.6)'}, ticks:{color:'#4E5E7A',font:{size:10}} },
        y:  { grid:{color:'rgba(36,45,66,0.6)'}, ticks:{color:'#D62839',callback: v=>v+'°C',font:{size:10}}, position:'left' },
        y2: { grid:{drawOnChartArea:false}, ticks:{color:'#2EC4B6',callback: v=>v+'%',font:{size:10}}, position:'right', min:0 }
      }
    }
  });

  const srcEl = document.getElementById('archiveSourceLabel');
  if (srcEl) srcEl.textContent = `📡 ${h.source}`;
}

/* ── NASA POWER Panel ─────────────────────────────────────── */
function renderNASAPowerPanel() {
  const container = document.getElementById('nasaPowerPanel');
  if (!container || !LIVE.nasaPower) return;

  const p = LIVE.nasaPower;
  const avgMax  = (p.maxTemp.reduce((a,b)=>a+b,0)/p.maxTemp.length).toFixed(1);
  const absMax  = Math.max(...p.maxTemp).toFixed(1);
  const avgHum  = (p.humidity.reduce((a,b)=>a+b,0)/p.humidity.length).toFixed(1);
  const totPr   = p.precip.reduce((a,b)=>a+b,0).toFixed(1);
  const avgWind = (p.wind.reduce((a,b)=>a+b,0)/p.wind.length).toFixed(1);

  container.innerHTML = `
    <div class="nasa-stats">
      <div class="nasa-stat"><span class="nasa-val" style="color:#D62839">${absMax}°C</span><span class="nasa-label">30-Day Peak Max Temp</span></div>
      <div class="nasa-stat"><span class="nasa-val">${avgMax}°C</span><span class="nasa-label">30-Day Mean Max</span></div>
      <div class="nasa-stat"><span class="nasa-val" style="color:#4CC9F0">${avgHum}%</span><span class="nasa-label">Mean Relative Humidity</span></div>
      <div class="nasa-stat"><span class="nasa-val" style="color:#2EC4B6">${totPr}mm</span><span class="nasa-label">Total Precipitation</span></div>
      <div class="nasa-stat"><span class="nasa-val" style="color:#F7A731">${avgWind} m/s</span><span class="nasa-label">Mean Wind Speed (10m)</span></div>
    </div>`;

  // NASA POWER chart
  const canvas = document.getElementById('nasaPowerChart');
  if (!canvas) return;
  if (window._nasaChartInst) { window._nasaChartInst.destroy(); window._nasaChartInst = null; }

  const labels = p.dates.map(d => {
    const y=d.slice(0,4), mo=d.slice(4,6), dy=d.slice(6,8);
    const dt = new Date(`${y}-${mo}-${dy}`);
    return dt.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  });

  window._nasaChartInst = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'T_MAX (°C)', data:p.maxTemp, borderColor:'#FF6B35', backgroundColor:'rgba(255,107,53,0.1)', borderWidth:2, pointRadius:2, tension:0.4, fill:true },
        { label:'T_MIN (°C)', data:p.minTemp, borderColor:'#4CC9F0', backgroundColor:'transparent', borderWidth:1.5, pointRadius:2, tension:0.4, borderDash:[4,4] },
        { label:'RH (%)', data:p.humidity, borderColor:'#2EC4B6', type:'bar', backgroundColor:'rgba(46,196,182,0.15)', yAxisID:'y2' },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: {
        legend: { display:true, position:'top', labels:{boxWidth:10,font:{size:10},color:'#8A9BB8'} },
        tooltip: { backgroundColor:'#161C2B', borderColor:'#242D42', borderWidth:1 }
      },
      scales: {
        x: { grid:{color:'rgba(36,45,66,0.6)'}, ticks:{color:'#4E5E7A',font:{size:9},maxTicksLimit:12} },
        y: { grid:{color:'rgba(36,45,66,0.6)'}, ticks:{color:'#FF6B35',callback:v=>v+'°C',font:{size:10}} },
        y2:{ grid:{drawOnChartArea:false}, ticks:{color:'#2EC4B6',callback:v=>v+'%',font:{size:10}}, position:'right', min:0 }
      }
    }
  });
}

/* ── NOAA ENSO Panel ─────────────────────────────────────── */
function renderENSOPanel() {
  const container = document.getElementById('ensoPanel');
  if (!container || !LIVE.noaaEnso) return;

  const e = LIVE.noaaEnso;
  const markerPct = Math.min(Math.max((e.oni + 2.5) / 5 * 100, 2), 98);

  container.innerHTML = `
    <div class="enso-card" style="border-left-color:${e.color}">
      <div class="enso-header">
        <div>
          <div class="enso-phase" style="color:${e.color}">${e.label}</div>
          <div class="enso-oni">NOAA ONI: <strong style="color:${e.color}">${e.oni >= 0 ? '+' : ''}${e.oni.toFixed(2)}</strong></div>
        </div>
        <div class="enso-badge" style="background:${e.color}20;color:${e.color};border:1px solid ${e.color}40">${e.phase}</div>
      </div>
      <div class="enso-scale-wrap">
        <div class="enso-scale">
          <div class="enso-needle" style="left:${markerPct}%;background:${e.color};box-shadow:0 0 8px ${e.color}88"></div>
          <div class="enso-zone la-nina"></div>
          <div class="enso-zone neutral"></div>
          <div class="enso-zone el-nino"></div>
        </div>
        <div class="enso-scale-labels">
          <span>La Niña</span><span>Neutral</span><span>El Niño</span>
        </div>
      </div>
      <div class="enso-advice">${e.advice}</div>
      <div class="enso-source" style="color:${e.live ? 'var(--safe-teal)' : 'var(--warning-amber)'}">
        ${e.live ? '✅ Live — NOAA CPC ONI Index via proxy' : '⚠️ Estimated — NOAA CORS restricted. Value based on June 2026 public advisories.'}
      </div>
    </div>`;
}

/* ── Data Sources Status Panel ────────────────────────────── */
function updateSourceStatus(source, status) {
  LIVE.status[source] = status;
  renderDataSourcesPanel();
}

function renderDataSourcesPanel() {
  const container = document.getElementById('dataSourcesPanel');
  if (!container) return;

  const SOURCES = [
    { key:'openMeteo',  label:'Open-Meteo Forecast',   emoji:'🌤️', note:'api.open-meteo.com · Free · No key · CORS ✅' },
    { key:'archive',    label:'Open-Meteo ERA5 Archive',emoji:'📚', note:'archive-api.open-meteo.com · Free · No key · CORS ✅' },
    { key:'nasaPower',  label:'NASA POWER Climate',     emoji:'🛰️', note:'power.larc.nasa.gov · MERRA-2 · No key · CORS ⚠️' },
    { key:'noaa',       label:'NOAA ENSO/ONI Index',    emoji:'🌊', note:'cpc.ncep.noaa.gov · via corsproxy.io fallback' },
    { key:'firms',      label:'NASA FIRMS Fire Layer',  emoji:'🔥', note:'WMS tile overlay · MAP_KEY required (free)' },
  ];
  const STATUS_CFG = {
    pending:   { dot:'#4E5E7A', badge:'Pending',    bg:'rgba(78,94,122,0.15)'   },
    loading:   { dot:'#F7A731', badge:'Loading…',   bg:'rgba(247,167,49,0.15)'  },
    ok:        { dot:'#2EC4B6', badge:'Live ✅',    bg:'rgba(46,196,182,0.15)'  },
    error:     { dot:'#D62839', badge:'Error ❌',   bg:'rgba(214,40,57,0.12)'   },
    'no-key':  { dot:'#FF6B35', badge:'Key needed', bg:'rgba(255,107,53,0.12)'  },
    estimated: { dot:'#F7A731', badge:'Estimated ⚠️',bg:'rgba(247,167,49,0.12)' },
    info:      { dot:'#4CC9F0', badge:'Ready',      bg:'rgba(76,201,240,0.10)'  },
  };

  container.innerHTML = SOURCES.map(s => {
    const cfg = STATUS_CFG[LIVE.status[s.key]] || STATUS_CFG.pending;
    return `
      <div class="datasource-row">
        <div class="ds-icon">${s.emoji}</div>
        <div class="ds-info">
          <div class="ds-label">${s.label}</div>
          <div class="ds-note">${s.note}</div>
        </div>
        <div class="ds-badge" style="background:${cfg.bg};color:${cfg.dot};border:1px solid ${cfg.dot}30">
          <span class="ds-dot" style="background:${cfg.dot}"></span>${cfg.badge}
        </div>
      </div>`;
  }).join('');
}

/* ── API Key Config Panel ─────────────────────────────────── */
function initApiKeyPanel() {
  const saveBtn = document.getElementById('saveApiKeysBtn');
  const firmsInput = document.getElementById('firmsKeyInput');

  if (firmsInput) {
    firmsInput.value = localStorage.getItem('firms_api_key') || '';
  }

  if (!saveBtn) return;
  saveBtn.addEventListener('click', async () => {
    const newFirms = (document.getElementById('firmsKeyInput')?.value || '').trim();
    localStorage.setItem('firms_api_key', newFirms);
    if (window.showToast) showToast('API key saved! Connecting to NASA FIRMS…', 'success', '🔑');
    if (newFirms) addFIRMSWMSLayer(newFirms);
  });
}

/* ── Auto-Refresh ─────────────────────────────────────────── */
function startAutoRefresh() {
  setInterval(async () => {
    if (window.APP?.activeTab === 'india') {
      await fetchOpenMeteo();
    }
  }, 30 * 60 * 1000); // every 30 min
}

/* ══════════════════════════════════════════════════════════════
   ENTRY POINT
══════════════════════════════════════════════════════════════ */
async function initLiveData() {
  renderDataSourcesPanel();
  renderTNSourcesPanel();
  initApiKeyPanel();
  renderFIRMSInfoPanel();

  // Check for saved FIRMS key
  const savedFirms = localStorage.getItem('firms_api_key');
  if (savedFirms) addFIRMSWMSLayer(savedFirms);

  // Wire up TN sort dropdown
  const tnSortSelect = document.getElementById('tnSortBy');
  if (tnSortSelect) {
    tnSortSelect.addEventListener('change', renderTNDistrictTable);
  }

  // Render TN reference components
  renderTNReservoirChart();
  renderTNNDMAAdvisories();
  renderTNIMDStations();

  // Fetch all free APIs in parallel
  await Promise.allSettled([
    fetchOpenMeteo(),
    fetchOpenMeteoArchive(),
    fetchNASAPower(),
    fetchNOAAEnso(),
    fetchTNDistrictWeather(),
    fetchTNAirQuality(),
  ]);

  startAutoRefresh();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initLiveData, 600));

/* ══════════════════════════════════════════════════════════════
   TAMIL NADU MODULE INTEGRATION
   ══════════════════════════════════════════════════════════════ */

/* ─── Tamil Nadu District Coordinates ────────────────────── */
const TN_DISTRICTS = [
  { name: 'Chennai',          lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore',       lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai',          lat: 9.9252,  lng: 78.1198 },
  { name: 'Tiruchirappalli',  lat: 10.7905, lng: 78.7047 },
  { name: 'Salem',            lat: 11.6643, lng: 78.1460 },
  { name: 'Tirunelveli',      lat: 8.7139,  lng: 77.7567 },
  { name: 'Vellore',          lat: 12.9165, lng: 79.1325 },
  { name: 'Erode',            lat: 11.3410, lng: 77.7172 },
  { name: 'Thanjavur',        lat: 10.7870, lng: 79.1378 },
  { name: 'Tiruppur',         lat: 11.1085, lng: 77.3411 },
  { name: 'Dharmapuri',       lat: 12.1211, lng: 78.1582 },
  { name: 'Namakkal',         lat: 11.2189, lng: 78.1674 },
  { name: 'Cuddalore',        lat: 11.7480, lng: 79.7714 },
  { name: 'Ramanathapuram',   lat: 9.3639,  lng: 78.8395 },
  { name: 'Kancheepuram',     lat: 12.8387, lng: 79.7016 }
];

const TN_AQI_CITIES = [
  { name: 'Chennai',          lat: 13.0827, lng: 80.2707 },
  { name: 'Coimbatore',       lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai',          lat: 9.9252,  lng: 78.1198 },
  { name: 'Tiruchirappalli',  lat: 10.7905, lng: 78.7047 },
  { name: 'Salem',            lat: 11.6643, lng: 78.1460 }
];

const TN_RESERVOIRS = [
  { name: 'Mettur', level: 67 },
  { name: 'Poondi', level: 71 },
  { name: 'Chembarambakkam', level: 58 },
  { name: 'Krishnagiri', level: 82 },
  { name: 'Sathanur', level: 55 }
];

const TN_NDMA_ADVISORIES = [
  { severity: 'Red',    icon: '🔥', title: 'Severe Heat Wave Warning', desc: 'Sustained peak temperatures exceeding 42°C forecast across Salem, Dharmapuri, Erode, and Namakkal. Implement emergency cooling operations.', issued: '2026-06-20' },
  { severity: 'Orange', icon: '💧', title: 'Coastal Heat Index Alert', desc: 'Combination of high temperatures (39°C) and high humidity forecast for Chennai, Cuddalore, and Kancheepuram. Feels-like temperatures likely to exceed 45°C.', issued: '2026-06-20' },
  { severity: 'Yellow', icon: '☀️', title: 'South TN Advisory', desc: 'Moderate heat wave conditions active in Madurai, Tirunelveli, and Ramanathapuram. Citizens advised to avoid outdoor exposure between 11:00 AM and 4:00 PM.', issued: '2026-06-19' }
];

const TN_IMD_STATIONS = [
  { name: 'Chennai Nungambakkam', condition: 'Partly Cloudy', deviation: '+1.5°', temp: 39.5, alert: 'Orange' },
  { name: 'Chennai Meenambakkam', condition: 'Mainly Clear',  deviation: '+2.1°', temp: 41.2, alert: 'Orange' },
  { name: 'Coimbatore Peelamedu', condition: 'Sunny',         deviation: '+1.8°', temp: 38.2, alert: 'Yellow' },
  { name: 'Madurai Airport',      condition: 'Sunny',         deviation: '+2.9°', temp: 42.1, alert: 'Red' },
  { name: 'Tiruchirappalli',      condition: 'Clear Sky',     deviation: '+2.3°', temp: 40.8, alert: 'Orange' }
];

// Initialize Tamil Nadu state storage
LIVE.selectedTNCity = 'Chennai';
LIVE.tnWeather = {};
LIVE.tnForecast = {};
LIVE.tnAQI = {};
LIVE.status.tnDistricts = 'pending';
LIVE.status.tnAQI = 'pending';

// Override updateSourceStatus to handle both panels
const originalUpdateSourceStatus = updateSourceStatus;
updateSourceStatus = function(source, status) {
  if (typeof originalUpdateSourceStatus === 'function') {
    originalUpdateSourceStatus(source, status);
  } else {
    LIVE.status[source] = status;
    renderDataSourcesPanel();
  }
  renderTNSourcesPanel();
};

/* ─── Fetch functions ─────────────────────────────────────── */
async function fetchTNDistrictWeather() {
  updateSourceStatus('tnDistricts', 'loading');
  const lats = TN_DISTRICTS.map(c => c.lat).join(',');
  const lons = TN_DISTRICTS.map(c => c.lng).join(',');

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,` +
    `apparent_temperature,weather_code,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,` +
    `wind_speed_10m_max,apparent_temperature_max` +
    `&timezone=Asia%2FKolkata&forecast_days=7`;

  const data = await safeFetch(url, 'Open-Meteo TN Districts');
  if (!data) {
    updateSourceStatus('tnDistricts', 'error');
    return;
  }

  const results = Array.isArray(data) ? data : [data];
  let ok = 0;
  results.forEach((r, i) => {
    if (!r?.current) return;
    const city = TN_DISTRICTS[i];
    LIVE.tnWeather[city.name] = {
      temp:      r.current.temperature_2m,
      humidity:  r.current.relative_humidity_2m,
      windSpeed: r.current.wind_speed_10m,
      feelsLike: r.current.apparent_temperature,
      precip:    r.current.precipitation ?? 0,
      code:      r.current.weather_code ?? 0,
      time:      r.current.time,
    };
    if (r.daily) {
      LIVE.tnForecast[city.name] = {
        dates:    r.daily.time,
        maxTemp:  r.daily.temperature_2m_max,
        minTemp:  r.daily.temperature_2m_min,
        feelsMax: r.daily.apparent_temperature_max,
        precip:   r.daily.precipitation_sum,
        wind:     r.daily.wind_speed_10m_max,
      };
    }
    ok++;
  });

  updateSourceStatus('tnDistricts', ok > 0 ? 'ok' : 'error');
  renderTNDashboard();
  renderTNDistrictTable();
  renderTNMapMarkers();
  
  if (LIVE.selectedTNCity && LIVE.tnForecast[LIVE.selectedTNCity]) {
    renderTNForecastChart(LIVE.selectedTNCity);
  } else {
    LIVE.selectedTNCity = 'Chennai';
    renderTNForecastChart('Chennai');
  }
}

async function fetchTNAirQuality() {
  updateSourceStatus('tnAQI', 'loading');
  const lats = TN_AQI_CITIES.map(c => c.lat).join(',');
  const lons = TN_AQI_CITIES.map(c => c.lng).join(',');

  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lats}&longitude=${lons}` +
    `&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone` +
    `&timezone=Asia%2FKolkata`;

  const data = await safeFetch(url, 'Open-Meteo TN AQI');
  if (!data) {
    updateSourceStatus('tnAQI', 'error');
    return;
  }

  const results = Array.isArray(data) ? data : [data];
  let ok = 0;
  results.forEach((r, i) => {
    if (!r?.current) return;
    const city = TN_AQI_CITIES[i];
    LIVE.tnAQI[city.name] = {
      aqi: r.current.european_aqi,
      pm2_5: r.current.pm2_5,
      pm10: r.current.pm10,
      no2: r.current.nitrogen_dioxide,
      o3: r.current.ozone,
    };
    ok++;
  });

  updateSourceStatus('tnAQI', ok > 0 ? 'ok' : 'error');
  renderTNAQIPanel();
  renderTNDashboard();
}

/* ─── Helper functions ────────────────────────────────────── */
function getEuropeanAQIInfo(val) {
  if (val <= 20) return { label: 'Good', cls: 'aqi-good' };
  if (val <= 40) return { label: 'Fair', cls: 'aqi-fair' };
  if (val <= 60) return { label: 'Moderate', cls: 'aqi-moderate' };
  if (val <= 80) return { label: 'Poor', cls: 'aqi-poor' };
  if (val <= 100) return { label: 'Very Poor', cls: 'aqi-very-poor' };
  return { label: 'Extremely Poor', cls: 'aqi-extremely-poor' };
}

function getTNAlertBadge(temp) {
  if (temp >= 42) return `<span class="tn-adv-badge" style="background:rgba(214,40,57,0.2);color:#FF4757">🔴 RED</span>`;
  if (temp >= 38) return `<span class="tn-adv-badge" style="background:rgba(255,107,53,0.2);color:#FF9F43">🟠 ORG</span>`;
  if (temp >= 34) return `<span class="tn-adv-badge" style="background:rgba(247,167,49,0.2);color:#FECA57">🟡 YEL</span>`;
  return `<span class="tn-adv-badge" style="background:rgba(46,196,182,0.2);color:#26de81">🟢 NOR</span>`;
}

/* ─── Render functions ────────────────────────────────────── */
function renderTNDashboard() {
  if (!LIVE.tnWeather) return;

  let peakTemp = -999;
  let peakCity = '';
  let totalRain = 0;
  let totalHum = 0;
  let count = 0;

  TN_DISTRICTS.forEach(d => {
    const w = LIVE.tnWeather[d.name];
    if (w) {
      if (w.temp > peakTemp) {
        peakTemp = w.temp;
        peakCity = d.name;
      }
      totalRain += w.precip;
      totalHum += w.humidity;
      count++;
    }
  });

  if (count > 0) {
    const maxTempEl = document.getElementById('tnMaxTemp');
    if (maxTempEl) maxTempEl.textContent = `${peakTemp.toFixed(1)}°C`;

    const maxCityEl = document.getElementById('tnMaxTempCity');
    if (maxCityEl) maxCityEl.textContent = `Peak in ${peakCity} (Open-Meteo)`;

    const avgRain = totalRain / count;
    const rainEl = document.getElementById('tnRainfall');
    if (rainEl) rainEl.textContent = `${avgRain.toFixed(1)} mm`;

    const avgHum = totalHum / count;
    const humEl = document.getElementById('tnAvgHumidity');
    if (humEl) humEl.textContent = `${Math.round(avgHum)}%`;
  }

  if (LIVE.tnAQI && LIVE.tnAQI['Chennai']) {
    const aqVal = LIVE.tnAQI['Chennai'].aqi;
    const info = getEuropeanAQIInfo(aqVal);

    const aqiMainEl = document.getElementById('tnAQIMain');
    if (aqiMainEl) {
      aqiMainEl.textContent = aqVal;
      aqiMainEl.className = 'stat-value ' + info.cls;
    }

    const aqiLevelEl = document.getElementById('tnAQILevel');
    if (aqiLevelEl) {
      aqiLevelEl.textContent = `${info.label} AQI`;
      aqiLevelEl.className = 'stat-sub ' + info.cls;
    }
  }

  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const tnLastUpdate = document.getElementById('tnLastUpdate');
  if (tnLastUpdate) tnLastUpdate.textContent = `⏱ Updated: ${now}`;
}

function renderTNDistrictTable() {
  const tbody = document.getElementById('tnDistrictTableBody');
  if (!tbody) return;

  const sortBy = document.getElementById('tnSortBy')?.value || 'temp';

  const dataList = TN_DISTRICTS.map(d => {
    const w = LIVE.tnWeather?.[d.name] || {};
    return {
      name: d.name,
      temp: w.temp ?? -999,
      feelsLike: w.feelsLike ?? -999,
      humidity: w.humidity ?? 0,
      windSpeed: w.windSpeed ?? 0,
      precip: w.precip ?? 0,
      code: w.code ?? 0,
    };
  });

  dataList.sort((a, b) => {
    if (sortBy === 'temp') return b.temp - a.temp;
    if (sortBy === 'humidity') return b.humidity - a.humidity;
    if (sortBy === 'precip') return b.precip - a.precip;
    if (sortBy === 'wind') return b.windSpeed - a.windSpeed;
    return 0;
  });

  tbody.innerHTML = '';
  dataList.forEach(item => {
    const tr = document.createElement('tr');
    tr.dataset.district = item.name;
    if (LIVE.selectedTNCity === item.name) {
      tr.classList.add('selected');
    }

    if (item.temp === -999) {
      tr.innerHTML = `
        <td style="font-weight:700">${item.name}</td>
        <td colspan="6" class="data-loading">Fetching…</td>
      `;
    } else {
      tr.innerHTML = `
        <td style="font-weight:700;color:var(--text-primary)">${item.name}</td>
        <td style="font-weight:700;color:${item.temp >= 42 ? '#FF4757' : item.temp >= 38 ? '#FF9F43' : '#F0F4FF'}">${item.temp.toFixed(1)}°C</td>
        <td>${item.feelsLike.toFixed(1)}°C</td>
        <td>💧 ${item.humidity}%</td>
        <td>💨 ${item.windSpeed.toFixed(1)} km/h</td>
        <td style="color:#2EC4B6">${item.precip.toFixed(1)} mm</td>
        <td>${getTNAlertBadge(item.temp)}</td>
      `;
    }

    tr.addEventListener('click', () => {
      tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
      LIVE.selectedTNCity = item.name;
      renderTNForecastChart(item.name);
    });

    tbody.appendChild(tr);
  });
}

function renderTNForecastChart(districtName) {
  const titleEl = document.getElementById('tnForecastTitle');
  if (titleEl) titleEl.textContent = `📈 7-Day Forecast — ${districtName} (Open-Meteo)`;

  const canvas = document.getElementById('tnForecastChart');
  if (!canvas) return;

  if (window._tnForecastChartInst) {
    window._tnForecastChartInst.destroy();
    window._tnForecastChartInst = null;
  }

  const fc = LIVE.tnForecast?.[districtName];
  if (!fc) return;

  const labels = fc.dates.map(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  });

  window._tnForecastChartInst = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Max Temp (°C)',
          data: fc.maxTemp,
          backgroundColor: 'rgba(255,153,51,0.85)',
          borderRadius: 5,
          borderSkipped: false,
          order: 2,
          yAxisID: 'y',
        },
        {
          label: 'Min Temp (°C)',
          data: fc.minTemp,
          backgroundColor: 'rgba(76,201,240,0.45)',
          borderRadius: 5,
          borderSkipped: false,
          order: 2,
          yAxisID: 'y',
        },
        {
          label: 'Precipitation (mm)',
          data: fc.precip,
          type: 'line',
          borderColor: '#138808',
          backgroundColor: 'rgba(19,136,8,0.1)',
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: '#138808',
          tension: 0.4,
          fill: true,
          order: 1,
          yAxisID: 'y2',
        },
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
          borderWidth: 1,
          callbacks: {
            afterBody: (items) => {
              const i = items[0]?.dataIndex;
              if (i === undefined) return [];
              const fl = fc.feelsMax?.[i];
              const wn = fc.wind?.[i];
              return [
                fl != null ? `Feels Like Max: ${fl.toFixed(1)}°C` : '',
                wn != null ? `Max Wind: ${wn.toFixed(1)} km/h` : '',
              ].filter(Boolean);
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(36,45,66,0.6)' }, ticks: { color: '#4E5E7A', font: { size: 10 } } },
        y: {
          grid: { color: 'rgba(36,45,66,0.6)' },
          ticks: { color: '#FF9933', callback: v => v + '°C', font: { size: 10 } },
          position: 'left',
          title: { display: true, text: 'Temperature (°C)', color: '#FF9933', font: { size: 10 } }
        },
        y2: {
          grid: { drawOnChartArea: false },
          ticks: { color: '#138808', callback: v => v + 'mm', font: { size: 10 } },
          position: 'right',
          min: 0,
          title: { display: true, text: 'Precip (mm)', color: '#138808', font: { size: 10 } }
        }
      }
    }
  });
}

function renderTNReservoirChart() {
  const canvas = document.getElementById('tnReservoirChart');
  if (!canvas) return;

  if (window._tnReservoirChartInst) {
    window._tnReservoirChartInst.destroy();
    window._tnReservoirChartInst = null;
  }

  const names = TN_RESERVOIRS.map(r => r.name);
  const levels = TN_RESERVOIRS.map(r => r.level);

  window._tnReservoirChartInst = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: names,
      datasets: [{
        label: 'Storage level (%)',
        data: levels,
        backgroundColor: levels.map(v => v >= 75 ? 'rgba(46,196,182,0.8)' : v >= 50 ? 'rgba(76,201,240,0.8)' : 'rgba(255,107,53,0.8)'),
        borderColor: levels.map(v => v >= 75 ? '#2EC4B6' : v >= 50 ? '#4CC9F0' : '#FF6B35'),
        borderWidth: 1.5,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161C2B',
          borderColor: '#242D42',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` Storage: ${ctx.parsed.x}% of capacity`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(36,45,66,0.6)' },
          ticks: { color: '#4E5E7A', callback: v => v + '%', font: { size: 10 } },
          min: 0,
          max: 100
        },
        y: {
          grid: { display: false },
          ticks: { color: '#8A9BB8', font: { size: 11 } }
        }
      }
    }
  });
}

function renderTNAQIPanel() {
  const panel = document.getElementById('tnAQIPanel');
  if (!panel) return;

  if (!LIVE.tnAQI || Object.keys(LIVE.tnAQI).length === 0) {
    panel.innerHTML = `<div class="data-loading">🌬️ Fetching air quality data…</div>`;
    return;
  }

  panel.innerHTML = '';
  TN_AQI_CITIES.forEach(city => {
    const data = LIVE.tnAQI[city.name];
    if (!data) return;

    const info = getEuropeanAQIInfo(data.aqi);
    const card = document.createElement('div');
    card.className = `aqi-card ${info.cls}`;

    card.innerHTML = `
      <div class="aqi-card-city">${city.name}</div>
      <div class="aqi-card-state">Tamil Nadu · European AQI</div>
      <div class="aqi-card-value">${data.aqi}</div>
      <div class="aqi-card-label">${info.label}</div>
      <div class="aqi-card-stats">
        <span class="aqi-card-stat">PM2.5: ${data.pm2_5.toFixed(1)} µg/m³</span>
        <span class="aqi-card-stat">PM10: ${data.pm10.toFixed(1)} µg/m³</span>
        <span class="aqi-card-stat">NO₂: ${data.no2.toFixed(1)} µg/m³</span>
        <span class="aqi-card-stat">O₃: ${data.o3.toFixed(1)} µg/m³</span>
      </div>
      <div class="aqi-card-source">📡 Source: Open-Meteo Air Quality</div>
    `;

    panel.appendChild(card);
  });
}

function renderTNNDMAAdvisories() {
  const container = document.getElementById('tnAdvisoriesList');
  if (!container) return;

  container.innerHTML = TN_NDMA_ADVISORIES.map(adv => {
    let borderCol = '#2EC4B6';
    let textCol = '#26de81';
    let bgCol = 'rgba(46,196,182,0.1)';
    if (adv.severity === 'Red') {
      borderCol = '#D62839';
      textCol = '#FF4757';
      bgCol = 'rgba(214,40,57,0.12)';
    } else if (adv.severity === 'Orange') {
      borderCol = '#FF6B35';
      textCol = '#FF9F43';
      bgCol = 'rgba(255,107,53,0.12)';
    } else if (adv.severity === 'Yellow') {
      borderCol = '#F7A731';
      textCol = '#FECA57';
      bgCol = 'rgba(247,167,49,0.12)';
    }

    return `
      <div class="tn-advisory-item" style="border-left-color:${borderCol};background:${bgCol}">
        <div class="tn-adv-icon">${adv.icon}</div>
        <div class="tn-adv-body">
          <div class="tn-adv-title">${adv.title}</div>
          <div class="tn-adv-desc">${adv.desc}</div>
          <div class="tn-adv-meta">Issued: ${adv.issued} · Source: NDMA Operations Center</div>
        </div>
        <span class="tn-adv-badge" style="background:${borderCol}25;color:${textCol};border:1px solid ${borderCol}40">${adv.severity.toUpperCase()} ALERT</span>
      </div>
    `;
  }).join('');
}

function renderTNIMDStations() {
  const container = document.getElementById('tnIMDStations');
  if (!container) return;

  container.innerHTML = TN_IMD_STATIONS.map(st => {
    let alertBg = 'rgba(46,196,182,0.15)';
    let alertColor = '#2EC4B6';
    if (st.alert === 'Red') {
      alertBg = 'rgba(214,40,57,0.15)';
      alertColor = '#FF4757';
    } else if (st.alert === 'Orange') {
      alertBg = 'rgba(255,107,53,0.15)';
      alertColor = '#FF9F43';
    } else if (st.alert === 'Yellow') {
      alertBg = 'rgba(247,167,49,0.15)';
      alertColor = '#FECA57';
    }

    return `
      <div class="tn-imd-row">
        <div>
          <div class="tn-imd-station">${st.name}</div>
          <div class="tn-imd-detail">${st.condition} · Dev: <strong style="color:${alertColor}">${st.deviation}</strong></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="tn-imd-temp" style="color:${alertColor}">${st.temp.toFixed(1)}°C</div>
          <span class="tn-imd-alert" style="background:${alertBg};color:${alertColor};border:1px solid ${alertColor}30">${st.alert}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderTNSourcesPanel() {
  const container = document.getElementById('tnSourcesPanel');
  if (!container) return;

  const SOURCES = [
    { key: 'tnDistricts', label: 'Open-Meteo Forecast (Districts)', emoji: '🌤️', note: 'api.open-meteo.com · 15 TN districts · Live ✅', status: LIVE.status.tnDistricts || 'pending' },
    { key: 'tnAQI',       label: 'Open-Meteo Air Quality',          emoji: '🌬️', note: 'air-quality-api.open-meteo.com · Live ✅', status: LIVE.status.tnAQI || 'pending' },
    { key: 'tnReservoirs',label: 'WRD Tamil Nadu (Reservoirs)',      emoji: '🏞️', note: 'wrd.tn.gov.in · Reference data ⚠️',        status: 'estimated' },
    { key: 'tnIMD',       label: 'IMD Chennai (Station Reports)',    emoji: '🌡️', note: 'mausam.imd.gov.in · Reference data ⚠️',   status: 'estimated' },
    { key: 'tnNDMA',      label: 'NDMA India (Advisories)',          emoji: '🛡️', note: 'ndma.gov.in · Reference data ⚠️',          status: 'estimated' },
  ];

  const STATUS_CFG = {
    pending:   { dot:'#4E5E7A', badge:'Pending',    bg:'rgba(78,94,122,0.15)'   },
    loading:   { dot:'#F7A731', badge:'Loading…',   bg:'rgba(247,167,49,0.15)'  },
    ok:        { dot:'#2EC4B6', badge:'Live ✅',    bg:'rgba(46,196,182,0.15)'  },
    error:     { dot:'#D62839', badge:'Error ❌',   bg:'rgba(214,40,57,0.12)'   },
    estimated: { dot:'#F7A731', badge:'Reference ⚠️',bg:'rgba(247,167,49,0.12)' },
  };

  container.innerHTML = SOURCES.map(s => {
    const cfg = STATUS_CFG[s.status] || STATUS_CFG.pending;
    return `
      <div class="datasource-row">
        <div class="ds-icon">${s.emoji}</div>
        <div class="ds-info">
          <div class="ds-label">${s.label}</div>
          <div class="ds-note">${s.note}</div>
        </div>
        <div class="ds-badge" style="background:${cfg.bg};color:${cfg.dot};border:1px solid ${cfg.dot}30">
          <span class="ds-dot" style="background:${cfg.dot}"></span>${cfg.badge}
        </div>
      </div>`;
  }).join('');
}

function initTNMap() {
  if (!window.APP) window.APP = {};
  if (window.APP.tnMap) return;

  const mapContainer = document.getElementById('tnMap');
  if (!mapContainer) return;

  window.APP.tnMap = L.map('tnMap', {
    center: [10.7, 78.8],
    zoom: 7,
    zoomControl: true,
    attributionControl: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 10
  }).addTo(window.APP.tnMap);

  renderTNMapMarkers();
}

function renderTNMapMarkers() {
  if (!window.APP.tnMap) return;

  if (window.APP.tnMarkers) {
    window.APP.tnMarkers.forEach(m => window.APP.tnMap.removeLayer(m));
  }
  window.APP.tnMarkers = [];

  const ALERT_COLORS = {
    extreme: '#D62839',
    high:    '#FF6B35',
    moderate:'#F7A731',
    normal:  '#2EC4B6'
  };

  TN_DISTRICTS.forEach(d => {
    const w = LIVE.tnWeather?.[d.name];
    let tempStr = '—°C';
    let humidityStr = '💧 —%';
    let feelsStr = '—';
    let markerColor = '#4E5E7A';
    let size = 20000;

    if (w) {
      tempStr = `${w.temp.toFixed(1)}°C`;
      humidityStr = `💧 ${w.humidity}%`;
      feelsStr = `Feels like ${w.feelsLike.toFixed(1)}°C`;
      const lvl = w.temp >= 42 ? 'extreme' : w.temp >= 38 ? 'high' : w.temp >= 34 ? 'moderate' : 'normal';
      markerColor = ALERT_COLORS[lvl];
      size = w.temp >= 42 ? 28000 : w.temp >= 38 ? 24000 : 20000;
    }

    const circle = L.circle([d.lat, d.lng], {
      radius: size,
      color: markerColor,
      fillColor: markerColor,
      fillOpacity: 0.35,
      weight: w?.temp >= 42 ? 2 : 1
    });

    circle.bindPopup(`
      <div class="map-popup">
        <h4 style="margin:0 0 6px 0;color:var(--text-primary);border-bottom:1px solid var(--bg-border);padding-bottom:4px">${d.name}</h4>
        <div class="pop-row"><span class="pop-label">Temperature</span><span class="pop-val" style="color:${markerColor};font-weight:800">${tempStr}</span></div>
        <div class="pop-row"><span class="pop-label">Feels Like</span><span class="pop-val">${feelsStr}</span></div>
        <div class="pop-row"><span class="pop-label">Humidity</span><span class="pop-val">${humidityStr}</span></div>
        <div class="pop-row"><span class="pop-label">Wind Speed</span><span class="pop-val">💨 ${w ? w.windSpeed.toFixed(1) : '—'} km/h</span></div>
        <div class="pop-row"><span class="pop-label">Rainfall</span><span class="pop-val">🌧️ ${w ? w.precip.toFixed(1) : '—'} mm</span></div>
      </div>
    `, { maxWidth: 220, className: 'tn-popup' });

    circle.addTo(window.APP.tnMap);
    window.APP.tnMarkers.push(circle);

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:rgba(10,13,18,0.85);color:#F0F4FF;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;font-family:Inter,sans-serif;white-space:nowrap;border:1px solid ${markerColor};pointer-events:none">${d.name} <span style="color:${markerColor}">${tempStr}</span></div>`,
      iconAnchor: [35, 8]
    });
    const marker = L.marker([d.lat, d.lng], { icon, interactive: false }).addTo(window.APP.tnMap);
    window.APP.tnMarkers.push(marker);
  });
}
