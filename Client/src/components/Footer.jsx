import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="brand" style={{ fontSize: '1.0625rem' }}>X-Cart</p>
          <p className="label" style={{ marginTop: 8, maxWidth: 280 }}>
            A small, straightforward storefront — built to show what a clean
            checkout flow can look like.
          </p>
        </div>
        <div>
          <p className="label" style={{ marginBottom: 10 }}>Shop</p>
          <ul className="footer-links">
            <li><Link to="/">All products</Link></li>
            <li><Link to="/orders">Your orders</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>
        <div>
          <p className="label" style={{ marginBottom: 10 }}>Account</p>
          <ul className="footer-links">
            <li><Link to="/login">Log in</Link></li>
            <li><Link to="/register">Create account</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} X-Cart</span>
      </div>
    </footer>
  )
}
