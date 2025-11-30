// Load environment variables first
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI client
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✨ Gemini AI client initialized');
} else {
  console.error('❌ ERROR: GEMINI_API_KEY not found in .env file');
  console.error('   Gemini transcription will not work without it.');
  process.exit(1);
}

// Initialize Supabase client (shared instance)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Successfully loaded environment variables and connected to Supabase.');
console.log(`🔑 Using ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'} key for backend operations`);

// Initialize Vetted Supabase client (Database A) for bridge API functionality
const vettedSupabaseUrl = process.env.VETTED_SUPABASE_URL;
const vettedSupabaseKey = process.env.VETTED_SUPABASE_KEY;

let supabaseVetted = null;
if (vettedSupabaseUrl && vettedSupabaseKey) {
  supabaseVetted = createClient(vettedSupabaseUrl, vettedSupabaseKey);
  console.log('✅ Connected to Vetted Supabase (Database A)');
} else {
  console.warn('⚠️  Vetted Supabase credentials not found - Bridge API endpoints will not work');
}

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function for Vetted Supabase requests
const vettedRequest = async (endpoint, method = 'GET', body = null) => {
  if (!supabaseVetted) {
    throw new Error('Vetted Supabase client not initialized');
  }

  const options = {
    method,
    headers: {
      'apikey': vettedSupabaseKey,
      'Authorization': `Bearer ${vettedSupabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${vettedSupabaseUrl}/rest/v1/${endpoint}`, options);
  return response.json();
};

// --- REMOVED: Mock data - now using real data from Vetted database ---
const DUMMY_OPPORTUNITIES_REMOVED = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Product Role (Internal)",
    company: "Vetted AI",
    location: "Remote (Global)",
    type: "Full-time",
    rate: "N/A",
    skills: ["Product Management", "Design", "Strategy"],
    questions: [
      { question_text: "Tell us about yourself.", time_limit_seconds: 90 },
      { question_text: "Why do you want to work at Vetted AI?", time_limit_seconds: 90 },
      { question_text: "Describe a product you built from scratch.", time_limit_seconds: 120 },
      { question_text: "How do you prioritize features in a backlog?", time_limit_seconds: 90 },
      { question_text: "What's your approach to user research?", time_limit_seconds: 90 },
      { question_text: "Tell us about a challenging stakeholder situation.", time_limit_seconds: 120 },
      { question_text: "How do you measure product success?", time_limit_seconds: 90 },
      { question_text: "Describe your experience with A/B testing.", time_limit_seconds: 90 },
      { question_text: "How do you balance user needs with business goals?", time_limit_seconds: 120 },
      { question_text: "What's your product development process?", time_limit_seconds: 90 },
      { question_text: "How do you handle conflicting feedback?", time_limit_seconds: 90 },
      { question_text: "Describe a failed product and what you learned.", time_limit_seconds: 120 },
      { question_text: "How do you work with engineering teams?", time_limit_seconds: 90 },
      { question_text: "What product management tools do you use?", time_limit_seconds: 60 },
      { question_text: "Why product management at Vetted AI?", time_limit_seconds: 90 }
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    title: "Senior Backend Engineer",
    company: "CongratsAI",
    location: "Remote (Europe)",
    type: "Contract",
    rate: "$90-120/hr",
    skills: ["Node.js", "PostgreSQL", "Express", "Supabase", "TypeScript"],
    questions: [
      { question_text: "Introduce yourself and your background.", time_limit_seconds: 90 },
      { question_text: "What's your experience with Node.js at scale?", time_limit_seconds: 120 },
      { question_text: "Explain how you design RESTful APIs.", time_limit_seconds: 90 },
      { question_text: "How do you handle database optimization?", time_limit_seconds: 120 },
      { question_text: "Describe a challenging performance issue you solved.", time_limit_seconds: 120 },
      { question_text: "How do you approach microservices architecture?", time_limit_seconds: 90 },
      { question_text: "What's your experience with PostgreSQL?", time_limit_seconds: 90 },
      { question_text: "How do you handle authentication and authorization?", time_limit_seconds: 90 },
      { question_text: "Describe your testing strategy.", time_limit_seconds: 90 },
      { question_text: "How do you ensure API security?", time_limit_seconds: 120 },
      { question_text: "What's your experience with real-time systems?", time_limit_seconds: 90 },
      { question_text: "How do you handle errors and logging?", time_limit_seconds: 90 },
      { question_text: "Describe your deployment process.", time_limit_seconds: 90 },
      { question_text: "What's your experience with TypeScript?", time_limit_seconds: 60 },
      { question_text: "Why do you want to work with CongratsAI?", time_limit_seconds: 90 }
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    title: "ML Engineer (Computer Vision)",
    company: "VisionFlow AI",
    location: "Hybrid (Paris)",
    type: "Full-time",
    rate: "€80-100/hr",
    skills: ["Python", "TensorFlow", "PyTorch", "Computer Vision", "Docker"],
    questions: [
      { question_text: "Tell us about your background in machine learning.", time_limit_seconds: 90 },
      { question_text: "What computer vision projects have you worked on?", time_limit_seconds: 120 },
      { question_text: "Explain your approach to model training.", time_limit_seconds: 120 },
      { question_text: "How do you handle imbalanced datasets?", time_limit_seconds: 90 },
      { question_text: "Describe your experience with deep learning frameworks.", time_limit_seconds: 90 },
      { question_text: "How do you optimize model performance?", time_limit_seconds: 120 },
      { question_text: "What's your experience with object detection?", time_limit_seconds: 90 },
      { question_text: "How do you handle data augmentation?", time_limit_seconds: 90 },
      { question_text: "Describe your model deployment experience.", time_limit_seconds: 120 },
      { question_text: "How do you evaluate model accuracy?", time_limit_seconds: 90 },
      { question_text: "What's your experience with transfer learning?", time_limit_seconds: 90 },
      { question_text: "How do you handle overfitting?", time_limit_seconds: 90 },
      { question_text: "Describe your data preprocessing pipeline.", time_limit_seconds: 90 },
      { question_text: "What hardware do you prefer for training?", time_limit_seconds: 60 },
      { question_text: "Why VisionFlow AI?", time_limit_seconds: 90 }
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440007",
    title: "UX/UI Designer",
    company: "DesignHub Co",
    location: "Remote (Australia)",
    type: "Full-time",
    rate: "$65-90/hr",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems", "Interaction Design"],
    questions: [
      { question_text: "Tell us about your design background.", time_limit_seconds: 90 },
      { question_text: "What's your design process from concept to delivery?", time_limit_seconds: 120 },
      { question_text: "How do you conduct user research?", time_limit_seconds: 90 },
      { question_text: "Describe your experience with Figma.", time_limit_seconds: 90 },
      { question_text: "How do you handle design feedback?", time_limit_seconds: 120 },
      { question_text: "What's your approach to creating design systems?", time_limit_seconds: 90 },
      { question_text: "How do you ensure accessibility in your designs?", time_limit_seconds: 90 },
      { question_text: "Describe a challenging design problem you solved.", time_limit_seconds: 120 },
      { question_text: "How do you balance aesthetics with usability?", time_limit_seconds: 90 },
      { question_text: "What's your experience with prototyping?", time_limit_seconds: 90 },
      { question_text: "How do you work with developers?", time_limit_seconds: 90 },
      { question_text: "Describe your mobile design experience.", time_limit_seconds: 90 },
      { question_text: "How do you measure design success?", time_limit_seconds: 90 },
      { question_text: "What design tools do you use daily?", time_limit_seconds: 60 },
      { question_text: "Why DesignHub Co?", time_limit_seconds: 90 }
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440008",
    title: "Blockchain Developer",
    company: "CryptoTech Labs",
    location: "Remote (Singapore)",
    type: "Contract",
    rate: "$100-140/hr",
    skills: ["Solidity", "Web3.js", "Smart Contracts", "Ethereum", "DeFi"],
    questions: [
      { question_text: "Introduce yourself and your blockchain experience.", time_limit_seconds: 90 },
      { question_text: "What's your experience with smart contract development?", time_limit_seconds: 120 },
      { question_text: "How do you ensure smart contract security?", time_limit_seconds: 90 },
      { question_text: "Describe your experience with Solidity.", time_limit_seconds: 90 },
      { question_text: "How do you approach gas optimization?", time_limit_seconds: 120 },
      { question_text: "What's your experience with DeFi protocols?", time_limit_seconds: 90 },
      { question_text: "How do you handle blockchain scalability?", time_limit_seconds: 90 },
      { question_text: "Describe your testing strategy for smart contracts.", time_limit_seconds: 120 },
      { question_text: "What's your experience with Web3.js or ethers.js?", time_limit_seconds: 90 },
      { question_text: "How do you handle contract upgrades?", time_limit_seconds: 90 },
      { question_text: "Describe a complex blockchain project you built.", time_limit_seconds: 120 },
      { question_text: "How do you approach tokenomics design?", time_limit_seconds: 90 },
      { question_text: "What's your experience with different blockchains?", time_limit_seconds: 90 },
      { question_text: "How do you stay updated with blockchain technology?", time_limit_seconds: 60 },
      { question_text: "Why CryptoTech Labs?", time_limit_seconds: 90 }
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440009",
    title: "Mobile Developer (iOS/Android)",
    company: "AppWorks Studio",
    location: "Hybrid (Berlin)",
    type: "Full-time",
    rate: "€75-100/hr",
    skills: ["Swift", "Kotlin", "React Native", "Mobile UI", "App Store Optimization"],
    questions: [
      { question_text: "Tell us about your mobile development journey.", time_limit_seconds: 90 },
      { question_text: "What's your experience with iOS development?", time_limit_seconds: 120 },
      { question_text: "How do you approach Android development?", time_limit_seconds: 90 },
      { question_text: "Describe your experience with React Native.", time_limit_seconds: 90 },
      { question_text: "How do you optimize app performance?", time_limit_seconds: 120 },
      { question_text: "What's your approach to mobile UI design?", time_limit_seconds: 90 },
      { question_text: "How do you handle offline functionality?", time_limit_seconds: 90 },
      { question_text: "Describe your app testing strategy.", time_limit_seconds: 120 },
      { question_text: "How do you manage app state?", time_limit_seconds: 90 },
      { question_text: "What's your experience with push notifications?", time_limit_seconds: 90 },
      { question_text: "How do you approach app security?", time_limit_seconds: 90 },
      { question_text: "Describe your experience with app deployment.", time_limit_seconds: 120 },
      { question_text: "How do you handle different screen sizes?", time_limit_seconds: 90 },
      { question_text: "What mobile development tools do you prefer?", time_limit_seconds: 60 },
      { question_text: "Why AppWorks Studio?", time_limit_seconds: 90 }
    ]
  }
];

// --- Endpoint 1: Job List ---
app.get('/api/opportunities', async (req, res) => {
  try {
    console.log('🔄 Fetching real opportunities from Vetted database...');

    // Fetch jobs from Vetted database directly
    const vettedJobs = await vettedRequest('projects?select=*&status=neq.draft&limit=50', 'GET');
    console.log(`✅ Received ${vettedJobs.length} jobs from Vetted database`);

    // Transform Vetted projects into Congrats opportunity format
    const opportunities = vettedJobs.map(project => ({
      id: project.id,
      title: project.role_title || 'Untitled Position',
      company: project.company_name || 'Company',
      location: 'Remote', // Default, can add to Vetted schema if needed
      type: project.tier_name || 'Full-time',
      rate: project.job_summary || 'Competitive',
      skills: [], // Can extract from job_description if needed
      questions: [] // Will be loaded when starting audition
    }));

    res.json(opportunities);
  } catch (error) {
    console.error('❌ Error fetching from Vetted:', error.message);
    // Fallback to empty array instead of mock data
    res.json([]);
  }
});

// --- Demo Interview Endpoint: Return 3 Simple Test Questions ---
app.get('/api/audition/demo', async (req, res) => {
  try {
    console.log('🎬 Returning demo interview questions');

    const demoQuestions = [
      {
        id: 'D1',
        question_text: 'Tell us about yourself.',
        time_limit_seconds: 90
      },
      {
        id: 'D2',
        question_text: 'Why are you interested in this opportunity?',
        time_limit_seconds: 90
      },
      {
        id: 'D3',
        question_text: 'What are your greatest strengths?',
        time_limit_seconds: 90
      }
    ];

    res.json({
      success: true,
      questions: demoQuestions
    });
  } catch (error) {
    console.error('❌ Error in /api/audition/demo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo questions'
    });
  }
});

// --- Endpoint 2: Start Audition (Fetch Questions & Create Submission) ---
app.post('/api/audition/start', async (req, res) => {
  try {
    console.log('🚀 Starting new audition session');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

    const { opportunityId, userId, questions: vettedQuestions } = req.body;

    console.log('👤 USER ID RECEIVED:', userId);
    console.log('🎯 OPPORTUNITY ID:', opportunityId);

    // Validate required fields
    if (!opportunityId || !userId) {
      console.error('❌ MISSING FIELDS - opportunityId:', !!opportunityId, 'userId:', !!userId);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: opportunityId and userId'
      });
    }

    console.log(`👤 User: ${userId}, 🎯 Opportunity: ${opportunityId}`);

    // 0. Check if submission already exists for this user-opportunity combination
    console.log('🔍 Checking for existing submission...');
    const { data: existingSubmission, error: checkError } = await supabase
      .from('audition_submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('opportunity_id', opportunityId)
      .single();

    if (existingSubmission) {
      console.log('⚠️  Submission already exists:', existingSubmission.id);
      return res.status(409).json({
        success: false,
        message: 'You have already started or completed an audition for this opportunity',
        existingSubmissionId: existingSubmission.id,
        status: existingSubmission.status
      });
    }

    // 1. Use questions from Vetted (passed from frontend) or fallback to local DB
    let questions = vettedQuestions;

    if (!questions || questions.length === 0) {
      console.log('📝 No questions from Vetted, checking local database...');
      const { data: localQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .limit(12);

      if (questionsError) {
        console.error('❌ Error fetching questions:', questionsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch questions from database',
          error: questionsError.message
        });
      }

      questions = localQuestions || [];
    } else {
      console.log(`✅ Using ${questions.length} questions from Vetted AI`);
    }

    // If still no questions, use generic fallback questions
    if (!questions || questions.length === 0) {
      console.log('⚠️  No questions found, generating fallback questions...');
      questions = [
        {
          id: 1,
          question_text: "Tell us about yourself and why you're interested in this role.",
          duration: 90,
          thinking_time: 30,
          question_type: "introduction"
        },
        {
          id: 2,
          question_text: "Describe a challenging technical problem you've solved recently. What was your approach?",
          duration: 120,
          thinking_time: 30,
          question_type: "technical"
        },
        {
          id: 3,
          question_text: "How do you prioritize tasks when working on multiple features with tight deadlines?",
          duration: 90,
          thinking_time: 30,
          question_type: "behavioral"
        },
        {
          id: 4,
          question_text: "Tell us about a time when you had to collaborate with team members on a complex project.",
          duration: 90,
          thinking_time: 30,
          question_type: "behavioral"
        },
        {
          id: 5,
          question_text: "What's your experience with the technologies mentioned in this job posting?",
          duration: 120,
          thinking_time: 30,
          question_type: "technical"
        },
        {
          id: 6,
          question_text: "How do you approach learning new technologies or frameworks?",
          duration: 90,
          thinking_time: 30,
          question_type: "behavioral"
        },
        {
          id: 7,
          question_text: "Describe your ideal work environment and team culture.",
          duration: 90,
          thinking_time: 30,
          question_type: "cultural_fit"
        },
        {
          id: 8,
          question_text: "What are your career goals for the next 2-3 years?",
          duration: 90,
          thinking_time: 30,
          question_type: "career_goals"
        },
        {
          id: 9,
          question_text: "Tell us about a project you're particularly proud of. What was your role?",
          duration: 120,
          thinking_time: 30,
          question_type: "experience"
        },
        {
          id: 10,
          question_text: "Is there anything else you'd like us to know about you or your qualifications?",
          duration: 90,
          thinking_time: 30,
          question_type: "closing"
        }
      ];
      console.log(`✅ Generated ${questions.length} fallback questions`);
    }

    console.log(`✅ Retrieved ${questions.length} questions`);

    // 2. Create Submission Record: Insert new submission with 'started' status
    console.log('💾 Creating new submission record...');
    const { data: submission, error: submissionError } = await supabase
      .from('audition_submissions')
      .insert({
        user_id: userId,
        opportunity_id: opportunityId,
        status: 'started',
        questions: questions.map(q => q.prompt || q.question_text || q.text || ''), // Store question texts for reference
        audio_urls: [] // Empty array, will be populated as user submits answers
      })
      .select()
      .single();

    if (submissionError) {
      console.error('❌ Error creating submission:', submissionError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create submission record',
        error: submissionError.message
      });
    }

    console.log(`✅ Submission created with ID: ${submission.id}`);

    // 3. Respond: Send back submission ID and questions
    res.status(200).json({
      success: true,
      message: 'Audition session started successfully',
      submissionId: submission.id,
      questions: questions
    });

  } catch (error) {
    console.error('❌ Error in /api/audition/start:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// --- Endpoint 3: Per-Question Answer Submission ---
app.post('/api/audition/submit-answer', upload.single('audio_file'), async (req, res) => {
  try {
    console.log('📥 Received per-question submission');

    // A. Get Data from request body
    const { opportunityId, userId, questionId, questionText } = req.body;

    console.log(`  └─ User: ${userId}`);
    console.log(`  └─ Opportunity: ${opportunityId}`);
    console.log(`  └─ Question: ${questionId}`);
    console.log(`  └─ Question Text: ${questionText}`);

    // Check if this is a demo submission
    const isDemoMode = opportunityId === 'demo' || userId === 'demo-user';

    if (isDemoMode) {
      console.log('🎬 Demo mode detected - skipping database operations');

      // For demo, just return success without saving anything
      return res.status(200).json({
        success: true,
        message: 'Demo answer received (not saved)',
        data: {
          answerId: 'demo-answer-' + Date.now(),
          audioUrl: 'demo-url',
          transcript: '[Demo mode - transcription skipped]',
          questionId: questionId
        }
      });
    }

    // Validate required fields
    if (!opportunityId || !userId || !questionId || !questionText) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: opportunityId, userId, questionId, or questionText'
      });
    }

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    const file = req.file;
    console.log(`📦 File received: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);

    // B. Upload File to Supabase Storage
    const timestamp = Date.now();
    const filePath = `answers/${userId}/${opportunityId}/${questionId}_${timestamp}.webm`;

    console.log(`⬆️  Uploading to Supabase Storage: ${filePath}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audition-recordings')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    console.log(`✅ File uploaded successfully`);

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('audition-recordings')
      .getPublicUrl(filePath);

    const audio_url = publicUrl; // Store for clarity

    // --- 2. TRANSCRIBE AUDIO (New Gemini Buffer Method) ---
    console.log("🎤 Starting transcription with Gemini (Buffer method)...");
    let transcript = null;

    try {
      // Use Gemini 2.0 Flash (latest stable model that supports audio)
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash"
      });

      // Convert the file buffer to the Base64 format Gemini needs
      const base64Audio = req.file.buffer.toString("base64");
      const audioPart = {
        inlineData: {
          data: base64Audio,
          mimeType: req.file.mimetype // e.g., 'audio/webm'
        }
      };

      const prompt = "Transcribe this audio file. Return only the spoken text, nothing else.";
      const result = await model.generateContent([prompt, audioPart]);
      const response = await result.response;
      transcript = response.text();
      console.log("✅ Transcription successful:", transcript.substring(0, 100) + "...");

    } catch (transcriptionError) {
      console.error("--- ❌ GEMINI TRANSCRIPTION FAILED ---");
      console.error("Error details:", transcriptionError);

      // Log more specific error info
      if (transcriptionError.status === 404) {
        console.error("💡 404 Error - Model not found or not supported");
        console.error("   Current model: gemini-2.0-flash");
        console.error("   This model should support audio transcription");
      } else if (transcriptionError.status === 403) {
        console.error("💡 403 Error - API key may be invalid or region-blocked");
      } else if (transcriptionError.status === 400) {
        console.error("💡 400 Error - Audio format may not be supported");
        console.error("   MIME type:", req.file.mimetype);
      }

      console.error(JSON.stringify(transcriptionError, null, 2));
      console.error("--- END OF ERROR ---");
      transcript = "[Transcription failed. See backend logs for details.]";
    }
    // --- End Transcription ---

    // D. Save to Database (audition_answers table)
    console.log('💾 Saving answer to database...');

    const { data: answerData, error: dbError } = await supabase
      .from('audition_answers')
      .insert({
        user_id: userId,
        opportunity_id: opportunityId,
        question_id: questionId,
        question_text: questionText,
        audio_url: audio_url,
        audio_path: filePath,
        transcript: transcript,
        submitted_at: new Date().toISOString()
      })
      .select();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error(`Failed to save answer: ${dbError.message}`);
    }

    console.log(`✅ Answer saved to database (ID: ${answerData[0].id})`);

    // E. Respond with success
    res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        answerId: answerData[0].id,
        audioUrl: publicUrl,
        transcript: transcript,
        questionId: questionId
      }
    });

  } catch (error) {
    console.error('❌ Error in submit-answer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process answer submission'
    });
  }
});

