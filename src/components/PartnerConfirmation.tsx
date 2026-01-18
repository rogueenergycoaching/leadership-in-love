"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PartnerConfirmationProps {
  sessionId: string;
  partnerName: string;
  round: string;
}

export function PartnerConfirmation({
  sessionId,
  partnerName,
  round,
}: PartnerConfirmationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const roundLabel = round === "ROUND_1" ? "What are you aiming for?" : "Your contribution to the team";
  const roundDescription =
    round === "ROUND_1"
      ? "In this session, you'll explore the goals and dreams you have for your life together — past, present, and future — and what they really mean to you."
      : "In this session, you'll explore how you can take leadership in supporting your shared goals and each other's individual priorities.";

  async function handleConfirm() {
    setLoading(true);

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          startedAt: new Date().toISOString(),
        }),
      });

      router.refresh();
    } catch (error) {
      console.error("Failed to start session:", error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="p-6 border-b border-border">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-primary">
            Leadership in Love
          </Link>
          <Link href="/dashboard" className="text-muted hover:text-foreground">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="card text-center">
            <h2 className="text-2xl font-bold mb-2">
              {roundLabel}
            </h2>
            <p className="text-muted mb-6">{roundDescription}</p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-lg mb-2">This session is for:</p>
              <p className="text-3xl font-bold text-primary">{partnerName}</p>
            </div>

            <p className="text-sm text-muted mb-6">
              Please confirm that {partnerName} is the one completing this
              session. Your responses will be private until combined with your
              partner&apos;s responses in the shared documents.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Starting..." : `Yes, I'm ${partnerName}`}
              </button>
              <Link href="/dashboard" className="btn-secondary">
                Go Back
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
