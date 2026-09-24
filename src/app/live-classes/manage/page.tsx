'use client';

import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { formatClassDate, LiveClass, liveClassesApi } from '@/lib/liveClasses';
import { ArrowRight, BarChart3, CalendarDays, Pencil, Play, Plus, Trash2, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

function errorMessage(error: unknown) {
  const response = error as { response?: { data?: { detail?: string } | string[] } };
  const data = response.response?.data;
  if (Array.isArray(data)) return data[0];
  return typeof data === 'object' && data?.detail ? data.detail : 'That action could not be completed.';
}

function EducatorClasses() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(() => liveClassesApi.educator().then(({ data }) => setItems(data)).finally(() => setLoading(false)), []);

  useEffect(() => { if (user?.role === 'educator') load(); }, [load, user]);

  const startNow = async (item: LiveClass) => {
    if (!window.confirm(`Start “${item.title}” immediately? Learners with access will be able to join now.`)) return;
    setWorking(item.slug); setMessage('');
    try {
      await liveClassesApi.update(item.slug, { start_now: true, status: 'published' });
      await load();
      setMessage('The class is ready now. Use Join to open the classroom.');
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setWorking(''); }
  };

  const remove = async (item: LiveClass) => {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    setWorking(item.slug); setMessage('');
    try {
      await liveClassesApi.remove(item.slug);
      setItems((current) => current.filter((entry) => entry.slug !== item.slug));
      setMessage('The live class was deleted.');
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setWorking(''); }
  };

  if (!authLoading && user?.role !== 'educator') return <div className="lc-page-status">Only educator accounts can manage live classes.</div>;

  return <div className="lc-my"><header className="lc-my-head"><div><p className="lc-overline"><span /> Educator studio</p><h1>Live class desk</h1></div><Link href="/live-classes/create" className="lc-button lc-button-primary"><Plus /> Create class</Link></header>{message && <div className="lc-notice">{message}</div>}{loading ? <div className="lc-loading"><span /> Loading your classes…</div> : items.length === 0 ? <div className="lc-empty"><CalendarDays /><h2>No live classes yet</h2><p>Publish a focused session and it will appear here.</p><Link href="/live-classes/create" className="lc-button lc-button-primary">Create your first class</Link></div> : <div className="lc-schedule-list">{items.map((item) => <article className="lc-schedule-row" key={item.id}><time><b>{new Date(item.starts_at).toLocaleDateString('en-NG', { day: '2-digit' })}</b><span>{new Date(item.starts_at).toLocaleDateString('en-NG', { month: 'short' })}</span></time><div><span className={`lc-status is-${item.status}`}>{item.status}</span><h2>{item.title}</h2><p><UsersRound /> {item.registered_count} registered · {formatClassDate(item.starts_at)}</p></div><div className="lc-row-actions">{item.is_joinable ? <Link href={`/live-classes/classroom/${item.slug}`} className="lc-button lc-button-primary"><Play /> Join</Link> : ['draft', 'published'].includes(item.status) ? <button type="button" className="lc-button lc-button-primary" onClick={() => startNow(item)} disabled={working === item.slug}><Play /> Start now</button> : null}<Link href={`/live-classes/edit/${item.slug}`} className="lc-button lc-button-quiet"><Pencil /> Edit</Link><Link href={`/live-classes/${item.slug}`} className="lc-button lc-button-quiet">View <ArrowRight /></Link><Link href={`/live-classes/manage/${item.slug}`} className="lc-button lc-button-quiet"><BarChart3 /> Analytics</Link><button type="button" className="lc-button lc-button-quiet lc-button-danger" onClick={() => remove(item)} disabled={working === item.slug}><Trash2 /> Delete</button></div></article>)}</div>}</div>;
}

export default function ManageLiveClassesPage() { return <AuthGuard><EducatorClasses /></AuthGuard>; }
