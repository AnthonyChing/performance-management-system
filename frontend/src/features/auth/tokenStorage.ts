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

export function getUserRole(): string | null {
  // First try localStorage/sessionStorage role key
  let role = globalThis.localStorage?.getItem('role') || globalThis.sessionStorage?.getItem('role');
  if (role) {
    return role;
  }

  // If not present, decode the JWT token dynamically to recover the role!
  const token = getStoredAuthToken();
  if (!token) return null;

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
        const decodedRole = payload.roles[0];
        // Save it back to localStorage so it is cached
        if (decodedRole && typeof decodedRole === 'string') {
          globalThis.localStorage?.setItem('role', decodedRole);
          return decodedRole;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}
