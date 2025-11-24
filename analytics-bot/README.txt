🧩 Overview

The Alltraverse Discord Analytics Bot tracks key events inside your Discord server and sends them to PostHog for real-time analytics, dashboards, and insights.

The bot helps you understand:

Server growth (joins, leaves)

Channel activity

User engagement

Reactions and sentiments

Moderation activity

Announcement interactions

Top users

Toxicity/spam patterns (via mod actions)

Community health signals

This documentation explains:

Features

Commands (for mods)

Events tracked

Setup (already done)

Dashboard instructions

How staff should use the bot

⚙️ Bot Features

The bot has three major capabilities:

1. Core Analytics Tracking

Tracks all major server activity in real time:

Member joins

Member leaves

Messages sent

Announcements engagement

Reactions added

2. Moderation Signals

Captures mod-related events:

Warnings (!warn)

Message deletions

User bans

3. PostHog Integration

All events are:

Sent to PostHog instantly

Filterable by username, channel, emoji, etc.

Viewable in dashboards

Usable for charts, funnels, retention analysis, etc.

📡 Events the Bot Tracks

Below is the complete list of events the bot captures, including properties.

🧱 A. Core User Activity
1. discord_user_joined

When: A member joins the server
Properties:

user_id

username

joined_at

Why:
Measure growth, track where new members come from, spot spikes.

2. discord_user_left

When: A member leaves
Properties:

user_id

username

left_at

Why:
Monitor churn and retention.

3. discord_message_sent

When: A non-bot user sends a message
Properties:

user_id

username

channel_id

channel_name

message_length

is_command

Why:
Track activity per channel and overall engagement.

🎯 B. Engagement Tracking
4. discord_message_in_announcements

When: A message is posted in #announcements
Properties:
Same as discord_message_sent.

Why:
Understand announcement reach and engagement.

5. discord_reaction_added

When: A user reacts to any message
Properties:

user_id

username

emoji_name

emoji_id

channel_name

message_id

Why:
Gauge sentiment and passive engagement.

🛡️ C. Moderation Events
6. discord_message_deleted_by_mod

When: A message is deleted
Properties:

user_id

username

channel_name

message_id

deleted_at

Why:
Identify toxic channels or spam patterns.

7. discord_user_banned

When: A member is banned
Properties:

user_id

username

guild_id

guild_name

banned_at

Why:
Track moderation actions over time.

8. discord_warning_issued

When: Staff uses !warn
Properties:

warned_user_id

warned_username

moderator_id

moderator_username

reason

channel_name

Why:
View patterns of warnings, track user behavior, analyze moderation load.

🧰 Mod Commands

These are commands available to moderators.

!warn @user <reason>

Logs a warning to PostHog.

Example:

!warn @Alltraverse Spamming in general chat


Bot will:

Reply with confirmation

Log an event in PostHog

Permission required:
ModerateMembers