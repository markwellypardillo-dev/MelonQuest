/**
 * Procedural Pixel Art Sprite Generator for MelonQuest.
 * Renders the 2x2 grid of 4 distinct square garden plots (112x92 px each):
 * - Plot 1 (Top-Left): Initial unkempt state covered in pixelated rocks, debris, and weeds ("Clear [E]")
 * - Plot 2 (Top-Right): Preparation state with freshly tilled dark clean soil scattered with fertilizer & seed holes ("Sow [E]")
 * - Plot 3 (Bottom-Left): Growth state with sprawling green watermelon vines, bright yellow flowers, and small light-green unripe melons
 * - Plot 4 (Bottom-Right): Harvest state with massive, fully mature dark-green striped watermelons ("[E] Harvest")
 * Strict zero-emoji policy applied.
 */

import {
  type PlayerCustomizationState,
  CHARACTER_BASES,
  HAIR_COLOR_PALETTES,
} from './characterCustomization.ts';

export interface SpriteAtlas {
  player: {
    down: HTMLCanvasElement[];
    up: HTMLCanvasElement[];
    left: HTMLCanvasElement[];
    right: HTMLCanvasElement[];
  };
  playerJump: {
    down: HTMLCanvasElement[];
    up: HTMLCanvasElement[];
    left: HTMLCanvasElement[];
    right: HTMLCanvasElement[];
  };
  playerPlanting: HTMLCanvasElement;
  playerChopping: HTMLCanvasElement[];
  playerClearing: HTMLCanvasElement[];
  playerSowing: HTMLCanvasElement[];
  playerHarvesting: HTMLCanvasElement[];
  playerSleeping: HTMLCanvasElement[];
  npcs: {
    professor: HTMLCanvasElement;
    rosa: HTMLCanvasElement;
    maya: HTMLCanvasElement;
    merchant: HTMLCanvasElement;
  };
  tiles: {
    grass: HTMLCanvasElement;
    grassVariants: HTMLCanvasElement[];
    dirt: HTMLCanvasElement;
    dirtVariants: HTMLCanvasElement[];
    pathDirtVariants: HTMLCanvasElement[];
    tilled: HTMLCanvasElement;
    tilledRowLeft: HTMLCanvasElement;
    tilledRowMidVariants: HTMLCanvasElement[];
    tilledRowRight: HTMLCanvasElement;
    plasticMulch: HTMLCanvasElement;
    water: HTMLCanvasElement;
    fence: HTMLCanvasElement;
    labWall: HTMLCanvasElement;
    labRoof: HTMLCanvasElement;
    labDoor: HTMLCanvasElement;
    labWindow: HTMLCanvasElement;
    stoneObstacle: HTMLCanvasElement;
    weedObstacle: HTMLCanvasElement;
    soilTable: HTMLCanvasElement;
    harvestBench: HTMLCanvasElement;
    irrigationValve: HTMLCanvasElement;
    bioSprayRig: HTMLCanvasElement;
    bed: HTMLCanvasElement;
    wardrobe: HTMLCanvasElement;
    marketStall: HTMLCanvasElement;
    pier: HTMLCanvasElement;
    cabinWall: HTMLCanvasElement;
    cabinRoof: HTMLCanvasElement;
    cabinDoor: HTMLCanvasElement;
    cabinWindow: HTMLCanvasElement;
    flooring: HTMLCanvasElement;
    cobble: HTMLCanvasElement;
  };
  gardenPlots: Record<1 | 2 | 3 | 4, HTMLCanvasElement>;
  cropStages: HTMLCanvasElement[];
  biologicalStages: Record<1 | 2 | 3 | 4, HTMLCanvasElement[]>;
  interactPrompt: HTMLCanvasElement;
}

