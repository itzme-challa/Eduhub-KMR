import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:quotes');

const quotes = () => async (ctx: Context) => {
  debug('Triggered "quotes" handler');

  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text.trim().toLowerCase();

  // Help message for quote commands
  if (['quote', '/quote', 'quotes', '/quotes', 'random quote', 'randomquote'].includes(text)) {
    try {
      const response = await fetch('https://raw.githubusercontent.com/itzfew/Eduhub-KMR/master/quotes.json');
      const allQuotes = await response.json();
      
      if (!allQuotes.length) {
        await ctx.reply('No quotes available at the moment.');
        return;
      }

      // Get a random quote
      const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
      
      await ctx.replyWithMarkdown(
        `*"${randomQuote.quoteText}"*\n\n` +
        `_— ${randomQuote.quoteAuthor || 'Unknown'}_`
      );
    } catch (err) {
      debug('Error fetching quotes:', err);
      await ctx.reply('Oops! Failed to load quotes. Please try again later.');
    }
    return;
  }

  // You can add more quote-related commands here if needed
};

export { quotes };
