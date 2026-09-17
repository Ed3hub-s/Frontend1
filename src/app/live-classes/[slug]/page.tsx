'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, CalendarDays, Check, Clock3, GraduationCap, Play, Radio, ShieldCheck, UsersRound } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatClassDate, LiveClass, liveClassesApi, money } from '@/lib/liveClasses';

export default function LiveClassDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [item, setItem] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [recordings, setRecordings] = useState<{ id: number; duration_seconds: number; access_url: string }[]>([]);

  const load = useCallback(() => liveClassesApi.detail(slug).then(({ data }) => setItem(data)).finally(() => setLoading(false)), [slug]);

  useEffect(() => { load().catch(() => setMessage('This class could not be loaded.')); }, [load]);

  useEffect(() => {
    if (!item || !['active', 'host'].includes(item.viewer_access_status || '')) return;
    api.get(`/live-classes/${slug}/recordings/`).then(({ data }) => setRecordings(data)).catch(() => {});
  }, [item, slug]);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference || !user || searchParams.get('payment') !== 'verify') return;
    setWorking(true);
    liveClassesApi.verifyPayment(slug, reference)
      .then(() => { setMessage('Payment confirmed. Your classroom access is active.'); return load(); })
      .catch(() => setMessage('We could not confirm that payment yet. You can retry from this page.'))
      .finally(() => setWorking(false));
  }, [load, searchParams, slug, user]);

  const register = async () => {
    if (!user) { router.push(`/sign-in?next=/live-classes/${slug}`); return; }
    setWorking(true); setMessage('');
    try {
      const { data } = await liveClassesApi.register(slug);
      if (data.checkout?.authorization_url) {
        window.location.assign(data.checkout.authorization_url);
        return;
      }
      setMessage('Your place is reserved. We will remind you before class.');
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.detail || error?.response?.data?.[0] || 'Registration could not be completed.');
    } finally { setWorking(false); }
  };

  const watchRecording = async (accessUrl: string) => {
    setWorking(true);
    try {
      const relativeUrl = accessUrl.replace(/^https?:\/\/[^/]+\/api/, '');
      const { data } = await api.get(relativeUrl);
      window.location.assign(data.playback_url);
    } catch {
      setMessage('The recording link could not be refreshed. Please try again.');
    } finally { setWorking(false); }
  };

  if (loading || authLoading) return <div className="lc-page-status">Loading class…</div>;
  if (!item) return <div className="lc-page-status">This class is unavailable.</div>;
  const hasAccess = item.viewer_access_status === 'active' || item.viewer_access_status === 'host';
  const objectives = (item.learning_objectives || '').split('\n').filter(Boolean);

  return (
    <article className="lc-detail">
      <Link href="/live-classes" className="lc-back"><ArrowLeft /> Back to class board</Link>
      <header className="lc-detail-head">
        <div className="lc-detail-copy">
          <div className="lc-meta-line"><span>{item.category}</span><span>{item.level.replace('_', ' ')}</span>{item.status === 'live' && <span className="is-live">Live now</span>}</div>
          <h1>{item.title}</h1>
          <p className="lc-detail-intro">{item.description}</p>
          <div className="lc-host"><span className="lc-avatar">{item.educator.avatar ? <Image src={item.educator.avatar} alt="" fill /> : item.educator.name.slice(0, 1)}</span><span><small>Your educator</small><strong>{item.educator.name}</strong></span></div>
        </div>
        <aside className="lc-ticket">
          <div className="lc-ticket-top"><span>{item.access_type === 'free' ? 'Free access' : money(item.price, item.currency)}</span><Radio /></div>
          <dl>
            <div><dt><CalendarDays />Date</dt><dd>{formatClassDate(item.starts_at)}</dd></div>
            <div><dt><Clock3 />Duration</dt><dd>{item.duration_minutes} minutes</dd></div>
            <div><dt><UsersRound />Availability</dt><dd>{item.available_spaces} of {item.capacity} places left</dd></div>
          </dl>
          {hasAccess && item.is_joinable ? (
            <Link href={`/live-classes/classroom/${item.slug}`} className="lc-button lc-button-primary lc-button-block">Join classroom <Radio /></Link>
          ) : hasAccess ? (
            <button className="lc-button lc-button-success lc-button-block" disabled><Check /> You are registered</button>
          ) : (
            <button onClick={register} disabled={working} className="lc-button lc-button-primary lc-button-block" data-state={working ? 'loading' : undefined}>
              {working ? 'Preparing access…' : item.access_type === 'free' ? 'Reserve my place' : `Buy access · ${money(item.price, item.currency)}`}
            </button>
          )}
          <p className="lc-secure"><ShieldCheck /> Access is checked by Ed3Hub before entry.</p>
          {message && <div className={message.includes('could not') ? 'lc-notice is-error' : 'lc-notice is-success'}>{message}</div>}
        </aside>
      </header>

      <section className="lc-detail-body">
        <div>
          <h2>What you’ll leave with</h2>
          {objectives.length ? <ul className="lc-objectives">{objectives.map((objective) => <li key={objective}><Check />{objective}</li>)}</ul> : <p>Learning objectives will be shared by the educator.</p>}
        </div>
        <div className="lc-detail-notes">
          <div><GraduationCap /><span><small>Level</small><strong>{item.level.replace('_', ' ')}</strong></span></div>
          <div><BookOpen /><span><small>Requirements</small><strong>{item.requirements || 'Bring your questions and a stable connection.'}</strong></span></div>
          {item.course_title && <div><BookOpen /><span><small>Connected course</small><strong>{item.course_title}</strong></span></div>}
        </div>
      </section>
      {recordings.length > 0 && <section className="lc-recordings"><div><p className="lc-overline"><span /> Class replay</p><h2>Watch the recording</h2></div><div>{recordings.map((recording, index) => <button key={recording.id} className="lc-button lc-button-quiet" onClick={() => watchRecording(recording.access_url)} disabled={working}><Play /> Recording {index + 1}{recording.duration_seconds ? ` · ${Math.round(recording.duration_seconds / 60)} min` : ''}</button>)}</div></section>}
    </article>
  );
}
