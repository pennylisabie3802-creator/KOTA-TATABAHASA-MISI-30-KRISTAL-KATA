import { useEffect, useState } from 'react';

export interface MobileViewportState {
  width: number;
  height: number;
  isPortraitPhone: boolean;
  isLandscapePhone: boolean;
  isMobileDevice: boolean;
}

const IMAGE_ASPECT = 16 / 9;

/**
 * Computes exact integer pixel dimensions `{ width, height }` for a 16:9 stage
 * fitted (`object-fit: contain` equivalent) inside `(availWidth, availHeight)`
 * with zero cropping and maximum available screen utilization.
 */
export function computeContained16By9Stage(
  availWidth: number,
  availHeight: number
): { width: number; height: number } | null {
  if (availWidth <= 0 || availHeight <= 0) return null;

  let width = availWidth;
  let height = availWidth / IMAGE_ASPECT;

  if (height > availHeight) {
    height = availHeight;
    width = availHeight * IMAGE_ASPECT;
  }

  return {
    width: Math.max(1, Math.floor(width)),
    height: Math.max(1, Math.floor(height)),
  };
}

function readViewportState(): MobileViewportState {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 720,
      isPortraitPhone: false,
      isLandscapePhone: false,
      isMobileDevice: false,
    };
  }

  // Prefer visualViewport dimensions when available on mobile Safari/Chrome so browser URL/bottom bars never clip!
  const vv = window.visualViewport;
  const width = Math.round(vv?.width ?? window.innerWidth);
  const height = Math.round(vv?.height ?? window.innerHeight);

  const isPortrait = height > width;
  const isCoarsePointer = Boolean(window.matchMedia?.('(pointer: coarse)').matches);
  const shortestSide = Math.min(width, height);
  const longestSide = Math.max(width, height);

  // Portrait phone/compact tablet: height > width and width < 900
  const isPortraitPhone = isPortrait && width < 900;

  // Landscape phone: width >= height and compact vertical height (<= 540px) or coarse pointer <= 600px height
  const isLandscapePhone =
    !isPortrait &&
    longestSide <= 1024 &&
    (height <= 520 || (isCoarsePointer && shortestSide <= 560));

  const isMobileDevice = isPortraitPhone || isLandscapePhone;

  return {
    width,
    height,
    isPortraitPhone,
    isLandscapePhone,
    isMobileDevice,
  };
}

/**
 * Tracks live mobile viewport dimensions & portrait/landscape state across
 * window resize, orientationchange, and visualViewport address-bar transitions.
 * Never forces screen orientation lock if unsupported by the browser.
 */
export function useMobileViewport(): MobileViewportState {
  const [state, setState] = useState<MobileViewportState>(() => readViewportState());

  useEffect(() => {
    let rafId = 0;

    const scheduleUpdate = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        setState(readViewportState());
      });
    };

    scheduleUpdate();

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);
    window.visualViewport?.addEventListener('resize', scheduleUpdate);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  return state;
}
