
-- Create companions table
CREATE TABLE public.companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL DEFAULT 'female',
  tag text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'Delhi',
  languages text NOT NULL DEFAULT 'Hindi / English',
  rate_per_min integer NOT NULL DEFAULT 3,
  image_key text,
  image_url text,
  bio text NOT NULL DEFAULT '',
  is_real_user boolean NOT NULL DEFAULT false,
  owner_user_id uuid,
  status text NOT NULL DEFAULT 'active',
  banned_at timestamptz,
  upi_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active companions" ON public.companions
  FOR SELECT TO public USING (status = 'active');

CREATE POLICY "Admins full access companions" ON public.companions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can read own companion" ON public.companions
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());

CREATE POLICY "Owners can update own companion" ON public.companions
  FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- Create companion_applications table
CREATE TABLE public.companion_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL DEFAULT 'female',
  city text NOT NULL DEFAULT 'Delhi',
  languages text NOT NULL DEFAULT 'Hindi / English',
  tag text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  image_url text,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_reference text,
  payment_amount numeric NOT NULL DEFAULT 199,
  admin_status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companion_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own applications" ON public.companion_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own applications" ON public.companion_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON public.companion_applications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access applications" ON public.companion_applications
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed existing AI female companions
INSERT INTO public.companions (slug, name, age, gender, tag, city, languages, rate_per_min, image_key, bio) VALUES
('aadhya-f', 'Aadhya', 19, 'female', 'Cheerful & Witty', 'Delhi', 'Hindi / English', 3, 'companion-01', 'Heyy! I''m literally always laughing at something 😂 come vibe with me'),
('aanya-f', 'Aanya', 20, 'female', 'Confident & Bold', 'Gurugram', 'English / Hindi', 4, 'companion-02', 'Bold opinions, soft heart. Try keeping up with me 😏'),
('aarohi-f', 'Aarohi', 21, 'female', 'College Buddy', 'Noida', 'Hindi / Hinglish', 3, 'companion-03', 'College life + late night convos = my whole personality 🌙'),
('aditi-f', 'Aditi', 18, 'female', 'Creative Soul', 'Delhi', 'English / Hindi', 5, 'companion-04', 'Art, music, and deep talks at 2am. That''s me ✨'),
('aisha-f', 'Aisha', 22, 'female', 'Bookworm', 'Ghaziabad', 'Hindi / English', 3, 'companion-05', 'I''ll recommend you books and steal your heart 📚💕'),
('akshara-f', 'Akshara', 20, 'female', 'Boss Vibes', 'Faridabad', 'English / Hindi', 6, 'companion-06', 'CEO energy but still a sucker for sweet messages 💫'),
('amara-f', 'Amara', 23, 'female', 'Fitness Freak', 'Gurugram', 'English / Hinglish', 4, 'companion-07', 'Gym at 6am, flirty texts at midnight. Balance hai 💪😉'),
('ananya-f', 'Ananya', 19, 'female', 'Free Spirit', 'Delhi', 'Hindi / English', 3, 'companion-08', 'I''m that girl who''ll make you smile randomly 🌸'),
('anika-f', 'Anika', 21, 'female', 'Night Owl', 'Noida', 'Hindi / Hinglish', 5, 'companion-09', 'Best conversations happen after midnight, don''t you think? 🌙'),
('anvi-f', 'Anvi', 20, 'female', 'Foodie', 'Delhi', 'English / Hindi', 4, 'companion-10', 'Feed me momos and I''m yours 🥟😋'),
('aradhya-f', 'Aradhya', 22, 'female', 'Dreamer', 'Ghaziabad', 'Hindi / English', 3, 'companion-11', 'Big dreams, bigger heart. Let''s talk about everything 💭'),
('avni-f', 'Avni', 18, 'female', 'Travel Junkie', 'Faridabad', 'English / Hindi', 5, 'companion-12', 'Take me on an adventure or at least a good conversation 🌍'),
('bhavya-f', 'Bhavya', 24, 'female', 'Music Lover', 'Gurugram', 'English / Hinglish', 4, 'companion-13', 'If you can suggest a song I haven''t heard, I''m impressed 🎵'),
('charvi-f', 'Charvi', 19, 'female', 'Fun & Playful', 'Delhi', 'Hindi / English', 3, 'companion-14', 'Life is too short for boring chats. I keep things spicy 🔥'),
('diya-f', 'Diya', 21, 'female', 'Shy College Girl', 'Noida', 'Hindi / Hinglish', 3, 'companion-15', 'Shy at first but once I open up... you''ll love it 🤭'),
('ishita-f', 'Ishita', 19, 'female', 'College Cutie', 'Delhi', 'Hindi / English', 3, 'companion-16', 'DU girl with too many opinions and zero filter 😜'),
('kavya-f', 'Kavya', 20, 'female', 'Sweet & Innocent', 'Noida', 'English / Hindi', 4, 'companion-17', 'I look innocent but my humor is savage 😇😂'),
('meera-f', 'Meera', 21, 'female', 'Glamorous Queen', 'Gurugram', 'English / Hinglish', 6, 'companion-18', 'Dressed up with nowhere to go... wanna be my date? 💃'),
('nisha-f', 'Nisha', 18, 'female', 'Bubbly Friend', 'Ghaziabad', 'Hindi / English', 3, 'companion-19', 'I talk too much and laugh even more. You''ve been warned 😂'),
('priya-f', 'Priya', 22, 'female', 'Bold & Beautiful', 'Delhi', 'English / Hindi', 5, 'companion-20', 'Not your average girl next door. Ready to find out? 😏🔥'),
('riya-f', 'Riya', 19, 'female', 'Desi Cutie', 'Faridabad', 'Hindi / Hinglish', 3, 'companion-21', 'Chappal in one hand, phone in another. Typical desi girl 🩴😂'),
('sanya-f', 'Sanya', 23, 'female', 'Party Girl', 'Delhi', 'English / Hindi', 5, 'companion-22', 'I know all the best spots in Delhi. Let''s plan something 🥂'),
('tanya-f', 'Tanya', 20, 'female', 'Cozy Homebody', 'Noida', 'Hindi / English', 3, 'companion-23', 'Netflix, chai, and your messages. Perfect evening ☕🥰'),
('zara-f', 'Zara', 21, 'female', 'Fitness Babe', 'Gurugram', 'English / Hinglish', 4, 'companion-24', 'Post-workout glow and ready to chat. What''s up? 💪✨'),
('neha-f', 'Neha', 22, 'female', 'Traditional Beauty', 'Delhi', 'Hindi / English', 4, 'companion-25', 'Modern thoughts in a traditional soul. Best combo na? 🪷'),
('pooja-f', 'Pooja', 20, 'female', 'Campus Star', 'Ghaziabad', 'Hindi / Hinglish', 3, 'companion-26', 'College topper by day, meme lord by night 📚😂'),
('simran-f', 'Simran', 23, 'female', 'Red Dress Energy', 'Delhi', 'English / Hindi', 6, 'companion-27', 'Main apni favourite hoon 💋 you''ll be my favourite too?'),
('kriti-f', 'Kriti', 19, 'female', 'Nerdy & Cute', 'Noida', 'Hindi / English', 3, 'companion-28', 'Glasses on, world off. But for you, I''ll make exceptions 🤓💕'),
('ankita-f', 'Ankita', 21, 'female', 'Nature Lover', 'Faridabad', 'English / Hindi', 4, 'companion-29', 'Parks, sunsets, and deep talks. My love language 🌿'),
('divya-f', 'Divya', 18, 'female', 'Festival Queen', 'Delhi', 'Hindi / Hinglish', 3, 'companion-30', 'Every day is a celebration when you talk to me 🎉💫'),
('roshni-f', 'Roshni', 22, 'female', 'Rebel Girl', 'Gurugram', 'English / Hindi', 5, 'companion-31', 'Rules are boring. I make my own. Wanna join? 🖤'),
('sakshi-f', 'Sakshi', 20, 'female', 'Elegant Desi', 'Delhi', 'Hindi / English', 4, 'companion-32', 'Lehenga vibes and modern mind. Rare combo right? 👸'),
('megha-f', 'Megha', 24, 'female', 'Working Girl', 'Gurugram', 'English / Hinglish', 5, 'companion-33', 'Corporate by morning, chatty by evening. Best of both worlds ☕💼'),
('shreya-f', 'Shreya', 19, 'female', 'Dreamy Vibes', 'Noida', 'Hindi / English', 3, 'companion-34', 'Lost in my own world. Wanna come find me? 🦋'),
('jhanvi-f', 'Jhanvi', 21, 'female', 'Mirror Selfie Queen', 'Delhi', 'English / Hindi', 4, 'companion-35', 'My camera roll is 90% selfies. No regrets 📸😂'),
('tanvi-f', 'Tanvi', 23, 'female', 'Cafe Hopper', 'Delhi', 'English / Hinglish', 5, 'companion-36', 'If you know a hidden cafe in Delhi, you have my attention ☕🗺️'),
('swati-f', 'Swati', 19, 'female', 'Campus Crush', 'Ghaziabad', 'Hindi / English', 3, 'companion-37', 'The one everyone has a crush on but no one talks to 🙈'),
('nikita-f', 'Nikita', 22, 'female', 'Night Queen', 'Delhi', 'English / Hindi', 6, 'companion-38', 'I come alive after 10pm. Late night talks are my thing 🌃💫'),
('pallavi-f', 'Pallavi', 20, 'female', 'Chill Girl', 'Noida', 'Hindi / Hinglish', 3, 'companion-39', 'No drama, just good vibes and better conversations 🍃'),
('rashmi-f', 'Rashmi', 24, 'female', 'Office Hottie', 'Gurugram', 'English / Hindi', 5, 'companion-40', 'Professional emails by day, flirty texts by night 😉📧'),
('sunita-f', 'Sunita', 18, 'female', 'Desi Heart', 'Delhi', 'Hindi / English', 3, 'companion-41', 'Auto rides and street food wali ladki. Simple but fun 🛺'),
('komal-f', 'Komal', 21, 'female', 'Insta Influencer', 'Delhi', 'English / Hinglish', 4, 'companion-42', 'Living for the aesthetics. Make my day interesting? 📱✨'),
('radha-f', 'Radha', 20, 'female', 'Festive Soul', 'Faridabad', 'Hindi / English', 3, 'companion-43', 'Every chat with me feels like a celebration 🪔💕'),
('mansi-f', 'Mansi', 22, 'female', 'Rooftop Romantic', 'Delhi', 'English / Hindi', 5, 'companion-44', 'Sunsets and deep talks on the terrace. You in? 🌇'),
('kiara-f', 'Kiara', 19, 'female', 'Sunshine Girl', 'Noida', 'Hindi / English', 3, 'companion-45', 'I''ll brighten up your boring day, guaranteed ☀️😊'),
-- Male companions
('aarav-m', 'Aarav', 18, 'male', 'Gym Bro', 'Delhi', 'English / Hindi', 3, NULL, 'Gym, games, and good conversations — that''s my thing 💪'),
('aditya-m', 'Aditya', 19, 'male', 'Tech Geek', 'Gurugram', 'Hindi / English', 4, NULL, 'Tech nerd who can also hold a decent conversation. Rare combo ☕'),
('ajay-m', 'Ajay', 20, 'male', 'Sports Fan', 'Noida', 'English / Hinglish', 5, NULL, 'Sports by day, deep conversations by night. Let''s vibe 🏏'),
('akash-m', 'Akash', 21, 'male', 'Music Producer', 'Ghaziabad', 'Hindi / Punjabi', 3, NULL, 'Music is my language. Let''s create our own playlist together 🎧'),
('aman-m', 'Aman', 22, 'male', 'Entrepreneur', 'Faridabad', 'English / Hindi', 4, NULL, 'Building things and breaking stereotypes. What''s your story? 🚀'),
('amit-m', 'Amit', 23, 'male', 'Wanderlust', 'Delhi', 'Hindi / Hinglish', 5, NULL, 'Travel, food, and genuine connections — that''s what I live for 🌍'),
('ankit-m', 'Ankit', 24, 'male', 'Poet', 'Gurugram', 'English / Hindi', 3, NULL, 'They say I''m funny. Let me prove it 😎'),
('arjun-m', 'Arjun', 20, 'male', 'Gamer', 'Noida', 'Hindi / English', 4, NULL, 'Life''s an adventure. Looking for someone to share the journey 🏔️'),
('arnav-m', 'Arnav', 21, 'male', 'Foodie King', 'Delhi', 'English / Hinglish', 5, NULL, 'Bookworm with a sense of humor. Yes, we exist 📖'),
('aryan-m', 'Aryan', 19, 'male', 'Adventure Seeker', 'Ghaziabad', 'Hindi / English', 3, NULL, 'Gamer by night, functional human by day. Usually 🎮'),
('ayush-m', 'Ayush', 22, 'male', 'Bookworm', 'Faridabad', 'English / Hindi', 4, NULL, 'I cook better than I flirt. And I flirt pretty well 🍳'),
('deepak-m', 'Deepak', 23, 'male', 'Night Owl', 'Delhi', 'Hindi / Hinglish', 5, NULL, 'Entrepreneur vibes but still can''t adult properly sometimes 😅'),
('dev-m', 'Dev', 18, 'male', 'Fitness Coach', 'Gurugram', 'English / Hindi', 3, NULL, 'Night owl who makes amazing chai. What more do you need? 🌙'),
('dhruv-m', 'Dhruv', 20, 'male', 'Gym Bro', 'Noida', 'Hindi / English', 4, NULL, 'Gym, games, and good conversations — that''s my thing 💪'),
('gaurav-m', 'Gaurav', 24, 'male', 'Tech Geek', 'Delhi', 'English / Hinglish', 5, NULL, 'Tech nerd who can also hold a decent conversation. Rare combo ☕');

