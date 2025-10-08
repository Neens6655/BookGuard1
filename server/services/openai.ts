import OpenAI from "openai";
import { type EvaluationResult } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function evaluateBook(bookText: string): Promise<EvaluationResult> {
  const evaluationPrompt = `
You are a content and literacy evaluator for the UAE Ministry of Education.
You will evaluate a children's or family book using a 4-system framework based on UAE cultural values, child safety, theme complexity, and language complexity.

Return a detailed JSON with these fields:
{
  "title": "Book Title",
  "arabic_title": "العنوان بالعربية (if book is Arabic or has Arabic translation, otherwise null)",
  "author": "Author name or 'Regional author' if unknown",
  "publisher": "Publisher name (e.g., 'Kalimat (UAE)' or 'Dar Al Salwa (Jordan)') or null if unknown",
  "language": "Arabic | English | Bilingual",
  "rating": 4.6,
  "executive_summary": "Concise overview of the story, its themes, and tone.",
  
  "system1_uae_values": {
    "rating": "Safe | Moderate | Severe",
    "assessment": "Detailed assessment of UAE/Islamic/Arab cultural alignment",
    "evidence": "Exact quote (3-5 lines) or null if safe",
    "concerns": ["List specific concerns if any"]
  },
  
  "system2_child_safety": {
    "rating": "Safe | Moderate | Severe",
    "assessment": "Global child safety standards assessment",
    "evidence": "Exact quote (3-5 lines) or null if safe",
    "concerns": ["List specific concerns if any"]
  },
  
  "system3_theme_complexity": {
    "rating": "Simple | Moderate | High",
    "assessment": "Analysis of theme complexity and maturity",
    "min_age": 6
  },
  
  "system4_language_complexity": {
    "rating": "Easy | Moderate | Advanced",
    "assessment": "Analysis of vocabulary and language difficulty",
    "min_age": 6
  },
  
  "final_verdict": "Approved | Whitelisted | Parent Guidance | Not Whitelisted",
  "recommended_age": "6-9",
  "age_rationale": "Explanation of age recommendation based on systems 3 and 4",
  
  "lessons_learned": "List the moral or educational takeaways for children or families.",
  "parent_discussion_guide": {
    "before_reading": ["Question 1", "Question 2", "Question 3"],
    "after_reading": ["Question 1", "Question 2", "Question 3", "Question 4"]
  },
  "key_drivers": ["List of reasons behind the classification"],
  "genres": ["Select from: Islamic, UAE Culture, Culture, Heritage, Adventure, Fantasy, Mystery, Science, STEM, Educational, Bedtime, Interactive, Nature, Friendship, Emotions, Philosophy, Humor, Gaming, Social Learning, Traditional"],
  "themes": ["List 2-3 main themes from the book (e.g., 'Nature / Resilience', 'Friendship / Diversity', 'Hope / Future')"]
}

🔹 SYSTEM 1: UAE / Islamic / Arab Cultural Values (HIGHEST PRIORITY - Red-line rules)

✅ Safe:
- Respects Islam, prophets, Qur'an, and all religions
- Positive Arab/Islamic values: family, modesty, hospitality, prayer, Ramadan, Eid
- Respect for parents, teachers, leaders, and authority
- Neutral Western cultural references that don't contradict UAE morals

⚠️ Moderate Concern:
- Fantasy/magic presented as imagination, not truth
- Non-Islamic festivals shown neutrally
- Mild romance/crushes without physical intimacy
- Light disobedience/sarcasm but later corrected
- Mild rude words ("stupid," "shut up")

🚫 Severe Concern:
- Mockery or insult of Islam, prophets, Qur'an, or prayer
- Negative stereotypes of Arabs/Emiratis/Muslims
- Alcohol, gambling, drugs, or immodesty shown positively
- Strong profanity or obscene jokes
- Romantic/sexual behavior for children or LGBTQ+ promotion
- Encouraging rebellion against parents, teachers, or leaders

🔹 SYSTEM 2: General Child Safety (Global Standards)

✅ Safe:
- Light humor, slapstick, playful adventures
- Positive lessons: teamwork, kindness, sharing

⚠️ Moderate Concern:
- Mild fantasy violence, scary creatures
- Sad themes (loss of pet, moving away)
- Light bullying, later resolved

🚫 Severe Concern:
- Gore, torture, graphic death
- Explicit sexual content or grooming risk
- Substance use (alcohol, smoking, drugs) normalized
- Suicide, extreme bullying, exploitation

🔹 SYSTEM 3: Context / Theme Complexity

✅ Simple (Age 3-6):
- Everyday family/friends/school life
- Clear good vs bad
- Concrete lessons (helping others, sharing)

⚠️ Moderate (Age 7-12):
- Moral dilemmas (honesty vs loyalty)
- Emotional maturity themes (grief, divorce, betrayal)
- Abstract ideas (justice, freedom, mortality)

🚫 High Complexity (Age 13+):
- War, politics, trauma
- Philosophical/existential questions
- Multi-layered, abstract narratives

🔹 SYSTEM 4: Language Complexity

✅ Easy (Age 3-6):
- Short sentences, everyday vocabulary
- Repetition, rhymes, pictures supporting text

⚠️ Moderate (Age 7-12):
- Longer sentences, grade 3–6 vocabulary
- Figurative language, idioms
- Cultural expressions requiring context

🚫 Advanced (Age 13+):
- Rare/academic words
- Complex syntax, poetic/figurative density
- Requires advanced cultural/linguistic knowledge

🔗 FINAL VERDICT RULES:

1. **Whitelist Safety Decision:**
   - If 🚫 Severe in System 1 (UAE Values) → "Not Whitelisted" (automatic)
   - If 🚫 Severe in System 2 (Child Safety) → "Not Whitelisted"
   - If Safe in both S1 and S2 → "Approved" or "Whitelisted"
   - If Moderate concerns exist → "Parent Guidance" or "Whitelisted"

2. **Age Recommendation:**
   - Calculate from System 3 (Theme) + System 4 (Language)
   - Final Recommended Age = HIGHER of the two minimum ages
   - Map to age bands: 0-3, 3-5, 6-9, 10-12, 13-16, 17+

3. **Visual Labels:**
   - 🟢 Approved: Safe & culturally aligned, fully suitable
   - ✅ Whitelisted: Safe for UAE families, general use
   - 🟡 Parent Guidance: Safe but moderate issues, review before giving
   - 🚫 Not Whitelisted: Violates UAE/Islamic values or child safety

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
    
    // Legacy fields for backward compatibility
    const whitelistScore = result.final_verdict === "Not Whitelisted" ? 0 : 
                          result.final_verdict === "Parent Guidance" ? 65 :
                          result.final_verdict === "Whitelisted" ? 80 : 95;
    
    const whitelistVerdict = result.final_verdict === "Not Whitelisted" ? 
      "🚫 Not Whitelisted – Violates UAE/Islamic values or child safety" :
      result.final_verdict === "Parent Guidance" ?
      "🟡 Parent Guidance Recommended – Safe but contains moderate issues" :
      result.final_verdict === "Approved" ?
      "🟢 Approved – Safe & culturally aligned" :
      "✅ Whitelisted – Safe for UAE families";

    return {
      ...result,
      whitelist_score: whitelistScore,
      whitelist_verdict: whitelistVerdict,
      recommended_minimum_age: result.recommended_age || "6-9",
    };

  } catch (error) {
    console.error("OpenAI evaluation error:", error);
    throw new Error(`Book evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
