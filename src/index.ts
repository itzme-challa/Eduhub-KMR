import { Telegraf } from 'telegraf';
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

// New command to show user count from Google Sheets
bot.command('users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) {
    return ctx.reply('You are not authorized to use this command.');
  }

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
    console.error('Failed to fetch user count:', err);
    await ctx.reply('❌ Error: Unable to fetch user count from Google Sheet.');
  }
});

// Handle refresh button for user count
bot.action('refresh_users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) {
    await ctx.answerCbQuery('Unauthorized');
    return;
  }

  try {
    const chatIds = await fetchChatIdsFromSheet();
    const totalUsers = chatIds.length;

    await ctx.editMessageText(`📊 Total users: ${totalUsers} (refreshed)`, { 
      parse_mode: 'Markdown', 
      reply_markup: { 
        inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]] 
      } 
    });
    await ctx.answerCbQuery('Refreshed!');
  } catch (err) {
    console.error('Failed to refresh user count:', err);
    await ctx.answerCbQuery('Refresh failed');
  }
});

// Broadcast to all saved chat IDs
bot.command('broadcast', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized to use this command.');

  const msg = ctx.message.text?.split(' ').slice(1).join(' ');
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

  const parts = ctx.message.text?.split(' ');
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

// Quiz submission handler
bot.on('message', async (ctx) => {
  const message = ctx.message;
  const chat = ctx.chat;
  
  // Check if the message is a quiz submission (contains question and options)
  if (message.text && isQuizMessage(message.text)) {
    try {
      // Convert the quiz to JSON format
      const quizJson = convertQuizToJson(message.text);
      
      // Send the JSON back to the user
      await ctx.replyWithMarkdown(`Here's your quiz in JSON format:\n\`\`\`json\n${JSON.stringify(quizJson, null, 2)}\n\`\`\``);
      
      // Forward the original message and JSON to admin
      await ctx.forwardMessage(ADMIN_ID);
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*Quiz Submission from ${chat.first_name || 'Unknown'} (@${chat.username || 'N/A'})*\nChat ID: ${chat.id}\n\n*JSON Format:*\n\`\`\`json\n${JSON.stringify(quizJson, null, 2)}\n\`\`\``,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Error processing quiz:', error);
      await ctx.reply('There was an error processing your quiz. Please check the format and try again.');
    }
    return;
  }

  // Rest of your existing message handling...
  if (!chat?.id) return;

  // Save chat ID locally
  saveChatId(chat.id);

  // Save to Google Sheet and check if user is new
  const alreadyNotified = await saveToSheet(chat);

  // Notify admin once only
  if (chat.id !== ADMIN_ID && !alreadyNotified) {
    if (chat.type === 'private' && 'first_name' in chat && 'username' in chat) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*New user started the bot!*\n\n*Name:* ${chat.first_name}\n*Username:* @${chat.username}\nChat ID: ${chat.id}`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  // Handle /contact messages
  if (message.text?.startsWith('/contact')) {
    const userMessage = message.text.replace('/contact', '').trim() || (message.reply_to_message?.text || '');
    if (userMessage) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*Contact Message from ${'first_name' in chat ? chat.first_name : 'Unknown'} (@${'username' in chat ? chat.username || 'N/A' : 'N/A'})*\nChat ID: ${chat.id}\n\nMessage:\n${userMessage}`,
        { parse_mode: 'Markdown' }
      );
      await ctx.reply('Your message has been sent to the admin!');
    } else {
      await ctx.reply('Please provide a message or reply to a message using /contact.');
    }
    return;
  }

  // Admin replies via swipe reply
  if (chat.id === ADMIN_ID && message.reply_to_message?.text) {
    const match = message.reply_to_message.text.match(/Chat ID: (\d+)/);
    if (match) {
      const targetId = parseInt(match[1], 10);
      try {
        await ctx.telegram.sendMessage(
          targetId,
          `*Admin's Reply:*\n${message.text}`,
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
  if (isPrivateChat(chat.type)) {
    await greeting()(ctx);
  }
});

// Helper function to check if a message is a quiz
function isQuizMessage(text: string): boolean {
  // Simple check for common quiz patterns
  const quizPatterns = [
    /question:/i,
    /q:/i,
    /options?:/i,
    /a\)/i,
    /b\)/i,
    /c\)/i,
    /d\)/i
  ];
  
  return quizPatterns.some(pattern => pattern.test(text));
}

// Helper function to convert quiz text to JSON
function convertQuizToJson(quizText: string): any {
  const lines = quizText.split('\n').filter(line => line.trim() !== '');
  const quiz: any = {
    question: '',
    options: [],
    correctAnswer: '',
    explanation: ''
  };

  for (const line of lines) {
    if (line.match(/^(question|q):/i)) {
      quiz.question = line.replace(/^(question|q):\s*/i, '').trim();
    } 
    else if (line.match(/^(options?):/i)) {
      // Options might be on the same line or following lines
      const optionsText = line.replace(/^(options?):\s*/i, '');
      if (optionsText) {
        quiz.options = quiz.options.concat(extractOptions(optionsText));
      }
    }
    else if (line.match(/^[a-d]\)/i)) {
      quiz.options = quiz.options.concat(extractOptions(line));
    }
    else if (line.match(/^(correct answer|answer):/i)) {
      quiz.correctAnswer = line.replace(/^(correct answer|answer):\s*/i, '').trim();
    }
    else if (line.match(/^(explanation|explain):/i)) {
      quiz.explanation = line.replace(/^(explanation|explain):\s*/i, '').trim();
    }
    else if (quiz.question && !quiz.options.length) {
      // If we have a question but no options yet, this might be part of the question
      quiz.question += '\n' + line.trim();
    }
  }

  return quiz;
}

// Helper function to extract options from text
function extractOptions(text: string): string[] {
  const options: string[] = [];
  // Split by option markers (a), b), etc.)
  const optionRegex = /([a-d])\)\s*([^\n]+)/gi;
  let match;
  
  while ((match = optionRegex.exec(text)) !== null) {
    options.push(match[2].trim());
  }
  
  // If no options found with markers, try splitting by lines
  if (options.length === 0) {
    return text.split('\n').map(opt => opt.trim()).filter(opt => opt !== '');
  }
  
  return options;
}

// User greeting and message handling
bot.start(async (ctx) => {
  if (isPrivateChat(ctx.chat.type)) {
    await ctx.reply('Welcome! Use /help to explore commands.');
    await greeting()(ctx);
  }
});

// Handle button clicks
bot.on('callback_query', handleQuizActions());

// --- DEPLOYMENT ---
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

if (ENVIRONMENT !== 'production') {
  development(bot);
}
