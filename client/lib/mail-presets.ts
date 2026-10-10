import type { MailTemplate } from '@/types';

// Ready-made broadcast templates admins can pick from in Compose. Each is a
// MailTemplate the builder editor can then tweak. Placeholders {{name}} /
// {{email}} are substituted per recipient at send time.

export interface MailPreset {
  id: string;
  label: string;
  description: string;
  template: MailTemplate;
}

export const MAIL_PRESETS: MailPreset[] = [
  {
    id: 'announcement',
    label: 'Plain Announcement',
    description: 'A clean heading + paragraph + button. Good for any update.',
    template: {
      bannerUrl: '',
      heading: 'An important update',
      intro: 'Hi {{name}},',
      sections: [
        { type: 'paragraph', text: 'We have an update we wanted to share with you. Replace this text with your message.', align: 'left', fontSize: 15, color: '#475569' },
        { type: 'button', text: 'Learn more', url: 'https://invertisprep.in', align: 'left', fontSize: 14, bgColor: '#0f172a' },
      ],
      footer: 'You received this because you are part of InvertisPrep.',
      email: 'support@invertisprep.in',
    },
  },
  {
    id: 'new-papers',
    label: 'New Papers Available',
    description: 'Announce freshly uploaded question papers with a CTA.',
    template: {
      bannerUrl: '',
      heading: 'New question papers are live 🎉',
      intro: 'Hi {{name}},',
      sections: [
        { type: 'paragraph', text: 'Fresh previous-year papers have just been added to the library. Head over and grab what you need before your exams.', align: 'left', fontSize: 15, color: '#475569' },
        { type: 'button', text: 'Browse papers', url: 'https://invertisprep.in/pyq', align: 'left', fontSize: 14, bgColor: '#0f172a' },
      ],
      footer: 'InvertisPrep · support@invertisprep.in',
      email: 'support@invertisprep.in',
    },
  },
  {
    id: 'feature-spotlight',
    label: 'Feature Spotlight',
    description: 'Heading, paragraph, image and a button — highlights one feature.',
    template: {
      bannerUrl: '',
      heading: 'Did you know?',
      intro: 'Hi {{name}},',
      sections: [
        { type: 'paragraph', text: 'Build a professional resume in minutes with the InvertisPrep resume builder — free for students.', align: 'left', fontSize: 15, color: '#475569' },
        { type: 'image', imageUrl: '' },
        { type: 'button', text: 'Try it now', url: 'https://invertisprep.in/resume-builder', align: 'center', fontSize: 14, bgColor: '#4f46e5' },
      ],
      footer: 'InvertisPrep · support@invertisprep.in',
      email: 'support@invertisprep.in',
    },
  },
  {
    id: 'event-invite',
    label: 'Event Invite',
    description: 'Invite students to an upcoming campus event.',
    template: {
      bannerUrl: '',
      heading: "You're invited 🎊",
      intro: 'Hi {{name}},',
      sections: [
        { type: 'paragraph', text: 'Join us for our upcoming campus event. There will be plenty to see, do and win — we would love to see you there.', align: 'left', fontSize: 15, color: '#475569' },
        { type: 'divider' },
        { type: 'heading', text: 'Save the date', align: 'left', fontSize: 18, color: '#0f172a' },
        { type: 'button', text: 'View details', url: 'https://invertisprep.in/events', align: 'left', fontSize: 14, bgColor: '#0f172a' },
      ],
      footer: 'InvertisPrep · support@invertisprep.in',
      email: 'support@invertisprep.in',
    },
  },
];