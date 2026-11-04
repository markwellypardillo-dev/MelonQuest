/**
 * Character Customization System for MelonQuest.
 * Manages male & female character gender, 4 starting skin/archetype bases,
 * customizable hair styles, hair colors, headwear, facial hair, and realistic field outfits,
 * tied to the in-game coin economy and dynamic 16-bit canvas sprite generation.
 * Strict zero-emoji policy applied.
 */

export type CharacterGender = 'male' | 'female';

export interface CharacterBase {
  id: string;
  name: string;
  title: string;
  skinColor: string;
  skinShadow: string;
  description: string;
}

export interface HairColorPalette {
  id: string;
  name: string;
  main: string;
  highlight: string;
  shadow: string;
}

export interface CosmeticOption {
  id: string;
  name: string;
  category: 'hair' | 'beard' | 'outfit' | 'hat';
  price: number; // 0 for default unlocked
  description: string;
}

export interface PlayerCustomizationState {
  gender: CharacterGender;
  baseId: string;
  hairId: string;
  hairColorId: string;
  beardId: string;
  outfitId: string;
  hatId: string;
  unlockedIds: string[];
}

export const HAIR_COLOR_PALETTES: HairColorPalette[] = [
  {
    id: 'espresso',
    name: 'Espresso Brown',
    main: '#4a2c11',
    highlight: '#734720',
    shadow: '#2b1808',
  },
  {
    id: 'raven',
    name: 'Raven Black',
    main: '#1f232b',
    highlight: '#3b4252',
    shadow: '#0f1116',
  },
  {
    id: 'auburn',
    name: 'Copper Auburn',
    main: '#8a3619',
    highlight: '#b84d27',
    shadow: '#541e0c',
  },
  {
    id: 'blonde',
    name: 'Harvest Blonde',
    main: '#c99722',
    highlight: '#f2ca52',
    shadow: '#8f6812',
  },
  {
    id: 'silver',
    name: 'Botanist Silver',
    main: '#95a5a6',
    highlight: '#d5dbdb',
    shadow: '#566573',
  },
];

export const CHARACTER_BASES: CharacterBase[] = [
  {
    id: 'base_rookie',
    name: 'Rookie Agronomist',
    title: 'University Extension Intern',
    skinColor: '#f5cba7',
    skinShadow: '#d99b72',
    description: 'Eager researcher with baseline field stamina and academic preparation.',
  },
  {
    id: 'base_veteran',
    name: 'Veteran Specialist',
    title: 'Commercial Crop Consultant',
    skinColor: '#e0a96d',
    skinShadow: '#b87333',
    description: 'Seasoned grower accustomed to long daylight heat and furrow irrigation.',
  },
  {
    id: 'base_biotech',
    name: 'Bio-Technician',
    title: 'Molecular Plant Pathologist',
    skinColor: '#f1c27d',
    skinShadow: '#c68b59',
    description: 'Analytical lab specialist skilled in disease vectors and chemical assays.',
  },
  {
    id: 'base_cultivator',
    name: 'Senior Cultivator',
    title: 'Master Seed Breeder',
    skinColor: '#8d5524',
    skinShadow: '#5c3818',
    description: 'Generational farmer with deep practical knowledge of melon sugar Brix.',
  },
];

export const COSMETIC_CATALOG: CosmeticOption[] = [
  // Hair options
  {
    id: 'hair_cropped',
    name: 'Textured Side-Part',
    category: 'hair',
    price: 0,
    description: 'Neat layered academic side-part with swept forehead bangs.',
  },
  {
    id: 'hair_long_waves',
    name: 'Long Flowing Locks',
    category: 'hair',
    price: 0,
    description: 'Shoulder-length cascading locks with soft parted bangs.',
  },
  {
    id: 'hair_ponytail',
    name: 'High Field Ponytail',
    category: 'hair',
    price: 0,
    description: 'Swept bangs tied back into a bouncy ponytail for active field work.',
  },
  {
    id: 'hair_waves',
    name: 'Tousled Field Waves',
    category: 'hair',
    price: 0,
    description: 'Wind-swept textured wavy locks framing the brow and temples.',
  },
  {
    id: 'hair_twin_braids',
    name: 'Country Twin Braids',
    category: 'hair',
    price: 50,
    description: 'Classic woven farm braids draped over the shoulders with gold ties.',
  },
  {
    id: 'hair_bun',
    name: 'Botanist Top-Bun',
    category: 'hair',
    price: 60,
    description: 'High sculpted researcher bun with face-framing side strands.',
  },
  {
    id: 'hair_bald',
    name: 'Close Crew Cut',
    category: 'hair',
    price: 0,
    description: 'Practical close-cropped athletic fade.',
  },

  // Headwear options
  {
    id: 'hat_none',
    name: 'No Hat (Full Hair)',
    category: 'hat',
    price: 0,
    description: 'Uncovered crown showcasing full layered hairstyle and highlights.',
  },
  {
    id: 'hat_cap',
    name: 'Agronomist Field Cap',
    category: 'hat',
    price: 0,
    description: 'Forest-green peaked cap with brass emblem; leaves bangs and locks visible.',
  },
  {
    id: 'hat_straw',
    name: 'Woven Straw Sunhat',
    category: 'hat',
    price: 45,
    description: 'Wide-brimmed golden straw farmer sunhat with crimson ribbon band.',
  },
  {
    id: 'hat_bandana',
    name: 'Harvest Headband',
    category: 'hat',
    price: 35,
    description: 'Cozy crimson-and-gold cloth headband that accents full hair.',
  },

  // Facial hair options
  {
    id: 'beard_clean',
    name: 'Clean / Smooth',
    category: 'beard',
    price: 0,
    description: 'Smooth and clean facial appearance.',
  },
  {
    id: 'beard_stubble',
    name: 'Field Stubble',
    category: 'beard',
    price: 40,
    description: 'Rough 5-o-clock shadow from early morning harvests.',
  },
  {
    id: 'beard_full',
    name: 'Botanist Beard',
    category: 'beard',
    price: 65,
    description: 'Full sculpted researcher beard with warm shading.',
  },
  {
    id: 'beard_mustache',
    name: 'Agronomy Handlebar',
    category: 'beard',
    price: 80,
    description: 'Dignified 19th-century agricultural handlebar mustache.',
  },

  // Outfit options
  {
    id: 'outfit_lab',
    name: 'Agronomy Lab Coat',
    category: 'outfit',
    price: 0,
    description: 'Tailored white coat over sky-blue collared shirt, tie/brooch & pocket pens.',
  },
  {
    id: 'outfit_overalls',
    name: 'Bib Denim Overalls',
    category: 'outfit',
    price: 0,
    description: 'Indigo denim bib overalls with brass buckles, stitched pocket & rolled cuffs.',
  },
  {
    id: 'outfit_flannel',
    name: 'Tartan Plaid Flannel',
    category: 'outfit',
    price: 90,
    description: 'Collared crimson tartan plaid workshirt with button placket & rolled sleeves.',
  },
  {
    id: 'outfit_apron',
    name: 'Artisan Leather Apron',
    category: 'outfit',
    price: 140,
    description: 'Oiled saddle-leather apron over sage tunic with brass rings & tool pouch.',
  },
  {
    id: 'outfit_tunic',
    name: 'Botanical Field Tunic',
    category: 'outfit',
    price: 110,
    description: 'Emerald field tunic with gold embroidery, satchel strap & khaki breeches.',
  },
];

