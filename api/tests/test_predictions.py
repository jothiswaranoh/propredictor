import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_prediction_workflow(client: AsyncClient):
    # 1. Login as admin
    login_response = await client.post(
        "/api/auth/login",
        json={"email": "admin@company.com", "employee_id": "EMP001"}
    )
    assert login_response.status_code == 200
    admin_token = login_response.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Create a standard user via admin panel
    user_response = await client.post(
        "/api/admin/users",
        json={
            "name": "Standard User",
            "email": "user@company.com",
            "employee_id": "EMP002",
            "role": "user",
            "active": True
        },
        headers=admin_headers
    )
    assert user_response.status_code == 201
    user_id = user_response.json()["id"]

    # Login as standard user
    user_login = await client.post(
        "/api/auth/login",
        json={"email": "user@company.com", "employee_id": "EMP002"}
    )
    assert user_login.status_code == 200
    user_token = user_login.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 3. Create Teams
    team1_resp = await client.post(
        "/api/admin/teams",
        json={"name": "Arsenal", "short_name": "ARS", "logo_url": "http://arsenal.com/logo.png"},
        headers=admin_headers
    )
    assert team1_resp.status_code == 201
    t1_id = team1_resp.json()["id"]

    team2_resp = await client.post(
        "/api/admin/teams",
        json={"name": "Chelsea", "short_name": "CHE", "logo_url": "http://chelsea.com/logo.png"},
        headers=admin_headers
    )
    assert team2_resp.status_code == 201
    t2_id = team2_resp.json()["id"]

    # 4. Create Match (Active window)
    now = datetime.utcnow()
    match_resp = await client.post(
        "/api/admin/matches",
        json={
            "team1_id": t1_id,
            "team2_id": t2_id,
            "match_date": (now + timedelta(hours=2)).isoformat() + "Z",
            "prediction_open_time": (now - timedelta(hours=1)).isoformat() + "Z",
            "prediction_close_time": (now + timedelta(hours=1)).isoformat() + "Z",
            "status": "upcoming"
        },
        headers=admin_headers
    )
    assert match_resp.status_code == 201
    m_id = match_resp.json()["id"]

    # 5. Submit prediction (success)
    pred_resp = await client.post(
        f"/api/predictions/{m_id}",
        json={"winning_team_id": t1_id},
        headers=user_headers
    )
    assert pred_resp.status_code == 200
    assert pred_resp.json()["winning_team_id"] == t1_id

    # 6. Submit prediction again (should succeed with 200 and update prediction)
    pred_resp2 = await client.post(
        f"/api/predictions/{m_id}",
        json={"winning_team_id": t2_id},
        headers=user_headers
    )
    assert pred_resp2.status_code == 200
    assert pred_resp2.json()["winning_team_id"] == t2_id

    # 7. Declare match result
    result_resp = await client.post(
        f"/api/admin/matches/{m_id}/result",
        json={"winning_team_id": t1_id, "status": "completed"},
        headers=admin_headers
    )
    assert result_resp.status_code == 200
    assert result_resp.json()["status"] == "completed"
    assert result_resp.json()["winning_team_id"] == t1_id

    # 8. Check prediction history for user (should be incorrect since they updated to t2_id)
    history_resp = await client.get("/api/predictions/history", headers=user_headers)
    assert history_resp.status_code == 200
    history_data = history_resp.json()
    assert len(history_data) == 1
    assert history_data[0]["is_correct"] is False

    # 9. Recalculate and fetch leaderboard
    lead_gen = await client.post("/api/admin/leaderboard/generate", headers=admin_headers)
    assert lead_gen.status_code == 200

    leaderboard = await client.get("/api/leaderboard", headers=user_headers)
    assert leaderboard.status_code == 200
    l_data = leaderboard.json()["leaderboard"]
    
    # User should have 0 points
    assert len(l_data) >= 1
    user_entry = next(item for item in l_data if item["user_id"] == user_id)
    assert user_entry["points"] == 0


@pytest.mark.asyncio
async def test_prediction_draw_workflow(client: AsyncClient):
    # 1. Login as admin
    login_response = await client.post(
        "/api/auth/login",
        json={"email": "admin@company.com", "employee_id": "EMP001"}
    )
    assert login_response.status_code == 200
    admin_token = login_response.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Create a standard user via admin panel
    user_response = await client.post(
        "/api/admin/users",
        json={
            "name": "Draw Predicting User",
            "email": "draw_user@company.com",
            "employee_id": "EMP003",
            "role": "user",
            "active": True
        },
        headers=admin_headers
    )
    assert user_response.status_code == 201
    user_id = user_response.json()["id"]

    # Login as standard user
    user_login = await client.post(
        "/api/auth/login",
        json={"email": "draw_user@company.com", "employee_id": "EMP003"}
    )
    assert user_login.status_code == 200
    user_token = user_login.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 3. Create Teams
    team1_resp = await client.post(
        "/api/admin/teams",
        json={"name": "Arsenal2", "short_name": "AR2", "logo_url": "http://arsenal.com/logo.png"},
        headers=admin_headers
    )
    assert team1_resp.status_code == 201
    t1_id = team1_resp.json()["id"]

    team2_resp = await client.post(
        "/api/admin/teams",
        json={"name": "Chelsea2", "short_name": "CH2", "logo_url": "http://chelsea.com/logo.png"},
        headers=admin_headers
    )
    assert team2_resp.status_code == 201
    t2_id = team2_resp.json()["id"]

    # 4. Create Match (Active window)
    now = datetime.utcnow()
    match_resp = await client.post(
        "/api/admin/matches",
        json={
            "team1_id": t1_id,
            "team2_id": t2_id,
            "match_date": (now + timedelta(hours=2)).isoformat() + "Z",
            "prediction_open_time": (now - timedelta(hours=1)).isoformat() + "Z",
            "prediction_close_time": (now + timedelta(hours=1)).isoformat() + "Z",
            "status": "upcoming"
        },
        headers=admin_headers
    )
    assert match_resp.status_code == 201
    m_id = match_resp.json()["id"]

    # 5. Submit Draw prediction (winning_team_id = null/None)
    pred_resp = await client.post(
        f"/api/predictions/{m_id}",
        json={"winning_team_id": None},
        headers=user_headers
    )
    assert pred_resp.status_code == 200
    assert pred_resp.json()["winning_team_id"] is None

    # 6. Declare match result as Draw (winning_team_id = null)
    result_resp = await client.post(
        f"/api/admin/matches/{m_id}/result",
        json={"winning_team_id": None, "status": "completed"},
        headers=admin_headers
    )
    assert result_resp.status_code == 200
    assert result_resp.json()["status"] == "completed"
    assert result_resp.json()["winning_team_id"] is None

    # 7. Check prediction history for user (should be correct since both prediction and result were draw)
    history_resp = await client.get("/api/predictions/history", headers=user_headers)
    assert history_resp.status_code == 200
    history_data = history_resp.json()
    assert len(history_data) == 1
    assert history_data[0]["is_correct"] is True
    assert history_data[0]["winning_team_id"] is None

    # 8. Recalculate and fetch leaderboard
    lead_gen = await client.post("/api/admin/leaderboard/generate", headers=admin_headers)
    assert lead_gen.status_code == 200

    leaderboard = await client.get("/api/leaderboard", headers=user_headers)
    assert leaderboard.status_code == 200
    l_data = leaderboard.json()["leaderboard"]
    
    # User should have 1 point
    assert len(l_data) >= 1
    user_entry = next(item for item in l_data if item["user_id"] == user_id)
    assert user_entry["points"] == 1

