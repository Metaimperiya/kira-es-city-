// ============================================================
// WEB SOCKET
// ============================================================

export let socket = null;
export let isConnected = false;
let reconnectTimer = null;
let onMessageHandler = null;

export function onMessage(handler) {
  onMessageHandler = handler;
}

export function initSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  socket = new WebSocket(`${protocol}//${host}`);

  socket.onopen = () => {
    isConnected = true;
    console.log('🟢 Подключено к серверу');
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.textContent = '✅ Подключено!';
      loadingEl.classList.add('hidden');
    }
  };

  socket.onmessage = (event) => {
    if (onMessageHandler) {
      onMessageHandler(event);
    }
  };

  socket.onclose = () => {
    isConnected = false;
    console.log('🔴 Отключено от сервера');
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.textContent = '❌ Потеря соединения';
      loadingEl.classList.remove('hidden');
    }

    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      console.log('🔄 Переподключение...');
      initSocket();
    }, 3000);
  };

  socket.onerror = (error) => {
    console.error('❌ Ошибка WebSocket:', error);
  };
}

export function sendToServer(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  } else {
    console.warn('⚠️ Сокет не открыт, данные не отправлены');
  }
}
