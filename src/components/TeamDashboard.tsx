import React from 'react';
import { Users, Shield } from 'lucide-react';

interface TeamDashboardProps {
  currentStep: number;
  teamA: any;
  teamB: any;
  match: any;
  registeredUser: any;
}

/**
 * ============================================================================
 * FAN ENGAGEMENT CORE: TEAM DASHBOARD
 * ============================================================================
 * Focuses on competitive roster tracking and match status details.
 * Beyond passive viewing: allows team managers to monitor athletic profiles.
 */
const TeamDashboard: React.FC<TeamDashboardProps> = ({
  currentStep,
  teamA,
  teamB,
  match,
  registeredUser,
}) => {
  return (
    <div className="space-y-4">
      {currentStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" aria-hidden="true" /> Roster Monitor
          </h3>
          <p className="text-slate-300">
            Welcome, team agent. You are authenticated as <span className="text-blue-400 font-semibold">{registeredUser?.name} ({registeredUser?.role})</span>.
          </p>
          <div className="border-t border-slate-800 pt-2 font-mono text-[11px] text-slate-300">
            <div>Home: <span className="text-white">{teamA?.name || 'LA Lakers'}</span></div>
            <div>Away: <span className="text-white">{teamB?.name || 'Boston Celtics'}</span></div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" aria-hidden="true" /> Live Athletic Performance
          </h3>
          <p className="text-slate-300">
            The active match is scheduled at Staples Center. Scores update automatically.
          </p>
          {match && (
            <div className="mt-2 p-2 bg-slate-950 rounded font-mono text-[11px] text-slate-300">
              <div>Match ID: {match._id}</div>
              <div>Status: <span className="text-rose-400 uppercase font-bold">{match.status}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(TeamDashboard);
