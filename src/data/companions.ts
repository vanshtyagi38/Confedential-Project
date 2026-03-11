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
import companion16 from "@/assets/companion-16.jpg";
import companion17 from "@/assets/companion-17.jpg";
import companion18 from "@/assets/companion-18.jpg";
import companion19 from "@/assets/companion-19.jpg";
import companion20 from "@/assets/companion-20.jpg";
import companion21 from "@/assets/companion-21.jpg";
import companion22 from "@/assets/companion-22.jpg";
import companion23 from "@/assets/companion-23.jpg";
import companion24 from "@/assets/companion-24.jpg";
import companion25 from "@/assets/companion-25.jpg";
import companion26 from "@/assets/companion-26.jpg";
import companion27 from "@/assets/companion-27.jpg";
import companion28 from "@/assets/companion-28.jpg";
import companion29 from "@/assets/companion-29.jpg";
import companion30 from "@/assets/companion-30.jpg";
import companion31 from "@/assets/companion-31.jpg";
import companion32 from "@/assets/companion-32.jpg";
import companion33 from "@/assets/companion-33.jpg";
import companion34 from "@/assets/companion-34.jpg";
import companion35 from "@/assets/companion-35.jpg";
import companion36 from "@/assets/companion-36.jpg";
import companion37 from "@/assets/companion-37.jpg";
import companion38 from "@/assets/companion-38.jpg";
import companion39 from "@/assets/companion-39.jpg";
import companion40 from "@/assets/companion-40.jpg";
import companion41 from "@/assets/companion-41.jpg";
import companion42 from "@/assets/companion-42.jpg";
import companion43 from "@/assets/companion-43.jpg";
import companion44 from "@/assets/companion-44.jpg";
import companion45 from "@/assets/companion-45.jpg";

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

