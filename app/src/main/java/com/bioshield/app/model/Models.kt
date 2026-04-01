package com.bioshield.app.model


// Auth
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    @com.google.gson.annotations.SerializedName("access_token") val token: String,
    @com.google.gson.annotations.SerializedName("token_type") val tokenType: String = "bearer",
    @com.google.gson.annotations.SerializedName("expires_in") val expiresIn: Int = 3600,
    @com.google.gson.annotations.SerializedName("user_id") val userId: String?
)

// Biometric — API uses `status` + `message` (see BiometricResponse / VerifyResponse schemas)
data class BiometricResponse(
    val status: String,
    val message: String,
    val biohash: String? = null
)

data class EnrollRequest(
    @com.google.gson.annotations.SerializedName("user_id") val userId: String,
    @com.google.gson.annotations.SerializedName("feature_vector") val featureVector: List<Float>
)

typealias EnrollResponse = BiometricResponse

data class VerifyRequest(
    @com.google.gson.annotations.SerializedName("user_id") val userId: String,
    @com.google.gson.annotations.SerializedName("feature_vector") val featureVector: List<Float>
)

data class VerifyResponse(
    val status: String,
    val message: String,
    val biohash: String? = null,
    @com.google.gson.annotations.SerializedName("match_score") val matchScore: Float,
    @com.google.gson.annotations.SerializedName("is_match") val isMatch: Boolean
)

data class CancelRequest(
    @com.google.gson.annotations.SerializedName("user_id") val userId: String
)

typealias CancelResponse = BiometricResponse
