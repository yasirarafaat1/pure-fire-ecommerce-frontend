import PolicyPage from "../components/PolicyPage";
import { policyUpdated, shippingSections } from "../utils/policy-content";

export default function ShippingInfoPage() {
  return (
    <PolicyPage
      title="Shipping Info"
      intro="Understand order processing, shipment tracking, delivery timelines, and address-related responsibilities."
      sections={shippingSections}
      updated={policyUpdated}
    />
  );
}
