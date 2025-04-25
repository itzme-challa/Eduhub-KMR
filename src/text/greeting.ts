import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_text');

const greeting = () => async (ctx: Context) => {
  try {
    debug('Triggered "greeting" text command');

    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text.trim().toLowerCase();
    const user = ctx.from;
    const userName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Ignore pattern-like messages (quiz command formats)
    if (/^[pbcq][0-9]+$/i.test(text) || /^[pbcq]r$/i.test(text)) return;

    const greetings = ['hi', 'hello', 'hey', 'hii', 'heyy', 'hola', 'start', '/start'];

    if (greetings.includes(text)) {
      if (text === 'start' || text === '/start') {
        await ctx.reply(
          `Dear ${userName}, today is ${today}, welcome to *Eduhub Bot 1.1.0*! 📚\nYour smart companion for NEET & JEE prep.`,
          { parse_mode: 'Markdown' }
        );

        await ctx.replyWithMarkdown(`---

To get previous year questions, type:

→ *Biology:* \`/pyqb\` → 1 random bio PYQ  
→ *Biology:* \`/pyqb 2\` → 2 random bio PYQs  
→ *Chemistry:* \`/pyqc\` or \`/pyqc 3\`  
→ *Physics:* \`/pyqp\` or \`/pyqp 5\`  
→ *Any Subject:* \`/pyq\` or \`/pyq 4\` → mixed random PYQs  

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
• \`/quote\` – Get a random motivational quote  
• \`/me\` – View your user details  
• \`/users\` – [Admin] Show total and active users  

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
        await ctx.reply(`Sorry, I don’t understand!`);
      }
    }
  } catch (err) {
    console.error('Greeting handler error:', err);
  }
};

export { greeting };
