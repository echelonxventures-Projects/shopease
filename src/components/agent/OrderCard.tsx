"use client";

export interface AgentOrder {
  assignmentId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  landmark?: string;
  items: { name: string; quantity: number }[];
  status: string;
  pickupConfirmed?: boolean;
  estimatedEta?: string;
  distanceKm?: number;
  estimatedEarnings?: number;
  deliveryLat?: number;
  deliveryLng?: number;
}

interface OrderCardProps {
  order: AgentOrder;
  onAccept: () => void;
  onDecline: () => void;
  onView: () => void;
}

export function OrderCard({ order, onAccept, onDecline, onView }: OrderCardProps) {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              #{order.orderNumber}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {order.status}
            </span>
          </div>
          <div className="mt-1 truncate text-sm font-semibold">{order.customerName}</div>
          <div className="mt-0.5 line-clamp-2 text-xs text-slate-500">
            {order.address}
          </div>
        </div>
        <button
          onClick={onView}
          aria-label="View order details"
          className="shrink-0 rounded-lg bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path
              fillRule="evenodd"
              d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
        {order.distanceKm != null && (
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            {order.distanceKm} km
          </span>
        )}
        {order.estimatedEarnings != null && (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            ₹{order.estimatedEarnings}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onDecline}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
