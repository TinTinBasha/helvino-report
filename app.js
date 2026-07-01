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
// ── World Countries Dataset (50 countries) ─────────────────────────
const WORLD_COUNTRIES = [
  // ASIA
  { name:'India',           flag:'🇮🇳', continent:'Asia',     capital:'New Delhi',    lat:20.5937, lng:78.9629,  peakTemp:50.5, humidity:18, population:'1.44B', riskLevel:'extreme', alertStatus:'Red',    deaths:312, hosp:18450, shelterCount:4820, incidents:147, heatWaveDays:22 },
  { name:'Pakistan',        flag:'🇵🇰', continent:'Asia',     capital:'Islamabad',    lat:30.3753, lng:69.3451,  peakTemp:49.8, humidity:14, population:'231M',  riskLevel:'extreme', alertStatus:'Red',    deaths:189, hosp:9820,  shelterCount:1240, incidents:89,  heatWaveDays:19 },
  { name:'Afghanistan',     flag:'🇦🇫', continent:'Asia',     capital:'Kabul',        lat:33.9391, lng:67.7100,  peakTemp:47.2, humidity:12, population:'40M',   riskLevel:'extreme', alertStatus:'Red',    deaths:189, hosp:3240,  shelterCount:145,  incidents:112, heatWaveDays:22 },
  { name:'Bangladesh',      flag:'🇧🇩', continent:'Asia',     capital:'Dhaka',        lat:23.6850, lng:90.3563,  peakTemp:43.2, humidity:72, population:'173M',  riskLevel:'high',    alertStatus:'Orange', deaths:67,  hosp:5430,  shelterCount:890,  incidents:54,  heatWaveDays:15 },
  { name:'Uzbekistan',      flag:'🇺🇿', continent:'Asia',     capital:'Tashkent',     lat:41.3775, lng:64.5853,  peakTemp:44.8, humidity:16, population:'36M',   riskLevel:'high',    alertStatus:'Orange', deaths:67,  hosp:2450,  shelterCount:340,  incidents:45,  heatWaveDays:17 },
  { name:'Sri Lanka',       flag:'🇱🇰', continent:'Asia',     capital:'Colombo',      lat:7.8731,  lng:80.7718,  peakTemp:38.4, humidity:80, population:'22M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:12,  hosp:780,   shelterCount:145,  incidents:18,  heatWaveDays:9  },
  { name:'Nepal',           flag:'🇳🇵', continent:'Asia',     capital:'Kathmandu',    lat:28.3949, lng:84.1240,  peakTemp:40.1, humidity:55, population:'29M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:18,  hosp:920,   shelterCount:210,  incidents:22,  heatWaveDays:11 },
  { name:'China',           flag:'🇨🇳', continent:'Asia',     capital:'Beijing',      lat:35.8617, lng:104.1954, peakTemp:42.3, humidity:38, population:'1.41B', riskLevel:'high',    alertStatus:'Orange', deaths:234, hosp:12450, shelterCount:4320, incidents:112, heatWaveDays:14 },
  { name:'Japan',           flag:'🇯🇵', continent:'Asia',     capital:'Tokyo',        lat:36.2048, lng:138.2529, peakTemp:39.5, humidity:65, population:'124M',  riskLevel:'moderate',alertStatus:'Yellow', deaths:67,  hosp:4320,  shelterCount:1890, incidents:28,  heatWaveDays:11 },
  { name:'South Korea',     flag:'🇰🇷', continent:'Asia',     capital:'Seoul',        lat:35.9078, lng:127.7669, peakTemp:37.8, humidity:62, population:'52M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:23,  hosp:1780,  shelterCount:780,  incidents:18,  heatWaveDays:8  },
  { name:'Thailand',        flag:'🇹🇭', continent:'Asia',     capital:'Bangkok',      lat:15.8700, lng:100.9925, peakTemp:41.5, humidity:75, population:'72M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:34,  hosp:2140,  shelterCount:540,  incidents:22,  heatWaveDays:13 },
  { name:'Vietnam',         flag:'🇻🇳', continent:'Asia',     capital:'Hanoi',        lat:14.0583, lng:108.2772, peakTemp:40.8, humidity:78, population:'98M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:28,  hosp:1890,  shelterCount:420,  incidents:19,  heatWaveDays:12 },
  { name:'Philippines',     flag:'🇵🇭', continent:'Asia',     capital:'Manila',       lat:12.8797, lng:121.7740, peakTemp:38.9, humidity:82, population:'115M',  riskLevel:'moderate',alertStatus:'Yellow', deaths:19,  hosp:1230,  shelterCount:340,  incidents:14,  heatWaveDays:9  },
  // MIDDLE EAST
  { name:'Kuwait',          flag:'🇰🇼', continent:'M.East',   capital:'Kuwait City',  lat:29.3759, lng:47.9774,  peakTemp:52.1, humidity:8,  population:'4.3M',  riskLevel:'extreme', alertStatus:'Red',    deaths:98,  hosp:2140,  shelterCount:230,  incidents:41,  heatWaveDays:31 },
  { name:'Iraq',            flag:'🇮🇶', continent:'M.East',   capital:'Baghdad',      lat:33.2232, lng:43.6793,  peakTemp:51.2, humidity:10, population:'43M',   riskLevel:'extreme', alertStatus:'Red',    deaths:234, hosp:7840,  shelterCount:680,  incidents:112, heatWaveDays:28 },
  { name:'Saudi Arabia',    flag:'🇸🇦', continent:'M.East',   capital:'Riyadh',       lat:23.8859, lng:45.0792,  peakTemp:50.8, humidity:9,  population:'36M',   riskLevel:'extreme', alertStatus:'Red',    deaths:156, hosp:4320,  shelterCount:890,  incidents:78,  heatWaveDays:25 },
  { name:'Oman',            flag:'🇴🇲', continent:'M.East',   capital:'Muscat',       lat:21.4735, lng:55.9754,  peakTemp:50.1, humidity:14, population:'4.5M',  riskLevel:'extreme', alertStatus:'Red',    deaths:45,  hosp:1340,  shelterCount:210,  incidents:32,  heatWaveDays:24 },
  { name:'UAE',             flag:'🇦🇪', continent:'M.East',   capital:'Abu Dhabi',    lat:23.4241, lng:53.8478,  peakTemp:49.3, humidity:12, population:'10M',   riskLevel:'extreme', alertStatus:'Red',    deaths:43,  hosp:1230,  shelterCount:340,  incidents:29,  heatWaveDays:22 },
  { name:'Iran',            flag:'🇮🇷', continent:'M.East',   capital:'Tehran',       lat:32.4279, lng:53.6880,  peakTemp:48.7, humidity:11, population:'88M',   riskLevel:'extreme', alertStatus:'Red',    deaths:178, hosp:6780,  shelterCount:1120, incidents:94,  heatWaveDays:20 },
  { name:'Syria',           flag:'🇸🇾', continent:'M.East',   capital:'Damascus',     lat:34.8021, lng:38.9968,  peakTemp:45.8, humidity:12, population:'19M',   riskLevel:'high',    alertStatus:'Orange', deaths:89,  hosp:2340,  shelterCount:120,  incidents:67,  heatWaveDays:19 },
  { name:'Yemen',           flag:'🇾🇪', continent:'M.East',   capital:'Sanaa',        lat:15.5527, lng:48.5164,  peakTemp:44.2, humidity:22, population:'34M',   riskLevel:'high',    alertStatus:'Orange', deaths:121, hosp:2890,  shelterCount:85,   incidents:98,  heatWaveDays:23 },
  { name:'Jordan',          flag:'🇯🇴', continent:'M.East',   capital:'Amman',        lat:30.5852, lng:36.2384,  peakTemp:44.5, humidity:15, population:'10M',   riskLevel:'high',    alertStatus:'Orange', deaths:34,  hosp:1780,  shelterCount:280,  incidents:31,  heatWaveDays:17 },
  { name:'Israel',          flag:'🇮🇱', continent:'M.East',   capital:'Jerusalem',    lat:31.0461, lng:34.8516,  peakTemp:42.1, humidity:28, population:'9.4M',  riskLevel:'high',    alertStatus:'Orange', deaths:18,  hosp:890,   shelterCount:280,  incidents:23,  heatWaveDays:15 },
  // AFRICA
  { name:'Sudan',           flag:'🇸🇩', continent:'Africa',   capital:'Khartoum',     lat:12.8628, lng:30.2176,  peakTemp:48.4, humidity:13, population:'46M',   riskLevel:'extreme', alertStatus:'Red',    deaths:143, hosp:3780,  shelterCount:210,  incidents:88,  heatWaveDays:26 },
  { name:'Libya',           flag:'🇱🇾', continent:'Africa',   capital:'Tripoli',      lat:26.3351, lng:17.2283,  peakTemp:47.3, humidity:14, population:'6.8M',  riskLevel:'extreme', alertStatus:'Red',    deaths:78,  hosp:1890,  shelterCount:145,  incidents:56,  heatWaveDays:24 },
  { name:'Egypt',           flag:'🇪🇬', continent:'Africa',   capital:'Cairo',        lat:26.8206, lng:30.8025,  peakTemp:46.8, humidity:16, population:'105M',  riskLevel:'extreme', alertStatus:'Red',    deaths:167, hosp:5670,  shelterCount:780,  incidents:89,  heatWaveDays:21 },
  { name:'Somalia',         flag:'🇸🇴', continent:'Africa',   capital:'Mogadishu',    lat:5.1521,  lng:46.1996,  peakTemp:43.8, humidity:38, population:'17M',   riskLevel:'high',    alertStatus:'Orange', deaths:98,  hosp:1890,  shelterCount:78,   incidents:76,  heatWaveDays:20 },
  { name:'Algeria',         flag:'🇩🇿', continent:'Africa',   capital:'Algiers',      lat:28.0339, lng:1.6596,   peakTemp:45.2, humidity:18, population:'45M',   riskLevel:'high',    alertStatus:'Orange', deaths:87,  hosp:3120,  shelterCount:340,  incidents:62,  heatWaveDays:18 },
  { name:'Morocco',         flag:'🇲🇦', continent:'Africa',   capital:'Rabat',        lat:31.7917, lng:-7.0926,  peakTemp:43.7, humidity:24, population:'37M',   riskLevel:'high',    alertStatus:'Orange', deaths:54,  hosp:2340,  shelterCount:420,  incidents:41,  heatWaveDays:16 },
  { name:'Ethiopia',        flag:'🇪🇹', continent:'Africa',   capital:'Addis Ababa',  lat:9.1450,  lng:40.4897,  peakTemp:40.8, humidity:35, population:'128M',  riskLevel:'moderate',alertStatus:'Yellow', deaths:34,  hosp:2140,  shelterCount:290,  incidents:28,  heatWaveDays:12 },
  { name:'Nigeria',         flag:'🇳🇬', continent:'Africa',   capital:'Abuja',        lat:9.0820,  lng:8.6753,   peakTemp:41.2, humidity:58, population:'220M',  riskLevel:'moderate',alertStatus:'Yellow', deaths:28,  hosp:1890,  shelterCount:340,  incidents:31,  heatWaveDays:10 },
  { name:'Kenya',           flag:'🇰🇪', continent:'Africa',   capital:'Nairobi',      lat:-0.0236, lng:37.9062,  peakTemp:39.5, humidity:48, population:'55M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:19,  hosp:1120,  shelterCount:210,  incidents:16,  heatWaveDays:9  },
  { name:'South Africa',    flag:'🇿🇦', continent:'Africa',   capital:'Pretoria',     lat:-30.5595,lng:22.9375,  peakTemp:36.5, humidity:42, population:'60M',   riskLevel:'low',     alertStatus:'Green',  deaths:8,   hosp:450,   shelterCount:120,  incidents:12,  heatWaveDays:5  },
  // EUROPE
  { name:'Spain',           flag:'🇪🇸', continent:'Europe',   capital:'Madrid',       lat:40.4637, lng:-3.7492,  peakTemp:45.0, humidity:20, population:'47M',   riskLevel:'high',    alertStatus:'Orange', deaths:234, hosp:8920,  shelterCount:1240, incidents:78,  heatWaveDays:16 },
  { name:'Portugal',        flag:'🇵🇹', continent:'Europe',   capital:'Lisbon',       lat:39.3999, lng:-8.2245,  peakTemp:44.2, humidity:22, population:'10M',   riskLevel:'high',    alertStatus:'Orange', deaths:156, hosp:4320,  shelterCount:540,  incidents:54,  heatWaveDays:14 },
  { name:'Greece',          flag:'🇬🇷', continent:'Europe',   capital:'Athens',       lat:39.0742, lng:21.8243,  peakTemp:43.5, humidity:25, population:'11M',   riskLevel:'high',    alertStatus:'Orange', deaths:89,  hosp:3120,  shelterCount:420,  incidents:43,  heatWaveDays:15 },
  { name:'Italy',           flag:'🇮🇹', continent:'Europe',   capital:'Rome',         lat:41.8719, lng:12.5674,  peakTemp:42.8, humidity:28, population:'60M',   riskLevel:'high',    alertStatus:'Orange', deaths:178, hosp:6780,  shelterCount:890,  incidents:67,  heatWaveDays:13 },
  { name:'Turkey',          flag:'🇹🇷', continent:'Europe',   capital:'Ankara',       lat:38.9637, lng:35.2433,  peakTemp:44.8, humidity:22, population:'85M',   riskLevel:'high',    alertStatus:'Orange', deaths:112, hosp:5430,  shelterCount:780,  incidents:58,  heatWaveDays:17 },
  { name:'France',          flag:'🇫🇷', continent:'Europe',   capital:'Paris',        lat:46.2276, lng:2.2137,   peakTemp:40.1, humidity:32, population:'68M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:78,  hosp:4560,  shelterCount:780,  incidents:34,  heatWaveDays:10 },
  { name:'Germany',         flag:'🇩🇪', continent:'Europe',   capital:'Berlin',       lat:51.1657, lng:10.4515,  peakTemp:38.2, humidity:45, population:'84M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:34,  hosp:2340,  shelterCount:560,  incidents:18,  heatWaveDays:7  },
  { name:'United Kingdom',  flag:'🇬🇧', continent:'Europe',   capital:'London',       lat:55.3781, lng:-3.4360,  peakTemp:37.8, humidity:48, population:'67M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:18,  hosp:1340,  shelterCount:320,  incidents:12,  heatWaveDays:5  },
  // AMERICAS
  { name:'USA',             flag:'🇺🇸', continent:'Americas', capital:'Washington DC', lat:37.0902, lng:-95.7129, peakTemp:46.5, humidity:18, population:'335M',  riskLevel:'high',    alertStatus:'Orange', deaths:189, hosp:12340, shelterCount:3240, incidents:89,  heatWaveDays:14 },
  { name:'Mexico',          flag:'🇲🇽', continent:'Americas', capital:'Mexico City',  lat:23.6345, lng:-102.5528,peakTemp:44.1, humidity:28, population:'131M',  riskLevel:'high',    alertStatus:'Orange', deaths:123, hosp:5670,  shelterCount:890,  incidents:67,  heatWaveDays:16 },
  { name:'Canada',          flag:'🇨🇦', continent:'Americas', capital:'Ottawa',       lat:56.1304, lng:-106.3468,peakTemp:39.8, humidity:35, population:'38M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:18,  hosp:1230,  shelterCount:320,  incidents:12,  heatWaveDays:8  },
  { name:'Brazil',          flag:'🇧🇷', continent:'Americas', capital:'Brasilia',     lat:-14.2350,lng:-51.9253, peakTemp:41.2, humidity:55, population:'215M',  riskLevel:'moderate',alertStatus:'Yellow', deaths:45,  hosp:3240,  shelterCount:780,  incidents:34,  heatWaveDays:11 },
  { name:'Argentina',       flag:'🇦🇷', continent:'Americas', capital:'Buenos Aires', lat:-38.4161,lng:-63.6167, peakTemp:39.8, humidity:40, population:'46M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:23,  hosp:1560,  shelterCount:340,  incidents:18,  heatWaveDays:9  },
  { name:'Colombia',        flag:'🇨🇴', continent:'Americas', capital:'Bogota',       lat:4.5709,  lng:-74.2973, peakTemp:37.5, humidity:68, population:'52M',   riskLevel:'moderate',alertStatus:'Yellow', deaths:12,  hosp:890,   shelterCount:210,  incidents:10,  heatWaveDays:7  },
  { name:'Peru',            flag:'🇵🇪', continent:'Americas', capital:'Lima',         lat:-9.1900, lng:-75.0152, peakTemp:36.8, humidity:55, population:'33M',   riskLevel:'low',     alertStatus:'Green',  deaths:8,   hosp:540,   shelterCount:140,  incidents:7,   heatWaveDays:5  },
  // OCEANIA
  { name:'Australia',       flag:'🇦🇺', continent:'Oceania',  capital:'Canberra',     lat:-25.2744,lng:133.7751, peakTemp:47.8, humidity:15, population:'26M',   riskLevel:'extreme', alertStatus:'Red',    deaths:78,  hosp:2340,  shelterCount:540,  incidents:43,  heatWaveDays:18 },
  { name:'New Zealand',     flag:'🇳🇿', continent:'Oceania',  capital:'Wellington',   lat:-40.9006,lng:174.8860, peakTemp:33.2, humidity:55, population:'5M',    riskLevel:'low',     alertStatus:'Green',  deaths:2,   hosp:120,   shelterCount:45,   incidents:3,   heatWaveDays:4  },
];

// Keep backward compat ref
const REGIONS = WORLD_COUNTRIES;

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

// ── Populate all country dropdowns ───────────────────────────────
function populateCountryDropdowns() {
  const sorted = [...WORLD_COUNTRIES].sort((a,b) => a.name.localeCompare(b.name));
  const selectIds = ['filterCountrySearch','incCountry','shelCountry','filterShelterCountry','filterContry','rptRegion'];
  selectIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    // Keep first option (All Countries / placeholder)
    while (el.options.length > 1) el.remove(1);
    sorted.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = `${c.flag} ${c.name}`;
      el.appendChild(opt);
    });
  });
  // Fly-to dropdown
  const flyEl = document.getElementById('mapCountryFlyTo');
  if (flyEl) {
    while (flyEl.options.length > 1) flyEl.remove(1);
    WORLD_COUNTRIES.sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
      const opt = document.createElement('option');
      opt.value = `${c.lat},${c.lng}`;
      opt.textContent = `${c.flag} ${c.name} — ${c.capital}`;
      flyEl.appendChild(opt);
    });
  }
}

// ── World Risk Strip ────────────────────────────────────────────
function updateWorldRiskStrip(data) {
  const src = data || WORLD_COUNTRIES;
  const counts = { extreme:0, high:0, moderate:0, low:0 };
  src.forEach(c => counts[c.riskLevel] = (counts[c.riskLevel]||0) + 1);
  document.getElementById('wrsExtreme').textContent  = counts.extreme  || 0;
  document.getElementById('wrsHigh').textContent     = counts.high     || 0;
  document.getElementById('wrsModerate').textContent = counts.moderate || 0;
  document.getElementById('wrsLow').textContent      = counts.low      || 0;
  document.getElementById('wrsTotal').textContent    = src.length;
}

// ── Dashboard Risk Table (Global) ──────────────────────────────
const ALERT_COLORS = { Red:'var(--danger-light)', Orange:'var(--heat-orange)', Yellow:'var(--warning-amber)', Green:'var(--safe-teal)' };

function renderRiskTable() {
  const tbody        = document.getElementById('riskTableBody');
  const contFilter   = document.getElementById('filterContinent')?.value  || 'all';
  const riskFilter   = document.getElementById('filterRiskLevel')?.value   || 'all';
  const countryFilter= document.getElementById('filterCountrySearch')?.value || 'all';
  const sortBy       = document.getElementById('sortWorldTable')?.value    || 'temp';

  let data = [...WORLD_COUNTRIES];
  if (contFilter    !== 'all') data = data.filter(c => c.continent   === contFilter);
  if (riskFilter    !== 'all') data = data.filter(c => c.riskLevel   === riskFilter);
  if (countryFilter !== 'all') data = data.filter(c => c.name        === countryFilter);

  const sortFns = {
    temp:   (a,b) => b.peakTemp - a.peakTemp,
    deaths: (a,b) => b.deaths   - a.deaths,
    hosp:   (a,b) => b.hosp     - a.hosp,
    name:   (a,b) => a.name.localeCompare(b.name)
  };
  data.sort(sortFns[sortBy] || sortFns.temp);

  tbody.innerHTML = '';
  data.forEach(c => {
    const alertCol = ALERT_COLORS[c.alertStatus] || 'var(--text-secondary)';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700;color:var(--text-primary)">${c.flag} ${c.name}</td>
      <td style="color:var(--text-secondary);font-size:12px">${c.continent}</td>
      <td style="color:var(--heat-orange);font-weight:700">${c.peakTemp}°</td>
      <td>${c.humidity}%</td>
      <td style="font-size:12px">${c.population}</td>
      <td style="color:var(--danger-light);font-weight:600">${c.deaths.toLocaleString()}</td>
      <td style="color:var(--warning-amber)">${c.hosp.toLocaleString()}</td>
      <td><span style="color:${alertCol};font-weight:700;font-size:11px">${c.alertStatus}</span></td>
      <td><span class="risk-badge ${c.riskLevel}">${c.riskLevel.charAt(0).toUpperCase()+c.riskLevel.slice(1)}</span></td>
    `;
    tbody.appendChild(tr);
  });

  updateWorldRiskStrip(data);
  updateGlobalTempChart(data);
  document.getElementById('globalChartBadge').textContent =
    countryFilter !== 'all' ? countryFilter :
    contFilter    !== 'all' ? contFilter :
    'All Countries';
}

function initWorldTableFilters() {
  ['filterContinent','filterRiskLevel','filterCountrySearch','sortWorldTable'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', renderRiskTable);
  });
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

// ── Update Dashboard Stats ────────────────────────────────────────────
function updateDashboardStats() {
  const activeInc = APP.incidents.filter(i => i.status === 'Active').length;
  const totalShelterCap = APP.shelters.reduce((a, s) => a + Number(s.capacity), 0);
  const totalShelterOcc = APP.shelters.reduce((a, s) => a + Number(s.occupancy), 0);
  const pct = totalShelterCap ? Math.round(totalShelterOcc / totalShelterCap * 100) : 0;

  document.getElementById('statIncidents').textContent = activeInc;
  document.getElementById('statIncidentSub').textContent = activeInc ? `${activeInc} requiring attention` : 'No active incidents';

  if (totalShelterCap > 0) {
    document.getElementById('statShelters').textContent = `${pct}%`;
    document.getElementById('statShelterSub').textContent = `${totalShelterOcc.toLocaleString()} / ${totalShelterCap.toLocaleString()} occupied`;
  }
  document.getElementById('incidentCountBadge').textContent = APP.incidents.length;
}

// ── Global Top-20 Temperature Chart ──────────────────────────────
function initGlobalTempChart() {
  const ctx = document.getElementById('globalTempChart')?.getContext('2d');
  if (!ctx) return;
  const top20 = [...WORLD_COUNTRIES].sort((a,b) => b.peakTemp - a.peakTemp).slice(0, 20);
  const cols  = top20.map(c => {
    if (c.riskLevel === 'extreme')  return 'rgba(214,40,57,0.85)';
    if (c.riskLevel === 'high')     return 'rgba(255,107,53,0.85)';
    if (c.riskLevel === 'moderate') return 'rgba(247,167,49,0.85)';
    return 'rgba(46,196,182,0.85)';
  });

  APP.charts.globalTemp = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top20.map(c => `${c.flag} ${c.name}`),
      datasets: [{
        label: 'Peak Temp (°C)',
        data:  top20.map(c => c.peakTemp),
        backgroundColor: cols,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161C2B',
          borderColor: '#242D42',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.parsed.x}°C — ${WORLD_COUNTRIES.find(c => c.name === ctx.label.slice(ctx.label.indexOf(' ')+1))?.alertStatus || ''} Alert`
          }
        }
      },
      scales: {
        x: {
          grid: { color: CHART_DEFAULTS.grid },
          ticks: { color: CHART_DEFAULTS.tick, callback: v => v + '°C', font: { size: 10 } },
          min: 30, max: 56
        },
        y: {
          grid: { display: false },
          ticks: { color: CHART_DEFAULTS.color, font: { size: 11 } }
        }
      }
    }
  });
}

function updateGlobalTempChart(data) {
  if (!APP.charts.globalTemp) return;
  const top20 = [...data].sort((a,b) => b.peakTemp - a.peakTemp).slice(0, 20);
  const cols  = top20.map(c => {
    if (c.riskLevel === 'extreme')  return 'rgba(214,40,57,0.85)';
    if (c.riskLevel === 'high')     return 'rgba(255,107,53,0.85)';
    if (c.riskLevel === 'moderate') return 'rgba(247,167,49,0.85)';
    return 'rgba(46,196,182,0.85)';
  });
  APP.charts.globalTemp.data.labels = top20.map(c => `${c.flag} ${c.name}`);
  APP.charts.globalTemp.data.datasets[0].data = top20.map(c => c.peakTemp);
  APP.charts.globalTemp.data.datasets[0].backgroundColor = cols;
  APP.charts.globalTemp.update();
}



// ══════════════════════════════════════════════════════════════
//  MAP
// ══════════════════════════════════════════════════════════════

function initMap() {
  if (APP.map) return;

  APP.map = L.map('heatMap', {
    center: [20, 15],
    zoom: 2,
    zoomControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(APP.map);

  renderMapLayers();

  // Continent pill filter
  document.querySelectorAll('.continent-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.continent-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cont = btn.dataset.continent;
      renderMapLayers(cont === 'all' ? null : cont);
      // Fit bounds to filtered countries
      if (cont !== 'all') {
        const filtered = WORLD_COUNTRIES.filter(c => c.continent === cont);
        if (filtered.length > 0) {
          const lats = filtered.map(c => c.lat);
          const lngs = filtered.map(c => c.lng);
          APP.map.fitBounds([[Math.min(...lats)-5, Math.min(...lngs)-10],[Math.max(...lats)+5, Math.max(...lngs)+10]], { padding:[30,30] });
        }
      } else {
        APP.map.setView([20, 15], 2);
      }
    });
  });

  // Fly-to country
  const flyEl = document.getElementById('mapCountryFlyTo');
  if (flyEl) {
    flyEl.addEventListener('change', () => {
      const [lat, lng] = flyEl.value.split(',').map(Number);
      if (!isNaN(lat)) APP.map.flyTo([lat, lng], 5, { duration: 1.5 });
    });
  }

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

  updateMapGlobalStats();
}

