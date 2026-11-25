import React from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatInr } from '../lib/media';
import { ResilientImage } from './ResilientImage';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    config,
    navigate,
  } = useStore();

  if (!cartOpen) return null;

  const freeThreshold = config?.freeShippingThreshold ?? 1499;
  const flatShipping = config?.shippingFlatRate ?? 99;
  const shippingCharge =
    cartSubtotal === 0 || cartSubtotal >= freeThreshold ? 0 : flatShipping;
  const remainingForFree = Math.max(0, freeThreshold - cartSubtotal);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#132238]/35 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div
        className="flex-1"
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />
      <div className="w-full max-w-md bg-[#FCFBF8] h-full shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-[#E7DFD1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#132238]" />
            <h2 className="font-display text-lg font-bold text-[#132238]">
              Your Shopping Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
            className="p-2 rounded-lg text-[#5A5D65] hover:text-[#132238] hover:bg-[#F6F1E7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-2.5 bg-[#F6F1E7] border-b border-[#E7DFD1] text-xs text-[#132238] font-medium">
            {remainingForFree === 0
              ? 'Your order qualifies for free standard delivery.'
              : `Add ${formatInr(remainingForFree)} more for free standard delivery across India.`}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-[#F6F1E7] flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-[#132238]/60" />
              </div>
              <p className="font-display text-base font-semibold text-[#132238] mb-1">
                Your bag is empty
              </p>
              <p className="text-sm text-[#5A5D65] max-w-xs mb-6">
                Explore our adaptive-fit school shoes designed for Indian
                classrooms and monsoon conditions.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/shop');
                }}
                className="px-5 py-2.5 rounded-lg bg-[#132238] text-white text-sm font-medium hover:bg-[#1E5AA8] transition-colors"
              >
                Shop School Shoes
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.sizeLabel}`}
                className="flex gap-4 pb-5 border-b border-[#E7DFD1] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    navigate(`/products/${item.slug}`);
                  }}
                  className="w-24 h-20 rounded-lg bg-[#FBF5EA] overflow-hidden shrink-0 border border-[#E7DFD1]"
                >
                  <ResilientImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        navigate(`/products/${item.slug}`);
                      }}
                      className="text-left text-sm font-semibold text-[#132238] hover:underline truncate"
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(item.productId, item.sizeLabel)
                      }
                      aria-label={`Remove ${item.name} size ${item.sizeLabel}`}
                      className="text-[#5A5D65] hover:text-red-600 p-1 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#5A5D65] mt-0.5">
                    {item.color} · Size {item.sizeLabel}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#E7DFD1] rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(
                            item.productId,
                            item.sizeLabel,
                            item.quantity - 1,
                          )
                        }
                        aria-label="Decrease quantity"
                        className="p-1.5 text-[#1E2022] hover:bg-[#F6F1E7] rounded-l-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-mono-num font-semibold text-[#132238]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(
                            item.productId,
                            item.sizeLabel,
                            item.quantity + 1,
                          )
                        }
                        aria-label="Increase quantity"
                        className="p-1.5 text-[#1E2022] hover:bg-[#F6F1E7] rounded-r-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-mono-num text-sm font-semibold text-[#132238]">
                      {formatInr(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-[#F6F1E7] border-t border-[#E7DFD1] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#5A5D65]">
                <span>Subtotal</span>
                <span className="font-mono-num font-medium text-[#132238]">
                  {formatInr(cartSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#5A5D65]">
                <span>Estimated Shipping</span>
                <span className="font-mono-num font-medium text-[#132238]">
                  {shippingCharge === 0 ? 'Free' : formatInr(shippingCharge)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#132238] pt-2 border-t border-[#E7DFD1]">
                <span>Total</span>
                <span className="font-mono-num">
                  {formatInr(cartSubtotal + shippingCharge)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/cart');
                }}
                className="py-2.5 px-4 rounded-lg border border-[#132238] text-[#132238] text-sm font-medium bg-white hover:bg-[#FCFBF8] transition-colors"
              >
                View Cart
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/checkout');
                }}
                className="py-2.5 px-4 rounded-lg bg-[#132238] text-white text-sm font-medium hover:bg-[#1E5AA8] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
