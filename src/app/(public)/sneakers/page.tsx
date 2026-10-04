'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Check, ShieldCheck, Truck, Wallet, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const SIZES = ['40', '41', '42', '43', '44'] as const;
type Size = (typeof SIZES)[number];

const DEFAULT_SNEAKERS = [
  { _id: 'snk-1', name: 'প্রিমিয়াম এয়ার স্নিকার্স - ক্লাসিক হোয়াইট', price: 1450, imageUrl: '/images/polo-combo.jpg', sizeStock: [{ size: '40', stock: 10 }, { size: '41', stock: 10 }, { size: '42', stock: 10 }, { size: '43', stock: 10 }, { size: '44', stock: 10 }] },
  { _id: 'snk-2', name: 'আরবান স্ট্রিট স্নিকার্স - ব্ল্যাক অ্যান্ড হোয়াইট', price: 1390, imageUrl: '/images/polo-combo.jpg', sizeStock: [{ size: '40', stock: 10 }, { size: '41', stock: 10 }, { size: '42', stock: 10 }, { size: '43', stock: 10 }, { size: '44', stock: 10 }] },
  { _id: 'snk-3', name: 'ক্যাজুয়াল স্পোর্টস স্নিকার্স - অল ব্ল্যাক', price: 1450, imageUrl: '/images/polo-combo.jpg', sizeStock: [{ size: '40', stock: 10 }, { size: '41', stock: 10 }, { size: '42', stock: 10 }, { size: '43', stock: 10 }, { size: '44', stock: 10 }] },
];

