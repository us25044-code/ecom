import React, { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import type { ProductCategory } from '../types';

export const ShopPage: React.FC = () => {
  const { products, navigate } = useStore();
  const [category, setCategory] = useState<'all' | ProductCategory>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc'>(
    'featured',
  );

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.sizes.forEach((s) => set.add(s.sizeLabel)));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }
    if (sizeFilter !== 'all') {
      list = list.filter((p) =>
        p.sizes.some((s) => s.sizeLabel === sizeFilter && s.stockQty > 0),
      );
    }
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, category, sizeFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E7DFD1]">
        <div>
          <p className="text-xs font-semibold text-[#C26D3A] mb-1">
            GrowStep Storefront
          </p>
          <h1 className="font-display text-3xl font-bold text-[#132238]">
            Adaptive School Footwear
          </h1>
          <p className="mt-2 text-sm text-[#5A5D65] max-w-2xl">
            Uniform-compliant black formal school shoes and crisp white PE shoes
            in Indian children&apos;s sizes (IND 10 to IND 4).
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/size-guide')}
          className="text-sm font-semibold text-[#132238] underline underline-offset-4 self-start md:self-auto hover:text-[#1E5AA8]"
        >
          Indian Size Guide &amp; Fit Finder
        </button>
      </div>

      <div className="py-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F6F1E7] p-1 rounded-xl border border-[#E7DFD1]">
          {[
            { id: 'all', label: 'All Shoes' },
            { id: 'boys', label: "Boys' Lace-Up" },
            { id: 'girls', label: "Girls' Mary Jane" },
            { id: 'pe', label: 'White PE' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id as 'all' | ProductCategory)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                category === tab.id
                  ? 'bg-white text-[#132238] shadow-xs'
                  : 'text-[#5A5D65] hover:text-[#132238]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#5A5D65]">
            <SlidersHorizontal className="w-4 h-4 text-[#132238]" />
            <label htmlFor="shop-size-filter" className="font-medium">
              Indian Size:
            </label>
            <select
              id="shop-size-filter"
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-xs font-semibold text-[#132238] focus:outline-none focus:border-[#132238]"
            >
              <option value="all">All Sizes</option>
              {allSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5A5D65]">
            <label htmlFor="shop-sort" className="font-medium">
              Sort:
            </label>
            <select
              id="shop-sort"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as 'featured' | 'price_asc' | 'price_desc',
                )
              }
              className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-xs font-semibold text-[#132238] focus:outline-none focus:border-[#132238]"
            >
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-[#F6F1E7] rounded-2xl border border-[#E7DFD1]">
          <p className="font-display text-base font-semibold text-[#132238]">
            No shoes match your selected filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setSizeFilter('all');
              setSortBy('featured');
            }}
            className="mt-4 px-5 py-2.5 rounded-lg bg-[#132238] text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
