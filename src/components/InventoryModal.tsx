/**
 * Farmer Inventory & Pier Fish Bucket Modal for MelonQuest.
 * Lets the player monitor harvested watermelons, fishing bait, farm supplies,
 * and live fish stored inside the Lakeside Pier Bucket.
 * Maintain strict 16-bit Wood & Parchment HUD theme and zero-emoji discipline.
 */

import React, { useState, useEffect } from 'react';
import {
  EconomySystem,
  InventoryItem,
  PierBucketFish,
} from '../game/economySystem';
import { audio } from '../game/soundEffects';

export type InventoryTab = 'all' | 'melons' | 'bait' | 'bucket';

interface InventoryModalProps {
  economy: EconomySystem;
  initialTab?: InventoryTab;
  onClose: () => void;
  onOpenMarket?: () => void;
  onOpenFishing?: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  economy,
  initialTab = 'all',
  onClose,
  onOpenMarket,
  onOpenFishing,
}) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab);
  const [coins, setCoins] = useState(economy.getCoins());
  const [items, setItems] = useState<InventoryItem[]>(economy.getInventory());
  const [bucketFish, setBucketFish] = useState<PierBucketFish[]>(economy.getPierBucketFish());
  const [equippedBaitId, setEquippedBaitId] = useState<string>(economy.getEquippedBaitId());
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const refreshState = () => {
    setCoins(economy.getCoins());
    setItems(economy.getInventory());
    setBucketFish(economy.getPierBucketFish());
    setEquippedBaitId(economy.getEquippedBaitId());
  };

  useEffect(() => {
    setActiveTab(initialTab);
    refreshState();
  }, [initialTab, economy]);

  const melonItems = items.filter(i => i.category === 'crop');
  const baitItems = items.filter(i => i.category === 'bait' || i.id.includes('bait'));
  const supplyItems = items.filter(i => i.category === 'supply' && !i.id.includes('bait'));
  const sackFishItems = items.filter(i => i.category === 'fish');

  const totalMelons = melonItems.reduce((s, i) => s + i.quantity, 0);
  const totalBaits = baitItems.reduce((s, i) => s + i.quantity, 0);
  const totalBucketFish = bucketFish.length;

  const handleEquipBait = (baitId: string, baitName: string) => {
    audio.playMenuClick();
    economy.setEquippedBaitId(baitId);
    setEquippedBaitId(baitId);
    setStatusNote(`Equipped ${baitName} for your next cast at the River Pier.`);
  };

  const handleMoveFishToSack = (uid: string, name: string) => {
    audio.playItemObtainFanfare();
    economy.transferBucketFishToInventory(uid);
    refreshState();
    setStatusNote(`Moved ${name} from the Pier Bucket into your Field Sack.`);
  };

  const handleMoveAllBucketToSack = () => {
    const count = economy.transferAllBucketToInventory();
    if (count > 0) {
      audio.playItemObtainFanfare();
      refreshState();
      setStatusNote(`Transferred ${count} fish from Pier Bucket to Field Sack.`);
    }
  };

  const handleSellAllBucketFish = () => {
    const res = economy.sellAllBucketFish();
    if (res.count > 0) {
      audio.playItemObtainFanfare();
      refreshState();
      setStatusNote(`Sold ${res.count} fresh fish from the Pier Bucket for +${res.earned}G!`);
    }
  };

  const renderPixelItemIcon = (item: InventoryItem) => {
    if (item.category === 'crop') {
      return (
        <div className="w-8 h-8 bg-[#1b3a1a] border-2 border-[#2e1a0b] flex items-center justify-center shrink-0 relative">
          <div className="w-5 h-4 bg-[#184a1d] border border-[#0b240d] relative">
            <div className="absolute top-0.5 left-0.5 right-0.5 h-1 bg-[#88d46c]" />
            <div className="absolute bottom-0.5 left-0.5 right-0.5 h-1 bg-[#68b54e]" />
          </div>
        </div>
      );
    }
    if (item.category === 'bait' || item.id.includes('bait')) {
      const isCricket = item.id.includes('cricket');
      const isMelonBait = item.id.includes('melon');
      return (
        <div className="w-8 h-8 bg-[#2c1d11] border-2 border-[#2e1a0b] flex items-center justify-center shrink-0 relative">
          {isMelonBait ? (
            <div className="w-4 h-4 bg-[#e74c3c] border-b-2 border-[#2ecc71]" />
          ) : isCricket ? (
            <div className="w-4 h-3 bg-[#784722] border border-[#f0c54d]" />
          ) : (
            <div className="w-5 h-2 bg-[#d98880] border border-[#922b21]" />
          )}
        </div>
      );
    }
    if (item.category === 'fish') {
      return (
        <div className="w-8 h-8 bg-[#102d42] border-2 border-[#2e1a0b] flex items-center justify-center shrink-0">
          <div className="w-5 h-3 bg-[#5dade2] border border-[#1b4f72]" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-[#3d2412] border-2 border-[#2e1a0b] flex items-center justify-center shrink-0">
        <div className="w-4 h-5 bg-[#c7a467] border border-[#784722]" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-odyssey-fade">
      <div className="w-full max-w-2xl pixel-wood-frame p-4 sm:p-5 flex flex-col max-h-[86vh] relative">
        {/* Brass Corner Studs */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-[#f0c54d] border border-[#2e1a0b]" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#f0c54d] border border-[#2e1a0b]" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 bg-[#f0c54d] border border-[#2e1a0b]" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-[#f0c54d] border border-[#2e1a0b]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#2e1a0b] pb-3 mb-3 px-1">
          <div>
            <h2 className="text-xs sm:text-sm font-pixel font-bold text-[#f0c54d] drop-shadow-[2px_2px_0px_#1e1005]">
              FARMER INVENTORY &amp; PIER FISH BUCKET
            </h2>
            <p className="text-xs text-[#f7eed7] opacity-85">
              Harvested Watermelons · Angling Bait · Lakeside Fish Bucket
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-[#241306] px-3 py-1 border-2 border-[#a46738] flex items-center gap-2">
              <div className="w-3 h-3 bg-[#f0c54d] border border-[#8e6822]" />
              <span className="text-xs font-pixel font-bold text-[#f0c54d] tabular-nums">
                {coins}G
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-[#8f2419] hover:bg-[#a82b1e] text-white border-2 border-[#3c0c0c] text-xs font-pixel cursor-pointer"
            >
              [X]
            </button>
          </div>
        </div>

        {/* Summary Counters Strip */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-[#241306] border-2 border-[#6c4722] px-3 py-1.5 flex items-center justify-between">
            <span className="text-[8px] sm:text-[9px] font-pixel text-[#d8c29d]">MELONS</span>
            <span className="text-[10px] sm:text-xs font-pixel font-bold text-[#88d46c] tabular-nums">
              {totalMelons}
            </span>
          </div>
          <div className="bg-[#241306] border-2 border-[#6c4722] px-3 py-1.5 flex items-center justify-between">
            <span className="text-[8px] sm:text-[9px] font-pixel text-[#d8c29d]">BAIT</span>
            <span className="text-[10px] sm:text-xs font-pixel font-bold text-[#f0c54d] tabular-nums">
              {totalBaits}
            </span>
          </div>
          <div className="bg-[#152d3e] border-2 border-[#5dade2] px-3 py-1.5 flex items-center justify-between">
            <span className="text-[8px] sm:text-[9px] font-pixel text-[#aed6f1]">PIER BUCKET</span>
            <span className="text-[10px] sm:text-xs font-pixel font-bold text-[#5dade2] tabular-nums">
              {totalBucketFish} FISH
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {(
            [
              { id: 'all', label: `ALL (${items.length})` },
              { id: 'melons', label: `MELONS (${totalMelons})` },
              { id: 'bait', label: `BAIT (${totalBaits})` },
              { id: 'bucket', label: `BUCKET (${totalBucketFish})` },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                audio.playMenuClick();
                setActiveTab(tab.id);
              }}
              className={`py-2 text-[9px] font-pixel font-bold border-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#f0c54d] text-[#2a1708] border-[#fff1b8]'
                  : 'bg-[#361f0d] text-[#d8c29d] border-[#241306] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Parchment Body */}
        <div className="pixel-parchment p-3.5 flex-1 overflow-y-auto pixel-scroll min-h-0 space-y-3">
          {statusNote && (
            <div className="px-3 py-1.5 bg-[#3d2412] border border-[#2e1a0b] text-[#f0c54d] text-[9px] font-pixel">
              {statusNote}
            </div>
          )}

          {/* SECTION 1: HARVESTED WATERMELONS */}
          {(activeTab === 'all' || activeTab === 'melons') && (
            <div>
              <div className="flex items-center justify-between border-b-2 border-[#bba377] pb-1.5 mb-2">
                <span className="text-[9px] font-pixel font-bold text-[#1b5e20]">
                  HARVESTED WATERMELONS ({totalMelons})
                </span>
                {onOpenMarket && melonItems.length > 0 && (
                  <button
                    onClick={() => {
                      audio.playMenuClick();
                      onClose();
                      onOpenMarket();
                    }}
                    className="px-2.5 py-1 bg-[#2e7d32] hover:bg-[#388e3c] text-white text-[8px] font-pixel border border-[#1b5e20] cursor-pointer"
                  >
                    SELL AT MARKET
                  </button>
                )}
              </div>

              {melonItems.length === 0 ? (
                <div className="py-3 px-3 bg-[#f2e5c7] border border-[#cbb282] text-xs text-[#5a2e0a]">
                  No harvested watermelons in bag yet. Harvest ripe melons (10+ Brix) from the Central Garden.
                </div>
              ) : (
                <div className="space-y-2">
                  {melonItems.map((item, idx) => {
                    const unitVal =
                      item.quality === 'usda_no_1'
                        ? Math.floor(item.value * 1.5)
                        : item.quality === 'choice'
                        ? Math.floor(item.value * 1.15)
                        : item.quality === 'spoiled'
                        ? 0
                        : item.value;
                    return (
                      <div
                        key={`${item.id}-${item.quality || 'std'}-${idx}`}
                        className="p-2.5 bg-[#fffcf5] border-2 border-[#bba377] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          {renderPixelItemIcon(item)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-pixel font-bold text-[#271809]">
                                {item.name}
                              </span>
                              <span className="text-[9px] font-pixel text-[#2e7d32] font-bold">
                                x{item.quantity}
                              </span>
                            </div>
                            <p className="text-xs text-[#4a2e13] leading-snug">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[9px] font-pixel font-bold text-[#2e7d32]">
                            {unitVal}G / EA
                          </div>
                          {item.quality && (
                            <div className="text-[8px] font-pixel text-[#8e6822] uppercase mt-0.5">
                              {item.quality.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: FISHING BAIT POUCH */}
          {(activeTab === 'all' || activeTab === 'bait') && (
            <div>
              <div className="flex items-center justify-between border-b-2 border-[#bba377] pb-1.5 mb-2">
                <span className="text-[9px] font-pixel font-bold text-[#8e6822]">
                  ANGLING BAIT POUCH ({totalBaits})
                </span>
                {onOpenMarket && (
                  <button
                    onClick={() => {
                      audio.playMenuClick();
                      onClose();
                      onOpenMarket();
                    }}
                    className="px-2.5 py-1 bg-[#b85d19] hover:bg-[#d35400] text-white text-[8px] font-pixel border border-[#6e3206] cursor-pointer"
                  >
                    BUY BAIT AT MARKET
                  </button>
                )}
              </div>

              {baitItems.length === 0 ? (
                <div className="py-3 px-3 bg-[#f5e1de] border border-[#922b21] text-xs text-[#78281f] font-bold">
                  Out of fishing bait! Visit Broker Silas at the Marketplace to buy Earthworm, Cricket, or Sweet Melon-Rind Bait.
                </div>
              ) : (
                <div className="space-y-2">
                  {baitItems.map(item => {
                    const isEquipped = equippedBaitId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 border-2 flex items-center justify-between gap-3 ${
                          isEquipped
                            ? 'bg-[#fff9e6] border-[#d4a838]'
                            : 'bg-[#fffcf5] border-[#bba377]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {renderPixelItemIcon(item)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-pixel font-bold text-[#271809]">
                                {item.name}
                              </span>
                              <span className="text-[9px] font-pixel font-bold text-[#b85d19]">
                                x{item.quantity}
                              </span>
                              {isEquipped && (
                                <span className="text-[8px] font-pixel text-[#2e7d32] font-bold">
                                  · ON HOOK
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#4a2e13] leading-snug">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEquipBait(item.id, item.name)}
                          className={`px-3 py-1.5 text-[8px] font-pixel font-bold border-2 shrink-0 cursor-pointer ${
                            isEquipped
                              ? 'bg-[#2e7d32] text-white border-[#1b5e20]'
                              : 'bg-[#361f0d] hover:bg-[#4e2d14] text-[#f0c54d] border-[#241306]'
                          }`}
                        >
                          {isEquipped ? 'EQUIPPED' : 'USE BAIT'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: LAKESIDE PIER FISH BUCKET */}
          {(activeTab === 'all' || activeTab === 'bucket') && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#bba377] pb-1.5 mb-2">
                <span className="text-[9px] font-pixel font-bold text-[#154360]">
                  PIER LIVEWELL FISH BUCKET ({totalBucketFish} STORED)
                </span>
                <div className="flex items-center gap-1.5">
                  {onOpenFishing && (
                    <button
                      onClick={() => {
                        audio.playMenuClick();
                        onClose();
                        onOpenFishing();
                      }}
                      className="px-2.5 py-1 bg-[#2e7d32] hover:bg-[#388e3c] text-white text-[8px] font-pixel border border-[#1b5e20] cursor-pointer"
                    >
                      GO TO PIER &middot; FISH
                    </button>
                  )}
                  {totalBucketFish > 0 && (
                    <>
                      <button
                        onClick={handleMoveAllBucketToSack}
                        className="px-2.5 py-1 bg-[#1f618d] hover:bg-[#2980b9] text-white text-[8px] font-pixel border border-[#154360] cursor-pointer"
                      >
                        MOVE ALL TO SACK
                      </button>
                      <button
                        onClick={handleSellAllBucketFish}
                        className="px-2.5 py-1 bg-[#b85d19] hover:bg-[#d35400] text-white text-[8px] font-pixel border border-[#6e3206] cursor-pointer"
                      >
                        SELL BUCKET FISH
                      </button>
                    </>
                  )}
                </div>
              </div>

              {bucketFish.length === 0 && sackFishItems.length === 0 ? (
                <div className="py-3 px-3 bg-[#eaf2f8] border border-[#85c1e9] text-xs text-[#1b4f72] flex items-center justify-between gap-2">
                  <span>The Lakeside Fish Bucket beside the Southern Pier is currently empty.</span>
                  {onOpenFishing && (
                    <button
                      onClick={() => {
                        audio.playMenuClick();
                        onClose();
                        onOpenFishing();
                      }}
                      className="px-3 py-1 bg-[#154360] hover:bg-[#1f618d] text-white text-[8px] font-pixel border border-[#0b2638] cursor-pointer shrink-0"
                    >
                      GO TO FISHING PIER
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {bucketFish.map(fish => (
                    <div
                      key={fish.uid}
                      className="p-2.5 bg-[#f0f8ff] border-2 border-[#5dade2] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#154360] border-2 border-[#0b2638] flex items-center justify-center shrink-0 relative">
                          <div className="w-5 h-3 bg-[#5dade2] border border-[#aed6f1]" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-pixel font-bold text-[#0b2638]">
                              {fish.name}
                            </span>
                            <span className="text-[8px] font-pixel font-bold text-[#1f618d]">
                              {fish.weightLb} lb · {fish.lengthIn} in · {fish.rarity}
                            </span>
                          </div>
                          <p className="text-xs text-[#2c3e50] leading-snug">
                            Caught on {fish.caughtWithBait} · Value: <strong>{fish.value}G</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleMoveFishToSack(fish.uid, fish.name)}
                        className="px-2.5 py-1.5 bg-[#154360] hover:bg-[#1f618d] text-white text-[8px] font-pixel border border-[#0b2638] shrink-0 cursor-pointer"
                      >
                        TO FIELD SACK
                      </button>
                    </div>
                  ))}

                  {sackFishItems.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-[#fffcf5] border-2 border-[#bba377] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        {renderPixelItemIcon(item)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-pixel font-bold text-[#271809]">
                              {item.name} (In Sack)
                            </span>
                            <span className="text-[9px] font-pixel font-bold text-[#1f618d]">
                              x{item.quantity}
                            </span>
                          </div>
                          <p className="text-xs text-[#4a2e13] leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-pixel font-bold text-[#2e7d32] shrink-0">
                        {item.value}G / EA
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: SEEDS & AGRONOMY SUPPLIES */}
          {activeTab === 'all' && supplyItems.length > 0 && (
            <div>
              <div className="border-b-2 border-[#bba377] pb-1.5 mb-2">
                <span className="text-[9px] font-pixel font-bold text-[#5a2e0a]">
                  SEEDS &amp; AGRONOMY SUPPLIES ({supplyItems.reduce((s, i) => s + i.quantity, 0)})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {supplyItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-[#fffcf5] border-2 border-[#bba377] flex items-center gap-2.5"
                  >
                    {renderPixelItemIcon(item)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-pixel font-bold text-[#271809] truncate">
                          {item.name}
                        </span>
                        <span className="text-[9px] font-pixel font-bold text-[#8e6822]">
                          x{item.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-[#4a2e13] leading-tight truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t-2 border-[#2e1a0b] flex items-center justify-between gap-2">
          <span className="text-[8px] font-pixel text-[#d8c29d]">
            SHORTCUT: [I] INVENTORY · VISIT PIER BUCKET BESIDE LAKE
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#8c5828] hover:bg-[#a46738] text-[#fff8e7] text-[9px] font-pixel font-bold border-2 border-[#f0c54d] cursor-pointer"
          >
            CLOSE BAG [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
