"use client";

// Targeting locked card removed - feature unlocked
interface TargetingLockedCardProps {
  isFormbricksCloud: boolean;
  environmentId: string;
}

export const TargetingLockedCard = (_props: TargetingLockedCardProps) => {
  // Return null - targeting is now unlocked
  return null;
};
