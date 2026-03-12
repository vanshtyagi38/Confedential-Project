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
  slug: string;
  name: string;
  age: number;
  gender: "male" | "female";
  tag: string;
  city: string;
  languages: string;
  ratePerMin: number;
  image: string;
  bio: string;
  isRealUser?: boolean;
  status?: string;
  bannedAt?: string | null;
  ownerUserId?: string | null;
  upiId?: string | null;
  interests?: string;
};

// Map image_key from DB → local Vite asset URL
export const imageKeyMap: Record<string, string> = {
  "companion-01": companion01,
  "companion-02": companion02,
  "companion-03": companion03,
  "companion-04": companion04,
  "companion-05": companion05,
  "companion-06": companion06,
  "companion-07": companion07,
  "companion-08": companion08,
  "companion-09": companion09,
  "companion-10": companion10,
  "companion-11": companion11,
  "companion-12": companion12,
  "companion-13": companion13,
  "companion-14": companion14,
  "companion-15": companion15,
  "companion-16": companion16,
  "companion-17": companion17,
  "companion-18": companion18,
  "companion-19": companion19,
  "companion-20": companion20,
  "companion-21": companion21,
  "companion-22": companion22,
  "companion-23": companion23,
  "companion-24": companion24,
  "companion-25": companion25,
  "companion-26": companion26,
  "companion-27": companion27,
  "companion-28": companion28,
  "companion-29": companion29,
  "companion-30": companion30,
  "companion-31": companion31,
  "companion-32": companion32,
  "companion-33": companion33,
  "companion-34": companion34,
  "companion-35": companion35,
  "companion-36": companion36,
  "companion-37": companion37,
  "companion-38": companion38,
  "companion-39": companion39,
  "companion-40": companion40,
  "companion-41": companion41,
  "companion-42": companion42,
  "companion-43": companion43,
  "companion-44": companion44,
  "companion-45": companion45,
};

// Convert DB row to Companion type
export function dbRowToCompanion(row: any): Companion {
  const imageUrl = row.image_key
    ? imageKeyMap[row.image_key] || row.image_url || ""
    : row.image_url || "";
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    age: row.age,
    gender: row.gender as "male" | "female",
    tag: row.tag || "",
    city: row.city || "Delhi",
    languages: row.languages || "Hindi / English",
    ratePerMin: row.rate_per_min || 3,
    image: imageUrl,
    bio: row.bio || "",
    isRealUser: row.is_real_user || false,
    status: row.status || "active",
    bannedAt: row.banned_at,
    ownerUserId: row.owner_user_id,
    upiId: row.upi_id,
  };
}
