import OpenAI from "openai";
import { type EvaluationResult } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function evaluateBook(bookText: string): Promise<EvaluationResult> {
  const evaluationPrompt = `
You are a content and literacy evaluator for the UAE Ministry of Education.
You will evaluate a children's or family book based on its content, complexity, and cultural ethics.

Return a detailed JSON with these fields:
{
  "title": "Book Title",
  "arabic_title": "العنوان بالعربية (if book is Arabic or has Arabic translation, otherwise null)",
  "author": "Author name or 'Regional author' if unknown",
  "publisher": "Publisher name (e.g., 'Kalimat (UAE)' or 'Dar Al Salwa (Jordan)') or null if unknown",
  "language": "Arabic | English | Bilingual",
  "rating": 4.6,
  "executive_summary": "Concise overview of the story, its themes, and tone.",
  "language_complexity": "Low / Moderate / High based on vocabulary, sentence structure, and readability.",
  "domains": {
    "gambling": "...",
    "language": "...",
    "violence_terror": "...",
    "alcohol_drugs_smoking": "...",
    "sex_nudity": "...",
    "islamic_arab_uae_cultural_ethics": "..."
  },
  "lessons_learned": "List the moral or educational takeaways for children or families.",
  "parent_discussion_guide": {
    "before_reading": ["Question 1", "Question 2", "Question 3"],
    "after_reading": ["Question 1", "Question 2", "Question 3", "Question 4"]
  },
  "age_verdicts": {
    "0-3": "",
    "3-5": "",
    "6-9": "",
    "10-12": "",
    "13-16": "",
    "17+": "",
    "21+": ""
  },
  "recommended_minimum_age": "One group only (e.g., '6-9')",
  "key_drivers": ["List of reasons behind the classification"],
  "genres": ["Select from: Islamic, UAE Culture, Culture, Heritage, Adventure, Fantasy, Mystery, Science, STEM, Educational, Bedtime, Interactive, Nature, Friendship, Emotions, Philosophy, Humor, Gaming, Social Learning, Traditional"],
  "themes": ["List 2-3 main themes from the book (e.g., 'Nature / Resilience', 'Friendship / Diversity', 'Hope / Future')"],
  "domain_scores": {
    "gambling": 0-5,
    "language": 0-5,
    "violence_terror": 0-5,
    "alcohol_drugs_smoking": 0-5,
    "sex_nudity": 0-5,
    "islamic_arab_uae_cultural_ethics": 0-5
  }
}

Guidelines:
- For rating: Generate a realistic rating between 4.0 and 5.0 based on content quality
- For domain_scores: 0 = perfect, 1-2 = minor concerns, 3-4 = moderate concerns, 5 = severe concerns
- For genres: Select 1-3 most relevant genres from the list
- For themes: Extract 2-3 main themes separated by ' / '

Now, perform the evaluation carefully in both English and Arabic books.
Adjust the age recommendations based on:
- Plot and theme complexity
- Vocabulary difficulty
- Reading comprehension expected
- Sensitivity to violence or ethics

Return complete JSON output only.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: evaluationPrompt
        },
        {
          role: "user",
          content: `BOOK TEXT:\n${bookText}`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const result = JSON.parse(content);
    
    // Calculate whitelist score
    let whitelistScore = 100;
    const domains = result.domains || {};
    
    const penalty = (domainValue: string) => {
      const text = String(domainValue).toLowerCase();
      if (text.includes("moderate")) return 15;
      if (text.includes("high") || text.includes("severe")) return 30;
      return 0;
    };

    Object.values(domains).forEach((value) => {
      whitelistScore -= penalty(value as string);
    });

    const languageComplexity = (result.language_complexity || "").toLowerCase();
    if (languageComplexity.includes("high")) {
      whitelistScore -= 15;
    } else if (languageComplexity.includes("moderate")) {
      whitelistScore -= 5;
    }

    const whitelistVerdict = whitelistScore >= 70 
      ? "✅ Whitelisted – Safe for general use"
      : "🚫 Not Whitelisted – Requires Review";

    return {
      ...result,
      whitelist_score: Math.max(0, whitelistScore),
      whitelist_verdict: whitelistVerdict,
    };

  } catch (error) {
    console.error("OpenAI evaluation error:", error);
    throw new Error(`Book evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
