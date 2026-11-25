import React, { useState } from 'react';
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { GrowStepLogo } from './GrowStepLogo';

export const Navbar: React.FC = () => {
  const {
    path,
    navigate,
    cartCount,
    setCartOpen,
    setSearchOpen,
    customer,
    config,
  } = useStore();
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleNav = (to: string) => {
    setShopOpen(false);
    setMobileOpen(false);
    navigate(to);
  };

  const navLinkCls = (active: boolean) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 py-1 border-b-2 ${
      active
        ? 'text-[#132238] border-[#132238]'
        : 'text-[#1E2022]/75 border-transparent hover:text-[#132238] hover:border-[#1E5AA8]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FCFBF8]/95 backdrop-blur-md border-b border-[#E7DFD1]">
      {!bannerDismissed && config?.announcementText && (
        <div className="bg-[#132238] text-[#FCFBF8] text-xs py-1.5 px-4 flex items-center justify-center relative">
          <p className="truncate pr-6 text-center font-medium">
            {config.announcementText}
          </p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement"
            className="absolute right-3 p-1 text-white/75 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden p-2 -ml-2 text-[#132238] rounded-lg hover:bg-[#F6F1E7] focus-visible:outline-2 focus-visible:outline-[#132238]"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => handleNav('/')}
            className="text-left focus-visible:outline-2 focus-visible:outline-[#132238] rounded-md"
            aria-label="GrowStep Home"
          >
            <GrowStepLogo variant="compact" />
          </button>
        </div>

        <nav
          className="hidden lg:flex items-center gap-7"
          aria-label="Main navigation"
        >
          <button
            type="button"
            onClick={() => handleNav('/')}
            className={navLinkCls(path === '/')}
          >
            Home
          </button>

          <div
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <button
              type="button"
              onClick={() => setShopOpen((prev) => !prev)}
              aria-expanded={shopOpen}
              className={`${navLinkCls(
                path === '/shop' || path.startsWith('/products/'),
              )} inline-flex items-center gap-1`}
            >
              <span>Shop</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  shopOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {shopOpen && (
              <div className="absolute left-0 top-full pt-2 w-60 z-50">
                <div className="bg-white border border-[#E7DFD1] rounded-xl shadow-lg py-2">
                  <button
                    type="button"
                    onClick={() => handleNav('/shop')}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#132238] hover:bg-[#F6F1E7] transition-colors"
                  >
                    All School Shoes
                  </button>
                  <div className="my-1 border-t border-[#E7DFD1]/70" />
                  <button
                    type="button"
                    onClick={() => handleNav('/products/boys-black-school-shoe')}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#1E2022] hover:bg-[#F6F1E7] hover:text-[#132238] transition-colors"
                  >
                    Boys&apos; Shoes (Black Lace-Up)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleNav('/products/girls-black-mary-jane-shoe')
                    }
                    className="w-full text-left px-4 py-2.5 text-sm text-[#1E2022] hover:bg-[#F6F1E7] hover:text-[#132238] transition-colors"
                  >
                    Girls&apos; Shoes (Mary Jane)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleNav('/products/unisex-white-pe-school-shoe')
                    }
                    className="w-full text-left px-4 py-2.5 text-sm text-[#1E2022] hover:bg-[#F6F1E7] hover:text-[#132238] transition-colors"
                  >
                    White PE Shoes (Unisex)
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleNav('/about')}
            className={navLinkCls(path === '/about')}
          >
            About Us
          </button>

          <button
            type="button"
            onClick={() => handleNav('/return-reward')}
            className={navLinkCls(path === '/return-reward')}
          >
            Return &amp; Reward
          </button>

          <button
            type="button"
            onClick={() => handleNav('/faqs')}
            className={navLinkCls(path === '/faqs')}
          >
            FAQs
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search school shoes"
            className="p-2.5 rounded-lg text-[#1E2022] hover:bg-[#F6F1E7] hover:text-[#132238] transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleNav('/account')}
            aria-label={customer ? `Account (${customer.fullName})` : 'Account & Orders'}
            className="p-2.5 rounded-lg text-[#1E2022] hover:bg-[#F6F1E7] hover:text-[#132238] transition-colors inline-flex items-center gap-1.5"
          >
            <User className="w-5 h-5" />
            {customer && (
              <span className="hidden xl:inline text-xs font-medium text-[#132238] max-w-[90px] truncate">
                {customer.fullName.split(' ')[0]}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Shopping bag with ${cartCount} items`}
            className="relative p-2.5 rounded-lg text-[#132238] hover:bg-[#F6F1E7] transition-colors inline-flex items-center gap-1.5"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-mono-num text-xs font-semibold bg-[#132238] text-white min-w-[20px] h-5 px-1.5 rounded-full inline-flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E7DFD1] bg-[#FCFBF8] px-4 py-4 space-y-1">
          <button
            type="button"
            onClick={() => handleNav('/')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#132238] hover:bg-[#F6F1E7]"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleNav('/shop')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#132238] hover:bg-[#F6F1E7]"
          >
            Shop All School Shoes
          </button>
          <div className="pl-4 space-y-1 border-l border-[#E7DFD1] ml-3">
            <button
              type="button"
              onClick={() => handleNav('/products/boys-black-school-shoe')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm text-[#1E2022] hover:bg-[#F6F1E7]"
            >
              Boys&apos; Shoes
            </button>
            <button
              type="button"
              onClick={() => handleNav('/products/girls-black-mary-jane-shoe')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm text-[#1E2022] hover:bg-[#F6F1E7]"
            >
              Girls&apos; Shoes
            </button>
            <button
              type="button"
              onClick={() => handleNav('/products/unisex-white-pe-school-shoe')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm text-[#1E2022] hover:bg-[#F6F1E7]"
            >
              White PE Shoes
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleNav('/about')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1E2022] hover:bg-[#F6F1E7]"
          >
            About Us
          </button>
          <button
            type="button"
            onClick={() => handleNav('/return-reward')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1E2022] hover:bg-[#F6F1E7]"
          >
            Return &amp; Reward
          </button>
          <button
            type="button"
            onClick={() => handleNav('/faqs')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1E2022] hover:bg-[#F6F1E7]"
          >
            FAQs
          </button>
          <button
            type="button"
            onClick={() => handleNav('/size-guide')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1E2022] hover:bg-[#F6F1E7]"
          >
            Indian Size Guide
          </button>
          <button
            type="button"
            onClick={() => handleNav('/account')}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1E2022] hover:bg-[#F6F1E7]"
          >
            Account &amp; Order Tracking
          </button>
        </div>
      )}
    </header>
  );
};