const femaleProfiles: Companion[] = [
  // Original 15
  { id: "aadhya-f", name: "Aadhya", age: 19, gender: "female", tag: "Cheerful & Witty", city: "Delhi", languages: "Hindi / English", ratePerMin: 3, image: companion01, bio: "Heyy! I'm literally always laughing at something 😂 come vibe with me" },
  { id: "aanya-f", name: "Aanya", age: 20, gender: "female", tag: "Confident & Bold", city: "Gurugram", languages: "English / Hindi", ratePerMin: 4, image: companion02, bio: "Bold opinions, soft heart. Try keeping up with me 😏" },
  { id: "aarohi-f", name: "Aarohi", age: 21, gender: "female", tag: "College Buddy", city: "Noida", languages: "Hindi / Hinglish", ratePerMin: 3, image: companion03, bio: "College life + late night convos = my whole personality 🌙" },
  { id: "aditi-f", name: "Aditi", age: 18, gender: "female", tag: "Creative Soul", city: "Delhi", languages: "English / Hindi", ratePerMin: 5, image: companion04, bio: "Art, music, and deep talks at 2am. That's me ✨" },
  { id: "aisha-f", name: "Aisha", age: 22, gender: "female", tag: "Bookworm", city: "Ghaziabad", languages: "Hindi / English", ratePerMin: 3, image: companion05, bio: "I'll recommend you books and steal your heart 📚💕" },
  { id: "akshara-f", name: "Akshara", age: 20, gender: "female", tag: "Boss Vibes", city: "Faridabad", languages: "English / Hindi", ratePerMin: 6, image: companion06, bio: "CEO energy but still a sucker for sweet messages 💫" },
  { id: "amara-f", name: "Amara", age: 23, gender: "female", tag: "Fitness Freak", city: "Gurugram", languages: "English / Hinglish", ratePerMin: 4, image: companion07, bio: "Gym at 6am, flirty texts at midnight. Balance hai 💪😉" },
  { id: "ananya-f", name: "Ananya", age: 19, gender: "female", tag: "Free Spirit", city: "Delhi", languages: "Hindi / English", ratePerMin: 3, image: companion08, bio: "I'm that girl who'll make you smile randomly 🌸" },
  { id: "anika-f", name: "Anika", age: 21, gender: "female", tag: "Night Owl", city: "Noida", languages: "Hindi / Hinglish", ratePerMin: 5, image: companion09, bio: "Best conversations happen after midnight, don't you think? 🌙" },
  { id: "anvi-f", name: "Anvi", age: 20, gender: "female", tag: "Foodie", city: "Delhi", languages: "English / Hindi", ratePerMin: 4, image: companion10, bio: "Feed me momos and I'm yours 🥟😋" },
  { id: "aradhya-f", name: "Aradhya", age: 22, gender: "female", tag: "Dreamer", city: "Ghaziabad", languages: "Hindi / English", ratePerMin: 3, image: companion11, bio: "Big dreams, bigger heart. Let's talk about everything 💭" },
  { id: "avni-f", name: "Avni", age: 18, gender: "female", tag: "Travel Junkie", city: "Faridabad", languages: "English / Hindi", ratePerMin: 5, image: companion12, bio: "Take me on an adventure or at least a good conversation 🌍" },
  { id: "bhavya-f", name: "Bhavya", age: 24, gender: "female", tag: "Music Lover", city: "Gurugram", languages: "English / Hinglish", ratePerMin: 4, image: companion13, bio: "If you can suggest a song I haven't heard, I'm impressed 🎵" },
  { id: "charvi-f", name: "Charvi", age: 19, gender: "female", tag: "Fun & Playful", city: "Delhi", languages: "Hindi / English", ratePerMin: 3, image: companion14, bio: "Life is too short for boring chats. I keep things spicy 🔥" },
  { id: "diya-f", name: "Diya", age: 21, gender: "female", tag: "Shy College Girl", city: "Noida", languages: "Hindi / Hinglish", ratePerMin: 3, image: companion15, bio: "Shy at first but once I open up... you'll love it 🤭" },

  // New 30
  { id: "ishita-f", name: "Ishita", age: 19, gender: "female", tag: "College Cutie", city: "Delhi", languages: "Hindi / English", ratePerMin: 3, image: companion16, bio: "DU girl with too many opinions and zero filter 😜" },
  { id: "kavya-f", name: "Kavya", age: 20, gender: "female", tag: "Sweet & Innocent", city: "Noida", languages: "English / Hindi", ratePerMin: 4, image: companion17, bio: "I look innocent but my humor is savage 😇😂" },
  { id: "meera-f", name: "Meera", age: 21, gender: "female", tag: "Glamorous Queen", city: "Gurugram", languages: "English / Hinglish", ratePerMin: 6, image: companion18, bio: "Dressed up with nowhere to go... wanna be my date? 💃" },
  { id: "nisha-f", name: "Nisha", age: 18, gender: "female", tag: "Bubbly Friend", city: "Ghaziabad", languages: "Hindi / English", ratePerMin: 3, image: companion19, bio: "I talk too much and laugh even more. You've been warned 😂" },
  { id: "priya-f", name: "Priya", age: 22, gender: "female", tag: "Bold & Beautiful", city: "Delhi", languages: "English / Hindi", ratePerMin: 5, image: companion20, bio: "Not your average girl next door. Ready to find out? 😏🔥" },
  { id: "riya-f", name: "Riya", age: 19, gender: "female", tag: "Desi Cutie", city: "Faridabad", languages: "Hindi / Hinglish", ratePerMin: 3, image: companion21, bio: "Chappal in one hand, phone in another. Typical desi girl 🩴😂" },
  { id: "sanya-f", name: "Sanya", age: 23, gender: "female", tag: "Party Girl", city: "Delhi", languages: "English / Hindi", ratePerMin: 5, image: companion22, bio: "I know all the best spots in Delhi. Let's plan something 🥂" },
  { id: "tanya-f", name: "Tanya", age: 20, gender: "female", tag: "Cozy Homebody", city: "Noida", languages: "Hindi / English", ratePerMin: 3, image: companion23, bio: "Netflix, chai, and your messages. Perfect evening ☕🥰" },
  { id: "zara-f", name: "Zara", age: 21, gender: "female", tag: "Fitness Babe", city: "Gurugram", languages: "English / Hinglish", ratePerMin: 4, image: companion24, bio: "Post-workout glow and ready to chat. What's up? 💪✨" },
  { id: "neha-f", name: "Neha", age: 22, gender: "female", tag: "Traditional Beauty", city: "Delhi", languages: "Hindi / English", ratePerMin: 4, image: companion25, bio: "Modern thoughts in a traditional soul. Best combo na? 🪷" },
  { id: "pooja-f", name: "Pooja", age: 20, gender: "female", tag: "Campus Star", city: "Ghaziabad", languages: "Hindi / Hinglish", ratePerMin: 3, image: companion26, bio: "College topper by day, meme lord by night 📚😂" },
  { id: "simran-f", name: "Simran", age: 23, gender: "female", tag: "Red Dress Energy", city: "Delhi", languages: "English / Hindi", ratePerMin: 6, image: companion27, bio: "Main apni favourite hoon 💋 you'll be my favourite too?" },
  { id: "kriti-f", name: "Kriti", age: 19, gender: "female", tag: "Nerdy & Cute", city: "Noida", languages: "Hindi / English", ratePerMin: 3, image: companion28, bio: "Glasses on, world off. But for you, I'll make exceptions 🤓💕" },
  { id: "ankita-f", name: "Ankita", age: 21, gender: "female", tag: "Nature Lover", city: "Faridabad", languages: "English / Hindi", ratePerMin: 4, image: companion29, bio: "Parks, sunsets, and deep talks. My love language 🌿" },
  { id: "divya-f", name: "Divya", age: 18, gender: "female", tag: "Festival Queen", city: "Delhi", languages: "Hindi / Hinglish", ratePerMin: 3, image: companion30, bio: "Every day is a celebration when you talk to me 🎉💫" },
  { id: "roshni-f", name: "Roshni", age: 22, gender: "female", tag: "Rebel Girl", city: "Gurugram", languages: "English / Hindi", ratePerMin: 5, image: companion31, bio: "Rules are boring. I make my own. Wanna join? 🖤" },
  { id: "sakshi-f", name: "Sakshi", age: 20, gender: "female", tag: "Elegant Desi", city: "Delhi", languages: "Hindi / English", ratePerMin: 4, image: companion32, bio: "Lehenga vibes and modern mind. Rare combo right? 👸" },
  { id: "megha-f", name: "Megha", age: 24, gender: "female", tag: "Working Girl", city: "Gurugram", languages: "English / Hinglish", ratePerMin: 5, image: companion33, bio: "Corporate by morning, chatty by evening. Best of both worlds ☕💼" },
  { id: "shreya-f", name: "Shreya", age: 19, gender: "female", tag: "Dreamy Vibes", city: "Noida", languages: "Hindi / English", ratePerMin: 3, image: companion34, bio: "Lost in my own world. Wanna come find me? 🦋" },
  { id: "jhanvi-f", name: "Jhanvi", age: 21, gender: "female", tag: "Mirror Selfie Queen", city: "Delhi", languages: "English / Hindi", ratePerMin: 4, image: companion35, bio: "My camera roll is 90% selfies. No regrets 📸😂" },
  { id: "tanvi-f", name: "Tanvi", age: 23, gender: "female", tag: "Cafe Hopper", city: "Delhi", languages: "English / Hinglish", ratePerMin: 5, image: companion36, bio: "If you know a hidden cafe in Delhi, you have my attention ☕🗺️" },
  { id: "swati-f", name: "Swati", age: 19, gender: "female", tag: "Campus Crush", city: "Ghaziabad", languages: "Hindi / English", ratePerMin: 3, image: companion37, bio: "The one everyone has a crush on but no one talks to 🙈" },
  { id: "nikita-f", name: "Nikita", age: 22, gender: "female", tag: "Night Queen", city: "Delhi", languages: "English / Hindi", ratePerMin: 6, image: companion38, bio: "I come alive after 10pm. Late night talks are my thing 🌃💫" },
  { id: "pallavi-f", name: "Pallavi", age: 20, gender: "female", tag: "Chill Girl", city: "Noida", languages: "Hindi / Hinglish", ratePerMin: 3, image: companion39, bio: "No drama, just good vibes and better conversations 🍃" },
  { id: "rashmi-f", name: "Rashmi", age: 24, gender: "female", tag: "Office Hottie", city: "Gurugram", languages: "English / Hindi", ratePerMin: 5, image: companion40, bio: "Professional emails by day, flirty texts by night 😉📧" },
  { id: "sunita-f", name: "Sunita", age: 18, gender: "female", tag: "Desi Heart", city: "Delhi", languages: "Hindi / English", ratePerMin: 3, image: companion41, bio: "Auto rides and street food wali ladki. Simple but fun 🛺" },
  { id: "komal-f", name: "Komal", age: 21, gender: "female", tag: "Insta Influencer", city: "Delhi", languages: "English / Hinglish", ratePerMin: 4, image: companion42, bio: "Living for the aesthetics. Make my day interesting? 📱✨" },
  { id: "radha-f", name: "Radha", age: 20, gender: "female", tag: "Festive Soul", city: "Faridabad", languages: "Hindi / English", ratePerMin: 3, image: companion43, bio: "Every chat with me feels like a celebration 🪔💕" },
  { id: "mansi-f", name: "Mansi", age: 22, gender: "female", tag: "Rooftop Romantic", city: "Delhi", languages: "English / Hindi", ratePerMin: 5, image: companion44, bio: "Sunsets and deep talks on the terrace. You in? 🌇" },
  { id: "kiara-f", name: "Kiara", age: 19, gender: "female", tag: "Sunshine Girl", city: "Noida", languages: "Hindi / English", ratePerMin: 3, image: companion45, bio: "I'll brighten up your boring day, guaranteed ☀️😊" },
];

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

