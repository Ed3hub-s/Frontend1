'use client';

import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { formatClassDate, LiveClass, liveClassesApi } from '@/lib/liveClasses';
import { ArrowRight, BarChart3, CalendarDays, Plus, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function EducatorClasses() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (user?.role === 'educator') liveClassesApi.educator().then(({ data }) => setItems(data)).finally(() => setLoading(false)); }, [user]);
  if (!authLoading && user?.role !== 'educator') return <div className="lc-page-status">Only educator accounts can manage live classes.</div>;
  return <div className="lc-my"><header className="lc-my-head"><div><p className="lc-overline"><span /> Educator studio</p><h1>Live class desk</h1></div><Link href="/live-classes/create" className="lc-button lc-button-primary"><Plus /> Create class</Link></header>{loading ? <div className="lc-loading"><span /> Loading your classes…</div> : items.length === 0 ? <div className="lc-empty"><CalendarDays /><h2>No live classes yet</h2><p>Publish a focused session and it will appear here.</p><Link href="/live-classes/create" className="lc-button lc-button-primary">Create your first class</Link></div> : <div className="lc-schedule-list">{items.map((item) => <article className="lc-schedule-row" key={item.id}><time><b>{new Date(item.starts_at).toLocaleDateString('en-NG', { day: '2-digit' })}</b><span>{new Date(item.starts_at).toLocaleDateString('en-NG', { month: 'short' })}</span></time><div><span className={`lc-status is-${item.status}`}>{item.status}</span><h2>{item.title}</h2><p><UsersRound /> {item.registered_count} registered · {formatClassDate(item.starts_at)}</p></div><div className="lc-row-actions"><Link href={`/live-classes/${item.slug}`} className="lc-button lc-button-quiet">View <ArrowRight /></Link><Link href={`/live-classes/manage/${item.slug}`} className="lc-button lc-button-quiet"><BarChart3 /> Analytics</Link></div></article>)}</div>}</div>;
}

export default function ManageLiveClassesPage() { return <AuthGuard><EducatorClasses /></AuthGuard>; }
