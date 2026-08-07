'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Check,
  Share2,
  Heart,
  User,
  BookOpen,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EVENTS_DATA } from '../page';
import { InvertisEvent } from '@/types';
import { eventApi } from '@/lib/api';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<InvertisEvent | null>(null);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);



  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (params?.id) {
        try {
          const response = await eventApi.getById(params.id as string);
          if (response.success && response.data) {
            setEvent(response.data);
          } else {
            // Fallback to EVENTS_DATA if not found in db yet
            const foundEvent = EVENTS_DATA.find((e) => e.id === params.id);
            if (foundEvent) setEvent(foundEvent);
          }
        } catch (error) {
          // Fallback to static data
          const foundEvent = EVENTS_DATA.find((e) => e.id === params.id);
          if (foundEvent) setEvent(foundEvent);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchEvent();
  }, [params]);

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
          <p className="text-xs text-slate-500">The event you are looking for might have been moved or doesn't exist.</p>
          <Link href="/events" passHref>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl">
              Back to Events Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };



  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-650 selection:text-white pb-20">
      
      {/* 1. HERO HEADER IMAGE COVER */}
      <div className="relative w-full h-[40vh] sm:h-[45vh] bg-slate-950 overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          priority
          className="object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent z-10" />

        {/* Floating Top Nav Bar */}
        <div className="absolute top-6 left-0 right-0 z-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push('/events')}
              className="flex items-center gap-2 px-4 py-2.5 bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 rounded-2xl text-xs font-semibold shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Directory
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="p-2.5 bg-black/60 backdrop-blur-md text-zinc-200 border border-white/10 hover:text-white hover:bg-black/85 rounded-full shadow-md transition-all relative"
                title="Copy Link"
              >
                {copied ? <Check className="w-4 h-4 text-indigo-500" /> : <Share2 className="w-4 h-4" />}
                {copied && (
                  <span className="absolute -bottom-8 right-0 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow whitespace-nowrap">
                    Link Copied!
                  </span>
                )}
              </button>
              <button
                onClick={() => setLiked(!liked)}
                className={`p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full shadow-md transition-all ${
                  liked ? 'text-red-500 bg-red-50/10 border-red-500/20' : 'text-zinc-200 hover:text-white hover:bg-black/85'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Hero Title details overlay on bottom */}
        <div className="absolute bottom-6 left-0 right-0 z-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-left space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 text-white font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full border-none shadow">
                {event.category}
              </Badge>
              <span className="text-xs text-white/90 font-medium tracking-wide bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                Organized by {event.organizer}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-sm">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      {/* 2. MAIN BLOG-LIKE LAYOUT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Details, Timeline, Rules */}
          <div className="lg:col-span-2 space-y-8 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            
            {/* Big Event Poster */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center p-2">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-auto max-h-[550px] object-contain rounded-xl shadow-sm"
              />
            </div>

            {/* About Block */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> About the Event
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {event.description}
              </p>
              <div className="text-slate-650 text-xs sm:text-sm leading-relaxed space-y-3 pt-2">
                {event.longDescription.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Timeline Schedule */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" /> Event Timeline
              </h2>
              <div className="relative border-l border-indigo-100 pl-6 ml-3 py-2 space-y-6">
                {event.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle Node */}
                    <div className="absolute left-[-31px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-4 ring-indigo-50" />
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Rules Block */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Guidelines & Handbook Rules
              </h2>
              <ul className="space-y-3 list-none">
                {event.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right Column: Sticky Quick Facts & Register Button */}
          <div className="space-y-6 lg:sticky lg:top-24">
            
            {/* Spec Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-950">Quick Details</h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3.5">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-700">Date</h4>
                    <p className="text-slate-500 font-medium">{event.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-700">Time</h4>
                    <p className="text-slate-500 font-medium">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-700">Venue</h4>
                    <p className="text-slate-500 font-medium">{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-700">Organizer</h4>
                    <p className="text-slate-500 font-medium">{event.organizer}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
