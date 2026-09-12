import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Support large image uploads for college timetable schedules
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy Google Gen AI Client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Candidate models for multimodal vision extraction with fallback support
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

async function callGeminiWithFallback(ai: GoogleGenAI, cleanBase64: string, mimeType: string, prompt: string) {
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType || 'image/jpeg',
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '{}';
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(cleaned);
        }

        if (parsed && (Array.isArray(parsed.lectures) || Array.isArray(parsed.courses))) {
          return { success: true, data: parsed, modelUsed: modelName };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt ${attempt} with model ${modelName} failed:`, err?.message || err);
        // Wait briefly if it's a 503 high demand or 429 rate limit
        if (attempt < 2 && (err?.status === 503 || err?.message?.includes('503') || err?.status === 429)) {
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        }
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
}

// Timetable Image Scanner & Semester Plan Generator endpoint
app.post('/api/scan-timetable', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', existingCourses = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 payload is required' });
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const prompt = `You are an expert college academic planner AI. Analyze this university timetable/schedule picture in detail.

1. LECTURES & SCHEDULE:
Extract every lecture, lab, seminar, or class block visible in the image.
For each lecture, identify:
- courseName: Clean standardized course title (e.g. "Calculus III", "Data Structures", "Organic Chemistry", "Physics I", "Microeconomics")
- courseCode: Course catalog code if visible or plausible abbreviation (e.g. "MATH 201", "CS 106", "PHYS 101", "CHEM 210")
- day: Exactly one of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
- startTime: 24-hour time "HH:MM" (e.g. "09:00", "13:30", "15:00")
- endTime: 24-hour time "HH:MM" (e.g. "10:30", "15:00", "16:45")
- location: Room, lecture hall, or lab name (e.g. "Science Hall 204", "Building B Rm 12", "Online Zoom")

2. COURSES EXTRACTION:
List all unique courses detected. For each course provide:
- name: Course name
- code: Course code (e.g. "MATH 201")
- color: One of ["indigo", "blue", "emerald", "amber", "rose", "violet", "teal", "cyan"]
- accentHex: A matching modern vibrant hex code (e.g. "#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6")
- credits: Estimated credits (default 3 or 4)

3. INITIAL STUDY & SYLLABUS TASKS:
For EACH detected course, generate 2 to 3 essential academic study tasks to build out the student's semester workload immediately:
- name: Clear actionable task name (e.g. "Review Chapter 1 Lecture Notes", "Problem Set #1 Assignment", "Lab Prep & Pre-Lab Questions", "Weekly Practice Quiz")
- type: Exactly one of ["Assignment", "Quiz", "Exam", "Project", "Study"]
- estimatedMinutes: Realistic duration in minutes (e.g. 45, 60, 90)
- importance: Integer 1 to 5 (importance score)
- difficulty: Integer 1 to 5 (cognitive difficulty)
- daysFromNow: Integer between 1 and 14 indicating due date relative to today (e.g. 2 for due in 2 days, 5 for due in 5 days)

OUTPUT FORMAT:
Return strictly valid JSON conforming to this schema:
{
  "lectures": [
    {
      "courseName": "Calculus III",
      "courseCode": "MATH 201",
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "10:30",
      "location": "Hall 101"
    }
  ],
  "courses": [
    {
      "name": "Calculus III",
      "code": "MATH 201",
      "color": "indigo",
      "accentHex": "#6366f1",
      "credits": 4
    }
  ],
  "tasks": [
    {
      "courseName": "Calculus III",
      "name": "Problem Set 1: Multivariable Vectors",
      "type": "Assignment",
      "estimatedMinutes": 60,
      "importance": 4,
      "difficulty": 4,
      "daysFromNow": 3
    }
  ],
  "summary": "Extracted timetable schedule with lectures and study tasks."
}`;

    const ai = getAI();
    const result = await callGeminiWithFallback(ai, cleanBase64, mimeType, prompt);

    res.json({
      success: true,
      data: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error scanning timetable image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unable to analyze timetable image. Please verify your GEMINI_API_KEY or use manual class entry.',
    });
  }
});

// AI Material Indexing & Topic Extraction Endpoint
app.post('/api/materials/index', async (req, res) => {
  try {
    const { title, fileName, fileType, courseName, textContent, fileBase64, mimeType } = req.body;

    const promptText = `You are an expert AI academic document indexer.
Analyze the following course study document ("${title || fileName}" for course "${courseName || 'General Course'}").

Extract structured study metadata according to this exact JSON schema:
{
  "pageCount": estimated total pages or slides (integer, e.g. 24),
  "topicsSummary": ["3 to 5 core high-level topic badges, e.g., Derivatives, Vector Flux, Dijkstra"],
  "chapterOutline": [
    {
      "title": "Chapter or Section Title",
      "pageRange": "Pages 10–25",
      "summary": "Key summary of this section's core focus"
    }
  ],
  "keyFormulasAndConcepts": [
    {
      "concept": "Concept or Theorem Name",
      "formulaOrRule": "Mathematical formula, equation, or core rule if applicable",
      "description": "Clear explanation"
    }
  ],
  "practiceProblems": [
    "Specific practice exercise target e.g., Problem 3.1: Calculate derivatives"
  ]
}`;

    // Construct contents parameter
    let contentsParam: any = promptText;

    if (fileBase64) {
      const cleanData = fileBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      contentsParam = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanData,
                mimeType: mimeType || 'application/pdf',
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ];
    } else if (textContent) {
      contentsParam = `${promptText}\n\nContent or excerpt:\n${String(textContent).slice(0, 8000)}`;
    }

    const ai = getAI();
    let responseText = '{}';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contentsParam,
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = response.text || '{}';
    } catch {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: contentsParam,
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = response.text || '{}';
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Error indexing material:', err);
    res.status(500).json({ success: false, error: err?.message || 'Indexing failed' });
  }
});

// Ask Document AI Endpoint
app.post('/api/materials/ask', async (req, res) => {
  try {
    const { question, materialContext, taskContext } = req.body;

    const prompt = `You are StudyFlow AI Tutor, an expert academic study assistant.
The student is currently working on:
Task: ${taskContext?.name || 'Study Session'} (${taskContext?.courseName || 'Course'})
Material Title: ${materialContext?.title || 'Course Material'}
Topics: ${JSON.stringify(materialContext?.topicsSummary || [])}
Chapter Outline: ${JSON.stringify(materialContext?.chapterOutline || [])}
Formulas & Concepts: ${JSON.stringify(materialContext?.keyFormulasAndConcepts || [])}
Practice Problems: ${JSON.stringify(materialContext?.practiceProblems || [])}

Student Question: "${question}"

Provide a clear, structured, encouraging, and accurate answer grounded directly in the provided course material.
Use clear formatting, bullet points, latex equations, and step-by-step explanations where helpful.`;

    const ai = getAI();
    let responseText = 'Unable to answer question.';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      responseText = response.text || 'No response generated.';
    } catch {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      responseText = response.text || 'No response generated.';
    }

    res.json({
      success: true,
      answer: responseText,
    });
  } catch (err: any) {
    console.error('Error asking document AI:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to generate answer' });
  }
});

// Generate Practice Quiz Grounded in Material Endpoint
app.post('/api/materials/quiz', async (req, res) => {
  try {
    const { materialContext, taskContext } = req.body;

    const prompt = `You are an expert AI professor. Generate an interactive 3-question multiple-choice practice quiz grounded strictly in this study material:
Task: ${taskContext?.name || 'Study Session'}
Material: ${materialContext?.title || 'Course Material'}
Formulas & Concepts: ${JSON.stringify(materialContext?.keyFormulasAndConcepts || [])}
Practice Problems: ${JSON.stringify(materialContext?.practiceProblems || [])}

Return JSON with this schema:
{
  "quizTitle": "Practice Quiz: ${materialContext?.title || 'Course Material'}",
  "questions": [
    {
      "id": "q1",
      "question": "Clear academic question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Detailed step-by-step explanation of why this is correct."
    }
  ]
}`;

    const ai = getAI();
    let responseText = '{}';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = response.text || '{}';
    } catch {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = response.text || '{}';
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      quiz: parsed,
    });
  } catch (err: any) {
    console.error('Error generating quiz:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to generate quiz' });
  }
});

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyFlow Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
