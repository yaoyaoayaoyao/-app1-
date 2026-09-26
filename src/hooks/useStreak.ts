import { useMemo } from 'react';
import { useCheckInStore } from '@/stores/checkin.store';
import type { CheckInStreak } from '@/types';

export function useStreak(habitId: string | null) {
  const checkIns = useCheckInStore((s) => s.checkIns);
  const getCheckInStreak = useCheckInStore((s) => s.getCheckInStreak);

  const streak = useMemo<CheckInStreak | null>(() => {
    if (!habitId) return null;
    return getCheckInStreak(habitId);
  }, [habitId, checkIns, getCheckInStreak]);

  return { streak, loading: false };
}
