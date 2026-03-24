# PLAN: Telegram Bot Integration 🤖📜

This plan outlines the creation of a free-tier Telegram bot that periodically sends quiz questions and mistakes from the Stride database into a Telegram group as polls.

## Phase -1: Context Check
- **Technology**: Next.js, Firestore, Telegram Bot API.
- **Constraints**: MUST BE FREE. Free-tier scheduling (GitHub Actions recommended).
- **Core Loop**: Every 2 hours -> Fetch mistake/quiz question -> Create Telegram Poll -> Send to Group.
- **Admin Control**: Select daily subject or random.

## Phase 0: Socratic Gate ⚖️

> [!IMPORTANT]
> The following questions must be answered to refine the implementation:

1.  **Scheduler/Hosting**: Since standard hobby-tier cron jobs (like Vercel's) often have frequency limits, are you comfortable using **GitHub Actions** to trigger the bot every 2 hours for free?
2.  **Polling Format**: Telegram polls work best for multiple-choice. Should we focus on MCQs from the quiz/mistake pool, or should the bot attempt to format 'Case' scenarios and 'True/False' questions into the poll text?
3.  **Admin UI**: For the "Daily Subject" selection, would you like a new toggle/dropdown in your existing **Admin Portal** to set the "Bot Subject of the Day"?
4.  **Telegram Access**: Do you have a **Bot Token** from @BotFather yet, or do you need me to guide you through the setup?

## Phase 1: Infrastructure & Data 🏗️
- **Firestore Config**: Create `botConfig` collection to store `subjectId` (or "random") and `lastSentAt`.
- **API Endpoint**: Create a protected Next.js API route `/api/bot/cron` that:
  - Validates a `CRON_SECRET`.
  - Determines the active subject from Firestore.
  - Prioritizes "Mistakes" for that subject, then falls back to lecture quizzes.
  - Selects a random question ensuring it hasn't been sent too recently (optional).

## Phase 2: Bot Logic & Formatting 🧙‍♂️
- **MCQ / True-False**: Map directly to Telegram Native Polls (`sendPoll`).
- **Case Studies**:
  - Send the **Scenario** as a standard message.
  - Send the **Question/Options** as a linked poll immediately after.
- **Service**: Implement `lib/telegram-service.ts` to handle Telegram API calls.

## Phase 3: Admin Controls 🎮
- **Admin Layout**: Add a "Telegram Bot Control" panel to the Admin Portal.
- **Features**:
  - Dropdown to select "Subject of the Day" (listing all subjects + "Random").
  - "Trigger Now" button for manual testing.
  - Display "Last Sent" status.

## Phase 4: GitHub Action Scheduler ⏰
- **Guidance**: Walk the user through creating a GitHub Repository Secret for `CRON_SECRET` and `BOT_URL`.
- **Workflow**: Create `.github/workflows/telegram-bot.yml` to `curl` the API every 2 hours.

## Phase 5: Verification Checklist ✅
- [ ] Admin can change the bot's subject.
- [ ] Manual trigger sends a correct poll to the group.
- [ ] Case studies are formatted with scenario + poll.
- [ ] GitHub Action successfully triggers the API.
