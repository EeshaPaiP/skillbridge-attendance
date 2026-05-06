"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Users, School, BarChart3, ShieldCheck, Loader2 } from "lucide-react";

const roles = [
  { value: "student", label: "Student", icon: <GraduationCap className="w-5 h-5" /> },
  { value: "trainer", label: "Trainer", icon: <Users className="w-5 h-5" /> },
  { value: "institution", label: "Institution", icon: <School className="w-5 h-5" /> },
  { value: "manager", label: "Manager", icon: <BarChart3 className="w-5 h-5" /> },
  { value: "officer", label: "Officer", icon: <ShieldCheck className="w-5 h-5" /> },
];

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const signInHref = callbackUrl === "/dashboard" ? "/sign-in" : `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "student" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.fullName, // Mapping fullName to 'name' for Neon Auth compatibility
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.message || data.error || JSON.stringify(data) || "Signup failed. Check if user already exists.";
        throw new Error(errorText);
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="text-xl font-bold tracking-tight">SkillBridge</span>
        </div>
        <Link href={signInHref} className="text-sm font-medium hover:text-blue-600 transition-colors">Log in</Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          <div className="p-10 bg-blue-600 text-white flex flex-col justify-center">
            <h1 className="text-3xl font-extrabold mb-4">Create Account</h1>
            <p className="text-blue-100 mb-8">Join the SkillBridge attendance prototype.</p>
            <div className="space-y-4">
              {roles.map((r) => (
                <div key={r.value} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${form.role === r.value ? 'bg-white/20 ring-1 ring-white/50' : 'opacity-60'}`}>
                  {r.icon} <span className="text-sm font-medium">{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl">{error}</div>}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Full Name</label>
                <input name="fullName" type="text" required value={form.fullName} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="name" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Email Address</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="name@company.com" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Password</label>
                <input name="password" type="password" required value={form.password} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Select Role</label>
                <select name="role" value={form.role} onChange={handleChange} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-sm outline-none">
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <button disabled={loading} className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign Up"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
