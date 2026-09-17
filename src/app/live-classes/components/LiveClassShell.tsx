'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LiveClassShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const dashboard = user?.role === 'educator' ? '/dashboard' : '/learner-dashboard';

  return (
    <div className="lc-site">
      <header className="lc-nav">
        <Link href="/" className="lc-brand" aria-label="Ed3Hub home">
          <Image src="/logo/ed3hub_logo.png" alt="Ed3Hub" width={142} height={40} priority />
        </Link>
        <nav className={open ? 'lc-navlinks is-open' : 'lc-navlinks'} aria-label="Live Classes navigation">
          <Link href="/live-classes" className="is-current">Class board</Link>
          {user && <Link href="/live-classes/my">My schedule</Link>}
        </nav>
        <div className="lc-nav-actions">
          {user?.role === 'educator' ? (
            <Link href="/live-classes/create" className="lc-button lc-button-primary">Create class</Link>
          ) : user ? (
            <Link href={dashboard} className="lc-button lc-button-quiet">Dashboard</Link>
          ) : (
            <Link href="/sign-in" className="lc-button lc-button-primary">Sign in</Link>
          )}
          <button className="lc-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="lc-footer">
        <div><CalendarDays aria-hidden="true" /><span>Live learning, scheduled around real people.</span></div>
        <span>Ed3Hub Live Classes</span>
      </footer>
    </div>
  );
}
