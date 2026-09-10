import { CalendarDays } from 'lucide-react';
import { todayLabel } from '@/lib/format';

/** Small date chip shown in page headers, e.g. "Thursday, 11 Sep 2026". */
export default function TodayChip() {
  return (
    <span className="chip px-3.5 py-2 text-xs">
      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
      {todayLabel()}
    </span>
  );
}
