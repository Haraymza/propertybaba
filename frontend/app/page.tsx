"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Building2,
  CircleUserRound,
  Cpu,
  CheckCircle2,
  Handshake,
  MessageCircle,
  ScanSearch,
  ShieldCheck,
  Sun,
  Moon,
  Sparkles,
  TabletSmartphone,
  TrendingUp,
  Users,
  Waypoints,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import LogoPB from "../LogoPB.png";

const featureCards = [
  {
    icon: Users,
    title: "Customer Intelligence",
    description: "Track buyer intent, family needs, and follow-up notes in one clear profile timeline.",
  },
  {
    icon: Building2,
    title: "Listing Progress",
    description: "Move listings from lead to closed with status clarity your whole team can trust.",
  },
  {
    icon: Handshake,
    title: "Deal Ownership",
    description: "Assign deals, define accountability, and remove duplicate effort between team members.",
  },
  {
    icon: TrendingUp,
    title: "Revenue Confidence",
    description: "Understand gross revenue, net margin, and commissions without spreadsheet chaos.",
  },
  {
    icon: ShieldCheck,
    title: "Role Permissions",
    description: "Protect sensitive records with secure role-based access across every workspace.",
  },
  {
    icon: Zap,
    title: "Search in Seconds",
    description: "Find properties, customers, and deal history instantly by name, phone, or location.",
  },
];

const workflow = [
  { title: "Capture", description: "Bring every inquiry and customer detail into one structured profile.", icon: CircleUserRound },
  { title: "Match", description: "Pair buyers with relevant listings based on budget, type, and urgency.", icon: ScanSearch },
  { title: "Collaborate", description: "Assign agents, update statuses, and keep decision context visible.", icon: Waypoints },
  { title: "Close", description: "Track commissions and profitability as each deal moves to completion.", icon: TrendingUp },
];

