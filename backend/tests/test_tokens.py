from app.security.tokens import create_access_token, create_refresh_token, decode_token, hash_password, verify_password


def test_password_hash_and_verify() -> None:
    password = "strong-pass-123"
    password_hash = hash_password(password)
    assert password_hash != password
    assert verify_password(password, password_hash) is True
    assert verify_password("wrong", password_hash) is False


def test_access_token_payload() -> None:
    token = create_access_token(
        user_id="660000000000000000000001",
        role="super_admin",
        admin_flag=True,
        organization_id=None,
    )
    payload = decode_token(token)
    assert payload["type"] == "access"
    assert payload["role"] == "super_admin"
    assert payload["admin_flag"] is True


def test_refresh_token_payload() -> None:
    token, jti, _ = create_refresh_token("660000000000000000000001")
    payload = decode_token(token)
    assert payload["type"] == "refresh"
    assert payload["sub"] == "660000000000000000000001"
    assert payload["jti"] == jti
