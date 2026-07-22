import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { OWNER_ID } from "../config.js";

export const pendingExports: {
  id: string;
  userId: number;
  setName: string;
  shareCode: string;
  isPublic: boolean;
  pendingApproval: boolean;
}[] = [];

const composer = new Composer<Ctx>();

composer.callbackQuery("export:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  const replies = ctx.session.personalReplies ?? [];
  if (replies.length === 0) {
    await ctx.reply("You have no replies to export.\n\nCreate some replies first.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to my replies", "my:show")]]),
    });
    return;
  }
  ctx.session.step = "awaiting_export_name";
  if (!ctx.session.flowData) ctx.session.flowData = {};
  await ctx.reply("What name do you want for this export?", {
    reply_markup: { force_reply: true, input_field_placeholder: "e.g. My support replies" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_export_name") return next();
  const name = ctx.message.text.trim();
  if (name.length < 1 || name.length > 50) {
    await ctx.reply("Name must be 1–50 characters. Try again.");
    return;
  }
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.setName = name;
  ctx.session.step = "awaiting_export_visibility";
  await ctx.reply("Should this export be public or private?", {
    reply_markup: inlineKeyboard([
      [inlineButton("🌍 Public", "export:visibility:public")],
      [inlineButton("🔒 Private", "export:visibility:private")],
    ]),
  });
});

composer.callbackQuery(/^export:visibility:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const visibility = ctx.match[1] as "public" | "private";
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.visibility = visibility;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const shareCode = id.toUpperCase().slice(0, 8);
  const userId = ctx.from?.id ?? 0;
  const exp = {
    id,
    userId,
    setName: ctx.session.flowData.setName ?? "Untitled",
    shareCode,
    isPublic: visibility === "public",
    pendingApproval: visibility === "public",
  };
  pendingExports.push(exp);
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  if (visibility === "public") {
    await ctx.reply(
      `📤 Export created!\n\nSet: ${exp.setName}\nShare code: ${exp.shareCode}\n\nThis export is pending owner approval. You'll be notified when it's approved.`,
      {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to my replies", "my:show")],
        ]),
      },
    );
    if (OWNER_ID > 0) {
      try {
        await ctx.api.sendMessage(
          OWNER_ID,
          `📤 New export pending approval\n\nSet: ${exp.setName}\nUser: ${ctx.from?.first_name ?? "Unknown"}\nShare code: ${exp.shareCode}`,
          {
            reply_markup: inlineKeyboard([
              [inlineButton("⚙️ Review exports", "owner:exports")],
            ]),
          },
        );
      } catch {
        // Owner may have blocked the bot
      }
    }
  } else {
    await ctx.reply(
      `📤 Export created!\n\nSet: ${exp.setName}\nShare code: ${exp.shareCode}\n\nThis export is private. Share the code with people you want to give access to.`,
      {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to my replies", "my:show")],
        ]),
      },
    );
  }
});

export default composer;
