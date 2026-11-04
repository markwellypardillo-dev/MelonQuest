/**
 * Marketplace & Produce Broker Modal for MelonQuest.
 * 16-Bit Wood & Parchment RPG Market Exchange.
 * Includes buyable Fishing Bait packs, Farm Supplies, and Harvest/Fish Sales.
 * Strict zero-emoji policy applied.
 */

import React, { useState, useEffect } from 'react';
import {
  EconomySystem,
  InventoryItem,
  PierBucketFish,
  StoreListing,
  BAIT_CATALOG,
  LAND_DEED_CATALOG,
} from '../game/economySystem';
import { audio } from '../game/soundEffects';

interface MarketplaceModalProps {
  economy: EconomySystem;
  onClose: () => void;
  onOpenInventory?: () => void;
  onPlotPurchased?: (plotId: number) => void;
}

const FARM_SUPPLY_CATALOG: StoreListing[] = [
  ...BAIT_CATALOG,
  {
    id: 'seed_sugar_baby',
    name: 'Sugar Baby Seeds (x2)',
    category: 'supply',
    price: 15,
    quantityPerPurchase: 2,
    description: 'Heirloom Citrullus lanatus seed pack (75-80 day cycle).',
  },
  {
    id: 'lime_bag',
    name: 'Calcitic Limestone',
    category: 'supply',
    price: 12,
    quantityPerPurchase: 1,
    description: 'Raises acidic soil pH toward the 6.0 - 6.8 target.',
  },
  {
    id: 'sulfur_bag',
    name: 'Elemental Sulfur',
    category: 'supply',
    price: 12,
    quantityPerPurchase: 1,
    description: 'Lowers alkaline soil pH into the optimal range.',
  },
  {
    id: 'bio_spray_canister',
    name: 'Bio-Fungicide',
    category: 'supply',
    price: 25,
    quantityPerPurchase: 1,
    description: 'Bacillus subtilis foliar spray for mildew protection.',
  },
];

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  economy,
  onClose,
  onOpenInventory,
  onPlotPurchased,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [coins, setCoins] = useState(economy.getCoins());
  const [inventory, setInventory] = useState<InventoryItem[]>(economy.getInventory());
  const [bucketFish, setBucketFish] = useState<PierBucketFish[]>(economy.getPierBucketFish());
  const [unlockedPlots, setUnlockedPlots] = useState<number[]>(economy.getUnlockedPlots());
  const [transactionNote, setTransactionNote] = useState<string | null>(null);

  const syncMarketState = () => {
    setCoins(economy.getCoins());
    setInventory(economy.getInventory());
    setBucketFish(economy.getPierBucketFish());
    setUnlockedPlots(economy.getUnlockedPlots());
  };

  useEffect(() => {
    syncMarketState();
  }, [economy]);

  const handleSell = (itemId: string, quality?: string) => {
    audio.playMenuClick();
    const res = economy.sellItem(itemId, 1, quality);
    syncMarketState();
    setTransactionNote(res.message);

    if (res.earned > 0) {
      audio.playItemObtainFanfare();
    } else {
      audio.playErrorBuzz();
    }
  };

  const handleSellAllProduce = () => {
    const unSpoiledCrops = inventory.filter(
      i => (i.category === 'crop' || i.category === 'fish') && i.quality !== 'spoiled'
    );
    if (unSpoiledCrops.length === 0 && bucketFish.length === 0) {
      setTransactionNote('No produce or caught fish available to sell.');
      return;
    }

    let totalGained = 0;
    unSpoiledCrops.forEach(crop => {
      const res = economy.sellItem(crop.id, crop.quantity, crop.quality);
      totalGained += res.earned;
    });

    if (bucketFish.length > 0) {
      const bucketSale = economy.sellAllBucketFish();
      totalGained += bucketSale.earned;
    }

    audio.playItemObtainFanfare();
    syncMarketState();
    setTransactionNote(`Sold all prime harvest & pier fish for +${totalGained}G.`);
  };

  const handleSellPierBucketFish = () => {
    const res = economy.sellAllBucketFish();
    if (res.count > 0) {
      audio.playItemObtainFanfare();
      syncMarketState();
      setTransactionNote(`Sold ${res.count} fresh fish from the Pier Bucket for +${res.earned}G.`);
    }
  };

  const handleBuy = (item: StoreListing) => {
    audio.playMenuClick();
    const res = economy.buyItem(item);
    syncMarketState();
    setTransactionNote(res.message);

    if (res.success) {
      audio.playItemObtainFanfare();
      if (item.category === 'deed' && item.plotId) {
        onPlotPurchased?.(item.plotId);
      }
    } else {
      audio.playErrorBuzz();
    }
  };

  const sellableProduce = inventory.filter(
    i => i.category === 'crop' || i.category === 'fish' || i.category === 'pest'
  );
  const totalBaitsOwned = economy.getTotalBaitCount();
  const totalMelonsOwned = economy.getHarvestedMelonCount();

  const getOwnedQuantity = (itemId: string) => {
    return inventory
      .filter(i => i.id === itemId)
      .reduce((sum, i) => sum + i.quantity, 0);
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
              BROKER SILAS · MARKETPLACE
            </h2>
            <p className="text-xs text-[#f7eed7] opacity-85">
              Farm Land Deeds · Fishing Bait Shop · Agronomy Supplies · Produce Exchange
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-[#241306] px-2.5 py-1 border-2 border-[#6c4722] hidden sm:flex items-center gap-2 text-[9px] font-pixel text-[#d8c29d]">
              <span>PLOTS: <strong className="text-[#88d46c]">{unlockedPlots.length}/4</strong></span>
              <span>·</span>
              <span>MELONS: <strong className="text-[#88d46c]">{totalMelonsOwned}</strong></span>
              <span>·</span>
              <span>BAIT: <strong className="text-[#f0c54d]">{totalBaitsOwned}</strong></span>
            </div>
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

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              audio.playMenuClick();
              setActiveTab('buy');
            }}
            className={`flex-1 py-2 text-[10px] font-pixel font-bold border-2 cursor-pointer ${
              activeTab === 'buy'
                ? 'bg-[#f0c54d] text-[#2a1708] border-[#fff1b8]'
                : 'bg-[#361f0d] text-[#d8c29d] border-[#241306] hover:text-white'
            }`}
          >
            BUY DEEDS, BAIT &amp; SUPPLIES
          </button>
          <button
            onClick={() => {
              audio.playMenuClick();
              setActiveTab('sell');
            }}
            className={`flex-1 py-2 text-[10px] font-pixel font-bold border-2 cursor-pointer ${
              activeTab === 'sell'
                ? 'bg-[#f0c54d] text-[#2a1708] border-[#fff1b8]'
                : 'bg-[#361f0d] text-[#d8c29d] border-[#241306] hover:text-white'
            }`}
          >
            SELL HARVEST &amp; FISH ({sellableProduce.length + bucketFish.length})
          </button>
        </div>

        {/* Parchment Body */}
        <div className="pixel-parchment p-3.5 flex-1 overflow-y-auto pixel-scroll min-h-0">
          {transactionNote && (
            <div className="mb-3 px-3 py-1.5 bg-[#3d2412] border border-[#2e1a0b] text-[#f0c54d] text-[9px] font-pixel">
              {transactionNote}
            </div>
          )}

          {/* TAB 1: BUY DEEDS, BAIT & SUPPLIES */}
          {activeTab === 'buy' && (
            <div className="space-y-3.5">
              {/* Farm Expansion Land Deeds Section */}
              <div>
                <div className="flex items-center justify-between border-b-2 border-[#bba377] pb-1.5 mb-2">
                  <span className="text-[9px] font-pixel font-bold text-[#1b5e20]">
                    FARM EXPANSION LAND DEEDS (PLOTS UNLOCKED: {unlockedPlots.length}/4)
                  </span>
                  <span className="text-[8px] font-pixel text-[#5a2e0a]">
                    CHOP TREES (+15G) &amp; PULL STUMPS TO PLANT
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {LAND_DEED_CATALOG.map(deed => {
                    const plotNum = deed.plotId || 2;
                    const isUnlocked = unlockedPlots.includes(plotNum);
                    return (
                      <div
                        key={deed.id}
                        className={`border-2 p-2.5 flex flex-col justify-between ${
                          isUnlocked
                            ? 'bg-[#eef7ed] border-[#2e7d32]'
                            : 'bg-[#fffcf5] border-[#8e6822]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[9px] font-pixel font-bold text-[#271809]">
                              {deed.name}
                            </span>
                            <span className="text-[9px] font-pixel font-bold text-[#1b5e20] shrink-0">
                              {isUnlocked ? 'OWNED' : `${deed.price}G`}
                            </span>
                          </div>
                          <p className="text-xs text-[#4a2e13] leading-snug">
                            {deed.description}
                          </p>
                          <div className="mt-1.5 text-[8px] font-pixel text-[#8e6822] font-bold">
                            {isUnlocked
                              ? `PLOT #${plotNum} DEED ACTIVE`
                              : 'STATUS: FORESTED LOT (+15G TIMBER)'}
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#e6d5b8]">
                          <button
                            onClick={() => handleBuy(deed)}
                            disabled={isUnlocked || coins < deed.price}
                            className={`w-full py-1.5 text-[9px] font-pixel font-bold border-2 ${
                              isUnlocked
                                ? 'bg-[#2e7d32] text-white border-[#1b5e20] cursor-default'
                                : coins >= deed.price
                                  ? 'bg-[#8c5828] hover:bg-[#a46738] text-[#fff8e7] border-[#f0c54d] cursor-pointer'
                                  : 'bg-[#d8c29d] text-[#8d6e63] border-[#bba377] cursor-not-allowed'
                            }`}
                          >
                            {isUnlocked
                              ? `UNLOCKED (PLOT #${plotNum})`
                              : coins >= deed.price
                                ? `BUY DEED (${deed.price}G)`
                                : `NEED ${deed.price}G`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Featured Fishing Bait Section */}
              <div>
                <div className="flex items-center justify-between border-b-2 border-[#bba377] pb-1.5 mb-2">
                  <span className="text-[9px] font-pixel font-bold text-[#8e6822]">
                    RIVER PIER FISHING BAIT (OWNED: {totalBaitsOwned})
                  </span>
                  <span className="text-[8px] font-pixel text-[#5a2e0a]">
                    USED AT SOUTHERN RIVER PIER
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {FARM_SUPPLY_CATALOG.filter(i => i.category === 'bait').map(item => {
                    const owned = getOwnedQuantity(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-[#fffcf5] border-2 border-[#d4a838] p-2.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[9px] font-pixel font-bold text-[#271809]">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-pixel font-bold text-[#b85d19] shrink-0">
                              {item.price}G
                            </span>
                          </div>
                          <p className="text-xs text-[#4a2e13] leading-snug">
                            {item.description}
                          </p>
                          <div className="mt-1.5 text-[8px] font-pixel text-[#2e7d32] font-bold">
                            IN BAG: {owned} BAIT
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#e6d5b8]">
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={coins < item.price}
                            className={`w-full py-1.5 text-[9px] font-pixel font-bold border-2 ${
                              coins >= item.price
                                ? 'bg-[#b85d19] hover:bg-[#d35400] text-white border-[#6e3206] cursor-pointer'
                                : 'bg-[#d8c29d] text-[#8d6e63] border-[#bba377] cursor-not-allowed'
                            }`}
                          >
                            {coins >= item.price ? `BUY PACK (${item.price}G)` : 'NEED COINS'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agronomy Seeds & Soil Amendments Section */}
              <div>
                <div className="border-b-2 border-[#bba377] pb-1.5 mb-2">
                  <span className="text-[9px] font-pixel font-bold text-[#5a2e0a]">
                    WATERMELON SEEDS &amp; AGRONOMY SUPPLIES
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FARM_SUPPLY_CATALOG.filter(i => i.category !== 'bait').map(item => {
                    const owned = getOwnedQuantity(item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-[#fffcf5] border-2 border-[#bba377] p-2.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-pixel font-bold text-[#271809]">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-pixel font-bold text-[#8e6822]">
                              {item.price}G
                            </span>
                          </div>
                          <p className="text-xs text-[#4a2e13] leading-tight">
                            {item.description}
                          </p>
                          <div className="mt-1 text-[8px] font-pixel text-[#5a2e0a]">
                            OWNED: x{owned}
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-[#e6d5b8]">
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={coins < item.price}
                            className={`w-full py-1.5 text-[9px] font-pixel font-bold border-2 ${
                              coins >= item.price
                                ? 'bg-[#2e7d32] hover:bg-[#388e3c] text-white border-[#1b5e20] cursor-pointer'
                                : 'bg-[#d8c29d] text-[#8d6e63] border-[#bba377] cursor-not-allowed'
                            }`}
                          >
                            {coins >= item.price ? `BUY (${item.price}G)` : 'NEED COINS'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SELL HARVEST & PIER BUCKET FISH */}
          {activeTab === 'sell' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#bba377] pb-2">
                <span className="text-[9px] font-pixel font-bold text-[#5a2e0a]">
                  HARVESTED WATERMELONS &amp; CAUGHT FISH
                </span>
                {(sellableProduce.length > 0 || bucketFish.length > 0) && (
                  <button
                    onClick={handleSellAllProduce}
                    className="px-3 py-1 bg-[#2e7d32] hover:bg-[#388e3c] text-white text-[8px] font-pixel font-bold border border-[#1b5e20] cursor-pointer"
                  >
                    SELL ALL HARVEST &amp; FISH
                  </button>
                )}
              </div>

              {bucketFish.length > 0 && (
                <div className="p-2.5 bg-[#eaf2f8] border-2 border-[#5dade2] flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-pixel font-bold text-[#154360]">
                      Pier Fish Bucket ({bucketFish.length} Fish Stored)
                    </div>
                    <p className="text-xs text-[#1b4f72]">
                      Total Bucket Value:{' '}
                      <strong>{bucketFish.reduce((s, f) => s + f.value, 0)}G</strong>
                    </p>
                  </div>
                  <button
                    onClick={handleSellPierBucketFish}
                    className="px-3 py-1.5 bg-[#1f618d] hover:bg-[#2980b9] text-white text-[8px] font-pixel font-bold border-2 border-[#154360] cursor-pointer"
                  >
                    SELL BUCKET FISH
                  </button>
                </div>
              )}

              {sellableProduce.length === 0 && bucketFish.length === 0 ? (
                <div className="py-8 text-center text-xs font-pixel text-[#6d4c41]">
                  No harvested melons or river fish in sack.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sellableProduce.map((item, idx) => {
                    const isSpoiled = item.quality === 'spoiled';
                    let priceText = `${item.value}G`;
                    if (item.quality === 'usda_no_1')
                      priceText = `${Math.floor(item.value * 1.5)}G · USDA NO. 1`;
                    else if (item.quality === 'choice')
                      priceText = `${Math.floor(item.value * 1.15)}G · CHOICE`;
                    else if (item.quality === 'commercial')
                      priceText = `${item.value}G · COMMERCIAL`;
                    else if (isSpoiled) priceText = '0G · SPOILED';

                    return (
                      <div
                        key={`${item.id}-${item.quality || 'norm'}-${idx}`}
                        className={`p-3 border-2 flex items-center justify-between gap-3 ${
                          isSpoiled
                            ? 'bg-[#f5e1de] border-[#922b21]'
                            : 'bg-[#fffcf5] border-[#bba377]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-pixel font-bold text-[#271809]">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-pixel text-[#5a2e0a] font-bold">
                              x{item.quantity}
                            </span>
                          </div>
                          <div
                            className={`text-[9px] font-pixel font-bold mt-1 ${
                              isSpoiled ? 'text-[#c0392b]' : 'text-[#2e7d32]'
                            }`}
                          >
                            {priceText}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSell(item.id, item.quality)}
                          className={`px-3.5 py-2 text-[9px] font-pixel font-bold border-2 shrink-0 cursor-pointer ${
                            isSpoiled
                              ? 'bg-[#c0392b] text-white border-[#641e16]'
                              : 'bg-[#2e7d32] hover:bg-[#388e3c] text-white border-[#1b5e20]'
                          }`}
                        >
                          {isSpoiled ? 'COMPOST' : 'SELL 1'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t-2 border-[#2e1a0b] flex items-center justify-between">
          {onOpenInventory ? (
            <button
              onClick={() => {
                audio.playMenuClick();
                onClose();
                onOpenInventory();
              }}
              className="px-3 py-1.5 bg-[#361f0d] hover:bg-[#4e2d14] text-[#f0c54d] text-[8px] font-pixel border-2 border-[#6c4722] cursor-pointer"
            >
              OPEN INVENTORY [I]
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#8c5828] hover:bg-[#a46738] text-[#fff8e7] text-[9px] font-pixel font-bold border-2 border-[#f0c54d] cursor-pointer"
          >
            CLOSE STALL [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
