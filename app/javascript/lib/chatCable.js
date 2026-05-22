const subscriptions = new Map();
let socket;
let reconnectTimer;
let reconnectAttempts = 0;
let intentionallyClosed = false;

const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
const socketUrl = `${wsProtocol}://${window.location.host}/cable`;
const cableProtocols = ["actioncable-v1-json", "actioncable-unsupported"];

const sendWhenOpen = (payload) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;

  socket.send(JSON.stringify(payload));
  return true;
};

const resubscribeAll = () => {
  subscriptions.forEach((_handlers, identifier) => {
    sendWhenOpen({ command: "subscribe", identifier });
  });
};

const clearReconnectTimer = () => {
  if (!reconnectTimer) return;

  clearTimeout(reconnectTimer);
  reconnectTimer = null;
};

const scheduleReconnect = () => {
  if (intentionallyClosed || subscriptions.size === 0) return;

  clearReconnectTimer();
  reconnectAttempts += 1;
  reconnectTimer = setTimeout(connect, Math.min(1000 * reconnectAttempts, 5000));
};

const connect = () => {
  if (subscriptions.size === 0) return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  intentionallyClosed = false;
  socket = new WebSocket(socketUrl, cableProtocols);

  socket.onopen = () => {
    clearReconnectTimer();
    reconnectAttempts = 0;

    resubscribeAll();
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Ignore framework-level ActionCable messages.
    if (!data.identifier || !data.message) return;

    const handlers = subscriptions.get(data.identifier) || [];
    handlers.forEach((handler) => handler(data.message));
  };

  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
};

const subscribe = (params, received) => {
  const identifier = JSON.stringify(params);
  const handlers = subscriptions.get(identifier) || [];

  if (!handlers.includes(received)) {
    subscriptions.set(identifier, [...handlers, received]);
  }

  connect();

  sendWhenOpen({ command: "subscribe", identifier });

  return {
    unsubscribe: () => {
      const existingHandlers = subscriptions.get(identifier) || [];
      const remainingHandlers = existingHandlers.filter((handler) => handler !== received);

      if (remainingHandlers.length === 0) {
        subscriptions.delete(identifier);
        sendWhenOpen({ command: "unsubscribe", identifier });

        if (subscriptions.size === 0 && socket) {
          intentionallyClosed = true;
          clearReconnectTimer();
          socket.close();
          socket = null;
        }
      } else {
        subscriptions.set(identifier, remainingHandlers);
      }
    }
  };
};

export const subscribeToPresence = (received) => subscribe({ channel: "PresenceChannel" }, received);

export const subscribeToUserChat = (received) => subscribe({ channel: "ChatChannel" }, received);

export const subscribeToConversationChat = (conversationId, received) => {
  return subscribe({ channel: "ChatChannel", conversation_id: conversationId }, received);
};

export const sendToConversation = (conversationId, action, data = {}) => {
  const identifier = JSON.stringify({ channel: "ChatChannel", conversation_id: conversationId });
  sendWhenOpen({
    command: "message",
    identifier,
    data: JSON.stringify({ action, ...data })
  });
};
