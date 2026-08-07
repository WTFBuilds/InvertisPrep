'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Clock, ArrowRight, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PinnedEvent() {
  const [liked, setLiked] = useState(false);

  return (
    <div className="w-full bg-[#030303] text-white pt-4 pb-2 px-4 sm:px-6 lg:px-8 relative overflow-hidden z-20">
      {/* Background ambient glow */}
      <div className="absolute top-[-20%] left-[30%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden border border-zinc-800/60 bg-[#0d0d0f] shadow-2xl"
        >
          {/* Main Billboard Box */}
          <div className="relative w-full aspect-[21/9] min-h-[300px] sm:min-h-[400px] flex items-end">
            
            {/* Event Background Image */}
            <Image
              src="/Events/INVERTIA 2026.jpg"
              alt="Invertia 2026 Pinned Event"
              fill
              priority
              className="object-cover object-center opacity-70 group-hover:scale-[1.02] transition-transform duration-700"
            />
            
            {/* Dark vignette gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

            {/* Left-top Badge */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex gap-2">
              <Badge className="bg-[#a3e635] text-black font-black uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-full border-none shadow-lg animate-pulse">
                ★ PINNED EVENT
              </Badge>
              <Badge className="bg-white/10 text-white backdrop-blur-md font-semibold text-[10px] tracking-wider px-3 py-1.5 rounded-full border border-white/10">
                Registration Open
              </Badge>
            </div>

            {/* Play & Heart Button Actions Overlay */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2.5 z-30">
              <button 
                onClick={() => setLiked(!liked)}
                className={`p-3 rounded-full backdrop-blur-md border border-white/15 transition-all duration-300 ${
                  liked ? 'bg-red-500 text-white border-red-500 scale-110' : 'bg-black/55 text-zinc-300 hover:text-white hover:bg-black/75'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Banner Information Panel */}
            <div className="relative p-6 sm:p-10 md:p-12 w-full max-w-2xl space-y-4 sm:space-y-6 z-10 text-left">
              <div className="space-y-2">
                <p className="text-[#a3e635] text-xs font-bold tracking-widest uppercase">
                  Flagship Techno-Cultural Fest
                </p>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-none">
                  Invertia 2026
                </h2>
                <p className="text-zinc-300 text-xs sm:text-sm max-w-lg leading-relaxed font-medium">
                  The flagship national cultural festival of Invertis University, showcasing music, fashion, and celebrity star nights. Experience three days of electric energy.
                </p>
              </div>

              {/* Event Meta List */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-300 border-t border-zinc-800/80 pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span className="font-semibold text-white">Oct 14 - 16, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>10:00 AM onwards</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Main Ground & Seminar Hall 1</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/events">
                  <Button className="bg-[#a3e635] hover:bg-[#bef264] text-black font-extrabold text-xs px-6 py-5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-lime-500/10">
                    Register Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/events">
                  <Button variant="outline" className="border-zinc-700 text-white bg-transparent hover:bg-white/5 font-semibold text-xs px-6 py-5 rounded-xl transition-all">
                    More Details
                  </Button>
                </Link>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
