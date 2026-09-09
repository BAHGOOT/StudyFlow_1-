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
