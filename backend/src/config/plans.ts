export type PlanType = 'BRONZE' | 'SILVER' | 'GOLD';

export interface PlanConfig {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  formsLimit: number;
  features: string[];
}

export const planConfigs: Record<PlanType, PlanConfig> = {
  BRONZE: {
    name: 'Bronze',
    monthlyPrice: 255, // ₹255
    yearlyPrice: 1530, // ₹1530 (50% discount on yearly)
    formsLimit: 25,
    features: [
      '25 Forms',
      '1,000 Monthly Submissions',
      '1 User',
      '1 GB Storage',
    ],
  },
  SILVER: {
    name: 'Silver',
    monthlyPrice: 595, // ₹595
    yearlyPrice: 3570, // ₹3570 (50% discount on yearly)
    formsLimit: 50,
    features: [
      '50 Forms',
      '2,500 Monthly Submissions',
      '1 User',
      '10 GB Storage',
    ],
  },
  GOLD: {
    name: 'Gold',
    monthlyPrice: 935, // ₹935
    yearlyPrice: 5610, // ₹5610 (50% discount on yearly)
    formsLimit: 100,
    features: [
      '100 Forms',
      '10,000 Monthly Submissions',
      '1 User',
      '100 GB Storage',
    ],
  },
};

// Helper function to validate plan type
export const isValidPlanType = (plan: string): plan is PlanType => {
  return ['BRONZE', 'SILVER', 'GOLD'].includes(plan as PlanType);
};

// Helper function to get plan config safely
export const getPlanConfig = (plan: PlanType): PlanConfig | null => {
  return planConfigs[plan] || null;
};