function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function p(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function extractPlayerVisualConfig(customState?: PlayerCustomizationState) {
  const baseConfig = CHARACTER_BASES.find(b => b.id === customState?.baseId) || CHARACTER_BASES[0];
  const gender = customState?.gender === 'female' ? 'female' : 'male';
  const skinColor = baseConfig.skinColor;
  const skinShadow = baseConfig.skinShadow;
  const hairId = customState?.hairId || (gender === 'female' ? 'hair_long_waves' : 'hair_cropped');
  const hairPalette =
    HAIR_COLOR_PALETTES.find(c => c.id === customState?.hairColorId) || HAIR_COLOR_PALETTES[0];
  const beardId = gender === 'female' ? 'beard_clean' : customState?.beardId || 'beard_clean';
  const outfitId = customState?.outfitId || 'outfit_lab';
  const hatId = customState?.hatId || 'hat_cap';

  let bootColor = '#26170c';
  let bootHighlight = '#4a2f1b';
  let pantColor = '#1f3a52';
  let pantShadow = '#142636';
  let pantHighlight = '#2e5270';

  if (outfitId === 'outfit_flannel') {
    pantColor = '#1b354d';
    pantShadow = '#112233';
    pantHighlight = '#2c5275';
    bootColor = '#3b2311';
    bootHighlight = '#59371d';
  } else if (outfitId === 'outfit_overalls') {
    pantColor = '#285582';
    pantShadow = '#1a3a59';
    pantHighlight = '#3b73a8';
    bootColor = '#5c3818';
    bootHighlight = '#7d4e24';
  } else if (outfitId === 'outfit_apron') {
    pantColor = '#284560';
    pantShadow = '#1b3044';
    pantHighlight = '#385d80';
    bootColor = '#21150c';
    bootHighlight = '#3b2616';
  } else if (outfitId === 'outfit_tunic') {
    pantColor = '#8c734b';
    pantShadow = '#635032';
    pantHighlight = '#a88c60';
    bootColor = '#382210';
    bootHighlight = '#54341a';
  }

  let shirtColor = '#f4f7f2';
  let shirtShadow = '#cad2c2';
  if (outfitId === 'outfit_flannel') {
    shirtColor = '#b83527';
    shirtShadow = '#6e1c14';
  } else if (outfitId === 'outfit_apron') {
    shirtColor = '#2e5936';
    shirtShadow = '#1e3d24';
  } else if (outfitId === 'outfit_overalls') {
    shirtColor = '#f5f0e6';
    shirtShadow = '#d8cfc0';
  } else if (outfitId === 'outfit_tunic') {
    shirtColor = '#1e4d2b';
    shirtShadow = '#13331c';
  }

  return {
    gender,
    skinColor,
    skinShadow,
    hairId,
    hairMain: hairPalette.main,
    hairHighlight: hairPalette.highlight,
    hairShadow: hairPalette.shadow,
    beardId,
    outfitId,
    hatId,
    pantColor,
    pantShadow,
    pantHighlight,
    bootColor,
    bootHighlight,
    shirtColor,
    shirtShadow,
  };
}

/**
 * Draws the character's back hair layer (draping behind shoulders/neck) BEFORE torso & head.
 */
function drawPlayerBackHair(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  dir: 'down' | 'up' | 'left' | 'right',
  cfg: ReturnType<typeof extractPlayerVisualConfig>
) {
  const { hairId, hairMain, hairHighlight, hairShadow } = cfg;

  if (hairId === 'hair_long_waves') {
    if (dir === 'down' || dir === 'up') {
      // Cascading locks framing neck & shoulders (y: hy+3 .. hy+11)
      p(ctx, hx - 2, hy + 2, hairMain, 14, 9);
      p(ctx, hx - 2, hy + 4, hairHighlight, 2, 5);
      p(ctx, hx + 10, hy + 4, hairHighlight, 2, 5);
      p(ctx, hx - 1, hy + 9, hairShadow, 3, 3);
      p(ctx, hx + 8, hy + 9, hairShadow, 3, 3);
    } else if (dir === 'left') {
      p(ctx, hx + 5, hy + 2, hairMain, 6, 10);
      p(ctx, hx + 7, hy + 4, hairHighlight, 3, 6);
      p(ctx, hx + 6, hy + 10, hairShadow, 4, 2);
    } else {
      p(ctx, hx - 1, hy + 2, hairMain, 6, 10);
      p(ctx, hx, hy + 4, hairHighlight, 3, 6);
      p(ctx, hx, hy + 10, hairShadow, 4, 2);
    }
  } else if (hairId === 'hair_twin_braids') {
    if (dir === 'down' || dir === 'up') {
      // Left shoulder plait braid
      p(ctx, hx - 2, hy + 3, hairMain, 2, 9);
      p(ctx, hx - 2, hy + 4, hairHighlight, 1, 2);
      p(ctx, hx - 1, hy + 6, hairShadow, 1, 2);
      p(ctx, hx - 2, hy + 8, hairHighlight, 1, 2);
      p(ctx, hx - 2, hy + 10, '#f0c54d', 2, 1); // Gold ribbon tie
      p(ctx, hx - 2, hy + 11, hairMain, 2, 2);
      // Right shoulder plait braid
      p(ctx, hx + 10, hy + 3, hairMain, 2, 9);
      p(ctx, hx + 11, hy + 4, hairHighlight, 1, 2);
      p(ctx, hx + 10, hy + 6, hairShadow, 1, 2);
      p(ctx, hx + 11, hy + 8, hairHighlight, 1, 2);
      p(ctx, hx + 10, hy + 10, '#f0c54d', 2, 1); // Gold ribbon tie
      p(ctx, hx + 10, hy + 11, hairMain, 2, 2);
    } else if (dir === 'left') {
      p(ctx, hx + 6, hy + 3, hairMain, 3, 9);
      p(ctx, hx + 7, hy + 4, hairHighlight, 1, 2);
      p(ctx, hx + 6, hy + 6, hairShadow, 2, 2);
      p(ctx, hx + 6, hy + 10, '#f0c54d', 3, 1);
      p(ctx, hx + 6, hy + 11, hairMain, 2, 2);
    } else if (dir === 'right') {
      p(ctx, hx + 1, hy + 3, hairMain, 3, 9);
      p(ctx, hx + 2, hy + 4, hairHighlight, 1, 2);
      p(ctx, hx + 1, hy + 6, hairShadow, 2, 2);
      p(ctx, hx + 1, hy + 10, '#f0c54d', 3, 1);
      p(ctx, hx + 2, hy + 11, hairMain, 2, 2);
    }
  } else if (hairId === 'hair_ponytail') {
    if (dir === 'down') {
      // Bouncy ponytail tail peeking over right shoulder
      p(ctx, hx + 9, hy + 2, '#c0392b', 2, 2); // Scrunchie band
      p(ctx, hx + 10, hy + 3, hairMain, 3, 6);
      p(ctx, hx + 11, hy + 4, hairHighlight, 1, 3);
      p(ctx, hx + 10, hy + 8, hairShadow, 2, 2);
    } else if (dir === 'left') {
      // Ponytail arching behind head to the right
      p(ctx, hx + 9, hy, '#c0392b', 2, 2);
      p(ctx, hx + 10, hy - 1, hairMain, 3, 6);
      p(ctx, hx + 11, hy, hairHighlight, 2, 3);
      p(ctx, hx + 11, hy + 4, hairShadow, 2, 3);
    } else if (dir === 'right') {
      // Ponytail arching behind head to the left
      p(ctx, hx - 1, hy, '#c0392b', 2, 2);
      p(ctx, hx - 3, hy - 1, hairMain, 3, 6);
      p(ctx, hx - 3, hy, hairHighlight, 2, 3);
      p(ctx, hx - 3, hy + 4, hairShadow, 2, 3);
    }
  }
}

/**
 * Draws the character's realistic 16-bit torso outfit (Lab Coat, Denim Overalls, Tartan Flannel, Leather Apron, or Botanical Tunic).
 */
function drawPlayerRealisticTorso(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  dir: 'down' | 'up' | 'left' | 'right',
  cfg: ReturnType<typeof extractPlayerVisualConfig>,
  includeArms = true
) {
  const { outfitId, gender, skinColor, skinShadow } = cfg;
  const isFemale = gender === 'female';

  if (outfitId === 'outfit_lab') {
    const coatWhite = '#f5f7f5';
    const coatBright = '#ffffff';
    const coatLapel = '#cfd8d3';
    const coatShadow = '#b0bdb6';
    const shirtBlue = '#5dade2';
    const shirtDark = '#2e86c1';

    if (dir === 'down') {
      // Sky-blue collared inner shirt in center V-zone
      p(ctx, tx + 3, ty, shirtBlue, 6, 7);
      p(ctx, tx + 3, ty, shirtDark, 6, 1);
      // Tie (Male) or Emerald Botanical Brooch & V-Collar (Female)
      if (isFemale) {
        p(ctx, tx + 4, ty, skinColor, 4, 2);
        p(ctx, tx + 5, ty + 2, '#2ecc71', 2, 2); // Botanical emerald brooch
        p(ctx, tx + 5, ty + 4, shirtDark, 2, 3);
      } else {
        p(ctx, tx + 5, ty + 1, '#c0392b', 2, 5); // Crimson silk tie
        p(ctx, tx + 5, ty + 1, '#e74c3c', 1, 3);
      }

      // Left & Right tailored White Lab Coat panels + long coat tails extending down to ty+9
      p(ctx, tx, ty, coatWhite, 4, 9);
      p(ctx, tx + 1, ty, coatBright, 2, 6);
      p(ctx, tx, ty + 7, coatShadow, 4, 2);
      p(ctx, tx + 3, ty, coatLapel, 1, 6); // Left notched lapel edge

      p(ctx, tx + 8, ty, coatWhite, 4, 9);
      p(ctx, tx + 9, ty, coatBright, 2, 6);
      p(ctx, tx + 8, ty + 7, coatShadow, 4, 2);
      p(ctx, tx + 8, ty, coatLapel, 1, 6); // Right notched lapel edge

      // Female tailored waist taper accent
      if (isFemale) {
        p(ctx, tx, ty + 5, coatShadow, 1, 2);
        p(ctx, tx + 11, ty + 5, coatShadow, 1, 2);
      }

      // Breast pocket with blue & red pens on right coat panel
      p(ctx, tx + 9, ty + 3, coatShadow, 2, 3);
      p(ctx, tx + 9, ty + 2, '#2980b9', 1, 1);
      p(ctx, tx + 10, ty + 2, '#e74c3c', 1, 1);

      if (includeArms) {
        // Left & right coat sleeves with folded cuffs & hands
        p(ctx, tx - 2, ty + 1, coatWhite, 2, 4);
        p(ctx, tx - 2, ty + 4, coatLapel, 2, 1);
        p(ctx, tx - 2, ty + 5, skinColor, 2, 3);
        p(ctx, tx - 2, ty + 7, skinShadow, 2, 1);

        p(ctx, tx + 12, ty + 1, coatWhite, 2, 4);
        p(ctx, tx + 12, ty + 4, coatLapel, 2, 1);
        p(ctx, tx + 12, ty + 5, skinColor, 2, 3);
        p(ctx, tx + 12, ty + 7, skinShadow, 2, 1);
      }
    } else if (dir === 'up') {
      // Back of white lab coat with center vent & back belt strap
      p(ctx, tx, ty, coatWhite, 12, 9);
      p(ctx, tx + 1, ty, coatBright, 10, 2);
      p(ctx, tx + 2, ty + 5, coatLapel, 8, 1); // Back waist strap
      p(ctx, tx + 5, ty + 6, coatShadow, 2, 3); // Center back vent
      if (includeArms) {
        p(ctx, tx - 2, ty + 1, coatWhite, 2, 4);
        p(ctx, tx - 2, ty + 5, skinColor, 2, 3);
        p(ctx, tx + 12, ty + 1, coatWhite, 2, 4);
        p(ctx, tx + 12, ty + 5, skinColor, 2, 3);
      }
    } else if (dir === 'left') {
      p(ctx, tx + 1, ty, coatWhite, 9, 9);
      p(ctx, tx + 3, ty, coatBright, 4, 6);
      p(ctx, tx + 8, ty, coatShadow, 2, 9);
      p(ctx, tx + 1, ty, shirtBlue, 2, 4);
      p(ctx, tx + 1, ty + 2, isFemale ? '#2ecc71' : '#c0392b', 1, 2);
      p(ctx, tx + 3, ty + 1, coatLapel, 1, 5);
      if (includeArms) {
        p(ctx, tx + 3, ty + 2, coatLapel, 4, 4);
        p(ctx, tx + 3, ty + 6, skinColor, 3, 2);
      }
    } else {
      p(ctx, tx + 2, ty, coatWhite, 9, 9);
      p(ctx, tx + 5, ty, coatBright, 4, 6);
      p(ctx, tx + 2, ty, coatShadow, 2, 9);
      p(ctx, tx + 9, ty, shirtBlue, 2, 4);
      p(ctx, tx + 10, ty + 2, isFemale ? '#2ecc71' : '#c0392b', 1, 2);
      p(ctx, tx + 8, ty + 1, coatLapel, 1, 5);
      // Pocket pens visible on side-front chest
      p(ctx, tx + 7, ty + 3, coatShadow, 2, 2);
      p(ctx, tx + 7, ty + 2, '#2980b9', 1, 1);
      p(ctx, tx + 8, ty + 2, '#e74c3c', 1, 1);
      if (includeArms) {
        p(ctx, tx + 5, ty + 2, coatLapel, 4, 4);
        p(ctx, tx + 6, ty + 6, skinColor, 3, 2);
      }
    }
  } else if (outfitId === 'outfit_overalls') {
    const shirtCream = '#f5f0e6';
    const shirtShade = '#d8cfc0';
    const denimMain = '#285582';
    const denimLight = '#3b73a8';
    const denimDark = '#1a3a59';
    const brass = '#f1c40f';

    if (dir === 'down') {
      // Soft cream workshirt under overalls
      p(ctx, tx, ty, shirtCream, 12, 6);
      p(ctx, tx + 4, ty, shirtShade, 4, 2); // Collar V-stitch
      if (isFemale) p(ctx, tx + 5, ty, skinColor, 2, 1);

      // Denim Shoulder Straps (left & right)
      p(ctx, tx + 2, ty, denimMain, 2, 3);
      p(ctx, tx + 8, ty, denimMain, 2, 3);
      // Gleaming Brass Overall Buckles
      p(ctx, tx + 2, ty + 2, brass, 2, 1);
      p(ctx, tx + 8, ty + 2, brass, 2, 1);

      // Full Denim Chest Bib & Seamless Waist Band (covers belt!)
      p(ctx, tx + 2, ty + 3, denimMain, 8, 5);
      p(ctx, tx + 3, ty + 3, denimLight, 6, 1);
      p(ctx, tx, ty + 6, denimDark, 12, 2);
      p(ctx, tx + 1, ty + 6, denimMain, 10, 2);
      // Stitched Chest Bib Pocket with Gold Top-Stitch
      p(ctx, tx + 4, ty + 4, denimDark, 4, 3);
      p(ctx, tx + 4, ty + 4, '#d4a838', 4, 1);
      // Brass side hip rivets
      p(ctx, tx + 1, ty + 7, brass, 1, 1);
      p(ctx, tx + 10, ty + 7, brass, 1, 1);

      if (includeArms) {
        p(ctx, tx - 2, ty + 1, shirtCream, 2, 3);
        p(ctx, tx - 2, ty + 3, shirtShade, 2, 1);
        p(ctx, tx - 2, ty + 4, skinColor, 2, 4);
        p(ctx, tx - 2, ty + 7, skinShadow, 2, 1);

        p(ctx, tx + 12, ty + 1, shirtCream, 2, 3);
        p(ctx, tx + 12, ty + 3, shirtShade, 2, 1);
        p(ctx, tx + 12, ty + 4, skinColor, 2, 4);
        p(ctx, tx + 12, ty + 7, skinShadow, 2, 1);
      }
    } else if (dir === 'up') {
      // Back of cream shirt with crossed Y-back denim straps
      p(ctx, tx, ty, shirtCream, 12, 6);
      p(ctx, tx + 2, ty, denimMain, 2, 3);
      p(ctx, tx + 8, ty, denimMain, 2, 3);
      p(ctx, tx + 4, ty + 2, denimMain, 4, 4);
      p(ctx, tx, ty + 5, denimMain, 12, 3);
      p(ctx, tx + 1, ty + 6, denimDark, 10, 2);
      if (includeArms) {
        p(ctx, tx - 2, ty + 1, shirtCream, 2, 3);
        p(ctx, tx - 2, ty + 4, skinColor, 2, 4);
        p(ctx, tx + 12, ty + 1, shirtCream, 2, 3);
        p(ctx, tx + 12, ty + 4, skinColor, 2, 4);
      }
    } else if (dir === 'left') {
      p(ctx, tx + 1, ty, shirtCream, 9, 6);
      p(ctx, tx + 2, ty, denimMain, 4, 8);
      p(ctx, tx + 1, ty + 5, denimMain, 9, 3);
      p(ctx, tx + 3, ty + 2, brass, 1, 1);
      if (includeArms) {
        p(ctx, tx + 3, ty + 1, shirtCream, 4, 3);
        p(ctx, tx + 3, ty + 4, skinColor, 3, 4);
      }
    } else {
      p(ctx, tx + 2, ty, shirtCream, 9, 6);
      p(ctx, tx + 6, ty, denimMain, 4, 8);
      p(ctx, tx + 2, ty + 5, denimMain, 9, 3);
      p(ctx, tx + 8, ty + 2, brass, 1, 1);
      if (includeArms) {
        p(ctx, tx + 5, ty + 1, shirtCream, 4, 3);
        p(ctx, tx + 6, ty + 4, skinColor, 3, 4);
      }
    }
  } else if (outfitId === 'outfit_flannel') {
    const redBase = '#b83527';
    const redBright = '#e04838';
    const burgundy = '#6e1c14';
    const charcoal = '#2b110e';

    if (dir === 'down') {
      // Base flannel body
      p(ctx, tx, ty, redBase, 12, 7);
      // Micro-tartan woven plaid vertical & horizontal stripes
      p(ctx, tx + 2, ty, redBright, 2, 7);
      p(ctx, tx + 8, ty, redBright, 2, 7);
      p(ctx, tx, ty + 2, burgundy, 12, 1);
      p(ctx, tx, ty + 5, burgundy, 12, 1);
      // Dark charcoal plaid intersections
      p(ctx, tx + 2, ty + 2, charcoal, 2, 1);
      p(ctx, tx + 8, ty + 2, charcoal, 2, 1);
      p(ctx, tx + 2, ty + 5, charcoal, 2, 1);
      p(ctx, tx + 8, ty + 5, charcoal, 2, 1);

      // Collared V-neck & cream henley undershirt
      p(ctx, tx + 5, ty, '#f5eedc', 2, 2);
      p(ctx, tx + 3, ty, charcoal, 2, 2); // Left collar point
      p(ctx, tx + 7, ty, charcoal, 2, 2); // Right collar point
      // Center button placket with pearl buttons
      p(ctx, tx + 5, ty + 2, burgundy, 2, 5);
      p(ctx, tx + 5, ty + 2, '#f5cba7', 1, 1);
      p(ctx, tx + 5, ty + 4, '#f5cba7', 1, 1);
      p(ctx, tx + 5, ty + 6, '#f5cba7', 1, 1);

      if (includeArms) {
        // Rolled flannel sleeves with bare forearms
        p(ctx, tx - 2, ty + 1, redBase, 2, 3);
        p(ctx, tx - 2, ty + 3, burgundy, 2, 1);
        p(ctx, tx - 2, ty + 4, skinColor, 2, 4);
        p(ctx, tx - 2, ty + 7, skinShadow, 2, 1);

        p(ctx, tx + 12, ty + 1, redBase, 2, 3);
        p(ctx, tx + 12, ty + 3, burgundy, 2, 1);
        p(ctx, tx + 12, ty + 4, skinColor, 2, 4);
        p(ctx, tx + 12, ty + 7, skinShadow, 2, 1);
      }
    } else if (dir === 'up') {
      p(ctx, tx, ty, redBase, 12, 7);
      p(ctx, tx, ty, burgundy, 12, 2); // Shoulder yoke
      p(ctx, tx + 2, ty + 2, redBright, 2, 5);
      p(ctx, tx + 8, ty + 2, redBright, 2, 5);
      p(ctx, tx, ty + 3, burgundy, 12, 1);
      p(ctx, tx, ty + 5, burgundy, 12, 1);
      if (includeArms) {
        p(ctx, tx - 2, ty + 1, redBase, 2, 3);
        p(ctx, tx - 2, ty + 4, skinColor, 2, 4);
        p(ctx, tx + 12, ty + 1, redBase, 2, 3);
        p(ctx, tx + 12, ty + 4, skinColor, 2, 4);
      }
    } else if (dir === 'left') {
      p(ctx, tx + 1, ty, redBase, 9, 7);
      p(ctx, tx + 1, ty + 2, burgundy, 9, 1);
      p(ctx, tx + 1, ty + 5, burgundy, 9, 1);
      p(ctx, tx + 4, ty, redBright, 2, 7);
      if (includeArms) {
        p(ctx, tx + 3, ty + 1, redBase, 4, 3);
        p(ctx, tx + 3, ty + 4, skinColor, 3, 4);
      }
    } else {
      p(ctx, tx + 2, ty, redBase, 9, 7);
      p(ctx, tx + 2, ty + 2, burgundy, 9, 1);
      p(ctx, tx + 2, ty + 5, burgundy, 9, 1);
      p(ctx, tx + 6, ty, redBright, 2, 7);
      if (includeArms) {
        p(ctx, tx + 5, ty + 1, redBase, 4, 3);
        p(ctx, tx + 6, ty + 4, skinColor, 3, 4);
      }
    }
  } else if (outfitId === 'outfit_apron') {
    const tunicGreen = '#2e5936';
    const tunicShade = '#1e3d24';
    const leatherMain = '#8c4d1f';
    const leatherHighlight = '#a6602b';
    const leatherDark = '#4a270d';
    const strap = '#3b210f';

    if (dir === 'down') {
      // Botanical sage-green undershirt
      p(ctx, tx, ty, tunicGreen, 12, 7);
      p(ctx, tx + 4, ty, tunicShade, 4, 1);

      // Leather neck straps & brass grommets
      p(ctx, tx + 2, ty, strap, 2, 2);
      p(ctx, tx + 8, ty, strap, 2, 2);
      p(ctx, tx + 2, ty + 1, '#f0c54d', 1, 1);
      p(ctx, tx + 9, ty + 1, '#f0c54d', 1, 1);

      // Contoured Saddle-Leather Apron Bib & Lower Skirt (extends to ty+9 over belt!)
      p(ctx, tx + 2, ty + 2, leatherMain, 8, 4);
      p(ctx, tx + 3, ty + 2, leatherHighlight, 6, 1);
      p(ctx, tx + 1, ty + 6, leatherMain, 10, 4);
      p(ctx, tx + 1, ty + 9, leatherDark, 10, 1);

      // Stitched Tool Pouch on Apron with Shears & Field Notebook
      p(ctx, tx + 3, ty + 5, leatherDark, 6, 3);
      p(ctx, tx + 4, ty + 4, '#bdc3c7', 1, 2); // Steel shear blade
      p(ctx, tx + 5, ty + 4, '#e74c3c', 1, 1); // Shear handle
      p(ctx, tx + 7, ty + 4, '#f0c54d', 2, 1); // Field notebook edge

      if (includeArms) {
        p(ctx, tx - 2, ty + 1, tunicGreen, 2, 3);
        p(ctx, tx - 2, ty + 3, tunicShade, 2, 1);
        p(ctx, tx - 2, ty + 4, skinColor, 2, 4);
        p(ctx, tx - 2, ty + 7, skinShadow, 2, 1);

        p(ctx, tx + 12, ty + 1, tunicGreen, 2, 3);
        p(ctx, tx + 12, ty + 3, tunicShade, 2, 1);
        p(ctx, tx + 12, ty + 4, skinColor, 2, 4);
        p(ctx, tx + 12, ty + 7, skinShadow, 2, 1);
      }
    } else if (dir === 'up') {
      // Sage tunic back with X-crossed dark leather apron straps & waist tie
      p(ctx, tx, ty, tunicGreen, 12, 7);
      p(ctx, tx + 2, ty, strap, 2, 3);
      p(ctx, tx + 8, ty, strap, 2, 3);
      p(ctx, tx + 4, ty + 2, strap, 4, 3);
      p(ctx, tx, ty + 5, strap, 12, 2);
      if (includeArms) {
        p(ctx, tx - 2, ty + 1, tunicGreen, 2, 3);
        p(ctx, tx - 2, ty + 4, skinColor, 2, 4);
        p(ctx, tx + 12, ty + 1, tunicGreen, 2, 3);
        p(ctx, tx + 12, ty + 4, skinColor, 2, 4);
      }
    } else if (dir === 'left') {
      p(ctx, tx + 1, ty, tunicGreen, 9, 7);
      p(ctx, tx + 1, ty + 2, leatherMain, 5, 8);
      p(ctx, tx + 1, ty + 5, strap, 9, 1);
      if (includeArms) {
        p(ctx, tx + 3, ty + 1, tunicGreen, 4, 3);
        p(ctx, tx + 3, ty + 4, skinColor, 3, 4);
      }
    } else {
      p(ctx, tx + 2, ty, tunicGreen, 9, 7);
      p(ctx, tx + 6, ty + 2, leatherMain, 5, 8);
      p(ctx, tx + 2, ty + 5, strap, 9, 1);
      if (includeArms) {
        p(ctx, tx + 5, ty + 1, tunicGreen, 4, 3);
        p(ctx, tx + 6, ty + 4, skinColor, 3, 4);
      }
    }
  } else {
    // outfit_tunic: Botanical Field Tunic (Emerald with Gold Embroidery & Satchel Strap)
    const emerald = '#1e4d2b';
    const emeraldLight = '#29693b';
    const emeraldDark = '#13331c';
    const gold = '#f0c54d';
    const leather = '#6e4320';

    if (dir === 'down') {
      p(ctx, tx, ty, emerald, 12, 8);
      p(ctx, tx + 1, ty, emeraldLight, 10, 2);
      p(ctx, tx + 4, ty, gold, 4, 1); // Gold embroidered collar trim
      p(ctx, tx + 5, ty + 1, gold, 2, 3);
      // Diagonal leather botanist satchel strap across chest
      p(ctx, tx + 2, ty, leather, 2, 2);
      p(ctx, tx + 4, ty + 2, leather, 2, 2);
      p(ctx, tx + 6, ty + 4, leather, 2, 2);
      p(ctx, tx + 8, ty + 6, leather, 2, 2);
      // Tunic belt & brass clasp
      p(ctx, tx, ty + 6, '#382210', 12, 2);
      p(ctx, tx + 5, ty + 6, gold, 2, 2);
      // Tunic skirt hem below belt
      p(ctx, tx, ty + 8, emeraldDark, 12, 1);
      p(ctx, tx + 1, ty + 8, gold, 10, 1);

      if (includeArms) {
        p(ctx, tx - 2, ty + 1, emerald, 2, 4);
        p(ctx, tx - 2, ty + 4, gold, 2, 1);
        p(ctx, tx - 2, ty + 5, skinColor, 2, 3);
        p(ctx, tx + 12, ty + 1, emerald, 2, 4);
        p(ctx, tx + 12, ty + 4, gold, 2, 1);
        p(ctx, tx + 12, ty + 5, skinColor, 2, 3);
      }
    } else if (dir === 'left') {
      p(ctx, tx + 1, ty, emerald, 9, 8);
      p(ctx, tx + 1, ty, gold, 3, 1);
      p(ctx, tx + 3, ty + 2, leather, 4, 4);
      p(ctx, tx + 1, ty + 6, '#382210', 9, 2);
      p(ctx, tx + 1, ty + 8, gold, 9, 1);
      if (includeArms) {
        p(ctx, tx + 3, ty + 1, emeraldLight, 4, 3);
        p(ctx, tx + 3, ty + 4, gold, 4, 1);
        p(ctx, tx + 3, ty + 5, skinColor, 3, 3);
      }
    } else if (dir === 'right') {
      p(ctx, tx + 2, ty, emerald, 9, 8);
      p(ctx, tx + 8, ty, gold, 3, 1);
      p(ctx, tx + 5, ty + 2, leather, 4, 4);
      p(ctx, tx + 2, ty + 6, '#382210', 9, 2);
      p(ctx, tx + 9, ty + 6, gold, 2, 2);
      p(ctx, tx + 2, ty + 8, gold, 9, 1);
      if (includeArms) {
        p(ctx, tx + 5, ty + 1, emeraldLight, 4, 3);
        p(ctx, tx + 5, ty + 4, gold, 4, 1);
        p(ctx, tx + 6, ty + 5, skinColor, 3, 3);
      }
    } else {
      p(ctx, tx, ty, emerald, 12, 8);
      p(ctx, tx, ty + 6, '#382210', 12, 2);
      if (includeArms) {
        p(ctx, tx - 2, ty + 1, emerald, 2, 4);
        p(ctx, tx - 2, ty + 5, skinColor, 2, 3);
        p(ctx, tx + 12, ty + 1, emerald, 2, 4);
        p(ctx, tx + 12, ty + 5, skinColor, 2, 3);
      }
    }
  }
}

/**
 * Draws the character's head, expressive eyes/eyelashes/blush (Male vs Female),
 * facial hair, multi-tone front/crown hair, and headwear (No Hat, Field Cap, Straw Sunhat, or Headband).
 */
function drawPlayerHeadAndCrown(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  dir: 'down' | 'up' | 'left' | 'right',
  cfg: ReturnType<typeof extractPlayerVisualConfig>
) {
  const {
    gender,
    skinColor,
    skinShadow,
    hairId,
    hairMain,
    hairHighlight,
    hairShadow,
    beardId,
    hatId,
  } = cfg;
  const isFemale = gender === 'female';

  // 1. Base Head & Ears (hx..hx+9, hy..hy+6)
  p(ctx, hx, hy, skinColor, 10, 7);
  p(ctx, hx, hy + 5, skinShadow, 10, 2);
  if (isFemale) {
    // Softer chin contour on corners
    p(ctx, hx, hy + 6, skinShadow, 1, 1);
    p(ctx, hx + 9, hy + 6, skinShadow, 1, 1);
  }
  if (dir === 'down' || dir === 'up') {
    p(ctx, hx - 1, hy + 2, skinColor, 1, 2); // Left ear
    p(ctx, hx + 10, hy + 2, skinColor, 1, 2); // Right ear
  }

  // 2. Facial Features (Eyes, Sclera Shine, Eyebrows, Female Eyelashes/Blush/Lips)
  if (dir === 'down') {
    // Eyebrows
    p(ctx, hx + 1, hy + 1, hairShadow, 3, 1);
    p(ctx, hx + 6, hy + 1, hairShadow, 3, 1);

    // Expressive 16-bit eyes with subtle sclera highlight
    p(ctx, hx + 2, hy + 2, '#141414', 2, 2);
    p(ctx, hx + 1, hy + 2, '#ffffff', 1, 2);
    p(ctx, hx + 6, hy + 2, '#141414', 2, 2);
    p(ctx, hx + 8, hy + 2, '#ffffff', 1, 2);

    if (isFemale) {
      // Delicate outer eyelashes
      p(ctx, hx, hy + 2, '#141414', 1, 1);
      p(ctx, hx + 9, hy + 2, '#141414', 1, 1);
      // Warm rosy cheek blush
      p(ctx, hx + 1, hy + 4, 'rgba(231, 110, 110, 0.55)', 2, 1);
      p(ctx, hx + 7, hy + 4, 'rgba(231, 110, 110, 0.55)', 2, 1);
      // Subtle rose lip tint
      p(ctx, hx + 4, hy + 5, '#c96565', 2, 1);
    } else {
      // Classic nose/mouth shadow
      p(ctx, hx + 4, hy + 4, skinShadow, 2, 1);
    }
  } else if (dir === 'left') {
    p(ctx, hx + 1, hy + 1, hairShadow, 2, 1);
    p(ctx, hx + 1, hy + 2, '#141414', 2, 2);
    p(ctx, hx + 3, hy + 2, '#ffffff', 1, 2);
    if (isFemale) {
      p(ctx, hx, hy + 2, '#141414', 1, 1);
      p(ctx, hx + 2, hy + 4, 'rgba(231, 110, 110, 0.55)', 2, 1);
    }
  } else if (dir === 'right') {
    p(ctx, hx + 7, hy + 1, hairShadow, 2, 1);
    p(ctx, hx + 7, hy + 2, '#141414', 2, 2);
    p(ctx, hx + 6, hy + 2, '#ffffff', 1, 2);
    if (isFemale) {
      p(ctx, hx + 9, hy + 2, '#141414', 1, 1);
      p(ctx, hx + 6, hy + 4, 'rgba(231, 110, 110, 0.55)', 2, 1);
    }
  }

  // 3. Facial Hair (Male / When Equipped)
  if (!isFemale && beardId !== 'beard_clean') {
    if (beardId === 'beard_stubble') {
      if (dir === 'down') {
        p(ctx, hx + 1, hy + 5, hairShadow, 8, 2);
        p(ctx, hx + 4, hy + 4, hairShadow, 2, 1);
      } else if (dir === 'left') {
        p(ctx, hx, hy + 5, hairShadow, 5, 2);
      } else if (dir === 'right') {
        p(ctx, hx + 5, hy + 5, hairShadow, 5, 2);
      }
    } else if (beardId === 'beard_full') {
      if (dir === 'down') {
        p(ctx, hx, hy + 4, hairMain, 10, 3);
        p(ctx, hx + 1, hy + 7, hairMain, 8, 2);
        p(ctx, hx + 2, hy + 8, hairShadow, 6, 1);
        p(ctx, hx + 4, hy + 5, skinShadow, 2, 1); // Mouth opening highlight
      } else if (dir === 'left') {
        p(ctx, hx, hy + 4, hairMain, 6, 4);
        p(ctx, hx, hy + 7, hairShadow, 5, 1);
      } else if (dir === 'right') {
        p(ctx, hx + 4, hy + 4, hairMain, 6, 4);
        p(ctx, hx + 5, hy + 7, hairShadow, 5, 1);
      }
    } else if (beardId === 'beard_mustache') {
      if (dir === 'down') {
        p(ctx, hx + 2, hy + 4, hairMain, 6, 2);
        p(ctx, hx + 1, hy + 5, hairShadow, 2, 1);
        p(ctx, hx + 7, hy + 5, hairShadow, 2, 1);
      } else if (dir === 'left') {
        p(ctx, hx, hy + 4, hairMain, 4, 2);
      } else if (dir === 'right') {
        p(ctx, hx + 6, hy + 4, hairMain, 4, 2);
      }
    }
  }

  // 4. Front & Crown Hair Layer (Always draws visible bangs/locks + full crown when hat_none/hat_bandana)
  const showFullCrown = hatId === 'hat_none' || hatId === 'hat_bandana';

  if (dir === 'up') {
    // Back of head hair coverage
    if (hairId !== 'hair_bald') {
      p(ctx, hx - 1, hy - 2, hairMain, 12, 8);
      p(ctx, hx + 1, hy - 2, hairHighlight, 8, 2);
      p(ctx, hx - 1, hy + 4, hairShadow, 12, 2);
    } else {
      p(ctx, hx, hy - 1, hairShadow, 10, 4);
    }
    if (hairId === 'hair_ponytail') {
      p(ctx, hx + 4, hy + 1, '#c0392b', 2, 2);
      p(ctx, hx + 3, hy + 3, hairMain, 4, 6);
      p(ctx, hx + 4, hy + 3, hairHighlight, 2, 4);
    } else if (hairId === 'hair_bun' && showFullCrown) {
      p(ctx, hx + 2, hy - 5, hairMain, 6, 4);
      p(ctx, hx + 3, hy - 5, hairHighlight, 4, 2);
      p(ctx, hx + 2, hy - 2, '#f0c54d', 6, 1);
    }
  } else if (dir === 'down') {
    // Side locks / bangs visible even under caps/hats
    if (hairId === 'hair_long_waves') {
      // Soft parted curtain bangs & long front shoulder locks
      p(ctx, hx - 1, hy - 1, hairMain, 4, 3);
      p(ctx, hx + 7, hy - 1, hairMain, 4, 3);
      p(ctx, hx - 2, hy + 1, hairMain, 2, 9);
      p(ctx, hx - 2, hy + 3, hairHighlight, 1, 4);
      p(ctx, hx + 10, hy + 1, hairMain, 2, 9);
      p(ctx, hx + 11, hy + 3, hairHighlight, 1, 4);
    } else if (hairId === 'hair_twin_braids') {
      p(ctx, hx - 1, hy - 1, hairMain, 4, 3);
      p(ctx, hx + 7, hy - 1, hairMain, 4, 3);
      p(ctx, hx - 1, hy, hairMain, 2, 4);
      p(ctx, hx + 9, hy, hairMain, 2, 4);
    } else if (hairId === 'hair_ponytail' || hairId === 'hair_bun') {
      // Face-framing side tendrils & swept bangs
      p(ctx, hx - 1, hy - 1, hairMain, 4, 2);
      p(ctx, hx + 7, hy - 1, hairMain, 4, 2);
      p(ctx, hx - 1, hy + 1, hairMain, 1, 5);
      p(ctx, hx + 10, hy + 1, hairMain, 1, 5);
    } else if (hairId === 'hair_waves') {
      // Wavy forehead locks & sideburns
      p(ctx, hx - 1, hy - 1, hairMain, 12, 2);
      p(ctx, hx + 1, hy, hairMain, 2, 1);
      p(ctx, hx + 5, hy, hairMain, 2, 1);
      p(ctx, hx - 1, hy, hairMain, 2, 4);
      p(ctx, hx + 9, hy, hairMain, 2, 4);
    } else if (hairId === 'hair_cropped') {
      // Neat side-part bangs & temples
      p(ctx, hx - 1, hy - 1, hairMain, 8, 2);
      p(ctx, hx + 8, hy - 1, hairMain, 3, 2);
      p(ctx, hx - 1, hy, hairMain, 2, 3);
      p(ctx, hx + 9, hy, hairMain, 2, 3);
    }

    if (showFullCrown) {
      if (hairId === 'hair_bald') {
        p(ctx, hx, hy - 2, hairShadow, 10, 2);
      } else {
        // Lush multi-tone crown hair (hy-4 .. hy-1)
        p(ctx, hx, hy - 4, hairMain, 10, 3);
        p(ctx, hx - 1, hy - 3, hairMain, 12, 3);
        p(ctx, hx + 1, hy - 4, hairHighlight, 8, 1);
        p(ctx, hx + 2, hy - 3, hairHighlight, 4, 1);
        if (hairId === 'hair_cropped') {
          p(ctx, hx + 7, hy - 3, hairShadow, 1, 3); // Side-part line
        } else if (hairId === 'hair_long_waves' || hairId === 'hair_twin_braids') {
          p(ctx, hx + 4, hy - 4, hairShadow, 2, 3); // Center part
        } else if (hairId === 'hair_bun') {
          // Sculpted top-bun on crown with gold hairpin
          p(ctx, hx + 2, hy - 6, hairMain, 6, 3);
          p(ctx, hx + 3, hy - 6, hairHighlight, 4, 1);
          p(ctx, hx + 2, hy - 4, '#f0c54d', 6, 1);
        } else if (hairId === 'hair_ponytail') {
          p(ctx, hx + 3, hy - 5, '#c0392b', 4, 1);
          p(ctx, hx + 2, hy - 6, hairMain, 6, 2);
        }
      }
    }
  } else if (dir === 'left') {
    if (hairId !== 'hair_bald') {
      p(ctx, hx, hy - 1, hairMain, 10, 2);
      p(ctx, hx + 4, hy, hairMain, 6, 5);
      p(ctx, hx + 6, hy + 1, hairHighlight, 2, 3);
      if (showFullCrown) {
        p(ctx, hx, hy - 4, hairMain, 10, 3);
        p(ctx, hx + 1, hy - 4, hairHighlight, 7, 1);
        if (hairId === 'hair_bun') {
          p(ctx, hx + 5, hy - 6, hairMain, 5, 3);
          p(ctx, hx + 5, hy - 4, '#f0c54d', 4, 1);
        }
      }
    }
  } else {
    if (hairId !== 'hair_bald') {
      p(ctx, hx, hy - 1, hairMain, 10, 2);
      p(ctx, hx, hy, hairMain, 6, 5);
      p(ctx, hx + 2, hy + 1, hairHighlight, 2, 3);
      if (showFullCrown) {
        p(ctx, hx, hy - 4, hairMain, 10, 3);
        p(ctx, hx + 2, hy - 4, hairHighlight, 7, 1);
        if (hairId === 'hair_bun') {
          p(ctx, hx, hy - 6, hairMain, 5, 3);
          p(ctx, hx + 1, hy - 4, '#f0c54d', 4, 1);
        }
      }
    }
  }

  // 5. Headwear Layer (Field Cap, Straw Sunhat, or Harvest Headband)
  if (hatId === 'hat_bandana') {
    p(ctx, hx - 1, hy - 2, '#b03a2e', 12, 2);
    p(ctx, hx + 1, hy - 2, '#f0c54d', 2, 1);
    p(ctx, hx + 5, hy - 2, '#f0c54d', 2, 1);
    p(ctx, hx + 9, hy - 2, '#f0c54d', 2, 1);
  } else if (hatId === 'hat_cap') {
    const capCrown = '#2d6e28';
    const capHighlight = '#489e40';
    const capShadow = '#1d4a19';
    const capVisor = '#153812';

    if (dir === 'down') {
      p(ctx, hx, hy - 5, capCrown, 10, 4);
      p(ctx, hx + 1, hy - 5, capHighlight, 8, 1);
      p(ctx, hx + 4, hy - 4, '#f0c54d', 2, 2); // Golden agronomy cap emblem
      p(ctx, hx - 1, hy - 2, capVisor, 12, 2);
      p(ctx, hx, hy - 2, capShadow, 10, 1);
    } else if (dir === 'up') {
      p(ctx, hx, hy - 5, capCrown, 10, 5);
      p(ctx, hx + 1, hy - 5, capHighlight, 8, 1);
      p(ctx, hx, hy - 1, capShadow, 10, 1);
      p(ctx, hx + 3, hy - 1, '#d4a838', 4, 1); // Cap adjuster strap
    } else if (dir === 'left') {
      p(ctx, hx, hy - 5, capCrown, 10, 4);
      p(ctx, hx + 1, hy - 5, capHighlight, 7, 1);
      p(ctx, hx - 3, hy - 2, capVisor, 9, 2);
    } else {
      p(ctx, hx, hy - 5, capCrown, 10, 4);
      p(ctx, hx + 2, hy - 5, capHighlight, 7, 1);
      p(ctx, hx + 4, hy - 2, capVisor, 9, 2);
    }
  } else if (hatId === 'hat_straw') {
    const strawMain = '#e5be53';
    const strawLight = '#f7dc6f';
    const strawShade = '#c29629';
    const ribbon = '#b03a2e';

    // Wide-brimmed golden straw sunhat
    p(ctx, hx, hy - 5, strawMain, 10, 3);
    p(ctx, hx + 1, hy - 5, strawLight, 8, 1);
    p(ctx, hx, hy - 3, ribbon, 10, 1); // Crimson hat ribbon
    p(ctx, hx - 3, hy - 2, strawMain, 16, 2); // Wide sunhat brim
    p(ctx, hx - 2, hy - 2, strawLight, 14, 1);
    p(ctx, hx - 3, hy - 1, strawShade, 16, 1);
  }
}

/**
 * Helper to get outfit-accurate sleeve and cuff colors for articulated arm swing & jump poses.
 */
function getOutfitSleeveColors(cfg: ReturnType<typeof extractPlayerVisualConfig>) {
  if (cfg.outfitId === 'outfit_lab') {
    return { sleeve: '#f5f7f5', cuff: '#cfd8d3' };
  }
  if (cfg.outfitId === 'outfit_overalls') {
    return { sleeve: '#f5f0e6', cuff: '#d8cfc0' };
  }
  if (cfg.outfitId === 'outfit_flannel') {
    return { sleeve: '#b83527', cuff: '#6e1c14' };
  }
  if (cfg.outfitId === 'outfit_apron') {
    return { sleeve: '#2e5936', cuff: '#1e3d24' };
  }
  return { sleeve: '#1e4d2b', cuff: '#f0c54d' };
}

/**
 * Generates agricultural researcher/farmer player sprites (32x32) with a realistic 4-frame biomechanical
 * walk cycle (0: Contact/Idle, 1: Left Stride + Right Arm Swing, 2: Passing, 3: Right Stride + Left Arm Swing),
 * supporting Male & Female anatomy, multi-tone hair styles & colors, headwear, and detailed 16-bit outfits.
 */
export function createPlayerDirectionFrames(
  dir: 'down' | 'up' | 'left' | 'right',
  customState?: PlayerCustomizationState
): HTMLCanvasElement[] {
  const frames: HTMLCanvasElement[] = [];
  const cfg = extractPlayerVisualConfig(customState);
  const { sleeve, cuff } = getOutfitSleeveColors(cfg);

  for (let frameIdx = 0; frameIdx < 4; frameIdx++) {
    const { canvas, ctx } = createCanvas(32, 32);
    // Stride: 0 = neutral, -1 = left step forward / right arm forward, +1 = right step forward / left arm forward
    const stride = frameIdx === 1 ? -1 : frameIdx === 3 ? 1 : 0;
    const bob = stride !== 0 ? -1 : 0;
    const hairSwayX = (dir === 'down' || dir === 'up') && stride !== 0 ? stride : 0;

    // 1. Crisp Ground Shadow (shifts subtly with footfall)
    p(ctx, 9, 28, 'rgba(12, 8, 4, 0.55)', 14, 3);
    p(ctx, 11, 27, 'rgba(12, 8, 4, 0.45)', 10, 5);

    // 2. Back Hair Layer (behind head & shoulders, sways naturally with stride)
    drawPlayerBackHair(ctx, 11 + hairSwayX, 8 + bob, dir, cfg);

    // 3. Articulated Legs, Knees, Belt & Striding Work Boots
    if (dir === 'down' || dir === 'up') {
      // Belt / Waistband
      if (cfg.outfitId !== 'outfit_overalls') {
        p(ctx, 10, 22 + bob, '#382210', 12, 2);
        if (dir === 'down') {
          p(ctx, 15, 22 + bob, '#d4a838', 2, 2);
        }
      }

      if (stride === 0) {
        // Neutral balanced stance
        p(ctx, 11, 23 + bob, cfg.pantColor, 4, 5);
        p(ctx, 11, 23 + bob, cfg.pantHighlight, 1, 4);
        p(ctx, 14, 23 + bob, cfg.pantShadow, 1, 5);

        p(ctx, 17, 23 + bob, cfg.pantColor, 4, 5);
        p(ctx, 17, 23 + bob, cfg.pantHighlight, 1, 4);
        p(ctx, 20, 23 + bob, cfg.pantShadow, 1, 5);

        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 11, 27 + bob, '#7fb3d5', 4, 1);
          p(ctx, 17, 27 + bob, '#7fb3d5', 4, 1);
        }

        p(ctx, 10, 28 + bob, cfg.bootColor, 5, 2);
        p(ctx, 11, 28 + bob, cfg.bootHighlight, 2, 1);
        p(ctx, 17, 28 + bob, cfg.bootColor, 5, 2);
        p(ctx, 18, 28 + bob, cfg.bootHighlight, 2, 1);
      } else if (stride === -1) {
        // Frame 1: Left leg steps forward (longer, planted boot), Right leg lifts behind (shorter, raised boot)
        // Stepping Left Leg
        p(ctx, 11, 23 + bob, cfg.pantColor, 4, 6);
        p(ctx, 11, 24 + bob, cfg.pantHighlight, 3, 2); // Forward knee highlight
        p(ctx, 14, 23 + bob, cfg.pantShadow, 1, 6);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 11, 28 + bob, '#7fb3d5', 4, 1);
        }
        p(ctx, 10, 29 + bob, cfg.bootColor, 5, 2);
        p(ctx, 11, 29 + bob, cfg.bootHighlight, 3, 1);

        // Lifted Right Leg (raised 2px off ground)
        p(ctx, 17, 23 + bob, cfg.pantShadow, 4, 4);
        p(ctx, 17, 23 + bob, cfg.pantColor, 3, 3);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 17, 26 + bob, '#7fb3d5', 4, 1);
        }
        p(ctx, 17, 27 + bob, cfg.bootColor, 5, 2);
        p(ctx, 17, 28 + bob, '#140b05', 5, 1); // Lifted boot sole shadow
      } else {
        // Frame 3: Right leg steps forward (longer, planted boot), Left leg lifts behind (shorter, raised boot)
        // Lifted Left Leg (raised 2px off ground)
        p(ctx, 11, 23 + bob, cfg.pantShadow, 4, 4);
        p(ctx, 12, 23 + bob, cfg.pantColor, 3, 3);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 11, 26 + bob, '#7fb3d5', 4, 1);
        }
        p(ctx, 10, 27 + bob, cfg.bootColor, 5, 2);
        p(ctx, 10, 28 + bob, '#140b05', 5, 1); // Lifted boot sole shadow

        // Stepping Right Leg
        p(ctx, 17, 23 + bob, cfg.pantColor, 4, 6);
        p(ctx, 18, 24 + bob, cfg.pantHighlight, 3, 2); // Forward knee highlight
        p(ctx, 17, 23 + bob, cfg.pantShadow, 1, 6);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 17, 28 + bob, '#7fb3d5', 4, 1);
        }
        p(ctx, 17, 29 + bob, cfg.bootColor, 5, 2);
        p(ctx, 18, 29 + bob, cfg.bootHighlight, 3, 1);
      }

      // 4. Realistic Torso Outfit (without static arms)
      drawPlayerRealisticTorso(ctx, 10, 15 + bob, dir, cfg, false);

      // 5. Opposite-Arm Pendulum Swing (Left & Right Arms/Hands)
      // When stride === -1 (left leg forward): right arm swings forward, left arm swings back
      // When stride === +1 (right leg forward): left arm swings forward, right arm swings back
      const leftArmSwing = dir === 'down' ? -stride : stride; // +1 = forward toward viewer, -1 = backward
      const rightArmSwing = -leftArmSwing;

      // Left Arm & Hand
      if (leftArmSwing === 0) {
        p(ctx, 8, 16 + bob, sleeve, 2, 3);
        p(ctx, 8, 19 + bob, cuff, 2, 1);
        p(ctx, 8, 20 + bob, cfg.skinColor, 2, 3);
        p(ctx, 8, 22 + bob, cfg.skinShadow, 2, 1);
      } else if (leftArmSwing > 0) {
        // Swinging forward (extended lower & brighter hand)
        p(ctx, 8, 16 + bob, sleeve, 2, 4);
        p(ctx, 8, 19 + bob, cuff, 2, 1);
        p(ctx, 8, 20 + bob, cfg.skinColor, 3, 3);
        p(ctx, 9, 22 + bob, cfg.skinShadow, 2, 1);
      } else {
        // Swinging backward (foreshortened higher & shaded)
        p(ctx, 8, 15 + bob, sleeve, 2, 3);
        p(ctx, 8, 17 + bob, cuff, 2, 1);
        p(ctx, 8, 18 + bob, cfg.skinShadow, 2, 2);
      }

      // Right Arm & Hand
      if (rightArmSwing === 0) {
        p(ctx, 22, 16 + bob, sleeve, 2, 3);
        p(ctx, 22, 19 + bob, cuff, 2, 1);
        p(ctx, 22, 20 + bob, cfg.skinColor, 2, 3);
        p(ctx, 22, 22 + bob, cfg.skinShadow, 2, 1);
      } else if (rightArmSwing > 0) {
        // Swinging forward (extended lower & brighter hand)
        p(ctx, 22, 16 + bob, sleeve, 2, 4);
        p(ctx, 22, 19 + bob, cuff, 2, 1);
        p(ctx, 21, 20 + bob, cfg.skinColor, 3, 3);
        p(ctx, 21, 22 + bob, cfg.skinShadow, 2, 1);
      } else {
        // Swinging backward (foreshortened higher & shaded)
        p(ctx, 22, 15 + bob, sleeve, 2, 3);
        p(ctx, 22, 17 + bob, cuff, 2, 1);
        p(ctx, 22, 18 + bob, cfg.skinShadow, 2, 2);
      }
    } else if (dir === 'left') {
      // --- SIDE PROFILE (FACING LEFT) ---
      // 3A. Far (Right) Arm swinging in front or behind torso (drawn BEFORE torso)
      if (stride === -1) {
        // Far arm swings forward past front of chest
        p(ctx, 9, 17 + bob, sleeve, 3, 2);
        p(ctx, 8, 18 + bob, cfg.skinShadow, 3, 3);
      } else if (stride === 1) {
        // Far arm swings behind back
        p(ctx, 19, 17 + bob, sleeve, 2, 2);
        p(ctx, 20, 18 + bob, cfg.skinShadow, 2, 2);
      }

      // 3B. Scissor-Striding Legs & Boots (Facing Left)
      if (cfg.outfitId !== 'outfit_overalls') {
        p(ctx, 12, 22 + bob, '#382210', 8, 2);
      }
      if (stride === 0) {
        p(ctx, 13, 23 + bob, cfg.pantColor, 6, 5);
        p(ctx, 13, 23 + bob, cfg.pantHighlight, 2, 4);
        p(ctx, 17, 23 + bob, cfg.pantShadow, 2, 5);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 13, 27 + bob, '#7fb3d5', 6, 1);
        }
        p(ctx, 11, 28 + bob, cfg.bootColor, 6, 2);
        p(ctx, 12, 28 + bob, cfg.bootHighlight, 2, 1);
      } else if (stride === -1) {
        // Near leg steps forward-left, Far leg trails back-right
        // Far leg (back-right)
        p(ctx, 16, 23 + bob, cfg.pantShadow, 4, 4);
        p(ctx, 17, 27 + bob, cfg.bootColor, 5, 2);
        p(ctx, 21, 26 + bob, '#140b05', 1, 3); // Angled trailing heel
        // Near leg (stepping forward-left)
        p(ctx, 11, 23 + bob, cfg.pantColor, 4, 5);
        p(ctx, 11, 23 + bob, cfg.pantHighlight, 2, 4);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 11, 27 + bob, '#7fb3d5', 4, 1);
        }
        p(ctx, 9, 28 + bob, cfg.bootColor, 6, 2);
        p(ctx, 10, 28 + bob, cfg.bootHighlight, 3, 1);
      } else {
        // Far leg steps forward-left, Near leg trails back-right
        // Far leg (stepping forward-left)
        p(ctx, 11, 23 + bob, cfg.pantShadow, 4, 5);
        p(ctx, 9, 28 + bob, cfg.bootColor, 5, 2);
        // Near leg (trailing back-right)
        p(ctx, 15, 23 + bob, cfg.pantColor, 4, 4);
        p(ctx, 15, 23 + bob, cfg.pantHighlight, 2, 3);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 15, 26 + bob, '#7fb3d5', 4, 1);
        }
        p(ctx, 16, 27 + bob, cfg.bootColor, 5, 2);
        p(ctx, 17, 27 + bob, cfg.bootHighlight, 2, 1);
      }

      // 4. Realistic Torso Outfit (without static arms)
      drawPlayerRealisticTorso(ctx, 10, 15 + bob, 'left', cfg, false);

      // 5. Near (Left) Arm Pendulum Swing (drawn OVER torso)
      if (stride === 0) {
        p(ctx, 13, 16 + bob, sleeve, 4, 3);
        p(ctx, 13, 19 + bob, cuff, 4, 1);
        p(ctx, 13, 20 + bob, cfg.skinColor, 3, 3);
      } else if (stride === -1) {
        // Near leg forward -> Near arm swings backward-right
        p(ctx, 14, 16 + bob, sleeve, 4, 3);
        p(ctx, 16, 18 + bob, cuff, 3, 1);
        p(ctx, 17, 19 + bob, cfg.skinColor, 3, 3);
        p(ctx, 18, 21 + bob, cfg.skinShadow, 2, 1);
      } else {
        // Far leg forward -> Near arm swings forward-left
        p(ctx, 12, 16 + bob, sleeve, 4, 3);
        p(ctx, 11, 18 + bob, cuff, 3, 1);
        p(ctx, 10, 19 + bob, cfg.skinColor, 3, 3);
        p(ctx, 10, 21 + bob, cfg.skinShadow, 2, 1);
      }
    } else {
      // --- SIDE PROFILE (FACING RIGHT) ---
      // 3A. Far (Left) Arm swinging in front or behind torso (drawn BEFORE torso)
      if (stride === 1) {
        // Far arm swings forward past front of chest
        p(ctx, 20, 17 + bob, sleeve, 3, 2);
        p(ctx, 21, 18 + bob, cfg.skinShadow, 3, 3);
      } else if (stride === -1) {
        // Far arm swings behind back
        p(ctx, 11, 17 + bob, sleeve, 2, 2);
        p(ctx, 10, 18 + bob, cfg.skinShadow, 2, 2);
      }

      // 3B. Scissor-Striding Legs & Boots (Facing Right)
      if (cfg.outfitId !== 'outfit_overalls') {
        p(ctx, 12, 22 + bob, '#382210', 8, 2);
      }
      if (stride === 0) {
        p(ctx, 13, 23 + bob, cfg.pantColor, 6, 5);
        p(ctx, 17, 23 + bob, cfg.pantHighlight, 2, 4);
        p(ctx, 13, 23 + bob, cfg.pantShadow, 2, 5);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 13, 27 + bob, '#7fb3d5', 6, 1);
        }
        p(ctx, 15, 28 + bob, cfg.bootColor, 6, 2);
        p(ctx, 17, 28 + bob, cfg.bootHighlight, 2, 1);
      } else if (stride === 1) {
        // Near leg steps forward-right, Far leg trails back-left
        // Far leg (back-left)
        p(ctx, 12, 23 + bob, cfg.pantShadow, 4, 4);
        p(ctx, 10, 27 + bob, cfg.bootColor, 5, 2);
        p(ctx, 10, 26 + bob, '#140b05', 1, 3); // Angled trailing heel
        // Near leg (stepping forward-right)
        p(ctx, 17, 23 + bob, cfg.pantColor, 4, 5);
        p(ctx, 19, 23 + bob, cfg.pantHighlight, 2, 4);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 17, 27 + bob, '#7fb3d5', 4, 1);
        }
        p(ctx, 17, 28 + bob, cfg.bootColor, 6, 2);
        p(ctx, 19, 28 + bob, cfg.bootHighlight, 3, 1);
      } else {
        // Far leg steps forward-right, Near leg trails back-left
        // Far leg (stepping forward-right)
        p(ctx, 17, 23 + bob, cfg.pantShadow, 4, 5);
        p(ctx, 18, 28 + bob, cfg.bootColor, 5, 2);
        // Near leg (trailing back-left)
        p(ctx, 13, 23 + bob, cfg.pantColor, 4, 4);
        p(ctx, 15, 23 + bob, cfg.pantHighlight, 2, 3);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 13, 26 + bob, '#7fb3d5', 4, 1);
        }
        p(ctx, 11, 27 + bob, cfg.bootColor, 5, 2);
        p(ctx, 13, 27 + bob, cfg.bootHighlight, 2, 1);
      }

      // 4. Realistic Torso Outfit (without static arms)
      drawPlayerRealisticTorso(ctx, 10, 15 + bob, 'right', cfg, false);

      // 5. Near (Right) Arm Pendulum Swing (drawn OVER torso)
      if (stride === 0) {
        p(ctx, 15, 16 + bob, sleeve, 4, 3);
        p(ctx, 15, 19 + bob, cuff, 4, 1);
        p(ctx, 16, 20 + bob, cfg.skinColor, 3, 3);
      } else if (stride === 1) {
        // Near leg forward -> Near arm swings backward-left
        p(ctx, 14, 16 + bob, sleeve, 4, 3);
        p(ctx, 13, 18 + bob, cuff, 3, 1);
        p(ctx, 12, 19 + bob, cfg.skinColor, 3, 3);
        p(ctx, 12, 21 + bob, cfg.skinShadow, 2, 1);
      } else {
        // Far leg forward -> Near arm swings forward-right
        p(ctx, 16, 16 + bob, sleeve, 4, 3);
        p(ctx, 18, 18 + bob, cuff, 3, 1);
        p(ctx, 19, 19 + bob, cfg.skinColor, 3, 3);
        p(ctx, 20, 21 + bob, cfg.skinShadow, 2, 1);
      }
    }

    // 6. Head, Face (Male/Female), Facial Hair, Crown Hair & Hat
    drawPlayerHeadAndCrown(ctx, 11, 8 + bob, dir, cfg);

    frames.push(canvas);
  }

  return frames;
}

