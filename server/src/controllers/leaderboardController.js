import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { PointsLog } from '../models/PointsLog.js';
import { PYQPaper } from '../models/PYQPaper.js';
import { calculateUserBadges } from '../utils/badges.js';

// Get leaderboard rankings
export const getLeaderboard = async (req, res) => {
  try {
    const { type = 'all_time', department } = req.query;

    let rankings = [];

    if (type === 'weekly') {
      // Get the start of the current week (Sunday 12:00 AM IST)
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const aggregationPipeline = [
        {
          $match: {
            createdAt: { $gte: startOfWeek },
          },
        },
        {
          $group: {
            _id: '$userId',
            weeklyPoints: { $sum: '$points' },
          },
        },
        {
          $sort: { weeklyPoints: -1 },
        },
        {
          $limit: 100,
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
      ];

      // If department is specified, filter by course field (case-insensitive regex)
      if (department) {
        aggregationPipeline.push({
          $match: {
            'user.course': { $regex: new RegExp(`^${department}$`, 'i') },
          },
        });
      }

      aggregationPipeline.push({
        $project: {
          _id: 0,
          userId: '$_id',
          points: '$weeklyPoints',
          name: '$user.name',
          email: '$user.email',
          picture: '$user.picture',
          course: '$user.course',
          followersCount: { $size: { $ifNull: ['$user.followers', []] } },
        },
      });

      rankings = await PointsLog.aggregate(aggregationPipeline);
    } else {
      // All time leaderboard
      const filter = { isActive: true, points: { $gt: 0 } };
      
      if (department) {
        filter.course = { $regex: new RegExp(`^${department}$`, 'i') };
      }

      const users = await User.find(filter)
        .select('name email picture course points followers')
        .sort({ points: -1 })
        .limit(100)
        .lean();

      rankings = users.map((u) => ({
        userId: u._id,
        points: u.points || 0,
        name: u.name,
        email: u.email,
        picture: u.picture,
        course: u.course || 'N/A',
        followersCount: u.followers ? u.followers.length : 0,
      }));
    }

    // Add explicit rank indices
    const rankedList = rankings.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    res.json({
      success: true,
      data: rankedList,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving leaderboard rankings' });
  }
};

// Get stats & badges for the logged in user
export const getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // 2. Fetch specific statistics for badges
    // Number of verified uploads
    const verifiedUploads = await PYQPaper.countDocuments({
      uploadedBy: userId,
      verified: true,
      isActive: true,
    });

    // Quiz wins: check logs of type 'quiz' and description matching 'Won'
    const quizWins = await PointsLog.countDocuments({
      userId,
      type: 'quiz',
      description: { $regex: /Won 1v1/i },
    });

    const followers = user.followers ? user.followers.length : 0;

    // Calculate badges
    const badges = calculateUserBadges(user.points, verifiedUploads, quizWins, followers);

    // 3. Calculate current rankings
    // All-time Rank
    const allTimeHigherCount = await User.countDocuments({
      isActive: true,
      points: { $gt: user.points },
    });
    const allTimeRank = allTimeHigherCount + 1;

    // Weekly points and rank
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const myWeeklyLog = await PointsLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: '$userId',
          total: { $sum: '$points' },
        },
      },
    ]);

    const weeklyPoints = myWeeklyLog[0]?.total || 0;

    // Count how many users have weekly points higher than mine
    const weeklyRankLogs = await PointsLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: '$userId',
          total: { $sum: '$points' },
        },
      },
      {
        $match: {
          total: { $gt: weeklyPoints },
        },
      },
      {
        $count: 'count',
      },
    ]);

    const weeklyRank = (weeklyRankLogs[0]?.count || 0) + 1;

    res.json({
      success: true,
      data: {
        points: user.points || 0,
        weeklyPoints,
        allTimeRank,
        weeklyRank,
        stats: {
          verifiedUploads,
          quizWins,
          followers,
        },
        badges,
      },
    });
  } catch (error) {
    console.error('Error fetching personal leaderboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving stats' });
  }
};
