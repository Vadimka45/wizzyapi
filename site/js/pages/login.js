import { api } from '../api.js';
import { login } from '../auth.js';
import { toast } from '../ui/toast.js';

const form=document.getElementById('loginForm');
const errorEl=document.getElementById('loginError');
form.addEventListener('submit',async e=>{
 e.preventDefault();
 const username=form.username.value.trim();
 const password=form.password.value.trim();
 errorEl.textContent = '';
 try{
   const res=await api.login(username,password);
   if(res.success){
     login(res.user);
     location.href='/';
   }else if(res.error){
     if(res.error==='banned') errorEl.textContent = 'Ваш аккаунт заблокирован.';
     else if(res.error.includes('Неверное имя пользователя')) errorEl.textContent = 'Пользователь не найден.';
     else if(res.error.includes('пароль')) errorEl.textContent = 'Неверный пароль.';
     else errorEl.textContent = res.error;
   }else{
     errorEl.textContent = 'Неизвестная ошибка.';
   }
 }catch(err){
   errorEl.textContent = err.message || 'Ошибка входа.';
 }
}); 