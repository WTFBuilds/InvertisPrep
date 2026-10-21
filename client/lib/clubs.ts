import type { ElementType } from 'react';
import {
  Paintbrush,
  Heart,
  Music,
  BookOpen,
  Cpu,
  Trophy,
  Briefcase,
} from 'lucide-react';

export interface ClubEvent {
  title: string;
  description: string;
  month: string;
  day: string;
  time: string;
  venue: string;
  category: string;
  /** What a participant actually does at the event — shown in the RSVP flow. */
  agenda: string[];
  seats: number;
  seatsLeft: number;
  /** Who the event is aimed at. */
  audience: string;
  rsvpDeadline: string;
  perks: string[];
}

export interface ClubMember {
  role: string;
  name: string;
  branch: string;
  /** One-line credential shown under the name. */
  note: string;
}

export interface Achievement {
  title: string;
  detail: string;
  year: string;
  kind: 'Award' | 'Milestone' | 'Record' | 'Recognition';
}

export interface Club {
  id: string;
  name: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  mission: string;
  vision: string;
  coordinator: string;
  coordinatorRole: string;
  coordinatorNote: string;
  img: string;
  color: string;
  colorLight: string;
  colorDark: string;
  gradient: string;
  icon: ElementType;
  highlights: string[];
  stats: { label: string; value: string }[];
  activities: { title: string; description: string; cadence: string }[];
  events: ClubEvent[];
  team: ClubMember[];
  joinProcess: { step: string; title: string; description: string }[];
  achievements: Achievement[];
  /** Practical details students care about: fee, timings, eligibility. */
  logistics: { label: string; value: string }[];
  /** What previous members say. */
  testimonials: { quote: string; name: string; detail: string }[];
  /** Common questions. */
  faqs: { question: string; answer: string }[];
  /** Sub-groups inside the club. */
  wings: { name: string; description: string }[];
}

