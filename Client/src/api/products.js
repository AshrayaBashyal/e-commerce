import client from './client'

export const listProducts = (params = {}) => client.get('/products/', { params })

export const getProduct = (id) => client.get(`/products/${id}/`)

export const getRecommendations = (id) => client.get(`/products/${id}/recommendations/`)

export const createProduct = (payload) => client.post('/products/', payload)

export const updateProduct = (id, payload) => client.patch(`/products/${id}/`, payload)

export const deleteProduct = (id) => client.delete(`/products/${id}/`)

export const uploadProductImage = (id, formData) =>
  client.post(`/products/${id}/images/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const deleteProductImage = (id, imageId) =>
  client.delete(`/products/${id}/images/${imageId}/`)

export const listCategories = () => client.get('/categories/')

export const getCategory = (id) => client.get(`/categories/${id}/`)

export const createCategory = (payload) => client.post('/categories/', payload)

export const updateCategory = (id, payload) => client.patch(`/categories/${id}/`, payload)
