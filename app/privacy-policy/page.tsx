import PolicyPage from "../components/PolicyPage";
import { policyUpdated, privacySections } from "../utils/policy-content";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="This policy explains what customer information we collect, why we collect it, and how it is used to operate the store safely."
      sections={privacySections}
      updated={policyUpdated}
    />
  );
}
