'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Check, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import OfferTabsHeader from '@/components/offers/OfferTabsHeader';

const SIZES = ['M', 'L', 'XL', 'XXL'] as const;
type Size = (typeof SIZES)[number];

interface Variant {
  _id: string;
  name: string;
  colorName?: string;
  colorHex?: string;
  imageUrl?: string;
  sizeStock: { size: string; stock: number }[];
}

export default function PoloComboPage() {
  const [size, setSize] = useState<Size | null>('M');
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [deliveryArea, setDeliveryArea] = useState<'dhaka' | 'outside'>('outside');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ orderNo: string; total: number } | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    combo_price: 999,
    combo_qty: 5,
    polo_free_delivery: 'on',
    polo_delivery_charge_dhaka: 80,
    polo_delivery_charge_outside: 150,
  });

  useEffect(() => {
    fetch('/api/combos/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  const price = Number(settings.combo_price) || 999;
  const comboQty = Number(settings.combo_qty) || 5;
  const poloFree = settings.polo_free_delivery !== 'off';
  const dhakaCharge = Math.max(0, Number(settings.polo_delivery_charge_dhaka) || 80);
  const outsideCharge = Math.max(0, Number(settings.polo_delivery_charge_outside) || 150);
  const deliveryCharge = poloFree ? 0 : deliveryArea === 'dhaka' ? dhakaCharge : outsideCharge;
  const grandTotal = price + deliveryCharge;

  // Load polo combo items from backend
  useEffect(() => {
    async function fetchPoloCombos() {
      try {
        setLoading(true);
        const res = await fetch('/api/combos?category=polo');
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setVariants(data.items);
        }
      } catch (err) {
        console.error('Failed to load polo combos:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPoloCombos();
  }, []);

  // Filter variants available in the selected size
  const availableVariants = useMemo(() => {
    if (!size) return variants;
    return variants.filter((v) =>
      v.sizeStock && v.sizeStock.some((s) => s.size === size && s.stock > 0)
    );
  }, [variants, size]);

  const totalPicked = useMemo(
    () => Object.values(picks).reduce((s, n) => s + n, 0),
    [picks]
  );

  const prevPicked = useRef(0);
  useEffect(() => {
    if (totalPicked === comboQty && prevPicked.current === comboQty - 1) {
      setTimeout(() => {
        document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
    prevPicked.current = totalPicked;
  }, [totalPicked, comboQty]);

  const chooseSize = (s: Size) => {
    setSize(s);
    setPicks({});
    setDone(null);
  };

  const togglePick = (v: Variant) => {
    setPicks((prev) => {
      if (prev[v._id]) {
        const copy = { ...prev };
        delete copy[v._id];
        return copy;
      }
      if (totalPicked >= comboQty) {
        toast.error(`সর্বোচ্চ ${comboQty} পিস নেওয়া যাবে।`);
        return prev;
      }
      return { ...prev, [v._id]: 1 };
    });
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!size) {
      toast.error('আগে সাইজ বাছুন।');
      return;
    }
    if (totalPicked !== comboQty) {
      toast.error(`ঠিক ${comboQty} পিস সিলেক্ট করুন।`);
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
      const orderItems = Object.entries(picks).map(([variantId, qty]) => {
        const v = variants.find((item) => item._id === variantId);
        return {
          comboId: variantId,
          name: v?.name || `পোলো শার্ট (${v?.colorName || size})`,
          quantity: qty,
          price: Math.round(price / comboQty),
          color: v?.colorName || '',
          size: size,
          image: v?.imageUrl || '',
        };
      });

      const res = await fetch('/api/combos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.name.trim(),
          phone: cleanPhone,
          address: form.address.trim(),
          deliveryArea,
          deliveryCharge,
          totalAmount: grandTotal,
          offerType: 'polo',
          items: orderItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'অর্ডার প্রক্রিয়া করা যায়নি।');
      }

      setDone({ orderNo: data.orderNo, total: data.total || grandTotal });
      setPicks({});
      setForm({ name: '', phone: '', address: '' });
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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#18483b] text-white">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900">অর্ডার সফল হয়েছে!</h1>
            <p className="mt-3 text-base text-gray-600">
              আপনার অর্ডার নম্বর <strong>#{done.orderNo}</strong>। মোট {done.total} টাকা (ডেলিভারি চার্জসহ)। আমরা শীঘ্রই কল দিয়ে আপনার অর্ডার কনফার্ম করব।
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
          {/* Hero Banner & Value Props */}
          <section className="mx-auto max-w-3xl px-4 pt-8 text-center">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-gray-900">
              <span>১০০% পিকে কটন কাপড়ের ৫ পিস পোলো শার্ট </span>
              <span className="text-[#18483b] block sm:inline mt-1 sm:mt-0">{price} টাকা</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-600 leading-relaxed">
              ১০০% কটন কাপড়ের ছেলেদের ৫ পিস পোলো টি-শার্ট মাত্র {price} টাকা। সারা বাংলাদেশে {poloFree ? 'ফ্রি ডেলিভারি' : 'ক্যাশ অন ডেলিভারি'} — ১ টাকাও আগে দেওয়া লাগবে না, ডেলিভারি ম্যান এর সামনে প্রডাক্ট চেক করে পেমেন্ট করতে পারবেন।
            </p>

            {/* 6 Stats Boxes Grid */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#18483b]">{price}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">টাকায়</p>
              </div>
              <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#18483b]">{comboQty}</p>
                <p className="mt-1 text-sm font-medium text-gray-500">টি প্রডাক্ট</p>
              </div>
              <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs">
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-400 line-through">৳১,৫০০</p>
                <p className="mt-1 text-sm font-medium text-gray-500">রেগুলার দাম</p>
              </div>
              <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#18483b]">৳৫০০+</p>
                <p className="mt-1 text-sm font-medium text-gray-500">সেভ করুন</p>
              </div>
              <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs flex flex-col items-center justify-center">
                <Truck className="h-7 w-7 text-[#18483b]" />
                <p className="mt-1 text-sm font-medium text-gray-500">সারা বাংলাদেশে ডেলিভারি</p>
              </div>
              <div className="rounded-xl border border-gray-200/90 bg-white p-4 shadow-2xs flex flex-col items-center justify-center">
                <Wallet className="h-7 w-7 text-[#18483b]" />
                <p className="mt-1 text-sm font-medium text-gray-500">{poloFree ? 'ফ্রি ডেলিভারি' : 'ক্যাশ অন ডেলিভারি'}</p>
              </div>
            </div>

            {/* Feature Bullets */}
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-gray-700">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#18483b]" /> ১০০% এক্সপোর্ট কোয়ালিটি কটন
              </li>
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#18483b]" /> {poloFree ? 'সারা বাংলাদেশে ফ্রি ডেলিভারি' : 'সারা বাংলাদেশে ডেলিভারি'}
              </li>
              <li className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#18483b]" /> হাতে পেয়ে টাকা দিন
              </li>
            </ul>

            {/* Polo Combo Hero Image */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs">
              <Image
                src="/images/polo-combo.jpg"
                alt="৫ পিস প্রিমিয়াম পোলো শার্ট কম্বো"
                width={1200}
                height={912}
                priority
                className="w-full h-auto object-cover"
              />
            </div>

            <a
              href="#order"
              className="mt-8 inline-flex rounded-xl bg-[#18483b] px-8 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#123e31] active:scale-98"
            >
              অর্ডার করতে প্রথমে আপনার যে সাইজ লাগবে সেটা সিলেক্ট করুন
            </a>
          </section>

          {/* Selection & Checkout Section */}
          <section id="order" className="mx-auto max-w-3xl px-4 pt-12">
            {/* Step 1: Size Selector */}
            <div className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs">
              <h2 className="text-lg font-bold text-gray-900">
                <span className="text-red-600">১. সাইজ বাছুন</span>
              </h2>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => chooseSize(s)}
                    className={`rounded-xl border py-3 text-lg font-extrabold transition ${
                      size === s
                        ? 'border-[#18483b] bg-[#18483b] text-white shadow-xs'
                        : 'border-gray-200 bg-[#FAF8F5] text-gray-800 hover:border-gray-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Color Variant Picker */}
            {size && (
              <div className="mt-6 rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    <span className={totalPicked < comboQty ? 'text-red-600 font-extrabold' : ''}>
                      ২. পছন্দের {comboQty}টি ডিজাইন বাছুন
                    </span>
                  </h2>
                  <span className="rounded-full bg-[#18483b] px-4 py-1.5 text-sm font-extrabold text-white">
                    {totalPicked} / {comboQty}
                  </span>
                </div>
                <p className={`mt-2 text-sm font-medium ${totalPicked < comboQty ? 'text-red-600' : 'text-gray-500'}`}>
                  নিচের ছবিগুলো থেকে আপনার পছন্দের {comboQty}টি {size} সাইজ এর পোলো শার্ট সিলেক্ট করুন (ছবিতে ট্যাপ করুন) 👇
                </p>

                {loading ? (
                  <p className="mt-6 text-center text-sm font-medium text-gray-500">ছবি লোড হচ্ছে…</p>
                ) : availableVariants.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                    এই সাইজে এখন কোনো ডিজাইন স্টকে নেই। অন্য সাইজ দেখুন।
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {availableVariants.map((v) => {
                      const qty = picks[v._id] ?? 0;
                      const selectionNumber = Object.keys(picks).indexOf(v._id) + 1;
                      const sizeStockRow = v.sizeStock?.find((row) => row.size === size);
                      const currentStock = sizeStockRow ? sizeStockRow.stock : 0;

                      return (
                        <div
                          key={v._id}
                          className={`relative overflow-hidden rounded-xl border-2 transition ${
                            qty > 0 ? 'border-[#18483b] ring-2 ring-[#18483b]' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => togglePick(v)}
                            className="relative block w-full text-left"
                          >
                            <div className="relative aspect-square w-full bg-gray-100">
                              {v.imageUrl ? (
                                <Image
                                  src={v.imageUrl}
                                  alt={v.name || v.colorName || 'Polo'}
                                  fill
                                  sizes="(max-width: 640px) 50vw, 33vw"
                                  className="object-cover"
                                />
                              ) : (
                                <div
                                  className="h-full w-full"
                                  style={{ backgroundColor: v.colorHex || '#ccc' }}
                                />
                              )}
                            </div>

                            {/* Color Label & Stock */}
                            <span className="absolute left-1.5 top-1.5 max-w-[55%] truncate rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                              {v.colorName || v.name}
                            </span>
                            <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                              স্টক: {currentStock}
                            </span>

                            {/* Selection badges */}
                            {qty > 0 && (
                              <>
                                <span className="absolute left-2 top-8 flex h-7 w-7 items-center justify-center rounded-full bg-[#18483b] text-white shadow-sm">
                                  <Check className="h-4 w-4" />
                                </span>
                                <span className="absolute right-2 top-8 flex h-7 w-7 items-center justify-center rounded-full bg-[#18483b] text-xs font-bold text-white shadow-sm">
                                  {selectionNumber}
                                </span>
                                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-[#18483b] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                                  <Check className="h-3.5 w-3.5" /> সিলেক্টেড
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Checkout Form */}
            {size && totalPicked === comboQty && (
              <form
                id="checkout"
                onSubmit={handleOrder}
                className="mt-6 rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-2xs"
              >
                <h2 className="text-lg font-bold text-gray-900">
                  আপনার পছন্দের {comboQty}টি কালার অর্ডার করতে আপনার তথ্যগুলো দিন
                </h2>
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-bold text-gray-700">আপনার নাম</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="যেমন: রাকিব হাসান"
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-sm font-bold text-gray-700">মোবাইল নম্বর *</Label>
                    <Input
                      id="phone"
                      required
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      className="h-11 font-mono"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address" className="text-sm font-bold text-gray-700">
                      আপনার সম্পূর্ণ ঠিকানা লিখুন, থানা, জেলাসহ
                    </Label>
                    <Textarea
                      id="address"
                      rows={3}
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="বাসা/রোড, থানা, জেলা"
                    />
                  </div>
                </div>

                {!poloFree && (
                  <div className="mt-4">
                    <Label className="text-sm font-bold text-gray-700">ডেলিভারি এরিয়া *</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={deliveryArea === 'dhaka' ? 'default' : 'outline'}
                        className={`text-sm font-bold ${deliveryArea === 'dhaka' ? 'bg-[#18483b] text-white' : ''}`}
                        onClick={() => setDeliveryArea('dhaka')}
                      >
                        ঢাকার ভিতরে (+{dhakaCharge}৳)
                      </Button>
                      <Button
                        type="button"
                        variant={deliveryArea === 'outside' ? 'default' : 'outline'}
                        className={`text-sm font-bold ${deliveryArea === 'outside' ? 'bg-[#18483b] text-white' : ''}`}
                        onClick={() => setDeliveryArea('outside')}
                      >
                        ঢাকার বাইরে (+{outsideCharge}৳)
                      </Button>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="mt-5 rounded-xl bg-[#FAF8F5] border border-gray-200/70 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">{comboQty} পিস পোলো শার্ট ({size})</span>
                    <span className="font-bold text-gray-900">{price} টাকা</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-gray-600 font-medium">ডেলিভারি চার্জ</span>
                    <span className="font-bold text-[#18483b]">{poloFree ? 'ফ্রি' : `${deliveryCharge} টাকা`}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base font-extrabold text-gray-900">
                    <span>মোট</span>
                    <span>{grandTotal} টাকা</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-5 w-full bg-[#18483b] text-white hover:bg-[#123e31] py-6 text-base font-bold shadow-md rounded-xl"
                  disabled={submitting}
                >
                  {submitting ? 'জমা হচ্ছে…' : 'অর্ডার কনফার্ম করুন'}
                </Button>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
}
