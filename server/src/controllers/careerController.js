import mongoose from 'mongoose';
import CareerApplication from '../models/CareerApplication.js';
import { logActivity } from '../services/activityService.js';
import { sendCareerApplicationAck } from '../services/mailService.js';

const DOMAINS = [
  'Canva designer',
  'Video Editor',
  'Support and Resource Team (SRT)',
  'Developers',
  'Content writer',
  'Technical support',
  'Social media manager',
  'Marketing'
];

const STATUSES = ['pending', 'under_review', 'shortlisted', 'rejected', 'hired'];

export const submitApplication = async (req, res) => {
  try {
    const {
      // Section 1
      fullName,
      email,
      whatsappNumber,
      departmentBranch,
      currentSemester,
      currentLocation,
      customLocation,
      // Section 2
      appliedDomain,
      hybridComfortable,
      interestReason,
      // Section 3
      skills,
      proficiencyLevel,
      hasProjects,
      projectDescription,
      // Section 4
      resumeLink,
      portfolioLink,
      // Section 5
      heardFrom,
      customHeardFrom,
      availability,
      additionalNotes,
    } = req.body;

    // Validation
    const errors = [];

    // Section 1
    if (!fullName?.trim()) errors.push('Full name is required');
    if (!email?.trim()) errors.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
    if (!whatsappNumber?.trim()) errors.push('WhatsApp number is required');
    else if (!/^\+\d{8,15}$/.test(whatsappNumber.replace(/[\s()-]/g, ''))) {
      // E.164-style with dial code, e.g. "+919876543210" — spaces/dashes tolerated
      errors.push('WhatsApp number must include a valid country code, e.g. +91 98765 43210');
    }
    if (!departmentBranch?.trim()) errors.push('Department/Branch is required');
    if (!currentSemester) errors.push('Current semester is required');
    else if (!['1st','2nd','3rd','4th','5th','6th','7th','8th'].includes(currentSemester)) {
      errors.push('Invalid semester');
    }
    if (!currentLocation) errors.push('Current location is required');
    else if (!['Bareilly','Rampur','Shahjahanpur','Other'].includes(currentLocation)) {
      errors.push('Invalid location');
    }
    if (currentLocation === 'Other' && !customLocation?.trim()) {
      errors.push('Please specify your location');
    }

    // Section 2
    if (!appliedDomain) errors.push('Applied domain is required');
    else if (!DOMAINS.includes(appliedDomain)) errors.push('Invalid domain');
    if (typeof hybridComfortable !== 'boolean') errors.push('Hybrid work preference is required');
    if (!interestReason?.trim()) errors.push('Interest reason is required');
    else if (interestReason.trim().length < 50) errors.push('Interest reason must be at least 50 characters');

    // Section 3
    if (!skills?.trim()) errors.push('Skills are required');
    if (!proficiencyLevel) errors.push('Proficiency level is required');
    else if (!['Beginner (Learning the basics)','Intermediate (Have some hands-on experience)','Advanced (Confident and have done projects)'].includes(proficiencyLevel)) {
      errors.push('Invalid proficiency level');
    }
    if (typeof hasProjects !== 'boolean') errors.push('Project experience is required');
    if (hasProjects && !projectDescription?.trim()) errors.push('Project description is required when you have projects');

    // Section 4
    if (!resumeLink?.trim()) errors.push('Resume link is required');
    else if (!/^https?:\/\/.+/.test(resumeLink)) errors.push('Resume link must be a valid URL');
    if (portfolioLink && !/^https?:\/\/.+/.test(portfolioLink)) errors.push('Portfolio link must be a valid URL');

    // Section 5
    if (!heardFrom) errors.push('Referral source is required');
    else if (!['Friend / Classmate','Social Media (Instagram / WhatsApp)','Invertis Confession','InvertisPrep Website','Other'].includes(heardFrom)) {
      errors.push('Invalid referral source');
    }
    if (heardFrom === 'Other' && !customHeardFrom?.trim()) errors.push('Please specify how you heard about us');
    if (!availability) errors.push('Availability is required');
    else if (!['Yes, fully available','Available with minor scheduling constraints','Not sure yet'].includes(availability)) {
      errors.push('Invalid availability option');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Build application document
    const applicationData = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      whatsappNumber: whatsappNumber.trim(),
      departmentBranch: departmentBranch.trim(),
      currentSemester,
      currentLocation,
      customLocation: customLocation?.trim() || undefined,
      appliedDomain,
      hybridComfortable,
      interestReason: interestReason.trim(),
      skills: skills.trim(),
      proficiencyLevel,
      hasProjects,
      projectDescription: projectDescription?.trim() || undefined,
      resumeLink: resumeLink.trim(),
      portfolioLink: portfolioLink?.trim() || undefined,
      heardFrom,
      customHeardFrom: customHeardFrom?.trim() || undefined,
      availability,
      additionalNotes: additionalNotes?.trim() || undefined,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };

    // Associate with logged-in user if available
    if (req.user?._id) {
      applicationData.submittedBy = req.user._id;
    }

    const application = await CareerApplication.create(applicationData);

    // Log activity
    logActivity({
      userId: req.user?._id || null,
      action: 'career_application_submitted',
      targetType: 'CareerApplication',
      targetId: application._id,
      metadata: { domain: appliedDomain, email: application.email },
      req,
    }).catch(() => {});

    // Fire-and-forget acknowledgement email — never blocks the response.
    if (req.user?.email) {
      sendCareerApplicationAck(req.user, application).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Our team will review and get back to you soon.',
      data: { id: application._id },
    });
  } catch (error) {
    console.error('Submit application error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
};

/**
 * GET /api/careers/applications/me — the signed-in user's own submissions
 * (newest first), so the navbar can show their application status. Own data
 * only — the staff listing endpoints stay behind careers.view.
 */
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const applications = await CareerApplication.find({ submittedBy: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('status appliedDomain createdAt reviewedAt')
      .lean();
    return res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      domain,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
    } = req.query;

    const query = {};

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: regex },
        { email: regex },
        { departmentBranch: regex },
        { whatsappNumber: regex },
      ];
    }

    if (status && STATUSES.includes(status)) {
      query.status = status;
    }

    if (domain && DOMAINS.includes(domain)) {
      query.appliedDomain = domain;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      CareerApplication.find(query)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('submittedBy', 'name email picture studentId')
        .populate('reviewedBy', 'name email')
        .lean(),
      CareerApplication.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: applications,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const application = await CareerApplication.findById(id)
      .populate('submittedBy', 'name email picture studentId course phoneNumber')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    return res.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const update = {};
    if (status) update.status = status;
    if (reviewNotes !== undefined) update.reviewNotes = reviewNotes.trim().slice(0, 2000);
    if (status && status !== 'pending') {
      update.reviewedBy = req.user._id;
      update.reviewedAt = new Date();
    }

    const application = await CareerApplication.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    )
      .populate('submittedBy', 'name email picture studentId')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Log activity
    logActivity({
      userId: req.user._id,
      action: 'career_application_updated',
      targetType: 'CareerApplication',
      targetId: application._id,
      metadata: { status: application.status, previousStatus: application.status },
      req,
    }).catch(() => {});

    return res.json({ success: true, message: 'Application updated', data: application });
  } catch (error) {
    console.error('Update application error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const application = await CareerApplication.findByIdAndDelete(id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Log activity
    logActivity({
      userId: req.user._id,
      action: 'career_application_deleted',
      targetType: 'CareerApplication',
      targetId: id,
      metadata: { domain: application.appliedDomain, email: application.email },
      req,
    }).catch(() => {});

    return res.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    console.error('Delete application error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await CareerApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const domainStats = await CareerApplication.aggregate([
      {
        $group: {
          _id: '$appliedDomain',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const recentCount = await CareerApplication.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const total = await CareerApplication.countDocuments();

    return res.json({
      success: true,
      data: {
        byStatus: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        byDomain: domainStats.reduce((acc, d) => ({ ...acc, [d._id]: d.count }), {}),
        recentWeek: recentCount,
        total,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};