/**
 * Realistic sample resume used to preview templates in the library.
 * Every section is filled so each template preview looks complete.
 */

import { ResumeData, DEFAULT_THEME } from "@/types";

export const SAMPLE_RESUME: ResumeData = {
  title: "Sample Resume",
  titleIsCustom: false,
  firstName: "Alexander",
  lastName: "Morgan",
  jobTitle: "Senior Product Manager",
  email: "alexander.morgan@email.com",
  phone: "+1 (555) 214-8890",
  address: "Seattle, WA",
  summary:
    "Product manager with 8+ years of experience shipping B2B SaaS platforms used by over 2 million users. Known for turning ambiguous problems into clear roadmaps, leading cross-functional teams of 12+, and consistently delivering measurable growth — 40% ARR increase and a 3x lift in activation in the last two years.",
  experience: [
    {
      id: "exp-1",
      company: "Northwind Technologies",
      role: "Senior Product Manager",
      date: "2021 — Present",
      description:
        "Own the analytics platform roadmap and P&L ($24M ARR). Launched 14 major features and led a pricing overhaul that grew ARR by 40% year-over-year. Built a discovery practice (interviews, usability tests, experimentation) that lifted activation from 22% to 61%.",
    },
    {
      id: "exp-2",
      company: "Brightline Software",
      role: "Product Manager",
      date: "2018 — 2021",
      description:
        "Managed a cross-functional squad of 8 shipping a customer-success suite. Shipped a white-label onboarding flow adopted by 120 enterprise accounts, cutting time-to-value from 9 days to 3. Ran quarterly OKR planning with 4 engineering pods.",
    },
    {
      id: "exp-3",
      company: "Atlas Consulting Group",
      role: "Business Analyst",
      date: "2016 — 2018",
      description:
        "Delivered process-optimisation projects for 15 clients across retail and logistics. Modelled workflows that reduced operational costs by an average of 18%. Created executive dashboards used to track $80M in managed spend.",
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "University of Washington — Foster School of Business",
      degree: "MBA, Business Administration",
      date: "2016",
    },
    {
      id: "edu-2",
      school: "Oregon State University",
      degree: "B.Sc. Computer Science (Cum Laude)",
      date: "2013",
    },
  ],
  skills:
    "Product Strategy\nRoadmapping & Prioritisation\nUser Research & A/B Testing\nSQL & Product Analytics\nAgile & Scrum Leadership\nStakeholder Management\nP&L Ownership\nGo-to-Market Planning",
  certifications:
    "Certified Scrum Product Owner (CSPO)\nGoogle Product Analytics Certification\nPragmatic Institute — Product Management",
  theme: { ...DEFAULT_THEME },
  blockStyles: {},
};