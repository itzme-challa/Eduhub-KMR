import { Telegraf, Context } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllChatIds, saveChatId, fetchChatIdsFromSheet } from './utils/chatStore';
import { db, ref, push, set } from './utils/firebase';
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

// Store temporary question data
interface QuestionData {
  subject: string;
  chapter: string;
  questions: Array<{
    question: string;
    options: { [key: string]: string };
    correct_option: string;
    explanation: string;
    image: string;
  }>;
  count: number;
  current: number;
}

const questionDataMap = new Map<number, QuestionData>();

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

// Add question commands
bot.command(/^add([a-zA-Z]+)(?:_+([a-zA-Z_]+))?$/, async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) {
    return ctx.reply('You are not authorized to use this command.');
  }

  const match = ctx.message.text?.match(/^\/add([a-zA-Z]+)(?:_+([a-zA-Z_]+))?\s+(\d+)$/);
  if (!match) {
    return ctx.reply('Invalid format. Use:\n/addBiology\n/addBiology__Plant_Kingdom 10');
  }

  const subject = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  let chapter = match[2] ? match[2].replace(/_/g, ' ') : 'Random';
  const count = parseInt(match[3], 10);

  if (isNaN(count) || count <= 0) {
    return ctx.reply('Please provide a valid number of questions (e.g., 10)');
  }

  // Initialize question data
  questionDataMap.set(ctx.chat.id, {
    subject,
    chapter,
    questions: [],
    count,
    current: 0
  });

  await ctx.reply(
    `📝 Preparing to add ${count} ${subject} questions${chapter !== 'Random' ? ` (Chapter: ${chapter})` : ''}.\n\n` +
    'Please send each question in the following format:\n\n' +
    '*Question text*\n' +
    'A) Option 1\n' +
    'B) Option 2\n' +
    'C) Option 3\n' +
    'D) Option 4\n' +
    '*Correct: A*\n' +
    '*Explanation: Explanation text*\n' +
    '*Image: image_url (optional)*',
    { parse_mode: 'Markdown' }
  );
});

// Handle question input
bot.on('message', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) {
    // Handle non-admin messages normally (existing message handler logic)
    return;
  }

  const chatId = ctx.chat.id;
  const questionData = questionDataMap.get(chatId);
  if (!questionData) return;

  const messageText = ctx.message.text;
  if (!messageText) return;

  try {
    // Parse the question
    const lines = messageText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 6) {
      await ctx.reply('Invalid format. Please provide all required fields.');
      return;
    }

    const question = lines[0].trim();
    const options: { [key: string]: string } = {};
    let correct_option = '';
    let explanation = '';
    let image = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^[A-D]\)/)) {
        const optionParts = line.split(')');
        const optionKey = optionParts[0].trim();
        const optionValue = optionParts.slice(1).join(')').trim();
        options[optionKey] = optionValue;
      } else if (line.toLowerCase().startsWith('*correct:')) {
        correct_option = line.replace(/^\*correct:\s*/i, '').replace(/\*$/, '').trim();
      } else if (line.toLowerCase().startsWith('*explanation:')) {
        explanation = line.replace(/^\*explanation:\s*/i, '').replace(/\*$/, '').trim();
      } else if (line.toLowerCase().startsWith('*image:')) {
        image = line.replace(/^\*image:\s*/i, '').replace(/\*$/, '').trim();
      }
    }

    // Validate the question
    if (!question || Object.keys(options).length < 4 || !correct_option || !explanation) {
      await ctx.reply('Missing required fields. Each question must have:\n- Question text\n- 4 options (A-D)\n- Correct answer\n- Explanation');
      return;
    }

    // Add to questions array
    questionData.questions.push({
      question,
      options,
      correct_option,
      explanation,
      image: image || ''
    });

    questionData.current++;

    // Check if we've collected all questions
    if (questionData.current >= questionData.count) {
      // Save all questions to Firebase
      const questionsRef = ref(db, 'questions');
      const formattedQuestions = questionData.questions.map(q => ({
        subject: questionData.subject,
        chapter: questionData.chapter,
        question: q.question,
        options: q.options,
        correct_option: q.correct_option,
        explanation: q.explanation,
        image: q.image,
        addedAt: Date.now()
      }));

      try {
        await Promise.all(
          formattedQuestions.map(question => {
            const newQuestionRef = push(ref(db, 'questions'));
            return set(newQuestionRef, question);
          })
        );

        await ctx.reply(
          `✅ Successfully added ${questionData.count} ${questionData.subject} questions` +
          `${questionData.chapter !== 'Random' ? ` (Chapter: ${questionData.chapter})` : ''} to the database!`
        );
      } catch (error) {
        console.error('Firebase save error:', error);
        await ctx.reply('❌ Error: Failed to save questions to database.');
      }

      // Clear the question data
      questionDataMap.delete(chatId);
    } else {
      await ctx.reply(`Question ${questionData.current}/${questionData.count} added. Please send the next question.`);
    }
  } catch (error) {
    console.error('Question parsing error:', error);
    await ctx.reply('Error processing the question. Please check the format and try again.');
  }
});

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
        inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]],
      },
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
        inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]],
      },
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

