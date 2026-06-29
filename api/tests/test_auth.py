import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_default_admin_login(client: AsyncClient):
    # Test valid login for the default seeded admin
    response = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "EMP001"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_invalid_login(client: AsyncClient):
    # Test invalid username
    response = await client.post(
        "/api/auth/login",
        json={"username": "notadmin", "password": "EMP001"}
    )
    assert response.status_code == 401

    # Test invalid employee ID
    response = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "EMP999"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient):
    # Fetch profile without token (should fail)
    profile_response = await client.get("/api/users/me")
    assert profile_response.status_code == 401

    # Login to get token
    login_response = await client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "EMP001"}
    )
    token = login_response.json()["access_token"]

    # Fetch profile with token (should succeed)
    headers = {"Authorization": f"Bearer {token}"}
    profile_response = await client.get("/api/users/me", headers=headers)
    assert profile_response.status_code == 200
    user_data = profile_response.json()
    assert user_data["username"] == "admin"
    assert user_data["role"] == "admin"
