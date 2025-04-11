import { Context } from 'telegraf';

export function me() {
  return async (ctx: Context) => {
    try {
      const args = ctx.message?.text?.split(' ').slice(1);
      const input = args?.[0];

      let targetUser = ctx.from;
      let userId = ctx.from?.id;
      let username = ctx.from?.username;
      let isSelf = true;

      // Handle `/me @username` or `/me userId`
      if (input) {
        isSelf = false;

        // Handle user ID
        if (/^\d+$/.test(input)) {
          userId = parseInt(input);
        }

        // Handle username (strip @ if present)
        if (input.startsWith('@')) {
          username = input.replace('@', '');
        }
      }

      let userData = null;
      let profilePhotoId = null;

      // Try fetching user profile if it's not self
      if (!isSelf && userId && !username) {
        try {
          const photos = await ctx.telegram.getUserProfilePhotos(userId, 0, 1);
          if (photos.total_count > 0) {
            profilePhotoId = photos.photos[0][0].file_id;
          }
        } catch (err) {
          // ignore
        }
      }

      // Try fetching from username if available
      if (!isSelf && username) {
        try {
          const userChat = await ctx.telegram.getChat(`@${username}`);
          userData = userChat;
          userId = userChat.id;
          if ('username' in userChat) {
            username = userChat.username;
          }
          if ('first_name' in userChat) {
            targetUser = userChat;
          }

          // Get profile photo
          const photos = await ctx.telegram.getUserProfilePhotos(userChat.id, 0, 1);
          if (photos.total_count > 0) {
            profilePhotoId = photos.photos[0][0].file_id;
          }
        } catch (err) {
          return ctx.reply(`❌ Could not fetch details for ${input}. Make sure they have interacted with the bot or are publicly accessible.`);
        }
      }

      const displayName = `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim();
      const mentionLink = username
        ? `https://t.me/${username}`
        : `tg://user?id=${userId}`;

      const message = `
*📇 Telegram User Details:*

👤 *Name:* ${displayName || 'N/A'}
📛 *Username:* ${username ? '@' + username : 'N/A'}
🆔 *User ID:* \`${userId}\`
🔗 *Profile Link:* [Click Here](${mentionLink})
🤖 *Is Bot:* ${targetUser.is_bot ? 'Yes' : 'No'}

*💬 From Chat:*
🗨️ *Chat ID:* \`${ctx.chat.id}\`
🏷️ *Chat Type:* ${ctx.chat.type}
      `.trim();

      if (profilePhotoId) {
        await ctx.replyWithPhoto(profilePhotoId, {
          caption: message,
          parse_mode: 'Markdown',
        });
      } else {
        await ctx.reply(message, { parse_mode: 'Markdown' });
      }

    } catch (error) {
      console.error('Error in /me command:', error);
      ctx.reply('⚠️ An error occurred while processing your request.');
    }
  };
}
