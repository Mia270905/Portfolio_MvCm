"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRealTimeStaff } from "@/lib/actions/attendance.actions";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  name: string;
  initials: string;
  status: "active" | "inactive";
}

export default function RealTimeStaff() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await getRealTimeStaff();
        setStaff(data);
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Supabase Realtime Subscription
    const supabase = createClient();
    const channel = supabase
      .channel("real-time-attendance")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance_transactions",
        },
        async (payload) => {
          // Update the status of the specific user
          const { user_id, event_type } = payload.new;
          if (user_id && event_type) {
            setStaff((prev) =>
              prev.map((user) =>
                user.id === user_id
                  ? { ...user, status: event_type === "check-in" ? "active" : "inactive" }
                  : user
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-20 h-8 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (staff.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
        Personal En Tiempo Real ({staff.length} Usuarios)
      </h3>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {staff.map((user) => (
          <div
            key={user.id}
            className="relative flex-shrink-0"
            onMouseEnter={() => setHoveredId(user.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {(hoveredId === user.id) && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1a1a24] border border-white/10 rounded shadow-xl pointer-events-none z-50 whitespace-nowrap"
                >
                  <span className="text-[10px] text-zinc-300 font-medium">
                    {user.name}
                  </span>
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[4px] border-x-transparent border-t-[4px] border-t-[#1a1a24]"></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* User Pill (Rectangular style with Name) */}
            <div 
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#1a1a24] border border-white/5 transition-all duration-200 cursor-pointer ${
                hoveredId === user.id  ? "border-[#10b981]/50 bg-[#10b981]/5" : ""
              }`}
            >
              {/* Status Dot */}
              <div 
                className={`w-2 h-2 rounded-full ${
                  user.status === "active" ? "bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-[#ef4444]"
                }`}
              />
              
              <span className="text-xs font-semibold text-zinc-300 whitespace-nowrap">
                {user.name.split(" ")[0]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
