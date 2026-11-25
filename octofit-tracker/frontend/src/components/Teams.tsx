import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };

function loadTeams() {
  return getJson<{ teams: Team[] }>('/api/teams').then(({ teams }) => teams);
}

export default function Teams() {
  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    emptyMessage="No teams yet."
    loadItems={loadTeams}
    renderItem={(team) => <>{team.name} - {team.members.length} members</>}
  />;
}
