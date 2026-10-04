'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, ShieldCheck, Truck, Wallet, Sparkles, CheckCircle2, ChevronRight, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const SIZES = ['M', 'L', 'XL', 'XXL'] as const;
type Size = (typeof SIZES)[number];

const COMBO_PRICE = 999;
const COMBO_TARGET_COUNT = 5;

// Default fallback colors in case DB is initially empty
const DEFAULT_COLORS = [
  { _id: 'def-1', name: 'Royal Blue', colorName: 'Royal Blue', colorHex: '#1e3a8a', imageUrl: '/images/polo-combo.jpg', sizeStock: [{ size: 'M', stock: 20 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 20 }, { size: 'XXL', stock: 20 }] },
  { _id: 'def-2', name: 'Classic Black', colorName: 'Classic Black', colorHex: '#0f172a', imageUrl: '/images/polo-combo.jpg', sizeStock: [{ size: 'M', stock: 20 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 20 }, { size: 'XXL', stock: 20 }] },
  { _id: 'def-3', name: 'Maroon', colorName: 'Maroon', colorHex: '#881337', imageUrl: '/images/polo-combo.jpg', sizeStock: [{ size: 'M', stock: 20 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 20 }, { size: 'XXL', stock: 20 }] },
  { _id: 'def-4', name: 'Olive Green', colorName: 'Olive Green', colorHex: '#365314', imageUrl: '/images/polo-combo.jpg', sizeStock: [{ size: 'M', stock: 20 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 20 }, { size: 'XXL', stock: 20 }] },
  { _id: 'def-5', name: 'Charcoal Grey', colorName: 'Charcoal Grey', colorHex: '#334155', imageUrl: '/images/polo-combo.jpg', sizeStock: [{ size: 'M', stock: 20 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 20 }, { size: 'XXL', stock: 20 }] },
  { _id: 'def-6', name: 'Pure White', colorName: 'Pure White', colorHex: '#f8fafc', imageUrl: '/images/polo-combo.jpg', sizeStock: [{ size: 'M', stock: 20 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 20 }, { size: 'XXL', stock: 20 }] },
];

