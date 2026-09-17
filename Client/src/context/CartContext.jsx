import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as cartApi from '../api/cart'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null)
      return
    }
    setLoading(true)
    try {
      const { data } = await cartApi.getCart()
      setCart(data)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addItem = async (productId, quantity = 1) => {
    await cartApi.addCartItem(productId, quantity)
    await refreshCart()
  }

  const updateItem = async (itemId, quantity) => {
    await cartApi.updateCartItem(itemId, quantity)
    await refreshCart()
  }

  const removeItem = async (itemId) => {
    await cartApi.removeCartItem(itemId)
    await refreshCart()
  }

  const clear = async () => {
    await cartApi.clearCart()
    await refreshCart()
  }

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0

  return (
    <CartContext.Provider
      value={{ cart, loading, itemCount, refreshCart, addItem, updateItem, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
