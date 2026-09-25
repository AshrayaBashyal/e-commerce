import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import OrderCancel from './pages/OrderCancel'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

import AdminDashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/Products'
import AdminCategories from './pages/admin/Categories'
import AdminOrders from './pages/admin/Orders'
import SuperuserDashboard from './pages/superuser/Dashboard'
import SuperuserUsers from './pages/superuser/Users'

export default function App() {
  const location = useLocation()
  const isBackOffice = location.pathname.startsWith('/admin') || location.pathname.startsWith('/superuser')

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/order-cancel" element={<OrderCancel />} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

        <Route
          path="/admin"
          element={<ProtectedRoute requireStaff><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/products"
          element={<ProtectedRoute requireStaff><AdminProducts /></ProtectedRoute>}
        />
        <Route
          path="/admin/categories"
          element={<ProtectedRoute requireStaff><AdminCategories /></ProtectedRoute>}
        />
        <Route
          path="/admin/orders"
          element={<ProtectedRoute requireStaff><AdminOrders /></ProtectedRoute>}
        />

        <Route
          path="/superuser"
          element={<ProtectedRoute requireSuperuser><SuperuserDashboard /></ProtectedRoute>}
        />
        <Route
          path="/superuser/users"
          element={<ProtectedRoute requireSuperuser><SuperuserUsers /></ProtectedRoute>}
        />

        <Route path="*" element={<Home />} />
      </Routes>
      {!isBackOffice && <Footer />}
    </>
  )
}
