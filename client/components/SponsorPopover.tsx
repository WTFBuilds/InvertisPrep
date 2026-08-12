"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import payhere from "@/assets/payhere.jpeg";

// Popup card variant of the sponsor CTA — opens on click instead of a modal
// dialog. Light, professional, no gradients.
export default function SponsorPopover() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Sponsor InvertisPrep"
          className="group flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50/70 hover:text-rose-600 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
        >
          <span aria-hidden="true" className="text-sm leading-none">❤️</span>
          <span>sponsor</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[320px] rounded-2xl border-slate-200 bg-white p-0 shadow-xl sm:w-[340px]"
      >
        {/* Header */}
        <div className="border-b border-slate-100 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 ring-1 ring-rose-100">
                <Heart className="size-4 text-rose-500" fill="currentColor" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight text-slate-900">Support InvertisPrep</p>
                <p className="mt-0.5 text-xs leading-snug text-slate-500">
                  Keep notes, papers & resources free for every student.
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 rounded-full border-slate-200 bg-white text-[10px] font-semibold text-slate-500"
            >
              UPI
            </Badge>
          </div>
        </div>

        {/* QR */}
        <div className="px-6 py-5">
          <div className="mx-auto max-w-[180px] rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <Image
              src={payhere}
              alt="InvertisPrep UPI sponsor QR code"
              width={720}
              height={1112}
              className="h-auto w-full select-all rounded-md"
            />
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Scan to sponsor — Paytm · GPay · PhonePe
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-4 py-3">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
            <ShieldCheck className="size-3.5" /> 100% Secure
          </span>
          <DropdownMenuItem
            asChild
            className="cursor-pointer rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white focus:bg-slate-800 focus:text-white"
          >
            <Link href="/sponsor">
              Our sponsors <ArrowRight className="size-3" />
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
