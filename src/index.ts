import { Telegraf, Context } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllChatIds, saveChatId } from './utils/chatStore';
import { fetchChatIdsFromSheet } from './utils/chatStore';
import { saveToSheet } from './utils/saveToSheet';
import { about, help } from './commands';
import { study } from './commands/study';
import { neet } from './commands/neet';
import { jee } from './commands/jee';
import { groups } from './commands/groups';
import { quizes } from './text';
import { greeting } from './text';
import { development, production } from './core';
import { isPrivateChat } from './utils/groupSettings';
import { quote } from './commands/quote';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';
const ADMIN_ID = 6930703214;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN not provided!');
const bot = new Telegraf(BOT_TOKEN);

// --- COMMANDS ---
bot.command('about', about());
bot.command('help', help());
bot.command('study', study());
bot.command('neet', neet());
bot.command('jee', jee());
bot.command('groups', groups());
bot.command('quote', quote());

// Broadcast to all saved chat IDs
bot.command('broadcast', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized to use this command.');

  const msg = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!msg) return ctx.reply('Usage:\n/broadcast Your message here');

  let chatIds: number[] = [];

  try {
    chatIds = await fetchChatIdsFromSheet();
  } catch (err) {
    console.error('Failed to fetch chat IDs:', err);
    return ctx.reply('❌ Error: Unable to fetch chat IDs from Google Sheet.');
  }

  if (chatIds.length === 0) {
    return ctx.reply('No users to broadcast to.');
  }

  let success = 0;
  for (const id of chatIds) {
    try {
      await ctx.telegram.sendMessage(id, msg);
      success++;
    } catch (err) {
      console.log(`Failed to send to ${id}`, err);
    }
  }

  await ctx.reply(`✅ Broadcast sent to ${success} users.`);
});

// Admin reply to user via command
bot.command('reply', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized to use this command.');

  const parts = ctx.message?.text?.split(' ');
  if (!parts || parts.length < 3) {
    return ctx.reply('Usage:\n/reply <chat_id> <message>');
  }

  const chatIdStr = parts[1].trim();
  const chatId = Number(chatIdStr);
  const message = parts.slice(2).join(' ');

  if (isNaN(chatId)) {
    return ctx.reply(`Invalid chat ID: ${chatIdStr}`);
  }

  try {
    await ctx.telegram.sendMessage(chatId, `*Admin's Reply:*\n${message}`, { parse_mode: 'Markdown' });
    await ctx.reply(`Reply sent to ${chatId}`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Reply error:', error);
    await ctx.reply(`Failed to send reply to ${chatId}`, { parse_mode: 'Markdown' });
  }
});

// User greeting and message handling
bot.start(async (ctx) => {
  if (isPrivateChat(ctx.chat.type)) {
    await ctx.reply('Welcome! Use /help to explore commands.');
    await greeting()(ctx);
  }
});

// --- MESSAGE HANDLER ---
bot.on('message', async (ctx: Context) => {
  const chat = ctx.chat;
  const msg = ctx.message;
  const chatType = chat.type;

  if (!chat?.id) return;

  // Save chat ID locally
  saveChatId(chat.id);

  // Save to Google Sheet and check if user is new
  const alreadyNotified = await saveToSheet(chat);

  // Notify admin once only
  if (chat.id !== ADMIN_ID && !alreadyNotified) {
    if (chat.type === 'private' && chat.first_name && chat.username) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*New user started the bot!*\n\n*Name:* ${chat.first_name}\n*Username:* @${chat.username}\nChat ID: ${chat.id}`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  // Handle /contact messages
  if (msg.text?.startsWith('/contact')) {
    const userMessage = msg.text.replace('/contact', '').trim() || msg.reply_to_message?.text;
    if (userMessage) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*Contact Message from ${chat.first_name} (@${chat.username || 'N/A'})*\nChat ID: ${chat.id}\n\nMessage:\n${userMessage}`,
        { parse_mode: 'Markdown' }
      );
      await ctx.reply('Your message has been sent to the admin!');
    } else {
      await ctx.reply('Please provide a message or reply to a message using /contact.');
    }
    return;
  }

  // Admin replies via swipe reply
  if (chat.id === ADMIN_ID && msg.reply_to_message) {
    const match = msg.reply_to_message.text?.match(/Chat ID: (\d+)/);
    if (match) {
      const targetId = parseInt(match[1], 10);
      try {
        await ctx.telegram.sendMessage(
          targetId,
          `*Admin's Reply:*\n${msg.text}`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        console.error('Failed to send swipe reply:', err);
      }
    }
    return;
  }

  // Run quiz for all chats
  await quizes()(ctx);

  // Greet in private chats
  if (isPrivateChat(chatType)) {
    await greeting()(ctx);
  }
});

// --- DEPLOYMENT ---
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

if (ENVIRONMENT !== 'production') {
  development(bot);
}