/**
 * Generates 3 biomechanical 16-bit jump frames per direction (`down`, `up`, `left`, `right`):
 * - Frame 0: Takeoff Crouch (knees bent, torso lowered, arms swung back to launch)
 * - Frame 1: Mid-Air Apex Tuck (arms raised high for lift/balance, knees & boots tucked up in mid-air)
 * - Frame 2: Landing Cushion Flex (knees flexing to absorb touchdown, arms spread for balance)
 * Ground shadow is rendered separately on the ground by the engine so it stays anchored while the character rises.
 */
export function createPlayerJumpFrames(
  dir: 'down' | 'up' | 'left' | 'right',
  customState?: PlayerCustomizationState
): HTMLCanvasElement[] {
  const frames: HTMLCanvasElement[] = [];
  const cfg = extractPlayerVisualConfig(customState);
  const { sleeve, cuff } = getOutfitSleeveColors(cfg);

  for (let jumpIdx = 0; jumpIdx < 3; jumpIdx++) {
    const { canvas, ctx } = createCanvas(32, 32);
    // jumpIdx 0 = Takeoff Crouch (+2px), jumpIdx 1 = Mid-Air Apex (-1px), jumpIdx 2 = Landing Cushion (+1px)
    const bodyOffsetY = jumpIdx === 0 ? 2 : jumpIdx === 1 ? -1 : 1;
    const hairLiftY = jumpIdx === 1 ? -1 : 0;

    // 1. Back Hair Layer (flares slightly upward in mid-air)
    drawPlayerBackHair(ctx, 11, 8 + bodyOffsetY + hairLiftY, dir, cfg);

    if (dir === 'down' || dir === 'up') {
      if (cfg.outfitId !== 'outfit_overalls') {
        p(ctx, 10, 22 + bodyOffsetY, '#382210', 12, 2);
        if (dir === 'down') {
          p(ctx, 15, 22 + bodyOffsetY, '#d4a838', 2, 2);
        }
      }

      if (jumpIdx === 1) {
        // Mid-Air Apex: Knees tucked up & split slightly outward, boot soles visible!
        p(ctx, 10, 22 + bodyOffsetY, cfg.pantColor, 4, 4);
        p(ctx, 10, 22 + bodyOffsetY, cfg.pantHighlight, 2, 3);
        p(ctx, 18, 22 + bodyOffsetY, cfg.pantColor, 4, 4);
        p(ctx, 18, 22 + bodyOffsetY, cfg.pantHighlight, 2, 3);
        if (cfg.outfitId === 'outfit_overalls') {
          p(ctx, 10, 25 + bodyOffsetY, '#7fb3d5', 4, 1);
          p(ctx, 18, 25 + bodyOffsetY, '#7fb3d5', 4, 1);
        }
        // Tucked boots with dark rubber soles
        p(ctx, 9, 26 + bodyOffsetY, cfg.bootColor, 5, 2);
        p(ctx, 10, 26 + bodyOffsetY, cfg.bootHighlight, 2, 1);
        p(ctx, 9, 28 + bodyOffsetY, '#140b05', 5, 1);

        p(ctx, 18, 26 + bodyOffsetY, cfg.bootColor, 5, 2);
        p(ctx, 19, 26 + bodyOffsetY, cfg.bootHighlight, 2, 1);
        p(ctx, 18, 28 + bodyOffsetY, '#140b05', 5, 1);
      } else {
        // Crouch / Landing: Bent knees & planted boots
        p(ctx, 10, 23 + bodyOffsetY, cfg.pantColor, 4, 4);
        p(ctx, 10, 23 + bodyOffsetY, cfg.pantHighlight, 2, 3);
        p(ctx, 18, 23 + bodyOffsetY, cfg.pantColor, 4, 4);
        p(ctx, 18, 23 + bodyOffsetY, cfg.pantHighlight, 2, 3);
        p(ctx, 9, 27 + bodyOffsetY, cfg.bootColor, 6, 2);
        p(ctx, 10, 27 + bodyOffsetY, cfg.bootHighlight, 2, 1);
        p(ctx, 17, 27 + bodyOffsetY, cfg.bootColor, 6, 2);
        p(ctx, 18, 27 + bodyOffsetY, cfg.bootHighlight, 2, 1);
      }

      // Torso (without default arms)
      drawPlayerRealisticTorso(ctx, 10, 15 + bodyOffsetY, dir, cfg, false);

      // Jump Arms & Hands
      if (jumpIdx === 1) {
        // Mid-Air Apex: Both arms swung high upward (hands raised near shoulder/head level!)
        p(ctx, 7, 13 + bodyOffsetY, sleeve, 3, 4);
        p(ctx, 7, 12 + bodyOffsetY, cuff, 3, 1);
        p(ctx, 6, 10 + bodyOffsetY, cfg.skinColor, 3, 3);

        p(ctx, 22, 13 + bodyOffsetY, sleeve, 3, 4);
        p(ctx, 22, 12 + bodyOffsetY, cuff, 3, 1);
        p(ctx, 23, 10 + bodyOffsetY, cfg.skinColor, 3, 3);
      } else {
        // Crouch / Landing: Arms spread outward for launch/balance
        p(ctx, 7, 16 + bodyOffsetY, sleeve, 3, 3);
        p(ctx, 6, 19 + bodyOffsetY, cfg.skinColor, 3, 3);
        p(ctx, 22, 16 + bodyOffsetY, sleeve, 3, 3);
        p(ctx, 23, 19 + bodyOffsetY, cfg.skinColor, 3, 3);
      }
    } else if (dir === 'left') {
      // Side Profile Jump (Facing Left)
      if (jumpIdx === 1) {
        // Far arm raised forward-up
        p(ctx, 8, 13 + bodyOffsetY, sleeve, 3, 3);
        p(ctx, 7, 11 + bodyOffsetY, cfg.skinShadow, 3, 3);
        // Mid-air athletic split/tuck legs
        p(ctx, 10, 22 + bodyOffsetY, cfg.pantColor, 4, 4);
        p(ctx, 8, 25 + bodyOffsetY, cfg.bootColor, 5, 2);
        p(ctx, 16, 22 + bodyOffsetY, cfg.pantShadow, 4, 4);
        p(ctx, 18, 25 + bodyOffsetY, cfg.bootColor, 5, 2);
      } else {
        p(ctx, 12, 23 + bodyOffsetY, cfg.pantColor, 7, 4);
        p(ctx, 10, 27 + bodyOffsetY, cfg.bootColor, 6, 2);
        p(ctx, 16, 27 + bodyOffsetY, cfg.bootColor, 5, 2);
      }

      drawPlayerRealisticTorso(ctx, 10, 15 + bodyOffsetY, 'left', cfg, false);

      if (jumpIdx === 1) {
        // Near arm raised high
        p(ctx, 13, 13 + bodyOffsetY, sleeve, 4, 4);
        p(ctx, 12, 10 + bodyOffsetY, cfg.skinColor, 3, 3);
      } else {
        p(ctx, 14, 16 + bodyOffsetY, sleeve, 4, 3);
        p(ctx, 16, 19 + bodyOffsetY, cfg.skinColor, 3, 3);
      }
    } else {
      // Side Profile Jump (Facing Right)
      if (jumpIdx === 1) {
        // Far arm raised forward-up
        p(ctx, 21, 13 + bodyOffsetY, sleeve, 3, 3);
        p(ctx, 22, 11 + bodyOffsetY, cfg.skinShadow, 3, 3);
        // Mid-air athletic split/tuck legs
        p(ctx, 18, 22 + bodyOffsetY, cfg.pantColor, 4, 4);
        p(ctx, 19, 25 + bodyOffsetY, cfg.bootColor, 5, 2);
        p(ctx, 12, 22 + bodyOffsetY, cfg.pantShadow, 4, 4);
        p(ctx, 9, 25 + bodyOffsetY, cfg.bootColor, 5, 2);
      } else {
        p(ctx, 13, 23 + bodyOffsetY, cfg.pantColor, 7, 4);
        p(ctx, 16, 27 + bodyOffsetY, cfg.bootColor, 6, 2);
        p(ctx, 11, 27 + bodyOffsetY, cfg.bootColor, 5, 2);
      }

      drawPlayerRealisticTorso(ctx, 10, 15 + bodyOffsetY, 'right', cfg, false);

      if (jumpIdx === 1) {
        // Near arm raised high
        p(ctx, 15, 13 + bodyOffsetY, sleeve, 4, 4);
        p(ctx, 17, 10 + bodyOffsetY, cfg.skinColor, 3, 3);
      } else {
        p(ctx, 14, 16 + bodyOffsetY, sleeve, 4, 3);
        p(ctx, 13, 19 + bodyOffsetY, cfg.skinColor, 3, 3);
      }
    }

    // Head, Face, Beard, Hair & Hat
    drawPlayerHeadAndCrown(ctx, 11, 8 + bodyOffsetY, dir, cfg);

    frames.push(canvas);
  }

  return frames;
}

