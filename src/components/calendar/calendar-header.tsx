"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  month,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-semibold text-zinc-100">
        {format(month, "MMMM yyyy")}
      </h3>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onPrev}
          className="text-zinc-400 hover:text-zinc-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToday}
          className="text-zinc-400 hover:text-zinc-200 text-xs"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNext}
          className="text-zinc-400 hover:text-zinc-200"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
