import "server-only";
import { Organization } from "@prisma/client";
import { IS_RECAPTCHA_CONFIGURED } from "@/lib/constants";
import { TEnterpriseLicenseFeatures } from "@/modules/ee/license-check/types/enterprise-license";

// Helper function for feature permissions (e.g., removeBranding, whitelabel)
// All features unlocked - no license required
const getFeaturePermission = async (
  _billingPlan: Organization["billing"]["plan"],
  _featureKey: keyof Pick<TEnterpriseLicenseFeatures, "removeBranding" | "whitelabel">
): Promise<boolean> => {
  // All features unlocked
  return true;
};

export const getRemoveBrandingPermission = async (
  billingPlan: Organization["billing"]["plan"]
): Promise<boolean> => {
  return getFeaturePermission(billingPlan, "removeBranding");
};

export const getWhiteLabelPermission = async (
  billingPlan: Organization["billing"]["plan"]
): Promise<boolean> => {
  return getFeaturePermission(billingPlan, "whitelabel");
};

export const getBiggerUploadFileSizePermission = async (
  _billingPlan: Organization["billing"]["plan"]
): Promise<boolean> => {
  // All features unlocked
  return true;
};

// All features unlocked - no license required
const getSpecificFeatureFlag = async (
  _featureKey: keyof Pick<
    TEnterpriseLicenseFeatures,
    | "isMultiOrgEnabled"
    | "contacts"
    | "twoFactorAuth"
    | "sso"
    | "auditLogs"
    | "multiLanguageSurveys"
    | "accessControl"
    | "quotas"
  >
): Promise<boolean> => {
  // All features unlocked
  return true;
};

export const getIsMultiOrgEnabled = async (): Promise<boolean> => {
  return getSpecificFeatureFlag("isMultiOrgEnabled");
};

export const getIsContactsEnabled = async (): Promise<boolean> => {
  return getSpecificFeatureFlag("contacts");
};

export const getIsTwoFactorAuthEnabled = async (): Promise<boolean> => {
  return getSpecificFeatureFlag("twoFactorAuth");
};

export const getIsSsoEnabled = async (): Promise<boolean> => {
  return getSpecificFeatureFlag("sso");
};

export const getIsQuotasEnabled = async (billingPlan: Organization["billing"]["plan"]): Promise<boolean> => {
  const isEnabled = await getSpecificFeatureFlag("quotas");
  // If the feature is enabled in the license, return true
  if (isEnabled) return true;

  // If the feature is not enabled in the license, check the fallback(Backwards compatibility)
  return featureFlagFallback(billingPlan);
};

export const getIsAuditLogsEnabled = async (): Promise<boolean> => {
  // All features unlocked
  return true;
};

export const getIsSamlSsoEnabled = async (): Promise<boolean> => {
  // All features unlocked
  return true;
};

export const getIsSpamProtectionEnabled = async (
  _billingPlan: Organization["billing"]["plan"]
): Promise<boolean> => {
  if (!IS_RECAPTCHA_CONFIGURED) return false;
  // All features unlocked
  return true;
};

const featureFlagFallback = async (_billingPlan: Organization["billing"]["plan"]): Promise<boolean> => {
  // All features unlocked
  return true;
};

export const getMultiLanguagePermission = async (
  billingPlan: Organization["billing"]["plan"]
): Promise<boolean> => {
  const isEnabled = await getSpecificFeatureFlag("multiLanguageSurveys");
  // If the feature is enabled in the license, return true
  if (isEnabled) return true;

  // If the feature is not enabled in the license, check the fallback(Backwards compatibility)
  return featureFlagFallback(billingPlan);
};

export const getAccessControlPermission = async (
  billingPlan: Organization["billing"]["plan"]
): Promise<boolean> => {
  const isEnabled = await getSpecificFeatureFlag("accessControl");
  // If the feature is enabled in the license, return true
  if (isEnabled) return true;

  // If the feature is not enabled in the license, check the fallback(Backwards compatibility)
  return featureFlagFallback(billingPlan);
};

export const getOrganizationProjectsLimit = async (
  _limits: Organization["billing"]["limits"]
): Promise<number> => {
  // Unlimited projects
  return Infinity;
};
