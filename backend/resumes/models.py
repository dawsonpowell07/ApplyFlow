from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict

@dataclass
class Resume:
    id: str
    user_id: str
    file_name: str
    s3_key: str
    upload_status: str = "pending"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    VALID_STATUSES = {"pending", "completed", "failed"}

    def to_dynamo_dict(self) -> Dict[str, Any]:
        """Convert to DynamoDB compatible dict."""
        data = asdict(self)
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('updated_at'), datetime):
            data['updated_at'] = data['updated_at'].isoformat()
        return {k: v for k, v in data.items() if v is not None}

    @classmethod
    def from_dynamo_dict(cls, item: Dict[str, Any]) -> "Resume":
        """Reconstruct object from DynamoDB item."""
        if 'created_at' in item and isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if 'updated_at' in item and isinstance(item['updated_at'], str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
        return cls(**item)
