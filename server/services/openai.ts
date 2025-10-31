import OpenAI from "openai";
import { type EvaluationResult } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  operationName: string = 'Operation'
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors (authentication, invalid input, etc.)
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401 || error.status === 400) {
          throw error;
        }
      }
      
      if (attempt === maxRetries) {
        console.error(`${operationName} failed after ${maxRetries} attempts:`, error);
        throw error;
      }
      
      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`${operationName} attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

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
    const response = await retryWithBackoff(
      async () => {
        return await openai.chat.completions.create({
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
      },
      3,
      1000,
      'OpenAI Book Evaluation'
    );

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

export interface NMCAssessment {
  enabled: boolean;
  finalAgeBand: string;
  categories: {
    gambling: { detected: boolean; ageBand: string; evidence: string; };
    language: { detected: boolean; ageBand: string; evidence: string; };
    violence: { detected: boolean; ageBand: string; evidence: string; };
    substanceUse: { detected: boolean; ageBand: string; evidence: string; };
    sexualContent: { detected: boolean; ageBand: string; evidence: string; };
  };
}

export async function evaluateNMCStandards(bookText: string): Promise<NMCAssessment> {
  const nmcPrompt = `
You are evaluating a children's book against NMC (National Media Council) Standards.
Evaluate the book across 5 categories with specific age band thresholds.

Return JSON with this structure:
{
  "gambling": {
    "detected": true/false,
    "ageBand": "Safe | 13+ | 17+ | 21+",
    "evidence": "Direct quote if detected, or 'No gambling content detected'"
  },
  "language": {
    "detected": true/false,
    "ageBand": "Safe | 10+ | 13+ | 17+ | 21+",
    "evidence": "Direct quote or 'No profanity detected'"
  },
  "violence": {
    "detected": true/false,
    "ageBand": "Safe | 6+ | 10+ | 13+ | 17+ | 21+",
    "evidence": "Direct quote or 'No violence detected'"
  },
  "substanceUse": {
    "detected": true/false,
    "ageBand": "Safe | 13+ | 17+ | 21+",
    "evidence": "Direct quote or 'No substance use detected'"
  },
  "sexualContent": {
    "detected": true/false,
    "ageBand": "Safe | 13+ | 17+ | 21+",
    "evidence": "Direct quote or 'No sexual content detected'"
  }
}

🎰 GAMBLING CATEGORY:
- Safe (0+): No gambling references (casinos, betting, cards for money)
- 13+: Gambling only if cautionary/educational (shows consequences) OR minor references
- 17+: Historical/contextual gambling (Victorian betting houses, etc.)
- 21+: Casual/positive gambling portrayals

📝 LANGUAGE & PROFANITY:
- Safe (0+): No profanity, rude words, or insults
- 10+: Mild insults only ("stupid," "dumb," "shut up")
- 13+: Moderate slang/insults ("jerk," name-calling)
- 17+: Strong profanity if contextualized (f***, s*** for emotional realism)
- 21+: Explicit profanity fully permissible

⚔️ VIOLENCE & TERROR:
- Safe (0+): No violence (hitting, fighting, weapons)
- 6+: Cartoon/fantasy violence only (non-realistic, no blood)
- 10+: Mild peril/fantasy battles (minor injuries, positive resolution)
- 13+: Moderate/realistic violence (crime, detective, suspense, no gore)
- 17+: War/crime/terror themes (intense but limited gore)
- 21+: Graphic violence permissible

🍺 ALCOHOL, SMOKING & DRUGS:
- Safe (0+): No references to alcohol, cigarettes, drugs
- 13+: Brief/historical mentions if negative/cautionary OR minor contextual references (e.g., adult drinking wine at dinner, historical context)
- 17+: Realistic depictions if not glamorized (addiction, recovery)
- 21+: Substance use without restriction

💕 SEX & NUDITY:
- Safe (0+): No sexual content or romantic intimacy
- 13+: Light romance (hand-holding, blushing, innocent crush)
- 17+: Non-explicit intimacy (kissing, implied romance)
- 21+: Explicit sexual content permissible

EVALUATION RULES:
1. For each category, determine the MINIMUM age band that would allow this content
2. If no problematic content exists in a category, mark as "Safe" (permitted for all ages)
3. Be LENIENT with minor contextual references - only restrict if content is clearly inappropriate
4. Provide exact quotes (2-3 lines) as evidence when content is detected
5. Use "13+" for minor references that don't warrant full restriction (e.g., brief wine mention in context)

