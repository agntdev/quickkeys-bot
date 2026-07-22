import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("reply:add", async (ctx) => {
  await ctx.answerCallbackQuery();
  const replies = ctx.session.personalReplies ?? [];
  if (replies.length >= 50) {
    await ctx.reply("You've reached the 50-reply limit. Delete some replies first.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to my replies", "my:show")]]),
    });
    return;
  }
  ctx.session.step = "awaiting_reply_name";
  ctx.session.flowData = {};
  await ctx.reply("What should this reply be called?", {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: "e.g. Meeting link",
    },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_reply_name") return next();
  const name = ctx.message.text.trim();
  if (name.length < 1 || name.length > 50) {
    await ctx.reply("Name must be 1–50 characters. Try again.");
    return;
  }
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.replyName = name;
  ctx.session.step = "awaiting_button_text";
  await ctx.reply("What text should the button show?", {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: "e.g. Join meeting",
    },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_button_text") return next();
  const text = ctx.message.text.trim();
  if (text.length < 1 || text.length > 64) {
    await ctx.reply("Button text must be 1–64 characters. Try again.");
    return;
  }
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.buttonText = text;
  ctx.session.step = "awaiting_payload";
  await ctx.reply("What message should be sent when someone taps this button?\n\nOr tap Skip to send just the button text.", {
    reply_markup: inlineKeyboard([
      [inlineButton("Skip", "reply:add:skip_payload")],
    ]),
  });
});

composer.callbackQuery("reply:add:skip_payload", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.payload = ctx.session.flowData.buttonText ?? "";
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const reply = {
    id,
    name: ctx.session.flowData.replyName ?? "Untitled",
    buttonText: ctx.session.flowData.buttonText ?? "",
    payload: ctx.session.flowData.payload,
  };
  if (!ctx.session.personalReplies) ctx.session.personalReplies = [];
  ctx.session.personalReplies.push(reply);
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.reply(
    `✅ Created "${reply.name}"\n\nButton: ${reply.buttonText}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to my replies", "my:show")],
      ]),
    },
  );
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_payload") return next();
  const payload = ctx.message.text.trim();
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.payload = payload;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const reply = {
    id,
    name: ctx.session.flowData.replyName ?? "Untitled",
    buttonText: ctx.session.flowData.buttonText ?? "",
    payload: ctx.session.flowData.payload,
  };
  if (!ctx.session.personalReplies) ctx.session.personalReplies = [];
  ctx.session.personalReplies.push(reply);
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.reply(
    `✅ Created "${reply.name}"\n\nButton: ${reply.buttonText}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to my replies", "my:show")],
      ]),
    },
  );
});

export default composer;
