import {
  PROVIDER_KEYS,
  PROVIDER_TYPES,
  type ProviderType,
} from './client/definitions';

export const LEGACY_LANGUAGE_MODEL_VENDOR_ID = 'unify-chat-provider';
const LANGUAGE_MODEL_VENDOR_DISPLAY_NAME = 'Unify Chat Provider';
const PROVIDER_PICKER_SUFFIXES = [
  'OpenAI Chat Completion',
  'OpenAI Responses',
  'Anthropic Messages',
  'Gemini',
] as const;

export function getLanguageModelVendorId(providerType?: ProviderType): string {
  return providerType
    ? `${LEGACY_LANGUAGE_MODEL_VENDOR_ID}.${providerType}`
    : LEGACY_LANGUAGE_MODEL_VENDOR_ID;
}

export function getLanguageModelVendorType(
  vendor: string,
): ProviderType | undefined {
  if (!vendor.startsWith(`${LEGACY_LANGUAGE_MODEL_VENDOR_ID}.`)) {
    return undefined;
  }

  const providerType = vendor.slice(LEGACY_LANGUAGE_MODEL_VENDOR_ID.length + 1);
  return PROVIDER_KEYS.includes(providerType as ProviderType)
    ? (providerType as ProviderType)
    : undefined;
}

export function isUnifyChatProviderVendor(vendor: string): boolean {
  return (
    vendor === LEGACY_LANGUAGE_MODEL_VENDOR_ID ||
    getLanguageModelVendorType(vendor) !== undefined
  );
}

export function getLanguageModelVendorDisplayName(vendor: string): string {
  if (vendor === LEGACY_LANGUAGE_MODEL_VENDOR_ID) {
    return LANGUAGE_MODEL_VENDOR_DISPLAY_NAME;
  }

  const providerType = getLanguageModelVendorType(vendor);
  return providerType ? PROVIDER_TYPES[providerType].label : vendor;
}

export function getProviderPickerDisplayName(providerName: string): string {
  for (const suffix of PROVIDER_PICKER_SUFFIXES) {
    const suffixWithParens = ` (${suffix})`;
    if (providerName.endsWith(suffixWithParens)) {
      return providerName.slice(0, -suffixWithParens.length);
    }
  }

  return providerName;
}