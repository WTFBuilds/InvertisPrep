import { User } from '../models/User.js';
import { PointsLog } from '../models/PointsLog.js';

/**
 * Award points to a user and log the action
 * @param {string} userId - User ID to award points to
 * @param {number} points - Number of points to award (can be positive or negative)
 * @param {string} type - Enum: 'upload', 'contribution', 'quiz', 'community'
 * @param {string} description - Human readable description of the reward
 */
export const awardPoints = async (userId, points, type, description) => {
  try {
    if (!userId || !points) return null;

    // Create a PointsLog entry
    const log = await PointsLog.create({
      userId,
      points,
      type,
      description,
    });

    // Increment points on the User model
    await User.findByIdAndUpdate(userId, {
      $inc: { points: points, weeklyPoints: points }
    });

    console.log(`[Points] Awarded ${points} points to user ${userId} for ${type} (${description})`);
    return log;
  } catch (error) {
    console.error('[Points] Error awarding points:', error);
    return null;
  }
};
