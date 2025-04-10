import { Context } from 'telegraf';

const isAdmin = async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  if (!chatId || !userId) return false;
  const admins = await ctx.telegram.getChatAdministrators(chatId);
  return admins.some((admin) => admin.user.id === userId);
};

const getTargetUserId = (ctx: Context) => {
  if (ctx.message?.reply_to_message) {
    return ctx.message.reply_to_message.from?.id;
  }

  const username = ctx.message?.text?.split(' ')[1]?.replace('@', '');
  if (!username) return null;
  return ctx.telegram.getChat(ctx.chat?.id!).then(async (chat) => {
    const members = await ctx.telegram.getChatAdministrators(chat.id);
    const user = members.find((m) => m.user.username?.toLowerCase() === username.toLowerCase());
    return user?.user.id || null;
  });
};

// --- BAN ---
export const banUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only group admins can use this command.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('User not found.');

  try {
    await ctx.telegram.kickChatMember(ctx.chat!.id, userId);
    await ctx.reply(`✅ User banned.`);
  } catch (e) {
    console.error(e);
    await ctx.reply('❌ Failed to ban user.');
  }
};

// --- UNBAN ---
export const unbanUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only group admins can use this command.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('User not found.');

  try {
    await ctx.telegram.unbanChatMember(ctx.chat!.id, userId);
    await ctx.reply('✅ User unbanned.');
  } catch (e) {
    console.error(e);
    await ctx.reply('❌ Failed to unban user.');
  }
};

// --- MUTE ---
export const muteUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only group admins can use this command.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('User not found.');

  try {
    await ctx.telegram.restrictChatMember(ctx.chat!.id, userId, {
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false,
    });
    await ctx.reply('🔇 User muted.');
  } catch (e) {
    console.error(e);
    await ctx.reply('❌ Failed to mute user.');
  }
};

// --- UNMUTE ---
export const unmuteUser = () => async (ctx: Context) => {
  if (!await isAdmin(ctx)) return ctx.reply('❌ Only group admins can use this command.');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('User not found.');

  try {
    await ctx.telegram.restrictChatMember(ctx.chat!.id, userId, {
      can_send_messages: true,
      can_send_media_messages: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
    });
    await ctx.reply('🔊 User unmuted.');
  } catch (e) {
    console.error(e);
    await ctx.reply('❌ Failed to unmute user.');
  }
};
