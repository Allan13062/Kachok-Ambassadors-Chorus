fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    feature: 'lite', 
    messages: [
      { role: "assistant", text: "Greetings in Christ!" },
      { role: "user", text: "How can we book the choir?" }
    ] 
  })
}).then(async r => {
  console.log("Status:", r.status);
  const text = await r.text();
  console.log("Body:", text);
}).catch(console.error);
