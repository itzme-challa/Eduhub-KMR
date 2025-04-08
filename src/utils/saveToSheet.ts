export const saveToSheet = async (chat: any) => {
  try {
    await fetch('https://script.google.com/macros/s/AKfycbxFk1mggU9fBqodGwkQutQm1Sg1aoAT-H_FQEzXFlnItruNLCLbY9lh9Z_A3LpGW2nd/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: chat.id,
        username: chat.username || '',
        first_name: chat.first_name || '',
      }),
    });
  } catch (error) {
    console.error('Failed to send to Google Sheet:', error);
  }
};