export interface PlayerFishingSprites {
  idle0: HTMLCanvasElement;
  idle1: HTMLCanvasElement;
  rigging: HTMLCanvasElement;
  windup: HTMLCanvasElement;
  castForward: HTMLCanvasElement;
  reeling0: HTMLCanvasElement;
  reeling1: HTMLCanvasElement;
  caught: HTMLCanvasElement;
}

/**
 * Generates phase-specific 32x32 16-bit fishing sprites for the River Pier mini-game
 * using the exact customized player character (gender, skin, hair, hairColor, hat, beard, outfit).
 */
export function createPlayerFishingPoseSprites(
  customState?: PlayerCustomizationState
): PlayerFishingSprites {
  const cfg = extractPlayerVisualConfig(customState);

  const renderRightPose = (
    leanX: number,
    bobY: number,
    armMode: 'idle' | 'rigging' | 'windup' | 'castForward' | 'reeling0' | 'reeling1'
  ): HTMLCanvasElement => {
    const { canvas, ctx } = createCanvas(32, 32);

    // 1. Pier Deck Shadow
    p(ctx, 9 + leanX, 28, 'rgba(12, 8, 4, 0.5)', 14, 3);

    // 2. Back Hair Layer (facing right)
    drawPlayerBackHair(ctx, 11 + leanX, 8 + bobY, 'right', cfg);

    // 3. Trousers, Belt & Work Boots (braced right-facing stance)
    p(ctx, 13 + leanX, 23 + bobY, cfg.pantColor, 6, 5);
    p(ctx, 17 + leanX, 23 + bobY, cfg.pantHighlight, 2, 4);
    p(ctx, 13 + leanX, 23 + bobY, cfg.pantShadow, 2, 5);
    if (cfg.outfitId === 'outfit_overalls') {
      p(ctx, 13 + leanX, 27 + bobY, '#7fb3d5', 6, 1);
    } else {
      p(ctx, 12 + leanX, 22 + bobY, '#382210', 8, 2);
      p(ctx, 18 + leanX, 22 + bobY, '#d4a838', 2, 2);
    }
    // Back boot & braced front boot
    p(ctx, 12 + leanX, 28, cfg.bootColor, 5, 2);
    p(ctx, 13 + leanX, 28, cfg.bootHighlight, 2, 1);
    p(ctx, 16 + leanX, 28, cfg.bootColor, 6, 2);
    p(ctx, 18 + leanX, 28, cfg.bootHighlight, 2, 1);

    // 4. Realistic Torso Outfit (without default walking arms so we can pose fishing arms)
    drawPlayerRealisticTorso(ctx, 10 + leanX, 15 + bobY, 'right', cfg, false);

    // 5. Head, Expressive Face (Male/Female), Beard, Crown Hair & Hat
    drawPlayerHeadAndCrown(ctx, 11 + leanX, 8 + bobY, 'right', cfg);

    // 6. Phase-Specific Articulated Fishing Arms & Hands
    if (armMode === 'idle') {
      // Relaxed forward grip on the bamboo rod cork handle at (22, 19)
      p(ctx, 15 + leanX, 16 + bobY, cfg.shirtColor, 5, 3);
      p(ctx, 15 + leanX, 18 + bobY, cfg.shirtShadow, 4, 1);
      p(ctx, 19 + leanX, 17 + bobY, cfg.skinColor, 4, 3);
      p(ctx, 20 + leanX, 19 + bobY, cfg.skinShadow, 3, 1);
    } else if (armMode === 'rigging') {
      // Left hand steadying rod + right hand reaching out to thread bait onto hook
      p(ctx, 15 + leanX, 16 + bobY, cfg.shirtColor, 5, 3);
      p(ctx, 19 + leanX, 17 + bobY, cfg.skinColor, 3, 2);
      p(ctx, 21 + leanX, 19 + bobY, cfg.skinColor, 4, 2);
      p(ctx, 23 + leanX, 18 + bobY, '#e74c3c', 2, 2); // Bait morsel in fingers
    } else if (armMode === 'windup') {
      // Arms raised overhead/back for powerful backcast wind-up at (15, 13)
      p(ctx, 13 + leanX, 14 + bobY, cfg.shirtColor, 4, 4);
      p(ctx, 13 + leanX, 11 + bobY, cfg.skinColor, 4, 3);
      p(ctx, 14 + leanX, 13 + bobY, cfg.skinShadow, 2, 1);
    } else if (armMode === 'castForward') {
      // Arms thrust forward launching the cast at (24, 18)
      p(ctx, 16 + leanX, 16 + bobY, cfg.shirtColor, 5, 3);
      p(ctx, 20 + leanX, 16 + bobY, cfg.skinColor, 5, 3);
      p(ctx, 21 + leanX, 18 + bobY, cfg.skinShadow, 4, 1);
    } else if (armMode === 'reeling0' || armMode === 'reeling1') {
      // Braced fighting grip: front hand holding foregrip + second hand cranking reel
      p(ctx, 15 + leanX, 16 + bobY, cfg.shirtColor, 5, 3);
      p(ctx, 19 + leanX, 16 + bobY, cfg.skinColor, 4, 3);
      const crankLift = armMode === 'reeling0' ? -1 : 1;
      p(ctx, 21 + leanX, 17 + bobY + crankLift, cfg.skinShadow, 3, 2);
    }

    return canvas;
  };

  // Celebratory front-facing pose when a fish is landed (`caught`)
  const renderCaughtPose = (): HTMLCanvasElement => {
    const { canvas, ctx } = createCanvas(32, 32);
    p(ctx, 9, 28, 'rgba(12, 8, 4, 0.5)', 14, 3);
    drawPlayerBackHair(ctx, 11, 8, 'down', cfg);

    p(ctx, 11, 23, cfg.pantColor, 4, 5);
    p(ctx, 11, 23, cfg.pantHighlight, 1, 4);
    p(ctx, 17, 23, cfg.pantColor, 4, 5);
    p(ctx, 17, 23, cfg.pantHighlight, 1, 4);
    if (cfg.outfitId === 'outfit_overalls') {
      p(ctx, 11, 27, '#7fb3d5', 4, 1);
      p(ctx, 17, 27, '#7fb3d5', 4, 1);
    } else {
      p(ctx, 10, 22, '#382210', 12, 2);
      p(ctx, 15, 22, '#d4a838', 2, 2);
    }
    p(ctx, 10, 28, cfg.bootColor, 5, 2);
    p(ctx, 17, 28, cfg.bootColor, 5, 2);

    drawPlayerRealisticTorso(ctx, 10, 15, 'down', cfg, false);

    // Left arm raised in celebratory triumph
    p(ctx, 8, 13, cfg.shirtColor, 2, 4);
    p(ctx, 7, 10, cfg.skinColor, 3, 3);
    // Right arm extended holding the rod & trophy catch at (24, 17)
    p(ctx, 22, 16, cfg.shirtColor, 3, 3);
    p(ctx, 23, 16, cfg.skinColor, 3, 3);

    drawPlayerHeadAndCrown(ctx, 11, 8, 'down', cfg);
    return canvas;
  };

  return {
    idle0: renderRightPose(0, 0, 'idle'),
    idle1: renderRightPose(0, -1, 'idle'),
    rigging: renderRightPose(1, 0, 'rigging'),
    windup: renderRightPose(-1, 0, 'windup'),
    castForward: renderRightPose(1, 0, 'castForward'),
    reeling0: renderRightPose(-1, 0, 'reeling0'),
    reeling1: renderRightPose(-1, -1, 'reeling1'),
    caught: renderCaughtPose(),
  };
}

/**
 * Generates the farmer sprite standing on Plot 2 (Top-Right) actively planting seeds.
 */
