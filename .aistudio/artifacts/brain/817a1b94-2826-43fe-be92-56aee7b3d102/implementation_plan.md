# Farm Expansion: Purchasable Forested Land Slots & Multi-Plot Cultivation

Expand the MelonQuest farmstead to a larger-scale agricultural estate featuring **4 total watermelon cultivation plots**—your original starter garden plus **3 purchasable forested expansion plots**—complete with realistic two-stage woodland clearing (axe tree-chopping and stump extraction), dual deed purchasing, and independent crop growth and emergency pest defense per plot.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design choices reflect your confirmed preferences and are ready for your review before any code is modified:

- **Confirmed Decision 1 — 4 Total Land Slots (1 Starter + 3 Purchasable Forested Plots)**: The outdoor map expands horizontally and vertically so the central agricultural field comfortably houses a 2x2 grid of four full-sized watermelon beds (`Plot 1: Starter Field`, `Plot 2: East Timberland`, `Plot 3: South Grove`, `Plot 4: Southeast Woodland`) with wide dirt walkways between them.
- **Confirmed Decision 2 — Realistic Two-Step Forest Clearing (`Chop Trees` -> `Pull Stumps` -> `Clear & Till`)**: Newly purchased expansion slots begin covered in dense 16-bit pine and oak trees. Players perform a realistic multi-swing **Axe Tree-Chopping** animation (with falling timber shakes, woodchip particles, and +15G salvaged timber bonus) followed by a **Stump & Root Extraction** animation before entering the standard `Clear & Till -> Sow -> Grow -> Harvest` cycle.
- **Confirmed Decision 3 — Dual Purchase Pathways (On-Plot `For Sale` Signs + Broker Silas Marketplace)**: Each locked forest plot displays an interactive wooden **`For Sale` Signboard** right on the land (`Buy Land Deed [E]`) AND appears under a dedicated **Land Deeds** section in Broker Silas's Marketplace modal (`Plot 2: 120G`, `Plot 3: 220G`, `Plot 4: 350G`).

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the single-bed farm into an expandable 4-plot agronomy research estate where players reinvest their watermelon and fishing profits into buying forested land, manually clearing timber and stumps with realistic full-body tool animations, and managing up to four simultaneous watermelon crops.
- **Target Audience / Persona**: Players who want deeper progression, meaningful coin sinks for their harvest earnings, and tactile, rewarding 16-bit farm expansion mechanics.
- **Key Value**: Connects the economy, quests, and field work into a cohesive loop—earn gold from graded watermelons and river fish, purchase land deeds, clear the forest by hand, and defend multiple growing plots from emergency insect outbreaks.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Exploring the Expanded Farmstead**:
   - The outdoor world expands from `34x24` tiles to `44x32` tiles (`1408x1024` pixels), creating a spacious fenced agricultural quad with 4 distinct plot beds, surrounding pine/oak woodland borders, the Agronomy Laboratory to the northwest, the Farmer's House to the northeast, the Marketplace Plaza to the east, and the River Pier to the south.
   - Smooth camera tracking follows the player seamlessly across all 4 plots and outer stations.

2. **Purchasing a Forested Land Slot (Two Ways)**:
   - **On-Plot Signboard**: Walk up to any locked forested plot (`Plot 2`, `Plot 3`, or `Plot 4`) to see a cozy 16-bit floating action prompt (`Buy Plot #2 (120G) [E]`). Pressing `[E]` (or clicking the plot) purchases the deed if you have sufficient gold, plays a celebratory fanfare, and transitions the plot from `locked_forest` to `forest_trees`.
   - **Broker Silas Marketplace**: Open the Marketplace (`Market [E]`) and browse the land deed listings alongside farm supplies and bait. Purchasing a deed immediately unlocks that plot on the map.

