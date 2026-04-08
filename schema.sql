-- Schema Supabase Mafia Online (v2)

-- 0. Table Users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  pseudo TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hashed TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  role_history JSONB DEFAULT '[]'::jsonb,
  game_stats JSONB DEFAULT '{"games_played": 0, "games_won": 0}'::jsonb,
  reset_password_token TEXT,
  reset_password_expires TIMESTAMP WITH TIME ZONE
);

-- 1. Table Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT, -- custom game name
  is_public BOOLEAN DEFAULT false, -- true for visible in lobby browser
  max_players INTEGER DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'lobby', -- lobby | roles | night_mafia | night_doctor | night_detective | day_discussion | day_vote | game_over
  host_id TEXT,
  phase_number INTEGER NOT NULL DEFAULT 0, -- increments each full night+day cycle
  winner TEXT, -- 'mafia' | 'village' | NULL
  revote_candidates JSONB DEFAULT NULL, -- array of player UUIDs eligible during a revote
  revote_round INTEGER NOT NULL DEFAULT 0  -- increments each tie within the same day_vote phase
);

-- 2. Table Players
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT, -- mafia | doctor | detective | villager
  is_alive BOOLEAN DEFAULT true,
  is_protected BOOLEAN DEFAULT false,
  is_ready BOOLEAN DEFAULT false -- used in 'roles' phase acknowledgement
);

-- 3. Table Actions (night actions + day votes)
CREATE TABLE IF NOT EXISTS actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- kill | save | check | vote
  actor_id UUID REFERENCES players(id) ON DELETE CASCADE,
  target_id UUID REFERENCES players(id) ON DELETE CASCADE,
  revote_round INTEGER NOT NULL DEFAULT 0 -- matches rooms.revote_round to scope votes per revote round
);

-- 4. Table Game Events (broadcast announcements to all players)
CREATE TABLE IF NOT EXISTS game_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- night_result | day_result | detective_result | game_over
  payload JSONB NOT NULL DEFAULT '{}'  -- flexible data: { eliminated, saved, winner, executedRole, detectiveResult }
);

-- 5. Table Chat Messages (pour le chat en direct)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_mafia_chat BOOLEAN DEFAULT false
);

-- 6. Table Join Requests (for joining public/private games)
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- The user.id or guest pseudo
  username TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' -- pending | accepted | rejected
);

-- Activation de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE actions;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE join_requests;

-- ==========================================
-- FEATURE: REPLAY & ANTI-CHEAT (RLS)
-- ==========================================

-- 1. Add replay column (run this safely if table exists)
ALTER TABLE players ADD COLUMN IF NOT EXISTS ready_for_replay BOOLEAN DEFAULT false;

-- 2. Anti-Cheat: Enable RLS on players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Policy: Players can read ALL columns of THEIR OWN row
CREATE POLICY "Players can view their own row" ON players
  FOR SELECT USING (user_id = auth.uid()::text);

-- Policy: Allow service role / secure backend full access (default if no policy restricts it, 
-- but explicitly allowing authenticated inserts for now if backend uses auth token, 
-- though Edge Functions usually use Service Role which bypasses RLS)

-- 3. Sanitized View for Public Player Data (No Roles)
CREATE OR REPLACE VIEW public_players AS
  SELECT id, created_at, room_id, user_id, username, avatar_url, is_alive, is_protected, is_ready, ready_for_replay
  FROM players;

GRANT SELECT ON public_players TO authenticated, anon;
-- Also add the view to realtime publication if clients need to subscribe to it directly
-- Note: Supabase Realtime doesn't support views automatically, so usually backend will push events
-- or we use a workaround wrapper.

-- 4. RPC for triggering a replays
CREATE OR REPLACE FUNCTION reset_game_if_ready(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_players INT;
  v_ready_players INT;
BEGIN
  -- Count active players in room
  SELECT COUNT(*) INTO v_total_players FROM players WHERE room_id = p_room_id;
  
  -- Count ready players
  SELECT COUNT(*) INTO v_ready_players FROM players WHERE room_id = p_room_id AND ready_for_replay = true;

  -- If everyone is ready, reset game
  IF v_total_players > 0 AND v_total_players = v_ready_players THEN
    -- Reset room
    UPDATE rooms SET status = 'lobby', phase_number = 0, winner = NULL, revote_round = 0, revote_candidates = NULL WHERE id = p_room_id;
    -- Reset players
    UPDATE players SET role = NULL, is_alive = true, is_protected = false, is_ready = false, ready_for_replay = false WHERE room_id = p_room_id;
    -- Clear actions
    DELETE FROM actions WHERE room_id = p_room_id;
    -- Clear events
    DELETE FROM game_events WHERE room_id = p_room_id;
    
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 5. RPC to get public players
CREATE OR REPLACE FUNCTION get_public_players(p_room_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  room_id UUID,
  user_id TEXT,
  username TEXT,
  avatar_url TEXT,
  is_alive BOOLEAN,
  is_protected BOOLEAN,
  is_ready BOOLEAN,
  ready_for_replay BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, created_at, room_id, user_id, username, avatar_url, is_alive, is_protected, is_ready, ready_for_replay
  FROM players
  WHERE room_id = p_room_id;
$$;
