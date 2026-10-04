const places={'กรุงเทพมหานคร':[13.7563,100.5018],'ชลบุรี':[13.3611,100.9847],'ระยอง':[12.6814,101.2816],'เชียงใหม่':[18.7883,98.9853],'ขอนแก่น':[16.4322,102.8236],'ภูเก็ต':[7.8804,98.3923],'นครราชสีมา':[14.9799,102.0978],'สุราษฎร์ธานี':[9.1382,99.3217]};
const map=L.map('map').setView([13.5,101],6);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
const stations=L.layerGroup().addTo(map),rain=L.layerGroup(),risk=L.layerGroup();let currentMarker;
Object.entries(places).forEach(([name,p])=>{let m=L.circleMarker(p,{radius:5,color:'#8dd7ff',weight:2,fillColor:'#0b79d0',fillOpacity:1});m.bindTooltip(name);m.on('click',()=>load(name,p[0],p[1]));stations.addLayer(m)});
[['ชลบุรี',13.3611,100.9847],['ระยอง',12.6814,101.2816],['กรุงเทพมหานคร',13.7563,100.5018]].forEach(x=>risk.addLayer(L.circle([x[1],x[2]],{radius:30000,color:'#ff795d',fillColor:'#ff795d',fillOpacity:.08,weight:2}).bindTooltip('พื้นที่เฝ้าระวังตัวอย่าง')));
[[16.5,101.8],[13.3,101],[12.2,99.7],[17.2,99.4]].forEach(p=>rain.addLayer(L.circle(p,{radius:45000,color:'#27bdd7',fillColor:'#27bdd7',fillOpacity:.18,weight:0}).bindTooltip('ฝนตัวอย่าง — ยังไม่ใช่เรดาร์จริง')));
function icon(c){return c===0?'☀️':[1,2,3].includes(c)?'⛅':[95,96,99].includes(c)?'⛈️':'🌧️'}
function text(c){if(c===0)return'ท้องฟ้าแจ่มใส';if([1,2,3].includes(c))return'มีเมฆบางส่วน';if([45,48].includes(c))return'มีหมอก';if([51,53,55,56,57].includes(c))return'ฝนปรอย';if([61,63,65,66,67,80,81,82].includes(c))return'มีฝนตก';if([95,96,99].includes(c))return'ฝนฟ้าคะนอง';return'ไม่ทราบสภาพอากาศ'}
async function load(name,lat,lon){document.getElementById('place').textContent=name;map.setView([lat,lon],9);if(currentMarker)map.removeLayer(currentMarker);currentMarker=L.circleMarker([lat,lon],{radius:9,color:'#fff',weight:3,fillColor:'#1185e7',fillOpacity:1}).addTo(map);try{let u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&forecast_days=2&timezone=Asia%2FBangkok`;let d=await fetch(u).then(r=>r.json()),c=d.current;temp.textContent=Math.round(c.temperature_2m);hum.textContent=Math.round(c.relative_humidity_2m)+'%';wind.textContent=Math.round(c.wind_speed_10m)+' กม./ชม.';rain.textContent=Math.round(c.precipitation)+' มม.';condition.textContent=text(c.weather_code);icon.textContent=icon(c.weather_code);alert.textContent=c.precipitation>=10?'พบฝนค่อนข้างมาก ควรติดตามสถานการณ์':'ยังไม่พบฝนหนักจากข้อมูลพยากรณ์';risk.textContent=c.precipitation>=10?'เฝ้าระวัง':'ปกติ';let h=hours;h.innerHTML='';let now=Date.now(),s=d.hourly.time.findIndex(t=>new Date(t).getTime()>=now);if(s<0)s=0;for(let i=s;i<s+8;i++){let dt=new Date(d.hourly.time[i]);h.insertAdjacentHTML('beforeend',`<div class="hour"><small>${dt.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</small><strong>${Math.round(d.hourly.temperature_2m[i])}°</strong><em>ฝน ${d.hourly.precipitation_probability[i]||0}%</em></div>`)}updated.textContent=' • '+new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}); if(typeof addTimeline==='function') addTimeline('อัปเดตสภาพอากาศ',`${name} • ${text(c.weather_code)} • ${Math.round(c.temperature_2m)}°C`)}catch(e){condition.textContent='โหลดข้อมูลไม่สำเร็จ'; if(typeof addTimeline==='function') addTimeline('ข้อมูลอากาศขัดข้อง','ไม่สามารถโหลดข้อมูลได้')} }
const searchInput=document.getElementById('search');
const searchResults=document.getElementById('searchResults');
let searchTimer;
function closeSearch(){searchResults.style.display='none';searchResults.innerHTML=''}
function showSearchStatus(msg){searchResults.innerHTML=`<div class="search-status">${msg}</div>`;searchResults.style.display='block'}
function showResults(items){
  if(!items.length){showSearchStatus('ไม่พบสถานที่ในประเทศไทย ลองพิมพ์ชื่อจังหวัด/อำเภอใหม่');return}
  searchResults.innerHTML=items.map((x,i)=>{
    const label=x.name||'ไม่ทราบชื่อ';
    const detail=[x.admin2,x.admin1,x.country].filter(Boolean).join(' • ');
    return `<button class="search-result" data-i="${i}"><b>${label}</b><small>${detail}</small></button>`;
  }).join('');
  searchResults.style.display='block';
  searchResults.querySelectorAll('.search-result').forEach(btn=>btn.onclick=()=>{
    const x=items[Number(btn.dataset.i)];
    searchInput.value=[x.name,x.admin1].filter(Boolean).join(', ');
    closeSearch();
    load([x.name,x.admin1].filter(Boolean).join(', '),Number(x.latitude),Number(x.longitude));
  });
}
async function searchThailand(q){
  q=q.trim();
  if(!q){closeSearch();return}
  const local=Object.keys(places).filter(x=>x.includes(q)||q.includes(x)).map(x=>({name:x,latitude:places[x][0],longitude:places[x][1],admin1:'ประเทศไทย',country:'ประเทศไทย'}));
  if(local.length){showResults(local);return}
  showSearchStatus('กำลังค้นหาทั่วประเทศไทย...');
  try{
    const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=th&format=json&countryCode=TH`;
    const d=await fetch(url).then(r=>r.json());
    showResults((d.results||[]).filter(x=>x.country_code==='TH'));
  }catch(e){showSearchStatus('ค้นหาไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง')}
}
document.getElementById('searchBtn').onclick=()=>searchThailand(searchInput.value);
searchInput.addEventListener('keydown',e=>{if(e.key==='Enter')searchThailand(searchInput.value);if(e.key==='Escape')closeSearch()});
searchInput.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{if(searchInput.value.trim().length>=2)searchThailand(searchInput.value)},450)});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))closeSearch()});
plus.onclick=()=>map.zoomIn();minus.onclick=()=>map.zoomOut();home.onclick=()=>map.setView([13.5,101],6);
locate.onclick=()=>map.locate({setView:true,maxZoom:12});map.on('locationfound',e=>load('ตำแหน่งของฉัน',e.latlng.lat,e.latlng.lng));
stations.on?0:0;
document.getElementById('stations').onchange=e=>e.target.checked?map.addLayer(stations):map.removeLayer(stations);
document.getElementById('rainDemo').onchange=e=>e.target.checked?map.addLayer(rain):map.removeLayer(rain);
document.getElementById('riskDemo').onchange=e=>e.target.checked?map.addLayer(risk):map.removeLayer(risk);
document.querySelectorAll('.ready').forEach(x=>x.onchange=()=>{let a=[...document.querySelectorAll('.ready')];score.textContent=Math.round(a.filter(x=>x.checked).length/a.length*100)+'%'});
load('กรุงเทพมหานคร',13.7563,100.5018);
// V3: live-style timeline + family reporting/share
const timelineBox=document.getElementById('timeline');
const reportModal=document.getElementById('reportModal');
const reportName=document.getElementById('reportName');
const reportStatus=document.getElementById('reportStatus');
const reportNote=document.getElementById('reportNote');
function addTimeline(title,detail){
  if(!timelineBox)return;
  const t=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
  const el=document.createElement('div'); el.className='timeline-item';
  el.innerHTML=`<b>${title}</b><small>${t} • ${detail}</small>`;
  timelineBox.prepend(el);
  while(timelineBox.children.length>8)timelineBox.lastElementChild.remove();
}
function openReport(){reportModal.classList.remove('hidden');}
function closeReport(){reportModal.classList.add('hidden');}
function makeReport(){
  const name=reportName.value.trim()||'ผู้ใช้งาน';
  const place=document.getElementById('place')?.textContent||'ไม่ทราบพื้นที่';
  const temp=document.getElementById('temp')?.textContent||'--';
  const rainNow=document.getElementById('rain')?.textContent||'--';
  const status=reportStatus.value;
  const note=reportNote.value.trim();
  return `📍 TINE DISASTER WATCH
รายงานถึงทางบ้าน
ผู้รายงาน: ${name}
พื้นที่: ${place}
สถานะ: ${status}
อุณหภูมิ: ${temp}°C
ฝนปัจจุบัน: ${rainNow}
${note?`เพิ่มเติม: ${note}
`:''}เวลา: ${new Date().toLocaleString('th-TH')}

หมายเหตุ: รายงานนี้สร้างจากข้อมูลสภาพอากาศและตำแหน่งที่ผู้ใช้เลือก ไม่ใช่คำเตือนภัยฉุกเฉิน`;
}
async function shareReport(){
 const text=makeReport();
 if(navigator.share){try{await navigator.share({title:'รายงานถึงทางบ้าน - TINE DISASTER WATCH',text});addTimeline('ส่งรายงานถึงทางบ้าน','ผู้ใช้กดแชร์รายงาน');return}catch(e){}}
 try{await navigator.clipboard.writeText(text);alert('คัดลอกรายงานแล้ว สามารถนำไปส่งใน LINE หรือแชตครอบครัวได้');}catch(e){alert(text)}
}
function lineReport(){const text=encodeURIComponent(makeReport());window.open(`https://line.me/R/msg/text/?${text}`,'_blank');addTimeline('เตรียมรายงานผ่าน LINE','เปิดหน้าส่งข้อความ');}
document.getElementById('familyBtn')?.addEventListener('click',openReport);
document.getElementById('shareFamily')?.addEventListener('click',openReport);
document.getElementById('closeModal')?.addEventListener('click',closeReport);
document.getElementById('shareNow')?.addEventListener('click',shareReport);
document.getElementById('lineNow')?.addEventListener('click',lineReport);
document.getElementById('copyReport')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(makeReport());alert('คัดลอกรายงานแล้ว');addTimeline('คัดลอกรายงาน','พร้อมส่งให้ครอบครัว');}catch(e){alert(makeReport())}});
document.getElementById('lineShare')?.addEventListener('click',lineReport);
document.getElementById('timelineBtn')?.addEventListener('click',()=>document.querySelector('.timeline-card')?.scrollIntoView({behavior:'smooth'}));
addTimeline('ระบบเริ่มทำงาน','แผนที่ออนไลน์');
addTimeline('กำลังตรวจสอบอากาศ','รอข้อมูลพื้นที่ปัจจุบัน');
