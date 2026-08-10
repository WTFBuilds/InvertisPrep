"use client";

import { useEffect, useState } from "react";
import { HandCoins, ScanLine, ShieldCheck, Users, ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { sponsorApi } from "@/lib/api";
import type { Sponsor, SponsorTier } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import SponsorDialog from "@/components/SponsorDialog";

type TierMeta = { label: string; badge: string; ring: string; icon: string };

const TIER_META: Record<SponsorTier, TierMeta> = {
  supporter: { label: "Supporter", badge: "border-neutral-200 bg-neutral-50 text-neutral-600", ring: "ring-neutral-200", icon: "bg-neutral-100" },
  benefactor: { label: "Benefactor", badge: "border-neutral-300 bg-neutral-100 text-neutral-800", ring: "ring-neutral-300", icon: "bg-neutral-200" },
  patron: { label: "Patron", badge: "border-neutral-900 bg-neutral-900 text-white", ring: "ring-neutral-900", icon: "bg-neutral-900" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function SponsorPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    sponsorApi
      .getAll()
      .then((res) => {
        if (mounted) setSponsors(res.data || []);
      })
      .catch(() => {
        if (mounted) setSponsors([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const supporterCount = sponsors.length;

  return (
    <div className="min-h-screen bg-white">
      {/* ===================== Hero ===================== */}
      <section className="border-b border-neutral-200 px-4 pb-16 pt-24 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-6 rounded-full border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium tracking-wide text-neutral-600">
            Powered by our community
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
            Sponsor InvertisPrep
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            InvertisPrep is free for every student — notes, previous year papers
            and resources, no paywalls. Your sponsorship keeps it that way.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => setDialogOpen(true)}
              className="w-full rounded-full bg-neutral-900 px-8 text-white shadow-sm hover:bg-neutral-800 sm:w-auto"
            >
              <ScanLine className="mr-2 h-4 w-4" /> Sponsor via UPI
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full rounded-full border-neutral-300 bg-white px-8 text-neutral-800 shadow-sm hover:bg-neutral-50 sm:w-auto"
            >
              <Link href="#sponsors">
                See our sponsors <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-700">
              <ShieldCheck className="h-3.5 w-3.5" /> 100% Secure
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-700">
              Paytm · GPay · PhonePe
            </span>
          </div>
        </div>
      </section>

      {/* ===================== Stats ===================== */}
      <section className="border-b border-neutral-200 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
          {[
            { icon: Users, value: String(supporterCount), label: "Total sponsors" },
            { icon: HandCoins, value: "100%", label: "Goes back to students" },
            { icon: ShieldCheck, value: "Free", label: "Resources for everyone" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1.5 bg-white p-8 text-center">
              <stat.icon className="mb-1 h-5 w-5 text-neutral-400" />
              <span className="text-3xl font-bold text-neutral-900">{stat.value}</span>
              <span className="text-sm text-neutral-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== Sponsor wall ===================== */}
      <section id="sponsors" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Our sponsors & supporters
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-neutral-500 sm:text-base">
              A heartfelt thank you to every student, alumni and well-wisher
              who has sponsored InvertisPrep.
            </p>
          </div>

          <div className="mt-10">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50" />
                ))}
              </div>
            ) : sponsors.length === 0 ? (
              <Card className="rounded-2xl border-dashed border-neutral-200 bg-neutral-50/60">
                <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                  <HandCoins className="h-8 w-8 text-neutral-300" />
                  <p className="font-semibold text-neutral-800">Be the first sponsor</p>
                  <p className="text-sm text-neutral-500">
                    Scan the QR and your name will appear here.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    className="mt-3 rounded-full bg-neutral-900 text-white shadow-sm hover:bg-neutral-800"
                  >
                    <ScanLine className="mr-1.5 h-4 w-4" /> Sponsor now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sponsors.map((sponsor) => {
                  const tier = TIER_META[sponsor.tier] ?? TIER_META.supporter;
                  return (
                    <Card
                      key={sponsor._id}
                      className="rounded-2xl border-neutral-200 p-5 shadow-sm transition-colors hover:border-neutral-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${tier.icon} ring-1 ${tier.ring}`}>
                          <span
                            className={`text-sm font-bold ${
                              sponsor.tier === "patron" ? "text-white" : "text-neutral-700"
                            }`}
                          >
                            {getInitials(sponsor.name)}
                          </span>
                        </div>
                        <Badge className={`rounded-full border ${tier.badge}`}>{tier.label}</Badge>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-neutral-900">{sponsor.name}</h3>
                          {sponsor.isFeatured && (
                            <BadgeCheck className="h-4 w-4 text-neutral-400" />
                          )}
                        </div>
                        {sponsor.batch && (
                          <p className="text-xs font-medium text-neutral-400">
                            {sponsor.batch}
                          </p>
                        )}
                      </div>
                      {sponsor.message && (
                        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                          "{sponsor.message}"
                        </p>
                      )}
                      {sponsor.amount > 0 && (
                        <p className="mt-3 text-xs font-semibold text-neutral-400">
                          ₹{sponsor.amount.toLocaleString("en-IN")} contributed
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================== Bottom CTA ===================== */}
      <section className="border-t border-neutral-200 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Help us keep it free, forever.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-neutral-600 sm:text-base">
              Even a small contribution goes a long way. Scan, sponsor, and
              join the wall of supporters keeping InvertisPrep ad-free.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => setDialogOpen(true)}
                className="w-full rounded-full bg-neutral-900 px-8 text-white shadow-sm hover:bg-neutral-800 sm:w-auto"
              >
                <ScanLine className="mr-2 h-4 w-4" /> Sponsor now
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full rounded-full border-neutral-300 bg-white px-8 text-neutral-800 shadow-sm hover:bg-neutral-50 sm:w-auto"
              >
                <Link href="/contact">Talk to the team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SponsorDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}