// --- Endpoint 3: Create Submission Record ---
app.post('/api/audition/create-submission', async (req, res) => {
  try {
    console.log('📝 Creating audition submission record');

    // Get data from request body
    const { userId, opportunityId, questions, totalDuration } = req.body;

    console.log(`  └─ User ID: ${userId}`);
    console.log(`  └─ Opportunity ID: ${opportunityId}`);
    console.log(`  └─ Questions: ${questions?.length || 0}`);
    console.log(`  └─ Total Duration: ${totalDuration || 0}s`);

    // Validate required fields
    if (!userId || !opportunityId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId and opportunityId are required'
      });
    }

    console.log('💾 Checking for existing submission...');

    // Check if submission already exists
    const { data: existingSubmission, error: checkError } = await supabase
      .from('audition_submissions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('opportunity_id', opportunityId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected if no submission exists
      console.error('❌ Check error:', checkError);
      throw new Error(`Failed to check existing submission: ${checkError.message}`);
    }

    // If submission exists, update it with questions data if provided
    if (existingSubmission) {
      console.log(`♻️  Existing submission found (ID: ${existingSubmission.id})`);

      // Update with questions and duration if provided
      if (questions && questions.length > 0) {
        console.log('📝 Updating existing submission with questions data...');
        const { error: updateError } = await supabase
          .from('audition_submissions')
          .update({
            questions: questions,
            duration_seconds: totalDuration || 0
          })
          .eq('id', existingSubmission.id);

        if (updateError) {
          console.error('❌ Update error:', updateError);
        } else {
          console.log(`✅ Updated with ${questions.length} questions (${totalDuration}s)`);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Submission already exists',
        data: {
          submissionId: existingSubmission.id,
          isExisting: true,
          status: existingSubmission.status
        }
      });
    }

    console.log('💾 Creating new submission record...');

    // Create submission record with questions and duration
    const { data: submissionData, error: insertError } = await supabase
      .from('audition_submissions')
      .insert({
        user_id: userId,
        opportunity_id: opportunityId,
        questions: questions || [], // Store the questions array
        audio_urls: [], // Will be populated from audition_answers
        status: 'pending_review',
        duration_seconds: totalDuration || 0 // Store total duration
      })
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      throw new Error(`Failed to create submission: ${insertError.message}`);
    }

    if (!submissionData || submissionData.length === 0) {
      throw new Error('Failed to create submission record');
    }

    console.log(`✅ Submission created successfully (ID: ${submissionData[0].id})`);
    console.log(`  └─ Questions saved: ${questions?.length || 0}`);
    console.log(`  └─ Duration: ${totalDuration || 0}s`);

    // Link to job application in congrats database if it exists
    // Note: This assumes the backend has access to congrats database via SUPABASE_B_URL
    try {
      const congratsSupabaseUrl = process.env.SUPABASE_B_URL || process.env.SUPABASE_URL;
      const congratsSupabaseKey = process.env.SUPABASE_B_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      if (congratsSupabaseUrl && congratsSupabaseKey && congratsSupabaseUrl !== supabaseUrl) {
        // Use separate congrats database client
        const congratsSupabase = createClient(congratsSupabaseUrl, congratsSupabaseKey);

        const { data: jobApplication } = await congratsSupabase
          .from('job_applications')
          .select('id')
          .eq('job_id', opportunityId)
          .eq('user_id', userId)
          .is('audition_submission_id', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (jobApplication) {
          const { error: linkError } = await congratsSupabase
            .from('job_applications')
            .update({ audition_submission_id: submissionData[0].id })
            .eq('id', jobApplication.id);

          if (linkError) {
            console.warn('⚠️  Failed to link application to audition:', linkError);
          } else {
            console.log(`✅ Linked application ${jobApplication.id} to audition ${submissionData[0].id}`);
          }
        }
      } else {
        // Try with same database (if auditions and jobs are in same DB)
        const { data: jobApplication } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_id', opportunityId)
          .eq('user_id', userId)
          .is('audition_submission_id', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (jobApplication) {
          const { error: linkError } = await supabase
            .from('job_applications')
            .update({ audition_submission_id: submissionData[0].id })
            .eq('id', jobApplication.id);

          if (linkError) {
            console.warn('⚠️  Failed to link application to audition:', linkError);
          } else {
            console.log(`✅ Linked application ${jobApplication.id} to audition ${submissionData[0].id}`);
          }
        }
      }
    } catch (linkErr) {
      console.warn('⚠️  Error linking application to audition:', linkErr);
      // Non-critical, continue
    }

    // Respond with submission ID
    res.status(200).json({
      success: true,
      message: 'Submission created successfully',
      data: {
        submissionId: submissionData[0].id,
        isExisting: false,
        status: 'pending_review'
      }
    });

  } catch (error) {
    console.error('❌ Error in create-submission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create submission'
    });
  }
});

