export function isAuth(){return !!localStorage.getItem('user');}
export function getUser(){try{return JSON.parse(localStorage.getItem('user'));}catch{ return null;}}
export function login(u){localStorage.setItem('user',JSON.stringify(u));}
export function logout(){localStorage.removeItem('user');} 