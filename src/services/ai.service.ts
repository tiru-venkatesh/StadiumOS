import { GoogleGenAI, Type } from '@google/genai';
import { Match } from '../models/Match.ts';
import { Player } from '../models/Player.ts';
import { AppError } from '../middleware/errorHandler.ts';

// Shared variable for lazy initialization of the Gemini client
let aiClient: GoogleGenAI | null = null;

/**
 * Lazy helper to retrieve the GoogleGenAI instance.
 * Throws a clear, informative error if GEMINI_API_KEY is not configured.
 */
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new AppError(
        'Gemini API key is not configured. Please add your key in Settings > Secrets.',
        400
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface IAiMatchAnalysis {
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

export class AiService {
  /**
   * Generates a structured tactical and promotional analysis for a given match.
   */
  static async generateMatchAnalysis(matchId: string): Promise<IAiMatchAnalysis> {
    const client = getAiClient();

    // Fetch the match and populate participating teams
    const match = await Match.findById(matchId).populate(['teamA', 'teamB', 'tournamentId']);
    if (!match) {
      throw new AppError('Match not found', 404);
    }

    const teamA = match.teamA as any;
    const teamB = match.teamB as any;
    const tournament = match.tournamentId as any;

    if (!teamA || !teamB) {
      throw new AppError('Teams for this match could not be resolved', 400);
    }

    // Fetch players for both teams
    const [playersA, playersB] = await Promise.all([
      Player.find({ teamId: teamA._id }).lean(),
      Player.find({ teamId: teamB._id }).lean(),
    ]);

    const rosterA = playersA.map(p => `${p.name} (#${p.jerseyNumber})`).join(', ') || 'No roster submitted';
    const rosterB = playersB.map(p => `${p.name} (#${p.jerseyNumber})`).join(', ') || 'No roster submitted';

    const prompt = `
      You are a world-class smart stadium sports analyst, commentator, and tactical specialist.
      Analyze the upcoming match in the "${tournament?.name || 'Tournament'}" at the venue "${match.venue}".
      
      Match Details:
      - Team A: ${teamA.name}
      - Team A Roster: ${rosterA}
      - Team B: ${teamB.name}
      - Team B Roster: ${rosterB}
      - Match Status: ${match.status}
      
      Provide a highly engaging sports commentary, realistic winning probabilities (sum of percentages must equal 100), key tactical insights, realistic projected final score, players to watch, and custom high-energy crowd chants for both teams to maximize fan engagement.
    `;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You generate high-energy, deeply knowledgeable sports analytics and stadium operations content. Always output strictly compliant JSON matching the provided schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pregameCommentary: {
                type: Type.STRING,
                description: 'A brief, thrilling 2-3 sentence overview or sports radio style introduction for the match.'
              },
              keyTacticalInsights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3 bullet points analyzing strategies, roster matches, or physical venue advantages.'
              },
              winProbability: {
                type: Type.OBJECT,
                properties: {
                  teamA: { type: Type.INTEGER, description: 'Percentage win chance for Team A (e.g. 55)' },
                  teamB: { type: Type.INTEGER, description: 'Percentage win chance for Team B (e.g. 45)' }
                },
                required: ['teamA', 'teamB']
              },
              projectedScore: {
                type: Type.OBJECT,
                properties: {
                  teamA: { type: Type.INTEGER, description: 'Predicted score for Team A' },
                  teamB: { type: Type.INTEGER, description: 'Predicted score for Team B' }
                },
                required: ['teamA', 'teamB']
              },
              teamAChant: {
                type: Type.STRING,
                description: 'A creative, rhythmic 2-line stadium chant tailored specifically for Team A fans to yell.'
              },
              teamBChant: {
                type: Type.STRING,
                description: 'A creative, rhythmic 2-line stadium chant tailored specifically for Team B fans to yell.'
              },
              playersToWatch: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '1-2 players from the rosters who will be critical in determining the match outcome.'
              }
            },
            required: [
              'pregameCommentary',
              'keyTacticalInsights',
              'winProbability',
              'projectedScore',
              'teamAChant',
              'teamBChant',
              'playersToWatch'
            ]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new AppError('Gemini returned an empty response.', 500);
      }

      const parsed: IAiMatchAnalysis = JSON.parse(text.trim());
      return parsed;
    } catch (error: any) {
      console.error('❌ Gemini analysis failed:', error);
      throw new AppError(
        error.message || 'Failed to generate AI Analysis. Please verify your Gemini API Key.',
        500
      );
    }
  }
}
