import client from './client'

export const createOrder = () => client.post('/orders/', {})

export const listOrders = (params = {}) => client.get('/orders/', { params })

export const getOrder = (id) => client.get(`/orders/${id}/`)

export const cancelOrder = (id) => client.post(`/orders/${id}/cancel/`)

export const updateOrderStatus = (id, status) =>
  client.patch(`/orders/${id}/status/`, { status })
