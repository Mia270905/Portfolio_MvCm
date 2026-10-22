"use client";

import { useState } from "react";
import AttendanceCheckIn from "@/components/attendance/attendance-checkin";
import AttendanceHistoryList from "@/components/attendance/antendance-history-list";

interface ChecadorClientProps {
  initialData: {
    user: {
      id: string;
      full_name?: string;
      email?: string;
      avatarUrl?: string;
    } | null;
    lastRecord?: any;
  };
}

export function ChecadorClient({ initialData }: ChecadorClientProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <div className="mb-12">
        <AttendanceCheckIn 
          initialData={initialData} 
          onCheckInOutSuccess={handleRefresh} 
        />
      </div>

      <div>
        <h2 className="text-2xl font-medium text-white mb-6">
          Historial de Registros
        </h2>
        <AttendanceHistoryList refreshTrigger={refreshTrigger} />
      </div>
    </>
  );
}