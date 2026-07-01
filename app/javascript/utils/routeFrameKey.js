export const routeFrameKeyForPath = (pathname = "") => (
  pathname.startsWith("/chat") ? "/chat" : pathname
);