function updateMapGlobalStats(filteredContinent) {
  const data = filteredContinent
    ? WORLD_COUNTRIES.filter(c => c.continent === filteredContinent)
    : WORLD_COUNTRIES;
  const counts = { extreme:0, high:0, moderate:0, low:0 };
  let totalDeaths = 0, totalShelters = 0;
  data.forEach(c => {
    counts[c.riskLevel]++;
    totalDeaths  += c.deaths;
    totalShelters += c.shelterCount;
  });
  document.getElementById('mapExtCount').textContent    = counts.extreme;
  document.getElementById('mapHighCount').textContent   = counts.high;
  document.getElementById('mapModCount').textContent    = counts.moderate;
  document.getElementById('mapLowCount').textContent    = counts.low;
  document.getElementById('mapTotalDeaths').textContent = totalDeaths.toLocaleString();
  document.getElementById('mapShelterCount').textContent= totalShelters.toLocaleString();
}


const RISK_COLORS = {
  extreme:  { color: '#D62839', fillOpacity: 0.5 },
  high:     { color: '#FF6B35', fillOpacity: 0.4 },
  moderate: { color: '#F7A731', fillOpacity: 0.3 },
  low:      { color: '#2EC4B6', fillOpacity: 0.25 }
};

function renderMapLayers(continentFilter) {
  Object.values(APP.mapLayers).forEach(l => l && APP.map.removeLayer(l));

  const data = continentFilter
    ? WORLD_COUNTRIES.filter(c => c.continent === continentFilter)
    : WORLD_COUNTRIES;

  // Country risk circles
  const riskGroup = L.layerGroup();
  data.forEach(c => {
    const cfg = RISK_COLORS[c.riskLevel];
    const radius = c.population.includes('B') ? 600000 : c.population.includes('M') && parseInt(c.population) > 100 ? 500000 : 350000;
    const circle = L.circle([c.lat, c.lng], {
      radius,
      color: cfg.color,
      fillColor: cfg.color,
      fillOpacity: cfg.fillOpacity,
      weight: c.riskLevel === 'extreme' ? 2 : 1,
      dashArray: c.riskLevel === 'extreme' ? '6 4' : ''
    });
    circle.bindPopup(`
      <div class="map-popup">
        <h4>${c.flag} ${c.name}</h4>
        <div class="pop-row"><span class="pop-label">Capital</span><span class="pop-val">${c.capital}</span></div>
        <div class="pop-row"><span class="pop-label">Peak Temp</span><span class="pop-val" style="color:#FF6B35">${c.peakTemp}°C</span></div>
        <div class="pop-row"><span class="pop-label">Alert</span><span class="pop-val" style="color:${ALERT_COLORS[c.alertStatus]}">${c.alertStatus}</span></div>
        <div class="pop-row"><span class="pop-label">Deaths</span><span class="pop-val" style="color:#D62839">${c.deaths.toLocaleString()}</span></div>
        <div class="pop-row"><span class="pop-label">Hospitalised</span><span class="pop-val">${c.hosp.toLocaleString()}</span></div>
        <div class="pop-row"><span class="pop-label">Population</span><span class="pop-val">${c.population}</span></div>
        <div class="pop-row"><span class="pop-label">Risk Level</span><span class="pop-val" style="color:${cfg.color}">${c.riskLevel.toUpperCase()}</span></div>
      </div>
    `, { maxWidth: 240 });

    // Country label
    const labelIcon = L.divIcon({
      className: '',
      html: `<div style="background:rgba(0,0,0,0.8);color:#F0F4FF;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;font-family:Inter,sans-serif;white-space:nowrap;border:1px solid ${cfg.color}">${c.flag} ${c.name}</div>`,
      iconAnchor: [40, 10]
    });
    L.marker([c.lat, c.lng], { icon: labelIcon, interactive: false }).addTo(riskGroup);
    riskGroup.addLayer(circle);
  });

  APP.mapLayers.risk = riskGroup;
  riskGroup.addTo(APP.map);

  refreshMapShelters();
  refreshMapIncidents();
  updateMapGlobalStats(continentFilter);
}