export const CLUBS: Record<string, Club> = {
  panache: {
    id: 'panache',
    name: 'Panache',
    tagline: 'The Arts Club',
    shortDescription:
      'Explore the world of arts, painting, and creativity through workshops, exhibitions, and collaborative projects.',
    longDescription:
      'Panache is the creative heartbeat of Abhiruchi. From canvas to digital art, we provide a platform for every artist to express, experiment, and evolve. Our annual art exhibition showcases 200+ student artworks, while weekly sketching sessions, mural projects, and digital design workshops keep the creative muscles flexed year-round. Whether you pick up a brush for the first time or arrive with a portfolio, there is room for your style here. Nothing we run has a precondition — you are never told what to make, only given the tools, the space and the company.',
    mission:
      'To nurture artistic talent in every student by providing the tools, space, and platform to create fearlessly.',
    vision:
      'A campus where every student has made something they are proud of, and every artist has found their audience.',
    coordinator: 'Dr. Anjali Sharma',
    coordinatorRole: 'Faculty Coordinator',
    coordinatorNote:
      'Associate Professor, School of Design. Has mentored Panache for six years and curated 15 student exhibitions.',
    img: '/images/panache.png',
    color: '#F97316',
    colorLight: '#FFF7ED',
    colorDark: '#C2410C',
    gradient: 'from-orange-500 via-rose-500 to-pink-500',
    icon: Paintbrush,
    highlights: [
      'Annual Art Exhibition',
      'Weekly Sketching Sessions',
      'Digital Design Workshops',
      'Community Mural Projects',
      'Inter-college Art Competitions',
    ],
    stats: [
      { label: 'Artists', value: '400+' },
      { label: 'Exhibitions', value: '15+' },
      { label: 'Workshops / Year', value: '25+' },
    ],
    wings: [
      {
        name: 'Fine Arts Wing',
        description:
          'Painting, drawing, printmaking and sculpture. Traditional studio practice with full material support.',
      },
      {
        name: 'Digital Wing',
        description:
          'Illustration, 2D animation, 3D modelling and motion graphics — the same creative eye, new tools.',
      },
      {
        name: 'Mural Collective',
        description:
          'Large-format team painting on campus and city walls. Twice a year, open recruitment, no experience needed.',
      },
      {
        name: 'Photography Desk',
        description:
          'Run jointly with Images. Exhibition-quality shooting for exhibitions, murals and campus shoots.',
      },
    ],
    activities: [
      {
        title: 'Weekly Sketching Circle',
        description:
          'Every Wednesday evening we gather on the studio terrace for open sketching sessions. Life drawing, quick sketches and figure studies — all skill levels welcome, and no one is ever asked to show their work.',
        cadence: 'Wednesdays · 5:00 – 7:00 PM · Studio Terrace',
      },
      {
        title: 'Colour & Canvas Lab',
        description:
          'A materials-first workshop series covering pigments, brushes, canvas stretching, priming and the fundamentals of colour mixing. We provide the supplies; you leave with a finished piece.',
        cadence: 'Bi-weekly · Saturdays · Studio Block',
      },
      {
        title: 'Mural Collaborative',
        description:
          'Twice a year the club paints a 60-foot campus wall mural designed and executed by a student team. Applications open two months prior to each cycle.',
        cadence: 'Twice a year · 6-week build',
      },
      {
        title: 'Digital Art Studio',
        description:
          'From Procreate to Photoshop and Blender, we run guided sessions on digital illustration, 2D animation and 3D modelling with practising designers from the industry.',
        cadence: 'Monthly · Lab 2, Media Block',
      },
      {
        title: 'Critique Circle',
        description:
          'A peer-review session where members present work-in-progress and receive structured feedback on composition, colour and concept. Facilitated, not judgmental.',
        cadence: 'Monthly · Seminar Hall C',
      },
    ],
    events: [
      {
        title: 'Aakanksha — Annual Art Exhibition',
        description:
          'Two floors of student artwork across painting, sculpture, digital art and photography, judged by a panel of professional artists, with certificates and cash prizes.',
        month: 'Nov',
        day: '22',
        time: '10:00 AM – 6:00 PM',
        venue: 'University Central Auditorium',
        category: 'Flagship',
        agenda: [
          '10:00 AM — Doors open, welcome address by the Dean',
          '11:00 AM — Live painting demo by the guest artist',
          '12:00 PM — Student art on display across two floors',
          '3:00 PM — Live critique and judging',
          '4:30 PM — Results and prize distribution',
          '5:00 PM — Certificates for all exhibiting artists',
        ],
        seats: 400,
        seatsLeft: 137,
        audience: 'Open to all students. Exhibiting slots are competitive and selected from member portfolios.',
        rsvpDeadline: 'November 15, 2026',
        perks: ['Certificate of participation', 'Exhibition catalogue', 'Refreshments', 'Portfolio review'],
      },
      {
        title: 'Colour Splash — Inter-college Competition',
        description:
          'A live painting duel between 12 colleges, judged on theme interpretation, technique and presentation.',
        month: 'Feb',
        day: '14',
        time: '11:00 AM – 4:00 PM',
        venue: 'Art Block, Ground Floor',
        category: 'Competition',
        agenda: [
          '11:00 AM — Theme announcement and team formation',
          '11:30 AM — Live painting begins (4 hours)',
          '2:00 PM — Breaks and mentoring session',
          '3:30 PM — Submission and jury walkthrough',
          '4:00 PM — Results and awards',
        ],
        seats: 120,
        seatsLeft: 41,
        audience: 'Teams of 3. InvertisPrep students can register individually; we pair you with a team.',
        rsvpDeadline: 'February 4, 2026',
        perks: ['All materials provided', 'Team certificate', 'Cash prize for top 3', 'Food and refreshments'],
      },
      {
        title: 'Frame Your Mind — Portfolio Review',
        description:
          'Graduating art students present their portfolios to a panel of gallery owners and design-studio recruiters.',
        month: 'Apr',
        day: '05',
        time: '2:00 PM – 5:00 PM',
        venue: 'Seminar Hall B',
        category: 'Workshop',
        agenda: [
          '2:00 PM — Portfolio format and curation guidance',
          '2:45 PM — Student presentations (8 mins each)',
          '3:45 PM — Panel critique and live redlining',
          '4:45 PM — Recruiter Q&A',
          '5:00 PM — Closing notes',
        ],
        seats: 80,
        seatsLeft: 19,
        audience: 'Final-year students and any member with a body of work to show.',
        rsvpDeadline: 'March 28, 2026',
        perks: ['Professional critique', 'Portfolio take-away template', 'Mentor pairing'],
      },
    ],
    team: [
      { role: 'President', name: 'Aarav Mehra', branch: 'BFA, 4th Year', note: 'Oil painting, portraiture' },
      { role: 'Vice President', name: 'Ishita Rawat', branch: 'BA Fine Arts, 3rd Year', note: 'Exhibition lead, Aakanksha 2025' },
      { role: 'Secretary', name: 'Kabir Thakur', branch: 'B.Des, 3rd Year', note: 'Runs the material inventory' },
      { role: 'Treasurer', name: 'Sneha Kapoor', branch: 'BFA, 2nd Year', note: 'Budget and sponsorship lead' },
      { role: 'Curator', name: 'Rohan Dixit', branch: 'B.Des, 3rd Year', note: 'Digital wing coordinator' },
    ],
    joinProcess: [
      {
        step: '01',
        title: 'Attend an Open Session',
        description:
          'Drop into any weekly sketching circle or workshop. No registration needed for your first visit.',
      },
      {
        step: '02',
        title: 'Submit a Membership Form',
        description:
          'Fill the short form with your details and pick your primary discipline — painting, digital, sculpture or photography.',
      },
      {
        step: '03',
        title: 'Meet the Core Team',
        description:
          'A short informal conversation with the club council. We want to know what you want to make, not test you.',
      },
      {
        step: '04',
        title: 'Start Creating',
        description:
          'Get studio access, material support, and a slot in the next exhibition within the same week.',
      },
    ],
    achievements: [
      {
        title: 'Aakanksha 2025 — Best Exhibition Design',
        detail: 'Our curatorial team took the inter-university exhibition design award for the campus atrium installation.',
        year: '2025',
        kind: 'Award',
      },
      {
        title: '200 artworks hung in a single edition',
        detail: 'Aakanksha 2025 was the largest student art exhibition in the university’s history.',
        year: '2025',
        kind: 'Record',
      },
      {
        title: '3 alumni commissions in one year',
        detail: 'Members secured paid mural and illustration commissions with local businesses and city administration.',
        year: '2026',
        kind: 'Milestone',
      },
      {
        title: 'Recognised by the University Art Cell',
        detail: 'Formally recognised as the university’s official creative platform for all student art.',
        year: '2024',
        kind: 'Recognition',
      },
    ],
    logistics: [
      { label: 'Membership fee', value: 'Free for all students' },
      { label: 'Studio access', value: 'Mon – Sat, 9:00 AM – 7:00 PM' },
      { label: 'Materials', value: 'Subsidised — club provides basic stock' },
      { label: 'Eligibility', value: 'Open to every branch, all years' },
      { label: 'Minimum commitment', value: 'None' },
    ],
    testimonials: [
      {
        quote:
          'I joined because I wanted to draw badly in public. Two years later I have a portfolio, a mural on the library wall, and I lead the exhibition design for Aakanksha. The club did not care that I was starting from zero.',
        name: 'Ishita Rawat',
        detail: 'Vice President, Panache · BA Fine Arts, 3rd Year',
      },
      {
        quote:
          'The critique circle is where I actually learned to see. Every session someone says something that changes how you look at your own work. No fees, no gatekeeping, no ego.',
        name: 'Kabir Thakur',
        detail: 'Secretary, Panache · B.Des, 3rd Year',
      },
    ],
    faqs: [
      {
        question: 'I have no artistic experience. Will I be out of place?',
        answer:
          'Not at all. Most members arrive having never taken an art class. The sketching circle and the Colour & Canvas Lab exist precisely so you can start from materials, not talent.',
      },
      {
        question: 'Do I need to buy my own materials?',
        answer:
          'No. The club maintains a shared stock of canvases, brushes, pigments and paper. Members contribute a small annual contribution towards consumables, and everything else is provided.',
      },
      {
        question: 'Can I exhibit without being a member?',
        answer:
          'Yes. Aakanksha accepts entries from all Invertis University students, member or not. Membership simply gives you studio access, material support and a faster review process.',
      },
      {
        question: 'Is there a portfolio requirement to join?',
        answer:
          'No. There is no portfolio requirement for membership at all — only for exhibiting at Aakanksha, where slots are competitive and selected from submitted work.',
      },
    ],
  },

  tri: {
    id: 'tri',
    name: 'The Responsible Invertian',
    tagline: 'Social Cause Club',
    shortDescription:
      'Making a difference in society through social service, awareness campaigns, and community outreach programs.',
    longDescription:
      'TRI embodies the spirit of seva. Our volunteers have contributed 10,000+ hours to causes ranging from blood donation drives and plantation drives to teaching underprivileged children and disaster relief. We partner with NGOs, local administration, and the university to create measurable impact — every campaign has a target, a team, and a published outcome. What starts as a weekend drive becomes a habit of responsibility that follows students far beyond campus. The club is deliberately non-selective in who it accepts and selective about what it does.',
    mission:
      'To instil social responsibility in every student by turning compassion into organised, measurable action.',
    vision:
      'A generation of graduates who do not just enter the workforce, but actively shape the communities around them.',
    coordinator: 'Prof. Rajesh Kumar',
    coordinatorRole: 'Faculty Coordinator',
    coordinatorNote:
      'Assistant Professor, Department of Social Work. Coordinates TRI with three partner NGOs and the district administration.',
    img: '/images/tri.png',
    color: '#22C55E',
    colorLight: '#F0FDF4',
    colorDark: '#15803D',
    gradient: 'from-emerald-500 via-green-600 to-teal-600',
    icon: Heart,
    highlights: [
      'Blood Donation Drives',
      'Plantation Campaigns',
      'Education Outreach',
      'Disaster Relief Response',
      'Health Awareness Programs',
    ],
    stats: [
      { label: 'Volunteers', value: '800+' },
      { label: 'Hours Served', value: '10K+' },
      { label: 'Lives Impacted', value: '5K+' },
    ],
    wings: [
      {
        name: 'Education Wing',
        description:
          'Teaching mathematics and science to children at three government schools, twice a week, all semester.',
      },
      {
        name: 'Health Wing',
        description:
          'Blood donation camps, health checkup desks, and awareness sessions on nutrition, mental health and hygiene.',
      },
      {
        name: 'Environment Wing',
        description:
          'Plantation drives, waste segregation, and campus greening with the forest department.',
      },
      {
        name: 'Relief Wing',
        description:
          'A trained standby unit for flood, heatwave and pandemic relief, activated within 24 hours of a declaration.',
      },
    ],
    activities: [
      {
        title: 'RaktBindu — Blood Donation Drives',
        description:
          'Twice-yearly camps with a partner blood bank, including donor screening, medical counselling, and follow-up for the families of every collected unit.',
        cadence: 'Twice a year · Dec & Apr · Medical Centre',
      },
      {
        title: 'Vriksh — Plantation Drives',
        description:
          'Monsoon-season tree planting across Bareilly district with the forest department, plus a year-round care and survival-tracking programme for saplings we plant.',
        cadence: 'Monsoon season · Monthly follow-ups',
      },
      {
        title: 'Shiksha Saathi — Education Outreach',
        description:
          'Our volunteers teach mathematics and science to 120+ children at three government schools. Sessions run twice a week, every week of the semester.',
        cadence: 'Tuesdays & Fridays · 2:00 – 3:30 PM',
      },
      {
        title: 'Disaster Response Cell',
        description:
          'A trained volunteer unit on standby for flood and pandemic relief, activated within 24 hours of a state or district emergency declaration.',
        cadence: 'On call · 24-hour activation',
      },
      {
        title: 'Seva Conclave',
        description:
          'An open monthly session where campaign leads present outcomes, hours and impact data, followed by planning for the next cycle.',
        cadence: 'Monthly · Last Saturday',
      },
    ],
    events: [
      {
        title: 'RaktBindu — Blood Donation Camp',
        description:
          'A full-day camp with a licensed blood bank, donor card issuance and a health checkup desk for all participants.',
        month: 'Dec',
        day: '08',
        time: '9:00 AM – 4:00 PM',
        venue: 'University Medical Centre',
        category: 'Outreach',
        agenda: [
          '9:00 AM — Registration and donor screening',
          '9:30 AM — Health checkup and counselling desk opens',
          '10:00 AM — Blood collection begins',
          '1:00 PM — Donor refreshments and rest area',
          '3:00 PM — Final collection slot',
          '4:00 PM — Donor cards issued, collection handoff to the blood bank',
        ],
        seats: 300,
        seatsLeft: 118,
        audience: 'Open to all students aged 18+ with a valid college ID. Non-students may attend as walk-ins.',
        rsvpDeadline: 'December 1, 2026',
        perks: ['Donor card', 'Health checkup', 'Refreshments', 'Certificate of service'],
      },
      {
        title: 'Swachh Bareilly — Clean-up Drive',
        description:
          'A city-wide clean-up across three localities with the municipal body, supported by 200 volunteers and a waste segregation station.',
        month: 'Jan',
        day: '26',
        time: '7:00 AM – 11:00 AM',
        venue: 'Meerut Road & Stadium Routes',
        category: 'Campaign',
        agenda: [
          '7:00 AM — Reporting at the three route points',
          '7:15 AM — Zone allocation and safety briefing',
          '7:30 AM – 10:00 AM — Collection, segregation and transport',
          '10:00 AM — Segregation station setup and weighing',
          '10:30 AM — Municipal handover and cleanup',
          '11:00 AM — Debrief and refreshments',
        ],
        seats: 200,
        seatsLeft: 47,
        audience: 'Open to all students. Prior outdoor-drive experience is helpful but never required.',
        rsvpDeadline: 'January 18, 2026',
        perks: ['Gloves and safety gear provided', 'Certificate of service', 'Refreshments', 'Community hours recorded'],
      },
      {
        title: 'Seva Conclave — Impact Review',
        description:
          'An open session where every campaign lead presents outcomes, hours and impact data for the year, followed by a planning workshop for the next cycle.',
        month: 'Mar',
        day: '15',
        time: '3:00 PM – 6:00 PM',
        venue: 'Seminar Hall A',
        category: 'Review',
        agenda: [
          '3:00 PM — Year-in-review by the club council',
          '3:30 PM — Campaign lead presentations (outcomes and data)',
          '4:45 PM — Partner NGO and administrative feedback',
          '5:15 PM — Open floor: what worked, what did not',
          '5:45 PM — Planning workshop for the next cycle',
          '6:00 PM — New campaign leads announced',
        ],
        seats: 150,
        seatsLeft: 88,
        audience: 'Open to everyone — especially current and prospective volunteers.',
        rsvpDeadline: 'March 10, 2026',
        perks: ['Impact report', 'Volunteer recognition certificate', 'Refreshments'],
      },
    ],
    team: [
      { role: 'President', name: 'Ananya Mishra', branch: 'BCA, 3rd Year', note: 'Led 3 education drives' },
      { role: 'Vice President', name: 'Harsh Vardhan', branch: 'B.Tech ECE, 4th Year', note: 'Disaster response cell lead' },
      { role: 'Secretary', name: 'Priya Choudhary', branch: 'B.Com, 2nd Year', note: 'Partner NGO liaison' },
      { role: 'Volunteer Head', name: 'Devansh Rathore', branch: 'BCA, 2nd Year', note: 'Manages volunteer rosters' },
      { role: 'Outreach Coordinator', name: 'Meera Joshi', branch: 'BA, 3rd Year', note: 'School programme coordinator' },
    ],
    joinProcess: [
      {
        step: '01',
        title: 'Attend a Seva Orientation',
        description:
          'A monthly one-hour session where we walk through active campaigns and what each needs. Open to every student, no prior volunteering experience required.',
      },
      {
        step: '02',
        title: 'Choose Your Cause',
        description:
          'Pick the campaign closest to you — education, environment, health or relief. We match you with a team and a lead.',
      },
      {
        step: '03',
        title: 'Sign the Volunteer Pledge',
        description:
          'A short commitment form with the expected hours for the semester, so teams can plan around real availability.',
      },
      {
        step: '04',
        title: 'Serve and Report',
        description:
          'Log your hours, and see the impact report for your campaign at the end of term — including what your hours specifically achieved.',
      },
    ],
    achievements: [
      {
        title: '10,000+ volunteer hours',
        detail: 'Cumulative service hours logged by club members since 2018, published in the annual impact report.',
        year: '2026',
        kind: 'Record',
      },
      {
        title: 'District Administration Partnership',
        detail: 'Signed a formal MoU with the Bareilly district administration to co-run cleanliness and health campaigns.',
        year: '2025',
        kind: 'Recognition',
      },
      {
        title: 'Best NGO Collaboration — Bareilly',
        detail: 'Recognised at the state social-impact forum for the Shiksha Saathi school programme.',
        year: '2025',
        kind: 'Award',
      },
      {
        title: '400+ units of blood collected',
        detail: 'Across six camps in the last three years, with a 100% donor follow-up record.',
        year: '2026',
        kind: 'Milestone',
      },
    ],
    logistics: [
      { label: 'Membership fee', value: 'Free — no fees, ever' },
      { label: 'Commitment', value: 'Flexible — 2 hrs/month minimum' },
      { label: 'Travel', value: 'Club-arranged transport for drives' },
      { label: 'Equipment', value: 'All safety gear and materials provided' },
      { label: 'Certification', value: 'Service certificates each semester' },
    ],
    testimonials: [
      {
        quote:
          'I joined because a drive was happening on a Sunday and I had nothing better to do. I ended up teaching maths to a class of nine kids for a year and a half. That is not what I planned, but it changed what I do now.',
        name: 'Ananya Mishra',
        detail: 'President, TRI · BCA, 3rd Year',
      },
      {
        quote:
          'The thing that keeps people here is the reporting. You log your hours and at the end of term you see the number — and you see what the number did. Most volunteer work vanishes into nothing. Here it does not.',
        name: 'Harsh Vardhan',
        detail: 'Vice President, TRI · B.Tech ECE, 4th Year',
      },
    ],
    faqs: [
      {
        question: 'I have no volunteering experience. Is that a problem?',
        answer:
          'Not at all. Our drives are designed so that a first-timer can be useful from day one — collection, sorting, setup and teaching support all need hands. The orientation covers everything you need.',
      },
      {
        question: 'How much time does it actually take?',
        answer:
          'Most members commit to around two hours a week, with occasional larger drives. If you can only join summer campaigns, that is also fine — several of our biggest contributions come from seasonal volunteers.',
      },
      {
        question: 'Do I get a certificate that is actually worth anything?',
        answer:
          'Yes. Service certificates carry the faculty coordinator’s sign-off and the club’s impact report reference, which is recognised by the university and usable for placement and internship applications.',
      },
      {
        question: 'Can I work with a cause outside Bareilly?',
        answer:
          'Yes. The Relief Wing mobilises for state-level and national emergencies, and we have supported disaster response in three districts. Sign up for the Relief Wing roster and you will be called when needed.',
      },
    ],
  },

  rockon: {
    id: 'rockon',
    name: 'Rock On',
    tagline: 'The Cultural Club',
    shortDescription:
      'Dance, music, drama — expressing culture through performances, competitions, and grand cultural festivals.',
    longDescription:
      'Rock On stages the university’s most anticipated cultural extravaganzas. From classical to contemporary, solo to ensemble — we celebrate every form of performing arts. Our flagship fest Sanskriti draws 5000+ attendees, while weekly jam sessions, dance battles, and theatre workshops nurture performers at every level. We also run a full technical crew track — lights, sound, stage management, choreography — so students can grow behind the scenes as much as on them. Every member gets a stage within their first term; that is not a slogan, it is a scheduling commitment we make and keep.',
    mission:
      'To give every student a stage — whether as a performer, a technician, or a creative — and a platform where culture is made, not just consumed.',
    vision:
      'A university where every art form has a home, and every student is encouraged to attempt it at least once.',
    coordinator: 'Dr. Meera Singh',
    coordinatorRole: 'Faculty Coordinator',
    coordinatorNote:
      'Professor, School of Humanities. Choreographed the university’s inaugural cultural fest and oversees the Sanskriti production.',
    img: '/images/rockon.png',
    color: '#EC4899',
    colorLight: '#FDF2F8',
    colorDark: '#BE185D',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    icon: Music,
    highlights: [
      'Sanskriti Cultural Fest',
      'Dance Battles & Group Choreography',
      'Music Jams & Open Mic',
      'Theatre Productions',
      'Battle of the Bands',
    ],
    stats: [
      { label: 'Performers', value: '600+' },
      { label: 'Events / Year', value: '40+' },
      { label: 'Audience Reach', value: '20K+' },
    ],
    wings: [
      {
        name: 'Music Wing',
        description:
          'Acoustic, electric, vocal and classical — the jam session, the open mic, and the bands that compete at Battle of the Bands.',
      },
      {
        name: 'Dance Wing',
        description:
          'Contemporary, classical, hip-hop, folk and breakdance crews that train weekly and perform at every major event.',
      },
      {
        name: 'Theatre Wing',
        description:
          'Street plays, one-act plays and full-length productions, toured to colleges across the region.',
      },
      {
        name: 'Technical Crew',
        description:
          'Sound, lighting, projection, stage management and choreography — the people who make a show actually work.',
      },
    ],
    activities: [
      {
        title: 'Weekly Jam Sessions',
        description:
          'An open, no-pressure stage every Friday evening. Bring an instrument, a voice, or just an audience. We supply the amps, the backdrop and the snacks.',
        cadence: 'Fridays · 6:00 – 9:00 PM · Open Air Theatre',
      },
      {
        title: 'Dance Crew',
        description:
          'Contemporary, classical, hip-hop and folk crews training weekly with professional choreographers. Groups form every semester and perform at Sanskriti.',
        cadence: 'Weekly · 5 rehearsal slots',
      },
      {
        title: 'Theatre Cell',
        description:
          'From street plays to full-length productions. We rehearse in the studio, learn stage combat basics, and tour our plays to nearby colleges.',
        cadence: 'Weekly · Studio, Humanities Block',
      },
      {
        title: 'Technical Crew',
        description:
          'Sound, lighting, stage management and projection tracks for students who prefer the craft backstage. Our crew runs every major production end to end.',
        cadence: 'Event-based · Tech rehearsal on production days',
      },
      {
        title: 'Open Mic & Storytelling',
        description:
          'An evening of unfiltered voices — poetry, stand-up, monologue and monologue pieces. A monthly fixture that regularly produces the club’s strongest newcomers.',
        cadence: 'Monthly · Second Saturday',
      },
    ],
    events: [
      {
        title: 'Sanskriti — The Cultural Fest',
        description:
          'Three days, 40+ events, 12 college teams and 5000+ attendees. Pro-show performances, inter-college competitions, food stalls and an all-night open mic.',
        month: 'Mar',
        day: '12',
        time: 'All day, 3 days',
        venue: 'University Ground & Auditorium',
        category: 'Flagship',
        agenda: [
          'Day 1 — Inauguration, pro-show, Battle of the Bands prelims',
          'Day 2 — Group dance, solo singing, theatre showcase, night jam',
          'Day 3 — Literary events, fashion walk, closing ceremony and prize distribution',
          'All three days — food stalls, sponsor booths and open mic from 9 PM',
        ],
        seats: 1200,
        seatsLeft: 386,
        audience:
          'Performers: any student via a club crew. Audience: open to all students and the public with a nominal entry pass.',
        rsvpDeadline: 'March 1, 2026',
        perks: [
          'Sanskriti merchandise',
          'Food court voucher',
          'Participation certificate',
          'Event photography pack',
        ],
      },
      {
        title: 'Battle of the Bands',
        description:
          'Bands from 15 colleges go head-to-head over two nights. Original compositions only, judged by a panel of professional musicians.',
        month: 'Nov',
        day: '20',
        time: '6:00 PM – 10:00 PM',
        venue: 'Open Air Theatre',
        category: 'Competition',
        agenda: [
          '6:00 PM — Sound check and stage setup',
          '6:30 PM — Opening act and rules briefing',
          '7:00 PM — Round 1: eight bands',
          '8:30 PM — Interval and audience interaction',
          '9:00 PM — Round 2: six bands',
          '10:00 PM — Results and closing',
        ],
        seats: 500,
        seatsLeft: 152,
        audience:
          'Bands of 3–6 members, original compositions only. Registration closes one week before the event.',
        rsvpDeadline: 'November 10, 2026',
        perks: ['Soundcheck slot', 'Professional mixing desk', 'Cash prize', 'Band certificate'],
      },
      {
        title: 'Nukkad Natya — Street Play Festival',
        description:
          'Original street plays on social themes, staged in public spaces across the city. Raw, loud and unapologetically political.',
        month: 'Feb',
        day: '08',
        time: '4:00 PM – 8:00 PM',
        venue: 'Campus Plaza & City Circle',
        category: 'Festival',
        agenda: [
          '4:00 PM — Team check-in and prop setup',
          '4:30 PM — Opening procession through campus',
          '5:00 PM — First performance block (5 teams)',
          '6:15 PM — Second performance block (5 teams)',
          '7:30 PM — Audience vote and awards',
          '8:00 PM — Close and cleanup',
        ],
        seats: 250,
        seatsLeft: 73,
        audience:
          'Open to all students. Teams of 8–15 with at least 24 hours of rehearsal are required to register.',
        rsvpDeadline: 'January 25, 2026',
        perks: ['Street performance slot', 'Sound support', 'Certificate', 'Refreshments'],
      },
    ],
    team: [
      { role: 'President', name: 'Tanvi Bhatt', branch: 'BA, 3rd Year', note: 'Sanskriti 2026 producer' },
      { role: 'Vice President', name: 'Arjun Nair', branch: 'B.Tech IT, 4th Year', note: 'Leads the technical crew' },
      { role: 'Secretary', name: 'Sanya Rathore', branch: 'BFA, 2nd Year', note: 'Battle of the Bands coordinator' },
      { role: 'Technical Head', name: 'Nikhil Saxena', branch: 'B.Tech ECE, 4th Year', note: 'Sound and lighting for 20+ productions' },
      { role: 'Treasurer', name: 'Ritika Bansal', branch: 'B.Com, 3rd Year', note: 'Sponsor and budget lead' },
    ],
    joinProcess: [
      {
        step: '01',
        title: 'Come to an Open Jam',
        description:
          'Attend any Friday jam session, dance rehearsal or theatre call. Show up as a spectator if that is all you want — that is a valid way in.',
      },
      {
        step: '02',
        title: 'Pick a Discipline',
        description:
          'Performing, dancing, singing, acting or technical crew. We will place you with the right group for your skill level.',
      },
      {
        step: '03',
        title: 'Rehearse',
        description:
          'Crew-specific rehearsals begin in the first month of each semester, building toward the fest circuit and campus productions.',
      },
      {
        step: '04',
        title: 'Perform',
        description:
          'Every member is slotted into at least one production or competition by the end of the first term.',
      },
    ],
    achievements: [
      {
        title: 'Sanskriti — 5,000+ live audience',
        detail: 'The largest student-run cultural festival attendance in the region, verified over three consecutive editions.',
        year: '2025',
        kind: 'Record',
      },
      {
        title: 'Battle of the Bands — Regional Champions',
        detail: 'Our campus band won the northern regional round and represented the state at the national finals.',
        year: '2025',
        kind: 'Award',
      },
      {
        title: 'Nukkad Natya — Best Ensemble',
        detail: 'First prize at the inter-college street play festival for our play on groundwater depletion.',
        year: '2026',
        kind: 'Award',
      },
      {
        title: '40+ productions a year',
        detail: 'The club now produces more live performances annually than the entire university cultural calendar in 2019.',
        year: '2026',
        kind: 'Milestone',
      },
    ],
    logistics: [
      { label: 'Membership fee', value: 'Free' },
      { label: 'Rehearsal slots', value: 'Booked through the club calendar' },
      { label: 'Equipment', value: 'Instruments and sound gear provided' },
      { label: 'Performance slots', value: 'Guaranteed for every member each term' },
      { label: 'Eligibility', value: 'All branches, all years' },
    ],
    testimonials: [
      {
        quote:
          'I could not sing in front of anyone. The open mic on a Friday had four people in it and I played second guitar because I did not want to be alone. A year later I fronted a band at Sanskriti. Nobody in the club cared that I was nervous once.',
        name: 'Tanvi Bhatt',
        detail: 'President, Rock On · BA, 3rd Year',
      },
      {
        quote:
          'I will never be on stage, and I am completely happy. The technical crew is a real craft — sound, lights, stage management. I have run twenty-five productions and it is the best work I have ever done.',
        name: 'Nikhil Saxena',
        detail: 'Technical Head, Rock On · B.Tech ECE, 4th Year',
      },
    ],
    faqs: [
      {
        question: 'I cannot perform. Can I still join?',
        answer:
          'Absolutely, and you should. The technical crew handles sound, lighting, stage management and choreography — it is a full discipline with a full calendar, and it is often where the most indispensable members end up.',
      },
      {
        question: 'Will I definitely get a performance slot?',
        answer:
          'Yes. Every member is placed in at least one production or competition by the end of their first term. If you join in August, you perform before the academic year ends.',
      },
      {
        question: 'Do I need to audition?',
        answer:
          'No audition in the formal sense. Come to an open jam or rehearsal, and the crew leads will place you appropriately. For Battle of the Bands there is a band-level selection, but that is one event, not club membership.',
      },
      {
        question: 'What if I can only come on weekends?',
        answer:
          'The open mic, the jam sessions and the street play festival are all weekend events. Plenty of active members never attend a weekday rehearsal.',
      },
    ],
  },

  images: {
    id: 'images',
    name: 'Images',
    tagline: 'The Publication Club',
    shortDescription:
      'Capturing moments and publishing memories through photography, videography, and editorial excellence.',
    longDescription:
      'Images is the visual storyteller of campus life. Our photographers cover every major event, our videographers produce cinematic after-movies, and our editorial team publishes the annual magazine Reflections. We run photography walks, editing masterclasses, and portfolio reviews with industry professionals. We also maintain the university’s official media archives — a living record of eight years of student life that alumni still request years later. Members learn a craft with real professional standards: framing, lighting, editing, publishing and archiving, each taught by people who do it for a living.',
    mission:
      'To document campus life with an artistic and journalistic standard worthy of the stories we tell.',
    vision:
      'An archive that outlives us — and a club that turns students into confident visual storytellers.',
    coordinator: 'Prof. Amit Verma',
    coordinatorRole: 'Faculty Coordinator',
    coordinatorNote:
      'Professor, School of Mass Communication. Guides the magazine’s editorial standards and oversees the archive policy.',
    img: '/images/images.png',
    color: '#8B5CF6',
    colorLight: '#F5F3FF',
    colorDark: '#6D28D9',
    gradient: 'from-violet-500 via-purple-600 to-indigo-600',
    icon: BookOpen,
    highlights: [
      'Annual Magazine "Reflections"',
      'Event Photography & Coverage',
      'Cinematic After-movies',
      'Photo Walks & Field Trips',
      'Editing & Post-production Masterclasses',
    ],
    stats: [
      { label: 'Photographers', value: '150+' },
      { label: 'Events Covered', value: '200+' },
      { label: 'Magazine Editions', value: '12' },
    ],
    wings: [
      {
        name: 'Photography Desk',
        description:
          'Event coverage, portraits, editorial shoots and the annual magazine photography.',
      },
      {
        name: 'Videography Unit',
        description:
          'After-movies, documentary shorts, reels and the annual festival film — shot and edited entirely by students.',
      },
      {
        name: 'Editorial Desk',
        description:
          'Reporting, writing and proofreading for Reflections and the club’s long-form digital stories.',
      },
      {
        name: 'Design & Archive',
        description:
          'Layout, typography and the maintenance of the university’s permanent media archive.',
      },
    ],
    activities: [
      {
        title: 'Photo Walks',
        description:
          'Monthly walks across Bareilly — old town lanes, the Rohilkhand region, architectural landmarks — led by working photographers who critique shots live.',
        cadence: 'Monthly · Sunday mornings',
      },
      {
        title: 'The Editing Room',
        description:
          'A weekly lab session on Lightroom, Photoshop and Premiere Pro. We work on member-submitted photos, so everyone leaves with a retouched portfolio piece.',
        cadence: 'Weekly · Saturdays · Media Block Lab',
      },
      {
        title: 'Reflections — The Magazine',
        description:
          'Our flagship publication. A 120-page annual edited end-to-end by students — reporting, photography, layout and design, with a print run of 1,000 copies.',
        cadence: 'Annual · Production runs September to April',
      },
      {
        title: 'The Archive',
        description:
          'We maintain a structured, searchable media archive of every club event since 2018, preserved and handed over to the alumni relations team each year.',
        cadence: 'Continuous · Archive Room, Media Block',
      },
      {
        title: 'Cinematic After-movies',
        description:
          'A 90-second festival film cut within 72 hours of the event ending, scored and graded by students, published to the club channel.',
        cadence: 'Post-event · 8–10 flagship events a year',
        },
    ],
    events: [
      {
        title: 'Reflections — Magazine Launch',
        description:
          'The annual print launch of our student-edited magazine, with a screening of this year’s cover film and an exhibition of the top 50 photographs.',
        month: 'Apr',
        day: '18',
        time: '5:00 PM – 8:00 PM',
        venue: 'University Central Auditorium',
        category: 'Flagship',
        agenda: [
          '5:00 PM — Doors open, magazine exhibition and photo wall',
          '5:45 PM — Editor’s note and production credits',
          '6:15 PM — Screening of the cover film',
          '6:45 PM — Top 50 photographs announced and projected',
          '7:30 PM — Founding members honoured',
          '8:00 PM — Close and distribution',
        ],
        seats: 350,
        seatsLeft: 121,
        audience:
          'Open to all students and the public. Editorial contributors receive their contributor copy at the launch.',
        rsvpDeadline: 'April 10, 2026',
        perks: ['Printed copy of Reflections', 'Contributor copy for editors', 'Food and refreshments'],
      },
      {
        title: 'LENS — Photography Exhibition',
        description:
          'A themed exhibition of member photography at the campus gallery, open to the public, with a jury award and catalogue.',
        month: 'Dec',
        day: '12',
        time: '4:00 PM – 8:00 PM',
        venue: 'Campus Art Gallery',
        category: 'Exhibition',
        agenda: [
          '4:00 PM — Doors open, first viewing',
          '5:00 PM — Artist introductions (per photographer)',
          '6:00 PM — Live printing demonstration',
          '7:00 PM — Jury award announcement',
          '7:30 PM — Catalogue sale and signing session',
          '8:00 PM — Close',
        ],
        seats: 200,
        seatsLeft: 64,
        audience:
          'Open to all. Entry to the exhibition is free; selected prints are available for sale with the artist’s share going to them.',
        rsvpDeadline: 'December 5, 2026',
        perks: ['Exhibition catalogue', 'Refreshments', 'Certificate for exhibiting members'],
      },
      {
        title: 'Mastering the Frame — Masterclass',
        description:
          'A two-day intensive with a professional wildlife and travel photographer covering composition, natural light and post-production.',
        month: 'Feb',
        day: '21',
        time: '10:00 AM – 4:00 PM',
        venue: 'Studio, Media Block',
        category: 'Workshop',
        agenda: [
          'Day 1 AM — Composition and visual weight',
          'Day 1 PM — Natural light, golden hour and difficult exposure',
          'Day 2 AM — Field shoot (half day, hands-on)',
          'Day 2 PM — Post-production workflow and critique',
        ],
        seats: 40,
        seatsLeft: 7,
        audience:
          'Open to all members, club or otherwise. Cameras and phones both work. Basic camera familiarity is helpful.',
        rsvpDeadline: 'February 12, 2026',
        perks: ['Two-day intensive', 'Field shoot location', 'Editing presets', 'Certificate'],
      },
    ],
    team: [
      { role: 'President', name: 'Aishwarya Menon', branch: 'BCA, 4th Year', note: 'Reflections 2026 editor-in-chief' },
      { role: 'Vice President', name: 'Yash Choudhary', branch: 'B.Tech IT, 3rd Year', note: 'Runs the archive programme' },
      { role: 'Editor-in-Chief', name: 'Shruti Sinha', branch: 'BA, 3rd Year', note: 'Manages the editorial desk' },
      { role: 'Head of Photography', name: 'Faisal Ahmed', branch: 'BCA, 2nd Year', note: 'Lead event photographer' },
      { role: 'Video Lead', name: 'Pooja Rawat', branch: 'B.Des, 3rd Year', note: 'Directs the festival films' },
    ],
    joinProcess: [
      {
        step: '01',
        title: 'Join an Open Shoot',
        description:
          'Every club event has open photography and videography slots. Join one as a second shooter and see how the club works before committing.',
      },
      {
        step: '02',
        title: 'Submit Your Portfolio',
        description:
          'Ten to fifteen of your best frames. We review skill and eye, not gear — phone photography is absolutely welcome.',
      },
      {
        step: '03',
        title: 'Choose a Desk',
        description:
          'Photography, videography, editing, editorial, design or archive management. We place you on the desk that matches your strengths.',
      },
      {
        step: '04',
        title: 'Cover an Event',
        description:
          'Your first assignment comes within two weeks, shot under a club photographer who briefs you on coverage and safety.',
      },
    ],
    achievements: [
      {
        title: '12 editions of Reflections',
        detail: 'The magazine has published continuously since 2014 without a single missed year.',
        year: '2026',
        kind: 'Milestone',
      },
      {
        title: 'National Media Fellowship — 3 recipients',
        detail: 'Members have been selected for a competitive national photography fellowship three years running.',
        year: '2025',
        kind: 'Award',
      },
      {
        title: '200+ events covered',
        detail: 'The club has documented every major club event and university function since 2018.',
        year: '2026',
        kind: 'Record',
      },
      {
        title: 'Official media partner — InvertisPrep',
        detail: 'The club supplies all photography and video for the university’s official platforms and alumni communications.',
        year: '2025',
        kind: 'Recognition',
      },
    ],
    logistics: [
      { label: 'Membership fee', value: 'Free' },
      { label: 'Gear', value: 'Club cameras available to borrow' },
      { label: 'Editing lab', value: 'Weekday access, 10:00 AM – 7:00 PM' },
      { label: 'Portfolio review', value: 'Monthly, all members eligible' },
      { label: 'Eligibility', value: 'All branches, all years' },
    ],
    testimonials: [
      {
        quote:
          'I shot everything on my phone for two years. When I submitted my portfolio, nobody asked what camera I used. They asked what I was trying to say. That is the only review that ever mattered to me.',
        name: 'Faisal Ahmed',
        detail: 'Head of Photography, Images · BCA, 2nd Year',
      },
      {
        quote:
          'The magazine is the hardest thing I have ever done and the thing I am proudest of. Ninety pages, four desks, one deadline in April. It taught me more about deadlines than any course did.',
        name: 'Shruti Sinha',
        detail: 'Editor-in-Chief, Reflections · BA, 3rd Year',
      },
    ],
    faqs: [
      {
        question: 'Do I need a DSLR?',
        answer:
          'No. A significant share of our published work is shot on phones. We care about the eye, the timing and the light — the gear is secondary, and club cameras are available to borrow if you want to try a full-frame body.',
      },
      {
        question: 'Can I join just for the magazine?',
        answer:
          'Yes, and many people do. The editorial desk is a complete job on its own — writing, reporting, fact-checking, layout and proofing — and it runs for eight months of the year.',
      },
      {
        question: 'Will my photos be published?',
        answer:
          'The exhibition selects 50 prints and the magazine runs roughly 40 photo essays. That is competitive, and every member gets a portfolio review before the selection round so you know exactly where your work stands.',
      },
      {
        question: 'Is the archive work interesting or just filing?',
        answer:
          'It is genuinely interesting. You are building a permanent, well-organised record of eight years of campus life, and doing the metadata work that makes it findable in ten years is a real skill that employers value.',
      },
    ],
  },

  itech: {
    id: 'itech',
    name: 'I-Tech',
    tagline: 'The Technical Club',
    shortDescription:
      'Innovating the future with coding, hackathons, tech talks, and hands-on workshops in emerging technologies.',
    longDescription:
      'I-Tech is where code meets innovation. We host the university’s largest hackathon CodeStorm with 1000+ participants, weekly coding contests, ML and AI workshops, blockchain bootcamps, and industry mentorship sessions. Our open-source contributions have been starred by projects used in production. Our alumni now work at Google, Microsoft, Amazon, and leading startups worldwide — but more importantly, our members ship things while still in college. The club’s core belief is that you learn engineering by building and shipping, not by watching lectures about shipping.',
    mission:
      'To make engineering literacy universal on campus — from a first-year student’s first line of code to a founder’s first product.',
    vision:
      'A campus where every technical student has built, shipped, and learned in public.',
    coordinator: 'Dr. Sanjay Gupta',
    coordinatorRole: 'Faculty Coordinator',
    coordinatorNote:
      'Professor, Department of Computer Science. Founded the coding contest series and mentors the CodeStorm organising team.',
    img: '/images/itech.png',
    color: '#3B82F6',
    colorLight: '#EFF6FF',
    colorDark: '#1D4ED8',
    gradient: 'from-blue-500 via-indigo-600 to-cyan-500',
    icon: Cpu,
    highlights: [
      'CodeStorm Hackathon',
      'Weekly Coding Contests',
      'AI & ML Workshops',
      'Blockchain Bootcamps',
      'Industry Tech Talks & Mentorship',
    ],
    stats: [
      { label: 'Coders', value: '1200+' },
      { label: 'Hackathons', value: '8' },
      { label: 'Placements Supported', value: '300+' },
    ],
    wings: [
      {
        name: 'Competitive Programming',
        description:
          'Weekly contests, a season championship, and a team selected for the inter-university ICPC circuit.',
      },
      {
        name: 'Web & App Development',
        description:
          'Full-stack builds — the track that has produced the club’s most shipped side projects.',
      },
      {
        name: 'AI & Data',
        description:
          'Machine learning, deep learning and data engineering workshops, culminating in a deployed model.',
      },
      {
        name: 'Cybersecurity',
        description:
          'CTF teams, secure coding practices, and awareness sessions on digital safety and privacy.',
      },
    ],
    activities: [
      {
        title: 'CodeStorm Hackathon',
        description:
          'A 36-hour build sprint with 1000+ participants from 40+ colleges, judged by industry engineers. Tracks include AI, fintech, social impact and open source.',
        cadence: 'Annual · February · 36 hours',
      },
      {
        title: 'Weekly Contests',
        description:
          'Every Saturday, a curated algorithmic problem set with live leaderboards, editorial write-ups and a rolling season championship.',
        cadence: 'Weekly · Saturdays · 2 hours',
      },
      {
        title: 'Build Club',
        description:
          'A group of students who ship side projects together — a note app, a campus portal, a bot. We meet weekly and demo monthly.',
        cadence: 'Weekly · Build + demo monthly',
      },
      {
        title: 'Tech Talks & Open Source',
        description:
          'Engineers from product companies talk about how things get built, and our maintainers walk new contributors through their first pull request.',
        cadence: 'Monthly · Talks · Ongoing contributions',
      },
      {
        title: 'CTF & Security Cell',
        description:
          'A capture-the-flag team that competes in national CTFs, plus secure-coding sessions and personal digital-safety clinics.',
        cadence: 'Bi-weekly · CTF team practices monthly',
      },
    ],
    events: [
      {
        title: 'CodeStorm 2026 — The Grand Hackathon',
        description:
          '36 hours, 40+ colleges, 8 winning tracks, ₹1.5 lakh in prize pool and direct interview fast-tracks with 12 partner companies.',
        month: 'Feb',
        day: '27',
        time: '48-hour sprint',
        venue: 'Innovation Hub, Tech Block',
        category: 'Flagship',
        agenda: [
          'Day 1 — 6:00 PM registration, 7:00 PM theme reveal, 7:30 PM hacking begins',
          'Day 1 — 2:00 AM mentor round one, 4:00 PM standup and dinner',
          'Day 2 — 8:00 AM mentor round two, 11:00 AM submission freeze',
          'Day 2 — 1:00 PM final submissions, 3:00 PM judging begins',
          'Day 2 — 6:00 PM results, prizes and company announcements',
        ],
        seats: 1000,
        seatsLeft: 214,
        audience:
          'Open to all engineering and science students across all years, and to other colleges. Teams of 2–4; solo registration is paired automatically.',
        rsvpDeadline: 'February 20, 2026',
        perks: [
          'Meal plan for the full sprint',
          'Swag and merch',
          'Mentor access throughout',
          'Interview fast-track with 12 partner companies',
          'Certificate for every participant',
        ],
      },
      {
        title: 'AI/ML Workshop Series',
        description:
          'A five-session hands-on track covering Python for ML, neural networks, transformers, and deploying a working model.',
        month: 'Jan',
        day: '10',
        time: '2:00 PM – 5:00 PM',
        venue: 'Lab 3, CSE Block',
        category: 'Workshop',
        agenda: [
          'Session 1 — Python and the numerical stack for ML',
          'Session 2 — Supervised learning and model evaluation',
          'Session 3 — Neural networks from scratch',
          'Session 4 — Transformers and modern architectures',
          'Session 5 — Deploying a model you trained',
        ],
        seats: 80,
        seatsLeft: 12,
        audience:
          'Second-year and above, any branch. Laptop required — the cloud compute for the labs is provided.',
        rsvpDeadline: 'January 5, 2026',
        perks: ['Lab cloud credits', 'Notebook templates', 'Certificate of completion'],
      },
      {
        title: 'Tech Talk — Building at Scale',
        description:
          'An open session with an engineer from a leading product company on architecture decisions, technical debt and growing a team.',
        month: 'Mar',
        day: '06',
        time: '4:00 PM – 6:00 PM',
        venue: 'Seminar Hall B',
        category: 'Talk',
        agenda: [
          '4:00 PM — The engineer’s path, in their own words',
          '4:30 PM — Architecture decisions and what they cost',
          '5:15 PM — Technical debt: when to pay it, when to defer',
          '5:45 PM — Open Q&A',
          '6:00 PM — Informal networking',
        ],
        seats: 200,
        seatsLeft: 64,
        audience: 'Open to all students. Non-technical attendees are welcome — the Q&A is broadly pitched.',
        rsvpDeadline: 'March 2, 2026',
        perks: ['Refreshments', 'Recording shared with registrants', 'Networking time'],
      },
    ],
    team: [
      { role: 'President', name: 'Karan Malhotra', branch: 'B.Tech CSE, 4th Year', note: 'CodeStorm 2026 organising lead' },
      { role: 'Vice President', name: 'Nisha Pillai', branch: 'B.Tech IT, 4th Year', note: 'Runs the contest series' },
      { role: 'Technical Lead', name: 'Aman Tiwari', branch: 'B.Tech CSE, 3rd Year', note: 'Maintainer of two open-source packages' },
      { role: 'Hackathon Lead', name: 'Ritwik Jain', branch: 'BCA, 3rd Year', note: 'Sponsors and partner companies' },
      { role: 'Treasurer', name: 'Sanjana Iyer', branch: 'B.Tech ECE, 3rd Year', note: 'Budget and prize pool' },
    ],
    joinProcess: [
      {
        step: '01',
        title: 'Take the Diagnostic',
        description:
          'A 30-minute online assessment covering programming basics. It is not graded — it only tells us where to place you.',
      },
      {
        step: '02',
        title: 'Join a Track',
        description:
          'Competitive programming, web and app development, AI and ML, or cybersecurity. Each track runs its own weekly sessions.',
      },
      {
        step: '03',
        title: 'Contribute',
        description:
          'Join a team for a project, enter a contest, or take on an open-source issue. Every member contributes to something real.',
      },
      {
        step: '04',
        title: 'Compete & Advance',
        description:
          'Represent the club in inter-college hackathons and contests, with full support for travel, stays and entry fees.',
      },
    ],
    achievements: [
      {
        title: 'CodeStorm — 1,000+ participants',
        detail: 'The largest hackathon in the region, with 40+ colleges represented and a ₹1.5 lakh prize pool.',
        year: '2026',
        kind: 'Record',
      },
      {
        title: 'Best Hackathon Team — National Level',
        detail: 'Our winning team from CodeStorm went on to place first at a national inter-college hackathon.',
        year: '2025',
        kind: 'Award',
      },
      {
        title: 'Open-source packages in production',
        detail: 'Two npm packages authored by club members are used in production by external teams.',
        year: '2025',
        kind: 'Milestone',
      },
      {
        title: '300+ members placed',
        detail: 'Club members secured placements at Google, Microsoft, Amazon, Flipkart and 20+ product companies.',
        year: '2026',
        kind: 'Recognition',
      },
    ],
    logistics: [
      { label: 'Membership fee', value: 'Free' },
      { label: 'Contest entry', value: 'Free, weekly, all levels' },
      { label: 'Lab access', value: 'CSE labs, weekdays 9:00 AM – 8:00 PM' },
      { label: 'Hackathon support', value: 'Travel, stay and entry fees covered for inter-college events' },
      { label: 'Prerequisite', value: 'None for membership — a diagnostic places you in the right track' },
    ],
    testimonials: [
      {
        quote:
          'The Saturday contests are the reason I am a competitive programmer. I failed the first six problems I ever attempted. There was always a next Saturday, and on the seventh I solved one.',
        name: 'Aman Tiwari',
        detail: 'Technical Lead, I-Tech · B.Tech CSE, 3rd Year',
      },
      {
        quote:
          'CodeStorm was the first time I built something in 36 hours with people I had met two days earlier. It was also the first time a company told me to send them my GitHub. That link got me my internship.',
        name: 'Ritwik Jain',
        detail: 'Hackathon Lead, I-Tech · BCA, 3rd Year',
      },
    ],
    faqs: [
      {
        question: 'I am a first-year student. Is I-Tech too early for me?',
        answer:
          'No. The diagnostic exists precisely to place you correctly, and the web development and build tracks start from the fundamentals. The first-year hackathon team is usually the most enthusiastic and the most improved by the end of it.',
      },
      {
        question: 'Do I need my own laptop?',
        answer:
          'For the contests, yes — a laptop from the second year onwards is a reasonable expectation. CSE lab machines are available for workshops and the AI/ML series provides cloud compute credits so you do not need a GPU.',
      },
      {
        question: 'Which track should I pick if I am unsure?',
        answer:
          'Start with competitive programming. It has the clearest weekly feedback loop and it will tell you quickly whether you enjoy the analytical side or the building side. Moving tracks later is easy and normal.',
      },
      {
        question: 'Is the interview fast-track real?',
        answer:
          'Yes. Twelve partner companies attend CodeStorm and receive the participant list with project links beforehand. Several club members have credited the fast-track with their first offer.',
      },
    ],
  },

  stride: {
    id: 'stride',
    name: 'Stride',
    tagline: 'The Sports Club',
    shortDescription:
      'Fostering teamwork and excellence through sports, fitness challenges, and inter-university tournaments.',
    longDescription:
      'Stride champions the athlete in every student. From cricket and football leagues to badminton, basketball, and athletics — we organize 50+ tournaments annually. Our teams represent Invertis at zonal, state, and national levels, and our alumni have gone on to state-level squads. Fitness bootcamps, yoga sessions, and sports science workshops complete the holistic approach: we do not just want people to compete, we want them to move well and recover well. The recreational league is deliberately separate from the competitive squad, so nobody has to choose between playing for fun and playing to win.',
    mission:
      'To make sport a permanent habit rather than a spectator event — accessible to beginners, serious enough for competitors.',
    vision:
      'A campus where every student plays, and where our teams are a name to be reckoned with across the region.',
    coordinator: 'Coach Vikram Singh',
    coordinatorRole: 'Faculty Coordinator',
    coordinatorNote:
      'Head coach, Department of Physical Education. Twenty years coaching at state level, oversees team selection and injury protocols.',
    img: '/images/stride.png',
    color: '#EF4444',
    colorLight: '#FEF2F2',
    colorDark: '#B91C1C',
    gradient: 'from-red-500 via-orange-500 to-amber-500',
    icon: Trophy,
    highlights: [
      'Inter-University Tournaments',
      'Intra-College Leagues',
      'Fitness Bootcamps',
      'Yoga & Wellness Sessions',
      'Sports Science Workshops',
    ],
    stats: [
      { label: 'Athletes', value: '1000+' },
      { label: 'Tournaments / Year', value: '50+' },
      { label: 'Medals Won', value: '200+' },
    ],
    wings: [
      {
        name: 'Team Sports',
        description:
          'Cricket, football, basketball, volleyball and kabaddi — leagues, inter-college fixtures and university squads.',
      },
      {
        name: 'Individual Sports',
        description:
          'Badminton, table tennis, swimming and lawn tennis, with dedicated court time and coaching.',
      },
      {
        name: 'Athletics & Track',
        description:
          'Sprints, middle distance, jumps and throws, plus the relay squad that represents the university.',
      },
      {
        name: 'Fitness & Wellness',
        description:
          'Bootcamps, yoga, strength training and nutrition — the track for students who want to move well, not compete.',
      },
    ],
    activities: [
      {
        title: 'Intra-College Leagues',
        description:
          'Cricket, football, basketball, volleyball, badminton, kabaddi and athletics — all with qualifying rounds, a league phase and a final, spread across the semester.',
        cadence: 'Every semester · Weekly fixtures',
      },
      {
        title: 'Inter-University Representation',
        description:
          'Trials and selection for zonal, state and national tournaments. The club covers kits, travel, entry fees and accommodation.',
        cadence: 'Seasonal · Zonal, state, national',
      },
      {
        title: 'Fitness Bootcamp',
        description:
          'A six-week structured programme with certified trainers — strength, conditioning, mobility and nutrition. Beginners and athletes alike.',
        cadence: 'Six weeks · Daily 6:00 AM',
      },
      {
        title: 'Sports Science Lab',
        description:
          'Workshops on injury prevention, sports psychology, performance analysis and nutrition, led by practising physiologists and coaches.',
        cadence: 'Monthly · Sports Block',
      },
      {
        title: 'Morning Yoga & Wellness',
        description:
          'Guided sunrise yoga and mobility sessions for everyone — athletes, students with desk jobs, and anyone who just needs to feel better.',
        cadence: 'Daily · 6:30 – 7:15 AM',
      },
    ],
    events: [
      {
        title: 'Invictus — The Annual Sports Meet',
        description:
          'Three days, 12 sports, 800+ student-athletes. Track and field events, team championships, an opening ceremony and a closing awards night.',
        month: 'Dec',
        day: '15',
        time: 'All day, 3 days',
        venue: 'University Sports Complex',
        category: 'Flagship',
        agenda: [
          'Day 1 — Opening ceremony, 100m and long jump heats, badminton and tennis',
          'Day 2 — Team championships: basketball, volleyball, kabaddi and football',
          'Day 3 — Relay finals, cricket final, awards ceremony and closing',
        ],
        seats: 800,
        seatsLeft: 247,
        audience:
          'Open to all students. Compete in any sport, or attend as a spectator — the finals draw crowds from across the university.',
        rsvpDeadline: 'December 6, 2026',
        perks: ['Event kit', 'Refreshments', 'Participation certificate', 'Sportsmanship award eligibility'],
      },
      {
        title: 'Inter-University Football Championship',
        description:
          'Invitational football tournament with 16 university teams over three days of group and knockout football.',
        month: 'Jan',
        day: '19',
        time: '8:00 AM – 6:00 PM',
        venue: 'Main Football Ground',
        category: 'Tournament',
        agenda: [
          'Day 1 — Group stage, four groups of four',
          'Day 2 — Group stage concludes, quarter-finals',
          'Day 3 — Semi-finals, third-place match and final',
        ],
        seats: 400,
        seatsLeft: 158,
        audience:
          'Squad selection is open to all club trials. Spectators welcome throughout — no registration needed for the ground.',
        rsvpDeadline: 'January 12, 2026',
        perks: ['Match kit', 'Banquet', 'Certificate', 'Player of the Match prize'],
      },
      {
        title: 'Fit Camp — Six Week Challenge',
        description:
          'A guided fitness challenge with baseline testing, weekly targets and a final assessment, with certificates for every finisher.',
        month: 'Feb',
        day: '02',
        time: '6:00 AM daily',
        venue: 'University Ground',
        category: 'Programme',
        agenda: [
          'Week 1 — Baseline fitness testing and goal setting',
          'Weeks 2–5 — Structured training blocks with weekly check-ins',
          'Week 6 — Final assessment, comparison and certification',
        ],
        seats: 150,
        seatsLeft: 29,
        audience:
          'Open to all students regardless of fitness level. Medical clearance is not required for the general programme.',
        rsvpDeadline: 'January 26, 2026',
        perks: ['Certified trainer guidance', 'Baseline and final assessment', 'Nutrition plan', 'Completion certificate'],
      },
    ],
    team: [
      { role: 'President', name: 'Aditya Rana', branch: 'B.Tech Mech, 4th Year', note: 'Cricket captain, university squad' },
      { role: 'Vice President', name: 'Nikita Chauhan', branch: 'BBA, 3rd Year', note: 'Athletics, university relay squad' },
      { role: 'Secretary', name: 'Rahul Dangi', branch: 'B.Tech CSE, 3rd Year', note: 'Invictus 2026 organising lead' },
      { role: 'Sports Coordinator', name: 'Sneha Rathore', branch: 'BCA, 2nd Year', note: 'Fixtures and league scheduling' },
      { role: 'Fitness Head', name: 'Manish Yadav', branch: 'B.Tech ECE, 4th Year', note: 'Certifies as a fitness coach' },
    ],
    joinProcess: [
      {
        step: '01',
        title: 'Pick Your Sport',
        description:
          'Cricket, football, basketball, volleyball, badminton, kabaddi, athletics, chess or swimming. You can also join the fitness or wellness track.',
      },
      {
        step: '02',
        title: 'Attend Selection Trials',
        description:
          'Trials run every semester. Beginners get placed in the recreational league; competitive players enter the university squad pool.',
      },
      {
        step: '03',
        title: 'Get Equipped',
        description:
          'Club kits, gear and fitness guidance are provided. A modest, subsidised fee covers maintenance and equipment.',
      },
      {
        step: '04',
        title: 'Represent Invertis',
        description:
          'Top performers are selected for zonal and national level tournaments, with full logistical support from the club.',
      },
    ],
    achievements: [
      {
        title: '200+ medals at zonal and state level',
        detail: 'Cumulative medal haul across athletics, badminton, cricket and football since 2018.',
        year: '2026',
        kind: 'Record',
      },
      {
        title: 'Zonal athletics — 1st place relay',
        detail: 'Our 4×100m relay squad took gold at the zonal meet and qualified for the state championship.',
        year: '2025',
        kind: 'Award',
      },
      {
        title: '5 alumni in state-level squads',
        detail: 'Former members now represent the state in football and badminton.',
        year: '2025',
        kind: 'Milestone',
      },
      {
        title: 'Invictus — 800+ athletes in one edition',
        detail: 'The annual sports meet has become the largest student athletics event on campus.',
        year: '2026',
        kind: 'Record',
      },
    ],
    logistics: [
      { label: 'Membership fee', value: '₹500 per year (subsidised, kit included)' },
      { label: 'Facility access', value: 'Ground and courts, 6:00 AM – 8:00 PM daily' },
      { label: 'Equipment', value: 'Club kits provided; personal rackets and bats on request' },
      { label: 'Tournament support', value: 'Travel, stay, entry and kit covered for inter-university events' },
      { label: 'Injury support', value: 'Sports physiotherapist on campus twice a week' },
    ],
    testimonials: [
      {
        quote:
          'I joined the recreational league because I wanted to play football without being good enough for a squad. The club runs both, and nobody looked at me differently for being in the lower division. I am now in the university squad.',
        name: 'Rahul Dangi',
        detail: 'Secretary, Stride · B.Tech CSE, 3rd Year',
      },
      {
        quote:
          'The injury workshop changed how I train. I had been running for three years with the wrong technique and one shin splint every season. Nobody had ever told me. One session, and it was fixed.',
        name: 'Nikita Chauhan',
        detail: 'Vice President, Stride · BBA, 3rd Year',
      },
    ],
    faqs: [
      {
        question: 'I am not very fit or good at sports. Should I still join?',
        answer:
          'Especially then. Stride runs a recreational league and a fitness track with no trial and no selection. Invictus has events for every level, and the wellness track exists for students who want to move without competing.',
      },
      {
        question: 'Is there a fee?',
        answer:
          'A modest annual contribution of ₹500, which covers kit, equipment maintenance and the sports physiotherapist. Travel, stay and entry fees for inter-university tournaments are covered entirely by the club.',
      },
      {
        question: 'Do I need to be medically cleared?',
        answer:
          'Only for the competitive squad and for high-impact events like athletics. The general fitness track needs no clearance — a short self-declaration is enough.',
      },
      {
        question: 'Can I still compete if I have a heavy academic load?',
        answer:
          'Yes. The leagues are structured across the semester with fixtures you can skip, and the fitness track runs before and after class hours. The club expects you to manage your own time.',
      },
    ],
  },

  mfactor: {
    id: 'mfactor',
    name: 'M-Factor',
    tagline: 'The Management Club',
    shortDescription:
      'Developing leadership and management skills through case competitions, B-plan contests, and industry interactions.',
    longDescription:
      'M-Factor shapes tomorrow’s business leaders. Our flagship events include BizWiz — a live case competition, the Startup Pitch contest, and the Corporate Conclave with CXOs from leading companies. We run business simulations, negotiation workshops, and consulting projects with real businesses. Our alumni lead at McKinsey, BCG, Goldman Sachs, and unicorn startups — but the real product of this club is a student who can think clearly, decide confidently and lead people. Every activity is built around a live deliverable: a recommendation, a pitch, a plan — not a certificate.',
    mission:
      'To build business acumen and leadership in students through practice, not just theory.',
    vision:
      'A campus where every student can walk into any room and run the meeting.',
    coordinator: 'Prof. Priya Agarwal',
    coordinatorRole: 'Faculty Coordinator',
    coordinatorNote:
      'Associate Professor, School of Management. Former consultant; chairs the case competition jury and mentors the consulting track.',
    img: '/images/mfactor.png',
    color: '#06B6D4',
    colorLight: '#ECFEFF',
    colorDark: '#0E7490',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    icon: Briefcase,
    highlights: [
      'BizWiz Case Competition',
      'Startup Pitch Contest',
      'Corporate Conclave',
      'Live Consulting Projects',
      'Negotiation & Communication Workshops',
    ],
    stats: [
      { label: 'Members', value: '500+' },
      { label: 'Competitions', value: '20+' },
      { label: 'Corporate Partners', value: '30+' },
    ],
    wings: [
      {
        name: 'Case Competition Track',
        description:
          'Structured case prep, team formation and mock rounds, culminating in BizWiz and national case competitions.',
      },
      {
        name: 'Consulting Projects Track',
        description:
          'Six-week engagements on real business problems with faculty mentors, reviewed by practising consultants.',
      },
      {
        name: 'Corporate Relations Track',
        description:
          'Runs the Corporate Conclave — speaker management, sponsor relationships, and the club’s industry network.',
      },
      {
        name: 'The Leader’s Room',
        description:
          'Weekly skill sessions on negotiation, communication, decision-making and team dynamics.',
      },
    ],
    activities: [
      {
        title: 'BizWiz — Case Competition',
        description:
          'Teams of three receive a live business problem and 90 minutes to prepare a recommendation, which they present to a panel of CXOs. Judged on structure, insight and clarity of delivery.',
        cadence: 'Annual flagship · November',
      },
      {
        title: 'Startup Pitch — The Investor Room',
        description:
          'Founders pitch to a simulated investor panel of alumni and industry mentors. Teams get feedback on their deck, numbers and pitch narrative.',
        cadence: 'Annual · January',
      },
      {
        title: 'Live Consulting Projects',
        description:
          'Real problems from real businesses — a local brand’s distribution challenge, an NGO’s fundraising strategy, a startup’s go-to-market plan — worked on over six weeks with a faculty mentor.',
        cadence: 'Six-week cycles · Twice a year',
      },
      {
        title: 'The Leader’s Room',
        description:
          'Weekly sessions on negotiation, decision-making, communication and team dynamics, run with structured simulations and honest peer feedback.',
        cadence: 'Weekly · Fridays',
      },
      {
        title: 'Business Simulation League',
        description:
          'A term-long simulated market where student teams compete on pricing, inventory and strategy, and are ranked at the end of the semester.',
        cadence: 'Semester-long · Bi-weekly rounds',
      },
    ],
    events: [
      {
        title: 'BizWiz — The Case Championship',
        description:
          'The club’s flagship case competition. 24 teams, 90 minutes to crack a live business problem, presentations to a CXO panel, and a placement track for the top teams.',
        month: 'Nov',
        day: '16',
        time: '9:00 AM – 5:00 PM',
        venue: 'Seminar Hall A & B',
        category: 'Flagship',
        agenda: [
          '9:00 AM — Check-in, team formation and case distribution',
          '9:30 AM — Case briefing with the faculty panel',
          '9:45 AM – 11:15 AM — Preparation time (90 minutes)',
          '11:15 AM – 1:00 PM — Presentations to the CXO jury, batch one',
          '2:00 PM – 3:30 PM — Presentations, batch two',
          '3:30 PM – 4:30 PM — Jury deliberation and winner announcements',
          '4:30 PM – 5:00 PM — Networking with the panel',
        ],
        seats: 72,
        seatsLeft: 11,
        audience:
          'Teams of three, drawn from across all years and branches. Selection is through the case prep track, and every team receives a full case-prep pack before the day.',
        rsvpDeadline: 'November 6, 2026',
        perks: ['Case prep pack', 'Professional judging', 'Cash prizes', 'Placement track', 'Certificate'],
      },
      {
        title: 'Corporate Conclave',
        description:
          'A day with leaders from D2C, BFSI and technology — fireside chats, a keynote, and small-group roundtables on real business questions.',
        month: 'Feb',
        day: '09',
        time: '9:00 AM – 6:00 PM',
        venue: 'University Central Auditorium',
        category: 'Conclave',
        agenda: [
          '9:00 AM — Registration and breakfast roundtable',
          '10:00 AM — Opening keynote on building a career in business',
          '11:00 AM — Fireside chat: scaling a D2C brand',
          '12:00 PM — Panel: careers in BFSI and technology',
          '1:30 PM — Lunch and mentor tables',
          '2:30 PM — Breakout roundtables on live business questions',
          '4:30 PM — Alumni panel: first five years after campus',
          '5:30 PM — Closing and networking',
        ],
        seats: 250,
        seatsLeft: 83,
        audience:
          'Open to all students, with a preference for second-years and above. Roundtables are capped at 15 per table so everyone gets airtime.',
        rsvpDeadline: 'February 3, 2026',
        perks: ['Lunch', 'Conclave kit', 'Mentor table access', 'Certificate'],
      },
      {
        title: 'Startup Pitch — Investor Room',
        description:
          'Student teams present venture ideas to a panel of investors and alumni founders. Top teams receive incubation support and a follow-up meeting.',
        month: 'Jan',
        day: '24',
        time: '11:00 AM – 4:00 PM',
        venue: 'Innovation Hub',
        category: 'Contest',
        agenda: [
          '11:00 AM — Pitch rules, format and criteria briefing',
          '11:30 AM – 1:30 PM — First pitch block (8 teams)',
          '1:30 PM – 2:00 PM — Lunch and investor feedback rounds',
          '2:00 PM – 3:30 PM — Second pitch block (8 teams)',
          '3:30 PM – 4:00 PM — Investor deliberation and decisions',
        ],
        seats: 120,
        seatsLeft: 34,
        audience:
          'Any student team with an idea, a prototype or a business model. Non-technical ideas are welcome and often win.',
        rsvpDeadline: 'January 15, 2026',
        perks: ['Pitch coaching session', 'Incubation support for top 3', 'Cash prize', 'Certificate'],
      },
    ],
    team: [
      { role: 'President', name: 'Shreya Bhatia', branch: 'MBA, 2nd Year', note: 'BizWiz 2026 jury coordinator' },
      { role: 'Vice President', name: 'Varun Sethi', branch: 'BBA, 3rd Year', note: 'Leads the simulation league' },
      { role: 'Secretary', name: 'Aditi Kumari', branch: 'B.Com, 3rd Year', note: 'Case study and documentation' },
      { role: 'Case Competition Lead', name: 'Rohan Grover', branch: 'MBA, 1st Year', note: 'Former national case finalist' },
      { role: 'Corporate Relations Head', name: 'Neha Saxena', branch: 'BBA, 2nd Year', note: 'Brings 30+ companies to the conclave' },
    ],
    joinProcess: [
      {
        step: '01',
        title: 'Attend an Open Session',
        description:
          'The Leader’s Room sessions are open to all students and are the easiest way to meet the club and understand what it runs.',
      },
      {
        step: '02',
        title: 'Pick a Track',
        description:
          'Case competitions, consulting projects, corporate relations, or the events track. Each has its own cadence and workload.',
      },
      {
        step: '03',
        title: 'Join a Team',
        description:
          'Teams form for every competition. We balance skill and year so first-years get real ownership on a presentation.',
      },
      {
        step: '04',
        title: 'Compete and Connect',
        description:
          'Represent the club at national case competitions and build the network that turns into internships and placements.',
      },
    ],
    achievements: [
      {
        title: 'National case competition — Finalist',
        detail: 'Placed in the top three at a national inter-college case competition for three consecutive years.',
        year: '2025',
        kind: 'Award',
      },
      {
        title: '30+ corporate partners',
        detail: 'Thirty companies participate in the Conclave, from D2C brands to BFSI and technology firms.',
        year: '2026',
        kind: 'Milestone',
      },
      {
        title: 'Alumni at McKinsey, BCG and Goldman Sachs',
        detail: 'Club alumni now work at leading strategy and investment firms, with several mentoring current members.',
        year: '2026',
        kind: 'Recognition',
      },
      {
        title: '20+ competitions organised',
        detail: 'The club has run more than twenty case, pitch and simulation competitions since 2018.',
        year: '2025',
        kind: 'Record',
      },
    ],
    logistics: [
      { label: 'Membership fee', value: 'Free' },
      { label: 'Session schedule', value: 'Fridays, 5:00 – 7:00 PM' },
      { label: 'Case prep material', value: 'Provided to all competition-track members' },
      { label: 'Eligibility', value: 'All branches — MBA, BBA, B.Com and engineering students' },
      { label: 'Team size', value: '3 members per competition team' },
    ],
    testimonials: [
      {
        quote:
          'I had never presented in front of anyone. BizWiz gave me ninety minutes and a room of people who would ask me the hard questions. I failed the first round. The second time I did not, and I got the internship from the track.',
        name: 'Shreya Bhatia',
        detail: 'President, M-Factor · MBA, 2nd Year',
      },
      {
        quote:
          'The consulting project was three weeks of my life and it changed what I thought management was. A real bakery in Bareilly had a real distribution problem, and we had to give them a real recommendation. That is a very different education from a case study.',
        name: 'Rohan Grover',
        detail: 'Case Competition Lead, M-Factor · MBA, 1st Year',
      },
    ],
    faqs: [
      {
        question: 'Do I need a business or management background?',
        answer:
          'No. The club explicitly balances teams by year and discipline. A first-year engineering student regularly outperforms a final-year MBA student at BizWiz, because the competition is about structured thinking, not about what you have already studied.',
      },
      {
        question: 'What is the time commitment like?',
        answer:
          'Around four to five hours a week on average, mostly concentrated around competition cycles. The Leader’s Room sessions are one evening a week, and the case track adds a couple of hours in the month before a competition.',
      },
      {
        question: 'Is the consulting project really on a live business problem?',
        answer:
          'Yes. The projects come from small and medium businesses in Bareilly, from an NGO to a D2C brand, and the final recommendation is delivered to the business owners, not just to a faculty panel. Some of those relationships have continued past the project.',
      },
      {
        question: 'Does the club help with placements?',
        answer:
          'The Corporate Conclave brings thirty companies to campus, and members get first access to the network. Top teams in BizWiz also enter the placement track run by the partner firms. Several internships have started as a Conclave conversation.',
      },
    ],
  },
};

