package com.bioshield.app

import kotlin.math.sqrt
import kotlin.random.Random

object BioHasher {

    // Generate a random projection matrix seeded by user key
    // Same key = same matrix = same hash (for verification)
    // Different key = different matrix = different hash (unlinkability)
    fun generateProjectionMatrix(
        inputSize: Int,
        outputSize: Int,
        seed: Long
    ): Array<DoubleArray> {
        val random = Random(seed)
        return Array(outputSize) {
            DoubleArray(inputSize) {
                if (random.nextBoolean()) 1.0 / sqrt(outputSize.toDouble())
                else -1.0 / sqrt(outputSize.toDouble())
            }
        }
    }

    // Convert base64 feature vector to double array
    fun featureVectorToDoubles(featureVector: String): DoubleArray {
        val bytes = android.util.Base64.decode(featureVector, android.util.Base64.DEFAULT)
        return DoubleArray(bytes.size) { bytes[it].toDouble() }
    }

    // Apply random projection and binarize → BioHash
    fun computeBioHash(
        featureVector: DoubleArray,
        projectionMatrix: Array<DoubleArray>
    ): BooleanArray {
        val outputSize = projectionMatrix.size
        val inputSize = featureVector.size
        val projected = DoubleArray(outputSize)

        for (i in 0 until outputSize) {
            var sum = 0.0
            val rowSize = minOf(projectionMatrix[i].size, inputSize)
            for (j in 0 until rowSize) {
                sum += projectionMatrix[i][j] * featureVector[j]
            }
            projected[i] = sum
        }

        // Binarize: positive = true, negative = false
        return BooleanArray(outputSize) { projected[it] > 0 }
    }

    // Compute Hamming distance between two BioHashes
    fun hammingDistance(hash1: BooleanArray, hash2: BooleanArray): Double {
        val size = minOf(hash1.size, hash2.size)
        var different = 0
        for (i in 0 until size) {
            if (hash1[i] != hash2[i]) different++
        }
        return different.toDouble() / size
    }

    // Convert BioHash to base64 string for sending to API
    fun bioHashToString(bioHash: BooleanArray): String {
        val bytes = ByteArray(bioHash.size) { if (bioHash[it]) 1 else 0 }
        return android.util.Base64.encodeToString(bytes, android.util.Base64.DEFAULT)
    }

    // Full pipeline: feature vector + key → BioHash string
    fun transform(featureVector: String, userKeySeed: Long): String {
        val vector = featureVectorToDoubles(featureVector)
        val matrix = generateProjectionMatrix(vector.size, 256, userKeySeed)
        val bioHash = computeBioHash(vector, matrix)
        return bioHashToString(bioHash)
    }
}