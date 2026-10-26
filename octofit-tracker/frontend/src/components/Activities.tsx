import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = { type: string; minutes: number; points: number };

export default function Activities() {
  return <CapabilityCard<ActivityItem>
    title="Activities"
    description="Track student activity minutes and points."
    path="/api/activities"
    dataKey="activities"
    emptyMessage="No activities yet."
    renderItem={(activity) => <>{activity.type} · {activity.minutes} minutes · {activity.points} points</>}
  />;
}
