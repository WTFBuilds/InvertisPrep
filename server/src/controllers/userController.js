import { User } from '../models/User.js';
import { PYQPaper } from '../models/PYQPaper.js';

// Get public user profile (Only logged-in users)
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const user = await User.findById(id).select('name email picture role course followers following');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isFollowing = user.followers.some(
      (followerId) => followerId.toString() === currentUserId.toString()
    );

    // Fetch the 10 most recent verified papers uploaded by this user
    const lastPapers = await PYQPaper.find({
      uploadedBy: id,
      verified: true,
      isActive: true,
    })
      .populate('departmentId', 'name displayName')
      .populate('branchId', 'name')
      .populate('sessionId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          role: user.role,
          course: user.course || 'N/A',
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
        isFollowing,
        lastPapers,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving user profile' });
  }
};

// Follow a user
export const followUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    if (id === currentUserId) {
      res.status(400).json({ success: false, message: 'You cannot follow yourself' });
      return;
    }

    const userToFollow = await User.findById(id);
    if (!userToFollow) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Add current user to target user's followers
    await User.findByIdAndUpdate(id, {
      $addToSet: { followers: currentUserId },
    });

    // Add target user to current user's following
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: id },
    });

    res.json({ success: true, message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ success: false, message: 'Server error during follow action' });
  }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    if (id === currentUserId) {
      res.status(400).json({ success: false, message: 'You cannot unfollow yourself' });
      return;
    }

    const userToUnfollow = await User.findById(id);
    if (!userToUnfollow) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Remove current user from target user's followers
    await User.findByIdAndUpdate(id, {
      $pull: { followers: currentUserId },
    });

    // Remove target user from current user's following
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: id },
    });

    res.json({ success: true, message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ success: false, message: 'Server error during unfollow action' });
  }
};
