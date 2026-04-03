const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: 'POST', body }),
  put:    (path, body) => request(path, { method: 'PUT', body }),
  delete: (path)       => request(path, { method: 'DELETE' }),
}
