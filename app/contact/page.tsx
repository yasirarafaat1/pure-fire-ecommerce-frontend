import PolicyPage from "../components/PolicyPage";
import { contactSections, policyUpdated } from "../utils/policy-content";

export default function ContactPage() {
  return (
    <PolicyPage
      title="Contact"
      intro="Use this page for customer support, order-related communication, business queries, and general feedback."
      sections={contactSections}
      updated={policyUpdated}
    />
  );
}
