'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Item {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface CallHistory {
  order: number;
  itemId: string;
  question: string;
  answer: string;
  calledAt: string;
}

export default function HostDashboard() {
  const params = useParams();
  const gameCode = params.code as string;
  
  const [items, setItems] = useState<Item[]>([]);
  const [calls, setCalls] = useState<CallHistory[]>([]);
  const [gameTitle, setGameTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hostSecret, setHostSecret] = useState('');

  useEffect(() => {
    const secret = localStorage.getItem('hostSecret');
    if (!secret) {
      alert('Host secret not found. Please create a new game.');
      window.location.href = '/host';
      return;
    }
    setHostSecret(secret);
    
    const loadData = async () => {
      await loadGameData();
    };
    loadData();
  }, [gameCode]);

  const loadGameData = async () => {
    try {
      const response = await fetch(`/api/hydrate?code=${gameCode}`);
      const data = await response.json();
      
      if (data.success) {
        setItems(data.data.items);
        setCalls(data.data.calls);
        setGameTitle(data.data.game.title);
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

  const callItem = async (itemId: string) => {
    if (!hostSecret) return;

    try {
      const response = await fetch('/api/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameCode,
          hostSecret,
          itemId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Add to call history
        const item = items.find(i => i.id === itemId);
        if (item) {
          const newCall: CallHistory = {
            order: data.data.callOrder,
            itemId,
            question: item.question,
            answer: item.answer,
            calledAt: new Date().toISOString(),
          };
          setCalls(prev => [...prev, newCall]);
        }
      } else {
        alert(data.error || 'Failed to call item');
      }
    } catch (error) {
      console.error('Error calling item:', error);
      alert('Failed to call item');
    }
  };

  const undoLastCall = async () => {
    if (!hostSecret || calls.length === 0) return;

    try {
      const response = await fetch('/api/undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameCode,
          hostSecret,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove last call from history
        setCalls(prev => prev.slice(0, -1));
      } else {
        alert(data.error || 'Failed to undo call');
      }
    } catch (error) {
      console.error('Error undoing call:', error);
      alert('Failed to undo call');
    }
  };

  const calledItemIds = new Set(calls.map(call => call.itemId));
  const availableItems = items.filter(item => !calledItemIds.has(item.id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎵 {gameTitle}</h1>
            <div className="text-lg font-mono bg-gray-100 inline-block px-4 py-2 rounded-lg text-black">
              Game Code: <span className="font-bold text-purple-600">{gameCode}</span>
            </div>
            <p className="text-gray-600 mt-2">Share this code with players to join!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Available Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Available Questions ({availableItems.length})
                </h2>
                <button
                  onClick={undoLastCall}
                  disabled={calls.length === 0}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Undo Last Call
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 mb-1">
                          Q{item.order}: {item.question}
                        </div>
                        <div className="text-sm text-gray-600">
                          Answer: {item.answer}
                        </div>
                      </div>
                      <button
                        onClick={() => callItem(item.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        Mark Done
                      </button>
                    </div>
                  </div>
                ))}

                {availableItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    All questions have been called!
                  </div>
                )}
              </div>
            </div>

            {/* Call History */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Call History ({calls.length})
              </h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {calls.slice().reverse().map((call) => (
                  <div key={call.order} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-purple-600">
                        Call #{call.order}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(call.calledAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="font-medium text-gray-800 mb-1">
                      {call.question}
                    </div>
                    <div className="text-sm text-gray-600">
                      Answer: {call.answer}
                    </div>
                  </div>
                ))}

                {calls.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No calls made yet. Start by marking a question as done!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}