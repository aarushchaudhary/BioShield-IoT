package com.bioshield.app.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bioshield.app.model.*
import com.bioshield.app.network.RetrofitClient
import kotlinx.coroutines.launch

class BioShieldViewModel : ViewModel() {

    var token: String = ""
    var userId: String = ""
    var isEnrolled: Boolean = false

    private val _loginResult = MutableLiveData<Result<LoginResponse>>()
    val loginResult: LiveData<Result<LoginResponse>> = _loginResult

    private val _enrollResult = MutableLiveData<Result<EnrollResponse>>()
    val enrollResult: LiveData<Result<EnrollResponse>> = _enrollResult

    private val _verifyResult = MutableLiveData<Result<VerifyResponse>>()
    val verifyResult: LiveData<Result<VerifyResponse>> = _verifyResult

    private val _cancelResult = MutableLiveData<Result<CancelResponse>>()
    val cancelResult: LiveData<Result<CancelResponse>> = _cancelResult

    fun login(email: String, password: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.api!!.login(LoginRequest(email, password))
                if (response.isSuccessful && response.body() != null) {
                    token = response.body()!!.token
                    userId = email
                    _loginResult.value = Result.success(response.body()!!)
                } else {
                    _loginResult.value = Result.failure(
                        Exception("Login failed: ${response.code()}")
                    )
                }
            } catch (e: Exception) {
                _loginResult.value = Result.failure(e)
            }
        }
    }

    fun enroll(featureVector: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.api!!.enroll(
                    "Bearer $token",
                    EnrollRequest(userId, featureVector)
                )
                if (response.isSuccessful && response.body() != null) {
                    isEnrolled = true
                    _enrollResult.value = Result.success(response.body()!!)
                } else {
                    _enrollResult.value = Result.failure(
                        Exception("Enroll failed: ${response.code()}")
                    )
                }
            } catch (e: Exception) {
                _enrollResult.value = Result.failure(e)
            }
        }
    }

    fun verify(featureVector: String) {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.api!!.verify(
                    "Bearer $token",
                    VerifyRequest(userId, featureVector)
                )
                if (response.isSuccessful && response.body() != null) {
                    _verifyResult.value = Result.success(response.body()!!)
                } else {
                    _verifyResult.value = Result.failure(
                        Exception("Verify failed: ${response.code()}")
                    )
                }
            } catch (e: Exception) {
                _verifyResult.value = Result.failure(e)
            }
        }
    }

    fun cancel() {
        viewModelScope.launch {
            try {
                val response = RetrofitClient.api!!.cancel(
                    "Bearer $token",
                    CancelRequest(userId)
                )
                if (response.isSuccessful && response.body() != null) {
                    isEnrolled = false
                    _cancelResult.value = Result.success(response.body()!!)
                } else {
                    _cancelResult.value = Result.failure(
                        Exception("Cancel failed: ${response.code()}")
                    )
                }
            } catch (e: Exception) {
                _cancelResult.value = Result.failure(e)
            }
        }
    }
}
