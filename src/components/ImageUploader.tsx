"use client";

import { useRef, useState } from "react";

interface ImageSlot {
  file: File | null;
  preview: string | null;
  base64: string | null;
  description: string;
}

interface ImageUploaderProps {
  slots: ImageSlot[];
  onUpdate: (slots: ImageSlot[]) => void;
  maxSlots: number;
}

export default function ImageUploader({ slots, onUpdate, maxSlots }: ImageUploaderProps) {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleFile = async (index: number, file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const updated = [...slots];
      updated[index] = {
        file,
        preview: URL.createObjectURL(file),
        base64,
        description: updated[index].description,
      };
      onUpdate(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(index, file);
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(index, file);
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...slots];
    if (updated[index].preview) {
      URL.revokeObjectURL(updated[index].preview!);
    }
    updated[index] = { file: null, preview: null, base64: null, description: updated[index].description };
    onUpdate(updated);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], description: value };
    onUpdate(updated);
  };

  const activeSlots = slots.slice(0, maxSlots);

  return (
    <div className="space-y-4">
      {activeSlots.map((slot, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] transition-all duration-200 hover:border-[var(--border-hover)]"
        >
          <div className="flex-shrink-0">
            {slot.preview ? (
              <div className="relative group">
                <img
                  src={slot.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full sm:w-36 h-36 object-cover rounded-xl border border-[var(--border)]"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-500/80"
                  title="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRefs.current[index]?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(index); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(index, e)}
                className={`w-full sm:w-36 h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  dragOver === index
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] mb-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-xs text-[var(--text-muted)]">Image {index + 1}</span>
              </div>
            )}
            <input
              ref={(el) => { fileInputRefs.current[index] = el; }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileInput(index, e)}
            />
          </div>

          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Prompt {index + 1} — Describe your video idea
            </label>
            <textarea
              value={slot.description}
              onChange={(e) => handleDescriptionChange(index, e.target.value)}
              placeholder="e.g., A cinematic slow zoom into the subject's face, golden hour lighting, wind gently moving their hair..."
              className="w-full h-24 sm:h-28 px-3 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all duration-200 resize-none text-sm scrollbar-thin"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
