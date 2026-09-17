'use client';

import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { liveClassesApi } from '@/lib/liveClasses';
import { ArrowLeft, ArrowRight, ImagePlus, Radio, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

const categories = ['Technology', 'Business', 'Design', 'Marketing', 'Career', 'AI', 'Programming', 'Data', 'Entrepreneurship', 'Other'];

function CreateLiveClassForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);
  const [access, setAccess] = useState('free');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'educator') api.get('/courses/my/courses/').then(({ data }) => setCourses(data)).catch(() => {});
  }, [user]);

  if (!loading && user?.role !== 'educator') return <div className="lc-page-status">Only educator accounts can create live classes.</div>;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true); setError('');
    const form = new FormData(event.currentTarget);
    form.set('access_type', access);
    if (access === 'free') form.set('price', '0');
    form.set('status', 'published');
    form.set('recording_enabled', form.get('recording_enabled') ? 'true' : 'false');
    if (!form.get('course')) form.delete('course');
    try {
      const { data } = await liveClassesApi.create(form);
      router.push(`/live-classes/${data.slug}`);
    } catch (responseError: unknown) {
      const response = responseError as { response?: { data?: Record<string, string[] | string> } };
      const payload = response.response?.data;
      const first = payload && Object.values(payload)[0];
      setError(Array.isArray(first) ? first[0] : typeof first === 'string' ? first : 'The class could not be published. Review the form and retry.');
      setSubmitting(false);
    }
  };

  return (
    <div className="lc-create">
      <Link href="/live-classes" className="lc-back"><ArrowLeft /> Back to class board</Link>
      <div className="lc-create-head"><div><p className="lc-overline"><span /> Educator studio</p><h1>Put a live class on the calendar.</h1></div><p>Set the promise, time, and access rules. Ed3Hub handles registration, reminders, and classroom authorization.</p></div>
      <form onSubmit={submit} className="lc-form">
        <section>
          <div className="lc-form-section-head"><b>1</b><div><h2>Class profile</h2><p>What will learners see on the class board?</p></div></div>
          <div className="lc-fields">
            <label className="lc-field lc-field-wide"><span>Class title</span><input name="title" required maxLength={255} placeholder="e.g. Build your first onchain portfolio" /></label>
            <label className="lc-field lc-field-wide"><span>Description</span><textarea name="description" required rows={5} placeholder="Give learners a clear picture of the session." /></label>
            <label className="lc-field"><span>Category</span><select name="category" required defaultValue=""><option value="" disabled>Choose a topic</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="lc-field"><span>Level</span><select name="level" required defaultValue="beginner"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="all_levels">All levels</option></select></label>
            <label className="lc-field lc-field-wide lc-file"><span>Cover image</span><input type="file" name="cover_image" accept="image/*" required /><div><ImagePlus /><strong>Choose a class cover</strong><small>Landscape JPG, PNG or WebP</small></div></label>
          </div>
        </section>

        <section>
          <div className="lc-form-section-head"><b>2</b><div><h2>Time and room</h2><p>Capacity includes every learner with active or pending access.</p></div></div>
          <div className="lc-fields">
            <label className="lc-field"><span>Date</span><input type="date" name="scheduled_date" required /></label>
            <label className="lc-field"><span>Start time</span><input type="time" name="scheduled_time" required /></label>
            <label className="lc-field"><span>Duration</span><input type="number" name="duration_minutes" min="15" step="15" defaultValue="60" required /></label>
            <label className="lc-field"><span>Capacity</span><input type="number" name="capacity" min="1" max="100" defaultValue="25" required /></label>
            <label className="lc-field lc-field-wide"><span>Connect a course (optional)</span><select name="course" defaultValue=""><option value="">Standalone live class</option>{courses.map((course) => <option value={course.id} key={course.id}>{course.title}</option>)}</select></label>
          </div>
        </section>

        <section>
          <div className="lc-form-section-head"><b>3</b><div><h2>Learning promise</h2><p>Use one objective per line so learners can scan them.</p></div></div>
          <div className="lc-fields">
            <label className="lc-field lc-field-wide"><span>Learning objectives</span><textarea name="learning_objectives" required rows={5} placeholder={'Understand the core workflow\nComplete a guided practical\nKnow the next step to take'} /></label>
            <label className="lc-field lc-field-wide"><span>Requirements (optional)</span><textarea name="requirements" rows={3} placeholder="Software, prior knowledge, or materials learners should bring." /></label>
          </div>
        </section>

        <section>
          <div className="lc-form-section-head"><b>4</b><div><h2>Access</h2><p>Every learner registers; payment determines when paid access becomes active.</p></div></div>
          <div className="lc-access-choice">
            <button type="button" className={access === 'free' ? 'is-selected' : ''} onClick={() => setAccess('free')}><Radio /><strong>Free</strong><span>Access activates immediately on registration.</span></button>
            <button type="button" className={access === 'paid' ? 'is-selected' : ''} onClick={() => setAccess('paid')}><ShieldCheck /><strong>Paid</strong><span>Access activates after Paystack confirms payment.</span></button>
          </div>
          {access === 'paid' && <div className="lc-fields lc-price-fields"><label className="lc-field"><span>Price</span><input name="price" type="number" min="1" step="0.01" required /></label><label className="lc-field"><span>Currency</span><select name="currency" defaultValue="NGN"><option>NGN</option><option>USD</option><option>GHS</option><option>KES</option></select></label></div>}
          <label className="lc-check"><input name="recording_enabled" type="checkbox" /><span><strong>Record this class</strong><small>Authorized learners can watch it after processing.</small></span></label>
        </section>
        {error && <div className="lc-notice is-error">{error}</div>}
        <div className="lc-form-submit"><p>Publishing creates the schedule and reminder plan. Cloudflare creates the classroom when the first authorized person joins.</p><button className="lc-button lc-button-primary" disabled={submitting} data-state={submitting ? 'loading' : undefined}>{submitting ? 'Publishing…' : 'Publish live class'} <ArrowRight /></button></div>
      </form>
    </div>
  );
}

export default function CreateLiveClassPage() { return <AuthGuard><CreateLiveClassForm /></AuthGuard>; }
