"use client";

import { useState, useRef, useCallback } from "react";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function findLargestGapMidpoint(positions: number[]): number {
  const sorted = [0, ...positions.sort((a, b) => a - b), 100];
  let maxGap = 0;
  let midpoint = 50;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i];
    if (gap > maxGap) {
      maxGap = gap;
      midpoint = (sorted[i] + sorted[i + 1]) / 2;
    }
  }
  return midpoint;
}

interface SliceLine {
  id: string;
  position: number;
}

type SliceMode = "horizontal" | "vertical";
type View = "editor" | "preview";

export default function PanelSlicer() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [sliceMode, setSliceMode] = useState<SliceMode>("horizontal");
  const [lines, setLines] = useState<SliceLine[]>([]);
  const [view, setView] = useState<View>("editor");
  const [panels, setPanels] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const draggingLineId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        imageRef.current = img;
        setImageSrc(src);
        setLines([]);
        setPanels([]);
        setView("editor");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadImage(file);
      e.target.value = "";
    },
    [loadImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) loadImage(file);
    },
    [loadImage]
  );

  const switchSliceMode = useCallback(
    (mode: SliceMode) => {
      if (mode !== sliceMode) {
        setSliceMode(mode);
        setLines([]);
      }
    },
    [sliceMode]
  );

  const addLine = useCallback(() => {
    const positions = lines.map((l) => l.position);
    const pos = findLargestGapMidpoint(positions);
    setLines((prev) => [...prev, { id: uid(), position: pos }]);
  }, [lines]);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const onLinePointerDown = useCallback(
    (lineId: string, e: React.PointerEvent) => {
      e.preventDefault();
      draggingLineId.current = lineId;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const onLinePointerMove = useCallback(
    (lineId: string, e: React.PointerEvent) => {
      if (draggingLineId.current !== lineId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pos: number;
      if (sliceMode === "horizontal") {
        pos = ((e.clientY - rect.top) / rect.height) * 100;
      } else {
        pos = ((e.clientX - rect.left) / rect.width) * 100;
      }
      pos = Math.max(2, Math.min(98, pos));
      setLines((prev) =>
        prev.map((l) => (l.id === lineId ? { ...l, position: pos } : l))
      );
    },
    [sliceMode]
  );

  const onLinePointerUp = useCallback(() => {
    draggingLineId.current = null;
  }, []);

  const sliceImage = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    const sortedPositions = lines.map((l) => l.position).sort((a, b) => a - b);
    const breaks = [0, ...sortedPositions, 100];
    const results: string[] = [];

    for (let i = 0; i < breaks.length - 1; i++) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      let sx: number, sy: number, sw: number, sh: number;
      if (sliceMode === "horizontal") {
        sx = 0;
        sy = (breaks[i] / 100) * img.naturalHeight;
        sw = img.naturalWidth;
        sh = ((breaks[i + 1] - breaks[i]) / 100) * img.naturalHeight;
      } else {
        sx = (breaks[i] / 100) * img.naturalWidth;
        sy = 0;
        sw = ((breaks[i + 1] - breaks[i]) / 100) * img.naturalWidth;
        sh = img.naturalHeight;
      }

      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      ctx.drawImage(
        img,
        Math.round(sx),
        Math.round(sy),
        Math.round(sw),
        Math.round(sh),
        0,
        0,
        canvas.width,
        canvas.height
      );
      results.push(canvas.toDataURL("image/png"));
    }

    setPanels(results);
    setView("preview");
  }, [lines, sliceMode]);

  const triggerDownload = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const downloadPanel = useCallback(
    (index: number) => {
      const dataUrl = panels[index];
      if (!dataUrl) return;
      const ts = Date.now().toString(36);
      const rand = Math.random().toString(36).slice(2, 6);
      const filename = `panel_${index + 1}of${panels.length}_${ts}_${rand}.png`;
      triggerDownload(dataUrl, filename);
    },
    [panels, triggerDownload]
  );

  const downloadAllPanels = useCallback(() => {
    const batchTs = Date.now().toString(36);
    panels.forEach((dataUrl, i) => {
      setTimeout(() => {
        const rand = Math.random().toString(36).slice(2, 6);
        const filename = `panel_${i + 1}of${panels.length}_${batchTs}_${rand}.png`;
        triggerDownload(dataUrl, filename);
      }, i * 250);
    });
  }, [panels, triggerDownload]);

  const handleClear = useCallback(() => {
    setImageSrc(null);
    imageRef.current = null;
    setLines([]);
    setPanels([]);
    setView("editor");
  }, []);

  if (view === "preview" && panels.length > 0) {
    return (
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <button
            onClick={() => setView("editor")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Editor
          </button>
          <div className="flex gap-3">
            <button
              onClick={downloadAllPanels}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent)]/30 transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download All ({panels.length})
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Panel grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {panels.map((dataUrl, i) => (
            <div
              key={i}
              className="group p-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] transition-all duration-200"
            >
              <div
                className="relative cursor-pointer rounded-xl overflow-hidden"
                onClick={() => downloadPanel(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt={`Panel ${i + 1}`}
                  className="block w-full"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-3 shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-sm text-[var(--text-secondary)]">
                  Panel {i + 1} of {panels.length}
                </p>
                <button
                  onClick={() => downloadPanel(i)}
                  className="sm:hidden px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium cursor-pointer active:scale-[0.95] transition-transform"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!imageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center min-h-[260px] rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            isDragOver
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg-tertiary)]"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--text-muted)] mb-3"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="text-[var(--text-secondary)] font-medium">
            Upload an image to slice
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Click or drag and drop
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => switchSliceMode("horizontal")}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    sliceMode === "horizontal"
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Horizontal
                </button>
                <button
                  onClick={() => switchSliceMode("vertical")}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    sliceMode === "vertical"
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Vertical
                </button>
              </div>

              <button
                onClick={addLine}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Slice Line
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              {lines.length === 0
                ? "Add slice lines to divide the image into panels."
                : `${lines.length} line${lines.length !== 1 ? "s" : ""} placed — ${lines.length + 1} panel${lines.length + 1 !== 1 ? "s" : ""}. Drag lines to adjust position.`}
            </p>
          </div>

          {/* Image with lines */}
          <div className="flex justify-center p-3 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div ref={containerRef} className="relative inline-block select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Uploaded image"
                className="block max-w-full max-h-[60vh] rounded-xl"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />

              {lines.map((line) => {
                const isH = sliceMode === "horizontal";
                return (
                  <div
                    key={line.id}
                    className="absolute group"
                    style={
                      isH
                        ? {
                            top: `${line.position}%`,
                            left: 0,
                            right: 0,
                            height: "32px",
                            transform: "translateY(-50%)",
                            cursor: "row-resize",
                            touchAction: "none",
                            zIndex: 10,
                          }
                        : {
                            left: `${line.position}%`,
                            top: 0,
                            bottom: 0,
                            width: "32px",
                            transform: "translateX(-50%)",
                            cursor: "col-resize",
                            touchAction: "none",
                            zIndex: 10,
                          }
                    }
                    onPointerDown={(e) => onLinePointerDown(line.id, e)}
                    onPointerMove={(e) => onLinePointerMove(line.id, e)}
                    onPointerUp={onLinePointerUp}
                    onLostPointerCapture={onLinePointerUp}
                  >
                    {/* Visible line */}
                    <div
                      className={`absolute pointer-events-none ${
                        isH
                          ? "left-0 right-0 top-1/2 -translate-y-1/2 h-[2px]"
                          : "top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px]"
                      }`}
                      style={{
                        background: "var(--accent)",
                        boxShadow: "0 0 8px rgba(139, 92, 246, 0.6)",
                      }}
                    />

                    {/* Dashed overlay for visibility on any background */}
                    <div
                      className={`absolute pointer-events-none ${
                        isH
                          ? "left-0 right-0 top-1/2 -translate-y-1/2 h-0 border-t-[1px] border-dashed border-white/50"
                          : "top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-l-[1px] border-dashed border-white/50"
                      }`}
                    />

                    {/* Center handle */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg pointer-events-none flex items-center justify-center"
                      style={{ background: "var(--accent)" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        {isH ? (
                          <>
                            <line x1="4" y1="9" x2="20" y2="9" />
                            <line x1="4" y1="15" x2="20" y2="15" />
                          </>
                        ) : (
                          <>
                            <line x1="9" y1="4" x2="9" y2="20" />
                            <line x1="15" y1="4" x2="15" y2="20" />
                          </>
                        )}
                      </svg>
                    </div>

                    {/* Remove button */}
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => removeLine(line.id)}
                      className={`absolute w-5 h-5 rounded-full text-white text-xs flex items-center justify-center transition-opacity duration-200 cursor-pointer z-20 ${
                        isH
                          ? "right-1 top-1/2 -translate-y-1/2"
                          : "top-1 left-1/2 -translate-x-1/2"
                      } opacity-80 sm:opacity-0 sm:group-hover:opacity-100`}
                      style={{ background: "var(--error)" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={sliceImage}
              disabled={lines.length === 0}
              className={`flex-1 py-3.5 sm:py-4 px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                lines.length === 0
                  ? "bg-[var(--accent)]/30 text-white/50 cursor-not-allowed"
                  : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent)]/30 hover:shadow-[var(--accent)]/50"
              }`}
            >
              Preview {lines.length + 1} Panel{lines.length + 1 !== 1 ? "s" : ""}
            </button>
            <button
              onClick={handleClear}
              className="py-3.5 sm:py-4 px-6 rounded-xl font-semibold text-sm sm:text-base border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}
