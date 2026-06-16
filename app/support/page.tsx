import PolicyPage from "../components/PolicyPage";
import { policyUpdated, supportSections } from "../utils/policy-content";

export default function SupportPage() {
  return (
    <PolicyPage
      title="Support"
      intro="Get help with orders, delivery, payment, returns, exchanges, refunds, product sizing, and account-related questions."
      sections={supportSections}
      updated={policyUpdated}
    />
  );
}
