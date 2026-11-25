import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatInr } from '../lib/media';
import { GrowStepLogo } from '../components/GrowStepLogo';

export const OrderConfirmationPage: React.FC = () => {
  const { lastConfirmedOrder, navigate } = useStore();

  if (!lastConfirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[#132238]">
          No Recent Order in Session
        </h1>
        <p className="mt-2 text-sm text-[#5A5D65]">
          Track an existing order using your Order Number and email/phone on the
          Account &amp; Orders page.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="px-5 py-2.5 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
          >
            Track Order
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="px-5 py-2.5 rounded-xl border border-[#E7DFD1] text-sm font-semibold text-[#132238] hover:border-[#132238]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const order = lastConfirmedOrder;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E7DFD1] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#E7DFD1]">
          <div className="space-y-2">
            <GrowStepLogo variant="full" />
            <div className="flex items-center gap-2 text-[#132238] pt-2">
              <CheckCircle2 className="w-6 h-6 text-[#1E5AA8]" />
              <h1 className="font-display text-2xl font-bold">
                Order Confirmed
              </h1>
            </div>
            <p className="text-sm text-[#5A5D65]">
              Thank you, {order.customerName}. Your GrowStep order has been
              recorded and is being prepared.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E7DFD1] text-xs font-semibold text-[#132238] hover:bg-[#F6F1E7]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1] text-xs">
          <div>
            <p className="text-[#5A5D65]">Order Number</p>
            <p className="font-mono-num font-bold text-[#132238] mt-0.5">
              {order.orderNumber}
            </p>
          </div>
          <div>
            <p className="text-[#5A5D65]">Payment Method</p>
            <p className="font-semibold text-[#132238] mt-0.5">
              {order.paymentMethod === 'cod'
                ? 'Cash on Delivery'
                : order.isTestTransaction
                  ? 'Razorpay (Test Mode)'
                  : 'Razorpay'}
            </p>
          </div>
          <div>
            <p className="text-[#5A5D65]">Payment Status</p>
            <p className="font-semibold text-[#132238] mt-0.5">
              {order.paymentStatus === 'paid'
                ? 'Verified Paid'
                : order.paymentStatus === 'cod_pending'
                  ? 'Pay on Delivery'
                  : order.paymentStatus}
            </p>
          </div>
          <div>
            <p className="text-[#5A5D65]">Estimated Delivery</p>
            <p className="font-semibold text-[#132238] mt-0.5">
              {order.estimatedDelivery}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-sm font-bold text-[#132238]">
            Items Purchased
          </h2>
          <div className="divide-y divide-[#E7DFD1] border border-[#E7DFD1] rounded-xl">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 flex items-center justify-between gap-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-[#132238]">
                    {item.productName}
                  </p>
                  <p className="text-xs text-[#5A5D65]">
                    Size: {item.sizeLabel} · Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-mono-num font-semibold text-[#132238]">
                  {formatInr(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="text-xs text-[#5A5D65] space-y-1">
            <h3 className="font-display text-sm font-bold text-[#132238] mb-1.5">
              Delivery Address
            </h3>
            <p className="font-semibold text-[#132238]">{order.customerName}</p>
            <p>{order.deliveryAddress}</p>
            <p>
              {order.city}, {order.state} – {order.pinCode}
            </p>
            <p>Phone: {order.customerPhone}</p>
            <p>Email: {order.customerEmail}</p>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-[#5A5D65]">
              <span>Subtotal</span>
              <span className="font-mono-num text-[#132238]">
                {formatInr(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#5A5D65]">
              <span>Shipping</span>
              <span className="font-mono-num text-[#132238]">
                {order.shippingCharge === 0
                  ? 'Free'
                  : formatInr(order.shippingCharge)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[#1E5AA8]">
                <span>Discount ({order.discountCode})</span>
                <span className="font-mono-num">
                  −{formatInr(order.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-[#132238] pt-2 border-t border-[#E7DFD1]">
              <span>
                {order.paymentStatus === 'paid'
                  ? 'Amount Paid'
                  : 'Total Payable'}
              </span>
              <span className="font-mono-num">
                {formatInr(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-[#E7DFD1]">
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="px-5 py-2.5 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
          >
            Continue Shopping
          </button>
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="px-5 py-2.5 rounded-xl border border-[#E7DFD1] text-sm font-semibold text-[#132238] hover:border-[#132238]"
          >
            View Order History &amp; Track
          </button>
        </div>
      </div>
    </div>
  );
};
