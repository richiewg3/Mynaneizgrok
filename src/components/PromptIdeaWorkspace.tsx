"use client";

import { useMemo, useState } from "react";

export default function PromptIdeaWorkspace() {
  const [draft, setDraft] = useState("");
  const [findValue, setFindValue] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [status, setStatus] = useState("");

  const occurrences = useMemo(() => {
    if (!findValue.trim()) {
      return 0;
    }

    const source = matchCase ? draft : draft.toLowerCase();
    const target = matchCase ? findValue : findValue.toLowerCase();

    if (!target) {
      return 0;
    }

    let count = 0;
    let index = 0;

    while ((index = source.indexOf(target, index)) !== -1) {
      count += 1;
      index += target.length;
    }

    return count;
  }, [draft, findValue, matchCase]);

  const handleReplaceNext = () => {
    if (!findValue) {
      setStatus("Add text in Find before replacing.");
      return;
    }

    const source = matchCase ? draft : draft.toLowerCase();
    const target = matchCase ? findValue : findValue.toLowerCase();
    const index = source.indexOf(target);

    if (index === -1) {
      setStatus("No match found.");
      return;
    }

    const updated =
      draft.slice(0, index) + replaceValue + draft.slice(index + findValue.length);

    setDraft(updated);
    setStatus("Replaced the first match.");
  };

  const handleReplaceAll = () => {
    if (!findValue) {
      setStatus("Add text in Find before replacing.");
      return;
    }

    if (occurrences === 0) {
      setStatus("No matches found.");
      return;
    }

    const escaped = findValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flags = matchCase ? "g" : "gi";
    const regex = new RegExp(escaped, flags);
    const updated = draft.replace(regex, replaceValue);

    setDraft(updated);
    setStatus(`Replaced ${occurrences} match${occurrences > 1 ? "es" : ""}.`);
  };

  return (
    <section className="p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
          Prompt Idea Cleanup
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Draft ideas here, then use find/replace and browser spell check before generating.
        </p>
      </div>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        spellCheck
        placeholder="Paste rough prompt ideas here..."
        className="w-full min-h-48 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
      />

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-[var(--text-secondary)]">Find</span>
          <input
            value={findValue}
            onChange={(event) => setFindValue(event.target.value)}
            className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-[var(--text-secondary)]">Replace with</span>
          <input
            value={replaceValue}
            onChange={(event) => setReplaceValue(event.target.value)}
            className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="inline-flex items-center gap-2 text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={matchCase}
            onChange={(event) => setMatchCase(event.target.checked)}
            className="accent-[var(--accent)]"
          />
          Match case
        </label>
        <span className="text-[var(--text-muted)]">{occurrences} matches</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleReplaceNext}
          className="py-2.5 px-4 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Replace Next
        </button>
        <button
          onClick={handleReplaceAll}
          className="py-2.5 px-4 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          Replace All
        </button>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Spell check uses your browser dictionary (misspelled words are underlined in the editor).
      </p>

      {status && (
        <p className="text-sm text-[var(--text-secondary)] border-t border-[var(--border)] pt-3">{status}</p>
      )}
    </section>
  );
}
