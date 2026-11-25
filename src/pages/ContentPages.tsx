import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Recycle,
  Ruler,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MEDIA, formatInr } from '../lib/media';
import { ResilientImage } from '../components/ResilientImage';

export const AboutUsPage: React.FC = () => {
  const { navigate } = useStore();
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C26D3A]">
            About GrowStep
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#132238] text-balance">
            Growing Feet Deserve Smarter Shoes.
          </h1>
          <p className="text-sm sm:text-base text-[#5A5D65] leading-relaxed">
            School shoes are one of the most frequent recurring household
            purchases for Indian families. Too often, parents have to replace a
            pair mid-term simply because their child&apos;s foot grew—even when
            the upper and outsole are still in usable condition.
          </p>
        </div>
        <div className="lg:col-span-5">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#FBF5EA] border border-[#E7DFD1]">
            <ResilientImage
              src={MEDIA.boysCutaway}
              alt="GrowStep adaptive fit cutaway construction"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-2.5">
          <h2 className="font-display text-lg font-bold text-[#132238]">
            Our Story
          </h2>
          <p className="text-sm text-[#5A5D65] leading-relaxed">
            GrowStep began with a practical observation shared by Indian
            parents: children outgrow school shoes faster than they wear them
            out, yet uniform shoes also face intense daily playground abrasion
            and wet monsoon commutes.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-2.5">
          <h2 className="font-display text-lg font-bold text-[#132238]">
            Our Mission
          </h2>
          <p className="text-sm text-[#5A5D65] leading-relaxed">
            To build straightforward, uniform-compliant school footwear that
            combines controlled fit adjustment, monsoon-conscious materials, and
            everyday durability—delivering better value across the shoe&apos;s
            usable life.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E7DFD1] space-y-2.5">
          <h2 className="font-display text-lg font-bold text-[#132238]">
            Why We Created GrowStep
          </h2>
          <p className="text-sm text-[#5A5D65] leading-relaxed">
            Parents shouldn&apos;t have to choose between an affordable school
            shoe and one that handles puddles, sweat, and rough concrete
            playgrounds. By pairing a removable cobalt-blue EVA fitting insert
            with a quick-dry mesh lining and reinforced toe/heel structure,
            GrowStep is engineered specifically for everyday Indian school
            conditions.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E7DFD1] space-y-2.5">
          <h2 className="font-display text-lg font-bold text-[#132238]">
            Our Product Philosophy
          </h2>
          <p className="text-sm text-[#5A5D65] leading-relaxed">
            Function before gimmicks. Every material choice—PU-coated
            microfibre for easy wiping, breathable polyester mesh, die-cut EVA
            inserts, and non-marking anti-slip rubber/TPR outsoles—serves a
            clear daily purpose. Fit expansion targets are treated honestly as
            prototype-validated engineering goals.
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-[#FBF5EA] border border-[#E7DFD1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#132238]">
            Ready to explore the launch range?
          </h3>
          <p className="text-sm text-[#5A5D65]">
            View Boys&apos; Black Lace-Up, Girls&apos; Mary Jane, and Unisex
            White PE shoes in Indian sizes IND 10–4.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="px-5 py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors shrink-0"
        >
          Shop Collection
        </button>
      </div>
    </div>
  );
};

