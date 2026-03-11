import companion01 from "@/assets/companion-01.jpg";
import companion02 from "@/assets/companion-02.jpg";
import companion03 from "@/assets/companion-03.jpg";
import companion04 from "@/assets/companion-04.jpg";
import companion05 from "@/assets/companion-05.jpg";
import companion06 from "@/assets/companion-06.jpg";
import companion07 from "@/assets/companion-07.jpg";
import companion08 from "@/assets/companion-08.jpg";
import companion09 from "@/assets/companion-09.jpg";
import companion10 from "@/assets/companion-10.jpg";
import companion11 from "@/assets/companion-11.jpg";
import companion12 from "@/assets/companion-12.jpg";
import companion13 from "@/assets/companion-13.jpg";
import companion14 from "@/assets/companion-14.jpg";
import companion15 from "@/assets/companion-15.jpg";

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

const femaleImages = [
  companion01, companion02, companion03, companion04, companion05,
  companion06, companion07, companion08, companion09, companion10,
  companion11, companion12, companion13, companion14, companion15,
];

const fNames = [
  "Aadhya","Aanya","Aarohi","Aditi","Aisha","Akshara","Amara","Ananya","Anika","Anvi",
  "Aradhya","Avni","Bhavya","Charvi","Diya",
];

const mNames = [
  "Aarav","Aditya","Ajay","Akash","Aman","Amit","Ankit","Arjun","Arnav","Aryan",
  "Ayush","Deepak","Dev","Dhruv","Gaurav",
];

const fTags = [
  "Cheerful & Witty","Confident & Bold","College Buddy","Creative Soul","Bookworm",
  "Boss Vibes","Fitness Freak","Free Spirit","Night Owl","Foodie","Dreamer",
  "Travel Junkie","Music Lover","Fun & Playful","Shy College Girl",
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
  "Sweet but savage. You'll love my energy 💕",
  "Quiet vibes, deep thoughts. Let's see if you can keep up 🤫",
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

const ages = [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];

const indianMenPhotos = [
  "photo-1618641986557-1ecd230959aa",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1500648767791-00dcc994a43e",
  "photo-1492562080023-ab3db95bfbce",
  "photo-1603415526960-f7e0328c63b1",
  "photo-1566492031773-4f4e44671857",
  "photo-1583195764036-6dc248ac07d9",
  "photo-1614890107637-7d8e4f0d068f",
  "photo-1615813967515-e1468c1b4b06",
  "photo-1564564321837-a57b7070ac4f",
  "photo-1542909168-180c6fdbb7e6",
  "photo-1548449112-96a38a643324",
  "photo-1570295999919-56ceb5ecca61",
  "photo-1590086782957-93c06ef21604",
];

function generateFemale(names: string[]): Companion[] {
  return names.map((name, i) => ({
    id: `${name.toLowerCase()}-f`,
    name,
    age: ages[i % ages.length],
    gender: "female" as const,
    tag: fTags[i % fTags.length],
    city: cities[i % cities.length],
    languages: langs[i % langs.length],
    ratePerMin: [3, 4, 5, 6, 8][i % 5],
    image: femaleImages[i], // Each gets a unique image — no repeats
    bio: fBios[i % fBios.length],
  }));
}

function generateMale(names: string[]): Companion[] {
  return names.map((name, i) => ({
    id: `${name.toLowerCase()}-m`,
    name,
    age: ages[i % ages.length],
    gender: "male" as const,
    tag: mTags[i % mTags.length],
    city: cities[i % cities.length],
    languages: langs[i % langs.length],
    ratePerMin: [3, 4, 5][i % 3],
    image: `https://images.unsplash.com/${indianMenPhotos[i % indianMenPhotos.length]}?w=400&h=530&fit=crop&crop=face`,
    bio: mBios[i % mBios.length],
  }));
}

export const companions: Companion[] = [
  ...generateFemale(fNames),
  ...generateMale(mNames),
];

export const getCompanionById = (id: string): Companion | undefined =>
  companions.find((c) => c.id === id);
