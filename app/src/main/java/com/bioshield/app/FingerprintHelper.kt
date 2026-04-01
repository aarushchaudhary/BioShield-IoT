package com.bioshield.app

import android.content.Context
import android.util.Base64
import com.machinezoo.sourceafis.FingerprintImage
import com.machinezoo.sourceafis.FingerprintImageOptions
import com.machinezoo.sourceafis.FingerprintTemplate

object FingerprintHelper {

    fun extractAndHash(
        context: Context,
        filename: String,
        userId: String,
        isEnrolling: Boolean
    ): String {
        // Step 1: Get image bytes
        val imageBytes = try {
            context.assets.open("fvc2002/$filename").readBytes()
        } catch (e: Exception) {
            BmpGenerator.generateSampleBmp(context, filename)
        }

        // Step 2: Extract SourceAFIS minutiae
        val image = FingerprintImage(imageBytes,
            FingerprintImageOptions().dpi(500.0))
        val template = FingerprintTemplate(image)
        val featureVector = Base64.encodeToString(
            template.toByteArray(),
            Base64.DEFAULT
        )

        // Step 3: Get or generate user key
        val userKey = if (isEnrolling) {
            KeyVault.generateKey(context, userId)
        } else {
            KeyVault.getKey(context, userId) ?: throw Exception("No enrolled template found!")
        }

        // Step 4: Apply BioHash transform
        return BioHasher.transform(featureVector, userKey)
    }
}