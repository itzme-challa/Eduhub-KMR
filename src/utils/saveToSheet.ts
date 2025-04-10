export const saveToSheet = async (chat: {
  id: number;
  username?: string;
  first_name?: string;
}): Promise<boolean> => {
  try {
    const payload = {
      id: chat.id,
      username: chat.username || '',
      first_name: chat.first_name || '',
    };

    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbwIf0o8gymySxzRiG1nEOqUW1glBuyygF1aI8jZ6Cn6gmTfUHBkVC68pRUIFJ5x18UN/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const text = await response.text();
    if (response.ok) {
      if (text.includes('Already Notified')) return true;
      else return false; // Newly added
    } else {
      console.error(`Google Sheet response error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send to Google Sheet:', error);
  }

  return false; // Fallback
};
