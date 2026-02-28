'use client'

import { useState } from 'react'
import { useCart, type CartItem } from '@/contexts/CartContext'

interface AddToCartButtonProps {
  product: Omit<CartItem, 'quantity'>
  minOrderQuantity?: number
}

export function AddToCartButton({ product, minOrderQuantity = 1 }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(minOrderQuantity)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem({ ...product, quantity })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-secondary-700">Qty:</label>
      <input
        type="number"
        value={quantity}
        min={minOrderQuantity}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10)
          if (!isNaN(val) && val >= minOrderQuantity) setQuantity(val)
        }}
        className="input-field w-20 text-center"
      />
      <button
        onClick={handleAdd}
        className={`btn-primary flex-1 transition-colors ${added ? 'bg-green-600 hover:bg-green-700' : ''}`}
      >
        {added ? 'Added!' : 'Add to Cart'}
      </button>
    </div>
  )
}
