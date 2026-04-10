import React from 'react';

export default function StatsCard({ title, value, icon, trend, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-50 text-[#1B3A6B]",
    gold: "bg-amber-50 text-[#C9A84C]",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600"
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-6 hover:shadow-md transition-shadow">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colorMap[color]}`}>
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline space-x-2">
          <h3 className="text-3xl font-black text-slate-800">{value}</h3>
          {trend && (
            <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-green-500' : 'text-slate-400'}`}>
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
