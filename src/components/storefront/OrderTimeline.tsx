"use client";

import {
  Package,
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  XCircle,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";

interface TimelineStep {
  status: string;
  label: string;
  description?: string;
  timestamp?: string;
  completed: boolean;
  isCurrent: boolean;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
  currentStatus: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  PENDING: { icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-50" },
  CONFIRMED: { icon: CheckCircle, color: "text-blue-600", bgColor: "bg-blue-50" },
  PROCESSING: { icon: Package, color: "text-indigo-600", bgColor: "bg-indigo-50" },
  SHIPPED: { icon: Truck, color: "text-purple-600", bgColor: "bg-purple-50" },
  OUT_FOR_DELIVERY: { icon: MapPin, color: "text-cyan-600", bgColor: "bg-cyan-50" },
  DELIVERED: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" },
  CANCELLED: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-50" },
  RETURNED: { icon: RotateCcw, color: "text-orange-600", bgColor: "bg-orange-50" },
};

const ORDER_STAGES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const STAGE_LABELS: Record<string, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Order Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  PENDING: "Your order has been received",
  CONFIRMED: "Your order has been confirmed and is being prepared",
  PROCESSING: "Your order is being packed",
  SHIPPED: "Your order has been shipped",
  OUT_FOR_DELIVERY: "Your order is on the way to you",
  DELIVERED: "Your order has been delivered",
};

export function OrderTimeline({ steps, currentStatus }: OrderTimelineProps) {
  // If steps are provided explicitly, use them. Otherwise generate from currentStatus.
  const timelineSteps =
    steps.length > 0
      ? steps
      : ORDER_STAGES.map((stage) => {
          const stageIndex = ORDER_STAGES.indexOf(stage);
          const currentIndex = ORDER_STAGES.indexOf(currentStatus);
          const isTerminal = currentStatus === "CANCELLED" || currentStatus === "RETURNED";

          if (isTerminal && stage === currentStatus) {
            return {
              status: stage,
              label: STAGE_LABELS[stage] || stage,
              completed: true,
              isCurrent: true,
              timestamp: undefined as string | undefined,
            };
          }

          return {
            status: stage,
            label: STAGE_LABELS[stage] || stage,
            description: STAGE_DESCRIPTIONS[stage],
            completed: !isTerminal && stageIndex <= currentIndex,
            isCurrent: !isTerminal && stageIndex === currentIndex,
            timestamp: undefined as string | undefined,
          };
        });

  return (
    <div className="space-y-0">
      {timelineSteps.map((step, index) => {
        const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.PENDING;
        const Icon = config.icon;
        const isLast = index === timelineSteps.length - 1;

        return (
          <div key={step.status} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  step.isCurrent
                    ? `${config.bgColor} ${config.color} ring-4 ring-offset-2 ring-current/20`
                    : step.completed
                      ? `${config.bgColor} ${config.color}`
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-12 ${
                    step.completed && timelineSteps[index + 1]?.completed
                      ? "bg-blue-300"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`font-medium ${
                  step.isCurrent
                    ? config.color
                    : step.completed
                      ? "text-gray-900"
                      : "text-gray-400"
                }`}
              >
                {step.label}
                {step.isCurrent && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    Current
                  </span>
                )}
              </p>
              {step.description && (
                <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
              )}
              {step.timestamp && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(step.timestamp).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
