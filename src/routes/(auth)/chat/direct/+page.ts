import type { PageLoad } from "../../../../../.svelte-kit/types/src/routes";

export const load = (async ({ params }) => {
  localStorage.setItem("currentRecentChat", "direct/" + params.chatId);
}) as PageLoad;
