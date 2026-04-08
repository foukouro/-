const form = document.getElementById('note-form');
const input = document.getElementById('note-input');
const scheduleInput = document.getElementById('schedule-input');
const list = document.getElementById('notes-list');
const notifyBtn = document.getElementById('notify-btn');
let swRegistration = null;

function toLocalDatetimeValue(date) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

if (scheduleInput) {
  scheduleInput.min = toLocalDatetimeValue(new Date());
}

// Проверка поддержки при загрузке
window.addEventListener('load', () => {
  console.log('=== Страница загружена ===');
  console.log('Поддержка уведомлений:', 'Notification' in window);
  console.log('Статус разрешения:', Notification.permission);
  console.log('Поддержка Service Worker:', 'serviceWorker' in navigator);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', {
      scope: '/'
    }).then(registration => {
      swRegistration = registration;
      console.log('✅ Service Worker зарегистрирован:', swRegistration);
    }).catch(err => {
      console.warn('❌ Ошибка регистрации Service Worker:', err);
      console.log('Будут использоваться прямые уведомления');
    });
  });
}

function getNotes() { 
  return JSON.parse(localStorage.getItem('notes') || '[]'); 
}

function saveNotes(n) { 
  localStorage.setItem('notes', JSON.stringify(n)); 
}

function getScheduled() { 
  return JSON.parse(localStorage.getItem('scheduled') || '[]'); 
}

function saveScheduled(n) { 
  localStorage.setItem('scheduled', JSON.stringify(n)); 
}

