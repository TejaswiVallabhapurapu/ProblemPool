/**
 * ProblemPool AI Service
 * Supports Google Gemini API (default/recommended), OpenAI API, and an intelligent heuristic fallback.
 */

// Helper to make fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Calls Gemini API
 */
async function callGemini(apiKey, systemInstruction, prompt, isJson = true) {
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [];
  if (systemInstruction) {
    contents.push({
      role: 'user',
      parts: [{ text: `[System Instruction]: ${systemInstruction}\n\n[Task]: ${prompt}` }],
    });
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });
  }

  const generationConfig = {
    temperature: 0.3,
    maxOutputTokens: 1200,
  };

  if (isJson) {
    generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig,
      }),
    },
    15000
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return rawText;
}

/**
 * Calls OpenAI API
 */
async function callOpenAI(apiKey, systemInstruction, prompt, isJson = true) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const body = {
    model,
    messages,
    temperature: 0.3,
  };

  if (isJson) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    },
    15000
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

/**
 * Smart heuristic problem improvement when no API key is provided
 */
function heuristicImproveProblem({ title = '', description = '', category = '', tags = [] }) {
  const text = `${title} ${description}`.toLowerCase();
  
  // Detect category if missing
  let suggestedCategory = category || 'General';
  if (text.includes('mongodb') || text.includes('sql') || text.includes('database') || text.includes('postgres') || text.includes('prisma')) {
    suggestedCategory = 'Database';
  } else if (text.includes('react') || text.includes('css') || text.includes('html') || text.includes('frontend') || text.includes('tailwind') || text.includes('vue') || text.includes('next')) {
    suggestedCategory = 'Web Development';
  } else if (text.includes('algorithm') || text.includes('tree') || text.includes('graph') || text.includes('dp') || text.includes('array') || text.includes('leetcode')) {
    suggestedCategory = 'DSA';
  } else if (text.includes('node') || text.includes('express') || text.includes('java') || text.includes('python') || text.includes('spring') || text.includes('api')) {
    suggestedCategory = 'Programming';
  }

  // Detect tags
  const foundTags = new Set(tags.map((t) => t.toLowerCase()));
  const tagKeywords = [
    'react', 'nodejs', 'mongodb', 'express', 'javascript', 'typescript', 'python',
    'java', 'sql', 'dsa', 'api', 'docker', 'nextjs', 'tailwind', 'mongoose', 'jwt',
    'authentication', 'git', 'c++', 'html', 'css', 'backend', 'frontend'
  ];

  tagKeywords.forEach((kw) => {
    if (text.includes(kw.replace('nodejs', 'node').replace('nextjs', 'next'))) {
      foundTags.add(kw);
    }
  });

  if (foundTags.size === 0) {
    foundTags.add('development');
    foundTags.add('troubleshooting');
  }

  // Improve title
  let improvedTitle = title.trim();
  if (improvedTitle.length > 0) {
    // Capitalize first letter
    improvedTitle = improvedTitle.charAt(0).toUpperCase() + improvedTitle.slice(1);
    // Expand brief titles
    if (!improvedTitle.endsWith('?') && (improvedTitle.toLowerCase().startsWith('how') || improvedTitle.toLowerCase().startsWith('why') || improvedTitle.toLowerCase().startsWith('what'))) {
      improvedTitle += '?';
    } else if (improvedTitle.split(' ').length <= 4) {
      if (text.includes('mongodb') || text.includes('connection')) {
        improvedTitle = `Resolving connection and query configuration issues in ${suggestedCategory === 'Database' ? 'MongoDB / Mongoose' : improvedTitle}`;
      } else if (text.includes('error') || text.includes('fail') || text.includes('not working')) {
        improvedTitle = `Troubleshooting "${improvedTitle}": root cause analysis and recommended fix`;
      } else {
        improvedTitle = `How to properly resolve: ${improvedTitle} in ${suggestedCategory}`;
      }
    }
  } else {
    improvedTitle = 'Resolving application issue with proper configuration and error handling';
  }

  // Improve description
  let improvedDescription = description.trim();
  const templateAdditions = [];
  if (!improvedDescription.includes('```')) {
    templateAdditions.push('### Context & Code Snippet\n```javascript\n// Paste relevant code or configuration here\n```');
  }
  if (!improvedDescription.toLowerCase().includes('expected') && !improvedDescription.toLowerCase().includes('result')) {
    templateAdditions.push('### Expected vs Actual Behavior\n- **Expected:** Expected the operation to complete successfully.\n- **Actual:** Encountered unexpected error / behavior.');
  }
  if (!improvedDescription.toLowerCase().includes('tried') && !improvedDescription.toLowerCase().includes('steps')) {
    templateAdditions.push('### What I Have Tried\n- Checked documentation and logs.\n- Verified network and environment variables.');
  }

  if (templateAdditions.length > 0) {
    improvedDescription = (improvedDescription ? `${improvedDescription}\n\n` : '') + templateAdditions.join('\n\n');
  }

  return {
    improvedTitle,
    improvedDescription,
    missingInformation: [
      'Specific version numbers (e.g., Node.js, framework, library versions)',
      'Full error stack trace or console output',
      'Operating system or hosting environment (e.g. Windows, Ubuntu, Docker, Vercel)',
    ],
    suggestedTags: Array.from(foundTags).slice(0, 7),
    suggestedCategory,
    provider: 'heuristic-engine',
  };
}

