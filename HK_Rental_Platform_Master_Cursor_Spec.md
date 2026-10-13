# HK RENTAL PLATFORM - MASTER CURSOR IMPLEMENTATION SPECIFICATION

Version: 1.0
Target Stack: Next.js + Supabase + OpenAI + Mapbox
Purpose: Single source of truth for Cursor AI implementation.

# PRODUCT VISION

Build a Hong Kong-focused rental platform allowing tenants and landlords to:
- Discover rental properties.
- Search via map.
- Book viewings.
- Communicate safely.
- Review tenancy agreements with AI.
- Support English and Traditional Chinese.

---

# SYSTEM ARCHITECTURE

Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

External Services
- OpenAI API
- Mapbox API

---

# MULTI LANGUAGE STRATEGY

Supported Languages
- English (en)
- Traditional Chinese (zh-HK)

Database Rule
Every translatable record uses:
- name_en
- name_zh
- description_en
- description_zh

---

# USER TYPES

1. Tenant
2. Landlord
3. Admin

---

# DATABASE SCHEMA

## profiles
uuid id PK
email
full_name
phone
avatar_url
role
language
created_at
updated_at

Indexes:
- email
- role

## properties
uuid id PK
uuid landlord_id FK
varchar title
text description
varchar district
varchar address
numeric monthly_rent
integer bedrooms
integer bathrooms
integer area_sqft
decimal latitude
decimal longitude
varchar property_type
varchar status
boolean featured
created_at
updated_at

Status values:
- draft
- active
- rented
- archived

Indexes:
- district
- monthly_rent
- property_type
- status

## property_images
id
property_id
image_url
display_order

## amenities
id
name_en
name_zh

## property_amenities
property_id
amenity_id

## favourites
user_id
property_id

Unique:
(user_id,property_id)

## viewing_requests
property_id
tenant_id
landlord_id
requested_time
status
notes

Statuses:
pending
approved
rejected
completed

## conversations
id
property_id
tenant_id
landlord_id

## messages
conversation_id
sender_id
message_body
created_at

## notifications
user_id
title
body
read

## agreements
user_id
file_url
extracted_text
status

## agreement_reviews
agreement_id
risk_level
summary
findings_json

## reports
reporter_id
property_id
reason
status

---

# STORAGE BUCKETS

avatars
property-images
agreements
chat-attachments

---

# RLS REQUIREMENTS

Profile
- Users read own profile.
- Users update own profile.

Properties
- Everyone can read active properties.
- Only owner landlord can edit.
- Only owner landlord can delete.

Messages
- Only participants can view.

Agreement Documents
- Only document owner can access.

Agreement Reviews
- Only owner can view.

Admin
- Full access.

---

# AUTHENTICATION

Methods:
- Email Password
- Google OAuth

Required Features:
- Verify Email
- Reset Password
- Refresh Token Handling

---

# PROPERTY MODULE

Create Property
Edit Property
Archive Property
Delete Property
Duplicate Property

Validation:
Rent > 0
Bedrooms >= 0
Bathrooms >= 0
Area > 0

Maximum Images:
20

---

# PROPERTY SEARCH

Filters:
District
Price Min
Price Max
Bedrooms
Bathrooms
Property Type
Keyword
Amenities

Sort:
Newest
Oldest
Price Asc
Price Desc

Pagination:
20 records

---

# MAPBOX IMPLEMENTATION

Required Features:
- Marker Clustering
- Marker Popup
- Current Location
- Draw Search Area
- District Boundary Filtering

Popup Fields:
Image
Rent
Bedrooms
District
Property Title

Nearby Places:
- MTR
- Schools
- Hospitals
- Shopping Centres
- Supermarkets

---

# VIEWING SYSTEM

Tenant Flow:
Select property
Choose date
Submit request

Landlord Flow:
Approve
Reject
Reschedule

Notifications generated automatically.

---

# CHAT SYSTEM

Realtime Messaging using Supabase.

Features:
- Read receipts
- Typing indicator
- Attachment support

Message Types:
text
image
file

---

# AI AGREEMENT REVIEW

Purpose:
Analyze tenancy agreements.

Accepted Formats:
PDF
DOCX
PNG
JPG

Processing Pipeline:
Upload
OCR
Text Extraction
Chunking
OpenAI Analysis
Persistence
Presentation

Review Categories:
- Deposit
- Early Termination
- Notice Period
- Repair Obligation
- Utility Charges
- Hidden Charges
- Renovation Responsibility
- Renewal Terms

Output Format:
Executive Summary
Risk Rating
Risk List
Recommendations
Questions To Ask

Risk Levels:
Low
Medium
High

Disclaimer:
Not legal advice.

---

# AI CHATBOT

Capabilities:
Explain agreement clauses.
Explain rental terminology.
Recommend next steps.
Summarize agreement.

System Prompt Requirements:
- Friendly tone.
- Hong Kong rental context.
- Do not provide legal advice.
- Encourage consulting professionals.

---

# NOTIFICATIONS

Events:
New Message
Viewing Approved
Viewing Rejected
Agreement Analysis Complete
Property Saved

Delivery:
Realtime + Database record.

---

# ADMIN DASHBOARD

Manage Users
Manage Listings
View Reports
Moderate Content
AI Usage Statistics
System Health Metrics

---

# API CONTRACTS

GET /api/properties
POST /api/properties
PATCH /api/properties/:id
DELETE /api/properties/:id

GET /api/favourites
POST /api/favourites
DELETE /api/favourites/:id

POST /api/viewings
PATCH /api/viewings/:id

POST /api/messages
GET /api/messages

POST /api/agreements/upload
POST /api/agreements/review
GET /api/agreements/:id

POST /api/chatbot

---

# SECURITY

- Rate limiting.
- Input validation.
- SQL injection protection.
- XSS protection.
- Secure file uploads.
- Audit logging.

---

# ANALYTICS

Track:
Property Views
Favourite Counts
Viewing Requests
Agreement Analyses
Chatbot Usage

---

# ENVIRONMENT VARIABLES

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
MAPBOX_ACCESS_TOKEN

---

# CURSOR IMPLEMENTATION ORDER

PHASE 1
Database Schema
Auth
Profiles

PHASE 2
Properties
Image Upload
Search

PHASE 3
Mapbox
Favourites
Viewing Requests

PHASE 4
Messaging
Notifications

PHASE 5
AI Agreement Review
AI Assistant

PHASE 6
Admin Dashboard
Analytics

---

# DEFINITION OF DONE

- All tables migrated.
- RLS enabled on every table.
- Authentication functional.
- Properties searchable.
- Maps operational.
- Messaging realtime.
- Agreement review operational.
- Chatbot operational.
- Production deployment successful.
