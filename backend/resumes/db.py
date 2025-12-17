import boto3
import uuid
import logging
from datetime import datetime
from typing import Optional, List
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from models import Resume

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


class ResumeDynamoDB:
    def __init__(self, table_name: str = "resumes"):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
        logger.info(f"Initialized ResumeDynamoDB with table: {table_name}")

    def create(self, resume: Resume) -> Resume:
        """Create a new resume."""
        logger.info(f"Creating resume for user: {resume.user_id}")
        if not resume.id:
            resume.id = str(uuid.uuid4())
        if not resume.created_at:
            resume.created_at = datetime.utcnow()

        item = resume.to_dynamo_dict()
        self.table.put_item(Item=item)
        logger.info(f"Successfully created resume with ID: {resume.id}")
        return resume

    def get_by_id(self, resume_id: str) -> Optional[Resume]:
        logger.info(f"Getting resume by ID: {resume_id}")
        try:
            response = self.table.get_item(Key={'id': resume_id})
            item = response.get('Item')
            if item:
                logger.info(f"Found resume with ID: {resume_id}")
                return Resume.from_dynamo_dict(item)
            else:
                logger.warning(f"Resume not found with ID: {resume_id}")
                return None
        except ClientError as e:
            logger.error(f"Error getting resume {resume_id}: {e.response['Error']['Code']}", exc_info=True)
            return None

    def get_by_user_id(self, user_id: str) -> List[Resume]:
        """Queries using GSI to get all resumes for a user."""
        logger.info(f"Querying resumes for user: {user_id}")
        try:
            response = self.table.query(
                IndexName='UserIndex',
                KeyConditionExpression=Key('user_id').eq(user_id)
            )
            items = response.get('Items', [])
            logger.info(f"Query returned {len(items)} resumes for user: {user_id}")
            return [Resume.from_dynamo_dict(item) for item in items]
        except ClientError as e:
            logger.error(f"Error querying resumes for user {user_id}: {e.response['Error']['Code']}", exc_info=True)
            return []

    def update_status(self, resume_id: str, status: str) -> Optional[Resume]:
        """Update the upload status of a resume."""
        logger.info(f"Updating status for resume ID: {resume_id} to {status}")
        if status not in Resume.VALID_STATUSES:
            logger.warning(f"Invalid status '{status}' provided.")
            raise ValueError(f"Invalid status: {status}")

        try:
            response = self.table.update_item(
                Key={'id': resume_id},
                UpdateExpression="SET upload_status = :status, updated_at = :updated_at",
                ExpressionAttributeValues={
                    ':status': status,
                    ':updated_at': datetime.utcnow().isoformat()
                },
                ReturnValues="ALL_NEW"
            )
            logger.info(f"Successfully updated status for resume ID: {resume_id}")
            return Resume.from_dynamo_dict(response['Attributes'])
        except ClientError as e:
            logger.error(f"Error updating status for resume {resume_id}: {e.response['Error']['Code']}", exc_info=True)
            return None