function refreshMapShelters() {
  if (!APP.map) return;
  if (APP.mapLayers.shelters) APP.map.removeLayer(APP.mapLayers.shelters);
  const group = L.layerGroup();
  const shelterIcon = L.divIcon({
    className: '',
    html: `<div style="background:#2EC4B6;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 0 8px rgba(46,196,182,0.5);border:2px solid rgba(46,196,182,0.8)">🏥</div>`,
    iconAnchor: [11, 11]
  });
  APP.shelters.forEach((s, idx) => {
    const country = WORLD_COUNTRIES.find(c => c.name === s.country) || WORLD_COUNTRIES[idx % WORLD_COUNTRIES.length];
    const jitter = [(Math.random()-0.5)*2, (Math.random()-0.5)*2];
    const pct = Math.round(Number(s.occupancy) / Number(s.capacity) * 100);
    const marker = L.marker([country.lat + jitter[0], country.lng + jitter[1]], { icon: shelterIcon });
    marker.bindPopup(`
      <div class="map-popup">
        <h4>🏥 ${s.name}</h4>
        <div class="pop-row"><span class="pop-label">Country</span><span class="pop-val">${s.country}</span></div>
        <div class="pop-row"><span class="pop-label">City</span><span class="pop-val">${s.city || s.region || '—'}</span></div>
        <div class="pop-row"><span class="pop-label">Occupancy</span><span class="pop-val">${s.occupancy} / ${s.capacity} (${pct}%)</span></div>
        <div class="pop-row"><span class="pop-label">Water</span><span class="pop-val">${s.water}</span></div>
        <div class="pop-row"><span class="pop-label">Medical</span><span class="pop-val">${s.medical}</span></div>
      </div>
    `, { maxWidth: 220 });
    group.addLayer(marker);
  });
  APP.mapLayers.shelters = group;
  if (document.getElementById('layerShelters')?.checked) group.addTo(APP.map);
  document.getElementById('mapShelterCount').textContent = APP.shelters.length;
}


