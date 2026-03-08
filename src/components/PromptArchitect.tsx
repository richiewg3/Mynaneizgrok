"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import ResultsDisplay from "./ResultsDisplay";
import PromptIdeaWorkspace from "./PromptIdeaWorkspace";

interface ImageSlot {
  file: File | null;
  preview: string | null;
  base64: string | null;
  description: string;
}

const emptySlot = (): ImageSlot => ({
  file: null,
  preview: null,
  base64: null,
  description: "",
});

const MAX_REQUEST_BYTES = 3.5 * 1024 * 1024;

export default function PromptArchitect() {
  const [promptCount, setPromptCount] = useState(1);
  const [videoDuration, setVideoDuration] = useState<10 | 15 | 30>(10);
  const [thirtySecondMode, setThirtySecondMode] = useState<"sora" | "grok">("sora");
  const [model, setModel] = useState("google/gemini-3.1-pro-preview");
  const [slots, setSlots] = useState<ImageSlot[]>(
    Array.from({ length: 5 }, emptySlot)
  );
  const [results, setResults] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const durationOptions: Array<{
    value: 10 | 15 | 30;
    label: string;
    detail: string;
  }> = [
    { value: 10, label: "10s", detail: "Standard" },
    { value: 15, label: "15s", detail: "Longer pacing" },
    { value: 30, label: "30s", detail: "Extended (Sora/Grok)" },
  ];

  const modelOptions = [
    {
      value: "google/gemini-3.1-pro-preview",
      label: "Gemini 3.1 Pro Preview",
    },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "google/gemini-3-flash", label: "Gemini 3 Flash" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  ];

  const handleGenerate = async () => {
    const activeSlots = slots.slice(0, promptCount);
    const hasContent = activeSlots.some(
      (s) => s.description.trim() || s.base64
    );

    if (!hasContent) {
      setError("Please add at least one image or description.");
      return;
    }

    setError("");
    setIsLoading(true);
    setResults("");

    try {
      const prompts = activeSlots.map((slot, index) => ({
        imageIndex: index,
        description: slot.description,
        imageData: slot.base64,
      }));

      const requestBody = JSON.stringify({
        prompts,
        promptCount,
        videoDuration,
        thirtySecondMode,
        model,
      });
      const bodySize = new TextEncoder().encode(requestBody).length;

      if (bodySize > MAX_REQUEST_BYTES) {
        throw new Error("Your upload is still too large to send. Use fewer images or smaller files.");
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      const responseText = await response.text();
      let data: { error?: string; results?: string } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText) as { error?: string; results?: string };
        } catch {
          if (!response.ok) {
            throw new Error(responseText);
          }
          throw new Error("Received an invalid response from the server.");
        }
      }

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setResults(data.results ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    slots.forEach((slot) => {
      if (slot.preview) {
        URL.revokeObjectURL(slot.preview);
      }
    });
    setSlots(Array.from({ length: 5 }, emptySlot));
    setResults("");
    setError("");
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Prompt Count Selector */}
      <div className="p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
          How many prompts do you want to generate?
        </label>
        <div className="flex gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setPromptCount(n)}
              className={`flex-1 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 cursor-pointer ${
                promptCount === n
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Video Duration Selector */}
      <div className="p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          Choose your video duration
        </label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {durationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setVideoDuration(option.value)}
              className={`py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 cursor-pointer ${
                videoDuration === option.value
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="block">{option.label}</span>
              <span className="block text-[10px] sm:text-xs opacity-85 font-medium">
                {option.detail}
              </span>
            </button>
          ))}
        </div>
        {videoDuration === 30 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => setThirtySecondMode("sora")}
                className={`py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  thirtySecondMode === "sora"
                    ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
                }`}
              >
                Sora pacing (2 x 15s)
              </button>
              <button
                onClick={() => setThirtySecondMode("grok")}
                className={`py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  thirtySecondMode === "grok"
                    ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
                }`}
              >
                Grok pacing (3 x 10s)
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              {thirtySecondMode === "sora"
                ? "Sora 30s mode generates a 2-part sequence for each prompt: Part A (0-15s) and Part B (15-30s) with broader pacing per beat."
                : "Grok 30s mode generates a 3-part sequence for each prompt: Part A (0-10s), Part B (10-20s), and Part C (20-30s) for faster, more dynamic pacing."}
            </p>
          </div>
        )}
      </div>

      {/* Model Selector */}
      <div className="p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
        <label
          htmlFor="model-selector"
          className="block text-sm font-medium text-[var(--text-secondary)]"
        >
          Choose your AI model
        </label>
        <select
          id="model-selector"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-3 text-sm sm:text-base text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Image Upload Slots */}
      <ImageUploader
        slots={slots}
        onUpdate={setSlots}
        onError={setError}
        maxSlots={promptCount}
      />

      <PromptIdeaWorkspace />

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/10 text-[var(--error)] text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`flex-1 py-3.5 sm:py-4 px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 cursor-pointer ${
            isLoading
              ? "bg-[var(--accent)]/50 text-white/70 cursor-not-allowed"
              : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent)]/30 hover:shadow-[var(--accent)]/50 active:scale-[0.98]"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : (
            `Generate ${promptCount} Prompt${promptCount > 1 ? "s" : ""} (${videoDuration}s)`
          )}
        </button>

        <button
          onClick={handleClear}
          className="py-3.5 sm:py-4 px-6 rounded-xl font-semibold text-sm sm:text-base border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer active:scale-[0.98]"
        >
          Clear All
        </button>
      </div>

      {/* Results */}
      <ResultsDisplay results={results} isLoading={isLoading} />
    </div>
  );
}
