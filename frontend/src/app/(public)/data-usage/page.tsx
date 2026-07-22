import { PolicyPlaceholder, PolicySection } from "@/components/legal/policy-placeholder";

export default function DataUsagePage() {
  return (
    <PolicyPlaceholder title="Data usage" summary="A factual beta overview of how current product systems use data. This does not replace the final privacy policy.">
      <PolicySection title="Product analytics"><p>Explicit, allowlisted PostHog events help measure onboarding, workout use, reliability, and beta feedback. Autocapture is disabled, payloads exclude workout values and user-entered text, and identity uses an opaque internal ID.</p></PolicySection>
      <PolicySection title="Crash reporting"><p>Sentry receives sanitized technical errors and release information. Cookies, authorization headers, request bodies, emails, workout notes, set values, and database connection details are removed.</p></PolicySection>
      <PolicySection title="Feedback and screenshots"><p>Feedback is stored with bounded route and device categories. Screenshots are optional, kept in private storage, and made available to authorized administrators only through temporary signed URLs.</p></PolicySection>
      <PolicySection title="Offline workout storage"><p>Active-workout snapshots and pending changes may be stored in IndexedDB and a limited service-worker cache on the device. Sign-out and account deletion trigger local cleanup.</p></PolicySection>
      <PolicySection title="Apple Health and Health Connect"><p>Health access is optional, granular, and initiated manually. Imported values stay on the device and are never included in Persist analytics, crash reports, or feedback. A failed workout export may be queued locally for a manual retry.</p></PolicySection>
      <PolicySection title="Controls"><p>Settings provides JSON export, active-session review, session revocation, and permanent account deletion.</p></PolicySection>
    </PolicyPlaceholder>
  );
}
