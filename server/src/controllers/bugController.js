import { Bug } from '../models/Bug.js';
import { logActivity } from '../services/activityService.js';

// Create a new bug report
export const createBug = async (req, res) => {
  try {
    const { title, description, severity, email, browser, device } = req.body;

    if (!title || !description || !email) {
      res.status(400).json({ success: false, message: 'Title, description, and email are required fields.' });
      return;
    }

    const bugData = {
      title,
      description,
      severity: severity || 'medium',
      email,
      browser,
      device,
    };

    // If user is authenticated, associate their ID
    if (req.user?.id) {
      bugData.reportedBy = req.user.id;
    }

    const bug = await Bug.create(bugData);

    if (req.user?.id) {
      logActivity(
        {
          user: req.user.id,
          type: 'bug_report',
          entityId: String(bug._id),
          title: `Bug: ${title.slice(0, 120)}`,
          meta: { severity: bugData.severity },
        },
        req
      );
    }

    res.status(201).json({ success: true, data: bug });
  } catch (error) {
    console.error('Create bug error:', error);
    res.status(500).json({ success: false, message: 'Server error during bug submission' });
  }
};

// Get all bug reports (Admin only)
export const getBugs = async (req, res) => {
  try {
    const { status, severity } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const bugs = await Bug.find(filter)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email picture');

    res.json({ success: true, count: bugs.length, data: bugs });
  } catch (error) {
    console.error('Get bugs error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving bug reports' });
  }
};

// Update bug report status (Admin only)
export const updateBugStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'active', 'resolved', 'dismissed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Valid status is required.' });
      return;
    }

    const bug = await Bug.findById(id);
    if (!bug) {
      res.status(404).json({ success: false, message: 'Bug report not found' });
      return;
    }

    bug.status = status;
    await bug.save();

    res.json({ success: true, data: bug });
  } catch (error) {
    console.error('Update bug status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating bug status' });
  }
};

// Delete a bug report (Admin only)
export const deleteBug = async (req, res) => {
  try {
    const { id } = req.params;

    const bug = await Bug.findByIdAndDelete(id);
    if (!bug) {
      res.status(404).json({ success: false, message: 'Bug report not found' });
      return;
    }

    res.json({ success: true, message: 'Bug report deleted successfully' });
  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting bug report' });
  }
};
