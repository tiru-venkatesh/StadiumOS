import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { startServer } from '../server.ts';
import { UserRole } from '../src/constants/index.ts';

let mongoServer: MongoMemoryServer;
let app: any;
let httpServer: any;
let io: any;

let organizerToken: string;
let fanToken: string;
let createdTournamentId: string;
let createdTeamAId: string;
let createdTeamBId: string;
let createdMatchId: string;
let createdPollId: string;

beforeAll(async () => {
  // Set to test environment
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0';

  // Spin up MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  // Connect Mongoose to memory server
  await mongoose.connect(uri);

  // Start the server
  const serverInstance = await startServer();
  app = serverInstance.app;
  httpServer = serverInstance.httpServer;
  io = serverInstance.io;
}, 30000);

afterAll(async () => {
  // Close socket server and HTTP server to prevent open handles
  if (io) io.close();
  if (httpServer) httpServer.close();
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe(' StadiumOS Backend Test Suite', () => {
  
  // -------------------------------------------------------------
  // 1. AUTHENTICATION FLOW TESTS
  // -------------------------------------------------------------
  describe('Authentication Flow', () => {
    it('should successfully register a new Organizer user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Chief Organizer',
          email: 'organizer@stadiumos.com',
          password: 'securePassword123',
          role: UserRole.ORGANIZER,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe(UserRole.ORGANIZER);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should successfully register a new Fan user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'fan@stadiumos.com',
          password: 'fanpassword123',
          role: UserRole.FAN,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe(UserRole.FAN);
    });

    it('should successfully log in and return access tokens', async () => {
      const resOrg = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'organizer@stadiumos.com',
          password: 'securePassword123',
        });

      expect(resOrg.status).toBe(200);
      expect(resOrg.body.data.accessToken).toBeDefined();
      organizerToken = `Bearer ${resOrg.body.data.accessToken}`;

      const resFan = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'fan@stadiumos.com',
          password: 'fanpassword123',
        });

      expect(resFan.status).toBe(200);
      expect(resFan.body.data.accessToken).toBeDefined();
      fanToken = `Bearer ${resFan.body.data.accessToken}`;
    });
  });

  // -------------------------------------------------------------
  // 2. TOURNAMENT CRUD & SECURITY TESTS
  // -------------------------------------------------------------
  describe('Tournament CRUD & Role-Based Access Protection', () => {
    it('should allow Organizers to create a tournament', async () => {
      const res = await request(app)
        .post('/api/v1/tournaments')
        .set('Authorization', organizerToken)
        .send({
          name: 'Summer Champions Cup',
          sport: 'Football',
          venue: 'Wembley Stadium',
          startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          endDate: new Date(Date.now() + 86400000 * 7).toISOString(), // Next week
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Summer Champions Cup');
      createdTournamentId = res.body.data._id;
    });

    it('should REJECT tournament creation by a Fan role (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/tournaments')
        .set('Authorization', fanToken)
        .send({
          name: 'Illegal Tournament',
          sport: 'Football',
          venue: 'Backyard',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should fetch tournament details successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/tournaments/${createdTournamentId}`)
        .set('Authorization', fanToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Summer Champions Cup');
    });
  });

  // -------------------------------------------------------------
  // 3. TEAM CREATION & PLAYER ASSOCIATIONS
  // -------------------------------------------------------------
  describe('Teams and Player Associations', () => {
    it('should register competing Teams under the tournament', async () => {
      const teamARes = await request(app)
        .post('/api/v1/teams')
        .set('Authorization', organizerToken)
        .send({
          name: 'London FC',
          tournamentId: createdTournamentId,
        });

      expect(teamARes.status).toBe(201);
      createdTeamAId = teamARes.body.data._id;

      const teamBRes = await request(app)
        .post('/api/v1/teams')
        .set('Authorization', organizerToken)
        .send({
          name: 'Paris United',
          tournamentId: createdTournamentId,
        });

      expect(teamBRes.status).toBe(201);
      createdTeamBId = teamBRes.body.data._id;
    });

    it('should successfully add a player to a team', async () => {
      const res = await request(app)
        .post(`/api/v1/teams/${createdTeamAId}/players`)
        .set('Authorization', organizerToken)
        .send({
          name: 'Harry Kane',
          jerseyNumber: 9,
          stats: { goals: 0 },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Harry Kane');
    });
  });

  // -------------------------------------------------------------
  // 4. MATCH SCHEDULING & SCORE UPDATE TESTS
  // -------------------------------------------------------------
  describe('Matches & Live Scoring Updates', () => {
    it('should create an upcoming Match', async () => {
      const res = await request(app)
        .post('/api/v1/matches')
        .set('Authorization', organizerToken)
        .send({
          tournamentId: createdTournamentId,
          teamA: createdTeamAId,
          teamB: createdTeamBId,
          venue: 'Wembley Stadium',
          startTime: new Date(Date.now() + 3600000).toISOString(), // In 1 hour
        });

      expect(res.status).toBe(201);
      createdMatchId = res.body.data._id;
    });

    it('should update live match scores', async () => {
      const res = await request(app)
        .patch(`/api/v1/matches/${createdMatchId}/score`)
        .set('Authorization', organizerToken)
        .send({
          score: {
            teamA: 1,
            teamB: 0,
          },
          status: 'live',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score.teamA).toBe(1);
      expect(res.body.data.status).toBe('live');
    });
  });

  // -------------------------------------------------------------
  // 5. POLL CREATION & MULTI-VOTE PROTECTION TESTS
  // -------------------------------------------------------------
  describe('Fan Engagement: Live Polls & Multi-Vote Protection', () => {
    it('should allow Organizers to launch live polls', async () => {
      const res = await request(app)
        .post('/api/v1/polls')
        .set('Authorization', organizerToken)
        .send({
          matchId: createdMatchId,
          question: 'Who will score the next goal?',
          options: ['London FC Player', 'Paris United Player', 'No one'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      createdPollId = res.body.data._id;
    });

    it('should register a Fan vote successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/polls/${createdPollId}/vote`)
        .set('Authorization', fanToken)
        .send({
          optionIndex: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalVotes).toBe(1);
    });

    it('should block double-voting by the same Fan (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/v1/polls/${createdPollId}/vote`)
        .set('Authorization', fanToken)
        .send({
          optionIndex: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already submitted a vote');
    });
  });
});
