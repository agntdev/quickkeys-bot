import { Composer } from "grammy";
import type { Ctx, PersonalReply } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

composer.callbackQuery(/^reply:delete:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = ctx.match[1];
  const replies = ctx.session.personalReplies ?? [];
  const reply = replies.find((r: PersonalReply) => r.id === id);
  if (!reply) {
    await ctx.reply("Reply not found.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to my replies", "my:show")]]),
    });
    return;
  }
  await ctx.reply(
    `Delete "${reply.name}"?`,
    {
      reply_markup: inlineKeyboard([
        [
          inlineButton("✅ Yes, delete", `reply:confirm_delete:${id}`),
          inlineButton("❌ No, keep", "my:show"),
        ],
      ]),
    },
  );
});

composer.callbackQuery(/^reply:confirm_delete:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = ctx.match[1];
  const replies = ctx.session.personalReplies ?? [];
  const idx = replies.findIndex((r: PersonalReply) => r.id === id);
  if (idx < 0) {
    await ctx.reply("Reply not found.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to my replies", "my:show")]]),
    });
    return;
  }
  const deleted = replies[idx];
  replies.splice(idx, 1);
  await ctx.reply(`🗑 Deleted "${deleted.name}"`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to my replies", "my:show")]]),
  });
});

export default composer;
