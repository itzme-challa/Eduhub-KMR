import { Context } from 'telegraf';
import createDebug from 'debug';

import { name } from '../../package.json';

const debug = createDebug('bot:groups_command');

// Function to send a message with group links directly
const groups = () => async (ctx: Context) => {
  const message = `*${name} Study Groups*:
  \n\n
  Following is a list of study groups:

  1. NEET Study Group
  [Link](https://t.me/Neetpw01)

  2. FREE STUDY App Group
  [Link](https://t.me/FREESTUDYApp)

  3. Allen Test Series 2024 Group
  [Link](https://t.me/AllenTest_series2024)

  4. NEET JEE Channel
  [Link](https://t.me/NEETJEECHANNEL)

  5. Akash Test Series Group
  [Link](https://t.me/AkashTest_Series)

  6. NEET UG 2025 Group
  [Link](https://t.me/NEETUG_25)`;

  debug(`Triggered "groups" command with message \n${message}`);

  // Send the message without inline menu
  await ctx.replyWithMarkdownV2(message, { parse_mode: 'Markdown' });
};

export { groups };