3. **Realistic Multi-Step Woodland Clearing**:
   - **Stage A — Chopping Standing Timber (`Chop Trees [E]`)**: Standing in front of a newly purchased forested plot and pressing `[E]` triggers a realistic 3-frame **Axe Swinging Animation** (`Wind-up -> Overhead Cleave -> Timber Impact`). Each axe strike plays a crisp wood-chop sound, shakes the tree canopies, scatters cedar woodchips, and fells the standing trees into cut tree stumps while awarding **+15G in salvaged firewood timber**.
   - **Stage B — Pulling Tree Stumps (`Pull Stumps [E]`)**: Pressing `[E]` on the stump-covered plot triggers a heavy physical digging/levering animation with soil clod bursts, extracting the deep roots and transitioning the bed to the standard `Clear Weeds & Rocks [E]` -> `Sow Seeds [E]` -> `Growing` -> `Harvest [E]` lifecycle.

4. **Independent Multi-Plot Care & Emergency Pest Outbreaks**:
   - All unlocked plots grow independently in real game time and advance when sleeping overnight.
   - Emergency insect outbreaks (`Cucumber Beetle Swarm`, `Melon Aphid Outbreak`, `Invasive Weed Incursion`) can target any actively `growing` plot, displaying the emergency banner and allowing you to rush to the affected plot to **`Pick Bugs [E]`** or **`Bio-Spray [F]`**.
   - The top-left Garden Status HUD dynamically displays the status of the plot closest to the farmer (e.g., `PLOT #2 · TIMBERLAND` or `PLOT #1 · SPROUTING 45%`) plus an active plot counter (`PLOTS: 2/4 UNLOCKED`).

### Visual Identity & Theme

- **Aesthetic Direction**: Authentic 16-bit cozy pixel-art RPG matching the existing dark-timber (`#241306`), brass-border (`#f0c54d` / `#e0b034`), and parchment (`#f7eed7`) UI theme.
- **Color Palette & Mood**:
  - Forest Canopies: Layered pine needles (`#1e4d2b`, `#2d6a3e`, `#408a52`) and oak trunks (`#4a2c14`, `#6e4722`).
  - Cut Stumps & Woodchips: Warm heartwood rings (`#d4a359`, `#8a5a2e`) and bark edges (`#3b210f`).
  - Action Prompts & Progress Gauges: Compact 16-bit wood-and-brass floating prompt bubbles with 3D `[E]` / `[F]` keycap badges and segmented overhead progress bars.
- **Typography & Hierarchy**: Crisp `"Press Start 2P"` pixel headers paired with high-contrast tabular numerals for deed prices, plot growth percentages, and timber rewards.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Graduated Land Deed Pricing (`120G`, `220G`, `350G`)**:
  - *Chosen Approach*: Plot #1 is unlocked from the start; Plot #2 costs `120G` (affordable with starting capital + first melon/fish sale); Plot #3 costs `220G`; Plot #4 costs `350G`.
  - *Why*: Creates a natural, rewarding sense of farm progression without grinding, while giving high-Brix watermelon harvests and prize fish a clear economic purpose.
- **Decision 2 — Proximity-Aware Garden HUD & Interaction**:
  - *Chosen Approach*: All plot interactions (`[E]`, `[F]`, canvas clicks) and the Garden HUD card automatically target whichever plot the player is standing closest to, while keeping a summary badge of total owned plots.
  - *Why*: Preserves the clean, uncluttered HUD footprint while scaling smoothly from 1 to 4 plots.
- **Decision 3 — LocalStorage Persistence for Unlocked Plots & Phases**:
  - *Chosen Approach*: Persist each plot's unlock state and lifecycle phase alongside the player's coins and inventory.
  - *Why*: Ensures purchased land deeds and cleared forest plots remain unlocked across sessions.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       MelonQuest Application State                      │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────┐ │