export default function PoloComboPage() {
  const [size, setSize] = useState<Size>('L');
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ orderNo: string; total: number } | null>(null);
  const [variants, setVariants] = useState<any[]>(DEFAULT_COLORS);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    fetch('/api/combos?category=polo')
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setVariants(data.items);
        }
      })
      .catch((err) => console.error('Error fetching polo items:', err))
      .finally(() => setLoadingItems(false));
  }, []);

  // Filter variants available in the selected size
  const activeVariants = useMemo(() => {
    return variants.filter((v) => {
      const entry = v.sizeStock?.find((s: any) => s.size === size);
      return !entry || entry.stock > 0;
    });
  }, [variants, size]);

  const totalPicked = useMemo(
    () => Object.values(picks).reduce((sum, count) => sum + count, 0),
    [picks]
  );

  const togglePick = (variantId: string) => {
    setPicks((prev) => {
      const current = prev[variantId] ?? 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[variantId];
        return next;
      }
      if (totalPicked >= COMBO_TARGET_COUNT) {
        toast.info(`আপনি ইতিমধ্যে ৫টি টি-শার্ট বেছে নিয়েছেন। অন্যটি নিতে চাইলে আগের একটি বাদ দিন।`);
        return prev;
      }
      return { ...prev, [variantId]: 1 };
    });
  };

  const setQuantity = (variantId: string, qty: number) => {
    setPicks((prev) => {
      const current = prev[variantId] ?? 0;
      const otherTotal = totalPicked - current;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[variantId];
        return next;
      }
      if (otherTotal + qty > COMBO_TARGET_COUNT) {
        toast.info(`মোট ৫টির বেশি নেওয়া যাবে না।`);
        return prev;
      }
      return { ...prev, [variantId]: qty };
    });
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPicked !== COMBO_TARGET_COUNT) {
      toast.error(`দয়া করে ঠিক ${COMBO_TARGET_COUNT}টি শার্ট পছন্দ করুন (বর্তমানে ${totalPicked}টি বেছেছেন)।`);
      return;
    }
    if (!form.name.trim()) return toast.error('দয়া করে আপনার নাম লিখুন।');
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length < 11) return toast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।');
    if (!form.address.trim()) return toast.error('দয়া করে আপনার সম্পূর্ণ ঠিকানা লিখুন।');

    setSubmitting(true);
    try {
      const chosenItems = Object.entries(picks).map(([id, qty]) => {
        const v = variants.find((x) => x._id === id);
        return {
          comboId: id.startsWith('def-') ? undefined : id,
          name: `Polo Shirt - ${v?.colorName || v?.name || 'Color'} (Size: ${size})`,
          quantity: qty,
          price: Math.round(COMBO_PRICE / COMBO_TARGET_COUNT),
          size,
          color: v?.colorName || v?.name || '',
          image: v?.imageUrl || '/images/polo-combo.jpg',
        };
      });

      const res = await fetch('/api/combos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.name,
          phone: form.phone,
          address: form.address,
          items: chosenItems,
          totalAmount: COMBO_PRICE,
          deliveryCharge: 0,
          offerType: 'Polo 5-pcs Combo',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDone({ orderNo: data.orderNo, total: data.total });
        toast.success('আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!');
        setPicks({});
      } else {
        toast.error(data.message || 'অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch {
      toast.error('সার্ভারে সমস্যা হয়েছে। একটু পর আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Notification Bar */}
      <div className="bg-primary text-primary-foreground py-2 text-center text-xs md:text-sm font-semibold tracking-wide">
        🔥 মেগা ধামাকা অফার: ৫ পিস প্রিমিয়াম পোলো শার্ট মাত্র ৯৯৯ টাকা! সারা বাংলাদেশে ক্যাশ অন ফ্রি ডেলিভারি!
      </div>

      {/* Main Hero Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-10">
        {/* Hero Banner Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[380px] bg-slate-900">
            <Image
              src="/images/polo-combo.jpg"
              alt="Gentsity 5 Pcs Polo Combo"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 md:p-8 text-white">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold w-fit mb-2">
                <Sparkles className="w-3.5 h-3.5" /> লিমিটেড স্টক অফার
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                ৫ পিস পোলো শার্ট মাত্র ৯৯৯ টাকা
              </h1>
              <p className="mt-1 text-slate-200 text-xs sm:text-sm md:text-base max-w-xl">
                পছন্দের সাইজ বাছুন এবং স্টকে থাকা পছন্দের কালার থেকে নিজের কম্বো বানিয়ে নিন।
              </p>
            </div>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50 border-t border-slate-100 text-xs md:text-sm">
            <div className="p-3.5 flex items-center justify-center gap-2 font-medium text-slate-700">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>সারা বাংলাদেশে ফ্রি ডেলিভারি</span>
            </div>
            <div className="p-3.5 flex items-center justify-center gap-2 font-medium text-slate-700">
              <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ক্যাশ অন ডেলিভারি</span>
            </div>
            <div className="p-3.5 flex items-center justify-center gap-2 font-medium text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>১০০% কোয়ালিটি গ্যারান্টি</span>
            </div>
            <div className="p-3.5 flex items-center justify-center gap-2 font-medium text-slate-700">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>প্রোডাক্ট দেখে পেমেন্ট</span>
            </div>
          </div>
        </div>

        {/* Success Modal View */}
        {done && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 md:p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">অভিনন্দন! আপনার অর্ডার সফল হয়েছে</h2>
            <p className="text-emerald-800 text-sm md:text-base max-w-md mx-auto">
              আপনার অর্ডার নম্বর: <strong className="font-mono text-lg text-emerald-900">{done.orderNo}</strong>
              <br />
              মোট বিল: <strong className="text-emerald-900">৳{done.total}</strong> (ক্যাশ অন ডেলিভারি)
            </p>
            <p className="text-xs text-emerald-700">
              আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করে অর্ডার কনফার্ম করবেন।
            </p>
            <Button onClick={() => setDone(null)} variant="outline" className="border-emerald-600 text-emerald-800">
              নতুন আরেকটি অর্ডার করুন
            </Button>
          </div>
        )}

        {/* Step 1: Size Selector */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">ধাপ ১</span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">আপনার সাইজ নির্বাচন করুন</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">সিলেক্টেড: <strong>{size}</strong></span>
          </div>

          <div className="grid grid-cols-4 gap-3 max-w-md">
            {SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => {
                  setSize(sz);
                  setPicks({});
                }}
                className={`py-3 rounded-xl font-bold text-base transition-all border-2 ${
                  size === sz
                    ? 'border-primary bg-primary text-white shadow-md shadow-primary/20 scale-105'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* Size Chart Guide */}
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-wrap gap-x-6 gap-y-1">
            <span><strong>M:</strong> চেস্ট ৩৮", লেন্থ ২৭"</span>
            <span><strong>L:</strong> চেস্ট ৪০", লেন্থ ২৮"</span>
            <span><strong>XL:</strong> চেস্ট ৪২", লেন্থ ২৯"</span>
            <span><strong>XXL:</strong> চেস্ট ৪৪", লেন্থ ৩০"</span>
          </div>
        </section>

        {/* Step 2: Color Picker */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">ধাপ ২</span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                ৫টি পছন্দের কালার বেছে নিন
              </h2>
            </div>

            {/* Counter Badge */}
            <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
              totalPicked === COMBO_TARGET_COUNT
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              <span>বাছাই করেছেন:</span>
              <span className="text-lg font-extrabold">{totalPicked} / {COMBO_TARGET_COUNT}</span>
              {totalPicked === COMBO_TARGET_COUNT && <Check className="w-4 h-4 text-emerald-700" />}
            </div>
          </div>

          {/* Grid of Variants */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
            {activeVariants.map((v) => {
              const count = picks[v._id] ?? 0;
              const isPicked = count > 0;

              return (
                <div
                  key={v._id}
                  onClick={() => togglePick(v._id)}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all cursor-pointer bg-white ${
                    isPicked
                      ? 'border-primary ring-2 ring-primary/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="relative aspect-square w-full bg-slate-100">
                    <Image
                      src={v.imageUrl || '/images/polo-combo.jpg'}
                      alt={v.colorName || v.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/75 backdrop-blur-sm text-white text-[11px] font-semibold">
                      <span
                        className="w-3 h-3 rounded-full border border-white"
                        style={{ backgroundColor: v.colorHex || '#000000' }}
                      />
                      {v.colorName || v.name}
                    </div>

                    {isPicked && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow">
                        ✓
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-1">
                      {v.colorName || v.name}
                    </span>

                    {/* Quantity Selector */}
                    {isPicked ? (
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border">
                        <button
                          type="button"
                          onClick={() => setQuantity(v._id, count - 1)}
                          className="w-6 h-6 rounded bg-white font-bold text-xs flex items-center justify-center hover:bg-slate-200"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-extrabold text-xs">{count}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(v._id, count + 1)}
                          className="w-6 h-6 rounded bg-white font-bold text-xs flex items-center justify-center hover:bg-slate-200"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5"
                        onClick={() => togglePick(v._id)}
                      >
                        পছন্দ করুন
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 3: Checkout Form */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">ধাপ ৩</span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">ডেলিভারির তথ্য ও অর্ডার কনফার্ম</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              সঠিক নাম ও ফোন নম্বর দিন। কোনো অগ্রিম টাকা দিতে হবে না, পণ্য হাতে পেয়ে মূল্য পরিশোধ করবেন।
            </p>
          </div>

          <form onSubmit={handleOrder} className="space-y-4 max-w-xl">
            <div>
              <Label className="font-semibold">আপনার নাম *</Label>
              <Input
                placeholder="যেমন: মোঃ ইমরান হোসেন"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label className="font-semibold">মোবাইল নম্বর *</Label>
              <Input
                type="tel"
                placeholder="যেমন: 017XXXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label className="font-semibold">সম্পূর্ণ ঠিকানা (বাসা/রোড/থানা/জেলা) *</Label>
              <Textarea
                placeholder="যেমন: বাড়ি নং ১২, রোড নং ৪, সেক্টর ৭, উত্তরা, ঢাকা"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>৫ পিস পোলো শার্ট কম্বো (সাইজ: {size})</span>
                <span className="font-bold">৳{COMBO_PRICE}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>হোম ডেলিভারি চার্জ</span>
                <span className="font-bold">ফ্রি (০ টাকা)</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-base font-extrabold text-slate-900">
                <span>সর্বমোট পরিশোধযোগ্য বিল</span>
                <span className="text-xl text-primary font-black">৳{COMBO_PRICE}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
            >
              {submitting ? 'অর্ডার প্রসেস হচ্ছে...' : 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)'}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
