"use client";


import { Calendar } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";

export default function InterviewsClient() {

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Interviews</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule and manage upcoming interviews with your top candidates.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <Calendar size={28} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No upcoming interviews</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">Your calendar is currently clear. Move candidates to the &quot;Interviewing&quot; stage to schedule meetings.</p>
        </div>
      </main>
    </div>
  );
}