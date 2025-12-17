import json
import logging
from decimal import Decimal
from typing import Dict, Any
from db import ApplicationDynamoDB
from models import Application


# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle Decimal types."""
    def default(self, o):
        if isinstance(o, Decimal):
            # If it's a whole number, convert to int, otherwise float
            if o % 1 == 0:
                return int(o)
            else:
                return float(o)
        return super(DecimalEncoder, self).default(o)


def success_response(data: Any, status_code: int = 200) -> Dict[str, Any]:
    """Create a successful API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(data, cls=DecimalEncoder)
    }


def error_response(message: str, status_code: int = 400) -> Dict[str, Any]:
    """Create an error API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps({'error': message})
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for application CRUD operations using DynamoDB.
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        db = ApplicationDynamoDB()

        http_method = event.get('requestContext', {}).get('http', {}).get('method', '')
        path = event.get('rawPath', '')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        body = event.get('body')

        logger.info(f"HTTP Method: {http_method}, Path: {path}")

        data = json.loads(body) if body else {}
        logger.info(f"Request data: {data}")

        if http_method == 'OPTIONS':
            logger.info("Handling OPTIONS preflight request")
            return success_response({'message': 'OK'})

        elif http_method == 'POST' and path == '/applications':
            logger.info("Routing to: CREATE - POST /applications")
            if 'user_id' not in data:
                return error_response('user_id is required', status_code=400)

            status = data.get('status', 'applied')
            if status not in Application.VALID_STATUSES:
                return error_response(
                    f"Invalid status '{status}'. Must be one of {', '.join(sorted(list(Application.VALID_STATUSES)))}",
                    status_code=400
                )
            data['status'] = status

            app = Application(**data)
            created_app = db.create(app)
            logger.info(f"Successfully created application: {created_app.id}")
            return success_response(created_app.to_dynamo_dict(), status_code=201)

        elif http_method == 'GET' and path_parameters.get('id'):
            application_id = path_parameters['id']
            logger.info(f"Routing to: READ BY ID - GET /applications/{application_id}")
            app = db.get_by_id(application_id)
            if not app:
                logger.warning(f"Application with ID {application_id} not found")
                return error_response('Application not found', status_code=404)
            logger.info(f"Successfully found application: {app.id}")
            return success_response(app.to_dynamo_dict())

        elif http_method == 'GET' and path == '/applications':
            logger.info("Routing to: QUERY - GET /applications")
            user_id = query_parameters.get('user_id')
            if not user_id:
                return error_response('user_id query parameter is required')

            status = query_parameters.get('status')
            job_title = query_parameters.get('job_title')
            company = query_parameters.get('company')
            limit = int(query_parameters.get('limit', 20))

            apps = db.query(
                user_id=user_id,
                status=status,
                job_title=job_title,
                company=company,
                limit=limit
            )
            logger.info(f"Found {len(apps)} applications for user {user_id}")
            return success_response({
                'applications': [app.to_dynamo_dict() for app in apps],
                'count': len(apps)
            })

        elif http_method == 'PATCH' and path_parameters.get('id'):
            application_id = path_parameters['id']
            logger.info(f"Routing to: UPDATE - PATCH /applications/{application_id}")
            if 'status' in data and data['status'] not in Application.VALID_STATUSES:
                return error_response(
                    f"Invalid status '{data['status']}'. Must be one of {', '.join(sorted(list(Application.VALID_STATUSES)))}",
                    status_code=400
                )

            if 'pay' in data and data.get('pay') is not None:
                try:
                    data['pay'] = Decimal(str(data['pay']))
                except (TypeError, ValueError):
                    return error_response("Invalid format for 'pay'. It must be a number.", status_code=400)
                
            updated_app = db.update(application_id, data)
            if not updated_app:
                logger.warning(f"Update failed. Application with ID {application_id} not found or update error.")
                return error_response('Application not found', status_code=404)
            logger.info(f"Successfully updated application: {updated_app.id}")
            return success_response(updated_app.to_dynamo_dict())

        elif http_method == 'DELETE' and path_parameters.get('id'):
            application_id = path_parameters['id']
            logger.info(f"Routing to: DELETE - DELETE /applications/{application_id}")
            deleted = db.delete(application_id)
            if not deleted:
                logger.warning(f"Delete failed. Application with ID {application_id} not found.")
                return error_response('Application not found', status_code=404)
            logger.info(f"Successfully deleted application: {application_id}")
            return success_response({'message': 'Application deleted successfully'})

        else:
            logger.warning(f"Route not found for method {http_method} and path {path}")
            return error_response('Route not found', status_code=404)

    except ValueError as e:
        logger.error(f"Validation error: {e}", exc_info=True)
        return error_response(str(e), status_code=400)
    except Exception as e:
        logger.error(f"Internal server error: {e}", exc_info=True)
        return error_response('Internal server error', status_code=500)
