import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  loadDb,
  saveDb,
  type DatabaseSchema,
  type StoredCustomer,
} from './server/store.ts';
import type {
  Coupon,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ReturnRequest,
  Review,
} from './src/types.ts';

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

interface TokenPayload {
  sub: string;
  role: 'customer' | 'admin';
  email?: string;
  exp: number;
}

function signToken(payload: Omit<TokenPayload, 'exp'>): string {
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(body)
    .digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(body)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8'),
    ) as TokenPayload;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

interface AuthenticatedRequest extends Request {
  auth?: TokenPayload;
}

function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  const token = getBearerToken(req);
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) req.auth = decoded;
  }
  next();
}

function requireCustomer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'customer') {
    res.status(401).json({ error: 'Invalid or expired customer session' });
    return;
  }
  req.auth = decoded;
  next();
}

function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Admin authentication required' });
    return;
  }
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  req.auth = decoded;
  next();
}

function sanitizeString(input: unknown, maxLen = 500): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLen);
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (
    url.startsWith('/src/assets/') ||
    url.startsWith('/assets/aistudio/') ||
    url.startsWith('/uploads/')
  ) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function computeShipping(
  subtotal: number,
  db: DatabaseSchema,
): { shippingCharge: number } {
  if (subtotal <= 0) return { shippingCharge: 0 };
  if (subtotal >= db.config.freeShippingThreshold) {
    return { shippingCharge: 0 };
  }
  return { shippingCharge: Math.max(0, Math.round(db.config.shippingFlatRate)) };
}

