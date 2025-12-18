# Bible System Documentation

## Overview

The Bible System is a comprehensive persona management solution for DeepAgents. It allows you to define detailed character profiles that AI agents embody when interacting on social media platforms like Twitter.

## 📁 Directory Structure

```
mobile-ai-controller/
├── local/
│   └── bible/                    # Bible JSON files directory
│       ├── README.md             # Bible creation guide
│       ├── alex-chen.json        # Example: Tech developer persona
│       └── sarah-crypto.json     # Example: Crypto trader persona
├── src/
│   ├── types/
│   │   ├── bible.ts              # Bible TypeScript interfaces
│   │   └── index.ts              # Type exports
│   ├── utils/
│   │   ├── bible-loader.ts       # Bible loading & selection utilities
│   │   ├── bible-loader.example.ts  # Usage examples
│   │   ├── prompt-formatter.ts   # Prompt formatting utilities
│   │   └── index.ts              # Utility exports
│   └── prompts/
│       └── agents/
│           ├── deepagents.prompt.ts  # Agent system prompts
│           └── index.ts          # Prompt exports
```

## 🎯 Key Components

### 1. Bible Type Definition (`src/types/bible.ts`)

Defines the complete structure of a Bible:

```typescript
interface Bible {
  id: string;
  name: string;
  version: string;
  description: string;
  persona: {
    fullName: string;
    age?: number;
    location?: string;
    profession?: string;
    bio: string;
  };
  personality: {
    traits: string[];
    communicationStyle: string;
    tone: string;
    emojiUsage?: {...};
    writingPatterns?: string[];
  };
  interests: {
    primary: string[];
    secondary?: string[];
    avoid?: string[];
  };
  behavior: {
    postingFrequency: { min: number; max: number };
    engagementTypes: string[];
    engagementTriggers: string[];
    activeHours?: { start: number; end: number };
  };
  platforms?: {...};
  examples?: {...};
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Bible Loader (`src/utils/bible-loader.ts`)

Provides utilities to load and manage Bibles:

#### Key Functions:

- **`loadAllBibles()`** - Load all Bible files from `local/bible/`
- **`loadBibleById(id)`** - Load a specific Bible by ID
- **`getBibleSummaries()`** - Get list of available Bibles
- **`selectBible()`** - Interactive Bible selector with Inquirer UI
- **`bibleToPromptString(bible)`** - Convert Bible to formatted prompt string

### 3. Prompt Formatter (`src/utils/prompt-formatter.ts`)

Formats agent prompts with device info and Bible data:

#### Key Functions:

- **`formatPromptWithDevice(prompt, deviceInfo, additionalValues)`** - Format prompt with variables
- **`formatMultiplePrompts(prompts, deviceInfo, additionalValues)`** - Format multiple prompts
- **`formatPromptWithDeviceSync()`** - Synchronous version

### 4. Agent Prompts (`src/prompts/agents/deepagents.prompt.ts`)

Contains two main prompts with variable placeholders:

- **`DEEPAGENTS_SYSTEM_PROMPT`** - Main agent controlling the phone
- **`TWITTER_TASK_SUBAGENT_PROMPT`** - Subagent for Twitter action execution

Both prompts support these variables:
- `{id}` - Device ID
- `{name}` - Device name
- `{platform}` - Device platform (iOS/Android)
- `{type}` - Device type
- `{version}` - OS version
- `{state}` - Device state
- `{screenWidth}` - Screen width in pixels
- `{screenHeight}` - Screen height in pixels
- `{bible}` - Formatted Bible string (via additionalValues)
- Any other custom variables passed in `additionalValues`

## 🚀 Usage

### Basic Workflow

```typescript
import {
  selectBible,
  bibleToPromptString,
  formatPromptWithDevice,
} from './utils/index.js';
import { DEEPAGENTS_SYSTEM_PROMPT } from './prompts/agents/index.js';

// Step 1: Interactive Bible selection
const bible = await selectBible();

// Step 2: Get device info (from MCP)
const deviceInfo = {
  id: 'emulator-5554',
  name: 'Pixel 6 Pro',
  platform: 'Android',
  type: 'emulator',
  version: '13.0',
  state: 'device',
  screenWidth: 1440,
  screenHeight: 3120,
};

// Step 3: Convert Bible to string
const bibleString = bibleToPromptString(bible);

// Step 4: Format prompt with device + Bible
const systemPrompt = await formatPromptWithDevice(
  DEEPAGENTS_SYSTEM_PROMPT,
  deviceInfo,
  {
    bible: bibleString,
  }
);

// Step 5: Create agent
const agent = createDeepAgent({
  systemPrompt,
  tools: [...],
  subagents: [...],
});
```

### Interactive Selection UI

When you call `selectBible()`, users see:

```
📖 Available Personas (Bibles):

1. Alex Chen (v1.0.0)
   ID:          alex-chen-dev
   Description: Tech-savvy software engineer passionate about Web3, AI, and developer tools
   Profession:  Software Engineer & Indie Hacker
   Location:    San Francisco, CA
   Interests:   Web3 and blockchain, AI/ML and LLMs, Developer tools (+2 more)

2. Sarah Martinez (v1.0.0)
   ID:          sarah-crypto-trader
   Description: Crypto trader and DeFi enthusiast with a focus on technical analysis
   Profession:  Crypto Trader & DeFi Analyst
   Location:    Miami, FL
   Interests:   Cryptocurrency trading, DeFi protocols, Blockchain technology (+2 more)

