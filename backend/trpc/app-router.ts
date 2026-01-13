import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import createProposalProcedure from "./routes/proposals/create/route";
import listProposalsProcedure from "./routes/proposals/list/route";
import approveProposalProcedure from "./routes/proposals/approve/route";
import rejectProposalProcedure from "./routes/proposals/reject/route";
import applyProposalProcedure from "./routes/proposals/apply/route";
import createQuestProcedure from "./routes/quests/create/route";
import listQuestsProcedure from "./routes/quests/list/route";
import getQuestProcedure from "./routes/quests/get/route";
import updateQuestProcedure from "./routes/quests/update/route";
import deleteQuestProcedure from "./routes/quests/delete/route";
import saveConversationProcedure from "./routes/conversations/save/route";
import loadConversationProcedure from "./routes/conversations/load/route";
import saveMemoryProcedure from "./routes/memory/save/route";
import retrieveMemoryProcedure from "./routes/memory/retrieve/route";
import updateMemoryProcedure from "./routes/memory/update/route";
import deleteMemoryProcedure from "./routes/memory/delete/route";
import searchMemoryProcedure from "./routes/memory/search/route";
import getNaviProfileProcedure from "./routes/navi/getProfile/route";
import updateNaviProfileProcedure from "./routes/navi/updateProfile/route";
import syncAppStateProcedure from "./routes/appstate/sync/route";
import loadAppStateProcedure from "./routes/appstate/load/route";
import syncFullStateProcedure from "./routes/fullstate/sync/route";
import loadFullStateProcedure from "./routes/fullstate/load/route";
import syncChatProcedure from "./routes/chat/sync/route";
import loadChatProcedure from "./routes/chat/load/route";
import googleAuthProcedure from "./routes/integrations/google/auth/route";
import { getCalendarEvents, createCalendarEvent } from "./routes/integrations/google/calendar/route";
import appleAuthProcedure from "./routes/integrations/apple/auth/route";
import { getAppleCalendarEvents, createAppleCalendarEvent, syncAppleCalendar } from "./routes/integrations/apple/calendar/route";
import trackAnalyticsProcedure from "./routes/analytics/track/route";
import analyticsSummaryProcedure from "./routes/analytics/summary/route";
import analyticsStreaksProcedure from "./routes/analytics/streaks/route";
import createReminderProcedure from "./routes/reminders/create/route";
import listRemindersProcedure from "./routes/reminders/list/route";
import updateReminderProcedure from "./routes/reminders/update/route";
import deleteReminderProcedure from "./routes/reminders/delete/route";
import getPendingRemindersProcedure from "./routes/reminders/getPending/route";
import createFileProcedure from "./routes/files/create/route";
import uploadFileProcedure from "./routes/files/upload/route";
import listFilesProcedure from "./routes/files/list/route";
import getFileProcedure from "./routes/files/get/route";
import updateFileProcedure from "./routes/files/update/route";
import deleteFileProcedure from "./routes/files/delete/route";
import uploadImageProcedure from "./routes/images/upload/route";
import generateImageProcedure from "./routes/images/generate/route";
import editImageProcedure from "./routes/images/edit/route";
import listImagesProcedure from "./routes/images/list/route";
import getImageProcedure from "./routes/images/get/route";
import deleteImageProcedure from "./routes/images/delete/route";
import googleSearchProcedure from "./routes/integrations/google/search/route";
import openaiChatProcedure from "./routes/integrations/openai/chat/route";
import openaiEmbeddingProcedure from "./routes/integrations/openai/embedding/route";
import ttsSpeakProcedure from "./routes/tts/speak/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  proposals: createTRPCRouter({
    create: createProposalProcedure,
    list: listProposalsProcedure,
    approve: approveProposalProcedure,
    reject: rejectProposalProcedure,
    apply: applyProposalProcedure,
  }),
  quests: createTRPCRouter({
    create: createQuestProcedure,
    list: listQuestsProcedure,
    get: getQuestProcedure,
    update: updateQuestProcedure,
    delete: deleteQuestProcedure,
  }),
  conversations: createTRPCRouter({
    save: saveConversationProcedure,
    load: loadConversationProcedure,
  }),
  memory: createTRPCRouter({
    save: saveMemoryProcedure,
    retrieve: retrieveMemoryProcedure,
    update: updateMemoryProcedure,
    delete: deleteMemoryProcedure,
    search: searchMemoryProcedure,
  }),
  navi: createTRPCRouter({
    getProfile: getNaviProfileProcedure,
    updateProfile: updateNaviProfileProcedure,
  }),
  appstate: createTRPCRouter({
    sync: syncAppStateProcedure,
    load: loadAppStateProcedure,
  }),
  fullstate: createTRPCRouter({
    sync: syncFullStateProcedure,
    load: loadFullStateProcedure,
  }),
  chat: createTRPCRouter({
    sync: syncChatProcedure,
    load: loadChatProcedure,
  }),
  integrations: createTRPCRouter({
    google: createTRPCRouter({
      auth: googleAuthProcedure,
      getCalendarEvents: getCalendarEvents,
      createCalendarEvent: createCalendarEvent,
      search: googleSearchProcedure,
    }),
    apple: createTRPCRouter({
      auth: appleAuthProcedure,
      getCalendarEvents: getAppleCalendarEvents,
      createCalendarEvent: createAppleCalendarEvent,
      syncCalendar: syncAppleCalendar,
    }),
    openai: createTRPCRouter({
      chat: openaiChatProcedure,
      embedding: openaiEmbeddingProcedure,
    }),
  }),
  tts: createTRPCRouter({
    speak: ttsSpeakProcedure,
  }),
  analytics: createTRPCRouter({
    track: trackAnalyticsProcedure,
    summary: analyticsSummaryProcedure,
    streaks: analyticsStreaksProcedure,
  }),
  reminders: createTRPCRouter({
    create: createReminderProcedure,
    list: listRemindersProcedure,
    update: updateReminderProcedure,
    delete: deleteReminderProcedure,
    getPending: getPendingRemindersProcedure,
  }),
  files: createTRPCRouter({
    create: createFileProcedure,
    upload: uploadFileProcedure,
    list: listFilesProcedure,
    get: getFileProcedure,
    update: updateFileProcedure,
    delete: deleteFileProcedure,
  }),
  images: createTRPCRouter({
    upload: uploadImageProcedure,
    generate: generateImageProcedure,
    edit: editImageProcedure,
    list: listImagesProcedure,
    get: getImageProcedure,
    delete: deleteImageProcedure,
  }),
});

export type AppRouter = typeof appRouter;
