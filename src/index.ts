import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllChatIds, saveChatId, fetchChatIdsFromSheet } from './utils/chatStore';
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
import { me } from './commands/me';
import { quote } from './commands/quotes';
import { playquiz, handleQuizActions } from './playquiz';

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
bot.command(['me', 'user', 'info'], me());
bot.command('quote', quote());
bot.command('quiz', playquiz());

bot.command('users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  try {
    const chatIds = await fetchChatIdsFromSheet();
    const totalUsers = chatIds.length;
    await ctx.reply(`📊 Total users: ${totalUsers}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]]
      }
    });
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Error: Unable to fetch user count.');
  }
});

bot.action('refresh_users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.answerCbQuery('Unauthorized');

  try {
    const chatIds = await fetchChatIdsFromSheet();
    await ctx.editMessageText(`📊 Total users: ${chatIds.length} (refreshed)`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]]
      }
    });
    await ctx.answerCbQuery('Refreshed!');
  } catch (err) {
    console.error(err);
    await ctx.answerCbQuery('Refresh failed');
  }
});

bot.command('broadcast', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  const msg = ctx.message.text?.split(' ').slice(1).join(' ');
  if (!msg) return ctx.reply('Usage:\n/broadcast Your message here');

  let chatIds: number[] = [];
  try {
    chatIds = await fetchChatIdsFromSheet();
  } catch (err) {
    console.error(err);
    return ctx.reply('❌ Error: Unable to fetch chat IDs.');
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

bot.command('reply', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  const parts = ctx.message.text?.split(' ');
  if (!parts || parts.length < 3) return ctx.reply('Usage:\n/reply <chat_id> <message>');

  const chatId = Number(parts[1].trim());
  const message = parts.slice(2).join(' ');

  if (isNaN(chatId)) return ctx.reply(`Invalid chat ID: ${parts[1]}`);

  try {
    await ctx.telegram.sendMessage(chatId, `*Admin's Reply:*\n${message}`, { parse_mode: 'Markdown' });
    await ctx.reply(`Reply sent to ${chatId}`, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    await ctx.reply(`Failed to send reply to ${chatId}`, { parse_mode: 'Markdown' });
  }
});

bot.start(async (ctx) => {
  if (isPrivateChat(ctx.chat.type)) {
    await ctx.reply('Welcome! Use /help to explore commands.');
    await greeting()(ctx);
  }
});

bot.on('callback_query', handleQuizActions());

// --- MESSAGE HANDLER ---
bot.on('message', async (ctx) => {
  const chat = ctx.chat;
  const msg = ctx.message as any;
  const chatType = chat.type;

  if (!chat?.id) return;

  saveChatId(chat.id);
  const alreadyNotified = await saveToSheet(chat);

  if (chat.id !== ADMIN_ID && !alreadyNotified && chat.type === 'private') {
    if ('first_name' in chat && 'username' in chat) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*New user started the bot!*\n\n*Name:* ${chat.first_name}\n*Username:* @${chat.username}\nChat ID: ${chat.id}`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  // /contact message handler
  if (msg.text?.startsWith('/contact')) {
    const userMessage = msg.text.replace('/contact', '').trim() || msg.reply_to_message?.text;
    if (userMessage) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*Contact Message from ${'first_name' in chat ? chat.first_name : 'Unknown'} (@${chat.username || 'N/A'})*\nChat ID: ${chat.id}\n\nMessage:\n${userMessage}`,
        { parse_mode: 'Markdown' }
      );
      await ctx.reply('Your message has been sent to the admin!');
    } else {
      await ctx.reply('Please provide a message or reply to a message using /contact.');
    }
    return;
  }

  // Admin swipe-reply
  if (chat.id === ADMIN_ID && msg.reply_to_message?.text) {
    const match = msg.reply_to_message.text.match(/Chat ID: (\d+)/);
    if (match) {
      const targetId = parseInt(match[1], 10);
      try {
        await ctx.telegram.sendMessage(targetId, `*Admin's Reply:*\n${msg.text}`, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error('Swipe reply error:', err);
      }
    }
    return;
  }

  // --- Auto forward quiz to admin in JSON ---
  if (msg.quiz || msg.poll) {
    const quizData = JSON.stringify(msg, null, 2);
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*Quiz Received from @${ctx.from?.username || 'Unknown'} (ID: ${ctx.from?.id})*\n\n\`\`\`\n${quizData}\n\`\`\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await quizes()(ctx);

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
