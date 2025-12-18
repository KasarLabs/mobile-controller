# Bible Files

This directory contains "Bible" files that define personas for DeepAgents. Each Bible is a comprehensive character description that the AI agent will embody when interacting on social media.

## What is a Bible?

A Bible is a JSON file that defines:
- **Persona**: Who this character is (name, age, profession, bio)
- **Personality**: How they communicate and behave
- **Interests**: What topics they care about and engage with
- **Behavior**: Posting frequency and engagement patterns
- **Examples**: Sample tweets and replies in their voice

## File Structure

Each Bible must follow this naming convention:
```
{persona-name}.json
```

Example: `alex-chen.json`, `sarah-crypto.json`

## Creating a New Bible

1. Copy an existing Bible file as a template
2. Modify all fields to match your new persona
3. Ensure the `id` is unique
4. Update `createdAt` and `updatedAt` timestamps
5. Save with a descriptive filename

## Required Fields

- `id`: Unique identifier
- `name`: Display name
- `version`: Semantic version (e.g., "1.0.0")
- `description`: Short summary
- `persona`: Basic character info
- `personality`: Communication style and traits
- `interests`: Topics to engage with
- `behavior`: Posting patterns
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

## Optional Fields

- `platforms`: Platform-specific settings (Twitter, Instagram, etc.)
- `examples`: Sample content in the persona's voice
- `notes`: Additional context or instructions

## Examples Included

- **alex-chen.json**: Tech-savvy software engineer interested in Web3 and AI
- **sarah-crypto.json**: Crypto trader focused on DeFi and market analysis

## Usage

When running the mobile AI controller, you'll be prompted to select a Bible:

```bash
npm start
# Select a device
# Select a Bible (personas will be listed)
# Agent will embody that persona
```

## Best Practices

1. **Be Specific**: The more detailed the Bible, the better the agent performs
2. **Include Examples**: Sample tweets help establish the voice
3. **Define Boundaries**: Use `avoid` topics to prevent unwanted engagement
4. **Update Regularly**: Refine based on observed behavior
5. **Version Control**: Increment version when making significant changes

## Authenticity

Remember: The goal is to create authentic, human-like behavior. Avoid:
- ❌ Overly perfect or robotic patterns
- ❌ Excessive formality (unless that's the character)
- ❌ Unrealistic consistency
- ✅ Natural variation and occasional mistakes
- ✅ Genuine personality quirks
- ✅ Realistic engagement patterns
