import { Composer } from "grammy";
import type { Ctx, PersonalReply } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

composer.callbackQuery(/^reply:edit:(.+)$/, async (ctx) => {
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
  ctx.session.step = "awaiting_edit_field";
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.editId = id;
  await ctx.reply(
    `Editing "${reply.name}"\n\nWhat do you want to change?`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("Name", `reply:edit_field:name:${id}`)],
        [inlineButton("Button text", `reply:edit_field:button:${id}`)],
        [inlineButton("Payload", `reply:edit_field:payload:${id}`)],
        [inlineButton("⬅️ Back", "my:show")],
      ]),
    },
  );
});

composer.callbackQuery(/^reply:edit_field:name:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = ctx.match[1];
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.editId = id;
  ctx.session.step = "awaiting_edit_name";
  await ctx.reply("Enter the new name:", {
    reply_markup: { force_reply: true, input_field_placeholder: "New name" },
  });
});

composer.callbackQuery(/^reply:edit_field:button:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = ctx.match[1];
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.editId = id;
  ctx.session.step = "awaiting_edit_button";
  await ctx.reply("Enter the new button text:", {
    reply_markup: { force_reply: true, input_field_placeholder: "New button text" },
  });
});

composer.callbackQuery(/^reply:edit_field:payload:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const id = ctx.match[1];
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.editId = id;
  ctx.session.step = "awaiting_edit_payload";
  await ctx.reply("Enter the new payload message:", {
    reply_markup: { force_reply: true, input_field_placeholder: "New payload" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_edit_name") return next();
  const editId = ctx.session.flowData?.editId;
  if (!editId) { ctx.session.step = undefined; return next(); }
  const newName = ctx.message.text.trim();
  if (newName.length < 1 || newName.length > 50) {
    await ctx.reply("Name must be 1–50 characters. Try again.");
    return;
  }
  const replies = ctx.session.personalReplies ?? [];
  const reply = replies.find((r: PersonalReply) => r.id === editId);
  if (reply) reply.name = newName;
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.reply(`✅ Updated name to "${newName}"`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to my replies", "my:show")]]),
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_edit_button") return next();
  const editId = ctx.session.flowData?.editId;
  if (!editId) { ctx.session.step = undefined; return next(); }
  const newBtn = ctx.message.text.trim();
  if (newBtn.length < 1 || newBtn.length > 64) {
    await ctx.reply("Button text must be 1–64 characters. Try again.");
    return;
  }
  const replies = ctx.session.personalReplies ?? [];
  const reply = replies.find((r: PersonalReply) => r.id === editId);
  if (reply) reply.buttonText = newBtn;
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.reply(`✅ Updated button text to "${newBtn}"`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to my replies", "my:show")]]),
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_edit_payload") return next();
  const editId = ctx.session.flowData?.editId;
  if (!editId) { ctx.session.step = undefined; return next(); }
  const newPayload = ctx.message.text.trim();
  const replies = ctx.session.personalReplies ?? [];
  const reply = replies.find((r: PersonalReply) => r.id === editId);
  if (reply) reply.payload = newPayload;
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.reply("✅ Updated payload", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to my replies", "my:show")]]),
  });
});

export default composer;
