'use client';

import { useCallback, useRef } from 'react';

const SYNC_DEBOUNCE = 2000; // 2 seconds after last change

export function useCloudSync() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getAllLocalData = useCallback((): Record<string, any> => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('gastos_nathan_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    return data;
  }, []);

  const setAllLocalData = useCallback((data: Record<string, any>) => {
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
  }, []);

  const loadFromCloud = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) return false;
      const { data } = await res.json();
      if (data) {
        setAllLocalData(data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [setAllLocalData]);

  const saveToCloud = useCallback(async () => {
    try {
      const data = getAllLocalData();
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Silently fail - localStorage still has the data
    }
  }, [getAllLocalData]);

  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      saveToCloud();
    }, SYNC_DEBOUNCE);
  }, [saveToCloud]);

  return { loadFromCloud, saveToCloud, debouncedSave };
}
