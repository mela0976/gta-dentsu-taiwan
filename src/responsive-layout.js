// 跨裝置響應式與摺疊機姿態偵測引擎：支援極窄封面螢幕、橫向手機、展開雙屏（Book / Flex Tabletop）、筆電與超寬螢幕

function rlClampInt(val, min, max, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function rlNormalizeSegment(seg) {
  if (!seg || typeof seg !== 'object') return null;
  const width = Number(seg.width);
  const height = Number(seg.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return {
    left: Number.isFinite(Number(seg.left)) ? Number(seg.left) : 0,
    top: Number.isFinite(Number(seg.top)) ? Number(seg.top) : 0,
    width: Math.round(width),
    height: Math.round(height)
  };
}

function rlBuildSignature(layout) {
  const h = layout.hinge || {};
  return [
    layout.mode,
    layout.useMobileTabs ? '1' : '0',
    layout.useCompactHud ? '1' : '0',
    layout.isShortViewport ? '1' : '0',
    layout.isUltraNarrow ? '1' : '0',
    layout.isCoverSquare ? '1' : '0',
    h.orientation || 'none',
    h.gap || 0,
    h.seg0?.width || 0,
    h.seg0?.height || 0
  ].join('|');
}

export function detectViewportLayout({
  width,
  height,
  segments = [],
  posture = 'continuous',
  coarsePointer = false
} = {}) {
  const w = rlClampInt(width, 240, 8000, 1280);
  const h = rlClampInt(height, 240, 8000, 800);
  const normalizedSegments = Array.isArray(segments)
    ? segments.map(rlNormalizeSegment).filter(Boolean)
    : [];
  const safePosture = posture === 'folded' ? 'folded' : 'continuous';

  let mode = 'desktop';
  let hinge = { orientation: 'none', gap: 0, seg0: null, seg1: null };

  if (normalizedSegments.length === 2) {
    const sorted = [...normalizedSegments].sort((a, b) => (a.left - b.left) || (a.top - b.top));
    const [seg0, seg1] = sorted;
    const dx = Math.abs(seg1.left - seg0.left);
    const dy = Math.abs(seg1.top - seg0.top);
    if (dx > dy) {
      hinge = {
        orientation: 'vertical',
        gap: Math.max(0, Math.round(seg1.left - (seg0.left + seg0.width))),
        seg0,
        seg1
      };
      mode = 'fold-book';
    } else {
      hinge = {
        orientation: 'horizontal',
        gap: Math.max(0, Math.round(seg1.top - (seg0.top + seg0.height))),
        seg0,
        seg1
      };
      mode = 'fold-flex';
    }
  } else if (safePosture === 'folded' && h >= 420 && w <= 960) {
    const segH = Math.floor(h * 0.48);
    hinge = {
      orientation: 'horizontal',
      gap: Math.max(16, Math.round(h * 0.04)),
      seg0: { left: 0, top: 0, width: w, height: segH },
      seg1: { left: 0, top: Math.ceil(h * 0.52), width: w, height: segH }
    };
    mode = 'fold-flex';
  } else if (h <= 500 && w >= 480 && w < 1024) {
    mode = 'compact-landscape';
  } else if (w < 660) {
    mode = 'compact';
  } else if (w < 1024) {
    mode = 'medium';
  } else if (w < 1600) {
    mode = 'desktop';
  } else {
    mode = 'wide';
  }

  const useMobileTabs = mode === 'compact' || (mode === 'compact-landscape' && w < 640);
  const useCompactHud = mode === 'compact' || mode === 'compact-landscape' || (mode === 'fold-flex' && w < 660);
  const isShortViewport = h < 680;
  const isUltraNarrow = w <= 350;
  const isCoverSquare = w <= 420 && h <= 420;
  const isDesktopLocked = (mode === 'desktop' || mode === 'wide') && !isShortViewport;

  return {
    mode,
    width: w,
    height: h,
    posture: safePosture,
    coarsePointer: Boolean(coarsePointer),
    hinge,
    useMobileTabs,
    useCompactHud,
    isShortViewport,
    isUltraNarrow,
    isCoverSquare,
    isDesktopLocked
  };
}

export function readHardwareFoldState(win, nav) {
  const vv = win?.visualViewport;
  const useInner = !vv || Math.abs((vv.scale || 1) - 1) <= 0.05;
  const width = (useInner ? win?.innerWidth : vv?.width) || win?.innerWidth || vv?.width || 1280;
  const height = (useInner ? win?.innerHeight : vv?.height) || win?.innerHeight || vv?.height || 800;

  let segments = [];
  try {
    if (Array.isArray(win?.viewport?.segments)) {
      segments = win.viewport.segments;
    } else if (typeof win?.getWindowSegments === 'function') {
      segments = win.getWindowSegments() || [];
    }
  } catch {
    segments = [];
  }

  let posture = 'continuous';
  try {
    if (nav?.devicePosture?.type === 'folded') {
      posture = 'folded';
    } else if (win?.matchMedia?.('(device-posture: folded)')?.matches) {
      posture = 'folded';
    }
  } catch {
    posture = 'continuous';
  }

  let coarsePointer = false;
  try {
    coarsePointer = Boolean(win?.matchMedia?.('(pointer: coarse)')?.matches);
  } catch {
    coarsePointer = false;
  }

  return detectViewportLayout({ width, height, segments, posture, coarsePointer });
}

export function applyViewportLayoutToRoot(doc, layout) {
  const root = doc?.documentElement;
  if (!root || !layout) return;

  const attrs = {
    'data-layout-mode': layout.mode,
    'data-mobile-tabs': layout.useMobileTabs ? '1' : '0',
    'data-compact-hud': layout.useCompactHud ? '1' : '0',
    'data-short-viewport': layout.isShortViewport ? '1' : '0',
    'data-ultra-narrow': layout.isUltraNarrow ? '1' : '0',
    'data-cover-square': layout.isCoverSquare ? '1' : '0',
    'data-fold-hinge': layout.hinge?.orientation || 'none'
  };

  for (const [attr, value] of Object.entries(attrs)) {
    if (typeof root.setAttribute === 'function') {
      root.setAttribute(attr, value);
    } else if (root.dataset) {
      const camel = attr.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      root.dataset[camel] = value;
    }
  }

  const style = root.style;
  if (!style || typeof style.setProperty !== 'function' || typeof style.removeProperty !== 'function') return;

  const h = layout.hinge;
  if (h?.orientation === 'vertical' && h.seg0 && h.seg1) {
    style.setProperty('--fold-seg0-w', `${Math.round(h.seg0.width)}px`);
    style.setProperty('--fold-seg1-w', `${Math.round(h.seg1.width)}px`);
    style.setProperty('--fold-hinge-gap', `${Math.round(h.gap || 0)}px`);
    style.removeProperty('--fold-seg0-h');
    style.removeProperty('--fold-seg1-h');
  } else if (h?.orientation === 'horizontal' && h.seg0 && h.seg1) {
    style.setProperty('--fold-seg0-h', `${Math.round(h.seg0.height)}px`);
    style.setProperty('--fold-seg1-h', `${Math.round(h.seg1.height)}px`);
    style.setProperty('--fold-hinge-gap', `${Math.round(h.gap || 0)}px`);
    style.removeProperty('--fold-seg0-w');
    style.removeProperty('--fold-seg1-w');
  } else {
    style.removeProperty('--fold-seg0-w');
    style.removeProperty('--fold-seg1-w');
    style.removeProperty('--fold-seg0-h');
    style.removeProperty('--fold-seg1-h');
    style.removeProperty('--fold-hinge-gap');
  }
}

export function observeViewportLayout(win, doc, nav, onChange) {
  let current = readHardwareFoldState(win, nav);
  applyViewportLayoutToRoot(doc, current);
  let lastSig = rlBuildSignature(current);
  let rafId = 0;

  const runNow = () => {
    rafId = 0;
    const prev = current;
    const next = readHardwareFoldState(win, nav);
    applyViewportLayoutToRoot(doc, next);
    current = next;
    const nextSig = rlBuildSignature(next);
    if (nextSig !== lastSig) {
      lastSig = nextSig;
      if (typeof onChange === 'function') onChange(next, prev);
    }
    return next;
  };

  const schedule = () => {
    if (typeof win?.requestAnimationFrame !== 'function') {
      runNow();
      return;
    }
    if (rafId) win.cancelAnimationFrame(rafId);
    rafId = win.requestAnimationFrame(runNow);
  };

  const cleanups = [];
  const bind = (target, evt) => {
    if (target && typeof target.addEventListener === 'function') {
      target.addEventListener(evt, schedule);
      cleanups.push(() => target.removeEventListener?.(evt, schedule));
    }
  };

  bind(win, 'resize');
  bind(win, 'orientationchange');
  bind(win?.visualViewport, 'resize');
  bind(nav?.devicePosture, 'change');

  for (const query of [
    '(horizontal-viewport-segments: 2)',
    '(vertical-viewport-segments: 2)',
    '(device-posture: folded)',
    '(pointer: coarse)'
  ]) {
    try {
      const mq = win?.matchMedia?.(query);
      if (mq && typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', schedule);
        cleanups.push(() => mq.removeEventListener?.('change', schedule));
      }
    } catch {
      // ignore unsupported media query syntax
    }
  }

  return {
    getLayout: () => current,
    refresh: runNow,
    disconnect: () => {
      if (rafId && typeof win?.cancelAnimationFrame === 'function') {
        win.cancelAnimationFrame(rafId);
      }
      cleanups.forEach((fn) => fn());
    }
  };
}
