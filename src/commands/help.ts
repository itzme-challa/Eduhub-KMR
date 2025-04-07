import { Context } from 'telegraf';
import createDebug from 'debug';

import { name } from '../../package.json';  // Assuming 'name' is already imported from package.json

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

For more support or inquiries, you can contact us at:\n
Email: itzme\\.eduhub\\.contact@gmail\\.com  
Telegram: [@itzfew](https://t.me/itzfew)`;

  debug(`Triggered "help" command with message \n${message}`);
  
  await ctx.replyWithMarkdownV2(message, { parse_mode: 'MarkdownV2' });
};

export { help };
