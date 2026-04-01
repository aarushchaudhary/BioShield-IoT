package com.bioshield.app.network

import okhttp3.Interceptor
import okhttp3.Response

/**
 * Interceptor to add Authorization header to all requests.
 * The token should be managed centrally and passed in.
 */
class AuthInterceptor(private val tokenProvider: () -> String) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Get the current token from the provider
        val token = tokenProvider()
        
        // Only add Authorization header if we have a token and the request doesn't already have one
        val request = if (token.isNotEmpty() && originalRequest.header("Authorization") == null) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }
        
        return chain.proceed(request)
    }
}
