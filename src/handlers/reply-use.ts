import { Composer } from "grammy";
import type { Ctx, PersonalReply } from "../bot.js";

const composer = new Composer<Ctx>();

composer.callbackQuery(/^reply:use:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = ctx.match[1];
  const replies = ctx.session.personalReplies ?? [];
  const reply = replies.find((r: PersonalReply) => r.id === id);
  if (!reply) {
    await ctx.reply("Reply not found. It may have been deleted.", {
      reply_markup: { inline_keyboard: [[{ text: "⬅️ Back to my replies", callback_data: "my:show" }]] },
    });
    return;
  }
  await ctx.reply(reply.payload);
});

export default composer;
