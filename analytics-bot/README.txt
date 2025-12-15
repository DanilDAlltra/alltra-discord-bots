# 🎯 Alltraverse Discord Analytics Bot

> Track your Discord server's health and activity with real-time analytics powered by PostHog.

The Analytics Bot captures comprehensive server activity data and sends it to PostHog for advanced analytics, dashboards, and actionable insights. Perfect for community managers, moderators, and server administrators who want to understand their community's behavior patterns.

## 🌟 Key Insights You Can Unlock

- **Server Growth**: Track member joins/leaves and identify growth trends
- **Channel Activity**: Monitor which channels are most active and when
- **User Engagement**: Identify your most active members and engagement patterns
- **Voice Activity**: Track voice channel usage and session durations
- **Community Sentiment**: Analyze reactions and announcement engagement
- **Moderation Patterns**: Monitor warnings, bans, and message deletions
- **Retention Analysis**: Understand user behavior and community health signals

## ⚙️ Core Features

### 📊 Real-Time Analytics Tracking
- **Member Activity**: Joins, leaves, and message patterns
- **Voice Sessions**: Voice channel participation and duration tracking
- **Engagement Metrics**: Reactions, announcements, and channel activity
- **Moderation Actions**: Warnings, bans, and message deletions

### 🛡️ Moderation Tools
- `!warn @user <reason>` command for logging moderation actions
- Automatic tracking of bans and message deletions
- Integration with PostHog for moderation analytics

### 📈 PostHog Integration
- Instant event streaming to PostHog
- Rich event properties for detailed filtering and segmentation
- Ready for dashboards, funnels, and cohort analysis
- Custom queries and real-time insights

## 📡 Events Tracked

The bot captures comprehensive event data across all major Discord activities. Each event includes rich properties for detailed analysis.

### 🧱 Core User Activity

#### `discord_user_joined`
**When**: A member joins the server
**Properties**: `user_id`, `username`, `joined_at`
**Use Cases**: Growth tracking, conversion analysis, spike detection

#### `discord_user_left`
**When**: A member leaves the server
**Properties**: `user_id`, `username`, `left_at`
**Use Cases**: Churn analysis, retention metrics, community health monitoring

#### `discord_message_sent`
**When**: Any non-bot user sends a message
**Properties**: `user_id`, `username`, `channel_id`, `channel_name`, `message_length`, `is_command`
**Use Cases**: Activity patterns, channel engagement, user participation metrics

### 🎯 Engagement & Reactions

#### `discord_message_in_announcements`
**When**: A message is posted in the #announcements channel
**Properties**: Same as `discord_message_sent`
**Use Cases**: Announcement effectiveness, community reach, engagement measurement

#### `discord_reaction_added`
**When**: A user adds a reaction to any message
**Properties**: `user_id`, `username`, `emoji_name`, `emoji_id`, `channel_name`, `message_id`
**Use Cases**: Sentiment analysis, content popularity, passive engagement tracking

### 🎧 Voice Activity

#### `discord_voice_joined`
**When**: A user joins a voice channel
**Properties**: `user_id`, `username`, `guild_id`, `guild_name`, `channel_id`, `channel_name`, `joined_at`
**Use Cases**: Voice channel popularity, participation tracking, session analysis

#### `discord_voice_left`
**When**: A user leaves a voice channel
**Properties**: `user_id`, `username`, `guild_id`, `guild_name`, `channel_id`, `channel_name`, `joined_at`, `left_at`, `session_seconds`
**Use Cases**: Session duration analysis, voice engagement metrics, community activity patterns

### 🛡️ Moderation & Safety

#### `discord_message_deleted_by_mod`
**When**: Any message is deleted (manual or automatic)
**Properties**: `user_id`, `username`, `channel_id`, `channel_name`, `message_id`, `deleted_at`
**Use Cases**: Spam detection, toxic content identification, moderation workload analysis

#### `discord_user_banned`
**When**: A member is banned from the server
**Properties**: `user_id`, `username`, `guild_id`, `guild_name`, `banned_at`
**Use Cases**: Moderation trends, community safety metrics, ban pattern analysis

#### `discord_warning_issued`
**When**: A moderator uses the `!warn` command
**Properties**: `warned_user_id`, `warned_username`, `moderator_id`, `moderator_username`, `reason`, `channel_name`
**Use Cases**: Warning patterns, user behavior tracking, moderation effectiveness analysis

## 🧰 Moderator Commands

### `!warn @user <reason>`
Issue a formal warning that gets logged to PostHog for analytics.

**Usage Example:**
```
!warn @Alltraverse Spamming in general chat
```

**Required Permission:** `ModerateMembers`

**What happens:**
- Logs warning event to PostHog with full context
- Replies with confirmation in Discord
- Enables tracking of moderation patterns and user behavior

## 🏆 Leaderboards & Scoring System

### Automatic Engagement Scoring
The bot automatically tracks and scores user engagement based on message quality:

