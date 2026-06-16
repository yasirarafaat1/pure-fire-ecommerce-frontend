import PolicyPage from "../components/PolicyPage";
import { policyUpdated, refundSections } from "../utils/policy-content";

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund Policy"
      intro="Learn when refunds are eligible, how long they take, and what deductions or payment-provider delays may apply."
      sections={refundSections}
      updated={policyUpdated}
    />
  );
}
