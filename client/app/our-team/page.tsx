"use client";

import React, { useState } from "react";
import { LinkedinIcon, GithubIcon, InstagramIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const teamMembers = [
  {
    name: "Ahqaf Ali",
    role: "Founder & Lead",
    image: "/team/member1.jpg",
    linkedin: "https://www.linkedin.com/in/ahqaf-ali/",
    github: "https://github.com/AhqafCoder",
  },
  {
    name: "Sumanjeet Raj",
    role: "Content Lead",
    image: "/team/member2.jpg",
    linkedin: "https://www.linkedin.com/in/sumanjeet-raj-a59209380/",
    github: "https://github.com/Sumanjeetraj",
  },
  {
    name: "Rajan Sharma",
    role: "Front End Developer",
    image: "/team/member3.jpg",
    linkedin: "https://linkedin.com/in/rajan-sharma",
    github: "https://github.com/rajansharma",
  },
  {
    name: "Bakhtiyar Ali",
    role: "Data Analyst",
    image: "/team/member4.jpg",
    linkedin: "https://www.linkedin.com/in/bakhtiyar-ali-38526a37a",
    github: "https://github.com/Bakhtiyarali291-png",
  },
  {
    name: "Khanak Aggarwal",
    role: "Manager",
    image: "/team/member5.jpg",
    linkedin: "https://www.linkedin.com/in/khanak-agarwal-24ka",
    instagram: "https://insta.openinapp.co/ln1gy",
  },
  {
    name: "Prarthna Gupta",
    role: "Marketing Specialist",
    image: "/team/member6.jpg",
    linkedin: "https://www.linkedin.com/in/prarthna-gupta-a7076037a?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    github: "",
    instagram: "https://www.instagram.com/praru_20?igsh=MWdidGx1ejR5amRncw==",
  },
  {
    name: "Krishu Kumar",
    role: "Front End Developer",
    image: "/team/member7.jpg",
    linkedin: "https://www.linkedin.com/in/krishukumar72",
  },
];

function Marquee({
  children,
  pauseOnHover = false,
}: {
  children: React.ReactNode;
  pauseOnHover?: boolean;
}) {
  return (
    <div
      className={`flex w-full overflow-hidden ${
        pauseOnHover ? "marquee-hover-zone" : ""
      }`}
      style={{ "--gap": "1.5rem" } as React.CSSProperties}
    >
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 35s linear infinite;
          will-change: transform;
        }
        .marquee-hover-zone:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>
      {/* No gap on the outer track — both copies must be exactly equal width */}
      <div className="flex shrink-0 marquee-track">
        <div className="flex shrink-0" style={{ gap: "var(--gap)", paddingRight: "var(--gap)" }}>
          {children}
        </div>
        <div className="flex shrink-0" style={{ gap: "var(--gap)", paddingRight: "var(--gap)" }} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

function TeamAvatar({ name, image }: { name: string; image?: string }) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!image || errored) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-4xl font-bold text-indigo-400">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      className="h-full w-full object-cover"
      onError={() => setErrored(true)}
    />
  );
}

function SocialButtons({
  linkedin,
  github,
  instagram
}: {
  linkedin?: string;
  github?: string;
  instagram?: string;
}) {
  if (!linkedin && !github && !instagram) return null;

  return (
    <div className="absolute top-2 right-2 z-20 grid gap-2 opacity-50 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn profile"
          onClick={(e) => e.stopPropagation()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md transition-colors hover:bg-indigo-600 hover:text-white"
        >
          <LinkedinIcon className="h-4 w-4" />
        </a>
      )}
      {github && (
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub profile"
          onClick={(e) => e.stopPropagation()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md transition-colors hover:bg-neutral-900 hover:text-white"
        >
          <GithubIcon className="h-4 w-4" />
        </a>
      )}
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram profile"
          onClick={(e) => e.stopPropagation()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md transition-colors hover:bg-pink-500 hover:text-white"
        >
          <InstagramIcon className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

export default function OurTeamPage() {
  return (
    <section className="relative w-full overflow-hidden bg-white py-8 md:py-20">
      <div>
        <svg
          className="absolute right-0 bottom-0 text-neutral-200"
          fill="none"
          height="154"
          viewBox="0 0 460 154"
          width="460"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_494_1104)">
            <path
              d="M-87.463 458.432C-102.118 348.092 -77.3418 238.841 -15.0744 188.274C57.4129 129.408 180.708 150.071 351.748 341.128C278.246 -374.233 633.954 380.602 548.123 42.7707"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="40"
            />
          </g>
          <defs>
            <clipPath id="clip0_494_1104">
              <rect fill="white" height="154" width="460" />
            </clipPath>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-16 flex max-w-5xl flex-col items-center px-6 text-center lg:px-0">
          <h1 className="relative mb-4 font-bold text-4xl text-neutral-900 tracking-tight sm:text-5xl">
            Meet the People behind our success
            <svg
              className="absolute -top-2 -right-8 -z-10 w-24 text-neutral-200"
              fill="currentColor"
              height="86"
              viewBox="0 0 108 86"
              width="108"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M38.8484 16.236L15 43.5793L78.2688 15L18.1218 71L93 34.1172L70.2047 65.2739"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="28"
              />
            </svg>
          </h1>
        </div>

        {/* Team Marquee */}
        <div className="relative w-full">
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-32 bg-gradient-to-r from-white-300 to-transparent" />
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-32 bg-gradient-to-l from-white-300 to-transparent" />

          <Marquee pauseOnHover>
            {teamMembers.map((member) => (
              <div
                className="group flex w-68 shrink-0 flex-col"
                key={member.name}
              >
                <div className="relative flex h-70 w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 transition-colors duration-500 group-hover:bg-indigo-50">
                  <SocialButtons linkedin={member.linkedin} github={member.github} instagram={member.instagram} />
                  <TeamAvatar name={member.name} image={member.image} />
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/85 to-transparent p-2 text-center">
                    <h3 className="font-semibold text-neutral-100/100 text-lg">
                      {member.name}
                    </h3>
                    <p className="text-neutral-100/75 text-sm">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>

        {/* Mission & Join Our Team */}
        <div className="flex flex-col gap-12 mt-20 mx-2 md:mx-75">
          <Card className="text-center h-full w-10/12 mx-auto">
            <CardHeader>
              <CardTitle className="font-bold text-3xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                At InvertisPrep, we're dedicated to making quality education
                resources accessible to every student. Our team works
                tirelessly to provide comprehensive PYQs, syllabus materials,
                and interactive tools to help students succeed in their
                exams.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center h-full w-10/12 mx-auto my-8">
            <CardHeader>
              <CardTitle className="font-bold text-3xl">Join Our Team</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <p className="mb-4 text-neutral-600">
                We're always looking for talented individuals who are
                passionate about education and technology. If you're
                interested in joining our team, check out our current
                openings.
              </p>
              <a className="inline-flex rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 font-medium text-sm text-white transition-colors hover:bg-indigo-700"
                href="https://forms.gle/itpqynriXxkC4bWTA"
                target="_blank"
                rel="noopener noreferrer">
                View Open Positions
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}