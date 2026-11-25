import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatInr } from '../lib/media';
import { ResilientImage } from './ResilientImage';

export const SearchModal: React.FC = () => {
  const { searchOpen, setSearchOpen, products, navigate } = useStore();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.sizes.some((s) => s.sizeLabel.toLowerCase().includes(q)),
    );
  }, [query, products]);

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#132238]/40 backdrop-blur-xs flex items-start justify-center pt-16 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search GrowStep products"
    >
      <div className="bg-[#FCFBF8] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E7DFD1] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E7DFD1] bg-white">
          <Search className="w-5 h-5 text-[#132238]/60 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Boys' Lace-Up, Mary Jane, White PE, or IND sizes..."
            autoFocus
            className="w-full text-sm text-[#1E2022] placeholder:text-[#5A5D65]/70 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className="p-1.5 rounded-lg text-[#5A5D65] hover:bg-[#F6F1E7]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-[#5A5D65] text-center py-8">
              No school shoes matched &ldquo;{query}&rdquo;. Try searching for
              black, Mary Jane, white, or IND 1.
            </p>
          ) : (
            results.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  navigate(`/products/${product.slug}`);
                }}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#F6F1E7] transition-colors text-left"
              >
                <div className="w-20 h-16 rounded-lg bg-[#FBF5EA] overflow-hidden shrink-0 border border-[#E7DFD1]">
                  <ResilientImage
                    src={product.images[0]?.url || ''}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#5A5D65]">{product.subtitle}</p>
                  <p className="font-display text-sm font-semibold text-[#132238] truncate">
                    {product.name}
                  </p>
                </div>
                <span className="font-mono-num text-sm font-semibold text-[#132238] shrink-0">
                  {formatInr(product.price)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
