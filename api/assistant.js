export const config = {
  maxDuration: 60
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, contexte, memoire } = req.body

  const systemPrompt = `Tu es un assistant médical spécialisé dans la maladie de Crohn, personnel et bienveillant.
Tu analyses les données de santé de l'utilisateur et fournis des conseils personnalisés, scientifiquement fondés.

${memoire ? `MÉMOIRE DES CONVERSATIONS PRÉCÉDENTES :
${memoire}

` : ''}CONTEXTE MÉDICAL ACTUEL DU PATIENT :
${contexte}

RÈGLES IMPORTANTES :
- Tu dois TOUJOURS tenir compte du contexte médical (sténose, inflammation, traitements) avant de juger un aliment
- Ne jamais dire qu'un aliment est "mauvais" sans nuance — tout dépend du contexte Crohn
- Si une analyse est anormale, fais le lien avec les symptômes ou la fatigue quand c'est pertinent
- Tes réponses doivent être chaleureuses, encourageantes, jamais alarmistes
- Tu peux mentionner des mécanismes biologiques (hepcidine, TNF-α, etc.) si c'est utile
- Toujours rappeler de consulter le médecin pour les décisions importantes
- Réponds en français, de façon claire et structurée
- Ne coupe JAMAIS ta réponse en plein milieu — termine toujours ta pensée complètement`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages
      })
    })

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Erreur API Anthropic:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}