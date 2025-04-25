import { Context } from 'telegraf';
import { User } from 'telegraf/typings/core/types/typegram';
import { isPrivateChat } from '../utils/groupSettings';

interface UserInfo {
  id: number;
  name: string;
  username?: string;
  isBot?: boolean;
  isPremium?: boolean;
  languageCode?: string;
  status?: string;
  joinDate?: string;
  lastActive?: string;
}

export function me() {
  return async (ctx: Context) => {
    try {
      if (!ctx.from) {
        return ctx.reply('Could not identify your user information.');
      }

      // Get user info
      const userInfo = await getUserInfo(ctx, ctx.from);

      if (isPrivateChat(ctx.chat?.type)) {
        // Private chat format
        await sendPrivateUserInfo(ctx, userInfo);
      } else {
        // Group chat format
        await sendGroupUserInfo(ctx, userInfo);
      }
    } catch (error) {
      console.error('Error in me command:', error);
      await ctx.reply('An error occurred while processing your request.');
    }
  };
}

async function getUserInfo(ctx: Context, user: User): Promise<UserInfo> {
  const now = new Date();
  const joinDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random join date (for demo)
  const lastActive = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Random last active (for demo)

  // Get user status in groups (if in a group)
  let status = 'member';
  if (!isPrivateChat(ctx.chat?.type)) {
    try {
      const member = await ctx.getChatMember(user.id);
      status = member.status;
    } catch {
      status = 'unknown';
    }
  }

  return {
    id: user.id,
    name: `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
    username: user.username,
    isBot: user.is_bot,
    isPremium: 'is_premium' in user ? user.is_premium : undefined,
    languageCode: user.language_code,
    status,
    joinDate: joinDate.toLocaleDateString(),
    lastActive: lastActive.toLocaleString(),
  };
}

async function sendPrivateUserInfo(ctx: Context, userInfo: UserInfo) {
  const text = `
👤 *Your Information* 👤

🆔 *ID:* \`${userInfo.id}\`
📛 *Name:* ${userInfo.name}
🔖 *Username:* ${userInfo.username ? '@' + userInfo.username : 'None'}
🤖 *Bot:* ${userInfo.isBot ? 'Yes' : 'No'}
💎 *Premium:* ${userInfo.isPremium ? 'Yes' : 'No' || 'Unknown'}
🌐 *Language:* ${userInfo.languageCode || 'Unknown'}
📅 *Join Date:* ${userInfo.joinDate}
⏱ *Last Active:* ${userInfo.lastActive}

_This information is only visible to you._
  `;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Refresh', callback_data: 'refresh_user_info' }],
      ],
    },
  });
}

async function sendGroupUserInfo(ctx: Context, userInfo: UserInfo) {
  const statusEmoji = {
    creator: '👑',
    administrator: '🛡',
    member: '👤',
    restricted: '⏳',
    left: '🚪',
    kicked: '❌',
    unknown: '❓',
  }[userInfo.status || 'unknown'];

  const text = `
👤 Your Information 👤

{statusEmoji} ${userInfo.status?.toUpperCase() || 'MEMBER'} ${statusEmoji}

📛 Name: ${userInfo.name}
🔖 Username: ${userInfo.username ? '@' + userInfo.username : 'None'}
📅 Join Date: ${userInfo.joinDate}

This information is visible to everyone in the group.
  `;

  await ctx.replyWithHTML(text, {
    reply_to_message_id: ctx.message?.message_id,
  });
}

// Handle refresh button
export function handleUserInfoRefresh() {
  return async (ctx: Context) => {
    try {
      await ctx.answerCbQuery();
      if (!ctx.from) return;
      const userInfo = await getUserInfo(ctx, ctx.from);
      await sendPrivateUserInfo(ctx, userInfo);
    } catch (error) {
      console.error('Error refreshing user info:', error);
      await ctx.answerCbQuery('Error refreshing', true);
    }
  };
}
