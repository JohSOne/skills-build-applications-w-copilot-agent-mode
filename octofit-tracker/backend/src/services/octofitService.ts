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

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
