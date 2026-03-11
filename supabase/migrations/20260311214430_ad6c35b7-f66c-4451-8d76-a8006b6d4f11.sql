
-- Companion wishlist table
CREATE TABLE public.companion_wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  bio text DEFAULT '',
  city text DEFAULT '',
  gender text DEFAULT 'female',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companion_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own wishlist" ON public.companion_wishlist
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own wishlist" ON public.companion_wishlist
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Admins full access wishlist" ON public.companion_wishlist
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert 45 male companions
INSERT INTO public.companions (slug, name, age, gender, tag, city, languages, bio, image_key, status) VALUES
('boy-arjun', 'Arjun', 23, 'male', 'Flirty', 'Mumbai', 'Hindi / English', 'Gym lover, night owl, always up for deep talks', 'companion-01', 'active'),
('boy-rohan', 'Rohan', 21, 'male', 'Funny', 'Delhi', 'Hindi / English', 'Stand-up comedy fan, meme lord, cricket obsessed', 'companion-02', 'active'),
('boy-aarav', 'Aarav', 22, 'male', 'Romantic', 'Bangalore', 'Hindi / English / Kannada', 'Guitar player, hopeless romantic, coffee addict', 'companion-03', 'active'),
('boy-vihaan', 'Vihaan', 24, 'male', 'Bold', 'Pune', 'Hindi / English / Marathi', 'Biker, adventure junkie, love late night rides', 'companion-04', 'active'),
('boy-aditya', 'Aditya', 20, 'male', 'Sweet', 'Jaipur', 'Hindi / English', 'Artist, sunset lover, secretly writes poetry', 'companion-05', 'active'),
('boy-krishna', 'Krishna', 23, 'male', 'Flirty', 'Hyderabad', 'Hindi / English / Telugu', 'Dancer, foodie, biryani is life', 'companion-06', 'active'),
('boy-dev', 'Dev', 22, 'male', 'Caring', 'Chennai', 'Hindi / English / Tamil', 'Movie buff, night owl, great listener', 'companion-07', 'active'),
('boy-ishaan', 'Ishaan', 21, 'male', 'Funny', 'Kolkata', 'Hindi / English / Bengali', 'Football fan, mischievous smile, loves rainy days', 'companion-08', 'active'),
('boy-kabir', 'Kabir', 24, 'male', 'Bold', 'Delhi', 'Hindi / English', 'Gym rat, streetwear lover, chai over coffee', 'companion-09', 'active'),
('boy-reyansh', 'Reyansh', 20, 'male', 'Romantic', 'Lucknow', 'Hindi / English / Urdu', 'Shayari king, old soul in young body', 'companion-10', 'active'),
('boy-vivaan', 'Vivaan', 23, 'male', 'Sweet', 'Ahmedabad', 'Hindi / English / Gujarati', 'Photographer, dog person, loves stargazing', 'companion-11', 'active'),
('boy-ansh', 'Ansh', 22, 'male', 'Flirty', 'Noida', 'Hindi / English', 'Gamer, anime lover, smooth talker', 'companion-12', 'active'),
('boy-dhruv', 'Dhruv', 21, 'male', 'Caring', 'Gurgaon', 'Hindi / English', 'Tech geek, always there to listen, music junkie', 'companion-13', 'active'),
('boy-yash', 'Yash', 24, 'male', 'Bold', 'Mumbai', 'Hindi / English / Marathi', 'Fitness freak, beach lover, confident vibes', 'companion-14', 'active'),
('boy-arnav', 'Arnav', 20, 'male', 'Funny', 'Chandigarh', 'Hindi / English / Punjabi', 'Punjabi munda, always making everyone laugh', 'companion-15', 'active'),
('boy-sarthak', 'Sarthak', 23, 'male', 'Romantic', 'Delhi', 'Hindi / English', 'Writes love letters, old Bollywood fan', 'companion-16', 'active'),
('boy-ayaan', 'Ayaan', 22, 'male', 'Sweet', 'Indore', 'Hindi / English', 'Foodie, street food explorer, warm personality', 'companion-17', 'active'),
('boy-laksh', 'Laksh', 21, 'male', 'Flirty', 'Delhi', 'Hindi / English', 'College topper by day, party animal by night', 'companion-18', 'active'),
('boy-rudra', 'Rudra', 24, 'male', 'Bold', 'Pune', 'Hindi / English', 'MMA fighter, intense eyes, soft heart', 'companion-19', 'active'),
('boy-shaurya', 'Shaurya', 20, 'male', 'Caring', 'Bangalore', 'Hindi / English', 'Startup dreamer, loves cooking for people', 'companion-20', 'active'),
('boy-atharv', 'Atharv', 23, 'male', 'Funny', 'Mumbai', 'Hindi / English', 'Meme page admin, college bunker, fun vibes', 'companion-21', 'active'),
('boy-parth', 'Parth', 22, 'male', 'Romantic', 'Surat', 'Hindi / English / Gujarati', 'Piano player, candlelight dinner type', 'companion-22', 'active'),
('boy-harsh', 'Harsh', 21, 'male', 'Sweet', 'Nagpur', 'Hindi / English', 'Book worm, chai lover, good morning texter', 'companion-23', 'active'),
('boy-advait', 'Advait', 24, 'male', 'Bold', 'Delhi', 'Hindi / English', 'Tattoo lover, deep voice, mysterious aura', 'companion-24', 'active'),
('boy-neil', 'Neil', 20, 'male', 'Flirty', 'Goa', 'Hindi / English / Konkani', 'Beach bum, surfer, sunset chaser', 'companion-25', 'active'),
('boy-samar', 'Samar', 23, 'male', 'Caring', 'Jaipur', 'Hindi / English', 'Royal vibes, history lover, protective nature', 'companion-26', 'active'),
('boy-tanmay', 'Tanmay', 22, 'male', 'Funny', 'Delhi', 'Hindi / English', 'YouTube binger, pun master, always cracking jokes', 'companion-27', 'active'),
('boy-kian', 'Kian', 21, 'male', 'Romantic', 'Mumbai', 'Hindi / English', 'Rain lover, writes songs, dreamy eyes', 'companion-28', 'active'),
('boy-zayan', 'Zayan', 24, 'male', 'Bold', 'Hyderabad', 'Hindi / English / Urdu', 'Kickboxer, street smart, heart of gold', 'companion-29', 'active'),
('boy-om', 'Om', 20, 'male', 'Sweet', 'Varanasi', 'Hindi / English', 'Spiritual soul, meditation lover, great advice giver', 'companion-30', 'active'),
('boy-ryan', 'Ryan', 23, 'male', 'Flirty', 'Bangalore', 'Hindi / English', 'DJ, club hopper, smooth moves on dance floor', 'companion-31', 'active'),
('boy-darsh', 'Darsh', 22, 'male', 'Caring', 'Kolkata', 'Hindi / English / Bengali', 'Poet at heart, great cook, emotionally intelligent', 'companion-32', 'active'),
('boy-manan', 'Manan', 21, 'male', 'Funny', 'Ahmedabad', 'Hindi / English / Gujarati', 'Stand-up wannabe, dhokla lover, life of the party', 'companion-33', 'active'),
('boy-rishi', 'Rishi', 24, 'male', 'Bold', 'Chennai', 'Hindi / English / Tamil', 'Martial arts, fitness model, confident walk', 'companion-34', 'active'),
('boy-ahaan', 'Ahaan', 20, 'male', 'Romantic', 'Delhi', 'Hindi / English', 'Love letter writer, old school romance, gentle soul', 'companion-35', 'active'),
('boy-ranveer', 'Ranveer', 23, 'male', 'Bold', 'Mumbai', 'Hindi / English', 'Bollywood dancer, always energetic, life of party', 'companion-36', 'active'),
('boy-aayan', 'Aayan', 22, 'male', 'Sweet', 'Lucknow', 'Hindi / English / Urdu', 'Nawabi tehzeeb, respectful, amazing listener', 'companion-37', 'active'),
('boy-virat', 'Virat', 21, 'male', 'Flirty', 'Delhi', 'Hindi / English', 'Cricket fanatic, gym bro, competitive spirit', 'companion-38', 'active'),
('boy-sahil', 'Sahil', 24, 'male', 'Caring', 'Pune', 'Hindi / English / Marathi', 'Dog dad, morning runner, warm hugs type', 'companion-39', 'active'),
('boy-kartik', 'Kartik', 20, 'male', 'Funny', 'Noida', 'Hindi / English', 'Meme dealer, Netflix addict, midnight snacker', 'companion-40', 'active'),
('boy-kiaan', 'Kiaan', 23, 'male', 'Romantic', 'Gurgaon', 'Hindi / English', 'Drives at night, plays guitar under stars', 'companion-41', 'active'),
('boy-raghav', 'Raghav', 22, 'male', 'Bold', 'Jaipur', 'Hindi / English', 'Rajput vibes, horse rider, fearless attitude', 'companion-42', 'active'),
('boy-anay', 'Anay', 21, 'male', 'Sweet', 'Bangalore', 'Hindi / English / Kannada', 'Sketch artist, cat person, soft spoken', 'companion-43', 'active'),
('boy-ishan', 'Ishan', 24, 'male', 'Flirty', 'Mumbai', 'Hindi / English', 'Model, beach walks, charming smile', 'companion-44', 'active'),
('boy-veer', 'Veer', 20, 'male', 'Caring', 'Delhi', 'Hindi / English', 'Big brother vibes, always protective, chai partner', 'companion-45', 'active');
