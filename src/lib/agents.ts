// Agent roster derived from openclaw.json
// Colors chosen for visual distinction on dark backgrounds

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  model: string;
  color: string;
  isHand: boolean;
  brainId: string | null;
  emoji: string;
}

export const AGENTS: AgentInfo[] = [
  { id: "main", name: "Ava", role: "System / General", model: "gemini-3-flash", color: "#8b5cf6", isHand: false, brainId: null, emoji: "A" },
  { id: "kevin", name: "Kevin Malone", role: "Finance", model: "opus-4-5", color: "#f59e0b", isHand: false, brainId: null, emoji: "K" },
  { id: "kevin-hand", name: "Kevin Hand", role: "Finance (Hand)", model: "kimi-k2", color: "#f59e0b", isHand: true, brainId: "kevin", emoji: "k" },
  { id: "axe", name: "Bobby Axelrod", role: "Wealth", model: "opus-4-5", color: "#ef4444", isHand: false, brainId: null, emoji: "B" },
  { id: "axe-hand", name: "Axe Hand", role: "Wealth (Hand)", model: "kimi-k2", color: "#ef4444", isHand: true, brainId: "axe", emoji: "b" },
  { id: "thomas", name: "Thomas Keller", role: "Culinary", model: "gemini-3-flash", color: "#10b981", isHand: false, brainId: null, emoji: "T" },
  { id: "dinesh", name: "Dinesh Chugtai", role: "Coding / CTO", model: "opus-4-5", color: "#3b82f6", isHand: false, brainId: null, emoji: "D" },
  { id: "dinesh-coder", name: "Dinesh Coder", role: "Coding (Hand)", model: "deepseek-r1", color: "#3b82f6", isHand: true, brainId: "dinesh", emoji: "d" },
  { id: "richard", name: "Richard Hendricks", role: "Design / CDO", model: "opus-4-5", color: "#06b6d4", isHand: false, brainId: null, emoji: "R" },
  { id: "richard-hand", name: "Richard Hand", role: "Design (Hand)", model: "kimi-k2", color: "#06b6d4", isHand: true, brainId: "richard", emoji: "r" },
  { id: "hormozi", name: "Alex Hormozi", role: "Marketing", model: "opus-4-5", color: "#ec4899", isHand: false, brainId: null, emoji: "H" },
  { id: "hormozi-hand", name: "Hormozi Hand", role: "Marketing (Hand)", model: "kimi-k2", color: "#ec4899", isHand: true, brainId: "hormozi", emoji: "h" },
  { id: "tim", name: "Tim Taylor", role: "Home Improvement", model: "gemini-3-flash", color: "#f97316", isHand: false, brainId: null, emoji: "Ti" },
  { id: "harvey", name: "Harvey Specter", role: "Legal", model: "opus-4-5", color: "#a855f7", isHand: false, brainId: null, emoji: "Hv" },
  { id: "cox", name: "Dr. Cox", role: "Health", model: "opus-4-5", color: "#14b8a6", isHand: false, brainId: null, emoji: "C" },
  { id: "jared", name: "Jared Dunn", role: "PM / Projects", model: "opus-4-5", color: "#6366f1", isHand: false, brainId: null, emoji: "J" },
];

export const BRAIN_AGENTS = AGENTS.filter((a) => !a.isHand);
export const HAND_AGENTS = AGENTS.filter((a) => a.isHand);

export function getAgent(id: string): AgentInfo | undefined {
  return AGENTS.find((a) => a.id === id);
}
