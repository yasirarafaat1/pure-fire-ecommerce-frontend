import PolicyPage from "../components/PolicyPage";
import { policyUpdated, returnSections } from "../utils/policy-content";

export default function ReturnPolicyPage() {
  return (
    <PolicyPage
      title="Returns and Exchange Policy"
      intro="Review eligibility, timelines, product condition requirements, and exchange rules before raising a return or exchange request."
      sections={returnSections}
      updated={policyUpdated}
    />
  );
}
