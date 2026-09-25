// Keep the core and UI on their documented compatible v1 releases.
const coreUrl = 'https://cdn.jsdelivr.net/npm/@cloudflare/realtimekit@1.5.1/dist/browser.js';
const uiUrl = 'https://cdn.jsdelivr.net/npm/@cloudflare/realtimekit-ui@1.2.0/loader/index.es2017.js';

export interface ClassroomMeeting {
  leave: () => Promise<void>;
  self: {
    on: (event: 'roomLeft', callback: () => void) => void;
    removeListener: (event: 'roomLeft', callback: () => void) => void;
  };
}

interface ClassroomClient {
  init: (options: {
    authToken: string;
    defaults: { audio: boolean; video: boolean };
  }) => Promise<ClassroomMeeting>;
}

declare global {
  interface Window { RealtimeKitClient?: ClassroomClient }
}

let sdkPromise: Promise<ClassroomClient> | undefined;

function withTimeout<T>(operation: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), 30000);
    operation.then(resolve, reject).finally(() => window.clearTimeout(timer));
  });
}

export function loadClassroomSdk(): Promise<ClassroomClient> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = (async () => {
    if (!window.RealtimeKitClient) {
      const script = document.createElement('script');
      script.src = coreUrl;
      script.async = true;
      try {
        await withTimeout(new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Classroom controls could not load. Check your connection and retry.'));
          document.head.appendChild(script);
        }), 'Loading classroom controls timed out. Check your connection and retry.');
      } catch (error) {
        script.remove();
        throw error;
      }
    }
    if (!customElements.get('rtk-meeting')) {
      const ui = await withTimeout(
        import(/* webpackIgnore: true */ uiUrl) as Promise<{ defineCustomElements: () => void }>,
        'Loading the classroom layout timed out. Please retry.',
      );
      ui.defineCustomElements();
      await withTimeout(customElements.whenDefined('rtk-meeting'), 'The classroom layout did not initialize. Please retry.');
    }
    if (!window.RealtimeKitClient) throw new Error('Classroom controls did not initialize. Please retry.');
    return window.RealtimeKitClient;
  })().catch((error: unknown) => {
    sdkPromise = undefined;
    throw error;
  });
  return sdkPromise;
}