function refreshMapIncidents() {
  if (!APP.map) return;
  if (APP.mapLayers.incidents) APP.map.removeLayer(APP.mapLayers.incidents);
  const group = L.layerGroup();
  const COLORS = { Critical: '#D62839', High: '#FF6B35', Moderate: '#F7A731', Low: '#2EC4B6' };
  APP.incidents.filter(i => i.status !== 'Resolved').forEach((inc) => {
    const country = WORLD_COUNTRIES.find(c => c.name === inc.country) || WORLD_COUNTRIES[0];
    const col = COLORS[inc.severity] || '#8A9BB8';
    const jitter = [(Math.random()-0.5)*3, (Math.random()-0.5)*3];
    const iconHtml = `<div style="background:${col};width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 8px ${col}66;display:flex;align-items:center;justify-content:center;font-size:10px">⚠</div>`;
    const icon = L.divIcon({ className: '', html: iconHtml, iconAnchor: [9, 9] });
    const marker = L.marker([country.lat + jitter[0], country.lng + jitter[1]], { icon });
    marker.bindPopup(`
      <div class="map-popup">
        <h4>⚠️ ${inc.type}</h4>
        <div class="pop-row"><span class="pop-label">Country</span><span class="pop-val">${inc.country}</span></div>
        <div class="pop-row"><span class="pop-label">Region</span><span class="pop-val">${inc.region}</span></div>
        <div class="pop-row"><span class="pop-label">Severity</span><span class="pop-val" style="color:${col}">${inc.severity}</span></div>
        <div class="pop-row"><span class="pop-label">Casualties</span><span class="pop-val">${inc.casualties}</span></div>
      </div>
    `, { maxWidth: 220 });
    group.addLayer(marker);
  });
  APP.mapLayers.incidents = group;
  if (document.getElementById('layerIncidents')?.checked) group.addTo(APP.map);
}

// ══════════════════════════════════════════════════════════════
//  INCIDENTS
// ══════════════════════════════════════════════════════════════

function initIncidentForm() {
  document.getElementById('incidentForm').addEventListener('submit', e => {
    e.preventDefault();
    const country = document.getElementById('incCountry').value;
    const region  = document.getElementById('incRegion').value;
    const inc = {
      id:         uuid(),
      type:       document.getElementById('incType').value,
      country,
      region,
      severity:   document.getElementById('incSeverity').value,
      casualties: Number(document.getElementById('incCasualties').value) || 0,
      reporter:   document.getElementById('incReporter').value,
      notes:      document.getElementById('incNotes').value,
      status:     'Active',
      timestamp:  new Date().toISOString()
    };
    const wc = WORLD_COUNTRIES.find(c => c.name === country);
    inc.continent = wc ? wc.continent : '';
    inc.flag      = wc ? wc.flag      : '🏳️';

    APP.incidents.unshift(inc);
    saveData();
    renderIncidents();
    updateDashboardStats();
    if (APP.map) refreshMapIncidents();

    document.getElementById('incidentForm').reset();
    showToast(`Incident logged: ${inc.type} in ${region}, ${country}`, 'warning', '🚨');
  });

  ['filterSeverity','filterContry','filterContinent'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', renderIncidents);
  });
}


