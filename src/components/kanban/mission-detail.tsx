"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Send } from "lucide-react";
import { BRAIN_AGENTS, getAgent } from "@/lib/agents";
import { AgentAvatar } from "@/components/agent-avatar";
import { useAgentStatuses } from "@/hooks/use-agent-statuses";
import {
  updateMission,
  deleteMission,
  addComment,
  getComments,
} from "@/app/missions/actions";
import type {
  Database,
  MissionPriority,
} from "@/lib/database.types";

type MissionRow = Database["public"]["Tables"]["missions"]["Row"];
type CommentRow = Database["public"]["Tables"]["mission_comments"]["Row"];

export function MissionDetail({
  mission,
  open,
  onOpenChange,
}: {
  mission: MissionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MissionPriority>("medium");
  const [agentId, setAgentId] = useState<string>("none");
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const agentData = useAgentStatuses();

  useEffect(() => {
    if (mission) {
      setTitle(mission.title);
      setDescription(mission.description ?? "");
      setPriority(mission.priority as MissionPriority);
      setAgentId(mission.assigned_agent_id ?? "none");
      getComments(mission.id).then(setComments).catch(() => {});
    }
  }, [mission]);

  if (!mission) return null;

  const assignedAgent = mission.assigned_agent_id ? getAgent(mission.assigned_agent_id) : null;
  const assignedData = mission.assigned_agent_id ? agentData[mission.assigned_agent_id] : null;

  async function handleSave() {
    if (!mission) return;
    setSaving(true);
    try {
      await updateMission(mission.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigned_agent_id: agentId === "none" ? null : agentId,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!mission) return;
    await deleteMission(mission.id);
    onOpenChange(false);
  }

  async function handleAddComment() {
    if (!mission || !newComment.trim()) return;
    await addComment(mission.id, newComment.trim());
    setNewComment("");
    const updated = await getComments(mission.id);
    setComments(updated);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 sr-only">
            Edit Mission
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assigned agent header */}
          {assignedAgent && (
            <div className="flex items-center gap-2">
              <AgentAvatar
                agent={assignedAgent}
                status={assignedData?.status ?? "offline"}
                avatarUrl={assignedData?.avatarUrl ?? null}
                size="md"
              />
              <span className="text-sm text-zinc-300">{assignedAgent.name}</span>
            </div>
          )}

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 text-base font-medium"
          />

          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as MissionPriority)}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="none">Unassigned</SelectItem>
                {BRAIN_AGENTS.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
              {mission.source}
            </Badge>
            <span>
              Created{" "}
              {formatDistanceToNow(new Date(mission.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Comments */}
          <div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Comments
            </span>
            <ScrollArea className="max-h-[200px] mt-2">
              <div className="space-y-2">
                {comments.length === 0 && (
                  <p className="text-xs text-zinc-600">No comments yet</p>
                )}
                {comments.map((c) => {
                  const agent = c.agent_id ? getAgent(c.agent_id) : null;
                  const data = c.agent_id ? agentData[c.agent_id] : null;
                  return (
                    <div
                      key={c.id}
                      className="rounded-md bg-zinc-800/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {agent && (
                          <AgentAvatar
                            agent={agent}
                            status={data?.status ?? "offline"}
                            avatarUrl={data?.avatarUrl ?? null}
                            size="sm"
                          />
                        )}
                        <span
                          className="text-[11px] font-medium"
                          style={{ color: agent?.color ?? "#71717a" }}
                        >
                          {agent?.name ?? "System"}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {formatDistanceToNow(new Date(c.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-[13px] text-zinc-300">{c.body}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="text-zinc-400 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