/**
 * Smart heuristic answer summary when no API key is provided
 */
function heuristicSummarizeAnswers(problemTitle, answers = []) {
  if (!answers || answers.length === 0) {
    return {
      summary: 'No community answers have been submitted for this problem yet.',
      keyTakeaways: [],
      provider: 'heuristic-engine',
    };
  }

  const totalAnswers = answers.length;
  const bestAnswer = answers.find((a) => a.isAccepted || a.isBestAnswer);
  const totalUpvotes = answers.reduce((acc, a) => acc + (a.upvotes || a.helpfulVotes || 0), 0);

  const keyPoints = [];
  answers.forEach((ans) => {
    const raw = (ans.content || '').replace(/```[\s\S]*?```/g, '').trim();
    const firstSentence = raw.split(/[.\n]/)[0]?.trim();
    if (firstSentence && firstSentence.length > 10 && keyPoints.length < 3) {
      keyPoints.push(firstSentence);
    }
  });

  let summaryText = '';
  if (bestAnswer) {
    summaryText = `The community has provided ${totalAnswers} solution${totalAnswers > 1 ? 's' : ''}. The accepted solution focuses on resolving the core configuration and logic issue.`;
  } else if (totalAnswers === 1) {
    summaryText = `1 community member proposed a solution with actionable guidance.`;
  } else {
    summaryText = `Across ${totalAnswers} community answers, respondents suggest checking configuration variables, handling asynchronous errors properly, and verifying dependency versions.`;
  }

  return {
    summary: summaryText,
    keyTakeaways: keyPoints.length > 0 ? keyPoints : [
      'Verify environment configuration and credentials.',
      'Check system logs and network connectivity.',
    ],
    totalAnswers,
    totalUpvotes,
    hasAcceptedAnswer: Boolean(bestAnswer),
    provider: 'heuristic-engine',
  };
}

/**
 * Main improveProblem function
 */
