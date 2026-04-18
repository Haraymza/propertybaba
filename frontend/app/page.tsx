"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(79,70,229,0.17),transparent_36%),radial-gradient(circle_at_90%_10%,rgba(79,70,229,0.13),transparent_32%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_80px_rgba(15,23,42,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-[linear-gradient(160deg,rgba(79,70,229,0.96),rgba(67,56,202,0.86))] p-10 text-white lg:flex lg:flex-col lg:justify-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight">Professional Real Estate CRM</h1>
            <p className="mt-3 text-sm text-indigo-100">From inventory to deals, run your entire team with speed, clarity, and premium UX.</p>
            <p className="mt-2 text-sm font-semibold text-indigo-50">Because Your Data Deserves Better than a File.</p>
            <p className="mt-1 text-sm text-indigo-100">Safe, Searchable, Digital: Burn the Paper and Build Your Business.</p>
          </div>
          <div className="mt-6 space-y-3 text-sm text-indigo-100">
            <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Manage customers, properties, and deals in one command center.</p>
            <p className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Built for high-velocity teams in the Pakistan market.</p>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-8">
          <Card className="mx-auto w-full max-w-md border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <CardHeader className="px-5 pt-5">
              <div className="mb-2 flex justify-center lg:justify-start">
                <Image src="/brand-logo.png" alt="Property Baba logo" width={64} height={64} className="rounded-xl ring-1 ring-[var(--border)]" />
              </div>
              <CardTitle className="text-center text-3xl lg:text-left">Property Baba</CardTitle>
              <p className="text-center text-sm text-[var(--muted)] lg:text-left">Professional invite-only CRM for real estate teams.</p>
              <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)] lg:text-left">Burn the Paper, Start Digital</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {!isAuthenticated ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/login" className="flex-1">
                    <Button className="w-full">Login</Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button variant="secondary" className="w-full">Register</Button>
                  </Link>
                </div>
              ) : user?.role === "super_admin" ? (
                <Link href="/super-admin/dashboard">
                  <Button className="w-full justify-between">
                    Go to Super Admin Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : user?.admin_flag ? (
                <Link href="/admin/dashboard">
                  <Button className="w-full justify-between">
                    Go to Admin Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/manager/dashboard">
                  <Button className="w-full justify-between">
                    Go to Manager Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
