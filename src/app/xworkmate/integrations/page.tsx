import { XWorkmateProfileRoute } from "@/components/xworkmate/XWorkmateProfileRoute";

export const metadata = {
  title: "XWorkmate Personal Integrations",
  description: "Manage the personal XWorkmate integrations profile",
};

export default function XWorkmateIntegrationsPage() {
  return <XWorkmateProfileRoute mode="integrations" />;
}
