import SprintReport from "@/components/admin/reports/SprintReport";
import RealTimeStaff from "@/components/dashboard/real-time-staff";

export default function DashboardPage() {
  return (
    <div className="max-w mx-auto space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-custom-text-primary">
        Panel de control
      </h1>
      <RealTimeStaff />
      <SprintReport />
    </div>
  );
}