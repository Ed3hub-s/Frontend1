'use client';

import AuthGuard from '@/components/AuthGuard';
import { liveClassesApi } from '@/lib/liveClasses';
import { ClassroomMeeting, loadClassroomSdk } from '@/lib/classroomSdk';
import { ArrowLeft, LoaderCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';

function Classroom({ slug }: { slug: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'authorizing' | 'loading-sdk' | 'ready' | 'error'>('authorizing');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let meeting: ClassroomMeeting | undefined;
    let element: HTMLElement | undefined;
    let attendanceId: number | undefined;
    let leaving = false;

    const closeAttendance = () => {
      if (attendanceId === undefined) return;
      const id = attendanceId;
      attendanceId = undefined;
      liveClassesApi.leave(slug, id).catch(() => {});
    };
    const leave = () => {
      closeAttendance();
      if (!meeting || leaving) return;
      leaving = true;
      meeting.self.removeListener('roomLeft', closeAttendance);
      meeting.leave().catch(() => {});
    };

    const start = async () => {
      try {
        setState('authorizing');
        setError('');
        if (!window.isSecureContext || !navigator.mediaDevices) {
          throw new Error('Open this class over HTTPS in a browser that supports camera and microphone access.');
        }
        const { data } = await liveClassesApi.join(slug);
        attendanceId = data.attendance_id;
        if (cancelled) { closeAttendance(); return; }
        setState('loading-sdk');
        const client = await loadClassroomSdk();
        if (cancelled) return;
        // The participant token selects the shared room. Do not override it with
        // a separately supplied room name. Users choose when to enable devices.
        meeting = await client.init({ authToken: data.auth_token, defaults: { audio: false, video: false } });
        if (cancelled || !mountRef.current) { leave(); return; }
        meeting.self.on('roomLeft', closeAttendance);
        element = document.createElement('rtk-meeting');
        // Use the complete UI: grid, shared-screen stage, participants sidebar,
        // chat and media controls. Server-side role permissions still apply.
        Object.assign(element, {
          meeting,
          showSetupScreen: true,
          loadConfigFromPreset: false,
          leaveOnUnmount: false,
        });
        element.setAttribute('mode', 'fill');
        element.setAttribute('show-setup-screen', 'true');
        mountRef.current.replaceChildren(element);
        setState('ready');
      } catch (requestError: unknown) {
        leave();
        if (cancelled) return;
        const response = requestError as { response?: { data?: { detail?: string } } };
        setError(response.response?.data?.detail || (requestError instanceof Error ? requestError.message : 'The classroom could not be opened. Please retry.'));
        setState('error');
      }
    };
    // React Strict Mode runs setup/cleanup once before the real setup. Defer
    // authorization so that abandoned setup does not issue a second token.
    const timer = window.setTimeout(start, 0);
    window.addEventListener('beforeunload', closeAttendance);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('beforeunload', closeAttendance);
      element?.remove();
      leave();
    };
  }, [slug, attempt]);

  return (
    <div className="lc-classroom">
      <div className="lc-classroom-bar"><Link href={`/live-classes/${slug}`}><ArrowLeft /> Class details</Link><span>Ed3Hub secure classroom</span></div>
      {state !== 'ready' && <div className={state === 'error' ? 'lc-classroom-state is-error' : 'lc-classroom-state'}>{state === 'error' ? <ShieldAlert /> : <LoaderCircle className="is-spinning" />}<h1>{state === 'error' ? 'Classroom unavailable' : state === 'authorizing' ? 'Checking your access' : 'Preparing Cloudflare classroom'}</h1><p>{error || 'Your camera and microphone stay off until you choose to enable them.'}</p>{state === 'error' && <Link href={`/live-classes/${slug}`} className="lc-button lc-button-quiet">Return to class</Link>}</div>}
      {state === 'error' && <button type="button" className="lc-button lc-button-primary lc-classroom-retry" onClick={() => setAttempt((value) => value + 1)}>Retry classroom</button>}
      <div ref={mountRef} className="lc-classroom-mount" aria-label="Live classroom with video, screen sharing and participant controls" />
    </div>
  );
}

export default function ClassroomPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = use(params); return <AuthGuard><Classroom slug={slug} /></AuthGuard>; }
