import React from 'react';
import { Trophy, Users, Activity, ChevronRight, AlertCircle } from 'lucide-react';

interface OrganizerDashboardProps {
  currentStep: number;
  tournament: any;
  registeredUser: any;
  teamA: any;
  teamB: any;
  match: any;
  scoreA: number;
  scoreB: number;
  order: any;
  setScoreA: (score: number) => void;
  setScoreB: (score: number) => void;
  runStep2Tournament: () => void;
  runStep3Match: () => void;
  updateMatchScore: () => void;
  launchPoll: () => void;
  finishAndGradeMatch: () => void;
  updateOrderStatus: (status: string) => void;
  setCurrentStep: (step: number) => void;
}

/**
 * ============================================================================
 * FAN ENGAGEMENT CORE: ORGANIZER DASHBOARD
 * ============================================================================
 * Addresses the central operator and organizer tools requirement of StadiumOS.
 * This component coordinates tournament brackets, scheduling, and live scoring.
 */
const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  currentStep,
  tournament,
  registeredUser,
  teamA,
  teamB,
  match,
  scoreA,
  scoreB,
  order,
  setScoreA,
  setScoreB,
  runStep2Tournament,
  runStep3Match,
  updateMatchScore,
  launchPoll,
  finishAndGradeMatch,
  updateOrderStatus,
  setCurrentStep,
}) => {
  return (
    <div className="space-y-4">
      {/* STEP 2: CREATE TOURNAMENT */}
      {currentStep === 2 && (
        <div className="flex flex-col h-full justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" /> Step 2: Establish Tournament Bracket
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Now authenticated as <span className="text-blue-400 font-semibold">{registeredUser?.name} ({registeredUser?.role})</span>, launch a tournament. Standard route guards verify rights.
            </p>

            {registeredUser?.role !== 'organizer' ? (
              <div className="bg-rose-950/40 border border-rose-900/60 text-rose-200 p-4 rounded-xl text-xs flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" aria-hidden="true" />
                <div>
                  <strong className="font-semibold text-rose-300 block mb-1">Role Restriction Denied</strong>
                  <p className="text-rose-200/95 leading-relaxed">
                    Your active user is a <strong>{registeredUser?.role}</strong>. Creating a tournament is strictly reserved for the <strong>organizer</strong> role. Test our security barrier below to observe the automatic 403 response!
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs font-semibold text-slate-200 block mb-1">Upcoming Tournament Draft:</span>
                <div className="font-mono text-[11px] text-slate-300 grid grid-cols-2 gap-2 mt-2">
                  <div>🏆 Name: <span className="text-white">StadiumOS Super Cup</span></div>
                  <div>🏀 Sport: <span className="text-white">Basketball</span></div>
                  <div>📍 Venue: <span className="text-white">Staples Center Arena</span></div>
                  <div>📅 Period: <span className="text-white">5 Days Span</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {registeredUser?.role !== 'organizer' && (
              <button
                type="button"
                onClick={runStep2Tournament}
                data-testid="test-forbidden-btn"
                className="flex-1 h-11 bg-rose-600/25 hover:bg-rose-600/40 text-rose-200 border border-rose-900 font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                Launch (Trigger 403 Forbidden Access check)
              </button>
            )}
            {(registeredUser?.role === 'organizer' || tournament) && (
              <button
                type="button"
                onClick={runStep2Tournament}
                data-testid="create-tournament-btn"
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                Provision Tournament <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: REGISTER ROSTERS & MATCH SCHEDULE */}
      {currentStep === 3 && (
        <div className="flex flex-col h-full justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" aria-hidden="true" /> Step 3: Register Competitors & Schedule Match
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Register teams into our database and arrange a match fixture under tournament ID: <span className="font-mono text-xs text-amber-400">{tournament?._id}</span>.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Home Competitor</span>
                <strong className="text-xs font-semibold text-white block mt-1">LA Lakers</strong>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider">Away Competitor</span>
                <strong className="text-xs font-semibold text-white block mt-1">Boston Celtics</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={runStep3Match}
            data-testid="register-match-btn"
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            Register Rosters & Create Match <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* STEP 4: REAL-TIME SCORING CONTROLS */}
      {currentStep === 4 && (
        <div className="flex flex-col h-full justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400 animate-pulse" aria-hidden="true" /> Step 4: Real-time Live Scores & Active Predictions
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              The match is live! As an Organizer, update scores in real-time. Changes instantly broadcast to all joined fan clients.
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center text-center">
                <div className="flex-1">
                  <span className="text-xs text-slate-200 font-semibold">{teamA?.name || 'Home Team'}</span>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                      aria-label={`Decrease score for ${teamA?.name || 'Home Team'}`}
                      data-testid="score-a-dec"
                      className="w-11 h-11 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-lg hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex items-center justify-center"
                    >
                      -
                    </button>
                    <span 
                      className="text-2xl font-mono text-white font-bold px-2"
                      aria-live="polite"
                      aria-atomic="true"
                      data-testid="score-a-value"
                    >
                      {scoreA}
                    </span>
                    <button
                      type="button"
                      onClick={() => setScoreA(scoreA + 1)}
                      aria-label={`Increase score for ${teamA?.name || 'Home Team'}`}
                      data-testid="score-a-inc"
                      className="w-11 h-11 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-lg hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="px-4 border-r border-l border-slate-800" aria-live="polite">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-bold block animate-pulse flex items-center gap-1 justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" aria-hidden="true" />
                    LIVE
                  </span>
                  <span className="text-xs text-slate-400">Staples Center</span>
                </div>

                <div className="flex-1">
                  <span className="text-xs text-slate-200 font-semibold">{teamB?.name || 'Away Team'}</span>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                      aria-label={`Decrease score for ${teamB?.name || 'Away Team'}`}
                      data-testid="score-b-dec"
                      className="w-11 h-11 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-lg hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex items-center justify-center"
                    >
                      -
                    </button>
                    <span 
                      className="text-2xl font-mono text-white font-bold px-2"
                      aria-live="polite"
                      aria-atomic="true"
                      data-testid="score-b-value"
                    >
                      {scoreB}
                    </span>
                    <button
                      type="button"
                      onClick={() => setScoreB(scoreB + 1)}
                      aria-label={`Increase score for ${teamB?.name || 'Away Team'}`}
                      data-testid="score-b-inc"
                      className="w-11 h-11 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-lg hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={updateMatchScore}
                  data-testid="emit-score-btn"
                  className="flex-1 h-11 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-blue-400 text-xs font-mono font-medium transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                >
                  Emit Score Change (Socket)
                </button>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={launchPoll}
                data-testid="launch-poll-btn"
                className="flex-1 h-11 rounded bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Launch Live Fan Poll
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={finishAndGradeMatch}
              data-testid="grade-predictions-btn"
              className="flex-1 h-11 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-900 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              Grade Predictions
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              data-testid="nav-step5-btn"
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              Go to Concessions <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CONCESSION preparer CONTROLS */}
      {currentStep === 5 && (
        <div className="flex flex-col h-full justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">Simulate Vendor Fulfillment Queue</h4>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              When fans place concession orders, vendor agents update prep status. This triggers private WebSocket rooms push.
            </p>

            {order ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs mb-4" aria-live="polite">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Order ID: <span className="font-mono text-[10px] text-white">{order._id.substr(-6)}</span></span>
                  <span 
                    data-testid="order-status-badge"
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      order.status === 'preparing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    Status: {order.status}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateOrderStatus('preparing')}
                    data-testid="set-preparing-btn"
                    className="flex-1 h-11 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  >
                    Set Preparing
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrderStatus('delivered')}
                    data-testid="set-delivered-btn"
                    className="flex-1 h-11 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  >
                    Set Delivered
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-xl text-center text-xs text-slate-400">
                Waiting for fan client to place an order...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OrganizerDashboard);