function createPlayerPlantingSprite(customState?: PlayerCustomizationState): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(36, 34);
  const cfg = extractPlayerVisualConfig(customState);

  // High-contrast ground shadow on dark tilled soil
  p(ctx, 8, 28, 'rgba(10, 5, 2, 0.65)', 18, 4);

  drawPlayerBackHair(ctx, 11, 8, 'down', cfg);

  // Trousers & work boots
  p(ctx, 11, 23, cfg.pantColor, 4, 5);
  p(ctx, 11, 23, cfg.pantHighlight, 1, 4);
  p(ctx, 17, 23, cfg.pantColor, 4, 5);
  p(ctx, 17, 23, cfg.pantHighlight, 1, 4);
  p(ctx, 10, 22, '#382210', 12, 2);
  p(ctx, 15, 22, '#d4a838', 2, 2);
  p(ctx, 10, 28, cfg.bootColor, 5, 2);
  p(ctx, 17, 28, cfg.bootColor, 5, 2);

  // Realistic Outfit Torso (without default arms)
  drawPlayerRealisticTorso(ctx, 10, 15, 'down', cfg, false);

  // Left arm holding open canvas seed pouch
  p(ctx, 7, 16, cfg.shirtColor, 3, 3);
  p(ctx, 6, 19, cfg.skinColor, 3, 2);
  p(ctx, 5, 20, '#a67c52', 5, 5);
  p(ctx, 6, 21, '#c49a6c', 3, 3);

  // Right arm extended downward actively sowing seeds into the tilled soil
  p(ctx, 22, 16, cfg.shirtColor, 3, 3);
  p(ctx, 23, 19, cfg.skinColor, 4, 3);
  p(ctx, 25, 21, cfg.skinShadow, 2, 2);

  // Tiny golden watermelon seeds dropping from hand into the seed furrow
  p(ctx, 26, 24, '#f0c54d', 2, 1);
  p(ctx, 25, 26, '#d8aa4d', 2, 1);
  p(ctx, 27, 28, '#f0c54d', 2, 1);

  // Head, Hair & Hat
  drawPlayerHeadAndCrown(ctx, 11, 8, 'down', cfg);

  return canvas;
}

/**
 * 3-Frame Realistic Lumberjack Axe Tree-Chopping Action Sprites (36x36):
 * Frame 0: Two-handed back-shoulder wind-up with forged steel felling axe & hickory handle
 * Frame 1: Full-torso rotational cleave arc with motion blur trail
 * Frame 2: Deep timber impact embedding the steel axe head into tree trunk with flying woodchips
 */
export function createPlayerChoppingFrames(customState?: PlayerCustomizationState): HTMLCanvasElement[] {
  const cfg = extractPlayerVisualConfig(customState);
  const frames: HTMLCanvasElement[] = [];

  // Frame 0: Back-Shoulder Lumberjack Axe Wind-Up
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 8, 31, 'rgba(12, 8, 4, 0.58)', 18, 3);
    drawPlayerBackHair(ctx, 11, 8, 'down', cfg);

    // Wide braced stance work boots & trousers
    p(ctx, 9, 29, cfg.bootColor, 5, 3);
    p(ctx, 10, 29, cfg.bootHighlight, 2, 1);
    p(ctx, 20, 29, cfg.bootColor, 5, 3);
    p(ctx, 21, 29, cfg.bootHighlight, 2, 1);
    p(ctx, 10, 23, cfg.pantColor, 4, 6);
    p(ctx, 10, 23, cfg.pantHighlight, 1, 5);
    p(ctx, 19, 23, cfg.pantColor, 4, 6);
    p(ctx, 19, 23, cfg.pantHighlight, 1, 5);
    p(ctx, 9, 22, '#382210', 15, 2);

    drawPlayerRealisticTorso(ctx, 10, 15, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 11, 8, 'down', cfg);

    // Both arms coiled back over left shoulder gripping hickory axe handle
    p(ctx, 7, 13, cfg.shirtColor, 4, 4);
    p(ctx, 6, 10, cfg.skinColor, 4, 3);
    p(ctx, 10, 12, cfg.skinShadow, 3, 3);

    // Hickory Axe Handle angled back-left to top-left
    p(ctx, 8, 12, '#8c5828', 2, 2);
    p(ctx, 6, 9, '#8c5828', 2, 2);
    p(ctx, 4, 6, '#8c5828', 2, 2);
    p(ctx, 3, 4, '#b87333', 2, 2);

    // Forged Steel Felling Axe Head (with crimson lumberjack paint collar & bright honed bit)
    p(ctx, 0, 1, '#c0392b', 4, 4);
    p(ctx, 0, 0, '#566573', 6, 4);
    p(ctx, 1, 0, '#bdc3c7', 4, 2);
    p(ctx, 0, 0, '#ecf0f1', 2, 5); // Razor-sharp steel bit

    frames.push(canvas);
  }

  // Frame 1: Rotational Mid-Swing Cleave Arc
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 8, 31, 'rgba(12, 8, 4, 0.62)', 20, 3);
    drawPlayerBackHair(ctx, 12, 9, 'down', cfg);

    p(ctx, 9, 29, cfg.bootColor, 6, 3);
    p(ctx, 20, 29, cfg.bootColor, 6, 3);
    p(ctx, 10, 24, cfg.pantColor, 5, 5);
    p(ctx, 19, 24, cfg.pantColor, 5, 5);
    p(ctx, 10, 23, '#382210', 15, 2);

    drawPlayerRealisticTorso(ctx, 11, 16, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 12, 9, 'down', cfg);

    // Arms whipping across chest to the right
    p(ctx, 17, 16, cfg.shirtColor, 5, 4);
    p(ctx, 21, 17, cfg.skinColor, 4, 3);

    // Horizontal/Diagonal Cleave Motion Blur Arc
    ctx.fillStyle = 'rgba(236, 240, 241, 0.42)';
    ctx.fillRect(18, 9, 12, 4);
    ctx.fillRect(24, 12, 9, 6);

    // Hickory Axe Handle extended right
    p(ctx, 22, 18, '#8c5828', 3, 2);
    p(ctx, 25, 19, '#8c5828', 3, 2);
    p(ctx, 28, 20, '#b87333', 3, 2);

    // Steel Felling Axe Blade slashing through arc
    p(ctx, 29, 17, '#c0392b', 3, 4);
    p(ctx, 31, 16, '#566573', 4, 6);
    p(ctx, 33, 16, '#ecf0f1', 2, 6);

    frames.push(canvas);
  }

  // Frame 2: Heavy Timber Impact & Flying Woodchips
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 7, 31, 'rgba(12, 8, 4, 0.68)', 22, 3);
    drawPlayerBackHair(ctx, 13, 10, 'down', cfg);

    p(ctx, 8, 29, cfg.bootColor, 6, 3);
    p(ctx, 21, 29, cfg.bootColor, 6, 3);
    p(ctx, 9, 24, cfg.pantColor, 5, 5);
    p(ctx, 20, 24, cfg.pantColor, 5, 5);
    p(ctx, 9, 23, '#382210', 16, 2);

    drawPlayerRealisticTorso(ctx, 11, 17, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 13, 10, 'down', cfg);

    // Arms locked forward driving axe into timber
    p(ctx, 18, 18, cfg.shirtColor, 4, 4);
    p(ctx, 21, 20, cfg.skinColor, 4, 3);

    // Hickory Handle & Buried Steel Axe Head
    p(ctx, 23, 21, '#8c5828', 3, 2);
    p(ctx, 26, 22, '#8c5828', 3, 2);
    p(ctx, 28, 21, '#c0392b', 3, 3);
    p(ctx, 30, 20, '#566573', 5, 5);
    p(ctx, 31, 21, '#bdc3c7', 3, 3);

    // Burst of Golden Heartwood & Pine Bark Woodchips on Impact
    p(ctx, 31, 16, '#f0c54d', 3, 2);
    p(ctx, 34, 18, '#d4a838', 2, 2);
    p(ctx, 28, 17, '#8c5828', 2, 2);
    p(ctx, 33, 25, '#e6be68', 2, 2);
    p(ctx, 29, 26, '#5c3818', 2, 2);

    frames.push(canvas);
  }

  return frames;
}

/**
 * 3-Frame Animated Mattock/Hoe Clearing Action Sprites:
 * Frame 0: High overhead hoe windup
 * Frame 1: Powerful downswing with motion arc
 * Frame 2: Ground impact embedding hoe into rock/debris with debris particles
 */
function createPlayerClearingFrames(customState?: PlayerCustomizationState): HTMLCanvasElement[] {
  const cfg = extractPlayerVisualConfig(customState);
  const frames: HTMLCanvasElement[] = [];

  // Frame 0: High Overhead Windup
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 9, 31, 'rgba(12, 8, 4, 0.55)', 18, 3);
    drawPlayerBackHair(ctx, 13, 8, 'down', cfg);

    p(ctx, 10, 29, cfg.bootColor, 5, 3);
    p(ctx, 11, 29, cfg.bootHighlight, 2, 1);
    p(ctx, 21, 29, cfg.bootColor, 5, 3);
    p(ctx, 22, 29, cfg.bootHighlight, 2, 1);
    p(ctx, 11, 23, cfg.pantColor, 4, 6);
    p(ctx, 11, 23, cfg.pantHighlight, 1, 5);
    p(ctx, 21, 23, cfg.pantColor, 4, 6);
    p(ctx, 21, 23, cfg.pantHighlight, 1, 5);
    p(ctx, 10, 22, '#382210', 16, 2);

    drawPlayerRealisticTorso(ctx, 12, 15, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 13, 8, 'down', cfg);

    // Arms raised overhead holding handle
    p(ctx, 9, 13, cfg.shirtColor, 3, 5);
    p(ctx, 10, 9, cfg.skinColor, 3, 4);
    p(ctx, 24, 13, cfg.shirtColor, 3, 5);
    p(ctx, 23, 9, cfg.skinColor, 3, 4);

    // Mattock / Hoe Ash Wood Handle
    p(ctx, 12, 11, '#8c5828', 2, 2);
    p(ctx, 14, 9, '#8c5828', 2, 2);
    p(ctx, 16, 7, '#8c5828', 2, 2);
    p(ctx, 18, 5, '#8c5828', 2, 2);
    p(ctx, 20, 3, '#8c5828', 2, 2);
    p(ctx, 22, 1, '#8c5828', 2, 2);
    p(ctx, 13, 10, '#b87333', 1, 1);
    p(ctx, 17, 6, '#b87333', 1, 1);

    // Heavy Forged Steel Mattock/Hoe Blade at top
    p(ctx, 22, 0, '#566573', 7, 3);
    p(ctx, 23, 1, '#bdc3c7', 5, 1);
    p(ctx, 28, 2, '#7f8c8d', 2, 4);
    p(ctx, 27, 4, '#ecf0f1', 2, 2);

    frames.push(canvas);
  }

  // Frame 1: Powerful Mid-Downswing
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 8, 31, 'rgba(12, 8, 4, 0.6)', 20, 3);
    drawPlayerBackHair(ctx, 13, 10, 'down', cfg);

    p(ctx, 9, 29, cfg.bootColor, 6, 3);
    p(ctx, 20, 29, cfg.bootColor, 6, 3);
    p(ctx, 10, 24, cfg.pantColor, 5, 5);
    p(ctx, 19, 24, cfg.pantColor, 5, 5);
    p(ctx, 10, 23, '#382210', 15, 2);

    drawPlayerRealisticTorso(ctx, 11, 16, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 13, 10, 'down', cfg);

    // Arms swinging down forward
    p(ctx, 17, 16, cfg.shirtColor, 4, 4);
    p(ctx, 20, 18, cfg.skinColor, 4, 4);

    // Motion Swing Blur Arc
    ctx.fillStyle = 'rgba(236, 240, 241, 0.35)';
    ctx.fillRect(23, 8, 3, 12);
    ctx.fillRect(25, 14, 3, 10);

    // Diagonal Ash Handle
    p(ctx, 19, 19, '#8c5828', 3, 2);
    p(ctx, 22, 21, '#8c5828', 3, 2);
    p(ctx, 25, 23, '#8c5828', 3, 2);
    p(ctx, 28, 25, '#8c5828', 3, 2);

    // Hoe Blade slashing downward
    p(ctx, 29, 24, '#566573', 5, 4);
    p(ctx, 31, 25, '#bdc3c7', 3, 2);
    p(ctx, 33, 27, '#ecf0f1', 2, 2);

    frames.push(canvas);
  }

  // Frame 2: Ground Impact & Shatter
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 7, 31, 'rgba(12, 8, 4, 0.65)', 22, 3);
    drawPlayerBackHair(ctx, 12, 11, 'down', cfg);

    p(ctx, 8, 29, cfg.bootColor, 6, 3);
    p(ctx, 20, 29, cfg.bootColor, 6, 3);
    p(ctx, 9, 24, cfg.pantColor, 5, 5);
    p(ctx, 19, 24, cfg.pantColor, 5, 5);
    p(ctx, 9, 23, '#382210', 16, 2);

    drawPlayerRealisticTorso(ctx, 10, 17, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 12, 11, 'down', cfg);

    // Arms locked down holding tool
    p(ctx, 17, 18, cfg.shirtColor, 4, 4);
    p(ctx, 19, 21, cfg.skinColor, 4, 3);

    // Handle buried down
    p(ctx, 21, 22, '#8c5828', 2, 3);
    p(ctx, 23, 25, '#8c5828', 2, 3);
    p(ctx, 25, 28, '#8c5828', 2, 3);

    // Steel Mattock head embedded in dirt/rock
    p(ctx, 26, 28, '#566573', 5, 4);
    p(ctx, 27, 29, '#bdc3c7', 3, 2);

    // Impact burst of rock chips and dirt debris
    p(ctx, 30, 25, '#adb5bd', 2, 2);
    p(ctx, 33, 27, '#6c757d', 2, 2);
    p(ctx, 28, 24, '#ecf0f1', 2, 1);
    p(ctx, 24, 27, '#6e4722', 2, 2);
    p(ctx, 32, 30, '#5c3818', 2, 2);

    frames.push(canvas);
  }

  return frames;
}

/**
 * 3-Frame Animated Sowing Seed Sprites:
 * Frame 0: Reaching into canvas seed pouch at hip
 * Frame 1: Arm swing forward with handful of seeds
 * Frame 2: Broadcasting golden watermelon seeds into the furrows
 */
function createPlayerSowingFrames(customState?: PlayerCustomizationState): HTMLCanvasElement[] {
  const cfg = extractPlayerVisualConfig(customState);
  const frames: HTMLCanvasElement[] = [];

  // Frame 0: Gather Seeds From Hip Pouch
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 9, 30, 'rgba(12, 8, 4, 0.55)', 16, 3);
    drawPlayerBackHair(ctx, 11, 8, 'down', cfg);

    p(ctx, 11, 28, cfg.bootColor, 5, 3);
    p(ctx, 17, 28, cfg.bootColor, 5, 3);
    p(ctx, 11, 23, cfg.pantColor, 4, 5);
    p(ctx, 17, 23, cfg.pantColor, 4, 5);
    p(ctx, 10, 22, '#382210', 12, 2);

    drawPlayerRealisticTorso(ctx, 10, 15, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 11, 8, 'down', cfg);

    // Canvas seed sack strapped to hip
    p(ctx, 6, 17, '#a67c52', 6, 6);
    p(ctx, 7, 18, '#c49a6c', 4, 4);
    p(ctx, 8, 16, '#d4a838', 2, 2);

    p(ctx, 7, 16, cfg.skinColor, 3, 2);
    p(ctx, 11, 17, cfg.skinColor, 4, 3);

    frames.push(canvas);
  }

  // Frame 1: Arm Windup Bringing Seeds Forward
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 9, 30, 'rgba(12, 8, 4, 0.55)', 16, 3);
    drawPlayerBackHair(ctx, 11, 8, 'down', cfg);

    p(ctx, 10, 28, cfg.bootColor, 5, 3);
    p(ctx, 18, 28, cfg.bootColor, 5, 3);
    p(ctx, 11, 23, cfg.pantColor, 4, 5);
    p(ctx, 17, 23, cfg.pantColor, 4, 5);
    p(ctx, 10, 22, '#382210', 12, 2);

    drawPlayerRealisticTorso(ctx, 10, 15, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 11, 8, 'down', cfg);

    p(ctx, 6, 17, '#a67c52', 5, 5);

    // Right arm sweeping forward
    p(ctx, 19, 16, cfg.shirtColor, 4, 3);
    p(ctx, 22, 17, cfg.skinColor, 4, 3);

    // Handful of glistening seeds in hand
    p(ctx, 24, 18, '#f0c54d', 3, 2);
    p(ctx, 25, 17, '#ffd54f', 2, 1);

    frames.push(canvas);
  }

  // Frame 2: Full Broadcast of Golden Seeds
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 9, 30, 'rgba(12, 8, 4, 0.55)', 18, 3);
    drawPlayerBackHair(ctx, 12, 8, 'down', cfg);

    p(ctx, 10, 28, cfg.bootColor, 5, 3);
    p(ctx, 19, 28, cfg.bootColor, 5, 3);
    p(ctx, 11, 23, cfg.pantColor, 4, 5);
    p(ctx, 18, 23, cfg.pantColor, 4, 5);
    p(ctx, 10, 22, '#382210', 13, 2);

    drawPlayerRealisticTorso(ctx, 11, 15, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 12, 8, 'down', cfg);

    p(ctx, 6, 17, '#a67c52', 5, 5);

    // Arm fully extended casting
    p(ctx, 21, 15, cfg.shirtColor, 4, 3);
    p(ctx, 25, 14, cfg.skinColor, 4, 3);

    // Airborne Golden Seeds Dispersing in arc
    p(ctx, 28, 17, '#f0c54d', 2, 1);
    p(ctx, 30, 20, '#ffd54f', 2, 1);
    p(ctx, 33, 23, '#f0c54d', 2, 1);
    p(ctx, 27, 22, '#e5c158', 2, 1);
    p(ctx, 31, 26, '#ffd54f', 2, 1);
    p(ctx, 34, 28, '#f0c54d', 2, 1);

    frames.push(canvas);
  }

  return frames;
}

/**
 * 4-Frame Animated Harvesting Watermelon Sprites:
 * Frame 0: Crouched cutting ripe vine with garden shears
 * Frame 1: Gripping & lifting the heavy striped watermelon
 * Frame 2: Triumphantly hoisting the massive watermelon overhead with sparkles
 * Frame 3: Cradling the prize watermelon
 */