// --- Endpoint 4: Submit Survey Feedback ---
app.post('/api/audition/submit-survey', async (req, res) => {
  try {
    console.log('📊 Received survey submission');

    // Get data from request body
    const { submissionId, rating, reason, feedbackText } = req.body;

    console.log(`  └─ Submission ID: ${submissionId}`);
    console.log(`  └─ Rating: ${rating}/5`);
    console.log(`  └─ Reason: ${reason}`);

    // Validate required fields
    if (!submissionId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: submissionId and rating are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Prepare update data
    const updateData = {
      rating: rating,
      feedback_reason: reason || null,
      feedback_text: feedbackText || null,
    };

    // CRITICAL: If reason is "technical", flag for technical review
    if (reason === "technical") {
      updateData.status = 'pending_technical_review';
      console.log('  └─ 🔧 Flagging for technical review');
    }

    console.log('💾 Updating submission with survey data...');

    // Update the submission in database
    const { data: submissionData, error: updateError } = await supabase
      .from('audition_submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw new Error(`Failed to save survey: ${updateError.message}`);
    }

    if (!submissionData || submissionData.length === 0) {
      throw new Error('Submission not found');
    }

    console.log(`✅ Survey saved successfully for submission ${submissionId}`);

    // Respond with success
    res.status(200).json({
      success: true,
      message: 'Survey submitted successfully',
      data: {
        submissionId: submissionId,
        rating: rating,
        flaggedForTechnicalReview: reason === "technical"
      }
    });

  } catch (error) {
    console.error('❌ Error in submit-survey:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process survey submission'
    });
  }
});

