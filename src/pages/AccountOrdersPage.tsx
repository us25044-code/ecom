import React, { useEffect, useState } from 'react';
import { Heart, LogOut, Package, Search, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatInr } from '../lib/media';
import type { Order } from '../types';
import { ProductCard } from '../components/ProductCard';

export const AccountOrdersPage: React.FC = () => {
  const {
    customer,
    customerToken,
    setCustomerSession,
    products,
    navigate,
  } = useStore();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [trackNumber, setTrackNumber] = useState('');
  const [trackContact, setTrackContact] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerToken) {
      setMyOrders([]);
      return;
    }
    setOrdersLoading(true);
    fetch('/api/orders/my', {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
      .then((r) => r.json())
      .then((data: { orders?: Order[] }) => {
        setMyOrders(data.orders || []);
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [customerToken]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint =
        authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          authMode === 'login'
            ? { email, password }
            : { fullName, email, phone, password },
        ),
      });
      const data = (await res.json()) as {
        token?: string;
        customer?: {
          id: string;
          fullName: string;
          email: string;
          phone: string;
          wishlist: string[];
        };
        error?: string;
      };
      if (!res.ok || !data.token || !data.customer) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }
      setCustomerSession(data.token, data.customer);
    } catch {
      setAuthError('Unable to reach server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackedOrder(null);
    if (!trackNumber.trim()) return;
    try {
      const headers: Record<string, string> = {};
      if (customerToken) headers.Authorization = `Bearer ${customerToken}`;
      const res = await fetch(
        `/api/orders/track/${encodeURIComponent(
          trackNumber.trim(),
        )}?contact=${encodeURIComponent(trackContact.trim())}`,
        { headers },
      );
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setTrackError(data.error || 'Order not found.');
        return;
      }
      setTrackedOrder(data.order);
    } catch {
      setTrackError('Unable to check order status.');
    }
  };

  const wishlistProducts = products.filter((p) =>
    customer?.wishlist.includes(p.id),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Customer Auth or Profile */}
        <div className="lg:col-span-5">
          {customer ? (
            <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#132238] text-white flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-display text-lg font-bold text-[#132238]">
                      {customer.fullName}
                    </h1>
                    <p className="text-xs text-[#5A5D65]">{customer.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerSession(null, null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7DFD1] bg-white text-xs font-semibold text-[#132238] hover:border-[#132238]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
              {customer.phone && (
                <p className="text-xs text-[#5A5D65]">
                  Mobile: {customer.phone}
                </p>
              )}
              <div className="pt-3 border-t border-[#E7DFD1] flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/return-reward')}
                  className="text-xs font-semibold text-[#132238] underline"
                >
                  Register Return &amp; Reward
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="text-xs font-semibold text-[#132238] underline"
                >
                  Shop Collection
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E7DFD1] space-y-5">
              <div className="flex gap-2 p-1 rounded-xl bg-[#F6F1E7]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    authMode === 'login'
                      ? 'bg-white text-[#132238] shadow-xs'
                      : 'text-[#5A5D65]'
                  }`}
                >
                  Customer Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    authMode === 'register'
                      ? 'bg-white text-[#132238] shadow-xs'
                      : 'text-[#5A5D65]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#132238] mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm focus:outline-none focus:border-[#132238]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#132238] mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Optional 10-digit number"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm focus:outline-none focus:border-[#132238]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#132238] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm focus:outline-none focus:border-[#132238]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#132238] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm focus:outline-none focus:border-[#132238]"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-red-700">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] disabled:opacity-60 transition-colors"
                >
                  {authLoading
                    ? 'Please wait...'
                    : authMode === 'login'
                      ? 'Sign In'
                      : 'Register Account'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Order Tracking + Order History */}
        <div className="lg:col-span-7 space-y-8">
          <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-4">
            <div className="flex items-center gap-2 text-[#132238]">
              <Search className="w-5 h-5 text-[#1E5AA8]" />
              <h2 className="font-display text-lg font-bold">
                Track Your Order
              </h2>
            </div>
            <form
              onSubmit={handleTrackOrder}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <input
                type="text"
                required
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                placeholder="Order No. (e.g. GS-2026-1001)"
                className="px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-white text-xs font-mono-num uppercase focus:outline-none focus:border-[#132238]"
              />
              <input
                type="text"
                value={trackContact}
                onChange={(e) => setTrackContact(e.target.value)}
                placeholder="Order Email or Mobile"
                className="px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-white text-xs focus:outline-none focus:border-[#132238]"
              />
              <button
                type="submit"
                className="py-2.5 px-4 rounded-lg bg-[#132238] text-white text-xs font-semibold hover:bg-[#1E5AA8] transition-colors"
              >
                Check Status
              </button>
            </form>

            {trackError && (
              <p className="text-xs text-red-700">{trackError}</p>
            )}

            {trackedOrder && (
              <div className="p-4 rounded-xl bg-white border border-[#E7DFD1] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono-num font-bold text-[#132238]">
                    {trackedOrder.orderNumber}
                  </span>
                  <span className="font-semibold text-[#132238] capitalize">
                    Status: {trackedOrder.orderStatus} · Payment:{' '}
                    {trackedOrder.paymentStatus}
                  </span>
                </div>
                <p className="text-[#5A5D65]">
                  {trackedOrder.items
                    .map(
                      (i) => `${i.productName} (${i.sizeLabel} × ${i.quantity})`,
                    )
                    .join(', ')}
                </p>
                <p className="text-[#5A5D65]">
                  Total: {formatInr(trackedOrder.totalAmount)} · Est. Delivery:{' '}
                  {trackedOrder.estimatedDelivery}
                </p>
              </div>
            )}
          </div>

          {customer && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#132238]">
                <Package className="w-5 h-5 text-[#1E5AA8]" />
                <h2 className="font-display text-lg font-bold">
                  Your Order History
                </h2>
              </div>

              {ordersLoading ? (
                <p className="text-sm text-[#5A5D65]">Loading orders...</p>
              ) : myOrders.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] text-sm text-[#5A5D65]">
                  You have not placed any orders under this account yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl bg-white border border-[#E7DFD1] space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono-num text-sm font-bold text-[#132238]">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs font-semibold text-[#132238] capitalize">
                          {order.orderStatus} · {order.paymentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-[#5A5D65]">
                        {order.items
                          .map(
                            (i) =>
                              `${i.productName} (${i.sizeLabel} × ${i.quantity})`,
                          )
                          .join(' · ')}
                      </p>
                      <div className="flex justify-between text-xs text-[#5A5D65] pt-1">
                        <span>
                          Placed{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </span>
                        <span className="font-mono-num font-bold text-[#132238]">
                          {formatInr(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Saved Wishlist */}
      {customer && (
        <section className="pt-8 border-t border-[#E7DFD1]">
          <div className="flex items-center gap-2 text-[#132238] mb-6">
            <Heart className="w-5 h-5 text-[#C26D3A]" />
            <h2 className="font-display text-xl font-bold">Saved Wishlist</h2>
          </div>
          {wishlistProducts.length === 0 ? (
            <p className="text-sm text-[#5A5D65]">
              No saved shoes yet. Tap the Wishlist button on any product page.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {wishlistProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
