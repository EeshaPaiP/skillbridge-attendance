"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BatchOption {
  id: number;
  name: string;
}

export default function CreateSessionForm({ batches }: { batches: BatchOption[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get today's date in YYYY-MM-DD format for the 'min' attribute
  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full cursor-pointer rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
      >
        New Session
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
          const response = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: formData.get("title"),
              date: formData.get("date"),
              startTime: formData.get("startTime"),
              endTime: formData.get("endTime"),
              batchId: formData.get("batchId"),
            }),
          });
          const res = await response.json();
          setLoading(false);
          if (response.ok) {
            setIsOpen(false);
            router.refresh();
          } else {
            alert(res?.error || "Something went wrong");
          }
        }}
        className="bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl space-y-4"
      >
        <h3 className="text-2xl font-bold tracking-tight">New Session</h3>
        <p className="text-zinc-500 text-sm mb-4">Fill in the details to schedule a new class.</p>
        
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Session Title</label>
          <input 
            name="title" 
            placeholder="e.g. Intro to React" 
            required 
            className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:ring-2 ring-blue-500 outline-none transition" 
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Date</label>
          <input 
            name="date" 
            type="date" 
            required 
            min={today} // This prevents selecting past dates
            className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:ring-2 ring-blue-500 outline-none transition" 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Start</label>
            <input 
              name="startTime" 
              type="time" 
              required 
              className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">End</label>
            <input 
              name="endTime" 
              type="time" 
              required 
              className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900" 
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">Assigned Batch</label>
          <div className="relative">
            <select 
              name="batchId" 
              required 
              className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 appearance-none outline-none focus:ring-2 ring-blue-500"
            >
              <option value="">Select a batch</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 cursor-pointer bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
          >
            {loading ? "Saving..." : "Save Session"}
          </button>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)} 
            className="flex-1 cursor-pointer bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
