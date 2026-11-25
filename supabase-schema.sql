-- GrowStep D2C E-Commerce Database Schema (PostgreSQL / Supabase)
-- Run in Supabase SQL Editor when migrating from local server persistence to Supabase.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('boys', 'girls', 'pe')),
  color TEXT NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  materials_construction TEXT NOT NULL,
  adaptive_fit_mechanism TEXT NOT NULL,
  care_instructions TEXT NOT NULL,
  shipping_returns_summary TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  uk_size TEXT NOT NULL,
  foot_length_cm NUMERIC(4,1) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, uk_size)
);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  uk_size TEXT NOT NULL,
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, uk_size)
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  delivery_option TEXT NOT NULL DEFAULT 'standard',
  estimated_delivery TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping_charge INTEGER NOT NULL,
  discount_code TEXT,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'cod')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'cod_pending')),
  order_status TEXT NOT NULL CHECK (order_status IN ('placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  uk_size TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'razorpay',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('created', 'verified', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  city TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percent')),
  discount_value INTEGER NOT NULL,
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('return_reward', 'size_exchange', 'damaged_return')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'pickup_scheduled', 'completed', 'rejected')),
  reward_credit_inr INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
