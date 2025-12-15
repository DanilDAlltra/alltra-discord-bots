import 'dotenv/config'
import { Client, GatewayIntentBits, Partials, Events } from 'discord.js'
import { PostHog } from 'posthog-node'

// ----- Config from .env -----
const {
  DISCORD_TOKEN,
  POSTHOG_API_KEY,
  POSTHOG_HOST,
  GUILD_ID,
  LEADERBOARD_CHANNEL_ID, // channel where the leaderboard message lives
  LEADERBOARD_MESSAGE_ID // message ID to reuse (so we edit, not repost)
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
    GatewayIntentBits.MessageContent, // 🔥 required for message.content (and in many cases MessageCreate debugging)
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates
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

// Track invite usage so we can see which code was used on join
// guildInvites: key = guildId, value = Map(inviteCode -> uses)
const guildInvites = new Map()

// Track last message per user to detect spammy behaviour
// key = userId, value = { lastMessageAt: number (ms), lastMessageContent: string }
const userMessageState = new Map()

// In-memory engagement + referral scores for Discord leaderboard
const engagementScores = new Map() // key=userId => { score, username }
const referralScores = new Map() // key=userId => { count, username }

// Leaderboard message reference
let leaderboardMessage = null

// Prefix for basic mod commands like !warn
const MOD_COMMAND_PREFIX = '!'

// ----- Helper: Build leaderboard text -----
function buildLeaderboardText() {
  let text = ''
  text += '🏆 **Alltraverse Weekly Leaderboards**\n'
  text +=
    '_(Live community view. Official winners are confirmed using PostHog analytics each week.)_\n\n'

  // Engagement leaderboard
  text += '🔥 **Engagement (non-spammy messages)**\n'
  const engagementTop = [...engagementScores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10)

  if (engagementTop.length === 0) {
    text += '_No engagement data yet._\n'
  } else {
    engagementTop.forEach(([userId, data], index) => {
      text += `${index + 1}. <@${userId}> — **${data.score} pts**\n`
    })
  }

  text += '\n'

  // Referral leaderboard
  text += '🔗 **Referrals (members invited)**\n'
  const referralTop = [...referralScores.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  if (referralTop.length === 0) {
    text += '_No referral data yet._\n'
  } else {
    referralTop.forEach(([userId, data], index) => {
      text += `${index + 1}. <@${userId}> — **${data.count} joins**\n`
    })
  }

  text += '\n'
  text +=
    '🏅 Each week, the top **Engagement Champion** and **Referral Champion** are eligible for **$50 AUD in ALL Coin**.\n'

  return text
}

// ----- Helper: Update leaderboard message -----
async function updateLeaderboardMessage() {
  if (!leaderboardMessage) return
  const content = buildLeaderboardText()
  try {
    await leaderboardMessage.edit(content)
  } catch (err) {
    console.error('Error updating leaderboard message:', err)
  }
}

// ----- Bot ready -----
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`)

  // Preload invite usage for referral tracking
  for (const [, guild] of c.guilds.cache) {
    if (!isTrackedGuild(guild)) continue
    try {
      const invites = await guild.invites.fetch()
      const codeUsesMap = new Map()
      invites.forEach((inv) => {
        codeUsesMap.set(inv.code, inv.uses ?? 0)
      })
      guildInvites.set(guild.id, codeUsesMap)
      console.log(`📨 Loaded ${invites.size} invites for guild ${guild.name}`)
    } catch (err) {
      console.error(`Error fetching invites for guild ${guild.name}:`, err)
    }
  }

  // ✅ Set up leaderboard message (reuse existing message if possible)
  if (LEADERBOARD_CHANNEL_ID) {
    try {
      const channel = await c.channels.fetch(LEADERBOARD_CHANNEL_ID)
      if (channel && channel.isTextBased()) {
        if (LEADERBOARD_MESSAGE_ID) {
          try {
            leaderboardMessage = await channel.messages.fetch(
              LEADERBOARD_MESSAGE_ID
            )
            console.log('📊 Reusing existing leaderboard message.')
          } catch (e) {
            console.warn(
              '⚠️ LEADERBOARD_MESSAGE_ID set but message could not be fetched. Creating a new one...'
            )
            leaderboardMessage = await channel.send('🏆 Loading leaderboards...')
            console.log(
              `👉 Save this in .env as LEADERBOARD_MESSAGE_ID=${leaderboardMessage.id}`
            )
          }
        } else {
          leaderboardMessage = await channel.send('🏆 Loading leaderboards...')
          console.log(
            `👉 Save this in .env as LEADERBOARD_MESSAGE_ID=${leaderboardMessage.id}`
          )
        }

        await updateLeaderboardMessage()
        setInterval(updateLeaderboardMessage, 5 * 60 * 1000)
        console.log('📊 Leaderboard auto-update started (every 5 minutes).')
      } else {
        console.warn(
          '⚠️ LEADERBOARD_CHANNEL_ID is set but channel is not text-based or not found.'
        )
      }
    } catch (err) {
      console.error('Error setting up leaderboard message:', err)
    }
  } else {
    console.log(
      'ℹ️ LEADERBOARD_CHANNEL_ID not set. Skipping Discord leaderboard message setup.'
    )
  }
})

// 🧱 A. CORE USER ACTIVITY

// 1) User joined + referral detection
client.on(Events.GuildMemberAdd, async (member) => {
  if (!isTrackedGuild(member.guild)) return

  const user = member.user

  trackDiscordEvent('discord_user_joined', user.id, {
    user_id: user.id,
    username: `${user.username}#${user.discriminator}`,
    joined_at: member.joinedAt?.toISOString() || new Date().toISOString()
  })

  console.log(`👋 User joined: ${user.tag}`)

  // Referral detection via invite usage diff
  try {
    const guild = member.guild
    const previousInvites = guildInvites.get(guild.id) || new Map()
    const newInvites = await guild.invites.fetch()

    let usedInvite = null

    newInvites.forEach((inv) => {
      const oldUses = previousInvites.get(inv.code) ?? 0
      const newUses = inv.uses ?? 0
      if (newUses > oldUses) usedInvite = inv
    })

    // Update cache with latest counts
    const updatedMap = new Map()
    newInvites.forEach((inv) => updatedMap.set(inv.code, inv.uses ?? 0))
    guildInvites.set(guild.id, updatedMap)

    if (usedInvite && usedInvite.inviter) {
      const inviter = usedInvite.inviter

      trackDiscordEvent('discord_referral_join', inviter.id, {
        inviter_id: inviter.id,
        inviter_username: `${inviter.username}#${inviter.discriminator}`,
        invited_user_id: user.id,
        invited_username: `${user.username}#${user.discriminator}`,
        invite_code: usedInvite.code,
        guild_id: guild.id,
        guild_name: guild.name,
        uses_after_join: usedInvite.uses ?? null
      })

      console.log(
        `🤝 Referral: ${user.tag} joined via invite ${usedInvite.code} from ${inviter.tag}`
      )

      // Update in-memory referral scores
      const prev = referralScores.get(inviter.id) || {
        count: 0,
        username: `${inviter.username}#${inviter.discriminator}`
      }
      prev.count += 1
      prev.username = `${inviter.username}#${inviter.discriminator}`
      referralScores.set(inviter.id, prev)
    } else {
      console.log(
        `🤝 Referral: ${user.tag} joined but no invite diff was detected`
      )
    }
  } catch (err) {
    console.error('Error handling referral on member join:', err)
  }
})

