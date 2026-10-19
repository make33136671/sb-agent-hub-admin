import { createRealtimeCore, type RealtimeClient } from '@sb/realtime-core';

let coreInstance: RealtimeClient | null = null;

function getBackendBaseURL(): string {
  const apiURL = import.meta.env.VITE_GLOB_API_URL || '';
  return apiURL.replace(/\/admin\/?$/, '');
}

export function getCore(): RealtimeClient {
  if (!coreInstance) {
    coreInstance = createRealtimeCore({
      baseURL: getBackendBaseURL(),
      platformKey: '',
      logLevel: 3,
    });
  }
  return coreInstance;
}

export function updateRealtimeAddrs(wsUrl: string): void {
  getCore().updateRealtimeAddrs(wsUrl);
}

export function hasCore(): boolean {
  return coreInstance !== null;
}

export function destroyCore(): void {
  if (coreInstance) {
    coreInstance.destroy();
    coreInstance = null;
  }
}
