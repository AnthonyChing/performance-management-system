export const PRIMARY_AUTH_TOKEN_STORAGE_KEY = 'token';
export const AUTH_TOKEN_STORAGE_KEYS = [
  PRIMARY_AUTH_TOKEN_STORAGE_KEY,
  'accessToken',
  'access_token',
  'jwt',
  'pms_jwt',
];

function getStorageItem(storage: Storage | undefined, key: string) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function getStoredAuthToken() {
  return null;
}

export function saveAuthToken(token: string) {
  // No-op to support HttpOnly Cookie sessions
}

export function toAuthorizationHeader(token: string) {
  return /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;
}

export function getUserRoles(): string[] {
  // Try to parse from localStorage cached JSON or roles key
  const cachedRoles = globalThis.localStorage?.getItem('roles') || globalThis.sessionStorage?.getItem('roles');
  if (cachedRoles) {
    try {
      const parsed = JSON.parse(cachedRoles);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  const singleRole = globalThis.localStorage?.getItem('role') || globalThis.sessionStorage?.getItem('role');
  const rolesList: string[] = [];
  if (singleRole) {
    rolesList.push(singleRole);
  }

  return rolesList;
}

export function getUserRole(): string | null {
  const roles = getUserRoles();
  return roles.length > 0 ? roles[0] : null;
}
