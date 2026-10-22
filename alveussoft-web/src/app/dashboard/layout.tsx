import { Suspense } from "react";
import DashboardContent from "./dashboard-content";
import DashboardLoading from "./loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}