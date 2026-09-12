"use client";

import { Undo2, Redo2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export function HeroToolbar({
  zoom,
  onZoomChange,
  onFit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2">
      <div className="flex items-center gap-1">
        <ToolbarButton label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 size={16} />
        </ToolbarButton>
      </div>

      <div className="flex items-center gap-1">
        <ToolbarButton label="Zoom out" onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}>
          <ZoomOut size={16} />
        </ToolbarButton>
        <span className="w-12 text-center font-mono text-xs text-ink">{Math.round(zoom * 100)}%</span>
        <ToolbarButton label="Zoom in" onClick={() => onZoomChange(Math.min(2, zoom + 0.1))}>
          <ZoomIn size={16} />
        </ToolbarButton>
        <ToolbarButton label="Fit to canvas" onClick={onFit}>
          <Maximize2 size={16} />
        </ToolbarButton>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink transition-colors hover:bg-surface disabled:opacity-30"
    >
      {children}
    </button>
  );
}
