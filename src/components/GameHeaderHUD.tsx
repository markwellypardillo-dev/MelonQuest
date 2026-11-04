/**
 * Top HUD Header for MelonQuest.
 * Unified 16-Bit Wood & Brass RPG Status Beam.
 * Strict zero-emoji policy applied.
 */

import React, { useState } from 'react';
import { GameTimeState } from '../game/timeSystem';
import { GardenHudStatus, GardenPlotSlotStatus } from '../game/engine';

export interface EmergencyQuestInfo {
  title: string;
  pestsRemaining: number;
  totalPests: number;
}

interface GameHeaderHUDProps {
  timeState: GameTimeState;
  coins: number;
  gardenStatus?: GardenHudStatus;
  emergencyQuest?: EmergencyQuestInfo | null;
  unlockedBadgesCount?: number;
  onSetTimeSpeed: (speed: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onSleep: () => void;
  onOpenCustomization: () => void;
  onOpenInventory?: () => void;
  inventoryCount?: number;
  onOpenMarketplace: () => void;
  onOpenFishing?: () => void;
  onOpenGuidebook: () => void;
  onOpenProgression?: () => void;
  onPause: () => void;
  onToggleCleanView?: () => void;
  onToggleQuests?: () => void;
  isQuestsOpen?: boolean;
  onFocusPlot?: (plotNumber: 1 | 2 | 3 | 4) => void;
  onTriggerPlotAction?: (plotNumber: 1 | 2 | 3 | 4) => void;
}

export const GameHeaderHUD: React.FC<GameHeaderHUDProps> = ({
  timeState,
  coins,
  gardenStatus,
  emergencyQuest,
  unlockedBadgesCount = 0,
  onSetTimeSpeed,
  onSleep,
  onOpenCustomization,
  onOpenInventory,
  inventoryCount = 0,
  onOpenMarketplace,
  onOpenFishing,
  onOpenGuidebook,
  onOpenProgression,
  onPause,
  onToggleCleanView,
  onToggleQuests,
  isQuestsOpen = false,
  onFocusPlot,
  onTriggerPlotAction,
}) => {
  const [isPlotsDrawerOpen, setIsPlotsDrawerOpen] = useState(false);
  const { hour, minute, day, dayOfWeek, timeSpeed, phase, stamina, maxStamina } = timeState;

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const formattedMin = minute < 10 ? `0${minute}` : minute;
  const formattedTime = `${displayHour}:${formattedMin} ${period}`;

  const renderPhaseIcon = () => {
    switch (phase) {
      case 'dawn':
        return (
          <div className="w-4 h-4 flex items-center justify-center bg-[#d35400] border border-[#f39c12]" title="Dawn">
            <div className="w-2 h-1.5 bg-[#f1c40f]" />
          </div>
        );
      case 'day':
        return (
          <div className="w-4 h-4 flex items-center justify-center bg-[#2980b9] border border-[#f39c12]" title="Daylight">
            <div className="w-2 h-2 bg-[#f1c40f]" />
          </div>
        );
      case 'dusk':
        return (
          <div className="w-4 h-4 flex items-center justify-center bg-[#8e44ad] border border-[#e67e22]" title="Dusk">
            <div className="w-2 h-1.5 bg-[#e74c3c]" />
          </div>
        );
      case 'night':
        return (
          <div className="w-4 h-4 flex items-center justify-center bg-[#0b162c] border border-[#5dade2]" title="Night">
            <div className="w-2 h-2 bg-[#f5f5f5]" />
          </div>
        );
    }
  };

  const staminaPercent = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));

  const getSlotBarColor = (slotPhase: GardenPlotSlotStatus['phase']) => {
    if (slotPhase === 'harvest') return 'bg-[#88d46c]';
    if (slotPhase === 'growing') return 'bg-[#68b54e]';
    if (slotPhase === 'forest_stumps') return 'bg-[#d35400]';
    if (slotPhase === 'forest_trees') return 'bg-[#e67e22]';
    if (slotPhase === 'sow') return 'bg-[#f0c54d]';
    return 'bg-[#8e6822]';
  };

  const getSlotBarWidth = (slot: Pick<GardenPlotSlotStatus, 'phase' | 'stagePercent'>) => {
    if (slot.phase === 'harvest') return 100;
    if (slot.phase === 'growing') return Math.max(6, slot.stagePercent);
    if (slot.phase === 'forest_stumps') return 50;
    if (slot.phase === 'forest_trees') return 20;
    if (slot.phase === 'sow') return 12;
    return 6;
  };

  const unlockedPlots = gardenStatus?.unlockedPlots || [];
  const unlockedCount = gardenStatus?.unlockedCount || unlockedPlots.length || 1;
  const totalPlots = gardenStatus?.totalPlots || 4;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none px-2 sm:px-3 pt-1.5 flex flex-wrap items-center justify-between gap-1.5">
      {/* 1. Left Wood Plate: Calendar, Clock, Speed (1x-6x) & Garden Stage Monitor */}
      <div className="pointer-events-auto pixel-wood-bar px-2.5 py-1 flex flex-wrap items-center gap-2 relative z-50">
        <div className="flex items-center gap-1.5">
          {renderPhaseIcon()}
          <span className="text-[10px] sm:text-[11px] font-pixel font-bold text-[#f0c54d]">
            {dayOfWeek} · DAY {day}
          </span>
          <span className="text-[10px] sm:text-[11px] font-pixel font-bold text-[#fff8e7] bg-[#241306] px-1.5 py-0.5 border border-[#6c4722] tabular-nums">
            {formattedTime}
          </span>
        </div>

        {/* Fast-Forward Speed Selector */}
        <div className="flex items-center gap-1 border-l-2 border-[#6c4722] pl-2">
          {([1, 2, 3, 4, 5, 6] as const).map(speed => (
            <button
              key={speed}
              onClick={() => onSetTimeSpeed(speed)}
              className={`px-1 py-0.5 text-[8px] sm:text-[9px] font-pixel border cursor-pointer ${
                timeSpeed === speed
                  ? 'bg-[#f0c54d] text-[#2a1708] border-[#fff1b8] font-bold'
                  : 'bg-[#2b1809] text-[#d8c29d] border-[#53331b] hover:border-[#a46738] hover:text-white'
              }`}
              aria-label={`Time speed ${speed}x`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Multi-Plot Garden Stage, Woodland Clearing & Time Remaining Monitor + Expand Action Button */}
        {gardenStatus && (
          <div className="relative flex items-center gap-2 border-l-2 border-[#6c4722] pl-2.5">
            <div
              onClick={() => setIsPlotsDrawerOpen(prev => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsPlotsDrawerOpen(prev => !prev);
                }
              }}
              title="Click to expand Purchased Garden Slots Monitor"
              className="flex flex-col w-52 sm:w-56 cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1.5 text-[8px] font-pixel mb-0.5 whitespace-nowrap">
                <span
                  className={
                    gardenStatus.phase === 'harvest'
                      ? 'text-[#88d46c] font-bold'
                      : gardenStatus.phase === 'growing'
                        ? 'text-[#f0c54d] font-bold'
                        : gardenStatus.phase === 'forest_trees' || gardenStatus.phase === 'forest_stumps'
                          ? 'text-[#f39c12] font-bold'
                          : 'text-[#d8c29d]'
                  }
                >
                  {gardenStatus.plotNumber ? `P#${gardenStatus.plotNumber}: ` : ''}
                  {gardenStatus.phase === 'growing'
                    ? `${gardenStatus.stageLabel} ${gardenStatus.stagePercent}%`
                    : gardenStatus.stageLabel}
                </span>
                <span className="text-[#fff8e7] tabular-nums shrink-0">
                  {gardenStatus.timeRemainingText}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-2 bg-[#1c0f05] border border-[#6c4722] group-hover:border-[#f0c54d] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${getSlotBarColor(gardenStatus.phase)}`}
                    style={{
                      width: `${getSlotBarWidth(gardenStatus)}%`,
                    }}
                  />
                </div>
                <span className="text-[7px] font-pixel text-[#88d46c] shrink-0 whitespace-nowrap">
                  {unlockedCount}/{totalPlots} PLOTS
                </span>
              </div>
            </div>

            {/* Dedicated Expand/Action Button to inspect all purchased garden plots */}
            <button
              type="button"
              data-testid="toggle-garden-slots-btn"
              onClick={() => setIsPlotsDrawerOpen(prev => !prev)}
              title={
                isPlotsDrawerOpen
                  ? 'Hide Purchased Garden Slots Monitor'
                  : 'Expand Purchased Garden Slots Monitor (View separate timers per unlocked plot)'
              }
              className={`px-2 py-1 text-[8px] font-pixel border-2 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isPlotsDrawerOpen
                  ? 'bg-[#f0c54d] text-[#241306] border-[#fff8e7] font-bold shadow-[inset_1px_1px_0px_#ffffff]'
                  : 'bg-[#241306] hover:bg-[#38200d] text-[#88d46c] hover:text-[#f0c54d] border-[#8e6822] shadow-[inset_1px_1px_0px_#53331b]'
              }`}
            >
              {isPlotsDrawerOpen ? '[-] SLOTS' : `[+] SLOTS (${unlockedCount})`}
            </button>
          </div>
        )}
      </div>

      {/* 2. Right Wood Plate: Coins, Stamina & Tactile RPG Actions */}
      <div className="pointer-events-auto pixel-wood-bar px-3 py-1 flex items-center gap-2.5">
        {/* Coin Purse */}
        <div className="flex items-center gap-1.5 bg-[#241306] px-2 py-0.5 border border-[#6c4722]">
          <div className="w-3 h-3 bg-[#f0c54d] border border-[#8e6822]" />
          <span className="text-[10px] sm:text-xs font-pixel font-bold text-[#f0c54d] tabular-nums">
            {coins} COINS
          </span>
        </div>

        {/* Stamina Bar */}
        <div className="hidden xl:flex flex-col w-20">
          <div className="flex justify-between text-[7px] font-pixel text-[#f7eed7] mb-0.5">
            <span>STAMINA</span>
            <span className="tabular-nums">{Math.round(stamina)}%</span>
          </div>
          <div className="w-full h-2 bg-[#1c0f05] border border-[#6c4722] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                staminaPercent > 40
                  ? 'bg-[#2ecc71]'
                  : staminaPercent > 20
                  ? 'bg-[#f39c12]'
                  : 'bg-[#e74c3c]'
              }`}
              style={{ width: `${staminaPercent}%` }}
            />
          </div>
        </div>

        {/* Cohesive Wood & Brass Navigation Buttons */}
        <div className="flex items-center gap-1.5 border-l-2 border-[#6c4722] pl-2">
          {onToggleQuests && (
            <button
              onClick={onToggleQuests}
              title="Toggle Quest Log"
              className={`pixel-wood-btn px-2 py-1 text-[9px] font-pixel ${
                isQuestsOpen ? 'text-[#f0c54d]' : ''
              }`}
            >
              QUESTS
            </button>
          )}
          {onToggleCleanView && (
            <button
              onClick={onToggleCleanView}
              title="Clean Field View (Hide UI) [H]"
              className="pixel-wood-btn px-2 py-1 text-[9px] font-pixel text-[#a5d6a7]"
            >
              FIELD
            </button>
          )}
          <button
            onClick={onSleep}
            title="Sleep until 06:00 AM"
            className="pixel-wood-btn px-2 py-1 text-[9px] font-pixel"
          >
            REST
          </button>
          <button
            onClick={onOpenCustomization}
            title="Wardrobe [C]"
            className="pixel-wood-btn px-2 py-1 text-[9px] font-pixel"
          >
            OUTFIT
          </button>
          {onOpenInventory && (
            <button
              onClick={onOpenInventory}
              title="Farmer Inventory, Bait & Pier Fish Bucket [I]"
              className="pixel-wood-btn px-2 py-1 text-[9px] font-pixel text-[#f0c54d]"
            >
              BAG ({inventoryCount})
            </button>
          )}
          <button
            onClick={onOpenMarketplace}
            title="Market Exchange"
            className="pixel-wood-btn px-2 py-1 text-[9px] font-pixel"
          >
            MARKET
          </button>
          {onOpenFishing && (
            <button
              onClick={onOpenFishing}
              title="Southern River Pier · Full-Screen Angling"
              className="pixel-wood-btn px-2 py-1 text-[9px] font-pixel text-[#5dade2] hover:text-[#85c1e9]"
            >
              FISHING
            </button>
          )}
          {onOpenProgression && (
            <button
              onClick={onOpenProgression}
              title="Player Rankings, Collectible Badges & SUS Survey [B]"
              className="pixel-wood-btn px-2 py-1 text-[9px] font-pixel text-[#2ecc71]"
            >
              BADGES {unlockedBadgesCount}/8
            </button>
          )}
          <button
            onClick={onOpenGuidebook}
            title="Field Guidebook [G]"
            className="pixel-wood-btn px-2 py-1 text-[9px] font-pixel text-[#f0c54d]"
          >
            GUIDE
          </button>
          <button
            onClick={onPause}
            title="Pause [ESC]"
            className="px-2 py-1 bg-[#8f2419] hover:bg-[#a82b1e] text-[#fff8e7] border-2 border-[#3c0c0c] shadow-[inset_1px_1px_0px_#d84c37] text-[9px] font-pixel cursor-pointer"
          >
            PAUSE
          </button>
        </div>
      </div>

      {/* 3. Expanded Purchased Garden Slots Progression Drawer (Renders cleanly below HUD bars, zero overlap) */}
      {gardenStatus && isPlotsDrawerOpen && (
        <div className="w-full pointer-events-none flex justify-start">
          <div
            data-testid="garden-slots-drawer"
            className="pointer-events-auto w-[340px] sm:w-[440px] pixel-wood-bar border-2 border-[#f0c54d] bg-[#241306] p-3 shadow-[0_10px_28px_rgba(0,0,0,0.92)] z-50"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b-2 border-[#6c4722] pb-2 mb-2.5">
              <div>
                <div className="font-pixel text-[9px] sm:text-[10px] text-[#f0c54d] font-bold tracking-wider">
                  OWNED GARDEN SLOTS ({unlockedCount}/{totalPlots})
                </div>
                <div className="text-[10px] text-[#d8c29d] font-bold mt-0.5">
                  Separate live timer &amp; stage per purchased plot
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPlotsDrawerOpen(false)}
                className="px-2 py-0.5 bg-[#8f2419] hover:bg-[#a82b1e] text-[#fff8e7] border border-[#f0c54d] font-pixel text-[8px] cursor-pointer"
              >
                [X]
              </button>
            </div>

            {/* Purchased Plot Slots List (Only shows unlocked/purchased plots) */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {unlockedPlots.map((slot) => {
                const isActionReady =
                  slot.phase === 'clear' ||
                  slot.phase === 'sow' ||
                  slot.phase === 'harvest' ||
                  slot.phase === 'forest_trees' ||
                  slot.phase === 'forest_stumps';

                return (
                  <div
                    key={slot.plotNumber}
                    data-testid={`garden-slot-card-${slot.plotNumber}`}
                    className={`p-2 border-2 transition-colors ${
                      slot.isNearest
                        ? 'bg-[#331c0b] border-[#f0c54d]'
                        : 'bg-[#1c0f05] border-[#6c4722] hover:border-[#a46738]'
                    }`}
                  >
                    {/* Row 1: Plot Title + Status Badges + Separate Timer */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.5 bg-[#38200d] border border-[#8e6822] font-pixel text-[8px] text-[#f0c54d] shrink-0">
                          P#{slot.plotNumber}
                        </span>
                        <span className="font-pixel text-[8px] sm:text-[9px] text-[#fff8e7]">
                          {slot.plotTitle.replace(/^Plot #\d+:\s*/i, '')}
                        </span>
                        {slot.isNearest && (
                          <span className="px-1 py-0.5 bg-[#1b5e20] border border-[#88d46c] font-pixel text-[7px] text-[#88d46c] shrink-0">
                            ACTIVE
                          </span>
                        )}
                        {slot.hasEmergency && (
                          <span className="px-1 py-0.5 bg-[#8e1b12] border border-[#f0c54d] font-pixel text-[7px] text-[#ffe135] animate-pulse shrink-0">
                            PESTS!
                          </span>
                        )}
                      </div>

                      {/* Separate Timer / Action Tag Badge */}
                      <span
                        data-testid={`garden-slot-timer-${slot.plotNumber}`}
                        className={`px-1.5 py-0.5 border font-pixel text-[8px] tabular-nums shrink-0 ${
                          slot.phase === 'harvest'
                            ? 'bg-[#1b5e20] text-[#88d46c] border-[#88d46c] font-bold'
                            : slot.phase === 'growing'
                              ? 'bg-[#241306] text-[#f0c54d] border-[#8e6822]'
                              : 'bg-[#38200d] text-[#fff8e7] border-[#a46738]'
                        }`}
                      >
                        {slot.phase === 'growing' ? `NEXT: ${slot.timeRemainingText}` : slot.timeRemainingText}
                      </span>
                    </div>

                    {/* Row 2: Stage Label, Stage %, Total % & Quick Action Buttons */}
                    <div className="flex items-center justify-between gap-2 text-[8px] font-pixel mb-1">
                      <span
                        className={
                          slot.phase === 'harvest'
                            ? 'text-[#88d46c]'
                            : slot.phase === 'growing'
                              ? 'text-[#f0c54d]'
                              : slot.phase === 'forest_trees' || slot.phase === 'forest_stumps'
                                ? 'text-[#f39c12]'
                                : 'text-[#d8c29d]'
                        }
                      >
                        {slot.phase === 'growing'
                          ? `STAGE: ${slot.stageLabel} (${slot.stagePercent}%) · TOTAL ${slot.overallPercent}%`
                          : `STATUS: ${slot.stageLabel}`}
                      </span>
                    </div>

                    {/* Row 3: Progress Bar + Focus / Act Buttons */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-[#120903] border border-[#6c4722] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${getSlotBarColor(slot.phase)}`}
                          style={{ width: `${getSlotBarWidth(slot)}%` }}
                        />
                      </div>

                      {onFocusPlot && !slot.isNearest && (
                        <button
                          type="button"
                          data-testid={`garden-slot-goto-${slot.plotNumber}`}
                          onClick={() => onFocusPlot(slot.plotNumber)}
                          className="px-2 py-0.5 bg-[#2b1809] hover:bg-[#4a2a10] text-[#f0c54d] border border-[#8e6822] font-pixel text-[7px] cursor-pointer shrink-0"
                        >
                          GO TO PLOT
                        </button>
                      )}

                      {slot.isNearest && isActionReady && onTriggerPlotAction && (
                        <button
                          type="button"
                          data-testid={`garden-slot-act-${slot.plotNumber}`}
                          onClick={() => onTriggerPlotAction(slot.plotNumber)}
                          className="px-2 py-0.5 bg-[#1b5e20] hover:bg-[#2e7d32] text-[#fff8e7] border border-[#88d46c] font-pixel text-[7px] cursor-pointer shrink-0"
                        >
                          {slot.timeRemainingText}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer: Progression Summary */}
            <div className="mt-2.5 pt-2 border-t border-[#6c4722] flex items-center justify-between gap-2">
              <span className="text-[10px] text-[#d8c29d] font-bold">
                {unlockedCount < totalPlots
                  ? `${totalPlots - unlockedCount} unpurchased woodland ${
                      totalPlots - unlockedCount === 1 ? 'lot' : 'lots'
                    } hidden until bought`
                  : 'All 4/4 farm plots purchased & unlocked!'}
              </span>
              {unlockedCount < totalPlots && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPlotsDrawerOpen(false);
                    onOpenMarketplace();
                  }}
                  className="px-2 py-1 bg-[#38200d] hover:bg-[#4e2d12] text-[#f0c54d] border border-[#8e6822] font-pixel text-[7px] cursor-pointer shrink-0"
                >
                  BUY DEEDS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Quest Alert Banner */}
      {emergencyQuest && (
        <div className="pointer-events-auto w-full max-w-xl mx-auto mt-1 px-3 py-1.5 bg-[#8e1b12] border-2 border-[#f0c54d] shadow-[0_4px_12px_rgba(0,0,0,0.85)] flex flex-wrap items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#f0c54d] border border-[#ffffff]" />
            <span className="text-[10px] sm:text-xs font-pixel font-bold text-[#ffe135]">
              EMERGENCY: {emergencyQuest.title.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-pixel text-[#ffffff]">
            <span>
              BUGS CLEARED: {emergencyQuest.totalPests - emergencyQuest.pestsRemaining}/{emergencyQuest.totalPests}
            </span>
            <span className="hidden sm:inline bg-[#241306] text-[#88d46c] px-2 py-0.5 border border-[#53331b]">
              [E] Pick Bugs · [F] Bio-Spray
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
