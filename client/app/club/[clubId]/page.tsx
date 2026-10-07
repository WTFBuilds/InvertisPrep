'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users, Mail, User, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

// Mock data mapping
const CLUB_DATA: Record<string, any> = {
  panache: { name: "Panache", tagline: "The Arts Club", img: "/images/panache.png" },
  tri: { name: "The Responsible Invertian", tagline: "Social Cause Club", img: "/images/tri.png" },
  rockon: { name: "Rock On", tagline: "The Cultural Club", img: "/images/rockon.png" },
  images: { name: "Images", tagline: "The Publication Club", img: "/images/images.png" },
  itech: { name: "I-Tech", tagline: "The Technical Club", img: "/images/itech.png" },
  stride: { name: "Stride", tagline: "The Sports Club", img: "/images/stride.png" },
  mfactor: { name: "M-Factor", tagline: "The Management Club", img: "/images/mfactor.png" },
};

const TEAM = [
  { role: "President", name: "Student Name", branch: "B.Tech CSE, 4th Year" },
  { role: "Vice President", name: "Student Name", branch: "MBA, 2nd Year" },
  { role: "Secretary", name: "Student Name", branch: "BBA, 3rd Year" },
  { role: "Joint Secretary", name: "Student Name", branch: "BCA, 2nd Year" },
  { role: "Treasurer", name: "Student Name", branch: "B.Com, 3rd Year" },
];

export default function ClubDetailPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = use(params);
  const club = CLUB_DATA[clubId];

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Club Not Found</h1>
          <Link href="/club" className="text-blue-600 mt-4 inline-block font-semibold">Go back to clubs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#2563EB] selection:text-white pb-20">
      {/* Dynamic Header */}
      <div className={`w-full pt-32 pb-24 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          <Link href="/club" className="self-start text-white/80 hover:text-white flex items-center gap-2 mb-8 transition-colors font-bold bg-black/20 hover:bg-black/30 px-5 py-2.5 rounded-xl backdrop-blur-md border border-white/5">
            <ArrowLeft className="w-4 h-4" /> Back to Clubs
          </Link>
          
          <div className="w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 bg-white rounded-full p-6 sm:p-8 mb-8 shadow-2xl shadow-black/20 border-4 border-white/20 flex items-center justify-center">
            <img src={club.img} alt={club.name} className="w-full h-full object-contain drop-shadow-md" />
          </div>
          
          <Badge className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20 mb-4 text-sm px-5 py-2 font-bold tracking-wide uppercase shadow-sm">{club.tagline}</Badge>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-lg mb-6">{club.name}</h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl font-medium leading-relaxed">
            Welcome to the official page of {club.name}. Explore our upcoming events, meet our dedicated leadership team, and get involved in our community.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Events */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-[#2563EB]" />
                  Upcoming Events
                </h2>
                <Badge variant="outline" className="text-[#2563EB] border-[#2563EB]/20 bg-[#2563EB]/5 font-bold">2 Scheduled</Badge>
              </div>

              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="group p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <div className="w-16 h-16 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-bold uppercase">Oct</span>
                      <span className="text-xl font-black leading-none">{14 + i}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors mb-1">Flagship Event Name {i}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 10:00 AM</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Main Auditorium</span>
                      </div>
                    </div>
                    <button className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm shadow-sm">
                      RSVP Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Presidential Team */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 sticky top-24">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-8">
                <Users className="w-6 h-6 text-[#2563EB]" />
                Presidential Team
              </h2>

              <div className="space-y-6">
                {TEAM.map((member, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center text-slate-400 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#2563EB] uppercase tracking-wider mb-0.5">{member.role}</h4>
                      <p className="font-bold text-slate-900 leading-tight">{member.name}</p>
                      <p className="text-xs text-slate-500 font-semibold">{member.branch}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-8 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Mail className="w-4 h-4" /> Contact Team
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
