const API_PREFIX = import.meta.env.VITE_APP_API_PREFIX || ''
const USE_PROXY_PREFIX =
  import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY === 'true' && API_PREFIX.length > 0

function getDirectApiBaseUrl() {
  const baseUrl =
    import.meta.env.VITE_APP_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:3000'
  return `${baseUrl.replace(/\/$/, '')}${USE_PROXY_PREFIX ? '' : API_PREFIX}`
}

export async function getJson(path, searchParams = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const requestPath = USE_PROXY_PREFIX ? `${API_PREFIX}${normalizedPath}` : normalizedPath
  const requestBaseUrl = USE_PROXY_PREFIX ? window.location.origin : getDirectApiBaseUrl()
  const url = new URL(requestPath, requestBaseUrl)

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const payload = await response.json()
  return payload.data ?? payload
}
