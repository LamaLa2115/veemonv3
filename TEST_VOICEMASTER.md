# Voicemaster System Test Guide

## Quick Test Steps:

1. **Create a test voice channel** in your Discord server named: 
   - "Join to Create" 
   - "Create Channel"
   - "J2C"
   - Or any channel with both "join" and "create" in the name

2. **Join that voice channel** - you should automatically:
   - Get moved to a new voice channel named "[Your Name]'s Channel"
   - Receive a control panel message in a text channel
   - Have full permissions to manage your temporary channel

3. **Leave the channel** when empty - it should automatically delete itself

## Debugging:

If it doesn't work, check the console logs for:
- "Detected join-to-create channel: [channel name]" 
- "✅ Created voicemaster channel: [name] for [user]"
- Any error messages starting with "❌"

## Alternative Test:

Use `/voicemaster setup` command to configure a specific channel, then test with that channel.

## Expected Behavior:

- Temporary voice channels get created with your name
- You get moved automatically to your new channel
- Control panel with buttons appears in text channel
- Empty temp channels delete themselves automatically