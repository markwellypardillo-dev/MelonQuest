/**
 * Dedicated Farming Guidebook Module for MelonQuest.
 * 16-Bit Illustrated Playbook:
 * - Textured, rich brown wood-grain border with lush pixelated leafy vines
 * - Natural earth tone sidebar tabs (yellows, browns, tans) with custom pixel-art icons (leaf, soil, water drop, bug, plant)
 * - Warm parchment paper background with high-contrast, dark-colored text
 * - Vibrant pixel headers with drop-shadows
 * - Hand-drawn pixel illustration panels of plants, seeds, and flower parts inset into articles
 * Strict zero-emoji policy applied.
 */

import React, { useState } from 'react';
import { GUIDEBOOK_CHAPTERS } from '../game/farmingData';
import { audio } from '../game/soundEffects';

interface GuidebookModalProps {
  onClose: () => void;
}

export const GuidebookModal: React.FC<GuidebookModalProps> = ({ onClose }) => {
  const [activeChapterId, setActiveChapterId] = useState(GUIDEBOOK_CHAPTERS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const activeChapter =
    GUIDEBOOK_CHAPTERS.find(c => c.id === activeChapterId) || GUIDEBOOK_CHAPTERS[0];

  const filteredChapters = GUIDEBOOK_CHAPTERS.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.sections.some(s => s.heading.toLowerCase().includes(q) || s.content.toLowerCase().includes(q))
    );
  });

  // Render thematic custom pixel-art icon for sidebar tabs
  const renderTabIcon = (chapterId: string) => {
    switch (chapterId) {
      case 'ch_botany': // Leaf / Seed
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="7" y="2" width="2" height="2" fill="#78b159" />
            <rect x="5" y="4" width="6" height="3" fill="#2d7d32" />
            <rect x="4" y="7" width="8" height="4" fill="#1b5e20" />
            <rect x="5" y="11" width="6" height="2" fill="#2d7d32" />
            <rect x="7" y="7" width="2" height="6" fill="#81c784" /> {/* Leaf vein */}
            <rect x="7" y="13" width="2" height="3" fill="#5d4037" /> {/* Stem */}
          </svg>
        );
      case 'ch_soil': // Soil Core
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="3" y="2" width="10" height="3" fill="#4caf50" /> {/* Grass top */}
            <rect x="3" y="5" width="10" height="3" fill="#8d6e63" /> {/* Topsoil */}
            <rect x="3" y="8" width="10" height="4" fill="#5d4037" /> {/* Loam */}
            <rect x="3" y="12" width="10" height="3" fill="#3e2723" /> {/* Bedrock */}
            <rect x="5" y="7" width="2" height="1" fill="#d7ccc8" /> {/* Gravel */}
            <rect x="9" y="10" width="2" height="1" fill="#d7ccc8" />
          </svg>
        );
      case 'ch_cultivation': // Water Drop & Drip
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="7" y="2" width="2" height="2" fill="#64b5f6" />
            <rect x="6" y="4" width="4" height="3" fill="#2196f3" />
            <rect x="4" y="7" width="8" height="5" fill="#1976d2" />
            <rect x="5" y="12" width="6" height="2" fill="#0d47a1" />
            <rect x="5" y="8" width="2" height="2" fill="#e3f2fd" /> {/* Shimmer */}
          </svg>
        );
      case 'ch_ipm': // Bug / Beetle
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="7" y="2" width="2" height="2" fill="#212121" /> {/* Head */}
            <rect x="5" y="4" width="6" height="8" fill="#f1c40f" /> {/* Yellow thorax */}
            <rect x="7" y="4" width="2" height="8" fill="#212121" /> {/* Black stripe */}
            <rect x="3" y="6" width="2" height="1" fill="#212121" /> {/* Legs */}
            <rect x="11" y="6" width="2" height="1" fill="#212121" />
            <rect x="2" y="9" width="3" height="1" fill="#212121" />
            <rect x="11" y="9" width="3" height="1" fill="#212121" />
          </svg>
        );
      case 'ch_harvest': // Watermelon Plant & Fruit
      default:
        return (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x="3" y="4" width="10" height="8" fill="#1b5e20" />
            <rect x="5" y="3" width="6" height="10" fill="#2e7d32" />
            <rect x="5" y="4" width="2" height="8" fill="#81c784" /> {/* Stripes */}
            <rect x="9" y="4" width="2" height="8" fill="#81c784" />
            <rect x="7" y="1" width="2" height="2" fill="#795548" /> {/* Tendril stem */}
            <rect x="9" y="1" width="2" height="1" fill="#fbc02d" /> {/* Ground spot */}
          </svg>
        );
    }
  };

  // Render authentic illustrated playbook pixel art panel for the active chapter
  const renderIllustrationPanel = (chapterId: string) => {
    switch (chapterId) {
      case 'ch_botany':
        return (
          <div className="bg-[#f0e4c8] border-2 border-[#8d6e63] p-3 my-3 shadow-md">
            <div className="font-pixel text-[9px] text-[#6d4c41] uppercase tracking-wider mb-2 border-b border-[#bcaaa4] pb-1 flex justify-between">
              <span>PLATE I: CITRULLUS LANATUS MORPHOLOGY</span>
              <span>FIG. 1 - 3</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              {/* Seed & Cotyledon */}
              <div className="bg-[#fffdf7] p-2 border border-[#d7ccc8]">
                <svg className="w-16 h-16 mx-auto mb-1" viewBox="0 0 32 32" shapeRendering="crispEdges">
                  {/* Seed coat */}
                  <rect x="10" y="8" width="12" height="16" fill="#3e2723" />
                  <rect x="12" y="6" width="8" height="20" fill="#4e342e" />
                  <rect x="14" y="5" width="4" height="22" fill="#5d4037" />
                  <rect x="12" y="10" width="3" height="4" fill="#8d6e63" />
                  {/* Sprout radicle */}
                  <rect x="15" y="24" width="3" height="6" fill="#81c784" />
                  <rect x="16" y="28" width="5" height="2" fill="#a5d6a7" />
                </svg>
                <div className="font-pixel text-[8px] text-[#3e2723]">FLAT OVATE SEED</div>
                <div className="text-[10px] text-[#5d4037]">Dormancy break @ 70°F</div>
              </div>

              {/* Vine & Tendril */}
              <div className="bg-[#fffdf7] p-2 border border-[#d7ccc8]">
                <svg className="w-16 h-16 mx-auto mb-1" viewBox="0 0 32 32" shapeRendering="crispEdges">
                  {/* Runner vine */}
                  <rect x="4" y="14" width="24" height="4" fill="#2e7d32" />
                  <rect x="4" y="15" width="24" height="2" fill="#388e3c" />
                  {/* Lobed leaf */}
                  <rect x="12" y="6" width="10" height="8" fill="#1b5e20" />
                  <rect x="14" y="4" width="6" height="12" fill="#2e7d32" />
                  <rect x="10" y="8" width="14" height="4" fill="#1b5e20" />
                  {/* Curled branched tendril */}
                  <rect x="22" y="10" width="2" height="4" fill="#81c784" />
                  <rect x="24" y="8" width="4" height="2" fill="#81c784" />
                  <rect x="26" y="10" width="2" height="4" fill="#81c784" />
                </svg>
                <div className="font-pixel text-[8px] text-[#1b5e20]">BRANCHED TENDRIL</div>
                <div className="text-[10px] text-[#5d4037]">Thigmotropic anchoring</div>
              </div>

              {/* Monoecious Blossom */}
              <div className="bg-[#fffdf7] p-2 border border-[#d7ccc8]">
                <svg className="w-16 h-16 mx-auto mb-1" viewBox="0 0 32 32" shapeRendering="crispEdges">
                  {/* Petals (Yellow 5-lobed) */}
                  <rect x="12" y="4" width="8" height="6" fill="#fdd835" />
                  <rect x="4" y="12" width="6" height="8" fill="#fdd835" />
                  <rect x="22" y="12" width="6" height="8" fill="#fdd835" />
                  <rect x="8" y="20" width="6" height="6" fill="#fdd835" />
                  <rect x="18" y="20" width="6" height="6" fill="#fdd835" />
                  {/* Central stigma / ovary */}
                  <rect x="11" y="11" width="10" height="10" fill="#f57f17" />
                  <rect x="13" y="13" width="6" height="6" fill="#fff9c4" />
                  {/* Ovary bump */}
                  <rect x="13" y="26" width="6" height="4" fill="#388e3c" />
                </svg>
                <div className="font-pixel text-[8px] text-[#f57f17]">FEMALE BLOSSOM</div>
                <div className="text-[10px] text-[#5d4037]">Inferior ovary pre-fruit</div>
              </div>
            </div>
          </div>
        );

      case 'ch_soil':
        return (
          <div className="bg-[#f0e4c8] border-2 border-[#8d6e63] p-3 my-3 shadow-md">
            <div className="font-pixel text-[9px] text-[#6d4c41] uppercase tracking-wider mb-2 border-b border-[#bcaaa4] pb-1 flex justify-between">
              <span>PLATE II: SOIL REACTION SPECTRUM (pH 5.0 - 8.0)</span>
              <span>CALIBRATION</span>
            </div>
            {/* Color spectrum bar */}
            <div className="h-6 w-full flex border-2 border-[#3e2723] mb-2">
              <div className="flex-1 bg-[#d32f2f] flex items-center justify-center font-pixel text-[8px] text-white">5.0</div>
              <div className="flex-1 bg-[#f57c00] flex items-center justify-center font-pixel text-[8px] text-white">5.5</div>
              <div className="flex-2 bg-[#388e3c] flex items-center justify-center font-pixel text-[8px] text-white font-bold border-x-2 border-white">
                6.0 - 6.8 OPTIMAL
              </div>
              <div className="flex-1 bg-[#1976d2] flex items-center justify-center font-pixel text-[8px] text-white">7.5</div>
              <div className="flex-1 bg-[#512da8] flex items-center justify-center font-pixel text-[8px] text-white">8.0</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#3e2723]">
              <div className="bg-[#fffdf7] p-1.5 border border-[#d7ccc8]">
                <strong className="text-[#c62828]">Acidic (pH &lt; 5.8):</strong> Apply agricultural lime (CaCO3) to neutralize toxic soluble aluminum and liberate phosphate.
              </div>
              <div className="bg-[#fffdf7] p-1.5 border border-[#d7ccc8]">
                <strong className="text-[#1565c0]">Alkaline (pH &gt; 7.5):</strong> Incorporate elemental sulfur (S) to lower pH and cure iron chlorosis.
              </div>
            </div>
          </div>
        );

      case 'ch_cultivation':
        return (
          <div className="bg-[#f0e4c8] border-2 border-[#8d6e63] p-3 my-3 shadow-md">
            <div className="font-pixel text-[9px] text-[#6d4c41] uppercase tracking-wider mb-2 border-b border-[#bcaaa4] pb-1 flex justify-between">
              <span>PLATE III: RAISED BED PLASTICULTURE HYDRAULICS</span>
              <span>CROSS SECTION</span>
            </div>
            <div className="bg-[#fffdf7] p-2 border border-[#d7ccc8] flex flex-col items-center">
              <svg className="w-full max-w-sm h-20" viewBox="0 0 200 60" shapeRendering="crispEdges">
                {/* Natural Ground Level */}
                <rect x="0" y="45" width="200" height="15" fill="#4e342e" />
                {/* Raised Soil Bed (Trapezoid ridge) */}
                <polygon points="30,45 60,15 140,15 170,45" fill="#6d4c41" />
                <polygon points="60,15 140,15 135,25 65,25" fill="#8d6e63" />
                {/* Black Plastic Mulch Layer */}
                <polyline points="28,45 58,13 142,13 172,45" stroke="#1c201e" strokeWidth="3" fill="none" />
                {/* Buried Drip Tape Emitter */}
                <rect x="96" y="24" width="8" height="6" fill="#1565c0" />
                <circle cx="100" cy="27" r="2" fill="#64b5f6" />
                {/* Water Wicking Bulbs */}
                <ellipse cx="100" cy="34" rx="28" ry="10" fill="rgba(33, 150, 243, 0.25)" />
                {/* Watermelon Vine Sprout */}
                <rect x="98" y="6" width="4" height="8" fill="#2e7d32" />
                <rect x="92" y="4" width="8" height="4" fill="#388e3c" />
                <rect x="100" y="4" width="8" height="4" fill="#388e3c" />
              </svg>
              <div className="font-pixel text-[8px] text-[#1565c0] mt-1">
                BURIED DRIP TAPE UNDER POLYETHYLENE EMBOSSED FILM
              </div>
            </div>
          </div>
        );

      case 'ch_ipm':
        return (
          <div className="bg-[#f0e4c8] border-2 border-[#8d6e63] p-3 my-3 shadow-md">
            <div className="font-pixel text-[9px] text-[#6d4c41] uppercase tracking-wider mb-2 border-b border-[#bcaaa4] pb-1 flex justify-between">
              <span>PLATE IV: PEST VECTOR &amp; BIOLOGICAL STEWARDSHIP</span>
              <span>IPM PROTOCOL</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#fffdf7] p-2 border border-[#d7ccc8]">
                <div className="font-pixel text-[8px] text-[#c62828] mb-1">
                  VECTOR: CUCUMBER BEETLE
                </div>
                <div className="text-[11px] text-[#3e2723] leading-snug">
                  Transmits <em>Erwinia tracheiphila</em> bacteria into xylem vessels, plugging water flow and causing irreversible whole-vine wilt collapse.
                </div>
              </div>
              <div className="bg-[#fffdf7] p-2 border border-[#d7ccc8]">
                <div className="font-pixel text-[8px] text-[#2e7d32] mb-1">
                  CONTROL: BIO-SPRAY BARRIER
                </div>
                <div className="text-[11px] text-[#3e2723] leading-snug">
                  Potassium bicarbonate bio-fungicide and beneficial biocontrols preserve pollinator honeybees while neutralizing fungal mycelium.
                </div>
              </div>
            </div>
          </div>
        );

      case 'ch_harvest':
      default:
        return (
          <div className="bg-[#f0e4c8] border-2 border-[#8d6e63] p-3 my-3 shadow-md">
            <div className="font-pixel text-[9px] text-[#6d4c41] uppercase tracking-wider mb-2 border-b border-[#bcaaa4] pb-1 flex justify-between">
              <span>PLATE V: THE HARVEST MATURITY QUARTET</span>
              <span>4 RIPE CHECKS</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-[#fffdf7] p-1.5 border border-[#d7ccc8]">
                <div className="font-pixel text-[8px] text-[#5d4037] mb-0.5">1. TENDRIL</div>
                <div className="w-8 h-8 mx-auto my-1 bg-[#5d4037] rounded-sm flex items-center justify-center font-pixel text-[10px] text-white">
                  DRY
                </div>
                <div className="text-[10px] text-[#3e2723]">Stem curl is brown &amp; dead</div>
              </div>
              <div className="bg-[#fffdf7] p-1.5 border border-[#d7ccc8]">
                <div className="font-pixel text-[8px] text-[#f57f17] mb-0.5">2. BELLY</div>
                <div className="w-8 h-8 mx-auto my-1 bg-[#fdd835] rounded-sm flex items-center justify-center font-pixel text-[10px] text-[#3e2723]">
                  GOLD
                </div>
                <div className="text-[10px] text-[#3e2723]">Creamy butter yellow</div>
              </div>
              <div className="bg-[#fffdf7] p-1.5 border border-[#d7ccc8]">
                <div className="font-pixel text-[8px] text-[#1565c0] mb-0.5">3. SOUND</div>
                <div className="w-8 h-8 mx-auto my-1 bg-[#1565c0] rounded-sm flex items-center justify-center font-pixel text-[10px] text-white">
                  DULL
                </div>
                <div className="text-[10px] text-[#3e2723]">Deep hollow acoustic thump</div>
              </div>
              <div className="bg-[#fffdf7] p-1.5 border border-[#d7ccc8]">
                <div className="font-pixel text-[8px] text-[#c62828] mb-0.5">4. BRIX</div>
                <div className="w-8 h-8 mx-auto my-1 bg-[#c62828] rounded-sm flex items-center justify-center font-pixel text-[10px] text-white">
                  11°+
                </div>
                <div className="text-[10px] text-[#3e2723]">Refractometer sugar target</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-2 sm:p-4 font-retro select-none animate-odyssey-fade">
      {/* Outer Frame: Textured Rich Brown Wood-Grain Border Adorned with Lush Green Leafy Vines */}
      <div className="relative w-full max-w-5xl pixel-wood-frame p-3 sm:p-5 max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Pixel Leafy Vine Corner Flourishes */}
        {/* Top-Left Vine */}
        <div className="absolute top-1 left-1 pointer-events-none z-20">
          <svg width="48" height="48" viewBox="0 0 24 24" shapeRendering="crispEdges">
            <rect x="2" y="2" width="4" height="4" fill="#2d7d32" />
            <rect x="6" y="2" width="6" height="3" fill="#388e3c" />
            <rect x="12" y="2" width="4" height="2" fill="#81c784" />
            <rect x="2" y="6" width="3" height="6" fill="#1b5e20" />
            <rect x="2" y="12" width="2" height="4" fill="#81c784" />
            <rect x="5" y="5" width="4" height="4" fill="#4caf50" />
            <rect x="9" y="5" width="2" height="2" fill="#a5d6a7" />
            <rect x="5" y="9" width="2" height="2" fill="#a5d6a7" />
          </svg>
        </div>

        {/* Top-Right Vine */}
        <div className="absolute top-1 right-1 pointer-events-none z-20">
          <svg width="48" height="48" viewBox="0 0 24 24" shapeRendering="crispEdges">
            <rect x="18" y="2" width="4" height="4" fill="#2d7d32" />
            <rect x="12" y="2" width="6" height="3" fill="#388e3c" />
            <rect x="8" y="2" width="4" height="2" fill="#81c784" />
            <rect x="19" y="6" width="3" height="6" fill="#1b5e20" />
            <rect x="20" y="12" width="2" height="4" fill="#81c784" />
            <rect x="15" y="5" width="4" height="4" fill="#4caf50" />
          </svg>
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-4 border-[#3e2411] bg-[#432712] px-4 py-2.5 mb-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-3 h-7 bg-[#f0c54d] border border-[#7a4d28]" />
            <div>
              <h2 className="font-pixel text-xs sm:text-sm md:text-base text-[#f0c54d] tracking-wider drop-shadow-[2px_2px_0px_#1b0d04] uppercase">
                WATERMELON AGRONOMY FIELD GUIDEBOOK
              </h2>
              <p className="text-[11px] sm:text-xs text-[#d7be9f] mt-0.5 font-bold">
                Agricultural Extension Manual: Citrullus lanatus Production Science
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.playMenuClick();
              onClose();
            }}
            className="pixel-btn px-3 py-1 text-xs font-pixel text-white bg-[#801515] hover:bg-[#a81c1c] border-2 border-[#ff9999]"
            aria-label="Close agricultural guidebook"
          >
            [X] CLOSE [G]
          </button>
        </div>

        {/* Search Bar with Wood Inset */}
        <div className="mb-3 px-1">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search agricultural terms (e.g. pH, Brix, Erwinia, plasticulture, tendril, cavitation)..."
            className="w-full bg-[#fdfaf3] border-3 border-[#6b4423] px-3 py-1.5 text-xs text-[#2b180a] placeholder-[#8d715a] font-bold focus:outline-none focus:border-[#d49b28] shadow-inner"
          />
        </div>

        {/* Content Layout: Natural Earth Tone Sidebar Tabs & Warm Parchment Display */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 overflow-hidden min-h-0">
          {/* Sidebar Tabs on the Left: Natural Earth Tones (Yellows, Browns, Tans) with Thick Outlines */}
          <div className="md:col-span-4 overflow-y-auto pixel-scroll space-y-2 pr-1">
            <div className="font-pixel text-[9px] text-[#f0c54d] mb-1 px-1 tracking-wider uppercase">
              FIELD MANUAL CHAPTERS:
            </div>
            {filteredChapters.map((chap, idx) => {
              const isActive = chap.id === activeChapter.id;

              // Earth tone tab color varieties: warm amber yellow, russet brown, tan, olive
              const tabThemes = [
                { bg: 'bg-[#b8860b]', activeBg: 'bg-[#d49b28]', border: 'border-[#593d04]' }, // Yellow/Gold
                { bg: 'bg-[#5d3a1e]', activeBg: 'bg-[#7a4d28]', border: 'border-[#2d1808]' }, // Brown
                { bg: 'bg-[#3b5323]', activeBg: 'bg-[#4e6e2e]', border: 'border-[#1e2d10]' }, // Olive
                { bg: 'bg-[#783f04]', activeBg: 'bg-[#964f06]', border: 'border-[#402002]' }, // Russet
                { bg: 'bg-[#8a6240]', activeBg: 'bg-[#a37650]', border: 'border-[#45301e]' }, // Tan
              ];
              const theme = tabThemes[idx % tabThemes.length];

              return (
                <button
                  key={chap.id}
                  onClick={() => {
                    audio.playMenuClick();
                    setActiveChapterId(chap.id);
                  }}
                  className={`w-full text-left p-2.5 border-3 transition-all flex items-center gap-2.5 cursor-pointer shadow-md ${
                    isActive
                      ? `${theme.activeBg} border-[#ffffff] text-white translate-x-1 shadow-[0_0_12px_rgba(240,197,77,0.4)]`
                      : `${theme.bg} ${theme.border} text-[#fbf6ec] hover:translate-x-0.5 opacity-90 hover:opacity-100`
                  }`}
                >
                  {/* Custom Pixel-Art Icon */}
                  {renderTabIcon(chap.id)}

                  <div className="flex-1 min-w-0">
                    <span className="font-pixel text-[8px] sm:text-[9px] text-[#ffe699] uppercase tracking-wider block truncate">
                      {chap.category}
                    </span>
                    <span className="text-xs font-bold leading-tight block text-white drop-shadow-[1px_1px_0px_#000000]">
                      {chap.title}
                    </span>
                  </div>

                  {isActive && (
                    <span className="font-pixel text-xs text-[#ffffff] animate-odyssey-cursor">►</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Content Display: Warm Parchment/Cream Paper with High-Contrast Dark Text & Vibrant Headers */}
          <div className="md:col-span-8 pixel-parchment pixel-scroll p-4 sm:p-6 overflow-y-auto space-y-4">
            {/* Header: Vibrant Pixel Typography with Drop Shadows */}
            <div className="border-b-2 border-[#bba377] pb-3">
              <div className="font-pixel text-[9px] sm:text-[10px] text-[#85532d] uppercase tracking-wider">
                {activeChapter.category}
              </div>
              <h3 className="font-pixel text-sm sm:text-base md:text-lg text-[#1b5e20] drop-shadow-[2px_2px_0px_#c8e6c9] leading-snug mt-1">
                {activeChapter.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#4a2e13] font-bold mt-1.5 leading-relaxed">
                {activeChapter.summary}
              </p>
            </div>

            {/* Inset Illustrated Pixel Art Playbook Panel */}
            {renderIllustrationPanel(activeChapter.id)}

            {/* Chapter Sections */}
            <div className="space-y-4">
              {activeChapter.sections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-1.5">
                  <h4 className="font-pixel text-xs text-[#962d22] drop-shadow-[1px_1px_0px_#ffcdd2] tracking-wide">
                    {sec.heading}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#271809] leading-relaxed font-bold">
                    {sec.content}
                  </p>
                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1 text-xs text-[#3a220b] font-bold">
                      {sec.bulletPoints.map((bp, bpIdx) => (
                        <li key={bpIdx} className="leading-snug">
                          {bp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Footnote Seal */}
            <div className="pt-3 border-t border-[#d8c29d] flex items-center justify-between text-[10px] text-[#795548] font-pixel">
              <span>AGRONOMIC SPECIFICATION · CITRULLUS LANATUS</span>
              <span>VERIFIED EXTENSION BULLETIN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
