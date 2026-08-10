import { Sponsor } from '../models/Sponsor.js';

// Get active sponsors (public) — featured first, newest first
export const getSponsors = async (_req, res) => {
  try {
    const sponsors = await Sponsor.find({ isActive: true }).sort({ isFeatured: -1, createdAt: -1 });
    res.json({ success: true, data: sponsors });
  } catch (error) {
    console.error('Get sponsors error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all sponsors including inactive (admin only)
export const getAllSponsors = async (_req, res) => {
  try {
    const sponsors = await Sponsor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: sponsors });
  } catch (error) {
    console.error('Get all sponsors error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create sponsor (admin only)
export const createSponsor = async (req, res) => {
  try {
    const { name, batch, email, message, tier, amount, isFeatured, isActive } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }

    const sponsor = await Sponsor.create({
      name,
      batch: batch || '',
      email: email || '',
      message: message || '',
      tier: tier || 'supporter',
      amount: amount || 0,
      isFeatured: isFeatured || false,
      isActive: isActive !== false,
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: sponsor });
  } catch (error) {
    console.error('Create sponsor error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update sponsor (admin only)
export const updateSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const sponsor = await Sponsor.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });

    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }

    res.json({ success: true, data: sponsor });
  } catch (error) {
    console.error('Update sponsor error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Soft delete sponsor (admin only)
export const deleteSponsor = async (req, res) => {
  try {
    const { id } = req.params;

    const sponsor = await Sponsor.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });

    if (!sponsor) {
      res.status(404).json({ success: false, message: 'Sponsor not found' });
      return;
    }

    res.json({ success: true, message: 'Sponsor removed successfully' });
  } catch (error) {
    console.error('Delete sponsor error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
