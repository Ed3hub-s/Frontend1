'use client';

import AuthGuard from '@/components/AuthGuard';
import { ClassroomAccess, liveClassesApi } from '@/lib/liveClasses';
import { ArrowLeft, LoaderCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    RealtimeKitClient?: { init: (options: { authToken: string; roomName?: string; defaults?: { audio: boolean; video: boolean } }) => Promise<unknown> };
  }
}

function Classroom({ slug }: { slug: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const attendanceRef = useRef<number | null>(null);
  const [state, setState] = useState<'authorizing' | 'loading-sdk' | 'ready' | 'error'>('authorizing');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let meeting: { leave?: () => Promise<void> } | undefined;

    const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (existing) { if (window.RealtimeKitClient) resolve(); else existing.addEventListener('load', () => resolve(), { once: true }); return; }
      const script = document.createElement('script');
      script.src = src; script.onload = () => resolve(); script.onerror = () => reject(new Error('SDK failed to load'));
      document.head.appendChild(script);
    });

    const start = async () => {
      try {
        const { data }: { data: ClassroomAccess } = await liveClassesApi.join(slug);
        attendanceRef.current = data.attendance_id;
        setState('loading-sdk');
        await loadScript('https://cdn.jsdelivr.net/npm/@cloudflare/realtimekit@1.5.1/dist/browser.js');
        if (!customElements.get('rtk-meeting')) {
          const moduleUrl = 'https://cdn.jsdelivr.net/npm/@cloudflare/realtimekit-ui@1.2.0/loader/index.es2017.js';
          const uiModule = await import(/* webpackIgnore: true */ moduleUrl) as { defineCustomElements: () => void };
          uiModule.defineCustomElements();
          await customElements.whenDefined('rtk-meeting');
        }
        if (cancelled || !window.RealtimeKitClient || !mountRef.current) return;
        meeting = await window.RealtimeKitClient.init({ authToken: data.auth_token, roomName: data.room_name, defaults: { audio: false, video: false } }) as { leave?: () => Promise<void> };
        const element = document.createElement('rtk-meeting') as HTMLElement & { meeting?: unknown; showSetupScreen?: boolean };
        element.meeting = meeting; element.showSetupScreen = true;
        element.setAttribute('mode', 'fill');
        element.setAttribute('show-setup-screen', 'true');
        mountRef.current.replaceChildren(element);
        setState('ready');
      } catch (requestError: unknown) {
        const response = requestError as { response?: { data?: { detail?: string } } };
        setError(response.response?.data?.detail || 'The classroom could not be opened. Check your access and the class start time.');
        setState('error');
      }
    };
    start();

    const closeAttendance = () => {
      if (attendanceRef.current) liveClassesApi.leave(slug, attendanceRef.current).catch(() => {});
    };
    window.addEventListener('beforeunload', closeAttendance);
    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', closeAttendance);
      closeAttendance();
      meeting?.leave?.().catch(() => {});
    };
  }, [slug]);

  return (
    <div className="lc-classroom">
      <div className="lc-classroom-bar"><Link href={`/live-classes/${slug}`}><ArrowLeft /> Class details</Link><span>Ed3Hub secure classroom</span></div>
      {state !== 'ready' && <div className={state === 'error' ? 'lc-classroom-state is-error' : 'lc-classroom-state'}>{state === 'error' ? <ShieldAlert /> : <LoaderCircle className="is-spinning" />}<h1>{state === 'error' ? 'Classroom unavailable' : state === 'authorizing' ? 'Checking your access' : 'Preparing Cloudflare classroom'}</h1><p>{error || 'Your camera and microphone stay off until you choose to enable them.'}</p>{state === 'error' && <Link href={`/live-classes/${slug}`} className="lc-button lc-button-quiet">Return to class</Link>}</div>}
      <div ref={mountRef} className="lc-classroom-mount" aria-live="polite" />
    </div>
  );
}

export default function ClassroomPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = use(params); return <AuthGuard><Classroom slug={slug} /></AuthGuard>; }
