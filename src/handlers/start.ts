import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "📋 My replies", data: "my:show", order: 10 });
registerMainMenuItem({ label: "🌐 Shared", data: "shared:show", order: 20 });
registerMainMenuItem({ label: "⚙️ Owner", data: "owner:admin", order: 30 });

const composer = new Composer<Ctx>();

const WELCOME = "👋 Welcome to QuickReply Manager!\n\nTap a button below to manage your quick replies.";

composer.command("start", async (ctx) => {
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
