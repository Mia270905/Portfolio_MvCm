export interface ContactGroup {
  id: string;
  title: string;
  description: string;
  image_url: string | File;
  active: boolean;
  created_at: string;
  updated_at: string;
}