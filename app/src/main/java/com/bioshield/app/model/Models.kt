package com.bioshield.app.model


// Auth
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String
)

// Enroll
data class EnrollRequest(
    val userId: String,
    val featureVector: String
)

data class EnrollResponse(
    val success: Boolean,
    val message: String
)

// Verify
data class VerifyRequest(
    val userId: String,
    val featureVector: String
)

data class VerifyResponse(
    val success: Boolean,
    val message: String,
    val matchScore: Float
)

// Cancel
data class CancelRequest(
    val userId: String
)

data class CancelResponse(
    val success: Boolean,
    val message: String
)