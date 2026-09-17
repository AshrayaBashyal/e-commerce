import client from './client'

export const register = (payload) => client.post('/auth/register/', payload)

export const login = (payload) => client.post('/auth/login/', payload)

export const logout = (refresh) => client.post('/auth/logout/', { refresh })

export const me = () => client.get('/auth/me/')
