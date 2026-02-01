import { TUserLocale } from "@formbricks/types/user";

// Arabic-only mode - always return ar-IQ
export const findMatchingLocale = async (): Promise<TUserLocale> => {
  return "ar-IQ";
};
