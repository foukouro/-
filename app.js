const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const list = document.getElementById('notes-list');
const notifyBtn = document.getElementById('notify-btn');

function getNotes(){return JSON.parse(localStorage.getItem('notes')||'[]');}
function saveNotes(n){localStorage.setItem('notes',JSON.stringify(n));}

function render(){
 const notes=getNotes();
 list.innerHTML='';

 notes.forEach((n,i)=>{
  const li=document.createElement('li');

  li.innerHTML = `
    <span>${n}</span>
    <button class="delete-btn" onclick="del(${i})">✖️</button>
  `;

  list.appendChild(li);
 });
}


function del(i){
 const notes=getNotes();
 notes.splice(i,1);
 saveNotes(notes);
 render();
}

form.addEventListener('submit',e=>{
 e.preventDefault();
 const text=input.value.trim();
 if(text){
  const notes=getNotes();
  notes.push(text);
  saveNotes(notes);
  input.value='';
  render();

  showNotification("Новая заметка", text);
 }
});

render();

// Notifications
notifyBtn.addEventListener('click', async ()=>{
 const permission = await Notification.requestPermission();
 if(permission === 'granted'){
   alert('Уведомления разрешены');
 }
});

function showNotification(title, body){
 if(Notification.permission === 'granted'){
   navigator.serviceWorker.getRegistration().then(reg=>{
     if(reg){
       reg.showNotification(title,{
         body: body,
         icon: 'icons/icon-128x128.png'
       });
     }
   });
 }
}

// SW
if('serviceWorker' in navigator){
 window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
}
