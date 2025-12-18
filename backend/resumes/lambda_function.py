import json
import logging
import os
import boto3
import uuid
from typing import Dict, Any

from db import ResumeDynamoDB
from models import Resume

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
S3_BUCKET = os.environ.get("RESUMES_S3_BUCKET")
db = ResumeDynamoDB()


def success_response(data: Any, status_code: int = 200) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH'
        },
        'body': json.dumps(data)
    }


def error_response(message: str, status_code: int = 400) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH'
        },
        'body': json.dumps({'error': message})
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        user_id = event['requestContext']['authorizer']['jwt']['claims']['sub']
        logger.info(f"Authenticated User ID: {user_id}")

        http_method = event.get('requestContext', {}).get(
            'http', {}).get('method', '')
        path = event.get('rawPath', '')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        body = event.get('body')
        data = json.loads(body) if body else {}

        logger.info(f"HTTP Method: {http_method}, Path: {path}")

        # --- Route: POST /resumes/upload-url ---
        if http_method == 'POST' and path == '/resumes/upload-url':
            logger.info("Routing to: Generate Pre-signed URL")
            file_name = data.get('file_name')
            content_type = data.get('content_type', 'application/octet-stream')
            if not file_name:
                return error_response("file_name is required")

            resume_id = str(uuid.uuid4())
            s3_key = f"{user_id}/{resume_id}/{file_name}" # Use user_id from auth context

            new_resume = Resume(id=resume_id, user_id=user_id, # Use user_id from auth context
                                file_name=file_name, s3_key=s3_key, upload_status="pending")
            db.create(new_resume)

            s3_client = boto3.client('s3')
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': s3_key,
                    'ContentType': content_type
                },
                ExpiresIn=3600
            )

            return success_response({"presigned_url": presigned_url, "resume_id": resume_id})

        # --- Route: POST /resumes ---
        elif http_method == 'POST' and path == '/resumes':
            logger.info("Routing to: Confirm Resume Upload")
            resume_id = data.get('resume_id')
            if not resume_id:
                return error_response("resume_id is required")

            if not db.get_by_id(resume_id):
                return error_response("Resume not found", 404)

            updated_resume = db.update_status(resume_id, "completed")
            return success_response(updated_resume.to_dynamo_dict(), 201)

        # --- Route: GET /resumes ---
        elif http_method == 'GET' and path == '/resumes':
            logger.info("Routing to: Get Resumes by User")
            # user_id is now taken from the auth context

            resumes = db.get_by_user_id(user_id)
            return success_response([r.to_dynamo_dict() for r in resumes])

        # --- Route: GET /resumes/{id} ---
        elif http_method == 'GET' and path_parameters.get('id'):
            resume_id = path_parameters['id']
            logger.info(f"Routing to: Get Resume by ID - {resume_id}")
            resume = db.get_by_id(resume_id)
            if resume:
                return success_response(resume.to_dynamo_dict())
            return error_response("Resume not found", 404)

        # --- Route: PATCH /resumes/{id} ---
        elif http_method == 'PATCH' and path_parameters.get('id'):
            resume_id = path_parameters['id']
            logger.info(f"Routing to: Update Resume - {resume_id}")
            if 'file_name' not in data:
                return error_response("Only file_name can be updated")

            resume = db.get_by_id(resume_id)
            if not resume:
                return error_response("Resume not found", 404)

            # This is a simplified update. A more robust solution would be in the db class.
            resume.file_name = data['file_name']
            db.create(resume)  # Overwrites/updates the item
            return success_response(resume.to_dynamo_dict())

        else:
            return error_response('Route not found', status_code=404)

    except Exception as e:
        logger.error(f"Internal server error: {e}", exc_info=True)
        return error_response('Internal server error', status_code=500)
