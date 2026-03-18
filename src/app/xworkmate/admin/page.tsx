import { XWorkmateProfileRoute } from "@/components/xworkmate/XWorkmateProfileRoute";

export const metadata = {
  title: "XWorkmate Shared Integrations",
  description: "Manage the shared XWorkmate integrations profile",
};

export default function XWorkmateAdminPage() {
  return <XWorkmateProfileRoute mode="admin" />;
}
