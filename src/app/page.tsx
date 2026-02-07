import { StatsBar } from "@/components/stats-bar";
import { ActivityFeed } from "@/components/activity-feed";

export default function Home() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Activity Feed</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Real-time events from all agents
        </p>
      </div>
      <StatsBar />
      <ActivityFeed />
    </div>
  );
}
