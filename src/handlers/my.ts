import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("my:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const replies = ctx.session.personalReplies ?? [];

  if (replies.length === 0) {
    await ctx.editMessageText(
      "No quick replies yet.\n\nTap ➕ Add new to create one.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("➕ Add new", "reply:add")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  const rows: { text: string; callback_data: string }[][] = [];
  for (const reply of replies) {
    rows.push([inlineButton(`💬 ${reply.name}`, `reply:use:${reply.id}`)]);
    rows.push([
      inlineButton("✏️ Edit", `reply:edit:${reply.id}`),
      inlineButton("🗑 Delete", `reply:delete:${reply.id}`),
    ]);
  }

  rows.push([inlineButton("➕ Add new", "reply:add")]);
  rows.push([inlineButton("📤 Export set", "export:start")]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.editMessageText(
    `📋 Your quick replies (${replies.length}/50)`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.command("my", async (ctx) => {
  const replies = ctx.session.personalReplies ?? [];
  const rows: { text: string; callback_data: string }[][] = [];

  if (replies.length === 0) {
    await ctx.reply(
      "No quick replies yet.\n\nTap ➕ Add new to create one.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("➕ Add new", "reply:add")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  for (const reply of replies) {
    rows.push([inlineButton(`💬 ${reply.name}`, `reply:use:${reply.id}`)]);
    rows.push([
      inlineButton("✏️ Edit", `reply:edit:${reply.id}`),
      inlineButton("🗑 Delete", `reply:delete:${reply.id}`),
    ]);
  }

  rows.push([inlineButton("➕ Add new", "reply:add")]);
  rows.push([inlineButton("📤 Export set", "export:start")]);
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);

  await ctx.reply(
    `📋 Your quick replies (${replies.length}/50)`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

export default composer;
