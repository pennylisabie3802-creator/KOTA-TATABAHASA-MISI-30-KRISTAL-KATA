import React, { useEffect, useRef, useState } from 'react';
import { DoorOpen, MapPinOff, X } from 'lucide-react';
import {
  AvatarId,
  CastleRoomId,
  Direction,
  JournalRecord,
  MapId,
  MapInteractiveProp,
  MapNpc,
  MapPortal,
  MapSign,
  QuizQuestion,
} from '../types/game';
import {
  BuildingLandmark,
  DynamicTileCollisionOptions,
  getMapQuestObjects,
  isStaticTerrainOrStructureSolid,
  isTileSolid,
  packTileKey,
  WORLD_MAPS,
} from '../engine/maps';
import {
  AStarPathOptions,
  findBestPathToTargetCandidates,
  findPathAStar,
  getInteractionNeighborTiles,
  getPortalCandidateTiles,
  isPathStillClear,
  resolveNearestWalkableTile,
  TileCoord,
} from '../engine/pathfinding';
import {
  drawAvatarSprite,
  drawCrystalSprite,
  drawNpcSprite,
  drawQuestObjectSprite,
} from '../engine/pixelSprites';
import { soundEngine } from '../audio/soundEngine';
import { useMobileViewport } from '../hooks/useMobileViewport';

export type NearbyTarget =
  | { kind: 'npc'; npc: MapNpc; label: string }
  | { kind: 'question'; question: QuizQuestion; label: string; isNext: boolean; isSolved: boolean }
  | { kind: 'sign'; sign: MapSign; label: string }
  | { kind: 'portal'; portal: MapPortal; label: string }
  | { kind: 'prop'; prop: MapInteractiveProp; label: string };

type AutoMovePendingAction =
  | { kind: 'none' }
  | { kind: 'npc'; npc: MapNpc }
  | { kind: 'portal'; portal: MapPortal }
  | { kind: 'question'; question: QuizQuestion }
  | { kind: 'sign'; sign: MapSign }
  | { kind: 'prop'; prop: MapInteractiveProp };

interface ClickIndicatorEffect {
  worldX: number;
  worldY: number;
  kind: 'valid' | 'blocked';
  elapsed: number;
  duration: number;
}

interface NpcRuntimeState {
  id: string;
  homeTx: number;
  homeTy: number;
  tx: number;
  ty: number;
  nextTx: number;
  nextTy: number;
  wx: number;
  wy: number;
  stepping: boolean;
  pauseTimer: number;
  patrolStepIndex: number;
}

interface RpgCanvasProps {
  mapId: MapId;
  initialTileX: number;
  initialTileY: number;
  avatarId: AvatarId;
  completedQuestions: Record<number, JournalRecord>;
  foundHiddenBooks: Record<string, boolean>;
  readCategories: Record<string, boolean>;
  isPausedOrModalOpen: boolean;
  onPlayerTileChange: (tx: number, ty: number) => void;
  onEnterCastleRoom?: (roomId: CastleRoomId, roomName: string) => void;
  onInteractNpc: (npc: MapNpc) => void;
  onInteractQuestion: (question: QuizQuestion) => void;
  onInteractSign: (sign: MapSign) => void;
  onInteractProp: (prop: MapInteractiveProp) => void;
  onUsePortal: (portal: MapPortal) => void;
}

const TILE_SIZE = 48;

