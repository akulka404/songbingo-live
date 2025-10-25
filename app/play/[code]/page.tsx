'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createPusherClient } from '@/lib/pusher';
import type PusherClient from 'pusher-js';

interface Placement {
  itemId: string;
  answer: string;
  row: number;
  col: number;
}

interface BingoCell {
  content: string;
  isChecked: boolean;
  isFree: boolean;
}

export default function PlayerView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameCode = params.code as string;
  const playerId = searchParams.get('playerId');
  
  const [board, setBoard] = useState<BingoCell[][]>(() => {
    // Initialize 5x5 board with center cell as FREE
    const initialBoard: BingoCell[][] = [];
    for (let row = 0; row < 5; row++) {
      initialBoard[row] = [];
      for (let col = 0; col < 5; col++) {
        initialBoard[row][col] = {
          content: row === 2 && col === 2 ? '' : '',
          isChecked: row === 2 && col === 2, // FREE cell is pre-checked
          isFree: row === 2 && col === 2,
        };
      }
    }
    return initialBoard;
  });
  
  const [gameTitle, setGameTitle] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pusherClient, setPusherClient] = useState<PusherClient | null>(null);

  useEffect(() => {
    if (!playerId) {
      alert('Player ID not found');
      window.location.href = '/';
      return;
    }

    const token = localStorage.getItem('playerToken');
    if (!token) {
      alert('Player token not found');
      window.location.href = '/';
      return;
    }

    const loadData = async () => {
      await loadGameData(token);
      setupPusher();
    };
    
    loadData();

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe(`game-${gameCode}`);
        pusherClient.disconnect();
      }
    };
  }, [gameCode, playerId]);

  const loadGameData = async (token: string) => {
    try {
      const response = await fetch(`/api/hydrate?code=${gameCode}&playerId=${playerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGameTitle(data.data.game.title);
        setPlayerName(data.data.player.name);
        
        // Apply existing placements to board
        const newBoard = [...board];
        data.data.placements.forEach((placement: Placement) => {
          newBoard[placement.row][placement.col] = {
            content: placement.answer,
            isChecked: false,
            isFree: false,
          };
        });
        setBoard(newBoard);
      } else {
        alert('Failed to load game data');
      }
    } catch (error) {
      console.error('Error loading game data:', error);
      alert('Failed to load game data');
    } finally {
      setIsLoading(false);
    }
  };

  const setupPusher = () => {
    const client = createPusherClient();
    setPusherClient(client);

    const channel = client.subscribe(`game-${gameCode}`);
    
    channel.bind('song_called', (data: { itemId: string; answer: string; placements: Array<{ playerId: string; row: number; col: number }> }) => {
      // Find placement for this player
      const playerPlacement = data.placements.find((p) => p.playerId === playerId);
      if (playerPlacement) {
        setBoard(prevBoard => {
          const newBoard = [...prevBoard];
          newBoard[playerPlacement.row][playerPlacement.col] = {
            content: data.answer,
            isChecked: false,
            isFree: false,
          };
          return newBoard;
        });
      }
    });

    channel.bind('call_undone', (_data: { callOrder: number }) => {
      // Remove the most recent non-free placement
      setBoard(prevBoard => {
        const newBoard = prevBoard.map(row => [...row]);
        
        // Find the most recent placement to remove (this is simplified)
        // In a real implementation, you'd track placement order
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            if (newBoard[row][col].content && !newBoard[row][col].isFree) {
              // This is a simple approach - remove the first found non-free cell
              // You might want to track placement order for more accuracy
              newBoard[row][col] = {
                content: '',
                isChecked: false,
                isFree: false,
              };
              return newBoard;
            }
          }
        }
        return newBoard;
      });
    });
  };

  const toggleCell = (row: number, col: number) => {
    console.log('Cell clicked:', row, col, 'content:', board[row][col].content, 'isFree:', board[row][col].isFree);
    // Only allow clicking on cells that have song content (not free cell and not empty)
    if (board[row][col].content.trim() !== '' && !board[row][col].isFree) {
      console.log('Toggling cell');
      setBoard(prevBoard => {
        const newBoard = prevBoard.map(boardRow => boardRow.map(cell => ({ ...cell })));
        const currentState = newBoard[row][col].isChecked;
        newBoard[row][col].isChecked = !currentState;
        console.log('Setting isChecked from', currentState, 'to', !currentState);
        return newBoard;
      });
    } else {
      console.log('Cell not toggleable - content:', board[row][col].content, 'isFree:', board[row][col].isFree);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black mb-2">🎵 Song Bingo - {gameTitle}</h1>
            <div className="text-sm text-black mb-2">
              Welcome, <span className="font-medium">{playerName}</span>!
            </div>
            <div className="text-sm font-mono bg-gray-100 inline-block px-3 py-1 rounded text-black">
              Game Code: {gameCode}
            </div>
          </div>

          {/* Bingo Board */}
          <div className="grid grid-cols-5 gap-2 max-w-md mx-auto mb-8">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isHighlighted = cell.isChecked;
                console.log(`Rendering cell [${rowIndex},${colIndex}]: content="${cell.content}", isChecked=${cell.isChecked}, isFree=${cell.isFree}`);
                
                return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => toggleCell(rowIndex, colIndex)}
                  disabled={false}
                  className={`
                    aspect-square rounded-lg text-xs font-medium transition-all duration-300
                    ${cell.isFree 
                      ? 'bg-yellow-400 border-2 border-yellow-500 text-yellow-900' 
                      : cell.content.trim() !== ''
                        ? isHighlighted
                          ? 'bg-white text-gray-800 border-4 border-amber-500 shadow-lg'
                          : 'bg-white text-gray-800 border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50'
                        : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                    }
                    ${cell.content.trim() !== '' && !cell.isFree ? 'hover:scale-105 cursor-pointer' : ''}
                  `}
                  style={{
                    borderWidth: isHighlighted && cell.content.trim() !== '' && !cell.isFree ? '4px' : '2px',
                    borderColor: isHighlighted && cell.content.trim() !== '' && !cell.isFree ? '#f59e0b' : undefined
                  }}
                >
                  <div className="p-1 h-full flex items-center justify-center text-center leading-tight">
                    {cell.content}
                  </div>
                </button>
                );
              })
            )}
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Songs will appear automatically when the host calls them.
            </p>
            <p className="text-sm text-gray-600">
              Tap songs to highlight the tile!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}