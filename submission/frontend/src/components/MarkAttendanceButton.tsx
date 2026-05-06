// src/components/MarkAttendanceButton.tsx
"use client";

import { useState } from "react";

export default function MarkAttendanceButton({ 
  sessionId, 
  isAlreadyMarked 
}: { 
  sessionId: string; 
  isAlreadyMarked: boolean; 
}) {
  const [marked, setMarked] = useState(isAlreadyMarked);
  const [loading, setLoading] = useState(false);

  const handleMark = async () => {
    if (marked || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) setMarked(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMark}
      disabled={marked || loading}
      className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
        marked 
          ? "bg-green-100 text-green-700 cursor-default" 
          : "cursor-pointer bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
      }`}
    >
      {loading ? "Processing..." : marked ? "Attendance Marked ✓" : "Mark Attendance"}
    </button>
  );
}
