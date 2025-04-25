import { Context } from 'telegraf';

// Dynamically import node-fetch due to ESM issues
const fetch = (...args: [RequestInfo, RequestInit?]) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

interface Quote {
  quoteText: string;
  quoteAuthor: string;
}

export const quote = () => async (ctx: Context) => {
  try {
    const res = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/master/quotes.json');
    const data: unknown = await res.json();
    
    // Type guard to ensure data is an array of Quote objects
    const isQuoteArray = (data: unknown): data is Quote[] => {
      return Array.isArray(data) && 
        data.every(item => 
          typeof item === 'object' && 
          item !== null && 
          'quoteText' in item && 
          typeof item.quoteText === 'string'
        );
    };

    if (!isQuoteArray(data)) {
      throw new Error('Invalid quotes data format');
    }

    const quotes: Quote[] = data;

    if (quotes.length === 0) {
      return ctx.reply('❌ No quotes found.');
    }

    const random = quotes[Math.floor(Math.random() * quotes.length)];
    const message = `_"${random.quoteText}"_\n\n— *${random.quoteAuthor || 'Unknown'}*`;
    const chatId = ctx.chat?.id;
    
    if (!chatId) return;
    
    await ctx.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('Failed to fetch quote:', err);
    const chatId = ctx.chat?.id;
    if (chatId) {
      await ctx.telegram.sendMessage(chatId, '⚠️ Failed to fetch quote. Try again later.');
    }
  }
};
