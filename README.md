# 🎵 SongBingo.live

A production-ready Next.js 14 web application for hosting live Song Bingo games with real-time updates via Pusher Channels.

## Features

- **5×5 Bingo Grid**: Center cell is always FREE
- **Real-time Updates**: Powered by Pusher Channels (Vercel-compatible)
- **Host Dashboard**: Upload 24 question-answer pairs, mark questions as done, undo calls
- **Player Experience**: Automatic song placement in random cells, local checkmarks
- **Late Join Support**: Players joining mid-game get retroactive placements
- **Production Ready**: Built for Vercel deployment with MongoDB Atlas

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Database**: MongoDB Atlas via Mongoose  
- **Real-time**: Pusher Channels (no custom server needed)
- **Authentication**: JWT tokens for players, UUID host secrets
- **Deployment**: Vercel (serverless functions + static frontend)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd songbingo-live
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/songbingo

# Pusher Configuration  
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=us2

# JWT Secret for player authentication
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Set Up External Services

#### MongoDB Atlas
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user and get the connection string
3. Whitelist your IP address (or use 0.0.0.0/0 for development)

#### Pusher Channels
1. Sign up at [Pusher](https://pusher.com/)
2. Create a new Channels app
3. Copy your app credentials from the dashboard

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Deployment to Vercel

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to connect your GitHub repo
```

### 2. Set Environment Variables

In your Vercel dashboard, go to Settings > Environment Variables and add:

- `MONGODB_URI`
- `PUSHER_APP_ID`
- `PUSHER_KEY` 
- `PUSHER_SECRET`
- `PUSHER_CLUSTER`
- `JWT_SECRET`

### 3. Redeploy

```bash
vercel --prod
```

## Game Flow

### Host Workflow
1. Visit `/host` to create a new game
2. Upload a CSV/JSON file with exactly 24 question-answer pairs
3. Get a 6-digit game code and host dashboard URL
4. Share the game code with players
5. Mark questions as "Done" to trigger song placements
6. Use "Undo" to remove the most recent call

### Player Workflow  
1. Visit the homepage and enter game code + name
2. Automatically join the game and get a 5×5 bingo board
3. Songs appear in random cells when host marks questions as done
4. Tap cells to toggle checkmarks (local only)
5. Late joiners get all previous placements retroactively

### Data Format

CSV format:
```csv
question,answer
"What song contains the lyrics 'Sweet Caroline'?","Sweet Caroline by Neil Diamond"
"Name the artist of 'Bohemian Rhapsody'","Queen"
...24 total rows
```

JSON format:
```json
[
  {"question": "What song contains the lyrics 'Sweet Caroline'?", "answer": "Sweet Caroline by Neil Diamond"},
  {"question": "Name the artist of 'Bohemian Rhapsody'", "answer": "Queen"},
  ...24 total objects
]
```

## API Endpoints

- `POST /api/game` - Create game with 24 items
- `POST /api/join` - Join game as player  
- `POST /api/call` - Mark question as done (host only)
- `POST /api/undo` - Undo last call (host only)
- `GET /api/hydrate` - Get full game state

## Real-time Events

- `song_called` - Broadcasts new song placement to all players
- `call_undone` - Notifies clients that last call was undone

## Database Schema

### Collections
- **games** - Game metadata and host secrets
- **items** - Question-answer pairs for each game  
- **players** - Player names and join timestamps
- **calls** - Chronological log of called questions
- **placements** - Individual cell assignments per player

### Key Indexes
- `calls: {gameId:1, order:1}` - Efficient call ordering
- `placements: {playerId:1, row:1, col:1}` - Unique cell constraint
- `placements: {playerId:1, itemId:1}` - One item per player

## Security Features

- Host authentication via UUID secrets
- Player authentication via JWT tokens  
- Input validation for all API endpoints
- Unique constraints prevent duplicate placements

## Development

### Project Structure
```
app/
├── api/           # API routes
├── host/          # Host creation and dashboard  
├── play/          # Player bingo view
├── page.tsx       # Homepage (join game)
└── layout.tsx     # Root layout

lib/
├── mongodb.ts     # Database connection
├── pusher.ts      # Pusher client/server setup
├── randomCell.ts  # Cell placement algorithm  
└── auth.ts        # JWT utilities

models/
├── Game.ts        # Game schema
├── Item.ts        # Question-answer schema
├── Player.ts      # Player schema  
├── Call.ts        # Call history schema
└── Placement.ts   # Cell placement schema
```

### Key Algorithms

**Random Placement**: For each call, the server computes empty cells (24 minus center minus occupied) for each player, picks one randomly, and persists the placement.

**Late Join**: When a player joins mid-game, the server sequentially assigns placements for all previous calls using the same random algorithm.

**Undo**: Removes the most recent call and all associated placements, then broadcasts the undo event.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
