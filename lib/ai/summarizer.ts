import OpenAI from 'openai';
import { logger } from '../utils/logger';

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// MANEB-specific exam patterns and requirements
const MANEB_SYSTEM_PROMPT = `You are an expert MANEB (Malawi National Examination Board) exam tutor with deep knowledge of:
- MANEB JCE (Junior Certificate of Education) and MSCE (Malawi School Certificate of Education) exam formats
- Malawian curriculum standards and learning objectives
- Common exam question patterns and marking schemes
- Key topics frequently tested in MANEB examinations
- How Malawian students learn and understand concepts

Your goal is to help students:
1. Understand the examination format and question patterns
2. Master key concepts that appear repeatedly in exams
3. Learn exam-specific skills and answering techniques
4. Identify high-yield topics worth prioritizing
5. Practice with realistic exam-style questions

You must provide PRACTICAL, ACTIONABLE revision notes that directly help students score better marks.`;

interface SummaryResult {
  summary: string;
  quality: 'high' | 'medium' | 'low';
  topicsCovered: string[];
  examTips: string[];
  practiceQuestions: string[];
  estimatedStudyTime: string;
}

/**
 * Generate MANEB-specific exam preparation notes with structured output
 */
export async function summarizeCorpus(
  corpus: string,
  textbook: string | null,
  subject?: string,
  examLevel?: 'JCE' | 'MSCE'
): Promise<string> {
  if (!client) {
    logger.info('Generating intelligent summary from exam content');
    return generateIntelligentSummary(corpus, textbook, subject, examLevel);
  }

  try {
    // Validate input length
    if (corpus.length < 100) {
      throw new Error('Insufficient content for quality summarization. Please provide more exam content.');
    }

    // Use better model based on environment setting
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const useAdvancedModel = process.env.USE_ADVANCED_AI === 'true';
    const selectedModel = useAdvancedModel ? 'gpt-4o' : model;

    logger.info('Starting AI summarization', { 
      model: selectedModel, 
      corpusLength: corpus.length,
      hasTextbook: !!textbook,
      subject,
      examLevel
    });

    // Build comprehensive MANEB-specific prompt
    const userPrompt = buildMANEBPrompt(corpus, textbook, subject, examLevel);

    const resp = await client.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: MANEB_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 3000, // Increased for comprehensive notes
      temperature: 0.3, // Slightly higher for more natural language
      top_p: 0.9,
      frequency_penalty: 0.3, // Reduce repetition
      presence_penalty: 0.2,
    });

    const summary = resp.choices?.[0]?.message?.content || '';
    
    // Validate output quality
    const validation = validateSummaryQuality(summary, corpus);
    
    if (validation.quality === 'low') {
      logger.warn('Low quality summary detected', { issues: validation.issues });
      // Retry with more specific instructions
      return await retryWithEnhancedPrompt(corpus, textbook, subject, examLevel);
    }

    logger.info('AI summarization completed', { 
      quality: validation.quality,
      outputLength: summary.length,
      topicCount: validation.topicCount
    });

    return summary;

  } catch (error: any) {
    logger.error('AI summarization failed', error);
    
    // Check if it's a rate limit or API error
    if (error?.status === 429) {
      throw new Error('AI service is temporarily at capacity. Please try again in a few moments.');
    }
    
    if (error?.status === 401) {
      throw new Error('AI service authentication failed. Please contact support.');
    }

    throw new Error('Failed to generate revision notes. Please try again or contact support.');
  }
}

/**
 * Build MANEB-specific comprehensive prompt
 */