function createPlayerHarvestingFrames(customState?: PlayerCustomizationState): HTMLCanvasElement[] {
  const cfg = extractPlayerVisualConfig(customState);
  const frames: HTMLCanvasElement[] = [];

  // Frame 0: Crouched Snipping Vine Tendril
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 8, 31, 'rgba(12, 8, 4, 0.65)', 22, 3);
    drawPlayerBackHair(ctx, 12, 12, 'down', cfg);

    p(ctx, 8, 29, cfg.bootColor, 6, 3);
    p(ctx, 17, 29, cfg.bootColor, 6, 3);
    p(ctx, 9, 24, cfg.pantColor, 5, 5);
    p(ctx, 16, 24, cfg.pantColor, 5, 5);

    drawPlayerRealisticTorso(ctx, 10, 18, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 12, 12, 'down', cfg);

    // Steel Shears in hand
    p(ctx, 19, 20, cfg.skinColor, 3, 3);
    p(ctx, 22, 21, '#bdc3c7', 3, 2);
    p(ctx, 24, 20, '#ecf0f1', 2, 2);
    p(ctx, 23, 22, '#27ae60', 2, 2);

    // Ripe striped watermelon on ground
    p(ctx, 23, 25, '#0f3012', 10, 7);
    p(ctx, 24, 25, '#529938', 2, 7);
    p(ctx, 28, 25, '#529938', 2, 7);
    p(ctx, 25, 30, '#f9e79f', 4, 2);

    frames.push(canvas);
  }

  // Frame 1: Gripping and Lifting Heavy Watermelon
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 8, 31, 'rgba(12, 8, 4, 0.65)', 20, 3);
    drawPlayerBackHair(ctx, 12, 10, 'down', cfg);

    p(ctx, 9, 29, cfg.bootColor, 5, 3);
    p(ctx, 21, 29, cfg.bootColor, 5, 3);
    p(ctx, 10, 24, cfg.pantColor, 5, 5);
    p(ctx, 20, 24, cfg.pantColor, 5, 5);

    drawPlayerRealisticTorso(ctx, 11, 16, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 12, 10, 'down', cfg);

    // Large striped watermelon lifted to waist
    p(ctx, 14, 19, '#0f3012', 13, 9);
    p(ctx, 16, 19, '#529938', 2, 9);
    p(ctx, 20, 19, '#529938', 2, 9);
    p(ctx, 23, 19, '#529938', 2, 9);
    p(ctx, 17, 26, '#f9e79f', 4, 2);

    // Hands gripping under the melon
    p(ctx, 12, 23, cfg.skinColor, 3, 3);
    p(ctx, 26, 23, cfg.skinColor, 3, 3);

    frames.push(canvas);
  }

  // Frame 2: Triumphant Overhead Hoist with Sparkles!
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 9, 31, 'rgba(12, 8, 4, 0.55)', 17, 3);
    drawPlayerBackHair(ctx, 12, 10, 'down', cfg);

    p(ctx, 11, 29, cfg.bootColor, 5, 3);
    p(ctx, 19, 29, cfg.bootColor, 5, 3);
    p(ctx, 11, 23, cfg.pantColor, 4, 6);
    p(ctx, 19, 23, cfg.pantColor, 4, 6);

    drawPlayerRealisticTorso(ctx, 11, 16, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 12, 10, 'down', cfg);

    // Arms reaching straight up
    p(ctx, 9, 7, cfg.shirtColor, 3, 9);
    p(ctx, 8, 5, cfg.skinColor, 3, 3);
    p(ctx, 23, 7, cfg.shirtColor, 3, 9);
    p(ctx, 24, 5, cfg.skinColor, 3, 3);

    // Massive Prize Watermelon hoisted overhead!
    p(ctx, 9, 0, '#0f3012', 17, 8);
    p(ctx, 11, 0, '#529938', 2, 8);
    p(ctx, 15, 0, '#529938', 2, 8);
    p(ctx, 19, 0, '#529938', 2, 8);
    p(ctx, 23, 0, '#529938', 2, 8);
    p(ctx, 12, 2, '#88d46c', 1, 4);
    p(ctx, 26, 3, '#d4a838', 2, 2);

    // 4 Golden Sparkle Stars
    p(ctx, 5, 2, '#f1c40f', 2, 2);
    p(ctx, 28, 1, '#f9e79f', 2, 2);
    p(ctx, 4, 7, '#f9e79f', 2, 2);
    p(ctx, 29, 6, '#f1c40f', 2, 2);

    frames.push(canvas);
  }

  // Frame 3: Proud Cradling of Prize Melon
  {
    const { canvas, ctx } = createCanvas(36, 36);
    p(ctx, 9, 31, 'rgba(12, 8, 4, 0.55)', 17, 3);
    drawPlayerBackHair(ctx, 12, 8, 'down', cfg);

    p(ctx, 11, 29, cfg.bootColor, 5, 3);
    p(ctx, 18, 29, cfg.bootColor, 5, 3);
    p(ctx, 11, 23, cfg.pantColor, 4, 6);
    p(ctx, 18, 23, cfg.pantColor, 4, 6);

    drawPlayerRealisticTorso(ctx, 11, 15, 'down', cfg, false);
    drawPlayerHeadAndCrown(ctx, 12, 8, 'down', cfg);

    // Watermelon cradled on chest
    p(ctx, 12, 15, '#0f3012', 14, 9);
    p(ctx, 14, 15, '#529938', 2, 9);
    p(ctx, 18, 15, '#529938', 2, 9);
    p(ctx, 22, 15, '#529938', 2, 9);

    // Arms hugging the melon
    p(ctx, 10, 18, cfg.shirtColor, 3, 4);
    p(ctx, 12, 22, cfg.skinColor, 4, 2);
    p(ctx, 24, 18, cfg.shirtColor, 3, 4);
    p(ctx, 21, 22, cfg.skinColor, 4, 2);

    frames.push(canvas);
  }

  return frames;
}

/**
 * 3-Frame Animated Sleeping / Rest & Recovery Sprites for Farmhouse Bed:
 * Frame 0: Sleeping peacefully (closed eyes, resting on pillow, relaxed breathing)
 * Frame 1: Sleeping breathing rise (1px subtle chest/quilt elevation)
 * Frame 2: Waking up (eyes open, morning stretch)
 */
function createPlayerSleepingFrames(customState?: PlayerCustomizationState): HTMLCanvasElement[] {
  const cfg = extractPlayerVisualConfig(customState);
  const frames: HTMLCanvasElement[] = [];

  const drawSleepHeadAndHair = (ctx: CanvasRenderingContext2D, isAwake: boolean) => {
    // Long hair or braids fanned out on pillow behind head
    if (cfg.hairId === 'hair_long_waves' || cfg.hairId === 'hair_twin_braids') {
      p(ctx, 6, 3, cfg.hairMain, 18, 9);
      p(ctx, 7, 4, cfg.hairHighlight, 2, 6);
      p(ctx, 21, 4, cfg.hairHighlight, 2, 6);
    }

    // Head resting on pillow
    p(ctx, 9, 3, cfg.skinColor, 12, 8);
    p(ctx, 9, 9, cfg.skinShadow, 12, 2);

    // Crown & temple hair
    if (cfg.hairId !== 'hair_bald') {
      p(ctx, 8, 3, cfg.hairMain, 2, 7);
      p(ctx, 20, 3, cfg.hairMain, 2, 7);
      p(ctx, 9, 1, cfg.hairMain, 12, 3);
      p(ctx, 11, 1, cfg.hairHighlight, 8, 1);
    }

    if (isAwake) {
      p(ctx, 11, 6, '#141414', 2, 2);
      p(ctx, 16, 6, '#141414', 2, 2);
      p(ctx, 13, 9, '#c0392b', 4, 1);
    } else {
      // Closed peaceful eyes (with delicate eyelashes for female)
      p(ctx, 11, 7, '#241306', 3, 1);
      p(ctx, 16, 7, '#241306', 3, 1);
      if (cfg.gender === 'female') {
        p(ctx, 10, 7, '#241306', 1, 1);
        p(ctx, 19, 7, '#241306', 1, 1);
        p(ctx, 10, 8, 'rgba(231, 110, 110, 0.5)', 2, 1);
        p(ctx, 18, 8, 'rgba(231, 110, 110, 0.5)', 2, 1);
      }
      p(ctx, 14, 9, cfg.skinShadow, 2, 1);
    }

    if (cfg.gender === 'male') {
      if (cfg.beardId === 'beard_stubble') {
        p(ctx, 11, 9, cfg.hairShadow, 8, 2);
      } else if (cfg.beardId === 'beard_full') {
        p(ctx, 10, 8, cfg.hairMain, 10, 3);
      }
    }
  };

  // Frame 0: Peaceful Sleeping
  {
    const { canvas, ctx } = createCanvas(32, 22);
    drawSleepHeadAndHair(ctx, false);

    // Torso / shoulders resting on bed
    p(ctx, 7, 11, cfg.shirtColor, 16, 8);
    p(ctx, 7, 17, cfg.shirtShadow, 16, 2);

    if (cfg.outfitId === 'outfit_flannel') {
      p(ctx, 7, 13, '#6e1c14', 16, 1);
      p(ctx, 7, 16, '#6e1c14', 16, 1);
    } else if (cfg.outfitId === 'outfit_overalls') {
      p(ctx, 10, 11, '#285582', 2, 8);
      p(ctx, 18, 11, '#285582', 2, 8);
    } else if (cfg.outfitId === 'outfit_lab') {
      p(ctx, 13, 11, '#5dade2', 4, 6);
    }

    p(ctx, 5, 12, cfg.shirtColor, 2, 6);
    p(ctx, 5, 17, cfg.skinColor, 2, 2);
    p(ctx, 23, 12, cfg.shirtColor, 2, 6);
    p(ctx, 23, 17, cfg.skinColor, 2, 2);

    frames.push(canvas);
  }

  // Frame 1: Subtle Inhale Breathing Rise
  {
    const { canvas, ctx } = createCanvas(32, 22);
    drawSleepHeadAndHair(ctx, false);

    p(ctx, 7, 10, cfg.shirtColor, 16, 8);
    p(ctx, 7, 16, cfg.shirtShadow, 16, 2);

    if (cfg.outfitId === 'outfit_flannel') {
      p(ctx, 7, 12, '#6e1c14', 16, 1);
      p(ctx, 7, 15, '#6e1c14', 16, 1);
    } else if (cfg.outfitId === 'outfit_overalls') {
      p(ctx, 10, 10, '#285582', 2, 8);
      p(ctx, 18, 10, '#285582', 2, 8);
    } else if (cfg.outfitId === 'outfit_lab') {
      p(ctx, 13, 10, '#5dade2', 4, 6);
    }

    p(ctx, 5, 11, cfg.shirtColor, 2, 6);
    p(ctx, 5, 16, cfg.skinColor, 2, 2);
    p(ctx, 23, 11, cfg.shirtColor, 2, 6);
    p(ctx, 23, 16, cfg.skinColor, 2, 2);

    frames.push(canvas);
  }

  // Frame 2: Morning Wake-Up & Sleepy Stretch
  {
    const { canvas, ctx } = createCanvas(32, 22);
    drawSleepHeadAndHair(ctx, true);

    p(ctx, 7, 11, cfg.shirtColor, 16, 8);
    p(ctx, 7, 17, cfg.shirtShadow, 16, 2);

    p(ctx, 4, 3, cfg.shirtColor, 3, 8);
    p(ctx, 3, 2, cfg.skinColor, 3, 2);
    p(ctx, 23, 3, cfg.shirtColor, 3, 8);
    p(ctx, 24, 2, cfg.skinColor, 3, 2);

    frames.push(canvas);
  }

  return frames;
}

/**
 * Generates NPC sprites (32x32).
 */
function createNpcSprite(role: 'professor' | 'rosa' | 'maya' | 'merchant'): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(32, 32);
  p(ctx, 9, 28, 'rgba(12, 8, 4, 0.5)', 14, 3);

  if (role === 'professor') {
    p(ctx, 11, 26, '#333333', 4, 3);
    p(ctx, 17, 26, '#333333', 4, 3);
    p(ctx, 10, 29, '#1a1a1a', 5, 2);
    p(ctx, 17, 29, '#1a1a1a', 5, 2);
    p(ctx, 10, 15, '#f5f5f5', 12, 12);
    p(ctx, 15, 16, '#284d72', 2, 7);
    p(ctx, 12, 15, '#284d72', 8, 2);
    p(ctx, 7, 17, '#f5f5f5', 3, 8);
    p(ctx, 22, 17, '#f5f5f5', 3, 8);
    p(ctx, 12, 8, '#f3cbb0', 8, 7);
    p(ctx, 11, 5, '#e0e0e0', 10, 4);
    p(ctx, 10, 8, '#e0e0e0', 2, 5);
    p(ctx, 20, 8, '#e0e0e0', 2, 5);
    p(ctx, 13, 10, '#c89520', 3, 2);
    p(ctx, 17, 10, '#c89520', 3, 2);
  } else if (role === 'rosa') {
    p(ctx, 11, 26, '#1f3c63', 4, 3);
    p(ctx, 17, 26, '#1f3c63', 4, 3);
    p(ctx, 10, 29, '#4a2f16', 5, 2);
    p(ctx, 17, 29, '#4a2f16', 5, 2);
    p(ctx, 9, 15, '#b83b2e', 14, 11);
    p(ctx, 12, 17, '#2a4f82', 8, 9);
    p(ctx, 12, 8, '#d49b78', 8, 7);
    p(ctx, 6, 6, '#d8aa4d', 20, 3);
    p(ctx, 10, 2, '#d8aa4d', 12, 4);
  } else if (role === 'maya') {
    p(ctx, 11, 26, '#282b30', 4, 3);
    p(ctx, 17, 26, '#282b30', 4, 3);
    p(ctx, 10, 15, '#4a306d', 12, 11);
    p(ctx, 11, 18, '#ffffff', 10, 9);
    p(ctx, 12, 8, '#e5b894', 8, 7);
    p(ctx, 11, 4, '#1b1b1b', 10, 5);
  } else {
    p(ctx, 11, 26, '#212f3d', 4, 3);
    p(ctx, 17, 26, '#212f3d', 4, 3);
    p(ctx, 9, 15, '#196f3d', 14, 11);
    p(ctx, 12, 16, '#f1c40f', 8, 2);
    p(ctx, 12, 8, '#f5cba7', 8, 7);
    p(ctx, 8, 6, '#1b2631', 16, 2);
    p(ctx, 10, 2, '#1b2631', 12, 5);
  }

  return canvas;
}

function renderTilledRowTile(
  ctx: CanvasRenderingContext2D,
  variant: number,
  capType: 'left' | 'mid' | 'right' = 'mid'
) {
  p(ctx, 0, 0, '#26160a', 32, 32);
  p(ctx, 0, 0, '#1a0e05', 32, 2);
  p(ctx, 0, 28, '#170c04', 32, 4);
  const startX = capType === 'left' ? 3 : 0;
  const endX = capType === 'right' ? 29 : 32;
  const bedWidth = endX - startX;
  p(ctx, startX, 4, '#6b4423', bedWidth, 2);
  p(ctx, startX, 6, '#462b15', bedWidth, 20);
  p(ctx, startX, 11, '#2b180b', bedWidth, 10);
  for (let x = startX; x < endX; x += 4) {
    if ((x + variant) % 3 === 0) {
      p(ctx, x, 10, '#59381c', 2, 1);
    }
  }
}

/**
 * Generates environment tiles (32x32) including green grass edges, warm brown dirt paths, and simple wooden fence.
 */
