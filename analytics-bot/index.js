import 'dotenv/config'
import { Client, GatewayIntentBits, Partials, Events } from 'discord.js'
import { PostHog } from 'posthog-node'

// ----- Config from .env -----
const {
  DISCORD_TOKEN,
  POSTHOG_API_KEY,
  POSTHOG_HOST,
  GUILD_ID
} = process.env

if (!DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN missing in .env')
  process.exit(1)
}
if (!POSTHOG_API_KEY) {
  console.error('❌ POSTHOG_API_KEY missing in .env')
  process.exit(1)
}

// ----- PostHog client -----
const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST || 'https://app.posthog.com'
})

function trackDiscordEvent(eventName, distinctId, properties = {}) {
  posthog.capture({
    distinctId: distinctId?.toString() || 'unknown',
    event: eventName,
    properties
  })
}

// ----- Discord client -----
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates // 🎧 voice events
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
})

// Simple helper to check if we should track for this guild
function isTrackedGuild(guild) {
  if (!GUILD_ID) return true
  return guild && guild.id === GUILD_ID
}

// Track current voice sessions: key = guildId-userId, value = { channelId, joinedAt }
const voiceSessions = new Map()
function makeVoiceKey(guildId, userId) {
  return `${guildId}-${userId}`
}

// Prefix for basic mod commands like !warn
const MOD_COMMAND_PREFIX = '!'

// ----- Bot ready -----
client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`)
})

// 🧱 A. CORE USER ACTIVITY

// 1) User joined
client.on(Events.GuildMemberAdd, (member) => {
  if (!isTrackedGuild(member.guild)) return

  const user = member.user
  trackDiscordEvent('discord_user_joined', user.id, {
    user_id: user.id,
    username: `${user.username}#${user.discriminator}`,
    joined_at: member.joinedAt?.toISOString() || new Date().toISOString()
    // invite_code: null // you can implement invite tracking later
  })

  console.log(`👋 User joined: ${user.tag}`)
})

// 2) User left
client.on(Events.GuildMemberRemove, (member) => {
  if (!isTrackedGuild(member.guild)) return

  const user = member.user
  trackDiscordEvent('discord_user_left', user.id, {
    user_id: user.id,
    username: `${user.username}#${user.discriminator}`,
    left_at: new Date().toISOString()
  })

  console.log(`👋 User left: ${user.tag}`)
})

// 3) Message sent (core)
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages (including this bot)
  if (message.author.bot) return
  if (!message.guild) return
  if (!isTrackedGuild(message.guild)) return

  const isCommand =
    message.content.startsWith('/') ||
    message.content.startsWith(MOD_COMMAND_PREFIX)

  const baseProperties = {
    user_id: message.author.id,
    username: `${message.author.username}#${message.author.discriminator}`,
    channel_id: message.channel.id,
    channel_name: message.channel.name,
    message_id: message.id,
    message_length: message.content.length,
    is_command: isCommand
  }

  // A) Core activity: any message
  trackDiscordEvent('discord_message_sent', message.author.id, baseProperties)

  // B) Engagement with announcements
  if (message.channel.name === 'announcements') {
    trackDiscordEvent(
      'discord_message_in_announcements',
      message.author.id,
      baseProperties
    )
  }

  // E) Mod / safety – basic "!warn" command to log warnings
  if (
    message.content.startsWith(`${MOD_COMMAND_PREFIX}warn`) &&
    message.member?.permissions.has('ModerateMembers')
  ) {
    // Format: !warn @user reason here
    const mentionedUser = message.mentions.users.first()
    const [, , ...reasonParts] = message.content.split(' ')
    const reason = reasonParts.join(' ') || 'No reason provided'

    if (!mentionedUser) {
      await message.reply(
        'Please mention a user to warn. Example: `!warn @user Spamming`'
      )
      return
    }

    trackDiscordEvent('discord_warning_issued', mentionedUser.id, {
      warned_user_id: mentionedUser.id,
      warned_username: `${mentionedUser.username}#${mentionedUser.discriminator}`,
      moderator_id: message.author.id,
      moderator_username: `${message.author.username}#${message.author.discriminator}`,
      channel_id: message.channel.id,
      channel_name: message.channel.name,
      reason
    })

    await message.reply(
      `⚠️ Warning logged for <@${mentionedUser.id}>. Reason: ${reason}`
    )

    console.log(
      `⚠️ Warning issued to ${mentionedUser.tag} by ${message.author.tag}: ${reason}`
    )
  }
})

// 🎯 B. REACTIONS & ANNOUNCEMENTS

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    if (reaction.partial) {
      await reaction.fetch()
    }
  } catch (err) {
    console.error('Error fetching partial reaction:', err)
    return
  }

  if (user.bot) return
  if (!reaction.message.guild) return
  if (!isTrackedGuild(reaction.message.guild)) return

  const props = {
    user_id: user.id,
    username: `${user.username}#${user.discriminator}`,
    emoji_name: reaction.emoji.name,
    emoji_id: reaction.emoji.id,
    channel_id: reaction.message.channel.id,
    channel_name: reaction.message.channel.name,
    message_id: reaction.message.id
  }

  // Generic reaction event
  trackDiscordEvent('discord_reaction_added', user.id, props)

  console.log(
    `😊 Reaction added by ${user.tag}: ${reaction.emoji.name} in #${reaction.message.channel.name}`
  )
})

