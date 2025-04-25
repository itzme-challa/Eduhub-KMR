import { Context } from 'telegraf';

interface Quote {
  quoteText: string;
  quoteAuthor: string;
}

export async function quote(ctx: Context) {
  try {
    // Use dynamic import for node-fetch
    const { default: fetch } = await import('node-fetch');
    
    const res = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/master/quotes.json');
    const quotes: Quote[] = await res.json();

    if (!quotes || quotes.length === 0) {
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
}
