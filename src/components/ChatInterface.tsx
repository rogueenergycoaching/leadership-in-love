"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  role: string;
  content: string;
}

interface ChatInterfaceProps {
  sessionId: string;
  partnerName: string;
  otherPartnerName: string;
  round: string;
  initialMessages: Message[];
  initialQuestionCount: number;
  isCompleted: boolean;
}

export function ChatInterface({
  sessionId,
  partnerName,
  otherPartnerName,
  round,
  initialMessages,
  initialQuestionCount,
  isCompleted,
}: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(initialQuestionCount);
  const [sessionComplete, setSessionComplete] = useState(isCompleted);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const roundLabel = round === "ROUND_1" ? "Round 1" : "Round 2";
  const maxQuestions = round === "ROUND_1" ? 12 : 9;
  const minQuestions = round === "ROUND_1" ? 8 : 6;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load initial AI message if session just started
  useEffect(() => {
    if (messages.length === 0 && !sessionComplete) {
      sendInitialMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendInitialMessage() {
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: null, // null indicates initial message request
        }),
      });

      const data = await response.json();

      if (data.response) {
        const newMessages = [{ role: "assistant", content: data.response }];
        setMessages(newMessages);
        setQuestionCount(data.questionCount || 1);
        await saveSession(newMessages, data.questionCount || 1);
      }
    } catch (error) {
      console.error("Failed to get initial message:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSession(
    msgs: Message[],
    qCount: number,
    complete: boolean = false
  ) {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          questionCount: qCount,
          status: complete ? "COMPLETED" : "IN_PROGRESS",
          ...(complete && { completedAt: new Date().toISOString() }),
        }),
      });
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || sessionComplete) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (data.response) {
        const updatedMessages = [
          ...newMessages,
          { role: "assistant", content: data.response },
        ];
        setMessages(updatedMessages);
        setQuestionCount(data.questionCount);

        if (data.sessionComplete) {
          setSessionComplete(true);
          await saveSession(updatedMessages, data.questionCount, true);
        } else {
          await saveSession(updatedMessages, data.questionCount);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Revert the user message on error
      setMessages(messages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleSaveAndExit() {
    await saveSession(messages, questionCount);
    router.push("/dashboard");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              Leadership in Love
            </Link>
            <p className="text-sm text-muted">
              {roundLabel} - {partnerName}&apos;s Session
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">
              Question {Math.min(questionCount, maxQuestions)} of ~
              {minQuestions}-{maxQuestions}
            </span>
            {!sessionComplete && (
              <button
                onClick={handleSaveAndExit}
                className="btn-secondary text-sm py-2"
              >
                Save &amp; Exit
              </button>
            )}
            {sessionComplete && (
              <Link href="/dashboard" className="btn-primary text-sm py-2">
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-white"
                    : "bg-card border border-border"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-muted rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          {sessionComplete && (
            <div className="text-center py-8">
              <div className="inline-block bg-green-50 border border-green-200 rounded-xl px-6 py-4">
                <p className="text-green-800 font-medium">
                  Session Complete
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Thank you for sharing, {partnerName}. Your responses have been
                  saved.
                </p>
                <p className="text-green-700 text-sm mt-2">
                  Encourage {otherPartnerName} to complete their session so you
                  can receive your{" "}
                  {round === "ROUND_1" ? "Discovery Document" : "Final Synthesis"}
                  .
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      {!sessionComplete && (
        <footer className="bg-card border-t border-border p-4 sticky bottom-0">
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto flex gap-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              rows={1}
              className="flex-1 input-field resize-none min-h-[48px] max-h-[200px]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
          <p className="text-center text-xs text-muted mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </footer>
      )}
    </div>
  );
}
