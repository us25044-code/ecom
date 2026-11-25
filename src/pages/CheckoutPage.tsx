import React, { useState } from 'react';
import {
  CreditCard,
  Info,
  Lock,
  ShieldCheck,
  Smartphone,
  Truck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { INDIAN_STATES, formatInr } from '../lib/media';
import { GrowStepLogo } from '../components/GrowStepLogo';
import { ResilientImage } from '../components/ResilientImage';
import type { Order } from '../types';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    config,
    customer,
    customerToken,
    razorpayConfigured,
    clearCart,
    setLastConfirmedOrder,
    navigate,
    refreshStorefront,
  } = useStore();

  const [fullName, setFullName] = useState(customer?.fullName || '');
  const [mobile, setMobile] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>(
    'razorpay',
  );
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test checkout simulator state when Razorpay env keys are unconfigured
  const [testModal, setTestModal] = useState<{
    order: Order;
    razorpayOrderId: string;
    testVerificationToken: string;
    amountPaise: number;
  } | null>(null);
  const [simMethod, setSimMethod] = useState<
    'upi' | 'card' | 'netbanking' | 'wallet'
  >('upi');
  const [showLiveGuide, setShowLiveGuide] = useState(false);

  if (cart.length === 0 && !testModal) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[#132238]">
          No items in your bag to check out
        </h1>
        <p className="mt-2 text-sm text-[#5A5D65]">
          Select an Indian school shoe size first to proceed with checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 px-6 py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
        >
          Shop Collection
        </button>
      </div>
    );
  }

  const freeThreshold = config?.freeShippingThreshold ?? 1499;
  const flatRate = config?.shippingFlatRate ?? 99;
  const shippingCharge =
    cartSubtotal === 0 || cartSubtotal >= freeThreshold ? 0 : flatRate;
  const codFee = paymentMethod === 'cod' ? (config?.codFee ?? 0) : 0;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.max(
    1,
    cartSubtotal + shippingCharge + codFee - discountAmount,
  );

  const handleApplyCoupon = async () => {
    setCouponFeedback(null);
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
        setCouponFeedback(data.error || 'Invalid coupon.');
        return;
      }
      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discountAmount || 0,
      });
      setCouponFeedback(
        `Coupon ${data.code} applied (−${formatInr(data.discountAmount || 0)}).`,
      );
    } catch {
      setCouponFeedback('Could not validate coupon.');
    }
  };

  const verifyAndFinishOrder = async (payload: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        verified?: boolean;
        order?: Order;
        error?: string;
      };
      if (!res.ok || !data.verified || !data.order) {
        setError(data.error || 'Payment verification failed.');
        setTestModal(null);
        setSubmitting(false);
        return;
      }
      setTestModal(null);
      clearCart();
      setLastConfirmedOrder(data.order);
      await refreshStorefront();
      navigate('/order-confirmation');
    } catch {
      setError('Unable to verify payment with server.');
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[6-9]\d{9}$/.test(mobile.replace(/\s+/g, ''))) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(pinCode.trim())) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customerToken) {
        headers.Authorization = `Bearer ${customerToken}`;
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName: fullName,
          customerEmail: email,
          customerPhone: mobile,
          deliveryAddress: address,
          city,
          state: stateName,
          pinCode,
          paymentMethod,
          discountCode: appliedCoupon?.code || '',
          items: cart.map((c) => ({
            productId: c.productId,
            sizeLabel: c.sizeLabel,
            quantity: c.quantity,
          })),
        }),
      });
      const orderData = (await orderRes.json()) as {
        order?: Order;
        error?: string;
      };
      if (!orderRes.ok || !orderData.order) {
        setError(orderData.error || 'Could not create order.');
        setSubmitting(false);
        return;
      }

      const createdOrder = orderData.order;

      if (paymentMethod === 'cod') {
        clearCart();
        setLastConfirmedOrder(createdOrder);
        await refreshStorefront();
        navigate('/order-confirmation');
        return;
      }

      // Create Razorpay order on server
      const payRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: createdOrder.id }),
      });
      const payData = (await payRes.json()) as {
        mode: 'razorpay_checkout' | 'test_simulation';
        keyId?: string;
        razorpayOrderId: string;
        testVerificationToken?: string;
        amountPaise: number;
        currency: string;
        error?: string;
      };
      if (!payRes.ok || !payData.razorpayOrderId) {
        setError(payData.error || 'Unable to initialize Razorpay payment.');
        setSubmitting(false);
        return;
      }

      if (payData.mode === 'razorpay_checkout' && window.Razorpay && payData.keyId) {
        const rzp = new window.Razorpay({
          key: payData.keyId,
          amount: payData.amountPaise,
          currency: payData.currency,
          name: 'GrowStep',
          description: `Order ${createdOrder.orderNumber}`,
          order_id: payData.razorpayOrderId,
          prefill: {
            name: fullName,
            email,
            contact: mobile,
          },
          theme: { color: '#132238' },
          handler: (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            verifyAndFinishOrder({
              orderId: createdOrder.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
              setError(
                'Payment window closed. Your order remains unpaid until verification completes.',
              );
            },
          },
        });
        rzp.open();
        return;
      }

      // Test Checkout Simulator when Razorpay credentials are not yet configured
      setSubmitting(false);
      setTestModal({
        order: createdOrder,
        razorpayOrderId: payData.razorpayOrderId,
        testVerificationToken: payData.testVerificationToken || '',
        amountPaise: payData.amountPaise,
      });
    } catch {
      setError('Network error during checkout.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E7DFD1] mb-8">
        <div>
          <GrowStepLogo variant="full" />
        </div>
        <div className="flex items-center gap-2 text-xs text-[#132238] font-medium">
          <Lock className="w-4 h-4 text-[#1E5AA8]" />
          <span>
            {customer
              ? `Signed in as ${customer.fullName}`
              : 'Guest Checkout · Secure Indian Payment Flow'}
          </span>
        </div>
      </div>

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-10"
      >
        {/* Left: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-8">
          <section className="p-6 rounded-2xl bg-white border border-[#E7DFD1] space-y-5">
            <h1 className="font-display text-xl font-bold text-[#132238]">
              1. Customer &amp; Delivery Details
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Parent or guardian full name"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm text-[#1E2022] focus:outline-none focus:border-[#132238]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  Mobile Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm font-mono-num text-[#1E2022] focus:outline-none focus:border-[#132238]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm text-[#1E2022] focus:outline-none focus:border-[#132238]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  Delivery Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat / House No., Building, Street, Locality"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm text-[#1E2022] focus:outline-none focus:border-[#132238]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bengaluru"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm text-[#1E2022] focus:outline-none focus:border-[#132238]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  State *
                </label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] text-sm bg-[#FCFBF8] text-[#1E2022] focus:outline-none focus:border-[#132238]"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  PIN Code (6 digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="560001"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm font-mono-num text-[#1E2022] focus:outline-none focus:border-[#132238]"
                />
              </div>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-white border border-[#E7DFD1] space-y-4">
            <h2 className="font-display text-xl font-bold text-[#132238]">
              2. Delivery Option
            </h2>
            <div className="p-4 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1] flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-[#132238] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#132238]">
                    Standard Courier Delivery
                  </p>
                  <p className="text-xs text-[#5A5D65]">
                    Estimated delivery:{' '}
                    {config?.estimatedDeliveryWindow || '4–6 business days'}
                  </p>
                </div>
              </div>
              <span className="font-mono-num text-sm font-bold text-[#132238]">
                {shippingCharge === 0 ? 'Free' : formatInr(shippingCharge)}
              </span>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-white border border-[#E7DFD1] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-[#132238]">
                3. Payment Method
              </h2>
              <span className="text-xs font-medium text-[#5A5D65]">
                {razorpayConfigured
                  ? 'Razorpay Gateway Connected'
                  : 'Test Mode Sandbox Active'}
              </span>
            </div>

            <div className="space-y-3">
              <label
                className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#132238] bg-[#FBF5EA]'
                    : 'border-[#E7DFD1] hover:border-[#132238]/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 accent-[#132238]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#132238] inline-flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#1E5AA8]" />
                        <span>Razorpay (UPI, Cards, Net Banking, Wallets)</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#5A5D65] mt-1">
                      Supports GPay, PhonePe, Paytm UPI, RuPay/Visa/Mastercard
                      credit &amp; debit cards, net banking, and Indian wallets.
                    </p>
                  </div>
                </div>
              </label>

              {(config?.codEnabled ?? true) && (
                <label
                  className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === 'cod'
                      ? 'border-[#132238] bg-[#FBF5EA]'
                      : 'border-[#E7DFD1] hover:border-[#132238]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 accent-[#132238]"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-bold text-[#132238]">
                        Cash on Delivery (COD)
                      </span>
                      <p className="text-xs text-[#5A5D65] mt-1">
                        Pay in cash or UPI upon doorstep delivery.{' '}
                        {codFee > 0
                          ? `COD handling fee: ${formatInr(codFee)}.`
                          : 'No extra COD fee.'}
                      </p>
                    </div>
                  </div>
                </label>
              )}
            </div>

            {!razorpayConfigured && (
              <div className="p-4 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1] text-xs text-[#5A5D65] space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#1E5AA8] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#132238]">
                      Razorpay Test Checkout Ready (Keys Not Yet Set)
                    </p>
                    <p className="mt-0.5">
                      Orders are created on the server and remain unpaid until
                      verified. Because{' '}
                      <code className="font-mono-num">RAZORPAY_KEY_ID</code> and{' '}
                      <code className="font-mono-num">RAZORPAY_KEY_SECRET</code>{' '}
                      are not set in environment variables, selecting Razorpay
                      will open our server-verified Test Mode Checkout flow.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLiveGuide((v) => !v)}
                      className="mt-1.5 font-semibold text-[#132238] underline"
                    >
                      {showLiveGuide
                        ? 'Hide live credential steps'
                        : 'How to switch to Razorpay Test/Live credentials'}
                    </button>
                  </div>
                </div>
                {showLiveGuide && (
                  <ol className="list-decimal pl-6 space-y-1 text-[11px] text-[#5A5D65] pt-1">
                    <li>
                      Obtain your Test Keys (<code>rzp_test_...</code>) or Live
                      KYC-verified Keys (<code>rzp_live_...</code>) from the
                      Razorpay Dashboard.
                    </li>
                    <li>
                      Set <code>RAZORPAY_KEY_ID</code> and{' '}
                      <code>RAZORPAY_KEY_SECRET</code> as server environment
                      variables (never prefix the secret with{' '}
                      <code>VITE_</code>).
                    </li>
                    <li>
                      Restart the server—checkout will automatically switch to
                      official Razorpay Checkout with server-side HMAC-SHA256
                      signature verification.
                    </li>
                  </ol>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-5 lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-bold text-[#132238]">
              Order Summary
            </h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.sizeLabel}`}
                  className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#E7DFD1]"
                >
                  <div className="w-16 h-14 rounded-lg bg-[#FBF5EA] overflow-hidden shrink-0">
                    <ResilientImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#132238] truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-[#5A5D65]">
                      {item.sizeLabel} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono-num text-xs font-bold text-[#132238]">
                    {formatInr(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Discount code (e.g. WELCOME100)"
                className="flex-1 px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-xs uppercase text-[#1E2022] focus:outline-none focus:border-[#132238]"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 rounded-lg bg-white border border-[#132238] text-xs font-semibold text-[#132238] hover:bg-[#132238] hover:text-white transition-colors"
              >
                Apply
              </button>
            </div>
            {couponFeedback && (
              <p className="text-xs text-[#132238] font-medium">
                {couponFeedback}
              </p>
            )}

            <div className="space-y-2 text-sm pt-3 border-t border-[#E7DFD1]">
              <div className="flex justify-between text-[#5A5D65]">
                <span>Subtotal</span>
                <span className="font-mono-num font-medium text-[#132238]">
                  {formatInr(cartSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#5A5D65]">
                <span>Shipping</span>
                <span className="font-mono-num font-medium text-[#132238]">
                  {shippingCharge === 0 ? 'Free' : formatInr(shippingCharge)}
                </span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between text-[#5A5D65]">
                  <span>COD Fee</span>
                  <span className="font-mono-num font-medium text-[#132238]">
                    {formatInr(codFee)}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#1E5AA8]">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-mono-num font-semibold">
                    −{formatInr(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-[#132238] pt-3 border-t border-[#E7DFD1]">
                <span>Total Payable</span>
                <span className="font-mono-num">{formatInr(finalTotal)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-5 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Processing Order...'
                  : paymentMethod === 'cod'
                    ? `Place COD Order (${formatInr(finalTotal)})`
                    : `Pay ${formatInr(finalTotal)} via Razorpay`}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Server-verified Test Mode Checkout Simulator Modal */}
      {testModal && (
        <div
          className="fixed inset-0 z-50 bg-[#132238]/55 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Razorpay Test Mode Simulation"
        >
          <div className="bg-[#FCFBF8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-[#E7DFD1]">
            <div className="flex items-center justify-between border-b border-[#E7DFD1] pb-4">
              <div>
                <p className="text-xs font-semibold text-[#1E5AA8]">
                  Razorpay Test Mode Simulator
                </p>
                <h3 className="font-display text-lg font-bold text-[#132238]">
                  Order {testModal.order.orderNumber}
                </h3>
              </div>
              <span className="font-mono-num text-lg font-bold text-[#132238]">
                {formatInr(testModal.order.totalAmount)}
              </span>
            </div>

            <p className="text-xs text-[#5A5D65]">
              Select a test payment method to simulate Razorpay&apos;s gateway
              response. The server verifies the signed test token before marking
              this order as paid.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'upi', label: 'UPI (GPay / PhonePe)' },
                { id: 'card', label: 'Credit / Debit Card' },
                { id: 'netbanking', label: 'Net Banking' },
                { id: 'wallet', label: 'Indian Wallets' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setSimMethod(
                      m.id as 'upi' | 'card' | 'netbanking' | 'wallet',
                    )
                  }
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition-colors ${
                    simMethod === m.id
                      ? 'border-[#132238] bg-[#FBF5EA] text-[#132238]'
                      : 'border-[#E7DFD1] bg-white text-[#5A5D65]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 mb-1 text-[#1E5AA8]" />
                  {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  verifyAndFinishOrder({
                    orderId: testModal.order.id,
                    razorpay_order_id: testModal.razorpayOrderId,
                    testVerificationToken: testModal.testVerificationToken,
                    testOutcome: 'success',
                  })
                }
                className="w-full py-3 px-4 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] disabled:opacity-60 transition-colors"
              >
                {submitting
                  ? 'Verifying...'
                  : 'Complete Verified Test Payment'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  verifyAndFinishOrder({
                    orderId: testModal.order.id,
                    razorpay_order_id: testModal.razorpayOrderId,
                    testVerificationToken: testModal.testVerificationToken,
                    testOutcome: 'fail',
                  })
                }
                className="w-full py-2.5 px-4 rounded-xl border border-[#E7DFD1] bg-white text-xs font-semibold text-[#1E2022] hover:bg-[#F6F1E7]"
              >
                Simulate Failed Payment (Order Stays Unpaid)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