function render() {
  const notes = getNotes();
  list.innerHTML = '';

  notes.forEach((n, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${n}</span>
      <button class="delete-btn" onclick="del(${i})">✖️</button>
    `;
    list.appendChild(li);
  });
}

function scheduleNotification(text, timestamp) {
  const when = timestamp;
  const items = getScheduled();
  items.push({ text, when });
  saveScheduled(items);

  const delay = when - Date.now();
  if (delay <= 0) {
    showNotification('Напоминание', text);
    removeScheduledItem(when, text);
    return;
  }

  setTimeout(() => {
    showNotification('Напоминание', text);
    removeScheduledItem(when, text);
  }, delay);
}

function removeScheduledItem(when, text) {
  const items = getScheduled().filter(item => item.when !== when || item.text !== text);
  saveScheduled(items);
}

function resumeScheduledNotifications() {
  const items = getScheduled();
  const now = Date.now();
  items.forEach(item => {
    const delay = item.when - now;
    if (delay <= 0) {
      showNotification('Напоминание', item.text);
      removeScheduledItem(item.when, item.text);
    } else {
      setTimeout(() => {
        showNotification('Напоминание', item.text);
        removeScheduledItem(item.when, item.text);
      }, delay);
    }
  });
}

function del(i) {
  const notes = getNotes();
  notes.splice(i, 1);
  saveNotes(notes);
  render();
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('Ваш браузер не поддерживает уведомления.');
    return 'denied';
  }
  
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  
  return Notification.permission;
}

form.addEventListener('submit', async e => {
  e.preventDefault();

  const text = input.value.trim();
  const scheduleValue = scheduleInput.value;
  
  if (!text) {
    return;
  }
  
  console.log('📝 Отправка формы с текстом:', text);
  
  // Проверяем и запрашиваем разрешение
  let permission = Notification.permission;
  console.log('Текущий статус разрешения:', permission);
  
  if (permission === 'default') {
    console.log('Запрашиваем разрешение...');
    permission = await Notification.requestPermission();
    console.log('Новый статус разрешения:', permission);
  }
  
  updateNotifyButton();
  
  if (permission !== 'granted') {
    alert('Уведомления не разрешены. Разрешите уведомления в браузере.');
    return;
  }
  
  // Сохраняем заметку
  const notes = getNotes();
  notes.push(text);
  saveNotes(notes);
  input.value = '';
  render();

  // Показываем уведомление
  if (scheduleValue) {
    const scheduledTime = new Date(scheduleValue).getTime();
    if (isNaN(scheduledTime)) {
      alert('Неверный формат даты и времени.');
      return;
    }
    
    const now = Date.now();
    if (scheduledTime <= now + 1000) {
      console.log('🔔 Отправка немедленного уведомления');
      showNotification('Новая заметка', text);
    } else {
      console.log('⏰ Планирование уведомления на:', new Date(scheduledTime));
      scheduleNotification(text, scheduledTime);
      const dateString = new Date(scheduledTime).toLocaleString();
      alert(`Уведомление запланировано на ${dateString}`);
    }
    scheduleInput.value = '';
  } else {
    console.log('🔔 Отправка немедленного уведомления (без расписания)');
    showNotification('Новая заметка', text);
  }
});

function updateNotifyButton() {
  if (!('Notification' in window)) {
    notifyBtn.textContent = 'Уведомления недоступны';
    notifyBtn.disabled = true;
    return;
  }
  
  if (Notification.permission === 'granted') {
    notifyBtn.textContent = '✅ Уведомления включены';
  } else if (Notification.permission === 'denied') {
    notifyBtn.textContent = '❌ Уведомления заблокированы';
  } else {
    notifyBtn.textContent = '🔔 Включить уведомления';
  }
}

notifyBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    alert('Ваш браузер не поддерживает уведомления.');
    return;
  }
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    alert('✅ Уведомления разрешены');
    // Тестовое уведомление с минимальными опциями
    setTimeout(() => {
      try {
        const testNotification = new Notification('Тест уведомлений', {
          body: 'Уведомления работают корректно!',
          requireInteraction: true
        });
        console.log('Тестовое уведомление создано:', testNotification);
      } catch (err) {
        console.error('Ошибка тестового уведомления:', err);
        alert('Ошибка создания уведомления: ' + err.message);
      }
    }, 500);
  } else if (permission === 'denied') {
    alert('❌ Уведомления заблокированы. Разрешите их через настройки браузера.');
  }
  updateNotifyButton();
});

function showNotification(title, body) {
  console.log('🔔 Вызов showNotification:', { title, body });
  console.log('Статус разрешения:', Notification.permission);
  console.log('Service Worker доступен:', !!swRegistration);
  
  if (Notification.permission !== 'granted') {
    console.warn('❌ Нет разрешения на уведомления');
    return;
  }

  // Упрощенные опции для теста
  const options = {
    body: body,
    requireInteraction: true,
    silent: false
  };

  // Не используем иконку, так как она может блокировать уведомление
  // Если иконка нужна, убедитесь что файл существует и доступен
  
  // Функция для прямого показа уведомления
  const showDirectNotification = () => {
    console.log('📢 Попытка прямого уведомления...');
    try {
      // Проверяем, не заблокированы ли уведомления на уровне ОС
      const notification = new Notification(title, options);
      console.log('✅ Прямое уведомление создано:', notification);
      
      notification.onclick = () => {
        console.log('👆 Клик по уведомлению');
        window.focus();
        notification.close();
      };
      
      notification.onshow = (event) => {
        console.log('👁️ Уведомление показано', event);
      };
      
      notification.onclose = () => {
        console.log('❌ Уведомление закрыто');
      };
      
      notification.onerror = (err) => {
        console.error('⚠️ Ошибка уведомления:', err);
        alert('Ошибка показа уведомления. Проверьте настройки браузера и ОС.');
      };
      
      // Дополнительная проверка через таймаут
      setTimeout(() => {
        console.log('Статус уведомления через 1с:', {
          title: notification.title,
          body: notification.body,
          timestamp: notification.timestamp
        });
      }, 1000);
      
    } catch (err) {
      console.error('❌ Ошибка прямого уведомления:', err);
      alert('Не удалось показать уведомление. ' + err.message);
    }
  };

  // Пытаемся показать через Service Worker
  if (swRegistration) {
    console.log('📱 Попытка уведомления через Service Worker...');
    swRegistration.showNotification(title, options)
      .then(() => {
        console.log('✅ Уведомление через SW показано');
      })
      .catch(err => {
        console.error('❌ Ошибка уведомления через SW:', err);
        console.log('↩️ Переключение на прямое уведомление...');
        showDirectNotification();
      });
  } else {
    console.log('📢 Service Worker недоступен, используем прямое уведомление');
    showDirectNotification();
  }
}

// Инициализация
render();
resumeScheduledNotifications();
updateNotifyButton();

console.log('=== app.js загружен ===');

// Проверка уведомлений при загрузке
setTimeout(() => {
  if (Notification.permission === 'granted') {
    console.log('🔔 Попытка автоматического тестового уведомления...');
    showNotification('Приложение запущено', 'Уведомления настроены и работают!');
  }
}, 3000);