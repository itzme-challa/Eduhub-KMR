import { Context } from 'telegraf';
import https from 'https';

const QUOTES_URL =
  'https://raw.githubusercontent.com/itzfew/Eduhub-KMR/main/quotes.json';

const quote = () => async (ctx: Context) => {
  try {
    https.get(QUOTES_URL, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const quotes = JSON.parse(data);
          if (!Array.isArray(quotes)) {
            ctx.reply('No quotes found.');
            return;
          }

          const random = quotes[Math.floor(Math.random() * quotes.length)];
          const message = `_"${random.quoteText}"_\n\n– *${random.quoteAuthor || 'Unknown'}*`;

          ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (err) {
          console.error('Failed to parse quotes:', err);
          ctx.reply('Error parsing quote data.');
        }
      });
    }).on('error', (err) => {
      console.error('Quote fetch error:', err);
      ctx.reply('Failed to fetch quotes.');
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    ctx.reply('Something went wrong.');
  }
};

export { quote };