export const ReturnRewardPage: React.FC = () => {
  const { config } = useStore();
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [requestType, setRequestType] = useState<
    'return_reward' | 'size_exchange' | 'damaged_return'
  >('return_reward');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          customerName,
          customerEmail,
          customerPhone,
          requestType,
          reason,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatusMsg({
          type: 'err',
          text: data.error || 'Could not submit request.',
        });
      } else {
        setStatusMsg({
          type: 'ok',
          text: 'Your return registration has been recorded. Our team will update you once pickup eligibility is reviewed.',
        });
        setOrderNumber('');
        setReason('');
      }
    } catch {
      setStatusMsg({ type: 'err', text: 'Unable to submit right now.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#C26D3A]">
          <Recycle className="w-4 h-4" />
          <span>GrowStep Return &amp; Reward Programme</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#132238] text-balance">
          Give Your Old Shoes a New Purpose.
        </h1>
        <p className="text-sm sm:text-base text-[#5A5D65] max-w-2xl leading-relaxed">
          When your child outgrows their GrowStep shoes, eligible pairs can be
          returned through our proposed collection programme for{' '}
          <strong className="text-[#132238]">
            ₹{config?.returnRewardMinInr ?? 100}–₹
            {config?.returnRewardMaxInr ?? 150} credit
          </strong>{' '}
          towards your next pair.
        </p>
        <p className="text-xs text-[#5A5D65]">
          Programme Status:{' '}
          {config?.returnRewardPartnerStatus ||
            'Proposed programme — recycling & donation partner onboarding in progress.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-2">
          <h2 className="font-display text-base font-bold text-[#132238]">
            How It Works
          </h2>
          <ol className="list-decimal pl-5 text-sm text-[#5A5D65] space-y-1.5">
            <li>Purchase and use a pair of GrowStep school shoes.</li>
            <li>Register your outgrown pair using your Order Number below.</li>
            <li>
              Hand over the cleaned pair to our scheduled courier or drop point.
            </li>
            <li>Receive reward credit after inspection.</li>
          </ol>
        </div>

        <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-2">
          <h2 className="font-display text-base font-bold text-[#132238]">
            Eligibility, Collection &amp; Credit
          </h2>
          <ul className="list-disc pl-5 text-sm text-[#5A5D65] space-y-1.5">
            <li>
              <strong className="text-[#132238]">Eligibility:</strong> Authentic
              GrowStep pairs with intact uppers and soles (usable or recyclable
              condition).
            </li>
            <li>
              <strong className="text-[#132238]">Collection:</strong> Courier
              pickup or participating collection points (serviceable areas
              configurable).
            </li>
            <li>
              <strong className="text-[#132238]">Reward Credit:</strong>{' '}
              Proposed ₹{config?.returnRewardMinInr ?? 100}–₹
              {config?.returnRewardMaxInr ?? 150} store credit towards your next
              GrowStep order.
            </li>
          </ul>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E7DFD1]">
        <h2 className="font-display text-xl font-bold text-[#132238] mb-1">
          Register a Return &amp; Reward or Exchange Request
        </h2>
        <p className="text-xs text-[#5A5D65] mb-6">
          Submit your order reference to register an outgrown pair, Indian size
          exchange, or damaged item review.
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#132238] mb-1">
              Request Type
            </label>
            <select
              value={requestType}
              onChange={(e) =>
                setRequestType(
                  e.target.value as
                    | 'return_reward'
                    | 'size_exchange'
                    | 'damaged_return',
                )
              }
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] text-sm bg-[#FCFBF8]"
            >
              <option value="return_reward">
                Return &amp; Reward (Outgrown Pair Credit)
              </option>
              <option value="size_exchange">Indian Size Exchange Request</option>
              <option value="damaged_return">Damaged Product Report</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#132238] mb-1">
              Order Number *
            </label>
            <input
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. GS-2026-1001"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm font-mono-num uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#132238] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#132238] mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#132238] mb-1">
              Mobile Number *
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#132238] mb-1">
              Condition / Notes *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe pair condition, desired Indian size (e.g. IND 1), or issue..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </form>

        {statusMsg && (
          <p
            className={`mt-4 text-xs font-medium ${
              statusMsg.type === 'err' ? 'text-red-700' : 'text-[#132238]'
            }`}
          >
            {statusMsg.text}
          </p>
        )}
      </div>
    </div>
  );
};

export const FaqsPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What makes GrowStep different from regular school shoes?',
      a: 'GrowStep combines a removable die-cut cobalt-blue EVA fitting insert, quick-dry breathable polyester mesh lining, water-resistant PU-coated microfibre upper, reinforced toe/heel construction, and an anti-slip outsole in one uniform-compliant design.',
    },
    {
      q: 'How does the adaptive-fit insert work?',
      a: 'Each pair comes with a removable blue EVA fitting insert seated over the cushioned grey footbed. At initial purchase, the insert provides a snug, supportive fit. As your child’s foot grows, removing the insert frees controlled additional internal room.',
    },
    {
      q: 'Does removing the insert accommodate an extra Indian size?',
      a: 'Removing the insert frees controlled internal volume inside the shoe. Our design target is to accommodate approximately one additional Indian size—this is a proposed capability undergoing prototype validation rather than a guaranteed claim. Always check toe clearance regularly.',
    },
    {
      q: 'How do I choose the correct Indian school shoe size?',
      a: 'Use our Indian Size Guide & Find My Size tool on any product page. Place your child’s foot on paper against a wall, mark heel and longest toe, measure in centimetres, and compare with our configurable IND 10 to IND 4 chart.',
    },
    {
      q: 'Are the shoes suitable for monsoon conditions?',
      a: 'They are built with monsoon-conscious features: a water-resistant PU-coated microfibre upper, quick-drying breathable mesh inner lining, removable washable footbed, and anti-slip rubber/TPR outsole. Like regular stitched footwear, they are not waterproof gumboots for deep standing water.',
    },
    {
      q: 'Are the shoes washable?',
      a: 'Wipe the PU-coated microfibre upper clean with a damp cloth and mild soap. The blue EVA fitting insert and grey footbed can be removed and rinsed separately, then air-dried in shade. Do not machine wash or tumble dry.',
    },
    {
      q: 'How long does delivery take?',
      a: 'Standard delivery across major Indian cities typically takes 4–6 business days (configurable in store settings). Exact timelines depend on your PIN code and courier partner serviceability.',
    },
    {
      q: 'What is the return and exchange policy?',
      a: 'Unused shoes in original packaging are eligible for Indian size exchange or return according to our configurable store return policy. Please review the Returns and Exchanges page for current configurable windows.',
    },
    {
      q: 'How does the Return & Reward programme work?',
      a: 'Under our proposed Return & Reward initiative, parents can register outgrown GrowStep pairs for collection and receive ₹100–₹150 credit towards their next purchase upon inspection. Recycling and donation partner onboarding is configurable prior to full rollout.',
    },
    {
      q: 'Can I cancel my order?',
      a: 'Orders can be cancelled before dispatch by contacting support with your Order Number or via our Contact Us page.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C26D3A] mb-1">
          Help Centre
        </p>
        <h1 className="font-display text-3xl font-bold text-[#132238]">
          Frequently Asked Questions
        </h1>
      </div>

      <div className="divide-y divide-[#E7DFD1] border border-[#E7DFD1] rounded-2xl bg-white overflow-hidden">
        {faqs.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-[#F6F1E7] transition-colors"
              >
                <span className="font-display text-sm sm:text-base font-semibold text-[#132238]">
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#132238] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm text-[#5A5D65] leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ReturnsPolicyPage: React.FC = () => {
  const { config, navigate } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C26D3A] mb-1">
          Configurable Store Policy
        </p>
        <h1 className="font-display text-3xl font-bold text-[#132238]">
          Returns and Exchanges Policy
        </h1>
        <p className="mt-3 text-xs text-[#5A5D65] bg-[#FBF5EA] border border-[#E7DFD1] rounded-xl p-4">
          {config?.returnPolicyNote ||
            'Policy parameters below are configurable prior to commercial launch and pending final legal & logistics partner sign-off.'}
        </p>
      </div>

      <div className="space-y-6 text-sm text-[#5A5D65] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-[#132238]">
            Return Eligibility
          </h2>
          <p>
            Configured window:{' '}
            <strong className="text-[#132238]">
              {config?.returnWindowDaysConfigurable || '14 days (configurable)'}
            </strong>{' '}
            from delivery. Footwear must be unworn outdoors, free of sole wear
            or scuff marks, and returned with the original box and removable
            blue EVA inserts intact.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-[#132238]">
            Indian Size Exchange Procedure
          </h2>
          <p>
            If the initial Indian size (IND 10–4) is too tight or too loose
            during indoor trial, submit an exchange request via our Return &amp;
            Exchange form with your Order Number and desired Indian size. Size
            exchanges are subject to inventory availability.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-[#132238]">
            Damaged or Incorrect Product Procedure
          </h2>
          <p>
            If your order arrives damaged or with an incorrect style/size,
            notify us within 48 hours of delivery with photos of the item and
            packaging so our team can arrange inspection and replacement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-[#132238]">
            Refund Process &amp; Return Shipping
          </h2>
          <p>
            Approved refunds are processed to the original payment method (or
            bank/UPI details for COD orders) after quality inspection at our
            warehouse. Return courier pickup or self-ship reimbursement rules
            are configurable per serviceable PIN code.
          </p>
        </section>
      </div>

      <button
        type="button"
        onClick={() => navigate('/return-reward')}
        className="px-5 py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
      >
        Submit Return or Size Exchange Request
      </button>
    </div>
  );
};

export const ShippingPolicyPage: React.FC = () => {
  const { config } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6">
      <h1 className="font-display text-3xl font-bold text-[#132238]">
        Shipping Policy
      </h1>
      <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-3 text-sm text-[#5A5D65] leading-relaxed">
        <p>
          <strong className="text-[#132238]">Standard Delivery Window:</strong>{' '}
          {config?.estimatedDeliveryWindow ||
            '4–6 business days across major Indian cities'}
          .
        </p>
        <p>
          <strong className="text-[#132238]">
            Shipping Charges (Configurable):
          </strong>{' '}
          Standard shipping is {formatInr(config?.shippingFlatRate ?? 99)},
          waived automatically on orders of{' '}
          {formatInr(config?.freeShippingThreshold ?? 1499)} or more.
        </p>
        <p>
          <strong className="text-[#132238]">Cash on Delivery:</strong>{' '}
          {config?.codEnabled
            ? 'Available at checkout for eligible orders.'
            : 'Currently disabled in store configuration.'}
        </p>
      </div>
    </div>
  );
};

export const SizeGuidePage: React.FC = () => {
  const { products, config, navigate } = useStore();
  const sizes = useMemo(
    () =>
      products[0]?.sizes || [
        { sizeLabel: 'IND 10', footLengthCm: 16.8, stockQty: 18 },
        { sizeLabel: 'IND 11', footLengthCm: 17.6, stockQty: 22 },
        { sizeLabel: 'IND 12', footLengthCm: 18.5, stockQty: 25 },
        { sizeLabel: 'IND 13', footLengthCm: 19.3, stockQty: 20 },
        { sizeLabel: 'IND 1', footLengthCm: 20.2, stockQty: 24 },
        { sizeLabel: 'IND 2', footLengthCm: 21.0, stockQty: 19 },
        { sizeLabel: 'IND 3', footLengthCm: 21.8, stockQty: 16 },
        { sizeLabel: 'IND 4', footLengthCm: 22.7, stockQty: 14 },
      ],
    [products],
  );
  const [cmInput, setCmInput] = useState('');

  const match = useMemo(() => {
    const val = parseFloat(cmInput);
    if (!Number.isFinite(val) || val <= 0) return null;
    const sorted = [...sizes].sort((a, b) => a.footLengthCm - b.footLengthCm);
    return sorted.find((s) => s.footLengthCm >= val) || sorted[sorted.length - 1];
  }, [cmInput, sizes]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#C26D3A] mb-1">
          <Ruler className="w-4 h-4" />
          <span>Configurable Indian Reference Guide</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-[#132238]">
          Indian Size Guide &amp; Find My Size
        </h1>
        <p className="mt-2 text-sm text-[#5A5D65]">
          {config?.sizeChartNote ||
            'Indian footwear size measurements (IND 10–4) shown below are configurable reference values pending final manufacturer last specifications.'}
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#FBF5EA] border border-[#E7DFD1] space-y-3">
        <label
          htmlFor="guide-cm"
          className="block text-sm font-bold text-[#132238]"
        >
          Find My Size — Enter Child&apos;s Foot Length (cm)
        </label>
        <input
          id="guide-cm"
          type="number"
          step="0.1"
          min="12"
          max="26"
          value={cmInput}
          onChange={(e) => setCmInput(e.target.value)}
          placeholder="e.g. 19.5"
          className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-[#E7DFD1] bg-white text-sm font-mono-num focus:outline-none focus:border-[#132238]"
        />
        {match && (
          <p className="text-sm text-[#132238]">
            Suggested Indian Size:{' '}
            <strong className="font-mono-num">{match.sizeLabel}</strong> (
            {match.footLengthCm} cm reference).
          </p>
        )}
      </div>

      <div className="overflow-hidden border border-[#E7DFD1] rounded-2xl bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F6F1E7] text-[#132238]">
            <tr>
              <th className="py-3 px-5 font-semibold">Indian Children&apos;s Size</th>
              <th className="py-3 px-5 font-semibold">
                Foot Length (cm, Configurable)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7DFD1]">
            {sizes.map((s) => (
              <tr key={s.sizeLabel}>
                <td className="py-3 px-5 font-semibold text-[#132238]">
                  {s.sizeLabel}
                </td>
                <td className="py-3 px-5 font-mono-num text-[#1E2022]">
                  {s.footLengthCm} cm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-2">
        <h2 className="font-display text-base font-bold text-[#132238]">
          How to Measure at Home
        </h2>
        <ol className="list-decimal pl-5 text-sm text-[#5A5D65] space-y-1.5">
          <li>
            Place your child&apos;s bare or socked foot flat on a sheet of paper
            against a wall.
          </li>
          <li>Mark the back of the heel and the tip of the longest toe.</li>
          <li>Measure the distance between both marks in centimetres.</li>
          <li>
            Compare the centimetre value with our configurable Indian size chart
            above.
          </li>
        </ol>
      </div>

      <button
        type="button"
        onClick={() => navigate('/shop')}
        className="px-6 py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors"
      >
        Shop School Shoes
      </button>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { config } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFeedback(data.error || 'Could not send message.');
      } else {
        setFeedback('Thank you. Your inquiry has been received.');
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
      }
    } catch {
      setFeedback('Unable to send message right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C26D3A] mb-1">
              Get in Touch
            </p>
            <h1 className="font-display text-3xl font-bold text-[#132238]">
              Contact Us
            </h1>
            <p className="mt-2 text-sm text-[#5A5D65]">
              Questions about Indian sizing, school bulk orders, or our Return
              &amp; Reward programme? Reach out below.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1] space-y-4 text-sm text-[#5A5D65]">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#1E5AA8] mt-1 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#132238]">
                  Customer Support Email
                </p>
                <p>{config?.supportEmail || 'care@growstep.in (placeholder)'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#1E5AA8] mt-1 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#132238]">Phone</p>
                <p>
                  {config?.supportPhone || '+91 80 0000 0000 (placeholder)'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Instagram className="w-4 h-4 text-[#1E5AA8] mt-1 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#132238]">Instagram</p>
                <p>
                  {config?.instagramHandle || '@growstep.footwear (placeholder)'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#1E5AA8] mt-1 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#132238]">
                  Business Address
                </p>
                <p>
                  {config?.businessAddress ||
                    'GrowStep Footwear Studio, Bengaluru, Karnataka, India (placeholder)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E7DFD1] space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-[#132238]">
              Send a Message
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#132238] mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Order / Indian Size / Return"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#132238] mb-1">
                Message *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-[#FCFBF8] text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
            {feedback && (
              <p className="text-xs font-medium text-[#132238]">{feedback}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export const LegalPage: React.FC<{ mode: 'privacy' | 'terms' }> = ({
  mode,
}) => {
  const { config } = useStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6">
      <div className="p-4 rounded-xl bg-[#FBF5EA] border border-[#E7DFD1] text-xs text-[#132238]">
        <strong>Legal Review Notice:</strong> This is an editable template for
        an Indian D2C e-commerce storefront. Sections marked{' '}
        <code>[LEGAL REVIEW REQUIRED]</code> must be reviewed and finalized by
        qualified legal counsel before commercial launch.
      </div>

      {mode === 'privacy' ? (
        <div className="space-y-5 text-sm text-[#5A5D65] leading-relaxed">
          <h1 className="font-display text-3xl font-bold text-[#132238]">
            Privacy Policy
          </h1>
          <p>
            <strong className="text-[#132238]">
              1. Information We Collect:
            </strong>{' '}
            GrowStep collects customer contact and shipping details (name, email,
            mobile number, delivery address, PIN code) strictly to process
            orders, coordinate courier delivery, and manage customer support.
          </p>
          <p>
            <strong className="text-[#132238]">2. Payment Data:</strong> Online
            payments are processed via Razorpay. GrowStep does not store raw
            card numbers, CVV, or UPI PINs on our servers.
          </p>
          <p>
            <strong className="text-[#132238]">
              3. Statutory &amp; DPDP Act Compliance [LEGAL REVIEW REQUIRED]:
            </strong>{' '}
            Insert registered entity name, Grievance Officer details under
            India&apos;s Digital Personal Data Protection Act, 2023, data
            retention timelines, and cookie disclosures upon legal sign-off.
          </p>
          <p>
            <strong className="text-[#132238]">4. Contact:</strong> For privacy
            inquiries, write to{' '}
            {config?.supportEmail || 'care@growstep.in (placeholder)'}.
          </p>
        </div>
      ) : (
        <div className="space-y-5 text-sm text-[#5A5D65] leading-relaxed">
          <h1 className="font-display text-3xl font-bold text-[#132238]">
            Terms and Conditions
          </h1>
          <p>
            <strong className="text-[#132238]">
              1. Product Use &amp; Adaptive Fit Notice:
            </strong>{' '}
            GrowStep school shoes feature a removable EVA fitting insert
            designed to provide controlled additional internal room. Parents
            must regularly check their child&apos;s foot fit and discontinue use
            if the shoe becomes tight.
          </p>
          <p>
            <strong className="text-[#132238]">2. Pricing &amp; Orders:</strong>{' '}
            All prices are listed in Indian Rupees (INR). Orders paid via
            Razorpay are confirmed only after server-side payment verification
            succeeds.
          </p>
          <p>
            <strong className="text-[#132238]">
              3. Governing Law &amp; Entity Details [LEGAL REVIEW REQUIRED]:
            </strong>{' '}
            Insert registered Indian business entity name, GSTIN, Consumer
            Protection (E-Commerce) Rules, 2020 disclosures, and jurisdiction
            clause upon legal counsel review.
          </p>
        </div>
      )}
    </div>
  );
};
