fetch('http://localhost:3000/api/chat', { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' }, 
  body: JSON.stringify({ messages: [{ role: 'user', text: 'Hello' }], feature: 'lite' }) 
}).then(res => res.json()).then(console.log).catch(console.error);
