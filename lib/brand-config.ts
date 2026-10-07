/**
 * Rory Skagen Art - Brand Configuration & Feature Flags
 * Propagation across roryskagenart.com -> roryskagenart.fourthwall.com -> shop.roryskagenart.com
 */

import { cleanEnv } from './utils';

export const BRAND_CONFIG = {
  name: 'Rory Skagen Art',
  tagline: 'Austin, Texas • Est. 1985',
  legalName: 'Rory Skagen Art Studio LLC',
  originCity: 'Austin, Texas',
  estYear: 1985,

  domains: {
    portfolio: 'https://roryskagenart.com',
    fourthwallHosted: 'https://roryskagenart.fourthwall.com',
    shopCustomDomain: 'https://shop.roryskagenart.com'
  },

  assets: {
    icon192: '/android-chrome-192x192.png',
    appleTouchIcon: '/apple-touch-icon.png',
    favicon32: '/favicon-32x32.png',
    favicon16: '/favicon-16x16.png',
    manifest: '/site.webmanifest'
  },

  theme: {
    /*
     * Skagen Light (live on roryskagenart.com design panel).
     * Synced to shop.roryskagenart.com via globals.css CSS vars.
     */
    skagenLight: {
      background: '#c2c9d1',
      card: '#edeff2',
      surface: '#edeff2',
      surfaceDeep: '#959eb1',
      foreground: '#16202b',
      foregroundMuted: '#5f6875',
      border: '#c3c9d0',
      lineStrong: '#bcc2c8',
      accent: '#22d3ee',
      destructive: '#ef4444'
    },
    skagenDark: {
      background: '#464e58',
      card: '#2f353c',
      surface: '#171e23',
      surfaceDeep: '#181b21',
      foreground: '#eef2f6',
      foregroundMuted: '#9aa3ae',
      border: '#515761',
      lineStrong: '#828e9b',
      accent: '#22d3ee',
      destructive: '#f87171'
    },
    /* Legacy names kept for migration compat */
    galleryStoneLight: {
      background: '#e3e1da',
      card: '#eeede8',
      foreground: '#1c1c20',
      border: '#d2cfc6',
      lineStrong: '#3a3a40'
    },
    charcoalGalleryDark: {
      background: '#17171b',
      card: '#1d1d22',
      foreground: '#f0f0f2',
      border: '#33333a',
      lineStrong: '#52525c'
    }
  },

  /**
   * Feature Flags
   * Step 1: brandExperienceV1 - Basic low-risk congruent brand visuals, official icon, and logo propagation
   */
  features: {
    brandExperienceV1: cleanEnv(process.env.NEXT_PUBLIC_FEATURE_BRAND_V1) !== 'false',

    /**
     * Step 2: Planned future release feature flags (disabled in Step 1 scope)
     */
    crossDomainSso: false,
    omnichannelGlobalHeader: false,
    realtimePaletteSync: false,
    arRoomPreview: false,
    commissionInquiryModal: false
  },

  /**
   * Future Features Roadmap (Step 2 planning specification)
   *
   * ⚠️ These are ROADMAP ids, not release numbers. Releases are tagged
   * `v0.x.y` on the merge commit of the PR that delivered them, and nothing is
   * ever tagged from this list — `git tag` is the release record (AGENTS.md §2,
   * trap T24). The `v1.x` labels below are phase names for the
   * brand/omnichannel programme and must not be used to name a release.
   *
   * This array is not read by any component today; it is planning data kept in
   * code. If you wire it up, keep the naming rule above.
   */
  roadmap: [
    {
      phase: 'Step 1 (Active)',
      roadmapId: 'v1.1.0',
      status: 'active',
      scope:
        'Brand logo, icon, core visuals, Shadcn/TW tokens, and favicon propagation across all storefront routes with feature flag isolation.'
    },
    {
      phase: 'Step 2 - Release A (Future)',
      roadmapId: 'v1.2.0',
      status: 'planned',
      title: 'Unified Omnichannel Header & Cart Sync',
      scope:
        'Shared header component synchronized across roryskagenart.com and shop.roryskagenart.com via cross-domain session cookies.'
    },
    {
      phase: 'Step 2 - Release B (Future)',
      roadmapId: 'v1.3.0',
      status: 'planned',
      title: 'Cross-Domain Studio Accounts (SSO)',
      scope:
        'Single sign-on uniting Fourthwall supporter checkout accounts with roryskagenart.com collector memberships.'
    },
    {
      phase: 'Step 2 - Release C (Future)',
      roadmapId: 'v1.4.0',
      status: 'planned',
      title: 'Automated Palette & Design System Sync',
      scope:
        'Webhook listener that receives theme/palette switches made in the roryskagenart.com studio admin and updates storefront theme tokens.'
    },
    {
      phase: 'Step 2 - Release D (Future)',
      roadmapId: 'v1.5.0',
      status: 'planned',
      title: 'AR Wall Visualizer & In-Situ Previews',
      scope:
        'Augmented reality mobile camera preview allowing collectors to project 1:1 scale fine art pieces on their home walls before purchasing.'
    }
  ]
};
