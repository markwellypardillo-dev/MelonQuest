/**
 * Educational content, agricultural data, quests, dialogues, and guidebook for MelonQuest.
 * Strict zero-emoji policy applied.
 */

export interface QuestStep {
  id: string;
  description: string;
  isComplete: boolean;
  requiredCount?: number;
  currentCount?: number;
}

export interface Quest {
  id: string;
  title: string;
  phaseNumber: number;
  advisor: string;
  advisorRole: string;
  objective: string;
  learningOutcome: string;
  steps: QuestStep[];
  quizId: string;
  isCompleted: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  questId: string;
  questions: QuizQuestion[];
}

export interface GuidebookChapter {
  id: string;
  title: string;
  category: string;
  summary: string;
  sections: {
    heading: string;
    content: string;
    bulletPoints?: string[];
  }[];
}

export const QUESTS: Quest[] = [
  {
    id: 'quest_1',
    phaseNumber: 1,
    title: 'Phase 1: Garden Clearing & Seeding',
    advisor: 'Professor Citrullus',
    advisorRole: 'Lead Agronomist',
    objective: 'Clear the unkempt central garden bed, sow watermelon seeds into fertilized rows, and monitor early sprouting.',
    learningOutcome: 'Understand seedbed preparation, row tillage, direct seeding depth, and temperature-driven germination.',
    steps: [
      {
        id: 'clear_garden',
        description: 'Clear rocks, woody debris, and weeds from the central garden [Clear E].',
        isComplete: false,
      },
      {
        id: 'sow_seeds',
        description: 'Sow Citrullus lanatus seeds into the 5 tilled, fertilized soil rows [Sow E].',
        isComplete: false,
      },
      {
        id: 'germinate_sprout',
        description: 'Grow crop from Seedling (0-3h) to cotyledon Sprouting (3-8h) using in-game time (1x-6x).',
        isComplete: false,
      },
      {
        id: 'pass_quiz_1',
        description: 'Complete the Phase 1 Agronomy Certification Quiz.',
        isComplete: false,
      },
    ],
    quizId: 'quiz_1',
    isCompleted: false,
  },
  {
    id: 'quest_2',
    phaseNumber: 2,
    title: 'Phase 2: Soil Chemistry & Vining',
    advisor: 'Lab Technician Maya',
    advisorRole: 'Soil Science Specialist',
    objective: 'Balance soil pH and N-P-K nutrients at the Soil Lab while establishing creeping green vines in the central garden.',
    learningOutcome: 'Master watermelon pH tolerance (6.0 - 6.8), calcitic lime titration, and vegetative runner elongation.',
    steps: [
      {
        id: 'report_lab',
        description: 'Enter the Agronomy Laboratory [E] and inspect the Soil Testing Bench with Maya.',
        isComplete: false,
      },
      {
        id: 'calibrate_ph',
        description: 'Complete the Soil Lab titration assay (pH 6.5) and 1-2-2 N-P-K formulation.',
        isComplete: false,
      },
      {
        id: 'observe_vining',
        description: 'Advance in-game time to establish creeping green Vines (8-16h) across the central garden.',
        isComplete: false,
      },
      {
        id: 'pass_quiz_2',
        description: 'Complete the Phase 2 Soil Chemistry Assessment Quiz.',
        isComplete: false,
      },
    ],
    quizId: 'quiz_2',
    isCompleted: false,
  },
  {
    id: 'quest_3',
    phaseNumber: 3,
    title: 'Phase 3: Flowering & Pest Scouting',
    advisor: 'Farmer Rosa',
    advisorRole: 'Senior Field Cultivator',
    objective: 'Protect blooming monoecious yellow flowers from pest vectors and monitor early watermelon fruiting.',
    learningOutcome: 'Identify cucumber beetle vectors, aphids, powdery mildew, and pollinator preservation during flowering.',
    steps: [
      {
        id: 'meet_rosa',
        description: 'Consult Farmer Rosa at the northwest perimeter station.',
        isComplete: false,
      },
      {
        id: 'scout_pests',
        description: 'Diagnose foliage pests and protect beneficial ladybugs in the IPM Field Scout.',
        isComplete: false,
      },
      {
        id: 'observe_fruiting',
        description: 'Grow the central garden through Flowering (16-24h) into Fruiting (24-36h).',
        isComplete: false,
      },
      {
        id: 'pass_quiz_3',
        description: 'Complete the Phase 3 Pest and Disease Diagnostics Quiz.',
        isComplete: false,
      },
    ],
    quizId: 'quiz_3',
    isCompleted: false,
  },
  {
    id: 'quest_4',
    phaseNumber: 4,
    title: 'Phase 4: Maturity & Central Harvest',
    advisor: 'Professor Citrullus',
    advisorRole: 'Lead Agronomist',
    objective: 'Reach 100% watermelon maturity after 36 in-game hours, harvest the central garden, and grade Brix quality.',
    learningOutcome: 'Verify non-climacteric harvest readiness and empirical U.S. No. 1 sugar and rind standards.',
    steps: [
      {
        id: 'reach_maturity',
        description: 'Grow the central garden watermelons to 100% Harvest Maturity (36h in-game time).',
        isComplete: false,
      },
      {
        id: 'harvest_garden',
        description: 'Harvest mature dark-striped watermelons from the central garden [[E] Harvest].',
        isComplete: false,
      },
      {
        id: 'inspect_melons',
        description: 'Perform the 4-point maturity and Brix assay at the Harvest Inspection Bench.',
        isComplete: false,
      },
      {
        id: 'pass_quiz_4',
        description: 'Complete the Capstone Agronomy Examination.',
        isComplete: false,
      },
    ],
    quizId: 'quiz_4',
    isCompleted: false,
  },
];

