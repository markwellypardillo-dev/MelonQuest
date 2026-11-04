/**
 * In-Game Economy & Marketplace System for MelonQuest.
 * Handles coin balance persistence, inventory items, quality-based melon sales,
 * fish & pest bounties, and merchant store purchases.
 * Strict zero-emoji policy applied.
 */

export interface InventoryItem {
  id: string;
  name: string;
  category: 'crop' | 'fish' | 'pest' | 'supply' | 'bait';
  quality?: 'usda_no_1' | 'choice' | 'commercial' | 'spoiled';
  brix?: number;
  value: number; // Base selling price in coins
  quantity: number;
  description: string;
}

export interface PierBucketFish {
  uid: string;
  id: string;
  name: string;
  weightLb: number;
  lengthIn: number;
  value: number;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Prize';
  caughtWithBait: string;
  caughtAt: string;
  description: string;
}

export interface StoreListing {
  id: string;
  name: string;
  category: 'supply' | 'bait' | 'cosmetic' | 'deed';
  price: number;
  description: string;
  stock?: number;
  quantityPerPurchase?: number;
  plotId?: 2 | 3 | 4;
}

export const LAND_DEED_CATALOG: StoreListing[] = [
  {
    id: 'deed_plot_2',
    name: 'Plot #2 Deed: East Timberland',
    category: 'deed',
    plotId: 2,
    price: 120,
    quantityPerPurchase: 1,
    description:
      'Official land deed for Plot #2 (East Timberland). Chop the pine & oak trees (+15G timber bonus) and pull stumps to cultivate a 2nd watermelon bed.',
  },
  {
    id: 'deed_plot_3',
    name: 'Plot #3 Deed: South Grove',
    category: 'deed',
    plotId: 3,
    price: 220,
    quantityPerPurchase: 1,
    description:
      'Official land deed for Plot #3 (South Grove). Fell the dense woodland grove (+15G timber bonus) and clear stumps to unlock a 3rd watermelon bed.',
  },
  {
    id: 'deed_plot_4',
    name: 'Plot #4 Deed: Southeast Woodland',
    category: 'deed',
    plotId: 4,
    price: 350,
    quantityPerPurchase: 1,
    description:
      'Official land deed for Plot #4 (Southeast Woodland). Clear the ancient timber (+15G timber bonus) and roots to complete your 4-plot commercial farm.',
  },
];

export const BAIT_CATALOG: StoreListing[] = [
  {
    id: 'earthworm_bait',
    name: 'Red Earthworm Bait (x3)',
    category: 'bait',
    price: 10,
    quantityPerPurchase: 3,
    description: 'Live garden nightcrawlers. Reliable all-around bait for perch and catfish.',
  },
  {
    id: 'cricket_bait',
    name: 'River Cricket Bait (x3)',
    category: 'bait',
    price: 18,
    quantityPerPurchase: 3,
    description: 'Lively field crickets. Attracts aggressive largemouth bass and trout.',
  },
  {
    id: 'melon_rind_bait',
    name: 'Sweet Melon-Rind Bait (x3)',
    category: 'bait',
    price: 25,
    quantityPerPurchase: 3,
    description: 'Aromatic fermented watermelon rind cubes. Prized by trophy golden trout & carp.',
  },
];

const STORAGE_COINS_KEY = 'melonquest_player_coins';
const STORAGE_INVENTORY_KEY = 'melonquest_player_inventory';
const STORAGE_BUCKET_KEY = 'melonquest_pier_fish_bucket';
const STORAGE_EQUIPPED_BAIT_KEY = 'melonquest_equipped_bait';
const STORAGE_UNLOCKED_PLOTS_KEY = 'melonquest_unlocked_plots';

