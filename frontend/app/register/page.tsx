"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await authApi.register({ name, phone, email: email || undefined, password });
      setMessage("Registered successfully. Wait for super admin approval.");
      setTimeout(() => router.push("/login"), 1000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(79,70,229,0.17),transparent_36%),radial-gradient(circle_at_85%_10%,rgba(79,70,229,0.14),transparent_32%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_80px_rgba(15,23,42,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-[linear-gradient(160deg,rgba(79,70,229,0.96),rgba(67,56,202,0.86))] p-10 text-white lg:flex lg:flex-col lg:justify-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight">Professional Real Estate CRM</h1>
            <p className="mt-3 text-sm text-indigo-100">Set up your real-estate workspace and start managing inventory, leads, and deals in one place.</p>
            <p className="mt-2 text-sm font-semibold text-indigo-50">Because Your Data Deserves Better than a File.</p>
            <p className="mt-1 text-sm text-indigo-100">Safe, Searchable, Digital: Burn the Paper and Build Your Business.</p>
          </div>
          <div className="mt-6 space-y-3 text-sm text-indigo-100">
            <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Unified customer and property workflows.</p>
            <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Premium analytics and action-focused dashboards.</p>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-8">
          <Card className="mx-auto w-full max-w-md border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <CardHeader className="px-5 pt-5">
              <div className="mb-2 flex justify-center lg:justify-start">
                <Image src="/brand-logo.png" alt="Property Baba logo" width={64} height={64} className="rounded-xl ring-1 ring-[var(--border)]" />
              </div>
              <CardTitle className="text-center text-2xl lg:text-left">Create Property Baba Account</CardTitle>
              <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)] lg:text-left">Burn the Paper, Start Digital</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <form onSubmit={onSubmit} className="space-y-4">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" required />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" />
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required />
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                {message ? <p className="text-sm text-green-600">{message}</p> : null}
                <Button disabled={loading} className="w-full">
                  {loading ? "Registering..." : "Register"}
                </Button>
                <p className="text-sm text-[var(--muted)]">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-[var(--accent)] underline-offset-4 hover:underline">
                    Login
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
