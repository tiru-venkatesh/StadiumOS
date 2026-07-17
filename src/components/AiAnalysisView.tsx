import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Brain, Shield, Megaphone, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface AiAnalysisViewProps {
  matchId: string;
  token: string;
  teamA: any;
  teamB: any;
  onLogEvent?: (event: string, payload: any) => void;
}

interface IAiMatchAnalysis {
  pregameCommentary: string;
  keyTacticalInsights: string[];
  winProbability: {
    teamA: number;
    teamB: number;
  };
  projectedScore: {
    teamA: number;
    teamB: number;
  };
  teamAChant: string;
  teamBChant: string;
  playersToWatch: string[];
}

const LOADING_STEPS = [
  'Initializing StadiumOS AI Agent...',
  'Analyzing team roster structures...',
  'Extracting past venue performances...',
  'Synthesizing stadium tactical options...',
  'Generating real-time fan crowd chants...',
  'Finalizing win-probability distributions...'
];

export const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({
  matchId,
  token,
  teamA,
  teamB,
  onLogEvent,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [analysis, setAnalysis] = useState<IAiMatchAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cycle through helpful, reassuring loading steps during generation
  useEffect(() => {
    if (loading) {
      let stepIdx = 0;
      setLoadingStep(LOADING_STEPS[0]);
      intervalRef.current = setInterval(() => {
        stepIdx = (stepIdx + 1) % LOADING_STEPS.length;
        setLoadingStep(LOADING_STEPS[stepIdx]);
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loading]);

  const handleFetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch(`${window.location.origin}/api/v1/matches/${matchId}/ai-analysis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to generate AI Analysis.');
      }

      setAnalysis(result.data);

      if (onLogEvent) {
        onLogEvent('GET /api/v1/matches/:id/ai-analysis', result.data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while calling the Gemini API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Brain className="text-purple-400 w-5 h-5 animate-pulse" aria-hidden="true" />
          StadiumOS Smart AI Insights
        </h2>
        {analysis && (
          <button
            type="button"
            onClick={handleFetchAnalysis}
            disabled={loading}
            aria-label="Regenerate Analysis"
            className="text-[10px] text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1 transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Recalculate
          </button>
        )}
      </div>

      {/* EMPTY STATE */}
      {!analysis && !loading && !error && (
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 text-center">
          <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-3 animate-pulse" aria-hidden="true" />
          <p className="text-xs text-slate-300 font-medium mb-1">
            Predictive Tactical Analytics
          </p>
          <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto mb-4 leading-relaxed">
            Generate real-time tactical breakdowns, team chants, and win probability models using the server-side Gemini 3.5 LLM.
          </p>
          <button
            type="button"
            onClick={handleFetchAnalysis}
            className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Analyze Match with Gemini AI
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]" aria-live="assertive">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" aria-hidden="true" />
          <p className="text-xs text-slate-200 font-semibold mb-1 animate-pulse">
            {loadingStep}
          </p>
          <p className="text-[10px] text-slate-400 max-w-[240px] leading-relaxed">
            Processing real-time rosters and computing live simulator odds. This takes 2-3 seconds.
          </p>
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl text-xs flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" aria-hidden="true" />
          <div className="flex-1">
            <strong className="font-semibold text-rose-300 block mb-1">AI Service Error</strong>
            <p className="text-rose-200/95 leading-relaxed mb-3">
              {error}
            </p>
            <button
              type="button"
              onClick={handleFetchAnalysis}
              className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-900 rounded text-[10px] font-medium text-rose-200 transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* MAIN ANALYSIS CONTENT */}
      {analysis && (
        <div className="space-y-4 font-sans text-xs text-slate-300" aria-live="polite">
          
          {/* WIN PROBABILITY PROGRESS BAR */}
          <section aria-label="Simulated Win Probability" className="bg-slate-950 border border-slate-850 rounded-xl p-3">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1.5">
              <span className="font-bold text-blue-400">{teamA?.name || 'Home'}: {analysis.winProbability.teamA}%</span>
              <span>WIN PROBABILITY</span>
              <span className="font-bold text-purple-400">{teamB?.name || 'Away'}: {analysis.winProbability.teamB}%</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex" aria-hidden="true">
              <div 
                className="bg-blue-600 h-full transition-all duration-1000" 
                style={{ width: `${analysis.winProbability.teamA}%` }} 
              />
              <div 
                className="bg-purple-600 h-full transition-all duration-1000 flex-1" 
              />
            </div>
          </section>

          {/* PROJECTED SCORE BOARD */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Projected Final Score</span>
            <div className="flex items-center gap-3 font-mono text-md font-bold text-white">
              <span className="text-blue-400">{analysis.projectedScore.teamA}</span>
              <span className="text-slate-600">:</span>
              <span className="text-purple-400">{analysis.projectedScore.teamB}</span>
            </div>
          </div>

          {/* EDITORIAL PREGAME COMMENTARY */}
          <blockquote className="bg-slate-950/40 border-l-2 border-purple-500/70 p-3 rounded-r-xl italic leading-relaxed text-[11px] text-slate-300">
            "{analysis.pregameCommentary}"
          </blockquote>

          {/* BENTO GRID: TACTICAL INSIGHTS & KEY PLAYERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <section aria-label="Tactical Considerations" className="bg-slate-950 border border-slate-850 rounded-xl p-3">
              <h3 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" /> Tactical Focus
              </h3>
              <ul className="space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
                {analysis.keyTacticalInsights.map((insight, idx) => (
                  <li key={idx} className="text-slate-300">{insight}</li>
                ))}
              </ul>
            </section>

            <section aria-label="Players to Watch" className="bg-slate-950 border border-slate-850 rounded-xl p-3">
              <h3 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" /> Players to Watch
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analysis.playersToWatch.map((player, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] font-mono font-bold border border-purple-500/20"
                  >
                    ⭐ {player}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* PERSONALIZED FAN CROWD CHANTS */}
          <section aria-label="Stadium Crowd Chants" className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3">
            <h3 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Megaphone className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> Custom Stadium Chants
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/30">
                <div className="text-[9px] uppercase font-mono font-bold text-blue-400 mb-1">{teamA?.name || 'Home Team'} fans</div>
                <p className="font-medium text-slate-200 text-[11px] italic leading-relaxed">
                  "{analysis.teamAChant}"
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-900/30">
                <div className="text-[9px] uppercase font-mono font-bold text-purple-400 mb-1">{teamB?.name || 'Away Team'} fans</div>
                <p className="font-medium text-slate-200 text-[11px] italic leading-relaxed">
                  "{analysis.teamBChant}"
                </p>
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
};
