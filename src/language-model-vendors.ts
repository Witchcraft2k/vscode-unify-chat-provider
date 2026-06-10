import {
  PROVIDER_KEYS,
  PROVIDER_TYPES,
  type ProviderType,
} from './client/definitions';
import { WELL_KNOWN_PROVIDERS } from './well-known/providers';

export const LEGACY_LANGUAGE_MODEL_VENDOR_ID = 'unify-chat-provider';
const PROVIDER_GROUP_VENDOR_PREFIX = `${LEGACY_LANGUAGE_MODEL_VENDOR_ID}.group-`;
const LANGUAGE_MODEL_VENDOR_DISPLAY_NAME = 'Unify Chat Provider';
const CUSTOM_PROVIDER_GROUP_DISPLAY_NAME = 'Other Providers';
const PROVIDER_PICKER_SUFFIXES = [
  'OpenAI Chat Completion',
  'OpenAI Responses',
  'Anthropic Messages',
  'Gemini',
] as const;
const PROVIDER_GROUP_NAME_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export interface LanguageModelProviderGroup {
  vendorId: string;
  displayName: string;
  isCustomFallback?: boolean;
}

function toProviderGroupVendorSlug(displayName: string): string {
  return displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const KNOWN_PROVIDER_GROUP_DISPLAY_NAMES = [
  ...new Set(
    WELL_KNOWN_PROVIDERS.map((provider) =>
      getProviderPickerDisplayName(provider.name),
    ),
  ),
].sort(PROVIDER_GROUP_NAME_COLLATOR.compare);

const KNOWN_PROVIDER_GROUPS: LanguageModelProviderGroup[] =
  KNOWN_PROVIDER_GROUP_DISPLAY_NAMES.map((displayName) => ({
    vendorId: `${PROVIDER_GROUP_VENDOR_PREFIX}${toProviderGroupVendorSlug(displayName)}`,
    displayName,
  }));

export const LANGUAGE_MODEL_PROVIDER_GROUPS: readonly LanguageModelProviderGroup[] = [
  ...KNOWN_PROVIDER_GROUPS,
  {
    vendorId: `${PROVIDER_GROUP_VENDOR_PREFIX}custom`,
    displayName: CUSTOM_PROVIDER_GROUP_DISPLAY_NAME,
    isCustomFallback: true,
  },
];

const KNOWN_PROVIDER_GROUP_DISPLAY_NAMES_SET = new Set(
  KNOWN_PROVIDER_GROUP_DISPLAY_NAMES,
);
const PROVIDER_GROUP_DISPLAY_NAME_BY_VENDOR_ID = new Map(
  LANGUAGE_MODEL_PROVIDER_GROUPS.map((group) => [group.vendorId, group.displayName]),
);

const KNOWN_PROVIDER_GROUP_BY_DISPLAY_NAME = new Map(
  KNOWN_PROVIDER_GROUPS.map((group) => [group.displayName, group] as const),
);

export function getLanguageModelVendorId(providerType?: ProviderType): string {
  return providerType
    ? `${LEGACY_LANGUAGE_MODEL_VENDOR_ID}.${providerType}`
    : LEGACY_LANGUAGE_MODEL_VENDOR_ID;
}

export function getProviderGroupVendorId(
  providerDisplayName: string,
): string | undefined {
  const resolvedDisplayName = getProviderPickerDisplayName(providerDisplayName);
  return KNOWN_PROVIDER_GROUP_DISPLAY_NAMES_SET.has(resolvedDisplayName)
    ? `${PROVIDER_GROUP_VENDOR_PREFIX}${toProviderGroupVendorSlug(resolvedDisplayName)}`
    : undefined;
}

export function getRegisteredLanguageModelProviderGroups(
  providerNames: readonly string[],
): readonly LanguageModelProviderGroup[] {
  const displayNames = [
    ...new Set(providerNames.map((providerName) => getProviderPickerDisplayName(providerName))),
  ].sort(PROVIDER_GROUP_NAME_COLLATOR.compare);

  if (displayNames.length === 0) {
    return [
      {
        vendorId: `${PROVIDER_GROUP_VENDOR_PREFIX}custom`,
        displayName: CUSTOM_PROVIDER_GROUP_DISPLAY_NAME,
        isCustomFallback: true,
      },
    ];
  }

  return displayNames.map(
    (displayName) =>
      KNOWN_PROVIDER_GROUP_BY_DISPLAY_NAME.get(displayName) ?? {
        vendorId: displayName,
        displayName,
      },
  );
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
    PROVIDER_GROUP_DISPLAY_NAME_BY_VENDOR_ID.has(vendor) ||
    getLanguageModelVendorType(vendor) !== undefined
  );
}

export function getLanguageModelVendorDisplayName(vendor: string): string {
  const providerGroupDisplayName = PROVIDER_GROUP_DISPLAY_NAME_BY_VENDOR_ID.get(
    vendor,
  );
  if (providerGroupDisplayName) {
    return providerGroupDisplayName;
  }

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