import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Game } from '@/models/Game';
import { Call } from '@/models/Call';
import { Item } from '@/models/Item';
import { Player } from '@/models/Player';
import { Placement } from '@/models/Placement';
import { pusherServer } from '@/lib/pusher';
import { getEmptyCells, pickRandomCell } from '@/lib/randomCell';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { gameCode, hostSecret, itemId } = body;

    if (!gameCode || !hostSecret || !itemId) {
      return NextResponse.json(
        { error: 'Game code, host secret, and item ID are required' },
        { status: 400 }
      );
    }

    // Verify game and host
    const game = await Game.findOne({ 
      code: gameCode.toUpperCase(),
      hostSecret 
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Invalid game code or host secret' },
        { status: 401 }
      );
    }

    // Verify item exists and belongs to this game
    const item = await Item.findOne({ 
      _id: itemId,
      gameId: game._id.toString() 
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if item already called
    const existingCall = await Call.findOne({ 
      gameId: game._id.toString(),
      itemId 
    });

    if (existingCall) {
      return NextResponse.json(
        { error: 'Item already called' },
        { status: 400 }
      );
    }

    // Get next call order
    const lastCall = await Call.findOne({ gameId: game._id.toString() })
      .sort({ order: -1 });
    const nextOrder = (lastCall?.order || 0) + 1;

    // Create call
    const call = new Call({
      gameId: game._id.toString(),
      itemId,
      order: nextOrder,
    });

    await call.save();

    // Get all players for this game
    const players = await Player.find({ gameId: game._id.toString() });

    // Assign random placements for each player
    const placements = [];
    for (const player of players) {
      // Get existing placements for this player to find empty cells
      const existingPlacements = await Placement.find({ 
        playerId: player._id.toString() 
      });

      const occupiedCells = existingPlacements.map(p => ({ row: p.row, col: p.col }));
      const emptyCells = getEmptyCells(occupiedCells);
      const randomCell = pickRandomCell(emptyCells);

      if (randomCell) {
        const placement = new Placement({
          playerId: player._id.toString(),
          gameId: game._id.toString(),
          itemId,
          row: randomCell.row,
          col: randomCell.col,
        });

        await placement.save();

        placements.push({
          playerId: player._id.toString(),
          row: randomCell.row,
          col: randomCell.col,
        });
      }
    }

    // Broadcast to all connected clients
    await pusherServer.trigger(`game-${gameCode.toUpperCase()}`, 'song_called', {
      itemId,
      answer: item.answer,
      callOrder: nextOrder,
      placements,
    });

    return NextResponse.json({
      success: true,
      data: {
        callOrder: nextOrder,
        item: {
          id: item._id.toString(),
          question: item.question,
          answer: item.answer,
        },
        placements,
      },
    });
  } catch (error) {
    console.error('Error calling item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}