const mNames = [
  "Aarav","Aditya","Ajay","Akash","Aman","Amit","Ankit","Arjun","Arnav","Aryan",
  "Ayush","Deepak","Dev","Dhruv","Gaurav",
];

const mTags = [
  "Gym Bro","Tech Geek","Sports Fan","Music Producer","Entrepreneur","Wanderlust",
  "Poet","Gamer","Foodie King","Adventure Seeker","Bookworm","Night Owl","Fitness Coach",
];

const mBios = [
  "Gym, games, and good conversations — that's my thing 💪",
  "Tech nerd who can also hold a decent conversation. Rare combo ☕",
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

const cities = ["Delhi","Gurugram","Noida","Ghaziabad","Faridabad","Delhi","Gurugram","Noida","Delhi","Ghaziabad","Faridabad","Delhi","Gurugram","Noida","Delhi"];
const langs = ["English / Hindi","Hindi / English","English / Hinglish","Hindi / Punjabi","English / Hindi","Hindi / Hinglish","English / Hindi","Hindi / English","English / Hinglish","Hindi / English","English / Hindi","Hindi / Hinglish","English / Hindi","Hindi / English","English / Hinglish"];
const ages = [18,19,20,21,22,23,24,20,21,19,22,23,18,20,24];

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
  ...femaleProfiles,
  ...generateMale(mNames),
];

export const getCompanionById = (id: string): Companion | undefined =>
  companions.find((c) => c.id === id);
