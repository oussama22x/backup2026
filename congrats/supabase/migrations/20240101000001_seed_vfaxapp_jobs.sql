-- Seed initial VFA × APP jobs
-- These are the hardcoded jobs that were previously in v1

INSERT INTO public.jobs (id, slug, title, type, category, location, employment_type, description, brand_source, is_active, created_at, updated_at)
VALUES 
  (
    'graduate-trainee-general',
    'graduate-trainee-general',
    'Graduate Trainee (General Track)',
    'graduate_trainee',
    'General',
    'Remote',
    'Full-time',
    '{"overview": "Join our 8-week cross-functional graduate trainee program designed to give you hands-on experience across multiple departments. You will work on real projects, collaborate with experienced professionals, and build a strong foundation for your career.", "responsibilities": ["Work on cross-functional projects across different departments", "Participate in team meetings and contribute ideas", "Complete assigned tasks and deliverables on time", "Learn and apply new skills in a fast-paced environment", "Collaborate with team members and stakeholders"], "success_criteria": ["Successfully complete all assigned projects", "Demonstrate strong learning agility and adaptability", "Show initiative and proactive problem-solving", "Build positive relationships with team members", "Deliver high-quality work consistently"], "ideal_skills": ["Strong communication skills", "Ability to work in a team", "Quick learner", "Problem-solving mindset", "Time management skills"]}'::jsonb,
    ARRAY['vfa', 'app'],
    true,
    NOW(),
    NOW()
  ),
  (
    'operations-trainee',
    'operations-trainee',
    'Operations Trainee',
    'graduate_trainee',
    'Operations',
    'Remote',
    'Full-time',
    '{"overview": "Support our operations team in planning and executing events, managing logistics, and ensuring smooth day-to-day operations. This role is perfect for someone who is organized, detail-oriented, and enjoys working behind the scenes to make things happen.", "responsibilities": ["Assist with event planning and coordination", "Manage logistics and vendor relationships", "Support day-to-day operational tasks", "Maintain operational documentation", "Coordinate with different teams"], "success_criteria": ["Successfully support multiple events", "Maintain accurate documentation", "Build strong vendor relationships", "Improve operational efficiency", "Handle multiple tasks simultaneously"], "ideal_skills": ["Strong organizational skills", "Attention to detail", "Event planning experience", "Vendor management", "Project management"]}'::jsonb,
    ARRAY['vfa', 'app'],
    true,
    NOW(),
    NOW()
  ),
  (
    'marketing-trainee',
    'marketing-trainee',
    'Marketing & Communications Trainee',
    'graduate_trainee',
    'Marketing',
    'Remote',
    'Full-time',
    '{"overview": "Join our marketing team to create engaging content, manage social media, and help build our brand presence. This role is ideal for creative individuals who love storytelling and connecting with audiences.", "responsibilities": ["Create and publish content across various channels", "Manage social media accounts and engagement", "Support marketing campaigns and initiatives", "Analyze marketing metrics and performance", "Collaborate with design and content teams"], "success_criteria": ["Increase social media engagement", "Create high-quality content consistently", "Support successful marketing campaigns", "Build brand awareness", "Generate creative ideas and concepts"], "ideal_skills": ["Content creation", "Social media management", "Creative writing", "Graphic design basics", "Analytics and reporting"]}'::jsonb,
    ARRAY['vfa', 'app'],
    true,
    NOW(),
    NOW()
  ),
  (
    'hr-trainee',
    'hr-trainee',
    'HR & People Trainee',
    'graduate_trainee',
    'Human Resources',
    'Remote',
    'Full-time',
    '{"overview": "Support our HR team in recruiting, onboarding, and people operations. This role is perfect for someone who is people-oriented and wants to help build a great workplace culture.", "responsibilities": ["Assist with recruitment and candidate screening", "Support onboarding processes", "Help organize team events and activities", "Maintain HR documentation and records", "Support employee engagement initiatives"], "success_criteria": ["Successfully support recruitment processes", "Improve onboarding experience", "Contribute to team culture", "Maintain accurate HR records", "Support employee engagement"], "ideal_skills": ["Strong interpersonal skills", "Recruitment experience", "Event planning", "Documentation skills", "Cultural awareness"]}'::jsonb,
    ARRAY['vfa', 'app'],
    true,
    NOW(),
    NOW()
  ),
  (
    'product-tech-trainee',
    'product-tech-trainee',
    'Product & Tech Trainee',
    'graduate_trainee',
    'Product',
    'Remote',
    'Full-time',
    '{"overview": "Work with our product and tech teams to build and improve our platform. This role is ideal for those interested in product development, user experience, and technology.", "responsibilities": ["Assist with product development tasks", "Support user research and testing", "Help with technical documentation", "Participate in product planning sessions", "Support bug fixes and improvements"], "success_criteria": ["Contribute to product improvements", "Support successful feature launches", "Improve user experience", "Learn technical skills", "Work effectively with tech team"], "ideal_skills": ["Technical aptitude", "Product thinking", "User research", "Problem-solving", "Collaboration skills"]}'::jsonb,
    ARRAY['vfa', 'app'],
    true,
    NOW(),
    NOW()
  ),
  (
    'events-community-trainee',
    'events-community-trainee',
    'Events & Community Trainee',
    'graduate_trainee',
    'Events',
    'Remote',
    'Full-time',
    '{"overview": "Help organize events and build our community. This role is perfect for outgoing individuals who love bringing people together and creating memorable experiences.", "responsibilities": ["Plan and coordinate community events", "Engage with community members", "Support event logistics and execution", "Create event content and materials", "Build relationships with partners"], "success_criteria": ["Successfully organize multiple events", "Increase community engagement", "Build strong partner relationships", "Create memorable experiences", "Grow community participation"], "ideal_skills": ["Event planning", "Community management", "Networking", "Content creation", "Relationship building"]}'::jsonb,
    ARRAY['vfa', 'app'],
    true,
    NOW(),
    NOW()
  ),
  (
    'finance-admin-trainee',
    'finance-admin-trainee',
    'Finance & Admin Trainee',
    'graduate_trainee',
    'Finance',
    'Remote',
    'Full-time',
    '{"overview": "Support our finance and admin operations. This role is ideal for detail-oriented individuals who enjoy working with numbers and ensuring smooth administrative processes.", "responsibilities": ["Assist with budget tracking and reporting", "Support administrative tasks", "Help with financial documentation", "Coordinate with vendors and suppliers", "Maintain accurate records"], "success_criteria": ["Maintain accurate financial records", "Support budget management", "Improve administrative efficiency", "Handle multiple admin tasks", "Ensure compliance with processes"], "ideal_skills": ["Attention to detail", "Financial literacy", "Administrative skills", "Excel and spreadsheet skills", "Organization"]}'::jsonb,
    ARRAY['vfa', 'app'],
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  employment_type = EXCLUDED.employment_type,
  description = EXCLUDED.description,
  brand_source = EXCLUDED.brand_source,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;
