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
 * - The cookie is written on *dismiss*, not on mount. Sonner exposes no "confirmed" event,
 *   so a visitor who ignores the toast and keeps browsing has not agreed — writing on mount
 *   would silently record consent nobody gave.
 * - `duration: Infinity` with an explicit Close button is deliberate: this is a gate, not a
 *   nudge, and it must not disappear on a timer.
 */
export function WelcomeToast() {
  useEffect(() => {
    // ignore if screen height is too small
    if (window.innerHeight < 650) return;
    if (document.cookie.includes(`${AGREED_COOKIE}=1`)) return;

    toast('Terms of Service', {
      id: 'welcome-toast',
      duration: Infinity,
      onDismiss: () => {
        document.cookie = `${AGREED_COOKIE}=1; max-age=31536000; path=/; SameSite=Lax`;
      },
      description: (
        <>
          By continuing to browse {BRAND_CONFIG.name} you agree to our{' '}
          <a
            href="/pages/terms-of-service"
            className="text-blue-600 hover:underline"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/pages/privacy-policy"
            className="text-blue-600 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </>
      ),
    });
  }, []);

  return null;
}