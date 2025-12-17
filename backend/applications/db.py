import boto3
import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from models import Application


# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


class ApplicationDynamoDB:
    def __init__(self, table_name: str = "applications"):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
        logger.info(f"Initialized ApplicationDynamoDB with table: {table_name}")

    def create(self, application: Application) -> Application:
        """Create a new application. Pay should be an int (e.g., cents)."""
        logger.info(f"Creating application for user: {application.user_id}")
        if not application.id:
            application.id = str(uuid.uuid4())
        if not application.created_at:
            application.created_at = datetime.utcnow()

        item = application.to_dynamo_dict()
        self.table.put_item(Item=item)
        logger.info(f"Successfully created application with ID: {application.id}")
        return application

    def get_by_id(self, application_id: str) -> Optional[Application]:
        logger.info(f"Getting application by ID: {application_id}")
        try:
            response = self.table.get_item(Key={'id': application_id})
            item = response.get('Item')
            if item:
                logger.info(f"Found application with ID: {application_id}")
                return Application.from_dynamo_dict(item)
            else:
                logger.warning(f"Application not found with ID: {application_id}")
                return None
        except ClientError as e:
            logger.error(f"Error getting application {application_id}: {e.response['Error']['Code']}", exc_info=True)
            return None

    def query(
        self,
        user_id: str,
        status: Optional[str] = None,
        job_title: Optional[str] = None,
        company: Optional[str] = None,
        location: Optional[str] = None,
        min_pay: Optional[int] = None,
        max_pay: Optional[int] = None,
        limit: int = 20
    ) -> List[Application]:
        """Queries using GSI. No Decimal conversion needed for integer pay."""
        logger.info(f"Querying applications for user: {user_id}")
        query_params = {
            'IndexName': 'UserIndex',
            'KeyConditionExpression': Key('user_id').eq(user_id),
            'ScanIndexForward': False,
            'Limit': limit
        }

        filters = None
        if status:
            filters = Attr('status').eq(status)
        if job_title:
            condition = Attr('job_title').contains(job_title)
            filters = filters & condition if filters else condition
        if company:
            condition = Attr('company').contains(company)
            filters = filters & condition if filters else condition
        if location:
            condition = Attr('location').contains(location)
            filters = filters & condition if filters else condition
        if min_pay is not None:
            condition = Attr('pay').gte(min_pay)
            filters = filters & condition if filters else condition
        if max_pay is not None:
            condition = Attr('pay').lte(max_pay)
            filters = filters & condition if filters else condition

        if filters:
            query_params['FilterExpression'] = filters
        
        logger.info(f"Executing query with params: {query_params}")
        response = self.table.query(**query_params)
        items = response.get('Items', [])
        logger.info(f"Query returned {len(items)} items.")
        return [Application.from_dynamo_dict(item) for item in items]

    def update(self, application_id: str, updates: Dict[str, Any]) -> Optional[Application]:
        """Update fields. Integers in 'updates' are handled natively."""
        logger.info(f"Updating application ID: {application_id} with data: {updates}")
        updates = {k: v for k, v in updates.items() if k not in [
            'id', 'user_id', 'created_at', 'updated_at']}
        if not updates:
            logger.warning("No update data provided. Fetching current item instead.")
            return self.get_by_id(application_id)

        updates['updated_at'] = datetime.utcnow().isoformat()

        # Build expressions to handle reserved keywords
        update_expression_parts = []
        expression_attribute_names = {}
        expression_attribute_values = {}
        for i, (key, value) in enumerate(updates.items()):
            name_placeholder = f"#k{i}"
            value_placeholder = f":v{i}"
            update_expression_parts.append(f"{name_placeholder} = {value_placeholder}")
            expression_attribute_names[name_placeholder] = key
            expression_attribute_values[value_placeholder] = value

        update_expr = "SET " + ", ".join(update_expression_parts)
        
        logger.info(f"Update expression: {update_expr}")
        logger.info(f"Expression attribute names: {expression_attribute_names}")
        logger.info(f"Expression attribute values: {expression_attribute_values}")

        try:
            response = self.table.update_item(
                Key={'id': application_id},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="ALL_NEW"
            )
            logger.info(f"Successfully updated application ID: {application_id}")
            return Application.from_dynamo_dict(response['Attributes'])
        except ClientError as e:
            logger.error(f"Error updating application {application_id}: {e.response['Error']['Code']}", exc_info=True)
            return None

    def delete(self, application_id: str) -> bool:
        logger.info(f"Deleting application ID: {application_id}")
        try:
            self.table.delete_item(
                Key={'id': application_id},
                ConditionExpression="attribute_exists(id)"
            )
            logger.info(f"Successfully deleted application ID: {application_id}")
            return True
        except ClientError as e:
            logger.error(f"Error deleting application {application_id}: {e.response['Error']['Code']}", exc_info=True)
            return False
