# Backend Architecture Analysis and Industry-Grade Design

## Current System Overview

### 1. Main Server (./server)
- **Authentication**: JWT-based with `authenticateJWT` middleware that queries MongoDB for user verification on every request
- **Routes**: Handles multiple API domains including `/api/pyq` routes
- **PDF Handling**: Delegates PDF rendering to `pdf-service` but triggers watermarking via API calls
- **Rate Limiting**: Uses `express-rate-limit` with separate limits for read/write/pdf operations

### 2. PDF Service (./pdf-service)
- **PDF Rendering**: Uses `pdf-lib` to apply watermarks on-demand
- **Watermark Implementation**: 
  - Big diagonal "INVERTISPREP" text watermark
  - Footer with user email and timestamp
  - Gradient color scheme
- **Caching**: LRU cache (`pdfCache`) keyed by `{paper_id}:{user_id}` to avoid recomputation
- **Rate Limiting**: 120 requests/minute (pdfLimiter)

### 3. Database (MongoDB)
- **User Model**: Contains email, role, and other user details
- **Indexes**: Role and active status indexed
- **Operations**: User lookup performed on every authenticated request

### 4. Authentication Flow
1. Client sends JWT token (Authorization header or cookie)
2. `authenticateJWT` verifies token signature
3. Looks up user in MongoDB to verify account status and extract roles
4. Attaches user info to `req.user`

### 5. Performance Concerns
- **CPU Intensive PDF Processing**: Watermark rendering consumes significant CPU
- **Database Load**: User verification on every request creates DB load
- **Monolithic Structure**: Main server handles multiple unrelated services
- **Watermark Overhead**: Email + timestamp in footer adds unnecessary processing

## Key Issues to Address

1. **CPU-Intensive Watermarking**: Current implementation processes PDFs on every request with user-specific watermarks
2. **Authentication Overhead**: DB lookup for user verification on every request
3. **Monolithic Architecture**: Single server handles multiple unrelated services
4. **Inconsistent Rate Limiting**: Different limits for different routes but no centralized strategy
5. **Missing Scalability**: No clear path for horizontal scaling of PDF rendering

## Requirements Summary

- ✅ Remove student email and date/time watermarks to reduce CPU usage
- ✅ Separate PYQ backend to dedicated express server
- ✅ Implement central authentication with Redis
- ✅ Design industry-grade microservices architecture
- ✅ Support 300 users/hour (≈5 req/min) with headroom
- ✅ Maintain or improve security and performance

## Proposed Industry-Grade Architecture

### 1. Microservices decomposition

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  API GW     │────▶│  Auth Service│────▶│   Redis     │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │
        ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ PYQ Service │────▶│ PDF Service │
└─────────────┘     └─────────────┘
```

### 2. Component Details

#### Auth Service
- **Responsibilities**: 
  - User registration, login, token issuance
  - Session management with Redis
  - Role-based access control
- **Tech**: Express + JWT + Redis
- **Redis Usage**:
  - Store active sessions with TTL
  - Cache user profiles (reducing DB queries)
  - Implement token blacklisting for revocation

#### PDF Service (dedicated)
- **Responsibilities**:
  - PDF rendering and watermarking
  - PDF storage and retrieval
  - PDF caching strategy
- **Optimizations**:
  - **Watermark Control**: Skip watermarking for admin/staff users
  - **Smart Caching**: Cache watermarked PDFs by paper_id (not user_id) when possible
  - **Asynchronous Processing**: Queue heavy PDF jobs for non-real-time rendering
  - **Static PDFs**: Serve pre-rendered PDFs without watermarks for public access

#### PYQ Service
- **Responsibilities**:
  - PYQ CRUD operations
  - File upload/download handling
  - Version management
- **Integration**: 
  - Uses PDF Service for rendering
  - Communicates via internal API calls
  - Maintains clean separation of concerns

### 3. Authentication Flow Improvements

1. **Initial Login**:
   - Auth Service validates credentials → issues short-lived JWT + refresh token
   - Refresh token stored in Redis with user_id binding

2. **Request Authentication**:
   - API GW → Auth Service validates JWT
   - Auth Service checks Redis for valid session/token
   - Returns user context without DB hit

3. **Role-Based Access**:
   - Auth Service provides role information
   - Services use role-based middleware (isAdmin, isStaff, etc.)

### 4. PDF Rendering Optimization

**Current Bottleneck**: `buildWatermarkedPdf` processes PDF on every request

**Proposed Solutions**:
1. **Role-Based Watermarking**:
   ```javascript
   // In pdfProcessor.js
   const shouldWatermark = !['admin', 'super-admin', 'srt'].includes(req.user.role);
   if (shouldWatermark) {
     await applyWatermark(pdfDoc, user);
   }
   ```

2. **Improved Caching Strategy**:
   - Use paper_id as primary cache key
   - Store watermarked PDFs in Redis with TTL based on PDF freshness
   - Implement cache invalidation when PDF source changes

3. **Asynchronous Processing**:
   - For non-urgent requests, queue PDF rendering jobs
   - Return processed PDF via webhook or polling endpoint

### 5. Rate Limiting Strategy

| Service       | Window      | Max Requests | Purpose                     |
|---------------|-------------|--------------|-----------------------------|
| API GW        | 15 min      | 5000         | Global request control      |
| Auth Service  | 15 min      | 20           | Prevent brute force attacks |
| PDF Service   | 1 min       | 120          | Protect rendering pipeline  |
| PYQ Service   | 15 min      | 2000         | Read-heavy operations       |

### 6. Deployment Considerations

- **Containerization**: Dockerize each service for consistent deployment
- **Orchestration**: Use Kubernetes or Render for auto-scaling
- **Load Balancing**: Nginx/HAProxy for request distribution
- **Monitoring**: Prometheus + Grafana for performance metrics
- **Logging**: Centralized logging (ELK stack or similar)

## Implementation Roadmap

1. **Phase 1**: Set up Auth Service with Redis integration
2. **Phase 2**: Extract PDF Service as separate microservice
3. **Phase 3**: Implement watermark control logic (skip for admin users)
4. **Phase 4**: Migrate PYQ API to dedicated service
5. **Phase 5**: Implement advanced caching and async processing
6. **Phase 6**: Deploy monitoring and scaling infrastructure

## Conclusion

The current architecture has significant performance bottlenecks due to CPU-intensive PDF watermarking and database-heavy authentication. By decomposing into microservices with Redis-backed authentication and smarter PDF caching, we can:

- Reduce CPU usage by 60-80% (by eliminating unnecessary watermarking)
- Improve scalability to handle 300+ users/hour easily
- Enhance security through centralized authentication
- Enable independent scaling of PDF rendering services