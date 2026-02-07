"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMissions } from "@/hooks/use-missions";
import { useAgentStatuses } from "@/hooks/use-agent-statuses";
import { updateMissionStatus, bulkUpdateSortOrders } from "@/app/missions/actions";
import { KanbanColumn } from "./kanban-column";
import { MissionCard } from "./mission-card";
import { MissionDetail } from "./mission-detail";
import { CreateMissionDialog } from "./create-mission-dialog";
import type { Database, MissionStatus } from "@/lib/database.types";

type MissionRow = Database["public"]["Tables"]["missions"]["Row"];

const STATUSES: MissionStatus[] = ["backlog", "in_progress", "review", "done"];

export function KanbanBoard() {
  const { missions, setMissions, loading } = useMissions();
  const agentData = useAgentStatuses();
  const searchParams = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailMission, setDetailMission] = useState<MissionRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<MissionStatus>("backlog");

  // Deep-link: auto-open mission detail from ?detail=<id> (only on initial load)
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  useEffect(() => {
    if (deepLinkHandled) return;
    const detailId = searchParams.get("detail");
    if (detailId && missions.length > 0) {
      const mission = missions.find((m) => m.id === detailId);
      if (mission) {
        setDetailMission(mission);
        setDetailOpen(true);
      }
      setDeepLinkHandled(true);
    }
  }, [searchParams, missions, deepLinkHandled]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const grouped = STATUSES.reduce(
    (acc, status) => {
      acc[status] = missions
        .filter((m) => m.status === status)
        .sort((a, b) => a.sort_order - b.sort_order);
      return acc;
    },
    {} as Record<MissionStatus, MissionRow[]>
  );

  const activeMission = activeId
    ? missions.find((m) => m.id === activeId)
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      setMissions((prev) => {
        const findCol = (id: string): MissionStatus | null => {
          const m = prev.find((m) => m.id === id);
          return m ? (m.status as MissionStatus) : null;
        };

        const activeCol = findCol(active.id as string);
        const overCol: MissionStatus | null = STATUSES.includes(over.id as MissionStatus)
          ? (over.id as MissionStatus)
          : findCol(over.id as string);

        if (!activeCol || !overCol || activeCol === overCol) return prev;

        return prev.map((m) =>
          m.id === active.id ? { ...m, status: overCol as MissionStatus } : m
        );
      });
    },
    [setMissions]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      // Use functional setMissions to read fresh state and compute sort order atomically
      let persistStatus: MissionStatus | null = null;
      let persistSortOrder = 0;
      let columnUpdates: Array<{ id: string; sort_order: number }> = [];

      setMissions((prev) => {
        const mission = prev.find((m) => m.id === active.id);
        if (!mission) return prev;

        const newStatus: MissionStatus = STATUSES.includes(over.id as MissionStatus)
          ? (over.id as MissionStatus)
          : (prev.find((m) => m.id === over.id)?.status as MissionStatus) ??
            (mission.status as MissionStatus);

        persistStatus = newStatus;

        // Handle reordering within column
        const columnMissions = prev
          .filter((m) => m.status === newStatus)
          .sort((a, b) => a.sort_order - b.sort_order);

        let nextState = prev;

        if (over.id !== active.id && !STATUSES.includes(over.id as MissionStatus)) {
          const oldIndex = columnMissions.findIndex((m) => m.id === active.id);
          const newIndex = columnMissions.findIndex((m) => m.id === over.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(columnMissions, oldIndex, newIndex);
            const other = prev.filter((m) => m.status !== newStatus);
            nextState = [
              ...other,
              ...reordered.map((m, i) => ({ ...m, sort_order: i })),
            ];
            // Capture all column sort orders for bulk persistence
            columnUpdates = reordered.map((m, i) => ({ id: m.id, sort_order: i }));
          }
        }

        // Compute sort_order for persistence (cross-column moves)
        if (columnUpdates.length === 0) {
          const targetColumn = nextState
            .filter((m) => m.status === newStatus && m.id !== active.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          if (STATUSES.includes(over.id as MissionStatus)) {
            persistSortOrder = targetColumn.length > 0
              ? targetColumn[targetColumn.length - 1].sort_order + 1
              : 0;
          } else {
            const overIndex = targetColumn.findIndex((m) => m.id === over.id);
            persistSortOrder = overIndex >= 0 ? overIndex : targetColumn.length;
          }
        }

        return nextState;
      });

      // Persist
      try {
        if (columnUpdates.length > 0) {
          // Within-column reorder: persist all sort orders in the column
          await bulkUpdateSortOrders(columnUpdates);
        } else if (persistStatus) {
          // Cross-column move: persist status + sort order for the dragged mission
          await updateMissionStatus(active.id as string, persistStatus, persistSortOrder);
        }
      } catch (err) {
        console.error("Failed to persist mission reorder:", err);
      }
    },
    [setMissions]
  );

  function handleAddToColumn(status: MissionStatus) {
    setCreateStatus(status);
    setCreateOpen(true);
  }

  function handleCardClick(mission: MissionRow) {
    setDetailMission(mission);
    setDetailOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading missions...
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-[calc(100vh-140px)]">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              missions={grouped[status]}
              agentData={agentData}
              onAdd={() => handleAddToColumn(status)}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeMission ? (
            <div className="rotate-2 opacity-90">
              <MissionCard mission={activeMission} agentData={agentData} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateMissionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStatus={createStatus}
      />

      <MissionDetail
        mission={detailMission}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