Return complete JSON only.
`;

  try {
    const response = await retryWithBackoff(
      async () => {
        return await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: nmcPrompt
            },
            {
              role: "user",
              content: `BOOK TEXT:\n${bookText}`
            }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 2000,
        });
      },
      3,
      1000,
      'OpenAI NMC Evaluation'
    );

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const result = JSON.parse(content);
    
    // Calculate final age band as the HIGHEST across all categories
    const ageBandPriority: Record<string, number> = {
      "Safe": 0,
      "6+": 6,
      "10+": 10,
      "13+": 13,
      "17+": 17,
      "21+": 21
    };
    
    const allAgeBands = [
      result.gambling.ageBand,
      result.language.ageBand,
      result.violence.ageBand,
      result.substanceUse.ageBand,
      result.sexualContent.ageBand
    ];
    
    const finalAgeBand = allAgeBands.reduce((highest, current) => {
      const currentPriority = ageBandPriority[current] || 0;
      const highestPriority = ageBandPriority[highest] || 0;
      return currentPriority > highestPriority ? current : highest;
    }, "Safe");
    
    // Convert "Safe" to "All Ages" for clearer age recommendation display
    const displayAgeBand = finalAgeBand === "Safe" ? "All Ages" : finalAgeBand;
    
    // Convert category-level "Safe" to "All Ages" as well
    const convertAgeBand = (band: string) => band === "Safe" ? "All Ages" : band;
    
    return {
      enabled: true,
      finalAgeBand: displayAgeBand,
      categories: {
        gambling: { ...result.gambling, ageBand: convertAgeBand(result.gambling.ageBand) },
        language: { ...result.language, ageBand: convertAgeBand(result.language.ageBand) },
        violence: { ...result.violence, ageBand: convertAgeBand(result.violence.ageBand) },
        substanceUse: { ...result.substanceUse, ageBand: convertAgeBand(result.substanceUse.ageBand) },
        sexualContent: { ...result.sexualContent, ageBand: convertAgeBand(result.sexualContent.ageBand) }
      }
    };

  } catch (error) {
    console.error("NMC evaluation error:", error);
    // Return safe default on error
    return {
      enabled: false,
      finalAgeBand: "All Ages",
      categories: {
        gambling: { detected: false, ageBand: "All Ages", evidence: "Error during evaluation" },
        language: { detected: false, ageBand: "All Ages", evidence: "Error during evaluation" },
        violence: { detected: false, ageBand: "All Ages", evidence: "Error during evaluation" },
        substanceUse: { detected: false, ageBand: "All Ages", evidence: "Error during evaluation" },
        sexualContent: { detected: false, ageBand: "All Ages", evidence: "Error during evaluation" }
      }
    };
  }
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
    const response = await retryWithBackoff(
      async () => {
        return await openai.chat.completions.create({
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
      },
      3,
      1000,
      'OpenAI Deep Analysis'
    );

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

/**
 * Extract text from images/PDFs using GPT-4 Vision
 * Supports: PDFs and image files
 */
export async function extractTextWithGPT4Vision(filePath: string): Promise<string> {
  const fs = await import('fs/promises');
  
  try {
    console.log(`Starting GPT-4 Vision OCR extraction for: ${filePath}`);
    
    // Read the file and convert to base64
    const fileBuffer = await fs.readFile(filePath);
    const base64File = fileBuffer.toString('base64');
    const mimeType = getFileMimeType(filePath);
    const dataUri = `data:${mimeType};base64,${base64File}`;
    
    const response = await retryWithBackoff(
      async () => {
        return await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text from this document/image. Return ONLY the extracted text, preserving structure and formatting. Do not add any commentary or description.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: dataUri,
                  },
                },
              ],
            },
          ],
          max_tokens: 4096,
        });
      },
      3,
      1000,
      'GPT-4 Vision OCR'
    );
    
    const extractedText = response.choices[0]?.message?.content?.trim() || '';
    
    console.log(`✓ GPT-4 Vision OCR completed: ${extractedText.length} characters extracted`);
    
    if (extractedText.length < 10) {
      throw new Error('GPT-4 Vision extracted very little text. The file may not contain readable text.');
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('GPT-4 Vision OCR error:', error);
    
    if (error instanceof Error) {
      throw new Error(`GPT-4 Vision OCR failed: ${error.message}`);
    }
    
    throw new Error('GPT-4 Vision OCR failed with unknown error');
  }
}

function getFileMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop();
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
  };
  
  return mimeTypes[ext || ''] || 'image/jpeg';
}
