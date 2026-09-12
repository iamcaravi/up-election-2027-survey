"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { StateSelector } from "../selectors/StateSelector";
import { ConstituencySelector } from "../selectors/ConstituencySelector";
import { HeroCanvas } from "./HeroCanvas";
import { HeroLayersPanel, type LayerSelection } from "./HeroLayersPanel";
import { HeroPropertiesPanel } from "./HeroPropertiesPanel";
import { HeroToolbar } from "./HeroToolbar";
import {
  DEFAULT_HERO_ELEMENTS_CONFIG,
  type HeroElementBox,
  type HeroElementKey,
  type HeroElementsConfig,
} from "@/lib/survey-hero-elements-config";

type Tab = "global" | "override";
type ZOrderAction = "front" | "forward" | "backward" | "back";

function cloneConfig(config: HeroElementsConfig): HeroElementsConfig {
  return { ...config, background: { ...config.background }, elements: { ...config.elements } };
}

export function HeroEditor({ initialGlobal }: { initialGlobal: HeroElementsConfig }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("global");
  const [globalConfig, setGlobalConfig] = useState<HeroElementsConfig>(initialGlobal);
  const [overrideConfig, setOverrideConfig] = useState<HeroElementsConfig>(initialGlobal);

  const [stateId, setStateId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");
  const [hasOverride, setHasOverride] = useState(false);
  const [loadingOverride, setLoadingOverride] = useState(false);

  const [selection, setSelection] = useState<LayerSelection>(null);
  const [zoom, setZoom] = useState(0.62);
  const [past, setPast] = useState<HeroElementsConfig[]>([]);
  const [future, setFuture] = useState<HeroElementsConfig[]>([]);
  const pendingBaseline = useRef<HeroElementsConfig | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const activeConfig = tab === "global" ? globalConfig : overrideConfig;

  function setActive(updater: (prev: HeroElementsConfig) => HeroElementsConfig) {
    if (tab === "global") setGlobalConfig(updater);
    else setOverrideConfig(updater);
  }

  function getActive(): HeroElementsConfig {
    return tab === "global" ? globalConfig : overrideConfig;
  }

  function resetHistory() {
    setPast([]);
    setFuture([]);
    pendingBaseline.current = null;
  }

  // Loading a different constituency's override
  useEffect(() => {
    if (!constituencyId) {
      setOverrideConfig(globalConfig);
      setHasOverride(false);
      return;
    }
    let cancelled = false;
    setLoadingOverride(true);
    fetch(`/api/admin/survey-hero-elements/override/${constituencyId}`)
      .then((res) => res.json())
      .then((body: { override: HeroElementsConfig | null }) => {
        if (cancelled) return;
        if (body.override) {
          setOverrideConfig(body.override);
          setHasOverride(true);
        } else {
          setOverrideConfig(globalConfig);
          setHasOverride(false);
        }
        resetHistory();
        setSelection(null);
      })
      .catch(() => {
        if (!cancelled) {
          setOverrideConfig(globalConfig);
          setHasOverride(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOverride(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constituencyId]);

  function switchTab(next: Tab) {
    setTab(next);
    resetHistory();
    setSelection(null);
    setFeedback(null);
  }

  function updateBox(key: HeroElementKey, patch: Partial<HeroElementBox>, commit: boolean) {
    setActive((prev) => {
      if (pendingBaseline.current === null) pendingBaseline.current = prev;
      return { ...prev, elements: { ...prev.elements, [key]: { ...prev.elements[key], ...patch } } };
    });
    if (commit) {
      const baseline = pendingBaseline.current;
      pendingBaseline.current = null;
      if (baseline) {
        setPast((p) => [...p, baseline]);
        setFuture([]);
      }
    }
  }

  function updateBoxImmediate(key: HeroElementKey, patch: Partial<HeroElementBox>) {
    updateBox(key, patch, true);
  }

  function updateBackground(patch: Partial<HeroElementsConfig["background"]>) {
    const current = getActive();
    setPast((p) => [...p, cloneConfig(current)]);
    setFuture([]);
    setActive((prev) => ({ ...prev, background: { ...prev.background, ...patch } }));
  }

  function undo() {
    if (past.length === 0) return;
    const snapshot = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [getActive(), ...f]);
    setActive(() => snapshot);
  }

  function redo() {
    if (future.length === 0) return;
    const snapshot = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, getActive()]);
    setActive(() => snapshot);
  }

  function handleLayerAction(action: ZOrderAction) {
    if (!selection || selection === "background") return;
    const current = getActive();
    const allZ = Object.values(current.elements).map((e) => e.zIndex);
    const box = current.elements[selection];
    let nextZ = box.zIndex;
    if (action === "front") nextZ = Math.min(100, Math.max(...allZ) + 1);
    else if (action === "back") nextZ = Math.max(0, Math.min(...allZ) - 1);
    else if (action === "forward") nextZ = Math.min(100, box.zIndex + 1);
    else if (action === "backward") nextZ = Math.max(0, box.zIndex - 1);
    updateBoxImmediate(selection, { zIndex: nextZ });
  }

  function toggleVisible(key: HeroElementKey) {
    const current = getActive();
    updateBoxImmediate(key, { visible: !current.elements[key].visible });
  }

  function resetSelectedElement() {
    if (!selection || selection === "background") return;
    updateBoxImmediate(selection, DEFAULT_HERO_ELEMENTS_CONFIG.elements[selection]);
  }

  function resetEntireHero() {
    const current = getActive();
    setPast((p) => [...p, cloneConfig(current)]);
    setFuture([]);
    setActive(() => cloneConfig(DEFAULT_HERO_ELEMENTS_CONFIG));
  }

  async function saveGlobal() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/survey-hero-elements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(globalConfig),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `Save failed (${res.status})`);
      setFeedback({ kind: "success", message: "Global default hero saved." });
      router.refresh();
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  async function saveOverride() {
    if (!constituencyId) {
      setFeedback({ kind: "error", message: "Select a constituency first." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/survey-hero-elements/override/${constituencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideConfig),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `Save failed (${res.status})`);
      setHasOverride(true);
      setFeedback({ kind: "success", message: "Constituency override saved." });
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteOverride() {
    if (!constituencyId) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/survey-hero-elements/override/${constituencyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Reset failed.");
      setOverrideConfig(globalConfig);
      setHasOverride(false);
      resetHistory();
      setFeedback({ kind: "success", message: "Override removed — this constituency now uses the global default." });
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Reset failed." });
    } finally {
      setSaving(false);
    }
  }

  const selectedBox: HeroElementBox | null =
    selection && selection !== "background" ? activeConfig.elements[selection] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-xl border border-border bg-surface-2 p-1">
          <TabButton active={tab === "global"} onClick={() => switchTab("global")}>
            Global Default
          </TabButton>
          <TabButton active={tab === "override"} onClick={() => switchTab("override")}>
            Constituency Override
          </TabButton>
        </div>

        {tab === "override" && (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="w-48">
              <StateSelector value={stateId} onChange={(id) => { setStateId(id); setConstituencyId(""); }} label="" />
            </div>
            <div className="w-56">
              <ConstituencySelector stateId={stateId} value={constituencyId} onChange={setConstituencyId} label="" />
            </div>
            {loadingOverride && <span className="text-xs text-muted">Loading…</span>}
            {!loadingOverride && constituencyId && (
              <span className={cn("text-xs font-medium", hasOverride ? "text-accent" : "text-muted")}>
                {hasOverride ? "Has saved override" : "Using global default"}
              </span>
            )}
          </div>
        )}
      </div>

      {feedback && (
        <p className={cn("text-sm font-medium", feedback.kind === "success" ? "text-positive" : "text-danger")}>
          {feedback.message}
        </p>
      )}

      <HeroToolbar
        zoom={zoom}
        onZoomChange={setZoom}
        onFit={() => setZoom(0.62)}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={undo}
        onRedo={redo}
      />

      <fieldset disabled={tab === "override" && !constituencyId} className="grid gap-4 lg:grid-cols-[200px_1fr_320px] disabled:opacity-50">
        <HeroLayersPanel
          config={activeConfig}
          selected={selection}
          onSelect={setSelection}
          onToggleVisible={toggleVisible}
        />

        <HeroCanvas
          config={activeConfig}
          selectedKey={selection && selection !== "background" ? selection : null}
          onSelect={(key) => setSelection(key)}
          onChangeBox={updateBox}
          zoom={zoom}
        />

        <HeroPropertiesPanel
          selection={selection}
          box={selectedBox}
          background={activeConfig.background}
          onChangeBox={(patch) => {
            if (!selection || selection === "background") return;
            updateBoxImmediate(selection, patch);
          }}
          onChangeBackground={updateBackground}
          onResetElement={resetSelectedElement}
          onLayerAction={handleLayerAction}
        />
      </fieldset>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={resetEntireHero}
          disabled={tab === "override" && !constituencyId}
          className="rounded-full border border-border px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
        >
          Reset Entire Hero
        </button>

        {tab === "global" ? (
          <button
            type="button"
            onClick={saveGlobal}
            disabled={saving}
            className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={saveOverride}
              disabled={saving || !constituencyId}
              className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {hasOverride && (
              <button
                type="button"
                onClick={deleteOverride}
                disabled={saving}
                className="rounded-full border border-danger/40 px-4 py-2 text-sm font-bold text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
              >
                Reset Constituency Override
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-bold transition-colors",
        active ? "bg-ink text-white" : "text-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