// User greeting and message handling
bot.start(async (ctx) => {
  if (isPrivateChat(ctx.chat.type)) {
    await ctx.reply('Welcome! Use /help to explore commands.');
    await greeting()(ctx);
  }
});

// Handle button clicks (quiz)
bot.on('callback_query', handleQuizActions());

// --- MESSAGE HANDLER ---
bot.on('message', async (ctx) => {
  // Skip if it's an admin adding questions
  if (ctx.from?.id === ADMIN_ID && questionDataMap.has(ctx.chat.id)) {
    return;
  }

  const chat = ctx.chat;
  const msg = ctx.message as any; // avoid TS for ctx.message.poll
  const chatType = chat.type;

  if (!chat?.id) return;

  // Save chat ID locally
  saveChatId(chat.id);

  // Save to Google Sheet and check if user is new
  const alreadyNotified = await saveToSheet(chat);

  // Notify admin once only for new users (private chat)
  if (chat.id !== ADMIN_ID && !alreadyNotified) {
    if (chat.type === 'private' && 'first_name' in chat) {
      const usernameText = 'username' in chat && typeof chat.username === 'string' ? `@${chat.username}` : 'N/A';
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*New user started the bot!*\n\n*Name:* ${chat.first_name}\n*Username:* ${usernameText}\nChat ID: ${chat.id}`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  // Handle /contact messages
  if (msg.text?.startsWith('/contact')) {
    const userMessage = msg.text.replace('/contact', '').trim() || msg.reply_to_message?.text;
    if (userMessage) {
      // Safely check properties for chat
      const firstName = 'first_name' in chat ? chat.first_name : 'Unknown';
      const username = 'username' in chat && typeof chat.username === 'string' ? `@${chat.username}` : 'N/A';

      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*Contact Message from ${firstName} (${username})*\nChat ID: ${chat.id}\n\nMessage:\n${userMessage}`,
        { parse_mode: 'Markdown' }
      );
      await ctx.reply('Your message has been sent to the admin!');
    } else {
      await ctx.reply('Please provide a message or reply to a message using /contact.');
    }
    return;
  }

  // Admin replies via swipe reply
  if (chat.id === ADMIN_ID && msg.reply_to_message?.text) {
    const match = msg.reply_to_message.text.match(/Chat ID: (\d+)/);
    if (match) {
      const targetId = parseInt(match[1], 10);
      try {
        await ctx.telegram.sendMessage(targetId, `*Admin's Reply:*\n${msg.text}`, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error('Failed to send swipe reply:', err);
      }
    }
    return;
  }

  // === Detect Telegram Poll and send JSON to admin ===
  if (msg.poll) {
    const poll = msg.poll;
    const pollJson = JSON.stringify(poll, null, 2);

    // Save poll data to Firebase Realtime Database under /polls/
    try {
      const pollsRef = ref(db, 'polls');
      const newPollRef = push(pollsRef);
      await set(newPollRef, {
        poll,
        from: {
          id: ctx.from?.id,
          username: ctx.from?.username || null,
          first_name: ctx.from?.first_name || null,
          last_name: ctx.from?.last_name || null,
        },
        chat: {
          id: ctx.chat.id,
          type: ctx.chat.type,
        },
        receivedAt: Date.now(),
      });
    } catch (error) {
      console.error('Firebase save error:', error);
    }
    await ctx.reply('Thanks for sending a poll! Your poll data has been sent to the admin.');

    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `📊 *New Telegram Poll received from @${ctx.from?.username || 'unknown'}:*\n\`\`\`json\n${pollJson}\n\`\`\``,
      { parse_mode: 'Markdown' }
    );

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
