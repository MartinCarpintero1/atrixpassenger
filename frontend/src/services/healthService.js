
export async function checkBackendHealth() {
  const response = await fetch('/api/health')

  if (!response.ok) {
    throw new Error(`Error del backend: HTTP ${response.status}`)
  }

  return response.json()
}
