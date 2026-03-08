import meeraImg from "@/assets/companion-meera.jpg";
import priyaImg from "@/assets/companion-priya.jpg";
import riyaImg from "@/assets/companion-riya.jpg";
import zaraImg from "@/assets/companion-zara.jpg";
import kavyaImg from "@/assets/companion-kavya.jpg";
import nehaImg from "@/assets/companion-neha.jpg";
import aaraImg from "@/assets/companion-aara.jpg";
import sanyaImg from "@/assets/companion-sanya.jpg";

export type Companion = {
  id: string;
  name: string;
  age: number;
  tag: string;
  city: string;
  languages: string;
  ratePerMin: number;
  image: string;
  bio: string;
};

export const companions: Companion[] = [
  {
    id: "meera",
    name: "Meera",
    age: 22,
    tag: "Cheerful & Witty",
    city: "Mumbai",
    languages: "English / Hindi",
    ratePerMin: 5,
    image: meeraImg,
    bio: "Hey! I'm Meera. I love deep conversations and silly jokes equally. Let's vibe! ✨",
  },
  {
    id: "priya",
    name: "Priya",
    age: 24,
    tag: "Confident & Bold",
    city: "Delhi",
    languages: "English / Hinglish",
    ratePerMin: 8,
    image: priyaImg,
    bio: "Life's too short for boring chats. I keep things interesting. Try me 😏",
  },
  {
    id: "riya",
    name: "Riya",
    age: 21,
    tag: "College Buddy",
    city: "Pune",
    languages: "Hindi / Marathi",
    ratePerMin: 5,
    image: riyaImg,
    bio: "Just a chill college girl who loves memes and music. Let's hang out! 🎵",
  },
  {
    id: "zara",
    name: "Zara",
    age: 23,
    tag: "Creative Soul",
    city: "Jaipur",
    languages: "Hindi / English",
    ratePerMin: 5,
    image: zaraImg,
    bio: "Art, poetry, and meaningful conversations — that's my thing 🎨",
  },
  {
    id: "kavya",
    name: "Kavya",
    age: 20,
    tag: "Bookworm",
    city: "Bangalore",
    languages: "English / Kannada",
    ratePerMin: 5,
    image: kavyaImg,
    bio: "If you love books, coffee, and deep talks, we'll get along great 📚",
  },
  {
    id: "neha",
    name: "Neha",
    age: 25,
    tag: "Boss Vibes",
    city: "Hyderabad",
    languages: "English / Telugu",
    ratePerMin: 12,
    image: nehaImg,
    bio: "I run my own business and love meeting interesting people. Impress me 💼",
  },
  {
    id: "aara",
    name: "Aara",
    age: 22,
    tag: "Fitness Freak",
    city: "Chandigarh",
    languages: "Punjabi / Hindi",
    ratePerMin: 5,
    image: aaraImg,
    bio: "Gym, yoga, and good vibes only! Let's motivate each other 💪",
  },
  {
    id: "sanya",
    name: "Sanya",
    age: 26,
    tag: "Free Spirit",
    city: "Goa",
    languages: "English / Hindi",
    ratePerMin: 8,
    image: sanyaImg,
    bio: "Beach lover, sunset chaser, and a great listener. Come say hi 🌊",
  },
];
