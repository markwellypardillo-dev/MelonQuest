/**
 * Character Customization System for MelonQuest.
 * Configures base archetypes, hair styles, facial hair, clothing, hats,
 * and coin monetization unlocks for custom sprite rendering.
 * Strict zero-emoji policy applied.
 */

export type CharacterBaseId = 'agronomist' | 'cultivator' | 'soil_specialist' | 'field_ranger';
export type HairStyle = 'none' | 'short_crop' | 'tousled_bangs' | 'hair_bun' | 'long_locks';
export type HairColor = 'chestnut' | 'blonde' | 'black' | 'auburn' | 'silver';
export type FacialHair = 'none' | 'full_beard' | 'researcher_mustache' | 'goatee';
export type ClothingOutfit = 'default_jacket' | 'master_agronomist' | 'royal_denim' | 'gold_leaf_suit';
export type HeadwearHat = 'research_cap' | 'straw_sunhat' | 'golden_crown' | 'none';

export interface CosmeticOption {
  id: string;
  name: string;
  price: number;
  unlocked: boolean;
  colorHex?: string;
}

export interface CharacterAppearance {
  baseId: CharacterBaseId;
  hairStyle: HairStyle;
  hairColor: HairColor;
  facialHair: FacialHair;
  outfit: ClothingOutfit;
  headwear: HeadwearHat;
  unlockedCosmetics: string[]; // List of unlocked item IDs
}

export const BASE_ARCHETYPES: Record<CharacterBaseId, { name: string; description: string; skinColor: string }> = {
  agronomist: {
    name: 'Lead Agronomist',
    description: 'Specializes in crop yield optimization and field research.',
    skinColor: '#f0c29b',
  },
  cultivator: {
    name: 'Senior Cultivator',
    description: 'Expert in raised bed tilling and organic soil amendment.',
    skinColor: '#d49b78',
  },
  soil_specialist: {
    name: 'Soil Specialist',
    description: 'Focuses on electrochemical pH balance and N-P-K titration.',
    skinColor: '#e5b894',
  },
  field_ranger: {
    name: 'Field Ranger',
    description: 'Skilled in pest vector scouting and natural bio-sprays.',
    skinColor: '#c88e68',
  },
};

export const HAIR_COLORS: Record<HairColor, string> = {
  chestnut: '#5c3821',
  blonde: '#f1c40f',
  black: '#1f1f1f',
  auburn: '#a04000',
  silver: '#bdc3c7',
};

export const OUTFIT_CATALOG: CosmeticOption[] = [
  { id: 'default_jacket', name: 'Standard Field Lab Coat', price: 0, unlocked: true, colorHex: '#e8efe6' },
  { id: 'master_agronomist', name: 'Master Agronomist Overalls', price: 60, unlocked: false, colorHex: '#2980b9' },
  { id: 'royal_denim', name: 'Royal Watermelon Denim', price: 120, unlocked: false, colorHex: '#1f618d' },
  { id: 'gold_leaf_suit', name: 'Gold Leaf Research Tuxedo', price: 250, unlocked: false, colorHex: '#f39c12' },
];

export const HAT_CATALOG: CosmeticOption[] = [
  { id: 'research_cap', name: 'Agronomist Field Cap', price: 0, unlocked: true, colorHex: '#3a6639' },
  { id: 'straw_sunhat', name: 'Woven Straw Sunhat', price: 40, unlocked: false, colorHex: '#d8aa4d' },
  { id: 'golden_crown', name: 'Golden Melon Crown', price: 180, unlocked: false, colorHex: '#f1c40f' },
  { id: 'none', name: 'No Headwear', price: 0, unlocked: true },
];

export class CustomizationSystem {
  public appearance: CharacterAppearance;

  constructor() {
    this.appearance = {
      baseId: 'agronomist',
      hairStyle: 'tousled_bangs',
      hairColor: 'chestnut',
      facialHair: 'none',
      outfit: 'default_jacket',
      headwear: 'research_cap',
      unlockedCosmetics: ['default_jacket', 'research_cap', 'none'],
    };
  }

  /**
   * Purchases a cosmetic item if player has unlocked it or enough coins.
   */
  public purchaseCosmetic(itemId: string, price: number, playerCoins: number): { success: boolean; newCoins: number } {
    if (this.appearance.unlockedCosmetics.includes(itemId)) {
      return { success: true, newCoins: playerCoins };
    }

    if (playerCoins >= price) {
      this.appearance.unlockedCosmetics.push(itemId);
      return { success: true, newCoins: playerCoins - price };
    }

    return { success: false, newCoins: playerCoins };
  }
}