// 1b) Invite created (keep cache in sync + track)
client.on(Events.InviteCreate, (invite) => {
  const guild = invite.guild
  if (!guild || !isTrackedGuild(guild)) return

  const existing = guildInvites.get(guild.id) || new Map()
  existing.set(invite.code, invite.uses ?? 0)
  guildInvites.set(guild.id, existing)

  if (invite.inviter) {
    trackDiscordEvent('discord_referral_invite_created', invite.inviter.id, {
      invite_code: invite.code,
      inviter_id: invite.inviter.id,
      inviter_username: `${invite.inviter.username}#${invite.inviter.discriminator}`,
      guild_id: guild.id,
      guild_name: guild.name,
      max_uses: invite.maxUses ?? null,
      temporary: invite.temporary ?? false
    })
  }

  console.log(
    `🔗 Invite created in ${guild.name}: https://discord.gg/${invite.code} (by ${invite.inviter?.tag || 'unknown'})`
  )
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

// 3) Message sent (core + scored engagement)
client.on(Events.MessageCreate, async (message) => {
  // 🔥 Always log receipt FIRST (this tells us instantly if bot sees messages)
  console.log(
    `📩 MessageCreate fired | author=${message.author?.tag} | guild=${message.guild?.id || 'DM'} | channel=${message.channel?.name}`
  )

  try {
    // Ignore bot messages (including this bot)
    if (message.author?.bot) return
    if (!message.guild) return
    if (!isTrackedGuild(message.guild)) return

    const isCommand =
      message.content.startsWith('/') ||
      message.content.startsWith(MOD_COMMAND_PREFIX)

    // ---------- Anti-spam heuristics ----------
    const now = Date.now()
    const trimmedContent = (message.content || '').trim()
    const trimmedLength = trimmedContent.length

    const lastState = userMessageState.get(message.author.id)
    const timeSinceLastMessageSec = lastState
      ? (now - lastState.lastMessageAt) / 1000
      : null

    const isDuplicateMessage =
      lastState && lastState.lastMessageContent === trimmedContent

    const isShortMessage = trimmedLength < 10

    // update state
    userMessageState.set(message.author.id, {
      lastMessageAt: now,
      lastMessageContent: trimmedContent
    })

    const looksSpammy =
      isCommand ||
      isShortMessage ||
      isDuplicateMessage ||
      (timeSinceLastMessageSec !== null && timeSinceLastMessageSec < 10)

    const baseProperties = {
      user_id: message.author.id,
      username: `${message.author.username}#${message.author.discriminator}`,
      channel_id: message.channel.id,
      channel_name: message.channel.name,
      message_id: message.id,
      message_length: trimmedLength,
      is_command: isCommand,
      time_since_last_message_sec: timeSinceLastMessageSec,
      is_duplicate_message: isDuplicateMessage,
      is_short_message: isShortMessage,
      looks_spammy: looksSpammy
    }

    // A) Core activity: ANY message
    trackDiscordEvent('discord_message_sent', message.author.id, baseProperties)

    // B) Engagement-scored activity
    if (!looksSpammy) {
      trackDiscordEvent('discord_message_scored', message.author.id, {
        ...baseProperties,
        is_scored: true,
        score_value: 1
      })

      const prev = engagementScores.get(message.author.id) || {
        score: 0,
        username: `${message.author.username}#${message.author.discriminator}`
      }
      prev.score += 1
      prev.username = `${message.author.username}#${message.author.discriminator}`
      engagementScores.set(message.author.id, prev)

      console.log(
        `✅ SCORED: ${message.author.tag} +1 (total ${prev.score}) in #${message.channel.name}`
      )
    } else {
      console.log(
        `⛔ NOT SCORED: ${message.author.tag} reason=${
          isCommand
            ? 'command'
            : isShortMessage
            ? 'too_short'
            : isDuplicateMessage
            ? 'duplicate'
            : timeSinceLastMessageSec !== null && timeSinceLastMessageSec < 10
            ? 'too_fast'
            : 'unknown'
        }`
      )
    }

    // C) Engagement with announcements
    if (message.channel?.name === 'announcements') {
      trackDiscordEvent(
        'discord_message_in_announcements',
        message.author.id,
        baseProperties
      )
    }

    // D) Mod / safety – basic "!warn" command
    if (
      message.content.startsWith(`${MOD_COMMAND_PREFIX}warn`) &&
      message.member?.permissions.has('ModerateMembers')
    ) {
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
  } catch (err) {
    console.error('❌ Error inside MessageCreate handler:', err)
  }
})

// 🎯 Reactions
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  try {
    if (reaction.partial) await reaction.fetch()
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

  trackDiscordEvent('discord_reaction_added', user.id, props)

  console.log(
    `😊 Reaction added by ${user.tag}: ${reaction.emoji.name} in #${reaction.message.channel.name}`
  )
})

// 🛡️ Message deleted
client.on(Events.MessageDelete, async (message) => {
  if (!message.guild) return
  if (!isTrackedGuild(message.guild)) return
  if (message.author?.bot) return

  trackDiscordEvent('discord_message_deleted_by_mod', message.author?.id, {
    user_id: message.author?.id || 'unknown',
    username: message.author
      ? `${message.author.username}#${message.author.discriminator}`
      : 'unknown',
    channel_id: message.channel.id,
    channel_name: message.channel.name,
    message_id: message.id,
    deleted_at: new Date().toISOString()
  })

  console.log(
    `🗑️ Message deleted in #${message.channel.name} (author: ${message.author?.tag || 'unknown'})`
  )
})

// 🚫 User banned
client.on(Events.GuildBanAdd, (ban) => {
  const guild = ban.guild
  const user = ban.user
  if (!isTrackedGuild(guild)) return

  trackDiscordEvent('discord_user_banned', user.id, {
    user_id: user.id,
    username: `${user.username}#${user.discriminator}`,
    guild_id: guild.id,
    guild_name: guild.name,
    banned_at: new Date().toISOString()
  })

  console.log(`🚫 User banned: ${user.tag} in ${guild.name}`)
})

// 🎧 Voice activity tracking
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  const guild = newState.guild || oldState.guild
  if (!guild || !isTrackedGuild(guild)) return

  const user = newState.member?.user || oldState.member?.user
  if (!user || user.bot) return

  const oldChannel = oldState.channel
  const newChannel = newState.channel
  const key = makeVoiceKey(guild.id, user.id)

  // Joined
  if (!oldChannel && newChannel) {
    const joinedAt = new Date()
    voiceSessions.set(key, { channelId: newChannel.id, joinedAt })

    trackDiscordEvent('discord_voice_joined', user.id, {
      user_id: user.id,
      username: `${user.username}#${user.discriminator}`,
      guild_id: guild.id,
      guild_name: guild.name,
      channel_id: newChannel.id,
      channel_name: newChannel.name,
      joined_at: joinedAt.toISOString()
    })

    console.log(`🎧 ${user.tag} joined voice: #${newChannel.name}`)
    return
  }

  // Left completely
  if (oldChannel && !newChannel) {
    const session = voiceSessions.get(key)
    const leftAt = new Date()
    const joinedAt = session?.joinedAt || leftAt
    const sessionSeconds = Math.max(0, Math.round((leftAt - joinedAt) / 1000))

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
    console.log(`🎧 ${user.tag} left voice: #${oldChannel.name} (${sessionSeconds}s)`)
    return
  }

  // Switched
  if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
    const now = new Date()
    const session = voiceSessions.get(key)
    const joinedAt = session?.joinedAt || now
    const sessionSeconds = Math.max(0, Math.round((now - joinedAt) / 1000))

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

    voiceSessions.set(key, { channelId: newChannel.id, joinedAt: now })

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
      `🎧 ${user.tag} switched voice: #${oldChannel.name} → #${newChannel.name} (${sessionSeconds}s)`
    )
  }
})

// ----- PM2-safe graceful shutdown -----
const gracefulShutdown = async (signal) => {
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`)
  try {
    await posthog.shutdown()
    await client.destroy()
  } catch (err) {
    console.error('Error during shutdown:', err)
  }
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', () => {}) // ignore SIGINT under PM2

// Login
client.login(DISCORD_TOKEN)
