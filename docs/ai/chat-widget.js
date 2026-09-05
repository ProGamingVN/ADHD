import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

const data = await fetch('/ai/embeddings.json')
  .then(r => r.json());

const knowledge = await fetch('/ai/knowledge.json')
  .then(r => r.json());

// Map mỗi "pattern" (câu mẫu) sang section/tab tương ứng trên trang, để có thể
// chèn nút "Xem thêm" trỏ đúng tới vị trí nội dung nguồn khi trả lời.
const sectionByPattern = new Map();
for (const item of knowledge) {
  if (!item.section) continue;
  for (const pattern of item.patterns) {
    sectionByPattern.set(pattern, { section: item.section, tab: item.tab || null });
  }
}

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

  if (bestScore < 0.60)
  {
    return 'Mình chưa hiểu rõ câu hỏi. Bạn có thể nói rõ hơn được không?';
  }

  const loc = sectionByPattern.get(best.text);

  if (loc && loc.section)
  {
    const tabAttr = loc.tab ? ` data-tab="${loc.tab}"` : '';
    return `${best.answer} <a href="#${loc.section}"${tabAttr} class="chat-see-more">Xem thêm →</a>`;
  }

  return best.answer;
}