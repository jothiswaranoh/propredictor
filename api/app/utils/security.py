import bcrypt

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_pwd = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_pwd.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a hashed password.
    It checks if it's already a hash or plain-text (for legacy support during migration).
    Returns a tuple of (is_valid, needs_rehash).
    """
    pwd_bytes = plain_password.encode('utf-8')
    hashed_pwd_bytes = hashed_password.encode('utf-8')
    
    # Check if the stored password looks like a bcrypt hash
    if hashed_password.startswith("$2") and len(hashed_password) >= 60:
        is_valid = bcrypt.checkpw(pwd_bytes, hashed_pwd_bytes)
        return is_valid, False
    
    # Legacy fallback: plain text comparison
    if plain_password == hashed_password:
        return True, True  # True (valid), True (needs rehash)
        
    return False, False
