import React, { useState } from 'react';
import { Instagram, Mail, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { GrowStepLogo } from './GrowStepLogo';

export const Footer: React.FC = () => {
  const { navigate, config } = useStore();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>(
    'idle',
  );
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Subscription failed.');
        return;
      }
      setStatus('done');
      setMessage('Subscribed to GrowStep updates.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Unable to subscribe right now.');
    }
  };

  return (
    <footer className="bg-[#132238] text-[#FCFBF8] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-5">
            <GrowStepLogo variant="light" />
            <p className="text-sm text-[#FBF7F0]/75 leading-relaxed max-w-sm">
              School shoes designed to adapt to growing feet, withstand everyday
              school wear and handle Indian monsoon conditions.
            </p>
            <div className="space-y-2 text-xs text-[#FBF7F0]/75">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C26D3A]" />
                <span>{config?.supportEmail || 'care@growstep.in (placeholder)'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C26D3A]" />
                <span>{config?.supportPhone || '+91 80 0000 0000 (placeholder)'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5 text-[#C26D3A]" />
                <span>{config?.instagramHandle || '@growstep.footwear (placeholder)'}</span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-display text-sm font-semibold text-white">
              Shop
            </h3>
            <ul className="space-y-2.5 text-sm text-[#FBF7F0]/75">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="hover:text-white transition-colors"
                >
                  All School Shoes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/products/boys-black-school-shoe')}
                  className="hover:text-white transition-colors"
                >
                  Boys&apos; Black Lace-Up
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/products/girls-black-mary-jane-shoe')}
                  className="hover:text-white transition-colors"
                >
                  Girls&apos; Mary Jane
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/products/unisex-white-pe-school-shoe')}
                  className="hover:text-white transition-colors"
                >
                  Unisex White PE
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/size-guide')}
                  className="hover:text-white transition-colors"
                >
                  Indian Size Guide
                </button>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display text-sm font-semibold text-white">
              Support &amp; Policies
            </h3>
            <ul className="space-y-2.5 text-sm text-[#FBF7F0]/75">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/about')}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/return-reward')}
                  className="hover:text-white transition-colors"
                >
                  Return &amp; Reward
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/shipping-policy')}
                  className="hover:text-white transition-colors"
                >
                  Shipping Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/returns-policy')}
                  className="hover:text-white transition-colors"
                >
                  Returns and Exchanges
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/faqs')}
                  className="hover:text-white transition-colors"
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display text-sm font-semibold text-white">
              Parent Newsletter
            </h3>
            <p className="text-xs text-[#FBF7F0]/75 leading-relaxed">
              Receive updates on school-term launches, fit-check reminders, and
              our Return &amp; Reward programme.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Parent email address"
                aria-label="Email address for newsletter"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/55 focus:outline-none focus:border-[#C26D3A]"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-2.5 px-4 rounded-lg bg-[#F6F1E7] text-[#132238] font-semibold text-sm hover:bg-white transition-colors disabled:opacity-60"
              >
                {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
              </button>
              {message && (
                <p
                  className={`text-xs ${
                    status === 'error' ? 'text-red-300' : 'text-[#F6F1E7]'
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FBF7F0]/65">
          <p>© {new Date().getFullYear()} GrowStep Footwear. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => navigate('/privacy-policy')}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => navigate('/terms')}
              className="hover:text-white transition-colors"
            >
              Terms &amp; Conditions
            </button>
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="hover:text-white transition-colors"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="hover:text-white transition-colors"
            >
              Store Admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
