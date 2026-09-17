import client from './client'

export const listUsers = (params = {}) => client.get('/users/', { params })

export const getUser = (id) => client.get(`/users/${id}/`)

export const updateUserRole = (id, is_staff) =>
  client.patch(`/users/${id}/role/`, { is_staff })
