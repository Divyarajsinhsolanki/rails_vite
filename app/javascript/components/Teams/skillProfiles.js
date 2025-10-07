export const SAMPLE_SKILL_PROFILES = {
  "alex johnson": {
    role: "Engineering Manager",
    availability: "Available in 2 weeks",
    projects: 3,
    skillLevels: {
      "JavaScript": "Expert",
      "React": "Expert",
      "TypeScript": "Expert",
      "Node.js": "Advanced",
      "Docker": "Intermediate",
      "AWS": "Intermediate",
      "Python": null,
      "GraphQL": "Intermediate"
    },
    endorsements: {
      "JavaScript": 11,
      "React": 12,
      "TypeScript": 10,
      "Docker": 9,
      "AWS": 8
    },
    userSkills: [
      { name: "Leadership", endorsements: 9, endorsed: false },
      { name: "JavaScript", endorsements: 11, endorsed: true },
      { name: "React", endorsements: 12, endorsed: false },
      { name: "Team Coaching", endorsements: 6, endorsed: false }
    ],
    learningGoals: [
      {
        id: 1,
        title: "Master Docker",
        dueDate: "2025-08-30",
        progress: 50,
        checkpoints: [
          { id: 1, task: "Complete Docker Basics course", done: true, link: "https://internal.courses/docker101" },
          { id: 2, task: "Containerize a sample app", done: false, link: "https://github.com/org/project/issues/123" },
          { id: 3, task: "Deploy multi-container application", done: false, link: "" },
          { id: 4, task: "Optimize Docker images", done: false, link: "" }
        ]
      },
      {
        id: 2,
        title: "Become proficient in React Performance",
        dueDate: "2025-09-15",
        progress: 30,
        checkpoints: [
          { id: 1, task: "Complete React Performance course", done: true, link: "https://internal.courses/react-perf" },
          { id: 2, task: "Implement memoization in project", done: true, link: "" },
          { id: 3, task: "Analyze bundle size and optimize", done: false, link: "" }
        ]
      },
      {
        id: 3,
        title: "Learn TypeScript Advanced Patterns",
        dueDate: "2025-10-10",
        progress: 10,
        checkpoints: [
          { id: 1, task: "Read Advanced TypeScript book", done: false, link: "" },
          { id: 2, task: "Complete type challenges", done: false, link: "https://github.com/type-challenges/type-challenges" }
        ]
      }
    ]
  },
  "sarah williams": {
    role: "Senior Developer",
    availability: "Available Now",
    projects: 2,
    skillLevels: {
      "JavaScript": "Expert",
      "React": "Expert",
      "TypeScript": "Advanced",
      "Node.js": "Advanced",
      "Docker": "Expert",
      "AWS": "Advanced",
      "Python": "Intermediate",
      "GraphQL": "Advanced"
    },
    endorsements: {
      "JavaScript": 12,
      "React": 15,
      "TypeScript": 10,
      "Docker": 12,
      "AWS": 8
    },
    userSkills: [
      { name: "React", endorsements: 15, endorsed: true },
      { name: "TypeScript", endorsements: 10, endorsed: false },
      { name: "Docker", endorsements: 12, endorsed: false },
      { name: "AWS", endorsements: 8, endorsed: false }
    ],
    learningGoals: [
      {
        id: 4,
        title: "Expand GraphQL Expertise",
        dueDate: "2025-07-01",
        progress: 60,
        checkpoints: [
          { id: 1, task: "Complete GraphQL schema design course", done: true, link: "" },
          { id: 2, task: "Implement GraphQL federation demo", done: false, link: "https://github.com/org/graphql-demo" },
          { id: 3, task: "Host internal knowledge share", done: false, link: "" }
        ]
      }
    ]
  },
  "michael chen": {
    role: "Frontend Developer",
    availability: "Available in 2 weeks",
    projects: 3,
    skillLevels: {
      "JavaScript": "Advanced",
      "React": "Expert",
      "TypeScript": "Advanced",
      "Node.js": "Intermediate",
      "Docker": "Beginner",
      "AWS": "Beginner",
      "Python": null,
      "GraphQL": "Intermediate"
    },
    endorsements: {
      "JavaScript": 8,
      "React": 10,
      "TypeScript": 9,
      "GraphQL": 7
    },
    userSkills: [
      { name: "React", endorsements: 10, endorsed: true },
      { name: "TypeScript", endorsements: 9, endorsed: false },
      { name: "GraphQL", endorsements: 7, endorsed: false }
    ],
    learningGoals: [
      {
        id: 5,
        title: "Improve GraphQL API integration",
        dueDate: "2025-06-30",
        progress: 45,
        checkpoints: [
          { id: 1, task: "Audit existing GraphQL queries", done: true, link: "" },
          { id: 2, task: "Introduce caching for heavy queries", done: false, link: "" },
          { id: 3, task: "Document best practices", done: false, link: "" }
        ]
      }
    ]
  },
  "emma rodriguez": {
    role: "Backend Developer",
    availability: "Available Now",
    projects: 1,
    skillLevels: {
      "JavaScript": "Intermediate",
      "React": "Intermediate",
      "TypeScript": "Intermediate",
      "Node.js": "Expert",
      "Docker": "Advanced",
      "AWS": "Intermediate",
      "Python": "Advanced",
      "GraphQL": "Advanced"
    },
    endorsements: {
      "JavaScript": 9,
      "Node.js": 12,
      "Python": 7,
      "Docker": 9,
      "AWS": 10
    },
    userSkills: [
      { name: "Node.js", endorsements: 12, endorsed: true },
      { name: "Python", endorsements: 7, endorsed: false },
      { name: "Docker", endorsements: 9, endorsed: false },
      { name: "AWS", endorsements: 10, endorsed: false }
    ],
    learningGoals: [
      {
        id: 6,
        title: "Deep dive into distributed tracing",
        dueDate: "2025-09-01",
        progress: 35,
        checkpoints: [
          { id: 1, task: "Instrument services with OpenTelemetry", done: true, link: "" },
          { id: 2, task: "Publish tracing dashboard", done: false, link: "" },
          { id: 3, task: "Host brown bag session", done: false, link: "" }
        ]
      }
    ]
  },
  "james wilson": {
    role: "DevOps Engineer",
    availability: "Fully Booked",
    projects: 4,
    skillLevels: {
      "JavaScript": "Intermediate",
      "React": "Beginner",
      "TypeScript": null,
      "Node.js": "Advanced",
      "Docker": "Expert",
      "AWS": "Expert",
      "Python": "Intermediate",
      "GraphQL": "Beginner"
    },
    endorsements: {
      "Docker": 14,
      "AWS": 15,
      "Node.js": 8,
      "Python": 6
    },
    userSkills: [
      { name: "Docker", endorsements: 14, endorsed: true },
      { name: "AWS", endorsements: 15, endorsed: false },
      { name: "Node.js", endorsements: 8, endorsed: false },
      { name: "Python", endorsements: 6, endorsed: false }
    ],
    learningGoals: [
      {
        id: 7,
        title: "Automate compliance checks",
        dueDate: "2025-11-20",
        progress: 20,
        checkpoints: [
          { id: 1, task: "Draft compliance checklist", done: true, link: "" },
          { id: 2, task: "Integrate checks into CI", done: false, link: "" },
          { id: 3, task: "Report compliance metrics", done: false, link: "" }
        ]
      }
    ]
  }
};

export const SAMPLE_RECENT_ENDORSEMENTS = [
  { from: "Alex Johnson", to: "Sarah Williams", skill: "Docker", date: "2 days ago" },
  { from: "Emma Rodriguez", to: "Michael Chen", skill: "TypeScript", date: "3 days ago" },
  { from: "James Wilson", to: "Alex Johnson", skill: "AWS", date: "4 days ago" }
];

export const SAMPLE_RECOMMENDED_RESOURCES = [
  {
    title: "Docker Deep Dive",
    description: "Advanced containerization techniques and best practices",
    cta: "Explore Course",
    accent: "indigo"
  },
  {
    title: "React Performance Mastery",
    description: "Optimize your React apps for maximum speed and efficiency",
    cta: "Explore Course",
    accent: "amber"
  },
  {
    title: "TypeScript Patterns",
    description: "Advanced type patterns and real-world applications",
    cta: "Explore Course",
    accent: "green"
  }
];
