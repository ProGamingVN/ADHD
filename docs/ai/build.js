import { pipeline } from '@xenova/transformers';
import fs from 'fs';

const data = JSON.parse(
  fs.readFileSync('./knowledge.json', 'utf8')
);


console.log('Đang tải model AI...');

const extractor = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

const result = [];

for (const item of data)
{
  for (const pattern of item.patterns)
  {
    console.log('Train:', pattern);

    const embedding = await extractor(pattern, {
      pooling: 'mean',
      normalize: true
    });

    result.push({
      text: pattern,
      answer: item.answer,
      embedding: Array.from(embedding.data)
    });
  }
}

fs.writeFileSync(
  './embeddings.json',
  JSON.stringify(result)
);


console.log('Train xong!');
console.log('Đã tạo ai/embeddings.json');