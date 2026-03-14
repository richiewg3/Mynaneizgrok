"use client";

import { useState } from "react";
import PromptArchitect from "./PromptArchitect";
import PanelSlicer from "./PanelSlicer";

type Tab = "prompt" | "slicer";

export default function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>("prompt");

  return (
    <>
      {/* Tab Navigation */}
      <nav className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === "prompt"
                ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Prompt Architect
          </button>
          <button
            onClick={() => setActiveTab("slicer")}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeTab === "slicer"
                ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Panel Slicer
          </button>
        </div>
      </nav>

      {activeTab === "prompt" ? (
        <>
          {/* Prompt Architect Hero */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
                Architect Perfect{" "}
                <span className="bg-gradient-to-r from-[var(--accent)] to-pink-500 bg-clip-text text-transparent">
                  Video Prompts
                </span>
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
                Upload your starter frames, describe your vision, and let AI craft
                optimized 10s, 15s, or extended 30s prompts with Sora (2x15s) or Grok (3x10s) pacing and cinematic precision.
              </p>
            </div>
          </section>

          <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
            <PromptArchitect />
          </section>
        </>
      ) : (
        <>
          {/* Panel Slicer Hero */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
                Panel{" "}
                <span className="bg-gradient-to-r from-[var(--accent)] to-pink-500 bg-clip-text text-transparent">
                  Slicer
                </span>
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
                Upload an image, place slice lines, and split it into downloadable
                panels. Perfect for creating sequential frames, comic panels, or
                storyboard segments.
              </p>
            </div>
          </section>

          <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
            <PanelSlicer />
          </section>
        </>
      )}
    </>
  );
}
