// Shared token store - maps session IDs to OAuth tokens
const sessionTokens = new Map<string, string>();

export function setToken(sessionId: string, token: string): void {
  sessionTokens.set(sessionId, token);
}

export function getToken(sessionId: string): string {
  return sessionTokens.get(sessionId) || "";
}

export function deleteToken(sessionId: string): void {
  sessionTokens.delete(sessionId);
}
