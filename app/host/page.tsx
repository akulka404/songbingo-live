'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HostPage() {
  const [items, setItems] = useState<Array<{question: string; answer: string}>>([]);
  const [gameTitle, setGameTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(content);
          if (Array.isArray(jsonData) && jsonData.length === 24) {
            setItems(jsonData);
          } else {
            alert('JSON file must contain exactly 24 question-answer pairs');
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(line => line.trim());
          const parsedItems = lines.slice(1).map(line => {
            const [question, answer] = line.split(',').map(s => s.trim().replace(/"/g, ''));
            return { question, answer };
          });
          
          if (parsedItems.length === 24) {
            setItems(parsedItems);
          } else {
            alert('CSV file must contain exactly 24 rows (plus header)');
          }
        }
      } catch (parseError) {
        alert('Error parsing file');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const addEmptyItem = () => {
    if (items.length < 24) {
      setItems([...items, { question: '', answer: '' }]);
    }
  };

  const updateItem = (index: number, field: 'question' | 'answer', value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const createGame = async () => {
    if (items.length !== 24) {
      alert('You need exactly 24 question-answer pairs');
      return;
    }

    const validItems = items.filter(item => item.question.trim() && item.answer.trim());
    if (validItems.length !== 24) {
      alert('All questions and answers must be filled out');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: validItems,
          title: gameTitle.trim() || 'Song Bingo Game',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('hostSecret', data.data.hostSecret);
        router.push(`/host/${data.data.gameCode}`);
      } else {
        alert(data.error || 'Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎵 Create Song Bingo Game</h1>
            <p className="text-gray-600">Upload 24 question-answer pairs to create your game</p>
          </div>

          <div className="mb-6">
            <label htmlFor="gameTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Game Title (Optional)
            </label>
            <input
              id="gameTitle"
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="Game Title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
            />
          </div>

          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="text-4xl">📁</div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Drop your CSV or JSON file here
                </p>
                <p className="text-sm text-gray-500">
                  Or click to browse files
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
              >
                Choose File
              </label>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Question-Answer Pairs ({items.length}/24)
              </h2>
              <button
                onClick={addEmptyItem}
                disabled={items.length >= 24}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-center p-3 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-500 w-8">{index + 1}.</span>
                  <input
                    type="text"
                    placeholder="Question"
                    value={item.question}
                    onChange={(e) => updateItem(index, 'question', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                  <input
                    type="text"
                    placeholder="Answer"
                    value={item.answer}
                    onChange={(e) => updateItem(index, 'answer', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={createGame}
              disabled={items.length !== 24 || isCreating}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creating Game...' : 'Create Game'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}