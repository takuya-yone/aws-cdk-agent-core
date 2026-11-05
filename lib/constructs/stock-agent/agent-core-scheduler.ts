import {
  type aws_bedrockagentcore as agentcore,
  Duration,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_nodejs,
  aws_logs as logs,
  RemovalPolicy,
  aws_scheduler as scheduler,
  TimeZone,
  aws_scheduler_targets as targets,
} from "aws-cdk-lib"
import { Construct } from "constructs"

export type AgentCoreSchedulerConstructProps = {
  runtime: agentcore.Runtime
}

export class AgentCoreSchedulerConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: AgentCoreSchedulerConstructProps,
  ) {
    super(scope, id)

    // Agent Core Runtime Scheduler Lambda
    const agentCoreRuntimeSchedulerLambdaName =
      "StockAgentCoreRuntimeSchedulerLambda"
    const agentCoreRuntimeSchedulerLambda = new lambda_nodejs.NodejsFunction(
      this,
      agentCoreRuntimeSchedulerLambdaName,
      {
        runtime: lambda.Runtime.NODEJS_24_X,
        functionName: agentCoreRuntimeSchedulerLambdaName,
        description: "A Lambda function that schedules Agent Core runtime",
        entry: "src/lambda/agent-core-runtime-scheduler.ts",
        handler: "handler",
        timeout: Duration.seconds(300),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE,
        logGroup: new logs.LogGroup(
          this,
          "StockAgentCoreRuntimeSchedulerLambdaLogGroup",
          {
            logGroupName: `/aws/lambda/${agentCoreRuntimeSchedulerLambdaName}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY,
          },
        ),
        bundling: {
          bundleAwsSDK: true,
        },
        environment: {
          AGENT_CORE_RUNTIME_ARN: props.runtime.agentRuntimeArn,
        },
      },
    )

    // Agent Core RuntimeへのInvoke権限を付与
    props.runtime.grantInvoke(agentCoreRuntimeSchedulerLambda)

    // Agent Core Runtime Scheduler
    const _agentCoreRuntimeScheduler = new scheduler.Schedule(
      this,
      "StockAgentCoreRuntimeScheduler",
      {
        scheduleName: "StockAgentCoreRuntimeScheduler",
        schedule: scheduler.ScheduleExpression.cron({
          minute: "0",
          hour: "9",
          day: "*",
          month: "*",
          year: "*",
          timeZone: TimeZone.ASIA_TOKYO,
        }),
        timeWindow: scheduler.TimeWindow.off(),
        target: new targets.LambdaInvoke(agentCoreRuntimeSchedulerLambda),
      },
    )
  }
}
