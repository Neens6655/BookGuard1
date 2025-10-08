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
  
  "final_verdict": "Whitelisted | Parent Guidance | Not Whitelisted",
  "recommended_age": "6-9",
  "age_rationale": "Explanation of age recommendation based on systems 3 and 4",
  
  "lessons_learned": "List the moral or educational takeaways for children or families.",
  "parent_discussion_guide": {
    "before_reading": ["Question 1", "Question 2", "Question 3"],
    "after_reading": ["Question 1", "Question 2", "Question 3", "Question 4"]
  },
  
  "cultural_teaching_methods": [
    {
      "title": "Specific teaching method based on this book's lessons (e.g., 'Connect Kindness to Daily Prayer')",
      "description": "Detailed explanation of how parents can teach this specific value from the book in context of UAE/Islamic/Arab culture (2-3 sentences)"
    },
    {
      "title": "Another method relevant to this book",
      "description": "Detailed implementation guidance"
    }
  ],
  
  "islamic_uae_values": [
    {
      "title": "Specific Islamic/UAE value found in THIS book (e.g., 'Cooperation (Ta'awun)')",
      "arabic_name": "Arabic term if applicable (e.g., 'التعاون')",
      "description": "How this value appears in the book and how to discuss it with children, connecting to Islamic teachings or Quranic verses where relevant (2-3 sentences)"
    },
    {
      "title": "Another value from THIS book",
      "arabic_name": "Arabic term",
      "description": "Context-specific explanation"
    }
  ],
  
  "family_activities": [
    {
      "title": "Activity based on THIS book's themes (e.g., 'Create a Gratitude Journal inspired by the story')",
      "description": "Specific activity that connects to the book's plot, characters, or lessons (2-3 sentences)"
    },
    {
      "title": "Another activity for THIS book",
      "description": "Detailed activity description"
    }
  ],
  
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
   - If Safe in both S1 and S2 → "Whitelisted"
   - If Moderate concerns exist → "Parent Guidance"

2. **Age Recommendation:**
   - Calculate from System 3 (Theme) + System 4 (Language)
   - Final Recommended Age = HIGHER of the two minimum ages
   - Map to age bands: 0-3, 3-5, 6-9, 10-12, 13-16, 17+

3. **Visual Labels:**
   - ✅ Whitelisted: Safe & culturally aligned for UAE families
   - 🟡 Parent Guidance: Safe but moderate issues, review before giving
   - 🚫 Not Whitelisted: Violates UAE/Islamic values or child safety

🔹 CULTURAL TEACHING CONTENT (CRITICAL):

**cultural_teaching_methods** - Generate 3-4 teaching methods SPECIFIC to THIS book's content:
- MUST be directly related to the book's plot, characters, or lessons
- MUST reflect UAE/Islamic/Arab cultural context
- Examples: "Connect [Character]'s honesty to Hadith about truthfulness", "Use the desert scene to discuss patience (Sabr) during hardship"

