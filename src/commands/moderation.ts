import { Context, User, Message } from 'telegraf';

const warnings: Record<string, number> = {}; // Chat-specific user warnings

// Check if the user is an admin
const isAdmin = async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  if (!chatId || !userId) return false;

  const admins = await ctx.telegram.getChatAdministrators(chatId);
  return admins.some((admin) => admin.user.id === userId);
};

// Safely get the target userId from reply or username
const getTargetUserId = async (ctx: Context): Promise<number | null> => {
  const replyMessage = ctx.message?.reply_to_message;
  if (replyMessage?.from?.id) {
    return replyMessage.from.id;
  }

  const username = ctx.message?.text?.split(' ')[1]?.replace('@', '');
  if (!username) return null;

  try {
    const members = await ctx.telegram.getChatAdministrators(ctx.chat!.id);
    const user = members.find((m) => m.user.username?.toLowerCase() === username.toLowerCase());
    return user?.user.id || null;
  } catch {
    return null;
  }
};

// Get the user tag from a reply message
const getUserTag = (ctx: Context) => {
  const replyMessage = ctx.message?.reply_to_message;
  return replyMessage?.from?.username ? `@${replyMessage.from.username}` : 'User';
};

// ========== Moderation Commands ==========

// Ban user command
export const banUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only admins can ban users.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('❌ User not found.');

  try {
    await ctx.telegram.kickChatMember(ctx.chat!.id, userId);
    await ctx.reply(`✅ ${getUserTag(ctx)} has been *banned*.`, { parse_mode: 'Markdown' });
  } catch {
    ctx.reply('❌ Failed to ban user.');
  }
};

// Unban user command
export const unbanUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only admins can unban users.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('❌ User not found.');

  try {
    await ctx.telegram.unbanChatMember(ctx.chat!.id, userId);
    await ctx.reply(`✅ ${getUserTag(ctx)} has been *unbanned*.`, { parse_mode: 'Markdown' });
  } catch {
    ctx.reply('❌ Failed to unban user.');
  }
};

// Kick user command
export const kickUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only admins can kick users.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('❌ User not found.');

  try {
    await ctx.telegram.kickChatMember(ctx.chat!.id, userId);
    await ctx.telegram.unbanChatMember(ctx.chat!.id, userId); // Ensure they can rejoin
    await ctx.reply(`👢 ${getUserTag(ctx)} was *kicked*.`, { parse_mode: 'Markdown' });
  } catch {
    ctx.reply('❌ Failed to kick user.');
  }
};

// Mute user command
export const muteUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only admins can mute users.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('❌ User not found.');

  try {
    await ctx.telegram.restrictChatMember(ctx.chat!.id, userId, { permissions: { can_send_messages: false } });
    await ctx.reply(`🔇 ${getUserTag(ctx)} has been *muted*.`, { parse_mode: 'Markdown' });
  } catch {
    ctx.reply('❌ Failed to mute user.');
  }
};

// Unmute user command
export const unmuteUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only admins can unmute users.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('❌ User not found.');

  try {
    await ctx.telegram.restrictChatMember(ctx.chat!.id, userId, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
      },
    });
    await ctx.reply(`🔊 ${getUserTag(ctx)} has been *unmuted*.`, { parse_mode: 'Markdown' });
  } catch {
    ctx.reply('❌ Failed to unmute user.');
  }
};

// Warn user command
export const warnUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only admins can warn users.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('❌ User not found.');

  const key = `${ctx.chat!.id}:${userId}`;
  warnings[key] = (warnings[key] || 0) + 1;

  await ctx.reply(`⚠️ ${getUserTag(ctx)} has been warned. Warnings: ${warnings[key]}`);

  if (warnings[key] >= 3) {
    await ctx.telegram.kickChatMember(ctx.chat!.id, userId);
    await ctx.reply(`⛔ ${getUserTag(ctx)} was *banned* after 3 warnings.`);
    delete warnings[key];
  }
};

// Promote user command
export const promoteUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only admins can promote users.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('❌ User not found.');

  try {
    await ctx.telegram.promoteChatMember(ctx.chat!.id, userId, {
      can_change_info: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true,
      can_pin_messages: true,
      can_promote_members: false,
    });
    await ctx.reply(`⭐ ${getUserTag(ctx)} was *promoted to admin*.`, { parse_mode: 'Markdown' });
  } catch {
    ctx.reply('❌ Failed to promote user.');
  }
};

// Demote user command
export const demoteUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only admins can demote users.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('❌ User not found.');

  try {
    await ctx.telegram.promoteChatMember(ctx.chat!.id, userId, {
      can_change_info: false,
      can_delete_messages: false,
      can_invite_users: false,
      can_restrict_members: false,
      can_pin_messages: false,
      can_promote_members: false,
    });
    await ctx.reply(`⚙️ ${getUserTag(ctx)} was *demoted*.`, { parse_mode: 'Markdown' });
  } catch {
    ctx.reply('❌ Failed to demote user.');
  }
};

// User info command
export const userInfo = () => async (ctx: Context) => {
  const user = ctx.message?.reply_to_message?.from;
  if (!user) return ctx.reply('❌ Reply to a user to get their info.');

  const info = `👤 *User Info:*\n` +
               `ID: \`${user.id}\`\n` +
               `Username: @${user.username || 'N/A'}\n` +
               `First Name: ${user.first_name}\n` +
               `Is Bot: ${user.is_bot ? 'Yes' : 'No'}`;

  ctx.reply(info, { parse_mode: 'Markdown' });
};
