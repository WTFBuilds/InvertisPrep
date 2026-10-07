'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Calendar, Star, Award, Shield, Target, ExternalLink, Check } from 'lucide-react';

const stats = [
  { label: "Clubs", value: "7", icon: Target },
  { label: "Events", value: "1000+", icon: Calendar },
  { label: "Students Impacted", value: "15000+", icon: Users },
  { label: "Years of Excellence", value: "15+", icon: Award },
];

const clubDetails = [
  { 
    id: "panache",
    name: "Panache", 
    tagline: "The Arts Club", 
    description: "Explore the world of arts, painting, and creativity.",
    coordinator: "Faculty Name",
    img: "/images/panache.png" 
  },
  { 
    id: "tri",
    name: "The Responsible Invertian", 
    tagline: "Social Cause Club", 
    description: "Making a difference in society through social service.",
    coordinator: "Faculty Name",
    img: "/images/tri.png" 
  },
  { 
    id: "rockon",
    name: "Rock On", 
    tagline: "The Cultural Club", 
    description: "Dance, music, drama - expressing culture.",
    coordinator: "Faculty Name",
    img: "/images/rockon.png" 
  },
  { 
    id: "images",
    name: "Images", 
    tagline: "The Publication Club", 
    description: "Capturing moments and publishing memories.",
    coordinator: "Faculty Name",
    img: "/images/images.png" 
  },
  { 
    id: "itech",
    name: "I-Tech", 
    tagline: "The Technical Club", 
    description: "Innovating the future with coding and tech.",
    coordinator: "Faculty Name",
    img: "/images/itech.png" 
  },
  { 
    id: "stride",
    name: "Stride", 
    tagline: "The Sports Club", 
    description: "Fostering teamwork and excellence through sports.",
    coordinator: "Faculty Name",
    img: "/images/stride.png" 
  },
  { 
    id: "mfactor",
    name: "M-Factor", 
    tagline: "The Management Club", 
    description: "Developing leadership and management skills.",
    coordinator: "Faculty Name",
    img: "/images/mfactor.png" 
  },
];

const carouselImages = [
  "/images/1.jpg",
  "/images/2.jpg",
  "/images/0.jpg",
  "/images/3.jpg",
  "/images/5.jpg",
  "/images/6.jpg"
];

function AboutCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full group">
      {carouselImages.map((src, i) => (
        <img 
          key={src}
          src={src} 
          alt={`About Abhiruchi slide ${i}`} 
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${i === index ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`} 
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}

export default function ClubPage() {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans overflow-x-hidden selection:bg-[#2563EB] selection:text-white">
      {/* === HERO SECTION === */}
      <section className="relative w-full min-h-[calc(100vh-88px)] flex items-center justify-center overflow-hidden border-b border-slate-200">
        {/* Subtle Background Gradients to match standard website UI */}
        <div className="absolute top-[-5%] left-[-10%] w-[40%] aspect-square bg-[#2563EB]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] aspect-square bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            
            {/* Left Column: Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10">
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-xs sm:text-sm font-bold text-slate-600">Official Student Organization • Invertis University</span>
              </motion.div>

              {/* Heading */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-6"
              >
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.15]">
                  <span className="text-[#F97316] drop-shadow-sm tracking-tighter">abhi<span className="font-serif tracking-normal">रुचि</span></span> <br className="hidden lg:block" />
                  <span className="text-slate-800 text-3xl sm:text-4xl lg:text-5xl tracking-normal">– THE HOBBY CLUB</span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed font-medium"
              >
                Inspiring creativity, leadership, and innovation through seven diverse clubs. Join a vibrant community where passion meets purpose, and every student discovers their true potential.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-12"
              >
                <Link href="https://abhruchi.vercel.app/" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 bg-[#2563EB] hover:bg-[#3B82F6] text-white font-bold rounded-xl shadow-xl shadow-[#2563EB]/20 transform hover:-translate-y-0.5 transition-all flex items-center gap-2 group">
                  Visit Website
                  <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </Link>
                <Link href="/" className="px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl shadow-sm hover:shadow transform hover:-translate-y-0.5 transition-all">
                  Back Home
                </Link>
              </motion.div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
                {stats.map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                    className="flex flex-col items-center lg:items-start p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group"
                  >
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[#2563EB] mb-3 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white group-hover:border-[#2563EB] transition-all">
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider text-center lg:text-left leading-tight">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column: Main Visual (Circular Layout) */}
            <div className="relative w-full aspect-square max-w-sm sm:max-w-md lg:max-w-xl mx-auto flex items-center justify-center mt-10 lg:mt-0">
              {/* Center Logo */}
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                className="relative z-20 w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64 flex items-center justify-center group cursor-pointer"
              >
                <div className="absolute inset-0 rounded-full bg-[#2563EB]/10 animate-ping opacity-30" />
                <img 
                  src="/images/abhiruchi1.png" 
                  alt="Abhiruchi Logo" 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xl"
                />
              </motion.div>

              {/* Orbiting Clubs */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 z-10 flex items-center justify-center"
              >
                {clubDetails.map((club, i) => {
                  const angle = i * (360 / clubDetails.length);
                  return (
                    <div
                      key={club.name}
                      className="absolute origin-center"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <div className="translate-y-[-145px] sm:translate-y-[-180px] lg:translate-y-[-240px]">
                        {/* Counter-rotation to keep images upright */}
                        <motion.div
                          animate={{ rotate: [-angle, -360 - angle] }}
                          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                          className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group"
                        >
                          <img 
                            src={club.img} 
                            alt={club.name} 
                            title={club.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-xl" 
                            onError={(e) => { 
                              e.currentTarget.style.display = 'none'; 
                              e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-100"><span class="text-slate-400 font-bold text-[10px]">Club</span></div>';
                            }} 
                          />
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {/* Core Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border border-[#2563EB]/10 border-dashed -z-10 animate-[spin_60s_linear_infinite]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#2563EB]/5 rounded-full blur-3xl -z-20" />
            </div>

          </div>
        </div>
      </section>

      {/* === ABOUT ABHIRUCHI SECTION === */}
      <section className="py-20 sm:py-32 bg-white relative overflow-hidden">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center">
            
            {/* Text Content */}
            <div className="lg:col-span-6 space-y-8 lg:space-y-10">
              <div>
                <h2 className="text-sm font-black tracking-widest text-[#2563EB] uppercase mb-4 flex items-center gap-2">
                  <span className="w-8 h-0.5 bg-[#2563EB]" />
                  About Abhiruchi
                </h2>
                <h3 className="text-4xl sm:text-5xl lg:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
                  Discover the heart of creativity and innovation.
                </h3>
              </div>
              
              <div className="space-y-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-medium">
                <p>
                  <strong className="text-slate-900">Abhiruchi – The Hobby Club</strong> is the central pillar of student life at Invertis University. We are a community dedicated to fostering talent, leadership, and lifelong friendships.
                </p>
                <p>
                  Driven by a dynamic council of student leaders, we organize the university&apos;s most prestigious events. From large-scale fests to intimate skill-building workshops, we nurture the innovators of tomorrow.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 pt-4">
                {['Student Leadership', 'Event Management', 'Innovation', 'Skill Development'].map((tag) => (
                  <span key={tag} className="px-4 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-sm font-bold border border-slate-200 flex items-center gap-2 hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-sm">
                    <Check className="w-4 h-4 text-[#2563EB]" strokeWidth={3} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual Card */}
            <div className="lg:col-span-6 relative mt-10 lg:mt-0">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#2563EB]/20 to-indigo-500/20 rounded-[2.5rem] blur-2xl opacity-60" />
              
              <div className="relative bg-white rounded-3xl border border-slate-200/60 shadow-2xl overflow-hidden aspect-video group hover:border-slate-300 transition-colors">
                 <AboutCarousel />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* === OUR CLUBS SECTION === */}
      <section className="py-20 sm:py-32 bg-slate-50 relative border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
            <h2 className="text-sm font-black tracking-widest text-[#2563EB] uppercase mb-4 flex items-center justify-center gap-2">
              <span className="w-8 h-0.5 bg-[#2563EB]" />
              Our Clubs
              <span className="w-8 h-0.5 bg-[#2563EB]" />
            </h2>
            <h3 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight mb-6">
              Discover a world of opportunities.
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Join one of our 7 distinct clubs to learn, grow, and express yourself. Become part of a vibrant student community at Abhiruchi.
            </p>
          </div>

          {/* Clubs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
            {clubDetails.map((club) => (
              <div key={club.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:shadow-[#2563EB]/10 hover:-translate-y-1.5 transition-all duration-500 group flex flex-col h-full relative overflow-hidden">
                
                {/* Accent Hover Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Top Half: Logo Container */}
                <div className="relative h-48 sm:h-52 w-full flex items-center justify-center p-6">
                  {/* Backdrop glowing orb for the logo */}
                  <div className="absolute inset-0 bg-[#2563EB]/5 rounded-full blur-3xl scale-50 group-hover:scale-100 group-hover:bg-[#2563EB]/10 transition-transform duration-700" />
                  
                  <img 
                    src={club.img} 
                    alt={club.name} 
                    className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10"
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      e.currentTarget.parentElement!.innerHTML = '<div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center shadow-inner"><span class="text-slate-400 font-bold text-xs">Club</span></div>';
                    }} 
                  />
                </div>
                
                {/* Bottom Half: Content */}
                <div className="px-6 pb-6 flex flex-col flex-1 relative z-10">
                  <div className="mb-4 flex-1 text-center">
                    <h4 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-[#2563EB] transition-colors mb-1 tracking-tight">{club.name}</h4>
                    <p className="text-[11px] sm:text-xs font-black text-[#2563EB] uppercase tracking-widest mb-3">{club.tagline}</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3">{club.description}</p>
                  </div>
                  
                  <div className="mt-auto pt-2">
                    <Link href={`/club/${club.id}`} className="w-full py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-sm font-bold text-slate-700 group-hover:bg-[#2563EB] group-hover:text-white group-hover:border-[#2563EB] transition-all duration-300 shadow-sm relative overflow-hidden">
                      <span className="relative z-10 flex items-center gap-2">
                        Explore
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </section>
    </div>
  );
}
