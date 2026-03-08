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

const fCities = [
  "Delhi","Noida","Gurgaon","Delhi NCR","Greater Noida","Faridabad","Ghaziabad",
  "Delhi","Noida","Gurgaon","Delhi NCR","Delhi","Mumbai","Bangalore","Pune",
];

const mCities = [
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

function generate(
  names: string[],
  gender: "male" | "female",
  tags: string[],
  bios: string[]
): Companion[] {
  return names.map((name, i) => ({
    id: `${name.toLowerCase()}-${gender[0]}`,
    name,
    age: ages[i % ages.length],
    gender,
    tag: tags[i % tags.length],
    city: cities[i % cities.length],
    languages: langs[i % langs.length],
    ratePerMin: [3, 4, 5][i % 3],
    image: `https://randomuser.me/api/portraits/${gender === "female" ? "women" : "men"}/${i}.jpg`,
    bio: bios[i % bios.length],
  }));
}

export const companions: Companion[] = [
  ...generate(fNames, "female", fTags, fBios),
  ...generate(mNames, "male", mTags, mBios),
];

export const getCompanionById = (id: string): Companion | undefined =>
  companions.find((c) => c.id === id);
