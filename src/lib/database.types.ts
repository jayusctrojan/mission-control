export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AgentStatus = "online" | "offline" | "error" | "idle";
export type EventSeverity = "info" | "warn" | "error" | "critical";
export type EventType =
  | "bot_start"
  | "bot_stop"
  | "heartbeat"
  | "reload"
  | "config_change"
  | "plugin_load"
  | "health_alert"
  | "gateway_restart"
  | "message"
  | "session_start"
  | "session_end"
  | "error"
  | "system"
  | "mission_created"
  | "mission_updated"
  | "agent_push";

export type MissionStatus = "backlog" | "in_progress" | "review" | "done";
export type MissionPriority = "low" | "medium" | "high" | "critical";

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          name: string;
          role: string;
          model: string;
          status: AgentStatus;
          color: string;
          is_hand: boolean;
          brain_id: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["agents"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
      };
      events: {
        Row: {
          id: string;
          agent_id: string | null;
          event_type: EventType;
          source: string;
          title: string;
          detail: string | null;
          severity: EventSeverity;
          occurred_at: string;
          created_at: string;
          fts: unknown;
        };
        Insert: Omit<Database["public"]["Tables"]["events"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };
      sessions: {
        Row: {
          id: string;
          agent_id: string;
          started_at: string;
          ended_at: string | null;
          message_count: number;
          total_cost: number | null;
          tools_used: string[];
          summary: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sessions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
      };
      ingestion_state: {
        Row: {
          id: string;
          file_path: string;
          last_offset: number;
          last_line: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ingestion_state"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["ingestion_state"]["Insert"]>;
      };
      missions: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: MissionStatus;
          priority: MissionPriority;
          assigned_agent_id: string | null;
          created_by: string | null;
          source: string;
          sort_order: number;
          due_at: string | null;
          completed_at: string | null;
          markdown_ref: string | null;
          created_at: string;
          updated_at: string;
          fts: unknown;
        };
        Insert: Omit<Database["public"]["Tables"]["missions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["missions"]["Insert"]>;
      };
      mission_comments: {
        Row: {
          id: string;
          mission_id: string;
          agent_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["mission_comments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["mission_comments"]["Insert"]>;
      };
    };
  };
}
