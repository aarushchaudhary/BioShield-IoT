package com.bioshield.app.network

import com.bioshield.app.model.*
import retrofit2.Call
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {

    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @GET("health")
    suspend fun health(): Response<Map<String, String>>
    
    // Synchronous version for connection testing
    @GET("health")
    fun healthSync(): Call<Map<String, String>>

    @POST("biometric/enroll")
    suspend fun enroll(
        @Body request: EnrollRequest
    ): Response<BiometricResponse>

    @POST("biometric/verify")
    suspend fun verify(
        @Body request: VerifyRequest
    ): Response<VerifyResponse>

    @POST("biometric/cancel")
    suspend fun cancel(
        @Body request: CancelRequest
    ): Response<BiometricResponse>
}