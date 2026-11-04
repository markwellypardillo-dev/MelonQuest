/**
 * Agronomy calculations, thresholds, and educational rule engines for MelonQuest.
 * Strict zero-emoji policy applied.
 */

export interface SoilSample {
  pH: number;
  nitrogen: number; // ppm
  phosphorus: number; // ppm
  potassium: number; // ppm
  moisture: number; // percentage 0-100
}

export interface SoilAssessment {
  status: 'optimal' | 'acidic' | 'alkaline';
  pHDifference: number;
  recommendedTreatment: 'lime' | 'sulfur' | 'none';
  treatmentAmountKgPerHa: number;
  nStatus: 'low' | 'balanced' | 'excessive';
  pStatus: 'low' | 'balanced' | 'excessive';
  kStatus: 'low' | 'balanced' | 'excessive';
  isReadyForPlanting: boolean;
  notes: string;
}

export const OPTIMAL_PH_MIN = 6.0;
export const OPTIMAL_PH_MAX = 6.8;
export const OPTIMAL_PH_TARGET = 6.5;

/**
 * Evaluates soil sample against watermelon (Citrullus lanatus) requirements.
 */
export function assessWatermelonSoil(sample: SoilSample): SoilAssessment {
  const { pH, nitrogen, phosphorus, potassium, moisture } = sample;

  let status: 'optimal' | 'acidic' | 'alkaline' = 'optimal';
  let recommendedTreatment: 'lime' | 'sulfur' | 'none' = 'none';
  let treatmentAmountKgPerHa = 0;

  if (pH < OPTIMAL_PH_MIN) {
    status = 'acidic';
    recommendedTreatment = 'lime';
    // Approximately 1500 kg/ha of calcitic lime per 0.5 pH unit deficiency in sandy loam
    const deficit = OPTIMAL_PH_TARGET - pH;
    treatmentAmountKgPerHa = Math.round(deficit * 3000);
  } else if (pH > OPTIMAL_PH_MAX) {
    status = 'alkaline';
    recommendedTreatment = 'sulfur';
    // Elemental sulfur application to reduce pH
    const excess = pH - OPTIMAL_PH_TARGET;
    treatmentAmountKgPerHa = Math.round(excess * 900);
  }

  const nStatus = nitrogen < 30 ? 'low' : nitrogen > 70 ? 'excessive' : 'balanced';
  const pStatus = phosphorus < 25 ? 'low' : phosphorus > 60 ? 'excessive' : 'balanced';
  const kStatus = potassium < 120 ? 'low' : potassium > 220 ? 'excessive' : 'balanced';

  const isPhValid = status === 'optimal';
  const isNutrientAdequate = nStatus !== 'low' && pStatus !== 'low' && kStatus !== 'low';
  const isMoistureAdequate = moisture >= 40 && moisture <= 70;

  let notes = 'Soil conditions meet commercial agronomic standards for Citrullus lanatus.';
  if (status === 'acidic') {
    notes = 'Soil is overly acidic. Aluminum toxicity risk. Apply agricultural limestone.';
  } else if (status === 'alkaline') {
    notes = 'Soil is alkaline. Micronutrient lockup (Fe, Mn, Zn). Apply elemental sulfur.';
  } else if (!isNutrientAdequate) {
    notes = 'Soil macro-nutrients are deficient. Balanced pre-plant basal fertilizer needed.';
  } else if (!isMoistureAdequate) {
    notes = 'Soil moisture is outside the target 40-70% field capacity range.';
  }

  return {
    status,
    pHDifference: Number((pH - OPTIMAL_PH_TARGET).toFixed(2)),
    recommendedTreatment,
    treatmentAmountKgPerHa,
    nStatus,
    pStatus,
    kStatus,
    isReadyForPlanting: isPhValid && isNutrientAdequate && isMoistureAdequate,
    notes,
  };
}

export type PestType = 'cucumber_beetle' | 'melon_aphid' | 'powdery_mildew' | 'beneficial_ladybug';
export type IPMIntervention = 'kaolin_spinosad' | 'insecticidal_soap' | 'potassium_bicarbonate' | 'protect_beneficial';

export interface PestDiagnosis {
  correctIntervention: IPMIntervention;
  scientificPathogen: string;
  agronomicConsequence: string;
}

