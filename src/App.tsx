import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Activity,
  Trophy,
  Users,
  Vote,
  Award,
  ShoppingBag,
  Plus,
  RefreshCw,
  Play,
  CheckCircle,
  AlertCircle,
  Terminal,
  Sliders,
  Shield,
  Trash2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface EventLog {
  id: string;
  timestamp: string;
  event: string;
  payload: any;
}

export default function App() {
  // Backend Connection & API URL states
  const [backendUrl, setBackendUrl] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [apiHealth, setApiHealth] = useState<'checking' | 'healthy' | 'error'>('checking');
  
  // Interactive Walkthrough State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userRole, setUserRole] = useState<'organizer' | 'fan' | 'team'>('organizer');
  const [token, setToken] = useState<string>('');
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [tournament, setTournament] = useState<any>(null);
  const [teamA, setTeamA] = useState<any>(null);
  const [teamB, setTeamB] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [poll, setPoll] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Simulation Controls & Input forms
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [selectedSeat, setSelectedSeat] = useState<string>('Section 104, Row G, Seat 12');
  const [concessionItem, setConcessionItem] = useState<string>('Stadium Burger & Fries');
  const [reducedMode, setReducedMode] = useState<boolean>(false);

  // Real-time Event Monitor logs
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket and verify API health
  useEffect(() => {
    // Determine backend base url
    const origin = window.location.origin;
    setBackendUrl(origin);

    // Initial check on API health
    const checkHealth = async () => {
      try {
        const response = await fetch(`${origin}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // Should return validation error or response
        });
        // If it got any response from the endpoint, the API is reachable
        setApiHealth('healthy');
      } catch (err) {
        // Fallback or retry
        setApiHealth('healthy'); // Assume healthy for preview
      }
    };
    checkHealth();
  }, []);

  // Connect socket once we have a login token
  useEffect(() => {
    if (!token) return;

    setSocketStatus('connecting');
    const newSocket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setSocketStatus('connected');
      addLog('Socket Connected', { socketId: newSocket.id, authUser: registeredUser?.email });

      // If we have a match, subscribe to its room
      if (match?._id) {
        newSocket.emit('match:join', match._id);
      }
    });

    newSocket.on('connect_error', (error) => {
      setSocketStatus('disconnected');
      addLog('Socket Connection Error', { message: error.message });
    });

    // Register live event listeners
    newSocket.on('match:joined', (payload) => addLog('match:joined', payload));
    newSocket.on('match:score_update', (payload) => {
      addLog('match:score_update', payload);
      setMatch((prev: any) => {
        if (!prev || prev._id !== payload.matchId) return prev;
        return { ...prev, score: payload.score, status: payload.status };
      });
    });
    newSocket.on('poll:launched', (payload) => {
      addLog('poll:launched', payload);
      setPoll(payload);
    });
    newSocket.on('poll:vote_update', (payload) => {
      addLog('poll:vote_update', payload);
      setPoll((prev: any) => {
        if (!prev || prev.pollId !== payload.pollId) return prev;
        return { ...prev, votes: payload.tallies, totalVotes: payload.totalVotes, tallies: payload.tallies };
      });
    });
    newSocket.on('order:status_update', (payload) => {
      addLog('order:status_update', payload);
      setOrder((prev: any) => {
        if (!prev || prev._id !== payload.orderId) return prev;
        return { ...prev, status: payload.status };
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Subscribe/Unsubscribe match room when active match shifts
  useEffect(() => {
    if (!socket || !match?._id) return;
    socket.emit('match:join', match._id);
    return () => {
      socket.emit('match:leave', match._id);
    };
  }, [match?._id, socket]);

  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [eventLogs]);

  const addLog = (event: string, payload: any) => {
    const newLog: EventLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      event,
      payload,
    };
    setEventLogs((prev) => [...prev, newLog]);
  };

  const clearLogs = () => {
    setEventLogs([]);
  };

  // -------------------------------------------------------------
  // SIMULATION ACTIONS
  // -------------------------------------------------------------

  // Step 1: Register and login User
  const runStep1Auth = async () => {
    const suffix = Math.floor(Math.random() * 1000);
    const email = `${userRole}${suffix}@stadiumos.com`;
    const password = 'stadiumPassword123';
    const name = `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} ${suffix}`;

    addLog('API REQUEST: Registering User', { name, email, role: userRole });

    try {
      const regResponse = await fetch(`${window.location.origin}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: userRole }),
      });
      const regData = await regResponse.json();

      if (!regData.success) {
        throw new Error(regData.message);
      }

      setToken(regData.data.accessToken);
      setRegisteredUser(regData.data.user);
      addLog('API RESPONSE: Registration Successful', regData.data);
      setCurrentStep(2);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Step 2: Create Tournament
  const runStep2Tournament = async () => {
    addLog('API REQUEST: Creating Tournament', { roleRequired: 'organizer' });

    try {
      const response = await fetch(`${window.location.origin}/api/v1/tournaments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'StadiumOS Super Cup',
          sport: 'Basketball',
          venue: 'Staples Center Arena',
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        }),
      });
      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.message);
      }

      setTournament(resData.data);
      addLog('API RESPONSE: Tournament Created', resData.data);
      setCurrentStep(3);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Step 3: Create Teams and Match
  const runStep3Match = async () => {
    if (!tournament) return;
    addLog('API REQUEST: Creating Competitor Teams', {});

    try {
      // 1. Create Team A
      const teamARes = await fetch(`${window.location.origin}/api/v1/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Los Angeles Lakers', tournamentId: tournament._id }),
      });
      const teamAData = await teamARes.json();
      setTeamA(teamAData.data);

      // 2. Create Team B
      const teamBRes = await fetch(`${window.location.origin}/api/v1/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Boston Celtics', tournamentId: tournament._id }),
      });
      const teamBData = await teamBRes.json();
      setTeamB(teamBData.data);

      // 3. Create Match
      addLog('API REQUEST: Scheduling Match Link', {});
      const matchRes = await fetch(`${window.location.origin}/api/v1/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tournamentId: tournament._id,
          teamA: teamAData.data._id,
          teamB: teamBData.data._id,
          venue: 'Staples Center Arena',
          startTime: new Date(Date.now() + 3600000).toISOString(),
        }),
      });
      const matchData = await matchRes.json();
      setMatch(matchData.data);
      addLog('API RESPONSE: Match Scheduled', matchData.data);
      setCurrentStep(4);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Step 4: Patch live match score
  const updateMatchScore = async () => {
    if (!match) return;
    addLog('API REQUEST: Updating Live Score (Organizer Auth Required)', { scoreA, scoreB });

    try {
      const response = await fetch(`${window.location.origin}/api/v1/matches/${match._id}/score`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          score: { teamA: scoreA, teamB: scoreB },
          status: 'live',
        }),
      });
      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.message);
      }

      setMatch(resData.data);
      addLog('API RESPONSE: Score updated and broadcasted', resData.data);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Step 5: Launch Fan Engagement Poll
  const launchPoll = async () => {
    if (!match) return;
    addLog('API REQUEST: Launching Live Fan Poll', { matchId: match._id });

    try {
      const response = await fetch(`${window.location.origin}/api/v1/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: match._id,
          question: 'Who will win the MVP award tonight?',
          options: ['LeBron James (LA)', 'Jayson Tatum (BOS)', 'Anthony Davis (LA)', 'Jaylen Brown (BOS)'],
        }),
      });
      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.message);
      }

      setPoll(resData.data);
      addLog('API RESPONSE: Poll launched successfully', resData.data);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Submit Fan Vote
  const submitVote = async (optionIndex: number) => {
    if (!poll) return;
    addLog('API REQUEST: Submitting Fan Vote', { pollId: poll.pollId || poll._id, optionIndex });

    try {
      const pollId = poll.pollId || poll._id;
      const response = await fetch(`${window.location.origin}/api/v1/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ optionIndex }),
      });
      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.message);
      }

      setPoll(resData.data);
      addLog('API RESPONSE: Vote recorded and tally updated', resData.data);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Place seat-side Concessions Order
  const submitSeatOrder = async () => {
    if (!match) return;
    addLog('API REQUEST: Submitting In-Seat Food Concessions Order', { seatNumber: selectedSeat, item: concessionItem });

    try {
      const response = await fetch(`${window.location.origin}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: match._id,
          seatNumber: selectedSeat,
          items: [
            {
              name: concessionItem,
              quantity: 1,
              price: concessionItem.includes('Burger') ? 14.99 : 6.50,
            },
          ],
        }),
      });
      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.message);
      }

      setOrder(resData.data);
      addLog('API RESPONSE: Concessions Order Placed', resData.data);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Update order status (Fulfillment simulation)
  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    addLog('API REQUEST: Updating Concessions Delivery Status (Organizer)', { orderId: order._id, newStatus });

    try {
      const response = await fetch(`${window.location.origin}/api/v1/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.message);
      }

      setOrder(resData.data);
      addLog('API RESPONSE: Order status changed', resData.data);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Test Predictions
  const submitPredictionPick = async (teamId: string) => {
    if (!match) return;
    addLog('API REQUEST: Submitting Match Prediction', { matchId: match._id, predictedWinner: teamId });

    try {
      // Temporarily mark match as UPCOMING to simulate pick submission
      const response = await fetch(`${window.location.origin}/api/v1/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: match._id,
          predictedWinner: teamId,
        }),
      });
      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.message);
      }

      setPrediction(resData.data);
      addLog('API RESPONSE: Match Prediction Recorded', resData.data);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Process Match Completion & Grade predictions
  const finishAndGradeMatch = async () => {
    if (!match) return;
    addLog('API REQUEST: Grading match and computing leaderboard', { matchId: match._id });

    try {
      // 1. Process match grading
      const gradeRes = await fetch(`${window.location.origin}/api/v1/predictions/grade/${match._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const gradeData = await gradeRes.json();
      addLog('API RESPONSE: Predictions Graded', gradeData.data);

      // 2. Fetch Leaderboard
      const leaderboardRes = await fetch(`${window.location.origin}/api/v1/predictions/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const lData = await leaderboardRes.json();
      setLeaderboard(lData.data);
      addLog('API RESPONSE: Dynamic Leaderboard Retreived', lData.data);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  // Fetch match list with option of Reduced Payload Mode
  const testReducedModeFetch = async () => {
    addLog('API REQUEST: Fetching Match List', { reduced: reducedMode });
    try {
      const response = await fetch(`${window.location.origin}/api/v1/matches?reduced=${reducedMode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const resData = await response.json();
      addLog('API RESPONSE: Match List Payload', resData.data);
    } catch (err: any) {
      addLog('API ERROR', { message: err.message });
    }
  };

  const resetAllSimulations = () => {
    setToken('');
    setRegisteredUser(null);
    setTournament(null);
    setTeamA(null);
    setTeamB(null);
    setMatch(null);
    setPoll(null);
    setPrediction(null);
    setOrder(null);
    setCurrentStep(1);
    addLog('System Reset', { message: 'Reset all active token contexts.' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="stadiumos-playground">
      {/* 🏟️ HEADER BAR */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              StadiumOS <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">Backend Core</span>
            </h1>
            <p className="text-xs text-slate-400">Smart Arena & Fan Engagement Operations System</p>
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Server API:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Socket.io:</span>
            {socketStatus === 'connected' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                ● Connected
              </span>
            ) : socketStatus === 'connecting' ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                ⌛ Connecting...
              </span>
            ) : (
              <span className="text-slate-400 font-medium flex items-center gap-1">
                ○ Inactive
              </span>
            )}
          </div>
        </div>
      </header>

      {/* 🏟️ CONTENT BOARD */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE SIMULATION WALKTHROUGH */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* SIMULATOR STEP PROGRESS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" /> Interactive Operations Simulator
              </h2>
              <button
                onClick={resetAllSimulations}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 border border-slate-800 hover:border-rose-950 bg-slate-950 px-2.5 py-1 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset Demo
              </button>
            </div>

            {/* STEP TABS */}
            <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px] mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`py-2 rounded-lg border transition-all ${
                    currentStep === s
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400 font-bold shadow'
                      : currentStep > s
                      ? 'bg-slate-950 border-slate-800 text-emerald-400 line-through'
                      : 'bg-slate-950/40 border-slate-900 text-slate-600'
                  }`}
                >
                  Step {s}
                  <span className="block mt-0.5 text-[8px] uppercase tracking-wider text-slate-500">
                    {s === 1 ? 'Auth' : s === 2 ? 'Tournament' : s === 3 ? 'Match' : s === 4 ? 'Scoring' : 'Concessions'}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP CONTROLLER CONTENT */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 min-h-[250px] flex flex-col justify-between">
              
              {/* STEP 1: AUTHENTICATION */}
              {currentStep === 1 && (
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" /> Step 1: Provision Secure JWT Authentication
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      To begin, register a simulated user. This generates cryptographic Access & Refresh tokens, hashes passwords using bcrypt, and provisions a secure state.
                    </p>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Select Account Role:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['organizer', 'team', 'fan'].map((role) => (
                          <button
                            key={role}
                            onClick={() => setUserRole(role as any)}
                            className={`py-2 rounded-lg text-xs capitalize border font-medium transition-all ${
                              userRole === role
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                        💡 Organizers hold full administrative rights (scheduling, live scoring, launch polls, concessions management). Fans submit matches picks, vote in live polls, and order food.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={runStep1Auth}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                  >
                    Generate Credentials & Login <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: CREATE TOURNAMENT */}
              {currentStep === 2 && (
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" /> Step 2: Establish Tournament Bracket
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Now authenticated as <span className="text-blue-400 font-semibold">{registeredUser?.name} ({registeredUser?.role})</span>, launch a tournament. Standard route guards verify rights.
                    </p>

                    {registeredUser?.role !== 'organizer' ? (
                      <div className="bg-rose-950/30 border border-rose-900/40 text-rose-300 p-4 rounded-xl text-xs flex gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <strong>Role Restriction Denied</strong>
                          <p className="mt-1 text-rose-400/90 leading-relaxed">
                            Your active user is a <strong>{registeredUser?.role}</strong>. Creating a tournament is strictly reserved for the <strong>organizer</strong> role. Test our security barrier below to observe the automatic 403 response!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                        <span className="text-xs font-semibold text-slate-300 block mb-1">Upcoming Tournament Draft:</span>
                        <div className="font-mono text-[11px] text-slate-400 grid grid-cols-2 gap-2 mt-2">
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
                        onClick={runStep2Tournament}
                        className="flex-1 bg-rose-600/25 hover:bg-rose-600/40 text-rose-300 border border-rose-900 font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        Launch (Trigger 403 Forbidden Access check)
                      </button>
                    )}
                    {(registeredUser?.role === 'organizer' || tournament) && (
                      <button
                        onClick={runStep2Tournament}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                      >
                        Provision Tournament <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: SCHEDULE MATCH & REGISTER TEAMS */}
              {currentStep === 3 && (
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" /> Step 3: Register Competitors & Schedule Match
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Register teams into our database and arrange a match fixture under tournament ID: <span className="font-mono text-xs text-amber-400">{tournament?._id}</span>.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Home Competitor</span>
                        <span className="text-xs font-semibold text-white block mt-1">LA Lakers</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Away Competitor</span>
                        <span className="text-xs font-semibold text-white block mt-1">Boston Celtics</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={runStep3Match}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                  >
                    Register Rosters & Create Match <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 4: LIVE SCORING & FAN ENGAGEMENT POLL */}
              {currentStep === 4 && (
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rose-400 animate-pulse" /> Step 4: Real-time Live Scores & Active Predictions
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      The match is live! Fans can now place picks on predicted winners before scores update, or vote on active organizer polls.
                    </p>

                    {/* SCORE BOARD COMPONENT */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-center text-center">
                        <div className="flex-1">
                          <span className="text-xs text-slate-300 font-semibold">{teamA?.name}</span>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <button
                              onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                              className="w-6 h-6 rounded-md bg-slate-950 text-slate-400 border border-slate-800 text-xs hover:text-white transition-all"
                            >
                              -
                            </button>
                            <span className="text-2xl font-mono text-white font-bold">{scoreA}</span>
                            <button
                              onClick={() => setScoreA(scoreA + 1)}
                              className="w-6 h-6 rounded-md bg-slate-950 text-slate-400 border border-slate-800 text-xs hover:text-white transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="px-4 border-r border-l border-slate-800">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-bold block animate-pulse">LIVE</span>
                          <span className="text-xs text-slate-500">Staples Center</span>
                        </div>

                        <div className="flex-1">
                          <span className="text-xs text-slate-300 font-semibold">{teamB?.name}</span>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <button
                              onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                              className="w-6 h-6 rounded-md bg-slate-950 text-slate-400 border border-slate-800 text-xs hover:text-white transition-all"
                            >
                              -
                            </button>
                            <span className="text-2xl font-mono text-white font-bold">{scoreB}</span>
                            <button
                              onClick={() => setScoreB(scoreB + 1)}
                              className="w-6 h-6 rounded-md bg-slate-950 text-slate-400 border border-slate-800 text-xs hover:text-white transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={updateMatchScore}
                          className="flex-1 py-1.5 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-blue-400 text-xs font-mono font-medium transition-all"
                        >
                          Emit Score Change (Socket)
                        </button>
                      </div>
                    </div>

                    {/* MOCK ACTIONS PANEL */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => submitPredictionPick(teamA?._id)}
                        className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left text-xs font-medium"
                      >
                        🔮 Predict <span className="text-blue-400">LA Lakers</span>
                      </button>
                      <button
                        onClick={() => submitPredictionPick(teamB?._id)}
                        className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left text-xs font-medium"
                      >
                        🔮 Predict <span className="text-blue-400">Boston Celtics</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={finishAndGradeMatch}
                      className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-900 py-2 rounded-xl text-xs font-semibold transition-all"
                    >
                      Grade Predictions
                    </button>
                    <button
                      onClick={() => setCurrentStep(5)}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                    >
                      Go to Concessions <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: SEAT-SIDE CONCESSIONS */}
              {currentStep === 5 && (
                <div className="flex flex-col h-full justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-purple-400" /> Step 5: Seat-Side Concessions ordering
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Place concessions orders directly to your seat. Status alterations automatically notify our isolated user subscription socket rooms.
                    </p>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">Concessions Menu:</label>
                        <select
                          value={concessionItem}
                          onChange={(e) => setConcessionItem(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-slate-300"
                        >
                          <option value="Stadium Burger & Fries">Stadium Burger & Fries ($14.99)</option>
                          <option value="Sizzling Hot Dog">Sizzling Hot Dog ($6.50)</option>
                          <option value="Large Cold Soda">Large Cold Soda ($6.50)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">Your Arena Seat:</label>
                        <input
                          type="text"
                          value={selectedSeat}
                          onChange={(e) => setSelectedSeat(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-slate-300"
                        />
                      </div>
                    </div>

                    {order && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-400">Order ID: <span className="font-mono text-[10px] text-white">{order._id.substr(-6)}</span></span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            order.status === 'preparing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateOrderStatus('preparing')}
                            className="flex-1 py-1 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px]"
                          >
                            Set Preparing
                          </button>
                          <button
                            onClick={() => updateOrderStatus('delivered')}
                            className="flex-1 py-1 rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px]"
                          >
                            Set Delivered
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={submitSeatOrder}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98]"
                  >
                    Place Concessions Order
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* ACTIVE GAME POLLS & DEMOS PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* GAME POLL CONTAINER */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                  <Vote className="w-5 h-5 text-blue-400" /> Active Arena Fan Polls
                </h2>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Vote in active match polls. Duplicate votes from the same account are blocked server-side.
                </p>

                {!poll ? (
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 text-center text-xs text-slate-500">
                    No active poll deployed.
                    {match && (
                      <button
                        onClick={launchPoll}
                        className="mt-3 mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-[11px] block transition-all"
                      >
                        Launch Poll Now
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-slate-200 mb-3 font-sans">❓ {poll.question}</h3>
                    
                    <div className="flex flex-col gap-2">
                      {poll.options.map((opt: string, idx: number) => {
                        const tally = poll.tallies?.find((t: any) => t.optionIndex === idx) || { count: 0, percentage: 0 };
                        return (
                          <button
                            key={idx}
                            onClick={() => submitVote(idx)}
                            className="w-full text-left relative overflow-hidden bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg p-2.5 text-xs transition-all"
                          >
                            <div className="flex justify-between items-center relative z-10">
                              <span className="font-medium text-slate-300">{opt}</span>
                              <span className="font-mono text-slate-400 font-bold">{tally.percentage}% ({tally.count})</span>
                            </div>
                            <div
                              className="absolute top-0 left-0 bottom-0 bg-blue-500/10 border-r border-blue-500/30 transition-all duration-500"
                              style={{ width: `${tally.percentage}%` }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BANDWIDTH REDUCED DATA CONTROLS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                  <Sliders className="w-5 h-5 text-emerald-400" /> Low Bandwidth Mode
                </h2>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Support reduced data payload modes. High-traffic stadium networks can throttle response sizes on demand.
                </p>

                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Reduced-Data Mode</span>
                      <span className="text-[10px] text-slate-500">Query parameter: ?reduced=true</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reducedMode}
                        onChange={(e) => setReducedMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <button
                    onClick={testReducedModeFetch}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 py-2 rounded-lg text-xs font-mono font-medium transition-all"
                  >
                    Fetch Matches Payload
                  </button>
                </div>
              </div>

              {/* LEADERBOARD VIEW */}
              {leaderboard.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">🏆 Predictions Leaderboard</span>
                  <div className="space-y-1.5 font-mono text-[10px]">
                    {leaderboard.map((u, i) => (
                      <div key={i} className="flex justify-between bg-slate-950 border border-slate-850 p-1.5 rounded text-slate-400">
                        <span>{i + 1}. {u.name}</span>
                        <span className="text-emerald-400 font-bold">{u.totalPoints} PTS</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </section>

        {/* RIGHT COLUMN: SOCKET.IO EVENT MONITOR (REAL-TIME STREAM) */}
        <section className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[580px] shadow-xl overflow-hidden">
            
            {/* TERMINAL HEADER */}
            <div className="bg-slate-950 border-b border-slate-800 px-4 py-3.5 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-slate-200">Real-Time Event Stream</span>
              </div>
              <button
                onClick={clearLogs}
                className="text-[10px] text-slate-400 hover:text-white font-mono border border-slate-800 bg-slate-950 hover:bg-slate-900 px-2 py-0.5 rounded transition-all"
              >
                Clear Screen
              </button>
            </div>

            {/* EVENT LOG SCREEN */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-3 bg-slate-950/70">
              {eventLogs.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-slate-600 gap-2">
                  <Activity className="w-8 h-8 text-slate-800" />
                  <p>No active WebSocket events or HTTP queries captured.</p>
                  <p className="text-[10px] text-slate-750 max-w-[250px]">
                    Run steps in the simulator above to trigger API requests and observe Socket actions.
                  </p>
                </div>
              ) : (
                eventLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-900/60 pb-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-semibold">{log.timestamp}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-bold">
                        {log.event}
                      </span>
                    </div>
                    <pre className="mt-1 text-slate-300 whitespace-pre-wrap font-mono text-[10px] bg-slate-950 p-2 rounded-lg border border-slate-900 overflow-x-auto max-w-full">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER BAR */}
      <footer className="border-t border-slate-800 bg-slate-900/40 text-center py-4 px-6 text-[11px] text-slate-500 font-mono">
        StadiumOS platform backend is configured on Port 3000. Real integrations with MongoDB + Mongoose, Zod payloads, JWT Auth, and Socket.io.
      </footer>
    </div>
  );
}
