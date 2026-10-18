export type Screen =
  | "home"
  | "verify"
  | "quiz"
  | "matches"
  | "landlord-entry"
  | "landlord-dashboard"

import type { QuizSection } from "./lib/quiz"

export type Question = {
  eyebrow: string
  title: string
  hint: string
  /**
   * Presentation grouping for the quiz aside (`quiz-section-note`), reusing
   * the section vocabulary of lib/quiz.ts — the full 20-question engine that
   * is NOT wired into the app yet (see README F2). It is chrome only: nothing
   * scores, filters or stores this field.
   */
  section?: QuizSection
  options: { title: string; detail?: string; tone?: string }[]
}

export const heroImage =
  "https://images.unsplash.com/photo-1562755484-8225ee5215ae?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1600"

export const questions: Question[] = [
  {
    eyebrow: "Home rhythms",
    title: "Your week has been full-on. What does home look like tonight?",
    hint: "Choose the evening that feels most restorative to you.",
    section: "lifestyle",
    options: [
      {
        title: "A quiet night in",
        detail: "Tea, headphones, and an early reset.",
      },
      {
        title: "Cooking together",
        detail: "A shared meal and a good catch-up.",
      },
      {
        title: "Friends are welcome",
        detail: "A relaxed, social flat with some energy.",
      },
      {
        title: "It changes every week",
        detail: "I like to keep things spontaneous.",
      },
    ],
  },
  {
    eyebrow: "Social energy",
    title:
      "You’re on a three-hour train ride. Which seat do you instinctively take?",
    hint: "There is no right answer — go with your first instinct.",
    section: "lifestyle",
    options: [
      {
        title: "Next to a quiet reader",
        detail: "Company without the pressure to chat.",
      },
      {
        title: "A fully empty row",
        detail: "Space to spread out and recharge.",
      },
      {
        title: "Near a lively group",
        detail: "The journey is better with conversation.",
      },
      {
        title: "Whichever has the view",
        detail: "My environment matters most.",
      },
    ],
  },
  {
    eyebrow: "Conflict style",
    title:
      "Your flatmate accidentally breaks something sentimental. What comes first?",
    hint: "Pick the response closest to your genuine first thought.",
    section: "lifestyle",
    options: [
      {
        title: "Let’s find a practical fix",
        detail: "Work out what can be repaired or replaced.",
      },
      {
        title: "Make sure they’re okay",
        detail: "The relationship matters more than the object.",
      },
      {
        title: "Take some time first",
        detail: "I prefer to process before talking it through.",
      },
      {
        title: "Set a clear boundary",
        detail: "Name what happened so it does not repeat.",
      },
    ],
  },
  {
    eyebrow: "Daily routine",
    title: "Which household rhythm feels most like yours?",
    hint: "Think about an ordinary weekday rather than your ideal one.",
    section: "lifestyle",
    options: [
      { title: "Early bird", detail: "Up early, winding down by 11." },
      { title: "Night owl", detail: "Most productive after sunset." },
      {
        title: "A flexible middle",
        detail: "My routine shifts with my schedule.",
      },
      {
        title: "Quiet hours matter most",
        detail: "Any routine works if we respect each other.",
      },
    ],
  },
  {
    eyebrow: "Personality",
    title:
      "Scientists named a new colour after your personality. Which swatch is yours?",
    hint: "Choose the one that feels instinctively like you.",
    section: "thinking",
    options: [
      { title: "Warm glowing terracotta", tone: "#c96b48" },
      { title: "Crisp, cool sky blue", tone: "#8eafc2" },
      { title: "Bright, sunny chartreuse", tone: "#b4db13" },
      { title: "Deep, muted midnight navy", tone: "#202944" },
    ],
  },
  {
    eyebrow: "Shared space",
    title: "How do you prefer to handle kitchen supplies?",
    hint: "This helps prevent the tiny frictions that add up over time.",
    section: "lifestyle",
    options: [
      { title: "Everything shared", detail: "No labels needed." },
      {
        title: "Shared basics only",
        detail: "Oil, spices, and household staples.",
      },
      { title: "Mostly personal", detail: "Label what is yours." },
      { title: "Fully separate", detail: "I prefer not to share food items." },
    ],
  },
  {
    eyebrow: "Match preferences",
    title: "Who would you feel comfortable sharing a home with?",
    hint: "You can update this privately in your profile at any time.",
    section: "nonneg",
    options: [
      { title: "Anyone", detail: "Compatibility matters most to me." },
      { title: "Women only" },
      { title: "Men only" },
      { title: "Same gender as me" },
    ],
  },
]

