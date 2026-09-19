export interface ResumeListItem {
  id: string;
  title: string;
  jobTitle: string | null;
  summary: string | null;
  updatedAt: string;
  createdAt: string;
  completionProgress: {
    percentage: number;
    sections: {
      personal: boolean;
      summary: boolean;
      experience: boolean;
      education: boolean;
      skills: boolean;
      certifications: boolean;
    };
  } | null;
}