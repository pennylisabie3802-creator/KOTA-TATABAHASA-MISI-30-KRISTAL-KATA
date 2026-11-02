import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Maximize2,
  Minimize2,
  Move,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export const QUESTION_ZOOM_LEVELS = [1, 1.5, 2, 3, 4] as const;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const LOW_RES_MIN_WIDTH = 700;
const LOW_RES_MIN_HEIGHT = 480;

export interface QuestionImageZoomModalProps {
  isOpen: boolean;
  originalImageUrl: string | null;
  questionId: number;
  mission?: 1 | 2 | 3;
  title: string;
  slotId?: string;
  fileName?: string;
  knownNaturalWidth?: number;
  knownNaturalHeight?: number;
  onClose: () => void;
}

interface ActivePointer {
  x: number;
  y: number;
}

export const QuestionImageZoomModal: React.FC<QuestionImageZoomModalProps> = ({
  isOpen,
  originalImageUrl,
  questionId,
  mission,
  title,
  slotId,
  fileName,
  knownNaturalWidth,
  knownNaturalHeight,
  onClose,
}) => {
  const modalRootRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [zoomDisplayPercent, setZoomDisplayPercent] = useState<number>(100);
  const [isSmoothTransition, setIsSmoothTransition] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(
    knownNaturalWidth && knownNaturalHeight
      ? { width: knownNaturalWidth, height: knownNaturalHeight }
      : null
  );

  // Mutable 60fps transform state to avoid React re-render lag during drag/pinch
  const transformRef = useRef({
    scale: 1,
    panX: 0,
    panY: 0,
  });

  // Pointer & pinch tracking refs
  const activePointersRef = useRef<Map<number, ActivePointer>>(new Map());
  const dragSessionRef = useRef<{
    startX: number;
    startY: number;
    originPanX: number;
    originPanY: number;
    moved: boolean;
  } | null>(null);
  const pinchSessionRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialMidX: number;
    initialMidY: number;
    originPanX: number;
    originPanY: number;
  } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({
    time: 0,
    x: 0,
    y: 0,
  });

  const computeClampedPan = useCallback(
    (scale: number, candidatePanX: number, candidatePanY: number) => {
      if (scale <= 1.001) {
        return { panX: 0, panY: 0 };
      }

      const vp = viewportRef.current;
      if (!vp) {
        return { panX: candidatePanX, panY: candidatePanY };
      }

      const vpWidth = vp.clientWidth;
      const vpHeight = vp.clientHeight;
      if (vpWidth <= 0 || vpHeight <= 0) {
        return { panX: 0, panY: 0 };
      }

      // Compute rendered unscaled object-contain box inside viewport
      let baseWidth = vpWidth;
      let baseHeight = vpHeight;
      const natW = imageDimensions?.width || imageRef.current?.naturalWidth || 0;
      const natH = imageDimensions?.height || imageRef.current?.naturalHeight || 0;

      if (natW > 0 && natH > 0) {
        const fitRatio = Math.min(vpWidth / natW, vpHeight / natH);
        baseWidth = natW * fitRatio;
        baseHeight = natH * fitRatio;
      }

      const scaledWidth = baseWidth * scale;
      const scaledHeight = baseHeight * scale;

      // Keep at least 25% of viewport or the image's natural overhang strictly within view so it never disappears
      const maxOffsetX = Math.max(0, (scaledWidth - vpWidth) * 0.5 + Math.min(48, vpWidth * 0.08));
      const maxOffsetY = Math.max(
        0,
        (scaledHeight - vpHeight) * 0.5 + Math.min(48, vpHeight * 0.08)
      );

      return {
        panX: Math.max(-maxOffsetX, Math.min(maxOffsetX, candidatePanX)),
        panY: Math.max(-maxOffsetY, Math.min(maxOffsetY, candidatePanY)),
      };
    },
    [imageDimensions]
  );

  const commitTransform = useCallback(
    (nextScale: number, rawPanX: number, rawPanY: number, animateStep: boolean) => {
      const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextScale));
      const { panX, panY } = computeClampedPan(clampedScale, rawPanX, rawPanY);

      transformRef.current = {
        scale: clampedScale,
        panX,
        panY,
      };

      setIsSmoothTransition(animateStep);
      setZoomDisplayPercent(Math.round(clampedScale * 100));

      const imgEl = imageRef.current;
      if (imgEl) {
        imgEl.style.transform = `translate3d(${panX.toFixed(2)}px, ${panY.toFixed(2)}px, 0) scale(${clampedScale.toFixed(4)})`;
      }
    },
    [computeClampedPan]
  );

  const zoomAroundViewportPoint = useCallback(
    (targetScale: number, clientX: number, clientY: number, animateStep: boolean) => {
      const vp = viewportRef.current;
      const { scale: prevScale, panX: prevPanX, panY: prevPanY } = transformRef.current;
      const clampedTarget = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetScale));

      if (!vp || clampedTarget <= 1.001) {
        commitTransform(clampedTarget, 0, 0, animateStep);
        return;
      }

      const rect = vp.getBoundingClientRect();
      const cursorOffsetX = clientX - (rect.left + rect.width * 0.5);
      const cursorOffsetY = clientY - (rect.top + rect.height * 0.5);
      const scaleRatio = clampedTarget / prevScale;

      const nextPanX = cursorOffsetX - (cursorOffsetX - prevPanX) * scaleRatio;
      const nextPanY = cursorOffsetY - (cursorOffsetY - prevPanY) * scaleRatio;

      commitTransform(clampedTarget, nextPanX, nextPanY, animateStep);
    },
    [commitTransform]
  );

  // Reset zoom/pan cleanly whenever modal opens or image URL changes
  useEffect(() => {
    if (!isOpen) {
      activePointersRef.current.clear();
      dragSessionRef.current = null;
      pinchSessionRef.current = null;
      setIsDragging(false);
      setIsFullscreen(false);
      return;
    }

    setImageDimensions(
      knownNaturalWidth && knownNaturalHeight
        ? { width: knownNaturalWidth, height: knownNaturalHeight }
        : null
    );
    commitTransform(1, 0, 0, false);
  }, [isOpen, originalImageUrl, knownNaturalWidth, knownNaturalHeight, commitTransform]);

  // Re-clamp pan on window resize or fullscreen toggle
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      const { scale, panX, panY } = transformRef.current;
      commitTransform(scale, panX, panY, false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, isFullscreen, commitTransform]);

  // Sync browser Fullscreen API state (with automatic viewport fallback if API unsupported)
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const handleFsChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      if (!fsEl && modalRootRef.current) {
        // Exited native browser fullscreen
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [isOpen]);

  const exitNativeFullscreenIfActive = useCallback(async () => {
    if (typeof document === 'undefined') return;
    const docWithWebkit = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (docWithWebkit.webkitFullscreenElement && docWithWebkit.webkitExitFullscreen) {
        await docWithWebkit.webkitExitFullscreen();
      }
    } catch {
      // Ignore fullscreen exit errors
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    soundEngine.playButtonClick();
    void exitNativeFullscreenIfActive();
    setIsFullscreen(false);
    onClose();
  }, [exitNativeFullscreenIfActive, onClose]);

  const handleToggleFullscreen = useCallback(async () => {
    soundEngine.playButtonClick();
    const rootEl = modalRootRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> | void })
      | null;

    if (isFullscreen) {
      await exitNativeFullscreenIfActive();
      setIsFullscreen(false);
      return;
    }

    // Enter Fullscreen: try native Fullscreen API first; if blocked/unsupported (e.g. iframe / iOS), seamlessly use 100vw x 100dvh viewport mode!
    setIsFullscreen(true);
    if (rootEl) {
      try {
        if (typeof rootEl.requestFullscreen === 'function') {
          await rootEl.requestFullscreen();
        } else if (typeof rootEl.webkitRequestFullscreen === 'function') {
          await rootEl.webkitRequestFullscreen();
        }
      } catch {
        // Fallback viewport fullscreen (`isFullscreen = true`) remains active seamlessly!
      }
    }
  }, [exitNativeFullscreenIfActive, isFullscreen]);

  const handleStepZoomIn = useCallback(() => {
    const current = transformRef.current.scale;
    const nextStep =
      QUESTION_ZOOM_LEVELS.find((lvl) => lvl > current + 0.04) ?? MAX_ZOOM;
    if (Math.abs(nextStep - current) < 0.01) return;
    soundEngine.playButtonClick();
    const { panX, panY } = transformRef.current;
    const ratio = nextStep / current;
    commitTransform(nextStep, panX * ratio, panY * ratio, true);
  }, [commitTransform]);

  const handleStepZoomOut = useCallback(() => {
    const current = transformRef.current.scale;
    const reversed = [...QUESTION_ZOOM_LEVELS].reverse();
    const prevStep = reversed.find((lvl) => lvl < current - 0.04) ?? MIN_ZOOM;
    if (Math.abs(prevStep - current) < 0.01) return;
    soundEngine.playButtonClick();
    if (prevStep <= 1.001) {
      commitTransform(1, 0, 0, true);
    } else {
      const { panX, panY } = transformRef.current;
      const ratio = prevStep / current;
      commitTransform(prevStep, panX * ratio, panY * ratio, true);
    }
  }, [commitTransform]);

  const handleSelectZoomPreset = useCallback(
    (level: number) => {
      soundEngine.playButtonClick();
      if (level <= 1.001) {
        commitTransform(1, 0, 0, true);
        return;
      }
      const { scale: current, panX, panY } = transformRef.current;
      const ratio = level / current;
      commitTransform(level, panX * ratio, panY * ratio, true);
    },
    [commitTransform]
  );

  const handleResetZoom = useCallback(() => {
    soundEngine.playButtonClick();
    commitTransform(1, 0, 0, true);
  }, [commitTransform]);

  // Capture keyboard shortcuts in capture phase so Escape / + / - / 0 control ONLY this zoom modal
  // and NEVER close the underlying QuizModal or trigger RPG movement!
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDownCapture = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (isFullscreen) {
          void exitNativeFullscreenIfActive();
          setIsFullscreen(false);
        } else {
          handleCloseModal();
        }
        return;
      }

      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        e.stopPropagation();
        handleStepZoomIn();
        return;
      }

      if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        e.stopPropagation();
        handleStepZoomOut();
        return;
      }

      if (e.key === '0' || e.code === 'Numpad0') {
        e.preventDefault();
        e.stopPropagation();
        handleResetZoom();
        return;
      }

      // Prevent arrow/WASD keys from leaking to RPG canvas while inspecting image
      if (
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD' ||
        e.code === 'Space'
      ) {
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', onKeyDownCapture, true);
    return () => window.removeEventListener('keydown', onKeyDownCapture, true);
  }, [
    isOpen,
    isFullscreen,
    exitNativeFullscreenIfActive,
    handleCloseModal,
    handleStepZoomIn,
    handleStepZoomOut,
    handleResetZoom,
  ]);

  // Non-passive mouse wheel listener for smooth wheel zoom
  useEffect(() => {
    if (!isOpen) return;
    const vp = viewportRef.current;
    if (!vp) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const { scale: current } = transformRef.current;
      const zoomFactor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      const targetScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current * zoomFactor));
      zoomAroundViewportPoint(targetScale, e.clientX, e.clientY, false);
    };

    vp.addEventListener('wheel', handleWheel, { passive: false });
    return () => vp.removeEventListener('wheel', handleWheel);
  }, [isOpen, zoomAroundViewportPoint]);

  const toggleDoubleTapZoomAt = useCallback(
    (clientX: number, clientY: number) => {
      soundEngine.playButtonClick();
      const current = transformRef.current.scale;
      // Cycle 100% -> 200% -> 300% -> 100% on double click/tap
      const nextScale = current < 1.9 ? 2 : current < 2.9 ? 3 : 1;
      zoomAroundViewportPoint(nextScale, clientX, clientY, true);
    },
    [zoomAroundViewportPoint]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pointers = Array.from(activePointersRef.current.values());

    if (pointers.length === 2) {
      // Start 2-finger pinch-to-zoom gesture
      dragSessionRef.current = null;
      setIsDragging(false);
      const dx = pointers[1].x - pointers[0].x;
      const dy = pointers[1].y - pointers[0].y;
      const dist = Math.max(12, Math.hypot(dx, dy));
      pinchSessionRef.current = {
        initialDistance: dist,
        initialScale: transformRef.current.scale,
        initialMidX: (pointers[0].x + pointers[1].x) * 0.5,
        initialMidY: (pointers[0].y + pointers[1].y) * 0.5,
        originPanX: transformRef.current.panX,
        originPanY: transformRef.current.panY,
      };
      return;
    }

    if (pointers.length === 1) {
      pinchSessionRef.current = null;
      dragSessionRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originPanX: transformRef.current.panX,
        originPanY: transformRef.current.panY,
        moved: false,
      };
      if (transformRef.current.scale > 1.01) {
        setIsDragging(true);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    e.stopPropagation();
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pointers = Array.from(activePointersRef.current.values());

    if (pointers.length >= 2 && pinchSessionRef.current) {
      const p0 = pointers[0];
      const p1 = pointers[1];
      const dist = Math.max(12, Math.hypot(p1.x - p0.x, p1.y - p0.y));
      const midX = (p0.x + p1.x) * 0.5;
      const midY = (p0.y + p1.y) * 0.5;

      const session = pinchSessionRef.current;
      const nextScale = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, session.initialScale * (dist / session.initialDistance))
      );

      const vp = viewportRef.current;
      if (vp) {
        const rect = vp.getBoundingClientRect();
        const anchorX = session.initialMidX - (rect.left + rect.width * 0.5);
        const anchorY = session.initialMidY - (rect.top + rect.height * 0.5);
        const scaleRatio = nextScale / session.initialScale;
        const midDeltaX = midX - session.initialMidX;
        const midDeltaY = midY - session.initialMidY;

        const nextPanX = anchorX - (anchorX - session.originPanX) * scaleRatio + midDeltaX;
        const nextPanY = anchorY - (anchorY - session.originPanY) * scaleRatio + midDeltaY;
        commitTransform(nextScale, nextPanX, nextPanY, false);
      } else {
        commitTransform(nextScale, session.originPanX, session.originPanY, false);
      }
      return;
    }

    if (pointers.length === 1 && dragSessionRef.current) {
      const drag = dragSessionRef.current;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (Math.hypot(dx, dy) > 5) {
        drag.moved = true;
      }
      if (transformRef.current.scale > 1.01) {
        commitTransform(
          transformRef.current.scale,
          drag.originPanX + dx,
          drag.originPanY + dy,
          false
        );
      }
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const wasSingleTouch =
      e.pointerType !== 'mouse' &&
      activePointersRef.current.size === 1 &&
      dragSessionRef.current &&
      !dragSessionRef.current.moved;

    activePointersRef.current.delete(e.pointerId);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore capture release error
      }
    }

    if (wasSingleTouch) {
      const now = performance.now();
      const prevTap = lastTapRef.current;
      const dist = Math.hypot(e.clientX - prevTap.x, e.clientY - prevTap.y);
      if (now - prevTap.time < 320 && dist < 36) {
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        toggleDoubleTapZoomAt(e.clientX, e.clientY);
      } else {
        lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
      }
    }

    if (activePointersRef.current.size === 1) {
      // Transition cleanly from 2-finger pinch back to 1-finger pan without jumping
      const remaining = Array.from(activePointersRef.current.values())[0];
      pinchSessionRef.current = null;
      dragSessionRef.current = {
        startX: remaining.x,
        startY: remaining.y,
        originPanX: transformRef.current.panX,
        originPanY: transformRef.current.panY,
        moved: true,
      };
      setIsDragging(transformRef.current.scale > 1.01);
    } else if (activePointersRef.current.size === 0) {
      pinchSessionRef.current = null;
      dragSessionRef.current = null;
      setIsDragging(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDoubleTapZoomAt(e.clientX, e.clientY);
  };

  if (!isOpen || !originalImageUrl) return null;

  const isLowResolutionOriginal = Boolean(
    imageDimensions &&
      (imageDimensions.width < LOW_RES_MIN_WIDTH || imageDimensions.height < LOW_RES_MIN_HEIGHT)
  );

  const canZoomIn = zoomDisplayPercent < MAX_ZOOM * 100;
  const canZoomOut = zoomDisplayPercent > MIN_ZOOM * 100;
  const isZoomed = zoomDisplayPercent > 100;

  return (
    <div
      ref={modalRootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Pembesar Imej Soalan ${questionId}: ${title}`}
      className={`fixed inset-0 z-80 bg-black/92 flex flex-col select-none ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget && !isFullscreen) {
          handleCloseModal();
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        className={`w-full h-full flex flex-col overflow-hidden ${
          isFullscreen
            ? 'max-w-none bg-[#090514] border-0'
            : 'max-w-6xl mx-auto pixel-panel-purple'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER & ZOOM CONTROLS BAR */}
        <div className="px-3 sm:px-4 py-2.5 bg-[#1d113b] border-b-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#7dd3fc]">
              <span>
                {mission ? `MISI ${mission} · ` : ''}SOALAN {questionId}
              </span>
              {slotId && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">{slotId}</span>
                </>
              )}
              {imageDimensions && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num text-[#cbd5e1]">
                    Resolusi Asal: {imageDimensions.width} × {imageDimensions.height} px
                  </span>
                </>
              )}
            </div>
            <h3 className="font-pixel font-bold text-sm sm:text-lg text-[#fde047] truncate">
              {title}
            </h3>
          </div>

          {/* RIGHT ACTION BUTTONS: PAPARAN PENUH & TUTUP (X) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Keluar daripada Paparan Penuh' : 'Buka dalam Paparan Penuh'}
              className="px-3 py-1.5 sm:py-2 pixel-btn-blue font-pixel font-bold text-[11px] sm:text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>KELUAR PENUH</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>PAPARAN PENUH</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCloseModal}
              title="Tutup Pembesar Imej (ESC)"
              aria-label="Tutup Pembesar Imej"
              className="w-9 h-9 sm:w-10 sm:h-10 bg-[#7f1d1d] hover:bg-[#991b1b] border-3 border-[#f6c445] text-white font-pixel font-bold flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LOW-RESOLUTION ORIGINAL IMAGE NOTICE (IF APPLICABLE) */}
        {isLowResolutionOriginal && (
          <div className="px-3 sm:px-4 py-1.5 bg-[#451a03] border-b-2 border-[#f59e0b] text-[#fef3c7] text-[11px] sm:text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#fbbf24] shrink-0" />
            <span>
              Imej asal mempunyai resolusi rendah ({imageDimensions?.width} ×{' '}
              {imageDimensions?.height} px). Sistem memaparkan kualiti asal penuh, namun zum tidak
              dapat menambah butiran yang tiada pada imej asal.
            </span>
          </div>
        )}

        {/* INTERACTIVE IMAGE STAGE (CLICK/DRAG/WHEEL/PINCH/DOUBLE-TAP, OBJECT-FIT: CONTAIN) */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onDoubleClick={handleDoubleClick}
          className={`relative flex-1 min-h-0 w-full bg-[#090514] overflow-hidden flex items-center justify-center zoom-viewport-surface ${
            isZoomed ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
          }`}
        >
          <img
            ref={imageRef}
            src={originalImageUrl}
            alt={`Gambar asal Soalan ${questionId}: ${title}`}
            draggable={false}
            onLoad={(e) => {
              const natW = e.currentTarget.naturalWidth;
              const natH = e.currentTarget.naturalHeight;
              if (natW > 0 && natH > 0) {
                setImageDimensions({ width: natW, height: natH });
              }
            }}
            className={`max-w-full max-h-full w-auto h-auto object-contain select-none pointer-events-none origin-center ${
              isSmoothTransition ? 'zoom-image-smooth-step' : ''
            }`}
          />

          {/* Subtle Pan Guidance Badge when zoomed > 100% */}
          {isZoomed && (
            <div className="pointer-events-none absolute top-2.5 left-2.5 px-2.5 py-1 bg-[#160d2e]/90 border border-[#7dd3fc] text-[#e0f2fe] font-pixel text-[10px] sm:text-xs flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-[#7dd3fc] shrink-0" />
              <span>Seret gambar untuk membaca setiap bahagian ({zoomDisplayPercent}%)</span>
            </div>
          )}
        </div>

        {/* BOTTOM INTERACTIVE ZOOM TOOLBAR: (-), 100%..400% PRESETS, (+), TETAPKAN SEMULA */}
        <div className="px-3 sm:px-4 py-2.5 bg-[#190e33] border-t-3 border-[#f6c445] flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Left: Zoom Out (-), Discrete Levels (100%..400%), Zoom In (+), Reset */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              disabled={!canZoomOut}
              onClick={handleStepZoomOut}
              title="Zum Keluar (-)"
              aria-label="Zum Keluar"
              className="px-2.5 sm:px-3 py-1.5 pixel-btn-purple disabled:opacity-40 disabled:cursor-not-allowed font-pixel font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
              <span>-</span>
            </button>

            {/* 5 Preset Zoom Levels: 100%, 150%, 200%, 300%, 400% */}
            <div className="flex items-center gap-1 bg-[#0f0821] p-1 border-2 border-[#5b3ea8]">
              {QUESTION_ZOOM_LEVELS.map((lvl) => {
                const pct = Math.round(lvl * 100);
                const isActive = Math.abs(zoomDisplayPercent - pct) <= 4;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleSelectZoomPreset(lvl)}
                    className={`px-2 sm:px-2.5 py-1 font-mono-num font-bold text-[11px] sm:text-xs border cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#facc15] text-[#261505] border-[#4a2806]'
                        : 'bg-[#231547] text-[#e9d5ff] border-[#4c3385] hover:border-[#a78bfa]'
                    }`}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!canZoomIn}
              onClick={handleStepZoomIn}
              title="Zum Masuk (+)"
              aria-label="Zum Masuk"
              className="px-2.5 sm:px-3 py-1.5 pixel-btn-gold disabled:opacity-40 disabled:cursor-not-allowed font-pixel font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
              <span>+</span>
            </button>

            <button
              type="button"
              disabled={zoomDisplayPercent === 100}
              onClick={handleResetZoom}
              title="Tetapkan semula zum kepada 100%"
              className="px-2.5 sm:px-3 py-1.5 pixel-btn-emerald disabled:opacity-40 disabled:cursor-not-allowed font-pixel font-bold text-[11px] sm:text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>TETAPKAN SEMULA</span>
            </button>
          </div>

          {/* Right: Live Zoom readout + Interaction Hint */}
          <div className="flex items-center gap-2 text-[11px] text-[#cbd5e1] ml-auto">
            <span className="font-mono-num font-bold text-[#fde047] bg-[#120a26] border border-[#5b3ea8] px-2 py-0.5">
              Zum: {zoomDisplayPercent}%
            </span>
            <span className="hidden lg:inline text-[#a78bfa]">
              Roda tetikus · Cubit skrin · Klik 2× untuk zum · Seret untuk gerak
            </span>
            {fileName && (
              <span className="hidden xl:inline font-mono-num text-[#94a3b8] truncate max-w-[160px]">
                ({fileName})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
