import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.biometric import TriggerEnrollmentRequest
from app.redis_client import get_redis
from app.dependencies.rbac import require_admin
from app.schemas.biometric import BiometricResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/device", tags=["Device"], dependencies=[Depends(require_admin)])

@router.post("/trigger-enrollment", response_model=BiometricResponse)
def trigger_enrollment(body: TriggerEnrollmentRequest):
    """
    Allows the dashboard admin to remotely trigger the enrollment flow on the IoT device.
    """
    try:
        r = get_redis()
        # Set a key in Redis that the device will poll (or subscribe to)
        # We store the user_id that needs to be enrolled
        trigger_key = f"trigger_enroll:{body.device_id}"
        r.setex(trigger_key, 60, str(body.user_id))
        
        return BiometricResponse(
            status="success",
            message=f"Enrollment triggered on device {body.device_id}. Listening for fingerprint.",
            biohash=None
        )
    except Exception as e:
        logger.error(f"Failed to trigger enrollment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
