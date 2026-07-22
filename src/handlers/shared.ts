import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

export const sharedReplies: {
  id: string;
  buttonText: string;
  payload: string;
  ownerApproved: boolean;
}[] = [];

const composer = new Composer<Ctx>();

composer.callbackQuery("shared:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const shared = sharedReplies.filter((r) => r.ownerApproved);
  if (shared.length === 0) {
    await ctx.editMessageText(
      "No shared replies available yet.\n\nThe owner hasn't added any shared buttons.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }
  const rows: { text: string; callback_data: string }[][] = [];
  for (const reply of shared) {
    rows.push([inlineButton(`💬 ${reply.buttonText}`, `shared:use:${reply.id}`)]);
  }
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  await ctx.editMessageText(
    `🌐 Shared replies (${shared.length})`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.command("shared", async (ctx) => {
  const shared = sharedReplies.filter((r) => r.ownerApproved);
  if (shared.length === 0) {
    await ctx.reply(
      "No shared replies available yet.\n\nThe owner hasn't added any shared buttons.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }
  const rows: { text: string; callback_data: string }[][] = [];
  for (const reply of shared) {
    rows.push([inlineButton(`💬 ${reply.buttonText}`, `shared:use:${reply.id}`)]);
  }
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  await ctx.reply(
    `🌐 Shared replies (${shared.length})`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.callbackQuery(/^shared:use:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = ctx.match[1];
  const reply = sharedReplies.find((r) => r.id === id && r.ownerApproved);
  if (!reply) {
    await ctx.reply("Shared reply not found.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to shared", "shared:show")]]),
    });
    return;
  }
  await ctx.reply(reply.payload);
});

export default composer;