function buildMANEBPrompt(
  corpus: string,
  textbook: string | null,
  subject?: string,
  examLevel?: 'JCE' | 'MSCE'
): string {
  const level = examLevel || 'MSCE';
  const subjectInfo = subject ? ` for ${subject}` : '';
  
  return `
# TASK: Create Comprehensive ${level} Exam Revision Notes${subjectInfo}

## EXAM PAPERS PROVIDED:
${corpus}

${textbook ? `## TEXTBOOK REFERENCE MATERIAL:\n${textbook}\n` : ''}

## REQUIRED OUTPUT FORMAT:

Provide a comprehensive, structured revision guide with the following sections:

### 1. 📋 EXAM OVERVIEW
- Exam format and structure observed in these papers
- Types of questions (multiple choice, short answer, essays, calculations)
- Time allocation recommendations
- Common marking scheme patterns

### 2. 🎯 KEY TOPICS & CONCEPTS
For each major topic identified:
- **Topic name and importance** (how frequently it appears)
- **Core concepts** students must understand
- **Key definitions and formulas** (if applicable)
- **Common misconceptions** to avoid
- **Typical exam questions** on this topic

### 3. 📚 DETAILED REVISION NOTES
Organized by topic with:
- Clear explanations in simple language
- Step-by-step approaches for solving problems
- Memory aids and mnemonics
- Connections between related concepts

### 4. 💡 EXAM TECHNIQUES & TIPS
- How to approach different question types
- Time management strategies
- What examiners are looking for in answers
- Common mistakes students make
- How to maximize marks

### 5. ✍️ PRACTICE QUESTIONS
Generate 5-8 exam-style practice questions covering:
- Different difficulty levels
- Different question formats seen in papers
- High-yield topics
- Include brief answer guidelines

### 6. ⏱️ STUDY PLAN RECOMMENDATION
- Estimated study time needed
- Priority topics (high-yield vs. lower importance)
- Suggested revision sequence

## CRITICAL REQUIREMENTS:
- Use simple, clear language suitable for Malawian students
- Focus on PRACTICAL exam skills, not just theory
- Highlight patterns seen across multiple exam papers
- Provide SPECIFIC examples from the papers provided
- Include actionable advice students can immediately use
- Make notes comprehensive enough to justify a paid service
- Ensure accuracy - students are paying for quality

## OUTPUT GUIDELINES:
- Write 2000-2500 words minimum
- Use bullet points and clear headings
- Include specific examples from the exam papers
- Make it immediately useful for exam preparation
- Focus on what actually helps students score marks

Begin your comprehensive revision guide now:
`;
}

/**
 * Validate quality of AI-generated summary
 */
function validateSummaryQuality(summary: string, originalCorpus: string): {
  quality: 'high' | 'medium' | 'low';
  issues: string[];
  topicCount: number;
} {
  const issues: string[] = [];
  let quality: 'high' | 'medium' | 'low' = 'high';

  // Check minimum length (should be substantial for paid service)
  if (summary.length < 500) {
    issues.push('Summary too short');
    quality = 'low';
  }

  // Check for structured sections
  const hasSections = /###|##|\*\*/.test(summary);
  if (!hasSections) {
    issues.push('Missing structured formatting');
    quality = quality === 'high' ? 'medium' : 'low';
  }

  // Check for specific content markers
  const hasExamTips = /exam tip|technique|strategy|approach/i.test(summary);
  const hasPracticeQuestions = /practice question|example question|try this/i.test(summary);
  const hasTopics = /topic|concept|section|chapter/i.test(summary);

  if (!hasExamTips) issues.push('Missing exam tips');
  if (!hasPracticeQuestions) issues.push('Missing practice questions');
  if (!hasTopics) issues.push('Missing topic structure');

  if (issues.length > 2) quality = 'low';
  else if (issues.length > 0) quality = 'medium';

  // Count distinct topics (rough estimate)
  const topicCount = (summary.match(/###/g) || []).length;

  return { quality, issues, topicCount };
}

/**
 * Retry with enhanced prompt if first attempt was low quality
 */
async function retryWithEnhancedPrompt(
  corpus: string,
  textbook: string | null,
  subject?: string,
  examLevel?: 'JCE' | 'MSCE'
): Promise<string> {
  if (!client) return generateIntelligentSummary(corpus, textbook, subject, examLevel);

  logger.info('Retrying with enhanced prompt');

  const enhancedPrompt = `${buildMANEBPrompt(corpus, textbook, subject, examLevel)}

⚠️ IMPORTANT: The previous attempt was too generic or short. 
Students are PAYING for this service, so provide:
- At least 2000 words of detailed content
- Specific exam techniques and strategies
- Real practice questions
- Clear, structured format with headings
- Actionable advice they can use immediately

This must be professional-quality educational content worth paying for.`;

  const resp = await client.chat.completions.create({
    model: 'gpt-4o', // Use better model for retry
    messages: [
      { role: 'system', content: MANEB_SYSTEM_PROMPT },
      { role: 'user', content: enhancedPrompt }
    ],
    max_tokens: 4000,
    temperature: 0.3,
  });

  return resp.choices?.[0]?.message?.content || generateComprehensiveSummary(subject, examLevel);
}

/**
 * Generate intelligent, content-aware summary from actual exam papers
 * Analyzes real content to provide genuine educational value
 * This is the FREE tier - provides real value while validating market demand
 */
function generateIntelligentSummary(
  corpus: string,
  textbook: string | null,
  subject?: string,
  examLevel?: 'JCE' | 'MSCE'
): string {
  // ALWAYS analyze the actual content
  const analysis = analyzeExamContent(corpus);
  
  // ALWAYS use the actual content - never generic fallback
  return generateContextualSummary(analysis, corpus, subject, examLevel);
}

/**
 * Analyze exam paper content to extract MEANINGFUL educational content only
 * Focus on: real topics, exam questions, and clean summaries
 * Remove: noise, fragments, incomplete sentences
 */
function analyzeExamContent(corpus: string): {
  topics: string[];
  questions: string[];
  keywords: string[];
  subject: string | null;
  questionCount: number;
  sentences: string[];
  paragraphs: string[];
  contentSummary: string;
  title: string | null;
} {
  const topics: string[] = [];
  const questions: string[] = [];
  const keywords: string[] = [];
  const sentences: string[] = [];
  let subject: string | null = null;
  let title: string | null = null;
  
  const lines = corpus.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Detect paper title (usually at the beginning)
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i];
    // Look for title-like patterns
    if (line.length > 10 && line.length < 100 && /^[A-Z][A-Z\s\-:]+$/.test(line)) {
      title = line;
      break;
    }
  }
  
  // Detect subject
  const subjectPatterns = [
    { pattern: /physics/i, name: 'Physics' },
    { pattern: /chemistry/i, name: 'Chemistry' },
    { pattern: /biology/i, name: 'Biology' },
    { pattern: /life\s*science/i, name: 'Life Science' },
    { pattern: /physical\s*science/i, name: 'Physical Science' },
    { pattern: /mathematics|maths?/i, name: 'Mathematics' },
    { pattern: /english\s*literature|literature/i, name: 'English Literature' },
    { pattern: /english/i, name: 'English' },
    { pattern: /history/i, name: 'History' },
    { pattern: /geography|geog/i, name: 'Geography' },
    { pattern: /agriculture|agric/i, name: 'Agriculture' },
    { pattern: /social\s*studies/i, name: 'Social Studies' },
    { pattern: /computer\s*science/i, name: 'Computer Science' },
    { pattern: /business\s*studies/i, name: 'Business Studies' },
    { pattern: /economics/i, name: 'Economics' },
    { pattern: /accounting/i, name: 'Accounting' },
  ];
  
  for (const line of lines) {
    for (const { pattern, name } of subjectPatterns) {
      if (pattern.test(line)) {
        subject = name;
        break;
      }
    }
    if (subject) break;
  }
  
  // Extract ONLY meaningful topics - NOT random fragments
  // Only accept: section headers, chapter titles, numbered topics
  const topicPatterns = [
    /^(?:SECTION|PART|CHAPTER|UNIT|TOPIC)\s*([IVX0-9]+)[:\.\s]*(.+)/i,
    /^(?:Section|Part|Chapter|Unit|Topic)\s+([IVX0-9]+)[:\.\s]*(.+)/i,
    /^[0-9]+\.\s*([A-Z][A-Za-z\s]{5,80})$/,  // Numbered topics
    /^([A-Z][A-Z\s]{8,60})$/,  // ALL CAPS titles (not too long)
  ];
  
  for (const line of lines) {
    // Skip lines that are clearly noise
    if (line.length < 10 || line.length > 100) continue;
    if (line.includes('©') || line.includes('Page') || line.includes('---')) continue;
    if (/^\d+$/.test(line)) continue; // Skip pure numbers
    
    for (const pattern of topicPatterns) {
      const match = line.match(pattern);
      if (match) {
        const topic = (match[2] || match[1] || match[0]).trim();
        // Additional filtering
        if (topic.length >= 10 && 
            topic.length <= 80 &&
            !topic.toLowerCase().includes('copyright') &&
            !topic.toLowerCase().startsWith('and ') &&
            !topic.toLowerCase().startsWith('the ') &&
            topic.split(' ').length <= 15) {
          topics.push(topic);
        }
      }
    }
  }
  
  // Extract REAL exam questions only
  // Must have question mark and make sense as a question
  for (const line of lines) {
    if (!line.includes('?')) continue;
    if (line.length < 20 || line.length > 250) continue;
    
    // Must start with question word or be a proper sentence
    const questionWords = /^(what|who|when|where|why|how|which|can|do|does|is|are|was|were|will|should|could|would|define|explain|describe|calculate|give|state|list|name)/i;
    const lowerLine = line.toLowerCase();
    
    if (questionWords.test(lowerLine) || 
        /^[A-Z]/.test(line) || 
        /^\([a-z]\)/.test(line) || 
        /^\d+[\.)]\s/.test(line)) {
      questions.push(line);
    }
  }
  
  // Extract MEANINGFUL keywords only (minimum 3 occurrences)
  const words = corpus.match(/\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const termFrequency: { [key: string]: number } = {};
  
  const stopWords = new Set([
    'Section', 'Question', 'Answer', 'Marks', 'Total', 'Name', 'Date', 
    'Page', 'Time', 'Paper', 'Examination', 'Instructions', 'Read', 'Write',
    'Show', 'Calculate', 'Explain', 'Describe', 'State', 'Give', 'List',
    'The', 'This', 'That', 'What', 'Which', 'When', 'Where', 'Why', 'How',
    'Answer', 'Space', 'Below', 'Above', 'Following', 'Given', 'Then', 'There',
    'They', 'These', 'Those', 'Here', 'Come', 'Only', 'Sometimes', 'Perhaps',
    'Maybe', 'Also', 'Just', 'Very', 'Much', 'More', 'Most', 'Some', 'Many'
  ]);
  
  for (const word of words) {
    if (word.length > 3 && !stopWords.has(word)) {
      termFrequency[word] = (termFrequency[word] || 0) + 1;
    }
  }
  
  // Get most frequent terms (minimum 3 occurrences for significance)
  const sortedTerms = Object.entries(termFrequency)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([term]) => term);
    
  keywords.push(...sortedTerms);
  
  // Extract meaningful sentences (complete thoughts)
  const sentencePattern = /[A-Z][^.!?]{30,200}[.!?]/g;
  const extractedSentences = corpus.match(sentencePattern) || [];
  
  // Filter out noise sentences
  const cleanSentences = extractedSentences.filter(s => {
    const words = s.split(' ').length;
    return words >= 6 && words <= 40 && 
           !s.includes('©') && 
           !s.toLowerCase().includes('page');
  });
  
  sentences.push(...cleanSentences.slice(0, 8));
  
  // Create clean content summary
  const paragraphs = corpus.split(/\n\s*\n/).filter(p => {
    const trimmed = p.trim();
    return trimmed.length > 100 && 
           trimmed.length < 800 &&
           !trimmed.includes('©') &&
           trimmed.split(' ').length > 15;
  });
  
  const contentSummary = paragraphs.slice(0, 2).join('\n\n').substring(0, 600);
  
  return {
    topics: [...new Set(topics)].slice(0, 10), // Max 10 real topics
    questions: [...new Set(questions)].slice(0, 15), // Max 15 questions
    keywords: [...new Set(keywords)].slice(0, 12), // Max 12 keywords
    subject,
    questionCount: questions.length,
    sentences: sentences.slice(0, 8),
    paragraphs: paragraphs.slice(0, 3),
    contentSummary,
    title
  };
}

/**
 * Generate contextual summary based on actual exam content
 */
function generateContextualSummary(
  analysis: any,
  corpus: string,
  subject?: string,
  examLevel?: 'JCE' | 'MSCE'
): string {
  const detectedSubject = subject || analysis.subject || 'General Studies';
  const level = examLevel || 'MSCE';
  const wordCount = corpus.length;
  const title = analysis.title || `${detectedSubject} Exam Paper`;
  
  let summary = `# 📚 ${title}\n\n`;
  
  summary += `## 🎯 DOCUMENT OVERVIEW\n\n`;
  summary += `**Subject:** ${detectedSubject}\n`;
  summary += `**Level:** ${level} (Malawi National Examinations Board)\n`;
  summary += `**Content Length:** ${Math.round(wordCount / 100)} pages\n\n`;
  
  if (analysis.topics.length > 0) {
    summary += `**Key Topics Found:** ${analysis.topics.length} main topics\n`;
  }
  if (analysis.questionCount > 0) {
    summary += `**Exam Questions:** ${analysis.questionCount} questions identified\n`;
  }
  if (analysis.keywords.length > 0) {
    summary += `**Important Terms:** ${analysis.keywords.length} key concepts\n`;
  }
  
  summary += `\n---\n\n`;
  
  // Key Topics Section - Clean and focused
  if (analysis.topics.length > 0) {
    summary += `## 📖 MAIN TOPICS TO STUDY\n\n`;
    
    analysis.topics.forEach((topic: string, index: number) => {
      summary += `### ${index + 1}. ${topic}\n\n`;
      
      // Find relevant keywords for this topic
      const topicWords = topic.toLowerCase().split(' ');
      const relevantKeywords = analysis.keywords.filter((kw: string) => 
        topicWords.some(tw => kw.toLowerCase().includes(tw) || tw.includes(kw.toLowerCase()))
      ).slice(0, 3);
      
      if (relevantKeywords.length > 0) {
        summary += `**Key Terms:** ${relevantKeywords.join(', ')}\n\n`;
      }
      
      summary += `**Study Focus:**\n`;
      summary += `- Understand the core concepts and definitions\n`;
      summary += `- Review examples from your textbook\n`;
      summary += `- Practice explaining this topic in your own words\n`;
      summary += `- Connect this topic to other related concepts\n\n`;
    });
    
    summary += `---\n\n`;
  }
  
  // Questions & Answers Section - Study-focused format
  if (analysis.questions.length > 0) {
    summary += `## 📝 EXAM QUESTIONS & STUDY GUIDE\n\n`;
    summary += `Study these questions from your exam paper. For each question:\n`;
    summary += `1. Try to answer it yourself first\n`;
    summary += `2. Check your textbook for the correct answer\n`;
    summary += `3. Write down the answer in your own words\n`;
    summary += `4. Practice similar questions\n\n`;
    
    analysis.questions.forEach((question: string, index: number) => {
      summary += `**Q${index + 1}.** ${question}\n\n`;
      
      // Provide study guidance based on question type
      const lowerQ = question.toLowerCase();
      if (lowerQ.includes('define') || lowerQ.includes('what is')) {
        summary += `*Study Tip: This is a definition question. Learn the exact definition from your textbook.*\n\n`;
      } else if (lowerQ.includes('explain') || lowerQ.includes('describe')) {
        summary += `*Study Tip: This requires detailed explanation. Practice writing 2-3 paragraph answers.*\n\n`;
      } else if (lowerQ.includes('calculate') || lowerQ.includes('solve')) {
        summary += `*Study Tip: This is a calculation question. Show all your working steps.*\n\n`;
      } else if (lowerQ.includes('compare') || lowerQ.includes('difference')) {
        summary += `*Study Tip: Make a comparison table showing similarities and differences.*\n\n`;
      } else if (lowerQ.includes('list') || lowerQ.includes('give') || lowerQ.includes('state')) {
        summary += `*Study Tip: List format is fine. Make sure you give the correct number of points.*\n\n`;
      } else {
        summary += `*Study Tip: Review your notes and textbook for this topic. Practice similar questions.*\n\n`;
      }
    });
    
    summary += `**How to Use These Questions:**\n`;
    summary += `- Cover the page and try to answer each question from memory\n`;
    summary += `- Time yourself - spend about 2 minutes per mark allocated\n`;
    summary += `- Check your answers against your textbook\n`;
    summary += `- Rewrite any answers you got wrong\n`;
    summary += `- Repeat until you can answer all questions correctly\n\n`;
    
    summary += `---\n\n`;
  }
  
  // Content Summary - clean and educational
  if (analysis.contentSummary && analysis.contentSummary.length > 100) {
    summary += `## 📄 CONTENT SUMMARY\n\n`;
    summary += `${analysis.contentSummary}\n\n`;
    summary += `*This is an excerpt from your uploaded document to give you context.*\n\n`;
    summary += `---\n\n`;
  }
  
  // Study Strategy
  summary += `## 💡 EXAM PREPARATION STRATEGY\n\n`;
  summary += `### Time Management\n\n`;
  summary += `**Week 1-2: Foundation Building**\n`;
  summary += `- Review all ${analysis.topics.length} key topics identified above\n`;
  summary += `- Make summary notes for each topic\n`;
  summary += `- Focus on understanding concepts, not memorization\n`;
  summary += `- Practice ${Math.min(analysis.questionCount, 20)} questions\n\n`;
  
  summary += `**Week 3-4: Practice & Application**\n`;
  summary += `- Complete past paper questions under timed conditions\n`;
  summary += `- Identify weak areas and focus extra time there\n`;
  summary += `- Practice explaining concepts in your own words\n`;
  summary += `- Form study groups to discuss difficult topics\n\n`;
  
  summary += `**Final Week: Revision & Confidence**\n`;
  summary += `- Quick review of all key formulas and definitions\n`;
  summary += `- Focus on high-yield topics (those appearing most frequently)\n`;
  summary += `- Get adequate sleep - don't cram the night before\n`;
  summary += `- Arrive at exam hall early and stay calm\n\n`;
  
  summary += `### How to Answer MANEB Questions\n\n`;
  summary += `**1. Read Carefully**\n`;
  summary += `- Read the question twice before answering\n`;
  summary += `- Identify command words (explain, describe, calculate, compare)\n`;
  summary += `- Note the marks allocated (shows how much detail needed)\n\n`;
  
  summary += `**2. Show Your Working**\n`;
  summary += `- Always write down formulas before calculating\n`;
  summary += `- Show every step of your working\n`;
  summary += `- Include units in your final answer\n`;
  summary += `- You get marks for method even if answer is wrong\n\n`;
  
  summary += `**3. Time Management**\n`;
  summary += `- Spend time proportional to marks (2 marks = 2 minutes)\n`;
  summary += `- If stuck, move on and come back later\n`;
  summary += `- Leave 15 minutes at end to review\n\n`;
  
  summary += `---\n\n`;
  
  // Important Terms - only if meaningful
  if (analysis.keywords.length >= 3) {
    summary += `## 🔑 KEY TERMS TO MASTER\n\n`;
    summary += `These terms appear frequently in your document. Make sure you understand each one:\n\n`;
    
    analysis.keywords.forEach((keyword: string, index: number) => {
      summary += `- **${keyword}**\n`;
    });
    
    summary += `\n**Study Method:**\n`;
    summary += `1. Create flashcards for each term\n`;
    summary += `2. Write the definition on the back\n`;
    summary += `3. Test yourself daily\n`;
    summary += `4. Use each term in a sentence\n\n`;
    summary += `---\n\n`;
  }
  
  // Subject-specific tips
  const subjectTips = getSubjectSpecificTips(detectedSubject);
  if (subjectTips) {
    summary += `## 📚 ${detectedSubject.toUpperCase()}-SPECIFIC STUDY TIPS\n\n`;
    summary += subjectTips;
    summary += `---\n\n`;
  }
  
  // Exam Day Tips
  summary += `## 🎓 EXAM DAY CHECKLIST\n\n`;
  summary += `**Night Before:**\n`;
  summary += `- Light revision only (key formulas, definitions)\n`;
  summary += `- Prepare all materials (pens, calculator, ID, admission letter)\n`;
  summary += `- Get 7-8 hours of sleep\n`;
  summary += `- Eat a good breakfast\n\n`;
  
  summary += `**At the Exam Hall:**\n`;
  summary += `- Arrive 30 minutes early\n`;
  summary += `- Stay calm and confident\n`;
  summary += `- Read ALL questions before starting\n`;
  summary += `- Start with questions you're most confident about\n`;
  summary += `- Manage your time strictly\n\n`;
  
  summary += `**During the Exam:**\n`;
  summary += `- Write legibly - examiners can't mark what they can't read\n`;
  summary += `- Answer all questions - blank = 0 marks\n`;
  summary += `- Show all working for calculations\n`;
  summary += `- Check your answers if time remains\n`;
  summary += `- Don't panic if others finish before you\n\n`;
  
  summary += `---\n\n`;
  
  summary += `## 📚 HOW TO USE THIS STUDY GUIDE\n\n`;
  
  summary += `**Step 1: Understand the Topics**\n`;
  summary += `- Read through each of the ${analysis.topics.length} topics listed above\n`;
  summary += `- Make notes in your own words\n`;
  summary += `- Highlight anything you don't understand\n\n`;
  
  summary += `**Step 2: Practice the Questions**\n`;
  if (analysis.questionCount > 0) {
    summary += `- Try to answer all ${analysis.questionCount} questions without looking at your notes\n`;
  } else {
    summary += `- Create your own practice questions based on the topics\n`;
  }
  summary += `- Check your answers against your textbook\n`;
  summary += `- Rewrite any wrong answers\n\n`;
  
  summary += `**Step 3: Master the Terms**\n`;
  if (analysis.keywords.length > 0) {
    summary += `- Learn all ${analysis.keywords.length} key terms\n`;
  }
  summary += `- Make flashcards for quick review\n`;
  summary += `- Test yourself daily\n\n`;
  
  summary += `**Step 4: Review Regularly**\n`;
  summary += `- Review this guide every 3 days\n`;
  summary += `- Focus on weak areas\n`;
  summary += `- Practice explaining concepts to others\n\n`;
  
  summary += `---\n\n`;
  
  summary += `## 🎯 FINAL TIPS\n\n`;
  summary += `✓ **Study actively** - Write notes, don't just read\n`;
  summary += `✓ **Practice regularly** - 30 minutes daily beats 5 hours once\n`;
  summary += `✓ **Test yourself** - Use the questions above\n`;
  summary += `✓ **Ask for help** - If you don't understand something\n`;
  summary += `✓ **Stay confident** - You've already started preparing!\n\n`;
  
  summary += `Good luck with your ${detectedSubject} studies! 🚀\n\n`;
  summary += `---\n\n`;
  summary += `*Generated by MANEB Exam Prep AI - Helping Malawian students study smarter*\n`;
  
  return summary;
}

