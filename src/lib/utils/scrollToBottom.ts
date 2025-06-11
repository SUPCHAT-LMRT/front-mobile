export const scrollToBottom = async (node, behavior = "smooth") => {
  node.scroll({ top: node.scrollHeight, behavior });
};
