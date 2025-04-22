import { Context } from 'telegraf';
import createDebug from 'debug';

import { name } from '../../package.json';

const debug = createDebug('bot:help_command');

const help = () => async (ctx: Context) => {
  const message = `*${name} Help*\n
Here are the available commands you can use:\n
• /help \\- Get information about bot commands  
• /about \\- Learn more about this bot  
• /groups \\- Get a list of study groups  
• /neet \\- Access resources for NEET  
• /jee \\- Access resources for JEE  
• /study \\- Get study materials for various subjects  
• /gen \logo name\ \\- Generate a custom logo  
• /playbio \\| /playphy \\| /playchem \\- Practice random NEET questions  
• /quote \\- Get a random motivational quote  
• /mute \\| /unmute \\| /ban \\| /unban \\- Group admin moderation commands  
• /me \optional\\: @username or userID\ \\- Show user info  
• /contact \message\ \\- Contact the bot owner directly

For more support or inquiries, you can contact us at:\n
Email: itzme\\.eduhub\\.contact@gmail\\.com  
Telegram: [@itzfew](https://t.me/itzfew)`;

  debug(`Triggered "help" command with message \n${message}`);
  
  await ctx.replyWithMarkdownV2(message);
};

export { help };
