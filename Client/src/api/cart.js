import client from './client'

export const getCart = () => client.get('/cart/')

export const addCartItem = (product_id, quantity = 1) =>
  client.post('/cart/items/', { product_id, quantity })

export const updateCartItem = (id, quantity) =>
  client.patch(`/cart/items/${id}/`, { quantity })

export const removeCartItem = (id) => client.delete(`/cart/items/${id}/`)

export const clearCart = () => client.delete('/cart/clear/')
