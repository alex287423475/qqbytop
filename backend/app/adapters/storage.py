from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

from app.config import Settings
from app.models.schemas import utcnow


class StorageAdapter:
    def create_presigned_put(self, *, draft_id: str, file_name: str) -> tuple[str, str, str, object]:
        raise NotImplementedError

    def create_presigned_get(self, *, bucket: str, object_key: str, expires_seconds: int = 300) -> str:
        raise NotImplementedError


class MockStorageAdapter(StorageAdapter):
    def create_presigned_put(self, *, draft_id: str, file_name: str) -> tuple[str, str, str, object]:
        object_key = f"gaokao-essay/{draft_id}/{uuid4()}-{file_name}"
        bucket = "mock-gaokao-essay"
        expires_at = utcnow() + timedelta(minutes=5)
        upload_url = f"https://mock-cos.local/{bucket}/{object_key}?signature=mock"
        return upload_url, bucket, object_key, expires_at

    def create_presigned_get(self, *, bucket: str, object_key: str, expires_seconds: int = 300) -> str:
        return f"https://mock-cos.local/{bucket}/{object_key}?signature=mock-read&expires={expires_seconds}"


class TencentCosStorageAdapter(StorageAdapter):
    def __init__(self, settings: Settings) -> None:
        from qcloud_cos import CosConfig, CosS3Client

        if not all([settings.cos_region, settings.cos_secret_id, settings.cos_secret_key, settings.cos_bucket]):
            raise RuntimeError("COS configuration is incomplete.")
        self.bucket = settings.cos_bucket
        self.region = settings.cos_region
        config = CosConfig(Region=settings.cos_region, SecretId=settings.cos_secret_id, SecretKey=settings.cos_secret_key, Token=None, Scheme="https")
        self.client = CosS3Client(config)

    def create_presigned_put(self, *, draft_id: str, file_name: str) -> tuple[str, str, str, object]:
        object_key = f"gaokao-essay/{draft_id}/{uuid4()}-{file_name}"
        expires_at = utcnow() + timedelta(minutes=5)
        upload_url = self.client.get_presigned_url(Method="PUT", Bucket=self.bucket, Key=object_key, Expired=300)
        return upload_url, self.bucket, object_key, expires_at

    def create_presigned_get(self, *, bucket: str, object_key: str, expires_seconds: int = 300) -> str:
        return self.client.get_presigned_url(Method="GET", Bucket=bucket, Key=object_key, Expired=expires_seconds)


def build_storage_adapter(settings: Settings) -> StorageAdapter:
    if settings.storage_provider in {"cos", "tencent_cos"}:
        return TencentCosStorageAdapter(settings)
    return MockStorageAdapter()
