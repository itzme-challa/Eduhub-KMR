import { Context } from 'telegraf';
import createDebug from 'debug';

import { name } from '../../package.json';

const debug = createDebug('bot:neet_command');

// Function to send a markdown-formatted message
const genericResponse = async (ctx: Context, message: string) => {
  await ctx.replyWithMarkdownV2(message);
};

// The NEET command to send resources and available commands
const neet = () => async (ctx: Context) => {
  const message = 
`*${name} NEET Resources*

1\\. For NEET quizzes, use the command: \`/quizzes\`

2\\. Join Test Series from:
  • Akash
  • Allen
  • Physics Wallah
  • Modules and more  
  [Access Test Series Here](https://test-series.pages.dev/)

3\\. Join NEET study groups: \`/groups\`

4\\. To list all available commands: \`/list\`
`;

  debug(`Triggered "neet" command with message \n${message}`);

  await genericResponse(ctx, message);
};

export { neet };
