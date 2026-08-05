export async function perguntarIA(prompt: string) {
  const response = await fetch("/api/ia", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error("Erro ao consultar IA");
  }

  return response.json();
}