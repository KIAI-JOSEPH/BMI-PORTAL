import { ReactNode } from "react";

// Re-export core entities from shared types
export * from "../shared/types";
export * from "./types/index";
export type { ApiResponse } from "./types/index";

// UI-specific types (Frontend only)
export interface NavItem {
  id: string;
  label: string;
  icon: any;
}

export interface StatCardProps {
  title: string;
  value: string;
  subText: string;
  color: "purple" | "amber" | "emerald" | "blue";
  icon: ReactNode;
}
