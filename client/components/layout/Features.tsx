import { BookOpen, Trophy, Users, FileText, Brain, Laptop } from "lucide-react";
import Link from 'next/link';

export default function Features() {
  const features = [
    {
      icon: BookOpen,
      title: "Previous Year Papers",
      description:
        "Access a comprehensive collection of previous year question papers from all semesters and departments.",
    },
    {
      icon: FileText,
      title: "Study Notes",
      description:
        "Get access to detailed study notes created by top students and faculty members.",
    },
    {
      icon: Trophy,
      title: "Quizzo Battles",
      description:
        "Compete with peers in real-time 1v1 quiz battles with 10-second timer per question.",
    },
    {
      icon: Users,
      title: "Community Uploads",
      description:
        "Share your notes and resources with the community and get recognition for your contributions.",
    },
    {
      icon: Brain,
      title: "Personalized Learning",
      description:
        "Track your progress, identify weak areas, and get personalized recommendations.",
    },
    {
      icon: Laptop,
      title: "Anywhere, Anytime",
      description:
        "Access all resources on any device, anytime, anywhere. Study on your schedule.",
    },
  ];

  return (
    <section
      id="features"
      className="pt-16 md:pt-24 pb-16 md:pb-24 bg-white border-b border-zinc-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
          <span className="inline-block bg-zinc-50 text-zinc-500 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6 border border-zinc-200">
            Key Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4">
            Everything You Need to Excel.
          </h2>
          <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">
            InvertisPrep combines academic resources with interactive learning to create
            the ultimate platform for Invertis University students.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 md:p-8 rounded-2xl bg-white border border-zinc-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-200 hover:shadow-indigo-100/50"
            >
              <div
                className="inline-flex items-center justify-center p-3 rounded-xl mb-6 bg-zinc-100 text-zinc-700 transition-all duration-300 transform group-hover:-translate-y-1 group-hover:bg-indigo-50 group-hover:text-indigo-600 ring-1 ring-transparent group-hover:ring-indigo-100"
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 text-zinc-900 tracking-tight group-hover:text-indigo-950 transition-colors">
                {feature.title}
              </h3>
              <p className="text-zinc-500 text-sm md:text-base leading-relaxed group-hover:text-zinc-600 transition-colors">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 md:mt-20">
          <Link href="/pyq">
            <button className="px-8 py-3.5 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-indigo-600 transition-all duration-300 shadow-sm border border-transparent hover:shadow-indigo-500/20">
              Start Learning Now
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
