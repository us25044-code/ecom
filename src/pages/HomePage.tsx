import React, { useState } from 'react';
import {
  ArrowRight,
  CloudRain,
  Layers,
  Recycle,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MEDIA } from '../lib/media';
import { ProductCard } from '../components/ProductCard';
import { ResilientImage } from '../components/ResilientImage';

export const HomePage: React.FC = () => {
  const { products, reviews, config, navigate, refreshStorefront } = useStore();
  const [cutawayTab, setCutawayTab] = useState<'boys' | 'girls' | 'pe'>('boys');
  const [authorName, setAuthorName] = useState('');
  const [city, setCity] = useState('');
  const [productId, setProductId] = useState(products[0]?.id || 'prod-boys-black');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const cutawayData = {
    boys: {
      label: "Boys' Black Lace-Up",
      cutawayImg: MEDIA.boysCutaway,
      topImg: MEDIA.boysTopInsert,
      desc: '4-eyelet lace-up formal shoe with cobalt-blue removable EVA insert seated over a grey cushioned footbed.',
      slug: 'boys-black-school-shoe',
    },
    girls: {
      label: "Girls' Mary Jane",
      cutawayImg: MEDIA.girlsCutaway,
      topImg: MEDIA.girlsTopInsert,
      desc: 'Single adjustable strap Mary Jane with breathable vamp pores and cobalt-blue removable EVA fitting insert.',
      slug: 'girls-black-mary-jane-shoe',
    },
    pe: {
      label: 'White Unisex PE',
      cutawayImg: MEDIA.whiteCutaway,
      topImg: MEDIA.whiteTopInsert,
      desc: 'Crisp white single-strap PE shoe with perforated toe box and removable cobalt-blue EVA fitting insert.',
      slug: 'unisex-white-pe-school-shoe',
    },
  }[cutawayTab];

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setReviewMsg(null);
    try {
      const targetId = productId || products[0]?.id;
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: targetId,
          authorName,
          city,
          rating,
          comment,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setReviewMsg({
          type: 'err',
          text: data.error || 'Could not submit review.',
        });
      } else {
        setReviewMsg({
          type: 'ok',
          text: 'Thank you. Your review has been published below.',
        });
        setAuthorName('');
        setCity('');
        setComment('');
        await refreshStorefront();
      }
    } catch {
      setReviewMsg({
        type: 'err',
        text: 'Network error while submitting review.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Section 2: Editorial Hero Banner */}
      <section className="bg-[#F6F1E7] border-b border-[#E7DFD1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <p className="text-xs font-semibold tracking-wider text-[#C26D3A]">
                Uniform-ready · Monsoon-conscious · Indian sizes IND 10–4
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#132238] tracking-tight leading-[1.08] text-balance">
                {config?.heroHeadline || 'School Shoes That Grow With Them.'}
              </h1>
              <p className="text-base text-[#1E2022]/80 leading-relaxed max-w-md">
                {config?.heroSubheading ||
                  'More comfort. More durability. More value for every growing step.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="px-7 py-3.5 rounded-lg bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Shop Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/about')}
                  className="px-5 py-3.5 text-sm font-semibold text-[#132238] underline underline-offset-4 hover:text-[#1E5AA8] transition-colors whitespace-nowrap"
                >
                  Discover GrowStep
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl overflow-hidden bg-[#FBF5EA] border border-[#E7DFD1] aspect-[16/9]">
                <ResilientImage
                  src={MEDIA.heroBanner}
                  alt="GrowStep school shoe collection: Boys Black Lace-Up, Girls Mary Jane, and Unisex White PE"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clean 4-column Footwear Value Strip */}
        <div className="border-t border-[#E7DFD1] bg-[#FCFBF8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E7DFD1]">
            <div className="py-5 sm:pr-6 flex items-center gap-3.5">
              <Layers className="w-5 h-5 text-[#1E5AA8] shrink-0" />
              <div>
                <p className="font-display text-sm font-bold text-[#132238]">
                  Adaptive Fit
                </p>
                <p className="text-xs text-[#5A5D65]">
                  Removable cobalt-blue EVA insert for controlled room
                </p>
              </div>
            </div>
            <div className="py-5 sm:px-6 flex items-center gap-3.5">
              <CloudRain className="w-5 h-5 text-[#1E5AA8] shrink-0" />
              <div>
                <p className="font-display text-sm font-bold text-[#132238]">
                  Monsoon Ready
                </p>
                <p className="text-xs text-[#5A5D65]">
                  Quick-dry mesh lining &amp; wipe-clean PU microfibre
                </p>
              </div>
            </div>
            <div className="py-5 sm:pl-6 flex items-center gap-3.5">
              <ShieldCheck className="w-5 h-5 text-[#1E5AA8] shrink-0" />
              <div>
                <p className="font-display text-sm font-bold text-[#132238]">
                  Longer Product Life
                </p>
                <p className="text-xs text-[#5A5D65]">
                  Reinforced toe cap, heel counter &amp; anti-slip outsole
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Shop Our Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#C26D3A] mb-1">
              School Uniform Lineup
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#132238]">
              Shop Our Collection
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="text-sm font-semibold text-[#132238] hover:text-[#1E5AA8] inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Filter by Indian size</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.slice(0, 3).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Section 4: Why GrowStep? (Editorial Photography + Clean Rules) */}
      <section className="bg-[#F6F1E7] border-y border-[#E7DFD1] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#132238] text-balance">
              Why GrowStep?
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#1E2022]/80 leading-relaxed">
              School shoes designed to adapt to growing feet, withstand everyday
              school wear and handle Indian monsoon conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#FBF5EA] border border-[#E7DFD1]">
                <ResilientImage
                  src={MEDIA.blueEvaInsert}
                  alt="Removable blue die-cut EVA fitting insert"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-2 border-t border-[#132238]/15 space-y-1.5">
                <h3 className="font-display text-lg font-bold text-[#132238]">
                  01. Adaptive Fit
                </h3>
                <p className="text-sm text-[#5A5D65] leading-relaxed">
                  A removable cobalt-blue EVA fitting insert sits above the
                  cushioned footbed, giving controlled additional room when
                  removed as feet grow.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#FBF5EA] border border-[#E7DFD1]">
                <ResilientImage
                  src={MEDIA.ventilationPores}
                  alt="Subtle micro-perforation ventilation pores and breathable collar mesh"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-2 border-t border-[#132238]/15 space-y-1.5">
                <h3 className="font-display text-lg font-bold text-[#132238]">
                  02. Monsoon Ready
                </h3>
                <p className="text-sm text-[#5A5D65] leading-relaxed">
                  Water-resistant PU-coated microfibre upper wipes clean after
                  puddles, paired with a quick-drying breathable polyester mesh
                  lining and subtle ventilation pores.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#FBF5EA] border border-[#E7DFD1]">
                <ResilientImage
                  src={MEDIA.shoeOutsoleBlack}
                  alt="Anti-slip non-marking rubber TPR outsole tread"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-2 border-t border-[#132238]/15 space-y-1.5">
                <h3 className="font-display text-lg font-bold text-[#132238]">
                  03. Built for Everyday School Wear
                </h3>
                <p className="text-sm text-[#5A5D65] leading-relaxed">
                  Reinforced toe cap, structured heel counter with woven pull
                  tab, durable stitching, and a non-marking anti-slip TPR
                  outsole.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Interactive How Adaptive Fit Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#1E5AA8] mb-1">
              Inside Every GrowStep Pair
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#132238]">
              How Adaptive Fit Works
            </h2>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1] self-start">
            {(
              [
                { id: 'boys', label: "Boys' Lace-Up" },
                { id: 'girls', label: "Girls' Mary Jane" },
                { id: 'pe', label: 'White Unisex' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setCutawayTab(t.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  cutawayTab === t.id
                    ? 'bg-[#132238] text-white'
                    : 'text-[#5A5D65] hover:text-[#132238]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl overflow-hidden bg-[#FBF5EA] border border-[#E7DFD1] aspect-[4/3]">
              <ResilientImage
                src={cutawayData.cutawayImg}
                alt={`${cutawayData.label} cutaway showing cobalt-blue removable EVA insert`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="rounded-xl overflow-hidden bg-[#FBF5EA] border border-[#E7DFD1] aspect-[4/3]">
                <ResilientImage
                  src={cutawayData.topImg}
                  alt={`${cutawayData.label} top view with blue EVA insert`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2.5 p-2">
                <p className="font-display text-base font-bold text-[#132238]">
                  {cutawayData.label}
                </p>
                <p className="text-xs text-[#5A5D65] leading-relaxed">
                  {cutawayData.desc}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/products/${cutawayData.slug}`)}
                  className="text-xs font-semibold text-[#1E5AA8] underline underline-offset-4"
                >
                  View {cutawayData.label}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="divide-y divide-[#E7DFD1] border-y border-[#E7DFD1]">
              <div className="py-5">
                <p className="text-xs font-semibold text-[#1E5AA8] mb-1">
                  Stage 01 · Initial Fitting
                </p>
                <h3 className="font-display text-base font-bold text-[#132238]">
                  Insert installed — Supportive Day 1 fit
                </h3>
                <p className="mt-1 text-sm text-[#5A5D65] leading-relaxed">
                  The cobalt-blue EVA fitting insert sits cleanly on top of the
                  grey cushioned footbed to keep growing feet snugly cradled.
                </p>
              </div>

              <div className="py-5">
                <p className="text-xs font-semibold text-[#1E5AA8] mb-1">
                  Stage 02 · Growth Check
                </p>
                <h3 className="font-display text-base font-bold text-[#132238]">
                  Child&apos;s foot grows — Parent checks the fit
                </h3>
                <p className="mt-1 text-sm text-[#5A5D65] leading-relaxed">
                  Check toe clearance regularly throughout the school term when
                  the shoe begins feeling snug at the front.
                </p>
              </div>

              <div className="py-5">
                <p className="text-xs font-semibold text-[#1E5AA8] mb-1">
                  Stage 03 · Controlled Room
                </p>
                <h3 className="font-display text-base font-bold text-[#132238]">
                  Insert removed/replaced — Additional room becomes available
                </h3>
                <p className="mt-1 text-sm text-[#5A5D65] leading-relaxed">
                  Lift out the blue EVA fitting insert so the grey footbed base
                  gives controlled extra space while laces or strap secure the
                  heel.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5A5D65] leading-relaxed">
              <strong className="text-[#132238]">Important Fit Guidance:</strong>{' '}
              Accommodating approximately one additional size is a proposed
              design capability requiring prototype validation. Fit must be
              checked regularly, and the shoe must never be worn if it feels
              tight.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Return & Reward */}
      <section className="bg-[#132238] text-[#FCFBF8] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#F6F1E7]/80">
                <Recycle className="w-4 h-4 text-[#C26D3A]" />
                <span>Proposed Return &amp; Reward Programme</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-balance">
                Give Your Old Shoes a New Purpose.
              </h2>
              <p className="text-sm sm:text-base text-[#FBF7F0]/80 leading-relaxed">
                When your child outgrows their pair, return eligible used
                GrowStep shoes for{' '}
                <strong className="text-white">
                  ₹{config?.returnRewardMinInr ?? 100}–₹
                  {config?.returnRewardMaxInr ?? 150} store credit
                </strong>{' '}
                towards their next size.
              </p>
              <p className="text-xs text-[#FBF7F0]/65">
                {config?.returnRewardPartnerStatus ||
                  'Proposed programme — recycling & donation partner onboarding in progress.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/return-reward')}
                  className="px-6 py-3 rounded-lg bg-[#F6F1E7] text-[#132238] text-sm font-semibold hover:bg-white transition-colors inline-flex items-center gap-2"
                >
                  <span>See Programme Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 border-t lg:border-t-0 lg:border-l border-white/15 pt-8 lg:pt-0 lg:pl-10">
              <div className="space-y-1.5">
                <h3 className="font-display text-sm font-bold text-white">
                  01. How It Works
                </h3>
                <p className="text-xs text-[#FBF7F0]/75 leading-relaxed">
                  Register your outgrown GrowStep order number online once your
                  child needs the next Indian size.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-sm font-bold text-white">
                  02. Eligibility Conditions
                </h3>
                <p className="text-xs text-[#FBF7F0]/75 leading-relaxed">
                  Authentic GrowStep pairs in intact wearable or recyclable
                  condition qualify for inspection.
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-sm font-bold text-white">
                  03. Collection Process
                </h3>
                <p className="text-xs text-[#FBF7F0]/75 leading-relaxed">
                  Scheduled courier pickup or participating drop-off points
                  (configurable by city and partner readiness).
                </p>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-sm font-bold text-white">
                  04. Reward Credit
                </h3>
                <p className="text-xs text-[#FBF7F0]/75 leading-relaxed">
                  Eligible pairs earn ₹{config?.returnRewardMinInr ?? 100}–₹
                  {config?.returnRewardMaxInr ?? 150} credit while pairs are
                  directed to donation or recycling partners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#132238]">
                Parent Reviews &amp; Feedback
              </h2>
              <p className="mt-1.5 text-xs text-[#5A5D65]">
                Sample entries below are clearly labelled as preview content
                until verified customer orders are reviewed.
              </p>
            </div>

            <div className="divide-y divide-[#E7DFD1] border-t border-[#E7DFD1]">
              {reviews.map((rev) => (
                <div key={rev.id} className="py-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[#132238]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating
                              ? 'fill-[#132238] text-[#132238]'
                              : 'text-[#E7DFD1]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-[#5A5D65]">
                      {rev.isSample
                        ? 'Sample Review Preview'
                        : 'Submitted Review'}{' '}
                      · {rev.productName}
                    </span>
                  </div>
                  <p className="text-sm text-[#1E2022] leading-relaxed">
                    {rev.comment}
                  </p>
                  <p className="text-xs font-semibold text-[#132238]">
                    {rev.authorName} · {rev.city}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-2xl bg-[#F6F1E7] border border-[#E7DFD1]">
              <h3 className="font-display text-lg font-bold text-[#132238] mb-1">
                Submit Your Review
              </h3>
              <p className="text-xs text-[#5A5D65] mb-5">
                Share your experience with GrowStep sizing, comfort, or school
                durability.
              </p>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#132238] mb-1">
                    Shoe Model
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] text-sm text-[#1E2022] bg-white focus:outline-none focus:border-[#132238]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#132238] mb-1">
                      Parent Name
                    </label>
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="e.g. Meera Kapoor"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-white text-sm focus:outline-none focus:border-[#132238]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#132238] mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-white text-sm focus:outline-none focus:border-[#132238]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#132238] mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRating(val)}
                        aria-label={`Rate ${val} out of 5`}
                        className="p-1.5 rounded-md hover:bg-white/60"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            val <= rating
                              ? 'fill-[#132238] text-[#132238]'
                              : 'text-[#E7DFD1]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#132238] mb-1">
                    Review Comment
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share thoughts on fit, comfort, or durability..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DFD1] bg-white text-sm focus:outline-none focus:border-[#132238]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-lg bg-[#132238] text-white text-sm font-semibold hover:bg-[#1E5AA8] transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>

                {reviewMsg && (
                  <p
                    className={`text-xs ${
                      reviewMsg.type === 'err'
                        ? 'text-red-600'
                        : 'text-[#132238]'
                    }`}
                  >
                    {reviewMsg.text}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
