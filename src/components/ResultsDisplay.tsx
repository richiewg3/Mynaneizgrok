"use client";

import { useState } from "react";

interface ResultsDisplayProps {
  results: string;
  isLoading: boolean;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--text-secondary)] bg-[var(--bg-primary)]"
      title={label}
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-[var(--success)]">Copied!</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

function parseResults(text: string) {
  const sections: { title: string; content: string }[] = [];

  const promptSplitRegex = /---\s*Prompt\s*(\d+)\s*---/gi;
  const parts = text.split(promptSplitRegex);

  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i += 2) {
      const promptNum = parts[i];
      const content = parts[i + 1]?.trim() || "";
      sections.push({ title: `Prompt ${promptNum}`, content });
    }
  } else {
    sections.push({ title: "Generated Prompt", content: text.trim() });
  }

  return sections;
}

function extractMasterPrompt(content: string): string | null {
  const masterPromptRegex = /\*\*(?:The )?Master Prompt\*\*[:\s]*([\s\S]*?)(?=\n\*\*|$)/i;
  const match = content.match(masterPromptRegex);
  if (match) {
    return match[1].trim().replace(/^["\n]+|["\n]+$/g, "");
  }
  return null;
}

export default function ResultsDisplay({ results, isLoading }: ResultsDisplayProps) {
  if (isLoading) {
    return (
      <div className="mt-8 p-6 sm:p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-[var(--text-secondary)]">
            Architecting your Grok video prompts...
          </span>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const sections = parseResults(results);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
          Generated Results
        </h2>
        <CopyButton text={results} label="Copy All" />
      </div>

      {sections.map((section, index) => {
        const masterPrompt = extractMasterPrompt(section.content);

        return (
          <div
            key={index}
            className="p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4 party-glow"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--accent)]">
                {section.title}
              </h3>
              <div className="flex gap-2">
                {masterPrompt && (
                  <CopyButton text={masterPrompt} label="Copy Prompt" />
                )}
                <CopyButton text={section.content} label="Copy Section" />
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
                {section.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <strong key={i} className="text-[var(--accent)] font-semibold">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
