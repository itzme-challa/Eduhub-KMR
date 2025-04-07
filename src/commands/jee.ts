import { Context } from 'telegraf';
import createDebug from 'debug';

import { name } from '../../package.json';

const debug = createDebug('bot:jee_command');

// Function to send a markdown-formatted message
const genericResponse = async (ctx: Context, message: string) => {
  await ctx.replyWithMarkdownV2(message);
};

// The jee command to send resources and available commands
const jee = () => async (ctx: Context) => {
  const message = 
`*${name} jee Resources*

1\\. For jee quizzes, use the command: \`/quizzes\`

2\\. Join Test Series from:
  • Akash
  • Allen
  • Physics Wallah PW
  • Modules and more  
  [Access Test Series Here](https://test-series.pages.dev/)

3\\. Join jee study groups: \`/groups\`

4\\. To list all available commands: \`/list\`
`;

  debug(`Triggered "jee" command with message \n${message}`);

  await genericResponse(ctx, message);
};

export { jee };
