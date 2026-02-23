from strands.agent.agent_result import AgentResult
from strands.telemetry.metrics import (
    AgentInvocation,
    EventLoopCycleMetric,
    EventLoopMetrics,
    ToolMetrics,
    Trace,
)

from src.agent.main import parse_event_message, parse_result_message


def test_parse_result_message():
    msg = {
        "result": AgentResult(
            stop_reason="end_turn",
            message={
                "role": "assistant",
                "content": [
                    {
                        "text": "大阪の現在の天気は曇りで、気温は22度です。現在の時刻は2026年2月23日8時46分です。"
                    }
                ],
            },
            metrics=EventLoopMetrics(
                cycle_count=2,
                tool_metrics={
                    "call_weather_agent": ToolMetrics(
                        tool={
                            "toolUseId": "tooluse_QyXFtwQXnqJev6JDXrPvWW",
                            "name": "call_weather_agent",
                            "input": {"city": "大阪"},
                        },
                        call_count=1,
                        success_count=1,
                        error_count=0,
                        total_time=2.604933023452759,
                    )
                },
                cycle_durations=[1.2487499713897705],
                agent_invocations=[
                    AgentInvocation(
                        cycles=[
                            EventLoopCycleMetric(
                                event_loop_cycle_id="a405d3ae-8e5c-4e87-8a4e-c083ea7ea38e",
                                usage={
                                    "inputTokens": 920,
                                    "outputTokens": 50,
                                    "totalTokens": 970,
                                },
                            ),
                            EventLoopCycleMetric(
                                event_loop_cycle_id="5342a1da-6232-4c9c-8969-f80eaa65b314",
                                usage={
                                    "inputTokens": 1039,
                                    "outputTokens": 41,
                                    "totalTokens": 1080,
                                },
                            ),
                        ],
                        usage={
                            "inputTokens": 1959,
                            "outputTokens": 91,
                            "totalTokens": 2050,
                        },
                    )
                ],
                traces=[Trace("aaa")],
                accumulated_usage={
                    "inputTokens": 1959,
                    "outputTokens": 91,
                    "totalTokens": 2050,
                },
                accumulated_metrics={"latencyMs": 1566},
            ),
            state={},
            interrupts=None,
            structured_output=None,
        )
    }

    total_usage, total_latency, output_message = parse_result_message(msg)

    assert total_usage == {"inputTokens": 1959, "outputTokens": 91, "totalTokens": 2050}
    assert total_latency == 1566
    assert (
        output_message
        == "大阪の現在の天気は曇りで、気温は22度です。現在の時刻は2026年2月23日8時46分です。"
    )


def test_parse_event_message():
    msg_list = [
        {"event": {"messageStart": {"role": "assistant"}}},
        {
            "event": {
                "contentBlockDelta": {"delta": {"text": ""}, "contentBlockIndex": 0}
            }
        },
        {
            "event": {
                "contentBlockDelta": {"delta": {"text": "大阪"}, "contentBlockIndex": 0}
            }
        },
        {
            "event": {
                "contentBlockDelta": {"delta": {"text": "の"}, "contentBlockIndex": 0}
            }
        },
        {
            "event": {
                "contentBlockDelta": {
                    "delta": {"text": "現在の"},
                    "contentBlockIndex": 0,
                }
            }
        },
        {
            "event": {
                "contentBlockDelta": {"delta": {"text": "天"}, "contentBlockIndex": 0}
            }
        },
        {
            "event": {
                "contentBlockDelta": {"delta": {"text": "気"}, "contentBlockIndex": 0}
            }
        },
        {
            "event": {
                "contentBlockDelta": {"delta": {"text": "は"}, "contentBlockIndex": 0}
            }
        },
        {
            "event": {
                "contentBlockDelta": {
                    "delta": {"text": "曇りで"},
                    "contentBlockIndex": 0,
                }
            }
        },
        {"event": {"contentBlockStop": {"contentBlockIndex": 0}}},
        {"event": {"messageStop": {"stopReason": "end_turn"}}},
        {
            "event": {
                "metadata": {
                    "usage": {
                        "inputTokens": 1039,
                        "outputTokens": 41,
                        "totalTokens": 1080,
                    },
                    "metrics": {"latencyMs": 739},
                }
            }
        },
    ]

    for msg in msg_list:
        response_model = parse_event_message(msg)
        assert response_model.event is not None
        assert response_model.data is not None
        assert isinstance(response_model.data, str)
