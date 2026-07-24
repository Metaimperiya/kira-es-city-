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
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.textContent = '✅ Подключено!';
      setTimeout(() => { loadingEl.style.display = 'none'; }, 1000);
    }
  };

  socket.onmessage = (event) => {
    if (onMessageHandler) {
      onMessageHandler(event);
    }
  };

  socket.onclose = () => {
    isConnected = false;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      initSocket();
    }, 3000);
  };
}

export function sendToServer(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}
