"use client";

import { useEffect, useState } from "react";
import { getPickerTasks, startPick, completePick } from "@/server/actions/picker-actions";

export default function PickerDashboard() {
  const [tasks, setTasks] = useState<{ id: string; orderNumber: string; items: { product: { name: string } | null; quantity: number }[] }[]>([]);
  const [activePick, setActivePick] = useState<string | null>(null);

  useEffect(() => {
    getPickerTasks("default-store").then((t) => setTasks(t as unknown as typeof tasks));
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Picker Dashboard</h1>
      {tasks.map((task) => (
        <div key={task.id} className="border rounded p-3 mb-3">
          <p className="font-medium">Order #{task.orderNumber}</p>
          <ul className="text-sm text-gray-600 mt-1">
            {task.items.map((item, i) => (
              <li key={i}>{item.product?.name} × {item.quantity}</li>
            ))}
          </ul>
          {activePick === task.id ? (
            <button onClick={async () => { await completePick(task.id, task.items.map((i) => ({ productId: "", quantity: i.quantity }))); setActivePick(null); setTasks((t) => t.filter((x) => x.id !== task.id)); }} className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm">
              Mark Packed
            </button>
          ) : (
            <button onClick={async () => { await startPick(task.id, "picker-1"); setActivePick(task.id); }} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm">
              Start Pick
            </button>
          )}
        </div>
      ))}
      {tasks.length === 0 && <p className="text-gray-500">No pending picks.</p>}
    </div>
  );
}
