import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_text');

const greeting = () => async (ctx: Context) => {
  debug('Triggered "greeting" text command');

  if (!ctx.message || !('text' in ctx.message)) return;

  const text = ctx.message.text.trim().toLowerCase();
  const userName = `${ctx.message.from.first_name ?? ''} ${ctx.message.from.last_name ?? ''}`.trim();
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Skip quiz-like commands (e.g., p1, c2, qr, etc.)
  if (/^[pbcq][0-9]+$/i.test(text) || /^[pbcq]r$/i.test(text)) return;

  const greetings = ['hi', 'hello', 'hey', 'hii', 'heyy', 'hola', 'start', '/start'];

  if (greetings.includes(text)) {
    if (text === 'start' || text === '/start') {
      await ctx.reply(
        `Dear ${userName}, today is ${today}, welcome to *Eduhub Bot 1.1.0*! 📚\nYour smart companion for NEET & JEE prep.`,
        { parse_mode: 'Markdown' }
      );

      await ctx.replyWithMarkdown(`---

To get questions, type:

→ *Biology:* \`bio 1\`, \`/b1\`, or \`biology 1\`  
→ *Physics:* \`phy 2\`, \`/p2\`, or \`physics 2\`  
→ *Chemistry:* \`chem 3\`, \`/c3\`, or \`chemistry 3\`

---

*Random Questions:*

→ \`playbio 5\` → 5 random biology questions  
→ \`playphy 4\` → 4 random physics questions  
→ \`playchem 6\` → 6 random chemistry questions

---

*Eduhub Features:*

✅ Study materials for NEET and JEE  
✅ Practice tests & question banks  
✅ NCERT solutions access  
✅ Study group links  
✅ Tools and tips for exam prep

---

*Available Commands:*

• \`/help\` – List of commands  
• \`/about\` – About this bot  
• \`/groups\` – Study group links  
• \`/neet\` – NEET resources  
• \`/jee\` – JEE resources  
• \`/study\` – Materials for subjects

---

👨‍💻 *Author:* itzfew  
📧 *Support:* itzme.eduhub.contact@gmail.com  
🤖 *Telegram:* @NeetAspirantsBot
`);
    } else {
      const replies = [
        `Hey dear ${userName}, how may I help you?`,
        `Hello ${userName}! What can I do for you today?`,
        `Hi ${userName}, how can I assist you?`,
        `Greetings ${userName}! Need any help?`,
        `Hey ${userName}! I’m here to help.`,
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      await ctx.reply(reply);
      await ctx.reply(`For practice, just send me your topic or need!`);
    }
  } else {
    await ctx.reply(`Hey ${userName}, how can I help you?`);
  }
};

export { greeting };
