'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

import { BRAND_CONFIG } from 'lib/brand-config';

const AGREED_COOKIE = 'terms-agreed';

/**
 * First-visit agreement prompt. It replaces the template's "Welcome to Next.js Commerce"
 * toast with something that belongs to this shop: the visitor acknowledges the terms of
 * service before browsing, and the acknowledgement is stored in a cookie so it is shown
 * once rather than on every navigation.
 *
 * Design notes:
 * - **"I agree" is the only way out.** `closeButton: false` drops the ✕ and `dismissible: false`
 *   stops a swipe from doing the same job, so the pill is the single affordance. The cookie is
 *   written *inside the action's `onClick`* — which is what makes it a record of consent. The
 *   previous version wrote it from `onDismiss`, so merely dismissing the toast counted as
 *   agreeing; that was the bug this replaces. There is deliberately no `onDismiss` any more.
 * - `duration: Infinity` is deliberate: this is a gate, not a nudge, and it must not disappear
 *   on a timer.
 * - The pill is right-aligned for free — sonner gives its action button `margin-left: auto`
 *   inside the toast's flex row, so no alignment utility is needed here.
 *
 * ⚠️ The `!` prefixes on `actionButton` are load-bearing, not stylistic noise. sonner injects its
 * own button CSS into `<head>` at runtime, so it wins on **source order** at equal specificity
 * (`[data-sonner-toast][data-styled=true] [data-button]` is 0-3-0; a plain utility class is 0-1-0).
 * The `!important` utilities are the only reason `rounded-full` / `bg-brand-accent` take effect —
 * remove them and the button silently reverts to sonner's 24px-tall dark default.
 *
 * ⚠️ The links are *not* accent-coloured text. `--brand-accent` (#22d3ee) on the toast's white
 * surface is ~1.6:1 — unreadable, and well under WCAG AA. The accent carries the underline
 * instead, which is decorative; the label itself stays `text-brand-fg`.
 */
export function WelcomeToast() {
  useEffect(() => {
    // ignore if screen height is too small
    if (window.innerHeight < 650) return;
    if (document.cookie.includes(`${AGREED_COOKIE}=1`)) return;

    const linkClasses =
      'font-medium text-brand-fg underline decoration-brand-accent decoration-2 underline-offset-2';

    toast('Terms of Service', {
      id: 'welcome-toast',
      duration: Infinity,
      dismissible: false,
      closeButton: false,
      classNames: {
        actionButton:
          '!h-auto !rounded-full !bg-brand-accent !px-5 !py-2 !text-xs !font-bold !tracking-wide !text-brand-accent-fg'
      },
      action: {
        label: 'I agree',
        onClick: () => {
          document.cookie = `${AGREED_COOKIE}=1; max-age=31536000; path=/; SameSite=Lax`;
        }
      },
      description: (
        <>
          By continuing to browse {BRAND_CONFIG.name} you agree to our{' '}
          <a href="/pages/terms-of-service" className={linkClasses}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/pages/privacy-policy" className={linkClasses}>
            Privacy Policy
          </a>
          .
        </>
      )
    });
  }, []);

  return null;
}
