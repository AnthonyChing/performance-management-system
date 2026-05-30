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
