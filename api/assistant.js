export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { messages, contexte } = await req.json()

  const systemPrompt = `Tu es un assistant médical spécialisé dans la maladie de Crohn. 
Tu analyses les données de santé de l'utilisateur et fournis des conseils personnalisés, bienveillants et scientifiquement fondés.

CONTEXTE ACTUEL DU PATIENT :
${contexte}

RÈGLES IMPORTANTES :
- Tu dois TOUJOURS tenir compte du contexte médical (sténose, inflammation, traitements) avant de juger un aliment
- Ne jamais dire qu'un aliment est "mauvais" sans nuance — tout dépend du contexte Crohn
- Si une analyse est anormale, fais le lien avec les symptômes ou la fatigue quand c'est pertinent
- Tes réponses doivent être chaleureuses, encourageantes, jamais alarmistes
- Tu peux mentionner des mécanismes biologiques (hepcidine, TNF-α, etc.) si c'est utile
- Toujours rappeler de consulter le médecin pour les décisions importantes
- Réponds en français, de façon claire et structurée avec des emojis pour la lisibilité`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    })
  })

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
}