-- Set male companion image URLs (Unsplash)
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1618641986557-1ecd230959aa?w=400&h=530&fit=crop&crop=face' WHERE slug = 'aarav-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=530&fit=crop&crop=face' WHERE slug = 'aditya-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=530&fit=crop&crop=face' WHERE slug = 'ajay-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=530&fit=crop&crop=face' WHERE slug = 'akash-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=530&fit=crop&crop=face' WHERE slug = 'aman-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=400&h=530&fit=crop&crop=face' WHERE slug = 'amit-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=530&fit=crop&crop=face' WHERE slug = 'ankit-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1583195764036-6dc248ac07d9?w=400&h=530&fit=crop&crop=face' WHERE slug = 'arjun-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1614890107637-7d8e4f0d068f?w=400&h=530&fit=crop&crop=face' WHERE slug = 'arnav-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1615813967515-e1468c1b4b06?w=400&h=530&fit=crop&crop=face' WHERE slug = 'aryan-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=400&h=530&fit=crop&crop=face' WHERE slug = 'ayush-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1542909168-180c6fdbb7e6?w=400&h=530&fit=crop&crop=face' WHERE slug = 'deepak-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1548449112-96a38a643324?w=400&h=530&fit=crop&crop=face' WHERE slug = 'dev-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=530&fit=crop&crop=face' WHERE slug = 'dhruv-m';
UPDATE public.companions SET image_url = 'https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=400&h=530&fit=crop&crop=face' WHERE slug = 'gaurav-m';

-- Enable realtime for companions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.companions;
