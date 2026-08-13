"use client";

import Image from "next/image";
import { HandCoins, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spotlight } from "@/components/ui/spotlight";
import { Badge } from "@/components/ui/badge";
import payhere from "@/assets/payhere.jpeg";

interface SponsorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SponsorDialog({ open, onOpenChange }: SponsorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-lg">
        {/* White + subtle gradient hero with Aceternity spotlight */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 px-6 pb-8 pt-8 sm:px-8">
          <Spotlight
            className="absolute inset-0"
            gradientFirst="radial-gradient(68.54% 68.72% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 50.11%)"
            gradientSecond="radial-gradient(50% 50% at 50% 50%, rgba(168,85,247,0.10) 0%, transparent 50.11%)"
            gradientThird="radial-gradient(80% 60% at 50% 0%, rgba(236,72,153,0.10) 0%, transparent 50%)"
          />
          <div className="relative flex items-start justify-between gap-4">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-slate-900 sm:text-2xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                  <HandCoins className="h-5 w-5 text-indigo-600" />
                </span>
                Sponsor InvertisPrep
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-slate-500 sm:text-base">
                Help us keep notes, papers and study resources free for every
                student at Invertis.
              </DialogDescription>
            </DialogHeader>
            <Badge className="shrink-0 border-indigo-100 bg-white text-indigo-600 shadow-sm">
              <Sparkles className="mr-1 h-3 w-3" /> UPI
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
          {/* QR card */}
          <div className="relative mx-auto max-w-[300px]">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 opacity-80 blur-xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-indigo-100/60 sm:p-5">
              <div className="flex items-center justify-center gap-1.5 pb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                <ScanLine className="h-3.5 w-3.5" /> Scan to sponsor
              </div>
              <div className="relative mx-auto w-full">
                <Image
                  src={payhere}
                  alt="InvertisPrep Paytm UPI sponsor QR code"
                  width={720}
                  height={1112}
                  priority
                  className="h-auto w-full select-all rounded-lg ring-1 ring-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> 100% Secure
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 font-medium text-indigo-700">
              <ScanLine className="h-3.5 w-3.5" /> Paytm · GPay · PhonePe
            </span>
          </div>

          <p className="mt-4 text-center text-sm leading-relaxed text-slate-500">
            Every little bit helps us stay ad-free and keep building for the
            Invertis community. 🙏
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
