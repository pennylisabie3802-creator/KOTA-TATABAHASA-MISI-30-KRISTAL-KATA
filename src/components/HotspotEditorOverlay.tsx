import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, Eye, EyeOff, Move, RotateCcw, Save, X } from 'lucide-react';
import { HotspotRect, HotspotScopeId } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface HotspotEditorOverlayProps {
  scopeId: HotspotScopeId;
  scopeTitle: string;
  hotspots: HotspotRect[];
  stageRef: React.RefObject<HTMLDivElement | null>;
  onSaveHotspots: (scope: HotspotScopeId, updated: HotspotRect[]) => void;
  onResetHotspots: (scope: HotspotScopeId) => void;
  onCloseEditor: () => void;
  onTestClickHotspot?: (hotspotId: string) => void;
}

type DragAction =
  | {
      mode: 'move';
      id: string;
      startX: number;
      startY: number;
      origLeft: number;
      origTop: number;
      width: number;
      height: number;
    }
  | {
      mode: 'resize';
      id: string;
      startX: number;
      startY: number;
      origLeft: number;
      origTop: number;
      origWidth: number;
      origHeight: number;
    }
  | {
      mode: 'draw';
      id: string;
      anchorX: number;
      anchorY: number;
    };

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export const HotspotEditorOverlay: React.FC<HotspotEditorOverlayProps> = ({
  scopeId,
  scopeTitle,
  hotspots,
  stageRef,
  onSaveHotspots,
  onResetHotspots,
  onCloseEditor,
  onTestClickHotspot,
}) => {
  const [workingRects, setWorkingRects] = useState<HotspotRect[]>(hotspots);
  const [selectedId, setSelectedId] = useState<string>(hotspots[0]?.id ?? '');
  const [drawNewBoxMode, setDrawNewBoxMode] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const dragRef = useRef<DragAction | null>(null);

  useEffect(() => {
    setWorkingRects(hotspots);
    if (!hotspots.some((h) => h.id === selectedId)) {
      setSelectedId(hotspots[0]?.id ?? '');
    }
  }, [hotspots, scopeId]);

  const selectedHotspot =
    workingRects.find((h) => h.id === selectedId) ?? workingRects[0] ?? null;

  const updateSelectedField = (
    field: 'left' | 'top' | 'width' | 'height',
    rawValue: number
  ) => {
    if (!selectedHotspot) return;
    setSavedNotice(null);
    setWorkingRects((prev) =>
      prev.map((r) => {
        if (r.id !== selectedHotspot.id) return r;
        const next = { ...r, [field]: round1(rawValue) };
        next.width = Math.max(2, Math.min(98, next.width));
        next.height = Math.max(2, Math.min(98, next.height));
        next.left = Math.max(0, Math.min(100 - next.width, next.left));
        next.top = Math.max(0, Math.min(100 - next.height, next.top));
        return next;
      })
    );
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const stage = stageRef.current;
      if (!drag || !stage) return;

      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dxPct = ((e.clientX - (drag.mode === 'draw' ? 0 : drag.startX)) / rect.width) * 100;
      const dyPct = ((e.clientY - (drag.mode === 'draw' ? 0 : drag.startY)) / rect.height) * 100;

      if (drag.mode === 'move') {
        const nextLeft = round1(
          Math.max(0, Math.min(100 - drag.width, drag.origLeft + dxPct))
        );
        const nextTop = round1(
          Math.max(0, Math.min(100 - drag.height, drag.origTop + dyPct))
        );
        setWorkingRects((prev) =>
          prev.map((item) =>
            item.id === drag.id ? { ...item, left: nextLeft, top: nextTop } : item
          )
        );
      } else if (drag.mode === 'resize') {
        const nextWidth = round1(
          Math.max(2.5, Math.min(100 - drag.origLeft, drag.origWidth + dxPct))
        );
        const nextHeight = round1(
          Math.max(2.5, Math.min(100 - drag.origTop, drag.origHeight + dyPct))
        );
        setWorkingRects((prev) =>
          prev.map((item) =>
            item.id === drag.id
              ? { ...item, width: nextWidth, height: nextHeight }
              : item
          )
        );
      } else if (drag.mode === 'draw') {
        const curXPct = Math.max(
          0,
          Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
        );
        const curYPct = Math.max(
          0,
          Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)
        );
        const left = round1(Math.min(drag.anchorX, curXPct));
        const top = round1(Math.min(drag.anchorY, curYPct));
        const width = round1(Math.max(2.5, Math.abs(curXPct - drag.anchorX)));
        const height = round1(Math.max(2.5, Math.abs(curYPct - drag.anchorY)));

        setWorkingRects((prev) =>
          prev.map((item) =>
            item.id === drag.id ? { ...item, left, top, width, height } : item
          )
        );
      }
    };

    const onPointerUp = () => {
      if (dragRef.current?.mode === 'draw') {
        setDrawNewBoxMode(false);
      }
      dragRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [stageRef]);

  return (
    <>
      {/* Interactive Stage Layer inside the 16:9 Container */}
      <div
        onPointerDown={(e) => {
          if (!drawNewBoxMode || !selectedHotspot || previewMode) return;
          const stage = stageRef.current;
          if (!stage) return;
          const rect = stage.getBoundingClientRect();
          const anchorX = Math.max(
            0,
            Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
          );
          const anchorY = Math.max(
            0,
            Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)
          );
          setSavedNotice(null);
          dragRef.current = {
            mode: 'draw',
            id: selectedHotspot.id,
            anchorX,
            anchorY,
          };
        }}
        className={`absolute inset-0 z-30 ${
          drawNewBoxMode && !previewMode ? 'cursor-crosshair bg-black/15' : ''
        }`}
      >
        {workingRects.map((spot) => {
          const isSelected = spot.id === selectedHotspot?.id;

          if (previewMode) {
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => onTestClickHotspot?.(spot.id)}
                style={{
                  left: `${spot.left}%`,
                  top: `${spot.top}%`,
                  width: `${spot.width}%`,
                  height: `${spot.height}%`,
                }}
                title={`${spot.label} (Pratonton)`}
                className="menu-hotspot menu-hotspot-gold rounded-xl absolute cursor-pointer focus:outline-none"
              >
                <span className="menu-hotspot-shimmer" />
              </button>
            );
          }

          return (
            <div
              key={spot.id}
              onPointerDown={(e) => {
                if (drawNewBoxMode) return;
                e.stopPropagation();
                setSelectedId(spot.id);
                setSavedNotice(null);
                dragRef.current = {
                  mode: 'move',
                  id: spot.id,
                  startX: e.clientX,
                  startY: e.clientY,
                  origLeft: spot.left,
                  origTop: spot.top,
                  width: spot.width,
                  height: spot.height,
                };
              }}
              style={{
                left: `${spot.left}%`,
                top: `${spot.top}%`,
                width: `${spot.width}%`,
                height: `${spot.height}%`,
              }}
              className={`absolute select-none cursor-move transition-colors ${
                isSelected
                  ? 'border-2 border-[#fde047] bg-[#facc15]/25 z-20 shadow-[0_0_12px_rgba(250,204,21,0.85)]'
                  : 'border-2 border-dashed border-[#38bdf8]/90 bg-[#0284c7]/18 z-10 hover:bg-[#38bdf8]/25'
              }`}
            >
              <span className="pointer-events-none absolute -top-5 left-0 px-1.5 py-0.5 bg-[#140b29]/95 border border-[#facc15] font-pixel font-bold text-[10px] text-[#fde047] whitespace-nowrap">
                {spot.label} ({spot.left}%, {spot.top}%)
              </span>

              {/* Bottom-Right Resize Handle */}
              {isSelected && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSavedNotice(null);
                    dragRef.current = {
                      mode: 'resize',
                      id: spot.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      origLeft: spot.left,
                      origTop: spot.top,
                      origWidth: spot.width,
                      origHeight: spot.height,
                    };
                  }}
                  title="Seret untuk ubah lebar & tinggi"
                  className="absolute -right-2 -bottom-2 w-4 h-4 bg-[#fde047] border-2 border-[#261505] cursor-nwse-resize"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Compact Developer Control Panel (Docked Top-Left so Right Menu Buttons Stay Uncovered) */}
      <div className="fixed top-14 left-3 z-50 w-76 sm:w-82 max-h-[80vh] overflow-y-auto pixel-scroll pixel-panel-purple p-3.5 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#5b3ea8]">
          <div>
            <div className="font-pixel font-bold text-sm text-[#fde047]">
              MOD EDIT HOTSPOT
            </div>
            <div className="text-[11px] text-[#cbd5e1] truncate">{scopeTitle}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onCloseEditor();
            }}
            className="w-7 h-7 pixel-btn-purple flex items-center justify-center cursor-pointer"
            aria-label="Tutup Mod Edit Hotspot"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Pilih Lokasi / Hotspot */}
        <div className="space-y-1">
          <label className="block font-pixel font-bold text-[#fde047]">
            1. PILIH HOTSPOT / LOKASI:
          </label>
          <select
            value={selectedHotspot?.id ?? ''}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setSavedNotice(null);
            }}
            className="w-full px-2.5 py-1.5 bg-[#120a26] border-2 border-[#f6c445] text-white font-semibold text-xs"
          >
            {workingRects.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Tetapkan Kawasan Klik & Pratonton */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              setPreviewMode(false);
              setDrawNewBoxMode((v) => !v);
            }}
            className={`py-1.5 px-2 font-pixel font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
              drawNewBoxMode ? 'pixel-btn-gold' : 'pixel-btn-blue'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 shrink-0" />
            <span>{drawNewBoxMode ? 'LUKIS AKTIF' : 'LUKIS KAWASAN'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              setDrawNewBoxMode(false);
              setPreviewMode((v) => !v);
            }}
            className={`py-1.5 px-2 font-pixel font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
              previewMode ? 'pixel-btn-emerald' : 'pixel-btn-purple'
            }`}
          >
            {previewMode ? (
              <EyeOff className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Eye className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{previewMode ? 'MOD EDIT' : 'PRATONTON'}</span>
          </button>
        </div>

        {/* 3, 4, 5. Kedudukan (Left/Top) + Lebar + Tinggi dalam Peratusan (%) */}
        {selectedHotspot && (
          <div className="p-2.5 bg-[#160d2e] border border-[#5b3ea8] space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#bae6fd]">
              <Move className="w-3.5 h-3.5" />
              <span>Koordinat Peratusan (%):</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-0.5">
                <span className="text-[10px] text-[#cbd5e1]">Kiri / X (%)</span>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={98}
                  value={selectedHotspot.left}
                  onChange={(e) => updateSelectedField('left', Number(e.target.value))}
                  className="w-full px-2 py-1 bg-[#0d071c] border border-[#a78bfa] text-[#fde047] font-mono-num text-xs"
                />
              </label>

              <label className="space-y-0.5">
                <span className="text-[10px] text-[#cbd5e1]">Atas / Y (%)</span>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={98}
                  value={selectedHotspot.top}
                  onChange={(e) => updateSelectedField('top', Number(e.target.value))}
                  className="w-full px-2 py-1 bg-[#0d071c] border border-[#a78bfa] text-[#fde047] font-mono-num text-xs"
                />
              </label>

              <label className="space-y-0.5">
                <span className="text-[10px] text-[#cbd5e1]">Lebar (%)</span>
                <input
                  type="number"
                  step="0.1"
                  min={2}
                  max={98}
                  value={selectedHotspot.width}
                  onChange={(e) => updateSelectedField('width', Number(e.target.value))}
                  className="w-full px-2 py-1 bg-[#0d071c] border border-[#a78bfa] text-[#7dd3fc] font-mono-num text-xs"
                />
              </label>

              <label className="space-y-0.5">
                <span className="text-[10px] text-[#cbd5e1]">Tinggi (%)</span>
                <input
                  type="number"
                  step="0.1"
                  min={2}
                  max={98}
                  value={selectedHotspot.height}
                  onChange={(e) => updateSelectedField('height', Number(e.target.value))}
                  className="w-full px-2 py-1 bg-[#0d071c] border border-[#a78bfa] text-[#7dd3fc] font-mono-num text-xs"
                />
              </label>
            </div>
          </div>
        )}

        {savedNotice && (
          <div className="p-2 bg-[#064e3b] border border-[#34d399] text-[#ecfdf5] font-bold text-[11px]">
            ✓ {savedNotice}
          </div>
        )}

        {/* 7. Simpan Koordinat & Tetap Semula */}
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playCrystalGain();
              onSaveHotspots(scopeId, workingRects);
              setSavedNotice('Koordinat peratusan berjaya disimpan!');
            }}
            className="w-full py-2 px-3 pixel-btn-gold font-pixel font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SIMPAN KOORDINAT (%)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onResetHotspots(scopeId);
              setSavedNotice('Dikembalikan ke koordinat asal.');
            }}
            className="w-full py-1.5 px-3 pixel-btn-wood font-pixel font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>TETAP SEMULA KOORDINAT ASAL</span>
          </button>
        </div>
      </div>
    </>
  );
};
