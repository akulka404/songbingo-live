'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) return;

    setIsJoining(true);
    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameCode: gameCode.trim().toUpperCase(),
          playerName: playerName.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('playerToken', data.data.token);
        localStorage.setItem('playerId', data.data.playerId);
        router.push(`/play/${data.data.gameCode}?playerId=${data.data.playerId}`);
      } else {
        alert(data.error || 'Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      alert('Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎵 SongBingo.live</h1>
          <p className="text-gray-600">Join a live music bingo game!</p>
        </div>
        <div className="space-y-6">
          <div>
            <label htmlFor="gameCode" className="block text-sm font-medium text-gray-700 mb-2">
              Game Code
            </label>
            <input
              id="gameCode"
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-mono tracking-wider uppercase"
            />
          </div>
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleJoinGame}
            disabled={!gameCode.trim() || !playerName.trim() || isJoining}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-3">Want to host a game?</p>
          <Link
            href="/host"
            className="inline-block bg-gray-800 text-white py-2 px-6 rounded-lg font-medium transition-colors hover:bg-gray-900"
          >
            Create Game
          </Link>
        </div>
      </div>
    </div>
  );
}
