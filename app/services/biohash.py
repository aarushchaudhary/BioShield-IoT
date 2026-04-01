"""
BioHashing — non-invertible biometric template transformation.

Pure math functions with zero database interaction.  A secret key seeds a
random projection matrix; the raw feature vector is projected and binarised
to produce a cancellable BioHash string.
"""

import numpy as np


def generate_transformation_matrix(
    secret_key: bytes,
    input_dim: int,
    output_dim: int,
) -> np.ndarray:
    """Create a random Gaussian projection matrix seeded by *secret_key*.

    Parameters
    ----------
    secret_key : bytes
        At least 4 bytes.  The first 4 bytes are converted to an unsigned
        32-bit integer and used as the NumPy random seed.
    input_dim : int
        Dimensionality of the incoming feature vector.
    output_dim : int
        Desired dimensionality of the projected (hashed) output.

    Returns
    -------
    np.ndarray
        Shape ``(input_dim, output_dim)`` — random Gaussian matrix.
    """
    seed = int.from_bytes(secret_key[:4], "big")
    rng = np.random.default_rng(seed)
    return rng.standard_normal((input_dim, output_dim))


def compute_biohash(feature_vector: list[float], matrix: np.ndarray) -> str:
    """Project a feature vector and binarise the result.

    Parameters
    ----------
    feature_vector : list[float]
        Raw biometric feature values.
    matrix : np.ndarray
        Transformation matrix from :func:`generate_transformation_matrix`.

    Returns
    -------
    str
        Binary string (e.g. ``"10110…"``) of length ``matrix.shape[1]``.
    """
    vec = np.asarray(feature_vector, dtype=np.float64)

    # Normalise to unit length
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    # Project and binarise
    projected = vec @ matrix
    bits = (projected >= 0).astype(int)

    return "".join(str(b) for b in bits)


def hamming_distance(hash1: str, hash2: str) -> tuple[int, float]:
    """Compute the Hamming distance between two equal-length binary strings.

    Parameters
    ----------
    hash1, hash2 : str
        Binary strings of the same length.

    Returns
    -------
    tuple[int, float]
        ``(raw_count, fraction)`` — the number of differing bit positions
        and that count divided by the total length.
    """
    if len(hash1) != len(hash2):
        raise ValueError(
            f"Hash lengths must match: {len(hash1)} != {len(hash2)}"
        )

    raw = sum(c1 != c2 for c1, c2 in zip(hash1, hash2))
    fraction = raw / len(hash1)
    return raw, fraction


def is_match(hash1: str, hash2: str, threshold: float = 0.35) -> bool:
    """Return True if the two BioHashes are close enough to be a genuine pair.

    Parameters
    ----------
    hash1, hash2 : str
        Binary strings of the same length.
    threshold : float
        Maximum allowable Hamming fraction (exclusive).

    Returns
    -------
    bool
    """
    _, fraction = hamming_distance(hash1, hash2)
    return fraction < threshold
