import { Suspense } from "react";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function MissionsPage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Missions</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          Drag and drop to update status
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64 text-zinc-500">
            Loading missions...
          </div>
        }
      >
        <KanbanBoard />
      </Suspense>
    </div>
  );
}
