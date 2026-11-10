import { useParams } from "@tanstack/react-router";

export const useConversationId = () =>
  useParams({
    from: "/_auth/$conversationId",
    select: (params) => params.conversationId,
  });
