/**
 * Character Customization Modal for MelonQuest.
 * 16-Bit Wood & Parchment RPG Wardrobe Interface with Male/Female Gender,
 * Multi-Tone Hair & Hair Color Picker, Headwear, Facial Hair, and Realistic Field Outfits.
 * Strict zero-emoji policy applied.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CHARACTER_BASES,
  COSMETIC_CATALOG,
  HAIR_COLOR_PALETTES,
  CustomizationManager,
  PlayerCustomizationState,
  CosmeticOption,
  CharacterGender,
} from '../game/characterCustomization';
import { EconomySystem } from '../game/economySystem';
import { createPlayerDirectionFrames } from '../game/spriteGenerator';
import { audio } from '../game/soundEffects';

interface CharacterCustomizationModalProps {
  customManager: CustomizationManager;
  economy: EconomySystem;
  onClose: () => void;
  onCustomizationApplied: (state: PlayerCustomizationState) => void;
}

export const CharacterCustomizationModal: React.FC<CharacterCustomizationModalProps> = ({
  customManager,
  economy,
  onClose,
  onCustomizationApplied,
}) => {
  const [activeTab, setActiveTab] = useState<'base' | 'hair' | 'hat' | 'beard' | 'outfit'>('outfit');
  const [state, setState] = useState<PlayerCustomizationState>(customManager.getState());
  const [coins, setCoins] = useState(economy.getCoins());
  const [previewDir, setPreviewDir] = useState<'down' | 'left' | 'up' | 'right'>('down');
  const [previewFrame, setPreviewFrame] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setState(customManager.getState());
    setCoins(economy.getCoins());
  }, [customManager, economy]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewFrame(prev => (prev + 1) % 4);
    }, 180);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const frames = createPlayerDirectionFrames(previewDir, state);
    const currentSprite = frames[previewFrame] || frames[0];
    ctx.drawImage(currentSprite, 0, 0, canvas.width, canvas.height);
  }, [state, previewDir, previewFrame]);

  const handleSelectGender = (gender: CharacterGender) => {
    audio.playMenuClick();
    customManager.setGender(gender);
    const next = customManager.getState();
    setState(next);
    onCustomizationApplied(next);
    setStatusMessage(`Switched to ${gender === 'female' ? 'Female' : 'Male'} character.`);
  };

  const handleSelectBase = (baseId: string) => {
    audio.playMenuClick();
    customManager.setBase(baseId);
    const next = customManager.getState();
    setState(next);
    onCustomizationApplied(next);
    setStatusMessage('Skin tone & profile updated.');
  };

  const handleSelectHairColor = (colorId: string, colorName: string) => {
    audio.playMenuClick();
    customManager.setHairColor(colorId);
    const next = customManager.getState();
    setState(next);
    onCustomizationApplied(next);
    setStatusMessage(`Hair color set to ${colorName}.`);
  };

  const handleEquipCosmetic = (
    category: 'hair' | 'beard' | 'outfit' | 'hat',
    item: CosmeticOption
  ) => {
    if (!customManager.isUnlocked(item.id)) return;
    audio.playMenuClick();
    customManager.equip(category, item.id);
    const next = customManager.getState();
    setState(next);
    onCustomizationApplied(next);
    setStatusMessage(`Equipped ${item.name}.`);
  };

  const handlePurchase = (
    category: 'hair' | 'beard' | 'outfit' | 'hat',
    item: CosmeticOption
  ) => {
    if (coins < item.price) {
      audio.playErrorBuzz();
      setStatusMessage('Not enough coins.');
      return;
    }

    if (economy.deductCoins(item.price)) {
      audio.playItemObtainFanfare();
      customManager.purchaseUnlock(item.id);
      customManager.equip(category, item.id);
      const next = customManager.getState();
      setState(next);
      setCoins(economy.getCoins());
      onCustomizationApplied(next);
      setStatusMessage(`Purchased & equipped ${item.name}.`);
    }
  };

  const filteredCatalog = COSMETIC_CATALOG.filter(item => item.category === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-odyssey-fade select-none">
      <div className="w-full max-w-3xl pixel-wood-frame p-4 sm:p-5 flex flex-col max-h-[90vh] relative">
        {/* Brass Corner Studs */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-[#f0c54d] border border-[#2e1a0b]" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#f0c54d] border border-[#2e1a0b]" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 bg-[#f0c54d] border border-[#2e1a0b]" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-[#f0c54d] border border-[#2e1a0b]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#2e1a0b] pb-3 mb-3 px-1">
          <div>
            <h2 className="text-xs sm:text-sm font-pixel font-bold text-[#f0c54d] drop-shadow-[2px_2px_0px_#1e1005]">
              CABIN WARDROBE &amp; APPEARANCE
            </h2>
            <p className="text-xs text-[#f7eed7] opacity-85">
              Customize Gender, Realistic Hair, Headwear &amp; Field Outfits
            </p>
          </div>

          <div className="flex items-center gap-3">
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

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
          {/* Left Column: Sprite Preview + Gender Switcher on Parchment Card */}
          <div className="pixel-parchment p-3 flex flex-col items-center justify-between">
            <div className="w-full flex flex-col items-center">
              <span className="text-[9px] font-pixel text-[#5a2e0a] font-bold mb-1.5">
                CHARACTER PREVIEW
              </span>

              {/* Prominent Gender Toggle (Male / Female) */}
              <div className="w-full grid grid-cols-2 gap-1.5 mb-2.5">
                {(['male', 'female'] as const).map(g => {
                  const active = state.gender === g;
                  return (
                    <button
                      key={g}
                      onClick={() => handleSelectGender(g)}
                      className={`py-1.5 text-[9px] font-pixel font-bold border-2 uppercase cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#6c4722] text-[#f0c54d] border-[#2e1a0b] shadow-sm'
                          : 'bg-[#e6d5b8] text-[#4a2e13] border-[#bba377] hover:bg-[#dec8a2]'
                      }`}
                    >
                      {g === 'male' ? 'MALE' : 'FEMALE'}
                    </button>
                  );
                })}
              </div>

              <div className="w-32 h-32 bg-[#3d2412] border-3 border-[#2e1a0b] flex items-center justify-center shadow-inner relative">
                <canvas
                  ref={previewCanvasRef}
                  width={128}
                  height={128}
                  className="w-28 h-28 pixelated"
                />
              </div>

              {/* Direction Toggle */}
              <div className="flex items-center gap-1 mt-2">
                {(['down', 'left', 'up', 'right'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setPreviewDir(dir)}
                    className={`px-2 py-1 text-[8px] font-pixel border uppercase cursor-pointer ${
                      previewDir === dir
                        ? 'bg-[#6c4722] text-[#f0c54d] border-[#2e1a0b] font-bold'
                        : 'bg-[#e6d5b8] text-[#4a2e13] border-[#bba377] hover:bg-[#dec8a2]'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipped Summary */}
            <div className="w-full mt-2.5 pt-2 border-t-2 border-[#bba377] text-[8px] font-pixel text-[#3d2412] space-y-1">
              <div className="truncate">
                GENDER: {state.gender === 'female' ? 'Female' : 'Male'}
              </div>
              <div className="truncate">BASE: {customManager.getActiveBase().name}</div>
              <div className="truncate">
                HAIR: {COSMETIC_CATALOG.find(c => c.id === state.hairId)?.name || 'Default'}
              </div>
              <div className="truncate">
                HAT: {COSMETIC_CATALOG.find(c => c.id === state.hatId)?.name || 'Field Cap'}
              </div>
              <div className="truncate">
                OUTFIT: {COSMETIC_CATALOG.find(c => c.id === state.outfitId)?.name || 'Default'}
              </div>
            </div>

            {statusMessage && (
              <div className="w-full mt-2 py-1 px-2 bg-[#3d2412] text-[#f0c54d] text-[8px] font-pixel text-center">
                {statusMessage}
              </div>
            )}
          </div>

          {/* Right Column: Category Tabs & Parchment Grid */}
          <div className="md:col-span-2 flex flex-col min-h-0">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 mb-2.5">
              {(
                [
                  { id: 'outfit', label: 'OUTFIT' },
                  { id: 'hair', label: 'HAIR' },
                  { id: 'hat', label: 'HAT' },
                  { id: 'base', label: 'PROFILE' },
                  { id: 'beard', label: 'BEARD' },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    audio.playMenuClick();
                    setActiveTab(tab.id);
                  }}
                  className={`flex-1 min-w-[58px] py-2 text-[8px] sm:text-[9px] font-pixel font-bold border-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#f0c54d] text-[#2a1708] border-[#fff1b8]'
                      : 'bg-[#361f0d] text-[#d8c29d] border-[#241306] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Hair Color Picker Bar when HAIR tab is active */}
            {activeTab === 'hair' && (
              <div className="pixel-parchment px-3 py-2 mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[8px] font-pixel font-bold text-[#3d2412]">
                  HAIR COLOR:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {HAIR_COLOR_PALETTES.map(pal => {
                    const isSelected = state.hairColorId === pal.id;
                    return (
                      <button
                        key={pal.id}
                        onClick={() => handleSelectHairColor(pal.id, pal.name)}
                        className={`px-2 py-1 border-2 flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#fffcf5] border-[#271809] shadow-sm'
                            : 'bg-[#efe2c6] border-[#bba377] hover:border-[#6c4722]'
                        }`}
                        title={pal.name}
                      >
                        <span
                          className="w-3 h-3 border border-[#271809] inline-block"
                          style={{ backgroundColor: pal.main }}
                        />
                        <span className="text-[8px] font-pixel text-[#271809]">
                          {pal.name.split(' ')[1] || pal.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Character Bases & Gender */}
            {activeTab === 'base' && (
              <div className="pixel-parchment p-3 flex-1 overflow-y-auto pixel-scroll grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHARACTER_BASES.map(base => {
                  const isSelected = state.baseId === base.id;
                  return (
                    <div
                      key={base.id}
                      onClick={() => handleSelectBase(base.id)}
                      className={`cursor-pointer border-2 p-2.5 flex flex-col justify-between transition-colors ${
                        isSelected
                          ? 'bg-[#fffcf5] border-[#6c4722] shadow-md'
                          : 'bg-[#efe2c6] border-[#bba377] hover:border-[#85532d]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-pixel font-bold text-[#271809]">
                            {base.name}
                          </span>
                          <div
                            className="w-4 h-4 border border-[#271809]"
                            style={{ backgroundColor: base.skinColor }}
                            title="Skin Tone"
                          />
                        </div>
                        <div className="text-xs font-bold text-[#5a2e0a] mb-1">
                          {base.title}
                        </div>
                        <p className="text-[11px] text-[#4a2e13] leading-tight">
                          {base.description}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-1.5 border-t border-[#d8c29d] flex items-center justify-between">
                        <span className="text-[8px] font-pixel text-[#2e7d32]">UNLOCKED</span>
                        <span
                          className={`text-[8px] font-pixel font-bold px-2 py-0.5 ${
                            isSelected
                              ? 'bg-[#6c4722] text-[#f0c54d]'
                              : 'bg-[#d8c29d] text-[#4a2e13]'
                          }`}
                        >
                          {isSelected ? 'ACTIVE' : 'SELECT'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabs: Hair, Hat, Beard, and Outfit */}
            {activeTab !== 'base' && (
              <div className="pixel-parchment p-3 flex-1 overflow-y-auto pixel-scroll grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeTab === 'beard' && state.gender === 'female' && (
                  <div className="sm:col-span-2 bg-[#efe2c6] border-2 border-[#bba377] p-2.5 text-xs text-[#4a2e13] font-bold">
                    Facial hair is automatically hidden while the Female character form is active. Switch to Male on the left panel to preview facial hair styles.
                  </div>
                )}
                {filteredCatalog.map(item => {
                  const isUnlocked = customManager.isUnlocked(item.id);
                  const isEquipped =
                    (activeTab === 'hair' && state.hairId === item.id) ||
                    (activeTab === 'hat' && state.hatId === item.id) ||
                    (activeTab === 'beard' && state.beardId === item.id) ||
                    (activeTab === 'outfit' && state.outfitId === item.id);

                  return (
                    <div
                      key={item.id}
                      className={`border-2 p-2.5 flex flex-col justify-between ${
                        isEquipped
                          ? 'bg-[#fffcf5] border-[#6c4722] shadow-md'
                          : 'bg-[#efe2c6] border-[#bba377]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-pixel font-bold text-[#271809]">
                            {item.name}
                          </span>
                          {item.price > 0 && !isUnlocked ? (
                            <span className="text-[9px] font-pixel font-bold text-[#8e6822]">
                              {item.price}G
                            </span>
                          ) : (
                            <span className="text-[8px] font-pixel text-[#2e7d32]">
                              OWNED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4a2e13] leading-tight">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-1.5 border-t border-[#d8c29d]">
                        {isEquipped ? (
                          <div className="w-full text-center py-1 bg-[#6c4722] text-[#f0c54d] text-[8px] font-pixel font-bold">
                            EQUIPPED
                          </div>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => handleEquipCosmetic(activeTab, item)}
                            className="w-full py-1 bg-[#2e7d32] hover:bg-[#388e3c] text-white text-[8px] font-pixel font-bold border border-[#1b5e20] cursor-pointer"
                          >
                            EQUIP
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchase(activeTab, item)}
                            disabled={coins < item.price}
                            className={`w-full py-1 text-[8px] font-pixel font-bold border ${
                              coins >= item.price
                                ? 'bg-[#b85d19] hover:bg-[#d35400] text-white border-[#6e3206] cursor-pointer'
                                : 'bg-[#d8c29d] text-[#8d6e63] border-[#bba377] cursor-not-allowed'
                            }`}
                          >
                            BUY ({item.price}G)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t-2 border-[#2e1a0b] flex items-center justify-between">
          <span className="text-xs text-[#d8c29d] font-bold">
            Changes apply immediately to walking, farming, and sleeping sprites
          </span>
          <button
            onClick={onClose}
            className="pixel-embossed-gold px-5 py-2 text-[10px] font-pixel font-bold text-[#f0c54d] cursor-pointer"
          >
            DONE [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