export const QUIZZES: Record<string, Quiz> = {
  quiz_1: {
    id: 'quiz_1',
    title: 'Phase 1: Land Preparation Examination',
    questId: 'quest_1',
    questions: [
      {
        id: 'q1_1',
        question: 'What is the primary function of raised planting beds in commercial watermelon cultivation?',
        options: [
          'To prevent vines from growing longer than 1 meter',
          'To enhance drainage, prevent waterlogging, and accelerate spring root zone warming',
          'To eliminate the requirement for irrigation completely',
          'To alter the genetic sex expression of female flowers',
        ],
        correctIndex: 1,
        explanation: 'Watermelon root systems are susceptible to Phytophthora root rot and hypoxia in saturated soils. Raised beds of 15 to 25 cm elevate the root zone, promote drainage, and capture solar heat.',
      },
      {
        id: 'q2_1',
        question: 'Why is black polyethylene mulch preferred during early vegetative establishment?',
        options: [
          'It reflects all ultraviolet radiation back into the atmosphere',
          'It replaces soil nitrogen and phosphorus directly',
          'It suppresses weed competition, conserves moisture, and increases soil temperature by 3 to 5 degrees Celsius',
          'It prevents honeybees from landing on the vine runners',
        ],
        correctIndex: 2,
        explanation: 'Black plastic mulch blocks photosynthetic light to germinate weed seeds, reduces surface evaporation by up to 50 percent, and warms early season soil to stimulate root elongation.',
      },
      {
        id: 'q3_1',
        question: 'What is the recommended center-to-center row spacing for standard vining watermelon varieties?',
        options: [
          '0.5 to 0.8 meters (dense planting)',
          '1.8 to 2.4 meters (6 to 8 feet)',
          '5.0 to 6.5 meters (orchard spacing)',
          '0.2 meters (greenhouse hydroponic spacing)',
        ],
        correctIndex: 1,
        explanation: 'Citrullus lanatus produces vigorous indeterminate runners reaching 3 to 4 meters in length. Spacing rows 1.8 to 2.4 meters apart allows adequate vine canopy expansion and equipment access.',
      },
    ],
  },
  quiz_2: {
    id: 'quiz_2',
    title: 'Phase 2: Soil Chemistry and Nutrient Assessment',
    questId: 'quest_2',
    questions: [
      {
        id: 'q2_1',
        question: 'What is the optimal soil pH range for commercial watermelon production?',
        options: [
          'pH 4.5 to 5.2 (strongly acidic)',
          'pH 6.0 to 6.8 (slightly acidic to near neutral)',
          'pH 7.8 to 8.6 (moderately alkaline)',
          'pH 9.0 to 10.0 (strongly alkaline)',
        ],
        correctIndex: 1,
        explanation: 'Watermelons perform best in well-drained sandy loam with a pH of 6.0 to 6.8. At pH below 6.0, aluminum and manganese toxicity occur while phosphorus availability drops sharply.',
      },
      {
        id: 'q2_2',
        question: 'If soil testing yields a pH of 5.3, which amendment must be applied to raise the pH to the optimal range?',
        options: [
          'Elemental sulfur (S)',
          'Agricultural limestone / Calcitic lime (CaCO3)',
          'Aluminum sulfate (Al2(SO4)3)',
          'Ammonium nitrate (NH4NO3)',
        ],
        correctIndex: 1,
        explanation: 'Agricultural limestone (calcium carbonate) neutralizes hydrogen ions and raises soil pH. Elemental sulfur and aluminum sulfate are acidifying agents used to lower pH.',
      },
      {
        id: 'q2_3',
        question: 'Why must nitrogen fertilization be carefully moderated prior to fruit set in watermelons?',
        options: [
          'Excess nitrogen causes immediate leaf drop',
          'Excess nitrogen stimulates vigorous vegetative vine growth at the expense of floral initiation and fruit set',
          'Excess nitrogen turns the melon rind bright orange',
          'Nitrogen completely blocks root uptake of water',
        ],
        correctIndex: 1,
        explanation: 'High pre-flowering nitrogen promotes luxuriant vine elongation (bull vines) and delays the emergence of pistillate (female) flowers, significantly reducing total marketable yield.',
      },
    ],
  },
  quiz_3: {
    id: 'quiz_3',
    title: 'Phase 3: Integrated Pest Management Assessment',
    questId: 'quest_3',
    questions: [
      {
        id: 'q3_1',
        question: 'What is the major commercial danger posed by the striped cucumber beetle (Acalymma vittatum)?',
        options: [
          'It lays eggs inside ripe melon flesh causing fruit decay',
          'It vectors Erwinia tracheiphila, the bacterium responsible for fatal bacterial wilt',
          'It consumes the entire root system within 24 hours',
          'It strips the outer green rind of all carotenoids',
        ],
        correctIndex: 1,
        explanation: 'Adult cucumber beetles harbor Erwinia tracheiphila in their digestive tracts. When feeding on foliage, bacteria enter wounds and colonize xylem vessels, inducing rapid, irreversible wilting and death.',
      },
      {
        id: 'q3_2',
        question: 'Which agronomic rule must be strictly followed when applying any foliar treatment during watermelon flowering?',
        options: [
          'Spray only at midday when sunlight is at peak intensity',
          'Spray in late afternoon or evening after honeybee foraging activity has ceased',
          'Double the chemical application rate on open flowers',
          'Spray high pressure cold water directly into pistillate blossoms',
        ],
        correctIndex: 1,
        explanation: 'Watermelon flowers depend entirely on insect pollinators (primarily honeybees) for fertilization. Spraying insecticides in the late afternoon prevents contact toxicity during peak morning pollination.',
      },
      {
        id: 'q3_3',
        question: 'In Integrated Pest Management (IPM), what is the role of the convergent ladybug beetle (Hippodamia convergens)?',
        options: [
          'A primary defoliator requiring eradication',
          'A beneficial predatory insect that consumes melon aphids and mite eggs',
          'A vector for gummy stem blight fungus',
          'A pest that bores holes into immature melon rinds',
        ],
        correctIndex: 1,
        explanation: 'Ladybug beetles and their larvae are key biological control agents, each capable of consuming 40 to 60 aphids per day. Protecting them preserves ecological balance and reduces reliance on chemical sprays.',
      },
    ],
  },
  quiz_4: {
    id: 'quiz_4',
    title: 'Phase 4: Capstone Harvest Examination',
    questId: 'quest_4',
    questions: [
      {
        id: 'q4_1',
        question: 'Unlike apples or bananas, watermelons are non-climacteric fruits. What does this mean for harvest timing?',
        options: [
          'They continue to produce ethylene and ripen rapidly off the vine after harvest',
          'They do not ripen or increase in sugar content after detachment from the vine, so they must be harvested fully mature',
          'They must be picked green and refrigerated to convert starch to sugar',
          'They lose 50 percent of their weight within two hours of harvest',
        ],
        correctIndex: 1,
        explanation: 'Non-climacteric fruits do not exhibit a post-harvest respiratory burst or ethylene surge. Starches are already exhausted; once harvested, sugar content will not increase. Harvesting premature fruit yields permanently inferior quality.',
      },
      {
        id: 'q4_2',
        question: 'Which combination of non-destructive indicators confirms optimal harvest maturity in watermelon?',
        options: [
          'Green fleshy tendril, pure white ground spot, high-pitch metallic ping',
          'Fully dried and brown tendril, creamy-yellow ground spot, hollow resonant thud, and Brix >= 10.0%',
          'Soft spongy rind, black ground spot, high-pitch ping, and green tendril',
          'Glossy waxy rind, vibrating stem, and pure green underside',
        ],
        correctIndex: 1,
        explanation: 'The desiccated curly tendril adjacent to the fruit stem, conversion of the ground belly spot from white to buttery yellow, a low-pitch hollow acoustic thud (80-140 Hz), and refractometer Brix >= 10.0% confirm prime maturity.',
      },
      {
        id: 'q4_3',
        question: 'What is the minimum soluble solids content (degrees Brix) required for U.S. Fancy or U.S. No. 1 watermelon grade standards?',
        options: [
          '4.0 to 5.0 percent Brix',
          '6.5 to 7.5 percent Brix',
          '10.0 to 11.0 percent Brix or higher',
          '20.0 to 25.0 percent Brix',
        ],
        correctIndex: 2,
        explanation: 'USDA grading standards specify that U.S. Fancy and U.S. No. 1 grade watermelons must possess a soluble solids content of not less than 10.0 percent Brix, with 11.5% or above representing premium sweetness.',
      },
    ],
  },
};

