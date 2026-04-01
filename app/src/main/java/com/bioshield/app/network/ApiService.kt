package com.bioshield.app.network

import com.bioshield.app.model.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface ApiService {

    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @POST("biometric/enroll")
    suspend fun enroll(
        @Header("Authorization") token: String,
        @Body request: EnrollRequest
    ): Response<EnrollResponse>

    @POST("biometric/verify")
    suspend fun verify(
        @Header("Authorization") token: String,
        @Body request: VerifyRequest
    ): Response<VerifyResponse>

    @POST("biometric/cancel")
    suspend fun cancel(
        @Header("Authorization") token: String,
        @Body request: CancelRequest
    ): Response<CancelResponse>
}