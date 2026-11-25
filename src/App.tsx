/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AccountOrdersPage } from './pages/AccountOrdersPage';
import {
  AboutUsPage,
  ContactPage,
  FaqsPage,
  LegalPage,
  ReturnRewardPage,
  ReturnsPolicyPage,
  ShippingPolicyPage,
  SizeGuidePage,
} from './pages/ContentPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const StorefrontRouter: React.FC = () => {
  const { path, loading, error, refreshStorefront } = useStore();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCFBF8]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#132238] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#132238]">
              Loading GrowStep Storefront...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCFBF8]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="max-w-md text-center space-y-4">
            <p className="font-display text-lg font-bold text-[#132238]">
              Unable to load store catalog
            </p>
            <p className="text-sm text-[#5A5D65]">{error}</p>
            <button
              type="button"
              onClick={refreshStorefront}
              className="px-5 py-2.5 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  let page: React.ReactNode;
  if (path === '/' || path === '') {
    page = <HomePage />;
  } else if (path === '/shop') {
    page = <ShopPage />;
  } else if (path.startsWith('/products/')) {
    const slug = path.replace('/products/', '').split('/')[0];
    page = <ProductDetailPage slug={slug} />;
  } else if (path === '/cart') {
    page = <CartPage />;
  } else if (path === '/checkout') {
    page = <CheckoutPage />;
  } else if (path === '/order-confirmation') {
    page = <OrderConfirmationPage />;
  } else if (path === '/account') {
    page = <AccountOrdersPage />;
  } else if (path === '/about') {
    page = <AboutUsPage />;
  } else if (path === '/return-reward') {
    page = <ReturnRewardPage />;
  } else if (path === '/faqs') {
    page = <FaqsPage />;
  } else if (path === '/returns-policy') {
    page = <ReturnsPolicyPage />;
  } else if (path === '/shipping-policy') {
    page = <ShippingPolicyPage />;
  } else if (path === '/size-guide') {
    page = <SizeGuidePage />;
  } else if (path === '/contact') {
    page = <ContactPage />;
  } else if (path === '/privacy-policy') {
    page = <LegalPage mode="privacy" />;
  } else if (path === '/terms') {
    page = <LegalPage mode="terms" />;
  } else if (path === '/admin') {
    page = <AdminDashboardPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF8] text-[#1E2022]">
      <Navbar />
      <main className="flex-1">{page}</main>
      <Footer />
      <CartDrawer />
      <SearchModal />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <StorefrontRouter />
    </StoreProvider>
  );
}
