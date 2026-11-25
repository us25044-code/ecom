import React, { useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatInr } from '../lib/media';
import { ResilientImage } from '../components/ResilientImage';

export const CartPage: React.FC = () => {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    config,
    navigate,
  } = useStore();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const freeThreshold = config?.freeShippingThreshold ?? 1499;
  const flatRate = config?.shippingFlatRate ?? 99;
  const shippingCharge =
    cartSubtotal === 0 || cartSubtotal >= freeThreshold ? 0 : flatRate;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.max(0, cartSubtotal + shippingCharge - discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponMsg(null);
    if (!couponInput.trim()) return;
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, subtotal: cartSubtotal }),
      });
      const data = (await res.json()) as {
        code?: string;
        discountAmount?: number;
        error?: string;
      };
      if (!res.ok || !data.code) {
        setAppliedCoupon(null);
        setCouponMsg(data.error || 'Invalid discount code.');
        return;
      }
      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount || 0,
      });
      setCouponMsg(
        `Applied ${data.code} (${formatInr(data.discountAmount || 0)} off).`,
      );
    } catch {
      setCouponMsg('Unable to validate coupon right now.');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] mx-auto flex items-center justify-center mb-5">
          <ShoppingBag className="w-8 h-8 text-[#132238]/65" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#132238]">
          Your Shopping Bag is Empty
        </h1>
        <p className="mt-2 text-sm text-[#5A5D65]">
          Add a pair of GrowStep adaptive school shoes to get started.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 px-6 py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
        >
          Browse School Shoes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl font-bold text-[#132238] mb-8">
        Shopping Bag
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={`${item.productId}-${item.sizeLabel}`}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD1] flex flex-col sm:flex-row gap-5 items-start sm:items-center"
            >
              <button
                type="button"
                onClick={() => navigate(`/products/${item.slug}`)}
                className="w-28 h-24 rounded-xl bg-[#FBF5EA] overflow-hidden shrink-0 border border-[#E7DFD1]"
              >
                <ResilientImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </button>

              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(`/products/${item.slug}`)}
                  className="font-display text-base font-bold text-[#132238] hover:text-[#1E5AA8] transition-colors text-left"
                >
                  {item.name}
                </button>
                <p className="text-xs text-[#5A5D65] mt-1">
                  Colour: {item.color} · Indian Size: {item.sizeLabel}
                </p>
                <p className="font-mono-num text-sm font-semibold text-[#132238] mt-2">
                  {formatInr(item.unitPrice)} each
                </p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="inline-flex items-center border border-[#E7DFD1] rounded-lg bg-[#FCFBF8]">
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
                    className="p-2 hover:bg-[#F6F1E7] rounded-l-lg text-[#132238]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-mono-num text-xs font-bold text-[#132238]">
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
                    className="p-2 hover:bg-[#F6F1E7] rounded-r-lg text-[#132238]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="font-mono-num text-base font-bold text-[#132238] min-w-[76px] text-right">
                  {formatInr(item.unitPrice * item.quantity)}
                </span>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.productId, item.sizeLabel)}
                  aria-label="Remove item"
                  className="p-2 text-[#5A5D65] hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-5">
            <h2 className="font-display text-lg font-bold text-[#132238]">
              Order Summary
            </h2>

            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label
                htmlFor="cart-coupon"
                className="text-xs font-semibold text-[#132238] flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-[#1E5AA8]" />
                <span>Discount Code</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="cart-coupon"
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Try WELCOME100"
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-xs uppercase text-[#1E2022] focus:outline-none focus:border-[#132238]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-white border border-[#132238] text-[#132238] text-xs font-semibold hover:bg-[#132238] hover:text-white transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponMsg && (
                <p className="text-xs text-[#132238] font-medium">{couponMsg}</p>
              )}
            </form>

            <div className="space-y-2 text-sm pt-2 border-t border-[#E7DFD1]">
              <div className="flex justify-between text-[#5A5D65]">
                <span>Subtotal</span>
                <span className="font-mono-num font-medium text-[#132238]">
                  {formatInr(cartSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#5A5D65]">
                <span>Shipping Charges</span>
                <span className="font-mono-num font-medium text-[#132238]">
                  {shippingCharge === 0 ? 'Free' : formatInr(shippingCharge)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#1E5AA8]">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-mono-num font-semibold">
                    −{formatInr(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#132238] pt-3 border-t border-[#E7DFD1]">
                <span>Final Total</span>
                <span className="font-mono-num">{formatInr(finalTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 px-5 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
