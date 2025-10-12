import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Game } from '@/models/Game';
import { Call } from '@/models/Call';
import { Placement } from '@/models/Placement';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { gameCode, hostSecret } = body;

    if (!gameCode || !hostSecret) {
      return NextResponse.json(
        { error: 'Game code and host secret are required' },
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

    // Find the most recent call
    const lastCall = await Call.findOne({ gameId: game._id.toString() })
      .sort({ order: -1 });

    if (!lastCall) {
      return NextResponse.json(
        { error: 'No calls to undo' },
        { status: 400 }
      );
    }

    // Remove placements for the last call
    await Placement.deleteMany({ 
      gameId: game._id.toString(),
      itemId: lastCall.itemId 
    });

    // Remove the call
    await Call.deleteOne({ _id: lastCall._id });

    // Broadcast undo to all connected clients
    await pusherServer.trigger(`game-${gameCode.toUpperCase()}`, 'call_undone', {
      callOrder: lastCall.order,
    });

    return NextResponse.json({
      success: true,
      data: {
        undoneCallOrder: lastCall.order,
      },
    });
  } catch (error) {
    console.error('Error undoing call:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}