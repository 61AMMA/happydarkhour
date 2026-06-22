import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = { title: 'Happy Dark Hour — Creator' };

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0D0D0D', color: '#F5F5F5' }}>
      {/* Topbar */}
      <header
        className="border-b px-6 py-3 flex items-center justify-between"
        style={{ borderColor: '#CC0000', backgroundColor: '#0D0D0D' }}
      >
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-wide" style={{ color: '#CC0000' }}>
            HDH Creator
          </span>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/creator"
              className="opacity-80 hover:opacity-100 transition-opacity"
            >
              Storie
            </Link>
          </nav>
        </div>
        <Link
          href="/operator"
          className="text-sm opacity-60 hover:opacity-100 transition-opacity"
        >
          → Console Operatore
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
