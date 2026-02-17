const subscriptions = new Map();
let socket;

const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
const socketUrl = `${wsProtocol}://${window.location.host}/cable`;

const connect = () => {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  socket = new WebSocket(socketUrl);

  socket.onopen = () => {
    subscriptions.forEach((_handlers, identifier) => {
      socket.send(JSON.stringify({ command: "subscribe", identifier }));
    });
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (!data.identifier || !data.message) return;

    const handlers = subscriptions.get(data.identifier) || [];
    handlers.forEach((handler) => handler(data.message));
  };

  socket.onclose = () => {
    setTimeout(connect, 1000);
  };
};

const subscribe = (params, received) => {
  const identifier = JSON.stringify(params);
  const handlers = subscriptions.get(identifier) || [];
  subscriptions.set(identifier, [...handlers, received]);

  connect();

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ command: "subscribe", identifier }));
  }

  return {
    unsubscribe: () => {
      const existingHandlers = subscriptions.get(identifier) || [];
      const remainingHandlers = existingHandlers.filter((handler) => handler !== received);

      if (remainingHandlers.length === 0) {
        subscriptions.delete(identifier);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ command: "unsubscribe", identifier }));
        }
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
