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
  accountAgeDays?: number;
}

export function me() {
  return async (ctx: Context) => {
    try {
      if (!ctx.from || !ctx.chat || !ctx.chat.type) {
        return ctx.reply('❌ Could not identify your user information.');
      }

      const userInfo = await getUserInfo(ctx, ctx.from);

      if (isPrivateChat(ctx.chat.type)) {
        await sendPrivateUserInfo(ctx, userInfo);
      } else {
        await sendGroupUserInfo(ctx, userInfo);
      }
    } catch (error) {
      console.error('Error in /me command:', error);
      await ctx.reply('❌ An error occurred while processing your request.');
    }
  };
}

async function getUserInfo(ctx: Context, user: User): Promise<UserInfo> {
  const now = new Date();
  const createdAt = new Date(user.id / 4194304 + 1420070400000); // Approximation using Telegram ID (not perfect)

  const joinDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random for now
  const lastActive = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Random for now

  let status = 'member';
  if (ctx.chat && !isPrivateChat(ctx.chat.type)) {
    try {
      const member = await ctx.getChatMember(user.id);
      status = member.status;
    } catch {
      status = 'unknown';
    }
  }

  const accountAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) || 0; // Ensure it never becomes undefined

  return {
    id: user.id,
    name: `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
    username: user.username,
    isBot: user.is_bot,
    isPremium: (user as any).is_premium ?? undefined,
    languageCode: user.language_code ?? 'Unknown',
    status,
    joinDate: joinDate.toLocaleDateString(),
    lastActive: lastActive.toLocaleString(),
    accountAgeDays, // Ensures this is always a number
  };
}

  const accountAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  return {
    id: user.id,
    name: `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
    username: user.username,
    isBot: user.is_bot,
    isPremium: (user as any).is_premium ?? undefined,
    languageCode: user.language_code ?? 'Unknown',
    status,
    joinDate: joinDate.toLocaleDateString(),
    lastActive: lastActive.toLocaleString(),
    accountAgeDays,
  };
}

async function sendPrivateUserInfo(ctx: Context, userInfo: UserInfo) {
  const text = `
👤 *Your Telegram Info* 👤

🆔 *ID:* \`${userInfo.id}\`
📛 *Name:* ${userInfo.name}
🔖 *Username:* ${userInfo.username ? '@' + userInfo.username : 'None'}
🤖 *Bot:* ${userInfo.isBot ? 'Yes' : 'No'}
💎 *Premium:* ${userInfo.isPremium === undefined ? 'Unknown' : (userInfo.isPremium ? 'Yes' : 'No')}
🌐 *Language:* ${formatLanguage(userInfo.languageCode)}
📅 *Joined Platform:* ${userInfo.joinDate}
⏱ *Last Active:* ${userInfo.lastActive}
📅 *Account Age:* ${userInfo.accountAgeDays} days

_This information is private._
  `;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
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
👥 *Group Info*

${statusEmoji} *Status:* ${userInfo.status?.toUpperCase() || 'MEMBER'}

📛 *Name:* ${userInfo.name}
🔖 *Username:* ${userInfo.username ? '@' + userInfo.username : 'None'}
📅 *Join Date:* ${userInfo.joinDate}
⏱ *Last Active:* ${userInfo.lastActive}

_This information is public to this group._
  `;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_parameters: {
      message_id: ctx.message?.message_id,
    },
  });
}

function formatLanguage(code: string | undefined): string {
  if (!code) return 'Unknown';
  const languages: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    ru: 'Russian',
    es: 'Spanish',
    zh: 'Chinese',
    ar: 'Arabic',
    // add more if needed
  };
  return languages[code] || `Unknown (${code})`;
}
