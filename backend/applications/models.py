from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict
from decimal import Decimal


@dataclass
class Application:
    job_title: Optional[str] = None
    company: Optional[str] = None
    pay: Optional[int] = None
    location: Optional[str] = None
    resume_used: Optional[str] = None
    resume_id: Optional[str] = None
    job_url: Optional[str] = None
    status: str = "applied"
    id: Optional[str] = None
    user_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    VALID_STATUSES = {"applied", "interviewing",
                      "offer", "accepted", "rejected"}

    def to_dynamo_dict(self) -> Dict[str, Any]:
        """Convert to DynamoDB compatible dict (handles Decimals)."""
        data = asdict(self)
        # DynamoDB requires Decimal for numbers
        if data.get('pay') is not None:
            data['pay'] = Decimal(str(data['pay']))
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('updated_at'), datetime):
            data['updated_at'] = data['updated_at'].isoformat()

        # Remove None values
        return {k: v for k, v in data.items() if v is not None}

    @classmethod
    def from_dynamo_dict(cls, item: Dict[str, Any]) -> "Application":
        """Reconstruct object from DynamoDB item."""
        if 'created_at' in item and isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if 'updated_at' in item and isinstance(item['updated_at'], str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
        return cls(**item)