function createEnvironmentTiles() {
  // 4 Green Grass Variants
  const grassVariants: HTMLCanvasElement[] = [];
  for (let v = 0; v < 4; v++) {
    const { canvas: gCanvas, ctx: gCtx } = createCanvas(32, 32);
    gCtx.fillStyle = '#386633';
    gCtx.fillRect(0, 0, 32, 32);

    gCtx.fillStyle = '#2e572a';
    gCtx.fillRect((v * 7) % 20, (v * 5) % 20, 10, 8);
    gCtx.fillRect((v * 11 + 9) % 22, (v * 13 + 7) % 22, 8, 9);

    const bladeTufts = [
      [3, 5], [11, 13], [21, 4], [27, 17], [7, 23], [17, 27], [2, 15], [15, 7],
      [25, 25], [10, 2], [20, 19], [28, 9], [6, 10], [13, 21], [23, 12],
    ];
    bladeTufts.forEach(([bx, by], idx) => {
      const x = (bx + v * 5) % 29;
      const y = (by + v * 3) % 28;
      gCtx.fillStyle = '#254722';
      gCtx.fillRect(x, y + 2, 2, 2);
      gCtx.fillStyle = '#4c8246';
      gCtx.fillRect(x, y, 2, 2);
      if ((idx + v) % 3 === 0) {
        gCtx.fillStyle = '#5e9c57';
        gCtx.fillRect(x + 1, y - 1, 1, 2);
      }
    });

    grassVariants.push(gCanvas);
  }
  const grass = grassVariants[0];

  // 4 Warm Brown Dirt Path Variants (connecting the 2x2 garden plots)
  const pathDirtVariants: HTMLCanvasElement[] = [];
  for (let v = 0; v < 4; v++) {
    const { canvas: pdCanvas, ctx: pdCtx } = createCanvas(32, 32);
    pdCtx.fillStyle = '#6e4928';
    pdCtx.fillRect(0, 0, 32, 32);

    // Subtle compacted earthen footpath shading
    pdCtx.fillStyle = '#5e3d20';
    for (let i = 0; i < 10; i++) {
      const rx = (i * 11 + v * 7) % 27;
      const ry = (i * 17 + v * 5) % 27;
      pdCtx.fillRect(rx, ry, 5, 3);
    }

    pdCtx.fillStyle = '#7d5530';
    for (let i = 0; i < 14; i++) {
      const rx = (i * 7 + v * 3 + 2) % 29;
      const ry = (i * 13 + v * 9 + 3) % 29;
      pdCtx.fillRect(rx, ry, 3, 2);
    }

    // Fine pebbles on dirt path
    for (let i = 0; i < 10; i++) {
      const rx = (i * 19 + v * 5 + 1) % 30;
      const ry = (i * 9 + v * 11 + 4) % 30;
      pdCtx.fillStyle = i % 2 === 0 ? '#8c6239' : '#4a2e16';
      pdCtx.fillRect(rx, ry, 2, 1);
    }

    pathDirtVariants.push(pdCanvas);
  }

  const dirtVariants = pathDirtVariants;
  const dirt = dirtVariants[0];

  const tilledRowMidVariants: HTMLCanvasElement[] = [];
  for (let v = 0; v < 4; v++) {
    const { canvas: trCanvas, ctx: trCtx } = createCanvas(32, 32);
    renderTilledRowTile(trCtx, v, 'mid');
    tilledRowMidVariants.push(trCanvas);
  }
  const tilled = tilledRowMidVariants[0];

  const { canvas: tilledRowLeft, ctx: trlCtx } = createCanvas(32, 32);
  renderTilledRowTile(trlCtx, 0, 'left');

  const { canvas: tilledRowRight, ctx: trrCtx } = createCanvas(32, 32);
  renderTilledRowTile(trrCtx, 1, 'right');

  const { canvas: plasticMulch, ctx: mCtx } = createCanvas(32, 32);
  renderTilledRowTile(mCtx, 2, 'mid');

  const { canvas: water, ctx: wCtx } = createCanvas(32, 32);
  wCtx.fillStyle = '#1d4e6b';
  wCtx.fillRect(0, 0, 32, 32);
  wCtx.fillStyle = '#26658a';
  wCtx.fillRect(0, 4, 32, 8);
  wCtx.fillRect(0, 18, 32, 8);

  // Simple Classic 16-Bit Wooden Fence
  const { canvas: fence, ctx: fCtx } = createCanvas(32, 32);
  p(fCtx, 2, 26, 'rgba(12, 8, 4, 0.45)', 28, 4);
  p(fCtx, 4, 4, '#4a2e14', 6, 24);
  p(fCtx, 5, 4, '#734a24', 4, 23);
  p(fCtx, 22, 4, '#4a2e14', 6, 24);
  p(fCtx, 23, 4, '#734a24', 4, 23);
  p(fCtx, 0, 8, '#8a5a2e', 32, 4);
  p(fCtx, 0, 8, '#a36e3b', 32, 1);
  p(fCtx, 0, 11, '#3b2410', 32, 1);
  p(fCtx, 0, 18, '#8a5a2e', 32, 4);
  p(fCtx, 0, 18, '#a36e3b', 32, 1);
  p(fCtx, 0, 21, '#3b2410', 32, 1);

  // 16-Bit Agronomy Laboratory Wall (Timber-framed cream masonry & wood wainscoting)
  const { canvas: labWall, ctx: lwCtx } = createCanvas(32, 32);
  p(lwCtx, 0, 0, '#d8d2c2', 32, 22);
  // Subtle masonry brick courses
  for (let by = 4; by < 20; by += 6) {
    p(lwCtx, 0, by, '#c5beac', 32, 1);
    const offset = (by % 12 === 4) ? 8 : 20;
    p(lwCtx, offset, by - 4, '#c5beac', 1, 4);
  }
  // Timber cornice & lower wood wainscoting
  p(lwCtx, 0, 0, '#4a2c14', 32, 2);
  p(lwCtx, 0, 21, '#3b210f', 32, 2);
  p(lwCtx, 0, 23, '#6e4722', 32, 7);
  for (let wx = 4; wx < 32; wx += 8) {
    p(lwCtx, wx, 23, '#4a2c14', 1, 7);
  }
  p(lwCtx, 0, 30, '#2c1a0d', 32, 2);

  // 16-Bit Agronomy Laboratory Roof (Forest-slate shingles with ridge detail)
  const { canvas: labRoof, ctx: lrCtx } = createCanvas(32, 32);
  p(lrCtx, 0, 0, '#263829', 32, 32);
  for (let ry = 0; ry < 32; ry += 8) {
    p(lrCtx, 0, ry, '#344e38', 32, 6);
    p(lrCtx, 0, ry + 6, '#18241a', 32, 2);
    const shift = (ry % 16 === 0) ? 0 : 8;
    for (let rx = shift; rx < 32; rx += 16) {
      p(lrCtx, rx, ry, '#1e2e21', 2, 6);
      p(lrCtx, rx + 3, ry + 1, '#446349', 8, 2);
    }
  }

  // 16-Bit Laboratory Entrance Door (Carved oak frame, glass transom window, brass doorknob)
  const { canvas: labDoor, ctx: ldCtx } = createCanvas(32, 32);
  // Wall background around door frame
  p(ldCtx, 0, 0, '#d8d2c2', 32, 22);
  p(ldCtx, 0, 21, '#3b210f', 32, 2);
  p(ldCtx, 0, 23, '#6e4722', 32, 9);
  // Heavy wooden door frame
  p(ldCtx, 3, 1, '#241306', 26, 31);
  p(ldCtx, 5, 3, '#5c3818', 22, 29);
  p(ldCtx, 6, 4, '#784b24', 20, 28);
  // Upper glass window pane with sunlit reflection
  p(ldCtx, 8, 6, '#1b2c1e', 16, 10);
  p(ldCtx, 9, 7, '#5dade2', 6, 8);
  p(ldCtx, 17, 7, '#5dade2', 6, 8);
  p(ldCtx, 10, 8, '#aed6f1', 3, 3);
  p(ldCtx, 18, 8, '#aed6f1', 3, 3);
  // Lower carved wood panels
  p(ldCtx, 8, 18, '#4a2c14', 7, 11);
  p(ldCtx, 9, 19, '#633d1e', 5, 9);
  p(ldCtx, 17, 18, '#4a2c14', 7, 11);
  p(ldCtx, 18, 19, '#633d1e', 5, 9);
  // Gleaming brass doorknob & stone threshold step
  p(ldCtx, 22, 17, '#241306', 3, 3);
  p(ldCtx, 22, 17, '#f0c54d', 2, 2);
  p(ldCtx, 2, 30, '#8d99ae', 28, 2);

  // 16-Bit Laboratory Window (Framed glass window with wooden flower/specimen sill)
  const { canvas: labWindow, ctx: lwnCtx } = createCanvas(32, 32);
  p(lwnCtx, 0, 0, '#d8d2c2', 32, 22);
  p(lwnCtx, 0, 0, '#4a2c14', 32, 2);
  p(lwnCtx, 0, 21, '#3b210f', 32, 2);
  p(lwnCtx, 0, 23, '#6e4722', 32, 7);
  p(lwnCtx, 0, 30, '#2c1a0d', 32, 2);
  // Window frame
  p(lwnCtx, 5, 4, '#241306', 22, 16);
  p(lwnCtx, 7, 6, '#2e86c1', 8, 12);
  p(lwnCtx, 17, 6, '#2e86c1', 8, 12);
  p(lwnCtx, 7, 11, '#241306', 18, 2);
  p(lwnCtx, 8, 7, '#85c1e9', 4, 3);
  p(lwnCtx, 18, 7, '#85c1e9', 4, 3);
  p(lwnCtx, 4, 19, '#8a5a2e', 24, 3);

  const { canvas: stoneObstacle, ctx: soCtx } = createCanvas(32, 32);
  soCtx.fillStyle = '#5c6466';
  soCtx.fillRect(6, 10, 20, 14);

  const { canvas: weedObstacle, ctx: woCtx } = createCanvas(32, 32);
  woCtx.fillStyle = '#2d5a27';
  woCtx.fillRect(4, 12, 24, 14);

  // 16-Bit Soil Science Assay Bench (Wooden workbench with glass beaker, flask & digital pH meter)
  const { canvas: soilTable, ctx: stCtx } = createCanvas(32, 32);
  p(stCtx, 2, 26, 'rgba(10, 6, 2, 0.5)', 28, 4);
  p(stCtx, 2, 8, '#241306', 28, 18);
  p(stCtx, 3, 9, '#784b24', 26, 5);
  p(stCtx, 4, 10, '#9c6635', 24, 2);
  p(stCtx, 4, 14, '#4a2c14', 24, 8);
  p(stCtx, 4, 22, '#3b210f', 4, 6);
  p(stCtx, 24, 22, '#3b210f', 4, 6);
  // Lab glassware & pH meter on benchtop
  p(stCtx, 6, 3, '#aed6f1', 5, 7);
  p(stCtx, 7, 6, '#2ecc71', 3, 3);
  p(stCtx, 14, 4, '#241306', 7, 6);
  p(stCtx, 15, 5, '#f0c54d', 5, 3);
  p(stCtx, 23, 3, '#fff8e7', 4, 7);
  p(stCtx, 24, 6, '#3498db', 2, 3);

  // 16-Bit Harvest Maturity & Brix Bench (Wooden table with sample melon & refractometer)
  const { canvas: harvestBench, ctx: hbCtx } = createCanvas(32, 32);
  p(hbCtx, 2, 26, 'rgba(10, 6, 2, 0.5)', 28, 4);
  p(hbCtx, 2, 8, '#241306', 28, 18);
  p(hbCtx, 3, 9, '#6e4722', 26, 5);
  p(hbCtx, 4, 10, '#8f5c34', 24, 2);
  p(hbCtx, 4, 14, '#4a2c14', 24, 8);
  p(hbCtx, 4, 22, '#3b210f', 4, 6);
  p(hbCtx, 24, 22, '#3b210f', 4, 6);
  // Mini striped watermelon & refractometer on bench
  p(hbCtx, 6, 3, '#184a1d', 10, 7);
  p(hbCtx, 7, 5, '#88d46c', 8, 2);
  p(hbCtx, 20, 5, '#34495e', 6, 4);
  p(hbCtx, 24, 5, '#5dade2', 2, 3);

  // 16-Bit Drip Irrigation Manifold & Pressure Valve Sprite (32x32 fallback)
  const { canvas: irrigationValve, ctx: ivCtx } = createCanvas(32, 32);
  p(ivCtx, 3, 27, 'rgba(10, 6, 2, 0.45)', 26, 4);
  p(ivCtx, 4, 21, '#5a6268', 24, 8);
  p(ivCtx, 5, 22, '#7b848c', 22, 5);
  // Blue cast-iron water standpipe & brass manifold
  p(ivCtx, 13, 8, '#1b4f72', 6, 15);
  p(ivCtx, 14, 8, '#2980b9', 3, 15);
  p(ivCtx, 7, 13, '#b7950b', 18, 4);
  p(ivCtx, 8, 14, '#f0c54d', 16, 2);
  // Red spoked handwheel valve on top
  p(ivCtx, 9, 3, '#781e14', 14, 6);
  p(ivCtx, 10, 4, '#e74c3c', 12, 4);
  p(ivCtx, 13, 5, '#241306', 6, 2);
  // Brass pressure gauge dial
  p(ivCtx, 20, 6, '#d4a838', 6, 6);
  p(ivCtx, 21, 7, '#fff8e7', 4, 4);
  p(ivCtx, 22, 8, '#c0392b', 2, 2);

  // 16-Bit Organic Bio-Spray Pressurized Tank & Hose Station Sprite (32x32 fallback)
  const { canvas: bioSprayRig, ctx: bsCtx } = createCanvas(32, 32);
  p(bsCtx, 2, 27, 'rgba(10, 6, 2, 0.5)', 28, 4);
  // Heavy wooden pallet base
  p(bsCtx, 2, 22, '#241306', 28, 7);
  p(bsCtx, 3, 23, '#784722', 26, 3);
  p(bsCtx, 3, 26, '#4a2c14', 26, 2);
  // Pressurized Stainless & Emerald Bio-Extract Tank (Left/Center)
  p(bsCtx, 4, 5, '#0f3012', 14, 18);
  p(bsCtx, 5, 4, '#1b5e20', 12, 2);
  p(bsCtx, 5, 6, '#27ae60', 12, 16);
  p(bsCtx, 6, 6, '#58d68d', 3, 15);
  // Brass bands & pressure gauge on top of tank
  p(bsCtx, 4, 9, '#d4a838', 14, 2);
  p(bsCtx, 4, 17, '#d4a838', 14, 2);
  p(bsCtx, 9, 1, '#d4a838', 5, 4);
  p(bsCtx, 10, 2, '#ffffff', 3, 2);
  // Translucent sight-glass level tube
  p(bsCtx, 13, 11, '#14331d', 3, 6);
  p(bsCtx, 14, 12, '#88d46c', 1, 4);
  // Coiled high-pressure yellow spray hose & brass lance wand (Right)
  p(bsCtx, 19, 10, '#241306', 10, 12);
  p(bsCtx, 20, 11, '#f1c40f', 8, 10);
  p(bsCtx, 22, 13, '#3b210f', 4, 6);
  p(bsCtx, 27, 4, '#bdc3c7', 2, 18);
  p(bsCtx, 26, 3, '#f0c54d', 4, 2);

  // 16-Bit Realistic Farmhouse Bed (Carved oak headboard, white pillow, patchwork green & gold quilt)
  const { canvas: bed, ctx: bCtx } = createCanvas(32, 32);
  p(bCtx, 2, 27, 'rgba(10, 6, 2, 0.45)', 28, 4);
  p(bCtx, 3, 2, '#241306', 26, 27);
  p(bCtx, 4, 3, '#6e4320', 24, 6);
  p(bCtx, 5, 4, '#8c5828', 22, 3);
  // Plump white pillows
  p(bCtx, 6, 8, '#e8e2d5', 9, 5);
  p(bCtx, 17, 8, '#e8e2d5', 9, 5);
  p(bCtx, 7, 9, '#ffffff', 7, 3);
  p(bCtx, 18, 9, '#ffffff', 7, 3);
  // Stitched green & gold patchwork quilt
  p(bCtx, 5, 13, '#1e4624', 22, 13);
  p(bCtx, 6, 14, '#2d6a36', 10, 5);
  p(bCtx, 16, 14, '#d4a838', 10, 5);
  p(bCtx, 6, 19, '#d4a838', 10, 6);
  p(bCtx, 16, 19, '#2d6a36', 10, 6);
  p(bCtx, 4, 26, '#5c3416', 24, 3);

  // 16-Bit Realistic Wardrobe Cabinet (Carved mahogany double-door armoire with brass handles)
  const { canvas: wardrobe, ctx: wdCtx } = createCanvas(32, 32);
  p(wdCtx, 2, 28, 'rgba(10, 6, 2, 0.5)', 28, 3);
  p(wdCtx, 3, 1, '#1f1005', 26, 29);
  p(wdCtx, 2, 1, '#5c3416', 28, 3);
  p(wdCtx, 4, 4, '#784722', 24, 24);
  p(wdCtx, 5, 5, '#522d12', 10, 17);
  p(wdCtx, 17, 5, '#522d12', 10, 17);
  p(wdCtx, 6, 6, '#693b19', 8, 15);
  p(wdCtx, 18, 6, '#693b19', 8, 15);
  p(wdCtx, 13, 12, '#f0c54d', 2, 3);
  p(wdCtx, 17, 12, '#f0c54d', 2, 3);
  p(wdCtx, 5, 23, '#3b210f', 22, 4);
  p(wdCtx, 14, 24, '#f0c54d', 4, 2);

  // 16-Bit Striped-Awning Watermelon Market Stall (Fallback 32x32 sprite)
  const { canvas: marketStall, ctx: msCtx } = createCanvas(32, 32);
  p(msCtx, 1, 28, 'rgba(10, 6, 2, 0.5)', 30, 3);
  p(msCtx, 2, 1, '#241306', 28, 10);
  for (let sx = 3; sx < 29; sx += 4) {
    p(msCtx, sx, 2, (sx / 4) % 2 === 0 ? '#c0392b' : '#f7eed7', 4, 8);
  }
  p(msCtx, 4, 11, '#4a2c14', 2, 18);
  p(msCtx, 26, 11, '#4a2c14', 2, 18);
  p(msCtx, 2, 16, '#241306', 28, 13);
  p(msCtx, 3, 17, '#8c5828', 26, 5);
  p(msCtx, 3, 22, '#5c3416', 26, 6);
  // Striped watermelons on counter
  p(msCtx, 6, 12, '#184a1d', 8, 6);
  p(msCtx, 7, 14, '#88d46c', 6, 2);
  p(msCtx, 16, 13, '#e74c3c', 7, 5);
  p(msCtx, 15, 16, '#184a1d', 9, 2);

  // 16-Bit Wooden River Pier Planks with Side Pilings
  const { canvas: pier, ctx: pCtx } = createCanvas(32, 32);
  p(pCtx, 0, 0, '#3b210f', 32, 32);
  for (let py = 1; py < 31; py += 5) {
    p(pCtx, 2, py, '#784722', 28, 4);
    p(pCtx, 2, py, '#8f5c34', 28, 1);
    p(pCtx, 5, py + 2, '#241306', 2, 1);
    p(pCtx, 25, py + 2, '#241306', 2, 1);
  }
  p(pCtx, 0, 0, '#4a2c14', 3, 32);
  p(pCtx, 29, 0, '#4a2c14', 3, 32);

  // 16-Bit Farmhouse Timber/Log Wall (Warm horizontal cedar logs with mortar chinking & stone base)
  const { canvas: cabinWall, ctx: cwCtx } = createCanvas(32, 32);
  p(cwCtx, 0, 0, '#6e4320', 32, 32);
  for (let ly = 0; ly < 26; ly += 6) {
    p(cwCtx, 0, ly, '#85532a', 32, 2);
    p(cwCtx, 0, ly + 2, '#6e4320', 32, 3);
    p(cwCtx, 0, ly + 5, '#3b210f', 32, 1);
  }
  // Stone foundation masonry along bottom
  p(cwCtx, 0, 26, '#2b1809', 32, 2);
  p(cwCtx, 0, 28, '#5a6268', 32, 4);
  p(cwCtx, 2, 29, '#7b848c', 11, 2);
  p(cwCtx, 16, 29, '#7b848c', 13, 2);

  // 16-Bit Farmhouse Cedar Shingle Roof (Warm terracotta-cedar overlapping shingles)
  const { canvas: cabinRoof, ctx: crCtx } = createCanvas(32, 32);
  p(crCtx, 0, 0, '#5c2610', 32, 32);
  for (let ry = 0; ry < 32; ry += 8) {
    p(crCtx, 0, ry, '#7d361a', 32, 6);
    p(crCtx, 0, ry + 6, '#3d1708', 32, 2);
    const shift = ry % 16 === 0 ? 0 : 8;
    for (let rx = shift; rx < 32; rx += 16) {
      p(crCtx, rx, ry, '#4a1d0b', 2, 6);
      p(crCtx, rx + 3, ry + 1, '#994626', 9, 2);
    }
  }

  // 16-Bit Farmhouse Entrance Door (Carved timber door frame, warm sunlit window pane, brass latch)
  const { canvas: cabinDoor, ctx: cdCtx } = createCanvas(32, 32);
  for (let ly = 0; ly < 26; ly += 6) {
    p(cdCtx, 0, ly, '#85532a', 32, 2);
    p(cdCtx, 0, ly + 2, '#6e4320', 32, 3);
    p(cdCtx, 0, ly + 5, '#3b210f', 32, 1);
  }
  p(cdCtx, 0, 26, '#5a6268', 32, 6);
  // Outer door frame
  p(cdCtx, 4, 1, '#241306', 24, 31);
  p(cdCtx, 6, 3, '#8c5828', 20, 28);
  p(cdCtx, 7, 4, '#5c3416', 18, 26);
  // Warm cottage window pane in upper door
  p(cdCtx, 10, 6, '#241306', 12, 9);
  p(cdCtx, 11, 7, '#f5b041', 4, 7);
  p(cdCtx, 17, 7, '#f5b041', 4, 7);
  p(cdCtx, 12, 8, '#fdebd0', 2, 3);
  p(cdCtx, 18, 8, '#fdebd0', 2, 3);
  // Lower vertical timber planks & cross brace
  p(cdCtx, 9, 17, '#784722', 14, 11);
  p(cdCtx, 15, 17, '#3b210f', 2, 11);
  p(cdCtx, 9, 21, '#8c5828', 14, 2);
  // Brass doorknob & threshold step
  p(cdCtx, 21, 16, '#241306', 3, 3);
  p(cdCtx, 21, 16, '#f0c54d', 2, 2);
  p(cdCtx, 3, 30, '#8d99ae', 26, 2);

  // 16-Bit Farmhouse Window (Warm glowing cottage window with forest-green shutters & flower box)
  const { canvas: cabinWindow, ctx: cwnCtx } = createCanvas(32, 32);
  for (let ly = 0; ly < 26; ly += 6) {
    p(cwnCtx, 0, ly, '#85532a', 32, 2);
    p(cwnCtx, 0, ly + 2, '#6e4320', 32, 3);
    p(cwnCtx, 0, ly + 5, '#3b210f', 32, 1);
  }
  p(cwnCtx, 0, 26, '#2b1809', 32, 2);
  p(cwnCtx, 0, 28, '#5a6268', 32, 4);
  // Forest-green wooden shutters on left and right
  p(cwnCtx, 2, 4, '#1b3b1e', 5, 16);
  p(cwnCtx, 3, 5, '#2d6132', 3, 14);
  p(cwnCtx, 25, 4, '#1b3b1e', 5, 16);
  p(cwnCtx, 26, 5, '#2d6132', 3, 14);
  // Framed cottage glass window with warm interior glow
  p(cwnCtx, 7, 4, '#241306', 18, 16);
  p(cwnCtx, 9, 6, '#f5b041', 6, 12);
  p(cwnCtx, 17, 6, '#f5b041', 6, 12);
  p(cwnCtx, 9, 11, '#241306', 14, 2);
  p(cwnCtx, 10, 7, '#fef5e7', 3, 3);
  p(cwnCtx, 18, 7, '#fef5e7', 3, 3);
  // Wooden window sill planter box
  p(cwnCtx, 5, 20, '#3b210f', 22, 4);
  p(cwnCtx, 6, 21, '#8c5828', 20, 2);
  p(cwnCtx, 8, 18, '#2ecc71', 16, 3);
  p(cwnCtx, 10, 17, '#e74c3c', 2, 2);
  p(cwnCtx, 15, 17, '#f1c40f', 2, 2);
  p(cwnCtx, 20, 17, '#e74c3c', 2, 2);

  const { canvas: flooring, ctx: flCtx } = createCanvas(32, 32);
  flCtx.fillStyle = '#8c5828';
  flCtx.fillRect(0, 0, 32, 32);

  // 16-Bit Textured Marketplace Cobblestone Flagstones (Warm stone blocks with mortar joints & specular highlights)
  const { canvas: cobble, ctx: cbCtx } = createCanvas(32, 32);
  p(cbCtx, 0, 0, '#444b52', 32, 32); // Recessed mortar base
  const stones: Array<[number, number, number, number, string, string]> = [
    [1, 1, 14, 9, '#6c757d', '#828b94'],
    [16, 1, 15, 9, '#636b73', '#78818a'],
    [1, 11, 9, 10, '#5e666e', '#737c85'],
    [11, 11, 12, 10, '#736b60', '#877f73'], // Warm sandstone accent block
    [24, 11, 7, 10, '#6a737b', '#7f8992'],
    [1, 22, 15, 9, '#666f78', '#7b858f'],
    [17, 22, 14, 9, '#5d656d', '#727b84'],
  ];
  for (const [sx, sy, sw, sh, baseCol, hiCol] of stones) {
    p(cbCtx, sx, sy, baseCol, sw, sh);
    p(cbCtx, sx + 1, sy + 1, hiCol, sw - 2, 1);
    p(cbCtx, sx, sy + sh - 1, '#363c42', sw, 1);
  }

  return {
    grass,
    grassVariants,
    dirt,
    dirtVariants,
    pathDirtVariants,
    tilled,
    tilledRowLeft,
    tilledRowMidVariants,
    tilledRowRight,
    plasticMulch,
    water,
    fence,
    labWall,
    labRoof,
    labDoor,
    labWindow,
    stoneObstacle,
    weedObstacle,
    soilTable,
    harvestBench,
    irrigationValve,
    bioSprayRig,
    bed,
    wardrobe,
    marketStall,
    pier,
    cabinWall,
    cabinRoof,
    cabinDoor,
    cabinWindow,
    flooring,
    cobble,
  };
}

/**
 * Helper to draw a textured cucurbit leaf.
 */
function drawTexturedLeaf(ctx: CanvasRenderingContext2D, lx: number, ly: number, size: 'small' | 'large') {
  if (size === 'small') {
    p(ctx, lx, ly + 2, '#140b04', 6, 4);
    p(ctx, lx, ly, '#1c4515', 6, 5);
    p(ctx, lx - 1, ly + 1, '#1c4515', 8, 3);
    p(ctx, lx, ly, '#347329', 5, 4);
    p(ctx, lx + 1, ly - 1, '#347329', 4, 5);
    p(ctx, lx + 1, ly + 1, '#589e49', 3, 2);
    p(ctx, lx + 2, ly, '#78bf67', 2, 1);
  } else {
    p(ctx, lx, ly + 3, '#120903', 10, 6);
    p(ctx, lx, ly, '#183d12', 10, 7);
    p(ctx, lx - 1, ly + 2, '#183d12', 12, 4);
    p(ctx, lx + 2, ly - 1, '#183d12', 6, 9);
    p(ctx, lx + 1, ly + 1, '#2d6323', 8, 5);
    p(ctx, lx, ly + 2, '#2d6323', 10, 3);
    p(ctx, lx + 3, ly, '#3c7d30', 4, 6);
    p(ctx, lx + 2, ly + 3, '#5ca34e', 6, 1);
    p(ctx, lx + 4, ly + 1, '#5ca34e', 2, 4);
    p(ctx, lx + 3, ly + 1, '#80c971', 2, 1);
  }
}

