let chatIds: number[] = [];

export const saveChatId = (id: number) => {
  if (!chatIds.includes(id)) {
    chatIds.push(id);
  }
};

export const getAllChatIds = (): number[] => {
  return chatIds;
};
