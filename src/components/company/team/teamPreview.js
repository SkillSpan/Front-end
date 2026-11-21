/*
 * Design-preview scenarios for Team Formation (VITE_COMPANY_PREVIEW builds and
 * tests only — never imported by live code paths). ?preview=<scenario>
 *   (none)    p1 as seeded: one confirmed, one invitation pending, one accepted
 *             participant below a critical skill → start blocked (Scenario 6)
 *   ready     every required role confirmed → Start Project enabled
 *   declined  the UI Designer declined → capacity released, promote from waitlist (BR-09)
 *   conflict  the Front-end participant is on another active team (BR-07)
 *   active    the project was started (Scenario 5 result)
 */
import { mockAddConflict, mockAssign, mockGetTeam, mockRespondInvitation, mockSendInvitations, mockStartProject } from '../projects/mockBackend';

export function applyTeamPreview(projectId, scenario) {
  if (projectId !== 'p1' || !scenario) return;
  try {
    if (scenario === 'declined') { mockRespondInvitation('inv2', { response: 'declined' }); return; }
    if (scenario === 'conflict') { mockAddConflict('p1', 'a103', { project_title: 'Inventory API', role: 'Front-end Developer' }); return; }
    if (scenario === 'ready' || scenario === 'active') {
      mockRespondInvitation('inv2', { response: 'accepted' });
      mockAssign('p1', { members: [{ application_id: 'a103', project_role_id: 'r3', exception: { support: 'Weekly pairing with Sara on the research tasks.', risk: 'Interviews may start a week later.' } }] });
      mockSendInvitations('p1');
      const inv = mockGetTeam('p1').data.participants.find((x) => x.application_id === 'a103')?.assignment?.invitation;
      if (inv) mockRespondInvitation(inv.id, { response: 'accepted' });
      if (scenario === 'active') mockStartProject('p1');
    }
  } catch { /* scenario already applied in this session */ }
}