/**
 * Helper to draw a bright yellow 5-petal monoecious watermelon flower.
 */
function drawMonoeciousFlower(ctx: CanvasRenderingContext2D, fx: number, fy: number) {
  p(ctx, fx, fy + 1, '#183d12', 5, 4);
  p(ctx, fx + 1, fy, '#ffe135', 3, 5);
  p(ctx, fx, fy + 1, '#ffe135', 5, 3);
  p(ctx, fx + 1, fy + 3, '#f0b000', 3, 2);
  p(ctx, fx + 3, fy + 1, '#f5be0b', 2, 2);
  p(ctx, fx + 1, fy, '#fff380', 2, 1);
  p(ctx, fx + 2, fy + 2, '#cc6600', 1, 1);
}

/**
 * Helper to draw a small light-green unripe watermelon on the vine (Plot 3).
 */
function drawUnripeLightGreenMelon(ctx: CanvasRenderingContext2D, mx: number, my: number) {
  p(ctx, mx, my + 6, '#120903', 9, 2);
  p(ctx, mx + 1, my, '#5c9132', 7, 7);
  p(ctx, mx, my + 1, '#5c9132', 9, 5);
  p(ctx, mx + 1, my + 1, '#88c454', 7, 5);
  p(ctx, mx + 2, my, '#a6de76', 5, 4);
  p(ctx, mx + 2, my + 2, '#6ea640', 1, 3);
  p(ctx, mx + 6, my + 1, '#6ea640', 1, 4);
  p(ctx, mx + 2, my + 1, '#d8f7b8', 2, 1);
}

/**
 * Helper to draw a massive, fully mature dark-green striped watermelon (Plot 4).
 */
function drawMassiveMatureMelon(ctx: CanvasRenderingContext2D, mx: number, my: number, isHero = false) {
  const w = isHero ? 26 : 18;
  const h = isHero ? 18 : 13;

  // Heavy high-contrast ground shadow
  p(ctx, mx + 1, my + h - 2, '#0f0702', w - 2, 5);
  p(ctx, mx, my + h - 3, '#170b04', w, 4);

  if (isHero) {
    // Massive centerpiece mature watermelon (26x18)
    p(ctx, mx + 4, my, '#0f3012', 18, 18);
    p(ctx, mx + 2, my + 1, '#0f3012', 22, 16);
    p(ctx, mx, my + 3, '#0b240d', 26, 12);

    // Rich dark-green rind body
    p(ctx, mx + 3, my + 2, '#184a1d', 20, 14);
    p(ctx, mx + 1, my + 4, '#184a1d', 24, 10);

    // Jagged light-green longitudinal stripes
    p(ctx, mx + 4, my + 2, '#68b54e', 18, 2);
    p(ctx, mx + 6, my + 3, '#88d46c', 6, 1);
    p(ctx, mx + 15, my + 3, '#88d46c', 5, 1);

    p(ctx, mx + 2, my + 6, '#5ca644', 22, 3);
    p(ctx, mx + 4, my + 6, '#88d46c', 7, 2);
    p(ctx, mx + 13, my + 7, '#88d46c', 7, 2);

    p(ctx, mx + 2, my + 11, '#4e9138', 22, 2);
    p(ctx, mx + 5, my + 11, '#72bd57', 6, 1);
    p(ctx, mx + 14, my + 12, '#72bd57', 6, 1);

    p(ctx, mx + 4, my + 15, '#356924', 18, 2);

    // Specular shine on upper-left curvature
    p(ctx, mx + 6, my + 2, '#c8f7b0', 4, 1);
    p(ctx, mx + 5, my + 3, '#e2fcd4', 3, 1);

    // Thick peduncle stem & dried brown tendril
    p(ctx, mx - 3, my + 7, '#346929', 4, 2);
    p(ctx, mx - 4, my + 5, '#7d5228', 2, 3);
  } else {
    // Companion mature striped watermelon (18x13)
    p(ctx, mx + 3, my, '#0f3012', 12, 13);
    p(ctx, mx + 1, my + 1, '#0f3012', 16, 11);
    p(ctx, mx, my + 2, '#0b240d', 18, 9);

    p(ctx, mx + 2, my + 1, '#184a1d', 14, 10);
    p(ctx, mx + 3, my + 2, '#68b54e', 12, 2);
    p(ctx, mx + 1, my + 5, '#5ca644', 16, 2);
    p(ctx, mx + 3, my + 5, '#88d46c', 6, 1);
    p(ctx, mx + 2, my + 9, '#498c35', 14, 2);
    p(ctx, mx + 4, my + 2, '#c8f7b0', 3, 1);
  }
}

/**
 * Generates the 4 distinct square garden plots (112x92 px each) for the 2x2 grid:
 * - Plot 1 (Top-Left): Unkempt plot covered in pixelated rocks, debris, and weeds.
 * - Plot 2 (Top-Right): Preparation plot with freshly tilled, dark, clean soil scattered with fertilizer & seed holes.
 * - Plot 3 (Bottom-Left): Growth plot covered by sprawling green watermelon vines, bright yellow flowers, and small light-green unripe melons.
 * - Plot 4 (Bottom-Right): Harvest plot holding massive, fully mature dark-green striped watermelons.
 */
function createFourSquareGardenPlots(): Record<1 | 2 | 3 | 4, HTMLCanvasElement> {
  const W = 112;
  const H = 92;

  const drawSquarePlotFrame = (ctx: CanvasRenderingContext2D, isDarkTilled: boolean) => {
    // Outer drop shadow on dirt path
    p(ctx, 2, 2, 'rgba(15, 8, 3, 0.55)', W - 2, H - 2);
    // Sunken timber/earth border rim
    p(ctx, 0, 0, '#241307', W - 2, H - 2);
    p(ctx, 2, 2, '#4a2c14', W - 6, H - 6);
    p(ctx, 3, 3, '#331d0c', W - 8, H - 8);

    if (isDarkTilled) {
      // Freshly tilled, dark, clean moist soil interior
      p(ctx, 5, 5, '#261408', W - 12, H - 12);
      // 5 Raised horizontal dark tilled soil ridges across the square plot
      const rowYs = [9, 24, 39, 54, 69];
      for (const ry of rowYs) {
        p(ctx, 7, ry, '#3b210f', W - 16, 2);      // North sunlit ridge edge
        p(ctx, 7, ry + 2, '#211106', W - 16, 7);  // Deep dark moist root crown
        p(ctx, 7, ry + 9, '#140a03', W - 16, 3);  // Deep furrow shadow trench
      }
      // Subtle tilled soil texture
      for (let x = 9; x < W - 12; x += 6) {
        for (let y = 8; y < H - 12; y += 8) {
          if ((x + y) % 5 === 0) {
            p(ctx, x, y, '#472914', 2, 1);
          } else if ((x * 3 + y) % 7 === 0) {
            p(ctx, x, y, '#120802', 2, 2);
          }
        }
      }
    } else {
      // Unkempt rough dry earth interior (Plot 1)
      p(ctx, 5, 5, '#4f351d', W - 12, H - 12);
      for (let x = 7; x < W - 12; x += 5) {
        for (let y = 7; y < H - 12; y += 6) {
          const h = (x * 13 + y * 29) % 7;
          if (h === 0) p(ctx, x, y, '#3d2714', 4, 3);
          else if (h === 1) p(ctx, x, y, '#634427', 3, 2);
          else if (h === 2) p(ctx, x, y, '#2e1c0d', 2, 2);
        }
      }
    }
  };

  // --- PLOT 1 (Top-Left): Unkempt state covered in pixelated rocks, debris, and weeds ---
  const { canvas: plot1, ctx: c1 } = createCanvas(W, H);
  drawSquarePlotFrame(c1, false);

  // Pixelated rocks & fieldstones of varied sizes
  const rocks = [
    [14, 14, 13, 10],
    [54, 12, 15, 11],
    [82, 20, 12, 9],
    [32, 36, 16, 12],
    [70, 44, 13, 10],
    [16, 62, 14, 11],
    [52, 66, 15, 10],
    [84, 64, 11, 9],
  ];
  for (const [rx, ry, rw, rh] of rocks) {
    p(c1, rx, ry + rh - 2, '#170d05', rw + 1, 3);
    p(c1, rx, ry + 1, '#495057', rw, rh - 1);
    p(c1, rx + 1, ry, '#6c757d', rw - 2, rh - 2);
    p(c1, rx + 2, ry + 1, '#adb5bd', Math.max(3, rw - 5), 3);
    p(c1, rx + 3, ry + 2, '#dee2e6', 2, 1);
  }

  // Pixelated woody twigs & dead branch debris
  const debris = [
    [34, 18, 14, 3],
    [18, 46, 12, 3],
    [54, 32, 15, 3],
    [38, 68, 12, 3],
    [72, 30, 10, 2],
  ];
  for (const [dx, dy, dw, dh] of debris) {
    p(c1, dx, dy + 1, '#241307', dw, dh);
    p(c1, dx, dy, '#6e4722', dw, dh - 1);
    p(c1, dx + 2, dy, '#8c5d30', dw - 4, 1);
    p(c1, dx + 4, dy - 2, '#5c3a1a', 2, 4);
  }

  // Wild green weeds & overgrown scrub tufts
  const weeds = [
    [12, 30], [28, 22], [46, 24], [72, 12], [88, 34],
    [22, 50], [48, 48], [64, 56], [84, 50],
    [34, 72], [68, 72], [12, 74],
  ];
  for (const [wx, wy] of weeds) {
    p(c1, wx - 1, wy + 5, '#140b04', 10, 2);
    p(c1, wx, wy + 1, '#1e4218', 8, 5);
    p(c1, wx - 2, wy + 2, '#2d5a27', 12, 3);
    p(c1, wx + 1, wy - 2, '#498c3f', 6, 6);
    p(c1, wx + 2, wy - 3, '#65a856', 3, 3);
    p(c1, wx - 1, wy, '#589452', 2, 2);
  }

  // --- PLOT 2 (Top-Right): Freshly tilled, dark, clean soil scattered with fertilizer & seed holes ---
  const { canvas: plot2, ctx: c2 } = createCanvas(W, H);
  drawSquarePlotFrame(c2, true);

  // Scattered granular fertilizer specks (white/cream lime & pale mineral granules) and neat dark seed holes
  const rowYs = [9, 24, 39, 54, 69];
  rowYs.forEach((ry, rIdx) => {
    for (let hx = 14; hx <= 92; hx += 16) {
      // Dark dibbled seed hole along the tilled row
      p(c2, hx - 1, ry + 3, '#3b210f', 5, 4);
      p(c2, hx, ry + 4, '#080301', 3, 3);
      // Golden watermelon seeds already planted in the left/upper holes
      if (rIdx < 2 || (rIdx === 2 && hx <= 62)) {
        p(c2, hx + 1, ry + 5, '#e6be68', 1, 1);
      }
    }
  });

  // Scattered fertilizer granules across the clean dark tilled beds
  for (let i = 0; i < 52; i++) {
    const fx = 9 + ((i * 19 + 7) % (W - 20));
    const fy = 8 + ((i * 13 + 5) % (H - 18));
    const color = i % 3 === 0 ? '#e8e2d0' : i % 3 === 1 ? '#ffd54f' : '#80deea';
    p(c2, fx, fy, color, 2, 1);
  }

  // --- PLOT 3 (Bottom-Left): Sprawling healthy green watermelon vine with bright yellow flowers & small light-green unripe melons ---
  const { canvas: plot3, ctx: c3 } = createCanvas(W, H);
  drawSquarePlotFrame(c3, true);

  // Sprawling green primary & secondary watermelon vines covering the plot
  for (const vy of [15, 32, 49, 68]) {
    p(c3, 8, vy + 2, '#100803', W - 18, 2);
    p(c3, 8, vy, '#234f1b', W - 18, 3);
    p(c3, 10, vy, '#428236', W - 22, 2);
    p(c3, 12, vy, '#5ca34e', W - 26, 1);
  }
  // Vertical branching vine runners connecting the rows
  for (const vx of [22, 48, 72, 90]) {
    p(c3, vx + 2, 12, '#100803', 2, H - 24);
    p(c3, vx, 12, '#2b5e22', 3, H - 24);
    p(c3, vx + 1, 14, '#48873c', 1, H - 28);
  }

  // Lush green cucurbit leaves across the vine network
  const p3Leaves: Array<[number, number, 'small' | 'large']> = [
    [10, 8, 'large'], [32, 10, 'small'], [54, 8, 'large'], [80, 10, 'large'],
    [14, 26, 'small'], [38, 24, 'large'], [62, 26, 'small'], [86, 25, 'large'],
    [10, 42, 'large'], [30, 44, 'small'], [54, 42, 'large'], [78, 44, 'small'],
    [16, 60, 'large'], [42, 62, 'large'], [66, 60, 'small'], [84, 62, 'large'],
  ];
  for (const [lx, ly, sz] of p3Leaves) {
    drawTexturedLeaf(c3, lx, ly, sz);
  }

  // Small, light-green unripe melons growing along the vines
  const unripeMelons = [
    [24, 14], [70, 14],
    [26, 31], [52, 30], [78, 31],
    [40, 48], [68, 48],
    [30, 66], [58, 66], [80, 67],
  ];
  for (const [mx, my] of unripeMelons) {
    drawUnripeLightGreenMelon(c3, mx, my);
  }

  // Bright yellow 5-petal monoecious flowers blooming across the vine
  const p3Flowers = [
    [20, 10], [46, 12], [64, 11], [92, 14],
    [14, 34], [36, 33], [60, 34], [88, 35],
    [22, 50], [50, 51], [76, 49], [94, 52],
    [14, 70], [40, 71], [72, 70],
  ];
  for (const [fx, fy] of p3Flowers) {
    drawMonoeciousFlower(c3, fx, fy);
  }

  // --- PLOT 4 (Bottom-Right): Harvest state with massive, fully mature dark-green striped watermelons ---
  const { canvas: plot4, ctx: c4 } = createCanvas(W, H);
  drawSquarePlotFrame(c4, true);

  // Heavy mature green vines supporting the harvest crop
  for (const vy of [18, 44, 70]) {
    p(c4, 8, vy + 2, '#100803', W - 18, 3);
    p(c4, 8, vy, '#1b3d15', W - 18, 3);
    p(c4, 10, vy, '#2f5e27', W - 22, 2);
  }
  p(c4, 30, 12, '#234a1c', 3, H - 24);
  p(c4, 76, 12, '#234a1c', 3, H - 24);

  // Basal canopy leaves framing the mature melons
  drawTexturedLeaf(c4, 10, 10, 'large');
  drawTexturedLeaf(c4, 48, 9, 'large');
  drawTexturedLeaf(c4, 84, 10, 'large');
  drawTexturedLeaf(c4, 10, 38, 'large');
  drawTexturedLeaf(c4, 84, 38, 'large');
  drawTexturedLeaf(c4, 12, 64, 'large');
  drawTexturedLeaf(c4, 50, 64, 'small');
  drawTexturedLeaf(c4, 82, 64, 'large');

  // Companion mature striped melons + Massive centerpiece fully mature dark-green striped watermelon
  drawMassiveMatureMelon(c4, 18, 12, false);
  drawMassiveMatureMelon(c4, 68, 12, false);
  drawMassiveMatureMelon(c4, 42, 34, true); // Massive central mature striped watermelon
  drawMassiveMatureMelon(c4, 18, 58, false);
  drawMassiveMatureMelon(c4, 70, 58, false);

  return {
    1: plot1,
    2: plot2,
    3: plot3,
    4: plot4,
  };
}

function createBiologicalStages(): Record<1 | 2 | 3 | 4, HTMLCanvasElement[]> {
  const stage1: HTMLCanvasElement[] = [];
  const stage2: HTMLCanvasElement[] = [];
  const stage3: HTMLCanvasElement[] = [];
  const stage4: HTMLCanvasElement[] = [];

  for (let v = 0; v < 4; v++) {
    const { canvas: c1, ctx: x1 } = createCanvas(32, 32);
    drawTexturedLeaf(x1, 10, 12, 'small');
    stage1.push(c1);

    const { canvas: c2, ctx: x2 } = createCanvas(32, 32);
    drawMonoeciousFlower(x2, 12, 12);
    stage2.push(c2);

    const { canvas: c3, ctx: x3 } = createCanvas(32, 32);
    drawUnripeLightGreenMelon(x3, 10, 12);
    stage3.push(c3);

    const { canvas: c4, ctx: x4 } = createCanvas(32, 32);
    drawMassiveMatureMelon(x4, 6, 9, false);
    stage4.push(c4);
  }

  return { 1: stage1, 2: stage2, 3: stage3, 4: stage4 };
}

function createCropStages(bio: Record<1 | 2 | 3 | 4, HTMLCanvasElement[]>): HTMLCanvasElement[] {
  return [bio[1][0], bio[1][1], bio[2][0], bio[2][1], bio[3][0], bio[4][0], bio[4][0]];
}

function createInteractPrompt(): HTMLCanvasElement {
  const { canvas, ctx } = createCanvas(28, 18);
  ctx.fillStyle = '#080f08';
  ctx.fillRect(0, 0, 28, 18);
  ctx.fillStyle = '#f0c54d';
  ctx.fillRect(2, 2, 24, 14);
  return canvas;
}

let cachedAtlas: SpriteAtlas | null = null;

export function getSpriteAtlas(customState?: PlayerCustomizationState): SpriteAtlas {
  if (cachedAtlas && !customState) return cachedAtlas;

  const biologicalStages = createBiologicalStages();

  const atlas: SpriteAtlas = {
    player: {
      down: createPlayerDirectionFrames('down', customState),
      up: createPlayerDirectionFrames('up', customState),
      left: createPlayerDirectionFrames('left', customState),
      right: createPlayerDirectionFrames('right', customState),
    },
    playerJump: {
      down: createPlayerJumpFrames('down', customState),
      up: createPlayerJumpFrames('up', customState),
      left: createPlayerJumpFrames('left', customState),
      right: createPlayerJumpFrames('right', customState),
    },
    playerPlanting: createPlayerPlantingSprite(customState),
    playerChopping: createPlayerChoppingFrames(customState),
    playerClearing: createPlayerClearingFrames(customState),
    playerSowing: createPlayerSowingFrames(customState),
    playerHarvesting: createPlayerHarvestingFrames(customState),
    playerSleeping: createPlayerSleepingFrames(customState),
    npcs: {
      professor: createNpcSprite('professor'),
      rosa: createNpcSprite('rosa'),
      maya: createNpcSprite('maya'),
      merchant: createNpcSprite('merchant'),
    },
    tiles: createEnvironmentTiles(),
    gardenPlots: createFourSquareGardenPlots(),
    cropStages: createCropStages(biologicalStages),
    biologicalStages,
    interactPrompt: createInteractPrompt(),
  };

  cachedAtlas = atlas;
  return atlas;
}

export function refreshPlayerSprites(atlas: SpriteAtlas, customState: PlayerCustomizationState) {
  atlas.player = {
    down: createPlayerDirectionFrames('down', customState),
    up: createPlayerDirectionFrames('up', customState),
    left: createPlayerDirectionFrames('left', customState),
    right: createPlayerDirectionFrames('right', customState),
  };
  atlas.playerJump = {
    down: createPlayerJumpFrames('down', customState),
    up: createPlayerJumpFrames('up', customState),
    left: createPlayerJumpFrames('left', customState),
    right: createPlayerJumpFrames('right', customState),
  };
  atlas.playerPlanting = createPlayerPlantingSprite(customState);
  atlas.playerChopping = createPlayerChoppingFrames(customState);
  atlas.playerClearing = createPlayerClearingFrames(customState);
  atlas.playerSowing = createPlayerSowingFrames(customState);
  atlas.playerHarvesting = createPlayerHarvestingFrames(customState);
  atlas.playerSleeping = createPlayerSleepingFrames(customState);
}