function FadeUp({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuthStore();
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const savedTheme = window.localStorage.getItem("landing-theme");
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  });
  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  const smoothX = useSpring(parallaxX, { stiffness: 75, damping: 18, mass: 0.7 });
  const smoothY = useSpring(parallaxY, { stiffness: 75, damping: 18, mass: 0.7 });
  const isLight = theme === "light";

  const dashboardHref = user?.role === "super_admin" ? "/super-admin/dashboard" : user?.admin_flag ? "/admin/dashboard" : "/manager/dashboard";

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem("landing-theme", next);
      return next;
    });
  };

  return (
    <main
      className={`relative min-h-screen overflow-hidden text-slate-100 ${
        theme === "dark"
          ? "bg-[linear-gradient(180deg,#050c1b_0%,#071227_38%,#09142a_100%),radial-gradient(circle_at_16%_0%,rgba(99,102,241,0.28),transparent_34%),radial-gradient(circle_at_92%_14%,rgba(6,182,212,0.2),transparent_36%),radial-gradient(circle_at_50%_88%,rgba(168,85,247,0.12),transparent_46%)] theme-dark"
          : "bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_40%,#eef5ff_100%),radial-gradient(circle_at_16%_0%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_92%_14%,rgba(14,165,233,0.14),transparent_36%),radial-gradient(circle_at_50%_88%,rgba(168,85,247,0.08),transparent_46%)] theme-light"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(71,85,105,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.16)_1px,transparent_1px)] [background-size:40px_40px]" />
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${isLight ? "border-slate-300/70 bg-white/85" : "border-slate-800/80 bg-slate-950/50"}`}>
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-3">
            <Image src={LogoPB} alt="Property Baba logo" width={54} height={54} className="object-contain" />
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${isLight ? "text-sky-700" : "text-cyan-200/70"}`}>Property Baba</p>
              <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Real Estate CRM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={toggleTheme}
              className={`gap-2 ${isLight ? "border-slate-300 bg-white text-slate-700" : "border-slate-700 bg-slate-900 text-slate-100"}`}
              aria-label="Toggle light dark theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            {isAuthenticated ? (
              <Link href={dashboardHref}>
                <Button variant="secondary" className={`gap-2 ${isLight ? "border-slate-300 bg-white text-slate-700" : "border-slate-700 bg-slate-900 text-slate-100"}`}>
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
            <Link href="/login">
              <Button className="bg-[linear-gradient(120deg,#4f46e5,#2563eb)] text-white shadow-[0_0_22px_rgba(37,99,235,0.42)] hover:brightness-110">Login</Button>
            </Link>
          </div>
        </div>
        <div className="bg-transparent py-2">
          <div className="mx-auto w-full max-w-7xl overflow-hidden px-5 md:px-8">
            <div className="marquee-wrap">
              <div className={`marquee-track whitespace-nowrap text-xs font-semibold uppercase tracking-[0.1em] ${isLight ? "text-slate-500" : "text-cyan-100/55"}`}>
                Fast customer search • Smart property matching • Commission clarity • Team dashboards • Burn the paper, start digital •
              </div>
              <div className={`marquee-track whitespace-nowrap text-xs font-semibold uppercase tracking-[0.1em] ${isLight ? "text-slate-500" : "text-cyan-100/55"}`} aria-hidden="true">
                Fast customer search • Smart property matching • Commission clarity • Team dashboards • Burn the paper, start digital •
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pb-24 pt-16 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-14 lg:pt-24">
        <FadeUp>
          <div className="space-y-8">
            <p className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] backdrop-blur ${isLight ? "border-sky-300/60 bg-white/90 text-sky-700" : "border-cyan-300/20 bg-slate-900/55 text-cyan-200"}`}>
              <Sparkles className="h-3.5 w-3.5" />
              Built for ambitious real estate teams
            </p>
            <div className="space-y-5">
              <h1 className={`max-w-2xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl ${isLight ? "text-slate-900" : "text-white"}`}>
                The modern operating system for fast-moving property businesses.
              </h1>
              <p className={`max-w-xl text-lg leading-relaxed md:text-xl ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                Property Baba unifies customer intelligence, listings, team workflows, and commission visibility so your business closes
                better deals with confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="#contact-section">
                <Button className="group gap-2 bg-[linear-gradient(110deg,#0ea5e9,#2563eb)] px-6 py-5 text-sm text-white shadow-[0_0_28px_rgba(14,165,233,0.5)] transition hover:translate-y-[-1px] hover:shadow-[0_0_34px_rgba(37,99,235,0.65)]">
                  Start Your Free Month
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </a>
              <a href="#features-section">
                <Button
                  variant="secondary"
                  className={`px-6 py-5 text-sm ${isLight ? "border border-slate-300 bg-white text-slate-700" : "border border-slate-700 bg-slate-900/75 text-slate-100"}`}
                >
                  Explore Platform
                </Button>
              </a>
            </div>
            <div className={`flex flex-wrap gap-5 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                First month free
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                Guided team onboarding
              </p>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div
            className="relative h-[350px] w-full md:h-[430px]"
            onMouseMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const px = (event.clientX - bounds.left) / bounds.width - 0.5;
              const py = (event.clientY - bounds.top) / bounds.height - 0.5;
              parallaxX.set(px * 14);
              parallaxY.set(py * 12);
            }}
            onMouseLeave={() => {
              parallaxX.set(0);
              parallaxY.set(0);
            }}
          >
            <div className="pointer-events-none absolute -right-4 top-8 h-44 w-44 rounded-full bg-[rgba(99,102,241,0.36)] blur-3xl" />
            <div className="pointer-events-none absolute -left-6 bottom-4 h-44 w-44 rounded-full bg-[rgba(6,182,212,0.32)] blur-3xl" />
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_76%_22%,rgba(129,140,248,0.22),transparent_42%),radial-gradient(circle_at_18%_80%,rgba(56,189,248,0.18),transparent_46%)]" />
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] [background-image:linear-gradient(rgba(71,85,105,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.22)_1px,transparent_1px)] [background-size:26px_26px]" />
            <div className="pointer-events-none absolute left-[14%] top-[12%] h-px w-[72%] bg-[linear-gradient(90deg,rgba(34,211,238,0.45),transparent)]" />
            <div className="pointer-events-none absolute left-[20%] top-[56%] h-px w-[64%] bg-[linear-gradient(90deg,rgba(167,139,250,0.52),transparent)]" />
            <div className="pointer-events-none absolute left-[64%] top-[18%] h-[44%] w-px bg-[linear-gradient(180deg,rgba(34,211,238,0.45),transparent)]" />

            <motion.div style={{ x: smoothX, y: smoothY }} className="absolute inset-0">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute left-[6%] top-[22%] w-[55%] rounded-3xl border p-4 backdrop-blur-xl ${
                  isLight
                    ? "border-sky-300/60 bg-white/88 shadow-[0_18px_34px_rgba(37,99,235,0.15)]"
                    : "border-cyan-300/35 bg-slate-900/60 shadow-[0_22px_50px_rgba(6,182,212,0.15)]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-2 w-20 rounded-full bg-[linear-gradient(90deg,#22d3ee,#3b82f6)]" />
                  <Cpu className="h-4 w-4 text-cyan-300" />
                </div>
                <div className="space-y-2">
                  <div className={`h-2.5 w-full rounded-full ${isLight ? "bg-slate-300/75" : "bg-slate-500/55"}`} />
                  <div className={`h-2.5 w-4/5 rounded-full ${isLight ? "bg-slate-300/70" : "bg-slate-500/50"}`} />
                  <div className={`h-2.5 w-3/5 rounded-full ${isLight ? "bg-slate-300/65" : "bg-slate-500/45"}`} />
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute right-[8%] top-[10%] w-[48%] rounded-3xl border p-4 backdrop-blur-xl ${
                  isLight
                    ? "border-indigo-300/60 bg-white/88 shadow-[0_18px_34px_rgba(79,70,229,0.15)]"
                    : "border-purple-300/35 bg-slate-900/62 shadow-[0_24px_42px_rgba(168,85,247,0.24)]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className={`h-2.5 w-16 rounded-full ${isLight ? "bg-slate-300/80" : "bg-slate-400/60"}`} />
                  <div className="h-2.5 w-10 rounded-full bg-cyan-300/80" />
                </div>
                <div className="flex items-end gap-2">
                  {[22, 34, 28, 42, 30].map((h, i) => (
                    <div key={i} className="w-full rounded-md bg-[linear-gradient(180deg,rgba(34,211,238,0.9),rgba(99,102,241,0.72))]" style={{ height: `${h}px` }} />
                  ))}
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute bottom-[8%] right-[14%] w-[62%] rounded-3xl border p-5 backdrop-blur-xl md:w-[58%] ${
                  isLight
                    ? "border-sky-300/60 bg-white/90 shadow-[0_18px_34px_rgba(14,165,233,0.15)]"
                    : "border-cyan-200/30 bg-slate-900/58 shadow-[0_24px_50px_rgba(56,189,248,0.18)]"
                }`}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${isLight ? "text-sky-600" : "text-cyan-300"}`} />
                  <div className={`h-2.5 w-24 rounded-full ${isLight ? "bg-slate-300/80" : "bg-slate-400/65"}`} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 rounded-xl bg-[linear-gradient(150deg,rgba(129,140,248,0.6),rgba(34,211,238,0.5))]" />
                  <div className={`h-12 rounded-xl ${isLight ? "bg-slate-200/95" : "bg-slate-600/45"}`} />
                  <div className={`h-12 rounded-xl ${isLight ? "bg-slate-200/85" : "bg-slate-600/40"}`} />
                </div>
              </motion.div>

            </motion.div>

            <div className="pointer-events-none absolute inset-x-[6%] bottom-[12%] h-20 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.28),transparent_68%)] blur-xl" />
          </div>
        </FadeUp>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-24 md:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          <FadeUp>
                  <div className={`rounded-3xl border p-6 md:p-7 ${isLight ? "border-slate-300 bg-white shadow-[0_12px_34px_rgba(37,99,235,0.08)]" : "border-fuchsia-400/30 bg-slate-900/50 shadow-[0_0_36px_rgba(168,85,247,0.25)]"}`}>
                  <div className="relative">
                    <div
                      className={`absolute -right-2 -top-11 z-10 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-lg ${
                        isLight
                          ? "border border-amber-300 bg-[linear-gradient(120deg,#fef3c7,#fde68a)] text-amber-800"
                          : "border border-fuchsia-300/70 bg-[linear-gradient(120deg,#22d3ee,#a855f7)] text-white shadow-[0_0_18px_rgba(168,85,247,0.55)]"
                      }`}
                    >
                      Limited Offer
                    </div>
                  </div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${isLight ? "text-sky-700" : "text-cyan-200"}`}>Offer</p>
              <h3 className="mt-2 text-2xl font-semibold md:text-3xl">Start your first month for free</h3>
                    <p className={`mt-3 text-sm leading-relaxed md:text-base ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                No setup surprises, no hidden costs. Start fast, onboard your team, and feel measurable workflow clarity in your first
                weeks.
              </p>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
                  <div className={`rounded-3xl border p-6 md:p-7 ${isLight ? "border-slate-300 bg-white shadow-[0_12px_34px_rgba(37,99,235,0.08)]" : "border-cyan-400/35 bg-slate-900/50 shadow-[0_0_38px_rgba(6,182,212,0.24)]"}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${isLight ? "text-sky-700" : "text-cyan-200"}`}>Onboarding</p>
              <h3 className="mt-2 text-2xl font-semibold md:text-3xl">Fast team onboarding and setup</h3>
                    <p className={`mt-3 text-sm leading-relaxed md:text-base ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                We configure your workspace, roles, and data structure so your team starts with confidence from day one.
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      <section
        id="features-section"
        className={`mx-auto w-full max-w-7xl rounded-[2rem] border px-5 py-14 md:px-8 md:py-16 ${
          isLight
            ? "border-slate-300 bg-[linear-gradient(160deg,#ffffff,#eff6ff)] shadow-[0_18px_50px_rgba(30,64,175,0.08)]"
            : "border-slate-700/80 bg-[linear-gradient(155deg,rgba(15,23,42,0.9),rgba(17,24,39,0.8))] shadow-[0_20px_60px_rgba(2,6,23,0.5)]"
        }`}
      >
        <FadeUp>
          <p className={`text-sm font-semibold uppercase tracking-[0.12em] ${isLight ? "text-sky-700" : "text-cyan-200"}`}>Features</p>
          <h2 className={`mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl ${isLight ? "text-slate-900" : "text-white"}`}>Tools your team uses every day</h2>
          <p className={`mt-3 max-w-3xl text-base leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            Every touchpoint of your sales flow is connected, from first inquiry to final commission payout.
          </p>
        </FadeUp>
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <FadeUp delay={0.02}>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className={`group relative overflow-hidden rounded-3xl border p-6 md:p-7 ${
                isLight
                  ? "border-slate-300 bg-white shadow-[0_16px_34px_rgba(30,64,175,0.12)]"
                  : "border-slate-600/70 bg-slate-900/65 shadow-[0_22px_44px_rgba(2,6,23,0.45)]"
              }`}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_90%_8%,rgba(34,211,238,0.2),transparent_38%)]" />
              <div className="relative flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">Featured Capability</p>
                  <h3 className="mt-3 max-w-md text-2xl font-semibold tracking-tight text-white md:text-3xl">All your key features in one place</h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300 md:text-base">
                    Manage customer insights, pipeline tracking, assignment control, and revenue visibility in one connected product surface.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="rounded-2xl bg-[linear-gradient(140deg,#06b6d4,#3b82f6)] p-3 text-white shadow-[0_0_22px_rgba(34,211,238,0.45)]">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div
                className={`relative mt-6 overflow-hidden rounded-2xl border p-4 ${
                  isLight
                    ? "border-sky-200/70 bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))]"
                    : "border-cyan-300/25 bg-[linear-gradient(165deg,rgba(6,182,212,0.18),rgba(99,102,241,0.14))]"
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 ${
                    isLight
                      ? "bg-[radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.08),transparent_42%)]"
                      : "[background-image:linear-gradient(rgba(71,85,105,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.22)_1px,transparent_1px)] [background-size:22px_22px]"
                  }`}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.05)]" : "border-cyan-300/30 bg-slate-900/60"}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">Customer Insights</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Users className={`h-4 w-4 ${isLight ? "text-sky-500" : "text-cyan-300"}`} />
                      <div className={`h-2 w-24 rounded-full ${isLight ? "bg-slate-300/80" : "bg-slate-400/55"}`} />
                    </div>
                  </div>
                  <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.05)]" : "border-fuchsia-300/25 bg-slate-900/60"}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">Property Matching</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Building2 className={`h-4 w-4 ${isLight ? "text-sky-500" : "text-cyan-300"}`} />
                      <div className={`h-2 w-20 rounded-full ${isLight ? "bg-slate-300/80" : "bg-slate-400/55"}`} />
                    </div>
                  </div>
                  <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.05)]" : "border-cyan-300/30 bg-slate-900/60"}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">Deal Assignment</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Handshake className={`h-4 w-4 ${isLight ? "text-sky-500" : "text-cyan-300"}`} />
                      <div className={`h-2 w-24 rounded-full ${isLight ? "bg-slate-300/80" : "bg-slate-400/55"}`} />
                    </div>
                  </div>
                  <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.05)]" : "border-fuchsia-300/25 bg-slate-900/60"}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200">Revenue Tracking</p>
                    <div className="mt-2 flex items-center gap-2">
                      <TrendingUp className={`h-4 w-4 ${isLight ? "text-sky-500" : "text-cyan-300"}`} />
                      <div className={`h-2 w-20 rounded-full ${isLight ? "bg-slate-300/80" : "bg-slate-400/55"}`} />
                    </div>
                  </div>
                </div>
                <div className={`mt-4 h-1.5 rounded-full ${isLight ? "bg-[linear-gradient(90deg,#7dd3fc,#93c5fd,#c4b5fd)] opacity-80" : "bg-[linear-gradient(90deg,rgba(34,211,238,0.75),rgba(99,102,241,0.75),rgba(168,85,247,0.75))]"}`} />
              </div>
            </motion.div>
          </FadeUp>

          <div className="grid gap-4">
            {featureCards.slice(1, 5).map((feature, idx) => (
              <FadeUp key={feature.title} delay={0.04 + idx * 0.05}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.005 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20 }}
                  className={`group relative rounded-2xl border p-5 ${
                    isLight
                      ? "border-slate-300 bg-white shadow-[0_10px_24px_rgba(30,64,175,0.1)]"
                      : "border-slate-600/70 bg-slate-900/70 shadow-[0_10px_22px_rgba(2,6,23,0.46)]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(140deg,rgba(99,102,241,0.14),rgba(56,189,248,0.1))]" />
                  <div className="relative flex items-start gap-3">
                    <div className="inline-flex rounded-full bg-[linear-gradient(135deg,rgba(6,182,212,0.24),rgba(99,102,241,0.26))] p-2.5 text-cyan-200">
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{feature.title}</p>
                      <p className={`mt-1 text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow-section" className={`mx-auto mt-12 w-full max-w-7xl rounded-[2rem] border px-5 pb-16 pt-14 md:px-8 md:pt-16 ${
        isLight
          ? "border-slate-300 bg-[linear-gradient(180deg,#ffffff,#eff6ff)] shadow-[0_16px_42px_rgba(30,64,175,0.08)]"
          : "border-slate-700/80 bg-[linear-gradient(180deg,rgba(10,20,38,0.95),rgba(12,28,50,0.86))] shadow-[0_16px_50px_rgba(2,6,23,0.5)]"
      }`}>
        <FadeUp>
          <p className={`text-sm font-semibold uppercase tracking-[0.12em] ${isLight ? "text-sky-700" : "text-cyan-200"}`}>Workflow</p>
          <h2 className={`mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl ${isLight ? "text-slate-900" : "text-white"}`}>A simple flow your team can execute every day</h2>
          <p className={`mt-3 max-w-2xl text-sm leading-relaxed md:text-base ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            One connected path from first inquiry to final payout, designed to keep teams aligned and fast.
          </p>
        </FadeUp>
        <div className="relative mt-12 grid gap-4 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 -top-2 hidden h-[3px] rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.3),rgba(99,102,241,0.62),rgba(168,85,247,0.38))] lg:block" />
          <motion.div
            className="pointer-events-none absolute left-0 -top-3 hidden h-5 w-24 rounded-full bg-[linear-gradient(90deg,rgba(56,189,248,0),rgba(56,189,248,0.65),rgba(56,189,248,0))] blur-md lg:block"
            animate={{ x: ["0%", "390%", "0%"] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {workflow.map((item, idx) => (
            <FadeUp key={item.title} delay={idx * 0.07}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className={`group relative mb-4 rounded-2xl border p-5 lg:mb-0 ${
                    isLight
                      ? "border-slate-300 bg-white shadow-[0_10px_24px_rgba(30,64,175,0.1)]"
                      : "border-slate-600/80 bg-slate-900/68 shadow-[0_10px_24px_rgba(2,6,23,0.44)]"
                  }`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(140deg,#22d3ee,#6366f1)] text-sm font-semibold text-white shadow-[0_0_22px_rgba(34,211,238,0.5)]">
                    {idx + 1}
                    <span className="absolute inset-0 rounded-full bg-[rgba(34,211,238,0.35)] blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                  <item.icon className="h-4 w-4 text-cyan-300" />
                  <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(34,211,238,0.45),transparent)] lg:hidden" />
                </div>
                <p className="text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.description}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </section>

      <section id="contact-section" className="mx-auto mt-12 w-full max-w-7xl px-5 pb-20 md:mt-16 md:px-8">
        <FadeUp>
          <div className={`relative overflow-hidden rounded-3xl border p-8 md:p-10 ${
            isLight
              ? "border-slate-300 bg-[linear-gradient(130deg,#eaf2ff,#dbeafe_55%,#eef4ff)] text-slate-900 shadow-[0_20px_40px_rgba(30,64,175,0.12)]"
              : "border-[var(--border)] bg-[linear-gradient(130deg,#1e1b4b,#1e3a8a_55%,#0f172a)] text-white shadow-[0_20px_55px_rgba(15,23,42,0.32)]"
          }`}>
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 left-0 h-44 w-44 rounded-full bg-indigo-400/25 blur-2xl" />
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">Ready to scale your operation?</p>
                <p className="mt-2 max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">
                  Replace scattered notebooks with a CRM your whole team enjoys using.
                </p>
                <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                  Go live with Property Baba and build a faster, more accountable deal engine for your business.
                </p>
                <div className="mt-6">
                  <a href="https://wa.me/923301386966" target="_blank" rel="noreferrer">
                    <Button className="group gap-2 bg-[linear-gradient(120deg,#06b6d4,#2563eb)] px-6 text-white shadow-[0_0_30px_rgba(34,211,238,0.48)] transition hover:translate-y-[-1px] hover:shadow-[0_0_40px_rgba(37,99,235,0.65)]">
                      Book Your Onboarding
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex justify-start lg:justify-end">
                <div className="relative flex w-full max-w-[430px] items-center justify-between gap-6 p-1">
                  <div className="relative h-28 w-36">
                    <div className="absolute left-1 top-10 h-16 w-20 rotate-[-16deg] rounded-md border border-slate-500/45 bg-slate-100/90 shadow-lg" />
                    <div className="absolute left-6 top-6 h-16 w-20 rotate-[-12deg] rounded-md border border-slate-500/45 bg-slate-100/90 shadow-lg" />
                    <div className="absolute left-11 top-2 h-16 w-20 rotate-[-8deg] rounded-md border border-slate-500/45 bg-slate-100/90 shadow-lg" />
                    <p className={`absolute -bottom-3 left-8 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${isLight ? "bg-slate-100 text-slate-600" : "bg-slate-900/65 text-slate-200"}`}>
                      Old Files
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ArrowRight className={`h-7 w-7 ${isLight ? "text-sky-600" : "text-cyan-300"}`} />
                    <div className="h-px w-12 bg-[linear-gradient(90deg,rgba(34,211,238,0.9),rgba(99,102,241,0.8))]" />
                  </div>
                  <div
                    className={`relative h-28 w-44 rounded-xl border p-3 ${
                      isLight
                        ? "border-sky-300/50 bg-white shadow-[0_14px_28px_rgba(37,99,235,0.16)]"
                        : "border-cyan-300/45 bg-slate-900/80 shadow-[0_0_28px_rgba(34,211,238,0.45)]"
                    }`}
                  >
                    <div className="mb-2 h-2.5 w-20 rounded-full bg-cyan-300/60" />
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="h-11 rounded bg-[linear-gradient(180deg,#22d3ee,#6366f1)]" />
                      <div className={`h-11 rounded ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
                      <div className={`h-11 rounded ${isLight ? "bg-slate-200/80" : "bg-slate-700/80"}`} />
                    </div>
                    <TabletSmartphone className="absolute -right-2 -top-2 h-5 w-5 text-cyan-200" />
                    <p
                      className={`absolute -bottom-3 right-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                        isLight ? "bg-sky-100 text-sky-700" : "bg-cyan-400/15 text-cyan-100"
                      }`}
                    >
                      New Dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      <a
        href="https://wa.me/923301386966"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_0_35px_rgba(37,211,102,0.8),0_0_12px_rgba(37,211,102,0.9)] transition hover:translate-y-[-2px] hover:brightness-110"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
      <style jsx>{`
        .theme-light {
          color: #0f172a;
        }
        .theme-light header {
          border-color: rgba(148, 163, 184, 0.45) !important;
          background: rgba(255, 255, 255, 0.82) !important;
        }
        .theme-light .text-white {
          color: #0f172a !important;
        }
        .theme-light .text-slate-300 {
          color: #475569 !important;
        }
        .theme-light .text-slate-200 {
          color: #334155 !important;
        }
        .theme-light [class*="text-cyan-"] {
          color: #2563eb !important;
        }
        .theme-light [class*="bg-slate-950"] {
          background: rgba(255, 255, 255, 0.82) !important;
        }
        .theme-light [class*="bg-slate-900"] {
          background: rgba(255, 255, 255, 0.88) !important;
        }
        .theme-light [class*="border-slate-"] {
          border-color: rgba(148, 163, 184, 0.5) !important;
        }
        .theme-light #features-section,
        .theme-light #workflow-section {
          background: linear-gradient(165deg, rgba(255, 255, 255, 0.95), rgba(239, 246, 255, 0.92)) !important;
          border-color: rgba(148, 163, 184, 0.55) !important;
          box-shadow: 0 16px 50px rgba(37, 99, 235, 0.08) !important;
        }
        .theme-light #contact-section > div {
          background: linear-gradient(130deg, #e8f1ff, #dbeafe 55%, #f1f5ff) !important;
          border-color: rgba(59, 130, 246, 0.35) !important;
          color: #0f172a !important;
        }
        .theme-light .group.relative.rounded-2xl,
        .theme-light .group.relative.rounded-3xl {
          box-shadow: 0 10px 28px rgba(30, 64, 175, 0.09) !important;
        }
        .theme-light .marquee-track {
          color: #475569 !important;
        }
        .marquee-track {
          flex: 0 0 auto;
          min-width: max-content;
          padding-right: 2rem;
        }
        .marquee-wrap {
          display: flex;
          width: max-content;
          animation: marqueeMove 22s linear infinite;
        }
        @keyframes marqueeMove {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </main>
  );
}
