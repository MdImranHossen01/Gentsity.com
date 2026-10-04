'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Check, Flame, KeyRound, Ruler, ShieldCheck, Sparkles, Truck, Wallet } from 'lucide-react';
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
import { fbEvent } from '@/lib/fpixel';
import { ttEvent } from '@/lib/tiktok';

const SIZES = ['M', 'L', 'XL', 'XXL'] as const;
type Size = (typeof SIZES)[number];

interface PajamaProduct {
  _id: string;
  name: string;
  productKind: 'single' | 'combo';
  price: number;
  imageUrl?: string;
  sizeStock: { size: string; stock: number }[];
}


const waitForFbq = (maxWaitMs = 5000, intervalMs = 200) =>
  new Promise<void>((resolve) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      resolve();
      return;
    }
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += intervalMs;
      if ((typeof window !== 'undefined' && (window as any).fbq) || elapsed >= maxWaitMs) {
        clearInterval(timer);
        resolve();
      }
    }, intervalMs);
  });

export default function PajamaPage() {
  const [size, setSize] = useState<Size | null>(null);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'outside'>('outside');
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [done, setDone] = useState<{ orderNo: string; total: number; deliveryCharge: number } | null>(null);
  const [products, setProducts] = useState<PajamaProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    pajama_free_delivery: 'off',
    pajama_delivery_charge_dhaka: 70,
    pajama_delivery_charge_outside: 120,
  });

  useEffect(() => {
    fetch('/api/combos/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  const freeDelivery = settings.pajama_free_delivery === 'on';
  const dhakaCharge = Math.max(0, Number(settings.pajama_delivery_charge_dhaka) || 70);
  const outsideCharge = Math.max(0, Number(settings.pajama_delivery_charge_outside) || 120);
  const deliveryCharge = freeDelivery ? 0 : deliveryArea === 'dhaka' ? dhakaCharge : outsideCharge;

  useEffect(() => {
    async function fetchPajamas() {
      try {
        setLoading(true);
        const res = await fetch('/api/combos?category=pajama');
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setProducts(data.items);
        }
      } catch (err) {
        console.error('Failed to load pajama products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPajamas();
  }, []);

  const selected = useMemo(
    () => products.filter((p) => (picks[p._id] ?? 0) > 0),
    [products, picks]
  );
  const totalUnits = Object.values(picks).reduce((sum, qty) => sum + qty, 0);
  const subtotal = selected.reduce((sum, p) => sum + p.price * (picks[p._id] ?? 0), 0);
  const total = subtotal + deliveryCharge;

  const hasTrackedInitiate = useRef<string | null>(null);
  useEffect(() => {
    if (checkoutOpen && selected.length > 0) {
      const activeIds = selected.map((p) => p._id).join(',');
      if (hasTrackedInitiate.current !== activeIds) {
        hasTrackedInitiate.current = activeIds;

        const validItems = selected.map((p) => ({
          id: p._id,
          name: p.name,
          quantity: picks[p._id] || 1,
          item_price: p.price,
        }));

        const checkoutPayload = {
          content_ids: selected.map((p) => p._id),
          content_type: 'product',
          value: total,
          currency: 'BDT',
          num_items: totalUnits,
          contents: validItems,
        };

        const initiateUserData = { country: 'bd' };

        waitForFbq().then(() => {
          fbEvent('InitiateCheckout', checkoutPayload, initiateUserData);
          ttEvent('InitiateCheckout', checkoutPayload, initiateUserData);
        });

        if (typeof window !== 'undefined' && (window as any).dataLayer) {
          (window as any).dataLayer.push({
            event: 'begin_checkout',
            ecommerce: {
              value: total,
              currency: 'BDT',
              items: validItems,
            },
          });
        }
      }
    }
  }, [checkoutOpen, selected, picks, total, totalUnits]);


  const orderProduct = (product: PajamaProduct) => {
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
          offerType: 'pajama',
          items: orderItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'অর্ডার প্রক্রিয়া করা যায়নি।');
      }

      
      // Track Purchase event immediately on API success
      try {
        const fullName = form.name.trim();
        const nameParts = fullName.split(/\s+/);
        const purchaseEventData = {
          value: data.total || total,
          currency: 'BDT',
          content_ids: orderItems.map((i: any) => i.comboId || i.id || 'pajama-item'),
          content_type: 'product',
          num_items: orderItems.length,
          contents: orderItems.map((i: any) => ({
            id: i.comboId || i.id || 'pajama-item',
            name: i.name,
            quantity: i.quantity,
            item_price: i.price,
          })),
        };

        const purchaseUserData: any = {
          ph: cleanPhone,
          fn: nameParts[0] || '',
          ln: nameParts.slice(1).join(' ') || '',
          country: 'bd',
        };

        if (deliveryArea === 'dhaka') {
          purchaseUserData.ct = 'Dhaka';
          purchaseUserData.st = 'Dhaka';
        }

        const trackId = data.orderNo || data.orderId || `GEN-${Date.now()}`;
        fbEvent('Purchase', purchaseEventData, purchaseUserData, trackId);
        ttEvent('Purchase', purchaseEventData, purchaseUserData, trackId);

        if (typeof window !== 'undefined' && (window as any).dataLayer) {
          (window as any).dataLayer.push({
            event: 'purchase',
            ecommerce: {
              transaction_id: trackId,
              value: purchaseEventData.value,
              currency: 'BDT',
              items: purchaseEventData.contents,
            },
          });
        }
      } catch (trackingError) {
        console.error('[Tracking Error]:', trackingError);
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
            <p className="text-sm font-bold tracking-wider text-[#18483b]">GENTSITY PAJAMA COLLECTION</p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl text-gray-900 leading-tight">
              <Flame className="inline h-7 w-7 text-red-600 mb-1" /> চায়না মাইক্রো স্টিচ ফেব্রিকের প্রিমিয়াম পায়জামা <Flame className="inline h-7 w-7 text-red-600 mb-1" />
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-gray-600">
              আরাম, স্মার্ট লুক আর প্রিমিয়াম কোয়ালিটি—সবকিছু একসাথে! <Sparkles className="inline h-4 w-4 text-[#18483b]" />
            </p>

            {/* Pajama Hero Banner */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs">
              <Image
                src="/assets/images/Banner/pajamapagebanner.webp"
                alt="Gentsity পায়জামা — আরামদায়ক ফিট"
                width={1200}
                height={600}
                priority
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Feature Check List */}
            <ul className="mx-auto mt-7 grid max-w-2xl gap-3 text-left text-sm font-medium text-gray-700 md:grid-cols-2">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> প্রিমিয়াম কোয়ালিটি চায়না মাইক্রো স্টিচ ফেব্রিক
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> সফট, আরামদায়ক ও টেকসই
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> Semi Narrow Pant Cutting – স্মার্ট ও কমফোর্টেবল ফিট
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> পুরোপুরি স্কিনি নয়, তাই চলাফেরায় আরাম
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> অফিস, ক্যাজুয়াল ও ডেইলি ওয়্যারের জন্য পারফেক্ট
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#18483b]" /> আয়রন করার ঝামেলা নেই – সবসময় স্মার্ট লুক
              </li>
            </ul>

            {/* Semi Narrow Cutting Box */}
            <div className="mt-6 rounded-2xl bg-[#EDE8E1]/60 border border-[#E0D8CD] p-5 text-left text-sm">
              <h2 className="mb-2 font-bold text-gray-900 flex items-center gap-1.5">
                <KeyRound className="inline h-4 w-4 text-[#18483b]" /> Semi Narrow Cutting-এর বিশেষত্ব:
              </h2>
              <ul className="list-disc space-y-1 pl-5 text-gray-700 font-medium">
                <li>কোমর থেকে হাঁটু পর্যন্ত নরমাল ফিট</li>
                <li>হাঁটু থেকে নিচে হালকা টেপার্ড</li>
                <li>স্মার্ট লুকের সাথে সর্বোচ্চ কমফোর্ট</li>
              </ul>
            </div>

            {/* 4 Key Details */}
            <div className="mt-6 rounded-2xl border border-gray-200/90 bg-white p-5 text-left text-sm shadow-2xs">
              <h2 className="mb-3 font-bold text-gray-900 flex items-center gap-1.5 text-base">
                <Flame className="inline h-5 w-5 text-red-600" /> আমাদের পায়জামার বিশেষ বৈশিষ্ট্য
              </h2>
              <ol className="list-decimal space-y-2.5 pl-5 text-gray-700 leading-relaxed font-medium">
                <li>
                  <strong className="text-gray-900">প্রিমিয়াম চায়না মাইক্রো স্টিচ ফেব্রিক:</strong> উন্নতমানের চায়না মাইক্রো স্টিচ ফেব্রিক দিয়ে তৈরি। কাপড়ে ভাঁজ কম পড়ে, তাই বারবার আয়রন করার ঝামেলা নেই।
                </li>
                <li>
                  <strong className="text-gray-900">প্রিমিয়াম মেটাল জিপার:</strong> গেট ও পিছনের পকেটে ব্যবহার করা হয়েছে মজবুত মেটাল জিপার, যা পায়জামাকে দিয়েছে প্রিমিয়াম লুক ও দীর্ঘস্থায়িত্ব।
                </li>
                <li>
                  <strong className="text-gray-900">পকেটেও একই ফেব্রিক:</strong> পকেটের জন্য আলাদা কোনো ফেব্রিক ব্যবহার করা হয়নি। পায়জামায় ব্যবহৃত মূল ফেব্রিকই পকেটেও ব্যবহার করা হয়েছে, ফলে কোয়ালিটি ও আরাম দুটোই বজায় থাকে।
                </li>
                <li>
                  <strong className="text-gray-900">মেটাল ড্রস্ট্রিং ও প্রিমিয়াম আইলেট:</strong> পায়জামায় ব্যবহার করা হয়েছে মজবুত মেটাল ড্রস্ট্রিং এবং ড্রস্ট্রিংয়ের জন্য প্রিমিয়াম আইলেট, যা পায়জামার ফিনিশিং ও স্থায়িত্ব আরও বাড়িয়ে দেয়।
                </li>
              </ol>
            </div>

            <p className="mt-7 text-base font-extrabold text-gray-900">
              <Ruler className="inline h-5 w-5 text-[#18483b] mr-1" /> সাইজ: M – 38 | L – 40 | XL – 42 | XXL – 44
            </p>

            {/* Size Chart Banner */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs">
              <Image
                src="/assets/images/Banner/pajamasize.webp"
                alt="Gentsity সেমি ন্যারো পায়জামা সাইজ চার্ট"
                width={1200}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>

            <ul className="mt-6 flex flex-wrap justify-center gap-6 text-sm font-semibold text-gray-700">
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#18483b]" /> {freeDelivery ? 'সারা বাংলাদেশে ফ্রি ডেলিভারি' : 'সারা বাংলাদেশে ডেলিভারি'}
              </li>
              <li className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#18483b]" /> হাতে পেয়ে টাকা দিন
              </li>
            </ul>
          </section>

          {/* Products Grid */}
          <main className="mx-auto max-w-6xl px-4 pb-16">
            {loading ? (
              <p className="py-12 text-center text-sm font-medium text-gray-500">প্রোডাক্ট লোড হচ্ছে…</p>
            ) : products.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
                পায়জামার প্রোডাক্ট শিগগিরই আসছে।
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
                          {product.productKind === 'combo' ? '২ পিস কম্বো' : 'সিঙ্গেল পিস'}
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

            {/* Policy & Delivery Info */}
            <div className="mx-auto mt-10 max-w-3xl space-y-2 rounded-2xl border border-red-200 bg-red-50/50 p-5 text-left text-sm text-gray-700 font-medium">
              <p>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা।</p>
              <p>– কেয়ার নির্দেশনা: হালকা ডিটারজেন্টে ধোয়া, ব্লিচ ব্যবহার নয়।</p>
              <p>
                প্রডাক্ট হাতে পাওয়ার পর ডেলিভারি রাইডার এর সামনে চেক করে নিবেন স্যার। কোন সমস্যা থাকলে আমাদের জানাবেন স্যার। রাইডার চলে যাওয়ার পর কোন অভিযোগ গ্রহণ করা হবে না স্যার।
              </p>
              <p className="font-bold text-red-600">
                বি: দ্র: অর্ডার করার সময় সাইজ শিওর হয়ে নিবেন। সাইজ নিয়ে সমস্যা জানালে কুরিয়ার চার্জ দিয়ে সাইজ এক্সচেঞ্জ করতে হবে। NB: কোন কারনে প্রডাক্ট রির্টান করলে ডেলিভারি চার্জ দিয়ে রির্টান করতে হবে।
              </p>
            </div>
          </main>

          {/* Checkout Dialog */}
          <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg bg-white rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">অর্ডার সম্পন্ন করুন</DialogTitle>
                <DialogDescription className="text-gray-500">
                  সাইজ, ঠিকানা ও মোবাইল নম্বর দিয়ে অর্ডারটি কনফার্ম করুন।
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleOrder} className="space-y-4 mt-2">
                <div>
                  <Label className="text-sm font-bold text-gray-700">আপনার সাইজ *</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
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
                  <p className="rounded-xl bg-[#18483b]/10 px-3 py-2 text-sm font-bold text-[#18483b]">
                    সারা বাংলাদেশে ফ্রি ডেলিভারি 🚚
                  </p>
                ) : (
                  <div>
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

                <div className="grid gap-2">
                  <Label htmlFor="pj-name" className="text-sm font-bold text-gray-700">আপনার নাম</Label>
                  <Input
                    id="pj-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="যেমন: রাকিব হাসান"
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pj-phone" className="text-sm font-bold text-gray-700">মোবাইল নম্বর *</Label>
                  <Input
                    id="pj-phone"
                    required
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="h-11 font-mono"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pj-address" className="text-sm font-bold text-gray-700">
                    আপনার সম্পূর্ণ ঠিকানা লিখুন, থানা, জেলাসহ
                  </Label>
                  <Textarea
                    id="pj-address"
                    rows={3}
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="বাসা/রোড, থানা, জেলা"
                  />
                </div>

                <div className="rounded-xl bg-[#FAF8F5] border border-gray-200/70 p-4 text-sm font-medium">
                  {selected.map((product) => (
                    <div key={product._id} className="mb-1 flex justify-between gap-3 text-gray-700">
                      <span>{product.name} × {picks[product._id]}</span>
                      <span className="font-bold text-gray-900">{product.price * (picks[product._id] ?? 0)} টাকা</span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-gray-700">
                    <span>পণ্যের দাম</span>
                    <span className="font-bold text-gray-900">{subtotal} টাকা</span>
                  </div>
                  <div className="mt-1 flex justify-between text-gray-700">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="font-bold text-[#18483b]">{freeDelivery ? 'ফ্রি' : `${deliveryCharge} টাকা`}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-base font-extrabold text-gray-900">
                    <span>সর্বমোট</span>
                    <span>{total} টাকা</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#18483b] text-white hover:bg-[#123e31] py-6 text-base font-bold rounded-xl shadow-md"
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
