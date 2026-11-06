
export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/+$/, '')

export const TOKEN_KEY = 'atrix_token'

export function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

/**
 * Interceptor global de fetch.
 * Los módulos existentes llaman a fetch('/api/...') con rutas relativas:
 * en Vercel eso apunta al propio frontend. Este interceptor:
 *  1. antepone VITE_API_URL (backend de Railway) a toda ruta '/api/...';
 *  2. agrega el header Authorization con el JWT de la sesión.
 * Así no hace falta reescribir cada CRUD ni configurar proxies.
 */
export function installApiInterceptor() {
  if (window.__atrixFetchPatched) return
  window.__atrixFetchPatched = true

  const nativeFetch = window.fetch.bind(window)

  window.fetch = (input, init = {}) => {
    if (typeof input !== 'string' || !input.startsWith('/api/')) {
      return nativeFetch(input, init)
    }

    const headers = new Headers(init.headers || {})
    const token = getStoredToken()

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return nativeFetch(`${API_URL}${input}`, { ...init, headers })
  }
}

/**
 * Cliente JSON autenticado. Si no se pasa token usa el de la sesión.
 * Lanza Error con el mensaje del backend ({"message": "..."}).
 */
export async function apiRequest(path, options = {}, token = getStoredToken()) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()

  let data

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === 'string' ? data : null) ||
      `Error ${response.status}`

    throw new Error(message)
  }

  return data
}

/** Atajos para los verbos más usados. */
export const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body) =>
    apiRequest(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) =>
    apiRequest(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) =>
    apiRequest(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  del: (path) => apiRequest(path, { method: 'DELETE' }),
}
