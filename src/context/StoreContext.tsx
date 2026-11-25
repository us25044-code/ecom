import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type {
  CartItem,
  Order,
  Product,
  Review,
  SiteConfig,
  StorefrontPayload,
} from '../types';

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  wishlist: string[];
}

interface StoreContextValue {
  path: string;
  navigate: (to: string) => void;
  loading: boolean;
  error: string | null;
  products: Product[];
  reviews: Review[];
  config: SiteConfig | null;
  razorpayConfigured: boolean;
  razorpayKeyId: string | null;
  refreshStorefront: () => Promise<void>;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  addToCart: (item: CartItem, openDrawer?: boolean) => void;
  updateCartQty: (productId: string, sizeLabel: string, qty: number) => void;
  removeFromCart: (productId: string, sizeLabel: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  recentlyViewed: string[];
  recordViewed: (productId: string) => void;
  customerToken: string | null;
  customer: CustomerProfile | null;
  setCustomerSession: (token: string | null, profile: CustomerProfile | null) => void;
  toggleWishlist: (productId: string) => Promise<void>;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  lastConfirmedOrder: Order | null;
  setLastConfirmedOrder: (order: Order | null) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'growstep_cart_v2';
const RECENT_STORAGE_KEY = 'growstep_recent_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [path, setPath] = useState<string>(
    () => window.location.pathname || '/',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  // Auth tokens live strictly in React memory (never localStorage)
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(
    null,
  );

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch {
      // ignore
    }
  }, [recentlyViewed]);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    const onPop = () => {
      setPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const refreshStorefront = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/storefront');
      if (!res.ok) throw new Error('Unable to load GrowStep catalog.');
      const data = (await res.json()) as StorefrontPayload;
      setProducts(data.products);
      setReviews(data.reviews);
      setConfig(data.config);
      setRazorpayConfigured(data.razorpayConfigured);
      setRazorpayKeyId(data.razorpayKeyId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load storefront.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStorefront();
  }, [refreshStorefront]);

  // Dynamic SEO document title per route
  useEffect(() => {
    const base = 'GrowStep — Adaptive School Footwear';
    if (path.startsWith('/products/')) {
      const slug = path.replace('/products/', '');
      const prod = products.find((p) => p.slug === slug);
      document.title = prod ? `${prod.name} | ${base}` : base;
    } else if (path === '/shop') {
      document.title = `Shop School Shoes | ${base}`;
    } else if (path === '/about') {
      document.title = `About Us | ${base}`;
    } else if (path === '/return-reward') {
      document.title = `Return & Reward Programme | ${base}`;
    } else if (path === '/faqs') {
      document.title = `FAQs | ${base}`;
    } else if (path === '/checkout') {
      document.title = `Checkout | ${base}`;
    } else if (path === '/admin') {
      document.title = `Admin Dashboard | ${base}`;
    } else {
      document.title = `GrowStep — School Shoes That Grow With Them`;
    }
  }, [path, products]);

  const addToCart = useCallback((item: CartItem, openDrawer = true) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (c) => c.productId === item.productId && c.sizeLabel === item.sizeLabel,
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: Math.min(10, updated[existingIdx].quantity + item.quantity),
        };
        return updated;
      }
      return [...prev, item];
    });
    if (openDrawer) setCartOpen(true);
  }, []);

  const updateCartQty = useCallback(
    (productId: string, sizeLabel: string, qty: number) => {
      if (qty <= 0) {
        setCart((prev) =>
          prev.filter(
            (c) => !(c.productId === productId && c.sizeLabel === sizeLabel),
          ),
        );
        return;
      }
      setCart((prev) =>
        prev.map((c) =>
          c.productId === productId && c.sizeLabel === sizeLabel
            ? { ...c, quantity: Math.min(10, qty) }
            : c,
        ),
      );
    },
    [],
  );

  const removeFromCart = useCallback((productId: string, sizeLabel: string) => {
    setCart((prev) =>
      prev.filter((c) => !(c.productId === productId && c.sizeLabel === sizeLabel)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const recordViewed = useCallback((productId: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 4);
    });
  }, []);

  const setCustomerSession = useCallback(
    (token: string | null, profile: CustomerProfile | null) => {
      setCustomerToken(token);
      setCustomer(profile);
    },
    [],
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!customerToken || !customer) {
        navigate('/account');
        return;
      }
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { wishlist: string[] };
        setCustomer({ ...customer, wishlist: data.wishlist });
      }
    },
    [customerToken, customer, navigate],
  );

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );

  return (
    <StoreContext.Provider
      value={{
        path,
        navigate,
        loading,
        error,
        products,
        reviews,
        config,
        razorpayConfigured,
        razorpayKeyId,
        refreshStorefront,
        cart,
        cartOpen,
        setCartOpen,
        searchOpen,
        setSearchOpen,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        recentlyViewed,
        recordViewed,
        customerToken,
        customer,
        setCustomerSession,
        toggleWishlist,
        adminToken,
        setAdminToken,
        lastConfirmedOrder,
        setLastConfirmedOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
