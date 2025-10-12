import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';
import { Call } from '@/models/Call';
import { Item } from '@/models/Item';
import { Placement } from '@/models/Placement';
import { generatePlayerToken } from '@/lib/auth';
import { getEmptyCells, pickRandomCell } from '@/lib/randomCell';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { gameCode, playerName } = body;

    if (!gameCode || !playerName) {
      return NextResponse.json(
        { error: 'Game code and player name are required' },
        { status: 400 }
      );
    }

    // Find game
    const game = await Game.findOne({ code: gameCode.toUpperCase() });
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Create player
    const player = new Player({
      gameId: game._id.toString(),
      name: playerName.trim(),
    });

    await player.save();

    // Generate player token
    const token = generatePlayerToken(player._id.toString(), gameCode.toUpperCase());

    // Get all previous calls for this game to assign retroactive placements
    const calls = await Call.find({ gameId: game._id.toString() })
      .sort({ order: 1 });

    const items = await Item.find({ gameId: game._id.toString() });
    const itemsMap = new Map(items.map(item => [item._id.toString(), item]));

    // Assign placements for all prior calls (late joiner logic)
    const placements = [];
    const occupiedCells: { row: number; col: number }[] = [];

    for (const call of calls) {
      const emptyCells = getEmptyCells(occupiedCells);
      const randomCell = pickRandomCell(emptyCells);

      if (randomCell) {
        const placement = new Placement({
          playerId: player._id.toString(),
          gameId: game._id.toString(),
          itemId: call.itemId,
          row: randomCell.row,
          col: randomCell.col,
        });

        await placement.save();
        occupiedCells.push(randomCell);

        const item = itemsMap.get(call.itemId);
        if (item) {
          placements.push({
            itemId: call.itemId,
            answer: item.answer,
            row: randomCell.row,
            col: randomCell.col,
          });
        }
      }
    }

    // Return hydration payload
    return NextResponse.json({
      success: true,
      data: {
        playerId: player._id.toString(),
        token,
        gameCode: gameCode.toUpperCase(),
        gameTitle: game.title,
        placements,
        playerName: player.name,
      },
    });
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}