export type Companion = {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  tag: string;
  city: string;
  languages: string;
  ratePerMin: number;
  image: string;
  bio: string;
};

const fNames = [
  "Aadhya","Aanya","Aarohi","Aditi","Aisha","Akshara","Amara","Ananya","Anika","Anvi",
  "Aradhya","Avni","Bhavya","Charvi","Diya","Divya","Esha","Fatima","Gauri","Hina",
  "Isha","Ishita","Jiya","Kajal","Kavya","Khushi","Kiara","Kritika","Lakshmi","Mahika",
  "Mansi","Meera","Mira","Myra","Naina","Navya","Neha","Nisha","Nithya","Palak",
  "Pooja","Prisha","Priya","Radhika","Rhea","Riya","Ruhi","Saanvi","Sakshi","Sanya",
  "Sara","Shreya","Simran","Sneha","Tanya","Trisha","Vaani","Vidya","Zara","Zoya",
];

const mNames = [
  "Aarav","Aditya","Ajay","Akash","Aman","Amit","Ankit","Arjun","Arnav","Aryan",
  "Ayush","Deepak","Dev","Dhruv","Gaurav","Harsh","Ishaan","Jai","Kabir","Karan",
  "Kartik","Krishna","Kunal","Laksh","Manan","Manav","Mohit","Nakul","Neil","Nikhil",
  "Om","Parth","Pranav","Prateek","Raj","Rahul","Rajat","Rakesh","Ravi","Rehan",
  "Rohan","Rohit","Sahil","Samar","Siddharth","Surya","Tanmay","Varun","Veer","Vikram",
  "Virat","Vivek","Yash","Zain","Krish",
];

const fTags = [
  "Cheerful & Witty","Confident & Bold","College Buddy","Creative Soul","Bookworm",
  "Boss Vibes","Fitness Freak","Free Spirit","Night Owl","Foodie","Dreamer",
  "Travel Junkie","Music Lover",
];

const mTags = [
  "Gym Bro","Tech Geek","Sports Fan","Music Producer","Entrepreneur","Wanderlust",
  "Poet","Gamer","Foodie King","Adventure Seeker","Bookworm","Night Owl","Fitness Coach",
];

const cities = [
  "Mumbai","Delhi","Bangalore","Pune","Hyderabad","Chennai","Kolkata","Jaipur",
  "Chandigarh","Goa","Lucknow","Ahmedabad","Indore","Kochi","Bhopal",
];

const langs = [
  "English / Hindi","Hindi / English","English / Hinglish","Hindi / Punjabi",
  "English / Tamil","Hindi / Marathi","English / Telugu","English / Kannada",
  "Hindi / Bengali","English / Malayalam",
];

const fBios = [
  "Hey! Deep talks and silly jokes are my vibe. Let's make it fun ✨",
  "Life's too short for boring chats. I keep things interesting 😏",
  "Coffee addict, music lover, always up for good conversations 🎵",
  "Late night conversations are my therapy. What about yours? 🌙",
  "Art, music, and meaningful talks — that's my whole personality 🎨",
  "I'm that friend with the best advice and worst jokes 😂",
  "Gym in the morning, deep talks at night. Balance is everything 💪",
  "Living my best life and looking for someone to vibe with 🌟",
  "Bookworm by day, overthinker by night. Come say hi 📚",
  "I believe every conversation should leave you smiling 😊",
  "Just a small town girl with big city dreams and bigger opinions 💫",
  "Travel stories, food pics, and real talk — that's what I bring 🌍",
  "Not your regular girl next door. Try me and find out 🔥",
];

const mBios = [
  "Gym, games, and good conversations — that's my thing 💪",
  "Tech nerd who can also hold a decent conversation. Rare combo, I know ☕",
  "Sports by day, deep conversations by night. Let's vibe 🏏",
  "Music is my language. Let's create our own playlist together 🎧",
  "Building things and breaking stereotypes. What's your story? 🚀",
  "Travel, food, and genuine connections — that's what I live for 🌍",
  "They say I'm funny. Let me prove it 😎",
  "Life's an adventure. Looking for someone to share the journey 🏔️",
  "Bookworm with a sense of humor. Yes, we exist 📖",
  "Gamer by night, functional human by day. Usually 🎮",
  "I cook better than I flirt. And I flirt pretty well 🍳",
  "Entrepreneur vibes but still can't adult properly sometimes 😅",
  "Night owl who makes amazing chai. What more do you need? 🌙",
];

const ages = [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38];

// Curated Unsplash photo IDs of Indian women & men portraits
const indianWomenPhotos = [
  "photo-1611516491426-03025e6043c8", // Indian woman portrait
  "photo-1594819047050-99defca82545", // Indian woman smiling
  "photo-1616091216791-a5360fb13982", // Indian girl casual
  "photo-1588516903720-8ceb67f9ef84", // Indian woman traditional
  "photo-1609505848912-b7c3b8b4beda", // Indian woman modern
  "photo-1592621385612-4d7129426394", // Young Indian woman
  "photo-1617330527657-a3c2d05b9d50", // Indian woman portrait
  "photo-1580489944761-15a19d654956", // Indian woman smiling
  "photo-1531746020798-e6953c6e8e04", // Woman portrait
  "photo-1544005313-94ddf0286df2", // Woman face portrait
  "photo-1494790108377-be9c29b29330", // Woman smiling
  "photo-1524504388940-b1c1722653e1", // Woman casual
  "photo-1529626455594-4ff0802cfb7e", // Indian woman
  "photo-1614283233556-f35b0c801ef1", // Indian girl modern
  "photo-1618835962148-cf177563c6c0", // Indian woman portrait
];

const indianMenPhotos = [
  "photo-1618641986557-1ecd230959aa", // Indian man portrait
  "photo-1506794778202-cad84cf45f1d", // Man portrait
  "photo-1507003211169-0a1dd7228f2d", // Man smiling
  "photo-1500648767791-00dcc994a43e", // Man casual
  "photo-1492562080023-ab3db95bfbce", // Man portrait
  "photo-1603415526960-f7e0328c63b1", // Indian man
  "photo-1566492031773-4f4e44671857", // Man portrait
  "photo-1583195764036-6dc248ac07d9", // Indian man modern
  "photo-1614890107637-7d8e4f0d068f", // Indian man casual
  "photo-1615813967515-e1468c1b4b06", // Indian man portrait
  "photo-1564564321837-a57b7070ac4f", // Man smiling
  "photo-1542909168-180c6fdbb7e6", // Man portrait
  "photo-1548449112-96a38a643324", // Man casual
  "photo-1570295999919-56ceb5ecca61", // Man portrait
  "photo-1590086782957-93c06ef21604", // Indian man
];

function generate(
  names: string[],
  gender: "male" | "female",
  tags: string[],
  bios: string[]
): Companion[] {
  const photos = gender === "female" ? indianWomenPhotos : indianMenPhotos;
  return names.map((name, i) => ({
    id: `${name.toLowerCase()}-${gender[0]}`,
    name,
    age: ages[i % ages.length],
    gender,
    tag: tags[i % tags.length],
    city: cities[i % cities.length],
    languages: langs[i % langs.length],
    ratePerMin: [3, 4, 5][i % 3],
    image: `https://images.unsplash.com/${photos[i % photos.length]}?w=400&h=530&fit=crop&crop=face`,
    bio: bios[i % bios.length],
  }));
}

export const companions: Companion[] = [
  ...generate(fNames, "female", fTags, fBios),
  ...generate(mNames, "male", mTags, mBios),
];

export const getCompanionById = (id: string): Companion | undefined =>
  companions.find((c) => c.id === id);
