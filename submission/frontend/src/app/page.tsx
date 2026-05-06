import Link from "next/link";
import { GraduationCap, Users, School, BarChart3, ShieldCheck } from "lucide-react";

export default function Home() {
  const roles = [
    { name: "Student", icon: <GraduationCap className="w-6 h-6" />, desc: "Mark your attendance and track your sessions." },
    { name: "Trainer", icon: <Users className="w-6 h-6" />, desc: "Manage batches and create learning sessions." },
    { name: "Institution", icon: <School className="w-6 h-6" />, desc: "Oversee trainers and view batch performance." },
    { name: "Manager", icon: <BarChart3 className="w-6 h-6" />, desc: "Analyze programme data across all regions." },
    { name: "Officer", icon: <ShieldCheck className="w-6 h-6" />, desc: "Read-only access for programme monitoring." },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="text-xl font-bold tracking-tight">SkillBridge</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="px-4 py-2 text-sm font-medium hover:text-blue-600 transition-colors">
            Log in
          </Link>
          <Link href="/sign-up" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white mb-6">
          State-Level Attendance <br />
          <span className="text-blue-600">Management Made Simple</span>
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mb-12">
          A unified prototype for the SkillBridge programme. Secure, role-based access for students, 
          trainers, and administrators to track progress in real-time.
        </p>

        {/* Role Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
          {roles.map((role) => (
            <div key={role.name} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-left hover:shadow-md transition-shadow">
              <div className="w-10 h-10 text-blue-600 mb-4">{role.icon}</div>
              <h3 className="font-bold text-zinc-900 dark:text-white mb-2">{role.name}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{role.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
        <p>&copy; 2026 SkillBridge Programme • Built for Sustainable Living Lab Assignment</p>
      </footer>
    </div>
  );
}