export const CLUB_LIST: Club[] = Object.values(CLUBS);

export function getClub(id: string): Club | undefined {
  return CLUBS[id];
}

// ── Runtime data layer ─────────────────────────────────────────────────────
//
// The static CLUBS map above is the seed and the offline fallback. At
// runtime the public pages read from the API, so anything an admin edits
// in the console shows up on the live site without a deploy.
//
// The icon is stored as a string key on the server (the model has no
// component references), so it is resolved back to a component here.

import {
  Paintbrush as _Paintbrush,
  Heart as _Heart,
  Music as _Music,
  BookOpen as _BookOpen,
  Cpu as _Cpu,
  Trophy as _Trophy,
  Briefcase as _Briefcase,
  Users as _Users,
  Sparkles as _Sparkles,
  Star as _Star,
} from 'lucide-react';

export const CLUB_ICONS: Record<string, ElementType> = {
  Paintbrush: _Paintbrush,
  Heart: _Heart,
  Music: _Music,
  BookOpen: _BookOpen,
  Cpu: _Cpu,
  Trophy: _Trophy,
  Briefcase: _Briefcase,
  Users: _Users,
  Sparkles: _Sparkles,
  Star: _Star,
};

/** Resolve a stored icon key to a lucide component, defaulting safely. */
export function clubIcon(key?: string): ElementType {
  return (key && CLUB_ICONS[key]) || _Users;
}

/**
 * The reverse map — a lucide component to the string key the server
 * stores. The seed data holds components, the API holds keys, and the
 * static fallback has to be converted to the API shape before it can be
 * used as a substitute for a server response.
 */
export const CLUB_ICON_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(CLUB_ICONS).map(([key]) => [key, key])
);
