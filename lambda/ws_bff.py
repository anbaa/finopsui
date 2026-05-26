"""
WebSocket BFF Lambda — scriptgenerator-bff-ws
==============================================
Handles the persistent WebSocket connection between the browser and AgentCore.
Exists because API Gateway HTTP APIs have a hard 29-second response timeout —
long AI responses get cut off. WebSocket has no such limit.

Flow:
  Browser  →  API Gateway WebSocket  →  THIS LAMBDA  →  AgentCore  →  Strands Agent
                                            ↑ pushes chunks back
                                        via post_to_connection

Routes handled:
  $connect    — browser opens WS connection  → just return 200
  $disconnect — browser closes connection    → just return 200
  $default    — browser sends a message      → invoke agent, stream chunks back

What it does on $default:
  1. Reads prompt + session_id from the WebSocket message body
  2. Calls invoke_agent_runtime on the existing AgentCore agent
  3. Reads the full SSE response from AgentCore
  4. Pushes each event chunk back to the browser via post_to_connection:
       {"type": "text",        "content": "..."}
       {"type": "tool_use",    "id": "...", "name": "...", "input": {...}}
       {"type": "tool_result", "tool_use_id": "...", "output": "..."}
       {"type": "done"}          ← signals the stream is finished

Runtime:  Python 3.12
Handler:  ws_bff.handler
Timeout:  15 min (900s)   — enough for any AI response
Memory:   512 MB

Environment variables (set in Lambda console):
  AGENT_ARN    — ARN of the existing AgentCore runtime
  WS_ENDPOINT  — HTTPS form of the WebSocket API stage URL
                 e.g. https://XXXXX.execute-api.ap-southeast-2.amazonaws.com/prod
                 (filled AFTER the WebSocket API is created in Step 5)
"""

import json
import os
import uuid
import boto3

AGENT_ARN   = os.environ["AGENT_ARN"]
WS_ENDPOINT = os.environ["WS_ENDPOINT"]

_agent_client  = None
_mgmt_clients: dict = {}


def _agentcore():
    global _agent_client
    if _agent_client is None:
        _agent_client = boto3.client("bedrock-agentcore")
    return _agent_client


def _mgmt(endpoint_url: str):
    if endpoint_url not in _mgmt_clients:
        _mgmt_clients[endpoint_url] = boto3.client(
            "apigatewaymanagementapi",
            endpoint_url=endpoint_url,
        )
    return _mgmt_clients[endpoint_url]


def _parse_agentcore_sse(raw_text: str):
    for line in raw_text.splitlines():
        line = line.strip()
        if not line.startswith("data: "):
            continue
        payload_str = line[6:]
        if not payload_str:
            continue
        try:
            decoded = json.loads(payload_str)
            if isinstance(decoded, str):
                yield json.loads(decoded)
            elif isinstance(decoded, dict):
                yield decoded
        except Exception as e:
            print(f"SSE parse error: {e}")


def _extract_chunks(events):
    pending_tools: dict = {}

    for event in events:
        # Skip internal Strands lifecycle events
        if any(k in event for k in (
            "init_event_loop", "start", "start_event_loop",
            "stop_event_loop", "end_event_loop", "message", "result",
        )):
            continue

        if event.get("force_stop"):
            yield {"type": "text", "content": f"\n[Agent stopped: {event.get('force_stop_reason')}]"}
            continue

        if "error" in event and "event" not in event:
            yield {"type": "text", "content": f"\n[Error: {event.get('error')}]"}
            continue

        be = event.get("event")
        if not isinstance(be, dict):
            continue

        if "contentBlockDelta" in be:
            cbd   = be["contentBlockDelta"]
            idx   = cbd.get("contentBlockIndex", 0)
            delta = cbd.get("delta", {})
            if "text" in delta and delta["text"]:
                yield {"type": "text", "content": delta["text"]}
            elif "toolUse" in delta and idx in pending_tools:
                pending_tools[idx]["chunks"].append(delta["toolUse"].get("input", ""))
            continue

        if "contentBlockStart" in be:
            cbs  = be["contentBlockStart"]
            idx  = cbs.get("contentBlockIndex", 0)
            tool = cbs.get("start", {}).get("toolUse", {})
            if tool:
                pending_tools[idx] = {
                    "id":     tool.get("toolUseId", ""),
                    "name":   tool.get("name", ""),
                    "chunks": [],
                }
            continue

        if "contentBlockStop" in be:
            idx = be["contentBlockStop"].get("contentBlockIndex", 0)
            if idx in pending_tools:
                tool = pending_tools.pop(idx)
                raw  = "".join(tool["chunks"])
                try:
                    inp = json.loads(raw) if raw else {}
                except Exception:
                    inp = {"raw": raw}
                yield {"type": "tool_use", "id": tool["id"], "name": tool["name"], "input": inp}
            continue

        if "toolResult" in be:
            tr = be["toolResult"]
            yield {
                "type":        "tool_result",
                "tool_use_id": tr.get("toolUseId", ""),
                "output":      str(tr.get("content", "")),
            }


def handler(event, context):
    rc             = event.get("requestContext", {})
    route          = rc.get("routeKey", "")
    connection_id  = rc.get("connectionId", "")

    # Connection lifecycle — nothing to do
    if route in ("$connect", "$disconnect"):
        return {"statusCode": 200}

    # $default — run the agent and push results back
    body       = json.loads(event.get("body") or "{}")
    prompt     = body.get("prompt", "").strip()
    session_id = body.get("session_id") or ""
    if len(session_id) < 33:
        session_id = str(uuid.uuid4())

    if not prompt:
        return {"statusCode": 400}

    mgmt = _mgmt(WS_ENDPOINT)

    def push(data: dict):
        try:
            mgmt.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps(data, default=str).encode(),
            )
        except Exception as e:
            print(f"post_to_connection error: {e}")

    try:
        resp = _agentcore().invoke_agent_runtime(
            agentRuntimeArn=AGENT_ARN,
            runtimeSessionId=session_id,
            payload=json.dumps({"prompt": prompt}),
        )
        sb = resp.get("response")
        if sb is None:
            push({"type": "error", "content": "No response from agent"})
            return {"statusCode": 200}

        raw = sb.read().decode("utf-8", errors="replace")
        print(f"AgentCore raw bytes: {len(raw)}")

        for chunk in _extract_chunks(_parse_agentcore_sse(raw)):
            push(chunk)

        push({"type": "done"})

    except Exception as e:
        print(f"Agent invocation error: {e}")
        push({"type": "error", "content": str(e)})

    return {"statusCode": 200}
