import { NextRequest, NextResponse } from 'next/server';
import { DOMAINS, GeminiATSAnalysisResult } from '@/lib/ats-domains';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, domainId, customJobDescription, experienceLevel } = body;

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json(
        { error: 'Please provide resume text or upload a valid resume document.' },
        { status: 400 }
      );
    }

    const domain = DOMAINS.find((d) => d.id === domainId) || DOMAINS[0];
    const rawText = resumeText.trim();
    const words = rawText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

    if (!geminiApiKey && !openRouterApiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is not configured. Please set GEMINI_API_KEY in your .env file.' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a Principal Technical Recruiter and ATS (Applicant Tracking System) Evaluation Intelligence Engine.
Analyze the following resume specifically for the domain: "${domain.name}" (Target experience level: ${experienceLevel || '1-3 years'}).
${customJobDescription ? `Target Job Description provided:\n"""\n${customJobDescription}\n"""\n` : ''}

Resume Content:
"""
${rawText.slice(0, 12000)}
"""

Evaluate this resume strictly according to top ATS architectures (Workday, Taleo, Greenhouse, Lever, iCIMS).
Analyze all skills, keywords, impact verbs, metrics, format clarity, and domain match.

Respond with a strictly valid JSON object matching this exact schema (pure JSON without markdown fences):
{
  "atsScore": 85,
  "grade": "Excellent",
  "summary": "Crisp 2-3 sentence executive summary explaining ATS strength, domain alignment, and key gaps.",
  "breakdown": {
    "skillsMatchScore": 90,
    "experienceRelevanceScore": 85,
    "formattingStructureScore": 80,
    "quantifiableImpactScore": 75,
    "keywordDensityScore": 85
  },
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["missing skill 1", "missing skill 2"],
  "softSkillsFound": ["Leadership", "Agile"],
  "missingSoftSkills": ["Cross-functional alignment"],
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["missing keyword 1", "missing keyword 2"],
  "actionVerbsFound": ["Engineered", "Architected", "Optimized"],
  "quantifiableMetrics": ["35% latency reduction", "$120k revenue"],
  "strengths": ["Strong technical stack covering core domain frameworks", "Good action verb density in recent roles"],
  "criticalRedFlags": ["Missing quantifiable metrics in several project descriptions", "Low keyword frequency for cloud infrastructure"],
  "improvementSuggestions": [
    {
      "category": "Skills",
      "title": "Add Missing Domain Frameworks",
      "description": "Incorporate technologies like ...",
      "priority": "High"
    }
  ],
  "bulletPointFixes": [
    {
      "originalContext": "Sample phrase or bullet from the resume that needs improvement",
      "suggestion": "Rewritten high-impact bullet using Google XYZ formula (Accomplished [X] by doing [Y] as measured by [Z])",
      "reason": "Replaces passive duty statement with measurable business impact and strong action verbs"
    }
  ]
}`;

    let geminiResponseText = '';
    let lastError = '';

    // 1. First attempt: Direct Google Gemini AI Models
    if (geminiApiKey) {
      const models = [
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.7-flash',
        'gemini-2.5-pro',
      ];

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: systemPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.15,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const candidate = data.candidates?.[0];
            geminiResponseText = candidate?.content?.parts?.[0]?.text || '';
            if (geminiResponseText) break;
          } else {
            const errBody = await res.text();
            lastError = `Google Gemini (${model}): status ${res.status} - ${errBody}`;
          }
        } catch (modelErr: unknown) {
          lastError = modelErr instanceof Error ? modelErr.message : 'Gemini connection error';
        }
      }
    }

    // 2. Second attempt: OpenRouter Gemini Model endpoint
    if (!geminiResponseText && openRouterApiKey) {
      const openRouterGeminiModels = [
        'google/gemini-2.0-flash-001',
        'google/gemini-flash-1.5',
        'google/gemini-pro-1.5',
      ];

      for (const model of openRouterGeminiModels) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openRouterApiKey}`,
              'HTTP-Referer': 'https://invertisprep.in',
              'X-Title': 'InvertisPrep ATS Resume Analyser',
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content: 'You are a Principal Technical Recruiter and ATS evaluation system. Return strictly pure JSON with no markdown formatting.',
                },
                {
                  role: 'user',
                  content: systemPrompt,
                },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.15,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            geminiResponseText = data.choices?.[0]?.message?.content || '';
            if (geminiResponseText) break;
          } else {
            const errBody = await res.text();
            lastError = `OpenRouter Gemini (${model}): status ${res.status} - ${errBody}`;
          }
        } catch (openRouterErr: unknown) {
          lastError = openRouterErr instanceof Error ? openRouterErr.message : 'OpenRouter connection error';
        }
      }
    }

    if (!geminiResponseText) {
      return NextResponse.json(
        {
          error: 'Gemini AI API was unable to evaluate the resume.',
          details: lastError,
        },
        { status: 502 }
      );
    }

    // Clean any residual codeblock markdown syntax
    const cleanedJson = geminiResponseText
      .replace(/^```json/i, '')
      .replace(/^```/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);

    const atsScore = Number(parsed.atsScore) || 0;
    const gradeColor =
      atsScore >= 85
        ? 'text-emerald-400'
        : atsScore >= 70
        ? 'text-cyan-400'
        : atsScore >= 50
        ? 'text-amber-400'
        : 'text-red-400';

    const result: GeminiATSAnalysisResult = {
      atsScore,
      grade: parsed.grade || (atsScore >= 80 ? 'Excellent' : atsScore >= 65 ? 'Good' : atsScore >= 50 ? 'Fair' : 'Needs Improvement'),
      gradeColor,
      summary: parsed.summary || 'Resume analyzed by Gemini AI.',
      breakdown: {
        skillsMatchScore: Number(parsed.breakdown?.skillsMatchScore) || 0,
        experienceRelevanceScore: Number(parsed.breakdown?.experienceRelevanceScore) || 0,
        formattingStructureScore: Number(parsed.breakdown?.formattingStructureScore) || 0,
        quantifiableImpactScore: Number(parsed.breakdown?.quantifiableImpactScore) || 0,
        keywordDensityScore: Number(parsed.breakdown?.keywordDensityScore) || 0,
      },
      matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      softSkillsFound: Array.isArray(parsed.softSkillsFound) ? parsed.softSkillsFound : [],
      missingSoftSkills: Array.isArray(parsed.missingSoftSkills) ? parsed.missingSoftSkills : [],
      matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
      actionVerbsFound: Array.isArray(parsed.actionVerbsFound) ? parsed.actionVerbsFound : [],
      quantifiableMetrics: Array.isArray(parsed.quantifiableMetrics) ? parsed.quantifiableMetrics : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      criticalRedFlags: Array.isArray(parsed.criticalRedFlags) ? parsed.criticalRedFlags : [],
      improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : [],
      bulletPointFixes: Array.isArray(parsed.bulletPointFixes) ? parsed.bulletPointFixes : [],
      wordCount,
      readingTimeMinutes,
    };

    return NextResponse.json({
      success: true,
      model: 'Gemini AI',
      domain: domain.name,
      data: result,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Analysis failed';
    console.error('Gemini ATS Route Error:', error);
    return NextResponse.json(
      { error: 'Failed to process resume with Gemini AI.', details: errMessage },
      { status: 500 }
    );
  }
}