? Select a persona to embody: (Use arrow keys)
❯ Alex Chen (v1.0.0) | Software Engineer & Indie Hacker | San Francisco, CA
  Sarah Martinez (v1.0.0) | Crypto Trader & DeFi Analyst | Miami, FL
```

## 📝 Creating a New Bible

### 1. Create JSON File

Create a new file in `local/bible/your-persona.json`:

```json
{
  "id": "unique-id",
  "name": "Your Persona Name",
  "version": "1.0.0",
  "description": "Short description",
  "persona": {
    "fullName": "Full Name",
    "age": 30,
    "location": "City, Country",
    "profession": "Your Profession",
    "bio": "Brief bio"
  },
  "personality": {
    "traits": ["trait1", "trait2"],
    "communicationStyle": "How they communicate",
    "tone": "casual",
    "emojiUsage": {
      "frequency": "sometimes",
      "favorites": ["😊", "🚀"]
    }
  },
  "interests": {
    "primary": ["topic1", "topic2"],
    "avoid": ["topic to avoid"]
  },
  "behavior": {
    "postingFrequency": { "min": 3, "max": 7 },
    "engagementTypes": ["like", "retweet", "reply"],
    "engagementTriggers": ["what triggers engagement"]
  },
  "examples": {
    "tweets": ["example tweet 1", "example tweet 2"],
    "replies": ["example reply 1"]
  },
  "createdAt": "2025-01-14T10:00:00Z",
  "updatedAt": "2025-01-14T10:00:00Z"
}
```

### 2. Test Your Bible

```bash
# Run the example to test loading
npx tsx src/utils/bible-loader.example.ts 3
```

### 3. Use in Agent

Your new Bible will automatically appear in the interactive selector!

## 🔧 Advanced Usage

### Load Multiple Bibles

```typescript
const bibles = await loadAllBibles();
console.log(`Found ${bibles.length} personas`);
```

### Programmatic Selection

```typescript
const bible = await loadBibleById('alex-chen-dev');
```

### Custom Bible Directory

```typescript
const bible = await selectBible('/custom/path/to/bibles');
```

### Format Multiple Prompts at Once

```typescript
const formatted = await formatMultiplePrompts(
  {
    main: DEEPAGENTS_SYSTEM_PROMPT,
    subagent: TWITTER_TASK_SUBAGENT_PROMPT,
  },
  deviceInfo,
  { bible: bibleToPromptString(bible) }
);
```

## 📋 Examples Included

### 1. Alex Chen (`alex-chen.json`)
- **Profile**: 28-year-old software engineer in SF
- **Focus**: Web3, AI, developer tools
- **Style**: Casual, witty, technical but approachable
- **Platform**: Twitter

### 2. Sarah Martinez (`sarah-crypto.json`)
- **Profile**: 32-year-old crypto trader in Miami
- **Focus**: DeFi, trading, technical analysis
- **Style**: Professional, data-driven, community-oriented
- **Platform**: Twitter

## 🎨 Best Practices

### 1. Detail is Key
The more detailed your Bible, the better the agent performs. Include:
- Specific personality traits
- Real example tweets/replies
- Clear writing patterns
- Engagement triggers

### 2. Natural Variation
Include quirks and imperfections:
- Occasional typos
- Casual language
- Varied posting times
- Selective engagement

### 3. Clear Boundaries
Define what to avoid:
- Controversial topics
- Financial/medical advice
- Political extremism
- Scam behaviors

### 4. Test and Iterate
- Start with examples
- Monitor agent behavior
- Refine the Bible
- Update version number

## 🔒 Security & Privacy

### What's Tracked in Git

✅ **Included in Git:**
- Bible structure (README.md)
- Example Bible files (*.json)
- Bible type definitions

❌ **Excluded from Git:**
- Custom/personal Bible files (protected by .gitignore pattern)
- Local data outside examples

### Customizing .gitignore

The `.gitignore` is configured to:
```gitignore
# Track example Bibles
!local/bible/*.json
!local/bible/README.md

# But you can add specific exclusions for private Bibles
local/bible/my-private-persona.json
```

## 🐛 Troubleshooting

### "No Bible files found"
- Ensure `local/bible/` directory exists
- Add at least one `.json` Bible file
- Check file permissions

### "Failed to load Bible"
- Validate JSON syntax
- Ensure required fields are present (id, name, version)
- Check file encoding (should be UTF-8)

### "Selected Bible not found"
- Verify Bible ID matches filename
- Check for typos in ID field
- Ensure file is valid JSON

## 📚 API Reference

See the comprehensive examples:
- `src/utils/bible-loader.example.ts` - Bible loading examples
- `src/utils/prompt-formatter.example.ts` - Prompt formatting examples

Run examples:
```bash
npx tsx src/utils/bible-loader.example.ts [1-6|all]
```

## 🎯 Integration with DeepAgent

The Bible System integrates seamlessly with the DeepAgent:

1. **Bible Selection** → User picks persona
2. **Device Info** → MCP provides device details
3. **Prompt Formatting** → Combines Bible + Device
4. **Agent Creation** → DeepAgent embodies persona
5. **Twitter Control** → Agent acts as the persona

The agent will:
- ✅ Stay in character based on Bible
- ✅ Use the defined communication style
- ✅ Engage with relevant topics
- ✅ Behave authentically and naturally
- ✅ Never reveal it's an AI

---

**Ready to create your own personas!** 🚀
