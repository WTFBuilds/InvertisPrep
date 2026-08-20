'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  Play,
  Heart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { ShinyButton } from '@/components/ui/shiny-button';
import { eventApi } from '@/lib/api';
import { InvertisEvent } from '@/types';

export const EVENTS_DATA: InvertisEvent[] = [
  {
    id: 'invertia-2026',
    title: 'Invertia 2026',
    category: 'Annual Fest',
    date: 'Oct 14 - 16, 2026',
    time: '10:00 AM onwards',
    venue: 'Main Ground & Seminar Hall 1',
    organizer: 'Invertis Cultural Committee',
    description: 'The flagship national cultural festival of Invertis University, showcasing music, fashion, and celebrity star nights.',
    longDescription: 'Invertia is the premium national level techno-cultural fest of Invertis University. Experience three days of electric energy, band showdowns, fashion shows, street plays, dance tournaments, and guest celebrity artist performances. Unleash your talent, network with peers from various universities, and stand a chance to win substantial cash rewards alongside high prestige.',
    image: '/Events/INVERTIA 2026.jpg',
    featured: true,
    registrationOpen: true,
    timeline: [
      'Day 1: Inauguration & Battle of Bands',
      'Day 2: Star Night & Fashion Show',
      'Day 3: Dance Off & Prize Ceremony'
    ],
    rules: [
      'Open to all university students with valid college ID cards.',
      'Pre-registration is mandatory for specific competitive events.',
      'Safety and university guidelines must be strictly adhered to.'
    ]
  },
  {
    id: 'nirmiti-2026',
    title: 'Nirmiti 2026',
    category: 'academic',
    date: 'Nov 05 - 06, 2026',
    time: '09:00 AM - 05:00 PM',
    venue: 'Block B Labs & Auditorium',
    organizer: 'Department of Fashion Designing & Entrepreneurship',
    description: 'The national techno-fest where innovation meets code. Join hackathons, robotic wars, and tech exhibitions.',
    longDescription: 'Nirmiti brings together technical visionaries and builders. The festival hosts a 24-hour hackathon, robotics war games, speed coding tournaments, web design battles, and startup pitch competitions. Connect with tech recruiters, present research papers, and showcase innovative project prototypes.',
    image: '/Events/Nirmiti 2026.png',
    registrationOpen: true,
    timeline: [
      '09:00 AM (Day 1): Hackathon Kick-off',
      '02:00 PM (Day 1): Robo-War Preliminary Matches',
      '11:00 AM (Day 2): Debugging & Speed Coding Finals',
      '03:00 PM (Day 2): Tech Exhibition & Awards Ceremony'
    ],
    rules: [
      'Maximum team size for hackathon is 4 members.',
      'Participants must bring their own laptops and dev boards.',
      'Plagiarism or use of pre-made templates is strictly prohibited.'
    ]
  },
  {
    id: 'spardha-2026',
    title: 'Spardha 2026',
    category: 'sports',
    date: 'Dec 03 - 05, 2026',
    time: '09:00 AM onwards',
    venue: 'University Sports Complex',
    organizer: 'Invertis Sports Council',
    description: 'The annual sports championship featuring athletics, football, basketball, and indoor tournaments.',
    longDescription: 'Spardha is the premier inter-college sports festival of Invertis University. Bringing together the finest athletes to compete in track events, football, basketball, cricket, badminton, and chess. Celebrate the spirit of sportsmanship, push your limits, and claim the championship trophies.',
    image: 'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=800',
    registrationOpen: true,
    timeline: [
      'Day 1: Athletics Prelims & Indoor Games Start',
      'Day 2: Team Sports Quarter/Semi Finals',
      'Day 3: Finals & Grand Prize Ceremony'
    ],
    rules: [
      'Teams must register in advance with details of all players.',
      'Participants must bring their own sports gear and wear clean non-marking shoes.',
      'Referees decisions are final and binding.'
    ]
  },
  {
    id: 'convocation-2026',
    title: 'Convocation Ceremony 2026',
    category: 'academic',
    date: 'Sep 28, 2026',
    time: '10:00 AM - 02:00 PM',
    venue: 'Abhiraj Auditorium',
    organizer: 'Office of the Registrar',
    description: 'The annual graduation ceremony celebrating academic excellence and presenting degrees to the class of 2026.',
    longDescription: 'Join us in honoring our graduating class at the official Convocation Ceremony. Degrees, diplomas, gold medals, and academic commendations will be presented by eminent chief guests and university leadership. This is a memorable milestone for students and their families.',
    image: '/Events/Convocation 2026.jpg',
    registrationOpen: true,
    timeline: [
      '08:30 AM: Gown Collection & Dress Checks',
      '09:30 AM: Procession Assembly',
      '10:30 AM: Main Ceremony Starts & Dignitary Address',
      '12:30 PM: Conferring of Degrees & Lunch'
    ],
    rules: [
      'Graduating students must be dressed in the approved academic regalia.',
      'Prior online registration for convocation is mandatory.',
      'Guests must carry their official entry invitation card.'
    ]
  },
  {
    id: 'tedx-2026',
    title: 'TEDx Invertis University',
    category: 'academic',
    date: 'Nov 19 - 21, 2026',
    time: '11:00 AM - 03:30 PM',
    venue: 'Main Auditorium',
    organizer: 'Invertis University',
    description: 'A platform for sharing innovative ideas and igniting minds.',
    longDescription: 'TEDxInvertisUniversity brings together inspiring speakers, thinkers, and innovators to share their ideas with the community. Explore diverse topics, gain new perspectives, and be part of a global movement of ideas worth spreading.',
    image: '/Events/TEDx Season 4.png',
    registrationOpen: true,
    timeline: [
      'Day 1: Keynote Speeches & Panel Discussions',
      'Day 2: Interactive Workshops & Masterclasses',
      'Day 3: Fireside Chats & Closing Ceremony'
    ],
    rules: [
      'Participation is strictly limited to registered TEDxInvertisUniversity attendees.',
      'Attendees must carry their official event badge at all times.',
      'Photography and recording inside the auditorium are prohibited.',
      'Follow the speakers and organizers on social media to stay updated.'
    ]
  },
  {
    id: 'corporate-connect-2026',
    title: 'Corporate Connect 2026',
    category: 'academic',
    date: 'Oct 22, 2026',
    time: '10:30 AM - 04:30 PM',
    venue: 'Seminar Hall 2',
    organizer: 'Invertis Placement Cell',
    description: 'A platform to bridge industry trends with academia. Leadership talks, resume reviews, and HR panels.',
    longDescription: 'Corporate Connect offers students an immersive opportunity to network with corporate pioneers and human resource executives. Gain deep perspectives on evolving industry trends, technology disruptions, required skillsets, and participate in mock micro-interview clinics.',
    image: '/Events/Corporate Connect 2026.png',
    registrationOpen: true,
    timeline: [
      '10:30 AM: Keynote Talk on "Generative AI in Corporate Careers"',
      '12:00 PM: HR Panel Discussion on Future Hiring Metrics',
      '02:30 PM: Mock Placement Interviews & Resume Critiquing Sessions'
    ],
    rules: [
      'Formal professional attire is strictly required.',
      'Students should carry 3 copies of their printed resume.',
      'Registration is on a first-come, first-served basis.'
    ]
  },
  {
    id: 'pioneer-mgmt-fest',
    title: 'Pioneer Management Fest',
    category: 'academic',
    date: 'Nov 18 - 19, 2026',
    time: '09:30 AM - 05:00 PM',
    venue: 'Block C Seminar Rooms',
    organizer: 'Invertis Department of Management',
    description: 'Showcase business acumen, entrepreneurial pitches, virtual stock trading, and corporate crisis solving.',
    longDescription: 'Pioneer Management Fest tests students on strategic, financial, and marketing parameters. Engage in live simulations of virtual stock exchanges, pitch your disruptive startup ideas to AI-friendly investors, resolve real-world corporate crises, and show off knowledge in business quizzes.',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800',
    registrationOpen: true,
    timeline: [
      'Day 1 10:00 AM: B-Plan Pitch Presentations',
      'Day 1 02:00 PM: Virtual Stock Market Launch',
      'Day 2 11:00 AM: Business Case Study Competition',
      'Day 2 03:00 PM: Live Corporate Quiz Finals'
    ],
    rules: [
      'Teams for business pitches can consist of up to 3 members.',
      'Pitch decks must be submitted in PDF format prior to the event.',
      'Decision of the external industry jury is final.'
    ]
  }
];

