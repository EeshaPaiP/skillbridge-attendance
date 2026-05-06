"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface TrainerOption {
  id: number;
  name: string | null;
}

export default function CreateBatchForm({ trainers }: { trainers: TrainerOption[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full cursor-pointer rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
      >
        Create New Batch
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <form 
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          const formData = new FormData(event.currentTarget);
          const response = await fetch("/api/batches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formData.get("name"),
              trainerId: formData.get("trainerId"),
            }),
          });
          const res = await response.json();
          setLoading(false);
          if (response.ok) {
            setIsOpen(false);
            router.refresh();
          } else {
            alert(res?.error || "Failed to create batch.");
          }
        }}
        className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl space-y-4"
      >
        <h3 className="text-2xl font-bold tracking-tight">New Batch</h3>
        
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Batch Name</label>
          <input name="name" placeholder="e.g. Web Dev Morning" required className="w-full p-4 rounded-2xl border dark:bg-zinc-900" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Assign Trainer</label>
          <select name="trainerId" required className="w-full p-4 rounded-2xl border dark:bg-zinc-900 appearance-none">
            <option value="">Select a trainer</option>
            {trainers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="flex-1 cursor-pointer bg-blue-600 text-white p-4 rounded-2xl font-bold disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Creating..." : "Create Batch"}
          </button>
          <button type="button" onClick={() => setIsOpen(false)} className="flex-1 cursor-pointer bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl font-bold">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