export const RpgCanvas: React.FC<RpgCanvasProps> = ({
  mapId,
  initialTileX,
  initialTileY,
  avatarId,
  completedQuestions,
  foundHiddenBooks,
  readCategories,
  isPausedOrModalOpen,
  onPlayerTileChange,
  onEnterCastleRoom,
  onInteractNpc,
  onInteractQuestion,
  onInteractSign,
  onInteractProp,
  onUsePortal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isLandscapePhone } = useMobileViewport();
  const [nearbyPrompt, setNearbyPrompt] = useState<NearbyTarget | null>(null);

  // Brief indicator toast when clicked destination is unreachable / blocked (solid object, building, river)
  const [unreachableNotice, setUnreachableNotice] = useState<string | null>(null);

  // Explicit "MASUK" choice card shown when avatar arrives at a clicked door / portal
  const [arrivedDoorPortal, setArrivedDoorPortal] = useState<MapPortal | null>(null);

  useEffect(() => {
    if (!unreachableNotice) return;
    const timer = window.setTimeout(() => setUnreachableNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [unreachableNotice]);

  const simRef = useRef({
    px: initialTileX * TILE_SIZE + TILE_SIZE * 0.5,
    py: initialTileY * TILE_SIZE + TILE_SIZE * 0.5,
    dir: 'down' as Direction,
    moving: false,
    walkTimer: 0,
    walkFrame: 0,
    worldTimer: 0,
    worldFrame: 0,
    tickCount: 0,
    keys: new Set<string>(),
    joyDx: 0,
    joyDy: 0,
    camX: 0,
    camY: 0,
    // Click-to-Move & Dynamic A* Pathfinding state
    autoPath: [] as TileCoord[],
    autoStepStart: 1,
    autoTotalSteps: 0,
    autoDestTile: null as TileCoord | null,
    autoPending: { kind: 'none' } as AutoMovePendingAction,
    autoTargetEntityTile: null as TileCoord | null,
    lastObstacleSignature: 0,
    lastDynamicReplanAt: 0,
    stuckTimer: 0,
    tempAvoidUntil: new Map<number, number>(),
    npcStates: new Map<string, NpcRuntimeState>(),
    clickEffects: [] as ClickIndicatorEffect[],
    lastReportedTx: initialTileX,
    lastReportedTy: initialTileY,
    activeCastleRoom: null as CastleRoomId | null,
    nearby: null as NearbyTarget | null,
  });

  const getNpcLiveTileAndCenter = (npc: MapNpc): { tx: number; ty: number; cx: number; cy: number } => {
    const st = simRef.current.npcStates.get(npc.id);
    if (!st) {
      return {
        tx: npc.tileX,
        ty: npc.tileY,
        cx: (npc.tileX + 0.5) * TILE_SIZE,
        cy: (npc.tileY + 0.5) * TILE_SIZE,
      };
    }
    return {
      tx: st.stepping ? st.nextTx : st.tx,
      ty: st.stepping ? st.nextTy : st.ty,
      cx: st.wx + TILE_SIZE * 0.5,
      cy: st.wy + TILE_SIZE * 0.5,
    };
  };

  const getPendingEntityAnchorTile = (pending: AutoMovePendingAction): TileCoord | null => {
    if (pending.kind === 'none') return null;
    if (pending.kind === 'npc') {
      const live = getNpcLiveTileAndCenter(pending.npc);
      return { tx: live.tx, ty: live.ty };
    }
    if (pending.kind === 'portal') {
      return { tx: pending.portal.tileX, ty: pending.portal.tileY };
    }
    if (pending.kind === 'question') {
      return { tx: pending.question.tileX, ty: pending.question.tileY };
    }
    if (pending.kind === 'sign') {
      return { tx: pending.sign.tileX, ty: pending.sign.tileY };
    }
    if (pending.kind === 'prop') {
      return { tx: pending.prop.tileX, ty: pending.prop.tileY };
    }
    return null;
  };

  const buildDynamicCollisionSnapshot = (
    targetMapId: MapId,
    nowMs: number,
    includeAvoidTiles = true
  ): { options: AStarPathOptions; signature: number } => {
    const map = WORLD_MAPS[targetMapId];
    const sim = simRef.current;
    const p = propsRef.current;

    const occupiedKeys = new Set<number>();
    let hash = 2166136261;
    const mixHash = (val: number) => {
      hash ^= val | 0;
      hash = Math.imul(hash, 16777619);
    };

    for (const npc of map.npcs) {
      const st = sim.npcStates.get(npc.id);
      if (st) {
        occupiedKeys.add(packTileKey(map.cols, st.tx, st.ty));
        occupiedKeys.add(packTileKey(map.cols, st.nextTx, st.nextTy));
        mixHash(st.tx);
        mixHash(st.ty);
        mixHash(st.nextTx);
        mixHash(st.nextTy);
      } else {
        occupiedKeys.add(packTileKey(map.cols, npc.tileX, npc.tileY));
        mixHash(npc.tileX);
        mixHash(npc.tileY);
      }
    }

    for (const prop of map.props) {
      const collected =
        prop.kind === 'hidden_magic_book' &&
        Boolean(prop.hiddenBookId && p.foundHiddenBooks[prop.hiddenBookId]);
      mixHash(collected ? 0 : 1);
      if (!collected) {
        mixHash(prop.tileX);
        mixHash(prop.tileY);
      }
    }

    for (const sign of map.signs) {
      mixHash(sign.tileX);
      mixHash(sign.tileY);
    }

    const qObjects = getMapQuestObjects(targetMapId);
    for (const q of qObjects) {
      mixHash(q.tileX);
      mixHash(q.tileY);
    }

    let avoidKeys: Set<number> | undefined;
    if (sim.tempAvoidUntil.size > 0) {
      for (const [k, exp] of sim.tempAvoidUntil.entries()) {
        if (exp <= nowMs) {
          sim.tempAvoidUntil.delete(k);
        } else if (includeAvoidTiles) {
          if (!avoidKeys) avoidKeys = new Set<number>();
          avoidKeys.add(k);
        }
      }
    }

    return {
      options: {
        dynamicOccupiedKeys: occupiedKeys,
        foundHiddenBooks: p.foundHiddenBooks,
        avoidTileKeys: avoidKeys,
        preferClearance: true,
        allowStartEscape: true,
      },
      signature: hash >>> 0,
    };
  };

  const cancelAutoMove = () => {
    simRef.current.autoPath = [];
    simRef.current.autoStepStart = 1;
    simRef.current.autoTotalSteps = 0;
    simRef.current.autoDestTile = null;
    simRef.current.autoPending = { kind: 'none' };
    simRef.current.autoTargetEntityTile = null;
    simRef.current.stuckTimer = 0;
  };

  const assignAutoPath = (
    path: TileCoord[],
    destTile: TileCoord,
    pending: AutoMovePendingAction,
    obstacleSignature?: number
  ) => {
    simRef.current.autoPath = path;
    simRef.current.autoStepStart = 1;
    simRef.current.autoTotalSteps = path.length;
    simRef.current.autoDestTile = destTile;
    simRef.current.autoPending = pending;
    simRef.current.autoTargetEntityTile = getPendingEntityAnchorTile(pending);
    simRef.current.stuckTimer = 0;
    simRef.current.tempAvoidUntil.clear();
    if (obstacleSignature !== undefined) {
      simRef.current.lastObstacleSignature = obstacleSignature;
    }
  };

  useEffect(() => {
    const map = WORLD_MAPS[mapId];
    simRef.current.px = initialTileX * TILE_SIZE + TILE_SIZE * 0.5;
    simRef.current.py = initialTileY * TILE_SIZE + TILE_SIZE * 0.5;
    simRef.current.lastReportedTx = initialTileX;
    simRef.current.lastReportedTy = initialTileY;
    simRef.current.activeCastleRoom = null;
    simRef.current.keys.clear();
    simRef.current.joyDx = 0;
    simRef.current.joyDy = 0;
    simRef.current.autoPath = [];
    simRef.current.autoStepStart = 1;
    simRef.current.autoTotalSteps = 0;
    simRef.current.autoDestTile = null;
    simRef.current.autoPending = { kind: 'none' };
    simRef.current.autoTargetEntityTile = null;
    simRef.current.stuckTimer = 0;
    simRef.current.tempAvoidUntil.clear();
    simRef.current.clickEffects = [];

    // Initialize live dynamic NPC states for this map
    const nextNpcMap = new Map<string, NpcRuntimeState>();
    map.npcs.forEach((npc, idx) => {
      nextNpcMap.set(npc.id, {
        id: npc.id,
        homeTx: npc.tileX,
        homeTy: npc.tileY,
        tx: npc.tileX,
        ty: npc.tileY,
        nextTx: npc.tileX,
        nextTy: npc.tileY,
        wx: npc.tileX * TILE_SIZE,
        wy: npc.tileY * TILE_SIZE,
        stepping: false,
        pauseTimer: 2.2 + (idx % 3) * 1.1,
        patrolStepIndex: idx,
      });
    });
    simRef.current.npcStates = nextNpcMap;

    setArrivedDoorPortal(null);
    setUnreachableNotice(null);
  }, [mapId]);

  // Cancel active auto-move if any modal opens
  useEffect(() => {
    if (isPausedOrModalOpen) {
      cancelAutoMove();
    }
  }, [isPausedOrModalOpen]);

  const propsRef = useRef({
    mapId,
    avatarId,
    completedQuestions,
    foundHiddenBooks,
    readCategories,
    isPausedOrModalOpen,
    onPlayerTileChange,
    onEnterCastleRoom,
    onInteractNpc,
    onInteractQuestion,
    onInteractSign,
    onInteractProp,
    onUsePortal,
  });
  propsRef.current = {
    mapId,
    avatarId,
    completedQuestions,
    foundHiddenBooks,
    readCategories,
    isPausedOrModalOpen,
    onPlayerTileChange,
    onEnterCastleRoom,
    onInteractNpc,
    onInteractQuestion,
    onInteractSign,
    onInteractProp,
    onUsePortal,
  };

  const executePendingArrivalAction = (action: AutoMovePendingAction) => {
    if (propsRef.current.isPausedOrModalOpen) return;
    if (action.kind === 'none') return;

    if (action.kind === 'npc') {
      // Face the NPC's live position cleanly before opening dialogue automatically
      const liveNpc = getNpcLiveTileAndCenter(action.npc);
      const fdx = liveNpc.cx - simRef.current.px;
      const fdy = liveNpc.cy - simRef.current.py;
      if (Math.abs(fdx) > Math.abs(fdy)) {
        simRef.current.dir = fdx < 0 ? 'left' : 'right';
      } else {
        simRef.current.dir = fdy < 0 ? 'up' : 'down';
      }
      soundEngine.playNpcInteract();
      propsRef.current.onInteractNpc(action.npc);
      return;
    }

    if (action.kind === 'portal') {
      // Display explicit "MASUK" choice prompt upon arriving at the door/portal!
      soundEngine.playButtonClick();
      setArrivedDoorPortal(action.portal);
      return;
    }

    if (action.kind === 'question') {
      soundEngine.playBookOpen();
      propsRef.current.onInteractQuestion(action.question);
      return;
    }

    if (action.kind === 'sign') {
      soundEngine.playBookOpen();
      propsRef.current.onInteractSign(action.sign);
      return;
    }

    if (action.kind === 'prop') {
      soundEngine.playBookOpen();
      propsRef.current.onInteractProp(action.prop);
    }
  };

  const triggerInteraction = () => {
    if (propsRef.current.isPausedOrModalOpen) return;
    cancelAutoMove();

    if (arrivedDoorPortal) {
      const portalToUse = arrivedDoorPortal;
      setArrivedDoorPortal(null);
      soundEngine.playButtonClick();
      propsRef.current.onUsePortal(portalToUse);
      return;
    }

    const target = simRef.current.nearby;
    if (!target) return;

    if (target.kind === 'npc') {
      soundEngine.playNpcInteract();
      propsRef.current.onInteractNpc(target.npc);
    } else if (target.kind === 'question') {
      soundEngine.playBookOpen();
      propsRef.current.onInteractQuestion(target.question);
    } else if (target.kind === 'sign') {
      soundEngine.playBookOpen();
      propsRef.current.onInteractSign(target.sign);
    } else if (target.kind === 'prop') {
      soundEngine.playBookOpen();
      propsRef.current.onInteractProp(target.prop);
    } else if (target.kind === 'portal') {
      soundEngine.playButtonClick();
      propsRef.current.onUsePortal(target.portal);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (propsRef.current.isPausedOrModalOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const code = e.code;
      if (
        code === 'KeyW' ||
        code === 'KeyA' ||
        code === 'KeyS' ||
        code === 'KeyD' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        e.preventDefault();
        // Manual WASD / Arrow input immediately cancels automatic Click-to-Move!
        cancelAutoMove();
        setArrivedDoorPortal(null);
        simRef.current.keys.add(code);
      } else if ((code === 'KeyE' || code === 'Space' || code === 'Enter') && !e.repeat) {
        e.preventDefault();
        triggerInteraction();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      simRef.current.keys.delete(e.code);
    };

    const onBlur = () => {
      simRef.current.keys.clear();
      simRef.current.joyDx = 0;
      simRef.current.joyDy = 0;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  /**
   * Click-to-Move Handler on the 2D Tilemap Canvas:
   * 1. Converts screen click -> world coordinates -> tile coordinates `(clickTx, clickTy)`.
   * 2. Detects if the player clicked an NPC, a Door/Portal (including building doorway),
   *    or an interactive object (Quest/Sign/Prop).
   * 3. Computes a safe A* path avoiding solid buildings, rivers, walls, and obstacles.
   * 4. If unreachable, displays a concise visual + toast indicator.
   */
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (propsRef.current.isPausedOrModalOpen) return;
    // Only respond to primary pointer / left-click / touch tap on map
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const sim = simRef.current;
    const p = propsRef.current;
    const map = WORLD_MAPS[p.mapId];

    const worldX = canvasX + sim.camX;
    const worldY = canvasY + sim.camY;

    const clickTx = Math.floor(worldX / TILE_SIZE);
    const clickTy = Math.floor(worldY / TILE_SIZE);

    if (clickTx < 0 || clickTy < 0 || clickTx >= map.cols || clickTy >= map.rows) {
      return;
    }

    setArrivedDoorPortal(null);

    const rawStartTx = Math.floor(sim.px / TILE_SIZE);
    const rawStartTy = Math.floor(sim.py / TILE_SIZE);
    const { options: clickCollisionOpts, signature: clickSig } = buildDynamicCollisionSnapshot(
      p.mapId,
      performance.now(),
      false
    );
    const safeStart =
      resolveNearestWalkableTile(p.mapId, rawStartTx, rawStartTy, clickCollisionOpts, 2) ?? {
        tx: rawStartTx,
        ty: rawStartTy,
      };
    const startTx = safeStart.tx;
    const startTy = safeStart.ty;

    const prependSafeStartIfNeeded = (computedPath: TileCoord[]): TileCoord[] => {
      if (startTx !== rawStartTx || startTy !== rawStartTy) {
        if (
          computedPath.length === 0 ||
          computedPath[0].tx !== startTx ||
          computedPath[0].ty !== startTy
        ) {
          return [{ tx: startTx, ty: startTy }, ...computedPath];
        }
      }
      return computedPath;
    };

    const pushClickEffect = (wx: number, wy: number, kind: 'valid' | 'blocked') => {
      sim.clickEffects = [
        ...sim.clickEffects.slice(-4),
        {
          worldX: wx,
          worldY: wy,
          kind,
          elapsed: 0,
          duration: kind === 'valid' ? 0.55 : 0.7,
        },
      ];
    };

    const showBlockedFeedback = (reason: string) => {
      cancelAutoMove();
      soundEngine.playWrong();
      pushClickEffect(worldX, worldY, 'blocked');
      setUnreachableNotice(reason);
    };

    // -------------------------------------------------------------------------
    // A. Check if Player Clicked an NPC (live sprite hitbox or live NPC tile)
    // -------------------------------------------------------------------------
    const clickedNpc = map.npcs.find((npc) => {
      const live = getNpcLiveTileAndCenter(npc);
      if (live.tx === clickTx && live.ty === clickTy) return true;
      const nx = live.cx - TILE_SIZE * 0.5;
      const ny = live.cy - TILE_SIZE * 0.5;
      return (
        worldX >= nx - 6 &&
        worldX <= nx + TILE_SIZE + 6 &&
        worldY >= ny - 16 &&
        worldY <= ny + TILE_SIZE + 8
      );
    });

    if (clickedNpc) {
      const liveNpc = getNpcLiveTileAndCenter(clickedNpc);
      const currentDist = Math.hypot(sim.px - liveNpc.cx, sim.py - liveNpc.cy);

      // If already within interaction distance, open NPC dialogue immediately!
      if (currentDist < 72) {
        cancelAutoMove();
        pushClickEffect(liveNpc.cx, liveNpc.cy, 'valid');
        executePendingArrivalAction({ kind: 'npc', npc: clickedNpc });
        return;
      }

      const candidates = getInteractionNeighborTiles(liveNpc.tx, liveNpc.ty);
      const found = findBestPathToTargetCandidates(
        p.mapId,
        startTx,
        startTy,
        candidates,
        clickCollisionOpts
      );
      if (!found) {
        showBlockedFeedback(`Laluan ke ${clickedNpc.name} terhalang.`);
        return;
      }

      setUnreachableNotice(null);
      pushClickEffect(liveNpc.cx, liveNpc.cy, 'valid');
      const finalPath = prependSafeStartIfNeeded(found.path);
      if (finalPath.length === 0) {
        cancelAutoMove();
        executePendingArrivalAction({ kind: 'npc', npc: clickedNpc });
      } else {
        assignAutoPath(finalPath, found.destination, { kind: 'npc', npc: clickedNpc }, clickSig);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // B. Check if Player Clicked a Door / Portal (or Building Entrance Doorway)
    // -------------------------------------------------------------------------
    let clickedPortal: MapPortal | undefined = map.portals.find(
      (pt) =>
        clickTx >= pt.tileX &&
        clickTx < pt.tileX + pt.widthTiles &&
        clickTy >= pt.tileY &&
        clickTy < pt.tileY + pt.heightTiles
    );

    // Also allow clicking directly on the visual doorway of a building that has an attached portal
    if (!clickedPortal) {
      const clickedBuilding = map.buildings.find(
        (b) =>
          clickTx >= b.tileX &&
          clickTx < b.tileX + b.widthTiles &&
          clickTy >= b.tileY &&
          clickTy < b.tileY + b.heightTiles
      );
      if (clickedBuilding) {
        clickedPortal = map.portals.find((pt) => {
          const horizOverlap =
            pt.tileX < clickedBuilding.tileX + clickedBuilding.widthTiles &&
            pt.tileX + pt.widthTiles > clickedBuilding.tileX;
          const vertAdjacent =
            pt.tileY === clickedBuilding.tileY + clickedBuilding.heightTiles ||
            pt.tileY + pt.heightTiles === clickedBuilding.tileY;
          return horizOverlap && vertAdjacent;
        });
      }
    }

    if (clickedPortal) {
      const portalCx = (clickedPortal.tileX + clickedPortal.widthTiles * 0.5) * TILE_SIZE;
      const portalCy = (clickedPortal.tileY + clickedPortal.heightTiles * 0.5) * TILE_SIZE;
      const currentDist = Math.hypot(sim.px - portalCx, sim.py - portalCy);

      if (currentDist < 68) {
        cancelAutoMove();
        pushClickEffect(portalCx, portalCy, 'valid');
        executePendingArrivalAction({ kind: 'portal', portal: clickedPortal });
        return;
      }

      const portalTiles = getPortalCandidateTiles(clickedPortal);
      const found = findBestPathToTargetCandidates(
        p.mapId,
        startTx,
        startTy,
        portalTiles,
        clickCollisionOpts
      );
      if (!found) {
        showBlockedFeedback('Laluan ke pintu tersebut tidak dapat dicapai.');
        return;
      }

      setUnreachableNotice(null);
      pushClickEffect(portalCx, portalCy, 'valid');
      const finalPath = prependSafeStartIfNeeded(found.path);
      if (finalPath.length === 0) {
        cancelAutoMove();
        executePendingArrivalAction({ kind: 'portal', portal: clickedPortal });
      } else {
        assignAutoPath(
          finalPath,
          found.destination,
          { kind: 'portal', portal: clickedPortal },
          clickSig
        );
      }
      return;
    }

    // -------------------------------------------------------------------------
    // C. Check if Player Clicked a Quest Object, Signpost, or Interactive Prop
    // -------------------------------------------------------------------------
    const qObjects = getMapQuestObjects(p.mapId);
    const clickedQuest = qObjects.find((q) => q.tileX === clickTx && q.tileY === clickTy);
    if (clickedQuest) {
      const qCx = (clickedQuest.tileX + 0.5) * TILE_SIZE;
      const qCy = (clickedQuest.tileY + 0.5) * TILE_SIZE;
      if (Math.hypot(sim.px - qCx, sim.py - qCy) < 72) {
        cancelAutoMove();
        pushClickEffect(qCx, qCy, 'valid');
        executePendingArrivalAction({ kind: 'question', question: clickedQuest });
        return;
      }
      const found = findBestPathToTargetCandidates(
        p.mapId,
        startTx,
        startTy,
        getInteractionNeighborTiles(clickedQuest.tileX, clickedQuest.tileY),
        clickCollisionOpts
      );
      if (!found) {
        showBlockedFeedback('Objek siasatan tidak dapat dicapai dari sini.');
        return;
      }
      setUnreachableNotice(null);
      pushClickEffect(qCx, qCy, 'valid');
      const finalPath = prependSafeStartIfNeeded(found.path);
      assignAutoPath(
        finalPath.length > 0 ? finalPath : [found.destination],
        found.destination,
        { kind: 'question', question: clickedQuest },
        clickSig
      );
      return;
    }

    const clickedSign = map.signs.find((s) => s.tileX === clickTx && s.tileY === clickTy);
    if (clickedSign) {
      const sCx = (clickedSign.tileX + 0.5) * TILE_SIZE;
      const sCy = (clickedSign.tileY + 0.5) * TILE_SIZE;
      if (Math.hypot(sim.px - sCx, sim.py - sCy) < 72) {
        cancelAutoMove();
        pushClickEffect(sCx, sCy, 'valid');
        executePendingArrivalAction({ kind: 'sign', sign: clickedSign });
        return;
      }
      const found = findBestPathToTargetCandidates(
        p.mapId,
        startTx,
        startTy,
        getInteractionNeighborTiles(clickedSign.tileX, clickedSign.tileY),
        clickCollisionOpts
      );
      if (!found) {
        showBlockedFeedback('Papan tanda tidak dapat dicapai.');
        return;
      }
      setUnreachableNotice(null);
      pushClickEffect(sCx, sCy, 'valid');
      const finalPath = prependSafeStartIfNeeded(found.path);
      assignAutoPath(
        finalPath.length > 0 ? finalPath : [found.destination],
        found.destination,
        { kind: 'sign', sign: clickedSign },
        clickSig
      );
      return;
    }

    const clickedProp = map.props.find((pr) => {
      if (
        pr.kind === 'hidden_magic_book' &&
        pr.hiddenBookId &&
        p.foundHiddenBooks[pr.hiddenBookId]
      ) {
        return false;
      }
      return pr.tileX === clickTx && pr.tileY === clickTy;
    });
    if (clickedProp) {
      const prCx = (clickedProp.tileX + 0.5) * TILE_SIZE;
      const prCy = (clickedProp.tileY + 0.5) * TILE_SIZE;
      if (Math.hypot(sim.px - prCx, sim.py - prCy) < 72) {
        cancelAutoMove();
        pushClickEffect(prCx, prCy, 'valid');
        executePendingArrivalAction({ kind: 'prop', prop: clickedProp });
        return;
      }
      const found = findBestPathToTargetCandidates(
        p.mapId,
        startTx,
        startTy,
        getInteractionNeighborTiles(clickedProp.tileX, clickedProp.tileY),
        clickCollisionOpts
      );
      if (!found) {
        showBlockedFeedback('Objek ini tidak dapat dicapai.');
        return;
      }
      setUnreachableNotice(null);
      pushClickEffect(prCx, prCy, 'valid');
      const finalPath = prependSafeStartIfNeeded(found.path);
      assignAutoPath(
        finalPath.length > 0 ? finalPath : [found.destination],
        found.destination,
        { kind: 'prop', prop: clickedProp },
        clickSig
      );
      return;
    }

    // -------------------------------------------------------------------------
    // D. Standard Ground Tile Click: Check Solid Obstacles & Compute A* Path
    // -------------------------------------------------------------------------
    if (isTileSolid(p.mapId, clickTx, clickTy, clickCollisionOpts)) {
      const inWater = map.waterRects.some(
        (w) => clickTx >= w.x && clickTx < w.x + w.w && clickTy >= w.y && clickTy < w.y + w.h
      );
      const inBuilding = map.buildings.some(
        (b) =>
          clickTx >= b.tileX &&
          clickTx < b.tileX + b.widthTiles &&
          clickTy >= b.tileY &&
          clickTy < b.tileY + b.heightTiles
      );
      if (inWater) {
        showBlockedFeedback('Tidak boleh menyeberangi air atau sungai tanpa jambatan.');
      } else if (inBuilding) {
        showBlockedFeedback('Kawasan bangunan pepejal — sila tekan laluan atau pintu masuk.');
      } else {
        showBlockedFeedback('Destinasi terhalang oleh objek pepejal.');
      }
      return;
    }

    const path = findPathAStar(p.mapId, startTx, startTy, clickTx, clickTy, clickCollisionOpts);
    if (path === null) {
      showBlockedFeedback('Destinasi tidak boleh dicapai dari kedudukan semasa.');
      return;
    }

    setUnreachableNotice(null);
    const destCenterX = (clickTx + 0.5) * TILE_SIZE;
    const destCenterY = (clickTy + 0.5) * TILE_SIZE;
    pushClickEffect(destCenterX, destCenterY, 'valid');

    const finalPath = prependSafeStartIfNeeded(path);
    if (finalPath.length === 0) {
      // Clicked the current tile — walk smoothly to tile center
      assignAutoPath(
        [{ tx: clickTx, ty: clickTy }],
        { tx: clickTx, ty: clickTy },
        { kind: 'none' },
        clickSig
      );
      return;
    }

    assignAutoPath(finalPath, { tx: clickTx, ty: clickTy }, { kind: 'none' }, clickSig);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let prevTime = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();

    const ro =
      typeof ResizeObserver !== 'undefined' && canvas.parentElement
        ? new ResizeObserver(resize)
        : null;
    if (ro && canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    window.visualViewport?.addEventListener('resize', resize);

    const HITBOX_HALF_W = 12;
    const HITBOX_TOP_OFF = -6;
    const HITBOX_BOT_OFF = 12;

    const getHitboxCorners = (cx: number, cy: number): [number, number][] => [
      [cx - HITBOX_HALF_W, cy + HITBOX_TOP_OFF],
      [cx + HITBOX_HALF_W, cy + HITBOX_TOP_OFF],
      [cx - HITBOX_HALF_W, cy + HITBOX_BOT_OFF],
      [cx + HITBOX_HALF_W, cy + HITBOX_BOT_OFF],
    ];

    /**
     * Checks if avatar hitbox at `(cx, cy)` is free of solid tiles.
     * If `fromX, fromY` is provided and already slightly overlaps a newly-moved dynamic tile,
     * permits movement that strictly moves AWAY from that overlapping solid tile so the
     * avatar can never become trapped inside a collision boundary.
     */
    const canMoveTo = (
      mId: MapId,
      cx: number,
      cy: number,
      collisionOpts?: DynamicTileCollisionOptions,
      fromX?: number,
      fromY?: number
    ): boolean => {
      const corners = getHitboxCorners(cx, cy);
      let prevSolidTiles: Set<number> | null = null;
      const mapCols = WORLD_MAPS[mId]?.cols ?? 32;

      for (let i = 0; i < corners.length; i++) {
        const [x, y] = corners[i];
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);
        if (!isTileSolid(mId, tx, ty, collisionOpts)) continue;

        if (fromX !== undefined && fromY !== undefined) {
          if (!prevSolidTiles) {
            prevSolidTiles = new Set<number>();
            const prevCorners = getHitboxCorners(fromX, fromY);
            for (let j = 0; j < prevCorners.length; j++) {
              const ptx = Math.floor(prevCorners[j][0] / TILE_SIZE);
              const pty = Math.floor(prevCorners[j][1] / TILE_SIZE);
              if (isTileSolid(mId, ptx, pty, collisionOpts)) {
                prevSolidTiles.add(packTileKey(mapCols, ptx, pty));
              }
            }
          }

          const key = packTileKey(mapCols, tx, ty);
          if (prevSolidTiles.has(key)) {
            const solidCenterX = (tx + 0.5) * TILE_SIZE;
            const solidCenterY = (ty + 0.5) * TILE_SIZE;
            const prevDist = Math.hypot(fromX - solidCenterX, fromY - solidCenterY);
            const nextDist = Math.hypot(cx - solidCenterX, cy - solidCenterY);
            if (nextDist > prevDist + 1e-4) {
              continue;
            }
          }
        }

        return false;
      }
      return true;
    };

    const drawBuilding = (b: BuildingLandmark, totalCrystals: number, animFrame: number) => {
      const bx = b.tileX * TILE_SIZE;
      const by = b.tileY * TILE_SIZE;
      const bw = b.widthTiles * TILE_SIZE;
      const bh = b.heightTiles * TILE_SIZE;

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = 'rgba(15, 10, 35, 0.32)';
      ctx.fillRect(bx + 6, by + bh - 6, bw, 10);

      if (b.style === 'castle') {
        ctx.fillStyle = '#e2d9f3';
        ctx.fillRect(bx + 8, by + 44, 62, bh - 44);
        ctx.fillRect(bx + bw - 70, by + 44, 62, bh - 44);
        ctx.fillStyle = '#f5f0ff';
        ctx.fillRect(bx + 54, by + 56, bw - 108, bh - 56);

        const drawConeRoof = (rx: number, ry: number, rw: number, rh: number, col: string) => {
          ctx.fillStyle = col;
          for (let step = 0; step < 8; step++) {
            const frac = step / 8;
            const w = rw * (1 - frac * 0.82);
            ctx.fillRect(rx + (rw - w) / 2, ry + rh - ((step + 1) * rh) / 8, w, rh / 8 + 2);
          }
          ctx.fillStyle = '#78350f';
          ctx.fillRect(rx + rw / 2 - 2, ry - 16, 4, 18);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(rx + rw / 2 + 2, ry - 16, 14, 9);
        };

        drawConeRoof(bx + 2, by + 8, 74, 42, '#2563eb');
        drawConeRoof(bx + bw - 76, by + 8, 74, 42, '#2563eb');
        drawConeRoof(bx + bw / 2 - 60, by + 2, 120, 56, '#7e22ce');

        drawCrystalSprite(ctx, bx + bw / 2 - 20, by + 38, 2.5, totalCrystals > 0, animFrame);

        // Golden Gate Door
        ctx.fillStyle = '#78350f';
        ctx.fillRect(bx + bw / 2 - 36, by + bh - 68, 72, 68);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bx + bw / 2 - 28, by + bh - 60, 56, 60);

        ctx.fillStyle = '#3b1d0e';
        ctx.fillRect(bx + bw / 2 - 108, by + bh - 98, 216, 28);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(bx + bw / 2 - 105, by + bh - 95, 210, 22);
        ctx.fillStyle = '#291509';
        ctx.font = '700 14px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ISTANA KRISTAL KATA', bx + bw / 2, by + bh - 79);
      } else if (b.style === 'pasar') {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(bx + 8, by + 56, bw - 16, bh - 56);
        const stripes = 10;
        const sw = bw / stripes;
        for (let i = 0; i < stripes; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#fffbeb';
          ctx.fillRect(bx + i * sw, by + 18, sw + 1, 42);
        }
        ctx.fillStyle = '#3b1d0e';
        ctx.fillRect(bx + 16, by + 62, bw - 32, 28);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(bx + 19, by + 65, bw - 38, 22);
        ctx.fillStyle = '#291509';
        ctx.font = '700 13px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.title, bx + bw / 2, by + 81);
      } else if (b.style === 'media') {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(bx + 14, by + 54, bw - 28, bh - 54);
        ctx.fillStyle = '#1d4ed8';
        for (let r = 0; r < 5; r++) {
          ctx.fillRect(bx + r * 6, by + 12 + r * 10, bw - r * 12, 12);
        }
        ctx.fillStyle = '#451a03';
        ctx.fillRect(bx + bw / 2 - 24, by + 62, 48, 48);
        ctx.fillStyle = '#fef9c3';
        ctx.fillRect(bx + bw / 2 - 20, by + 66, 40, 40);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx + bw / 2 - 2, by + 72, 4, 16);
        ctx.fillRect(bx + bw / 2 - 2, by + 84, 12, 4);

        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(bx + bw / 2 - 96, by + bh - 36, 192, 26);
        ctx.fillStyle = '#fde047';
        ctx.font = '700 13px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MENARA MEDIA', bx + bw / 2, by + bh - 18);
      } else if (b.style === 'village_house') {
        ctx.fillStyle = '#b46521';
        ctx.fillRect(bx + 10, by + 54, bw - 20, bh - 54);
        ctx.fillStyle = '#dc2626';
        for (let r = 0; r < 4; r++) {
          ctx.fillRect(bx + r * 5, by + 18 + r * 10, bw - r * 10, 12);
        }
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(bx + 26, by + 76, 28, 28);
        ctx.fillStyle = '#5c2d16';
        ctx.fillRect(bx + bw - 64, by + bh - 48, 36, 48);
      } else if (b.style === 'pondok') {
        ctx.fillStyle = '#9a5825';
        ctx.fillRect(bx + 14, by + 44, bw - 28, bh - 44);
        ctx.fillStyle = '#be185d';
        for (let r = 0; r < 4; r++) {
          ctx.fillRect(bx + r * 6, by + 12 + r * 9, bw - r * 12, 11);
        }
        ctx.fillStyle = '#fef3c7';
        ctx.font = '700 12px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.title, bx + bw / 2, by + bh - 12);
      } else if (b.style === 'fortress_gate') {
        const unlocked = totalCrystals >= 30;
        ctx.fillStyle = '#475569';
        ctx.fillRect(bx + 4, by + 8, bw - 8, bh - 8);
        ctx.fillStyle = unlocked ? '#fde047' : '#312e81';
        ctx.fillRect(bx + bw / 2 - 36, by + 28, 72, bh - 28);
        drawCrystalSprite(ctx, bx + bw / 2 - 16, by + 4, 2, true, animFrame, true);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 12px "Pixelify Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          unlocked ? 'PINTU KRISTAL TERBUKA!' : 'PINTU KRISTAL UTAMA',
          bx + bw / 2,
          by + bh - 8
        );
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      const rawDt = (now - prevTime) / 1000;
      prevTime = now;
      const dt = Math.min(rawDt, 0.05);

      const p = propsRef.current;
      const sim = simRef.current;
      const map = WORLD_MAPS[p.mapId];
      sim.tickCount++;

      sim.worldTimer += dt;
      if (sim.worldTimer >= 0.3) {
        sim.worldTimer = 0;
        sim.worldFrame = (sim.worldFrame + 1) % 4;
      }

      // Advance click visual ripples
      if (sim.clickEffects.length > 0) {
        sim.clickEffects = sim.clickEffects
          .map((fx) => ({ ...fx, elapsed: fx.elapsed + dt }))
          .filter((fx) => fx.elapsed < fx.duration);
      }

      const qObjects = getMapQuestObjects(p.mapId);

      // 0A. Sync & Update Dynamic NPC Patrols (so map entities can change position smoothly)
      const isTileReservedByStaticInteractive = (tx: number, ty: number): boolean => {
        if (
          map.portals.some(
            (pt) =>
              tx >= pt.tileX &&
              tx < pt.tileX + pt.widthTiles &&
              ty >= pt.tileY &&
              ty < pt.tileY + pt.heightTiles
          )
        ) {
          return true;
        }
        if (map.signs.some((s) => s.tileX === tx && s.tileY === ty)) return true;
        if (qObjects.some((q) => q.tileX === tx && q.tileY === ty)) return true;
        if (
          map.props.some((pr) => {
            if (
              pr.kind === 'hidden_magic_book' &&
              pr.hiddenBookId &&
              p.foundHiddenBooks[pr.hiddenBookId]
            ) {
              return false;
            }
            return pr.tileX === tx && pr.tileY === ty;
          })
        ) {
          return true;
        }
        return false;
      };

      const npcPatrolDirs: ReadonlyArray<{ dx: number; dy: number }> = [
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: -1 },
      ];

      for (let nIdx = 0; nIdx < map.npcs.length; nIdx++) {
        const npc = map.npcs[nIdx];
        let st = sim.npcStates.get(npc.id);
        if (!st) {
          st = {
            id: npc.id,
            homeTx: npc.tileX,
            homeTy: npc.tileY,
            tx: npc.tileX,
            ty: npc.tileY,
            nextTx: npc.tileX,
            nextTy: npc.tileY,
            wx: npc.tileX * TILE_SIZE,
            wy: npc.tileY * TILE_SIZE,
            stepping: false,
            pauseTimer: 2.4 + (nIdx % 3),
            patrolStepIndex: nIdx,
          };
          sim.npcStates.set(npc.id, st);
        } else if (st.homeTx !== npc.tileX || st.homeTy !== npc.tileY) {
          // External map definition / prop position update
          st.homeTx = npc.tileX;
          st.homeTy = npc.tileY;
          st.tx = npc.tileX;
          st.ty = npc.tileY;
          st.nextTx = npc.tileX;
          st.nextTy = npc.tileY;
          st.wx = npc.tileX * TILE_SIZE;
          st.wy = npc.tileY * TILE_SIZE;
          st.stepping = false;
        }

        if (p.isPausedOrModalOpen) continue;

        if (st.stepping) {
          const destWx = st.nextTx * TILE_SIZE;
          const destWy = st.nextTy * TILE_SIZE;
          const nextCenterX = destWx + TILE_SIZE * 0.5;
          const nextCenterY = destWy + TILE_SIZE * 0.5;

          // Politely yield back if the player manually walked into the NPC's target tile
          if (Math.hypot(sim.px - nextCenterX, sim.py - nextCenterY) < 38) {
            st.nextTx = st.tx;
            st.nextTy = st.ty;
          }

          const targetWx = st.nextTx * TILE_SIZE;
          const targetWy = st.nextTy * TILE_SIZE;
          const ndx = targetWx - st.wx;
          const ndy = targetWy - st.wy;
          const nDist = Math.hypot(ndx, ndy);
          const npcSpeed = 62;

          if (nDist <= npcSpeed * dt) {
            st.wx = targetWx;
            st.wy = targetWy;
            st.tx = st.nextTx;
            st.ty = st.nextTy;
            st.stepping = false;
            st.pauseTimer = 2.8 + ((st.patrolStepIndex * 7) % 3) * 0.8;
          } else {
            st.wx += (ndx / nDist) * npcSpeed * dt;
            st.wy += (ndy / nDist) * npcSpeed * dt;
          }
        } else if (!npc.isMentor) {
          // Gentle patrol for non-mentor townsfolk, guards, and trainees
          const npcCx = st.wx + TILE_SIZE * 0.5;
          const npcCy = st.wy + TILE_SIZE * 0.5;
          const distToPlayer = Math.hypot(sim.px - npcCx, sim.py - npcCy);
          const isBeingApproached =
            sim.autoPending.kind === 'npc' &&
            sim.autoPending.npc.id === npc.id &&
            distToPlayer < 135;

          if (distToPlayer >= 88 && !isBeingApproached) {
            st.pauseTimer -= dt;
            if (st.pauseTimer <= 0) {
              st.pauseTimer = 2.6;
              const playerTx = Math.floor(sim.px / TILE_SIZE);
              const playerTy = Math.floor(sim.py / TILE_SIZE);

              for (let tryIdx = 0; tryIdx < 4; tryIdx++) {
                const d = npcPatrolDirs[(st.patrolStepIndex + tryIdx) % 4];
                const candTx = st.tx + d.dx;
                const candTy = st.ty + d.dy;

                if (Math.abs(candTx - st.homeTx) + Math.abs(candTy - st.homeTy) > 2) continue;
                if (isStaticTerrainOrStructureSolid(p.mapId, candTx, candTy)) continue;
                if (isTileReservedByStaticInteractive(candTx, candTy)) continue;
                if (candTx === playerTx && candTy === playerTy) continue;

                const candCx = (candTx + 0.5) * TILE_SIZE;
                const candCy = (candTy + 0.5) * TILE_SIZE;
                if (Math.hypot(sim.px - candCx, sim.py - candCy) < 58) continue;

                let occupiedByOtherNpc = false;
                for (const other of sim.npcStates.values()) {
                  if (other.id === st.id) continue;
                  if (
                    (other.tx === candTx && other.ty === candTy) ||
                    (other.nextTx === candTx && other.nextTy === candTy)
                  ) {
                    occupiedByOtherNpc = true;
                    break;
                  }
                }
                if (occupiedByOtherNpc) continue;

                st.nextTx = candTx;
                st.nextTy = candTy;
                st.stepping = true;
                st.patrolStepIndex++;
                break;
              }
            }
          }
        }
      }

      // 0B. Build Live Dynamic Collision Snapshot & De-penetrate Any Overlap
      let { options: liveCollisionOpts, signature: liveObstacleSig } =
        buildDynamicCollisionSnapshot(p.mapId, now, true);

      if (!canMoveTo(p.mapId, sim.px, sim.py, liveCollisionOpts)) {
        const curRawTx = Math.floor(sim.px / TILE_SIZE);
        const curRawTy = Math.floor(sim.py / TILE_SIZE);
        const safeTile = resolveNearestWalkableTile(
          p.mapId,
          curRawTx,
          curRawTy,
          liveCollisionOpts,
          2
        );
        if (safeTile) {
          const safeCx = (safeTile.tx + 0.5) * TILE_SIZE;
          const safeCy = (safeTile.ty + 0.5) * TILE_SIZE;
          const escDx = safeCx - sim.px;
          const escDy = safeCy - sim.py;
          const escDist = Math.hypot(escDx, escDy);
          if (escDist > 0.25) {
            const pushStep = Math.min(escDist, 220 * dt);
            sim.px += (escDx / escDist) * pushStep;
            sim.py += (escDy / escDist) * pushStep;
          }
        }
      }

      const reportPlayerTileIfChanged = () => {
        const curTx = Math.floor(sim.px / TILE_SIZE);
        const curTy = Math.floor(sim.py / TILE_SIZE);
        if (curTx !== sim.lastReportedTx || curTy !== sim.lastReportedTy) {
          sim.lastReportedTx = curTx;
          sim.lastReportedTy = curTy;
          p.onPlayerTileChange(curTx, curTy);

          if (map.castleRooms && p.onEnterCastleRoom) {
            const room = map.castleRooms.find(
              (rm) =>
                curTx >= rm.x &&
                curTx < rm.x + rm.w &&
                curTy >= rm.y &&
                curTy < rm.y + rm.h
            );
            if (room && room.roomId !== sim.activeCastleRoom) {
              sim.activeCastleRoom = room.roomId;
              p.onEnterCastleRoom(room.roomId, room.name);
            }
          }
        }
      };

      /**
       * Dynamically recalculates `sim.autoPath` when map obstacles or target entities move,
       * or when anti-stuck recovery avoids a tight edge.
       */
      const replanActiveAutoPath = (
        optsToUse: AStarPathOptions,
        newSig: number,
        preserveIfUnchanged = false
      ): boolean => {
        const rawTx = Math.floor(sim.px / TILE_SIZE);
        const rawTy = Math.floor(sim.py / TILE_SIZE);
        const safeStart =
          resolveNearestWalkableTile(p.mapId, rawTx, rawTy, optsToUse, 2) ?? {
            tx: rawTx,
            ty: rawTy,
          };

        const computeWithOptions = (
          searchOpts: AStarPathOptions
        ): { destination: TileCoord; path: TileCoord[] } | null => {
          const pending = sim.autoPending;
          if (pending.kind === 'npc') {
            const liveNpc = getNpcLiveTileAndCenter(pending.npc);
            return findBestPathToTargetCandidates(
              p.mapId,
              safeStart.tx,
              safeStart.ty,
              getInteractionNeighborTiles(liveNpc.tx, liveNpc.ty),
              searchOpts
            );
          }
          if (pending.kind === 'portal') {
            const livePortal =
              map.portals.find((pt) => pt.id === pending.portal.id) ?? pending.portal;
            return findBestPathToTargetCandidates(
              p.mapId,
              safeStart.tx,
              safeStart.ty,
              getPortalCandidateTiles(livePortal),
              searchOpts
            );
          }
          if (pending.kind === 'question') {
            const liveQ =
              qObjects.find((q) => q.id === pending.question.id) ?? pending.question;
            return findBestPathToTargetCandidates(
              p.mapId,
              safeStart.tx,
              safeStart.ty,
              getInteractionNeighborTiles(liveQ.tileX, liveQ.tileY),
              searchOpts
            );
          }
          if (pending.kind === 'sign') {
            const liveSign = map.signs.find((s) => s.id === pending.sign.id) ?? pending.sign;
            return findBestPathToTargetCandidates(
              p.mapId,
              safeStart.tx,
              safeStart.ty,
              getInteractionNeighborTiles(liveSign.tileX, liveSign.tileY),
              searchOpts
            );
          }
          if (pending.kind === 'prop') {
            const liveProp = map.props.find((pr) => pr.id === pending.prop.id) ?? pending.prop;
            return findBestPathToTargetCandidates(
              p.mapId,
              safeStart.tx,
              safeStart.ty,
              getInteractionNeighborTiles(liveProp.tileX, liveProp.tileY),
              searchOpts
            );
          }

          if (!sim.autoDestTile) return null;
          const direct = findPathAStar(
            p.mapId,
            safeStart.tx,
            safeStart.ty,
            sim.autoDestTile.tx,
            sim.autoDestTile.ty,
            searchOpts
          );
          if (direct !== null) {
            return { destination: sim.autoDestTile, path: direct };
          }
          // If ground destination tile itself just became occupied by a moving NPC, stop right next to it
          return findBestPathToTargetCandidates(
            p.mapId,
            safeStart.tx,
            safeStart.ty,
            getInteractionNeighborTiles(sim.autoDestTile.tx, sim.autoDestTile.ty),
            searchOpts
          );
        };

        let replanned = computeWithOptions(optsToUse);
        if (!replanned && optsToUse.avoidTileKeys && optsToUse.avoidTileKeys.size > 0) {
          // Retry without temporary anti-stuck penalties in case that was the only corridor
          replanned = computeWithOptions({ ...optsToUse, avoidTileKeys: undefined });
        }

        if (!replanned) {
          return false;
        }

        let nextPath = replanned.path;
        if (safeStart.tx !== rawTx || safeStart.ty !== rawTy) {
          if (
            nextPath.length === 0 ||
            nextPath[0].tx !== safeStart.tx ||
            nextPath[0].ty !== safeStart.ty
          ) {
            nextPath = [{ tx: safeStart.tx, ty: safeStart.ty }, ...nextPath];
          }
        }

        if (nextPath.length === 0) {
          const destCx = (replanned.destination.tx + 0.5) * TILE_SIZE;
          const destCy = (replanned.destination.ty + 0.5) * TILE_SIZE;
          if (Math.hypot(destCx - sim.px, destCy - sim.py) > 6) {
            nextPath = [replanned.destination];
          }
        }

        if (preserveIfUnchanged && sim.autoPath.length > 0) {
          const isIdenticalSeq = (a: TileCoord[], b: TileCoord[]) =>
            a.length === b.length &&
            a.every((pt, idx) => pt.tx === b[idx].tx && pt.ty === b[idx].ty);

          const matchesCurrent =
            isIdenticalSeq(nextPath, sim.autoPath) ||
            (sim.autoPath[0].tx === safeStart.tx &&
              sim.autoPath[0].ty === safeStart.ty &&
              isIdenticalSeq(nextPath, sim.autoPath.slice(1)));

          if (matchesCurrent) {
            sim.lastObstacleSignature = newSig;
            sim.lastDynamicReplanAt = now;
            return true;
          }
        }

        // Keep current tile waypoint at head if turning into nextPath[0] still needs current-tile clearance
        if (
          sim.autoPath.length > 0 &&
          sim.autoPath[0].tx === safeStart.tx &&
          sim.autoPath[0].ty === safeStart.ty &&
          nextPath.length > 0 &&
          (nextPath[0].tx !== safeStart.tx || nextPath[0].ty !== safeStart.ty)
        ) {
          const curCx = (safeStart.tx + 0.5) * TILE_SIZE;
          const curCy = (safeStart.ty + 0.5) * TILE_SIZE;
          if (Math.hypot(curCx - sim.px, curCy - sim.py) > 10) {
            nextPath = [{ tx: safeStart.tx, ty: safeStart.ty }, ...nextPath];
          }
        }

        sim.autoPath = nextPath;
        sim.autoDestTile = replanned.destination;
        sim.autoStepStart = 1;
        sim.autoTotalSteps = nextPath.length;
        sim.autoTargetEntityTile = getPendingEntityAnchorTile(sim.autoPending);
        sim.lastObstacleSignature = newSig;
        sim.lastDynamicReplanAt = now;
        return true;
      };

      // 1. Check Manual Movement Input (WASD / Arrows / Touch Joystick)
      let manualDx = 0;
      let manualDy = 0;
      if (!p.isPausedOrModalOpen) {
        if (sim.keys.has('KeyW') || sim.keys.has('ArrowUp')) manualDy -= 1;
        if (sim.keys.has('KeyS') || sim.keys.has('ArrowDown')) manualDy += 1;
        if (sim.keys.has('KeyA') || sim.keys.has('ArrowLeft')) manualDx -= 1;
        if (sim.keys.has('KeyD') || sim.keys.has('ArrowRight')) manualDx += 1;

        if (
          manualDx === 0 &&
          manualDy === 0 &&
          (Math.abs(sim.joyDx) > 0.15 || Math.abs(sim.joyDy) > 0.15)
        ) {
          manualDx = sim.joyDx;
          manualDy = sim.joyDy;
        }
      }

      const manualLen = Math.hypot(manualDx, manualDy);
      const speed = 190;

      if (manualLen > 0.01) {
        // Manual WASD / Joystick overrides & cancels any Click-to-Move path immediately
        if (sim.autoPath.length > 0 || sim.autoDestTile) {
          cancelAutoMove();
        }

        const dx = manualDx / manualLen;
        const dy = manualDy / manualLen;
        sim.moving = true;

        if (Math.abs(dx) > Math.abs(dy)) {
          sim.dir = dx < 0 ? 'left' : 'right';
        } else {
          sim.dir = dy < 0 ? 'up' : 'down';
        }

        const stepDist = speed * dt;
        const nextX = sim.px + dx * stepDist;
        const nextY = sim.py + dy * stepDist;

        const movedX = canMoveTo(p.mapId, nextX, sim.py, liveCollisionOpts, sim.px, sim.py);
        if (movedX) {
          sim.px = nextX;
        } else if (Math.abs(dx) > 0.35 && Math.abs(dy) < 0.28) {
          // Corner-slide assist when walking horizontally past a solid corner edge
          const probe = 14;
          const upClear = canMoveTo(p.mapId, nextX, sim.py - probe, liveCollisionOpts, sim.px, sim.py);
          const downClear = canMoveTo(p.mapId, nextX, sim.py + probe, liveCollisionOpts, sim.px, sim.py);
          if (upClear && !downClear && canMoveTo(p.mapId, sim.px, sim.py - stepDist * 0.78, liveCollisionOpts, sim.px, sim.py)) {
            sim.py -= stepDist * 0.78;
          } else if (downClear && !upClear && canMoveTo(p.mapId, sim.px, sim.py + stepDist * 0.78, liveCollisionOpts, sim.px, sim.py)) {
            sim.py += stepDist * 0.78;
          }
        }

        const movedY = canMoveTo(p.mapId, sim.px, nextY, liveCollisionOpts, sim.px, sim.py);
        if (movedY) {
          sim.py = nextY;
        } else if (Math.abs(dy) > 0.35 && Math.abs(dx) < 0.28) {
          // Corner-slide assist when walking vertically past a solid corner edge
          const probe = 14;
          const leftClear = canMoveTo(p.mapId, sim.px - probe, nextY, liveCollisionOpts, sim.px, sim.py);
          const rightClear = canMoveTo(p.mapId, sim.px + probe, nextY, liveCollisionOpts, sim.px, sim.py);
          if (leftClear && !rightClear && canMoveTo(p.mapId, sim.px - stepDist * 0.78, sim.py, liveCollisionOpts, sim.px, sim.py)) {
            sim.px -= stepDist * 0.78;
          } else if (rightClear && !leftClear && canMoveTo(p.mapId, sim.px + stepDist * 0.78, sim.py, liveCollisionOpts, sim.px, sim.py)) {
            sim.px += stepDist * 0.78;
          }
        }

        sim.walkTimer += dt;
        if (sim.walkTimer >= 0.14) {
          sim.walkTimer = 0;
          sim.walkFrame = (sim.walkFrame + 1) % 4;
        }
        soundEngine.playFootstep();
        reportPlayerTileIfChanged();
      } else if (!p.isPausedOrModalOpen && sim.autoPath.length > 0) {
        // 2. Dynamic Obstacle Check & Real-Time A* Path Update Before Stepping
        const curPlayerTx = Math.floor(sim.px / TILE_SIZE);
        const curPlayerTy = Math.floor(sim.py / TILE_SIZE);

        const liveAnchor = getPendingEntityAnchorTile(sim.autoPending);
        const targetMoved =
          liveAnchor !== null &&
          (sim.autoTargetEntityTile === null ||
            liveAnchor.tx !== sim.autoTargetEntityTile.tx ||
            liveAnchor.ty !== sim.autoTargetEntityTile.ty);

        const pathObstructed = !isPathStillClear(
          p.mapId,
          curPlayerTx,
          curPlayerTy,
          sim.autoPath,
          liveCollisionOpts
        );

        const envChanged =
          liveObstacleSig !== sim.lastObstacleSignature && now - sim.lastDynamicReplanAt >= 120;

        if (targetMoved || pathObstructed || envChanged) {
          const preserveIfSame = !targetMoved && !pathObstructed;
          const ok = replanActiveAutoPath(liveCollisionOpts, liveObstacleSig, preserveIfSame);
          if (!ok) {
            cancelAutoMove();
            setUnreachableNotice('Laluan dikemaskini: destinasi kini terhalang.');
          }
        }

        // 3. Zero-Stuck A* Waypoint Steering with Corridor Centering & Corner-Sliding
        const frameStartPx = sim.px;
        const frameStartPy = sim.py;
        let remainingStep = speed * dt;
        let movedThisFrame = false;

        while (remainingStep > 0.001 && sim.autoPath.length > 0) {
          const wp = sim.autoPath[0];
          const targetX = (wp.tx + 0.5) * TILE_SIZE;
          const targetY = (wp.ty + 0.5) * TILE_SIZE;
          const vDx = targetX - sim.px;
          const vDy = targetY - sim.py;
          const dist = Math.hypot(vDx, vDy);

          if (
            dist <= remainingStep &&
            canMoveTo(p.mapId, targetX, targetY, liveCollisionOpts, sim.px, sim.py)
          ) {
            sim.px = targetX;
            sim.py = targetY;
            movedThisFrame = true;
            remainingStep -= dist;
            sim.autoPath.shift();
            sim.autoStepStart++;

            if (Math.abs(vDx) > 0.5 || Math.abs(vDy) > 0.5) {
              if (Math.abs(vDx) > Math.abs(vDy)) {
                sim.dir = vDx < 0 ? 'left' : 'right';
              } else {
                sim.dir = vDy < 0 ? 'up' : 'down';
              }
            }
            continue;
          }

          const stepLen = Math.min(Math.max(dist, 0.5), remainingStep);
          const ux = dist > 1e-4 ? vDx / dist : 0;
          const uy = dist > 1e-4 ? vDy / dist : 0;

          if (Math.abs(ux) > 0.01 || Math.abs(uy) > 0.01) {
            if (Math.abs(ux) > Math.abs(uy)) {
              sim.dir = ux < 0 ? 'left' : 'right';
            } else {
              sim.dir = uy < 0 ? 'up' : 'down';
            }
          }

          const candX = sim.px + ux * stepLen;
          const candY = sim.py + uy * stepLen;
          let progressed = false;

          if (canMoveTo(p.mapId, candX, candY, liveCollisionOpts, sim.px, sim.py)) {
            sim.px = candX;
            sim.py = candY;
            progressed = true;
          } else {
            // Corner-Clearance & Corridor-Centering Steering:
            // Pulls any off-center hitbox corner smoothly into the current walkable tile center!
            const rawCurTx = Math.floor(sim.px / TILE_SIZE);
            const rawCurTy = Math.floor(sim.py / TILE_SIZE);
            const safeCur =
              resolveNearestWalkableTile(p.mapId, rawCurTx, rawCurTy, liveCollisionOpts, 1) ?? {
                tx: rawCurTx,
                ty: rawCurTy,
              };
            const curCenterX = (safeCur.tx + 0.5) * TILE_SIZE;
            const curCenterY = (safeCur.ty + 0.5) * TILE_SIZE;
            const dxCenter = curCenterX - sim.px;
            const dyCenter = curCenterY - sim.py;

            const slideCandidates: [number, number][] = [];
            if (Math.abs(vDx) > 0.4) {
              slideCandidates.push([
                sim.px + Math.sign(vDx) * Math.min(Math.abs(vDx), remainingStep),
                sim.py,
              ]);
            }
            if (Math.abs(vDy) > 0.4) {
              slideCandidates.push([
                sim.px,
                sim.py + Math.sign(vDy) * Math.min(Math.abs(vDy), remainingStep),
              ]);
            }
            if (Math.abs(dyCenter) > 0.35) {
              slideCandidates.push([
                sim.px,
                sim.py + Math.sign(dyCenter) * Math.min(Math.abs(dyCenter), remainingStep),
              ]);
            }
            if (Math.abs(dxCenter) > 0.35) {
              slideCandidates.push([
                sim.px + Math.sign(dxCenter) * Math.min(Math.abs(dxCenter), remainingStep),
                sim.py,
              ]);
            }
            const centerDist = Math.hypot(dxCenter, dyCenter);
            if (centerDist > 0.35) {
              const cStep = Math.min(centerDist, remainingStep);
              slideCandidates.push([
                sim.px + (dxCenter / centerDist) * cStep,
                sim.py + (dyCenter / centerDist) * cStep,
              ]);
            }

            for (let sIdx = 0; sIdx < slideCandidates.length; sIdx++) {
              const [sx, sy] = slideCandidates[sIdx];
              if (canMoveTo(p.mapId, sx, sy, liveCollisionOpts, sim.px, sim.py)) {
                sim.px = sx;
                sim.py = sy;
                progressed = true;
                break;
              }
            }
          }

          if (progressed) {
            movedThisFrame = true;
          }
          remainingStep = 0;
        }

        // 4. Anti-Stuck Watchdog: If net displacement stalls, mark blocking tile & dynamically reroute!
        const actualMoved = Math.hypot(sim.px - frameStartPx, sim.py - frameStartPy);
        if (sim.autoPath.length > 0) {
          if (actualMoved < 14 * dt) {
            sim.stuckTimer += dt;
            if (sim.stuckTimer >= 0.16) {
              sim.stuckTimer = 0;
              const blockedWp = sim.autoPath[0];
              const curTx = Math.floor(sim.px / TILE_SIZE);
              const curTy = Math.floor(sim.py / TILE_SIZE);
              if (blockedWp && (blockedWp.tx !== curTx || blockedWp.ty !== curTy)) {
                sim.tempAvoidUntil.set(
                  packTileKey(map.cols, blockedWp.tx, blockedWp.ty),
                  now + 1600
                );
              }
              const refreshed = buildDynamicCollisionSnapshot(p.mapId, now, true);
              liveCollisionOpts = refreshed.options;
              liveObstacleSig = refreshed.signature;
              if (!replanActiveAutoPath(liveCollisionOpts, liveObstacleSig)) {
                cancelAutoMove();
                setUnreachableNotice('Laluan terhalang oleh objek — sila pilih arah lain.');
              }
            }
          } else {
            sim.stuckTimer = 0;
          }
        }

        if (movedThisFrame) {
          sim.moving = true;
          sim.walkTimer += dt;
          if (sim.walkTimer >= 0.14) {
            sim.walkTimer = 0;
            sim.walkFrame = (sim.walkFrame + 1) % 4;
          }
          soundEngine.playFootstep();
          reportPlayerTileIfChanged();
        }

        // Check if avatar just arrived at final waypoint!
        if (sim.autoPath.length === 0 && sim.autoPending.kind !== 'none') {
          sim.moving = false;
          sim.walkFrame = sim.worldFrame;
          sim.autoStepStart = 1;
          sim.autoTotalSteps = 0;
          sim.autoDestTile = null;
          sim.autoTargetEntityTile = null;
          const completedAction = sim.autoPending;
          sim.autoPending = { kind: 'none' };
          executePendingArrivalAction(completedAction);
        } else if (sim.autoPath.length === 0 && sim.autoDestTile !== null) {
          sim.moving = false;
          sim.walkFrame = sim.worldFrame;
          sim.autoStepStart = 1;
          sim.autoTotalSteps = 0;
          sim.autoDestTile = null;
        }
      } else {
        sim.moving = false;
        sim.walkFrame = sim.worldFrame;
      }

      // Proximity Detection (using live NPC positions)
      const nextUnansweredInMap = qObjects.find((q) => !p.completedQuestions[q.id]) ?? null;

      let closest: NearbyTarget | null = null;
      let bestDist = 74;

      for (const portal of map.portals) {
        const cx = (portal.tileX + portal.widthTiles * 0.5) * TILE_SIZE;
        const cy = (portal.tileY + portal.heightTiles * 0.5) * TILE_SIZE;
        const d = Math.hypot(sim.px - cx, sim.py - cy);
        if (d < bestDist) {
          bestDist = d;
          closest = { kind: 'portal', portal, label: portal.label };
        }
      }

      for (const npc of map.npcs) {
        const liveNpc = getNpcLiveTileAndCenter(npc);
        const d = Math.hypot(sim.px - liveNpc.cx, sim.py - liveNpc.cy);
        if (d < bestDist) {
          bestDist = d;
          closest = { kind: 'npc', npc, label: `Berbual dengan ${npc.name}` };
        }
      }

      for (const q of qObjects) {
        const cx = (q.tileX + 0.5) * TILE_SIZE;
        const cy = (q.tileY + 0.5) * TILE_SIZE;
        const d = Math.hypot(sim.px - cx, sim.py - cy);
        if (d < bestDist) {
          bestDist = d;
          const isSolved = Boolean(p.completedQuestions[q.id]);
          const isNext = nextUnansweredInMap?.id === q.id;
          closest = {
            kind: 'question',
            question: q,
            isNext,
            isSolved,
            label: isSolved
              ? `Semak Semula: ${q.title}`
              : `Siasat: ${q.objectName} (Soalan ${q.id})`,
          };
        }
      }

      for (const prop of map.props) {
        if (
          prop.kind === 'hidden_magic_book' &&
          prop.hiddenBookId &&
          p.foundHiddenBooks[prop.hiddenBookId]
        ) {
          continue;
        }
        const cx = (prop.tileX + 0.5) * TILE_SIZE;
        const cy = (prop.tileY + 0.5) * TILE_SIZE;
        const d = Math.hypot(sim.px - cx, sim.py - cy);
        if (d < bestDist) {
          bestDist = d;
          closest = { kind: 'prop', prop, label: prop.label };
        }
      }

      for (const sign of map.signs) {
        const cx = (sign.tileX + 0.5) * TILE_SIZE;
        const cy = (sign.tileY + 0.5) * TILE_SIZE;
        const d = Math.hypot(sim.px - cx, sim.py - cy);
        if (d < bestDist) {
          bestDist = d;
          closest = {
            kind: 'sign',
            sign,
            label: sign.isTravelSignpost ? `Papan Arah: Pilih Destinasi` : `Baca: ${sign.title}`,
          };
        }
      }

      if (
        (closest?.label ?? '') !== (sim.nearby?.label ?? '') ||
        (closest?.kind ?? '') !== (sim.nearby?.kind ?? '')
      ) {
        sim.nearby = closest;
        setNearbyPrompt(closest);
      } else {
        sim.nearby = closest;
      }

      // Render World
      const vw = canvas.width;
      const vh = canvas.height;
      const worldW = map.cols * TILE_SIZE;
      const worldH = map.rows * TILE_SIZE;

      let camX = Math.round(sim.px - vw / 2);
      let camY = Math.round(sim.py - vh / 2);
      camX = worldW > vw ? Math.max(0, Math.min(worldW - vw, camX)) : Math.round((worldW - vw) / 2);
      camY = worldH > vh ? Math.max(0, Math.min(worldH - vh, camY)) : Math.round((worldH - vh) / 2);
      sim.camX = camX;
      sim.camY = camY;

      ctx.fillStyle = '#120d24';
      ctx.fillRect(0, 0, vw, vh);

      ctx.save();
      ctx.translate(-camX, -camY);
      ctx.imageSmoothingEnabled = false;

      // 1. Floor / Ground Tiles per Theme
      for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
          const gx = c * TILE_SIZE;
          const gy = r * TILE_SIZE;
          const checker = (r + c) % 2 === 0;

          if (map.theme === 'palace_interior') {
            ctx.fillStyle = checker ? '#fef3c7' : '#fde68a';
            ctx.fillRect(gx, gy, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#e5c158';
            ctx.lineWidth = 1;
            ctx.strokeRect(gx, gy, TILE_SIZE, TILE_SIZE);
          } else if (map.theme === 'library_interior') {
            ctx.fillStyle = checker ? '#5c3419' : '#4e2b14';
            ctx.fillRect(gx, gy, TILE_SIZE, TILE_SIZE);
          } else if (map.theme === 'fortress') {
            ctx.fillStyle = checker ? '#475569' : '#334155';
            ctx.fillRect(gx, gy, TILE_SIZE, TILE_SIZE);
          } else if (map.theme === 'forest') {
            ctx.fillStyle = checker ? '#166534' : '#14532d';
            ctx.fillRect(gx, gy, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = checker ? '#3ca352' : '#35964a';
            ctx.fillRect(gx, gy, TILE_SIZE, TILE_SIZE);
            const hash = (r * 31 + c * 17) % 11;
            if (hash === 2) {
              ctx.fillStyle = map.theme === 'sakura' ? '#fbcfe8' : '#fef08a';
              ctx.fillRect(gx + 20, gy + 20, 6, 6);
            }
          }
        }
      }

      // Room dividers labels inside Istana Dalam
      if (map.castleRooms) {
        map.castleRooms.forEach((rm) => {
          ctx.strokeStyle = 'rgba(124, 45, 18, 0.35)';
          ctx.lineWidth = 4;
          ctx.strokeRect(rm.x * TILE_SIZE, rm.y * TILE_SIZE, rm.w * TILE_SIZE, rm.h * TILE_SIZE);
          ctx.fillStyle = 'rgba(88, 28, 135, 0.78)';
          ctx.fillRect(rm.x * TILE_SIZE + 8, rm.y * TILE_SIZE + 6, 178, 20);
          ctx.fillStyle = '#fde047';
          ctx.font = '700 11px "Pixelify Sans", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(rm.name, rm.x * TILE_SIZE + 14, rm.y * TILE_SIZE + 20);
        });
      }

      // 2. Water, Koi Ponds & Waterfalls
      for (const w of map.waterRects) {
        for (let r = w.y; r < w.y + w.h; r++) {
          for (let c = w.x; c < w.x + w.w; c++) {
            const wx = c * TILE_SIZE;
            const wy = r * TILE_SIZE;
            ctx.fillStyle = w.waterfall ? '#0284c7' : '#0ea5e9';
            ctx.fillRect(wx, wy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#7dd3fc';
            ctx.fillRect(wx + ((sim.worldFrame * 6 + c * 7) % 26), wy + 16, 14, 4);
            if (w.koi && (r + c) % 4 === 0) {
              const koiX = wx + 12 + Math.sin(sim.tickCount * 0.05 + c) * 8;
              ctx.fillStyle = '#f97316';
              ctx.fillRect(koiX, wy + 24, 12, 6);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(koiX + 4, wy + 25, 4, 4);
            }
          }
        }
      }

      // 3. Paths, Bridges, Dirt Roads & Royal Carpets
      for (const pr of map.pathRects) {
        for (let r = pr.y; r < pr.y + pr.h; r++) {
          for (let c = pr.x; c < pr.x + pr.w; c++) {
            const pxTile = c * TILE_SIZE;
            const pyTile = r * TILE_SIZE;
            if (pr.bridge) {
              ctx.fillStyle = '#c27838';
              ctx.fillRect(pxTile, pyTile, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#7c4316';
              ctx.fillRect(pxTile, pyTile + 12, TILE_SIZE, 3);
              ctx.fillRect(pxTile, pyTile + 32, TILE_SIZE, 3);
            } else if (pr.carpet) {
              ctx.fillStyle = map.theme === 'library_interior' ? '#6d28d9' : '#b91c1c';
              ctx.fillRect(pxTile, pyTile, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#facc15';
              if (c === pr.x) ctx.fillRect(pxTile, pyTile, 4, TILE_SIZE);
              if (c === pr.x + pr.w - 1) ctx.fillRect(pxTile + TILE_SIZE - 4, pyTile, 4, TILE_SIZE);
            } else if (pr.dirt) {
              ctx.fillStyle = '#c89d6c';
              ctx.fillRect(pxTile, pyTile, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = '#efe3ce';
              ctx.fillRect(pxTile, pyTile, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#d6c3a5';
              ctx.lineWidth = 2;
              ctx.strokeRect(pxTile + 3, pyTile + 3, 20, 18);
            }
          }
        }
      }

      // 3B. Garis Laluan Berurutan (Ordered Pixel-Art Path Line, Directional Arrows & Step Nodes)
      if (sim.autoPath.length > 0) {
        ctx.save();

        // Build ordered polyline points starting at avatar's feet -> waypoint 1 -> waypoint 2 -> ... -> destination
        const routePts: { x: number; y: number }[] = [{ x: sim.px, y: sim.py + 8 }];
        for (let i = 0; i < sim.autoPath.length; i++) {
          const wp = sim.autoPath[i];
          routePts.push({
            x: wp.tx * TILE_SIZE + TILE_SIZE * 0.5,
            y: wp.ty * TILE_SIZE + TILE_SIZE * 0.5,
          });
        }

        // 1. Subtle Sequential Tile Highlights along every upcoming tile in order
        for (let i = 0; i < sim.autoPath.length; i++) {
          const wp = sim.autoPath[i];
          const isFinal = i === sim.autoPath.length - 1;
          ctx.fillStyle = isFinal
            ? 'rgba(250, 204, 21, 0.24)'
            : i === 0
            ? 'rgba(56, 189, 248, 0.20)'
            : 'rgba(253, 224, 71, 0.11)';
          ctx.fillRect(
            wp.tx * TILE_SIZE + 6,
            wp.ty * TILE_SIZE + 6,
            TILE_SIZE - 12,
            TILE_SIZE - 12
          );
        }

        // 2. Dark Pixel Casing Line (for high contrast over grass, stone, dirt, and carpets)
        ctx.beginPath();
        ctx.moveTo(routePts[0].x, routePts[0].y);
        for (let i = 1; i < routePts.length; i++) {
          ctx.lineTo(routePts[i].x, routePts[i].y);
        }
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = 'rgba(30, 17, 54, 0.9)';
        ctx.lineWidth = 8;
        ctx.stroke();

        // 3. Solid Inner Golden Track Line
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 4. Animated Marching Dash Flow strictly from Avatar -> Destination in sequence
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -(sim.tickCount * 1.4);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);

        // 5. Directional Arrowheads on Each Segment showing exact travel order
        for (let i = 0; i < routePts.length - 1; i++) {
          const a = routePts[i];
          const b = routePts[i + 1];
          const segDx = b.x - a.x;
          const segDy = b.y - a.y;
          const segLen = Math.hypot(segDx, segDy);
          if (segLen < 16) continue;

          const midX = (a.x + b.x) * 0.5;
          const midY = (a.y + b.y) * 0.5;
          const angle = Math.atan2(segDy, segDx);

          ctx.save();
          ctx.translate(midX, midY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(5, 0);
          ctx.lineTo(-4, -5);
          ctx.lineTo(-2, 0);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#1e1b4b';
          ctx.stroke();
          ctx.restore();
        }

        // 6. Ordered Waypoint Nodes (1, 2, 3, ...) along the route
        for (let i = 0; i < sim.autoPath.length; i++) {
          const step = sim.autoPath[i];
          const sx = step.tx * TILE_SIZE + TILE_SIZE * 0.5;
          const sy = step.ty * TILE_SIZE + TILE_SIZE * 0.5;
          const stepOrderNumber = sim.autoStepStart + i;
          const isNextImmediate = i === 0;
          const isFinal = i === sim.autoPath.length - 1;

          // Node pill/box
          const boxW = stepOrderNumber >= 10 ? 18 : 14;
          const boxH = 14;
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(
            Math.round(sx - boxW / 2 - 1),
            Math.round(sy - boxH / 2 - 1),
            boxW + 2,
            boxH + 2
          );
          ctx.fillStyle = isFinal
            ? '#facc15'
            : isNextImmediate
            ? '#38bdf8'
            : '#fef3c7';
          ctx.fillRect(
            Math.round(sx - boxW / 2),
            Math.round(sy - boxH / 2),
            boxW,
            boxH
          );

          ctx.fillStyle = '#1e1b4b';
          ctx.font = '800 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${stepOrderNumber}`, Math.round(sx), Math.round(sy + 0.5));
        }

        // 7. Pulsing Pixel Corner Brackets on Final Destination Tile
        const dest = sim.autoDestTile ?? sim.autoPath[sim.autoPath.length - 1];
        if (dest) {
          const dxPx = dest.tx * TILE_SIZE;
          const dyPx = dest.ty * TILE_SIZE;
          const pulse = sim.worldFrame % 2 === 0 ? 3 : 6;

          ctx.fillStyle = '#fde047';
          const bLen = 11;
          const bThk = 3;
          ctx.fillRect(dxPx + pulse, dyPx + pulse, bLen, bThk);
          ctx.fillRect(dxPx + pulse, dyPx + pulse, bThk, bLen);
          ctx.fillRect(dxPx + TILE_SIZE - pulse - bLen, dyPx + pulse, bLen, bThk);
          ctx.fillRect(dxPx + TILE_SIZE - pulse - bThk, dyPx + pulse, bThk, bLen);
          ctx.fillRect(dxPx + pulse, dyPx + TILE_SIZE - pulse - bThk, bLen, bThk);
          ctx.fillRect(dxPx + pulse, dyPx + TILE_SIZE - pulse - bLen, bThk, bLen);
          ctx.fillRect(
            dxPx + TILE_SIZE - pulse - bLen,
            dyPx + TILE_SIZE - pulse - bThk,
            bLen,
            bThk
          );
          ctx.fillRect(
            dxPx + TILE_SIZE - pulse - bThk,
            dyPx + TILE_SIZE - pulse - bLen,
            bThk,
            bLen
          );
        }

        ctx.restore();
      }

      // 3C. Click Feedback Effects (Valid Gold Ripple vs Blocked Red Pixel Cross)
      for (const fx of sim.clickEffects) {
        const progress = Math.min(1, fx.elapsed / fx.duration);
        const alpha = Math.max(0, 1 - progress);
        if (fx.kind === 'valid') {
          const half = Math.round(8 + progress * 16);
          ctx.strokeStyle = `rgba(253, 224, 71, ${alpha.toFixed(2)})`;
          ctx.lineWidth = 3;
          ctx.strokeRect(
            Math.round(fx.worldX - half),
            Math.round(fx.worldY - half),
            half * 2,
            half * 2
          );
        } else {
          const rx = Math.round(fx.worldX);
          const ry = Math.round(fx.worldY);
          ctx.fillStyle = `rgba(239, 68, 68, ${alpha.toFixed(2)})`;
          for (let k = -3; k <= 3; k++) {
            ctx.fillRect(rx + k * 4 - 2, ry + k * 4 - 2, 5, 5);
            ctx.fillRect(rx + k * 4 - 2, ry - k * 4 - 2, 5, 5);
          }
        }
      }

      // 4. Perimeter Walls
      ctx.fillStyle =
        map.theme === 'palace_interior' || map.theme === 'library_interior'
          ? '#311b59'
          : '#1b3b24';
      ctx.fillRect(0, 0, worldW, TILE_SIZE * 0.65);
      ctx.fillRect(0, 0, TILE_SIZE * 0.65, worldH);
      ctx.fillRect(worldW - TILE_SIZE * 0.65, 0, TILE_SIZE * 0.65, worldH);
      ctx.fillRect(0, worldH - TILE_SIZE * 0.65, worldW, TILE_SIZE * 0.65);

      // 5. Portals / Doors
      for (const portal of map.portals) {
        const pxP = portal.tileX * TILE_SIZE;
        const pyP = portal.tileY * TILE_SIZE;
        const pwP = portal.widthTiles * TILE_SIZE;
        const phP = portal.heightTiles * TILE_SIZE;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.42)';
        ctx.fillRect(pxP + 2, pyP + 2, pwP - 4, phP - 4);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.strokeRect(pxP + 4, pyP + 4, pwP - 8, phP - 8);
      }

      // 6. Crystal Fountain
      const totalCrystals = Object.keys(p.completedQuestions).length;
      if (map.hasFountain) {
        const fx = map.hasFountain.x * TILE_SIZE;
        const fy = map.hasFountain.y * TILE_SIZE;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(fx + 4, fy + 14, TILE_SIZE * 2 - 8, TILE_SIZE * 2 - 18);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(fx + 12, fy + 22, TILE_SIZE * 2 - 24, TILE_SIZE * 2 - 34);
        drawCrystalSprite(ctx, fx + TILE_SIZE - 14, fy + 2, 1.8, true, sim.worldFrame);
      }

      // 7. Glowing Forest Mushrooms & Floating Library Books
      if (map.mushrooms) {
        map.mushrooms.forEach((m) => {
          const mx = m.x * TILE_SIZE;
          const my = m.y * TILE_SIZE;
          ctx.fillStyle = 'rgba(103, 232, 249, 0.25)';
          ctx.fillRect(mx + 6, my + 8, 36, 34);
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(mx + 20, my + 24, 8, 14);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(mx + 12, my + 14, 24, 12);
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(mx + 16, my + 16, 5, 4);
          ctx.fillRect(mx + 27, my + 17, 5, 4);
        });
      }

      if (map.floatingBooks) {
        map.floatingBooks.forEach((fb, idx) => {
          const bx = fb.x * TILE_SIZE;
          const by = fb.y * TILE_SIZE + Math.sin(sim.tickCount * 0.08 + idx) * 6;
          drawQuestObjectSprite(ctx, 'magic_book', bx + 4, by, 1.2, false, sim.worldFrame);
        });
      }

      // 8. Buildings
      for (const b of map.buildings) {
        drawBuilding(b, totalCrystals, sim.worldFrame);
      }

      // 9. Interactive Environmental Props
      for (const prop of map.props) {
        if (
          prop.kind === 'hidden_magic_book' &&
          prop.hiddenBookId &&
          p.foundHiddenBooks[prop.hiddenBookId]
        ) {
          continue;
        }
        const ox = prop.tileX * TILE_SIZE;
        const oy = prop.tileY * TILE_SIZE;

        if (prop.kind === 'crystal_slot' && prop.crystalQuestionId) {
          const lit = Boolean(p.completedQuestions[prop.crystalQuestionId]);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(ox + 10, oy + 26, 28, 16);
          drawCrystalSprite(ctx, ox + 12, oy + 4, 1.5, lit, sim.worldFrame);
          ctx.fillStyle = lit ? '#0284c7' : '#334155';
          ctx.fillRect(ox + 12, oy + 36, 24, 11);
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${prop.crystalQuestionId}`, ox + 24, oy + 44);
        } else if (prop.kind === 'library_shelf') {
          const catRead = prop.libraryCategory ? Boolean(p.readCategories[prop.libraryCategory]) : false;
          ctx.fillStyle = '#5c2d16';
          ctx.fillRect(ox + 4, oy + 2, 40, 42);
          ['#ef4444', '#3b82f6', '#eab308', '#a855f7'].forEach((col, i) => {
            ctx.fillStyle = col;
            ctx.fillRect(ox + 8 + i * 8, oy + 8, 6, 12);
            ctx.fillRect(ox + 8 + ((i + 1) % 4) * 8, oy + 24, 6, 12);
          });
          if (catRead) {
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(ox + 34, oy + 2, 10, 10);
          }
        } else if (prop.kind === 'hidden_magic_book') {
          ctx.fillStyle = sim.worldFrame % 2 === 0 ? 'rgba(250,204,21,0.45)' : 'rgba(244,114,182,0.4)';
          ctx.fillRect(ox + 4, oy + 4, 40, 40);
          drawQuestObjectSprite(ctx, 'magic_book', ox, oy - 2, 1.4, false, sim.worldFrame);
        } else if (prop.kind === 'bench_note') {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(ox + 4, oy + 18, 40, 20);
          ctx.fillStyle = '#b46521';
          ctx.fillRect(ox + 6, oy + 20, 36, 12);
        } else if (prop.kind === 'word_class_stone') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(ox + 8, oy + 10, 32, 32);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(ox + 18, oy + 18, 12, 12);
        } else if (prop.kind === 'printing_press') {
          drawQuestObjectSprite(ctx, 'machine_sign', ox, oy - 4, 1.5, false, sim.worldFrame);
        } else {
          drawQuestObjectSprite(
            ctx,
            prop.kind === 'world_map_board' ? 'notice_board' : 'magic_book',
            ox,
            oy - 4,
            1.4,
            false,
            sim.worldFrame
          );
        }
      }

      // 10. Trees & Lamps/Torches
      for (const t of map.trees) {
        const tx = t.x * TILE_SIZE;
        const ty = t.y * TILE_SIZE;
        ctx.fillStyle = '#5c2d16';
        ctx.fillRect(tx + 18, ty + 26, 12, 18);
        ctx.fillStyle = t.pink ? '#db2777' : t.giant ? '#064e3b' : '#15803d';
        ctx.fillRect(tx + 2, ty + 2, 44, 28);
        ctx.fillStyle = t.pink ? '#f9a8d4' : t.giant ? '#047857' : '#22c55e';
        ctx.fillRect(tx + 8, ty - 2, 32, 24);
        if (t.fruit) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(tx + 12, ty + 10, 6, 6);
          ctx.fillRect(tx + 28, ty + 14, 6, 6);
        }
      }

      for (const l of map.lamps) {
        const lx = l.x * TILE_SIZE;
        const ly = l.y * TILE_SIZE;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.fillRect(lx + 4, ly - 4, 40, 40);
        ctx.fillStyle = l.torch ? '#78350f' : '#1e293b';
        ctx.fillRect(lx + 20, ly + 16, 8, 26);
        ctx.fillStyle = l.torch && sim.worldFrame % 2 === 0 ? '#f97316' : '#facc15';
        ctx.fillRect(lx + 15, ly + 4, 18, 14);
      }

      // 11. Signs & Travel Signposts
      for (const s of map.signs) {
        drawQuestObjectSprite(
          ctx,
          'signpost',
          s.tileX * TILE_SIZE,
          s.tileY * TILE_SIZE - 4,
          1.5,
          false,
          sim.worldFrame
        );
      }

      // 12. Main 30 Quest Objects
      for (const q of qObjects) {
        const ox = q.tileX * TILE_SIZE;
        const oy = q.tileY * TILE_SIZE;
        const isSolved = Boolean(p.completedQuestions[q.id]);
        const isNext = nextUnansweredInMap?.id === q.id;

        if (isNext) {
          ctx.fillStyle =
            sim.worldFrame % 2 === 0 ? 'rgba(250, 204, 21, 0.44)' : 'rgba(56, 189, 248, 0.35)';
          ctx.fillRect(ox + 2, oy + 6, TILE_SIZE - 4, TILE_SIZE - 6);
        }

        drawQuestObjectSprite(ctx, q.objectKind, ox, oy - 4, 1.5, isSolved, sim.worldFrame);

        ctx.fillStyle = isSolved ? '#059669' : isNext ? '#d97706' : '#312e81';
        ctx.fillRect(ox + 10, oy + 36, 28, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`S${q.id}`, ox + 24, oy + 47);

        if (isNext) {
          const bounce = sim.worldFrame % 2 === 0 ? 0 : -4;
          ctx.fillStyle = '#4a2806';
          ctx.fillRect(ox + 14, oy - 26 + bounce, 20, 20);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(ox + 16, oy - 24 + bounce, 16, 16);
          ctx.fillStyle = '#dc2626';
          ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('!', ox + 24, oy - 11 + bounce);
        }
      }

      // 13. Depth-sorted NPCs + Player
      type DrawableEntity = { y: number; draw: () => void };
      const entities: DrawableEntity[] = [];

      for (const npc of map.npcs) {
        const st = sim.npcStates.get(npc.id);
        const nx = Math.round(st ? st.wx : npc.tileX * TILE_SIZE);
        const ny = Math.round(st ? st.wy : npc.tileY * TILE_SIZE);
        const isNpcWalking = Boolean(st?.stepping);
        entities.push({
          y: ny + TILE_SIZE,
          draw: () => {
            const isClose = sim.nearby?.kind === 'npc' && sim.nearby.npc.id === npc.id;
            const isTargeted =
              sim.autoPending.kind === 'npc' && sim.autoPending.npc.id === npc.id;
            const staggeredFrame =
              (Math.floor(sim.tickCount / (isNpcWalking ? 6 : isClose ? 8 : 12)) +
                npc.tileX * 3 +
                npc.tileY * 5) %
              8;

            if (isTargeted) {
              ctx.strokeStyle = '#fde047';
              ctx.lineWidth = 2;
              ctx.strokeRect(nx + 4, ny + 26, TILE_SIZE - 8, 18);
            }

            drawNpcSprite(
              ctx,
              npc.spriteKind,
              nx,
              ny - 8,
              1.5,
              staggeredFrame,
              isClose || isTargeted ? 'react' : 'idle'
            );
            if (npc.isMentor || isClose || isTargeted) {
              const bounce = sim.worldFrame % 2 === 0 ? 0 : -3;
              ctx.fillStyle = '#1e1b4b';
              ctx.fillRect(nx + 15, ny - 26 + bounce, 18, 18);
              ctx.fillStyle = isClose || isTargeted ? '#fde047' : '#ffffff';
              ctx.fillRect(nx + 17, ny - 24 + bounce, 14, 14);
              ctx.fillStyle = '#dc2626';
              ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('!', nx + 24, ny - 12 + bounce);
            }
            ctx.fillStyle = 'rgba(22, 18, 43, 0.85)';
            ctx.fillRect(nx - 18, ny + 38, 84, 15);
            ctx.fillStyle = '#fef3c7';
            ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name.split(' ').slice(0, 2).join(' '), nx + 24, ny + 49);
          },
        });
      }

      entities.push({
        y: sim.py + 16,
        draw: () => {
          drawAvatarSprite(
            ctx,
            p.avatarId,
            sim.dir,
            sim.moving ? 'walk' : 'idle',
            sim.moving ? sim.walkFrame : sim.worldFrame,
            sim.px - 24,
            sim.py - 32,
            1.5
          );
        },
      });

      entities.sort((a, b) => a.y - b.y);
      entities.forEach((e) => e.draw());

      // 14. Ambient Pixel Butterflies in Taman Sakura!
      if (map.theme === 'sakura') {
        for (let bIdx = 0; bIdx < 5; bIdx++) {
          const bx = 220 + bIdx * 210 + Math.cos(sim.tickCount * 0.03 + bIdx) * 45;
          const by = 180 + (bIdx % 3) * 140 + Math.sin(sim.tickCount * 0.05 + bIdx) * 30;
          const wing = sim.tickCount % 12 < 6 ? 4 : 2;
          ctx.fillStyle = bIdx % 2 === 0 ? '#fde047' : '#f472b6';
          ctx.fillRect(bx - wing, by, wing, 5);
          ctx.fillRect(bx + 2, by, wing, 5);
        }
      }

      ctx.restore();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, []);

  // Touch Virtual Joystick (cancels auto-move immediately when touched)
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0, active: false });

  const updateJoystick = (clientX: number, clientY: number) => {
    cancelAutoMove();
    setArrivedDoorPortal(null);
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy, active: true });
    simRef.current.joyDx = dx / maxR;
    simRef.current.joyDy = dy / maxR;
  };

  const resetJoystick = () => {
    setJoyKnob({ x: 0, y: 0, active: false });
    simRef.current.joyDx = 0;
    simRef.current.joyDy = 0;
  };

  const activeDoorPrompt =
    arrivedDoorPortal ??
    (nearbyPrompt?.kind === 'portal' ? nearbyPrompt.portal : null);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#120d24]">
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        className="block w-full h-full pixelated cursor-pointer touch-none"
      />

      {/* Brief Unreachable Destination Notice */}
      {!isPausedOrModalOpen && unreachableNotice && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3"
        >
          <div className="bg-[#2c1124] border-3 border-[#f87171] px-3.5 py-2 shadow-lg flex items-center gap-2">
            <MapPinOff className="w-4 h-4 text-[#fca5a5] shrink-0" />
            <span className="font-pixel font-bold text-xs sm:text-sm text-[#fee2e2] whitespace-nowrap">
              {unreachableNotice}
            </span>
          </div>
        </div>
      )}

      {/* Door / Portal Arrival "MASUK" Choice Card */}
      {!isPausedOrModalOpen && activeDoorPrompt && (
        <div className="pointer-events-auto absolute bottom-20 left-1/2 -translate-x-1/2 z-25 flex items-center gap-3 px-4 py-2.5 pixel-panel-purple shadow-xl">
          <DoorOpen className="w-5 h-5 text-[#fde047] shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-[#c4b5fd] uppercase tracking-wider">
              Pintu / Laluan Lokasi
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#fff8e7] truncate max-w-[210px] sm:max-w-[300px]">
              {activeDoorPrompt.label}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const targetPortal = activeDoorPrompt;
              setArrivedDoorPortal(null);
              soundEngine.playButtonClick();
              onUsePortal(targetPortal);
            }}
            className="ml-1 px-4 py-1.5 pixel-btn-gold font-pixel font-bold text-xs sm:text-sm whitespace-nowrap cursor-pointer"
          >
            MASUK
          </button>

          {arrivedDoorPortal && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playButtonClick();
                setArrivedDoorPortal(null);
              }}
              aria-label="Batal Masuk"
              className="w-7 h-7 pixel-btn-purple flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Non-Portal Proximity Prompt (NPC, Quest, Sign, Prop) */}
      {!isPausedOrModalOpen && !activeDoorPrompt && nearbyPrompt && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 pixel-panel-purple">
          <span className="px-2 py-0.5 bg-[#facc15] text-[#261505] font-pixel font-bold text-sm">
            E
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#fff8e7] whitespace-nowrap">
            {nearbyPrompt.label}
          </span>
          <button
            type="button"
            onClick={triggerInteraction}
            className="pointer-events-auto ml-1 px-3 py-1 pixel-btn-gold font-pixel font-bold text-xs whitespace-nowrap cursor-pointer"
          >
            INTERAKSI
          </button>
        </div>
      )}

      {!isPausedOrModalOpen && (
        <>
          <div
            ref={joyBaseRef}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (joyKnob.active) updateJoystick(e.clientX, e.clientY);
            }}
            onPointerUp={resetJoystick}
            onPointerCancel={resetJoystick}
            className={`md:hidden absolute ${
              isLandscapePhone ? 'bottom-11 left-3 w-20 h-20' : 'bottom-20 left-4 w-24 h-24'
            } z-20 rounded-full border-4 border-[#f6c445] bg-[#2b1d52]/80 flex items-center justify-center touch-none`}
            aria-label="Kayu Ria Pergerakan"
          >
            <div
              style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
              className={`${
                isLandscapePhone ? 'w-8 h-8' : 'w-10 h-10'
              } rounded-full bg-[#facc15] border-2 border-[#4a2806] shadow-md pointer-events-none`}
            />
          </div>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={triggerInteraction}
            disabled={!nearbyPrompt && !arrivedDoorPortal}
            className={`md:hidden absolute ${
              isLandscapePhone
                ? 'bottom-12 right-3 w-16 h-16 text-xs'
                : 'bottom-22 right-4 w-20 h-20 text-sm'
            } z-20 rounded-full font-pixel font-bold flex flex-col items-center justify-center ${
              nearbyPrompt || arrivedDoorPortal
                ? 'pixel-btn-gold animate-bounce cursor-pointer'
                : 'bg-[#2b1d52]/70 border-3 border-[#64748b] text-[#94a3b8]'
            }`}
          >
            <span className="text-base">{activeDoorPrompt ? '🚪' : '!'}</span>
            <span>{activeDoorPrompt ? 'MASUK' : 'SIASAT'}</span>
          </button>
        </>
      )}
    </div>
  );
};
