import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface PlayerToken {
  playerId: string;
  gameCode: string;
}

export function generatePlayerToken(playerId: string, gameCode: string): string {
  return jwt.sign({ playerId, gameCode }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyPlayerToken(token: string): PlayerToken {
  return jwt.verify(token, JWT_SECRET) as PlayerToken;
}