export const TOKEN_KEY = "urms_token";
export const PENDING_EMAIL_KEY = "urms_pending_email";

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  console.log("[auth] storing token in localStorage");
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  console.log("[auth] removing token from localStorage");
  window.localStorage.removeItem(TOKEN_KEY);
}

export function setPendingEmail(email) {
  window.localStorage.setItem(PENDING_EMAIL_KEY, email);
}

export function getPendingEmail() {
  return window.localStorage.getItem(PENDING_EMAIL_KEY);
}

export function removePendingEmail() {
  window.localStorage.removeItem(PENDING_EMAIL_KEY);
}
