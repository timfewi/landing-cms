export interface Page {
  id: string;
  title: string;
  slug: string;
  description?: string;
  seo?: SEO;
  isPublished: boolean;
  createdDate: string;
  lastModifiedDate: string;
  sections: Section[];
}

export interface SEO {
  metaTitle?: string;
  metaDescription?: string;
  robots?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface Section {
  id: string;
  title: string;
  type: string;
  order: number;
  settings?: any;
  widgets: Widget[];
}

export interface Widget {
  id: string;
  type: string;
  order: number;
  settings: any;
  content: any;
}