// --- Endpoint 5: Get Submission Details with Answers ---
app.get('/api/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    console.log(`📥 Fetching submission details for ID: ${submissionId}`);

    // Fetch the main submission record
    const { data: submission, error: submissionError } = await supabase
      .from('audition_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      console.error('❌ Error fetching submission:', submissionError);

      // Handle "not found" error specifically
      if (submissionError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      throw new Error(`Failed to fetch submission: ${submissionError.message}`);
    }

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    console.log(`✅ Submission found`);
    console.log(`  └─ Opportunity ID: ${submission.opportunity_id}`);
    console.log(`  └─ Status: ${submission.status}`);

    // Fetch all answers for this submission (by matching user_id and opportunity_id)
    const { data: answers, error: answersError } = await supabase
      .from('audition_answers')
      .select('id, question_id, question_text, audio_url, transcript, submitted_at')
      .eq('user_id', submission.user_id)
      .eq('opportunity_id', submission.opportunity_id)
      .order('submitted_at', { ascending: true });

    if (answersError) {
      console.error('❌ Error fetching answers:', answersError);
      throw new Error(`Failed to fetch answers: ${answersError.message}`);
    }

    console.log(`✅ Found ${answers?.length || 0} answers`);

    // Fetch opportunity details from Vetted database
    let opportunity = null;
    try {
      const vettedJob = await vettedRequest(`projects?id=eq.${submission.opportunity_id}&select=*`, 'GET');
      if (vettedJob && vettedJob.length > 0) {
        opportunity = {
          title: vettedJob[0].role_title || 'Unknown Position',
          company: vettedJob[0].company_name || 'Unknown Company',
          location: 'Remote',
          type: vettedJob[0].tier_name || 'Full-time',
          rate: vettedJob[0].job_summary || 'N/A'
        };
      }
    } catch (err) {
      console.error('Error fetching opportunity:', err.message);
    }

    // Combine data into one response object
    const responseData = {
      id: submission.id,
      userId: submission.user_id,
      opportunityId: submission.opportunity_id,

      // Opportunity details (from Vetted)
      title: opportunity?.title || 'Unknown Position',
      company: opportunity?.company || 'Unknown Company',
      location: opportunity?.location || 'Unknown Location',
      type: opportunity?.type || 'Full-time',
      rate: opportunity?.rate || 'N/A',

      // Submission details
      status: submission.status,
      submittedAt: submission.submitted_at,
      durationSeconds: submission.duration_seconds,

      // Survey feedback (if provided)
      rating: submission.rating,
      feedbackReason: submission.feedback_reason,
      feedbackText: submission.feedback_text,

      // Questions metadata (stored in submission)
      questions: submission.questions || [],

      // All answers with audio
      answers: answers.map(answer => ({
        id: answer.id,
        questionId: answer.question_id,
        questionText: answer.question_text,
        audioUrl: answer.audio_url,
        transcript: answer.transcript,
        submittedAt: answer.submitted_at
      }))
    };

    console.log(`✅ Sending complete submission data with ${responseData.answers.length} answers`);

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in /api/submissions/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submission details'
    });
  }
});

