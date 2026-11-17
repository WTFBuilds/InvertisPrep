import { getSetting, setSetting } from '../services/settingsService.js';

// Default values for all platform toggles
const PLATFORM_DEFAULTS = {
  instagramPopupEnabled: true,
  welcomeEmailEnabled: true,
  paperRequestAckEnabled: true,
  paperRequestFulfilledEnabled: true,
  careerApplicationAckEnabled: true,
};

const PLATFORM_KEYS = Object.keys(PLATFORM_DEFAULTS);

function getDefaultValue(key) {
  return PLATFORM_DEFAULTS[key];
}

/**
 * Public settings reader — returned to all clients (students, guests, etc.).
 * Fast, cached via settingsService.
 */
export const getPublicSettings = async (_req, res) => {
  try {
    const settings = await Promise.all(
      PLATFORM_KEYS.map(async (key) => ({
        [key]: await getSetting(key, getDefaultValue(key)),
      }))
    );

    const data = Object.assign({}, ...settings);
    return res.json({
      success: true,
      data: {
        instagramPopupEnabled: Boolean(data.instagramPopupEnabled),
        welcomeEmailEnabled: Boolean(data.welcomeEmailEnabled),
        paperRequestAckEnabled: Boolean(data.paperRequestAckEnabled),
        paperRequestFulfilledEnabled: Boolean(data.paperRequestFulfilledEnabled),
        careerApplicationAckEnabled: Boolean(data.careerApplicationAckEnabled),
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
    const settings = await Promise.all(
      PLATFORM_KEYS.map(async (key) => ({
        [key]: await getSetting(key, getDefaultValue(key), { fresh: true }),
      }))
    );

    const data = Object.assign({}, ...settings);
    return res.json({
      success: true,
      data: {
        instagramPopupEnabled: Boolean(data.instagramPopupEnabled),
        welcomeEmailEnabled: Boolean(data.welcomeEmailEnabled),
        paperRequestAckEnabled: Boolean(data.paperRequestAckEnabled),
        paperRequestFulfilledEnabled: Boolean(data.paperRequestFulfilledEnabled),
        careerApplicationAckEnabled: Boolean(data.careerApplicationAckEnabled),
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

/**
 * Generic handler for boolean platform toggles (email features, etc.)
 */
const handlePlatformToggle = async (req, res, key, label) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled must be a boolean',
      });
    }

    const updated = await setSetting(key, enabled);
    return res.json({
      success: true,
      data: {
        [key]: Boolean(updated),
      },
      message: `${label} ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (err) {
    console.error(`Error updating ${key}:`, err);
    return res.status(500).json({
      success: false,
      message: `Failed to update ${key}`,
    });
  }
};

/**
 * Welcome email toggle
 */
export const updateWelcomeEmailSetting = async (req, res) => {
  return handlePlatformToggle(req, res, 'welcomeEmailEnabled', 'Welcome email');
};

/**
 * Paper request acknowledgement email toggle
 */
export const updatePaperRequestAckSetting = async (req, res) => {
  return handlePlatformToggle(req, res, 'paperRequestAckEnabled', 'Paper request acknowledgement email');
};

/**
 * Paper request fulfilled email toggle
 */
export const updatePaperRequestFulfilledSetting = async (req, res) => {
  return handlePlatformToggle(req, res, 'paperRequestFulfilledEnabled', 'Paper request fulfilled email');
};

/**
 * Career application acknowledgement email toggle
 */
export const updateCareerApplicationAckSetting = async (req, res) => {
  return handlePlatformToggle(req, res, 'careerApplicationAckEnabled', 'Career application acknowledgement email');
};
