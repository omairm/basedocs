const BASE_URL = 'http://localhost:4000/api'

interface RequestOptions extends RequestInit {
  data?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data, ...init } = options

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    body: data !== undefined ? JSON.stringify(data) : init.body,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data: unknown) => request<T>(path, { method: 'POST', data }),
  patch: <T>(path: string, data: unknown) => request<T>(path, { method: 'PATCH', data }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