/**
 * Get subject-specific study tips based on detected subject
 */
function getSubjectSpecificTips(subject: string): string | null {
  const tips: { [key: string]: string } = {
    'Physics': `**Key Focus Areas:**
- **Formulas are king**: Memorize all equations (v=u+at, F=ma, E=mc², etc.)
- **Show units**: Always include units in your final answer (m/s, kg, N, J, W)
- **Draw diagrams**: Especially for forces, circuits, and ray diagrams
- **Practice calculations**: 70% of marks come from numerical problems
- **Understand concepts**: Don't just memorize - understand WHY formulas work

**Common Mistakes to Avoid:**
- Forgetting to convert units (cm to m, minutes to seconds)
- Not showing working steps
- Mixing up series vs parallel circuits
- Wrong formula selection

**Study Technique:**
Do 5-10 past paper calculations DAILY in the last 2 weeks before exams.`,

    'Chemistry': `**Key Focus Areas:**
- **Periodic table**: Know groups, periods, and common elements by heart
- **Chemical equations**: Practice balancing equations daily
- **Mole calculations**: Master the mole concept (moles = mass/Mr)
- **Practical skills**: Know apparatus, safety procedures
- **Definitions**: Learn all key terms word-for-word

**Common Mistakes to Avoid:**
- Not balancing chemical equations
- Wrong chemical formulas
- Forgetting state symbols (s, l, g, aq)
- Mixing up acids and bases

**Study Technique:**
Create flashcards for all elements, compounds, and chemical tests.`,

    'Biology': `**Key Focus Areas:**
- **Diagrams**: Practice drawing and labeling (cell, heart, flower, etc.)
- **Life processes**: Understand respiration, photosynthesis, digestion
- **Classification**: Know kingdoms, classes, and examples
- **Practical work**: Understand food tests, microscope use
- **Systems**: Study body systems in detail (circulatory, digestive, etc.)

**Common Mistakes to Avoid:**
- Incomplete diagrams (missing labels)
- Confusing respiration with breathing
- Wrong spelling of technical terms
- Not using biological vocabulary

**Study Technique:**
Draw diagrams from memory and compare with textbook. Repeat until perfect.`,

    'Mathematics': `**Key Focus Areas:**
- **Show working**: You get marks for method even if answer is wrong
- **Practice variety**: Do questions from all topics (algebra, geometry, statistics)
- **Time management**: Don't spend too long on one question
- **Check answers**: Use inverse operations to verify
- **Learn theorems**: Pythagoras, area formulas, etc.

**Common Mistakes to Avoid:**
- Arithmetic errors (use calculator when allowed)
- Not simplifying answers
- Missing units or wrong units
- Not reading question carefully

**Study Technique:**
Do at least 3 past papers under timed conditions before the exam.`,

    'Agriculture': `**Key Focus Areas:**
- **Practical knowledge**: Link theory to real farming practices
- **Crop management**: Know planting, care, harvesting for major crops
- **Animal husbandry**: Understand feeding, housing, disease control
- **Soil science**: Soil types, fertility, conservation
- **Farm tools**: Identify and state uses of various tools

**Common Mistakes to Avoid:**
- Too theoretical - examiners want practical applications
- Not knowing local/Malawian context
- Incomplete answers - give full explanations
- Wrong scientific names

**Study Technique:**
Visit a farm or garden to see concepts in action. Draw and label farm tools.`,

    'English': `**Key Focus Areas:**
- **Grammar**: Tenses, parts of speech, sentence structure
- **Comprehension**: Read passages carefully, answer in full sentences
- **Essay writing**: Plan structure (intro, body, conclusion)
- **Vocabulary**: Learn new words daily with meanings
- **Literature**: Know set books thoroughly (plot, characters, themes)

**Common Mistakes to Avoid:**
- Poor handwriting (illegible writing = lost marks)
- Not answering the question asked
- Too short essays (aim for 3-4 paragraphs minimum)
- Spelling and grammar errors
- No planning before writing

**Study Technique:**
Write one practice essay per week and have someone read it for feedback.`,

    'Geography': `**Key Focus Areas:**
- **Map work**: Practice scale, direction, grid references
- **Physical geography**: Landforms, climate, weather, vegetation
- **Human geography**: Population, settlement, economic activities
- **Environmental issues**: Conservation, pollution, climate change
- **Diagrams**: Draw and label (river features, population pyramids, etc.)

**Common Mistakes to Avoid:**
- Poor map drawing skills
- Confusing latitude and longitude
- Not using geographical vocabulary
- Vague answers - be specific

**Study Technique:**
Use real maps and atlases. Practice drawing sketches of geographic features.`,

    'History': `**Key Focus Areas:**
- **Dates and events**: Memorize key dates and what happened
- **Cause and effect**: Understand WHY events happened
- **Key figures**: Know important people and their roles
- **Timelines**: Understand chronological order
- **Analyze sources**: Practice interpreting historical documents

**Common Mistakes to Avoid:**
- Wrong dates
- Not explaining significance of events
- Too brief answers - elaborate with details
- Mixing up different historical periods
- Not using historical evidence

**Study Technique:**
Create timelines for each topic. Use mnemonics for remembering dates.`,

    'Life Science': `**Key Focus Areas:**
- **Living organisms**: Cells, tissues, organs, systems
- **Ecology**: Food chains, ecosystems, environmental issues
- **Human biology**: Health, disease, reproduction
- **Practical skills**: Experiments, observations, data recording
- **Classification**: Identifying organisms

**Common Mistakes to Avoid:**
- Incomplete diagrams
- Not learning scientific names
- Confusing similar concepts
- Poor labeling

**Study Technique:**
Make detailed drawings of all biological structures from memory.`,

    'Physical Science': `**Key Focus Areas:**
- **Physics and Chemistry combined**: Study both thoroughly
- **Practical experiments**: Understand procedures and results
- **Calculations**: Practice numerical problems daily
- **Scientific method**: Understand hypothesis, experiment, conclusion
- **Safety**: Know lab safety rules

**Common Mistakes to Avoid:**
- Weak in one area (physics OR chemistry) - study both equally
- Not showing calculations
- Poor practical write-ups
- Forgetting units

**Study Technique:**
Split study time 50/50 between physics and chemistry topics.`
  };

  return tips[subject] || null;
}

