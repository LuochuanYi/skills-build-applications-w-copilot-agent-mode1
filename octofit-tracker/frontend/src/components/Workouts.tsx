import { CapabilityCard } from './CapabilityCard.js';

type WorkoutItem = { title: string; focus: string; minutes: number; reason: string };

export default function Workouts() {
  return <CapabilityCard<WorkoutItem>
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
    dataKey="suggestions"
    emptyMessage="No workout suggestions yet."
    renderItem={(workout) => <>{workout.title} · {workout.focus} · {workout.minutes} minutes · {workout.reason}</>}
  />;
}
