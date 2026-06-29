import pytest
from app.utils.security import hash_password, verify_password

def test_hash_password():
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    
    assert hashed != password
    assert hashed.startswith("$2")
    assert len(hashed) >= 60

def test_verify_password_with_hashed():
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    
    is_valid, needs_rehash = verify_password(password, hashed)
    assert is_valid is True
    assert needs_rehash is False

def test_verify_password_with_legacy_plaintext():
    password = "SuperSecretPassword123!"
    legacy_stored_password = "SuperSecretPassword123!"
    
    is_valid, needs_rehash = verify_password(password, legacy_stored_password)
    assert is_valid is True
    assert needs_rehash is True

def test_verify_password_invalid():
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    
    is_valid, needs_rehash = verify_password("WrongPassword!", hashed)
    assert is_valid is False
    assert needs_rehash is False
    
    is_valid_legacy, needs_rehash_legacy = verify_password("WrongPassword!", "SuperSecretPassword123!")
    assert is_valid_legacy is False
    assert needs_rehash_legacy is False
