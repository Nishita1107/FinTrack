import React from "react";

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = (key: number) => {
    if (currentParagraphLines.length > 0) {
      elements.push(
        <p key={`p-${key}`} className="text-sm text-muted-foreground leading-relaxed mb-3">
          {renderInline(currentParagraphLines.join(" "))}
        </p>,
      );
      currentParagraphLines = [];
    }
  };

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      elements.push(
        <ul
          key={`ul-${key}`}
          className="list-disc pl-5 mb-4 space-y-1.5 text-sm text-muted-foreground"
        >
          {currentList}
        </ul>,
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("### ")) {
      flushParagraph(index);
      flushList(index);
      elements.push(
        <h4 key={`h3-${index}`} className="text-sm font-semibold text-foreground mt-4 mb-2">
          {renderInline(trimmed.slice(4))}
        </h4>,
      );
    } else if (trimmed.startsWith("## ")) {
      flushParagraph(index);
      flushList(index);
      elements.push(
        <h3
          key={`h2-${index}`}
          className="text-base font-semibold text-foreground mt-5 mb-2 border-b border-border pb-1"
        >
          {renderInline(trimmed.slice(3))}
        </h3>,
      );
    } else if (trimmed.startsWith("# ")) {
      flushParagraph(index);
      flushList(index);
      elements.push(
        <h2 key={`h1-${index}`} className="text-lg font-bold text-foreground mt-6 mb-3">
          {renderInline(trimmed.slice(2))}
        </h2>,
      );
    }
    // List items
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph(index);
      const itemContent = trimmed.slice(2);
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {renderInline(itemContent)}
        </li>,
      );
    }
    // Empty lines
    else if (trimmed === "") {
      flushParagraph(index);
      flushList(index);
    }
    // Regular text
    else {
      flushList(index);
      currentParagraphLines.push(trimmed);
    }
  });

  // Final flushes
  flushParagraph(lines.length);
  flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-secondary/80 px-1.5 py-0.5 font-mono text-xs font-medium text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
