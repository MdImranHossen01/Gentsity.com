'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Upload, ExternalLink, RefreshCw, CheckCircle2, Settings } from 'lucide-react';
import Image from 'next/image';

const SIZES_CLOTHING = ['M', 'L', 'XL', 'XXL'];
const SIZES_SHOES = ['40', '41', '42', '43', '44'];

export default function AdminCombosPage() {
  const [activeTab, setActiveTab] = useState<'polo' | 'pajama' | 'sneakers' | 'settings'>('polo');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  // Polo Form State
  const [poloColorName, setPoloColorName] = useState('');
  const [poloColorHex, setPoloColorHex] = useState('#000000');
  const [poloImage, setPoloImage] = useState('');
  const [poloStocks, setPoloStocks] = useState<Record<string, number>>({ M: 20, L: 20, XL: 20, XXL: 20 });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Pajama Form State
  const [pajamaName, setPajamaName] = useState('');
  const [pajamaKind, setPajamaKind] = useState<'single' | 'combo'>('combo');
  const [pajamaPrice, setPajamaPrice] = useState('999');
  const [pajamaImage, setPajamaImage] = useState('');
  const [pajamaStocks, setPajamaStocks] = useState<Record<string, number>>({ M: 15, L: 15, XL: 15, XXL: 15 });

  // Sneakers Form State
  const [sneakersName, setSneakersName] = useState('');
  const [sneakersKind, setSneakersKind] = useState<'single' | 'combo'>('single');
  const [sneakersPrice, setSneakersPrice] = useState('1450');
  const [sneakersImage, setSneakersImage] = useState('');
  const [sneakersStocks, setSneakersStocks] = useState<Record<string, number>>({ '40': 10, '41': 10, '42': 10, '43': 10, '44': 10 });

  // Delivery & Offer Settings State
  const [settings, setSettings] = useState({
    combo_price: 999,
    combo_qty: 5,
    polo_free_delivery: 'on',
    polo_delivery_charge_dhaka: 80,
    polo_delivery_charge_outside: 150,
    pajama_free_delivery: 'off',
    pajama_delivery_charge_dhaka: 70,
    pajama_delivery_charge_outside: 120,
    sneakers_free_delivery: 'off',
    sneakers_delivery_charge_dhaka: 80,
    sneakers_delivery_charge_outside: 130,
    whatsapp_number: '8801700000000',
    whatsapp_message: 'হ্যালো Gentsity, আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/combos/settings');
      const data = await res.json();
      if (data.success && data.settings) setSettings(data.settings);
    } catch {}
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/combos/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success('ডেলিভারি চার্জ ও সেটিংস সংরক্ষিত হয়েছে!');
      } else {
        toast.error(d.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
      }
    } catch (err) {
      toast.error('সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchItems = async (cat = activeTab) => {
    if (cat === 'settings') return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/combos?category=${cat}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
      } else {
        toast.error(data.message || 'ডাটা লোড করা সম্ভব হয়নি');
      }
    } catch {
      toast.error('সার্ভারে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    } else {
      fetchItems(activeTab);
    }
  }, [activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setter(data.url);
        toast.success('ছবি সফলভাবে আপলোড হয়েছে!');
      } else {
        toast.error(data.message || 'ছবি আপলোড ফেইল করেছে');
      }
    } catch {
      toast.error('ছবি আপলোডে এরর হয়েছে');
    } finally {
      setUploadingImage(false);
    }
  };

  // Create Polo
  const handleAddPolo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poloColorName.trim()) {
      return toast.error('কালারের নাম দিন (যেমন: Black, Navy, Maroon)');
    }
    const sizeStock = SIZES_CLOTHING.map((s) => ({
      size: s,
      stock: Number(poloStocks[s]) || 0,
    }));

    try {
      const res = await fetch('/api/admin/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'polo',
          name: poloColorName.trim(),
          colorName: poloColorName.trim(),
          colorHex: poloColorHex,
          imageUrl: poloImage || '/images/polo-combo.jpg',
          price: 999,
          productKind: 'combo',
          sizeStock,
        }),
      });
      if (res.ok) {
        toast.success('পোলো কালার ও স্টক যোগ হয়েছে!');
        setPoloColorName('');
        setPoloImage('');
        fetchItems('polo');
      } else {
        const err = await res.json();
        toast.error(err.message || 'যোগ করা সম্ভব হয়নি');
      }
    } catch {
      toast.error('সার্ভার সমস্যা');
    }
  };

  // Create Pajama
  const handleAddPajama = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pajamaName.trim() || !pajamaPrice) {
      return toast.error('প্রোডাক্টের নাম ও দাম দিন');
    }
    const sizeStock = SIZES_CLOTHING.map((s) => ({
      size: s,
      stock: Number(pajamaStocks[s]) || 0,
    }));

    try {
      const res = await fetch('/api/admin/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'pajama',
          name: pajamaName.trim(),
          price: Number(pajamaPrice),
          productKind: pajamaKind,
          imageUrl: pajamaImage,
          sizeStock,
        }),
      });
      if (res.ok) {
        toast.success('পায়জামা প্রোডাক্ট সফলভাবে যোগ হয়েছে!');
        setPajamaName('');
        setPajamaImage('');
        fetchItems('pajama');
      } else {
        const err = await res.json();
        toast.error(err.message || 'যোগ করা যায়নি');
      }
    } catch {
      toast.error('সার্ভার সমস্যা');
    }
  };

  // Create Sneakers
  const handleAddSneakers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sneakersName.trim() || !sneakersPrice) {
      return toast.error('স্নিকার্স এর নাম ও দাম দিন');
    }
    const sizeStock = SIZES_SHOES.map((s) => ({
      size: s,
      stock: Number(sneakersStocks[s]) || 0,
    }));

    try {
      const res = await fetch('/api/admin/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'sneakers',
          name: sneakersName.trim(),
          price: Number(sneakersPrice),
          productKind: sneakersKind,
          imageUrl: sneakersImage,
          sizeStock,
        }),
      });
      if (res.ok) {
        toast.success('স্নিকার্স প্রোডাক্ট যোগ হয়েছে!');
        setSneakersName('');
        setSneakersImage('');
        fetchItems('sneakers');
      } else {
        const err = await res.json();
        toast.error(err.message || 'যোগ করা যায়নি');
      }
    } catch {
      toast.error('সার্ভার সমস্যা');
    }
  };

  // Update Stock
  const handleStockChange = async (itemId: string, size: string, newStock: number) => {
    const it = items.find((i) => i._id === itemId);
    if (!it) return;

    const updatedStock = it.sizeStock.map((st: any) =>
      st.size === size ? { ...st, stock: Math.max(0, newStock) } : st
    );

    try {
      const res = await fetch(`/api/admin/combos/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sizeStock: updatedStock }),
      });
      if (res.ok) {
        setItems(items.map((i) => (i._id === itemId ? { ...i, sizeStock: updatedStock } : i)));
        toast.success(`স্টক আপডেট হয়েছে (${size}: ${newStock})`);
      }
    } catch {
      toast.error('স্টক আপডেট ফেইল করেছে');
    }
  };

  // Delete Item
  const handleDelete = async (itemId: string) => {
    if (!confirm('আপনি কি নিশ্চিত এটি ডিলিট করতে চান?')) return;
    try {
      const res = await fetch(`/api/admin/combos/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter((i) => i._id !== itemId));
        toast.success('ডিলিট সম্পন্ন হয়েছে');
      }
    } catch {
      toast.error('ডিলিট ফেইল করেছে');
    }
  };

  return (
    <div className="flex-1 space-y-6 py-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Combo & Offer Management</h1>
          <p className="text-muted-foreground text-sm">
            ল্যান্ডিং পেজের স্পেশাল কম্বো অফার, কালার ভ্যারিয়েন্ট ও সাইজ স্টক সরাসরি এখান থেকে নিয়ন্ত্রণ করুন।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchItems()}>
            <RefreshCw className="h-4 w-4 mr-1" /> রিফ্রেশ
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <a href={`/${activeTab === 'polo' ? 'polo-combo' : activeTab}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" /> লাইভ পেজ দেখুন
            </a>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl bg-muted/60 p-1">
          <TabsTrigger value="polo">পোলো শার্ট কম্বো</TabsTrigger>
          <TabsTrigger value="pajama">চায়না পায়জামা</TabsTrigger>
          <TabsTrigger value="sneakers">প্রিমিয়াম স্নিকার্স</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center justify-center gap-1.5 font-bold">
            <Settings className="h-4 w-4 text-amber-600" /> ডেলিভারি ও সেটিংস
          </TabsTrigger>
        </TabsList>

        {/* 1. POLO COMBO TAB */}
        <TabsContent value="polo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">নতুন পোলো কালার ও স্টক যুক্ত করুন</CardTitle>
              <CardDescription>
                কাস্টমাররা সাইজ বেছে নেওয়ার পর এই কালারগুলো থেকে ৫টি সিলেক্ট করতে পারবে।
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPolo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>কালারের নাম</Label>
                    <Input
                      placeholder="e.g. Royal Blue, Black, Olive"
                      value={poloColorName}
                      onChange={(e) => setPoloColorName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>কালার কোড (বাছাই করুন)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={poloColorHex}
                        onChange={(e) => setPoloColorHex(e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={poloColorHex}
                        onChange={(e) => setPoloColorHex(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>পোলোর ছবি (URL বা আপলোড)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Image URL"
                        value={poloImage}
                        onChange={(e) => setPoloImage(e.target.value)}
                      />
                      <label className="cursor-pointer">
                        <Button type="button" variant="outline" size="icon" disabled={uploadingImage} asChild>
                          <span>
                            {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setPoloImage)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="font-semibold block mb-2">সাইজ অনুযায়ী স্টক (পিস):</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {SIZES_CLOTHING.map((sz) => (
                      <div key={sz} className="border rounded-lg p-3 text-center bg-muted/40">
                        <span className="font-bold text-sm block mb-1">সাইজ {sz}</span>
                        <Input
                          type="number"
                          min="0"
                          value={poloStocks[sz]}
                          onChange={(e) =>
                            setPoloStocks({ ...poloStocks, [sz]: parseInt(e.target.value) || 0 })
                          }
                          className="text-center font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" /> কালার স্টক সেভ করুন
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List of Polo Colors */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">বর্তমান পোলো কালার ও স্টক তালিকা ({items.length})</h3>
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">এখনও কোনো কালার ভ্যারিয়েন্ট যোগ করা হয়নি।</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((it) => (
                  <Card key={it._id} className="overflow-hidden">
                    <div className="relative h-44 bg-muted flex items-center justify-center">
                      <Image
                        src={it.imageUrl || '/images/polo-combo.jpg'}
                        alt={it.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/75 rounded text-white text-xs font-semibold">
                        <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: it.colorHex }} />
                        {it.colorName || it.name}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleDelete(it._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <span className="text-xs font-semibold text-muted-foreground">সাইজ স্টক (সরাসরি পরিবর্তন করুন):</span>
                      <div className="grid grid-cols-4 gap-2">
                        {it.sizeStock?.map((st: any) => (
                          <div key={st.size} className="text-center border rounded p-1.5 bg-muted/20">
                            <span className="text-xs block font-bold text-muted-foreground">{st.size}</span>
                            <input
                              type="number"
                              min="0"
                              defaultValue={st.stock}
                              onBlur={(e) => handleStockChange(it._id, st.size, parseInt(e.target.value) || 0)}
                              className="w-full text-center font-bold text-sm bg-transparent border-b focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 2. PAJAMA TAB */}
        <TabsContent value="pajama" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">পায়জামা প্রোডাক্ট যুক্ত করুন</CardTitle>
              <CardDescription>সিঙ্গেল বা কম্বো পায়জামা প্রোডাক্ট ও সাইজ স্টক সেট করুন।</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPajama} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label>প্রোডাক্টের নাম</Label>
                    <Input
                      placeholder="e.g. চায়না মাইক্রো পায়জামা ৩ পিস কম্বো"
                      value={pajamaName}
                      onChange={(e) => setPajamaName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>ধরণ (Kind)</Label>
                    <Select value={pajamaKind} onValueChange={(v: any) => setPajamaKind(v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="combo">কম্বো (Combo)</SelectItem>
                        <SelectItem value="single">সিঙ্গেল (Single)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>দাম (টাকা)</Label>
                    <Input
                      type="number"
                      value={pajamaPrice}
                      onChange={(e) => setPajamaPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>প্রোডাক্টের ছবি</Label>
                  <div className="flex gap-2 mt-1 max-w-md">
                    <Input
                      placeholder="Image URL"
                      value={pajamaImage}
                      onChange={(e) => setPajamaImage(e.target.value)}
                    />
                    <label className="cursor-pointer">
                      <Button type="button" variant="outline" size="icon" disabled={uploadingImage} asChild>
                        <span>
                          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setPajamaImage)}
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="font-semibold block mb-2">সাইজ অনুযায়ী স্টক (পিস):</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {SIZES_CLOTHING.map((sz) => (
                      <div key={sz} className="border rounded-lg p-3 text-center bg-muted/40">
                        <span className="font-bold text-sm block mb-1">সাইজ {sz}</span>
                        <Input
                          type="number"
                          min="0"
                          value={pajamaStocks[sz]}
                          onChange={(e) =>
                            setPajamaStocks({ ...pajamaStocks, [sz]: parseInt(e.target.value) || 0 })
                          }
                          className="text-center font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" /> পায়জামা প্রোডাক্ট সেভ করুন
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List of Pajama Products */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">পায়জামা কালেকশন তালিকা ({items.length})</h3>
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">এখনও কোনো পায়জামা প্রোডাক্ট যোগ করা হয়নি।</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((it) => (
                  <Card key={it._id} className="overflow-hidden">
                    <div className="relative h-44 bg-muted flex items-center justify-center">
                      {it.imageUrl ? (
                        <Image src={it.imageUrl} alt={it.name} fill className="object-cover" />
                      ) : (
                        <span className="text-muted-foreground text-xs">No image</span>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/75 rounded text-white text-xs font-semibold">
                        ৳{it.price} ({it.productKind})
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleDelete(it._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-semibold text-sm line-clamp-1">{it.name}</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {it.sizeStock?.map((st: any) => (
                          <div key={st.size} className="text-center border rounded p-1 bg-muted/20">
                            <span className="text-xs block font-bold text-muted-foreground">{st.size}</span>
                            <input
                              type="number"
                              min="0"
                              defaultValue={st.stock}
                              onBlur={(e) => handleStockChange(it._id, st.size, parseInt(e.target.value) || 0)}
                              className="w-full text-center font-bold text-sm bg-transparent border-b focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. SNEAKERS TAB */}
        <TabsContent value="sneakers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">প্রিমিয়াম স্নিকার্স যুক্ত করুন</CardTitle>
              <CardDescription>সাইজ ৪০-৪৪ অনুযায়ী স্নিকার্স প্রোডাক্ট ও স্টক সেট করুন।</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSneakers} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label>স্নিকার্স এর নাম</Label>
                    <Input
                      placeholder="e.g. ক্লাসিক হোয়াইট স্নিকার্স"
                      value={sneakersName}
                      onChange={(e) => setSneakersName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>ধরণ (Kind)</Label>
                    <Select value={sneakersKind} onValueChange={(v: any) => setSneakersKind(v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">সিঙ্গেল (Single)</SelectItem>
                        <SelectItem value="combo">কম্বো (Combo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>দাম (টাকা)</Label>
                    <Input
                      type="number"
                      value={sneakersPrice}
                      onChange={(e) => setSneakersPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>স্নিকার্স এর ছবি</Label>
                  <div className="flex gap-2 mt-1 max-w-md">
                    <Input
                      placeholder="Image URL"
                      value={sneakersImage}
                      onChange={(e) => setSneakersImage(e.target.value)}
                    />
                    <label className="cursor-pointer">
                      <Button type="button" variant="outline" size="icon" disabled={uploadingImage} asChild>
                        <span>
                          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setSneakersImage)}
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="font-semibold block mb-2">সাইজ অনুযায়ী স্টক (পিস):</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {SIZES_SHOES.map((sz) => (
                      <div key={sz} className="border rounded-lg p-2.5 text-center bg-muted/40">
                        <span className="font-bold text-sm block mb-1">সাইজ {sz}</span>
                        <Input
                          type="number"
                          min="0"
                          value={sneakersStocks[sz]}
                          onChange={(e) =>
                            setSneakersStocks({ ...sneakersStocks, [sz]: parseInt(e.target.value) || 0 })
                          }
                          className="text-center font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" /> স্নিকার্স সেভ করুন
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List of Sneakers */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg">স্নিকার্স কালেকশন তালিকা ({items.length})</h3>
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">এখনও কোনো স্নিকার্স প্রোডাক্ট যোগ করা হয়নি।</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((it) => (
                  <Card key={it._id} className="overflow-hidden">
                    <div className="relative h-44 bg-muted flex items-center justify-center">
                      {it.imageUrl ? (
                        <Image src={it.imageUrl} alt={it.name} fill className="object-cover" />
                      ) : (
                        <span className="text-muted-foreground text-xs">No image</span>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/75 rounded text-white text-xs font-semibold">
                        ৳{it.price}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleDelete(it._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-semibold text-sm line-clamp-1">{it.name}</h4>
                      <div className="grid grid-cols-5 gap-1.5">
                        {it.sizeStock?.map((st: any) => (
                          <div key={st.size} className="text-center border rounded p-1 bg-muted/20">
                            <span className="text-[11px] block font-bold text-muted-foreground">{st.size}</span>
                            <input
                              type="number"
                              min="0"
                              defaultValue={st.stock}
                              onBlur={(e) => handleStockChange(it._id, st.size, parseInt(e.target.value) || 0)}
                              className="w-full text-center font-bold text-xs bg-transparent border-b focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      
        {/* -------------------- 4. SETTINGS & DELIVERY CHARGES TAB -------------------- */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">ফ্রি ডেলিভারি ও চার্জ সেটিংস</CardTitle>
              <CardDescription>
                ৩টি ল্যান্ডিং পেজের জন্য আলাদা আলাদা ফ্রি ডেলিভারি টগল ও ডেলিভারি চার্জ নির্ধারণ করুন।
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                {/* ফ্রি ডেলিভারি (পেজ অনুযায়ী) */}
                <div className="grid gap-3 rounded-xl border p-4 bg-muted/20">
                  <h2 className="font-bold text-base">ফ্রি ডেলিভারি (পেজ অনুযায়ী)</h2>

                  {[
                    { key: 'polo_free_delivery', label: 'পোলো শার্ট' },
                    { key: 'pajama_free_delivery', label: 'পায়জামা' },
                    { key: 'sneakers_free_delivery', label: 'স্নিকার্স' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{label}</span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="font-bold min-w-16"
                          variant={(settings as any)[key] === 'on' ? 'default' : 'outline'}
                          onClick={() => setSettings({ ...settings, [key]: 'on' })}
                        >
                          ফ্রি
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="font-bold min-w-16"
                          variant={(settings as any)[key] === 'off' ? 'default' : 'outline'}
                          onClick={() => setSettings({ ...settings, [key]: 'off' })}
                        >
                          চার্জ
                        </Button>
                      </div>
                    </div>
                  ))}

                  <p className="text-xs text-muted-foreground mt-1">
                    যে পেজে "ফ্রি" সিলেক্ট করবেন সেখানে ডেলিভারি চার্জ ০ হবে এবং কাস্টমার "ফ্রি ডেলিভারি" দেখবে। "চার্জ" থাকলে নিচের চার্জগুলো কার্যকর থাকবে।
                  </p>
                </div>

                {/* পোলো শার্ট ডেলিভারি চার্জ */}
                <div className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="polo-dhaka">পোলো শার্টের ডেলিভারি চার্জ — ঢাকার ভিতরে (টাকা)</Label>
                    <Input
                      id="polo-dhaka"
                      type="number"
                      min="0"
                      value={settings.polo_delivery_charge_dhaka}
                      onChange={(e) => setSettings({ ...settings, polo_delivery_charge_dhaka: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="polo-outside">পোলো শার্টের ডেলিভারি চার্জ — ঢাকার বাইরে (টাকা)</Label>
                    <Input
                      id="polo-outside"
                      type="number"
                      min="0"
                      value={settings.polo_delivery_charge_outside}
                      onChange={(e) => setSettings({ ...settings, polo_delivery_charge_outside: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* পায়জামা ডেলিভারি চার্জ */}
                <div className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="pj-dhaka">পায়জামার ডেলিভারি চার্জ — ঢাকার ভিতরে (টাকা)</Label>
                    <Input
                      id="pj-dhaka"
                      type="number"
                      min="0"
                      value={settings.pajama_delivery_charge_dhaka}
                      onChange={(e) => setSettings({ ...settings, pajama_delivery_charge_dhaka: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="pj-outside">পায়জামার ডেলিভারি চার্জ — ঢাকার বাইরে (টাকা)</Label>
                    <Input
                      id="pj-outside"
                      type="number"
                      min="0"
                      value={settings.pajama_delivery_charge_outside}
                      onChange={(e) => setSettings({ ...settings, pajama_delivery_charge_outside: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* স্নিকার্স ডেলিভারি চার্জ */}
                <div className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="sn-dhaka">স্নিকার্সের ডেলিভারি চার্জ — ঢাকার ভিতরে (টাকা)</Label>
                    <Input
                      id="sn-dhaka"
                      type="number"
                      min="0"
                      value={settings.sneakers_delivery_charge_dhaka}
                      onChange={(e) => setSettings({ ...settings, sneakers_delivery_charge_dhaka: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="sn-outside">স্নিকার্সের ডেলিভারি চার্জ — ঢাকার বাইরে (টাকা)</Label>
                    <Input
                      id="sn-outside"
                      type="number"
                      min="0"
                      value={settings.sneakers_delivery_charge_outside}
                      onChange={(e) => setSettings({ ...settings, sneakers_delivery_charge_outside: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* কম্বো দাম ও পরিমাণ */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="grid gap-1.5">
                    <Label htmlFor="combo-price">কম্বো দাম (টাকা)</Label>
                    <Input
                      id="combo-price"
                      type="number"
                      min="1"
                      value={settings.combo_price}
                      onChange={(e) => setSettings({ ...settings, combo_price: Number(e.target.value) || 999 })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="combo-qty">কত পিস কম্বো</Label>
                    <Input
                      id="combo-qty"
                      type="number"
                      min="1"
                      value={settings.combo_qty}
                      onChange={(e) => setSettings({ ...settings, combo_qty: Number(e.target.value) || 5 })}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#18483b] text-white hover:bg-[#123e31] font-bold py-6 text-base"
                  disabled={savingSettings}
                >
                  {savingSettings ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                  সেটিংস সংরক্ষণ করুন
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