export const GUIDEBOOK_CHAPTERS: GuidebookChapter[] = [
  {
    id: 'ch_botany',
    title: 'Chapter 1: Botany and Morphology',
    category: 'Botanical Sciences',
    summary: 'Taxonomy, plant architecture, floral morphology, and the physiology of pollination in Citrullus lanatus.',
    sections: [
      {
        heading: 'Taxonomic Classification',
        content: 'Watermelon (Citrullus lanatus) belongs to the family Cucurbitaceae, sharing lineage with cantaloupe, cucumber, and squash. Originating in northeastern Africa, it is an annual herbaceous vine characterized by deeply pinnatifid leaves and branched tendrils.',
        bulletPoints: [
          'Family: Cucurbitaceae',
          'Genus: Citrullus',
          'Species: C. lanatus',
          'Growth Habit: Prostrate trailing vine with indeterminate branching',
          'Root Depth: Taproot reaches 1.5 to 2.0 meters, with dense lateral feeding roots in top 30 cm',
        ],
      },
      {
        heading: 'Monoecious Floral Biology',
        content: 'Standard watermelon cultivars are monoecious, producing separate staminate (male) and pistillate (female) flowers on the same individual vine. Staminate flowers appear first at basal nodes, typically outnumbering female flowers by a ratio of 7:1 to 10:1.',
        bulletPoints: [
          'Male (Staminate): Contains pollen-producing anthers on slender filaments.',
          'Female (Pistillate): Distinguished by an inferior miniature swollen ovary beneath petals.',
          'Pollen Characteristics: Heavy, sticky pollen grains that cannot be transported by wind.',
          'Pollination Requirement: Requires 8 to 12 bee visits per female blossom to ensure symmetrical fruit development.',
        ],
      },
      {
        heading: 'Diploid versus Triploid Cultivars',
        content: 'Commercial production utilizes both standard diploid (seeded, 2n=22) and triploid (seedless, 3n=33) cultivars. Triploid seeds are created by crossing tetraploid (4n) females with diploid (2n) males. Because triploid plants produce sterile pollen, 25-33% of field acreage must be interplanted with diploid pollenizer rows.',
      },
    ],
  },
  {
    id: 'ch_soil_chem',
    title: 'Chapter 2: Soil Mechanics and Soil Chemistry',
    category: 'Soil Science',
    summary: 'Texture suitability, pH management, lime and sulfur dynamics, and nutrient uptake curves.',
    sections: [
      {
        heading: 'Soil Physical Properties',
        content: 'Watermelons perform best in deep, well-drained sandy loam or silt loam soils. Poor drainage and compacted heavy clay lead to root suffocation, reduced vine vigor, and high incidence of Phytophthora fruit rot.',
        bulletPoints: [
          'Ideal Soil Texture: Sandy loam with 1.5% to 3.0% organic matter.',
          'Target Bulk Density: Below 1.4 g/cm3 to prevent root impedance.',
          'Drainage Requirement: Rapid percolation; water ponding over 12 hours causes catastrophic root dieback.',
        ],
      },
      {
        heading: 'Target Soil Reaction (pH 6.0 - 6.8)',
        content: 'Watermelon root chemistry is optimized between pH 6.0 and 6.8. In acidic soils (pH < 5.8), available phosphorus binds tightly to aluminum and iron oxides, rendering it insoluble. Aluminum ions also cause root tip stunting. In alkaline soils (pH > 7.5), iron, zinc, and manganese become deficient.',
        bulletPoints: [
          'Acidic Remediation: Calcitic limestone (CaCO3) or dolomitic lime (CaMg(CO3)2) applied 3-6 months pre-planting.',
          'Alkaline Remediation: Elemental sulfur (S) incorporated into soil to generate sulfuric acid via Thiobacillus microbial oxidation.',
        ],
      },
      {
        heading: 'Macronutrient Dynamics (N-P-K)',
        content: 'Total seasonal nutrient demand per hectare typically averages 110-140 kg Nitrogen (N), 60-90 kg Phosphate (P2O5), and 160-220 kg Potassium (K2O). Potassium demand increases dramatically during melon bulking to support carbohydrate translocation and high sugar synthesis.',
      },
    ],
  },
  {
    id: 'ch_cultivation',
    title: 'Chapter 3: Raised Beds, Mulch, and Irrigation',
    category: 'Field Operations',
    summary: 'Bed construction, plasticulture thermal physics, drip line placement, and irrigation scheduling.',
    sections: [
      {
        heading: 'Raised Bed Plasticulture',
        content: 'Modern commercial melon acreage utilizes raised beds (15 to 25 cm height, 75 to 90 cm top width) covered with embossed black or metallized polyethylene film. Raised beds accelerate soil drainage following convective rainstorms and promote uniform root aeration.',
        bulletPoints: [
          'Thermal Advantage: Black mulch absorbs solar radiation, elevating root zone temperatures by 3 to 5 degrees Celsius in early spring.',
          'Weed Suppression: Complete opacity starves weed seedlings of photosynthetically active radiation (PAR).',
          'Erosion Control: Shields precision fertilizer bands from rain leaching.',
        ],
      },
      {
        heading: 'Drip Irrigation Hydraulics',
        content: 'Drip tape (typically 8 to 15 mil thickness with emitters spaced every 20 to 30 cm) is buried 5 to 8 cm deep under the center of the bed before laying plastic film. Applying water and soluble fertilizers directly to the root zone cuts water consumption by 40% compared to overhead pivot guns.',
      },
      {
        heading: 'Irrigation Scheduling Across Growth Stages',
        content: 'Moisture requirements shift across development. Deficits during floral anthesis or early fruit set cause flower abortion and misshapen fruit. Conversely, irrigation must be reduced by 30 to 50 percent during the 10 days preceding harvest to prevent rind splitting and prevent dilution of sugars.',
      },
      {
        heading: 'Meteorological Hazards: Drought and High Humidity',
        content: 'Unmitigated environmental extremes directly disrupt crop growth stages in Citrullus lanatus:',
        bulletPoints: [
          'Drought & Heat Wave: Ambient temperatures above 95°F and soil moisture depletion induce stomatal closure, halt cell expansion, and trigger calcium-deficiency blossom end rot. Countermeasure: Activate Southern Canal Drip Irrigation Valve to maintain 50-65% field moisture capacity.',
          'High Humidity & Rainfall: Relative humidity exceeding 85% with continuous foliar wetting triggers rapid germination of powdery and downy mildew conidia while grounding honeybee pollinators. Countermeasure: Deploy protective potassium bicarbonate bio-barrier spray from the Field Spray Rig.',
        ],
      },
    ],
  },
  {
    id: 'ch_ipm',
    title: 'Chapter 4: Integrated Pest Management (IPM)',
    category: 'Crop Protection',
    summary: 'Pathogen etiology, insect vector monitoring, economic thresholds, and biological stewardship.',
    sections: [
      {
        heading: 'Striped and Spotted Cucumber Beetles',
        content: 'Cucumber beetles (Acalymma vittatum and Diabrotica undecimpunctata) are the most critical early season insect pest. Beyond direct foliage and cotyledon feeding, their primary danger is vectoring Erwinia tracheiphila, the bacterial wilt pathogen.',
        bulletPoints: [
          'Pathogen: Erwinia tracheiphila bacteria survive winter in beetle guts.',
          'Disease Vectoring: Bacteria enter vine tissue through fecal deposition into feeding wounds.',
          'Symptomatology: Leaves wilt during daylight hours, recovering initially at night, before permanent vascular collapse.',
          'IPM Action: Floating row covers until bloom, kaolin clay particle barriers, or selective microbial spinosad baits.',
        ],
      },
      {
        heading: 'Melon Aphid (Aphis gossypii)',
        content: 'Melon aphids colonize the undersides of leaves, piercing phloem vessels with stylets to extract carbohydrates. They cause leaf curling and excrete honeydew that fosters sooty mold. They also transmit non-persistent viruses such as Cucumber Mosaic Virus (CMV) and Watermelon Mosaic Virus (WMV).',
      },
      {
        heading: 'Fungal Pathogens: Powdery Mildew and Anthracnose',
        content: 'Powdery mildew (Podosphaera xanthii) presents as white talcum-powder lesions on leaf surfaces, reducing photosynthetic capacity. Anthracnose (Colletotrichum orbiculare) causes circular sunken lesions on fruit and stems. Prevention relies on resistant cultivars, drip irrigation to avoid wet foliage, and potassium bicarbonate or bio-fungicides.',
      },
    ],
  },
  {
    id: 'ch_harvest',
    title: 'Chapter 5: Maturity Science and Quality Grading',
    category: 'Post-Harvest Agronomy',
    summary: 'Non-climacteric ripening physiology, tendril index, ground spot coloration, acoustic physics, and Brix refractometry.',
    sections: [
      {
        heading: 'Non-Climacteric Physiology',
        content: 'Watermelon fruit does not contain significant starch reserves that can be converted into sugar after detachment. Consequently, there is no post-harvest ripening. Sugar content, aroma volatiles, and crisp cell turgor are fixed at the exact moment of cutting.',
      },
      {
        heading: 'The 4-Point Maturity Protocol',
        content: 'Professional pickers combine four non-destructive field indicators before harvesting any fruit:',
        bulletPoints: [
          '1. Tendril Desiccation: The curled tendril immediately adjacent to the melon peduncle must be completely brown, withered, and dry. A green tendril indicates active nutrient transport.',
          '2. Ground Belly Spot: The portion of the rind resting in contact with soil turns from greenish-white to a distinct creamy, buttery yellow.',
          '3. Acoustic Resonance: Tapping or thumping the melon produces a dull, deep hollow resonance (typically 80 to 140 Hz). High-pitch metallic pings (>180 Hz) denote dense, immature flesh; flat dull thuds (<70 Hz) denote internal cavity breakdown.',
          '4. Rind Sheen: Rind transitions from a glossy juvenile luster to a dull, slightly rough matte texture.',
        ],
      },
      {
        heading: 'Soluble Solids Content (°Brix) and USDA Grades',
        content: 'Refractometers measure light refraction through juice samples to determine dissolved sugars (fructose, glucose, sucrose). USDA standards define U.S. Fancy as having >= 10.0% Brix (with premium fruit reaching 11.5% to 13.0% Brix). Fruit testing under 9.0% Brix lacks marketable sweetness.',
      },
    ],
  },
  {
    id: 'ch_philippines',
    title: 'Chapter 6: Philippine Lowland Production (DA-BPI)',
    category: 'Philippine Extension',
    summary: 'Dry-season planting calendar, major Luzon/Visayas production provinces, and DA-BPI extension guidelines.',
    sections: [
      {
        heading: 'Philippine Agro-Climatic Planting Schedule',
        content: 'In the Philippines, watermelon (Pakwan) thrives in warm, dry lowland climates after the rice harvest. Planting during the dry season prevents foliar fungal outbreaks and maximizes sugar Brix accumulation.',
        bulletPoints: [
          'Dry Season Cropping: October to January planting for December to April harvest.',
          'Top Production Provinces: Pangasinan, Bulacan, Nueva Ecija, Pampanga, Bataan, and Iloilo.',
          'Soil & Relay Cropping: Commonly planted in sandy-loam river plains or relay-cropped after lowland rice (pH 6.0 - 6.8).',
        ],
      },
    ],
  },
];

