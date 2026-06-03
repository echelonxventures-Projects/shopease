"use client";

import { ReactNode } from "react";

export interface WidgetConfig {
  id: string;
  title: string;
  size: "sm" | "md" | "lg" | "full";
  component: ReactNode;
}

interface DashboardWidgetsProps {
  widgets: WidgetConfig[];
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "col-span-1",
  md: "col-span-1 md:col-span-2",
  lg: "col-span-1 md:col-span-2 lg:col-span-3",
  full: "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4",
};

export function DashboardWidgets({ widgets }: DashboardWidgetsProps) {
  if (!widgets.length) {
    return (
      <div className="text-center py-12 text-gray-400">No widgets configured</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className={`${SIZE_CLASSES[widget.size] || SIZE_CLASSES.md} min-w-0`}
        >
          {widget.component}
        </div>
      ))}
    </div>
  );
}
