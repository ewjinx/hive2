from fastapi.testclient import TestClient

def test_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Hive API"}

def test_create_user(client: TestClient):
    # This might fail on 2nd run due to unique email constraint
    # Need DB cleanup or unique email gen
    email = "test@example.com"
    password = "password"
    response = client.post(
        f"/api/v1/users/",
        json={"email": email, "password": password},
    )
    if response.status_code == 400: # Already exists
        assert "already exists" in response.json()["detail"]
    else:
        assert response.status_code == 200
        assert response.json()["email"] == email
