import json

import boto3


def main():
    # The ARN of the agent runtime to invoke
    agent_arn = "arn:aws:bedrock-agentcore:ap-northeast-1:123456789012:runtime/xxxx"

    # Initialize the Bedrock Agent Runtime client
    agent_core_client = boto3.client("bedrock-agentcore")

    # Create the payload for the agent invocation
    payload = json.dumps(
        {
            "prompt": "大阪の天気は？",
        }
    ).encode()

    # Invoke the agent
    response = agent_core_client.invoke_agent_runtime(
        agentRuntimeArn=agent_arn, payload=payload
    )

    # Print the response from the agent
    for line in response["response"].iter_lines():
        line = line.decode("utf-8")
        print(line)


if __name__ == "__main__":
    main()