**Scoring Rules:**
- ✅ **+1 point** for non-spammy messages (10+ characters, not duplicates, not commands)
- ❌ **0 points** for spammy messages (short, duplicate, or rapid-fire messages)

**Anti-Spam Filters:**
- Messages shorter than 10 characters
- Duplicate messages sent in sequence
- Messages sent within 10 seconds of the previous one
- Bot commands (starting with `/` or `!`)

### Live Leaderboards
The bot maintains two real-time leaderboards in a designated channel:

#### 🏅 **Engagement Leaderboard**
- Top 10 users by engagement points
- Shows total points earned from quality messages
- Updated automatically as users participate

#### 🔗 **Referral Leaderboard**
- Top 10 users by successful invites
- Tracks members who joined via their invite links
- Shows total successful referrals

### Weekly Rewards
- **$50 AUD in ALL Coin** for the top Engagement Champion each week
- **$50 AUD in ALL Coin** for the top Referral Champion each week

### Configuration
To enable leaderboards, add these to your `.env` file:
```env
LEADERBOARD_CHANNEL_ID=your_channel_id_here
LEADERBOARD_MESSAGE_ID=your_message_id_here  # Optional: reuse existing message
```

The bot will automatically create and maintain the leaderboard message in the specified channel.

## 📋 Prerequisites

Before setting up the bot, ensure you have:

- **Discord Server**: Administrator or bot management permissions
- **PostHog Account**: Free or paid PostHog instance with API access
- **Node.js**: Version 16.6.0 or higher
- **npm**: For package management

## 🚀 Installation

1. **Clone and navigate to the bot directory:**
   ```bash
   cd analytics-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file** (see Configuration section below)

5. **Start the bot:**
   ```bash
   npm start
   ```

## ⚙️ Configuration

Create a `.env` file in the bot's root directory with the following variables:

```env
# Discord Bot Token (from https://discord.com/developers/applications)
DISCORD_TOKEN=your_discord_bot_token_here

# PostHog Configuration
POSTHOG_API_KEY=your_posthog_api_key
POSTHOG_HOST=https://app.posthog.com  # or your self-hosted URL

# Optional: Limit tracking to specific server
GUILD_ID=your_server_id_here
```

### Getting Your Discord Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing one
3. Navigate to "Bot" section
4. Copy the token from "Token" field

### Required Discord Permissions

The bot needs these intents enabled in your Discord application:
- Server Members Intent
- Message Content Intent
- Guild Messages
- Guild Message Reactions
- Guild Moderation
- Guild Voice States

### Getting PostHog API Key

1. Log into your PostHog instance
2. Go to Project Settings → Project Variables
3. Copy your Project API Key

## 📊 PostHog Dashboard Setup

### Example Queries & Insights

**Daily Active Users:**
```sql
SELECT count(distinct user_id) as daily_users
FROM events
WHERE event = 'discord_message_sent'
  AND timestamp >= today()
  AND timestamp < tomorrow()
```

**Top Channels by Activity:**
```sql
SELECT properties.channel_name, count(*) as messages
FROM events
WHERE event = 'discord_message_sent'
GROUP BY properties.channel_name
ORDER BY messages DESC
```

**Voice Channel Usage:**
```sql
SELECT
  properties.channel_name,
  sum(properties.session_seconds) / 3600 as hours_used
FROM events
WHERE event = 'discord_voice_left'
GROUP BY properties.channel_name
ORDER BY hours_used DESC
```

**Moderation Trends:**
```sql
SELECT
  dateTrunc(timestamp, 'week') as week,
  count(*) as warnings
FROM events
WHERE event = 'discord_warning_issued'
GROUP BY week
ORDER BY week DESC
```

## 🔧 Troubleshooting

### Bot Not Responding to Commands
- Check bot has `ModerateMembers` permission
- Ensure bot is online and connected to your server
- Verify the command format: `!warn @user reason`

### Events Not Appearing in PostHog
- Verify `POSTHOG_API_KEY` is correct
- Check `POSTHOG_HOST` URL is accessible
- Ensure bot has necessary Discord intents enabled
- Check server logs for PostHog connection errors

### High Memory Usage
- Consider limiting to specific guild with `GUILD_ID`
- Monitor voice session tracking for large servers
- Bot automatically cleans up old voice sessions

### Permission Errors
- Bot needs these Discord permissions:
  - View Channels
  - Read Message History
  - Moderate Members (for !warn command)
- Ensure bot role is above roles it needs to moderate

## 📈 Usage Tips for Staff

### Daily Monitoring
- Check unusual spikes in joins/leaves
- Monitor voice channel activity patterns
- Review moderation action frequency

### Weekly Analysis
- Identify most active channels and users
- Analyze announcement engagement rates
- Review warning patterns and reasons

### Monthly Insights
- Track server growth trends
- Analyze user retention patterns
- Review moderation workload and effectiveness

## 🤝 Contributing

Found a bug or want to add new tracking features? Feel free to submit issues or pull requests to improve the analytics bot.