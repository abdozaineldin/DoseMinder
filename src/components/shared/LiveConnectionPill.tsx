'use client';

import * as React from 'react';
import { ConnectionPill } from './ConnectionPill';

function subscribe(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

/** Reflects the browser's real connectivity. Pending-change count and "syncing"
 *  come from the offline outbox (Phase 3, Dexie) — pass them in when it exists. */
export function LiveConnectionPill() {
  const online = React.useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  return (
    <ConnectionPill
      state={online ? 'online' : 'offline'}
      pendingCount={0}
      // On phones, the online state shrinks to a dot so the header controls always fit.
      className={online ? 'max-sm:px-2 max-sm:[&>span:last-child]:sr-only max-sm:[&>svg]:hidden' : undefined}
    />
  );
}
