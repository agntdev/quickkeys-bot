import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { OWNER_ID } from "../config.js";
import { sharedReplies } from "./shared.js";
import { pendingExports } from "./export-start.js";

const composer = new Composer<Ctx>();

function isOwner(ctx: Ctx): boolean {
  return OWNER_ID > 0 && ctx.from?.id === OWNER_ID;
}

composer.callbackQuery("owner:admin", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) {
    await ctx.reply("Only the owner can access admin controls.");
    return;
  }
  await ctx.editMessageText(
    "⚙️ Owner admin panel",
    {
      reply_markup: inlineKeyboard([
        [inlineButton("🌐 Manage shared set", "owner:shared")],
        [inlineButton("📤 Review exports", "owner:exports")],
        [inlineButton("➕ Add shared reply", "owner:add")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery("owner:shared", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) {
    await ctx.reply("Only the owner can access admin controls.");
    return;
  }
  if (sharedReplies.length === 0) {
    await ctx.editMessageText(
      "No shared replies yet.\n\nTap ➕ Add shared reply to create one.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("➕ Add shared reply", "owner:add")],
          [inlineButton("⬅️ Back", "owner:admin")],
        ]),
      },
    );
    return;
  }
  const rows: { text: string; callback_data: string }[][] = [];
  for (const reply of sharedReplies) {
    const status = reply.ownerApproved ? "✅" : "⏳";
    rows.push([inlineButton(`${status} ${reply.buttonText}`, `owner:shared_detail:${reply.id}`)]);
  }
  rows.push([inlineButton("➕ Add shared reply", "owner:add")]);
  rows.push([inlineButton("⬅️ Back", "owner:admin")]);
  await ctx.editMessageText(
    `🌐 Shared replies (${sharedReplies.length}/100)`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.callbackQuery(/^owner:shared_detail:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) return;
  const id = ctx.match[1];
  const reply = sharedReplies.find((r) => r.id === id);
  if (!reply) {
    await ctx.reply("Reply not found.");
    return;
  }
  const status = reply.ownerApproved ? "Approved" : "Pending";
  await ctx.editMessageText(
    `💬 ${reply.buttonText}\n\nStatus: ${status}\nPayload: ${reply.payload}`,
    {
      reply_markup: inlineKeyboard([
        [
          reply.ownerApproved
            ? inlineButton("⏳ Revoke", `owner:shared_toggle:${id}`)
            : inlineButton("✅ Approve", `owner:shared_toggle:${id}`),
        ],
        [inlineButton("🗑 Delete", `owner:shared_delete:${id}`)],
        [inlineButton("⬅️ Back", "owner:shared")],
      ]),
    },
  );
});

composer.callbackQuery(/^owner:shared_toggle:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) return;
  const id = ctx.match[1];
  const reply = sharedReplies.find((r) => r.id === id);
  if (!reply) {
    await ctx.reply("Reply not found.");
    return;
  }
  reply.ownerApproved = !reply.ownerApproved;
  const status = reply.ownerApproved ? "Approved" : "Revoked";
  await ctx.reply(`✅ ${reply.buttonText} ${status}`);
});

composer.callbackQuery(/^owner:shared_delete:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) return;
  const id = ctx.match[1];
  const idx = sharedReplies.findIndex((r) => r.id === id);
  if (idx < 0) {
    await ctx.reply("Reply not found.");
    return;
  }
  const deleted = sharedReplies[idx];
  sharedReplies.splice(idx, 1);
  await ctx.reply(`🗑 Deleted shared reply "${deleted.buttonText}"`);
});

composer.callbackQuery("owner:add", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) return;
  if (sharedReplies.length >= 100) {
    await ctx.reply("Shared set is full (100 limit). Delete some first.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back", "owner:shared")]]),
    });
    return;
  }
  ctx.session.step = "owner_awaiting_button";
  if (!ctx.session.flowData) ctx.session.flowData = {};
  await ctx.reply("Enter the button text for the new shared reply:", {
    reply_markup: { force_reply: true, input_field_placeholder: "Button text" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "owner_awaiting_button") return next();
  if (!isOwner(ctx)) return next();
  const text = ctx.message.text.trim();
  if (text.length < 1 || text.length > 64) {
    await ctx.reply("Button text must be 1–64 characters. Try again.");
    return;
  }
  if (!ctx.session.flowData) ctx.session.flowData = {};
  ctx.session.flowData.buttonText = text;
  ctx.session.step = "owner_awaiting_payload";
  await ctx.reply("Enter the message to send when this button is tapped:", {
    reply_markup: { force_reply: true, input_field_placeholder: "Message" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "owner_awaiting_payload") return next();
  if (!isOwner(ctx)) return next();
  const payload = ctx.message.text.trim();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  sharedReplies.push({
    id,
    buttonText: ctx.session.flowData?.buttonText ?? "",
    payload,
    ownerApproved: true,
  });
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.reply(`✅ Added shared reply`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to admin", "owner:admin")]]),
  });
});

composer.callbackQuery("owner:exports", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) return;
  if (pendingExports.length === 0) {
    await ctx.editMessageText(
      "No pending exports to review.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back", "owner:admin")],
        ]),
      },
    );
    return;
  }
  const rows: { text: string; callback_data: string }[][] = [];
  for (const exp of pendingExports) {
    rows.push([inlineButton(`📤 ${exp.setName} (${exp.shareCode})`, `owner:export_detail:${exp.id}`)]);
  }
  rows.push([inlineButton("⬅️ Back", "owner:admin")]);
  await ctx.editMessageText(
    `📤 Pending exports (${pendingExports.length})`,
    { reply_markup: inlineKeyboard(rows) },
  );
});

composer.callbackQuery(/^owner:export_detail:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) return;
  const id = ctx.match[1];
  const exp = pendingExports.find((e) => e.id === id);
  if (!exp) {
    await ctx.reply("Export not found.");
    return;
  }
  await ctx.editMessageText(
    `📤 Export: ${exp.setName}\nShare code: ${exp.shareCode}\nUser: ${exp.userId}`,
    {
      reply_markup: inlineKeyboard([
        [
          inlineButton("✅ Approve", `owner:export_approve:${id}`),
          inlineButton("❌ Reject", `owner:export_reject:${id}`),
        ],
        [inlineButton("⬅️ Back", "owner:exports")],
      ]),
    },
  );
});

composer.callbackQuery(/^owner:export_approve:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) return;
  const id = ctx.match[1];
  const idx = pendingExports.findIndex((e) => e.id === id);
  if (idx < 0) {
    await ctx.reply("Export not found.");
    return;
  }
  const exp = pendingExports[idx];
  exp.pendingApproval = false;
  exp.isPublic = true;
  pendingExports.splice(idx, 1);
  await ctx.reply(`✅ Approved export "${exp.setName}" (code: ${exp.shareCode})`);
  try {
    await ctx.api.sendMessage(exp.userId, `Your export "${exp.setName}" has been approved! Share code: ${exp.shareCode}`);
  } catch {
    // User may have blocked the bot
  }
});

composer.callbackQuery(/^owner:export_reject:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isOwner(ctx)) return;
  const id = ctx.match[1];
  const idx = pendingExports.findIndex((e) => e.id === id);
  if (idx < 0) {
    await ctx.reply("Export not found.");
    return;
  }
  const exp = pendingExports[idx];
  pendingExports.splice(idx, 1);
  await ctx.reply(`❌ Rejected export "${exp.setName}"`);
  try {
    await ctx.api.sendMessage(exp.userId, `Your export "${exp.setName}" was not approved.`);
  } catch {
    // User may have blocked the bot
  }
});

export default composer;