export default function SneakersPublicPage() {
  const [size, setSize] = useState<Size>('42');
  const [items, setItems] = useState<any[]>(DEFAULT_SNEAKERS);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ orderNo: string; total: number } | null>(null);

  useEffect(() => {
    fetch('/api/combos?category=sneakers')
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const totalCartCount = useMemo(
    () => Object.values(cart).reduce((sum, q) => sum + q, 0),
    [cart]
  );

  const totalAmount = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const it = items.find((x) => x._id === id);
      return sum + (it?.price || 0) * qty;
    }, 0);
  }, [cart, items]);

  const updateCart = (id: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: qty };
    });
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalCartCount === 0) {
      toast.error('দয়া করে কমপক্ষে একটি স্নিকার্স সিলেক্ট করুন।');
      return;
    }
    if (!form.name.trim()) return toast.error('দয়া করে আপনার নাম লিখুন।');
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length < 11) return toast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।');
    if (!form.address.trim()) return toast.error('দয়া করে আপনার সম্পূর্ণ ঠিকানা লিখুন।');

    setSubmitting(true);
    try {
      const chosenItems = Object.entries(cart).map(([id, qty]) => {
        const it = items.find((x) => x._id === id);
        return {
          comboId: id.startsWith('snk-') ? undefined : id,
          name: `${it?.name || 'Sneakers'} (Size: ${size})`,
          quantity: qty,
          price: it?.price || 0,
          size,
          image: it?.imageUrl || '',
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
          totalAmount,
          deliveryCharge: 0,
          offerType: 'Sneakers Collection',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDone({ orderNo: data.orderNo, total: data.total });
        toast.success('আপনার অর্ডারটি সফল হয়েছে!');
        setCart({});
      } else {
        toast.error(data.message || 'অর্ডার প্রক্রিয়া করা যায়নি');
      }
    } catch {
      toast.error('সার্ভারে সমস্যা হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="bg-primary text-primary-foreground py-2 text-center text-xs md:text-sm font-semibold tracking-wide">
        🔥 প্রিমিয়াম স্নিকার্স কালেকশন — ডেলিভারি একদম ফ্রি! ক্যাশ অন ডেলিভারি!
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-10 text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> ট্রেন্ডি কালেকশন
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              প্রিমিয়াম স্নিকার্স কালেকশন
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              ডেইলি ইউজ, ক্যাজুয়াল আউটিং ও স্মার্ট লুকের জন্য সেরা স্নিকার্স। সাইজ ৪০-৪৪, ক্যাশ অন ডেলিভারি।
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50 border-t border-slate-100 text-xs md:text-sm">
            <div className="p-3.5 flex items-center justify-center gap-2 font-medium text-slate-700">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>সারা দেশে ফ্রি ডেলিভারি</span>
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
              <span>পায়ে দিয়ে দেখে পেমেন্ট</span>
            </div>
          </div>
        </div>

        {done && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 md:p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <h2 className="text-2xl md:text-3xl font-bold text-emerald-950">অর্ডার সফল হয়েছে!</h2>
            <p className="text-emerald-800 text-sm md:text-base max-w-md mx-auto">
              অর্ডার নম্বর: <strong className="font-mono text-lg text-emerald-900">{done.orderNo}</strong>
              <br />
              মোট বিল: <strong className="text-emerald-900">৳{done.total}</strong>
            </p>
            <Button onClick={() => setDone(null)} variant="outline" className="border-emerald-600 text-emerald-800">
              নতুন আরেকটি অর্ডার করুন
            </Button>
          </div>
        )}

        {/* Size Selection */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg md:text-xl font-bold">১. জুতার সাইজ নির্বাচন করুন</h2>
            <span className="text-xs text-muted-foreground">সিলেক্টেড: <strong>সাইজ {size}</strong></span>
          </div>

          <div className="grid grid-cols-5 gap-3 max-w-md">
            {SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSize(sz)}
                className={`py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                  size === sz
                    ? 'border-primary bg-primary text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </section>

        {/* Products List */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg md:text-xl font-bold">২. পছন্দের স্নিকার্স বেছে নিন</h2>
            <span className="text-xs font-bold text-primary">আইটেম সিলেক্টেড: {totalCartCount} টি</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((it) => {
              const qty = cart[it._id] ?? 0;
              return (
                <div key={it._id} className="border rounded-2xl overflow-hidden shadow-sm flex flex-col bg-white">
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={it.imageUrl || '/images/polo-combo.jpg'}
                      alt={it.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/75 text-white text-xs font-bold">
                      ৳{it.price}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2">{it.name}</h3>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-lg font-black text-slate-900">৳{it.price}</span>
                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 border">
                          <button
                            type="button"
                            onClick={() => updateCart(it._id, qty - 1)}
                            className="w-7 h-7 bg-white rounded font-bold text-xs hover:bg-slate-200 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-extrabold text-sm">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateCart(it._id, qty + 1)}
                            className="w-7 h-7 bg-white rounded font-bold text-xs hover:bg-slate-200 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => updateCart(it._id, 1)} className="rounded-lg text-xs">
                          অর্ডারে নিন
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Checkout Form */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-lg md:text-xl font-bold">৩. ডেলিভারি তথ্য ও অর্ডার কনফার্ম</h2>
            <p className="text-xs text-slate-500 mt-1">পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ করুন।</p>
          </div>

          <form onSubmit={handleOrder} className="space-y-4 max-w-xl">
            <div>
              <Label className="font-semibold">আপনার নাম *</Label>
              <Input
                placeholder="যেমন: মোঃ সাকিব হোসেন"
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
                placeholder="যেমন: 018XXXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label className="font-semibold">সম্পূর্ণ ঠিকানা *</Label>
              <Textarea
                placeholder="বাসা নং, রোড নং, এলাকা/থানা, জেলা"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border space-y-2 text-sm">
              <div className="flex justify-between">
                <span>সিলেক্টেড স্নিকার্স ({totalCartCount} জোড়া - সাইজ: {size})</span>
                <span className="font-bold">৳{totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>ডেলিভারি চার্জ</span>
                <span className="font-bold">ফ্রি (০ টাকা)</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-base font-extrabold text-slate-900">
                <span>সর্বমোট বিল</span>
                <span className="text-xl text-primary font-black">৳{totalAmount}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || totalCartCount === 0}
              className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
            >
              {submitting ? 'অর্ডার হচ্ছে...' : `৳${totalAmount} অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)`}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}
