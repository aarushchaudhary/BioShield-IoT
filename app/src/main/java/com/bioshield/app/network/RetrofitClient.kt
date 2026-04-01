package com.bioshield.app.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private var retrofit: Retrofit? = null
    var api: ApiService? = null

    fun updateBaseUrl(newUrl: String) {
        // Ensure URL ends with a trailing slash
        val safeUrl = if (newUrl.endsWith("/")) newUrl else "$newUrl/"
        
        retrofit = Retrofit.Builder()
            .baseUrl(safeUrl)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            
        api = retrofit?.create(ApiService::class.java)
    }
}