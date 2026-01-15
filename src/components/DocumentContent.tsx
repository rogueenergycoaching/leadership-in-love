"use client";

import React from "react";

interface DocumentContentProps {
  content: string;
}

export function DocumentContent({ content }: DocumentContentProps) {
  // Simple markdown to HTML conversion for the document
  const renderMarkdown = (text: string) => {
    // Split into lines
    const lines = text.split("\n");
    const elements: React.ReactElement[] = [];
    let currentList: string[] = [];
    let listType: "ul" | "ol" | null = null;

    const flushList = () => {
      if (currentList.length > 0 && listType) {
        const ListTag = listType;
        elements.push(
          <ListTag
            key={elements.length}
            className={listType === "ul" ? "list-disc pl-6 mb-4 space-y-1" : "list-decimal pl-6 mb-4 space-y-1"}
          >
            {currentList.map((item, i) => (
              <li key={i} className="text-foreground">
                {item}
              </li>
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Headers
      if (line.startsWith("# ")) {
        flushList();
        elements.push(
          <h1
            key={elements.length}
            className="text-3xl font-bold text-primary mb-2 mt-8 first:mt-0"
          >
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        flushList();
        elements.push(
          <h2
            key={elements.length}
            className="text-2xl font-bold text-foreground mb-2 mt-6"
          >
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        flushList();
        elements.push(
          <h3
            key={elements.length}
            className="text-xl font-semibold text-foreground mb-2 mt-4"
          >
            {line.slice(4)}
          </h3>
        );
      }
      // Horizontal rule
      else if (line.startsWith("---")) {
        flushList();
        elements.push(
          <hr key={elements.length} className="border-border my-6" />
        );
      }
      // Unordered list
      else if (line.startsWith("- ")) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        currentList.push(line.slice(2));
      }
      // Ordered list
      else if (/^\d+\.\s/.test(line)) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        currentList.push(line.replace(/^\d+\.\s/, ""));
      }
      // Bold text in paragraph
      else if (line.startsWith("**") && line.endsWith("**")) {
        flushList();
        elements.push(
          <p key={elements.length} className="font-semibold text-foreground mb-2">
            {line.slice(2, -2)}
          </p>
        );
      }
      // Italic/emphasis (usually document footer)
      else if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
        flushList();
        elements.push(
          <p key={elements.length} className="italic text-muted text-sm mb-4">
            {line.slice(1, -1)}
          </p>
        );
      }
      // Regular paragraph
      else if (line.trim()) {
        flushList();
        // Handle inline bold
        const formattedLine = line.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="font-semibold">$1</strong>'
        );
        elements.push(
          <p
            key={elements.length}
            className="text-foreground mb-3 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      }
      // Empty line
      else {
        flushList();
      }
    }

    flushList();
    return elements;
  };

  return (
    <div className="card prose prose-slate max-w-none">
      {renderMarkdown(content)}
    </div>
  );
}
