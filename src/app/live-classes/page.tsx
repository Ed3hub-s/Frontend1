'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarRange, Search, SlidersHorizontal } from 'lucide-react';
import LiveClassCard from './components/LiveClassCard';
import { LiveClass, liveClassesApi } from '@/lib/liveClasses';
import { useAuth } from '@/context/AuthContext';

const categories = ['All', 'Technology', 'Business', 'Design', 'Marketing', 'Career', 'AI', 'Programming', 'Data', 'Entrepreneurship'];

export default function LiveClassesPage() {
  const [items, setItems] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [access, setAccess] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      liveClassesApi.list({
        ...(search ? { search } : {}),
        ...(category !== 'All' ? { category } : {}),
        ...(access !== 'all' ? { access_type: access } : {}),
      }).then(({ data }) => setItems(data))
        .catch(() => setError('Live classes could not be loaded. Please try again.'))
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(timer);
  }, [search, category, access]);

  const featured = useMemo(() => items[0], [items]);
  const remaining = featured ? items.slice(1) : [];

  return (
    <>
      <section className="lc-hero">
        <div className="lc-hero-copy">
          <p className="lc-overline"><span /> Scheduled learning on Ed3Hub</p>
          <h1>Learn live.<br />Leave with momentum.</h1>
          <p>Small, focused sessions with educators you can question in real time. Find the topic, reserve a place, and join from here.</p>
          <div className="lc-hero-actions">
            <a href="#class-board" className="lc-button lc-button-primary">Browse the schedule <ArrowRight /></a>
            {user?.role === 'educator' && <Link href="/live-classes/create" className="lc-button lc-button-quiet">Host a live class</Link>}
          </div>
        </div>
        <div className="lc-hero-board" aria-label="How live classes work">
          <div className="lc-board-date"><CalendarRange /><strong>Choose a time</strong><span>Upcoming sessions are shown in your local time.</span></div>
          <div className="lc-board-step"><b>01</b><span>Register or buy access</span></div>
          <div className="lc-board-step"><b>02</b><span>Receive class reminders</span></div>
          <div className="lc-board-step"><b>03</b><span>Join the secure classroom</span></div>
        </div>
      </section>

      <section className="lc-board" id="class-board">
        <div className="lc-board-head">
          <div><p className="lc-overline"><span /> The class board</p><h2>Upcoming live classes</h2></div>
          <Link href="/live-classes/my" className="lc-text-link">Open my schedule <ArrowRight /></Link>
        </div>

        <div className="lc-filters">
          <label className="lc-search"><Search /><span className="sr-only">Search classes</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topic or class" /></label>
          <label className="lc-select"><SlidersHorizontal /><span className="sr-only">Filter by access type</span><select value={access} onChange={(event) => setAccess(event.target.value)}><option value="all">Free and paid</option><option value="free">Free only</option><option value="paid">Paid only</option></select></label>
        </div>
        <div className="lc-categories" role="group" aria-label="Filter by category">
          {categories.map((item) => <button key={item} className={item === category ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
        </div>

        {error && <div className="lc-notice is-error">{error}</div>}
        {loading ? (
          <div className="lc-loading" aria-live="polite"><span /> Loading the class board…</div>
        ) : items.length === 0 ? (
          <div className="lc-empty"><CalendarRange /><h3>No class matches this view</h3><p>Clear a filter or check back when new sessions are published.</p></div>
        ) : (
          <div className="lc-class-grid">
            {featured && <LiveClassCard item={featured} featured />}
            {remaining.map((item) => <LiveClassCard key={item.id} item={item} />)}
          </div>
        )}
      </section>
    </>
  );
}
