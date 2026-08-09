"use client";

import React from "react";
import {
  LinkedinIcon,
  GithubIcon,
  InstagramIcon,
  Compass,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { TeamSection, TeamMember, SocialLink } from "@/components/ui/team-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const teamMembers = [
  {
    name: "Ahqaf Ali",
    role: "Founder & Lead",
    image: "/team/member1.jpg",
    linkedin: "https://www.linkedin.com/in/ahqaf-ali/",
    github: "https://github.com/AhqafCoder",
    description: "Ahqaf Ali is the Founder and Lead at InvertisPrep. He directs the platform's vision, system architecture, and coordinates technical execution to provide high-quality learning resources for students.",
  },
  {
    name: "Sumanjeet Raj",
    role: "Content Lead",
    image: "/team/member2.jpg",
    linkedin: "https://www.linkedin.com/in/sumanjeet-raj-a59209380/",
    github: "https://github.com/Sumanjeetraj",
    description: "Sumanjeet Raj is the Content Lead at InvertisPrep. He oversees educational content curation, syllabus tracking, and updates to ensure accuracy and maximum prep readiness for students.",
  },
  {
    name: "Rajan Sharma",
    role: "Front End Developer",
    image: "/team/member3.jpg",
    linkedin: "https://linkedin.com/in/rajan-sharma-stack",
    github: "https://github.com/rajan2436",
    description: "Rajan Sharma is a Front End Developer at InvertisPrep. He is dedicated to building modern, highly-polished, responsive user experiences that keep our educational platform accessible and engaging.",
  },
  {
    name: "Bakhtiyar Ali",
    role: "Data Analyst",
    image: "/team/member4.jpg",
    linkedin: "https://www.linkedin.com/in/bakhtiyar-ali-38526a37a",
    github: "https://github.com/Bakhtiyarali291-png",
    description: "Bakhtiyar Ali is the Data Analyst at InvertisPrep. He drives data analysis, feedback evaluation, and analytics to align our question banks and preparation resources with student needs.",
  },
  {
    name: "Khanak Aggarwal",
    role: "Manager",
    image: "/team/member5.jpg",
    linkedin: "https://www.linkedin.com/in/khanak-agarwal-24ka",
    instagram: "https://insta.openinapp.co/ln1gy",
    description: "Khanak Aggarwal is the Operations Manager at InvertisPrep. She handles daily task management, timelines, and operational alignment across designers, developers, and writers.",
  },
  {
    name: "Prarthna Gupta",
    role: "Marketing Specialist",
    image: "/team/member6.jpg",
    linkedin: "https://www.linkedin.com/in/prarthna-gupta-a7076037a?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    github: "",
    instagram: "https://www.instagram.com/praru_20?igsh=MWdidGx1ejR5amRncw==",
    description: "Prarthna Gupta is the Marketing Specialist at InvertisPrep. She drives communication strategies, public relations, and outreach campaigns to expand InvertisPrep's student community.",
  },
  {
    name: "Krishu Kumar",
    role: "Front End Developer",
    image: "/team/member7.jpg",
    linkedin: "https://www.linkedin.com/in/krishukumar72",
    github: "https://github.com/kkrishu",
    description: "Krishu Kumar is a Front End Developer at InvertisPrep. He works on design implementations, styling consistency, and component libraries to enhance performance across devices.",
  },
];

export default function OurTeamPage() {
  // Transform raw data to match TeamMember structure
  const members: TeamMember[] = React.useMemo(() => {
    return teamMembers.map((member) => {
      const socialLinks: SocialLink[] = [];
      if (member.linkedin) {
        socialLinks.push({ icon: LinkedinIcon, href: member.linkedin });
      }
      if (member.github) {
        socialLinks.push({ icon: GithubIcon, href: member.github });
      }
      if (member.instagram) {
        socialLinks.push({ icon: InstagramIcon, href: member.instagram });
      }
      return {
        name: member.name,
        designation: member.role,
        imageSrc: member.image,
        description: member.description,
        githubUrl: member.github || undefined,
        linkedinUrl: member.linkedin || undefined,
        instagramUrl: member.instagram || undefined,
        socialLinks,
      };
    });
  }, []);

  // Branded logo as a ReactNode text element
  const brandLogo = React.useMemo(() => {
    return (
      <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text font-black tracking-tight text-transparent">
        INVERTISPREP
      </span>
    );
  }, []);

  return (
    <div className="relative min-h-screen bg-background py-10 md:py-16">
      {/* Team section */}
      <TeamSection
        title="Meet the People behind our success"
        description="The developers, managers, designers, and specialists who work tirelessly to build InvertisPrep and support student success."
        members={members}
        logo={brandLogo}
        registerLink="https://forms.gle/itpqynriXxkC4bWTA"
      />

      {/* Mission & Join Our Team Grid */}
      <div className="mx-auto mt-10 max-w-5xl px-4 pb-16">
        {/* Section heading for hierarchy */}
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Our Mission &amp; Open Roles
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            What drives us, and how you can become part of the team.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2">
          {/* Mission Card */}
          <Card className="group relative h-full overflow-hidden border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <Compass className="h-6 w-6" />
              </div>
              <CardTitle className="font-bold text-2xl text-foreground">
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-start gap-4">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                At InvertisPrep, we&apos;re dedicated to making quality education
                resources accessible to every student. Our team works tirelessly
                to provide comprehensive PYQs, syllabus materials, and interactive
                tools to help students succeed in their exams.
              </p>
            </CardContent>
          </Card>

          {/* Join Our Team Card */}
          <Card className="group relative h-full overflow-hidden border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-300" />
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-lg">
                <Briefcase className="h-6 w-6" />
              </div>
              <CardTitle className="font-bold text-2xl text-foreground">
                Join Our Team
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col items-start gap-4">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                We&apos;re always looking for talented individuals who are passionate
                about education and technology. If you&apos;re interested in joining
                our team, check out our current openings.
              </p>
              <a
                className="mt-auto inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-sm text-white transition-all duration-300 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                href="https://forms.gle/itpqynriXxkC4bWTA"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Open Positions
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}