function renderIncidents() {
  const list  = document.getElementById('incidentList');
  const empty = document.getElementById('incidentEmpty');
  const total = document.getElementById('incidentTotal');

  const sevFilter  = document.getElementById('filterSeverity')?.value  || 'all';
  const ctyFilter  = document.getElementById('filterContry')?.value    || 'all';
  const contFilter = document.getElementById('filterContinent')?.value  || 'all';

  let filtered = APP.incidents || [];
  if (sevFilter  !== 'all') filtered = filtered.filter(i => i.severity  === sevFilter);
  if (ctyFilter  !== 'all') filtered = filtered.filter(i => i.country   === ctyFilter);
  if (contFilter !== 'all') filtered = filtered.filter(i => i.continent === contFilter);

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
        <span class="incident-type">${inc.flag || ''} ${inc.type}</span>
        <span class="sev-pill ${inc.severity}">${inc.severity}</span>
      </div>
      <div class="incident-meta">
        <span>🇿 ${inc.country || '—'}</span>
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
    <div class="modal-detail"><label>Country</label><p>${inc.flag || ''} ${inc.country || '—'}</p></div>
    <div class="modal-detail"><label>City / Region</label><p>${inc.region}</p></div>
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
    if (occ > cap) { showToast('Occupancy cannot exceed capacity', 'error'); return; }

    const country = document.getElementById('shelCountry').value;
    const wc      = WORLD_COUNTRIES.find(c => c.name === country);
    const shelter = {
      id:        uuid(),
      name:      document.getElementById('shelName').value,
      country,
      city:      document.getElementById('shelCity').value,
      continent: wc ? wc.continent : '',
      flag:      wc ? wc.flag      : '🏳️',
      capacity:  cap,
      occupancy: occ,
      water:     document.getElementById('shelWater').value,
      medical:   document.getElementById('shelMedical').value,
      contact:   document.getElementById('shelContact').value,
      timestamp: new Date().toISOString()
    };

    APP.shelters.push(shelter);
    saveData();
    renderShelters();
    updateDashboardStats();
    if (APP.map) refreshMapShelters();
    document.getElementById('shelterForm').reset();
    showToast(`Shelter registered: ${shelter.name} in ${shelter.city}, ${shelter.country}`, 'success', '🏥');
  });

  const fsc = document.getElementById('filterShelterCountry');
  if (fsc) fsc.addEventListener('change', renderShelters);
}


