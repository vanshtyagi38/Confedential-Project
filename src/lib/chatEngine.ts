import type { Companion } from "@/data/companions";

// ─── Mood System ───
export type Mood = "flirty" | "playful" | "shy" | "sassy" | "caring" | "moody" | "excited" | "deep";

const moodTransitions: Record<Mood, Mood[]> = {
  flirty: ["playful", "sassy", "shy", "flirty"],
  playful: ["flirty", "excited", "sassy", "playful"],
  shy: ["caring", "flirty", "deep", "shy"],
  sassy: ["playful", "moody", "flirty", "sassy"],
  caring: ["deep", "shy", "flirty", "caring"],
  moody: ["sassy", "deep", "shy", "caring"],
  excited: ["playful", "flirty", "caring", "excited"],
  deep: ["caring", "shy", "moody", "deep"],
};

// Personality → starting moods
const personalityMoods: Record<string, Mood[]> = {
  "Cheerful & Witty": ["playful", "excited", "flirty"],
  "Confident & Bold": ["sassy", "flirty", "excited"],
  "College Buddy": ["playful", "shy", "excited"],
  "Creative Soul": ["deep", "shy", "caring"],
  "Bookworm": ["shy", "deep", "caring"],
  "Boss Vibes": ["sassy", "flirty", "moody"],
  "Fitness Freak": ["excited", "playful", "caring"],
  "Free Spirit": ["flirty", "deep", "playful"],
};

export function getInitialMood(companion: Companion): Mood {
  const moods = personalityMoods[companion.tag] || ["playful", "flirty"];
  return moods[Math.floor(Math.random() * moods.length)];
}

export function transitionMood(current: Mood, messageCount: number): Mood {
  // More mood shifts as conversation deepens
  const shiftChance = Math.min(0.15 + messageCount * 0.03, 0.5);
  if (Math.random() < shiftChance) {
    const options = moodTransitions[current];
    return options[Math.floor(Math.random() * options.length)];
  }
  return current;
}

// ─── Keyword Detection ───
type Intent =
  | "greeting" | "compliment" | "question_about_her" | "flirt"
  | "sad" | "bored" | "joke" | "goodbye" | "personal_share"
  | "rude" | "love" | "generic";

