"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const loginRes = await authApi.login({ phone, password });
      localStorage.setItem("access_token", loginRes.data.access_token);
      localStorage.setItem("refresh_token", loginRes.data.refresh_token);
      const meRes = await authApi.me();
      setSession(meRes.data, loginRes.data.access_token, loginRes.data.refresh_token);
      if (meRes.data.role === "super_admin") router.push("/super-admin/dashboard");
      else if (meRes.data.admin_flag) router.push("/admin/dashboard");
      else router.push("/manager/dashboard");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(79,70,229,0.18),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(79,70,229,0.14),transparent_30%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_80px_rgba(15,23,42,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-[linear-gradient(160deg,rgba(79,70,229,0.96),rgba(67,56,202,0.86))] p-10 text-white lg:flex lg:flex-col lg:justify-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight">Professional Real Estate CRM</h1>
            <p className="mt-3 text-sm text-indigo-100">Track inventory, close deals faster, and keep your team aligned in one premium workspace.</p>
            <p className="mt-2 text-sm font-semibold text-indigo-50">Because Your Data Deserves Better than a File.</p>
            <p className="mt-1 text-sm text-indigo-100">Safe, Searchable, Digital: Burn the Paper and Build Your Business.</p>
          </div>
          <div className="mt-6 space-y-3 text-sm text-indigo-100">
            <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Inventory, customers, and deals in one command center.</p>
            <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Built for Pakistan market workflows and pricing context.</p>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-8">
          <Card className="mx-auto w-full max-w-md border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <CardHeader className="px-5 pt-5">
              <div className="mb-2 flex justify-center lg:justify-start">
                <Image src="/brand-logo.png" alt="Property Baba logo" width={64} height={64} className="rounded-xl ring-1 ring-[var(--border)]" />
              </div>
              <CardTitle className="text-center text-2xl lg:text-left">Login to Property Baba</CardTitle>
              <p className="text-center text-sm text-[var(--muted)] lg:text-left">Smart Real Estate CRM for modern teams</p>
              <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)] lg:text-left">Burn the Paper, Start Digital</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <form onSubmit={onSubmit} className="space-y-4">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" required />
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required />
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <Button disabled={loading} className="w-full">
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
                <p className="text-sm text-[var(--muted)]">
                  New user?{" "}
                  <Link href="/register" className="font-medium text-[var(--accent)] underline-offset-4 hover:underline">
                    Register
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
