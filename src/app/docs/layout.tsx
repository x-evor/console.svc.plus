import { getDocCollections } from "./resources.server";
import DocsSidebar from "./DocsSidebar";
import UnifiedNavigation from "@components/UnifiedNavigation";
import Footer from "@components/Footer";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const collections = await getDocCollections();

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <UnifiedNavigation />
      <div className="flex w-full flex-1 items-start px-2 pb-8 pt-3 sm:px-3 lg:px-4">
        <DocsSidebar collections={collections} />
        <main className="min-h-[calc(100vh-64px)] flex-1 overflow-x-hidden px-3 py-3 sm:px-5 lg:px-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
