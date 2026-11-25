import React, { useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import type { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatInr } from '../lib/media';
import { ResilientImage } from './ResilientImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate, addToCart } = useStore();
  const inStockSizes = product.sizes.filter((s) => s.stockQty > 0);
  const [selectedSize, setSelectedSize] = useState(
    inStockSizes[0]?.sizeLabel || product.sizes[0]?.sizeLabel || 'IND 1',
  );
  const [added, setAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      color: product.color,
      sizeLabel: selectedSize,
      unitPrice: product.price,
      quantity: 1,
      imageUrl: product.images[0]?.url || '',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const sizeRange =
    product.sizes.length > 0
      ? `${product.sizes[0].sizeLabel} – ${product.sizes[product.sizes.length - 1].sizeLabel}`
      : 'IND 10 – IND 4';

  const primaryImg = product.images[0]?.url || '';
  const secondaryImg = product.images[1]?.url || primaryImg;

  return (
    <article className="group flex flex-col">
      <button
        type="button"
        onClick={() => navigate(`/products/${product.slug}`)}
        className="relative aspect-[4/3] w-full bg-[#FBF5EA] rounded-xl overflow-hidden text-left border border-[#E7DFD1] focus-visible:outline-2 focus-visible:outline-[#132238]"
      >
        <ResilientImage
          src={primaryImg}
          alt={product.name}
          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
        />
        <ResilientImage
          src={secondaryImg}
          alt={`${product.name} cutaway view`}
          className="w-full h-full object-cover absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </button>

      <div className="pt-4 flex-1 flex flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs text-[#5A5D65]">{product.subtitle}</p>
          <span className="text-[11px] font-medium text-[#5A5D65] shrink-0">
            {sizeRange}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/products/${product.slug}`)}
          className="text-left mt-1 focus-visible:outline-2 focus-visible:outline-[#132238] rounded"
        >
          <h3 className="font-display text-lg font-bold text-[#132238] group-hover:text-[#1E5AA8] transition-colors">
            {product.name}
          </h3>
        </button>

        <div className="mt-1.5 flex items-baseline gap-2.5">
          <span className="font-mono-num text-base font-bold text-[#132238]">
            {formatInr(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="font-mono-num text-xs text-[#5A5D65] line-through">
              {formatInr(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#E7DFD1] flex items-center gap-2">
          <select
            aria-label={`Select Indian size for ${product.name}`}
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="text-xs font-semibold text-[#132238] bg-[#F6F1E7] border border-[#E7DFD1] rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-[#132238]"
          >
            {product.sizes.map((s) => (
              <option
                key={s.sizeLabel}
                value={s.sizeLabel}
                disabled={s.stockQty <= 0}
              >
                {s.sizeLabel} {s.stockQty <= 0 ? '(Out)' : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={inStockSizes.length === 0}
            className="flex-1 py-2.5 px-3 rounded-lg bg-[#132238] text-white text-xs font-semibold hover:bg-[#1E5AA8] transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Bag</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/products/${product.slug}`)}
            className="py-2.5 px-3 rounded-lg border border-[#E7DFD1] text-[#132238] text-xs font-semibold hover:border-[#132238] transition-colors whitespace-nowrap"
          >
            Details
          </button>
        </div>
      </div>
    </article>
  );
};