export class EconomySystem {
  private coins = 150; // Starting capital
  private equippedBaitId = 'earthworm_bait';
  private unlockedPlots: number[] = [1]; // Plot #1 unlocked by default
  private inventory: InventoryItem[] = [
    {
      id: 'melon_crimson_sweet',
      name: 'Crimson Sweet Watermelon',
      category: 'crop',
      quality: 'usda_no_1',
      brix: 12.2,
      value: 80,
      quantity: 1,
      description: 'Harvested Citrullus lanatus specimen (12.2 Brix, USDA No. 1 grade).',
    },
    {
      id: 'earthworm_bait',
      name: 'Red Earthworm Bait',
      category: 'bait',
      value: 4,
      quantity: 4,
      description: 'Live garden nightcrawlers for freshwater pier angling.',
    },
    {
      id: 'seed_sugar_baby',
      name: 'Sugar Baby Seeds',
      category: 'supply',
      value: 15,
      quantity: 4,
      description: 'Heirloom Citrullus lanatus seeds with 75-day maturity window.',
    },
    {
      id: 'lime_bag',
      name: 'Calcitic Limestone Bag',
      category: 'supply',
      value: 12,
      quantity: 2,
      description: 'Neutralizes acidic soil and releases bound phosphates.',
    },
  ];

  private pierBucket: PierBucketFish[] = [
    {
      uid: 'starter_perch_1',
      id: 'fish_silver_river_perch',
      name: 'Silver River Perch',
      weightLb: 1.4,
      lengthIn: 11.2,
      value: 16,
      rarity: 'Common',
      caughtWithBait: 'Red Earthworm Bait',
      caughtAt: 'Day 1',
      description: 'Freshwater schooling perch kept alive in the lakeside pier bucket.',
    },
  ];

  public onCoinsChange?: (newBalance: number) => void;
  public onInventoryChange?: (items: InventoryItem[]) => void;
  public onBucketChange?: (bucketFish: PierBucketFish[]) => void;
  public onPlotUnlock?: (plotId: number, unlockedPlots: number[]) => void;

  constructor() {
    this.loadPersistedState();
  }

