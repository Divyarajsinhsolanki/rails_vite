const subscriptions = new Map();
let socket;
let reconnectTimer;

const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
const socketUrl = `${wsProtocol}://${window.location.host}/cable`;
const cableProtocols = ["actioncable-v1-json", "actioncable-unsupported"];

const sendWhenOpen = (payload) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
};

const resubscribeAll = () => {
  subscriptions.forEach((_handlers, identifier) => {
    sendWhenOpen({ command: "subscribe", identifier });
  });
};

const connect = () => {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  socket = new WebSocket(socketUrl, cableProtocols);

  socket.onopen = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

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
    reconnectTimer = setTimeout(connect, 1000);
  };

  socket.onerror = () => {
    socket.close();
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
      } else {
        subscriptions.set(identifier, remainingHandlers);
      }
    }
  };
};

export const subscribeToUserChat = (received) => subscribe({ channel: "ChatChannel" }, received);

export const subscribeToConversationChat = (conversationId, received) => {
  return subscribe({ channel: "ChatChannel", conversation_id: conversationId }, received);
};

export const sendToConversation = (conversationId, payload) => {
  const identifier = JSON.stringify({ channel: "ChatChannel", conversation_id: conversationId });
  sendWhenOpen({ ...payload, identifier });
};
