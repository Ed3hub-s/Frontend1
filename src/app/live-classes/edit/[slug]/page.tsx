'use client';

import AuthGuard from '@/components/AuthGuard';
import { LiveClass, liveClassesApi } from '@/lib/liveClasses';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, use, useEffect, useState } from 'react';

const categories = ['Technology', 'Business', 'Design', 'Marketing', 'Career', 'AI', 'Programming', 'Data', 'Entrepreneurship', 'Other'];

function firstError(error: unknown) {
  const response = error as { response?: { data?: Record<string, string[] | string> } };
  const payload = response.response?.data;
  const first = payload && Object.values(payload)[0];
  return Array.isArray(first) ? first[0] : typeof first === 'string' ? first : 'The class could not be updated.';
}

function EditLiveClass({ slug }: { slug: string }) {
  const router = useRouter();
  const [item, setItem] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { liveClassesApi.educatorDetail(slug).then(({ data }) => setItem(data)).catch(() => setError('This class could not be loaded.')).finally(() => setLoading(false)); }, [slug]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError('');
    const form = new FormData(event.currentTarget);
    if (!(form.get('cover_image') as File)?.size) form.delete('cover_image');
    try { await liveClassesApi.update(slug, form); router.push('/live-classes/manage'); }
    catch (requestError) { setError(firstError(requestError)); setSaving(false); }
  };

  if (loading) return <div className="lc-page-status">Loading class…</div>;
  if (!item) return <div className="lc-page-status">{error || 'This class is unavailable.'}</div>;

  return <div className="lc-create"><Link href="/live-classes/manage" className="lc-back"><ArrowLeft /> Back to live class desk</Link><div className="lc-create-head"><div><p className="lc-overline"><span /> Educator studio</p><h1>Edit live class.</h1></div><p>Correct the schedule or update what learners will see.</p></div><form onSubmit={submit} className="lc-form"><section><div className="lc-form-section-head"><b>1</b><div><h2>Class details</h2><p>Update the public information for this class.</p></div></div><div className="lc-fields"><label className="lc-field lc-field-wide"><span>Class title</span><input name="title" required maxLength={255} defaultValue={item.title} /></label><label className="lc-field lc-field-wide"><span>Description</span><textarea name="description" required rows={5} defaultValue={item.description} /></label><label className="lc-field"><span>Category</span><select name="category" required defaultValue={item.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="lc-field"><span>Level</span><select name="level" required defaultValue={item.level}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="all_levels">All levels</option></select></label><label className="lc-field lc-field-wide"><span>Replace cover image (optional)</span><input type="file" name="cover_image" accept="image/jpeg,image/png,image/webp" /></label></div></section><section><div className="lc-form-section-head"><b>2</b><div><h2>Schedule</h2><p>Times are interpreted in West Africa Time.</p></div></div><div className="lc-fields"><label className="lc-field"><span>Date</span><input type="date" name="scheduled_date" required defaultValue={item.scheduled_date} /></label><label className="lc-field"><span>Start time</span><input type="time" name="scheduled_time" required defaultValue={item.scheduled_time.slice(0, 5)} /></label><label className="lc-field"><span>Duration</span><input type="number" name="duration_minutes" min="15" step="15" required defaultValue={item.duration_minutes} /></label><label className="lc-field"><span>Capacity</span><input type="number" name="capacity" min="1" max="100" required defaultValue={item.capacity} /></label></div></section><section><div className="lc-form-section-head"><b>3</b><div><h2>Learning promise</h2><p>Keep one objective per line.</p></div></div><div className="lc-fields"><label className="lc-field lc-field-wide"><span>Learning objectives</span><textarea name="learning_objectives" required rows={5} defaultValue={item.learning_objectives} /></label><label className="lc-field lc-field-wide"><span>Requirements</span><textarea name="requirements" rows={3} defaultValue={item.requirements} /></label></div></section>{error && <div className="lc-notice is-error">{error}</div>}<div className="lc-form-submit"><p>Saving also refreshes the reminder schedule.</p><button className="lc-button lc-button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'} <Save /></button></div></form></div>;
}

export default function EditLiveClassPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = use(params); return <AuthGuard><EditLiveClass slug={slug} /></AuthGuard>; }
