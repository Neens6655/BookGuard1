import { storage } from "../storage";

export async function seedDefaultScoringConfig() {
  try {
    // Check if any configuration exists
    const existingConfigs = await storage.getAllScoringConfigs();
    
    if (existingConfigs.length > 0) {
      console.log("Scoring configurations already exist, skipping seed");
      return;
    }

    // Create default scoring configuration
    const defaultConfig = {
      name: "Default UAE BookGuard Configuration",
      description: "Standard evaluation framework for children's books aligned with UAE cultural values and educational standards",
      version: "1.0.0",
      isActive: 1,
      system1Config: {
        enabled: true,
        weight: 35,
        safeThreshold: 70,
        moderateThreshold: 50,
        severeThreshold: 30,
        autoRejectOnSevere: true,
        criteria: [
          {
            name: "Islamic Values Alignment",
            weight: 40,
            description: "Alignment with Islamic principles, teachings, and moral values",
            subGuidelines: {
              safe: [
                "Respects Islam, prophets, Qur'an, and all religions",
                "Positive Arab/Islamic values: family, modesty, hospitality, prayer, Ramadan, Eid",
                "Respect for parents, teachers, leaders, and authority",
                "Neutral Western cultural references that don't contradict UAE morals"
              ],
              moderate: [
                "Fantasy/magic presented as imagination, not truth",
                "Non-Islamic festivals shown neutrally",
                "Mild romance/crushes without physical intimacy",
                "Light disobedience/sarcasm but later corrected",
                "Mild rude words (\"stupid,\" \"shut up\")"
              ],
              severe: [
                "Mockery or insult of Islam, prophets, Qur'an, or prayer",
                "Negative stereotypes of Arabs/Emiratis/Muslims",
                "Alcohol, gambling, drugs, or immodesty shown positively",
                "Strong profanity or obscene jokes",
                "Romantic/sexual behavior for children or LGBTQ+ promotion",
                "Encouraging rebellion against parents, teachers, or leaders"
              ]
            }
          },
          {
            name: "Arab Cultural Heritage",
            weight: 30,
            description: "Respect for Arab traditions, language, and cultural identity",
            subGuidelines: {
              safe: [
                "Celebrates Arabic language, poetry, and literary traditions",
                "Shows respect for Arab customs: hospitality (diyafa), generosity (karam)",
                "Positive representation of traditional Arab clothing, food, and celebrations",
                "Promotes pride in Arab heritage and historical contributions"
              ],
              moderate: [
                "Limited Arabic language presence or cultural references",
                "Western cultural elements dominate without cultural balance",
                "Minor cultural misrepresentations if not harmful"
              ],
              severe: [
                "Negative stereotypes of Arab culture or traditions",
                "Mockery of Arabic language or cultural practices",
                "Portrays Arab culture as primitive or backward",
                "Erases or dismisses Arab cultural identity"
              ]
            }
          },
          {
            name: "UAE National Identity",
            weight: 20,
            description: "Promotion of UAE values, heritage, and national pride",
            subGuidelines: {
              safe: [
                "Celebrates UAE national achievements and progress",
                "Shows respect for UAE leadership and governance",
                "Promotes Emirati values: tolerance, innovation, ambition",
                "Highlights UAE cultural heritage, traditions, and landmarks"
              ],
              moderate: [
                "Minimal or no UAE-specific cultural references",
                "Generic Middle Eastern setting without UAE context",
                "Neutral portrayal of other nationalities without favoring UAE"
              ],
              severe: [
                "Disrespect towards UAE leadership or national symbols",
                "Negative portrayal of Emirati culture or values",
                "Political content that undermines UAE national interests",
                "Promotes values contrary to UAE national identity"
              ]
            }
          },
          {
            name: "Family Values",
            weight: 10,
            description: "Reinforcement of strong family bonds and respect for elders",
            subGuidelines: {
              safe: [
                "Strong family bonds and multi-generational respect",
                "Parents and elders shown as wise, caring authority figures",
                "Family unity and cooperation as central themes",
                "Respect for familial duties and responsibilities"
              ],
              moderate: [
                "Nuclear family only, limited extended family presence",
                "Mild family disagreements resolved positively",
                "Single-parent families shown respectfully",
                "Children occasionally questioning but ultimately respecting authority"
              ],
              severe: [
                "Disrespect or mockery of parents and elders",
                "Glorification of rebellion against family",
                "Family breakdown shown as positive outcome",
                "Encourages children to defy or disobey parents"
              ]
            }
          }
        ]
      },
      system2Config: {
        enabled: true,
        weight: 35,
        safeThreshold: 80,
        moderateThreshold: 60,
        severeThreshold: 40,
        autoRejectOnSevere: true,
        criteria: [
          {
            name: "Age-Appropriate Content",
            weight: 30,
            description: "Content suitable for the target age group without harmful elements",
            subGuidelines: {
              safe: [
                "Light humor, slapstick, playful adventures",
                "Positive lessons: teamwork, kindness, sharing",
                "Age-appropriate challenges and problem-solving",
                "Content matches developmental stage of target audience"
              ],
              moderate: [
                "Mild fantasy violence, scary creatures",
                "Sad themes (loss of pet, moving away)",
                "Light bullying, later resolved",
                "Minor frightening elements with positive resolution"
              ],
              severe: [
                "Gore, torture, graphic death",
                "Explicit sexual content or grooming risk",
                "Substance use (alcohol, smoking, drugs) normalized",
                "Suicide, extreme bullying, exploitation"
              ]
            }
          },
          {
            name: "Psychological Safety",
            weight: 25,
            description: "No traumatic, disturbing, or psychologically harmful content",
            subGuidelines: {
              safe: [
                "Positive emotional resolution and coping strategies",
                "Characters overcome challenges with support",
                "Healthy processing of fears and anxieties",
                "Promotes resilience and emotional strength"
              ],
              moderate: [
                "Temporary fear or anxiety with resolution",
                "Brief separation from loved ones",
                "Manageable disappointments or setbacks",
                "Age-appropriate scary moments with comfort"
              ],
              severe: [
                "Traumatic events without resolution or support",
                "Persistent nightmarish or disturbing imagery",
                "Psychological abuse or manipulation of children",
                "Content causing lasting fear or anxiety"
              ]
            }
          },
          {
            name: "Physical Safety Messages",
            weight: 20,
            description: "Promotes safety awareness and avoids dangerous behaviors",
            subGuidelines: {
              safe: [
                "Promotes safety rules and awareness",
                "Characters model safe behaviors",
                "Dangers shown with appropriate consequences",
                "Teaches children to recognize and avoid risks"
              ],
              moderate: [
                "Minor risky behavior with learning outcome",
                "Fantasy scenarios with unrealistic actions",
                "Mild injuries used as teaching moments",
                "Risk-taking shown but not glorified"
              ],
              severe: [
                "Glorifies dangerous or illegal activities",
                "Shows self-harm or suicide methods",
                "Encourages children to attempt dangerous stunts",
                "Normalizes violence or harmful behaviors"
              ]
            }
          },
          {
            name: "Emotional Well-being",
            weight: 15,
            description: "Supports healthy emotional development and self-esteem",
            subGuidelines: {
              safe: [
                "Builds self-confidence and positive self-image",
                "Validates emotions and teaches healthy expression",
                "Shows characters managing feelings constructively",
                "Promotes empathy, compassion, and understanding"
              ],
              moderate: [
                "Characters experience self-doubt but overcome it",
                "Mild emotional struggles with positive resolution",
                "Temporary feelings of inadequacy addressed",
                "Learning to handle disappointment or failure"
              ],
              severe: [
                "Promotes self-hatred or body image issues",
                "Encourages emotional suppression or unhealthy coping",
                "Normalizes mental health crises without support",
                "Undermines self-worth or promotes hopelessness"
              ]
            }
          },
          {
            name: "Social Safety",
            weight: 10,
            description: "Encourages positive social interactions and relationships",
            subGuidelines: {
              safe: [
                "Promotes healthy friendships and respect for others",
                "Shows positive conflict resolution strategies",
                "Encourages inclusivity and acceptance of differences",
                "Models appropriate boundaries and consent"
              ],
              moderate: [
                "Social conflicts resolved through communication",
                "Peer pressure situations with positive outcomes",
                "Temporary social exclusion addressed constructively",
                "Learning appropriate social skills through mistakes"
              ],
              severe: [
                "Glorifies bullying, manipulation, or social cruelty",
                "Promotes exclusion, discrimination, or prejudice",
                "Shows inappropriate relationships as normal",
                "Encourages antisocial or harmful social behaviors"
              ]
            }
          }
        ]
      },
      system3Config: {
        enabled: true,
        weight: 15,
        ageMapping: {
          simple: { minAge: 3, maxAge: 7 },
          moderate: { minAge: 8, maxAge: 12 },
          high: { minAge: 13, maxAge: 18 }
        },
        criteria: [
          {
            name: "Narrative Complexity",
            weight: 35,
            description: "Story structure, plot development, and narrative sophistication",
            subGuidelines: {
              simple: [
                "Linear, straightforward storyline",
                "Clear beginning, middle, and end",
                "Single plot with simple cause-effect",
                "Predictable story progression"
              ],
              moderate: [
                "Multiple subplots or parallel narratives",
                "Flashbacks or non-linear elements",
                "Moderate plot twists or surprises",
                "Character-driven story development"
              ],
              high: [
                "Complex multi-layered narratives",
                "Sophisticated plot structures and timelines",
                "Symbolic or metaphorical storytelling",
                "Requires inference and interpretation"
              ]
            }
          },
          {
            name: "Character Development",
            weight: 25,
            description: "Depth and complexity of characters and relationships",
            subGuidelines: {
              simple: [
                "Clear good vs bad characters",
                "Simple motivations and personalities",
                "Everyday family/friends/school life",
                "Characters show basic emotions"
              ],
              moderate: [
                "Characters with internal conflicts",
                "Moral dilemmas (honesty vs loyalty)",
                "Emotional maturity themes (grief, betrayal)",
                "Character growth and development"
              ],
              high: [
                "Complex, multi-dimensional characters",
                "Sophisticated moral and ethical questions",
                "Philosophical or existential themes",
                "Ambiguous character motivations"
              ]
            }
          },
          {
            name: "Thematic Depth",
            weight: 25,
            description: "Complexity of themes, moral lessons, and underlying messages",
            subGuidelines: {
              simple: [
                "Concrete, explicit lessons (sharing, helping)",
                "Single clear moral message",
                "Direct teaching of values",
                "Simple problem-solution themes"
              ],
              moderate: [
                "Abstract ideas (justice, freedom, identity)",
                "Multiple interrelated themes",
                "Nuanced moral messages",
                "Themes requiring discussion"
              ],
              high: [
                "Philosophical or existential questions",
                "War, politics, social justice themes",
                "Mature life concepts (mortality, trauma)",
                "Layered, interpretive meanings"
              ]
            }
          },
          {
            name: "Conceptual Understanding",
            weight: 15,
            description: "Abstract thinking and conceptual comprehension required",
            subGuidelines: {
              simple: [
                "Concrete, tangible concepts only",
                "Visual support for understanding",
                "Direct, literal meaning",
                "No abstract thinking required"
              ],
              moderate: [
                "Some abstract concepts introduced",
                "Metaphors and symbolism present",
                "Requires contextual understanding",
                "Mix of concrete and abstract ideas"
              ],
              high: [
                "Primarily abstract, theoretical concepts",
                "Complex symbolism and allegory",
                "Requires critical thinking and analysis",
                "Sophisticated intellectual engagement"
              ]
            }
          }
        ]
      },
      system4Config: {
        enabled: true,
        weight: 15,
        ageMapping: {
          easy: { minAge: 3, maxAge: 7 },
          moderate: { minAge: 8, maxAge: 12 },
          advanced: { minAge: 13, maxAge: 18 }
        },
        criteria: [
          {
            name: "Vocabulary Level",
            weight: 40,
            description: "Complexity and sophistication of vocabulary used",
            subGuidelines: {
              easy: [
                "Short, everyday vocabulary",
                "Common words familiar to young children",
                "Repetitive key words and phrases",
                "Concrete nouns and simple verbs"
              ],
              moderate: [
                "Grade 3-6 level vocabulary",
                "Some academic or subject-specific terms",
                "Figurative language and idioms",
                "Cultural expressions requiring context"
              ],
              advanced: [
                "Rare, academic, or technical vocabulary",
                "Complex literary or poetic language",
                "Sophisticated word choices",
                "Requires advanced language knowledge"
              ]
            }
          },
          {
            name: "Sentence Structure",
            weight: 30,
            description: "Grammatical complexity and sentence construction",
            subGuidelines: {
              easy: [
                "Short, simple sentences (5-8 words)",
                "Basic subject-verb-object structure",
                "Minimal use of clauses or conjunctions",
                "Direct, straightforward syntax"
              ],
              moderate: [
                "Longer sentences with compound structures",
                "Use of dependent and independent clauses",
                "Varied sentence lengths and types",
                "Moderate grammatical complexity"
              ],
              advanced: [
                "Complex, multi-clause sentences",
                "Sophisticated grammatical structures",
                "Dense, layered syntax",
                "Poetic or literary sentence construction"
              ]
            }
          },
          {
            name: "Reading Fluency Demand",
            weight: 20,
            description: "Required reading skills and comprehension level",
            subGuidelines: {
              easy: [
                "Pictures strongly support text",
                "Rhymes, repetition, or patterns aid reading",
                "Minimal text per page",
                "Can be understood by early readers"
              ],
              moderate: [
                "Some visual support but text-dependent",
                "Requires sustained reading attention",
                "Moderate text density",
                "Chapter book or longer format"
              ],
              advanced: [
                "Text-heavy with minimal visual support",
                "Requires advanced reading stamina",
                "Dense paragraphs and lengthy passages",
                "Demands high comprehension skills"
              ]
            }
          },
          {
            name: "Language Accessibility",
            weight: 10,
            description: "Clarity and ease of understanding for target readers",
            subGuidelines: {
              easy: [
                "Clear, direct language",
                "Ideas presented simply and explicitly",
                "Minimal interpretation needed",
                "Accessible to all reading levels"
              ],
              moderate: [
                "Some inference or interpretation required",
                "Cultural or contextual knowledge helpful",
                "Mix of explicit and implicit meaning",
                "Moderate accessibility challenges"
              ],
              advanced: [
                "Requires significant interpretation",
                "Cultural/linguistic background essential",
                "Implicit, nuanced communication",
                "Limited accessibility for general readers"
              ]
            }
          }
        ]
      },
      verdictConfig: {
        whitelistedRules: {
          requireAllSafe: false,
          allowedModerates: 1,
          minimumScore: 70
        },
        parentGuidanceRules: {
          maxModerates: 2,
          minimumScore: 50
        },
        notWhitelistedRules: {
          autoRejectSevere: true,
          maxModerates: 3,
          minimumScore: 30
        }
      },
      aiConfig: {
        model: "gpt-4o",
        temperature: 0.3,
        maxTokens: 4000,
        enableEvidenceExtraction: true,
        enablePageReferences: true
      },
      nmcConfig: {
        enabled: true,
        categories: {
          gambling: {
            thresholds: [
              { maxAge: 12, ageBand: "Not Allowed", description: "No gambling references of any kind" },
              { maxAge: 16, ageBand: "13+", description: "Allowed if cautionary/educational" },
              { maxAge: 20, ageBand: "17+", description: "Permissible in historical/contextual" },
              { maxAge: 999, ageBand: "21+", description: "Permissible without restriction" }
            ]
          },
          language: {
            thresholds: [
              { maxAge: 9, ageBand: "Not Allowed", description: "No profanity or rude words" },
              { maxAge: 12, ageBand: "10+", description: "Mild insults allowed (stupid, dumb)" },
              { maxAge: 16, ageBand: "13+", description: "Moderate slang/insults acceptable" },
              { maxAge: 20, ageBand: "17+", description: "Strong profanity if contextualized" },
              { maxAge: 999, ageBand: "21+", description: "Explicit profanity fully permissible" }
            ]
          },
          violence: {
            thresholds: [
              { maxAge: 5, ageBand: "Not Allowed", description: "No violence of any kind" },
              { maxAge: 9, ageBand: "6+", description: "Cartoon/fantasy violence only" },
              { maxAge: 12, ageBand: "10+", description: "Mild peril/fantasy battles" },
              { maxAge: 16, ageBand: "13+", description: "Moderate/realistic violence allowed" },
              { maxAge: 20, ageBand: "17+", description: "Realistic war/crime/terror themes" },
              { maxAge: 999, ageBand: "21+", description: "Graphic violence permissible" }
            ]
          },
          substanceUse: {
            thresholds: [
              { maxAge: 12, ageBand: "Not Allowed", description: "No alcohol, smoking, or drugs" },
              { maxAge: 16, ageBand: "13+", description: "Mentions allowed if negative" },
              { maxAge: 20, ageBand: "17+", description: "Realistic depictions if not glamorized" },
              { maxAge: 999, ageBand: "21+", description: "Fully permissible in adult context" }
            ]
          },
          sexualContent: {
            thresholds: [
              { maxAge: 12, ageBand: "Not Allowed", description: "No sexual or nudity content" },
              { maxAge: 16, ageBand: "13+", description: "Light romance allowed (hand-holding, blushing)" },
              { maxAge: 20, ageBand: "17+", description: "Non-explicit intimacy allowed" },
              { maxAge: 999, ageBand: "21+", description: "Explicit content permissible" }
            ]
          }
        }
      },
      createdBy: "system"
    };

    const config = await storage.createScoringConfig(defaultConfig);
    
    console.log("✅ Default scoring configuration created successfully:", config.id);
    
    // Create audit log
    await storage.createAuditLog({
      configId: config.id,
      action: 'created',
      changes: null,
      performedBy: 'system',
    });
    
    console.log("✅ Default scoring configuration audit log created");
    
  } catch (error) {
    console.error("❌ Failed to seed default scoring configuration:", error);
  }
}
