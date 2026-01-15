"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GenerateDocumentButtonProps {
  documentType: "DISCOVERY" | "FINAL_SYNTHESIS";
  label?: string;
}

export function GenerateDocumentButton({
  documentType,
  label = "Generate",
}: GenerateDocumentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: documentType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate document");
      }

      // Refresh the page to show the new document
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="btn-accent text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Generating..." : label}
      </button>
      {error && <span className="text-error text-sm">{error}</span>}
    </div>
  );
}
