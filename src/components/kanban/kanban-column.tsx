"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MissionCard } from "./mission-card";
import type { Database, MissionStatus } from "@/lib/database.types";

type MissionRow = Database["public"]["Tables"]["missions"]["Row"];

const COLUMN_LABELS: Record<MissionStatus, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const COLUMN_COLORS: Record<MissionStatus, string> = {
  backlog: "bg-zinc-500",
  in_progress: "bg-blue-500",
  review: "bg-amber-500",
  done: "bg-emerald-500",
};

export function KanbanColumn({
  status,
  missions,
  onAdd,
  onCardClick,
}: {
  status: MissionStatus;
  missions: MissionRow[];
  onAdd: () => void;
  onCardClick: (mission: MissionRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={`flex-1 min-w-[260px] max-w-[340px] flex flex-col rounded-lg border transition-colors ${
        isOver ? "border-zinc-600 bg-zinc-800/30" : "border-zinc-800/50 bg-zinc-900/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${COLUMN_COLORS[status]}`}
          />
          <span className="text-sm font-medium text-zinc-300">
            {COLUMN_LABELS[status]}
          </span>
          <span className="text-xs text-zinc-600">{missions.length}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onAdd}
          className="text-zinc-500 hover:text-zinc-300"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <div ref={setNodeRef} className="p-2 space-y-2 min-h-[100px]">
          <SortableContext
            items={missions.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onClick={() => onCardClick(mission)}
              />
            ))}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
