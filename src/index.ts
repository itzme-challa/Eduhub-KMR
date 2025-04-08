import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';

import { about } from './commands';
import { help } from './commands';
import { study } from './commands/study';
import { neet } from './commands/neet';
import { jee } from './commands/jee';
import { groups } from './commands/groups';

import { quizes } from './text';
import { greeting } from './text';

import { development, production } from './core';

// Load environment variables
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

// Safety check
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN not provided!');
}

const bot = new Telegraf(BOT_TOKEN);

// ✅ Register slash commands
bot.command('about', about());
bot.command('help', help());
bot.command('study', study());
bot.command('neet', neet());
bot.command('jee', jee());
bot.command('groups', groups());

// ✅ Register /start separately
bot.start(greeting()); // Handles bot start welcome message

// ✅ Message handler for both quiz commands and greetings
bot.on('text', async (ctx) => {
  try {
    await Promise.all([
      quizes()(ctx),   // Handles p1, c2, playphy, etc.
      greeting()(ctx), // Handles hi, hello, etc.
    ]);
  } catch (err) {
    console.error('Error handling text message:', err);
  }
});

// ✅ Export for Vercel serverless deployment
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

// ✅ Use local dev mode if not in production
if (ENVIRONMENT !== 'production') {
  development(bot);
}
