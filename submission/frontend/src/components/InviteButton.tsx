"use client";

import { useState } from "react";

export default function InviteButton({ batchName, batchId }: { batchName: string, batchId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}/invite`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate invite link.");
      }

      const link = data.inviteUrl as string;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      alert(`Copied to clipboard: ${link}`);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to copy invite link.");
    }
  };

  return (
    <button 
      onClick={handleCopy}
      aria-label={`Generate invite link for ${batchName}`}
      className={`cursor-pointer text-xs font-bold transition ${copied ? 'text-green-500' : 'text-blue-600 hover:underline'}`}
    >
      {copied ? "Copied!" : "Generate Link"}
    </button>
  );
}
