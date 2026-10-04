'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Check, Flame, Ruler, ShieldCheck, Sparkles, Truck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import OfferTabsHeader from '@/components/offers/OfferTabsHeader';

const SIZES = ['40', '41', '42', '43', '44'] as const;
type Size = (typeof SIZES)[number];

interface SneakerProduct {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  sizeStock: { size: string; stock: number }[];
}

export default function SneakersPage() {
  const [size, setSize] = useState<Size | null>(null);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'outside'>('outside');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [done, setDone] = useState<{ orderNo: string; total: number; deliveryCharge: number } | null>(null);
  const [products, setProducts] = useState<SneakerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    sneakers_free_delivery: 'off',
    sneakers_delivery_charge_dhaka: 80,
    sneakers_delivery_charge_outside: 130,
  });

  useEffect(() => {
    fetch('/api/combos/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  const freeDelivery = settings.sneakers_free_delivery === 'on';
  const dhakaCharge = Math.max(0, Number(settings.sneakers_delivery_charge_dhaka) || 80);
  const outsideCharge = Math.max(0, Number(settings.sneakers_delivery_charge_outside) || 130);
  const deliveryCharge = freeDelivery ? 0 : deliveryArea === 'dhaka' ? dhakaCharge : outsideCharge;

  useEffect(() => {
    async function fetchSneakers() {
      try {
        setLoading(true);
        const res = await fetch('/api/combos?category=sneakers');
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setProducts(data.items);
        }
      } catch (err) {
        console.error('Failed to load sneakers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSneakers();
  }, []);

  const selected = useMemo(
    () => products.filter((p) => (picks[p._id] ?? 0) > 0),
    [products, picks]
  );
  const totalUnits = Object.values(picks).reduce((sum, qty) => sum + qty, 0);
  const subtotal = selected.reduce((sum, p) => sum + p.price * (picks[p._id] ?? 0), 0);
  const total = subtotal + deliveryCharge;

  const orderProduct = (product: SneakerProduct) => {
    setPicks({ [product._id]: 1 });
    setCheckoutOpen(true);
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalUnits < 1) {
      toast.error('কমপক্ষে একটি প্রোডাক্ট সিলেক্ট করুন।');
      return;
    }
    if (!size) {
      toast.error('অর্ডারের সাইজ বাছুন।');
      return;
    }
    const cleanPhone = form.phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 11 || !/^01[3-9]\d{8}$/.test(cleanPhone)) {
      toast.error('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন ০১৭xxxxxxxx)।');
      return;
    }
    if (!form.address.trim()) {
      toast.error('আপনার সম্পূর্ণ ঠিকানা লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = selected.map((p) => ({
        comboId: p._id,
        name: p.name,
        quantity: picks[p._id] || 1,
        price: p.price,
        size: size,
        image: p.imageUrl || '',
      }));

      const res = await fetch('/api/combos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.name.trim(),
          phone: cleanPhone,
          address: form.address.trim(),
          deliveryArea,
          deliveryCharge,
          totalAmount: total,
          offerType: 'sneakers',
          items: orderItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'অর্ডার প্রক্রিয়া করা যায়নি।');
      }

      setDone({ orderNo: data.orderNo, total: data.total || total, deliveryCharge });
      setPicks({});
      setSize(null);
      setForm({ name: '', phone: '', address: '' });
      setCheckoutOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toast.error(err.message || 'অর্ডার জমা হয়নি, আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-16">
      <OfferTabsHeader />

      {done ? (
        <section className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 sm:p-12 text-center shadow-sm">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#18483b] text-white">
              <Check className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900">অর্ডার সফল হয়েছে!</h1>
            <p className="mt-3 text-base text-gray-600">
              অর্ডার নম্বর <strong>#{done.orderNo}</strong>। ডেলিভারি চার্জ {done.deliveryCharge} টাকাসহ মোট {done.total} টাকা। আমরা শীঘ্রই কল দিয়ে অর্ডার কনফার্ম করব।
            </p>
            <Button
              className="mt-6 bg-[#18483b] text-white hover:bg-[#123e31] px-8 py-2.5 rounded-lg text-base font-bold"
              onClick={() => setDone(null)}
            >
              আরেকটি অর্ডার করুন
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className="mx-auto max-w-4xl px-4 pb-6 pt-8 text-center">
            <p className="text-sm font-bold tracking-wider text-[#18483b]">GENTSITY SNEAKERS COLLECTION</p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl text-gray-900 leading-tight">
              <Flame className="inline h-7 w-7 text-red-600 mb-1" /> প্রিমিয়াম স্নিকার্স <Flame className="inline h-7 w-7 text-red-600 mb-1" />
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600">
              দেখতে স্মার্ট, ব্যবহারে কমফোর্টেবল — প্রতিদিনের জন্য পারফেক্ট জুতা! <Sparkles className="inline h-4 w-4 text-[#18483b]" />
            </p>

            {/* Sneakers Hero Banner */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs">
              <Image
                src="/assets/images/Banner/sneakersbanner.webp"
                alt="Gentsity স্নিকার্স — স্টাইল আর কমফোর্টের গ্যারেন্টি"
                width={1200}
                height={600}
                priority
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Why buy this box */}
            <div className="mt-6 rounded-2xl border border-gray-200/90 bg-white p-5 text-left text-sm shadow-2xs">
              <h2 className="mb-3 font-bold text-gray-900 flex items-center gap-1.5 text-base">
                <Flame className="inline h-5 w-5 text-red-600" /> কেন এই প্রোডাক্ট নিবেন?
              </h2>
              <ul className="space-y-2.5 text-gray-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> প্রিমিয়াম ফিনিশিং — দেখতে smart, ব্যবহারেও comfortable
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> Daily use, casual outing এবং smart look-এর জন্য perfect
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> Available sizes: 40, 41, 42, 43, 44
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> Cash on Delivery সুবিধা
                </li>
              </ul>
            </div>

            <p className="mt-7 text-base font-extrabold text-gray-900">
              <Ruler className="inline h-5 w-5 text-[#18483b] mr-1" /> সাইজ: 40 | 41 | 42 | 43 | 44
            </p>

            <ul className="mt-6 flex flex-wrap justify-center gap-6 text-sm font-semibold text-gray-700">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#18483b]" /> {freeDelivery ? 'সারা বাংলাদেশে ফ্রি ডেলিভারি' : 'সারা বাংলাদেশে ডেলিভারি'}
              </li>
              <li className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#18483b]" /> হাতে পেয়ে টাকা দিন
              </li>
            </ul>
          </section>

          {/* Sneakers Grid */}
          <main className="mx-auto max-w-6xl px-4 pb-16">
            {loading ? (
              <p className="py-12 text-center text-sm font-medium text-gray-500">প্রোডাক্ট লোড হচ্ছে…</p>
            ) : products.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
                স্নিকার্স প্রোডাক্ট শিগগিরই আসছে।
              </p>
            ) : (
              <div className="mx-auto grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
                {products.map((product) => {
                  const qty = picks[product._id] ?? 0;
                  return (
                    <article
                      key={product._id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-2xs transition-all ${
                        qty > 0 ? 'border-[#18483b] ring-2 ring-[#18483b]' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="relative aspect-[4/5] bg-gray-50">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-gray-400">
                            ছবি আপলোড করা হয়নি
                          </div>
                        )}
                        <span className="absolute left-2.5 top-2.5 rounded-lg bg-white/90 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-gray-800 shadow-xs">
                          স্নিকার্স
                        </span>
                        {qty > 0 && (
                          <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#18483b] text-white shadow-xs">
                            <Check className="h-5 w-5" />
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h2 className="min-h-[40px] text-sm font-bold text-gray-900 md:text-base leading-snug">
                          {product.name}
                        </h2>
                        <p className="mt-2 text-lg font-extrabold text-[#18483b]">৳{product.price}</p>
                        <Button
                          type="button"
                          className="mt-3.5 w-full bg-[#18483b] text-white hover:bg-[#123e31] font-bold py-2 rounded-xl"
                          onClick={() => orderProduct(product)}
                        >
                          অর্ডার করুন
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Return & Refund Policies */}
            <section className="mx-auto mt-10 max-w-3xl space-y-4 text-left text-sm">
              <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-2xs">
                <h2 className="mb-2 font-bold text-gray-900 text-base">রিটার্ন শর্তাবলী</h2>
                <ul className="list-disc space-y-1.5 pl-5 text-gray-700 font-medium">
                  <li>Product পছন্দ না হলে delivery man-কে delivery charge pay করে return করতে হবে।</li>
                  <li>Product-এ ফাটা, দাগ, damage, নষ্ট অথবা ভুল product হলে return করার সময় delivery charge লাগবে না।</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-2xs">
                <h2 className="mb-2 font-bold text-gray-900 text-base">রিটার্ন ও রিফান্ড নীতিমালা</h2>
                <ul className="list-disc space-y-1.5 pl-5 text-gray-700 font-medium leading-relaxed">
                  <li>রিটার্ন/এক্সচেঞ্জের জন্য পণ্যটি ব্যবহার না করা, পরিষ্কার এবং সম্ভব হলে original box/packaging-সহ থাকতে হবে।</li>
                  <li>ভুল, ক্ষতিগ্রস্ত বা ত্রুটিপূর্ণ পণ্য পেলে যত দ্রুত সম্ভব আমাদের ফোন/WhatsApp-এ যোগাযোগ করুন। যাচাই সাপেক্ষে replacement বা return ব্যবস্থা করা হবে।</li>
                  <li>Size change, পছন্দ পরিবর্তন বা personal preference-এর কারণে return/exchange হলে delivery/courier charge গ্রাহক বহন করবেন।</li>
                  <li>ব্যবহৃত, নোংরা, ইচ্ছাকৃতভাবে ক্ষতিগ্রস্ত বা resale condition-এ নেই — এমন পণ্য return/refund-এর জন্য গ্রহণযোগ্য নাও হতে পারে।</li>
                </ul>
              </div>
            </section>
          </main>

          {/* Checkout Dialog */}
          <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
            <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 sm:p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-bold text-gray-900">অর্ডার সম্পন্ন করুন</DialogTitle>
                <DialogDescription className="text-gray-500">
                  সাইজ ও ঠিকানা দিয়ে অর্ডারটি কনফার্ম করুন।
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleOrder} className="mt-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-[#FAF8F5] border border-gray-200/70 p-3.5">
                  <div className="min-w-0">
                    {selected.map((product) => (
                      <p key={product._id} className="truncate font-bold text-gray-900">{product.name}</p>
                    ))}
                    <p className="text-xs text-gray-500 font-medium">{totalUnits}টি প্রোডাক্ট</p>
                  </div>
                  <span className="shrink-0 text-lg font-extrabold text-[#18483b]">৳{subtotal}</span>
                </div>

                <div className="mt-4">
                  <Label className="text-sm font-bold text-gray-700">আপনার সাইজ *</Label>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {SIZES.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={size === option ? 'default' : 'outline'}
                        className={`text-base font-extrabold rounded-xl ${
                          size === option ? 'bg-[#18483b] text-white' : 'border-gray-200'
                        }`}
                        onClick={() => setSize(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>

                {freeDelivery ? (
                  <p className="mt-4 rounded-xl bg-[#18483b]/10 px-3 py-2 text-sm font-bold text-[#18483b]">
                    সারা বাংলাদেশে ফ্রি ডেলিভারি 🚚
                  </p>
                ) : (
                  <div className="mt-4">
                    <Label className="text-sm font-bold text-gray-700">ডেলিভারি এরিয়া *</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={deliveryArea === 'dhaka' ? 'default' : 'outline'}
                        className={`text-sm font-bold rounded-xl ${
                          deliveryArea === 'dhaka' ? 'bg-[#18483b] text-white' : 'border-gray-200'
                        }`}
                        onClick={() => setDeliveryArea('dhaka')}
                      >
                        ঢাকার ভিতরে (+{dhakaCharge}৳)
                      </Button>
                      <Button
                        type="button"
                        variant={deliveryArea === 'outside' ? 'default' : 'outline'}
                        className={`text-sm font-bold rounded-xl ${
                          deliveryArea === 'outside' ? 'bg-[#18483b] text-white' : 'border-gray-200'
                        }`}
                        onClick={() => setDeliveryArea('outside')}
                      >
                        ঢাকার বাইরে (+{outsideCharge}৳)
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="sn-name" className="text-sm font-bold text-gray-700">আপনার নাম</Label>
                    <Input
                      id="sn-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="sn-phone" className="text-sm font-bold text-gray-700">মোবাইল নম্বর *</Label>
                    <Input
                      id="sn-phone"
                      required
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      className="h-11 font-mono"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="sn-address" className="text-sm font-bold text-gray-700">
                      আপনার সম্পূর্ণ ঠিকানা লিখুন, থানা, জেলাসহ
                    </Label>
                    <Textarea
                      id="sn-address"
                      rows={3}
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="বাসা/রোড, থানা, জেলা"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#FAF8F5] border border-gray-200/70 p-4 text-sm font-medium">
                  <div className="flex justify-between gap-3 text-gray-700">
                    <span>পণ্যের দাম</span>
                    <span className="font-bold text-gray-900">{subtotal} টাকা</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-3 text-gray-700">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="font-bold text-[#18483b]">{freeDelivery ? 'ফ্রি' : `${deliveryCharge} টাকা`}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3 border-t border-gray-200 pt-2 text-base font-extrabold text-gray-900">
                    <span>সর্বমোট</span>
                    <span>{total} টাকা</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-4 w-full bg-[#18483b] text-white hover:bg-[#123e31] py-6 text-base font-bold rounded-xl shadow-md"
                  disabled={submitting}
                >
                  {submitting ? 'জমা হচ্ছে…' : `অর্ডার কনফার্ম করুন — ${total} টাকা`}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
