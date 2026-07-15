'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MapPin, Phone, Instagram, Linkedin } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  const faqs = [
    {
      question: 'How do I report a technical issue?',
      answer: 'You can report technical issues through this contact form or by directly emailing us at support@invertisprep.com with details of the problem you\'re experiencing.',
    },
    {
      question: 'What are your support hours?',
      answer: 'Our support team is available Monday through Friday from 9:00 AM to 5:00 PM IST. Email support is available 24/7, and we aim to respond within 24 hours.',
    },
    {
      question: 'How can I provide feedback about the platform?',
      answer: 'We welcome your feedback! You can use this contact form or email us at feedback@invertisprep.com with your suggestions, comments, or ideas for improvement.',
    },
    {
      question: 'How do I request new features or study materials?',
      answer: 'You can submit feature requests or study material suggestions through our contact form. Select "Feature Request" as the subject and provide details about what you\'d like to see.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 mb-2">
            Have questions or need assistance? We're here to help. Reach out to us and we'll get back to you as soon as possible.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Email Card */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-8 w-8 text-indigo-600" />
                <CardTitle>Email Us</CardTitle>
              </div>
              <CardDescription>Our friendly team is here to help.</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="mailto:invertisprep@gmail.com" className="text-indigo-600 hover:text-indigo-700 font-medium break-all">
                invertisprep@gmail.com
              </a>
            </CardContent>
          </Card>

          {/* Address Card */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-8 w-8 text-purple-600" />
                <CardTitle>Visit Us</CardTitle>
              </div>
              <CardDescription>Come say hello at our campus.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm">
                Invertis University<br />
                Bareilly, Uttar Pradesh, India
              </p>
            </CardContent>
          </Card>

          {/* Phone Card */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-8 w-8 text-pink-600" />
                <CardTitle>Call Us</CardTitle>
              </div>
              <CardDescription>Mon-Fri from 8am to 5pm.</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="tel:+917084089921" className="text-pink-600 hover:text-pink-700 font-medium">
                +91 (708) 408-9921
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            <p className="text-gray-600 mb-6">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  rows={6}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                Send Message
              </Button>

              {submitted && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-center">
                  Thank you for reaching out! We'll get back to you soon.
                </div>
              )}
            </form>
          </div>

          {/* Office Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Visit Our Office</h2>

            {/* Office Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Invertis University</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Address</h4>
                  <p className="text-gray-600 text-sm">
                    Bareilly - Lucknow National Highway-24,<br />
                    Bareilly, Uttar Pradesh 243123
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Opening Hours</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li><strong>Monday - Friday:</strong> 9:00 AM - 5:00 PM</li>
                    <li><strong>Saturday:</strong> 9:00 AM - 1:00 PM</li>
                    <li><strong>Sunday:</strong> Closed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Connect With Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <a
                    href="https://www.linkedin.com/company/invertisprep/"
                    className="p-3 bg-pink-50 text-blue-600 rounded-lg hover:bg-pink-100 transition"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="https://www.instagram.com/invertisprep.in/"
                    className="p-3 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Frequently Asked Questions</h2>
          <p className="text-gray-600 text-center mb-8">Find answers to common questions about our platform</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">InvertisPrep</h3>
          <p className="text-gray-600">
            Your gateway to academic excellence at Invertis University
          </p>
        </div>
      </div>
    </div>
  );
}