**islamic_uae_values** - Identify 3-4 Islamic/UAE values ACTUALLY PRESENT in THIS book:
- ONLY include values that appear in the book's narrative
- Provide Arabic terms (e.g., Amanah, Sabr, Shukr, Ta'awun, Ihsan, Adl)
- Connect to specific Quranic verses or Islamic teachings where relevant
- Examples: "Honesty (Amanah) - when [character] tells the truth despite consequences, reflecting 'Speak truth even if it is bitter' (Hadith)"

**family_activities** - Create 3-4 activities SPECIFIC to THIS book:
- MUST connect directly to the book's themes, characters, or setting
- Examples: "Re-enact [specific scene] to practice [value]", "Create art inspired by [book's setting] while discussing [theme]"

AVOID generic content. Every field must be contextual to THIS specific book.

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
      "✅ Whitelisted – Safe & culturally aligned for UAE families";

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

export interface DeepAnalysisResult {
  title: string;
  author?: string;
  
  narrative_structure: {
    plot_complexity: string;
    plot_evidence: string;
    character_development: string;
    character_evidence: string;
    pacing: string;
    pacing_evidence: string;
    themes: string[];
    key_moments: Array<{ page: string; quote: string; significance: string }>;
  };
  
  language_metrics: {
    vocabulary_level: string;
    vocabulary_examples: string[];
    sentence_complexity: string;
    complexity_examples: string[];
    reading_ease_score: number;
    unique_word_count: number;
    linguistic_features: string[];
  };
  
  cultural_assessment: {
    islamic_values: Array<{ value: string; evidence: string; page: string }>;
    uae_cultural_elements: Array<{ element: string; context: string; quote: string }>;
    universal_themes: string[];
    potential_concerns: Array<{ concern: string; evidence: string; severity: string }>;
  };
  
  educational_insights: {
    learning_objectives: Array<{ objective: string; evidence: string }>;
    skill_development: Array<{ skill: string; how_developed: string }>;
    discussion_topics: Array<{ topic: string; guiding_questions: string[] }>;
    pedagogical_value: string;
  };
  
  safety_analysis: {
    content_warnings: Array<{ warning: string; context: string; evidence: string; page: string }>;
    age_appropriateness: {
      recommended_age: string;
      rationale: string;
      developmental_considerations: string[];
    };
    parental_guidance_areas: Array<{ area: string; reason: string; discussion_points: string[] }>;
    positive_messages: Array<{ message: string; evidence: string }>;
    risk_assessment: {
      level: string;
      factors: string[];
    };
  };
  
  recommendations: {
    best_for: string;
    teaching_strategies: Array<{ strategy: string; implementation: string }>;
    complementary_books: string[];
    usage_contexts: string[];
  };
}

export async function deepAnalyzeBook(bookText: string): Promise<DeepAnalysisResult> {
  const deepAnalysisPrompt = `
You are an expert literary analyst and educational specialist for the UAE Ministry of Education.
Provide a COMPREHENSIVE, EVIDENCE-BASED analysis with SPECIFIC QUOTES and PAGE REFERENCES from the text.

CRITICAL: Every analysis point MUST be supported by direct evidence from the book.

Return detailed JSON with these fields:
{
  "title": "Book Title",
  "author": "Author name or null if unknown",
  
  "narrative_structure": {
    "plot_complexity": "Technical analysis of plot structure and narrative arc",
    "plot_evidence": "Quote 3-5 lines showing plot complexity",
    "character_development": "Analysis of character arcs and psychological depth",
    "character_evidence": "Quote 3-5 lines showing character growth",
    "pacing": "Evaluation of narrative rhythm and tension",
    "pacing_evidence": "Quote showing pacing style",
    "themes": ["4-6 key themes"],
    "key_moments": [
      {"page": "Early/Mid/Late section", "quote": "2-3 line quote", "significance": "Why this moment matters"},
      {"page": "Early/Mid/Late section", "quote": "2-3 line quote", "significance": "Why this moment matters"}
    ]
  },
  
  "language_metrics": {
    "vocabulary_level": "Grade level (e.g., 'Grade 4-6 (Ages 9-11)')",
    "vocabulary_examples": ["advanced word 1", "advanced word 2", "advanced word 3"],
    "sentence_complexity": "Technical analysis of syntax",
    "complexity_examples": ["Example sentence showing complexity", "Another example"],
    "reading_ease_score": 72,
    "unique_word_count": 1250,
    "linguistic_features": ["Feature 1 (e.g., 'Metaphorical language')", "Feature 2", "Feature 3"]
  },
  
  "cultural_assessment": {
    "islamic_values": [
      {"value": "Honesty (Sidq)", "evidence": "3-5 line quote showing this value", "page": "Early/Mid/Late"},
      {"value": "Patience (Sabr)", "evidence": "3-5 line quote", "page": "Early/Mid/Late"}
    ],
    "uae_cultural_elements": [
      {"element": "Desert landscape", "context": "How it's portrayed", "quote": "2-3 line quote"},
      {"element": "Traditional values", "context": "Context", "quote": "2-3 line quote"}
    ],
    "universal_themes": ["Theme 1", "Theme 2", "Theme 3"],
    "potential_concerns": [
      {"concern": "Specific concern", "evidence": "3-5 line quote showing concern", "severity": "Low/Moderate/High"}
    ]
  },
  
  "educational_insights": {
    "learning_objectives": [
      {"objective": "Understanding X", "evidence": "Quote showing how book teaches this"},
      {"objective": "Developing Y", "evidence": "Quote showing skill development"}
    ],
    "skill_development": [
      {"skill": "Critical thinking", "how_developed": "Specific way the book develops this"},
      {"skill": "Empathy", "how_developed": "How the narrative builds empathy"}
    ],
    "discussion_topics": [
      {"topic": "Main discussion topic", "guiding_questions": ["Question 1?", "Question 2?", "Question 3?"]},
      {"topic": "Second topic", "guiding_questions": ["Question 1?", "Question 2?"]}
    ],
    "pedagogical_value": "Overall educational value assessment"
  },
  
  "safety_analysis": {
    "content_warnings": [
      {"warning": "Violence", "context": "Nature and extent", "evidence": "3-5 line quote", "page": "Mid section"},
      {"warning": "Scary themes", "context": "Type of content", "evidence": "3-5 line quote", "page": "Late section"}
    ],
    "age_appropriateness": {
      "recommended_age": "Ages 9-12",
      "rationale": "Detailed reasoning based on content analysis",
      "developmental_considerations": ["Consideration 1", "Consideration 2", "Consideration 3"]
    },
    "parental_guidance_areas": [
      {"area": "Death/Loss", "reason": "Why guidance needed", "discussion_points": ["Point 1", "Point 2"]},
      {"area": "Conflict", "reason": "Context", "discussion_points": ["Point 1", "Point 2"]}
    ],
    "positive_messages": [
      {"message": "Resilience", "evidence": "3-5 line quote showing positive message"},
      {"message": "Friendship", "evidence": "Quote demonstrating value"}
    ],
    "risk_assessment": {
      "level": "Low/Moderate/High",
      "factors": ["Risk factor 1 with evidence", "Risk factor 2 with evidence"]
    }
  },
  
  "recommendations": {
    "best_for": "Detailed audience description with reasoning",
    "teaching_strategies": [
      {"strategy": "Strategy name", "implementation": "How to implement in classroom"},
      {"strategy": "Another strategy", "implementation": "Practical steps"}
    ],
    "complementary_books": ["Book/Genre 1", "Book/Genre 2", "Book/Genre 3"],
    "usage_contexts": ["Context 1 (e.g., 'Family reading time')", "Context 2", "Context 3"]
  }
}

EVIDENCE REQUIREMENTS:
- Extract EXACT quotes (3-5 lines) for ALL evidence fields
- Include page references (Early/Mid/Late sections since we don't have page numbers)
- Every claim must be supported by textual evidence
- Quotes must be verbatim from the book text
- For safety warnings, provide specific textual evidence

Return complete JSON output only.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: deepAnalysisPrompt
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
    return result;

  } catch (error) {
    console.error("OpenAI deep analysis error:", error);
    throw new Error(`Deep analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
