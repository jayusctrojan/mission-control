"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Target,
  Activity,
  Bot,
  MessageSquare,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { supabase } from "@/lib/supabase";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  category: string;
  id: string;
  title: string;
  subtitle: string | null;
  occurred_at: string;
  rank: number;
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  mission: { label: "Missions", icon: Target },
  event: { label: "Events", icon: Activity },
  agent: { label: "Agents", icon: Bot },
  comment: { label: "Comments", icon: MessageSquare },
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .rpc("search_all", { query_text: debouncedQuery, result_limit: 5 })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Search error:", error);
          setResults([]);
        } else {
          setResults((data as SearchResult[]) ?? []);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      switch (result.category) {
        case "mission":
          router.push(`/missions?detail=${result.id}`);
          break;
        case "event":
          router.push("/");
          break;
        case "agent":
          router.push("/agents");
          break;
        case "comment":
          router.push(`/missions?detail=${result.id}`);
          break;
      }
    },
    [router]
  );

  // Group results by category
  const grouped = results.reduce(
    (acc, r) => {
      if (!acc[r.category]) acc[r.category] = [];
      acc[r.category].push(r);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search across missions, events, agents, and comments"
      showCloseButton={false}
      className="bg-zinc-900 border-zinc-800"
    >
      <CommandInput
        placeholder="Search missions, events, agents..."
        value={query}
        onValueChange={setQuery}
        className="text-zinc-100"
      />
      <CommandList className="border-t border-zinc-800">
        {loading && query.length >= 2 && (
          <div className="py-4 text-center text-sm text-zinc-500">
            Searching...
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <CommandEmpty className="text-zinc-500">
            No results found.
          </CommandEmpty>
        )}

        {Object.entries(grouped).map(([category, items]) => {
          const meta = CATEGORY_META[category];
          if (!meta) return null;
          const Icon = meta.icon;

          return (
            <CommandGroup key={category} heading={meta.label}>
              {items.map((item) => (
                <CommandItem
                  key={`${item.category}-${item.id}`}
                  value={`${item.category}-${item.id}-${item.title}`}
                  onSelect={() => handleSelect(item)}
                  className="gap-3 py-2.5 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-zinc-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-zinc-200 truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-[11px] text-zinc-500 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0">
                    {formatDistanceToNow(new Date(item.occurred_at), {
                      addSuffix: true,
                    })}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
