import { PolicyPlaceholder, PolicySection } from "@/components/legal/policy-placeholder";

export default function PrivacyPage() {
  return (
    <PolicyPlaceholder title="Privacy policy" summary="A plain-language outline of the data-handling topics the final Persist Fitness privacy policy must cover.">
      <PolicySection title="Account and training data"><p>Persist stores account details, profile preferences, workouts, routines, program enrollment, favorites, and feedback so the product can provide its core features.</p></PolicySection>
      <PolicySection title="Service providers"><p>The final policy must identify hosting, database, authentication, crash-reporting, analytics, and private screenshot-storage providers and describe their roles.</p></PolicySection>
      <PolicySection title="Health data"><p>Apple Health and Health Connect integrations are optional. Imported health values remain local unless a user explicitly chooses a supported synchronization action, and those values are excluded from analytics, crash reporting, and feedback.</p></PolicySection>
      <PolicySection title="Your choices"><p>Signed-in users can download their personal data, review active sessions, revoke other sessions, and request permanent account deletion from Settings.</p></PolicySection>
      <PolicySection title="Retention and contact"><p>Final retention periods, jurisdiction-specific rights, company identity, and privacy contact details require legal review before launch.</p></PolicySection>
    </PolicyPlaceholder>
  );
}