  private loadPersistedState() {
    try {
      const savedCoins = localStorage.getItem(STORAGE_COINS_KEY);
      if (savedCoins !== null) {
        this.coins = Math.max(0, parseInt(savedCoins, 10) || 150);
      }
      const savedInv = localStorage.getItem(STORAGE_INVENTORY_KEY);
      if (savedInv) {
        const parsed = JSON.parse(savedInv) as InventoryItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.inventory = parsed.map(item =>
            item.id.includes('bait') ? { ...item, category: 'bait' } : item
          );
        }
      }
      const savedBucket = localStorage.getItem(STORAGE_BUCKET_KEY);
      if (savedBucket) {
        const parsedBucket = JSON.parse(savedBucket);
        if (Array.isArray(parsedBucket)) {
          this.pierBucket = parsedBucket;
        }
      }
      const savedBait = localStorage.getItem(STORAGE_EQUIPPED_BAIT_KEY);
      if (savedBait) {
        this.equippedBaitId = savedBait;
      }
      const savedPlots = localStorage.getItem(STORAGE_UNLOCKED_PLOTS_KEY);
      if (savedPlots) {
        const parsedPlots = JSON.parse(savedPlots);
        if (Array.isArray(parsedPlots) && parsedPlots.length > 0) {
          const valid = Array.from(new Set([1, ...parsedPlots.filter(n => typeof n === 'number' && n >= 1 && n <= 4)]));
          this.unlockedPlots = valid.sort((a, b) => a - b);
        }
      }
    } catch {
      // Use defaults if storage unavailable
    }
  }

  private persistState() {
    try {
      localStorage.setItem(STORAGE_COINS_KEY, String(this.coins));
      localStorage.setItem(STORAGE_INVENTORY_KEY, JSON.stringify(this.inventory));
      localStorage.setItem(STORAGE_BUCKET_KEY, JSON.stringify(this.pierBucket));
      localStorage.setItem(STORAGE_EQUIPPED_BAIT_KEY, this.equippedBaitId);
      localStorage.setItem(STORAGE_UNLOCKED_PLOTS_KEY, JSON.stringify(this.unlockedPlots));
    } catch {
      // Storage unavailable
    }
  }

  public getUnlockedPlots(): number[] {
    return [...this.unlockedPlots];
  }

  public isPlotUnlocked(plotId: number): boolean {
    return this.unlockedPlots.includes(plotId);
  }

  public unlockPlot(plotId: number, price: number): { success: boolean; message: string } {
    if (this.isPlotUnlocked(plotId)) {
      return {
        success: false,
        message: `Plot #${plotId} land deed is already owned and unlocked.`,
      };
    }
    if (!this.deductCoins(price)) {
      return {
        success: false,
        message: `Insufficient coins! Need ${price}G to purchase Plot #${plotId} land deed (Balance: ${this.coins}G).`,
      };
    }
    this.unlockedPlots = Array.from(new Set([...this.unlockedPlots, plotId])).sort((a, b) => a - b);
    this.persistState();
    this.onPlotUnlock?.(plotId, this.getUnlockedPlots());
    return {
      success: true,
      message: `Purchased Plot #${plotId} Land Deed for ${price}G! Walk to Plot #${plotId} and press [E] to chop down the forest trees.`,
    };
  }

  public resetUnlockedPlots() {
    this.unlockedPlots = [1];
    this.persistState();
    this.onPlotUnlock?.(1, this.getUnlockedPlots());
  }

  public getCoins(): number {
    return this.coins;
  }

  public addCoins(amount: number): number {
    this.coins += Math.max(0, amount);
    this.persistState();
    this.onCoinsChange?.(this.coins);
    return this.coins;
  }

  public deductCoins(amount: number): boolean {
    if (this.coins >= amount) {
      this.coins -= amount;
      this.persistState();
      this.onCoinsChange?.(this.coins);
      return true;
    }
    return false;
  }

  public getInventory(): InventoryItem[] {
    return [...this.inventory];
  }

  public getBaitItems(): InventoryItem[] {
    return this.inventory.filter(
      i => (i.category === 'bait' || i.id.includes('bait')) && i.quantity > 0
    );
  }

  public getTotalBaitCount(): number {
    return this.getBaitItems().reduce((sum, i) => sum + i.quantity, 0);
  }

  public getHarvestedMelonCount(): number {
    return this.inventory
      .filter(i => i.category === 'crop')
      .reduce((sum, i) => sum + i.quantity, 0);
  }

  public getEquippedBaitId(): string {
    const available = this.getBaitItems();
    if (available.some(b => b.id === this.equippedBaitId)) {
      return this.equippedBaitId;
    }
    if (available.length > 0) {
      this.equippedBaitId = available[0].id;
      return this.equippedBaitId;
    }
    return this.equippedBaitId;
  }

  public setEquippedBaitId(baitId: string) {
    this.equippedBaitId = baitId;
    this.persistState();
  }

  public consumeBait(baitId?: string): { success: boolean; baitUsed?: InventoryItem; message: string } {
    const targetId = baitId || this.getEquippedBaitId();
    const baitItem = this.inventory.find(
      i => i.id === targetId && (i.category === 'bait' || i.id.includes('bait')) && i.quantity > 0
    );
    if (!baitItem) {
      return {
        success: false,
        message: 'No fishing bait left on hook! Buy bait at the Marketplace first.',
      };
    }
    const snapshot = { ...baitItem };
    this.removeItem(baitItem.id, 1, baitItem.quality);
    return {
      success: true,
      baitUsed: snapshot,
      message: `Hooked 1x ${snapshot.name} onto the line.`,
    };
  }

  // --- Pier Fish Bucket (Lakeside Livewell Storage) ---
  public getPierBucketFish(): PierBucketFish[] {
    return [...this.pierBucket];
  }

  public getPierBucketCount(): number {
    return this.pierBucket.length;
  }

  private notifyBucketChange() {
    queueMicrotask(() => {
      this.onBucketChange?.(this.getPierBucketFish());
    });
  }

  public addFishToBucket(fish: Omit<PierBucketFish, 'uid'>): PierBucketFish {
    const entry: PierBucketFish = {
      ...fish,
      uid: `bucket_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    this.pierBucket.unshift(entry);
    this.persistState();
    this.notifyBucketChange();
    return entry;
  }

  public transferBucketFishToInventory(uid: string): boolean {
    const idx = this.pierBucket.findIndex(f => f.uid === uid);
    if (idx < 0) return false;
    const [fish] = this.pierBucket.splice(idx, 1);
    this.addItem(
      {
        id: fish.id,
        name: fish.name,
        category: 'fish',
        value: fish.value,
        description: `${fish.description} (${fish.weightLb} lbs · ${fish.rarity})`,
      },
      1
    );
    this.persistState();
    this.notifyBucketChange();
    return true;
  }

  public transferAllBucketToInventory(): number {
    const count = this.pierBucket.length;
    if (count === 0) return 0;
    const all = [...this.pierBucket];
    this.pierBucket = [];
    for (const fish of all) {
      this.addItem(
        {
          id: fish.id,
          name: fish.name,
          category: 'fish',
          value: fish.value,
          description: `${fish.description} (${fish.weightLb} lbs · ${fish.rarity})`,
        },
        1
      );
    }
    this.persistState();
    this.notifyBucketChange();
    return count;
  }

  public sellAllBucketFish(): { count: number; earned: number } {
    const count = this.pierBucket.length;
    if (count === 0) return { count: 0, earned: 0 };
    const earned = this.pierBucket.reduce((sum, f) => sum + f.value, 0);
    this.pierBucket = [];
    this.addCoins(earned);
    this.persistState();
    this.notifyBucketChange();
    return { count, earned };
  }

  public addItem(item: Omit<InventoryItem, 'quantity'>, quantity = 1) {
    const normalizedCategory = item.id.includes('bait') ? 'bait' : item.category;
    const existing = this.inventory.find(i => i.id === item.id && i.quality === item.quality);
    if (existing) {
      existing.quantity += quantity;
      existing.category = normalizedCategory;
      existing.value = item.value;
    } else {
      this.inventory.push({ ...item, category: normalizedCategory, quantity });
    }
    this.persistState();
    this.onInventoryChange?.(this.getInventory());
  }

  public removeItem(itemId: string, quantity = 1, quality?: string): boolean {
    const index = this.inventory.findIndex(i => i.id === itemId && (quality === undefined || i.quality === quality));
    if (index >= 0) {
      const item = this.inventory[index];
      if (item.quantity > quantity) {
        item.quantity -= quantity;
      } else {
        this.inventory.splice(index, 1);
      }
      this.persistState();
      this.onInventoryChange?.(this.getInventory());
      return true;
    }
    return false;
  }

  /**
   * Sell item to Market Broker.
   * Spoiled items return 0 coins and trigger an agricultural waste warning.
   */
  public sellItem(itemId: string, quantity = 1, quality?: string): { success: boolean; earned: number; message: string } {
    const item = this.inventory.find(i => i.id === itemId && (quality === undefined || i.quality === quality));
    if (!item || item.quantity < quantity) {
      return { success: false, earned: 0, message: 'Item not in inventory.' };
    }

    if (item.quality === 'spoiled') {
      this.removeItem(itemId, quantity, quality);
      return {
        success: true,
        earned: 0,
        message: 'Spoiled produce cannot be sold for market value. Disposed into compost.',
      };
    }

    let unitPrice = item.value;
    if (item.quality === 'usda_no_1') unitPrice = Math.floor(item.value * 1.5);
    else if (item.quality === 'choice') unitPrice = Math.floor(item.value * 1.15);
    else if (item.quality === 'commercial') unitPrice = item.value;

    const totalEarned = unitPrice * quantity;
    this.removeItem(itemId, quantity, quality);
    this.addCoins(totalEarned);

    return {
      success: true,
      earned: totalEarned,
      message: `Sold ${quantity}x ${item.name} for ${totalEarned} coins.`,
    };
  }

  /**
   * Buy supplies, seeds, fishing bait, or farm expansion land deeds from marketplace.
   */
  public buyItem(listing: StoreListing): { success: boolean; message: string } {
    if (listing.category === 'deed') {
      const plotId = listing.plotId || parseInt(listing.id.replace(/\D+/g, ''), 10);
      if (plotId >= 2 && plotId <= 4) {
        return this.unlockPlot(plotId, listing.price);
      }
    }

    if (this.deductCoins(listing.price)) {
      const qty = listing.quantityPerPurchase || 1;
      const cleanName = listing.name.replace(/\s*\(x\d+\)$/i, '');
      const isBait = listing.category === 'bait' || listing.id.includes('bait');
      this.addItem(
        {
          id: listing.id,
          name: cleanName,
          category: isBait ? 'bait' : (listing.category as any),
          value: Math.max(2, Math.floor((listing.price / qty) * 0.6)),
          description: listing.description,
        },
        qty
      );
      if (isBait) {
        this.equippedBaitId = listing.id;
        this.persistState();
      }
      return {
        success: true,
        message: `Purchased ${qty}x ${cleanName} for ${listing.price} coins.`,
      };
    }
    return { success: false, message: 'Insufficient coins in treasury.' };
  }
}
