# GrowStep — Setup, Razorpay & Deployment Guide

## 1. Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and configure any optional credentials:
   - `RAZORPAY_KEY_ID` (leave blank to use the built-in server-verified Test Checkout Simulator)
   - `RAZORPAY_KEY_SECRET` (server-side only; never prefix with `VITE_`)
   - `ADMIN_PASSCODE` (if left blank, visit `/admin` to claim your initial admin passcode via the first-run setup form)
3. Start the full-stack dev server on port 3000:
   ```bash
   npm run dev
   ```

## 2. Switching Razorpay from Test Mode to Live Mode
1. Generate **Test Keys** (`rzp_test_...`) in the Razorpay Dashboard to test UPI, cards, net banking, and wallets end-to-end against Razorpay's sandbox.
2. When ready for production after Razorpay KYC approval, replace `RAZORPAY_KEY_ID` (`rzp_live_...`) and `RAZORPAY_KEY_SECRET` in your hosting environment variables.
3. No code changes are required—`server.ts` automatically creates orders via `https://api.razorpay.com/v1/orders` and verifies `razorpay_signature` using HMAC-SHA256 before marking an order as `paid`.

## 3. Database Migration (Supabase PostgreSQL)
- Local development uses `data/growstep-db.json` for zero-config persistence.
- A full PostgreSQL schema covering `products`, `product_images`, `product_sizes`, `inventory`, `customers`, `orders`, `order_items`, `payments`, `reviews`, `wishlists`, `coupons`, and `return_requests` is provided in `supabase-schema.sql`.
- Run `supabase-schema.sql` in the Supabase SQL Editor and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in server environment variables when migrating to managed Postgres.

## 4. Production Build & Vercel / Node Hosting
- Build command: `npm run build`
- Start command (full-stack Node server): `npm run start`
- If deploying to Vercel or Railway/Render, ensure environment variables from `.env.example` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ADMIN_PASSCODE`, `SESSION_SECRET`) are set in your project settings.
