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
            description: "Alignment with Islamic principles, teachings, and moral values"
          },
          {
            name: "Arab Cultural Heritage",
            weight: 30,
            description: "Respect for Arab traditions, language, and cultural identity"
          },
          {
            name: "UAE National Identity",
            weight: 20,
            description: "Promotion of UAE values, heritage, and national pride"
          },
          {
            name: "Family Values",
            weight: 10,
            description: "Reinforcement of strong family bonds and respect for elders"
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
            description: "Content suitable for the target age group without harmful elements"
          },
          {
            name: "Psychological Safety",
            weight: 25,
            description: "No traumatic, disturbing, or psychologically harmful content"
          },
          {
            name: "Physical Safety Messages",
            weight: 20,
            description: "Promotes safety awareness and avoids dangerous behaviors"
          },
          {
            name: "Emotional Well-being",
            weight: 15,
            description: "Supports healthy emotional development and self-esteem"
          },
          {
            name: "Social Safety",
            weight: 10,
            description: "Encourages positive social interactions and relationships"
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
            description: "Story structure, plot development, and narrative sophistication"
          },
          {
            name: "Character Development",
            weight: 25,
            description: "Depth and complexity of characters and relationships"
          },
          {
            name: "Thematic Depth",
            weight: 25,
            description: "Complexity of themes, moral lessons, and underlying messages"
          },
          {
            name: "Conceptual Understanding",
            weight: 15,
            description: "Abstract thinking and conceptual comprehension required"
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
            description: "Complexity and sophistication of vocabulary used"
          },
          {
            name: "Sentence Structure",
            weight: 30,
            description: "Grammatical complexity and sentence construction"
          },
          {
            name: "Reading Fluency Demand",
            weight: 20,
            description: "Required reading skills and comprehension level"
          },
          {
            name: "Language Accessibility",
            weight: 10,
            description: "Clarity and ease of understanding for target readers"
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
