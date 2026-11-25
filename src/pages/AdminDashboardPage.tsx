import React, { useCallback, useEffect, useState } from 'react';
import {
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatInr } from '../lib/media';
import type {
  Coupon,
  Order,
  OrderStatus,
  Product,
  ReturnRequest,
  Review,
  SiteConfig,
} from '../types';

interface AdminOverview {
  products: Product[];
  orders: Order[];
  customers: Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    createdAt: string;
    orderCount: number;
  }>;
  coupons: Coupon[];
  returnRequests: ReturnRequest[];
  reviews: Review[];
  newsletterSubscribers: Array<{ id: string; email: string; createdAt: string }>;
  contactSubmissions: Array<{
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
  }>;
  config: SiteConfig;
}

export const AdminDashboardPage: React.FC = () => {
  const { adminToken, setAdminToken, refreshStorefront } = useStore();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [tab, setTab] = useState<
    | 'orders'
    | 'products'
    | 'customers'
    | 'coupons'
    | 'returns'
    | 'reviews'
    | 'config'
    | 'setup'
  >('orders');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [busyMsg, setBusyMsg] = useState<string | null>(null);

  // Coupon form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'flat' | 'percent'>('flat');
  const [newCouponValue, setNewCouponValue] = useState('100');
  const [newCouponMin, setNewCouponMin] = useState('999');

  // Product edit modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProdModal, setNewProdModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSlug, setNewProdSlug] = useState('');
  const [newProdCat, setNewProdCat] = useState<'boys' | 'girls' | 'pe'>('boys');
  const [newProdPrice, setNewProdPrice] = useState('1499');
  const [newProdColor, setNewProdColor] = useState('Classic Black');

  // Config draft
  const [configDraft, setConfigDraft] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetch('/api/admin/status')
      .then((r) => r.json())
      .then((res: { needsSetup: boolean }) => {
        setNeedsSetup(res.needsSetup);
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  const loadOverview = useCallback(async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/overview', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status === 401 || res.status === 403) {
      setAdminToken(null);
      return;
    }
    if (res.ok) {
      const overview = (await res.json()) as AdminOverview;
      setData(overview);
      setConfigDraft(overview.config);
    }
  }, [adminToken, setAdminToken]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = needsSetup ? '/api/admin/claim' : '/api/admin/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    const body = (await res.json()) as { token?: string; error?: string };
    if (!res.ok || !body.token) {
      setAuthError(body.error || 'Authentication failed.');
      return;
    }
    setPasscode('');
    setNeedsSetup(false);
    setAdminToken(body.token);
  };

  const handleOrderStatus = async (orderId: string, orderStatus: OrderStatus) => {
    if (!adminToken) return;
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus }),
    });
    await loadOverview();
  };

  const handleSaveProduct = async () => {
    if (!adminToken || !editingProduct) return;
    setBusyMsg('Saving product...');
    await fetch(`/api/admin/products/${editingProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(editingProduct),
    });
    setEditingProduct(null);
    await loadOverview();
    await refreshStorefront();
    setBusyMsg('Product updated.');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: newProdName,
        slug: newProdSlug,
        category: newProdCat,
        price: Number(newProdPrice),
        color: newProdColor,
      }),
    });
    if (res.ok) {
      setNewProdModal(false);
      setNewProdName('');
      setNewProdSlug('');
      await loadOverview();
      await refreshStorefront();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!adminToken || !editingProduct) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ filename: file.name, dataUrl }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (res.ok && body.url) {
        setEditingProduct({
          ...editingProduct,
          images: [
            ...editingProduct.images,
            {
              id: `img-${Date.now()}`,
              url: body.url,
              label: 'Uploaded Angle',
            },
          ],
        });
      } else {
        setBusyMsg(body.error || 'Upload failed.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        code: newCouponCode,
        discountType: newCouponType,
        discountValue: Number(newCouponValue),
        minOrderAmount: Number(newCouponMin),
      }),
    });
    setNewCouponCode('');
    await loadOverview();
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !configDraft) return;
    setBusyMsg('Saving configuration...');
    await fetch('/api/admin/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(configDraft),
    });
    await loadOverview();
    await refreshStorefront();
    setBusyMsg('Storefront configuration saved.');
  };

  if (statusLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-sm text-[#5A5D65]">
        Checking admin session...
      </div>
    );
  }

  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="p-7 rounded-2xl bg-white border border-[#E7DFD1] space-y-5">
          <div className="flex items-center gap-3 text-[#132238]">
            <div className="w-10 h-10 rounded-xl bg-[#FBF5EA] border border-[#E7DFD1] flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#132238]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">
                {needsSetup ? 'Set Store Admin Passcode' : 'GrowStep Store Admin'}
              </h1>
              <p className="text-xs text-[#5A5D65]">
                {needsSetup
                  ? 'First-run setup: create a passcode (8+ characters) to protect the admin dashboard.'
                  : 'Enter your store admin passcode to manage products, inventory, and orders.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#132238] mb-1">
                Admin Passcode
              </label>
              <input
                type="password"
                required
                minLength={needsSetup ? 8 : 1}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={needsSetup ? 'Minimum 8 characters' : 'Enter passcode'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm focus:outline-none focus:border-[#132238]"
              />
            </div>
            {authError && <p className="text-xs text-red-700">{authError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
            >
              {needsSetup ? 'Claim Admin Access' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E7DFD1]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#132238]">
            GrowStep Admin Dashboard
          </h1>
          <p className="text-xs text-[#5A5D65] mt-1">
            Manage products, Indian size IND 10–4 inventory, orders, coupons,
            returns, reviews, and storefront settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {busyMsg && (
            <span className="text-xs font-medium text-[#1E5AA8]">{busyMsg}</span>
          )}
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-xs font-semibold text-[#132238] hover:border-[#132238]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminToken(null)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F6F1E7] border border-[#E7DFD1] text-xs font-semibold text-[#132238]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1]">
            <p className="text-xs text-[#5A5D65]">Total Orders</p>
            <p className="font-mono-num text-2xl font-bold text-[#132238] mt-1">
              {data.orders.length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1]">
            <p className="text-xs text-[#5A5D65]">Active Products</p>
            <p className="font-mono-num text-2xl font-bold text-[#132238] mt-1">
              {data.products.length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1]">
            <p className="text-xs text-[#5A5D65]">Registered Customers</p>
            <p className="font-mono-num text-2xl font-bold text-[#132238] mt-1">
              {data.customers.length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1]">
            <p className="text-xs text-[#5A5D65]">Return Requests</p>
            <p className="font-mono-num text-2xl font-bold text-[#132238] mt-1">
              {data.returnRequests.length}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-[#F6F1E7] p-1.5 rounded-xl border border-[#E7DFD1]">
        {[
          { id: 'orders', label: 'Orders' },
          { id: 'products', label: 'Products & Stock' },
          { id: 'customers', label: 'Customers' },
          { id: 'coupons', label: 'Coupons' },
          { id: 'returns', label: 'Returns' },
          { id: 'reviews', label: 'Reviews' },
          { id: 'config', label: 'Content & Shipping' },
          { id: 'setup', label: 'Razorpay / Supabase / Vercel' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'bg-white text-[#132238] shadow-xs'
                : 'text-[#5A5D65] hover:text-[#132238]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && data && (
        <div className="space-y-4">
          {data.orders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] text-center text-sm text-[#5A5D65]">
              No orders placed yet. Complete a test checkout to view orders here.
            </div>
          ) : (
            <div className="space-y-3">
              {data.orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-white border border-[#E7DFD1] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono-num text-sm font-bold text-[#132238]">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-[#5A5D65]">
                        {order.customerName} · {order.customerPhone} ·{' '}
                        {order.city}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A5D65]">
                      {order.items
                        .map(
                          (i) =>
                            `${i.productName} (${i.sizeLabel} × ${i.quantity})`,
                        )
                        .join(', ')}
                    </p>
                    <p className="text-xs text-[#5A5D65]">
                      Payment:{' '}
                      <strong className="text-[#132238]">
                        {order.paymentMethod.toUpperCase()}
                      </strong>{' '}
                      ({order.paymentStatus}) · Total:{' '}
                      <strong className="font-mono-num text-[#132238]">
                        {formatInr(order.totalAmount)}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[#132238]">
                      Status:
                    </label>
                    <select
                      value={order.orderStatus}
                      onChange={(e) =>
                        handleOrderStatus(
                          order.id,
                          e.target.value as OrderStatus,
                        )
                      }
                      className="px-3 py-2 rounded-lg border border-[#E7DFD1] text-xs font-semibold text-[#132238] bg-[#FCFBF8]"
                    >
                      {[
                        'placed',
                        'confirmed',
                        'packed',
                        'shipped',
                        'delivered',
                        'cancelled',
                      ].map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products & Stock Tab */}
      {tab === 'products' && data && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setNewProdModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#132238] text-white text-xs font-semibold hover:bg-[#1E5AA8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {data.products.map((prod) => (
              <div
                key={prod.id}
                className="p-5 rounded-2xl bg-white border border-[#E7DFD1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="font-display text-base font-bold text-[#132238]">
                    {prod.name}
                  </p>
                  <p className="text-xs text-[#5A5D65]">
                    Price:{' '}
                    <strong className="font-mono-num text-[#132238]">
                      {formatInr(prod.price)}
                    </strong>{' '}
                    · Photos: {prod.images.length} · Total Stock:{' '}
                    <span className="font-mono-num font-semibold text-[#132238]">
                      {prod.sizes.reduce((s, x) => s + x.stockQty, 0)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(structuredClone(prod))}
                  className="px-4 py-2 rounded-lg border border-[#132238] text-xs font-semibold text-[#132238] hover:bg-[#F6F1E7]"
                >
                  Edit Price, Photos &amp; Indian Sizes
                </button>
              </div>
            ))}
          </div>

          {editingProduct && (
            <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-[#132238]">
                  Editing: {editingProduct.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-xs font-semibold text-[#5A5D65] hover:text-[#132238]"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#132238] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#132238] mb-1">
                    Selling Price (INR)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#132238] mb-1">
                    Original Price (Optional MRP)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        originalPrice: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-sm font-mono-num"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#132238] mb-2">
                  Indian Sizes, Configurable Foot Length (cm) &amp; Stock
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {editingProduct.sizes.map((s, idx) => (
                    <div
                      key={s.sizeLabel}
                      className="p-2.5 rounded-lg bg-white border border-[#E7DFD1] space-y-1.5 text-xs"
                    >
                      <p className="font-bold text-[#132238]">{s.sizeLabel}</p>
                      <label className="block text-[10px] text-[#5A5D65]">
                        cm
                        <input
                          type="number"
                          step="0.1"
                          value={s.footLengthCm}
                          onChange={(e) => {
                            const next = [...editingProduct.sizes];
                            next[idx] = {
                              ...next[idx],
                              footLengthCm: Number(e.target.value),
                            };
                            setEditingProduct({ ...editingProduct, sizes: next });
                          }}
                          className="w-full mt-0.5 px-2 py-1 border border-[#E7DFD1] rounded font-mono-num"
                        />
                      </label>
                      <label className="block text-[10px] text-[#5A5D65]">
                        Stock
                        <input
                          type="number"
                          value={s.stockQty}
                          onChange={(e) => {
                            const next = [...editingProduct.sizes];
                            next[idx] = {
                              ...next[idx],
                              stockQty: Number(e.target.value),
                            };
                            setEditingProduct({ ...editingProduct, sizes: next });
                          }}
                          className="w-full mt-0.5 px-2 py-1 border border-[#E7DFD1] rounded font-mono-num"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#132238]">
                    Product Photographs ({editingProduct.images.length})
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E7DFD1] text-xs font-semibold text-[#132238] cursor-pointer hover:border-[#132238]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {editingProduct.images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="p-2 rounded-lg bg-white border border-[#E7DFD1] flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{img.label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingProduct({
                            ...editingProduct,
                            images: editingProduct.images.filter(
                              (_, i) => i !== idx,
                            ),
                          })
                        }
                        className="text-red-700 shrink-0"
                        aria-label="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProduct}
                className="px-6 py-2.5 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
              >
                Save Product Changes
              </button>
            </div>
          )}

          {newProdModal && (
            <form
              onSubmit={handleCreateProduct}
              className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-4"
            >
              <div className="flex justify-between">
                <h3 className="font-display text-base font-bold text-[#132238]">
                  Add New Product
                </h3>
                <button
                  type="button"
                  onClick={() => setNewProdModal(false)}
                  className="text-xs text-[#5A5D65]"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Product Name"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="url-slug"
                  value={newProdSlug}
                  onChange={(e) => setNewProdSlug(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-sm"
                />
                <select
                  value={newProdCat}
                  onChange={(e) =>
                    setNewProdCat(e.target.value as 'boys' | 'girls' | 'pe')
                  }
                  className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-sm"
                >
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                  <option value="pe">White PE</option>
                </select>
                <input
                  type="number"
                  required
                  placeholder="Price INR"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Colour"
                  value={newProdColor}
                  onChange={(e) => setNewProdColor(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#132238] text-white text-xs font-semibold hover:bg-[#1E5AA8]"
                >
                  Create Product
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Customers Tab */}
      {tab === 'customers' && data && (
        <div className="space-y-4">
          {data.customers.length === 0 ? (
            <p className="text-sm text-[#5A5D65]">
              No registered customers yet.
            </p>
          ) : (
            <div className="overflow-x-auto border border-[#E7DFD1] rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F1E7] text-[#132238]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Phone</th>
                    <th className="py-3 px-4 font-semibold">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DFD1] bg-white">
                  {data.customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4 font-semibold text-[#132238]">
                        {c.fullName}
                      </td>
                      <td className="py-3 px-4">{c.email}</td>
                      <td className="py-3 px-4 font-mono-num">
                        {c.phone || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono-num">
                        {c.orderCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Coupons Tab */}
      {tab === 'coupons' && data && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateCoupon}
            className="p-5 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] grid grid-cols-1 sm:grid-cols-5 gap-3"
          >
            <input
              type="text"
              required
              placeholder="CODE"
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-xs uppercase"
            />
            <select
              value={newCouponType}
              onChange={(e) =>
                setNewCouponType(e.target.value as 'flat' | 'percent')
              }
              className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-xs"
            >
              <option value="flat">Flat INR Off</option>
              <option value="percent">Percent % Off</option>
            </select>
            <input
              type="number"
              required
              placeholder="Value"
              value={newCouponValue}
              onChange={(e) => setNewCouponValue(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-xs font-mono-num"
            />
            <input
              type="number"
              required
              placeholder="Min Order INR"
              value={newCouponMin}
              onChange={(e) => setNewCouponMin(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#E7DFD1] bg-white text-xs font-mono-num"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#132238] text-white text-xs font-semibold hover:bg-[#1E5AA8]"
            >
              Add Coupon
            </button>
          </form>

          <div className="space-y-2">
            {data.coupons.map((cpn) => (
              <div
                key={cpn.id}
                className="p-4 rounded-xl bg-white border border-[#E7DFD1] flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-mono-num font-bold text-[#132238] mr-3">
                    {cpn.code}
                  </span>
                  <span className="text-[#5A5D65]">
                    {cpn.discountType === 'flat'
                      ? `${formatInr(cpn.discountValue)} off`
                      : `${cpn.discountValue}% off`}{' '}
                    (Min {formatInr(cpn.minOrderAmount)})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/admin/coupons/${cpn.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${adminToken}`,
                        },
                        body: JSON.stringify({ isActive: !cpn.isActive }),
                      });
                      await loadOverview();
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#E7DFD1] font-semibold text-[#132238] hover:border-[#132238]"
                  >
                    {cpn.isActive ? 'Active (Disable)' : 'Inactive (Enable)'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/admin/coupons/${cpn.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${adminToken}` },
                      });
                      await loadOverview();
                    }}
                    className="text-red-700 p-1"
                    aria-label="Delete coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Returns Tab */}
      {tab === 'returns' && data && (
        <div className="space-y-3">
          {data.returnRequests.length === 0 ? (
            <p className="text-sm text-[#5A5D65]">
              No return or exchange requests yet.
            </p>
          ) : (
            data.returnRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-2xl bg-white border border-[#E7DFD1] flex flex-col sm:flex-row justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <p className="font-bold text-[#132238]">
                    {req.orderNumber} · {req.requestType.replace('_', ' ')}
                  </p>
                  <p className="text-[#5A5D65]">
                    {req.customerName} ({req.customerEmail}, {req.customerPhone})
                  </p>
                  <p className="text-[#5A5D65]">{req.reason}</p>
                </div>
                <select
                  value={req.status}
                  onChange={async (e) => {
                    await fetch(`/api/admin/returns/${req.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${adminToken}`,
                      },
                      body: JSON.stringify({ status: e.target.value }),
                    });
                    await loadOverview();
                  }}
                  className="self-start px-3 py-2 rounded-lg border border-[#E7DFD1] font-semibold text-[#132238] bg-[#FCFBF8]"
                >
                  {[
                    'requested',
                    'approved',
                    'pickup_scheduled',
                    'completed',
                    'rejected',
                  ].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && data && (
        <div className="space-y-3">
          {data.reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-xl bg-white border border-[#E7DFD1] flex items-center justify-between gap-4 text-xs"
            >
              <div>
                <p className="font-bold text-[#132238]">
                  {rev.authorName} · {rev.productName} ({rev.rating}/5)
                </p>
                <p className="text-[#5A5D65] mt-1">{rev.comment}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/admin/reviews/${rev.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${adminToken}`,
                    },
                    body: JSON.stringify({
                      status:
                        rev.status === 'published' ? 'hidden' : 'published',
                    }),
                  });
                  await loadOverview();
                  await refreshStorefront();
                }}
                className="px-3 py-1.5 rounded-lg border border-[#E7DFD1] font-semibold text-[#132238] hover:border-[#132238] shrink-0"
              >
                {rev.status === 'published' ? 'Hide' : 'Publish'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Content & Shipping Config Tab */}
      {tab === 'config' && configDraft && (
        <form
          onSubmit={handleSaveConfig}
          className="p-6 rounded-2xl bg-white border border-[#E7DFD1] space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#132238] mb-1">
                Hero Headline
              </label>
              <input
                type="text"
                value={configDraft.heroHeadline}
                onChange={(e) =>
                  setConfigDraft({ ...configDraft, heroHeadline: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#132238] mb-1">
                Hero Subheading
              </label>
              <input
                type="text"
                value={configDraft.heroSubheading}
                onChange={(e) =>
                  setConfigDraft({
                    ...configDraft,
                    heroSubheading: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#132238] mb-1">
                Flat Shipping Charge (INR)
              </label>
              <input
                type="number"
                value={configDraft.shippingFlatRate}
                onChange={(e) =>
                  setConfigDraft({
                    ...configDraft,
                    shippingFlatRate: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#132238] mb-1">
                Free Shipping Threshold (INR)
              </label>
              <input
                type="number"
                value={configDraft.freeShippingThreshold}
                onChange={(e) =>
                  setConfigDraft({
                    ...configDraft,
                    freeShippingThreshold: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#132238] mb-1">
                Support Email
              </label>
              <input
                type="text"
                value={configDraft.supportEmail}
                onChange={(e) =>
                  setConfigDraft({
                    ...configDraft,
                    supportEmail: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#132238] mb-1">
                Support Phone
              </label>
              <input
                type="text"
                value={configDraft.supportPhone}
                onChange={(e) =>
                  setConfigDraft({
                    ...configDraft,
                    supportPhone: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#132238]">
            <input
              type="checkbox"
              checked={configDraft.codEnabled}
              onChange={(e) =>
                setConfigDraft({ ...configDraft, codEnabled: e.target.checked })
              }
              className="accent-[#132238]"
            />
            <span>Enable Cash on Delivery (COD) at Checkout</span>
          </label>

          <div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
            >
              Save Storefront Settings
            </button>
          </div>
        </form>
      )}

      {/* Setup & Deployment Guide Tab */}
      {tab === 'setup' && (
        <div className="p-6 rounded-2xl bg-white border border-[#E7DFD1] space-y-5 text-sm text-[#5A5D65] leading-relaxed">
          <h2 className="font-display text-xl font-bold text-[#132238]">
            Production Configuration &amp; Deployment Checklist
          </h2>
          <div>
            <h3 className="font-semibold text-[#132238]">
              1. Switching Razorpay from Test Mode to Live Mode
            </h3>
            <p className="text-xs mt-1">
              Set <code>RAZORPAY_KEY_ID</code> (<code>rzp_test_...</code> for
              test, <code>rzp_live_...</code> for live) and{' '}
              <code>RAZORPAY_KEY_SECRET</code> in your server environment
              variables. Server-side HMAC-SHA256 verification automatically
              activates without changing code.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#132238]">
              2. Supabase PostgreSQL Schema
            </h3>
            <p className="text-xs mt-1">
              A complete PostgreSQL schema covering products, product_images,
              product_sizes, inventory, customers, orders, order_items,
              payments, reviews, wishlists, coupons, and return_requests is
              included in <code>supabase-schema.sql</code>.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#132238]">
              3. Local Run &amp; Production Build
            </h3>
            <p className="text-xs mt-1">
              Run <code>npm install</code> then <code>npm run dev</code> locally
              on port 3000. For production hosting (Vercel / Node server), build
              with <code>npm run build</code> and set environment variables
              from <code>.env.example</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
