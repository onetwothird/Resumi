export const DEFAULT_NOTIFICATION_SETTINGS = {
  newMessage: true,
  applicationUpdates: true,
  newApplications: true, // employer: when someone applies to your job
  jobPostingUpdates: true, // employer: when your job is published/updated
  interviewInvites: true,
  marketing: false,
} as const;

export type NotificationSettings = {
  [K in keyof typeof DEFAULT_NOTIFICATION_SETTINGS]: boolean;
};

export const NOTIFICATION_LABELS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: "newMessage", label: "New direct messages", description: "When someone sends you a direct message." },
  { key: "applicationUpdates", label: "Application status updates", description: "When an employer reviews, interviews, or hires/rejects you." },
  { key: "newApplications", label: "New applications", description: "When a candidate applies to one of your job postings." },
  { key: "interviewInvites", label: "Interview invitations", description: "When you're selected for an interview." },
  { key: "jobPostingUpdates", label: "Job posting updates", description: "When one of your postings goes live or is edited." },
  { key: "marketing", label: "Tips & product news", description: "Occasional tips from the Resumi team." },
];