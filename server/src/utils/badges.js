/**
 * Calculate user badges and progress dynamically based on their stats
 * Colors used are matching: White (outline), Pink, and Indigo
 */
export const calculateUserBadges = (points = 0, uploads = 0, quizWins = 0, followers = 0) => {
  const badges = [];

  // ============================================================
  // 1. Points Milestones (Pink & Indigo Theme)
  // ============================================================
  
  // Rising Star (100 Points) - Indigo
  badges.push({
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Earn 100 points to start your rank climb.',
    icon: '✨',
    color: 'indigo',
    requirement: '100 total points',
    current: points,
    target: 100,
    completed: points >= 100,
  });

  // Scholar (500 Points) - Pink
  badges.push({
    id: 'scholar',
    name: 'Scholar',
    description: 'Earn 500 total points.',
    icon: '📚',
    color: 'pink',
    requirement: '500 total points',
    current: points,
    target: 500,
    completed: points >= 500,
  });

  // Academic Elite (1000 Points) - Indigo
  badges.push({
    id: 'academic_elite',
    name: 'Academic Elite',
    description: 'Become one of the top academic minds with 1,000 points.',
    icon: '🎓',
    color: 'indigo',
    requirement: '1,000 total points',
    current: points,
    target: 1000,
    completed: points >= 1000,
  });

  // Prep Legend (2500 Points) - Pink
  badges.push({
    id: 'prep_legend',
    name: 'Prep Legend',
    description: 'Reach legendary status on InvertisPrep.',
    icon: '👑',
    color: 'pink',
    requirement: '2,500 total points',
    current: points,
    target: 2500,
    completed: points >= 2500,
  });

  // ============================================================
  // 2. Upload/Contribution Milestones (White Outline Theme)
  // ============================================================
  
  // Contributor (1 Upload) - White
  badges.push({
    id: 'contributor',
    name: 'Contributor',
    description: 'Upload your first verified study paper.',
    icon: '📝',
    color: 'white',
    requirement: '1 verified upload',
    current: uploads,
    target: 1,
    completed: uploads >= 1,
  });

  // Silver Scholar (5 Uploads) - Pink
  badges.push({
    id: 'silver_scholar',
    name: 'Silver Scholar',
    description: 'Provide 5 verified papers for the community.',
    icon: '⚡',
    color: 'pink',
    requirement: '5 verified uploads',
    current: uploads,
    target: 5,
    completed: uploads >= 5,
  });

  // Gold Contributor (10 Uploads) - Indigo
  badges.push({
    id: 'gold_contributor',
    name: 'Gold Contributor',
    description: 'Upload 10 verified papers.',
    icon: '🏆',
    color: 'indigo',
    requirement: '10 verified uploads',
    current: uploads,
    target: 10,
    completed: uploads >= 10,
  });

  // ============================================================
  // 3. Quiz Milestones (Indigo & Pink Theme)
  // ============================================================
  
  // Quiz Rookie (1 Win) - White
  badges.push({
    id: 'quiz_rookie',
    name: 'Quiz Rookie',
    description: 'Win your first 1v1 quiz battle.',
    icon: '⚔️',
    color: 'white',
    requirement: '1 quiz battle win',
    current: quizWins,
    target: 1,
    completed: quizWins >= 1,
  });

  // Quiz Warrior (10 Wins) - Indigo
  badges.push({
    id: 'quiz_warrior',
    name: 'Quiz Warrior',
    description: 'Win 10 quiz battles.',
    icon: '🔥',
    color: 'indigo',
    requirement: '10 quiz battle wins',
    current: quizWins,
    target: 10,
    completed: quizWins >= 10,
  });

  // Quiz Gladiator (25 Wins) - Pink
  badges.push({
    id: 'quiz_gladiator',
    name: 'Quiz Gladiator',
    description: 'Win 25 quiz battles to dominate the arena.',
    icon: '👑',
    color: 'pink',
    requirement: '25 quiz battle wins',
    current: quizWins,
    target: 25,
    completed: quizWins >= 25,
  });

  // ============================================================
  // 4. Community Milestones (White Outline Theme)
  // ============================================================
  
  // Social Star (5 Followers) - Indigo
  badges.push({
    id: 'social_star',
    name: 'Social Star',
    description: 'Have at least 5 other students follow your profile.',
    icon: '👥',
    color: 'indigo',
    requirement: '5 followers',
    current: followers,
    target: 5,
    completed: followers >= 5,
  });

  return badges;
};
