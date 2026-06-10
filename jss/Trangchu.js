// Redirect nếu đã đăng nhập
const s=Auth.getUser();
if(s) location.href=s.role==='admin'?'admin-dashboard.html':'user-dashboard.html';
function switchToReg(){ localStorage.setItem('auth_tab','register'); }
// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});
  });
});