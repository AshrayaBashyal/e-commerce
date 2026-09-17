import { Link } from 'react-router-dom'
import ProductThumb from './ProductThumb'

export default function ProductCard({ product }) {
  const image = product.images?.[0]
  const outOfStock = product.inventory_quantity <= 0

  return (
    <Link to={`/products/${product.id}`} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="thumb">
        <ProductThumb image={image?.image} alt={image?.alt_text} name={product.name} />
      </div>
      <div className="body">
        <span className="cat">{product.category?.name}</span>
        <span className="name">{product.name}</span>
        <span className="price tabular">${Number(product.price).toFixed(2)}</span>
        {outOfStock && <span className="stock-line low">Out of stock</span>}
      </div>
    </Link>
  )
}
