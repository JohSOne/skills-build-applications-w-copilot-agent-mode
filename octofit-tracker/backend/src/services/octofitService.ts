import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function validationError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw validationError('Activity input is required');
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || !mongoose.isValidObjectId(userId)
    || typeof teamId !== 'string'
    || !mongoose.isValidObjectId(teamId)
  ) {
    throw validationError('Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw validationError('Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw validationError('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);
  if (!user || !team) {
    throw validationError('User or team does not exist', 404);
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw validationError('Team input is required');
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw validationError('Team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw validationError('Team mascot is required');
  }
  if (members !== undefined && !Array.isArray(members)) {
    throw validationError('Team members must be an array');
  }

  const memberIds = (members ?? []) as unknown[];
  if (memberIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) {
    throw validationError('Team members must contain valid user IDs');
  }
  const uniqueMemberIds = [...new Set(memberIds as string[])];
  const users = await User.find({ _id: { $in: uniqueMemberIds } });
  if (users.length !== uniqueMemberIds.length) {
    throw validationError('One or more team members do not exist', 404);
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: uniqueMemberIds,
  });

  await Team.updateMany(
    { _id: { $ne: team._id }, members: { $in: uniqueMemberIds } },
    { $pull: { members: { $in: uniqueMemberIds } } },
  );
  await User.updateMany(
    { _id: { $in: uniqueMemberIds } },
    { $set: { team: team._id } },
  );

  return team.toObject();
}

export async function getLeaderboard() {
  const entries = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    { $sort: { totalPoints: -1, _id: 1 } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
  ]);

  return entries.map((entry, index) => ({
    teamId: entry.team._id.toString(),
    teamName: entry.team.name,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw validationError('User not found', 404);
  }

  const focusByActivityType: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'endurance',
    strength: 'strength',
    yoga: 'mobility',
    stretch: 'mobility',
  };
  const activities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityFocus = activities
    .map((activity) => focusByActivityType[activity.type.toLowerCase()] ?? activity.type.toLowerCase())
    .find((focus) => focus.length > 0);
  const focus = activityFocus ?? user.fitnessGoal?.toLowerCase();

  const workouts = await Workout.find().lean();
  return workouts
    .map((workout) => ({
      ...workout,
      reason: (workout.focus ?? '').toLowerCase() === focus
        ? `Recommended based on your ${activities.length ? 'activity pattern' : 'fitness goal'} (${focus}).`
        : `Alternative workout for ${workout.focus ?? 'general fitness'}.`,
    }))
    .sort((left, right) => Number((right.focus ?? '').toLowerCase() === focus) - Number((left.focus ?? '').toLowerCase() === focus));
}

export { User };
