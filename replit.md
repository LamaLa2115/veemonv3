# Overview

This is a Discord bot called "veemon" (also referred to as "bleed-bot" in some files) built with Discord.js v14. The bot is a multi-purpose Discord bot designed to fit all communities with features including moderation, utility commands, fun commands, Last.fm integration, and auto-moderation capabilities. The bot uses a command-based architecture with event handling and includes features like autoroles, welcome messages, moderation logging, and join-to-create voice channels.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## Migration to Replit Environment (August 20, 2025)
- Successfully migrated Discord bot from Replit Agent to standard Replit environment
- Fixed TypeScript configuration and module resolution issues
- Installed all required dependencies including Discord.js v14, Prisma, MongoDB, and utility libraries
- Configured environment secrets for Discord API credentials (DISCORD_TOKEN, CLIENT_ID, OWNER_ID)
- Bot is now running successfully with 24 commands loaded and 3 events configured
- Database connection established and working properly

# Recent Changes

## Migration to Replit Environment (August 20, 2025)
- Successfully migrated Discord bot from Replit Agent to standard Replit environment
- Fixed TypeScript configuration and module resolution issues
- Installed all required dependencies including Discord.js v14, Prisma, MongoDB, and utility libraries
- Configured environment secrets for Discord API credentials (DISCORD_TOKEN, CLIENT_ID, OWNER_ID)
- Bot is now running successfully with 23 commands loaded and 3 events configured
- Database connection established and working properly

# System Architecture

## Core Framework
- **Discord.js v14**: Primary Discord API wrapper for bot functionality
- **Node.js with TypeScript**: Runtime environment with type safety
- **PM2**: Process management for production deployment with auto-restart capabilities

## Database Architecture
- **Multiple Database Solutions**: The bot uses a hybrid approach with multiple database systems
  - **Quick.db**: SQLite-based database for simple key-value storage (guild prefixes, settings)
  - **Prisma**: Modern ORM for structured data management
  - **MongoDB with Mongoose**: Document-based storage for complex data structures
  - **Better-sqlite3**: Direct SQLite access for performance-critical operations

## Command System
- **Modular Command Structure**: Commands organized in category-based folders
- **Dynamic Command Loading**: Automatic command registration using file system scanning
- **Alias Support**: Multiple aliases per command for user convenience
- **Permission Checking**: Role and permission-based command access control

## Event Handling
- **Event-Driven Architecture**: Separate event handlers for different Discord events
- **Guild Events**: Member join/leave, guild join/leave with logging
- **Message Events**: Message deletion, editing, and moderation features
- **Voice Events**: Join-to-create voice channel functionality

## Moderation System
- **Anti-Spam/Anti-Invite**: Automatic message filtering and deletion
- **Altdentifier**: New account detection and automatic actions
- **Moderation Commands**: Ban, kick, jail (timeout), lockdown functionality
- **Logging System**: Comprehensive moderation action logging to designated channels

## Configuration Management
- **Per-Guild Settings**: Customizable prefixes, channels, and feature toggles
- **Environment Variables**: Secure token and API key management
- **JSON Configuration**: Static configuration for colors, emojis, and constants

## Third-Party Integrations
- **Last.fm API**: Music tracking and display functionality
- **Reddit API**: Meme fetching capabilities
- **Google Search**: Image and web search integration
- **App Store Scraper**: iOS app information retrieval
- **Canvas**: Image generation and manipulation

## Utility Features
- **Welcome/Leave Messages**: Customizable member join/leave notifications
- **Autorole System**: Automatic role assignment for new members
- **Snipe Commands**: Message history tracking for deleted/edited messages
- **Emoji Management**: Custom emoji downloading and server integration

## Voice Channel Features
- **Join-to-Create**: Dynamic voice channel creation system
- **Temporary Channels**: Auto-deletion of empty temporary voice channels
- **Channel Management**: Automated cleanup and user management

# External Dependencies

## Discord Integration
- **Discord.js v14**: Core Discord bot framework
- **Discord API Types**: Type definitions for Discord API structures
- **Discord Builders**: Utility for building Discord components

## Database Systems
- **Prisma**: Database ORM with migration support
- **MongoDB/Mongoose**: Document database for complex data structures
- **Quick.db**: Simple SQLite wrapper for key-value storage
- **Better-sqlite3**: High-performance SQLite driver

## API Integrations
- **Last.fm API**: Music service integration for user tracking
- **App Store Scraper**: iOS app information retrieval
- **Google Search**: Web and image search capabilities
- **Reddit API**: Content fetching from subreddits

## Utility Libraries
- **Axios/Node-fetch**: HTTP request handling
- **Canvas**: Server-side image generation and manipulation
- **Moment.js**: Date and time manipulation
- **Twemoji Parser**: Emoji parsing and enlargement
- **Urban Dictionary**: Slang definition lookup

## Development Tools
- **TypeScript**: Type safety and modern JavaScript features
- **TS-Node/TSX**: TypeScript execution and hot reloading
- **PM2**: Production process management
- **Glob**: File pattern matching for command loading

## Specialized Features
- **MS**: Time parsing for moderation timeouts
- **Parse-MS**: Time duration parsing
- **Common-Tags**: Template literal utilities
- **Twitter API**: Social media integration capabilities