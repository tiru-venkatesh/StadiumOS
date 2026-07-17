export enum UserRole {
  ORGANIZER = 'organizer',
  TEAM = 'team',
  FAN = 'fan',
}

export enum MatchStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  COMPLETED = 'completed',
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export enum SocketEvent {
  CONNECTION = 'connection',
  DISCONNECT = 'disconnect',
  MATCH_JOIN = 'match:join',
  MATCH_JOINED = 'match:joined',
  MATCH_LEAVE = 'match:leave',
  MATCH_LEFT = 'match:left',
  MATCH_SCORE_UPDATE = 'match:score_update',
  ORDER_STATUS_UPDATE = 'order:status_update',
  POLL_LAUNCHED = 'poll:launched',
  POLL_VOTE_UPDATE = 'poll:vote_update',
}
