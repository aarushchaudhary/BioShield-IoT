"""
Tests for app.services.biohash — pure math, no database required.
"""

import numpy as np
import pytest

from app.services.biohash import (
    compute_biohash,
    generate_transformation_matrix,
    hamming_distance,
    is_match,
)

# ── Shared fixtures ──────────────────────────────────────────────────

INPUT_DIM = 128
OUTPUT_DIM = 256

KEY_A = b"secret_key_alpha_1234567890abcdef"
KEY_B = b"totally_different_key_zyxwvutsrqp"

# Deterministic "genuine" feature vector
np.random.seed(42)
GENUINE_VECTOR: list[float] = np.random.randn(INPUT_DIM).tolist()

# Slightly perturbed version of the genuine vector (small additive noise)
PERTURBED_VECTOR: list[float] = (
    np.array(GENUINE_VECTOR) + np.random.randn(INPUT_DIM) * 0.05
).tolist()

# Completely random impostor vector
IMPOSTOR_VECTOR: list[float] = np.random.randn(INPUT_DIM).tolist()


# ── Test 1: Determinism — same vector + same key = identical hash ────

def test_same_vector_same_key_produces_identical_biohash():
    matrix = generate_transformation_matrix(KEY_A, INPUT_DIM, OUTPUT_DIM)

    hash1 = compute_biohash(GENUINE_VECTOR, matrix)
    hash2 = compute_biohash(GENUINE_VECTOR, matrix)

    assert hash1 == hash2, "Same input + same key must yield identical BioHash"
    assert len(hash1) == OUTPUT_DIM


# ── Test 2: Cancellability — same vector + diff key = very different ──

def test_same_vector_different_key_produces_different_biohash():
    matrix_a = generate_transformation_matrix(KEY_A, INPUT_DIM, OUTPUT_DIM)
    matrix_b = generate_transformation_matrix(KEY_B, INPUT_DIM, OUTPUT_DIM)

    hash_a = compute_biohash(GENUINE_VECTOR, matrix_a)
    hash_b = compute_biohash(GENUINE_VECTOR, matrix_b)

    _, fraction = hamming_distance(hash_a, hash_b)

    assert fraction > 0.45, (
        f"Different keys should produce vastly different hashes, "
        f"but Hamming fraction was only {fraction:.3f}"
    )


# ── Test 3: Robustness — slightly perturbed vector = still a match ───

def test_slightly_perturbed_vector_still_matches():
    matrix = generate_transformation_matrix(KEY_A, INPUT_DIM, OUTPUT_DIM)

    hash_genuine = compute_biohash(GENUINE_VECTOR, matrix)
    hash_perturbed = compute_biohash(PERTURBED_VECTOR, matrix)

    _, fraction = hamming_distance(hash_genuine, hash_perturbed)

    assert fraction < 0.35, (
        f"Slightly perturbed vector should match (Hamming < 0.35), "
        f"but got {fraction:.3f}"
    )


# ── Test 4: Discriminability — random impostor ≈ 0.5 Hamming ─────────

def test_random_impostor_does_not_match():
    matrix = generate_transformation_matrix(KEY_A, INPUT_DIM, OUTPUT_DIM)

    hash_genuine = compute_biohash(GENUINE_VECTOR, matrix)
    hash_impostor = compute_biohash(IMPOSTOR_VECTOR, matrix)

    _, fraction = hamming_distance(hash_genuine, hash_impostor)

    # Random vectors should land near 0.5 Hamming distance
    assert fraction > 0.35, (
        f"Random impostor should NOT match (Hamming > 0.35), "
        f"but got {fraction:.3f}"
    )


# ── Test 5: is_match returns correct booleans ─────────────────────────

def test_is_match_returns_correct_results():
    matrix = generate_transformation_matrix(KEY_A, INPUT_DIM, OUTPUT_DIM)

    hash_genuine = compute_biohash(GENUINE_VECTOR, matrix)
    hash_perturbed = compute_biohash(PERTURBED_VECTOR, matrix)
    hash_impostor = compute_biohash(IMPOSTOR_VECTOR, matrix)

    assert is_match(hash_genuine, hash_perturbed) is True, (
        "Genuine pair should match"
    )
    assert is_match(hash_genuine, hash_impostor) is False, (
        "Impostor pair should NOT match"
    )