│  │    EconomySystem     │   │     MelonEngine      │   │  Quest / HUD │ │
│  │ - Coin Balance (G)   │◄─►│ - 44x32 Expanded Map │──►│  Overlays    │ │
│  │ - Land Deed Unlocks  │   │ - 4 PlotData Slots   │   │ - Nearest    │ │
│  │ - Timber Salvage +G  │   │ - Axe & Stump Anims  │   │   Plot Status│ │
│  └──────────┬───────────┘   └──────────┬───────────┘   └──────────────┘ │
└─────────────┼──────────────────────────┼────────────────────────────────┘
              │                          │
              ▼                          ▼
┌─────────────────────────┐   ┌───────────────────────────────────────────┐
│   MarketplaceModal UI   │   │      4-Plot Lifecycle State Machine       │
│ - Land Deeds Catalog    │   │  [locked_forest] ──(Buy Deed)──────────┐  │
│ - Farm Supplies & Bait  │   │  ┌─────────────────────────────────────┘  │
│ - Syncs Deed Purchase   │   │  ▼                                        │
│   with Engine Plots     │   │  [forest_trees]  ──(Chop Trees [E])────┐  │
└─────────────────────────┘   │  ┌─────────────────────────────────────┘  │
                              │  ▼                                        │
                              │  [forest_stumps] ──(Pull Stumps [E])───┐  │
                              │  ┌─────────────────────────────────────┘  │
                              │  ▼                                        │
                              │  [clear] -> [sow] -> [growing] -> [harvest]│
                              └───────────────────────────────────────────┘
```

### Data Model & State

- **Expanded `SingleGardenPhase`**:
  - Adds `'locked_forest' | 'forest_trees' | 'forest_stumps'` prior to `'clear' | 'sow' | 'growing' | 'harvest'`.
- **Extended `PlotData` Entity (4 Instances)**:
  - Each of the 4 plots (`id: 1..4`, `plotNumber: 1..4`) stores its own coordinates in the expanded 2x2 central field, `unlockPrice` (`0`, `120`, `220`, `350`), `isUnlocked` boolean, current `phase`, `growthMinutes`, `cropStage`, and `timberCount`.
- **Extended `ActiveGardenAction`**:
  - Supports `targetPlotId: number` and new action types `'chop_trees'` (with custom 3-frame `playerChopping` axe sprite animation and wood-chop audio) and `'clear_stumps'` (levering/digging stump removal animation), in addition to `'clear'`, `'sow'`, and `'harvest'`.
- **Multi-Plot `ActiveEmergency`**:
  - Includes `plotId: number` and `plotTitle: string` so emergency pest swarms spawn directly on the affected growing plot and display which plot needs defense in the Emergency HUD banner.

### Interactive Component & State Mapping

- **On-Plot `For Sale` Sign Interaction (`[E]` or Click)**:
  - Checks `economy.getCoins() >= plot.unlockPrice`. If sufficient, deducts coins via `economy.purchaseLandDeed(plot.plotNumber, plot.unlockPrice)`, transitions `plot.phase` from `'locked_forest'` to `'forest_trees'`, spawns gold/leaf celebration particles, and plays the item obtain fanfare. If insufficient, displays a clear floating feedback prompt and plays the error buzz.
- **Broker Silas Marketplace Deed Purchase**:
  - Renders `Land Deed: Plot #2 (120G)`, `Land Deed: Plot #3 (220G)`, and `Land Deed: Plot #4 (350G)` in `MarketplaceModal`. Clicking **Buy Deed** unlocks the corresponding plot in `EconomySystem` and immediately updates the live `MelonEngine` plot to `'forest_trees'`.
- **Axe Chopping & Stump Pulling Execution**:
  - Interacting with a `'forest_trees'` plot starts `'chop_trees'` (`2600ms`), animating the player swinging a 16-bit lumberjack axe, shaking the plot's trees on each strike, awarding `+15G` salvaged timber, and transitioning the plot to `'forest_stumps'`.
  - Interacting with a `'forest_stumps'` plot starts `'clear_stumps'` (`2300ms`), uprooting the remaining stumps with soil particle bursts and transitioning the plot to `'clear'` (`Clear [E]`), ready for standard tilling, sowing, growing, pest defense, and harvesting.
