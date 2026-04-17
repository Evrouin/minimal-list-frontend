export const signRequest = async (method: string, url: string, body: string, key: string): Promise<{ signature: string; timestamp: string }> => {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const message = `${timestamp}.${method.toUpperCase()}.${url.split('?')[0]}.${body}`
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  const signature = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return { signature, timestamp }
}
