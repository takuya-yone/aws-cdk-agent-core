import boto3
from db.balance_db import OrderHistoryModel
from logger import logger
from settings import settings
from strands import tool


@tool
def put_exchange_report_to_s3(
    transaction_id: str,
    file_path: str,
):
    """Put the exchange report to S3.

    Args:
        transaction_id (str): The transaction ID associated with the report.
        file_path (str): The local path of the file to be uploaded.
    """
    logger.info(
        "Uploading exchange report to S3 for transaction ID: %s", transaction_id
    )
    s3_client = boto3.client("s3")
    bucket_name = settings.fx_order_summary_bucket_name
    s3_client.upload_file(file_path, bucket_name, f"{transaction_id}.md")


@tool
def put_exchange_report_to_dynamodb(
    transaction_id: str,
    order_summary: str,
):
    """Put the exchange report to DynamoDB by updating the order summary in the order history.

    Args:
        transaction_id (str): The transaction ID associated with the report.
        order_summary (str): The summary of the order to be updated.
    """
    logger.info(
        "Updating exchange report in DynamoDB for transaction ID: %s", transaction_id
    )
    order_history = OrderHistoryModel.get(transaction_id)
    logger.info("Retrieved order history for transaction ID: %s", transaction_id)
    if not order_history:
        logger.error("Order history not found for transaction ID: %s", transaction_id)
        return
    logger.info("Order summary: %s", order_summary)
    order_history.OrderSummary = order_summary
    order_history.save()


@tool
def send_email(
    message: str,
):
    """Send an email notification via SNS.

    Args:
        message (str): The message to be published.
    """
    logger.info(
        "Publishing message to SNS topic: %s", settings.user_notification_topic_arn
    )
    sns_client = boto3.client("sns")
    sns_client.publish(
        TopicArn=settings.user_notification_topic_arn,
        Subject="StockAgent Notification",
        Message=message,
    )
