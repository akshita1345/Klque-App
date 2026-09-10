import { User } from "@/server/db/mongodb/user/user.model";
import { Session } from "@/server/db/mongodb/session/session.model";
import { ChatConversation } from "@/server/db/mongodb/chat-conversation/chat-conversation.model";
import { ChatHistory } from "@/server/db/mongodb/chat-conversation/chat-history.model";
import { Content } from "@/server/db/mongodb/content/content.model";
import { Task } from "@/server/db/mongodb/task/task.model";
import { PaymentLogs } from "@/server/db/mongodb/plan/paymentlogs.model";
import { PaymentHistory } from "@/server/db/mongodb/plan/planhistory.model";
import { Counter } from "@/server/db/mongodb/counter/counter.model";
import { SearchHistory } from "@/server/db/mongodb/search-history/search-history.model";
import { ProfileSummary } from "@/server/db/mongodb/profile-summary/profileSummary.model";
import { AlertNotification } from "@/server/db/mongodb/alert-notification/alert-notification.model";


export const models = {
    User,
    Session,
    ChatConversation,
    ChatHistory,
    Content,
    Task,
    PaymentLogs,
    PaymentHistory,
    Counter,
    SearchHistory,
    ProfileSummary,
    AlertNotification,
};