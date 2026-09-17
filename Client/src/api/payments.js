import client from './client'

export const createCheckoutSession = (order_id) =>
  client.post('/payments/create-checkout-session/', { order_id })

export const listPayments = (params = {}) => client.get('/payments/', { params })

export const getPayment = (id) => client.get(`/payments/${id}/`)
