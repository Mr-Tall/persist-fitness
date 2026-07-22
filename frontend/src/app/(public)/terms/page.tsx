import { PolicyPlaceholder, PolicySection } from "@/components/legal/policy-placeholder";

export default function TermsPage() {
  return (
    <PolicyPlaceholder title="Terms of use" summary="A structural placeholder for the terms that must be professionally drafted before public release.">
      <PolicySection title="Product purpose"><p>Persist is a workout-logging and planning tool. The final terms must clearly distinguish product information from medical or professional advice.</p></PolicySection>
      <PolicySection title="Accounts and acceptable use"><p>Final terms should cover account responsibility, prohibited behavior, service availability, suspension, and termination.</p></PolicySection>
      <PolicySection title="User content and service rights"><p>Ownership, licenses, intellectual-property rights, warranty limitations, dispute terms, and governing law require qualified legal review.</p></PolicySection>
    </PolicyPlaceholder>
  );
}
