'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPolo = pathname === '/polo-combo' || pathname === '/';
  const isPajama = pathname === '/pajama';
  const isSneakers = pathname === '/sneakers';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-gray-900 font-sans antialiased selection:bg-[#18483b] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-gray-200/80 bg-white">
        <div className="relative mx-auto flex min-h-[72px] max-w-5xl items-center justify-center px-4 py-3 sm:min-h-[84px]">
          <Link href="/polo-combo" className="flex items-center justify-center">
            <Image
              src="/images/gentsity-header-logo.png"
              alt="Gentsity"
              width={260}
              height={70}
              priority
              className="max-h-14 w-44 object-contain sm:max-h-16 sm:w-64"
            />
          </Link>
          {isPolo && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-[#d97706] px-3.5 py-1 text-xs sm:text-sm font-bold text-white shadow-sm">
              ফ্রি ডেলিভারি
            </span>
          )}
        </div>
      </header>

      {/* Centered Tab Switcher Pills */}
      <nav className="border-b border-gray-200/80 bg-white sticky top-0 z-40 shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 overflow-x-auto px-4 py-2.5">
          <Link
            href="/polo-combo"
            className={`rounded-full px-5 py-1.5 text-sm font-bold transition-all ${
              isPolo
                ? 'border border-[#18483b] bg-[#18483b] text-white shadow-xs'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-black'
            }`}
          >
            পোলো শার্ট
          </Link>
          <Link
            href="/pajama"
            className={`rounded-full px-5 py-1.5 text-sm font-bold transition-all ${
              isPajama
                ? 'border border-[#18483b] bg-[#18483b] text-white shadow-xs'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-black'
            }`}
          >
            পায়জামা
          </Link>
          <Link
            href="/sneakers"
            className={`rounded-full px-5 py-1.5 text-sm font-bold transition-all ${
              isSneakers
                ? 'border border-[#18483b] bg-[#18483b] text-white shadow-xs'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-black'
            }`}
          >
            স্নিকার্স
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/8801700000000?text=%E0%A6%B9%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2%E0%A7%8B%20Gentsity%2C%20%E0%A6%86%E0%A6%AE%E0%A6%BF%20%E0%A6%8F%E0%A6%95%E0%A6%9F%E0%A6%BF%20%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A7%8B%E0%A6%A1%E0%A6%BE%E0%A6%95%E0%A7%8D%E0%A6%9F%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A7%84"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <svg viewBox="0 0 32 32" className="h-8 w-8 fill-current" aria-hidden="true">
          <path d="M16 3C9 3 3.3 8.7 3.3 15.7c0 2.5.7 4.9 2 7L3 29l6.5-2.2c2 1.1 4.2 1.7 6.5 1.7 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.2c-2.1 0-4.1-.6-5.9-1.7l-.4-.2-3.9 1.3 1.3-3.8-.3-.4c-1.2-1.8-1.8-3.9-1.8-6 0-5.8 4.8-10.6 10.7-10.6S26.7 9.9 26.7 15.7 21.9 26.2 16 26.2zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z" />
        </svg>
      </a>

      {/* Simple Footer */}
      <footer className="border-t border-gray-200/80 bg-white py-6 text-center text-sm font-medium text-gray-500">
        © Gentsity — সারা বাংলাদেশে ক্যাশ অন ডেলিভারি
      </footer>
    </div>
  );
}
