'use client';

import AuthGuard from '@/components/AuthGuard';
import api from '@/lib/api';
import { ArrowLeft, Clock3, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';

interface Analytics { registered_count: number; attended_count: number; attendance_rate: number; average_attendance_seconds: number; visits: { id: number; learner_name: string; joined_at: string; left_at: string | null; duration_seconds: number }[] }

function AnalyticsView({ slug }: { slug: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  useEffect(() => { api.get(`/live-classes/educator/${slug}/analytics/`).then((response) => setData(response.data)); }, [slug]);
  if (!data) return <div className="lc-loading"><span /> Loading attendance…</div>;
  return <div className="lc-my"><Link href="/live-classes/manage" className="lc-back"><ArrowLeft /> Live class desk</Link><header className="lc-my-head"><div><p className="lc-overline"><span /> Class report</p><h1>Attendance</h1></div></header><div className="lc-analytics"><div><UsersRound /><strong>{data.registered_count}</strong><span>Registered</span></div><div><UsersRound /><strong>{data.attended_count}</strong><span>Attended</span></div><div><strong>{data.attendance_rate}%</strong><span>Attendance rate</span></div><div><Clock3 /><strong>{Math.round(data.average_attendance_seconds / 60)} min</strong><span>Average attendance</span></div></div><div className="lc-attendance"><h2>Join history</h2>{data.visits.length === 0 ? <p>No attendance has been recorded.</p> : data.visits.map((visit) => <div key={visit.id}><strong>{visit.learner_name}</strong><span>{new Date(visit.joined_at).toLocaleString('en-NG')}</span><span>{Math.round(visit.duration_seconds / 60)} min</span></div>)}</div></div>;
}

export default function LiveClassAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = use(params); return <AuthGuard><AnalyticsView slug={slug} /></AuthGuard>; }
