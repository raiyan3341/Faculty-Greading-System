import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  dataUrl: z.string().min(32),
  mimeType: z.string().min(3),
});

export type ScannedStudent = { name: string; roll: string };

export const scanStudentList = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) throw new Error("Scanning is not configured. Please add GEMINI_API_KEY in .env");

    // dataUrl থেকে শুধু base64 অংশ আলাদা করা
    const base64Data = data.dataUrl.includes(",") 
      ? data.dataUrl.split(",")[1] 
      : data.dataUrl;

    // Google Gemini 1.5 Flash-এর সরাসরি নেটিভ এন্ডপয়েন্ট
    const response = await fetch(
      // পরিবর্তন করে এটি লিখুন:
`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,

      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'You read scanned university class lists. Return ONLY compact JSON of the form {"students":[{"name":"...","roll":"..."}]} . "roll" is the student ID / roll / registration number exactly as printed. Skip headers, totals and signatures. If a value is unreadable, use an empty string. Extract every student\'s name and ID from this list.',
                },
                {
                  inline_data: {
                    mime_type: data.mimeType || "image/jpeg",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      if (response.status === 429) throw new Error("Scanning is rate limited right now. Try again shortly.");
      throw new Error(`Scanning failed (${response.status}). ${detail.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { students: [] as ScannedStudent[] };

    try {
      const parsed = JSON.parse(match[0]) as { students?: { name?: string; roll?: string }[] };
      const students = (parsed.students ?? [])
        .map((s) => ({ name: (s.name ?? "").trim(), roll: (s.roll ?? "").trim() }))
        .filter((s) => s.name || s.roll);
      return { students };
    } catch {
      return { students: [] as ScannedStudent[] };
    }
  });
