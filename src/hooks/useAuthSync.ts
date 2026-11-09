'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface UseAuthSyncResult {
  syncStatus: SyncStatus;
  syncError: string | null;
  retrySync: () => void;
  isProfileCompleted: boolean | null;
}

/**
 * Calls /api/auth/sync safely when an authenticated Clerk user enters the application.
 *
 * Requirements & Guarantees:
 * 1. User-Specific Synchronization: Keyed to the specific Clerk `userId` (`auth_synced_${userId}`).
 * 2. Multi-User Tab Safety: If User A signs out and User B signs in within the same browser tab,
 *    User B's distinct `userId` is detected and synchronized immediately.
 * 3. Render Isolation: Will NOT fire on component re-renders. Uses `lastSyncedUserId` ref to guard against duplicate calls.
 * 4. Resilient Retries: Exposes `retrySync()` to clear the user-specific flag and re-attempt sync.
 * 5. Non-Blocking: Does not alter database schema or interfere with Google OAuth integrations.
 */
export function useAuthSync(): UseAuthSyncResult {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isProfileCompleted, setIsProfileCompleted] = useState<boolean | null>(null);

  // Ref tracks the specific Clerk userId that was last successfully dispatched or synced in this component lifecycle
  const lastSyncedUserId = useRef<string | null>(null);

  const getStorageKey = (uid: string) => `auth_synced_${uid}`;
  const getProfileStorageKey = (uid: string) => `profile_completed_${uid}`;

  const runSync = useCallback(async (targetUserId: string) => {
    // Check if this specific user has already been synced in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem(getStorageKey(targetUserId)) === '1') {
      lastSyncedUserId.current = targetUserId;
      setSyncStatus('synced');
      setSyncError(null);
      const cachedProfile = sessionStorage.getItem(getProfileStorageKey(targetUserId));
      if (cachedProfile !== null) {
        setIsProfileCompleted(cachedProfile === '1');
      }
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const res = await fetch('/api/auth/sync', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const completed = Boolean(data?.isProfileCompleted);
        lastSyncedUserId.current = targetUserId;
        setSyncStatus('synced');
        setSyncError(null);
        setIsProfileCompleted(completed);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(getStorageKey(targetUserId), '1');
          sessionStorage.setItem(getProfileStorageKey(targetUserId), completed ? '1' : '0');
        }
      } else {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error || `Sync failed (HTTP ${res.status})`;
        lastSyncedUserId.current = null; // Allow retry on failure
        setSyncError(msg);
        setSyncStatus('error');
        console.error('[useAuthSync] Sync error:', msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error during sync';
      lastSyncedUserId.current = null;
      setSyncError(msg);
      setSyncStatus('error');
      console.error('[useAuthSync] Sync fetch error:', err);
    }
  }, []);

  useEffect(() => {
    // If not loaded or signed out, reset state
    if (!isLoaded || !isSignedIn || !userId) {
      lastSyncedUserId.current = null;
      setSyncStatus('idle');
      setSyncError(null);
      return;
    }

    // If this specific user has already been initiated/synced in this lifecycle, do nothing (prevents re-render trigger)
    if (lastSyncedUserId.current === userId) {
      return;
    }

    // Mark as in-flight for this user ID to prevent concurrent or re-render calls
    lastSyncedUserId.current = userId;
    runSync(userId);
  }, [isLoaded, isSignedIn, userId, runSync]);

  const retrySync = useCallback(() => {
    if (!userId) return;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(getStorageKey(userId));
    }
    lastSyncedUserId.current = null;
    runSync(userId);
  }, [userId, runSync]);

  return { syncStatus, syncError, retrySync, isProfileCompleted };
}
