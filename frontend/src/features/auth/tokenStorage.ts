export const AUTH_TOKEN_STORAGE_KEYS = ['accessToken', 'access_token', 'token', 'jwt'];
export const PRIMARY_AUTH_TOKEN_STORAGE_KEY = 'token';

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
  globalThis.localStorage?.setItem(PRIMARY_AUTH_TOKEN_STORAGE_KEY, token.trim());
}

export function toAuthorizationHeader(token: string) {
  return /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`;
}
