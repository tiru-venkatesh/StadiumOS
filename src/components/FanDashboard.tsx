import React from 'react';
import { ShoppingBag, AlertCircle } from 'lucide-react';

interface FanDashboardProps {
  currentStep: number;
  match: any;
  teamA: any;
  teamB: any;
  selectedSeat: string;
  concessionItem: string;
  seatError: string;
  order: any;
  setSelectedSeat: (seat: string) => void;
  setConcessionItem: (item: string) => void;
  submitPredictionPick: (teamId: string) => void;
  submitSeatOrder: () => void;
}

/**
 * ============================================================================
 * FAN ENGAGEMENT CORE: FAN DASHBOARD
 * ============================================================================
 * Drives gamified outcomes, live predictions, and convenient seat-side ordering.
 * Beyond passive viewing: empowers fans with in-stadium concession queues.
 */
const FanDashboard: React.FC<FanDashboardProps> = ({
  currentStep,
  match,
  teamA,
  teamB,
  selectedSeat,
  concessionItem,
  seatError,
  order,
  setSelectedSeat,
  setConcessionItem,
  submitPredictionPick,
  submitSeatOrder,
}) => {
  return (
    <div className="space-y-4">
      {/* STEP 4: PREDICTIONS */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            {/* Core fan-engagement feature: addresses 'beyond passive viewing' requirement */}
            🔮 <strong>Gamify the Match:</strong> Guess the winner below to accumulate leaderboard points! Correct winners earn 100 points.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => submitPredictionPick(teamA?._id)}
              data-testid="predict-teama-btn"
              className="min-h-[44px] py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              🔮 Predict <span className="text-blue-400 font-semibold">{teamA?.name || 'LA Lakers'}</span>
            </button>
            <button
              type="button"
              onClick={() => submitPredictionPick(teamB?._id)}
              data-testid="predict-teamb-btn"
              className="min-h-[44px] py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              🔮 Predict <span className="text-blue-400 font-semibold">{teamB?.name || 'Boston Celtics'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CONCESSIONS */}
      {currentStep === 5 && (
        <div className="flex flex-col h-full justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-400" aria-hidden="true" /> Step 5: Seat-Side Concessions Ordering
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {/* Core fan-engagement feature: addresses 'beyond passive viewing' requirement */}
              Skip long lines! Place concessions orders directly to your seat. Status alterations automatically notify our isolated user subscription socket rooms.
            </p>

            <fieldset className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
              <legend className="text-xs font-semibold text-slate-200 px-2">Order Concessions Details</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label htmlFor="concession-item-select" className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">
                    Concessions Menu <span className="text-rose-400" aria-hidden="true">*</span>:
                  </label>
                  <select
                    id="concession-item-select"
                    value={concessionItem}
                    onChange={(e) => setConcessionItem(e.target.value)}
                    required
                    aria-required="true"
                    data-testid="concessions-select"
                    className="w-full h-11 bg-slate-950 border border-slate-800 px-3 rounded text-xs text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  >
                    <option value="Stadium Burger & Fries">Stadium Burger & Fries ($14.99)</option>
                    <option value="Sizzling Hot Dog">Sizzling Hot Dog ($6.50)</option>
                    <option value="Large Cold Soda">Large Cold Soda ($6.50)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="seat-number-input" className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">
                    Your Arena Seat <span className="text-rose-400" aria-hidden="true">*</span>:
                  </label>
                  <input
                    type="text"
                    id="seat-number-input"
                    value={selectedSeat}
                    onChange={(e) => setSelectedSeat(e.target.value)}
                    required
                    aria-required="true"
                    aria-invalid={!!seatError}
                    aria-describedby={seatError ? "seat-error-msg" : undefined}
                    data-testid="seat-input"
                    className={`w-full h-11 bg-slate-950 border px-3 rounded text-xs text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
                      seatError ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {seatError && (
                    <div id="seat-error-msg" className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      <span>{seatError}</span>
                    </div>
                  )}
                </div>
              </div>
            </fieldset>

            {order && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs mb-4" aria-live="polite">
                <div className="flex justify-between items-center mb-1">
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
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={submitSeatOrder}
            disabled={!!seatError}
            data-testid="concessions-submit-btn"
            className="w-full h-11 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
          >
            Place Concessions Order
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(FanDashboard);