const STORAGE_CUSTOMIZATION_KEY = 'melonquest_character_customization';

export class CustomizationManager {
  private state: PlayerCustomizationState = {
    gender: 'male',
    baseId: 'base_rookie',
    hairId: 'hair_cropped',
    hairColorId: 'espresso',
    beardId: 'beard_clean',
    outfitId: 'outfit_lab',
    hatId: 'hat_cap',
    unlockedIds: [
      'hair_cropped',
      'hair_long_waves',
      'hair_ponytail',
      'hair_waves',
      'hair_bald',
      'hat_none',
      'hat_cap',
      'beard_clean',
      'outfit_lab',
      'outfit_overalls',
    ],
  };

  public onChange?: (state: PlayerCustomizationState) => void;

  constructor() {
    this.loadPersistedState();
  }

  private loadPersistedState() {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMIZATION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...this.state,
          ...parsed,
          gender: parsed.gender === 'female' ? 'female' : 'male',
          hairColorId: parsed.hairColorId || 'espresso',
          hatId: parsed.hatId || 'hat_cap',
          unlockedIds: Array.from(
            new Set([...this.state.unlockedIds, ...(parsed.unlockedIds || [])])
          ),
        };
      }
    } catch {
      // Use defaults
    }
  }

  public persistState() {
    try {
      localStorage.setItem(STORAGE_CUSTOMIZATION_KEY, JSON.stringify(this.state));
    } catch {
      // Unavailable
    }
  }

  public getState(): PlayerCustomizationState {
    return { ...this.state };
  }

  public getActiveBase(): CharacterBase {
    return CHARACTER_BASES.find(b => b.id === this.state.baseId) || CHARACTER_BASES[0];
  }

  public getActiveHairColor(): HairColorPalette {
    return (
      HAIR_COLOR_PALETTES.find(c => c.id === this.state.hairColorId) || HAIR_COLOR_PALETTES[0]
    );
  }

  public setGender(gender: CharacterGender) {
    if (this.state.gender === gender) return;
    this.state.gender = gender;
    if (gender === 'female') {
      this.state.beardId = 'beard_clean';
      if (this.state.hairId === 'hair_cropped' || this.state.hairId === 'hair_bald') {
        this.state.hairId = 'hair_long_waves';
      }
    } else {
      if (this.state.hairId === 'hair_long_waves') {
        this.state.hairId = 'hair_cropped';
      }
    }
    this.persistState();
    this.onChange?.(this.getState());
  }

  public setHairColor(hairColorId: string) {
    if (HAIR_COLOR_PALETTES.some(c => c.id === hairColorId)) {
      this.state.hairColorId = hairColorId;
      this.persistState();
      this.onChange?.(this.getState());
    }
  }

  public setBase(baseId: string) {
    if (CHARACTER_BASES.some(b => b.id === baseId)) {
      this.state.baseId = baseId;
      this.persistState();
      this.onChange?.(this.getState());
    }
  }

  public isUnlocked(cosmeticId: string): boolean {
    return this.state.unlockedIds.includes(cosmeticId);
  }

  public equip(category: 'hair' | 'beard' | 'outfit' | 'hat', cosmeticId: string): boolean {
    if (!this.isUnlocked(cosmeticId)) return false;
    if (category === 'hair') this.state.hairId = cosmeticId;
    if (category === 'beard') this.state.beardId = cosmeticId;
    if (category === 'outfit') this.state.outfitId = cosmeticId;
    if (category === 'hat') this.state.hatId = cosmeticId;

    this.persistState();
    this.onChange?.(this.getState());
    return true;
  }

  public purchaseUnlock(cosmeticId: string): boolean {
    if (this.isUnlocked(cosmeticId)) return true;
    this.state.unlockedIds.push(cosmeticId);
    this.persistState();
    this.onChange?.(this.getState());
    return true;
  }
}
