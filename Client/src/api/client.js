import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api'

const client = axios.create({ baseURL: API_BASE })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise = null

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isAuthEndpoint = original?.url?.includes('/auth/login/') || original?.url?.includes('/auth/token/refresh/')

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh')
        if (!refresh) throw new Error('no refresh token')

        // Dedupe concurrent refreshes so simultaneous 401s don't
        // each try to refresh separately.
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE}/auth/token/refresh/`, { refresh })
            .finally(() => {
              refreshPromise = null
            })
        }
        const { data } = await refreshPromise
        localStorage.setItem('access', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return client(original)
      } catch {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)

// Fetch a full ready-to-use URL (e.g. a pagination "next"/"previous" link)
// without re-running it through baseURL resolution.
export function fetchAbsolute(url) {
  return client.get(url, { baseURL: '' })
}

export default client
