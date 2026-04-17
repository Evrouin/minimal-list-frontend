const SENSITIVE_FIELDS = new Set([
  'password',
  'password2',
  'old_password',
  'new_password',
  'new_password2',
  'token',
  'refresh',
  'access',
])

const encode = (text: string) => new TextEncoder().encode(text)

const importKey = (key: string) =>
  crypto.subtle.importKey('raw', encode(key).slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt'])

export const encryptField = async (value: string, key: string): Promise<string> => {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await importKey(key)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encode(value))
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export const decryptField = async (encoded: string, key: string): Promise<string> => {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const cryptoKey = await importKey(key)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data)
  return new TextDecoder().decode(decrypted)
}

export const encryptSensitiveFields = async (obj: Record<string, unknown>, key: string): Promise<Record<string, unknown>> => {
  const result = { ...obj }
  for (const [k, v] of Object.entries(result)) {
    if (SENSITIVE_FIELDS.has(k) && typeof v === 'string') {
      result[k] = await encryptField(v, key)
    }
  }
  return result
}

export const decryptSensitiveFields = async (obj: Record<string, unknown>, key: string): Promise<Record<string, unknown>> => {
  const result = { ...obj }
  for (const [k, v] of Object.entries(result)) {
    if (SENSITIVE_FIELDS.has(k) && typeof v === 'string') {
      try {
        result[k] = await decryptField(v, key)
      } catch {
        // not encrypted, leave as-is
      }
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = await decryptSensitiveFields(v as Record<string, unknown>, key)
    }
  }
  return result
}
