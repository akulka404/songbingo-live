import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Game } from '@/models/Game';
import { Item } from '@/models/Item';
import { Call } from '@/models/Call';
import { Player } from '@/models/Player';
import { Placement } from '@/models/Placement';
import { verifyPlayerToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const gameCode = searchParams.get('code');
    const playerId = searchParams.get('playerId');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!gameCode) {
      return NextResponse.json(
        { error: 'Game code is required' },
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

    let playerData: { id: string; name: string } | null = null;
    let placements: Array<{ itemId: string; answer: string; row: number; col: number }> = [];

    // If player ID and token provided, verify and get player-specific data
    if (playerId && token) {
      try {
        const tokenData = verifyPlayerToken(token);
        if (tokenData.playerId !== playerId || tokenData.gameCode !== gameCode.toUpperCase()) {
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          );
        }

        const player = await Player.findById(playerId);
        if (!player) {
          return NextResponse.json(
            { error: 'Player not found' },
            { status: 404 }
          );
        }

        playerData = {
          id: player._id.toString(),
          name: player.name,
        };

        // Get player's placements
        const playerPlacements = await Placement.find({ 
          playerId: player._id.toString() 
        });

        const items = await Item.find({ gameId: game._id.toString() });
        const itemsMap = new Map(items.map(item => [item._id.toString(), item]));

        placements = playerPlacements.map(placement => {
          const item = itemsMap.get(placement.itemId);
          return {
            itemId: placement.itemId,
            answer: item?.answer || '',
            row: placement.row,
            col: placement.col,
          };
        });
      } catch (tokenError) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }

    // Get game items
    const items = await Item.find({ gameId: game._id.toString() })
      .sort({ order: 1 });

    // Get all calls
    const calls = await Call.find({ gameId: game._id.toString() })
      .sort({ order: 1 });

    const itemsMap = new Map(items.map(item => [item._id.toString(), item]));
    const callHistory = calls.map(call => {
      const item = itemsMap.get(call.itemId);
      return {
        order: call.order,
        itemId: call.itemId,
        question: item?.question || '',
        answer: item?.answer || '',
        calledAt: call.calledAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        game: {
          id: game._id.toString(),
          code: game.code,
          title: game.title,
        },
        items: items.map(item => ({
          id: item._id.toString(),
          question: item.question,
          answer: item.answer,
          order: item.order,
        })),
        calls: callHistory,
        player: playerData,
        placements,
      },
    });
  } catch (error) {
    console.error('Error hydrating game state:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}