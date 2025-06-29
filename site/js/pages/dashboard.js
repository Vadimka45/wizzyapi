import { api } from '../api.js';
import { getUser, logout } from '../auth.js';
import { toast } from '../ui/toast.js';

const statusEl=document.getElementById('statusText');
const profileBtn=document.getElementById('profileBtn');
const user=getUser();
profileBtn.textContent=user?.avatar||'👤';

async function update(){
 try{
  const s=await api.getUserStatus();
  statusEl.textContent=`${s.status.toUpperCase()} / Session: ${s.session_alive?'ON':'OFF'}`;
  statusCardHover();
 }catch(e){statusEl.textContent='Ошибка API';toast.error('API недоступно');}
}
update();setInterval(update,5000);

function statusCardHover(){
  const card=document.getElementById('statusCard');
  card.onmousemove=e=>{const r=card.getBoundingClientRect();card.style.setProperty('--x',e.clientX-r.left+'px');card.style.setProperty('--y',e.clientY-r.top+'px');};
} 