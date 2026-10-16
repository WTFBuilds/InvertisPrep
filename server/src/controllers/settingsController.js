import { getSetting, setSetting } from '../services/settingsService.js';

/**
 * Public settings reader — returned to all clients (students, guests, etc.).
 * Fast, cached via settingsService.
 */
export const getPublicSettings = async (_req, res) => {
  try {
    const instagramPopupEnabled = await getSetting('instagramPopupEnabled', true);
    return res.json({
      success: true,
      data: {
        instagramPopupEnabled: Boolean(instagramPopupEnabled),
      },
    });
  } catch (err) {
    console.error('Error fetching public settings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
    });
  }
};

/**
 * Super-admin settings reader — fetches full platform toggles.
 */
export const getAdminSettings = async (_req, res) => {
  try {
    const instagramPopupEnabled = await getSetting('instagramPopupEnabled', true, { fresh: true });
    return res.json({
      success: true,
      data: {
        instagramPopupEnabled: Boolean(instagramPopupEnabled),
      },
    });
  } catch (err) {
    console.error('Error fetching admin settings:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin settings',
    });
  }
};

/**
 * Super-admin toggle for Instagram follow popup gate.
 */
export const updateInstagramPopupSetting = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled must be a boolean',
      });
    }

    const updated = await setSetting('instagramPopupEnabled', enabled);
    return res.json({
      success: true,
      data: {
        instagramPopupEnabled: Boolean(updated),
      },
      message: `Instagram follow popup ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (err) {
    console.error('Error updating instagram popup setting:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update instagram popup setting',
    });
  }
};
