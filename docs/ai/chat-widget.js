import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

const data = await fetch('/ai/embeddings.json')
  .then(r => r.json());

const extractor = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

function cosine(a, b)
{
  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++)
  {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function askAI(question)
{
  const q = await extractor(question, {
    pooling: 'mean',
    normalize: true
  });

  const qVec = Array.from(q.data);

  let best = null;
  let bestScore = -1;

  for (const item of data)
  {
    const score = cosine(qVec, item.embedding);

    if (score > bestScore)
    {
      bestScore = score;
      best = item;
    }
  }

  if (bestScore < 0.7)
  {
    return 'Mình chưa hiểu rõ câu hỏi. Bạn có thể nói rõ hơn được không?';
  }

  return best.answer;
}
