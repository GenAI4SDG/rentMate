/**
 * Hand-maintained types mirroring backend/supabase/migrations.
 * Regenerate with `supabase gen types typescript --local` when the CLI is linked.
 */

export type UserRole = "tenant" | "landlord" | "admin";
export type PropertyStatus = "draft" | "active" | "rented" | "archived";
export type ViewingStatus = "pending" | "approved" | "rejected" | "completed";
export type AgreementStatus = "uploaded" | "processing" | "reviewed" | "failed";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type MessageType = "text" | "image" | "file";
export type RiskLevel = "Low" | "Medium" | "High";
export type AppLanguage = "en" | "zh-HK";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  language: AppLanguage;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  landlord_id: string;
  title_en: string;
  title_zh: string | null;
  description_en: string | null;
  description_zh: string | null;
  district: string;
  address: string;
  monthly_rent: number;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  latitude: number | null;
  longitude: number | null;
  property_type: string;
  status: PropertyStatus;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PropertySearchFilters {
  district?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  keyword?: string;
  amenityIds?: string[];
  sort?: "newest" | "oldest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  display_order: number;
}

export interface Amenity {
  id: string;
  name_en: string;
  name_zh: string;
}

export interface Favourite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface ViewingRequest {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  requested_time: string;
  status: ViewingStatus;
  notes: string | null;
}

export interface Conversation {
  id: string;
  property_id: string | null;
  tenant_id: string;
  landlord_id: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_body: string;
  message_type: MessageType;
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Agreement {
  id: string;
  user_id: string;
  file_url: string;
  extracted_text: string | null;
  status: AgreementStatus;
}

export interface AgreementReview {
  id: string;
  agreement_id: string;
  risk_level: RiskLevel;
  summary: string;
  findings_json: unknown[];
}
