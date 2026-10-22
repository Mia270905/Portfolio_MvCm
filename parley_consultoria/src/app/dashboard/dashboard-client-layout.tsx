"use client";
import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";
import { type ModulesHierarchy } from '@/lib/definitions';
import { type User } from '@/lib/actions/user.actions'

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  modules: ModulesHierarchy;
  currentUser: User;
}

export default function DashboardClientLayout({
  children,
  modules,
  currentUser
}: DashboardClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-white dark:bg-custom-bg-primary">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        modules={modules} 
        currentUser={currentUser}
      />
     
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
        `}
      >
        <DashboardHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
       
        <main className="lg:p-6 bg-gray-50 dark:bg-custom-bg-primary min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}