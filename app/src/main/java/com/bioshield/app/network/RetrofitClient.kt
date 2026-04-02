package com.bioshield.app.network

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private var retrofit: Retrofit? = null
    var api: ApiService? = null
    private var currentBaseUrl: String = ""
    
    // Token provider function that must be set before making authenticated requests
    private var _tokenProvider: (() -> String)? = null

    fun updateBaseUrl(newUrl: String) {
        // Ensure URL ends with a trailing slash
        val safeUrl = if (newUrl.endsWith("/")) newUrl else "$newUrl/"
        
        // Only rebuild if the URL actually changed
        if (safeUrl == currentBaseUrl && retrofit != null) {
            return
        }
        
        currentBaseUrl = safeUrl
        
        // Create OkHttpClient with interceptors
        val httpClientBuilder = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
        
        // Add logging interceptor in debug mode
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        httpClientBuilder.addInterceptor(loggingInterceptor)
        
        // Add auth interceptor if token provider is available
        _tokenProvider?.let { provider ->
            httpClientBuilder.addInterceptor(AuthInterceptor(provider))
        }
        
        val httpClient = httpClientBuilder.build()
        
        // Build Retrofit instance
        retrofit = Retrofit.Builder()
            .baseUrl(safeUrl)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            
        api = retrofit?.create(ApiService::class.java)
    }
    
    fun getApiService(): ApiService {
        return api ?: throw IllegalStateException("RetrofitClient not initialized. Call updateBaseUrl first.")
    }
    
    fun setTokenProvider(provider: () -> String) {
        _tokenProvider = provider
        // Rebuild retrofit to apply the new token provider
        if (currentBaseUrl.isNotEmpty()) {
            updateBaseUrl(currentBaseUrl)
        }
    }
}
