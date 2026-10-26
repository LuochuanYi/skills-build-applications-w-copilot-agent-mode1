import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function requestError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw requestError('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) throw requestError('A valid userId is required');
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) throw requestError('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw requestError('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw requestError('Minutes must be a positive number');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw requestError('The specified user or team does not exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw requestError('Team details are required');
  const { name, mascot, members = [] } = input;
  if (typeof name !== 'string' || !name.trim()) throw requestError('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw requestError('Team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    throw requestError('Team members must be valid user IDs');
  }
  const memberIds = members as string[];
  if (memberIds.length && await User.countDocuments({ _id: { $in: memberIds } }) !== memberIds.length) {
    throw requestError('One or more team members do not exist');
  }
  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw requestError('User not found', 404);

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const activityType = activities[0]?.type.trim().toLowerCase();
  const goalMatch = workouts.some((workout) => workout.focus.toLowerCase() === goal);
  const preferredFocus = goalMatch ? goal : activityType;

  return workouts
    .map((workout) => {
      const matchesGoal = workout.focus.toLowerCase() === goal;
      const matchesActivity = Boolean(activityType && workout.focus.toLowerCase() === activityType);
      const reason = matchesGoal
        ? `Recommended for your ${user.fitnessGoal} goal.`
        : matchesActivity
          ? `Based on your recent ${activities[0].type} activity.`
          : `Recommended based on your ${user.fitnessGoal} goal.`;
      return { ...workout, reason, matchesPreferredFocus: workout.focus.toLowerCase() === preferredFocus };
    })
    .sort((left, right) => Number(right.matchesPreferredFocus) - Number(left.matchesPreferredFocus))
    .map(({ matchesPreferredFocus: _matchesPreferredFocus, ...workout }) => workout);
}

export { User };
