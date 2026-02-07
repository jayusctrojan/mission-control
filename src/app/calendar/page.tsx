import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Calendar</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Daily agenda: scheduled tasks, missions, and events
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
