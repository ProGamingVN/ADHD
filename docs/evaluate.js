import { pipeline } from "@xenova/transformers";
import fs from "fs";
import readline from "readline";

console.log("Đang tải AI...");

const data = JSON.parse(
    fs.readFileSync("./ai/embeddings.json", "utf8")
);

const extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
);

console.log("AI sẵn sàng.\n");

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

async function askAI(question)
{
    const q = await extractor(question, {
        pooling: "mean",
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
        return "Mình chưa hiểu rõ câu hỏi. Bạn có thể nói rõ hơn được không?";
    }

    return best.answer;
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function input(text)
{
    return new Promise(resolve => {
        rl.question(text, resolve);
    });
}

const SAVE_FILE = "evaluation.json";

let logs = [];

if (fs.existsSync(SAVE_FILE))
{
    const content = fs.readFileSync(
        SAVE_FILE,
        "utf8"
    ).trim();

    if (content)
    {
        logs = JSON.parse(content);
    }
}

console.log("==========================================");
console.log("       AI CHATBOT EVALUATOR");
console.log("==========================================");
console.log("Nhập 'end' để kết thúc.\n");

while (true)
{
    const question = await input("test: ");

    const command = question.trim().toLowerCase();

    if (command === "end")
        break;

    if (command === "undo")
    {
        if (logs.length > 0)
        {
            logs.pop();

            fs.writeFileSync(
                SAVE_FILE,
                JSON.stringify(logs, null, 2)
            );

            console.log("Đã xóa feedback gần nhất.");
        }
        else
        {
            console.log("Không có dữ liệu để undo.");
        }

        console.log("\n------------------------------------------\n");
        continue;
    }
    const answer = await askAI(question);

    console.log("\nans:");
    console.log(answer);
    console.log();

    const feedback = (
        await input("Feedback (y/n): ")
    ).trim().toLowerCase();

    if (feedback === "n")
{
    const reason = await input("reason: ");

    logs.push({
        question,
        answer,
        feedback,
        reason
    });

    fs.writeFileSync(
        SAVE_FILE,
        JSON.stringify(logs, null, 2)
    );

    console.log("Đã lưu feedback lỗi.");
}
else
{
    console.log("Không lưu.");
}

    console.log("\n------------------------------------------\n");
}

rl.close();

console.log("\nĐã lưu vào evaluation.json");