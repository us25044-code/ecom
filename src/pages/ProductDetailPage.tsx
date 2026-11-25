import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  CloudRain,
  Footprints,
  Heart,
  Layers,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  ZoomIn,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatInr } from '../lib/media';
import { ResilientImage } from '../components/ResilientImage';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  slug,
}) => {
  const {
    products,
    config,
    navigate,
    addToCart,
    recordViewed,
    recentlyViewed,
    customer,
    toggleWishlist,
  } = useStore();

  const product = useMemo(
    () => products.find((p) => p.slug === slug) || products[0],
    [products, slug],
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    'description' | 'materials' | 'adaptive' | 'care' | 'shipping'
  >('description');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [footLengthInput, setFootLengthInput] = useState('');
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (!product) return;
    setActiveImageIdx(0);
    setQuantity(1);
    const firstAvailable =
      product.sizes.find((s) => s.stockQty > 0)?.sizeLabel ||
      product.sizes[0]?.sizeLabel ||
      '';
    setSelectedSize(firstAvailable);
    recordViewed(product.id);
  }, [product?.id, recordViewed]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-[#5A5D65]">Loading product details...</p>
      </div>
    );
  }

  const activeImage = product.images[activeImageIdx] || product.images[0];
  const selectedSizeObj = product.sizes.find(
    (s) => s.sizeLabel === selectedSize,
  );
  const maxStock = selectedSizeObj?.stockQty ?? 0;
  const isWishlisted = Boolean(customer?.wishlist.includes(product.id));

  const discountPct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : null;

  const suggestedSize = useMemo(() => {
    const cm = parseFloat(footLengthInput);
    if (!Number.isFinite(cm) || cm <= 0) return null;
    const sorted = [...product.sizes].sort(
      (a, b) => a.footLengthCm - b.footLengthCm,
    );
    const match = sorted.find((s) => s.footLengthCm >= cm);
    if (match) {
      return {
        size: match,
        note: 'Recommended Indian size based on configured chart.',
      };
    }
    const largest = sorted[sorted.length - 1];
    return largest
      ? {
          size: largest,
          note: `Measured length exceeds ${largest.sizeLabel} in our current launch range.`,
        }
      : null;
  }, [footLengthInput, product.sizes]);

  const handleAdd = (goToCheckout: boolean) => {
    if (!selectedSize || maxStock <= 0) return;
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        color: product.color,
        sizeLabel: selectedSize,
        unitPrice: product.price,
        quantity,
        imageUrl: product.images[0]?.url || '',
      },
      !goToCheckout,
    );
    if (goToCheckout) {
      navigate('/checkout');
    } else {
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 1500);
    }
  };

  const otherProducts = products.filter((p) => p.id !== product.id);
  const bundlePartner = otherProducts[0];
  const recentProducts = recentlyViewed
    .filter((id) => id !== product.id)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const handleBundleAdd = () => {
    if (!bundlePartner) return;
    handleAdd(false);
    const partnerSize =
      bundlePartner.sizes.find(
        (s) => s.sizeLabel === selectedSize && s.stockQty > 0,
      )?.sizeLabel ||
      bundlePartner.sizes.find((s) => s.stockQty > 0)?.sizeLabel ||
      'IND 1';
    addToCart(
      {
        productId: bundlePartner.id,
        slug: bundlePartner.slug,
        name: bundlePartner.name,
        color: bundlePartner.color,
        sizeLabel: partnerSize,
        unitPrice: bundlePartner.price,
        quantity: 1,
        imageUrl: bundlePartner.images[0]?.url || '',
      },
      true,
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <nav
        className="flex items-center gap-2 text-xs text-[#5A5D65] mb-8"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          className="hover:text-[#132238]"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="hover:text-[#132238]"
        >
          Shop
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#132238] font-medium truncate">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
          <div
            className="relative aspect-[4/3] w-full bg-[#FBF5EA] rounded-2xl border border-[#E7DFD1] overflow-hidden cursor-zoom-in"
            onMouseEnter={() => setZoomActive(true)}
            onMouseLeave={() => setZoomActive(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setZoomOrigin({ x, y });
            }}
          >
            <div
              className="w-full h-full transition-transform duration-200 ease-out"
              style={{
                transform: zoomActive ? 'scale(1.65)' : 'scale(1)',
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
              }}
            >
              <ResilientImage
                src={activeImage?.url || ''}
                alt={`${product.name} - ${activeImage?.label || 'Angle'}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-[#E7DFD1] text-xs font-medium text-[#132238] inline-flex items-center gap-1.5 pointer-events-none">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{activeImage?.label || 'Hover to zoom'}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
            {product.images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                className={`group rounded-xl overflow-hidden border transition-all text-left bg-[#FBF5EA] ${
                  idx === activeImageIdx
                    ? 'border-[#132238] ring-2 ring-[#132238]/20'
                    : 'border-[#E7DFD1] hover:border-[#132238]/50'
                }`}
                title={img.label}
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <ResilientImage
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="px-1.5 py-1 text-[10px] font-medium text-[#1E2022] truncate text-center bg-white">
                  {img.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-semibold text-[#C26D3A] mb-1">
              {product.subtitle}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#132238] text-balance">
              {product.name}
            </h1>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-mono-num text-2xl font-bold text-[#132238]">
                {formatInr(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="font-mono-num text-sm text-[#5A5D65] line-through">
                    {formatInr(product.originalPrice)}
                  </span>
                  {discountPct && (
                    <span className="text-xs font-semibold text-[#C26D3A]">
                      Save {discountPct}%
                    </span>
                  )}
                </>
              )}
              <span className="text-xs text-[#5A5D65] ml-auto">
                Inclusive of all taxes
              </span>
            </div>

            <p className="mt-4 text-sm text-[#1E2022]/85 leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          <div className="pt-4 border-t border-[#E7DFD1] space-y-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#5A5D65]">
                Colour:{' '}
                <strong className="text-[#132238]">{product.color}</strong>
              </span>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  isWishlisted
                    ? 'border-[#132238] bg-[#F6F1E7] text-[#132238]'
                    : 'border-[#E7DFD1] text-[#5A5D65] hover:border-[#132238]'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    isWishlisted ? 'fill-[#132238] text-[#132238]' : ''
                  }`}
                />
                <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </button>
            </div>

            {/* Interactive Indian Shoe Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-[#132238]">
                  Select Indian Size (IND)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E5AA8] underline underline-offset-4 hover:text-[#132238]"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Indian Size Guide &amp; Find My Size</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map((size) => {
                  const active = selectedSize === size.sizeLabel;
                  const out = size.stockQty <= 0;
                  return (
                    <button
                      key={size.sizeLabel}
                      type="button"
                      disabled={out}
                      onClick={() => setSelectedSize(size.sizeLabel)}
                      className={`py-2.5 px-2 rounded-lg border text-center transition-colors ${
                        out
                          ? 'border-[#E7DFD1] bg-[#F6F1E7]/50 text-[#5A5D65]/40 cursor-not-allowed line-through'
                          : active
                            ? 'border-[#132238] bg-[#132238] text-white'
                            : 'border-[#E7DFD1] bg-white text-[#132238] hover:border-[#132238]'
                      }`}
                    >
                      <span className="block text-xs font-semibold">
                        {size.sizeLabel}
                      </span>
                      <span
                        className={`block text-[10px] font-mono-num mt-0.5 ${
                          active ? 'text-[#F6F1E7]' : 'text-[#5A5D65]'
                        }`}
                      >
                        {size.footLengthCm} cm
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedSizeObj && (
                <p className="mt-2 text-xs text-[#5A5D65]">
                  {selectedSizeObj.stockQty > 0
                    ? `${selectedSizeObj.stockQty} pairs in stock for ${selectedSizeObj.sizeLabel}`
                    : `${selectedSizeObj.sizeLabel} is currently out of stock`}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-[#E7DFD1] rounded-lg bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-3 text-[#132238] hover:bg-[#F6F1E7] rounded-l-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-mono-num text-sm font-bold text-[#132238]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(1, maxStock), q + 1))
                  }
                  aria-label="Increase quantity"
                  className="p-3 text-[#132238] hover:bg-[#F6F1E7] rounded-r-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={maxStock <= 0}
                onClick={() => handleAdd(false)}
                className="flex-1 py-3.5 px-5 rounded-lg bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addedFeedback ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              disabled={maxStock <= 0}
              onClick={() => handleAdd(true)}
              className="w-full py-3.5 px-5 rounded-lg bg-[#F6F1E7] border border-[#E7DFD1] text-[#132238] text-sm font-semibold hover:border-[#132238] transition-colors disabled:opacity-50"
            >
              Buy Now — Express Checkout
            </button>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E7DFD1]">
              <div className="py-2 flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#1E5AA8] shrink-0" />
                <span className="text-xs font-semibold text-[#132238]">
                  Adaptive Fit Insert
                </span>
              </div>
              <div className="py-2 flex items-center gap-2.5">
                <CloudRain className="w-4 h-4 text-[#1E5AA8] shrink-0" />
                <span className="text-xs font-semibold text-[#132238]">
                  Quick-Dry Lining
                </span>
              </div>
              <div className="py-2 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1E5AA8] shrink-0" />
                <span className="text-xs font-semibold text-[#132238]">
                  Reinforced Construction
                </span>
              </div>
              <div className="py-2 flex items-center gap-2.5">
                <Footprints className="w-4 h-4 text-[#1E5AA8] shrink-0" />
                <span className="text-xs font-semibold text-[#132238]">
                  Anti-Slip Outsole
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information Tabs */}
      <section className="mt-16 pt-12 border-t border-[#E7DFD1]">
        <div className="flex flex-wrap gap-2 border-b border-[#E7DFD1] pb-4">
          {[
            { id: 'description', label: 'Description' },
            { id: 'materials', label: 'Materials & Construction' },
            { id: 'adaptive', label: 'Adaptive Fit Mechanism' },
            { id: 'care', label: 'Care Instructions' },
            { id: 'shipping', label: 'Shipping & Returns' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(
                  tab.id as
                    | 'description'
                    | 'materials'
                    | 'adaptive'
                    | 'care'
                    | 'shipping',
                )
              }
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#132238] text-white'
                  : 'bg-[#F6F1E7] text-[#1E2022] hover:text-[#132238]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6 max-w-3xl text-sm text-[#1E2022]/85 leading-relaxed whitespace-pre-line">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              <ul className="list-disc pl-5 space-y-1.5">
                {product.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {activeTab === 'materials' && product.materialsConstruction}
          {activeTab === 'adaptive' && product.adaptiveFitMechanism}
          {activeTab === 'care' && product.careInstructions}
          {activeTab === 'shipping' && product.shippingReturnsSummary}
        </div>
      </section>

      {/* Frequently Bought Together */}
      {bundlePartner && (
        <section className="mt-12 p-6 sm:p-8 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1]">
          <h2 className="font-display text-xl font-bold text-[#132238] mb-5">
            Frequently Bought Together (Uniform + PE Pair)
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E7DFD1]">
                <div className="w-16 h-14 rounded-lg bg-[#FBF5EA] overflow-hidden">
                  <ResilientImage
                    src={product.images[0]?.url || ''}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#132238]">
                    {product.name}
                  </p>
                  <p className="font-mono-num text-xs text-[#5A5D65]">
                    {formatInr(product.price)}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#132238]">+</span>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E7DFD1]">
                <div className="w-16 h-14 rounded-lg bg-[#FBF5EA] overflow-hidden">
                  <ResilientImage
                    src={bundlePartner.images[0]?.url || ''}
                    alt={bundlePartner.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#132238]">
                    {bundlePartner.name}
                  </p>
                  <p className="font-mono-num text-xs text-[#5A5D65]">
                    {formatInr(bundlePartner.price)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-[#5A5D65]">Combined Price</p>
                <p className="font-mono-num text-lg font-bold text-[#132238]">
                  {formatInr(product.price + bundlePartner.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleBundleAdd}
                className="px-5 py-3 rounded-lg bg-[#132238] text-white text-xs font-semibold hover:bg-[#1E5AA8] transition-colors whitespace-nowrap"
              >
                Add Both to Cart
              </button>
            </div>
          </div>
        </section>
      )}

      {/* You May Also Like */}
      {otherProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold text-[#132238] mb-6">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {otherProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      {recentProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-xl font-bold text-[#132238] mb-6">
            Recently Viewed Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Indian Size Guide & Find My Size Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-50 bg-[#132238]/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="GrowStep Indian Size Guide and Find My Size"
        >
          <div className="bg-[#FCFBF8] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 border border-[#E7DFD1]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#132238]">
                  Indian Size Guide &amp; Find My Size
                </h2>
                <p className="text-xs text-[#5A5D65] mt-1">
                  {config?.sizeChartNote ||
                    'Measurements follow Indian school footwear sizing (IND 10 to IND 4) as configurable reference values pending final manufacturer last confirmation.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="px-3 py-1.5 rounded-lg bg-[#F6F1E7] text-xs font-semibold text-[#132238]"
              >
                Close
              </button>
            </div>

            <div className="p-5 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-3">
              <label
                htmlFor="foot-cm-input"
                className="block text-xs font-bold text-[#132238]"
              >
                Find My Size — Enter Child&apos;s Foot Length (cm)
              </label>
              <input
                id="foot-cm-input"
                type="number"
                step="0.1"
                min="12"
                max="26"
                value={footLengthInput}
                onChange={(e) => setFootLengthInput(e.target.value)}
                placeholder="e.g. 19.3"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-white text-sm font-mono-num"
              />
              {suggestedSize && (
                <div className="pt-1 flex items-center justify-between gap-3">
                  <p className="text-xs text-[#132238]">
                    Suggested Size:{' '}
                    <strong className="font-mono-num text-sm">
                      {suggestedSize.size.sizeLabel}
                    </strong>{' '}
                    ({suggestedSize.size.footLengthCm} cm reference) —{' '}
                    {suggestedSize.note}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSize(suggestedSize.size.sizeLabel);
                      setShowSizeGuide(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#132238] text-white text-xs font-semibold shrink-0"
                  >
                    Select {suggestedSize.size.sizeLabel}
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-hidden border border-[#E7DFD1] rounded-xl bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F1E7] text-[#132238]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Indian Size</th>
                    <th className="py-2.5 px-4 font-semibold">
                      Foot Length (cm, Configurable)
                    </th>
                    <th className="py-2.5 px-4 font-semibold">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DFD1]/70">
                  {product.sizes.map((row) => (
                    <tr key={row.sizeLabel}>
                      <td className="py-2.5 px-4 font-semibold text-[#132238]">
                        {row.sizeLabel}
                      </td>
                      <td className="py-2.5 px-4 font-mono-num text-[#1E2022]">
                        {row.footLengthCm} cm
                      </td>
                      <td className="py-2.5 px-4 text-[#5A5D65]">
                        {row.stockQty > 0 ? 'In stock' : 'Out of stock'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-sm font-bold text-[#132238]">
                How to Measure Your Child&apos;s Foot
              </h3>
              <ol className="list-decimal pl-5 text-xs text-[#1E2022]/85 space-y-1.5">
                <li>Place a sheet of paper flat on the floor against a wall and have your child stand upright on it.</li>
                <li>Mark the back of the heel and the tip of the longest toe with a pencil.</li>
                <li>Measure the distance between the two marks in centimetres with a ruler.</li>
                <li>Compare the measurement with the configurable Indian size chart above.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
