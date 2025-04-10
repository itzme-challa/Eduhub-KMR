let chatIds: number[] = [];

export const saveChatId = (id: number) => {
  if (!chatIds.includes(id)) {
    chatIds.push(id);
  }
};

export const getAllChatIds = (): number[] => {
  return chatIds;
};
export const fetchChatIdsFromSheet = async (): Promise<number[]> => {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbxFk1mggU9fBqodGwkQutQm1Sg1aoAT-H_FQEzXFlnItruNLCLbY9lh9Z_A3LpGW2nd/exec');
    const data = await response.json();

    const ids = data.map((entry: any) => Number(entry.id)).filter((id: number) => !isNaN(id));
    return ids;
  } catch (error) {
    console.error('Failed to fetch chat IDs from Google Sheet:', error);
    return [];
  }
};