// 🛡️ E. MOD / SAFETY SIGNALS

// 1) Message deleted (we treat as "deleted_by_mod" proxy)
// Note: Discord does NOT tell us WHO deleted the message in this event.
// This will log all non-bot message deletions.
client.on(Events.MessageDelete, async (message) => {
  if (!message.guild) return
  if (!isTrackedGuild(message.guild)) return

  // Ignore if the original author was a bot
  if (message.author?.bot) return

  trackDiscordEvent(
    'discord_message_deleted_by_mod',
    message.author?.id || 'unknown',
    {
      user_id: message.author?.id || 'unknown',
      username: message.author
        ? `${message.author.username}#${message.author.discriminator}`
        : 'unknown',
      channel_id: message.channel.id,
      channel_name: message.channel.name,
      message_id: message.id,
      // We can't reliably know who deleted it – could be user or mod.
      deleted_at: new Date().toISOString()
    }
  )

  console.log(
    `🗑️ Message deleted in #${message.channel.name} (author: ${message.author?.tag || 'unknown'})`
  )
})

// 2) User banned (mod action)
client.on(Events.GuildBanAdd, (ban) => {
  const guild = ban.guild
  const user = ban.user

  if (!isTrackedGuild(guild)) return

  trackDiscordEvent('discord_user_banned', user.id, {
    user_id: user.id,
    username: `${user.username}#${user.discriminator}`,
    guild_id: guild.id,
    guild_name: guild.name,
    // reason is only available via audit logs; could be added later
    banned_at: new Date().toISOString()
  })

  console.log(`🚫 User banned: ${user.tag} in ${guild.name}`)
})

// 🎧 VOICE ACTIVITY TRACKING
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  const guild = newState.guild || oldState.guild
  if (!guild || !isTrackedGuild(guild)) return

  const user = newState.member?.user || oldState.member?.user
  if (!user || user.bot) return

  const oldChannel = oldState.channel
  const newChannel = newState.channel

  const key = makeVoiceKey(guild.id, user.id)

  // CASE 1: Joined a voice channel (was in none, now in one)
  if (!oldChannel && newChannel) {
    const joinedAt = new Date()

    voiceSessions.set(key, {
      channelId: newChannel.id,
      joinedAt
    })

    trackDiscordEvent('discord_voice_joined', user.id, {
      user_id: user.id,
      username: `${user.username}#${user.discriminator}`,
      guild_id: guild.id,
      guild_name: guild.name,
      channel_id: newChannel.id,
      channel_name: newChannel.name,
      joined_at: joinedAt.toISOString()
    })

    console.log(
      `🎧 ${user.tag} joined voice: #${newChannel.name} in ${guild.name}`
    )
    return
  }

  // CASE 2: Left voice completely (was in one, now in none)
  if (oldChannel && !newChannel) {
    const session = voiceSessions.get(key)
    const leftAt = new Date()

    const joinedAt = session?.joinedAt || new Date(leftAt.getTime())
    const sessionSeconds = Math.max(
      0,
      Math.round((leftAt - joinedAt) / 1000)
    )

    trackDiscordEvent('discord_voice_left', user.id, {
      user_id: user.id,
      username: `${user.username}#${user.discriminator}`,
      guild_id: guild.id,
      guild_name: guild.name,
      channel_id: oldChannel.id,
      channel_name: oldChannel.name,
      joined_at: joinedAt.toISOString(),
      left_at: leftAt.toISOString(),
      session_seconds: sessionSeconds
    })

    voiceSessions.delete(key)

    console.log(
      `🎧 ${user.tag} left voice: #${oldChannel.name} after ${sessionSeconds}s`
    )
    return
  }

  // CASE 3: Switched channels (old & new are different)
  if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
    const now = new Date()
    const session = voiceSessions.get(key)
    const joinedAt = session?.joinedAt || now
    const sessionSeconds = Math.max(
      0,
      Math.round((now - joinedAt) / 1000)
    )

    // Close old session
    trackDiscordEvent('discord_voice_left', user.id, {
      user_id: user.id,
      username: `${user.username}#${user.discriminator}`,
      guild_id: guild.id,
      guild_name: guild.name,
      channel_id: oldChannel.id,
      channel_name: oldChannel.name,
      joined_at: joinedAt.toISOString(),
      left_at: now.toISOString(),
      session_seconds: sessionSeconds
    })

    // Start new session
    voiceSessions.set(key, {
      channelId: newChannel.id,
      joinedAt: now
    })

    trackDiscordEvent('discord_voice_joined', user.id, {
      user_id: user.id,
      username: `${user.username}#${user.discriminator}`,
      guild_id: guild.id,
      guild_name: guild.name,
      channel_id: newChannel.id,
      channel_name: newChannel.name,
      joined_at: now.toISOString()
    })

    console.log(
      `🎧 ${user.tag} switched voice: #${oldChannel.name} → #${newChannel.name} (${sessionSeconds}s in old channel)`
    )
  }
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down…')
  posthog.shutdown()
  client.destroy()
  process.exit(0)
})

// Login
client.login(DISCORD_TOKEN)
