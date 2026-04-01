package com.bioshield.app.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bioshield.app.model.*
import com.bioshield.app.network.RetrofitClient
import com.google.gson.Gson
import kotlinx.coroutines.launch
import retrofit2.Response

class BioShieldViewModel : ViewModel() {

    var token: String = ""
    var userId: String = ""
    var isEnrolled: Boolean = false

    private val _loginResult = MutableLiveData<Result<LoginResponse>>()
    val loginResult: LiveData<Result<LoginResponse>> = _loginResult

    private val _enrollResult = MutableLiveData<Result<BiometricResponse>>()
    val enrollResult: LiveData<Result<BiometricResponse>> = _enrollResult

    private val _verifyResult = MutableLiveData<Result<VerifyResponse>>()
    val verifyResult: LiveData<Result<VerifyResponse>> = _verifyResult

    private val _cancelResult = MutableLiveData<Result<BiometricResponse>>()
    val cancelResult: LiveData<Result<BiometricResponse>> = _cancelResult

    init {
        // Set up the token provider for the interceptor
        RetrofitClient.setTokenProvider { token }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            try {
                val api = RetrofitClient.api
                    ?: return@launch _loginResult.postValue(
                        Result.failure(Exception("API not configured — set backend URL first"))
                    )
                val response = api.login(LoginRequest(email, password))
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    token = body.token
                    userId = body.userId.orEmpty()
                    // Update the token provider so subsequent requests use the new token
                    RetrofitClient.setTokenProvider { token }
                    _loginResult.postValue(Result.success(body))
                } else {
                    _loginResult.postValue(
                        Result.failure(Exception(httpErrorDetail(response) ?: "Login failed (${response.code()})"))
                    )
                }
            } catch (e: Exception) {
                _loginResult.postValue(Result.failure(e))
            }
        }
    }

    fun enroll(featureVector: List<Float>) {
        viewModelScope.launch {
            try {
                val api = RetrofitClient.api
                    ?: return@launch _enrollResult.postValue(
                        Result.failure(Exception("API not configured"))
                    )
                val response = api.enroll(
                    EnrollRequest(userId, featureVector)
                )
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    if (body.status == "success") isEnrolled = true
                    _enrollResult.postValue(Result.success(body))
                } else {
                    _enrollResult.postValue(
                        Result.failure(Exception(httpErrorDetail(response) ?: "Enroll failed (${response.code()})"))
                    )
                }
            } catch (e: Exception) {
                _enrollResult.postValue(Result.failure(e))
            }
        }
    }

    fun verify(featureVector: List<Float>) {
        viewModelScope.launch {
            try {
                val api = RetrofitClient.api
                    ?: return@launch _verifyResult.postValue(
                        Result.failure(Exception("API not configured"))
                    )
                val response = api.verify(
                    VerifyRequest(userId, featureVector)
                )
                if (response.isSuccessful && response.body() != null) {
                    _verifyResult.postValue(Result.success(response.body()!!))
                } else {
                    _verifyResult.postValue(
                        Result.failure(Exception(httpErrorDetail(response) ?: "Verify failed (${response.code()})"))
                    )
                }
            } catch (e: Exception) {
                _verifyResult.postValue(Result.failure(e))
            }
        }
    }

    fun cancel() {
        viewModelScope.launch {
            try {
                val api = RetrofitClient.api
                    ?: return@launch _cancelResult.postValue(
                        Result.failure(Exception("API not configured"))
                    )
                val response = api.cancel(
                    CancelRequest(userId)
                )
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    if (body.status == "success") isEnrolled = false
                    _cancelResult.postValue(Result.success(body))
                } else {
                    _cancelResult.postValue(
                        Result.failure(Exception(httpErrorDetail(response) ?: "Cancel failed (${response.code()})"))
                    )
                }
            } catch (e: Exception) {
                _cancelResult.postValue(Result.failure(e))
            }
        }
    }

    private fun httpErrorDetail(response: Response<*>): String? {
        val raw = response.errorBody()?.string() ?: return null
        return try {
            val err = Gson().fromJson(raw, Map::class.java)
            when (val d = err["detail"]) {
                is String -> d
                is List<*> -> d.joinToString { (it as? Map<*, *>)?.get("msg")?.toString().orEmpty() }
                else -> raw
            }
        } catch (_: Exception) {
            raw
        }
    }
}
