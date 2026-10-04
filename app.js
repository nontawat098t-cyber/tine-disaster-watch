const $ = (id) => document.getElementById(id);
const locationSelect = $('location-select');
let map;
let locationMarker;
let activeCoords = { lat: 13.7563, lon: 100.5018, label: 'กรุงเทพมหานคร' };

function updateClock() {
  const now = new Date();
  $('clock').textContent = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  $('today-date').textContent = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
}
setInterval(updateClock, 1000); updateClock();

function initMap() {
  map = L.map('map', { scrollWheelZoom: false }).setView([activeCoords.lat, activeCoords.lon], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
  }).addTo(map);
  locationMarker = L.circleMarker([activeCoords.lat, activeCoords.lon], { radius: 9, color: '#ffb86b', weight: 3, fillColor: '#ffb86b', fillOpacity: 0.8 }).addTo(map)
    .bindPopup('<strong>จุดพยากรณ์อากาศ</strong><br>ตำแหน่งอ้างอิงที่เลือก');
  setTimeout(() => map.invalidateSize(), 150);
}

function weatherEmoji(code) {
  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if (code === 3) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '🌨️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌡️';
}
function weatherDescription(code) {
  if (code === 0) return 'ท้องฟ้าแจ่มใส';
  if ([1, 2].includes(code)) return 'มีเมฆบางส่วน';
  if (code === 3) return 'มีเมฆมาก';
  if ([45, 48].includes(code)) return 'มีหมอก';
  if ([51, 53, 55, 56, 57].includes(code)) return 'ฝนละออง';
  if ([61, 63, 65, 66, 67].includes(code)) return 'ฝนตก';
  if ([80, 81, 82].includes(code)) return 'ฝนตกเป็นช่วง';
  if ([95, 96, 99].includes(code)) return 'พายุฝนฟ้าคะนอง';
  return 'สภาพอากาศเปลี่ยนแปลง';
}
function formatHour(iso) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}
function formatNum(value, digits = 0) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '--';
}

async function loadWeather() {
  const parts = locationSelect.value.split(',');
  const lat = Number(parts[0]); const lon = Number(parts[1]); const label = parts[3] || parts[2];
  activeCoords = { lat, lon, label };
  $('connection-status').textContent = 'กำลังดึงพยากรณ์อากาศ…';
  $('refresh-weather').disabled = true;
  $('refresh-weather').textContent = 'กำลังอัปเดต…';
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: lat, longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,precipitation_probability,precipitation,rain,weather_code,wind_speed_10m',
      forecast_days: '2', timezone: 'Asia/Bangkok'
    }).toString();
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Weather API returned ' + response.status);
    const data = await response.json();
    if (!data.current || !data.hourly) throw new Error('ข้อมูลอากาศไม่ครบถ้วน');
    renderCurrent(data.current);
    renderForecast(data.hourly);
    $('connection-status').textContent = 'เชื่อมต่อข้อมูลพยากรณ์แล้ว';
    $('connection-status').previousElementSibling.style.background = 'var(--green)';
    if (map && locationMarker) {
      map.setView([lat, lon], 8);
      locationMarker.setLatLng([lat, lon]);
      locationMarker.setPopupContent(`<strong>${label}</strong><br>จุดพยากรณ์อากาศที่เลือก`);
    }
  } catch (error) {
    console.error(error);
    $('connection-status').textContent = 'ไม่สามารถโหลดข้อมูลได้';
    $('forecast-list').innerHTML = '<div class="loading-line">โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วกด “อัปเดตข้อมูล” อีกครั้ง</div>';
    $('rain-chart').innerHTML = '<div class="loading-line">ไม่มีข้อมูลสำหรับสร้างกราฟ</div>';
  } finally {
    $('refresh-weather').disabled = false;
    $('refresh-weather').innerHTML = '<span aria-hidden="true">↻</span> อัปเดตข้อมูล';
  }
}
function renderCurrent(current) {
  $('temperature').innerHTML = `${formatNum(current.temperature_2m)}<small>°C</small>`;
  $('feels-like').textContent = `รู้สึกเหมือน ${formatNum(current.apparent_temperature)}°C · ${weatherDescription(current.weather_code)}`;
  $('rain-now').innerHTML = `${formatNum(current.precipitation, 1)}<small> mm</small>`;
  $('humidity').innerHTML = `${formatNum(current.relative_humidity_2m)}<small>%</small>`;
  $('wind-speed').innerHTML = `${formatNum(current.wind_speed_10m)}<small> km/h</small>`;
  $('wind-direction').textContent = `ทิศทางลม ${formatNum(current.wind_direction_10m)}°`;
}
function renderForecast(hourly) {
  const now = Date.now();
  let start = hourly.time.findIndex(t => new Date(t).getTime() >= now - 60 * 60 * 1000);
  if (start < 0) start = 0;
  const end = Math.min(start + 24, hourly.time.length);
  const rows = [];
  for (let i = start; i < end; i++) {
    rows.push(`<div class="forecast-row"><span class="forecast-time">${formatHour(hourly.time[i])}</span><span class="weather-symbol">${weatherEmoji(hourly.weather_code[i])}</span><span class="forecast-temp">${formatNum(hourly.temperature_2m[i])}°C</span><span class="forecast-rain">💧 ${formatNum(hourly.precipitation_probability?.[i] ?? 0)}%</span><span class="forecast-wind">${formatNum(hourly.wind_speed_10m[i])} km/h</span></div>`);
  }
  $('forecast-list').innerHTML = rows.join('');
  $('forecast-date').textContent = `${rows.length} ชั่วโมงถัดไป`;
  renderRainChart(hourly, start, end);
}
function renderRainChart(hourly, start, end) {
  const values = hourly.precipitation.slice(start, Math.min(start + 12, end));
  const times = hourly.time.slice(start, Math.min(start + 12, end));
  const max = Math.max(...values, 1);
  $('rain-chart').innerHTML = values.map((value, i) => {
    const height = Math.max(3, Math.min(100, (value / max) * 100));
    const showLabel = i % 2 === 0;
    return `<div class="rain-bar-wrap" title="${formatHour(times[i])}: ${formatNum(value, 1)} มม."><div class="rain-bar" style="height:${height}%" aria-label="${formatNum(value, 1)} มิลลิเมตร"></div><span>${showLabel ? formatHour(times[i]) : ''}</span></div>`;
  }).join('');
}

$('refresh-weather').addEventListener('click', loadWeather);
locationSelect.addEventListener('change', loadWeather);
document.querySelectorAll('#checklist input[type="checkbox"]').forEach(input => input.addEventListener('change', () => {
  const all = [...document.querySelectorAll('#checklist input[type="checkbox"]')];
  const checked = all.filter(item => item.checked).length;
  $('check-count').textContent = `${checked}/${all.length}`;
}));
initMap();
loadWeather();
