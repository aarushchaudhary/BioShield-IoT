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
    @com.google.gson.annotations.SerializedName("user_id") val userId: String,
    @com.google.gson.annotations.SerializedName("feature_vector") val featureVector: List<Float>
)

data class EnrollResponse(
    val success: Boolean,
    val message: String
)

// Verify
data class VerifyRequest(
    @com.google.gson.annotations.SerializedName("user_id") val userId: String,
    @com.google.gson.annotations.SerializedName("feature_vector") val featureVector: List<Float>
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