async function improveProblem({ title, description, category, tags }) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const systemInstruction = `You are an expert software engineer and technical writing assistant for ProblemPool, a developer Q&A community.
Analyze the user's problem draft and output a structured JSON response with:
1. "improvedTitle": A clear, searchable, specific question title (avoid vague phrasing like "it does not work").
2. "improvedDescription": A well-structured Markdown description containing headers, clear steps, and a code block placeholder if helpful.
3. "missingInformation": An array of 2-3 specific questions/details the author should add (e.g., error logs, library version, OS).
4. "suggestedTags": An array of 3-6 relevant lowercase technical tags.
5. "suggestedCategory": One of: "Programming", "Web Development", "Database", "AI & ML", "DSA", "Technology", "Career", "Projects", "General".

Return ONLY valid JSON matching this schema.`;

      const prompt = `User's Problem Draft:
Title: "${title || ''}"
Category: "${category || ''}"
Tags: [${(tags || []).join(', ')}]
Description:
${description || ''}`;

      const raw = await callGemini(geminiKey, systemInstruction, prompt, true);
      const parsed = JSON.parse(raw);
      return {
        improvedTitle: parsed.improvedTitle || title,
        improvedDescription: parsed.improvedDescription || description,
        missingInformation: parsed.missingInformation || [],
        suggestedTags: parsed.suggestedTags || tags || [],
        suggestedCategory: parsed.suggestedCategory || category || 'General',
        provider: 'gemini',
      };
    } catch (err) {
      console.warn('Gemini API improveProblem failed, falling back to heuristic:', err.message);
    }
  }

  if (openAiKey) {
    try {
      const systemInstruction = `You are a developer assistant for ProblemPool. Analyze the user's problem draft and return JSON with improvedTitle, improvedDescription (in Markdown), missingInformation (array), suggestedTags (array), and suggestedCategory.`;
      const prompt = `Title: "${title}"\nDescription: "${description}"\nCategory: "${category}"\nTags: ${(tags || []).join(', ')}`;
      const raw = await callOpenAI(openAiKey, systemInstruction, prompt, true);
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        provider: 'openai',
      };
    } catch (err) {
      console.warn('OpenAI API improveProblem failed, falling back to heuristic:', err.message);
    }
  }

  // Intelligent heuristic fallback
  return heuristicImproveProblem({ title, description, category, tags });
}

/**
 * Main summarizeAnswers function
 */
async function summarizeAnswers({ problemTitle, problemDescription, answers = [] }) {
  if (!answers || answers.length === 0) {
    return {
      summary: 'No answers have been provided for this problem yet.',
      keyTakeaways: [],
      provider: 'none',
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const systemInstruction = `You are an AI assistant on ProblemPool summarizing community answers for a technical question.
Generate a concise, unbiased, 2-4 sentence summary capturing the primary solutions, consensus, and any accepted or top-voted recommendations.
Output a JSON response with:
1. "summary": A concise paragraph synthesizing the community solutions.
2. "keyTakeaways": An array of 2-4 bullet points summarizing actionable steps.

Return ONLY valid JSON.`;

      const answersText = answers
        .map(
          (a, i) =>
            `Answer ${i + 1} (Upvotes: ${a.upvotes || a.helpfulVotes || 0}, Best Answer: ${Boolean(
              a.isAccepted || a.isBestAnswer
            )}):\n${a.content}`
        )
        .join('\n\n---\n\n');

      const prompt = `Problem Title: "${problemTitle}"
Problem Context: "${problemDescription ? problemDescription.slice(0, 300) : ''}"

Community Answers (${answers.length} total):
${answersText}`;

      const raw = await callGemini(geminiKey, systemInstruction, prompt, true);
      const parsed = JSON.parse(raw);
      return {
        summary: parsed.summary || 'Summary generated from community answers.',
        keyTakeaways: parsed.keyTakeaways || [],
        totalAnswers: answers.length,
        provider: 'gemini',
      };
    } catch (err) {
      console.warn('Gemini API summarizeAnswers failed, falling back to heuristic:', err.message);
    }
  }

  if (openAiKey) {
    try {
      const systemInstruction = `Summarize the community solutions into a JSON object with "summary" (string) and "keyTakeaways" (array of strings).`;
      const answersText = answers.map((a, i) => `Answer ${i + 1}:\n${a.content}`).join('\n\n');
      const prompt = `Problem: "${problemTitle}"\n\nAnswers:\n${answersText}`;
      const raw = await callOpenAI(openAiKey, systemInstruction, prompt, true);
      const parsed = JSON.parse(raw);
      return {
        summary: parsed.summary,
        keyTakeaways: parsed.keyTakeaways || [],
        totalAnswers: answers.length,
        provider: 'openai',
      };
    } catch (err) {
      console.warn('OpenAI API summarizeAnswers failed, falling back to heuristic:', err.message);
    }
  }

  return heuristicSummarizeAnswers(problemTitle, answers);
}

module.exports = {
  improveProblem,
  summarizeAnswers,
};
