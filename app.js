// TINE DISASTER WATCH V4 — frontend prototype.
// Reports are saved locally in this browser until a shared database is configured.
// Do not present citizen reports as official warnings.
const $ = id => document.getElementById(id);
const map = L.map('map').setView([15.2,101.0],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(map);
const reportLayer=L.layerGroup().addTo(map), weatherLayer=L.layerGroup().addTo(map), riskLayer=L.layerGroup();
let picking=false, pendingLatLng=null, currentPlace={name:'กรุงเทพมหานคร',lat:13.7563,lon:100.5018};
const sampleReports=[];
let reports=loadLocalReports();
const severityInfo={red:{label:'รุนแรง / ต้องการความช่วยเหลือ',color:'#ff4545',tag:'tag-red'},orange:{label:'ปานกลาง / ผ่านลำบาก',color:'#ff8c36',tag:'tag-orange'},yellow:{label:'เล็กน้อย / เฝ้าระวัง',color:'#f5d443',tag:'tag-yellow'},green:{label:'คลี่คลายแล้ว',color:'#24c98a',tag:'tag-green'}};
const typeLabels={flood:'น้ำท่วม',landslide:'ดินถล่ม',storm:'ลมพายุ',road:'ถนนผ่านไม่ได้',other:'เหตุอื่น ๆ'};
function loadLocalReports(){try{return JSON.parse(localStorage.getItem('tine-disaster-reports')||'[]')}catch(e){return []}}
function saveLocalReports(){localStorage.setItem('tine-disaster-reports',JSON.stringify(reports))}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmtTime(v){return new Date(v).toLocaleString('th-TH',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
function renderReports(){
 reportLayer.clearLayers();
 reports.forEach(r=>{
  if(Number.isFinite(r.lat)&&Number.isFinite(r.lon)){
   const info=severityInfo[r.severity]||severityInfo.yellow;
   const marker=L.circleMarker([r.lat,r.lon],{radius:r.severity==='red'?10:8,color:'#fff',weight:2,fillColor:info.color,fillOpacity:.95});
   marker.bindPopup(`<b>${safe(typeLabels[r.type]||'เหตุการณ์')}</b><br><span style="color:${info.color}">${safe(info.label)}</span><br>${safe(r.location)}<br><small>รายงาน ${fmtTime(r.createdAt)} · ${safe(r.source||'ประชาชน')}</small><br>${safe(r.details||'ไม่มีรายละเอียด')}<br><button onclick="window.openReportDetail('${r.id}')">ดูรายละเอียด</button>`);
   marker.addTo(reportLayer);
  }
 });
 const count={red:0,orange:0,yellow:0,green:0}; reports.forEach(r=>count[r.severity]=(count[r.severity]||0)+1);
 $('reportCount').textContent=reports.length+' รายงาน'; $('redCount').textContent=count.red;$('orangeCount').textContent=count.orange;$('yellowCount').textContent=count.yellow;
 const recent=$('recentReports');recent.innerHTML='';
 if(!reports.length){recent.innerHTML='<p class="hint">ยังไม่มีรายงานในอุปกรณ์นี้ รายงานตัวอย่างจะไม่ถูกสร้างขึ้นเอง</p>';return}
 [...reports].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5).forEach(r=>{
  const info=severityInfo[r.severity]||severityInfo.yellow,div=document.createElement('div');div.className='recent-item';
  div.innerHTML=`<b><span class="severity-tag ${info.tag}">${safe(info.label)}</span>${safe(typeLabels[r.type]||'เหตุการณ์')}</b><small>📍 ${safe(r.location)} · ${fmtTime(r.createdAt)}</small>`;
  div.onclick=()=>{if(Number.isFinite(r.lat)&&Number.isFinite(r.lon))map.setView([r.lat,r.lon],13);showDetail(r.id)};recent.appendChild(div);
 });
}
window.openReportDetail=showDetail;
function showDetail(id){
 const r=reports.find(x=>x.id===id);if(!r)return;
 const info=severityInfo[r.severity]||severityInfo.yellow;
 $('detailContent').innerHTML=`<p><span class="severity-tag ${info.tag}">${safe(info.label)}</span> <b>${safe(typeLabels[r.type]||'เหตุการณ์')}</b></p><p><b>พื้นที่:</b> ${safe(r.location)}</p><p><b>เวลา:</b> ${fmtTime(r.createdAt)}</p><p><b>รายละเอียด:</b><br>${safe(r.details||'ไม่มีรายละเอียด')}</p><p><b>ผู้รายงาน:</b> ${safe(r.reporterName||'ไม่ระบุชื่อ')}</p><p><b>สถานะแหล่งข้อมูล:</b> <span class="severity-tag tag-yellow">รายงานจากประชาชน · ยังไม่ยืนยัน</span></p>${Number.isFinite(r.lat)&&Number.isFinite(r.lon)?'<p>พิกัดแสดงบนแผนที่แล้ว</p>':''}<button class="outline" id="shareReport">แชร์รายงาน</button> <button class="outline" id="copyReport">คัดลอกข้อความ</button><p class="hint">เวอร์ชันนี้บันทึกรายงานไว้ในเบราว์เซอร์นี้เท่านั้น การแชร์ให้ทุกคนเห็นต้องเชื่อมฐานข้อมูลกลาง</p>`;
 $('detailModal').classList.remove('hidden');
 const msg=`TINE DISASTER WATCH — รายงานจากประชาชน\\n${typeLabels[r.type]}: ${info.label}\\nพื้นที่: ${r.location}\\nเวลา: ${fmtTime(r.createdAt)}\\nรายละเอียด: ${r.details||'-'}\\nสถานะ: ยังไม่ยืนยัน`;
 $('shareReport').onclick=async()=>{if(navigator.share){try{await navigator.share({title:'รายงานภัยพิบัติ',text:msg})}catch(e){}}else copyText(msg)};
 $('copyReport').onclick=()=>copyText(msg);
}
function copyText(t){if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>alert('คัดลอกข้อความแล้ว')).catch(()=>prompt('คัดลอกข้อความนี้',t));else prompt('คัดลอกข้อความนี้',t)}
function openReport(){ $('reportModal').classList.remove('hidden'); $('reportMessage').classList.add('hidden'); }
$('openReport').onclick=openReport;$('closeReport').onclick=()=>{$('reportModal').classList.add('hidden');picking=false;map.getContainer().classList.remove('pick-mode')};$('closeDetail').onclick=()=> $('detailModal').classList.add('hidden');
$('pickLocation').onclick=()=>{picking=true;pendingLatLng=null;map.getContainer().classList.add('pick-mode');$('reportModal').classList.add('hidden');alert('คลิกจุดบนแผนที่เพื่อเลือกพิกัด แล้วเปิดแบบฟอร์มแจ้งเหตุอีกครั้ง')};
map.on('click',e=>{if(!picking)return;picking=false;pendingLatLng=e.latlng;$('reportLat').value=e.latlng.lat.toFixed(5);$('reportLon').value=e.latlng.lng.toFixed(5);map.getContainer().classList.remove('pick-mode');$('reportModal').classList.remove('hidden');});
$('reportForm').addEventListener('submit',e=>{
 e.preventDefault();
 const lat=$('reportLat').value.trim()===''?null:Number($('reportLat').value),lon=$('reportLon').value.trim()===''?null:Number($('reportLon').value);
 const r={id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),type:$('incidentType').value,severity:$('severity').value,location:$('reportLocation').value.trim(),lat:Number.isFinite(lat)?lat:null,lon:Number.isFinite(lon)?lon:null,details:$('reportDetails').value.trim(),reporterName:$('reporterName').value.trim(),createdAt:new Date().toISOString(),source:'รายงานจากประชาชน',verification:'unverified'};
 reports.push(r);saveLocalReports();renderReports();
 $('reportMessage').classList.remove('hidden');$('reportMessage').innerHTML='บันทึกรายงานในเบราว์เซอร์นี้แล้ว และแสดงบนแผนที่หากมีพิกัด <b>ขณะนี้ยังไม่เผยแพร่ให้ผู้ใช้อื่นเห็น</b> เพราะยังไม่ได้เชื่อมฐานข้อมูลกลาง';
 $('reportForm').reset();$('reportModal').classList.remove('hidden');
});
$('showReports').onchange=e=>e.target.checked?map.addLayer(reportLayer):map.removeLayer(reportLayer);
$('showWeather').onchange=e=>e.target.checked?map.addLayer(weatherLayer):map.removeLayer(weatherLayer);
$('showRisk').onchange=e=>e.target.checked?map.addLayer(riskLayer):map.removeLayer(riskLayer);
$('zoomIn').onclick=()=>map.zoomIn();$('zoomOut').onclick=()=>map.zoomOut();$('resetMap').onclick=()=>map.setView([15.2,101],6);
$('locateBtn').onclick=()=>map.locate({setView:true,maxZoom:12});
map.on('locationfound',e=>{L.circleMarker(e.latlng,{radius:7,color:'#fff',weight:2,fillColor:'#147fe0',fillOpacity:1}).addTo(weatherLayer).bindTooltip('ตำแหน่งของคุณ');map.setView(e.latlng,12)});
map.on('locationerror',()=>alert('ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาต Location ในเบราว์เซอร์'));
$('viewTimeline').onclick=()=>showTimeline();document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(b.dataset.view==='report')openReport();else if(b.dataset.view==='timeline')showTimeline();else if(b.dataset.view==='help')alert('ขั้นต่อไปจะเชื่อมฐานข้อมูลจุดพักพิง โรงพยาบาล และหน่วยกู้ภัยที่ตรวจสอบได้');else if(b.dataset.view==='safety')alert('ใช้รายงานภัยพิบัติสาธารณะโดยไม่เปิดเผยที่อยู่บ้านหรือข้อมูลส่วนตัว');else if(b.dataset.view==='weather')map.setView([currentPlace.lat,currentPlace.lon],8);else map.invalidateSize()});
function showTimeline(){const sorted=[...reports].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));let msg=sorted.length?sorted.map(r=>`${fmtTime(r.createdAt)} · ${typeLabels[r.type]} · ${severityInfo[r.severity].label} · ${r.location}`).join('\\n'):'ยังไม่มีรายงานในอุปกรณ์นี้';alert('ไทม์ไลน์รายงานล่าสุด\\n\\n'+msg)}
$('searchBtn').onclick=searchPlace;$('placeSearch').addEventListener('keydown',e=>{if(e.key==='Enter')searchPlace()});
async function searchPlace(){
 const q=$('placeSearch').value.trim();if(!q)return;
 const box=$('searchResults');box.innerHTML='<div class="search-result">กำลังค้นหา...</div>';box.classList.remove('hidden');
 try{
  const u='https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=10&language=th&format=json';
  const d=await fetch(u).then(r=>r.json());const results=(d.results||[]).filter(x=>x.country_code==='TH');
  box.innerHTML='';
  if(!results.length){box.innerHTML='<div class="search-result">ไม่พบพื้นที่ในผลการค้นหา ลองใช้ชื่อภาษาไทยหรืออังกฤษ</div>';return}
  results.forEach(p=>{const div=document.createElement('div');div.className='search-result';div.textContent=[p.name,p.admin2,p.admin1,'ประเทศไทย'].filter(Boolean).join(' · ');div.onclick=()=>{currentPlace={name:p.name,lat:p.latitude,lon:p.longitude};map.setView([p.latitude,p.longitude],11);$('weatherPlace').textContent=p.name;loadWeather(p.name,p.latitude,p.longitude);box.classList.add('hidden');};box.appendChild(div)});
 }catch(e){box.innerHTML='<div class="search-result">ค้นหาไม่สำเร็จ โปรดลองใหม่</div>'}
}
async function loadWeather(name,lat,lon){
 try{
  const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability&forecast_days=2&timezone=Asia%2FBangkok`;
  const d=await fetch(u).then(r=>r.json()),c=d.current;$('temp').textContent=Math.round(c.temperature_2m);$('humidity').textContent=Math.round(c.relative_humidity_2m)+'%';$('wind').textContent=Math.round(c.wind_speed_10m)+' กม./ชม.';$('rain').textContent=Number(c.precipitation).toFixed(1)+' มม.';$('weatherText').textContent=weatherText(c.weather_code);$('weatherIcon').textContent=weatherIcon(c.weather_code);$('topAlert').textContent=c.precipitation>=10?'ข้อมูลพยากรณ์แสดงฝนค่อนข้างมาก โปรดติดตามประกาศทางการ':'ข้อมูลพยากรณ์ปัจจุบันยังไม่แสดงฝนหนัก ณ จุดที่เลือก';$('updatedAt').textContent=' · อัปเดต '+new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
  $('hourly').innerHTML='';let start=d.hourly.time.findIndex(t=>new Date(t)>=new Date());if(start<0)start=0;for(let i=start;i<Math.min(start+8,d.hourly.time.length);i++){const tm=new Date(d.hourly.time[i]);$('hourly').insertAdjacentHTML('beforeend',`<div class="hour"><small>${tm.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</small><b>${Math.round(d.hourly.temperature_2m[i])}°</b><em>ฝน ${d.hourly.precipitation_probability[i]||0}%</em></div>`)}
 }catch(e){$('weatherText').textContent='โหลดข้อมูลอากาศไม่สำเร็จ';$('topAlert').textContent='ตรวจสอบอินเทอร์เน็ตหรือแหล่งข้อมูล'}
}
function weatherText(c){if(c===0)return'ท้องฟ้าแจ่มใส';if([1,2,3].includes(c))return'มีเมฆบางส่วน';if([45,48].includes(c))return'มีหมอก';if([51,53,55,56,57].includes(c))return'ฝนปรอย';if([61,63,65,66,67,80,81,82].includes(c))return'มีฝนตก';if([95,96,99].includes(c))return'ฝนฟ้าคะนอง';return'ไม่ทราบสภาพอากาศ'}
function weatherIcon(c){if(c===0)return'☀️';if([1,2,3].includes(c))return'⛅';if([95,96,99].includes(c))return'⛈️';return'🌧️'}
renderReports();loadWeather('กรุงเทพมหานคร',13.7563,100.5018);
