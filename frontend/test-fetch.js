fetch("http://localhost:3001/api/ai/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "hi", stream: true })
}).then(async (res) => {
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}).catch(console.error);