function renderShelters() {
  const list    = document.getElementById('shelterList');
  const empty   = document.getElementById('shelterEmpty');
  const total   = document.getElementById('shelterTotal');
  const capText = document.getElementById('overallCapText');
  const capBar  = document.getElementById('overallCapBar');

  const ctyFilter = document.getElementById('filterShelterCountry')?.value || 'all';
  const displayed = ctyFilter !== 'all'
    ? APP.shelters.filter(s => s.country === ctyFilter)
    : APP.shelters;

  total.textContent = displayed.length;

  const totalCap = displayed.reduce((a, s) => a + Number(s.capacity), 0);
  const totalOcc = displayed.reduce((a, s) => a + Number(s.occupancy), 0);
  const pct = totalCap ? Math.round(totalOcc / totalCap * 100) : 0;
  capText.textContent = `${totalOcc.toLocaleString()} / ${totalCap.toLocaleString()} total occupancy (${pct}%)`;
  capBar.style.width = pct + '%';
  capBar.style.background = pct > 80 ? '#D62839' : pct > 60 ? '#F7A731' : '#2EC4B6';

  list.querySelectorAll('.shelter-card').forEach(el => el.remove());

  if (displayed.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  displayed.forEach(s => {
    const cap = Number(s.capacity);
    const occ = Number(s.occupancy);
    const pct = cap ? Math.round(occ / cap * 100) : 0;
    const capClass = pct > 80 ? 'cap-high' : pct > 60 ? 'cap-medium' : 'cap-low';
    const div = document.createElement('div');
    div.className = `shelter-card ${capClass}`;
    div.innerHTML = `
      <div class="shelter-top">
        <div>
          <div class="shelter-name">${s.flag || ''} ${s.name}</div>
          <div class="shelter-region">🇿 ${s.country} &middot; 📍 ${s.city || s.region || '—'}</div>
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
      saveData(); renderShelters(); updateDashboardStats();
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
  const today   = formatDateISO();
  const weekAgo = formatDateISO(new Date(Date.now() - 7 * 86400000));
  document.getElementById('rptDateFrom').value = weekAgo;
  document.getElementById('rptDateTo').value   = today;

  document.querySelectorAll('.report-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.report-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP.reportType = btn.dataset.type;
    });
  });

  // Scope selector
  document.querySelectorAll('.scope-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const scope = btn.dataset.scope;
      document.getElementById('rptContinentGroup').style.display = scope === 'continent' ? 'block' : 'none';
      document.getElementById('rptCountryGroup').style.display   = scope === 'country'   ? 'block' : 'none';
    });
  });

  document.getElementById('generateReportBtn').addEventListener('click', generateReportPreview);
  document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
  document.getElementById('printBtn').addEventListener('click', () => window.print());
}


function generateReportPreview() {
  const from    = document.getElementById('rptDateFrom').value;
  const to      = document.getElementById('rptDateTo').value;
  const author  = document.getElementById('rptAuthor').value || 'El Niño Emergency Operations Center';
  const notes   = document.getElementById('rptNotes').value;
  const type    = APP.reportType;
  const now     = new Date();

  // Retrieve active scope
  const activeScopeBtn = document.querySelector('.scope-btn.active');
  const scope = activeScopeBtn ? activeScopeBtn.dataset.scope : 'global';

  let scopeCountries = [...WORLD_COUNTRIES];
  let scopeTitle = 'Global Operations';

  if (scope === 'continent') {
    const contVal = document.getElementById('rptContinent').value;
    if (contVal !== 'all') {
      scopeCountries = WORLD_COUNTRIES.filter(c => c.continent === contVal);
      scopeTitle = `${contVal} Continent`;
    } else {
      scopeTitle = 'All Continents';
    }
  } else if (scope === 'country') {
    const countryVal = document.getElementById('rptRegion').value;
    if (countryVal !== 'all') {
      scopeCountries = WORLD_COUNTRIES.filter(c => c.name === countryVal);
      const cObj = WORLD_COUNTRIES.find(c => c.name === countryVal);
      scopeTitle = cObj ? `${cObj.flag} ${cObj.name}` : countryVal;
    } else {
      scopeTitle = 'All Countries';
    }
  }

  const countryNames = scopeCountries.map(c => c.name);

  // Filter incidents
  const filteredIncidents = APP.incidents.filter(i => {
    const d = i.timestamp.split('T')[0];
    const inDate = (!from || d >= from) && (!to || d <= to);
    const inScope = scope === 'global' || countryNames.includes(i.country);
    return inDate && inScope;
  });

  // Filter shelters
  const filteredShelters = APP.shelters.filter(s => {
    return scope === 'global' || countryNames.includes(s.country);
  });

  // Aggregate stats
  const peakTemp = scopeCountries.reduce((max, c) => c.peakTemp > max ? c.peakTemp : max, 0);
  const totalBaseDeaths = scopeCountries.reduce((sum, c) => sum + c.deaths, 0);
  const totalBaseHosp = scopeCountries.reduce((sum, c) => sum + c.hosp, 0);
  const activeInc = filteredIncidents.filter(i => i.status === 'Active').length;
  const resolvedInc = filteredIncidents.filter(i => i.status === 'Resolved').length;
  const criticalInc = filteredIncidents.filter(i => i.severity === 'Critical').length;
  const totalCasualties = filteredIncidents.reduce((a, i) => a + i.casualties, 0);
  const totalShelterCap = filteredShelters.reduce((a, s) => a + Number(s.capacity), 0);
  const totalShelterOcc = filteredShelters.reduce((a, s) => a + Number(s.occupancy), 0);
  const shelterPct = totalShelterCap ? Math.round(totalShelterOcc / totalShelterCap * 100) : 0;

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
        Heat Wave El Niño — Scope: <strong>${scopeTitle}</strong><br>
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
        <p>Heat Wave El Niño continues to impact <strong>${scopeTitle}</strong> with extreme temperatures reaching peak levels of <strong>${peakTemp}°C</strong>. Responders are tracking multiple severe incidents and managing emergency shelters.</p>
        <div class="rpt-stat-row">
          <div class="rpt-stat-box"><span class="val">${peakTemp}°C</span><span class="lbl">Peak Temp</span></div>
          <div class="rpt-stat-box"><span class="val">${scopeCountries.length}</span><span class="lbl">Affected Countries</span></div>
          <div class="rpt-stat-box"><span class="val">${(totalBaseDeaths + totalCasualties).toLocaleString()}</span><span class="lbl">Total Deaths</span></div>
          <div class="rpt-stat-box"><span class="val">${(totalBaseHosp).toLocaleString()}</span><span class="lbl">Hospitalised</span></div>
          <div class="rpt-stat-box"><span class="val">${filteredIncidents.length}</span><span class="lbl">Total Incidents</span></div>
          <div class="rpt-stat-box"><span class="val">${totalCasualties}</span><span class="lbl">Incident Casualties</span></div>
        </div>
      </div>

      <div class="rpt-section">
        <h2>Affected Area Summary (Top 10 Hottest)</h2>
        <table class="rpt-table">
          <thead><tr><th>Country</th><th>Continent</th><th>Peak Temp</th><th>Humidity</th><th>Alert Level</th><th>Risk Level</th></tr></thead>
          <tbody>
            ${scopeCountries.sort((a,b) => b.peakTemp - a.peakTemp).slice(0, 10).map(c =>
              `<tr><td>${c.flag} ${c.name}</td><td>${c.continent}</td><td>${c.peakTemp}°C</td><td>${c.humidity}%</td><td>${c.alertStatus}</td><td>${c.riskLevel.toUpperCase()}</td></tr>`
            ).join('')}
          </tbody>
        </table>
      </div>

      <div class="rpt-section">
        <h2>Incident Summary</h2>
        <p>Total Incidents: <strong>${filteredIncidents.length}</strong> | Active: <strong>${activeInc}</strong> | Resolved: <strong>${resolvedInc}</strong> | Critical: <strong>${criticalInc}</strong></p>
        ${filteredIncidents.length > 0 ? `
        <table class="rpt-table">
          <thead><tr><th>Type</th><th>Country</th><th>Region</th><th>Severity</th><th>Status</th><th>Casualties</th></tr></thead>
          <tbody>
            ${filteredIncidents.slice(0, 10).map(i =>
              `<tr><td>${i.type}</td><td>${i.country}</td><td>${i.region}</td><td>${i.severity}</td><td>${i.status}</td><td>${i.casualties}</td></tr>`
            ).join('')}
          </tbody>
        </table>` : '<p style="color:#999">No incidents logged for this period.</p>'}
      </div>

      <div class="rpt-section">
        <h2>Shelter Status</h2>
        ${filteredShelters.length > 0 ? `
        <p>Total Shelters: <strong>${filteredShelters.length}</strong> | Overall Occupancy: <strong>${totalShelterOcc.toLocaleString()} / ${totalShelterCap.toLocaleString()} (${shelterPct}%)</strong></p>
        <table class="rpt-table">
          <thead><tr><th>Shelter</th><th>Country</th><th>City</th><th>Occupancy</th><th>Resources</th></tr></thead>
          <tbody>
            ${filteredShelters.map(s =>
              `<tr><td>${s.name}</td><td>${s.country}</td><td>${s.city || '—'}</td><td>${s.occupancy}/${s.capacity} (${Math.round(Number(s.occupancy)/Number(s.capacity)*100)}%)</td><td>Water: ${s.water} | Medical: ${s.medical}</td></tr>`
            ).join('')}
          </tbody>
        </table>` : '<p style="color:#999">No shelters registered in this scope.</p>'}
      </div>

      ${notes ? `<div class="rpt-section"><h2>Additional Notes</h2><p>${notes}</p></div>` : ''}

      <div class="rpt-section">
        <h2>Key Recommendations</h2>
        <ol>
          <li>Immediately enforce alert protocols in extreme heat areas (exceeding 48°C).</li>
          <li>Deploy additional cooling assets to countries with high shelter occupancy.</li>
          <li>Maintain close communication with regional field command posts.</li>
        </ol>
      </div>
    `;
  } else if (type === 'field') {
    html += `
      <div class="rpt-section">
        <h2>Field Operations Status</h2>
        <p><strong>Operational Period:</strong> ${from || 'N/A'} to ${to || 'N/A'} | <strong>Scope:</strong> ${scopeTitle}</p>
        <p>This report provides field-level intelligence for emergency responders operating within the designated El Niño event boundaries.</p>
      </div>

      <div class="rpt-section">
        <h2>Active Incidents (${activeInc})</h2>
        ${filteredIncidents.filter(i => i.status === 'Active').length > 0 ? `
        <table class="rpt-table">
          <thead><tr><th>Type</th><th>Country</th><th>City / Region</th><th>Severity</th><th>Casualties</th><th>Reporter</th><th>Notes</th></tr></thead>
          <tbody>
            ${filteredIncidents.filter(i => i.status === 'Active').map(i =>
              `<tr><td>${i.type}</td><td>${i.country}</td><td>${i.region}</td><td>${i.severity}</td><td>${i.casualties}</td><td>${i.reporter||'—'}</td><td>${i.notes||'—'}</td></tr>`
            ).join('')}
          </tbody>
        </table>` : '<p style="color:#999">No active incidents.</p>'}
      </div>

      <div class="rpt-section">
        <h2>Shelter Locations & Capacity</h2>
        ${filteredShelters.length > 0 ? `
        <table class="rpt-table">
          <thead><tr><th>Shelter</th><th>Country</th><th>City</th><th>Capacity</th><th>Occupancy</th><th>Contact</th></tr></thead>
          <tbody>
            ${filteredShelters.map(s =>
              `<tr><td>${s.name}</td><td>${s.country}</td><td>${s.city || '—'}</td><td>${s.capacity}</td><td>${s.occupancy}</td><td>${s.contact||'—'}</td></tr>`
            ).join('')}
          </tbody>
        </table>` : '<p style="color:#999">No shelters registered in this area.</p>'}
      </div>

      ${notes ? `<div class="rpt-section"><h2>Commander's Notes</h2><p>${notes}</p></div>` : ''}
    `;
  } else if (type === 'integration') {
    html += `
      <div class="rpt-section">
        <h2>Recommended Data Stack for Selected Scope: ${scopeTitle}</h2>
        <p>To implement live monitoring, forecasting, and historical climate analytics for El Niño dashboards, we recommend the following target data stack for dashboard integration:</p>
        <table class="rpt-table">
          <thead>
            <tr>
              <th>Data Layer</th>
              <th>Recommended Source</th>
              <th>Coverage & Type</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>Live Weather</strong></td><td>OpenWeatherMap + Open-Meteo</td><td>Current conditions & hourly parameters</td></tr>
            <tr><td><strong>7–16 Day Forecast</strong></td><td>Open-Meteo API</td><td>High resolution global model forecasts</td></tr>
            <tr><td><strong>Historical Weather</strong></td><td>Visual Crossing Weather API</td><td>Long-term historical climate records</td></tr>
            <tr><td><strong>El Niño / ENSO</strong></td><td>NOAA Climate.gov + Columbia IRI</td><td>Sea surface temp anomalies, ONI index</td></tr>
            <tr><td><strong>Climate Reanalysis</strong></td><td>Copernicus Climate Data Store (ERA5) + NASA POWER</td><td>ERA5 hourly dataset & solar parameters</td></tr>
            <tr><td><strong>Satellite Imagery</strong></td><td>NASA EarthData + Sentinel Hub</td><td>Atmospheric observations & satellite layers</td></tr>
            <tr><td><strong>Air Quality</strong></td><td>OpenAQ + WAQI</td><td>Global particulate and gas indices</td></tr>
            <tr><td><strong>Disaster Data</strong></td><td>EM-DAT + GDACS</td><td>Historical disasters & real-time global hazard alerts</td></tr>
            <tr><td><strong>Geographic Boundaries</strong></td><td>Natural Earth + GADM + GeoBoundaries</td><td>Administrative shapes and border paths</td></tr>
          </tbody>
        </table>
      </div>

      <div class="rpt-section" style="overflow-x:auto;">
        <h2>Global Weather API Evaluation</h2>
        <table class="rpt-table" style="font-size: 11px;">
          <thead>
            <tr>
              <th>API Website</th>
              <th>Coverage</th>
              <th>Live</th>
              <th>Forecast</th>
              <th>Historical</th>
              <th>Free Tier</th>
              <th>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>OpenWeatherMap API</strong></td><td>200+ countries</td><td>✅ Yes</td><td>✅ Yes</td><td>✅ Paid</td><td>✅ Yes</td><td>Current weather, forecasts, global alerts</td></tr>
            <tr><td><strong>Open-Meteo API</strong></td><td>Global</td><td>✅ Yes</td><td>✅ 16-Day</td><td>✅ Yes</td><td>✅ Yes</td><td>Free weather, archive and forecast API</td></tr>
            <tr><td><strong>Visual Crossing</strong></td><td>Global</td><td>✅ Yes</td><td>✅ Yes</td><td>✅ Yes</td><td>✅ Yes</td><td>Historical records, forecasts, and raw feeds</td></tr>
            <tr><td><strong>Tomorrow.io</strong></td><td>Global</td><td>✅ Yes</td><td>✅ Yes</td><td>⚠️ Limited</td><td>✅ Yes</td><td>Enterprise-quality climate intelligence</td></tr>
            <tr><td><strong>WeatherAPI.com</strong></td><td>Global</td><td>✅ Yes</td><td>✅ Yes</td><td>⚠️ Limited</td><td>✅ Yes</td><td>Quick integration, direct BI connector</td></tr>
            <tr><td><strong>Meteomatics API</strong></td><td>Global</td><td>✅ Yes</td><td>✅ Yes</td><td>✅ Yes</td><td>⚠️ Trial</td><td>High-resolution scientific grid data</td></tr>
            <tr><td><strong>AccuWeather APIs</strong></td><td>Global</td><td>✅ Yes</td><td>✅ Yes</td><td>⚠️ Limited</td><td>⚠️ Limited</td><td>Commercial products & consumer applications</td></tr>
            <tr><td><strong>Weatherbit API</strong></td><td>Global</td><td>✅ Yes</td><td>✅ Yes</td><td>✅ Yes</td><td>✅ Yes</td><td>Fast forecasts & historical queries</td></tr>
          </tbody>
        </table>
      </div>

      <div class="rpt-section">
        <h2>Global Climate, Satellite & Environmental Source Catalogue</h2>
        <table class="rpt-table" style="font-size: 11px;">
          <thead>
            <tr>
              <th>Category</th>
              <th>Data Source Website</th>
              <th>Parameters & Availability</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>Global Climate</strong></td><td>NOAA Climate.gov / NCEI</td><td>ENSO indices, Sea Surface Temp (SST) anomalies, climate observations</td></tr>
            <tr><td><strong>Climate Reanalysis</strong></td><td>Copernicus Climate Data Store</td><td>ERA5 weather reanalysis datasets, temperature, wind patterns</td></tr>
            <tr><td><strong>Solar & Energy</strong></td><td>NASA POWER API</td><td>Temperature, relative humidity, wind speed, solar radiation grids</td></tr>
            <tr><td><strong>Satellite Earth Observation</strong></td><td>NASA EarthData / Sentinel Hub</td><td>Atmospheric variables, remote sensing, satellite images</td></tr>
            <tr><td><strong>Air Quality Monitoring</strong></td><td>OpenAQ / WAQI Index</td><td>Real-time particulate matter (PM2.5, PM10) & gas monitoring</td></tr>
            <tr><td><strong>Disasters & Hazards</strong></td><td>EM-DAT / GDACS / ReliefWeb</td><td>Real-time hazard notifications, global disaster reports, damage estimates</td></tr>
            <tr><td><strong>Administrative Boundaries</strong></td><td>Natural Earth / GADM / GeoBoundaries</td><td>Administrative shapefiles and border boundaries for GIS modeling</td></tr>
          </tbody>
        </table>
      </div>

      <div class="rpt-section">
        <h2>Technical Implementation Plan for Tableau Dashboard</h2>
        <ol>
          <li><strong>Data Ingestion & Refreshing:</strong> Create an ETL pipeline using Python (Pandas/Requests) to pull current metrics from <strong>OpenWeatherMap / Open-Meteo</strong>. Save as a refreshed CSV or push to an SQL database (PostgreSQL/BigQuery).</li>
          <li><strong>Tableau Connector Options:</strong>
            <ul>
              <li><strong>Web Data Connector (WDC):</strong> Directly connect Tableau to the OpenWeatherMap or WAQI REST APIs.</li>
              <li><strong>Tableau Prep Flow:</strong> Automate queries to Visual Crossing and NOAA's ENSO FTP files to pre-aggregate historical temperature trends.</li>
            </ul>
          </li>
          <li><strong>Geographic Mapping:</strong> Join <strong>GADM country shapes</strong> with your live dashboard feed on Country Code to map risk index levels globally.</li>
        </ol>
      </div>

      ${notes ? `<div class="rpt-section"><h2>Integration Notes</h2><p>${notes}</p></div>` : ''}
    `;
  } else {
    // Public bulletin
    html += `
      <div class="rpt-section">
        <h2>⚠️ Public Safety Advisory</h2>
        <p><strong>EXTREME HEAT WARNING</strong> in effect for <strong>${scopeTitle}</strong>. Heat Wave El Niño is producing dangerous temperatures. All residents are urged to take immediate precautions.</p>
        <div class="rpt-stat-row">
          <div class="rpt-stat-box"><span class="val">${peakTemp}°C</span><span class="lbl">Max Temp Today</span></div>
          <div class="rpt-stat-box"><span class="val">${scopeCountries.length}</span><span class="lbl">Countries Affected</span></div>
          <div class="rpt-stat-box"><span class="val">${filteredShelters.length}</span><span class="lbl">Cooling Centers</span></div>
        </div>
      </div>

      <div class="rpt-section">
        <h2>🏥 Cooling Center Locations</h2>
        ${filteredShelters.length > 0 ? `
        <table class="rpt-table">
          <thead><tr><th>Name</th><th>Country</th><th>City</th><th>Availability</th><th>Contact</th></tr></thead>
          <tbody>
            ${filteredShelters.map(s => {
              const pct = Math.round(Number(s.occupancy)/Number(s.capacity)*100);
              const avail = pct < 60 ? '✅ Open' : pct < 90 ? '⚠️ Limited' : '❌ Full';
              return `<tr><td>${s.name}</td><td>${s.country}</td><td>${s.city || '—'}</td><td>${avail}</td><td>${s.contact||'—'}</td></tr>`;
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
        </ol>
      </div>
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
  const titles = { 
    executive: 'Executive Summary Report', 
    field: 'Field Operations Report', 
    public: 'Public Information Bulletin',
    integration: 'Data Stack Integration Plan'
  };
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

  if (APP.reportType === 'integration') {
    // ----------------------------------------------------
    // INTEGRATION REPORT PDF
    // ----------------------------------------------------
    checkPage(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 107, 53);
    doc.text('RECOMMENDED DATA STACK', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);

    const stack = [
      ['Live Weather', 'OpenWeatherMap + Open-Meteo'],
      ['Forecast (7-16 Days)', 'Open-Meteo API'],
      ['Historical Weather', 'Visual Crossing API'],
      ['El Niño / ENSO Index', 'NOAA Climate.gov + Columbia IRI'],
      ['Climate Reanalysis', 'Copernicus Climate Data Store (ERA5)'],
      ['Satellite Imagery', 'NASA EarthData + Sentinel Hub'],
      ['Air Quality Layer', 'OpenAQ + WAQI'],
      ['Global Disaster alerts', 'EM-DAT + GDACS'],
      ['Geographic Boundaries', 'Natural Earth + GADM']
    ];
    stack.forEach(([layer, source]) => {
      checkPage(6);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${layer}: `, margin + 4, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(source, margin + 48, yPos);
      yPos += 5.5;
    });

    yPos += 5;
    checkPage(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 107, 53);
    doc.text('WEATHER API COMPARISON SUMMARY', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);

    const weatherApis = [
      ['OpenWeatherMap', '200+ countries', 'Live/Forecast', 'Paid historical', 'Free Tier: Yes'],
      ['Open-Meteo API', 'Global coverage', 'Live/16-Day Forecast', 'Full Free archive', 'Free Tier: Yes'],
      ['Visual Crossing', 'Global coverage', 'Live/Forecast', 'Full history query', 'Free Tier: Yes'],
      ['Tomorrow.io', 'Global coverage', 'Live/Forecast', 'Limited history', 'Free Tier: Yes'],
      ['WeatherAPI.com', 'Global coverage', 'Live/Forecast', 'Limited history', 'Free Tier: Yes']
    ];
    weatherApis.forEach(([api, cov, query, hist, free]) => {
      checkPage(6);
      doc.text(`• ${api} (${cov}) — Data: ${query} | History: ${hist} | ${free}`, margin + 4, yPos);
      yPos += 5.5;
    });

    yPos += 5;
    checkPage(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 107, 53);
    doc.text('CLIMATE, OCEAN & DISASTER SOURCES', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);

    const climates = [
      ['NOAA Climate.gov', 'ENSO sea surface temperature anomalies & indices'],
      ['Copernicus ERA5', 'Hourly weather and climate reanalysis grids'],
      ['NASA POWER API', 'Solar radiation and high-altitude meteorological data'],
      ['OpenAQ / WAQI', 'Real-time global particulate matter & air pollution'],
      ['GDACS / EM-DAT', 'Real-time hazard notifications & global disaster history']
    ];
    climates.forEach(([source, desc]) => {
      checkPage(6);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${source}: `, margin + 4, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(desc, margin + 38, yPos);
      yPos += 5.5;
    });

    yPos += 5;
    checkPage(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 107, 53);
    doc.text('IMPLEMENTATION & TOOL RECOMMENDATIONS', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);

    const steps = [
      'Write ingestion script (Python/Requests) to fetch OpenWeatherMap or Open-Meteo current condition endpoints.',
      'Save refreshed JSON/CSV metrics to a server or cloud storage (e.g. S3, SQL DB) to enable live refreshes.',
      'Use Web Data Connector (WDC) or Tableau Prep to orchestrate periodic fetches and update Tableau dashboards.',
      'Join Natural Earth or GADM shapefiles on country name or boundary codes to build responsive heatmaps.'
    ];
    steps.forEach((step, idx) => {
      checkPage(10);
      const splitLines = doc.splitTextToSize(`${idx + 1}. ${step}`, pageW - margin * 2 - 8);
      doc.text(splitLines, margin + 4, yPos);
      yPos += splitLines.length * 4.5 + 2;
    });

    const notes = document.getElementById('rptNotes').value;
    if (notes) {
      yPos += 4;
      checkPage(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 107, 53);
      doc.text('INTEGRATION NOTES', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      const splitNotes = doc.splitTextToSize(notes, pageW - margin * 2);
      doc.text(splitNotes, margin + 4, yPos);
      yPos += splitNotes.length * 5 + 4;
    }

  } else {
    // ----------------------------------------------------
    // STANDARD REPORT PDF
    // ----------------------------------------------------
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
      doc.text(`• ${r.name}: ${r.temp || r.peakTemp}°C | Humidity: ${r.humidity}% | Pop: ${r.population} | Risk: ${(r.risk || r.riskLevel).toUpperCase()}`, margin + 4, yPos);
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
        doc.text(`• ${s.name} (${s.country || s.region}): ${s.occupancy}/${s.capacity} occupied (${pct}%) | Water: ${s.water} | Medical: ${s.medical}`, margin + 4, yPos);
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

  // Populate all country dropdowns first
  populateCountryDropdowns();
  initWorldTableFilters();

  chartDefaults();
  initTempChart();
  initHumidityChart();
  initHistoricalChart();
  initGlobalTempChart();

  renderRiskTable();
  updateWorldRiskStrip();
  renderIncidents();
  renderShelters();
  updateDashboardStats();

  initIncidentForm();
  initIncidentModal();
  initShelterForm();
  initReportGenerator();
  initIndiaModule();

  // Seed demo incidents with real country data
  if (APP.incidents.length === 0) {
    const demo = [
      { id:uuid(), type:'Heatstroke',     country:'India',        flag:'🇮🇳', continent:'Asia',     region:'Churu, Rajasthan',   severity:'Critical', casualties:8,  reporter:'SDRF Unit-3',     notes:'Mass heatstroke event at bus stand. 8 critical, 42 hospitalised.', status:'Active',    timestamp: new Date(Date.now()-3600000).toISOString() },
      { id:uuid(), type:'Power Outage',   country:'Iraq',         flag:'🇮🇶', continent:'M.East',   region:'Baghdad, Al-Karkh', severity:'Critical', casualties:0,  reporter:'MOE Baghdad',     notes:'Major substation failure. 280,000 households without power in 44°C heat.', status:'Active', timestamp: new Date(Date.now()-7200000).toISOString() },
      { id:uuid(), type:'Water Shortage', country:'Kuwait',       flag:'🇰🇼', continent:'M.East',   region:'Kuwait City Centre',severity:'High',     casualties:0,  reporter:'PAEW Kuwait',     notes:'Desalination plant operating at 60% capacity. Emergency rationing in place.', status:'Active', timestamp: new Date(Date.now()-14400000).toISOString() },
      { id:uuid(), type:'Wildfire',       country:'Spain',        flag:'🇪🇸', continent:'Europe',   region:'Extremadura, Badajoz',severity:'High',   casualties:2,  reporter:'BRIF Team 4',     notes:'Forest fire 1,200ha. 3 villages evacuated. Air tankers deployed.', status:'Active',    timestamp: new Date(Date.now()-10800000).toISOString() },
      { id:uuid(), type:'Mass Evacuation',country:'Australia',    flag:'🇦🇺', continent:'Oceania',  region:'Broken Hill, NSW',  severity:'Critical', casualties:0,  reporter:'NSW SES',         notes:'Mandatory evacuation of 4,200 residents. Peak temp 49°C.', status:'Active',    timestamp: new Date(Date.now()-1800000).toISOString() },
      { id:uuid(), type:'Heatstroke',     country:'Pakistan',     flag:'🇵🇰', continent:'Asia',     region:'Jacobabad, Sindh',  severity:'Critical', casualties:12, reporter:'PDMA Sindh',      notes:'12 deaths confirmed. 230 hospitalised. Makeshift cooling centres overwhelmed.', status:'Active', timestamp: new Date(Date.now()-5400000).toISOString() },
      { id:uuid(), type:'Infrastructure', country:'Egypt',        flag:'🇪🇬', continent:'Africa',   region:'Cairo, Giza District',severity:'High',   casualties:0,  reporter:'Ministry of Utilities',notes:'Road surface buckling on Ring Road. 6km stretch closed.', status:'Monitoring', timestamp: new Date(Date.now()-86400000).toISOString() },
      { id:uuid(), type:'Heatstroke',     country:'USA',          flag:'🇺🇸', continent:'Americas', region:'Phoenix, Arizona',  severity:'High',     casualties:4,  reporter:'Maricopa EMS',    notes:'4 fatalities reported. Cooling centers at 95% capacity.', status:'Monitoring', timestamp: new Date(Date.now()-43200000).toISOString() },
      { id:uuid(), type:'Drought',        country:'Morocco',      flag:'🇲🇦', continent:'Africa',   region:'Draa-Tafilalet Region',severity:'Moderate',casualties:0, reporter:'Water Authority',  notes:'Reservoir at 18% capacity. Crop failure estimated 40%. Emergency water airlifts.', status:'Monitoring', timestamp: new Date(Date.now()-172800000).toISOString() },
      { id:uuid(), type:'Power Outage',   country:'Greece',       flag:'🇬🇷', continent:'Europe',   region:'Athens, Attica',    severity:'Moderate', casualties:0,  reporter:'IPTO Athens',     notes:'Rolling blackouts 4-8pm daily. 2.1M affected.', status:'Resolved', timestamp: new Date(Date.now()-259200000).toISOString() },
    ];
    APP.incidents = demo;
    saveData();
    renderIncidents();
    updateDashboardStats();
  }

  // Seed demo shelters with real country data
  if (APP.shelters.length === 0) {
    const demoShelters = [
      { id:uuid(), name:'NDRF Cooling Camp — Churu',    country:'India',      flag:'🇮🇳', continent:'Asia',     city:'Churu, Rajasthan',    capacity:1200, occupancy:980,  water:'Adequate',  medical:'Present',  contact:'Col. Arjun Sharma +91-99001-12345', timestamp:new Date().toISOString() },
      { id:uuid(), name:'Al-Rasheed Relief Centre',     country:'Iraq',       flag:'🇮🇶', continent:'M.East',   city:'Baghdad',             capacity:800,  occupancy:760,  water:'Limited',   medical:'Present',  contact:'UNHCR Baghdad Office',             timestamp:new Date().toISOString() },
      { id:uuid(), name:'Phoenix Desert Respite Hub',   country:'USA',        flag:'🇺🇸', continent:'Americas', city:'Phoenix, Arizona',    capacity:2000, occupancy:1450, water:'Adequate',  medical:'Present',  contact:'Maricopa County EMS',              timestamp:new Date().toISOString() },
      { id:uuid(), name:'Riyadh Emergency Cool Zone',   country:'Saudi Arabia',flag:'🇸🇦',continent:'M.East',   city:'Riyadh',              capacity:1500, occupancy:890,  water:'Adequate',  medical:'Limited',  contact:'SCDF Riyadh +966-11-429-5555',     timestamp:new Date().toISOString() },
      { id:uuid(), name:'Madrid Cooling Network Hub',   country:'Spain',      flag:'🇪🇸', continent:'Europe',   city:'Madrid, Centro',      capacity:600,  occupancy:412,  water:'Adequate',  medical:'Present',  contact:'Cruz Roja Madrid',                 timestamp:new Date().toISOString() },
      { id:uuid(), name:'Broken Hill Emergency Camp',   country:'Australia',  flag:'🇦🇺', continent:'Oceania',  city:'Broken Hill, NSW',    capacity:900,  occupancy:720,  water:'Adequate',  medical:'Present',  contact:'NSW SES — 132 500',                timestamp:new Date().toISOString() },
    ];
    APP.shelters = demoShelters;
    saveData();
    renderShelters();
    updateDashboardStats();
  }
}

document.addEventListener('DOMContentLoaded', init);