// --- Endpoint 6: Get All Submissions for a User ---
app.get('/api/submissions', async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId query parameter is required'
      });
    }

    console.log(`📥 Fetching all submissions for user: ${userId}`);

    // Fetch all submissions for the user
    const { data: submissions, error: submissionsError } = await supabase
      .from('audition_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError);
      throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);
    }

    console.log(`✅ Found ${submissions?.length || 0} submissions`);

    // Enrich each submission with opportunity details from Bridge API
    const enrichedSubmissions = await Promise.all(submissions.map(async (submission) => {
      let opportunityDetails = {
        title: 'Unknown Position',
        company: 'Unknown Company',
        location: 'Unknown Location',
        type: 'Full-time',
        rate: 'N/A'
      };

      try {
        const vettedJob = await vettedRequest(`projects?id=eq.${submission.opportunity_id}&select=*`, 'GET');
        if (vettedJob && vettedJob.length > 0) {
          opportunityDetails = {
            title: vettedJob[0].role_title || 'Unknown Position',
            company: vettedJob[0].company_name || 'Unknown Company',
            location: 'Remote',
            type: vettedJob[0].tier_name || 'Full-time',
            rate: vettedJob[0].job_summary || 'N/A'
          };
        }
      } catch (err) {
        console.error(`Error fetching opportunity ${submission.opportunity_id}:`, err.message);
      }

      return {
        id: submission.id,
        title: opportunityDetails.title,
        company: opportunityDetails.company,
        location: opportunityDetails.location,
        type: opportunityDetails.type,
        rate: opportunityDetails.rate,
        status: submission.status,
        submittedAt: submission.submitted_at,
        opportunityId: submission.opportunity_id,
        durationSeconds: submission.duration_seconds,
        rating: submission.rating
      };
    }));

    res.status(200).json({
      success: true,
      data: enrichedSubmissions
    });

  } catch (error) {
    console.error('❌ Error in /api/submissions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submissions'
    });
  }
});

