import { Context } from 'telegraf';

export function me() {
  return async (ctx: Context) => {
    const user = ctx.from;
    const chat = ctx.chat;

    if (!user || !chat) {
      return ctx.reply('Unable to fetch your details.');
    }

    const details = `
*Your Telegram Details:*

👤 *First Name:* ${user.first_name}
🧑‍💼 *Last Name:* ${user.last_name || 'N/A'}
📛 *Username:* @${user.username || 'N/A'}
🆔 *User ID:* \`${user.id}\`
💬 *Chat ID:* \`${chat.id}\`
🌐 *Language Code:* ${user.language_code || 'N/A'}
🤖 *Is Bot:* ${user.is_bot ? 'Yes' : 'No'}
    `.trim();

    await ctx.reply(details, { parse_mode: 'Markdown' });
  };
}
