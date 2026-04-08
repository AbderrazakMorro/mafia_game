-- Unified Policy File for Mafia Game
-- Since the application uses a custom authentication system (not Supabase Auth directly)
-- and ALL mutations are done securely via Next.js backend API routes (using service role),
-- the frontend ONLY requires SELECT access to receive data and Realtime updates.
-- Insert, Update, and Delete operations remain blocked by default for the 'anon' role (which means they can only be done backend-side).

-- 1. USERS table
CREATE POLICY "Anyone can view users" 
ON users FOR SELECT 
USING (true);

-- 2. ROOMS table
CREATE POLICY "Anyone can view rooms" 
ON rooms FOR SELECT 
USING (true);

-- 3. PLAYERS table
CREATE POLICY "Anyone can view players" 
ON players FOR SELECT 
USING (true);

-- 4. JOIN_REQUESTS table
CREATE POLICY "Anyone can view join requests" 
ON join_requests FOR SELECT 
USING (true);

-- 5. CHAT_MESSAGES table
CREATE POLICY "Anyone can view chat messages" 
ON chat_messages FOR SELECT 
USING (true);

-- 6. GAME_EVENTS table
CREATE POLICY "Anyone can view game events" 
ON game_events FOR SELECT 
USING (true);

-- 7. ACTIONS table
CREATE POLICY "Anyone can view actions" 
ON actions FOR SELECT 
USING (true);
