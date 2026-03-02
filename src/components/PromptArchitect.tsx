"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import ResultsDisplay from "./ResultsDisplay";

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
    { value: 30, label: "30s", detail: "Extended (2-part)" },
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

      const requestBody = JSON.stringify({ prompts, promptCount, videoDuration });
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
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            30s mode generates an extended 2-part sequence for each prompt: Part 1 covers 0-15s and Part 2 continues from 15-30s.
          </p>
        )}
      </div>

      {/* Image Upload Slots */}
      <ImageUploader
        slots={slots}
        onUpdate={setSlots}
        onError={setError}
        maxSlots={promptCount}
      />

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
