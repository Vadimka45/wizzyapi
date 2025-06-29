class ToastManager{
 constructor(){this.box=document.getElementById('toastContainer')||this._init();}
 _init(){const div=document.createElement('div');div.id='toastContainer';document.body.appendChild(div);return div;}
 show(msg,type='info'){const t=document.createElement('div');t.className=`toast ${type}`;t.textContent=msg;this.box.appendChild(t);setTimeout(()=>t.remove(),4000);}
 success(m){this.show(m,'success');}
 error(m){this.show(m,'error');}
}
export const toast=new ToastManager(); 