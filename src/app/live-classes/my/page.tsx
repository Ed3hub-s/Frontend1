'use client';

import AuthGuard from '@/components/AuthGuard';
import { CalendarDays, Clock3, Radio } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatClassDate, LiveClassRegistration, liveClassesApi } from '@/lib/liveClasses';

function MySchedule() {
  const [items, setItems] = useState<LiveClassRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { liveClassesApi.mine().then(({ data }) => setItems(data)).finally(() => setLoading(false)); }, []);

  return (
    <div className="lc-my">
      <header className="lc-my-head"><div><p className="lc-overline"><span /> Learner schedule</p><h1>My live classes</h1></div><Link href="/live-classes" className="lc-button lc-button-quiet">Find another class</Link></header>
      {loading ? <div className="lc-loading"><span /> Loading your schedule…</div> : items.length === 0 ? <div className="lc-empty"><CalendarDays /><h2>Your schedule is open</h2><p>Register for a live class and it will appear here.</p><Link href="/live-classes" className="lc-button lc-button-primary">Browse classes</Link></div> : (
        <div className="lc-schedule-list">
          {items.map((item) => {
            const active = item.access_status === 'active';
            const starts = new Date(item.starts_at);
            const now = new Date();
            const joinable = active && now >= new Date(starts.getTime() - 15 * 60000);
            return <article key={item.id} className="lc-schedule-row"><time><b>{starts.toLocaleDateString('en-NG', { day: '2-digit' })}</b><span>{starts.toLocaleDateString('en-NG', { month: 'short' })}</span></time><div><span className={`lc-status is-${item.access_status}`}>{item.access_status}</span><h2>{item.live_class_title}</h2><p>with {item.educator_name} · <Clock3 /> {formatClassDate(item.starts_at)}</p></div><Link href={joinable ? `/live-classes/classroom/${item.live_class_slug}` : `/live-classes/${item.live_class_slug}`} className={joinable ? 'lc-button lc-button-primary' : 'lc-button lc-button-quiet'}>{joinable && <Radio />}{joinable ? 'Join classroom' : 'View class'}</Link></article>;
          })}
        </div>
      )}
    </div>
  );
}

export default function MyLiveClassesPage() { return <AuthGuard><MySchedule /></AuthGuard>; }
