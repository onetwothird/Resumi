export interface JobListItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  employmentType: string;
  status: "draft" | "published" | string;
  posterImageUrl: string | null;
  updatedAt: string;

  salaryMin: number | null;
  salaryMax: number | null;
  skills: unknown; 
}