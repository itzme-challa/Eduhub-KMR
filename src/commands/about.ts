import { Context } from 'telegraf';
import createDebug from 'debug';

import { author, name, version } from '../../package.json';

const debug = createDebug('bot:about_command');

const about = () => async (ctx: Context) => {
  const message = `*${name} ${version}*\n\nAuthor: ${author}\n\n` +
    `This bot is designed to provide helpful resources and tools for students preparing for NEET, JEE, and other competitive exams. ` +
    `It includes a variety of study materials, practice tests, study groups, and more.\n\n` +
    `Features include:\n` +
    `- Access to study materials for NEET and JEE\n` +
    `- Practice tests for NEET and JEE\n` +
    `- Links to study groups for peer interaction\n` +
    `- NCERT solutions and other helpful resources`;

  debug(`Triggered "about" command with message \n${message}`);

  // Send the message with additional details about the bot
  await ctx.replyWithMarkdownV2(message, { parse_mode: 'Markdown' });
};

export { about };
