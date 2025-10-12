import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Game } from '@/models/Game';
import { Item } from '@/models/Item';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { items, title } = body;

    // Validate exactly 24 items
    if (!items || !Array.isArray(items) || items.length !== 24) {
      return NextResponse.json(
        { error: 'Exactly 24 question-answer pairs are required' },
        { status: 400 }
      );
    }

    // Validate item structure
    for (const item of items) {
      if (!item.question || !item.answer || typeof item.question !== 'string' || typeof item.answer !== 'string') {
        return NextResponse.json(
          { error: 'Each item must have both question and answer as strings' },
          { status: 400 }
        );
      }
    }

    // Generate unique game code (6 characters)
    let gameCode: string;
    let isUnique = false;
    do {
      gameCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      const existingGame = await Game.findOne({ code: gameCode });
      isUnique = !existingGame;
    } while (!isUnique);

    // Generate host secret
    const hostSecret = uuidv4();

    // Create game
    const game = new Game({
      code: gameCode,
      hostSecret,
      title: title || 'Song Bingo Game',
    });

    await game.save();

    // Create items
    const itemDocs = items.map((item: { question: string; answer: string }, index: number) => ({
      gameId: game._id.toString(),
      question: item.question.trim(),
      answer: item.answer.trim(),
      order: index + 1,
    }));

    await Item.insertMany(itemDocs);

    return NextResponse.json({
      success: true,
      data: {
        gameCode: gameCode,
        hostSecret,
        gameId: game._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}