// ============ BRIDGE API ENDPOINTS (Vetted Database Integration) ============

// Get all jobs from Vetted database
// Get all jobs from Vetted database
app.get('/api/vetted/jobs', async (req, res) => {
  try {
    if (!supabaseVetted) {
      throw new Error('Vetted Supabase client not initialized');
    }

    console.log('🔄 Fetching jobs from Vetted (Paid Recruiters Only)...');

    // Use Supabase client directly to support !inner join for filtering
    const { data, error } = await supabaseVetted
      .from('projects')
      .select(`
        *,
        recruiters!inner (
          is_paid_account
        )
      `)
      .not('status', 'in', '("draft","pending_activation","awaiting_setup_call")')
      .eq('recruiters.is_paid_account', true)
      .limit(50);

    if (error) {
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} jobs from paid recruiters`);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error fetching Vetted jobs:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all role definitions from Vetted
app.get('/api/vetted/role-definitions', async (req, res) => {
  try {
    const data = await vettedRequest('role_definitions?select=*&limit=50', 'GET');
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching role definitions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get specific job with details and questions from Vetted
app.get('/api/vetted/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get project details
    const projectData = await vettedRequest(`projects?id=eq.${id}&select=*`, 'GET');

    if (!projectData || projectData.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const project = projectData[0];

    // Get role definition for this project
    const roleDefData = await vettedRequest(`role_definitions?project_id=eq.${id}&select=*`, 'GET');

    // Get audition scaffold (contains AI-generated questions)
    let questions = [];
    if (roleDefData && roleDefData.length > 0) {
      const roleDefId = roleDefData[0].id;
      const scaffoldData = await vettedRequest(
        `audition_scaffolds?role_definition_id=eq.${roleDefId}&select=*&order=created_at.desc&limit=1`,
        'GET'
      );

      if (scaffoldData && scaffoldData.length > 0) {
        questions = scaffoldData[0].scaffold_data?.questions || [];
      }
    }

    // Combine everything
    const response = {
      ...project,
      role_definition: roleDefData[0] || null,
      questions: questions
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching job details:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get completed audition submissions for a specific Vetted project (shortlist)
app.get('/api/shortlist/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get all submissions for this opportunity
    const { data: submissions, error: submissionsError } = await supabase
      .from('audition_submissions')
      .select('*')
      .eq('opportunity_id', projectId)
      .order('submitted_at', { ascending: false });

    if (submissionsError) throw submissionsError;

    if (!submissions || submissions.length === 0) {
      return res.json({
        project_id: projectId,
        total_submissions: 0,
        candidates: []
      });
    }

    // Get user details for each submission
    const userIds = [...new Set(submissions.map(s => s.user_id))];

    // Fetch auth emails using admin API
    const authUsersMap = {};
    for (const userId of userIds) {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(userId);
        if (!error && data?.user) {
          authUsersMap[userId] = {
            email: data.user.email,
            created_at: data.user.created_at
          };
        }
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
      }
    }

    // Get app_user and profile data
    const { data: users } = await supabase
      .from('app_user')
      .select('*')
      .in('id', userIds);

    const { data: profiles } = await supabase
      .from('talent_profiles')
      .select('*')
      .in('user_id', userIds);

    const { data: skills } = await supabase
      .from('talent_skills')
      .select('*')
      .in('user_id', userIds);

    // Get proctoring snapshots count
    const submissionIds = submissions.map(s => s.id);
    const { data: proctoringCounts } = await supabase
      .from('proctoring_snapshots')
      .select('submission_id')
      .in('submission_id', submissionIds);

    // Build candidate profiles
    const candidates = submissions.map(submission => {
      const authUser = authUsersMap[submission.user_id];
      const user = users?.find(u => u.id === submission.user_id);
      const profile = profiles?.find(p => p.user_id === submission.user_id);
      const userSkills = skills?.filter(s => s.user_id === submission.user_id) || [];
      const snapshotCount = proctoringCounts?.filter(p => p.submission_id === submission.id).length || 0;

      const questions = submission.questions || [];
      const audioUrls = submission.audio_urls || [];

      return {
        candidate_id: submission.user_id,
        email: authUser?.email || user?.email || null,
        full_name: profile?.full_name || null,
        submission_id: submission.id,
        submitted_at: submission.submitted_at,
        status: submission.status,
        duration_seconds: submission.duration_seconds,
        questions: questions,
        responses: audioUrls.map((audio, index) => ({
          question_number: index + 1,
          question_text: questions[index] || 'N/A',
          audio_url: audio.audio_url || audio.url,
          file_path: audio.file_path,
          transcription: audio.transcription || null,
          duration: audio.duration || null
        })),
        skills: userSkills.map(s => s.skill_name),
        location: profile?.location || null,
        years_experience: profile?.years_experience || null,
        resume_url: profile?.resume_url || null,
        linkedin_url: profile?.linkedin_url || null,
        portfolio_url: profile?.portfolio_url || null,
        proctoring_snapshots_count: snapshotCount,
        ip_address: submission.ip_address,
        user_agent: submission.user_agent,
        reviewed_at: submission.reviewed_at,
        reviewer_id: submission.reviewer_id
      };
    });

    res.json({
      project_id: projectId,
      total_submissions: candidates.length,
      last_updated: new Date().toISOString(),
      candidates: candidates
    });

  } catch (error) {
    console.error('❌ Error fetching shortlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed audition data for a specific candidate
app.get('/api/shortlist/:projectId/candidate/:candidateId', async (req, res) => {
  try {
    const { projectId, candidateId } = req.params;

    const { data: submissions, error } = await supabase
      .from('audition_submissions')
      .select('*')
      .eq('opportunity_id', projectId)
      .eq('user_id', candidateId)
      .single();

    if (error || !submissions) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Get user details
    const { data: authData } = await supabase.auth.admin.getUserById(candidateId);
    const { data: user } = await supabase
      .from('app_user')
      .select('*')
      .eq('id', candidateId)
      .single();

    const { data: profile } = await supabase
      .from('talent_profiles')
      .select('*')
      .eq('user_id', candidateId)
      .single();

    const { data: skills } = await supabase
      .from('talent_skills')
      .select('*')
      .eq('user_id', candidateId);

    const { data: experiences } = await supabase
      .from('talent_experiences')
      .select('*')
      .eq('user_id', candidateId)
      .order('start_date', { ascending: false });

    const { data: snapshots } = await supabase
      .from('proctoring_snapshots')
      .select('*')
      .eq('submission_id', submissions.id)
      .order('captured_at', { ascending: true });

    res.json({
      candidate_id: candidateId,
      email: authData?.user?.email || user?.email,
      full_name: profile?.full_name,
      submission_id: submissions.id,
      submitted_at: submissions.submitted_at,
      status: submissions.status,
      duration_seconds: submissions.duration_seconds,
      responses: (submissions.audio_urls || []).map((audio, index) => ({
        question_number: index + 1,
        question_text: (submissions.questions || [])[index],
        audio_url: audio.audio_url || audio.url,
        file_path: audio.file_path,
        transcription: audio.transcription,
        duration: audio.duration
      })),
      profile: {
        full_name: profile?.full_name,
        location: profile?.location,
        years_experience: profile?.years_experience,
        bio: profile?.bio,
        resume_url: profile?.resume_url,
        linkedin_url: profile?.linkedin_url,
        portfolio_url: profile?.portfolio_url,
        phone: profile?.phone
      },
      skills: skills?.map(s => s.skill_name) || [],
      experiences: experiences?.map(exp => ({
        company: exp.company,
        title: exp.title,
        start_date: exp.start_date,
        end_date: exp.end_date,
        is_current: exp.is_current,
        description: exp.description
      })) || [],
      proctoring: {
        total_snapshots: snapshots?.length || 0,
        snapshots: snapshots?.map(snap => ({
          snapshot_url: snap.snapshot_url,
          captured_at: snap.captured_at,
          metadata: snap.metadata
        })) || []
      },
      ip_address: submissions.ip_address,
      user_agent: submissions.user_agent,
      reviewed_at: submissions.reviewed_at,
      reviewer_id: submissions.reviewer_id
    });

  } catch (error) {
    console.error('❌ Error fetching candidate details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update review status for a candidate's submission
app.put('/api/shortlist/:projectId/candidate/:candidateId/review', async (req, res) => {
  try {
    const { projectId, candidateId } = req.params;
    const { status, reviewer_notes, reviewer_id } = req.body;

    if (!status || !['approved', 'rejected', 'shortlisted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: approved, rejected, or shortlisted' });
    }

    const { data, error } = await supabase
      .from('audition_submissions')
      .update({
        status: status,
        reviewed_at: new Date().toISOString(),
        reviewer_id: reviewer_id || null
      })
      .eq('opportunity_id', projectId)
      .eq('user_id', candidateId)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `Candidate ${status}`,
      data: data
    });

  } catch (error) {
    console.error('❌ Error updating review status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get statistics for a project's shortlist
app.get('/api/shortlist/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data: submissions, error } = await supabase
      .from('audition_submissions')
      .select('*')
      .eq('opportunity_id', projectId);

    if (error) throw error;

    if (!submissions || submissions.length === 0) {
      return res.json({
        project_id: projectId,
        total_submissions: 0,
        completed_submissions: 0,
        in_progress: 0,
        status_breakdown: {},
        average_duration_seconds: 0,
        average_duration_minutes: 0,
        completion_rate: '0%',
        last_submission: null
      });
    }

    const statusBreakdown = submissions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {});

    const completedSubmissions = submissions.filter(s => s.status !== 'in_progress');
    const averageDuration = completedSubmissions.length > 0
      ? completedSubmissions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / completedSubmissions.length
      : 0;

    res.json({
      project_id: projectId,
      total_submissions: submissions.length,
      completed_submissions: completedSubmissions.length,
      in_progress: submissions.filter(s => s.status === 'in_progress').length,
      status_breakdown: statusBreakdown,
      average_duration_seconds: Math.round(averageDuration) || 0,
      average_duration_minutes: Math.round(averageDuration / 60) || 0,
      completion_rate: ((completedSubmissions.length / submissions.length) * 100).toFixed(2) + '%',
      last_submission: submissions[0]?.submitted_at || null
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ RESUME UPLOAD ENDPOINT ============

app.post('/api/profile/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    console.log('📤 Resume upload request received');
    const { name, email, userId, opportunityId, consent } = req.body;
    const file = req.file;

    if (!name || !email || !userId || !file) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log('👤 User:', name, '📄 File:', file.originalname);

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('talent-files')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from('talent-files').getPublicUrl(filePath);

    const profileData = {
      user_id: userId,
      full_name: name,
      email: email,
      resume_url: publicUrl,
      resume_file_path: filePath,
      consent_to_store: consent === 'true' || consent === true,
      updated_at: new Date().toISOString()
    };

    const { data: existingProfile } = await supabase
      .from('talent_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      await supabase.from('talent_profiles').update(profileData).eq('user_id', userId);
    } else {
      await supabase.from('talent_profiles').insert({ ...profileData, created_at: new Date().toISOString() });
    }

    if (opportunityId) {
      await supabase.from('job_applications').upsert({
        user_id: userId,
        job_id: opportunityId,
        status: 'pending',
        applied_at: new Date().toISOString()
      }, { onConflict: 'user_id,job_id' });
    }

    console.log('✅ Resume uploaded successfully');
    res.status(200).json({ success: true, message: 'Resume uploaded successfully', data: { resumeUrl: publicUrl, filePath } });

  } catch (error) {
    console.error('❌ Error in resume upload:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload resume' });
  }
});

app.get('/api/profile/check-resume/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: profile, error } = await supabase
      .from('talent_profiles')
      .select('resume_url, full_name, email')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ hasResume: !!profile?.resume_url, profile: profile || null });
  } catch (error) {
    console.error('❌ Error checking resume:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   GET  /api/opportunities`);
  console.log(`   GET  /api/audition/demo`);
  console.log(`   POST /api/audition/submit-answer`);
  console.log(`   POST /api/audition/create-submission`);
  console.log(`   POST /api/audition/submit-survey`);
  console.log(`   GET  /api/submissions/:id`);
  console.log(`   GET  /api/submissions?userId=<id>`);
  console.log(``);
  console.log(`👤 Profile & Resume:`);
  console.log(`   POST /api/profile/upload-resume - Upload resume`);
  console.log(`   GET  /api/profile/check-resume/:userId - Check resume status`);
  console.log(``);
  console.log(`🌉 Bridge API Endpoints (Vetted Integration):`);
  console.log(`   GET  /api/vetted/jobs - Get all jobs from Vetted`);
  console.log(`   GET  /api/vetted/jobs/:id - Get job details with questions`);
  console.log(`   GET  /api/vetted/role-definitions - Get all role definitions`);
  console.log(`   GET  /api/shortlist/:projectId - Get candidates for project`);
  console.log(`   GET  /api/shortlist/:projectId/candidate/:candidateId - Get candidate details`);
  console.log(`   PUT  /api/shortlist/:projectId/candidate/:candidateId/review - Update review status`);
  console.log(`   GET  /api/shortlist/:projectId/stats - Get project statistics`);
});
