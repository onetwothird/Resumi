export interface JobListItem {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  employmentType: string;
  status: "draft" | "published";
  updatedAt: string;
  createdAt: string;
}