const CATEGORIES = [
  { value: 'all', label: 'All Events' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'technical', label: 'Technical' },
  { value: 'sports', label: 'Sports' },
  { value: 'academic', label: 'Academic & Career' },
  { value: 'Annual Fest', label: 'Annual Fest' },
];

export default function EventsPage() {
  const [events, setEvents] = useState<InvertisEvent[]>(EVENTS_DATA);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [likedEvents, setLikedEvents] = useState<Record<string, boolean>>({});

  const giveawaysContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventApi.getAll();
        if (response.success && response.data && response.data.length > 0) {
          setEvents(response.data);
        }
      } catch (error) {
        console.error('Failed to load dynamic events, using static fallback:', error);
      }
    };
    fetchEvents();
  }, []);

  // Billboard displays all events in the carousel
  const billboardEvents = events;

  // Safely compute the active event in the billboard list
  const activeEvent = billboardEvents[activeIndex] || billboardEvents[0] || events[0];

  // Filtering events for search & category in list view
  const filteredEvents = events.filter((event) => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrev = useCallback(() => {
    if (billboardEvents.length === 0) return;
    setActiveIndex((prev) => (prev === 0 ? billboardEvents.length - 1 : prev - 1));
  }, [billboardEvents.length]);

  const handleNext = useCallback(() => {
    if (billboardEvents.length === 0) return;
    setActiveIndex((prev) => (prev === billboardEvents.length - 1 ? 0 : prev + 1));
  }, [billboardEvents.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      touchEndX.current === null ||
      touchEndY.current === null
    ) return;

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;

    // Check if horizontal swipe is more pronounced than vertical swipe
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  // Auto-play slideshow for the hero billboard
  useEffect(() => {
    if (billboardEvents.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIndex, billboardEvents.length, handleNext]);

  const handleCategoryChange = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
  };

  const handleLikeToggle = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handleScrollGiveaways = (direction: 'left' | 'right') => {
    if (giveawaysContainerRef.current) {
      const scrollAmount = 340;
      giveawaysContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };



  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-x-hidden selection:bg-indigo-650 selection:text-white">

      {/* Background ambient lighting effects for light theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[25%] w-[60vw] h-[60vw] rounded-full bg-indigo-100/40 blur-3xl opacity-80" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-100/30 blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:32px_32px] opacity-80" />
      </div>

      {/* 1. FULL WIDTH SCREEN HERO BILLBOARD */}
      <div className="relative w-full z-10">
        <div
          className="relative w-full aspect-[21/9] min-h-[350px] sm:min-h-[500px] bg-slate-100 flex items-end"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {activeEvent && (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeEvent.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activeEvent.image}
                    alt={activeEvent.title}
                    fill
                    priority
                    className="object-cover object-center"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Dark vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10" />

              {/* Navigation Chevron Controls (Floating Left and Right) */}
              <button
                onClick={handlePrev}
                className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/55 hover:bg-slate-900 text-white border border-white/10 transition-all duration-300 z-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/55 hover:bg-slate-900 text-white border border-white/10 transition-all duration-300 z-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Top Bar Badges / Action triggers */}
              <div className="absolute top-6 left-6 z-30 flex gap-2">
              <Badge className="bg-white/15 text-white backdrop-blur-md border border-white/20 text-[9px] uppercase px-3 py-1.5 rounded-full font-bold">
                  {activeEvent.organizer}
                </Badge>
              </div>

              {/* Top Right Heart Action Overlays */}
              <div className="absolute top-6 right-6 z-30 flex gap-2">
                <button
                  onClick={(e) => handleLikeToggle(activeEvent.id, e)}
                  className={`p-3 rounded-full backdrop-blur-md border border-white/15 transition-all duration-300 ${likedEvents[activeEvent.id]
                    ? 'bg-red-500 text-white border-red-500 scale-110'
                    : 'bg-black/40 text-zinc-200 hover:text-white hover:bg-black/60'
                    }`}
                >
                  <Heart className={`w-4 h-4 ${likedEvents[activeEvent.id] ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Billboard Text Content */}
              <div className="relative pt-8 pb-16 sm:pt-14 sm:pb-20 md:pt-20 md:pb-24 z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 md:px-16 text-left space-y-4">
                <motion.div
                  key={`text-${activeEvent.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="space-y-3"
                >
                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-white">
                    {activeEvent.title}
                  </h1>
                  <p className="text-zinc-200 text-xs sm:text-base font-medium max-w-xl leading-relaxed">
                    {activeEvent.description}
                  </p>
                </motion.div>

                {/* Billboard Metadata Row */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-200 border-t border-white/15 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-white">{activeEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-300" />
                    <span>{activeEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-300" />
                    <span>{activeEvent.venue}</span>
                  </div>
                </div>

                {/* Action Triggers */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20">
                    <Link href={`/events/${activeEvent.id}`}>
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10 font-semibold text-xs px-6 py-5 rounded-xl">
                        Schedule & Rules
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl bg-white text-slate-900 border-slate-200 rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-950">{activeEvent.title} Guide</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs">
                          Complete handbook guidelines and timelines.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-5 mt-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">About the Fest</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{activeEvent.longDescription}</p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline Schedule</h4>
                          <div className="space-y-1.5 border-l border-slate-250 pl-4 ml-1">
                            {activeEvent.timeline.map((t, idx) => (
                              <div key={idx} className="relative flex items-center gap-2">
                                <div className="absolute left-[-21px] w-2 h-2 rounded-full bg-indigo-650" />
                                <span className="text-xs text-slate-700">{t}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Code of Conduct & Rules</h4>
                          <ul className="space-y-1 list-disc list-inside text-xs text-slate-600">
                            {activeEvent.rules.map((r, idx) => (
                              <li key={idx} className="leading-relaxed">{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

              </div>

              {/* Carousel Indicators / Dot Navigation */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-4">
                {billboardEvents.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeIndex === idx
                      ? 'bg-indigo-600 w-8'
                      : 'bg-white/40 hover:bg-white/70'
                      }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Fallback state if no billboard events found in the filtered list */}
          {billboardEvents.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-3 z-10">
              <Calendar className="w-12 h-12 text-slate-300" />
              <h3 className="text-lg font-bold">No event active in this category</h3>
              <p className="text-xs text-slate-400 max-w-xs">Try selecting another category under the billboard.</p>
            </div>
          )}

        </div>
      </div>

      {/* 2. CENTERED CONTENT CONTAINER */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Category Buttons Selector Row (Replaces Circular Thumbnails) */}
        <div
          className="flex flex-nowrap items-center justify-start sm:justify-center gap-4 sm:gap-6 mt-6 z-20 w-full overflow-x-auto scrollbar-none px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <ShinyButton
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                isActive={isActive}
              >
                {cat.label}
              </ShinyButton>
            );
          })}
        </div>
        {/*All Events Directory */}
        <div className="space-y-6 pt-6 text-left border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">All Events Directory</h2>
              <p className="text-xs text-slate-450">Filter and search details of fests, hackathons, and activities.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="w-full max-w-[340px] mx-auto bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-slate-350 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <Link href={`/events/${event.id}`} className="block group/grid-card">
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="object-cover group-hover/grid-card:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-white px-2.5 py-1 rounded-md">
                      {event.date}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="capitalize">{event.category}</span>
                      <span>•</span>
                      <span className="truncate max-w-[140px]">{event.organizer}</span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover/grid-card:text-indigo-650 transition-colors truncate">{event.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                </Link>

                <div className="p-4 pt-0">
                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <div className="space-y-1.5 text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs py-2.5 rounded-xl">
                            Rules
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md bg-white text-slate-900 border-slate-250 rounded-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-black text-slate-950">{event.title}</DialogTitle>
                            <DialogDescription className="text-slate-500 text-xs">Guidelines and requirements.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-2">
                            <p className="text-xs text-slate-600 leading-relaxed">{event.longDescription}</p>
                            <div className="space-y-1.5">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Timeline</h4>
                              <ul className="space-y-1 list-none text-xs text-slate-600 pl-1">
                                {event.timeline.map((time, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-indigo-600">•</span>
                                    <span>{time}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-1.5">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Rules</h4>
                              <ul className="space-y-1 list-disc list-inside text-xs text-slate-600">
                                {event.rules.map((rule, idx) => (
                                  <li key={idx} className="leading-relaxed">{rule}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

        {/* Giveaways Horizontal Slider Section */}
        <div className="space-y-6 pt-6 text-left px-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                Giveaways <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Just announced</span>
              </h2>
            </div>
            {/* Scroll Navigation Chevrons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleScrollGiveaways('left')}
                className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScrollGiveaways('right')}
                className="p-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Carousel */}
          <div
            ref={giveawaysContainerRef}
            className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start bg-white border border-slate-200/80 rounded-2xl overflow-hidden group hover:border-slate-350 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <Link href={`/events/${event.id}`} className="block group/carousel-card">
                  {/* Card Media */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      sizes="280px"
                      className="object-cover group-hover/carousel-card:scale-105 transition-transform duration-500"
                    />

                    {/* Soft black shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="capitalize">{event.category}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{event.organizer}</span>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover/carousel-card:text-indigo-650 transition-colors truncate">
                      {event.title}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </Link>

                <div className="p-4 pt-0">
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{event.date}</span>
                    </div>

                    <button
                      onClick={(e) => handleLikeToggle(event.id, e)}
                      className={`p-2 rounded-full border transition-all ${likedEvents[event.id]
                        ? 'bg-red-500 text-white border-red-500 scale-105'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedEvents[event.id] ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