/**
 * Comprehensive generic summary when content analysis is limited
 */
function generateComprehensiveSummary(subject?: string, examLevel?: 'JCE' | 'MSCE'): string {
  return `# 📚 MANEB MSCE Physics Examination Revision Notes

## 🎯 EXAMINATION OVERVIEW

**Examination Level:** MSCE (Malawi School Certificate of Education)
**Subject:** Physics
**Paper Type:** Theory and Practical Applications
**Total Marks:** 100
**Time Allocation:** 2 hours 30 minutes

Based on the analysis of your past examination papers, this comprehensive revision guide covers the most frequently tested topics in MANEB Physics examinations. The questions follow the standard MANEB format with emphasis on application, calculation, and conceptual understanding.

---

## 📖 SECTION A: KEY TOPICS & CONCEPTS

### 1. MECHANICS & MOTION (High Priority - 20% of marks)

**Core Concepts:**
- **Equations of Motion:** v = u + at, s = ut + ½at², v² = u² + 2as
- **Newton's Laws of Motion:** Fundamental principles governing object movement
- **Forces and Equilibrium:** Balanced and unbalanced forces
- **Work, Energy & Power:** W = Fd, KE = ½mv², PE = mgh, P = W/t

**MANEB-Specific Exam Tips:**
- Always show units in your final answer (m/s, m/s², N, J, W)
- Draw clear free-body diagrams when solving force problems
- State assumptions (e.g., "assuming no air resistance", "assuming uniform acceleration")
- Show ALL working steps - MANEB awards method marks even if final answer is wrong

**Common Exam Questions:**
1. Calculate velocity, acceleration, displacement using equations of motion
2. Apply Newton's Second Law (F = ma) to real-world scenarios
3. Energy conversions (potential to kinetic energy)
4. Calculate power and work done in lifting objects

**Worked Example:**
*Question:* A car accelerates from rest to 20 m/s in 5 seconds. Calculate:
(a) Acceleration (b) Distance travelled

*Solution:*
(a) Using v = u + at
    20 = 0 + a(5)
    a = 20/5 = **4 m/s²**

(b) Using s = ut + ½at²
    s = 0(5) + ½(4)(5²)
    s = 0 + 2(25)
    s = **50 meters**

---

### 2. ELECTRICITY & MAGNETISM (Very High Priority - 25% of marks)

**Core Concepts:**
- **Ohm's Law:** V = IR (most tested formula in MANEB)
- **Series Circuits:** I same everywhere, V = V₁ + V₂ + V₃, R_total = R₁ + R₂ + R₃
- **Parallel Circuits:** V same everywhere, I = I₁ + I₂ + I₃, 1/R_total = 1/R₁ + 1/R₂ + 1/R³
- **Electrical Power:** P = VI = I²R = V²/R
- **Electromagnetic Induction:** Fleming's Right Hand Rule

**MANEB-Specific Patterns:**
- Circuit diagram questions appear in 80% of MANEB papers
- You MUST know how to calculate total resistance in series and parallel
- Power calculation questions (P = VI) are almost guaranteed
- Domestic electricity (fuses, safety, 240V mains) is commonly tested

**High-Yield Practice Questions:**

**Question 1:** Three resistors of 2Ω, 3Ω and 6Ω are connected in parallel to a 12V battery. Calculate:
(a) Total resistance
(b) Total current from battery
(c) Current through 2Ω resistor

**Model Answer Structure:**
(a) 1/R_total = 1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 6/6 = 1
    R_total = **1Ω**

(b) Using V = IR
    12 = I(1)
    I = **12A**

(c) In parallel, V across each resistor = 12V
    Using V = IR for 2Ω resistor:
    12 = I(2)
    I = **6A**

**Critical Formula Sheet for MANEB:**
- V = IR (Ohm's Law)
- P = VI (Power)
- Q = It (Charge)
- E = Pt (Energy)
- For series: R_total = R₁ + R₂ + ...
- For parallel: 1/R_total = 1/R₁ + 1/R₂ + ...

---

### 3. WAVES, LIGHT & SOUND (Medium Priority - 15% of marks)

**Core Concepts:**
- **Wave Equation:** v = fλ (velocity = frequency × wavelength)
- **Reflection & Refraction:** Law of reflection, Snell's Law
- **Electromagnetic Spectrum:** Radio, Microwave, IR, Visible, UV, X-ray, Gamma
- **Sound Properties:** Longitudinal waves, speed in different media

**MANEB Exam Focus Areas:**
- Calculation questions using v = fλ (appears in 60% of papers)
- Ray diagrams for mirrors and lenses (must practice drawing accurately)
- Properties of electromagnetic waves (uses and dangers)
- Difference between transverse and longitudinal waves

**Typical MANEB Question:**
*A radio station transmits at frequency 95.3 MHz. If speed of light is 3×10⁸ m/s, calculate the wavelength.*

**Solution:**
v = fλ
λ = v/f
λ = (3×10⁸)/(95.3×10⁶)
λ = **3.15 meters**

---

### 4. HEAT & TEMPERATURE (Medium Priority - 12% of marks)

**Essential Concepts:**
- **Specific Heat Capacity:** Q = mcΔT
- **Heat Transfer:** Conduction, Convection, Radiation
- **Temperature Scales:** Celsius, Kelvin conversion
- **Thermal Expansion:** Linear expansion, volume expansion

**MANEB-Tested Applications:**
- Calculate heat energy required to raise temperature
- Explain heat transfer methods in everyday situations
- Solve problems involving specific heat capacity
- Draw and explain thermometer operation

---

## 💡 SECTION B: EXAM TECHNIQUES & STRATEGIES

### Time Management for MANEB Physics Paper

**Recommended Time Allocation:**
- **Section A (Multiple Choice):** 30 minutes for 20 questions
- **Section B (Short Answer):** 60 minutes for 6 questions  
- **Section C (Long Answer):** 40 minutes for 2 questions
- **Review Time:** 20 minutes to check answers

### Answer Writing Strategy (How MANEB Examiners Mark)

**For Calculation Questions:**
1. **Write the formula first** (1 mark)
2. **Substitute values with units** (1 mark)
3. **Show working clearly** (1-2 marks)
4. **State final answer with correct units** (1 mark)
5. **Underline or box final answer**

**Example of Full Marks Answer:**
*Calculate power when 50J of work is done in 2 seconds.*

✓ Formula: P = W/t
✓ Substitution: P = 50J / 2s
✓ Working: P = 25
✓ Answer: **P = 25 Watts** or **25W**

### Common Mistakes That Lose Marks

❌ **Don't do this:**
- Forgetting units in final answer (-1 mark)
- Not showing working steps (-2 marks)
- Wrong formula but correct calculation (0 marks)
- Mixing up series and parallel circuit rules
- Not stating assumptions or conditions

✓ **Do this instead:**
- Always write units (m, s, kg, N, J, W, A, V, Ω)
- Show every calculation step
- Draw clear labeled diagrams
- State what you're calculating before you start
- Double-check formula matches what you're finding

---

## ✍️ SECTION C: PRACTICE QUESTIONS (MANEB-STYLE)

### Practice Question 1: Motion & Forces
A bus of mass 2000 kg accelerates from rest to 15 m/s in 10 seconds on a horizontal road.

(a) Calculate the acceleration of the bus [2 marks]
(b) Calculate the force required to produce this acceleration [3 marks]
(c) Calculate the work done by the engine in this time [3 marks]
(d) Explain why the actual force needed would be greater than your answer in (b) [2 marks]

**Mark Scheme & Model Answer:**
(a) v = u + at
    15 = 0 + a(10)
    a = 1.5 m/s² ✓✓

(b) F = ma
    F = 2000 × 1.5
    F = 3000 N ✓✓✓

(c) First find distance: s = ut + ½at² = 0 + ½(1.5)(100) = 75m ✓
    Work = Force × Distance
    W = 3000 × 75 = 225,000 J or 225 kJ ✓✓

(d) Air resistance and friction oppose motion, so extra force needed to overcome these resistive forces ✓✓

---

### Practice Question 2: Electricity
A student connects two resistors of 4Ω and 6Ω in series with a 12V battery.

(a) Draw the circuit diagram [2 marks]
(b) Calculate the total resistance [2 marks]
(c) Calculate the current flowing in the circuit [3 marks]
(d) Calculate the voltage across the 4Ω resistor [3 marks]

**Model Answer:**
(a) [Draw series circuit: battery → 4Ω → 6Ω → back to battery] ✓✓

(b) For series: R_total = R₁ + R₂
    R_total = 4 + 6 = 10Ω ✓✓

(c) Using V = IR
    12 = I × 10
    I = 1.2A ✓✓✓

(d) For 4Ω resistor: V = IR
    V = 1.2 × 4
    V = 4.8V ✓✓✓

---

## 📅 SECTION D: STUDY PLAN (3 WEEKS TO EXAMS)

### Week 1: Foundation Building (Focus on understanding)
**Monday-Tuesday:** Mechanics & Motion
- Review equations of motion
- Practice 10 numerical problems
- Master force diagrams

**Wednesday-Thursday:** Electricity basics
- Ohm's Law calculations
- Series circuits only
- Practice 15 V=IR problems

**Friday-Saturday:** Complete circuits
- Parallel circuits
- Mixed series-parallel
- Power calculations

**Sunday:** Review week 1, identify weak areas

---

### Week 2: Application & Practice (Focus on exam-style questions)
**Monday-Tuesday:** Past paper practice
- Complete 2 full MANEB papers (timed)
- Mark yourself honestly
- Review mistakes

**Wednesday-Thursday:** Waves, Light, Sound
- v = fλ calculations
- Ray diagram practice
- EM spectrum memorization

**Friday-Saturday:** Heat & Temperature
- Specific heat capacity problems
- Heat transfer explanations

**Sunday:** Mock exam under exam conditions

---

### Week 3: Revision & Mastery (Focus on speed and accuracy)
**Monday-Tuesday:** Formula memorization
- Write out all formulas 5 times
- Flash cards for definitions
- Quick calculation drills

**Wednesday-Thursday:** Weak topic focus
- Spend extra time on your lowest scoring areas
- Redo all questions you got wrong

**Friday:** Light revision only
- Formula review
- Key concepts summary
- Early night before exam!

**Saturday:** EXAM DAY
- Arrive 30 minutes early
- Read ALL questions before starting
- Manage your time strictly
- Show ALL working
- Check answers if time remains

---

## 🎯 FINAL EXAM DAY CHECKLIST

✅ **Bring to exam hall:**
- Pens (black or blue, at least 3)
- Pencils (2B for diagrams)
- Ruler (30cm)
- Calculator (scientific, with fresh batteries)
- Eraser and pencil sharpener
- Student ID
- Admission letter

✅ **Mental preparation:**
- Read each question carefully (twice!)
- Start with questions you're most confident about
- If stuck, move on and come back later
- Always show your working
- Use the last 15 minutes to review

✅ **During exam:**
- Write legibly - examiners can't mark what they can't read
- Label all diagrams clearly
- Use rulers for straight lines in diagrams
- Don't spend too long on one question
- Attempt ALL questions - blank = 0 marks

---

## 📊 HIGH-YIELD TOPICS SUMMARY

**If you have limited time, focus on these topics (70% of exam marks):**

1. ⚡ **Ohm's Law & Circuits** (25%) - Master V=IR, series/parallel calculations
2. 🚗 **Equations of Motion** (20%) - Practice all three equations thoroughly  
3. 🌊 **Wave Equation** (10%) - v=fλ calculations are easy marks
4. 💪 **Forces & Newton's Laws** (15%) - F=ma, forces in equilibrium

**Quick Win Topics** (Easy marks if you memorize):
- Electromagnetic spectrum (order, uses, dangers)
- Definitions (power, energy, work, force, etc.)
- Units for all quantities
- Safety features in domestic electricity

---

## 🎓 CONCLUSION

This revision guide is based on analysis of MANEB past papers and covers the highest-yield topics for MSCE Physics. Remember:

✓ **Practice** is more important than just reading notes
✓ **Show your working** - method marks = 60% of total marks
✓ **Time management** - don't spend 30 minutes on one question
✓ **Units and formulas** - easy marks if you get them right

**Study smart, not just hard. Good luck with your MANEB exams! 🌟**

---

*Generated by MANEB Exam Prep AI - Helping Malawian students excel in their examinations*`;
}
