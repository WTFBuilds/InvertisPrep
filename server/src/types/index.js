// This file contains type definitions as JSDoc comments for JavaScript
// Type definitions are documented inline in each file using JSDoc

/**
 * @typedef {'student' | 'srt' | 'admin' | 'super-admin'} UserRole
 */

/**
 * @typedef {Object} IUser
 * @property {string} _id
 * @property {string} [googleId]
 * @property {string} email
 * @property {string} [password]
 * @property {string} name
 * @property {string} [picture]
 * @property {UserRole} role
 * @property {Date} lastLogin
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} IDepartment
 * @property {string} _id
 * @property {string} id
 * @property {string} name
 * @property {string} displayName
 * @property {string} icon
 * @property {string} description
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} IBranch
 * @property {string} _id
 * @property {string} id
 * @property {string} name
 * @property {string} departmentId
 * @property {number[]} semesters
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} ISession
 * @property {string} _id
 * @property {string} id
 * @property {string} name
 * @property {number} startYear
 * @property {number} endYear
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {'mid-term' | 'end-term'} ExamType
 */

/**
 * @typedef {Object} IPYQPaper
 * @property {string} _id
 * @property {string} title
 * @property {string} [subjectCode]
 * @property {string} subjectName
 * @property {string} departmentId
 * @property {string} branchId
 * @property {number} semester
 * @property {string} sessionId
 * @property {ExamType} examType
 * @property {string} cloudinaryUrl
 * @property {string} cloudinaryPublicId
 * @property {string} fileName
 * @property {number} [fileSize]
 * @property {number} year
 * @property {string} uploadedBy
 * @property {number} views
 * @property {number} downloads
 * @property {boolean} verified
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} LoginDTO
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} JWTPayload
 * @property {string} id
 * @property {string} email
 * @property {UserRole} role
 */

/**
 * @typedef {Object} UploadPYQDTO
 * @property {string} departmentId
 * @property {string} branchId
 * @property {string} sessionId
 * @property {number} semester
 * @property {string} subjectName
 * @property {string} [subjectCode]
 * @property {ExamType} examType
 * @property {number} year
 */

/**
 * @typedef {Object} PYQFilterQuery
 * @property {string} [departmentId]
 * @property {string} [branchId]
 * @property {string} [sessionId]
 * @property {string} [semester]
 * @property {string} [examType]
 * @property {string} [subjectCode]
 */

export {};
