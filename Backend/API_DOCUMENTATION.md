# Java Backend API Documentation

**Complete API structure, DTOs, exceptions, and business logic for the Recruitment Management System**

---

## Table of Contents
1. [API Endpoints](#api-endpoints)
2. [Data Transfer Objects (DTOs)](#data-transfer-objects)
3. [Exception Handling](#exception-handling)
4. [Business Logic & Validation Rules](#business-logic--validation-rules)
5. [Enumerations](#enumerations)

---

## API Endpoints

### 1. Account Controller (`/auth`)

#### 1.1 Login
- **HTTP Method:** POST
- **Path:** `/auth/login`
- **Method Name:** `login(LoginRequest request)`
- **Authentication:** None required
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Request Parameters:**
  - `email` (String): User email address (required, validated)
  - `password` (String): User password (required, validated)
- **Response Body:**
  ```json
  {
    "token": "Bearer <JWT_TOKEN>",
    "display_code": "string",
    "full_name": "string",
    "bio": "string|null",
    "address": "string|null",
    "email": "string",
    "phone": "string|null",
    "role": "Admin|HR|Candidate"
  }
  ```
- **Response Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **HTTP Status Codes:**
  - 200: Login successful
  - 400: Invalid email/password or validation error
  - 500: Server error
- **Validation:**
  - Email must not be null and must be valid format
  - Password must not be null and must be valid format
  - Account must exist in database
- **Business Rules:**
  - Validates email format and password strength via Validator
  - Authenticates against Supabase Authentication
  - Returns user info from local database

#### 1.2 Candidate Signup
- **HTTP Method:** POST
- **Path:** `/auth/signup/candidate`
- **Method Name:** `signup(CandidateSignupRequest request)`
- **Authentication:** None required
- **Request Body:**
  ```json
  {
    "email": "candidate@example.com",
    "password": "password123",
    "fullname": "John Doe"
  }
  ```
- **Request Parameters:**
  - `email` (String): Candidate email (required, must not exist)
  - `password` (String): Candidate password (required, validated)
  - `fullname` (String): Full name (required)
- **Response Body:**
  - Success: HTTP 200 with body "ok"
  - Error: HTTP 400/500 with error message
- **HTTP Status Codes:**
  - 200: Signup successful
  - 400: Validation error or duplicate email
  - 500: Server error
- **Validation:**
  - Email must not be null, valid format, and unique
  - Password must not be null and must be valid format
  - Fullname must not be null
- **Business Rules:**
  - Creates account in Supabase Authentication
  - Creates Candidate record in local database
  - Generates display ID for candidate

---

### 2. Application Controller (`/application`)

#### 2.1 Get Application by ID
- **HTTP Method:** GET
- **Path:** `/application/id`
- **Method Name:** `getApplication(Integer applicationId)`
- **Authentication:** Required (JWT via cookie)
- **Request Body:**
  ```json
  {
    "applicationId": 123
  }
  ```
- **Request Parameters:**
  - `applicationId` (Integer): Application ID in body (required)
- **Response Body:**
  ```json
  {
    "id": 123,
    "userId": "uuid-string",
    "jobId": 1,
    "cvId": 1,
    "status": "NEW_APPLIED|SCREENING|INTERVIEW|OFFERED|DECLINED",
    "stage": "NEW|SCREENING|INTERVIEW|REVIEW|OFFER|HIRED",
    "admin_note": "string|null",
    "applied_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z"
  }
  ```
- **HTTP Status Codes:**
  - 200: Success
  - 400: Invalid ID or data error
  - 500: Server error

#### 2.2 Create New Application
- **HTTP Method:** POST
- **Path:** `/application`
- **Method Name:** `newApplication(LinkedHashMap header, ApplicationsPostRequest request)`
- **Authentication:** Required (JWT via cookie in header)
- **Request Body:**
  ```json
  {
    "jobId": 1,
    "email": "candidate@example.com"
  }
  ```
- **Request Parameters:**
  - `jobId` (Integer): Job to apply for (required)
  - `email` (String): Candidate email (required)
- **Request Headers:**
  - `cookie`: JWT token containing userId in "sub" claim
- **Response Body:**
  - Success: "Thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Application created
  - 400: Missing cookie, validation error
  - 500: Server error
- **Validation:**
  - Cookie must be present in header
  - JWT must contain valid "sub" claim (userId)
  - User must have primary CV
  - Job must exist
- **Business Rules:**
  - Retrieves user's primary CV
  - Creates new application record
  - Increments job application count

#### 2.3 Update Application
- **HTTP Method:** PATCH
- **Path:** `/application`
- **Method Name:** `updateApplication(ApplicationPatchRequest request)`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "application_id": 123,
    "status": "SCREENING",
    "stage": "INTERVIEW",
    "adminNote": "Good candidate"
  }
  ```
- **Request Parameters:**
  - `application_id` (Integer): Application ID (required)
  - `status` (ApplicationStatus): NEW_APPLIED|SCREENING|INTERVIEW|OFFERED|DECLINED (optional)
  - `stage` (PipelineStage): NEW|SCREENING|INTERVIEW|REVIEW|OFFER|HIRED (optional)
  - `adminNote` (String): Admin notes (optional)
- **Response Body:**
  - Success: "Cập nhật thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Updated successfully
  - 400: Invalid request or missing fields
  - 500: Server error
- **Validation:**
  - Request must not be null
  - application_id must be > 0
  - At least one update field must be provided (status, stage, or adminNote)
- **Business Rules:**
  - Only provided fields are updated
  - Tracks which fields were modified
  - Updates timestamp automatically

#### 2.4 Delete Application
- **HTTP Method:** DELETE
- **Path:** `/application`
- **Method Name:** `deleteApplication(int application_id)`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "application_id": 123
  }
  ```
- **Request Parameters:**
  - `application_id` (Integer): Application ID to delete (required)
- **Response Body:**
  - Success: "Xóa đơn ứng tuyển thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Deleted successfully
  - 500: Server error
- **Business Rules:**
  - Application record is removed from database
  - Soft delete or hard delete based on implementation

---

### 3. Candidate Controller (`/candidate`)

#### 3.1 Get Candidate by UserID
- **HTTP Method:** GET
- **Path:** `/candidate/id`
- **Method Name:** `getCandidate(String userId)`
- **Authentication:** Required
- **Request Parameters (Query String):**
  - `userId` (String): UUID of candidate (required, must be valid UUID format)
- **Response Body:**
  ```json
  {
    "userId": "uuid-string",
    "displayCode": "CAP001",
    "role": "Candidate",
    "fullname": "John Doe",
    "email": "john@example.com",
    "phone": "0123456789|null",
    "status": "Active|Deactivate"
  }
  ```
- **HTTP Status Codes:**
  - 200: Success
  - 400: Invalid UUID format or not found
  - 500: Server error
- **Validation:**
  - userId must be valid UUID format

#### 3.2 Update Candidate Information
- **HTTP Method:** PATCH
- **Path:** `/candidate/id`
- **Method Name:** `updateCandidate(String userId, CandidatePatchRequest request)`
- **Authentication:** Required
- **Request Parameters (Query String):**
  - `userId` (String): UUID of candidate (required)
- **Request Body:**
  ```json
  {
    "email": "new@example.com",
    "full_name": "Jane Doe",
    "username": "janedoe",
    "bio": "I am a software developer",
    "avatarUrl": "https://example.com/avatar.jpg",
    "address": "123 Main St",
    "phone": "0123456789",
    "twoFactorEnabled": true
  }
  ```
- **Request Parameters:**
  - `email` (String): Email address (optional, when provided cannot be null)
  - `full_name` (String): Full name (optional)
  - `username` (String): Username (optional)
  - `bio` (String): Biography (optional)
  - `avatarUrl` (String): Avatar URL (optional)
  - `address` (String): Address (optional)
  - `phone` (String): Phone number (optional)
  - `twoFactorEnabled` (Boolean): Two-factor auth setting (optional, cannot be null when provided)
- **Response Body:**
  - Success: "Cập nhật thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Updated successfully
  - 400: Invalid UUID format or validation error
  - 500: Server error
- **Validation:**
  - userId must be valid UUID format
  - Email cannot be deleted (must not be null if provided)
  - Two-factor enabled cannot be null if provided
- **Business Rules:**
  - Only provided fields are updated
  - Email converted to lowercase
  - Fields are tracked for selective updates

#### 3.3 Delete Candidate Account
- **HTTP Method:** DELETE
- **Path:** `/candidate/id`
- **Method Name:** `deleteCandidateUseId(String userId)`
- **Authentication:** Required
- **Request Parameters (Query String):**
  - `userId` (String): UUID of candidate (required)
- **Response Body:**
  - Success: "Xóa User thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Deleted successfully
  - 400: Invalid UUID format
  - 500: Server error
- **Validation:**
  - userId must be valid UUID format
- **Business Rules:**
  - Deletes all candidate data from system
  - May cascade delete related records (applications, CVs, etc.)

---

### 4. Job Controller (`/job`)

#### 4.1 Get Job by ID
- **HTTP Method:** GET
- **Path:** `/job/id`
- **Method Name:** `getJob(int jobId)`
- **Authentication:** Optional
- **Request Parameters (Query String):**
  - `jobId` (Integer): Job ID (required)
- **Response Body:**
  ```json
  {
    "title": "Software Engineer",
    "company": "Tech Company",
    "location": "Hà Nội|Hồ Chí Minh|Đà Nẵng",
    "salaryText": "Thỏa thuận|string",
    "salaryMin": 10000000,
    "salaryMax": 20000000,
    "department": "Engineering",
    "quantity": 5,
    "description": "Job description",
    "tags": "Java,Spring,SQL",
    "deadline": "2024-12-31",
    "active": true,
    "status": "ACTIVE|CLOSED",
    "createdAt": "2024-01-01",
    "updatedAt": "2024-01-15"
  }
  ```
- **HTTP Status Codes:**
  - 200: Success
  - 400: Job not found or invalid ID
  - 500: Server error

#### 4.2 Create New Job
- **HTTP Method:** POST
- **Path:** `/job`
- **Method Name:** `createJob(JobPostRequest request)`
- **Authentication:** Required (HR/Admin only)
- **Request Body:**
  ```json
  {
    "title": "Software Engineer",
    "company": "Tech Company",
    "location": "Hà Nội",
    "salary": "15000000-20000000",
    "deadline": "2024-12-31",
    "quantity": 3,
    "tags": "Java,Spring,PostgreSQL"
  }
  ```
- **Request Parameters:**
  - `title` (String): Job title (required, validated)
  - `company` (String): Company name (required, validated)
  - `location` (String): Location from enum (required, must match JobLocation)
  - `salary` (String): Salary range e.g., "10000000-20000000" or single value (optional)
  - `deadline` (LocalDate): Application deadline (required, min 2 days from now)
  - `quantity` (Integer): Number of positions (required, minimum 2)
  - `tags` (String): Comma-separated skills (optional)
- **Response Body:**
  - Success: "Thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Job created
  - 400: Validation error
  - 500: Server error
- **Validation:**
  - Title: Valid job title format
  - Company: Valid company name format
  - Location: Must match one of JobLocation enum values
  - Quantity: Minimum 2 positions
  - Salary: Valid number format or range format
  - Deadline: Minimum 2 days from current date
  - Tags: Comma-separated alphanumeric values
- **Business Rules:**
  - Department defaults to "Other"
  - Active status defaults to true
  - Salary parsing: handles single value, range, or "Thỏa thuận"
  - Tags are split and stored as array

#### 4.3 Update Job
- **HTTP Method:** PATCH
- **Path:** `/job/{jobId}`
- **Method Name:** `updateJob(int jobId, JobPatchRequest request)`
- **Authentication:** Required
- **Request Parameters:**
  - `jobId` (Integer): Job ID in path (required)
- **Request Body:**
  ```json
  {
    "title": "Senior Software Engineer",
    "Deadline": "2024-12-31T00:00:00Z"
  }
  ```
- **Request Parameters:**
  - `title` (String): New job title (optional)
  - `Deadline` (Instant): New deadline (optional)
- **Response Body:**
  - Success: "Thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Updated successfully
  - 400: Invalid request or no fields provided
  - 500: Server error
- **Validation:**
  - Request must not be null
  - At least one field (title or deadline) must be provided
- **Business Rules:**
  - Only provided fields are updated
  - Tracks modified fields for selective update

#### 4.4 Delete Job
- **HTTP Method:** DELETE
- **Path:** `/job`
- **Method Name:** `deleteJob(int jobId)`
- **Authentication:** Required
- **Request Parameters (Query String):**
  - `jobId` (Integer): Job ID to delete (required)
- **Response Body:**
  - Success: "Thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Deleted successfully
  - 400: Job not found
  - 500: Server error
- **Business Rules:**
  - Job record is removed from database
  - May cascade delete related records (applications, etc.)

---

### 5. Skill Controller (`/skill`)

#### 5.1 Create New Skill
- **HTTP Method:** POST
- **Path:** `/skill`
- **Method Name:** `newSkill(String skill_name)`
- **Authentication:** Required
- **Request Body:**
  - Raw string: "Java"
- **Request Parameters:**
  - `skill_name` (String): Skill name (required, validated)
- **Response Body:**
  - Success: "Tạo thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Skill created
  - 400: Validation error
  - 500: Server error
- **Validation:**
  - Skill name must be valid format

#### 5.2 Get Skill by ID
- **HTTP Method:** GET
- **Path:** `/skill/{skillId}`
- **Method Name:** `getSkill(int skillId)`
- **Authentication:** Optional
- **Request Parameters:**
  - `skillId` (Integer): Skill ID in path (required)
- **Response Body:**
  ```json
  {
    "skill_id": 1,
    "skill_name": "Java",
    "created_at": "2024-01-01T10:00:00Z"
  }
  ```
- **HTTP Status Codes:**
  - 200: Success
  - 400: Skill not found
  - 500: Server error

#### 5.3 Update Skill
- **HTTP Method:** PATCH
- **Path:** `/skill/{skillId}`
- **Method Name:** `updateSkill(int skillId, SkillPatchRequest request)`
- **Authentication:** Required
- **Request Parameters:**
  - `skillId` (Integer): Skill ID in path (required)
- **Request Body:**
  ```json
  {
    "name": "Java Spring"
  }
  ```
- **Request Parameters:**
  - `name` (String): New skill name (optional)
- **Response Body:**
  - Success: "Cập nhật thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Updated successfully
  - 400: Invalid request
  - 500: Server error
- **Validation:**
  - Request must not be null
  - Name field must be provided
- **Business Rules:**
  - Only provided fields are updated

#### 5.4 Delete Skill
- **HTTP Method:** DELETE
- **Path:** `/skill/{skillId}`
- **Method Name:** `deleteSkill(int skillId)`
- **Authentication:** Required
- **Request Parameters:**
  - `skillId` (Integer): Skill ID in path (required)
- **Response Body:**
  - Success: "Xóa thành công"
  - Error: Error message
- **HTTP Status Codes:**
  - 200: Deleted successfully
  - 400: Skill not found
  - 500: Server error

---

## Data Transfer Objects

### Request DTOs

#### LoginRequest
- **Class Name:** `LoginRequest`
- **Fields:**
  | Field | Type | Nullable | Validation | Notes |
  |-------|------|----------|-----------|-------|
  | email | String | No | Valid email format | Required |
  | password | String | No | Valid password format | Required |

#### CandidateSignupRequest (Record)
- **Class Name:** `CandidateSignupRequest`
- **Fields:**
  | Field | Type | Nullable | Validation | Notes |
  |-------|------|----------|-----------|-------|
  | password | String | No | Valid password format | Required |
  | email | String | No | Valid email, unique | Required |
  | fullname | String | No | Not empty | Required |

#### ApplicationsPostRequest (Record)
- **Class Name:** `ApplicationsPostRequest`
- **Fields:**
  | Field | Type | Nullable | Validation | Notes |
  |-------|------|----------|-----------|-------|
  | jobId | int | No | Valid job ID | Required, positive integer |
  | email | String | No | Valid email | Required |

#### ApplicationPatchRequest
- **Class Name:** `ApplicationPatchRequest`
- **Fields:**
  | Field | Type | Nullable | Validation | Notes |
  |-------|------|----------|-----------|-------|
  | application_id | int | No | Valid ID | Required, > 0 |
  | status | ApplicationStatus | Yes | Enum value | Optional |
  | stage | PipelineStage | Yes | Enum value | Optional |
  | adminNote | String | Yes | Any string | Optional |
  | statusProvided | boolean | No | - | Internal flag |
  | stageProvided | boolean | No | - | Internal flag |
  | adminNoteProvided | boolean | No | - | Internal flag |

#### CandidatePatchRequest
- **Class Name:** `CandidatePatchRequest`
- **Extends:** `dto`
- **Fields:**
  | Field | Type | Nullable | Validation | Notes |
  |-------|------|----------|-----------|-------|
  | email | String | Yes | Valid email if provided | Cannot be deleted |
  | full_name | String | Yes | - | Optional |
  | username | String | Yes | - | Optional |
  | bio | String | Yes | - | Optional |
  | avatarUrl | String | Yes | - | Optional |
  | address | String | Yes | - | Optional |
  | phone | String | Yes | - | Optional |
  | twoFactorEnabled | Boolean | Yes | - | Cannot be null if provided |
  | [Field]Provided | boolean | No | - | Internal flags for each field |

#### JobPostRequest (Record)
- **Class Name:** `JobPostRequest`
- **Fields:**
  | Field | Type | Nullable | Validation | Notes |
  |-------|------|----------|-----------|-------|
  | title | String | No | Valid job title | Required |
  | company | String | No | Valid company name | Required |
  | location | String | No | Must match JobLocation enum | Required |
  | salary | String | Yes | Valid number or range format | Optional, e.g., "10000000-20000000" |
  | deadline | LocalDate | No | Min 2 days from now | Required |
  | quantity | Integer | No | Minimum 2 | Required |
  | tags | String | Yes | Comma-separated skills | Optional, alphanumeric |

#### JobPatchRequest
- **Class Name:** `JobPatchRequest`
- **Fields:**
  | Field | Type | Nullable | Validation | Notes |
  |-------|------|----------|-----------|-------|
  | title | String | Yes | - | Optional |
  | Deadline | Instant | Yes | - | Optional |
  | titleProvided | boolean | No | - | Internal flag |
  | deadlineProvided | boolean | No | - | Internal flag |

#### SkillPatchRequest
- **Class Name:** `SkillPatchRequest`
- **Fields:**
  | Field | Type | Nullable | Validation | Notes |
  |-------|------|----------|-----------|-------|
  | name | String | Yes | Valid skill name | Optional |
  | nameProvided | boolean | No | - | Internal flag |

### Response DTOs

#### LoginResponse
- **Class Name:** `LoginResponse`
- **Fields:**
  | Field | Type | Notes |
  |-------|------|-------|
  | token | String | JWT token (Bearer format), retrieved once only |
  | display_code | String | User display code |
  | full_name | String | User's full name |
  | bio | String | Biography (nullable) |
  | address | String | Address (nullable) |
  | email | String | Email address |
  | phone | String | Phone number (nullable) |
  | role | String | User role (Admin/HR/Candidate) |
- **Annotation:** `@JsonInclude(Include.NON_NULL)` - null fields not included in JSON

#### ApplicationGetResponse
- **Class Name:** `ApplicationGetResponse`
- **Fields:**
  | Field | Type | Notes |
  |-------|------|-------|
  | id | int | Application ID |
  | userId | UUID | Applicant's user ID |
  | jobId | int | Applied job ID |
  | cvId | int | CV ID used in application |
  | status | ApplicationStatus | Current application status |
  | stage | PipelineStage | Pipeline stage |
  | admin_note | String | Admin notes (nullable) |
  | applied_at | Instant | Application timestamp |
  | updated_at | Instant | Last update timestamp |

#### CandidateGetResponse
- **Class Name:** `CandidateGetResponse`
- **Fields:**
  | Field | Type | Notes |
  |-------|------|-------|
  | userId | UUID | Candidate's user ID |
  | displayCode | String | Display code (e.g., CAP001) |
  | role | AccountRole | Account role |
  | fullname | String | Full name |
  | email | String | Email address |
  | phone | String | Phone number (nullable) |
  | status | AccountStatus | Account status (Active/Deactivate) |

#### JobGetResponse
- **Class Name:** `JobGetResponse`
- **Fields:**
  | Field | Type | Notes |
  |-------|------|-------|
  | title | String | Job title |
  | company | String | Company name |
  | location | String | Job location |
  | salaryText | String | Salary text representation |
  | salaryMin | BigDecimal | Minimum salary (nullable) |
  | salaryMax | BigDecimal | Maximum salary (nullable) |
  | department | String | Department |
  | quantity | int | Number of positions |
  | description | String | Job description |
  | tags | String | Skills as comma-separated string |
  | deadline | LocalDate | Application deadline |
  | active | boolean | Whether job is active |
  | status | JobStatus | Job status |
  | createdAt | LocalDate | Creation date |
  | updatedAt | LocalDate | Last update date |

#### CandidatePatchResponse
- **Class Name:** `CandidatePatchResponse`
- **Extends:** `dto`
- **Fields:**
  | Field | Type | Notes |
  |-------|------|-------|
  | full_name | String | Full name (nullable) |
  | bio | String | Biography (nullable) |
  | address | String | Address (nullable) |
  | username | String | Username (nullable) |
  | email | String | Email (nullable) |
  | phone | String | Phone (nullable) |
  | twoFactorEnabled | Boolean | Two-factor auth status (nullable) |
- **Annotation:** `@JsonInclude(Include.NON_NULL)` - null fields not included in JSON

#### SkillGetResponse
- **Class Name:** `SkillGetResponse`
- **Fields:**
  | Field | Type | Notes |
  |-------|------|-------|
  | skill_id | int | Skill ID |
  | skill_name | String | Skill name |
  | created_at | Instant | Creation timestamp |

#### JobPostResponse
- **Class Name:** `JobPostResponse`
- **Status:** Empty class (no fields defined)

#### CandidateSignupResponse
- **Class Name:** `CandidateSignupResponse`
- **Status:** Implementation not shown in codebase

#### JobDeleteResponse
- **Class Name:** `JobDeleteResponse`
- **Status:** Implementation not shown in codebase

---

## Exception Handling

### Exception Classes

#### BusinessException
- **Class Name:** `BusinessException`
- **Extends:** `RuntimeException`
- **Constructor:** `BusinessException(String error)`
- **Usage:** Thrown for validation errors, business rule violations, and known error conditions
- **Examples:**
  - "Email không được để trống" (Email cannot be empty)
  - "tài khoản không tồn tại" (Account does not exist)
  - "Email đã được đăng ký từ trước" (Email already registered)
  - "đơn ứng tuyển không tồn tại" (Application does not exist)
  - "Không có trường cập nhật hợp lệ" (No valid update fields)
  - "thiếu cookie" (Missing cookie)

### Error Response Format

Most endpoints return HTTP status codes with error messages:
```json
{
  "error": "Error message"
}
```

#### Response Status Code Map
| Status | Meaning | Typical Error |
|--------|---------|---------------|
| 200 | Success | N/A |
| 400 | Bad Request | Validation error, business rule violation |
| 500 | Internal Server Error | Database error, unexpected exception |

---

## Business Logic & Validation Rules

### Authentication Service (`AuthService`)

#### Login Process
1. Check if account exists in database
2. Send login credentials to Supabase Authentication
3. Retrieve user account from local database
4. Return access token and user info
5. Token used for subsequent requests

#### Candidate Signup Process
1. Validate email does not already exist
2. Create account in Supabase Authentication
3. Create SignupAccount object from Supabase response
4. Call CandidateService to save to database
5. Generate display ID automatically

### Application Service (`ApplicationService`)

#### Create Application
1. Retrieve user's primary CV
2. Validate CV exists
3. Create new application record with:
   - User ID
   - Job ID
   - CV ID
   - Default status: NEW_APPLIED
   - Default stage: NEW
4. Increment job application quantity
5. Set applied_at timestamp

#### Update Application
1. Retrieve existing application
2. For each provided field:
   - Update the value
   - Track field name in modifyField set
3. Update database with selective fields
4. Update updated_at timestamp

#### Delete Application
1. Check application exists
2. If not exists, throw BusinessException
3. Delete application record

### Candidate Service (`CandidateService`)

#### Add Candidate
1. Generate display ID using DisplayIDGenerator
2. Create Candidate object
3. Save to database
4. Throw exception on SQL error

#### Edit Candidate Profile
1. Retrieve existing candidate record
2. For each provided field:
   - Validate field constraints
   - Update candidate object
   - Add field name to fields set
3. Email converted to lowercase if updated
4. Email: Cannot be deleted (must have value if provided)
5. Two-factor enabled: Cannot be null if provided
6. Call repository update with selective fields
7. Track which fields were modified

#### Validation Rules per Field
- **Email:** Must not be empty if provided
- **Full Name:** Any non-null value accepted
- **Username:** Any non-null value accepted
- **Bio:** Any value accepted
- **Avatar URL:** Any value accepted
- **Address:** Any value accepted
- **Phone:** Any value accepted
- **Two Factor Enabled:** Cannot be null, must be Boolean

### Job Service (`JobService`)

#### Create Job
1. **Title Validation:**
   - Must not be empty
   - Must be valid format (via Validator.isJobTitleValid)

2. **Quantity Validation:**
   - Minimum 2 positions
   - Throws exception if < 2

3. **Company Validation:**
   - Must not be empty
   - Must be valid format (via Validator.isCompanyNameValid)

4. **Salary Processing:**
   - If empty: set to "Thỏa thuận"
   - If contains "-": parse as range (min-max)
   - Otherwise: parse as single minimum value
   - If invalid number format: throw exception

5. **Tags/Skills Processing:**
   - If empty: default to ["Other"]
   - Must be comma-separated alphanumeric
   - Throws exception if invalid format
   - Split and stored as ArrayList

6. **Deadline Validation:**
   - Must be at least 2 days from current date
   - Check: deadline.minusDays(2).isAfter(LocalDate.now())
   - Throws exception if deadline too soon

7. **Location Validation:**
   - Must match one of JobLocation enum values:
     - HA_NOI (Hà Nội)
     - HO_CHI_MINH (Hồ Chí Minh)
     - DA_NANG (Đà Nẵng)
   - Case-insensitive comparison
   - Throws BusinessException if not found

8. **Default Values:**
   - Department: "Other"
   - Active: true

#### Update Job
1. Retrieve existing job
2. Update only provided fields
3. For each update field, add to modifyField set
4. Call repository update with selective fields

#### Delete Job
1. Delete job record and related data

### Skill Service (`SkillService`)

#### Create Skill
1. Validate skill name (via Validator.isSkillNameValid)
2. Create new Skill object
3. Save to database

#### Update Skill
1. Retrieve existing skill
2. If name provided:
   - Update skill name
   - Add to fields set
3. If fields updated, call repository update

#### Delete Skill
1. Delete skill record

### Validation Rules

#### Email Validation
- Required to be valid email format
- Email converted to lowercase
- Checked for uniqueness on signup

#### Password Validation
- Must meet password strength requirements
- Specific rules implemented in Validator.isPasswordValid()

#### UUID Validation
- User IDs must be valid UUID format
- Throws BusinessException if invalid

#### Job Title Validation
- Must be non-empty
- Must match valid title pattern (per Validator)

#### Company Name Validation
- Must be non-empty
- Must match valid company name pattern (per Validator)

#### Skill Name Validation
- Must be non-empty
- Must match valid skill name pattern (per Validator)

---

## Enumerations

### ApplicationStatus
```
NEW_APPLIED("Mới nộp") - Application just submitted
SCREENING("Đang xem xét") - Under review
INTERVIEW("Phỏng vấn") - Interview stage
OFFERED("Đã offer") - Offer extended
DECLINED("Từ chối") - Application declined
```

### PipelineStage
```
NEW("Mới nộp") - New application
SCREENING("Đang sàng lọc") - Initial screening
INTERVIEW("Phỏng vấn") - Interview stage
REVIEW("Đánh giá lại") - Under review
OFFER("Mời nhận việc") - Offer extended
HIRED("Nhận việc") - Hired
```

### AccountRole
```
Admin - Administrator access
HR - Human Resources staff
Candidate - Job candidate
```

### AccountStatus
```
Active - Active account
Deactivate - Deactivated account
```

### JobLocation
```
HA_NOI("Hà Nội") - Hanoi
HO_CHI_MINH("Hồ Chí Minh") - Ho Chi Minh City
DA_NANG("Đà Nẵng") - Da Nang
```

---

## API Usage Examples

### Example 1: Candidate Registration and Login

**Step 1: Signup**
```bash
POST /auth/signup/candidate
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "fullname": "John Doe"
}

Response: 200
{
  "message": "ok"
}
```

**Step 2: Login**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}

Response: 200
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Body:
{
  "display_code": "CAP001",
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "role": "Candidate",
  "bio": null,
  "address": null,
  "phone": null
}
```

### Example 2: Job Application

**Step 1: Apply for Job**
```bash
POST /application
Content-Type: application/json
Cookie: eyJhbGciOiJIUzI1NiIs...

{
  "jobId": 1,
  "email": "john.doe@example.com"
}

Response: 200
{
  "message": "Thành công"
}
```

**Step 2: Get Application Details**
```bash
GET /application/id
Content-Type: application/json

{
  "applicationId": 1
}

Response: 200
{
  "id": 1,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "jobId": 1,
  "cvId": 1,
  "status": "NEW_APPLIED",
  "stage": "NEW",
  "admin_note": null,
  "applied_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Example 3: Profile Update

**Update Candidate Profile**
```bash
PATCH /candidate/id?userId=550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "full_name": "John William Doe",
  "phone": "0912345678",
  "address": "123 Main St, Hanoi",
  "bio": "Experienced software developer"
}

Response: 200
{
  "message": "Cập nhật thành công"
}
```

---

## TODO Items and Known Issues

### Authentication Service
- TODO: Implement more comprehensive password strength validation

### Job Service
- **BUG:** In `add()` method, `new Job()` is passed instead of `newJob` to repository
  - Should be: `jobRepo.create(newJob);`
  - Currently: `jobRepo.create(new Job());`

### Candidate Service
- TODO: Implement CV file upload workflow with validation

### Global Improvements Needed (from TODOs in codebase)
- Create `@ControllerAdvice` for centralized exception handling
- Create consistent `APIResponse<T>` wrapper for all endpoints
- Replace `System.out.println()` with proper logging framework (SLF4J)
- Implement proper pagination for list endpoints

---

## Summary Statistics

| Item | Count |
|------|-------|
| Total Controllers | 5 |
| Total Endpoints | 14 |
| Total Request DTOs | 8 |
| Total Response DTOs | 9 |
| Services | 5 |
| Exception Classes | 1 |
| Enumerations | 5 |

