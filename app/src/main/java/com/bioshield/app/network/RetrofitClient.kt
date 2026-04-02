package com.bioshield.app.network

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import java.security.cert.X509Certificate

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
        
        // Enable HTTPS with self-signed certificate support (for development)
        configureTrustAllCertificates(httpClientBuilder)
        
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

    /**
     * Configure OkHttpClient to trust all certificates (for development/self-signed certs)
     * WARNING: This should only be used in development. Never use in production!
     */
    private fun configureTrustAllCertificates(httpClientBuilder: OkHttpClient.Builder) {
        try {
            val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
                override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}
                override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {}
                override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
            })

            val sslContext = SSLContext.getInstance("TLS").apply {
                init(null, trustAllCerts, java.security.SecureRandom())
            }

            httpClientBuilder.sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
            httpClientBuilder.hostnameVerifier { _, _ -> true } // Trust any hostname
        } catch (e: Exception) {
            throw RuntimeException(e)
        }
    }
}
