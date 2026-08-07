import { Event } from '../models/Event.js';
import { uploadImage } from '../services/cloudinaryService.js';

// Pre-seed data fallback
const SEED_EVENTS = [
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

// Helper to preseed database if empty
const checkAndSeedEvents = async () => {
  try {
    const count = await Event.countDocuments();
    if (count === 0) {
      console.log('Pre-seeding events database...');
      await Event.insertMany(SEED_EVENTS);
      console.log('Events pre-seeded successfully.');
    }
  } catch (error) {
    console.error('Failed to pre-seed events:', error);
  }
};

// Get all events
export const getEvents = async (req, res) => {
  try {
    await checkAndSeedEvents();
    const events = await Event.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving events' });
  }
};

// Get single event by id/slug
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findOne({ id });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving event details' });
  }
};

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const {
      id,
      title,
      category,
      date,
      time,
      venue,
      organizer,
      description,
      longDescription,
      image,
      featured,
      registrationOpen,
      timeline,
      rules,
    } = req.body;

    if (!id || !title || !category || !date || !time || !venue || !organizer || !description || !longDescription || !image) {
      res.status(400).json({ success: false, message: 'All main fields are required.' });
      return;
    }

    const exists = await Event.findOne({ id });
    if (exists) {
      res.status(400).json({ success: false, message: `An event with slug/ID "${id}" already exists.` });
      return;
    }

    const event = await Event.create({
      id,
      title,
      category,
      date,
      time,
      venue,
      organizer,
      description,
      longDescription,
      image,
      featured: !!featured,
      registrationOpen: registrationOpen !== false,
      timeline: timeline || [],
      rules: rules || [],
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Server error creating event' });
  }
};

// Update event details
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const event = await Event.findOneAndUpdate({ id }, updateData, { new: true, runValidators: true });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Server error updating event' });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findOneAndDelete({ id });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting event' });
  }
};

// Upload an event poster image (Admin only)
export const uploadEventImage = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    // Upload to Cloudinary using image upload helper
    const result = await uploadImage(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully!',
      data: { url: result.cloudinaryUrl },
    });
  } catch (error) {
    console.error('Upload event image error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading event image.' });
  }
};
