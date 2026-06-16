import PolicyPage from "../components/PolicyPage";
import { policyUpdated, termsSections } from "../utils/policy-content";

export default function TermsAndConditionsPage() {
  return (
    <PolicyPage
      title="Terms and Conditions"
      intro="These terms define how customers may use the website, place orders, and interact with store services."
      sections={termsSections}
      updated={policyUpdated}
    />
  );
}
