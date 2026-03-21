/**
 * Feature flags system for progressive feature rollout.
 *
 * Flags are read from Vite env vars (VITE_FF_*).
 * Default: all flags OFF in production, ON in development.
 *
 * Usage:
 *   import { isFeatureEnabled } from '@/lib/feature-flags';
 *   if (isFeatureEnabled('DOCUMENT_REVIEW')) { ... }
 *
 * In .env:
 *   VITE_FF_DOCUMENT_REVIEW=true
 *   VITE_FF_CHAT=false
 */

const FLAG_PREFIX = 'VITE_FF_';

export type FeatureFlag =
  | 'DOCUMENT_REVIEW'
  | 'CHAT'
  | 'GLOBAL_SEARCH'
  | 'WAITLIST'
  | 'CASE_TIMELINE'
  | 'VOICE_INPUT';

const DEV_DEFAULTS: Record<FeatureFlag, boolean> = {
  DOCUMENT_REVIEW: true,
  CHAT: true,
  GLOBAL_SEARCH: true,
  WAITLIST: true,
  CASE_TIMELINE: true,
  VOICE_INPUT: true,
};

const PROD_DEFAULTS: Record<FeatureFlag, boolean> = {
  DOCUMENT_REVIEW: false,
  CHAT: true,
  GLOBAL_SEARCH: false,
  WAITLIST: false,
  CASE_TIMELINE: false,
  VOICE_INPUT: false,
};

const isDev = import.meta.env.DEV;

/**
 * Check whether a feature flag is enabled.
 *
 * Resolution order:
 *   1. Env var VITE_FF_<FLAG_NAME> (explicit override)
 *   2. Dev defaults (all ON) or Prod defaults (all OFF)
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const envKey = `${FLAG_PREFIX}${flag}`;
  const envValue = import.meta.env[envKey];

  if (envValue !== undefined && envValue !== '') {
    return envValue === 'true' || envValue === '1';
  }

  return isDev ? DEV_DEFAULTS[flag] : PROD_DEFAULTS[flag];
}

/**
 * Get all feature flags and their current state.
 * Useful for debugging / admin panel.
 */
export function getAllFlags(): Record<FeatureFlag, boolean> {
  const flags = Object.keys(DEV_DEFAULTS) as FeatureFlag[];
  return flags.reduce(
    (acc, flag) => {
      acc[flag] = isFeatureEnabled(flag);
      return acc;
    },
    {} as Record<FeatureFlag, boolean>,
  );
}