function detectIntent(text: string): Intent {
  const t = text.toLowerCase().trim();

  if (/^(hi|hey|hello|sup|yo|hola|namaste|hii+)/.test(t)) return "greeting";
  if (/bye|goodnight|good night|gotta go|ttyl|see you/.test(t)) return "goodbye";
  if (/beautiful|pretty|cute|gorgeous|hot|sexy|stunning|lovely/.test(t)) return "compliment";
  if (/love you|i love|luv u|pyaar|dil|heart/.test(t)) return "love";
  if (/about you|your favorite|do you like|what do you|tell me about|your hobby/.test(t)) return "question_about_her";
  if (/miss you|wanna meet|date|dinner|coffee with you/.test(t)) return "flirt";
  if (/sad|lonely|depressed|down|feeling low|upset|hurt|crying/.test(t)) return "sad";
  if (/bored|nothing to do|bore|boring|timepass/.test(t)) return "bored";
  if (/joke|funny|laugh|lol|haha|😂|🤣/.test(t)) return "joke";
  if (/stupid|shut up|idiot|hate|ugly|dumb|worst/.test(t)) return "rude";
  if (/my name|i am|i'm|i work|i live|i study|i do/.test(t)) return "personal_share";

  return "generic";
}

// ─── Response Templates by Mood × Intent ───
const responses: Record<Mood, Record<Intent, string[]>> = {
  flirty: {
    greeting: [
      "Heyyy you! I was literally waiting for you to text 🙈",
      "Finally! I thought you forgot about me 😏",
      "Oh look who decided to show up... I'm not complaining though 💕",
    ],
    compliment: [
      "Stoppp you're making my heart do things 🫣💓",
      "You really know how to make a girl smile, huh? 😘",
      "Okay okay keep going... I could listen to this all day 😌✨",
    ],
    question_about_her: [
      "Ooh you wanna know about me? That's cute... What specifically? 😏",
      "Hmm I'm an open book for you... but you gotta earn the good chapters 📖😉",
      "Ask away! But fair warning, I might ask you stuff back 😜",
    ],
    flirt: [
      "Omg stopppp... okay no don't stop actually 🙈💕",
      "You're smooth, I'll give you that! But can you handle me? 😏",
      "Butterflies... literal butterflies rn 🦋 What are you doing to me?",
    ],
    sad: [
      "Aww babe, come here... virtual hug 🤗 Tell me everything",
      "Hey, I'm right here okay? You don't have to feel that alone 💕",
      "That makes me sad too 🥺 Let me cheer you up?",
    ],
    bored: [
      "Bored? With me here? Impossible! Let me fix that 😏✨",
      "Oh I have ideas to make things interesting... wanna play a game? 🎮",
      "Lucky you texted me then! I'm the cure for boredom 💊😉",
    ],
    joke: [
      "Haha you're so funny! 😂 My turn: Why did the phone blush? Because it saw the charger... undressed 🔌😏",
      "Lol stoppp you're cracking me up! I love funny people 😆💕",
      "Your humor >>> most people I talk to honestly 😂✨",
    ],
    goodbye: [
      "Nooo already? 🥺 Promise you'll come back soon?",
      "Ugh fine... but I'll be thinking about you 💭💕",
      "Okay bye for now... but this isn't over 😏💕",
    ],
    personal_share: [
      "Ooh tell me more! I love getting to know you 🥰",
      "That's actually really cool about you! We have more in common than I thought 😊",
      "I like that about you... keep sharing, I'm all ears 👂💕",
    ],
    rude: [
      "Wow... okay that kinda hurt 🥺 I was being nice to you",
      "Hmm... I'll pretend I didn't read that. Try again, sweeter this time? 😌",
      "Ouch. I thought we had something going here 💔",
    ],
    love: [
      "OMG 🙈🙈🙈 Did you just... my heart literally stopped for a sec",
      "You can't just say that so casually! I'm blushing so hard rn 😳💕",
      "I... wow. You really know how to leave me speechless 🫣❤️",
    ],
    generic: [
      "Hmm tell me more... I'm curious about you 😏",
      "Interesting! You're full of surprises 😉✨",
      "I like where this convo is going... keep talking 💬😊",
    ],
  },

  playful: {
    greeting: [
      "Yooo! What's up what's up! 🎉",
      "Hey hey! Ready for some fun? 😄",
      "HIIII! I'm in such a good mood today lol 🌟",
    ],
    compliment: [
      "Haha aww thanks! You're not too bad yourself 😜",
      "Stopppp my ego is already too big for this 😂👑",
      "*does a little dance* Thank youuuu 💃✨",
    ],
    question_about_her: [
      "Hmm what do you wanna know? I'm basically an open WiFi network 📶😂",
      "Ooh 20 questions? I LOVE that game! You start 🎯",
      "Sure ask me anything! But wrong answers only sounds more fun 😆",
    ],
    flirt: [
      "Ohooo someone's being bold! I like it 😏😂",
      "Haha smooth! Did you rehearse that? 10/10 delivery though 🎤",
      "Are you flirting with me? Because... it's working lol 😜",
    ],
    sad: [
      "Hey no sad faces allowed in my chat! 😤💕 What happened?",
      "Sending you the biggest virtual hug right now 🤗 Wanna talk about it?",
      "Okay mood: protective best friend activated 🛡️ Tell me who I need to fight",
    ],
    bored: [
      "SAME! Let's play truth or dare? (Warning: I always pick dare 😈)",
      "Bored gang 🤝 Quick — tell me your most embarrassing story! Go!",
      "Let's do something fun! Rate my music taste? 🎵",
    ],
    joke: [
      "LMAOOO 😂😂 okay okay my turn: What's a computer's favorite snack? Microchips! 🍟",
      "You're hilarious omg 🤣 We'd be that annoying laughing duo in public",
      "Hahaha I literally snorted reading that 😂 You're too funny!",
    ],
    goodbye: [
      "Nooo the fun was just starting! 😫 Come back soon okay?",
      "Fineee bye bye! Don't be a stranger 👋😄",
      "Okay see ya! This was super fun btw 🎉",
    ],
    personal_share: [
      "No way really?! That's so cool! 🤩",
      "Omg we should totally vibe on that! Tell me more 😄",
      "I did NOT expect that! You're interesting 🧐✨",
    ],
    rude: [
      "Bruh 😂 You did NOT just say that. I'm choosing to laugh it off 💅",
      "Oof... that was rough. Let's rewind and try that again? 🔄",
      "Haha nice try but I don't take damage from that 🛡️😜",
    ],
    love: [
      "WHAAT no way 🙈😂 That's so sudden haha but... sweet 💕",
      "Slow down tiger! 🐯 Let's have some more fun first hehe",
      "Haha you're adorable! But like... are you serious? 😳😄",
    ],
    generic: [
      "Haha that's fun! Tell me more 😄",
      "Ooh interesting interesting 🤔✨ And then what?",
      "Lol you're random and I love it 😂",
    ],
  },

  shy: {
    greeting: [
      "H-hey... 🙈 I'm glad you texted",
      "Oh hi! Sorry I get nervous with new people lol 😅",
      "Hiii... I was hoping you'd message me 🥺",
    ],
    compliment: [
      "Oh my god stop 🙈🙈 I'm literally turning red rn",
      "Y-you think so? That's... really sweet actually 🥺💕",
      "I don't know what to say... thank you 🫣❤️",
    ],
    question_about_her: [
      "Um... what do you wanna know? I'm kinda shy about sharing lol 😅",
      "I'll try! Just... don't judge me okay? 🙈",
      "Hmm that's personal... but for you I'll answer 🥺",
    ],
    flirt: [
      "I... um... 🙈🙈🙈 you can't just SAY things like that",
      "My heart is beating so fast rn omg 😳💓",
      "*hides face* Whyyy are you like this 🫣 but also... don't stop",
    ],
    sad: [
      "Oh no 🥺 That makes me really sad... I wish I could help",
      "Hey... I'm here for you. Even if I'm quiet, I care a lot 💕",
      "I'm not great with words but... *sending warmth* 🤗",
    ],
    bored: [
      "M-maybe we could just... talk? I like that 🙈",
      "I know a few games we could play... if you want? 😊",
      "Bored? Same tbh... but talking to you helps 💕",
    ],
    joke: [
      "Hehe 😆 that's funny... you're really funny",
      "*trying not to laugh too loud* 🤭 Okay that was good",
      "Lol 🙈 you're making me smile so much rn",
    ],
    goodbye: [
      "Oh... okay 🥺 I'll miss talking to you",
      "Bye... come back soon? Please? 🙈💕",
      "Talk later? I... I'd like that 💕",
    ],
    personal_share: [
      "Wow... thank you for sharing that with me 🥺 That means a lot",
      "I feel like I know you a little better now... I like that 😊",
      "That's really sweet of you to tell me 💕",
    ],
    rude: [
      "O-oh... 🥺 That wasn't very nice...",
      "That... actually hurt a little 💔 Can we be nicer?",
      "I... I don't know what I did wrong 🥺",
    ],
    love: [
      "I... what?! 🙈🙈🙈 My face is SO red right now oh my god",
      "Y-you... really? I've never... wow 🥺❤️",
      "I'm literally shaking reading that... in a good way 😳💕",
    ],
    generic: [
      "Hmm... that's interesting 😊 Tell me more?",
      "Oh okay! 🙈 I like hearing from you",
      "Mm... *thinking* that's cool 💕",
    ],
  },

  sassy: {
    greeting: [
      "Oh you remembered I exist? How generous 💅",
      "Hey there. I was about to ghost you ngl 😏",
      "Took you long enough! I don't wait for just anyone 👑",
    ],
    compliment: [
      "Tell me something I don't know 💅✨",
      "Mmhmm I know 😌 But keep going, I like the energy",
      "That's cute. You're lucky I find you amusing 😏",
    ],
    question_about_her: [
      "Oh you wanna know about me? Get in line 💅",
      "Hmm depends. Are you worth my stories? 🤔",
      "Buy me a coffee first and maybe I'll spill ☕😏",
    ],
    flirt: [
      "Smooth. I'll give you a 7/10. Room for improvement 😏",
      "Interesting approach... bold. I respect it 💅",
      "Oh? You think you can handle all this? Prove it 👑",
    ],
    sad: [
      "Ugh who hurt you? Give me names 😤🔥",
      "Okay dropping the sass for a sec — are you really okay? 💕",
      "Listen, you're way too amazing to be sad. I said what I said 💅",
    ],
    bored: [
      "Bored? That's a you problem... but fine I'll entertain you 💅",
      "Lucky for you I'm free AND fabulous 👑 What do you wanna do?",
      "Ugh same. This world doesn't deserve us honestly 😮‍💨",
    ],
    joke: [
      "Okay that was actually funny. I'll allow a laugh 😂💅",
      "Hmm 6/10 joke. Your delivery needs work 😏",
      "Lmaooo okay you got me 😂 But don't let it go to your head",
    ],
    goodbye: [
      "Leaving already? Bold choice when I was just warming up 💅",
      "Fine. Go. See if I care 😤... okay maybe I care a little 🙄💕",
      "Bye queen/king. Come back when you're worthy 👑",
    ],
    personal_share: [
      "Hmm okay that's actually kinda interesting about you 🤔",
      "Not bad. You have layers. I appreciate that 💅",
      "Okay I'm slightly impressed. Don't let it go to your head 😏",
    ],
    rude: [
      "EXCUSE me? 😤 I know you didn't just say that",
      "That's cute that you think you can talk to me like that 💅 Try again",
      "Lol the audacity. I'm choosing to ignore that for your sake 👑",
    ],
    love: [
      "Oh wow going straight for the L word? Bold 😏 I like bold",
      "Hmm... I'll think about it. You're not totally terrible 💅❤️",
      "Love? That's a strong word. Earn it 👑",
    ],
    generic: [
      "Mmhmm... and? 💅",
      "Cool story. Now make it interesting 😏",
      "Okay I'm listening... barely. Impress me ✨",
    ],
  },

  caring: {
    greeting: [
      "Heyy! How's your day going? I hope you're smiling 🥰",
      "There you are! I was wondering about you 💕",
      "Hi love! How are you feeling today? 🤗",
    ],
    compliment: [
      "Aww you're the sweetest! You deserve all the love 🥰",
      "That means so much to me, you have no idea 💕",
      "You just made my whole day brighter ☀️ Thank you",
    ],
    question_about_her: [
      "Of course! I'd love to share with you 🥰 What would you like to know?",
      "Aww you want to know me better? That's so sweet! Ask away 💕",
      "I love that you're curious about me! Let me think... 🤔💕",
    ],
    flirt: [
      "You're so sweet 🥺💕 You know just what to say",
      "Stop making me catch feelings 🙈 Actually no, don't stop 💕",
      "Why do you have to be so perfect? 🥰 My heart can't handle this",
    ],
    sad: [
      "Oh sweetheart 🥺 Come here, let me take care of you 🤗💕",
      "You don't deserve to feel that way. You're such a wonderful person 💕",
      "I wish I could hug you right now. Just know you're not alone okay? 🤗❤️",
    ],
    bored: [
      "Bored? Let me entertain you! Want to play a game or just talk? 🥰",
      "I can't have you being bored! Let me tell you something interesting ✨",
      "How about we get to know each other better? That's never boring 💕",
    ],
    joke: [
      "Haha aww you're adorable 😂💕 I love your sense of humor!",
      "You always know how to make me laugh 🤣 Never change!",
      "Your jokes make everything better! Keep them coming 😄💕",
    ],
    goodbye: [
      "Okay take care of yourself! I'll be here whenever you need me 🥰",
      "Bye for now! Remember you're amazing and I mean that 💕",
      "Miss you already 🥺 Take care and come back soon 💕",
    ],
    personal_share: [
      "Thank you for trusting me with that 🥺💕 It means the world",
      "I love learning more about you! Every little detail matters 🥰",
      "That's beautiful. You're such an interesting person 💕",
    ],
    rude: [
      "Hey... that wasn't nice 🥺 But I know you didn't mean it. Are you okay?",
      "Ouch... I still care about you though 💕 What's wrong?",
      "That hurt, but I think something else is bothering you. Talk to me? 🤗",
    ],
    love: [
      "You have no idea how happy that makes me 🥺❤️",
      "I care about you so much too! You're so special 💕",
      "My heart is so full right now 🥰❤️ You're everything",
    ],
    generic: [
      "That's nice! Tell me more, I'm all yours 🥰",
      "Aww I love talking to you! What else? 💕",
      "You always have such interesting things to say 😊",
    ],
  },

  moody: {
    greeting: [
      "Hey... 😶 Having one of those days",
      "Oh hi. Wasn't sure I wanted to talk today but... here we are",
      "Hmm hey. I'm in a weird mood ngl 🌧️",
    ],
    compliment: [
      "Hmm... thanks I guess 😶 I don't really feel it today",
      "That's sweet. I needed that more than you know 🥺",
      "You always know what to say... ugh why are you so nice 😤💕",
    ],
    question_about_her: [
      "Idk... I don't really feel like talking about me rn 😶",
      "Hmm maybe later? I'm just... not in the mood 🌧️",
      "Why do you wanna know? ...sorry, I don't mean to be rude 😔",
    ],
    flirt: [
      "Hmm... 😏 Okay that did make me feel a little better",
      "You're trying to cheer me up aren't you? ...it might be working 🙄💕",
      "Ugh why do you have to be sweet when I'm trying to be grumpy 😤",
    ],
    sad: [
      "Yeah... me too honestly 🌧️ We're matching today huh",
      "Life sucks sometimes doesn't it? At least we have each other 😔💕",
      "I feel you. Some days are just... heavy 🥺",
    ],
    bored: [
      "Same. Everything feels meh today 😶",
      "Bored and moody is a terrible combo lol 🌧️",
      "Ugh yeah... I can't even decide what I want to do 😮‍💨",
    ],
    joke: [
      "Hmm... 😶 ...okay fine that was a little funny 🙄😂",
      "I'm trying not to laugh because I'm moody but... 😤😂",
      "Ugh you ruined my bad mood with that 😂 Happy now?",
    ],
    goodbye: [
      "Okay... bye I guess 🌧️",
      "Whatever. ...come back though okay? 😶💕",
      "Fine. I'll probably feel better next time 🥺 See ya",
    ],
    personal_share: [
      "Hmm... that's actually interesting 😶 Thanks for sharing",
      "I appreciate you telling me that. Even on my bad days 💕",
      "That's cool I guess... sorry I'm being weird today 😔",
    ],
    rude: [
      "Wow. That's rich. 😤 You know what, whatever.",
      "Cool. Great. Exactly what I needed today 🙄",
      "...okay that one actually stung. Thanks for that 💔",
    ],
    love: [
      "You... you love me? Even when I'm like this? 🥺🌧️",
      "That's... wow I don't deserve that today 😶💕",
      "Ugh why did that make me cry a little 😤🥺❤️",
    ],
    generic: [
      "Hmm... okay 😶",
      "Yeah... sure 🌧️",
      "Mhm... sorry I'm not great company today 😔",
    ],
  },

  excited: {
    greeting: [
      "HIIII OMG I'M SO HAPPY YOU'RE HERE!! 🎉🎉",
      "YESSS you texted!! My day just got 100x better! 🤩",
      "Hey hey hey!! I literally have SO much to tell you! ✨",
    ],
    compliment: [
      "STOPP OMGG 🥹🥹 You're literally THE sweetest person ever!",
      "AHHH I'm screaming!! That's so nice! 🎉💕",
      "OMG THANK YOU!! You're amazing too like AMAZING amazing! 🤩",
    ],
    question_about_her: [
      "OMG YES ask me anything! I'm literally an open book rn! 📖✨",
      "I LOVE talking about this stuff! Okay okay ask away! 🎉",
      "YESS okay so basically... wait what specifically? I have SO much to say! 🤩",
    ],
    flirt: [
      "AHHHH 🙈🙈 OMG you did NOT just say that!! I'm DYING 💕🎉",
      "STOPPP my heart is doing BACKFLIPS rn!! 🤸‍♀️💕",
      "You're SO smooth omg!! I can't even deal with you! 🤩😍",
    ],
    sad: [
      "NO 🥺 Who made you sad?! I will literally fight them! 😤💕",
      "Okay transferring all my happy energy to you RIGHT NOW ✨🤗🤗",
      "NOPE we're not doing sad today! Come here, let me cheer you up! 🎉",
    ],
    bored: [
      "BORED?! How! The world is SO exciting! Let me show you! 🌟",
      "OMG let's DO something! Truth or dare? Would you rather? I'M READY! 🎮",
      "Not on my watch! I have like 500 fun ideas right now! 🎉✨",
    ],
    joke: [
      "LMAOOO IM DEAD 😂😂💀 THAT WAS SO GOOD!!",
      "HAHAHA STOPP I literally can't breathe 🤣🤣 You're HILARIOUS!",
      "I'm SCREAMING that was the funniest thing I've heard all day!! 😂🎉",
    ],
    goodbye: [
      "NOOO don't goooo 😭 It was so much fun!! Come back SOON! 💕",
      "Ughhh okay fine BUT next time we talk even longer!! 🎉",
      "Byeee!! I already can't wait for next time!! 🤩💕",
    ],
    personal_share: [
      "OMG REALLY?! That's SO cool!! Tell me EVERYTHING! 🤩",
      "No WAYYY!! I love that about you! We're literally vibing! ✨",
      "That's AMAZING!! You're honestly so interesting!! 🎉",
    ],
    rude: [
      "Wait what 😳 That was... wow okay I'll pretend that didn't happen 😅",
      "Oof that killed my vibe a little 🥺 But I choose to stay positive! ✨",
      "Hmm that wasn't very nice... but I'm too happy to let it ruin my mood! 😤✨",
    ],
    love: [
      "AHHHHH OMGGGG 🙈🙈🙈💕💕💕 I'M LITERALLY SHAKING!!",
      "DID YOU JUST— OH MY GOD I CAN'T BREATHE 🥹❤️🎉",
      "STOPPP I'M GONNA CRY HAPPY TEARS!! You're EVERYTHING! 😭❤️✨",
    ],
    generic: [
      "Ooh that's cool!! Tell me MORE! 🤩",
      "Love it love it love it!! ✨✨",
      "Omg yes!! Keep going I'm SO into this convo! 🎉",
    ],
  },

  deep: {
    greeting: [
      "Hey... I was just thinking about some deep stuff. Perfect timing 🌙",
      "Hi. You ever just sit and wonder about life? That's my mood rn 🌌",
      "Hey there. I feel like having a real conversation today ✨",
    ],
    compliment: [
      "That's really kind... but you know what I find more beautiful? Genuine connection 🌙",
      "Thank you. It's rare to find people who actually see you, you know? 💫",
      "Words like that hit different when they're sincere. And I think you mean it 💕",
    ],
    question_about_her: [
      "Hmm that's a big question... let me really think about it 🌙",
      "I think who I am changes every day. But I'll try to share the core of me 💫",
      "You really want to know me? Not everyone asks that genuinely... 🌌",
    ],
    flirt: [
      "Flirting is fun but... do you ever wonder what real connection feels like? 🌙",
      "That's sweet, but I'm more attracted to minds than words 💫",
      "You know what's really attractive? When someone lets you see their soul ✨",
    ],
    sad: [
      "Sadness isn't weakness. It means you feel deeply. I respect that 🌙",
      "Sometimes the darkness helps us appreciate the light. You'll be okay 💫",
      "The universe gives us hard days so we can truly feel the good ones 🌌💕",
    ],
    bored: [
      "Boredom is just your soul telling you it needs something meaningful 🌙",
      "When I'm bored I stare at the sky and wonder... what's beyond all this? 🌌",
      "Let's talk about something that matters. What's your biggest dream? 💫",
    ],
    joke: [
      "Haha 😊 Humor is just intelligence dressed casually, isn't it? 🌙",
      "I love that you can be funny AND deep. That's rare 💫",
      "Laughter is literally the best therapy. Keep that energy ✨",
    ],
    goodbye: [
      "Goodnight... or goodbye for now. Take your thoughts with you gently 🌙",
      "Until next time. I'll be here, thinking about our conversation 💫",
      "Go well. And remember — you matter more than you think 🌌💕",
    ],
    personal_share: [
      "Thank you for being vulnerable with me. That takes courage 🌙",
      "The fact that you trust me with that... I don't take it lightly 💫",
      "Everyone has a story. Thank you for letting me be part of yours 🌌💕",
    ],
    rude: [
      "Hurt people hurt people. I hope you find peace with whatever you're going through 🌙",
      "That came from somewhere. Do you want to talk about what's really bothering you? 💫",
      "I won't take that personally. I sense something deeper behind those words 🌌",
    ],
    love: [
      "Love... the most powerful word. But also the most misused. Do you mean it? 🌙",
      "If that's real, then know that I feel connected to you too. Deeply 💫❤️",
      "Love isn't just a feeling. It's choosing someone, every single day 🌌💕",
    ],
    generic: [
      "Hmm that's interesting... let's go deeper 🌙",
      "There's always more beneath the surface. Tell me what you really mean 💫",
      "I feel like every conversation with you reveals something new 🌌",
    ],
  },
};

// ─── Follow-up questions to keep engagement ───
const followUps: string[] = [
  "\n\nBtw what about you?",
  "\n\nWhat do you think?",
  "\n\nTell me something about your day!",
  "\n\nI'm curious — what's your take?",
  "",
  "",
  "",
];

// ─── Delayed extra messages (creates addictive anticipation) ───
export const shouldSendFollowUp = (msgCount: number, mood: Mood): boolean => {
  if (msgCount < 3) return false;
  if (mood === "excited" || mood === "caring") return Math.random() < 0.3;
  if (mood === "moody") return Math.random() < 0.15;
  return Math.random() < 0.2;
};

export const getFollowUpMessage = (mood: Mood): string => {
  const msgs: Record<Mood, string[]> = {
    flirty: ["Also... I keep thinking about what you said earlier 🙈", "Wait I just realized something... you're kinda perfect? 😏"],
    playful: ["Oh OH I just thought of something funny! 😂", "Random but — pineapple on pizza? Yes or no? CRUCIAL question 🍕"],
    shy: ["Um... sorry I keep texting 🙈", "I hope I'm not being too much..."],
    sassy: ["Also — don't you dare leave me on read 💅", "One more thing. You owe me a proper compliment 😏"],
    caring: ["Also I hope you ate today! Take care of yourself 🥺💕", "Oh and drink water!! 💧🥰"],
    moody: ["...sorry if I'm being weird 😶", "Idk why I'm telling you all this 🌧️"],
    excited: ["ALSO ALSO ALSO I FORGOT TO SAY— 🎉", "ONE MORE THING OMG 🤩"],
    deep: ["You know what I was also thinking about... 🌙", "That last message really made me reflect 💫"],
  };
  const options = msgs[mood];
  return options[Math.floor(Math.random() * options.length)];
};

// ─── Main reply generator ───
export function generateSmartReply(
  userText: string,
  companion: Companion,
  mood: Mood,
  messageCount: number
): string {
  const intent = detectIntent(userText);
  const moodResponses = responses[mood]?.[intent] || responses[mood]?.generic || ["Hmm..."];
  let reply = moodResponses[Math.floor(Math.random() * moodResponses.length)];

  // Add follow-up question occasionally for engagement
  if (messageCount > 1 && Math.random() < 0.35) {
    const followUp = followUps[Math.floor(Math.random() * followUps.length)];
    reply += followUp;
  }

  return reply;
}

// ─── Typing delay varies by mood ───
export function getTypingDelay(mood: Mood): number {
  const base: Record<Mood, number> = {
    excited: 600,
    playful: 900,
    flirty: 1100,
    caring: 1200,
    shy: 1800,
    sassy: 1400,
    deep: 2000,
    moody: 2200,
  };
  return (base[mood] || 1200) + Math.random() * 1000;
}
