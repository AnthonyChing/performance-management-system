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
  const storages = [
    typeof globalThis.localStorage === 'undefined' ? undefined : globalThis.localStorage,
    typeof globalThis.sessionStorage === 'undefined' ? undefined : globalThis.sessionStorage,
  ];

  for (const storage of storages) {
    for (const key of AUTH_TOKEN_STORAGE_KEYS) {
      const token = getStorageItem(storage, key)?.trim();

      if (token) {
        return token;
      }
    }
  }

  return null;
}

export function saveAuthToken(token: string) {
  const trimmedToken = token.trim();

  for (const key of AUTH_TOKEN_STORAGE_KEYS) {
    if (key !== PRIMARY_AUTH_TOKEN_STORAGE_KEY) {
      globalThis.localStorage?.removeItem(key);
      globalThis.sessionStorage?.removeItem(key);
    }
  }

  globalThis.localStorage?.setItem(PRIMARY_AUTH_TOKEN_STORAGE_KEY, trimmedToken);
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

  // If not present or we want to recover dynamically from JWT token
  const token = getStoredAuthToken();
  if (!token) return rolesList;

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        globalThis.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (payload && Array.isArray(payload.roles) && payload.roles.length > 0) {
        // Save it back to localStorage as JSON
        globalThis.localStorage?.setItem('roles', JSON.stringify(payload.roles));
        return payload.roles;
      }
    }
  } catch (e) {
    // ignore
  }

  return rolesList;
}

export function getUserRole(): string | null {
  const roles = getUserRoles();
  return roles.length > 0 ? roles[0] : null;
}

