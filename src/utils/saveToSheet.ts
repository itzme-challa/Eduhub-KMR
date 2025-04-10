export const saveToSheet = async (chat: {
  id: number;
  username?: string;
  first_name?: string;
}) => {
  try {
    const payload = {
      id: chat.id,
      username: chat.username || '',
      first_name: chat.first_name || '',
    };

    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbxFk1mggU9fBqodGwkQutQm1Sg1aoAT-H_FQEzXFlnItruNLCLbY9lh9Z_A3LpGW2nd/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      console.error(`Google Sheet response error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send to Google Sheet:', error);
  }
};