export const PEST_REGISTRY: Record<PestType, PestDiagnosis> = {
  cucumber_beetle: {
    correctIntervention: 'kaolin_spinosad',
    scientificPathogen: 'Acalymma vittatum (Vector for Erwinia tracheiphila / Bacterial Wilt)',
    agronomicConsequence: 'Transmits fatal bacterial wilt causing irreversible xylem blockage and plant collapse.',
  },
  melon_aphid: {
    correctIntervention: 'insecticidal_soap',
    scientificPathogen: 'Aphis gossypii',
    agronomicConsequence: 'Stunts leaf expansion, secretes honeydew promoting sooty mold, vectors Cucumber Mosaic Virus.',
  },
  powdery_mildew: {
    correctIntervention: 'potassium_bicarbonate',
    scientificPathogen: 'Podosphaera xanthii',
    agronomicConsequence: 'Foliar necrosis reducing photosynthetic leaf area and leading to sunscald on exposed fruit.',
  },
  beneficial_ladybug: {
    correctIntervention: 'protect_beneficial',
    scientificPathogen: 'Hippodamia convergens',
    agronomicConsequence: 'Beneficial predator consuming up to 50 aphids per day. Do not apply synthetic pesticide.',
  },
};

export function evaluatePestIntervention(pest: PestType, intervention: IPMIntervention): boolean {
  return PEST_REGISTRY[pest].correctIntervention === intervention;
}

export interface HarvestInspection {
  tendrilDryingPct: number; // 0 to 100% (100 = completely brown/dry)
  groundSpotColor: 'white' | 'cream' | 'butter_yellow' | 'deep_yellow';
  thumpFrequencyHz: number; // 80-140Hz is ripe hollow sound, >180 is high pitch immature, <70 is overripe/fermenting
  refractometerBrix: number; // Soluble solids percentage
}

export interface HarvestEvaluation {
  isFullyRipe: boolean;
  tendrilPass: boolean;
  groundSpotPass: boolean;
  thumpAcousticPass: boolean;
  brixPass: boolean;
  usdaGrade: 'U.S. No. 1' | 'Commercial Grade' | 'Immature / Reject' | 'Overripe / Cull';
  feedback: string;
}

/**
 * Evaluates the 4 core non-destructive watermelon harvest readiness metrics.
 */
export function evaluateHarvestReadiness(inspection: HarvestInspection): HarvestEvaluation {
  // 1. Tendril must be fully dry/dead (>= 90%)
  const tendrilPass = inspection.tendrilDryingPct >= 90;

  // 2. Belly spot must be butter_yellow or deep_yellow
  const groundSpotPass = inspection.groundSpotColor === 'butter_yellow' || inspection.groundSpotColor === 'deep_yellow';

  // 3. Acoustic resonance: 90 - 145 Hz hollow resonant thud
  const thumpAcousticPass = inspection.thumpFrequencyHz >= 90 && inspection.thumpFrequencyHz <= 145;

  // 4. Sugar content: minimum 10.0 Brix for US No. 1, >= 8.5 for commercial
  const brixPass = inspection.refractometerBrix >= 10.0;

  const isFullyRipe = tendrilPass && groundSpotPass && thumpAcousticPass && brixPass;

  let usdaGrade: 'U.S. No. 1' | 'Commercial Grade' | 'Immature / Reject' | 'Overripe / Cull' = 'Immature / Reject';
  let feedback = '';

  if (inspection.thumpFrequencyHz < 80) {
    usdaGrade = 'Overripe / Cull';
    feedback = 'Fruit is overripe with internal flesh mealy or breaking down. Hollow cavity detected.';
  } else if (isFullyRipe) {
    if (inspection.refractometerBrix >= 11.5) {
      usdaGrade = 'U.S. No. 1';
      feedback = 'Exceptional harvest quality: full Brix sugar sweetness, dried tendril, golden ground spot, and optimal acoustic resonance.';
    } else {
      usdaGrade = 'Commercial Grade';
      feedback = 'Standard commercial quality: passes maturity checks with good consumer acceptability.';
    }
  } else {
    usdaGrade = 'Immature / Reject';
    if (!tendrilPass) {
      feedback = 'Tendril is still green or semi-green; vascular transport to fruit is not complete.';
    } else if (!groundSpotPass) {
      feedback = 'Ground belly spot is pale white; chlorophyll breakdown is incomplete.';
    } else if (!thumpAcousticPass) {
      feedback = 'Acoustic pitch indicates dense, tight internal tissue that has not developed mature air cell resonance.';
    } else {
      feedback = 'Soluble solids (Brix) are below the mandatory 10.0% sugar threshold.';
    }
  }

  return {
    isFullyRipe,
    tendrilPass,
    groundSpotPass,
    thumpAcousticPass,
    brixPass,
    usdaGrade,
    feedback,
  };
}
