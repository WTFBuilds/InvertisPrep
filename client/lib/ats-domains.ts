// Domain profiles and TypeScript interfaces for Gemini AI ATS Resume Analyser

export interface DomainProfile {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  coreSkills: string[];
  toolsAndFrameworks: string[];
}

export const DOMAINS: DomainProfile[] = [
  {
    id: 'fullstack',
    name: 'Full Stack Web Developer',
    category: 'Software Engineering',
    icon: '💻',
    description: 'Frontend, backend, databases, APIs, deployment and web architectures.',
    coreSkills: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Next.js', 'Express.js',
      'HTML5', 'CSS3', 'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL', 'MySQL',
      'Git', 'Tailwind CSS', 'Redux', 'Authentication', 'State Management'
    ],
    toolsAndFrameworks: [
      'Docker', 'AWS', 'Vercel', 'Postman', 'Webpack', 'Vite', 'Jest', 'Prisma',
      'Redis', 'CI/CD', 'GitHub Actions', 'Nginx', 'Firebase', 'Supabase'
    ]
  },
  {
    id: 'frontend',
    name: 'Frontend Developer',
    category: 'Software Engineering',
    icon: '🎨',
    description: 'Modern UI/UX engineering, web performance, component libraries, and animations.',
    coreSkills: [
      'JavaScript', 'TypeScript', 'React.js', 'Next.js', 'Vue.js', 'HTML5',
      'CSS3', 'SASS/SCSS', 'Tailwind CSS', 'Redux', 'Zustand', 'Responsive Design',
      'DOM Manipulation', 'REST API', 'GraphQL', 'Web Accessibility (WCAG)', 'SEO'
    ],
    toolsAndFrameworks: [
      'Vite', 'Webpack', 'Framer Motion', 'Storybook', 'Jest', 'Cypress', 'Playwright',
      'Figma', 'Git', 'NPM', 'PWA', 'Chrome DevTools', 'PostCSS'
    ]
  },
  {
    id: 'backend',
    name: 'Backend Developer',
    category: 'Software Engineering',
    icon: '⚙️',
    description: 'Server architecture, APIs, distributed systems, caching, and data pipelines.',
    coreSkills: [
      'Node.js', 'Python', 'Java', 'Go', 'Express.js', 'NestJS', 'Django', 'FastAPI',
      'Spring Boot', 'PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'REST API', 'gRPC',
      'GraphQL', 'Microservices', 'Database Indexing', 'System Architecture'
    ],
    toolsAndFrameworks: [
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Kafka', 'RabbitMQ', 'Postman',
      'Swagger/OpenAPI', 'Elasticsearch', 'CI/CD', 'Linux', 'ORM/Prisma', 'OAuth'
    ]
  },
  {
    id: 'ai-ml',
    name: 'AI / Machine Learning Engineer',
    category: 'Artificial Intelligence',
    icon: '🤖',
    description: 'Machine learning algorithms, deep neural nets, LLMs, NLP, and model deployment.',
    coreSkills: [
      'Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-learn',
      'NLP', 'Computer Vision', 'LLMs', 'Prompt Engineering', 'LangChain', 'Hugging Face',
      'NumPy', 'Pandas', 'Data Preprocessing', 'Feature Engineering', 'RAG'
    ],
    toolsAndFrameworks: [
      'Jupyter', 'MLflow', 'Docker', 'CUDA', 'Vector Databases (Chroma/Pinecone)',
      'FastAPI', 'AWS SageMaker', 'Weights & Biases', 'Gradio', 'OpenCV'
    ]
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist / Analyst',
    category: 'Data & Analytics',
    icon: '📊',
    description: 'Exploratory data analysis, statistical modeling, BI dashboards, and storytelling.',
    coreSkills: [
      'Python', 'SQL', 'R', 'Pandas', 'NumPy', 'Data Visualization', 'Matplotlib',
      'Seaborn', 'Tableau', 'Power BI', 'Statistical Analysis', 'A/B Testing',
      'Hypothesis Testing', 'Predictive Modeling', 'Excel / Sheets'
    ],
    toolsAndFrameworks: [
      'Jupyter Notebook', 'BigQuery', 'Snowflake', 'PostgreSQL', 'Airflow',
      'Dbt', 'Scikit-learn', 'Git', 'Databricks'
    ]
  },
  {
    id: 'devops-cloud',
    name: 'DevOps & Cloud Engineer',
    category: 'Infrastructure',
    icon: '☁️',
    description: 'Cloud infrastructure, CI/CD pipelines, container orchestration, and site reliability.',
    coreSkills: [
      'Linux', 'Bash/Shell', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
      'Terraform', 'CI/CD Pipelines', 'GitHub Actions', 'Jenkins', 'Ansible',
      'Monitoring & Logging', 'Prometheus', 'Grafana', 'Networking & DNS', 'Security'
    ],
    toolsAndFrameworks: [
      'Helm', 'ArgoCD', 'ELK Stack', 'Datadog', 'CloudFormation', 'Nginx',
      'Git', 'Vault', 'Serverless', 'S3', 'EC2', 'EKS'
    ]
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity Analyst / Engineer',
    category: 'Security',
    icon: '🛡️',
    description: 'Vulnerability assessment, penetration testing, network defense, and compliance.',
    coreSkills: [
      'Network Security', 'Vulnerability Assessment', 'Penetration Testing', 'SIEM',
      'Incident Response', 'OWASP Top 10', 'Cryptography', 'Firewalls', 'Linux',
      'Python/Bash Scripting', 'Identity & Access Management (IAM)', 'Wireshark'
    ],
    toolsAndFrameworks: [
      'Burp Suite', 'Metasploit', 'Nmap', 'Splunk', 'Kali Linux', 'Snort',
      'Nessus', 'CrowdStrike', 'Qualys', 'SOC'
    ]
  },
  {
    id: 'mobile-dev',
    name: 'Mobile App Developer (iOS / Android / Flutter)',
    category: 'Software Engineering',
    icon: '📱',
    description: 'Native and cross-platform mobile apps, state management, and app store deployment.',
    coreSkills: [
      'Flutter', 'React Native', 'Kotlin', 'Swift', 'Dart', 'Java', 'Android SDK',
      'iOS SDK', 'State Management', 'REST API', 'Firebase', 'Push Notifications',
      'App Store / Play Store Deployment', 'Mobile UI/UX'
    ],
    toolsAndFrameworks: [
      'Xcode', 'Android Studio', 'Bloc/Provider/Redux', 'Cocoapods', 'Gradle',
      'Fastlane', 'Git', 'SQLite/Room/CoreData', 'Postman'
    ]
  },
  {
    id: 'ui-ux',
    name: 'UI/UX & Product Designer',
    category: 'Design',
    icon: '✨',
    description: 'User research, wireframing, interactive prototyping, design systems, and visual design.',
    coreSkills: [
      'Figma', 'UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'Design Systems',
      'User Personas', 'Information Architecture', 'Usability Testing', 'Typography & Color Theory',
      'Micro-interactions', 'Responsive Layouts'
    ],
    toolsAndFrameworks: [
      'Figma', 'Adobe XD', 'Sketch', 'Miro', 'InVision', 'Zeplin', 'Lottie', 'Notion'
    ]
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    category: 'Management',
    icon: '🚀',
    description: 'Roadmapping, feature prioritization, agile delivery, user research, and metrics.',
    coreSkills: [
      'Product Strategy', 'Roadmapping', 'Agile / Scrum', 'User Stories & PRDs',
      'Market Research', 'Competitor Analysis', 'KPI Tracking', 'A/B Testing',
      'Feature Prioritization (RICE/MoSCoW)', 'Data-driven Decision Making'
    ],
    toolsAndFrameworks: [
      'Jira', 'Confluence', 'Mixpanel', 'Google Analytics', 'Figma', 'Linear',
      'Notion', 'Tableau', 'Slack'
    ]
  }
];

export interface GeminiATSAnalysisResult {
  atsScore: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement';
  gradeColor: string;
  summary: string;
  breakdown: {
    skillsMatchScore: number;
    experienceRelevanceScore: number;
    formattingStructureScore: number;
    quantifiableImpactScore: number;
    keywordDensityScore: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  softSkillsFound: string[];
  missingSoftSkills: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  actionVerbsFound: string[];
  quantifiableMetrics: string[];
  strengths: string[];
  criticalRedFlags: string[];
  improvementSuggestions: {
    category: 'Skills' | 'Impact' | 'Formatting' | 'Structure' | 'Keywords';
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
  bulletPointFixes: {
    originalContext: string;
    suggestion: string;
    reason: string;
  }[];
  wordCount: number;
  readingTimeMinutes: number;
}
