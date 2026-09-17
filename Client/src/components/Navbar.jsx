import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [bump, setBump] = useState(false)

  useEffect(() => {
    if (itemCount === 0) return
    setBump(true)
    const t = setTimeout(() => setBump(false), 220)
    return () => clearTimeout(t)
  }, [itemCount])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">X-Cart</NavLink>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Shop
          </NavLink>
          {user && (
            <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Orders
            </NavLink>
          )}
          {user?.is_staff && (
            <>
              <NavLink to="/admin" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/products" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Products
              </NavLink>
              <NavLink to="/admin/categories" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Categories
              </NavLink>
              <NavLink to="/admin/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Manage orders
              </NavLink>
            </>
          )}
          {user?.is_superuser && (
            <>
              <NavLink to="/superuser" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Admin
              </NavLink>
              <NavLink to="/superuser/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Users
              </NavLink>
            </>
          )}
        </nav>

        <div className="nav-right">
          {user ? (
            <>
              <NavLink to="/cart" className={`cart-badge${bump ? ' bump' : ''}`} aria-label="Cart">
                <ShoppingCart size={20} />
                {itemCount > 0 && <span className="count tabular">{itemCount}</span>}
              </NavLink>
              <NavLink to="/profile" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={16} /> {user.full_name || user.email}
              </NavLink>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">Log in</NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">Sign up</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