export const matches = [
  {
    name: "Michelle Ho",
    school: "CUHK · Year 2",
    score: 94,
    image:
      "https://images.unsplash.com/photo-1688354807300-449aba9c78cb?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Same sleep schedule", "Tidy shared spaces"],
    area: "Sha Tin",
    budget: "$6.5–8K",
  },
  {
    name: "Ryan Liu",
    school: "HKBU · Year 3",
    score: 91,
    image:
      "https://images.unsplash.com/photo-1660412625493-0c8266edddb8?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Calm communicator", "Shared basics"],
    area: "Kowloon Tong",
    budget: "$7–9K",
  },
  {
    name: "Natalie Chow",
    school: "HKU · Year 2",
    score: 88,
    image:
      "https://images.unsplash.com/photo-1688354805578-af85ea68127d?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Same social energy", "Quiet weekdays"],
    area: "Kennedy Town",
    budget: "$8–10K",
  },
  {
    name: "Avery Lam",
    school: "PolyU · Year 3",
    score: 87,
    image:
      "https://images.unsplash.com/photo-1621274790572-7c32596bc67f?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Early riser", "Calm shared home"],
    area: "Hung Hom",
    budget: "$6–8K",
  },
  {
    name: "Jason Tang",
    school: "CityU · Year 2",
    score: 86,
    image:
      "https://images.unsplash.com/photo-1544168190-79c17527004f?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Shared cooking", "Direct communicator"],
    area: "Kowloon Tong",
    budget: "$7–9K",
  },
  {
    name: "Sophie Leung",
    school: "HKUST · Year 2",
    score: 84,
    image:
      "https://images.unsplash.com/photo-1607529379169-5804750c1f9a?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Quiet evenings", "Flexible routine"],
    area: "Tseung Kwan O",
    budget: "$6.5–8.5K",
  },
  {
    name: "Marcus Yip",
    school: "EdUHK · Year 4",
    score: 82,
    image:
      "https://images.unsplash.com/photo-1565016941625-2bee25d37f72?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Tidy shared spaces", "Social weekends"],
    area: "Tai Po",
    budget: "$5.5–7K",
  },
  {
    name: "Chloe Wong",
    school: "LingU · Year 3",
    score: 81,
    image:
      "https://images.unsplash.com/photo-1619431667975-e93b820cde63?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Shared basics", "Quiet weekdays"],
    area: "Tuen Mun",
    budget: "$5–7K",
  },
  {
    name: "Ethan Chan",
    school: "HKU · Year 1",
    score: 79,
    image:
      "https://images.unsplash.com/photo-1657830638749-aa27415f9a43?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Night owl", "Calm communicator"],
    area: "Sai Ying Pun",
    budget: "$8–10K",
  },
  {
    name: "Yuki Lau",
    school: "CUHK · Year 4",
    score: 78,
    image:
      "https://images.unsplash.com/photo-1657155275125-4ce23e9cec63?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400",
    tags: ["Same social energy", "Shared cooking"],
    area: "Tai Wai",
    budget: "$6–8K",
  },
]

export const flatTitles = [
  "Sunlit two-bedroom near MTR",
  "Quiet flat with harbour light",
  "Warm, compact student home",
  "Renovated walk-up by the park",
  "Two-bedroom with study nook",
  "Bright corner flat near campus",
  "Calm home above the market",
  "Modern flat with open kitchen",
  "High-floor home with city view",
  "Cosy two-bedroom on a quiet lane",
  "Student-ready flat beside MTR",
  "Airy home with separate bedrooms",
  "Minimal flat near waterfront",
  "Freshly renovated shared home",
  "Practical flat with large windows",
  "Two-bedroom near university shuttle",
  "Compact home with clever storage",
  "Peaceful flat close to green space",
  "Sunny home in a student neighbourhood",
  "Furnished two-bedroom with workspace",
  "Value flat with fast campus commute",
  "Bright bedrooms and shared lounge",
  "Move-in ready home near local shops",
  "Comfortable flat on a quiet street",
  "Open-plan student home near rail",
]

export const flatAreas = [
  "Sha Tin",
  "Kennedy Town",
  "Kowloon Tong",
  "Tai Wai",
  "Hung Hom",
  "Sai Ying Pun",
  "Tai Po",
  "Tseung Kwan O",
  "Mong Kok",
  "Tuen Mun",
]

export const flatImages = [
  "photo-1738168246881-40f35f8aba0a",
  "photo-1668566398322-6bbc9be03736",
  "photo-1556593825-c11de986cb0b",
  "photo-1761123141836-3b3221dac3e5",
  "photo-1779785689520-bf24ef13aa71",
  "photo-1774311237295-a65a4c1ff38a",
  "photo-1759691555010-7f3f8674d2f2",
]

export const flats = flatTitles.map((title, index) => {
  const area = flatAreas[index % flatAreas.length]
  const squareFeet = 410 + ((index * 37) % 190)
  const price = 12800 + ((index * 850) % 7200)
  return {
    id: index + 1,
    title,
    area,
    price: `$${price.toLocaleString("en-US")}`,
    mapPrice: `$${(price / 1000).toFixed(1)}k`,
    details: `2 beds · 1 bath · ${squareFeet} sq ft`,
    commute: `${6 + ((index * 3) % 17)} min to campus`,
    image: `https://images.unsplash.com/${flatImages[index % flatImages.length]}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900&h=620`,
    x: 10 + ((index * 29) % 78),
    y: 12 + ((index * 17) % 72),
    rating: (4.6 + (index % 4) / 10).toFixed(1),
  }
})

export const roomViews = [
  {
    name: "Living room",
    dimensions: "4.2 × 3.6 m",
    image:
      "https://images.unsplash.com/photo-1631049035227-57752420e957?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1800",
  },
  {
    name: "Main bedroom",
    dimensions: "3.1 × 2.8 m",
    image:
      "https://images.unsplash.com/photo-1779785689520-bf24ef13aa71?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1500",
  },
  {
    name: "Second bedroom",
    dimensions: "2.9 × 2.7 m",
    image:
      "https://images.unsplash.com/photo-1791138961286-a9f5845171e4?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1500",
  },
  {
    name: "Kitchen",
    dimensions: "2.8 × 1.9 m",
    image:
      "https://images.unsplash.com/photo-1762811003338-aef30274513b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1800",
  },
]