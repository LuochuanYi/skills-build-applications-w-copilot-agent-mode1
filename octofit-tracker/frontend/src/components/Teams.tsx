import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = { name: string; mascot: string; members: unknown[] };

export default function Teams() {
  return <CapabilityCard<TeamItem>
    title="Teams"
    description="Manage teams and members."
    path="/api/teams"
    dataKey="teams"
    emptyMessage="No teams yet."
    renderItem={(team) => <>{team.name} · {team.mascot} · {team.members.length} members</>}
  />;
}