function computeDiscount(
  subtotal: number,
  codeRaw: string | undefined,
  db: DatabaseSchema,
): { coupon: Coupon | null; discountAmount: number; error?: string } {
  const code = sanitizeString(codeRaw, 40).toUpperCase();
  if (!code) return { coupon: null, discountAmount: 0 };
  const coupon = db.coupons.find(
    (c) => c.code.toUpperCase() === code && c.isActive,
  );
  if (!coupon) {
    return {
      coupon: null,
      discountAmount: 0,
      error: 'Invalid or inactive discount code.',
    };
  }
  if (subtotal < coupon.minOrderAmount) {
    return {
      coupon: null,
      discountAmount: 0,
      error: `Minimum order of ₹${coupon.minOrderAmount} required for ${coupon.code}.`,
    };
  }
  const rawDiscount =
    coupon.discountType === 'flat'
      ? coupon.discountValue
      : Math.round((subtotal * coupon.discountValue) / 100);
  const discountAmount = Math.min(subtotal, Math.max(0, rawDiscount));
  return { coupon, discountAmount };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'growstep-api' });
  });

  app.get('/api/storefront', (_req, res) => {
    const db = loadDb();
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim() || null;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || null;
    res.json({
      products: db.products.filter((p) => p.isActive),
      reviews: db.reviews.filter((r) => r.status === 'published'),
      config: db.config,
      razorpayConfigured: Boolean(razorpayKeyId && razorpaySecret),
      razorpayKeyId,
    });
  });

  app.post('/api/coupons/validate', (req, res) => {
    const db = loadDb();
    const subtotal = Number(req.body?.subtotal) || 0;
    const code = sanitizeString(req.body?.code, 40);
    const result = computeDiscount(subtotal, code, db);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    if (!result.coupon) {
      res.status(400).json({ error: 'Please enter a coupon code.' });
      return;
    }
    res.json({
      code: result.coupon.code,
      discountAmount: result.discountAmount,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
    });
  });

  // Customer Authentication
  app.post('/api/auth/register', (req, res) => {
    const fullName = sanitizeString(req.body?.fullName, 120);
    const email = sanitizeString(req.body?.email, 160).toLowerCase();
    const phone = sanitizeString(req.body?.phone, 20);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!fullName || !email || !email.includes('@') || password.length < 6) {
      res.status(400).json({
        error:
          'Please provide full name, valid email address, and a password of at least 6 characters.',
      });
      return;
    }

    const db = loadDb();
    if (db.customers.some((c) => c.email === email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const customer: StoredCustomer = {
      id: `cust-${crypto.randomUUID()}`,
      fullName,
      email,
      phone,
      passwordHash: hashPassword(password),
      wishlist: [],
      createdAt: new Date().toISOString(),
    };
    db.customers.push(customer);
    saveDb(db);

    const token = signToken({
      sub: customer.id,
      role: 'customer',
      email: customer.email,
    });
    res.status(201).json({
      token,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        wishlist: customer.wishlist,
      },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = sanitizeString(req.body?.email, 160).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    const db = loadDb();
    const customer = db.customers.find((c) => c.email === email);
    if (!customer || !verifyPassword(password, customer.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken({
      sub: customer.id,
      role: 'customer',
      email: customer.email,
    });
    res.json({
      token,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        wishlist: customer.wishlist,
      },
    });
  });

  app.get('/api/auth/me', requireCustomer, (req: AuthenticatedRequest, res) => {
    const db = loadDb();
    const customer = db.customers.find((c) => c.id === req.auth?.sub);
    if (!customer) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    res.json({
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        wishlist: customer.wishlist,
      },
    });
  });

  app.post(
    '/api/wishlist/toggle',
    requireCustomer,
    (req: AuthenticatedRequest, res) => {
      const productId = sanitizeString(req.body?.productId, 80);
      const db = loadDb();
      const customer = db.customers.find((c) => c.id === req.auth?.sub);
      if (!customer) {
        res.status(404).json({ error: 'Customer not found.' });
        return;
      }
      if (!db.products.some((p) => p.id === productId)) {
        res.status(404).json({ error: 'Product not found.' });
        return;
      }
      const exists = customer.wishlist.includes(productId);
      customer.wishlist = exists
        ? customer.wishlist.filter((id) => id !== productId)
        : [...customer.wishlist, productId];
      saveDb(db);
      res.json({ wishlist: customer.wishlist });
    },
  );

  // Order creation (server computes pricing, stock validation, shipping, discounts)
  app.post('/api/orders', optionalAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDb();
    const customerName = sanitizeString(req.body?.customerName, 120);
    const customerEmail = sanitizeString(req.body?.customerEmail, 160).toLowerCase();
    const customerPhone = sanitizeString(req.body?.customerPhone, 20);
    const deliveryAddress = sanitizeString(req.body?.deliveryAddress, 400);
    const city = sanitizeString(req.body?.city, 80);
    const state = sanitizeString(req.body?.state, 80);
    const pinCode = sanitizeString(req.body?.pinCode, 10);
    const paymentMethod = req.body?.paymentMethod === 'cod' ? 'cod' : 'razorpay';
    const discountCodeInput = sanitizeString(req.body?.discountCode, 40);
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

    if (
      !customerName ||
      !customerEmail.includes('@') ||
      !/^[6-9]\d{9}$/.test(customerPhone.replace(/\s+/g, '')) ||
      !deliveryAddress ||
      !city ||
      !state ||
      !/^\d{6}$/.test(pinCode)
    ) {
      res.status(400).json({
        error:
          'Please complete all shipping fields with a valid 10-digit Indian mobile number and 6-digit PIN code.',
      });
      return;
    }

    if (paymentMethod === 'cod' && !db.config.codEnabled) {
      res.status(400).json({ error: 'Cash on Delivery is currently disabled.' });
      return;
    }

    if (rawItems.length === 0) {
      res.status(400).json({ error: 'Your cart is empty.' });
      return;
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const raw of rawItems) {
      const productId = sanitizeString(raw?.productId, 80);
      const sizeLabel = sanitizeString(raw?.sizeLabel, 20);
      const quantity = Math.floor(Number(raw?.quantity));
      if (!productId || !sizeLabel || !Number.isFinite(quantity) || quantity < 1 || quantity > 10) {
        res.status(400).json({ error: 'Invalid cart item or quantity.' });
        return;
      }
      const product = db.products.find((p) => p.id === productId && p.isActive);
      if (!product) {
        res.status(404).json({ error: 'One or more products are unavailable.' });
        return;
      }
      const sizeRow = product.sizes.find((s) => s.sizeLabel === sizeLabel);
      if (!sizeRow || sizeRow.stockQty < quantity) {
        res.status(409).json({
          error: `Insufficient stock for ${product.name} (${sizeLabel}).`,
        });
        return;
      }
      subtotal += product.price * quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        sizeLabel,
        unitPrice: product.price,
        quantity,
        imageUrl: product.images[0]?.url || '',
      });
    }

    const { shippingCharge } = computeShipping(subtotal, db);
    const discountResult = computeDiscount(subtotal, discountCodeInput, db);
    if (discountCodeInput && discountResult.error) {
      res.status(400).json({ error: discountResult.error });
      return;
    }
    const codFee = paymentMethod === 'cod' ? db.config.codFee : 0;
    const totalAmount = Math.max(
      1,
      subtotal + shippingCharge + codFee - discountResult.discountAmount,
    );

    const orderNumber = `GS-${new Date().getFullYear()}-${String(
      1001 + db.orders.length,
    )}`;

    // For COD, deduct stock immediately and mark order placed + cod_pending.
    // For Razorpay, keep paymentStatus as 'pending' until server signature verification succeeds!
    if (paymentMethod === 'cod') {
      for (const item of orderItems) {
        const product = db.products.find((p) => p.id === item.productId);
        const sizeRow = product?.sizes.find((s) => s.sizeLabel === item.sizeLabel);
        if (sizeRow) sizeRow.stockQty = Math.max(0, sizeRow.stockQty - item.quantity);
      }
    }

    const order: Order = {
      id: `ord-${crypto.randomUUID()}`,
      orderNumber,
      customerId: req.auth?.role === 'customer' ? req.auth.sub : null,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      city,
      state,
      pinCode,
      deliveryOption: 'standard',
      estimatedDelivery: db.config.estimatedDeliveryWindow,
      subtotal,
      shippingCharge: shippingCharge + codFee,
      discountCode: discountResult.coupon?.code || null,
      discountAmount: discountResult.discountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
      orderStatus: 'placed',
      items: orderItems,
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(order);
    saveDb(db);

    res.status(201).json({ order });
  });

  // Server-side Razorpay Order Creation
  app.post('/api/payments/razorpay/create-order', async (req, res) => {
    const orderId = sanitizeString(req.body?.orderId, 80);
    const db = loadDb();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (order.paymentStatus === 'paid') {
      res.status(400).json({ error: 'Order is already paid.' });
      return;
    }

    const amountPaise = order.totalAmount * 100;
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (keyId && keySecret) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountPaise,
            currency: 'INR',
            receipt: order.orderNumber,
            notes: {
              growstep_order_id: order.id,
              customer_email: order.customerEmail,
            },
          }),
        });
        const rzpData = (await rzpRes.json()) as {
          id?: string;
          amount?: number;
          currency?: string;
          error?: { description?: string };
        };
        if (!rzpRes.ok || !rzpData.id) {
          res.status(502).json({
            error:
              rzpData.error?.description ||
              'Failed to create Razorpay order on gateway.',
          });
          return;
        }
        order.razorpayOrderId = rzpData.id;
        db.payments.push({
          id: `pay-${crypto.randomUUID()}`,
          orderId: order.id,
          gateway: 'razorpay',
          razorpayOrderId: rzpData.id,
          amountPaise,
          currency: 'INR',
          status: 'created',
          isTestSimulation: keyId.startsWith('rzp_test_'),
          createdAt: new Date().toISOString(),
        });
        saveDb(db);
        res.json({
          mode: 'razorpay_checkout',
          keyId,
          razorpayOrderId: rzpData.id,
          amountPaise,
          currency: 'INR',
          orderNumber: order.orderNumber,
        });
        return;
      } catch {
        res
          .status(502)
          .json({ error: 'Unable to connect to Razorpay gateway.' });
        return;
      }
    }

    // Fallback when Razorpay test/live keys are not yet configured in environment:
    // Creates a signed test-simulation order token on the server so payment is never
    // marked paid without server verification.
    const simOrderId = `order_test_${crypto.randomBytes(6).toString('hex')}`;
    const testVerificationToken = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${order.id}|${simOrderId}`)
      .digest('hex');

    order.razorpayOrderId = simOrderId;
    db.payments.push({
      id: `pay-${crypto.randomUUID()}`,
      orderId: order.id,
      gateway: 'razorpay',
      razorpayOrderId: simOrderId,
      amountPaise,
      currency: 'INR',
      status: 'created',
      isTestSimulation: true,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);

    res.json({
      mode: 'test_simulation',
      razorpayOrderId: simOrderId,
      testVerificationToken,
      amountPaise,
      currency: 'INR',
      orderNumber: order.orderNumber,
    });
  });

  // Server-side Razorpay Payment Verification
  app.post('/api/payments/razorpay/verify', (req, res) => {
    const orderId = sanitizeString(req.body?.orderId, 80);
    const razorpayOrderId = sanitizeString(req.body?.razorpay_order_id, 100);
    const razorpayPaymentId = sanitizeString(req.body?.razorpay_payment_id, 100);
    const razorpaySignature = sanitizeString(req.body?.razorpay_signature, 200);
    const testVerificationToken = sanitizeString(
      req.body?.testVerificationToken,
      200,
    );
    const testOutcome = req.body?.testOutcome === 'fail' ? 'fail' : 'success';

    const db = loadDb();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const payment = db.payments.find(
      (p) => p.orderId === order.id && p.razorpayOrderId === razorpayOrderId,
    );
    if (!payment) {
      res.status(400).json({ error: 'Matching payment session not found.' });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (keySecret && !razorpayOrderId.startsWith('order_test_')) {
      const expected = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(razorpaySignature, 'hex');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        payment.status = 'failed';
        order.paymentStatus = 'failed';
        saveDb(db);
        res.status(400).json({ error: 'Razorpay signature verification failed.' });
        return;
      }
      payment.status = 'verified';
      payment.razorpayPaymentId = razorpayPaymentId;
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      order.razorpayPaymentId = razorpayPaymentId;
      order.isTestTransaction = Boolean(
        process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_'),
      );
    } else {
      const expectedTestToken = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(`${order.id}|${razorpayOrderId}`)
        .digest('hex');
      const a = Buffer.from(expectedTestToken, 'hex');
      const b = Buffer.from(testVerificationToken, 'hex');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        res.status(400).json({ error: 'Invalid test verification token.' });
        return;
      }
      if (testOutcome === 'fail') {
        payment.status = 'failed';
        order.paymentStatus = 'failed';
        saveDb(db);
        res.status(400).json({
          error: 'Simulated test payment declined. Order remains unpaid.',
        });
        return;
      }
      const simPayId =
        razorpayPaymentId || `pay_test_${crypto.randomBytes(6).toString('hex')}`;
      payment.status = 'verified';
      payment.razorpayPaymentId = simPayId;
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      order.razorpayPaymentId = simPayId;
      order.isTestTransaction = true;
    }

    // Deduct stock only after verification succeeds
    for (const item of order.items) {
      const product = db.products.find((p) => p.id === item.productId);
      const sizeRow = product?.sizes.find((s) => s.sizeLabel === item.sizeLabel);
      if (sizeRow) {
        sizeRow.stockQty = Math.max(0, sizeRow.stockQty - item.quantity);
      }
    }

    saveDb(db);
    res.json({ verified: true, order });
  });

  // Customer order history & tracking
  app.get('/api/orders/my', requireCustomer, (req: AuthenticatedRequest, res) => {
    const db = loadDb();
    const customer = db.customers.find((c) => c.id === req.auth?.sub);
    const orders = db.orders.filter(
      (o) =>
        o.customerId === req.auth?.sub ||
        (customer && o.customerEmail === customer.email),
    );
    res.json({ orders });
  });

  app.get(
    '/api/orders/track/:orderNumber',
    optionalAuth,
    (req: AuthenticatedRequest, res) => {
      const orderNumber = sanitizeString(req.params.orderNumber, 40).toUpperCase();
      const contact = sanitizeString(req.query.contact as string, 160).toLowerCase();
      const db = loadDb();
      const order = db.orders.find(
        (o) => o.orderNumber.toUpperCase() === orderNumber,
      );
      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      const isOwner =
        req.auth?.role === 'admin' ||
        (req.auth?.role === 'customer' &&
          (order.customerId === req.auth.sub ||
            order.customerEmail === req.auth.email));
      const matchesContact =
        contact &&
        (order.customerEmail.toLowerCase() === contact ||
          order.customerPhone.replace(/\s+/g, '') ===
            contact.replace(/\s+/g, ''));

      if (!isOwner && !matchesContact) {
        res.status(403).json({
          error:
            'Please enter the email address or phone number used for this order to view tracking details.',
        });
        return;
      }
      res.json({ order });
    },
  );

  // Customer Reviews
  app.post('/api/reviews', (req, res) => {
    const productId = sanitizeString(req.body?.productId, 80);
    const authorName = sanitizeString(req.body?.authorName, 80);
    const city = sanitizeString(req.body?.city, 60);
    const rating = Math.round(Number(req.body?.rating));
    const comment = sanitizeString(req.body?.comment, 800);

    if (!productId || !authorName || !city || !comment || rating < 1 || rating > 5) {
      res.status(400).json({
        error: 'Please fill in your name, city, rating (1–5), and review comment.',
      });
      return;
    }

    const db = loadDb();
    const product = db.products.find((p) => p.id === productId);
    if (!product) {
      res.status(404).json({ error: 'Selected product not found.' });
      return;
    }

    const review: Review = {
      id: `rev-${crypto.randomUUID()}`,
      productId: product.id,
      productName: product.name,
      authorName,
      city,
      rating,
      comment,
      isSample: false,
      status: 'published',
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(review);
    saveDb(db);
    res.status(201).json({ review });
  });

  // Return & Reward + Size Exchange + Damaged Product Requests
  app.post('/api/returns', (req, res) => {
    const orderNumber = sanitizeString(req.body?.orderNumber, 40);
    const customerName = sanitizeString(req.body?.customerName, 120);
    const customerEmail = sanitizeString(req.body?.customerEmail, 160).toLowerCase();
    const customerPhone = sanitizeString(req.body?.customerPhone, 20);
    const requestType = req.body?.requestType;
    const reason = sanitizeString(req.body?.reason, 800);

    if (
      !orderNumber ||
      !customerName ||
      !customerEmail.includes('@') ||
      !customerPhone ||
      !reason ||
      !['return_reward', 'size_exchange', 'damaged_return'].includes(requestType)
    ) {
      res.status(400).json({
        error: 'Please complete all required fields for your return or exchange request.',
      });
      return;
    }

    const db = loadDb();
    const reqItem: ReturnRequest = {
      id: `ret-${crypto.randomUUID()}`,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      requestType,
      reason,
      status: 'requested',
      rewardCreditInr:
        requestType === 'return_reward' ? db.config.returnRewardMinInr : null,
      createdAt: new Date().toISOString(),
    };
    db.returnRequests.unshift(reqItem);
    saveDb(db);
    res.status(201).json({ returnRequest: reqItem });
  });

  app.post('/api/newsletter', (req, res) => {
    const email = sanitizeString(req.body?.email, 160).toLowerCase();
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    const db = loadDb();
    if (!db.newsletterSubscribers.some((n) => n.email === email)) {
      db.newsletterSubscribers.push({
        id: `sub-${crypto.randomUUID()}`,
        email,
        createdAt: new Date().toISOString(),
      });
      saveDb(db);
    }
    res.json({ subscribed: true });
  });

  app.post('/api/contact', (req, res) => {
    const name = sanitizeString(req.body?.name, 120);
    const email = sanitizeString(req.body?.email, 160).toLowerCase();
    const phone = sanitizeString(req.body?.phone, 20);
    const subject = sanitizeString(req.body?.subject, 160);
    const message = sanitizeString(req.body?.message, 1500);

    if (!name || !email.includes('@') || !message) {
      res.status(400).json({
        error: 'Please provide your name, valid email address, and message.',
      });
      return;
    }

    const db = loadDb();
    db.contactSubmissions.unshift({
      id: `msg-${crypto.randomUUID()}`,
      name,
      email,
      phone,
      subject: subject || 'General Inquiry',
      message,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    res.status(201).json({ received: true });
  });

  // Admin Authentication (First-run claim + env passcode override)
  app.get('/api/admin/status', (_req, res) => {
    const db = loadDb();
    const envPasscodeSet = Boolean(process.env.ADMIN_PASSCODE?.trim());
    const needsSetup = !envPasscodeSet && !db.adminPasswordHash;
    res.json({ needsSetup, envPasscodeSet });
  });

  app.post('/api/admin/claim', (req, res) => {
    const db = loadDb();
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode || db.adminPasswordHash) {
      res.status(409).json({
        error: 'Admin passcode is already configured. Please sign in.',
      });
      return;
    }
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    if (passcode.length < 8) {
      res.status(400).json({
        error: 'Admin passcode must be at least 8 characters long.',
      });
      return;
    }
    db.adminPasswordHash = hashPassword(passcode);
    saveDb(db);
    const token = signToken({ sub: 'admin', role: 'admin' });
    res.status(201).json({ token });
  });

  app.post('/api/admin/login', (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    const db = loadDb();
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();

    if (envPasscode) {
      const a = Buffer.from(passcode);
      const b = Buffer.from(envPasscode);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        res.status(401).json({ error: 'Invalid admin passcode.' });
        return;
      }
      const token = signToken({ sub: 'admin', role: 'admin' });
      res.json({ token });
      return;
    }

    if (!db.adminPasswordHash) {
      res.status(400).json({
        error: 'Admin account has not been claimed yet. Please complete setup.',
      });
      return;
    }

    if (!verifyPassword(passcode, db.adminPasswordHash)) {
      res.status(401).json({ error: 'Invalid admin passcode.' });
      return;
    }

    const token = signToken({ sub: 'admin', role: 'admin' });
    res.json({ token });
  });

  // Protected Admin Routes
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const db = loadDb();
    const customers = db.customers.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt,
      orderCount: db.orders.filter(
        (o) => o.customerId === c.id || o.customerEmail === c.email,
      ).length,
    }));
    res.json({
      products: db.products,
      orders: db.orders,
      customers,
      coupons: db.coupons,
      returnRequests: db.returnRequests,
      reviews: db.reviews,
      newsletterSubscribers: db.newsletterSubscribers,
      contactSubmissions: db.contactSubmissions,
      config: db.config,
    });
  });

  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const filenameRaw = sanitizeString(req.body?.filename, 80) || 'shoe.png';
    const match = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
      dataUrl,
    );
    if (!match) {
      res.status(400).json({
        error: 'Only PNG, JPEG, or WebP base64 image uploads are supported.',
      });
      return;
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 2 * 1024 * 1024) {
      res.status(400).json({ error: 'Image file size must be under 2 MB.' });
      return;
    }
    const baseName = filenameRaw
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 32);
    const finalName = `${baseName}-${Date.now()}.${ext}`;
    const resolvedPath = path.resolve(UPLOADS_DIR, finalName);
    if (!resolvedPath.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(400).json({ error: 'Invalid upload path.' });
      return;
    }
    fs.writeFileSync(resolvedPath, buffer);
    res.status(201).json({ url: `/uploads/${finalName}` });
  });

  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const db = loadDb();
    const name = sanitizeString(req.body?.name, 140);
    const slug = sanitizeString(req.body?.slug, 140)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    const category = ['boys', 'girls', 'pe'].includes(req.body?.category)
      ? req.body.category
      : 'boys';
    const price = Math.max(100, Math.round(Number(req.body?.price) || 1499));
    const originalPrice = req.body?.originalPrice
      ? Math.max(price, Math.round(Number(req.body.originalPrice)))
      : null;

    if (!name || !slug) {
      res.status(400).json({ error: 'Product name and URL slug are required.' });
      return;
    }
    if (db.products.some((p) => p.slug === slug)) {
      res.status(409).json({ error: 'A product with this slug already exists.' });
      return;
    }

    const images = Array.isArray(req.body?.images)
      ? req.body.images
          .filter((img: { url?: string }) => img?.url && isValidImageUrl(img.url))
          .map((img: { url: string; label?: string }, idx: number) => ({
            id: `img-${Date.now()}-${idx}`,
            url: img.url,
            label: sanitizeString(img.label, 60) || `Angle ${idx + 1}`,
          }))
      : [];

    const sizes = Array.isArray(req.body?.sizes)
      ? req.body.sizes.map((s: { sizeLabel?: string; footLengthCm?: number; stockQty?: number }) => ({
          sizeLabel: sanitizeString(s.sizeLabel, 16) || 'IND 1',
          footLengthCm: Number(s.footLengthCm) || 20.2,
          stockQty: Math.max(0, Math.round(Number(s.stockQty) || 0)),
        }))
      : [
          { sizeLabel: 'IND 10', footLengthCm: 16.8, stockQty: 15 },
          { sizeLabel: 'IND 11', footLengthCm: 17.6, stockQty: 15 },
          { sizeLabel: 'IND 12', footLengthCm: 18.5, stockQty: 15 },
          { sizeLabel: 'IND 13', footLengthCm: 19.3, stockQty: 15 },
          { sizeLabel: 'IND 1', footLengthCm: 20.2, stockQty: 15 },
          { sizeLabel: 'IND 2', footLengthCm: 21.0, stockQty: 15 },
          { sizeLabel: 'IND 3', footLengthCm: 21.8, stockQty: 15 },
          { sizeLabel: 'IND 4', footLengthCm: 22.7, stockQty: 15 },
        ];

    const product: Product = {
      id: `prod-${crypto.randomUUID().slice(0, 8)}`,
      slug,
      name,
      subtitle: sanitizeString(req.body?.subtitle, 120) || 'Adaptive School Footwear',
      category,
      color: sanitizeString(req.body?.color, 60) || 'Black',
      price,
      originalPrice,
      shortDescription:
        sanitizeString(req.body?.shortDescription, 400) ||
        'Adaptive school footwear engineered for growing feet.',
      description:
        sanitizeString(req.body?.description, 2000) ||
        'Designed with a removable EVA fitting insert and quick-dry breathable lining.',
      materialsConstruction:
        sanitizeString(req.body?.materialsConstruction, 2000) ||
        'PU-coated microfibre upper, breathable mesh lining, anti-slip TPR outsole.',
      adaptiveFitMechanism:
        sanitizeString(req.body?.adaptiveFitMechanism, 2000) ||
        'Removable blue EVA insert provides controlled additional internal room.',
      careInstructions:
        sanitizeString(req.body?.careInstructions, 1000) ||
        'Wipe clean with damp cloth and air-dry naturally.',
      shippingReturnsSummary:
        sanitizeString(req.body?.shippingReturnsSummary, 500) ||
        'Standard delivery across India.',
      features: Array.isArray(req.body?.features)
        ? req.body.features.map((f: unknown) => sanitizeString(f, 120)).filter(Boolean)
        : ['Removable blue EVA fitting insert', 'Quick-dry mesh lining'],
      images,
      sizes,
      isActive: req.body?.isActive !== false,
    };

    db.products.push(product);
    saveDb(db);
    res.status(201).json({ product });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const existing = db.products[idx];
    const body = req.body ?? {};
    const price =
      body.price !== undefined
        ? Math.max(100, Math.round(Number(body.price)))
        : existing.price;
    const originalPrice =
      body.originalPrice === null || body.originalPrice === ''
        ? null
        : body.originalPrice !== undefined
          ? Math.max(price, Math.round(Number(body.originalPrice)))
          : existing.originalPrice;

    const updatedImages = Array.isArray(body.images)
      ? body.images
          .filter((img: { url?: string }) => img?.url && isValidImageUrl(img.url))
          .map((img: { id?: string; url: string; label?: string }, i: number) => ({
            id: img.id || `img-${Date.now()}-${i}`,
            url: img.url,
            label: sanitizeString(img.label, 60) || `Angle ${i + 1}`,
          }))
      : existing.images;

    const updatedSizes = Array.isArray(body.sizes)
      ? body.sizes.map(
          (s: { sizeLabel?: string; footLengthCm?: number; stockQty?: number }) => ({
            sizeLabel: sanitizeString(s.sizeLabel, 16) || 'IND 1',
            footLengthCm: Number(s.footLengthCm) || 20.2,
            stockQty: Math.max(0, Math.round(Number(s.stockQty) || 0)),
          }),
        )
      : existing.sizes;

    db.products[idx] = {
      ...existing,
      name: sanitizeString(body.name, 140) || existing.name,
      subtitle: sanitizeString(body.subtitle, 120) || existing.subtitle,
      color: sanitizeString(body.color, 60) || existing.color,
      price,
      originalPrice,
      shortDescription:
        sanitizeString(body.shortDescription, 400) || existing.shortDescription,
      description: sanitizeString(body.description, 2000) || existing.description,
      materialsConstruction:
        sanitizeString(body.materialsConstruction, 2000) ||
        existing.materialsConstruction,
      adaptiveFitMechanism:
        sanitizeString(body.adaptiveFitMechanism, 2000) ||
        existing.adaptiveFitMechanism,
      careInstructions:
        sanitizeString(body.careInstructions, 1000) || existing.careInstructions,
      images: updatedImages,
      sizes: updatedSizes,
      isActive:
        typeof body.isActive === 'boolean' ? body.isActive : existing.isActive,
    };
    saveDb(db);
    res.json({ product: db.products[idx] });
  });

  app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
    const db = loadDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const allowed: OrderStatus[] = [
      'placed',
      'confirmed',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
    ];
    if (allowed.includes(req.body?.orderStatus)) {
      order.orderStatus = req.body.orderStatus;
    }
    if (
      ['pending', 'paid', 'failed', 'cod_pending'].includes(
        req.body?.paymentStatus,
      )
    ) {
      order.paymentStatus = req.body.paymentStatus;
    }
    saveDb(db);
    res.json({ order });
  });

  app.post('/api/admin/coupons', requireAdmin, (req, res) => {
    const db = loadDb();
    const code = sanitizeString(req.body?.code, 30).toUpperCase();
    const discountType =
      req.body?.discountType === 'percent' ? 'percent' : 'flat';
    const discountValue = Math.max(1, Math.round(Number(req.body?.discountValue) || 100));
    const minOrderAmount = Math.max(0, Math.round(Number(req.body?.minOrderAmount) || 0));

    if (!code) {
      res.status(400).json({ error: 'Coupon code is required.' });
      return;
    }
    if (db.coupons.some((c) => c.code === code)) {
      res.status(409).json({ error: 'Coupon code already exists.' });
      return;
    }

    const coupon: Coupon = {
      id: `cpn-${crypto.randomUUID().slice(0, 8)}`,
      code,
      discountType,
      discountValue,
      minOrderAmount,
      isActive: true,
    };
    db.coupons.push(coupon);
    saveDb(db);
    res.status(201).json({ coupon });
  });

  app.put('/api/admin/coupons/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const coupon = db.coupons.find((c) => c.id === req.params.id);
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found.' });
      return;
    }
    if (typeof req.body?.isActive === 'boolean') {
      coupon.isActive = req.body.isActive;
    }
    saveDb(db);
    res.json({ coupon });
  });

  app.delete('/api/admin/coupons/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    db.coupons = db.coupons.filter((c) => c.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  app.put('/api/admin/returns/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const item = db.returnRequests.find((r) => r.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Return request not found.' });
      return;
    }
    if (
      [
        'requested',
        'approved',
        'pickup_scheduled',
        'completed',
        'rejected',
      ].includes(req.body?.status)
    ) {
      item.status = req.body.status;
    }
    if (req.body?.rewardCreditInr !== undefined) {
      item.rewardCreditInr = Math.max(
        0,
        Math.round(Number(req.body.rewardCreditInr)),
      );
    }
    saveDb(db);
    res.json({ returnRequest: item });
  });

  app.put('/api/admin/reviews/:id', requireAdmin, (req, res) => {
    const db = loadDb();
    const review = db.reviews.find((r) => r.id === req.params.id);
    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    if (['published', 'hidden'].includes(req.body?.status)) {
      review.status = req.body.status;
    }
    saveDb(db);
    res.json({ review });
  });

  app.put('/api/admin/config', requireAdmin, (req, res) => {
    const db = loadDb();
    const body = req.body ?? {};
    db.config = {
      ...db.config,
      heroHeadline:
        sanitizeString(body.heroHeadline, 180) || db.config.heroHeadline,
      heroSubheading:
        sanitizeString(body.heroSubheading, 300) || db.config.heroSubheading,
      announcementText:
        sanitizeString(body.announcementText, 240) || db.config.announcementText,
      shippingFlatRate:
        body.shippingFlatRate !== undefined
          ? Math.max(0, Math.round(Number(body.shippingFlatRate)))
          : db.config.shippingFlatRate,
      freeShippingThreshold:
        body.freeShippingThreshold !== undefined
          ? Math.max(0, Math.round(Number(body.freeShippingThreshold)))
          : db.config.freeShippingThreshold,
      codEnabled:
        typeof body.codEnabled === 'boolean'
          ? body.codEnabled
          : db.config.codEnabled,
      codFee:
        body.codFee !== undefined
          ? Math.max(0, Math.round(Number(body.codFee)))
          : db.config.codFee,
      estimatedDeliveryWindow:
        sanitizeString(body.estimatedDeliveryWindow, 120) ||
        db.config.estimatedDeliveryWindow,
      returnRewardMinInr:
        body.returnRewardMinInr !== undefined
          ? Math.max(0, Math.round(Number(body.returnRewardMinInr)))
          : db.config.returnRewardMinInr,
      returnRewardMaxInr:
        body.returnRewardMaxInr !== undefined
          ? Math.max(0, Math.round(Number(body.returnRewardMaxInr)))
          : db.config.returnRewardMaxInr,
      returnRewardPartnerStatus:
        sanitizeString(body.returnRewardPartnerStatus, 200) ||
        db.config.returnRewardPartnerStatus,
      returnWindowDaysConfigurable:
        sanitizeString(body.returnWindowDaysConfigurable, 100) ||
        db.config.returnWindowDaysConfigurable,
      returnPolicyNote:
        sanitizeString(body.returnPolicyNote, 400) || db.config.returnPolicyNote,
      supportEmail:
        sanitizeString(body.supportEmail, 160) || db.config.supportEmail,
      supportPhone:
        sanitizeString(body.supportPhone, 60) || db.config.supportPhone,
      instagramHandle:
        sanitizeString(body.instagramHandle, 80) || db.config.instagramHandle,
      businessAddress:
        sanitizeString(body.businessAddress, 240) || db.config.businessAddress,
      sizeChartNote:
        sanitizeString(body.sizeChartNote, 400) || db.config.sizeChartNote,
    };
    saveDb(db);
    res.json({ config: db.config });
  });

  // Mount Vite or serve production static files
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GrowStep D2C storefront running at http://localhost:${PORT}`);
  });
}

startServer();
