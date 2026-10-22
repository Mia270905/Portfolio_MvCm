"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface Developer {
  name: string;
  hours: number;
  points: number;
  efficiency: number;
  color: string;
}

interface SprintData {
  id: string;
  title: string;
  period: string;
  data: Developer[];
}

// Histórico de Sprints unificado y ordenado
const sprints: SprintData[] = [
  {
    id: "sprint-16-20",
    title: "CIERRE DE SPRINT",
    period: "16 AL 20 DE MARZO",
    data: [
      { name: "Mia", hours: 23.00, points: 21.50, efficiency: 93.48, color: "#10b981" }, // YELLOW
      { name: "Javier", hours: 21.25, points: 18.50, efficiency: 87.06, color: "#84cc16" }, // YELLOW
      { name: "Martín", hours: 21.50, points: 18.00, efficiency: 83.72, color: "#eab308" }, // Orange
      { name: "Adrian", hours: 21.25, points: 17.50, efficiency: 82.35, color: "#f97316" }, // Orange
      { name: "Sergio", hours: 23.00, points: 14.75, efficiency: 64.13, color: "#ef4444" }, // RED
    ].sort((a, b) => b.efficiency - a.efficiency),
  },
  {
    id: "sprint-09-13",
    title: "CIERRE DE SPRINT",
    period: "09 AL 13 DE MARZO",
    data: [
      { name: "Mia", hours: 18.50, points: 18.50, efficiency: 100.00, color: "#10b981" },
      { name: "Adrian", hours: 28.00, points: 24.50, efficiency: 87.50, color: "#84cc16" },
      { name: "Javier", hours: 27.75, points: 21.75, efficiency: 78.38, color: "#eab308" },
      { name: "Sergio", hours: 19.75, points: 14.50, efficiency: 73.42, color: "#f97316" },
      { name: "Martín", hours: 37.75, points: 22.50, efficiency: 59.60, color: "#ef4444" }, // Red
    ].sort((a, b) => b.efficiency - a.efficiency),
  }
];

const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function SprintReport() {
  return (
    <div className="max-w-7xl mx-auto p-3 lg:p-8 bg-[#0B0E14] text-slate-200 min-h-screen font-sans space-y-16">

      {sprints.map((sprint) => (
        <div key={sprint.id} className="space-y-6 lg:space-y-8 flex flex-col">
          {/* Header Card Compacto en Móvil */}
          <div className="bg-[#161B22] border border-slate-800 rounded-lg lg:rounded-xl p-4 lg:p-6 flex gap-3 lg:gap-5 items-center shadow-2xl">
            <div className="flex-shrink-0 p-2 lg:p-3 bg-emerald-500/10 rounded-md border border-emerald-500/20">
              <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-base lg:text-xl font-black text-white tracking-tight uppercase italic">
                {sprint.title}: {sprint.period}
              </h2>
              <p className="mt-1 text-xs lg:text-sm text-slate-400 font-medium leading-normal lg:leading-relaxed">
                Resultados finales. <span className="text-emerald-400 font-bold">Eficiencia</span>:
                <code className="ml-1 px-1.5 py-0.5 bg-black/40 rounded border border-slate-700 text-emerald-300 italic text-xs">
                  Pts Jira / Horas Ejecución
                </code>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6">

            {/* Gráfico de Barras - 40% Width en LG */}
            <div className="lg:col-span-2 bg-[#161B22] border border-slate-800 rounded-xl p-4 lg:p-6 shadow-xl">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 lg:mb-8 flex justify-between">
                Ranking Visual <span>Pts / Hr</span>
              </h3>
              {/* ALTO AJUSTABLE EN MÓVIL (h-[260px]) */}
              <div className="h-[260px] lg:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sprint.data} margin={{ top: 15, right: 8, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 120]}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      contentStyle={{ backgroundColor: "#0D1117", border: "1px solid #30363D", borderRadius: "10px" }}
                      formatter={(val: number) => [`${val.toFixed(2)}`, "Eficiencia"]}
                    />
                    <Bar dataKey="efficiency" radius={[6, 6, 2, 2]} maxBarSize={45}>
                      {sprint.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla de Rankings - 60% Width en LG, Compacta en Móvil */}
            <div className="lg:col-span-3 bg-[#161B22] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#0D1117] border-b border-slate-800">
                    <tr>
                      {["Puesto", "Desarrollador", "H. Ejecución", "Puntos", "Eficiencia"].map((h) => (
                        <th key={h} className="px-3 py-3 lg:px-6 lg:py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {/* PADDINGS Y TEXTO COMPACTADO EN CUERPO DE TABLA */}
                  <tbody className="divide-y divide-slate-800/50 text-center">
                    {sprint.data.map((dev, index) => {
                      const position = index + 1;
                      return (
                        <tr key={dev.name} className="hover:bg-slate-800/20 transition-all group">
                          <td className="px-3 py-3 lg:px-6 lg:py-5 whitespace-nowrap">
                            {medals[position] ? (
                              <span className="text-xl lg:text-2xl drop-shadow-md">{medals[position]}</span>
                            ) : (
                              <span className="text-[11px] lg:text-xs font-bold text-slate-600 bg-slate-900/50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded border border-slate-800">
                                #{position}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 lg:px-6 lg:py-5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5 lg:gap-3">
                              <div className="flex-shrink-0 w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: dev.color }} />
                              <span className="text-xs lg:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {dev.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 lg:px-6 lg:py-5 text-xs lg:text-sm font-medium text-slate-400 whitespace-nowrap">
                            {dev.hours.toFixed(2)} h
                          </td>
                          <td className="px-3 py-3 lg:px-6 lg:py-5 text-xs lg:text-sm font-medium text-slate-400 whitespace-nowrap">
                            {dev.points.toFixed(2)} pts
                          </td>
                          <td className="px-3 py-3 lg:px-6 lg:py-5 whitespace-nowrap">
                            <span className="text-xs lg:text-sm font-black text-white bg-slate-900 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-slate-700 shadow-inner group-hover:border-emerald-500/50 transition-all">
                              {dev.efficiency.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      ))}

    </div>
  );
}
