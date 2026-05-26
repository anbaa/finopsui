"""
HTTP BFF Lambda — scriptgenerator-bff
======================================
Sits between API Gateway (POST /chat) and the AgentCore runtime.

Flow:
  Browser  →  API Gateway  →  THIS LAMBDA  →  AgentCore  →  Strands Agent

What it does:
  1. Receives the user's chat prompt via POST /chat
  2. Calls invoke_agent_runtime on the existing AgentCore agent
  3. Reads the SSE stream AgentCore sends back
  4. Translates it into clean JSON events the UI understands:
       {"type": "text",        "content": "..."}
       {"type": "tool_use",    "id": "...", "name": "...", "input": {...}}
       {"type": "tool_result", "tool_use_id": "...", "output": "..."}
  5. Returns them all as a single SSE response body

Runtime:  Python 3.12
Handler:  http_bff.handler
Timeout:  5 min (300s)   — longest a chat turn is expected to take
Memory:   512 MB

Environment variables (set in Lambda console):
  AGENT_ARN      — ARN of the existing AgentCore runtime
  ALLOWED_ORIGIN — CORS origin, e.g. https://main.xxx.amplifyapp.com
"""

import json
import os
import uuid
import boto3

AGENT_ARN      = os.environ["AGENT_ARN"]
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")

_client = None


def _agentcore_client():
    global _client
    if _client is None:
        _client = boto3.client("bedrock-agentcore")
    return _client


def _cors_headers() -> dict:
    return {
        "Access-Control-Allow-Origin":  ALLOWED_ORIGIN,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    }


def _sse(event_type: str, data: dict) -> str:
    payload = json.dumps({"type": event_type, **data})
    return f"data: {payload}\n\n"


def _parse_agentcore_sse(raw_text: str):
    """
    AgentCore streams SSE where each data line value is a JSON-encoded string
    that itself contains a JSON object (the Strands event).
    Format: data: "{\"contentBlockDelta\": ...}"\n\n
    """
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
                event = json.loads(decoded)
            elif isinstance(decoded, dict):
                event = decoded
            else:
                continue
            print("Strands event:", str(event)[:400])
            yield event
        except Exception as e:
            print(f"SSE parse error: {e}, line: {line[:200]}")


def _extract_sse_chunks(events):
    """Convert Strands streaming events into frontend-ready SSE chunks."""
    pending_tools: dict = {}

    for event in events:
        # Skip internal Strands lifecycle events
        if any(k in event for k in (
            "init_event_loop", "start", "start_event_loop",
            "stop_event_loop", "end_event_loop", "message", "result",
        )):
            continue

        if event.get("force_stop"):
            reason = event.get("force_stop_reason", "Agent stopped")
            print("Agent force_stop:", reason)
            yield _sse("text", {"content": f"\n[Agent stopped: {reason}]"})
            continue

        if "error" in event and "event" not in event:
            yield _sse("text", {"content": f"\n[Error: {event.get('error')}]"})
            continue

        bedrock_event = event.get("event")
        if not isinstance(bedrock_event, dict):
            continue

        # Text delta
        if "contentBlockDelta" in bedrock_event:
            cbd   = bedrock_event["contentBlockDelta"]
            idx   = cbd.get("contentBlockIndex", 0)
            delta = cbd.get("delta", {})
            if "text" in delta:
                if delta["text"]:
                    yield _sse("text", {"content": delta["text"]})
            elif "toolUse" in delta:
                chunk = delta["toolUse"].get("input", "")
                if idx in pending_tools:
                    pending_tools[idx]["input_chunks"].append(chunk)
            continue

        # Tool call starts
        if "contentBlockStart" in bedrock_event:
            cbs  = bedrock_event["contentBlockStart"]
            idx  = cbs.get("contentBlockIndex", 0)
            tool = cbs.get("start", {}).get("toolUse", {})
            if tool:
                pending_tools[idx] = {
                    "id":           tool.get("toolUseId", ""),
                    "name":         tool.get("name", ""),
                    "input_chunks": [],
                }
            continue

        # Tool call complete — flush accumulated input
        if "contentBlockStop" in bedrock_event:
            idx = bedrock_event["contentBlockStop"].get("contentBlockIndex", 0)
            if idx in pending_tools:
                tool = pending_tools.pop(idx)
                raw  = "".join(tool["input_chunks"])
                try:
                    tool_input = json.loads(raw) if raw else {}
                except Exception:
                    tool_input = {"raw": raw}
                yield _sse("tool_use", {
                    "id":    tool["id"],
                    "name":  tool["name"],
                    "input": tool_input,
                })
            continue

        # Tool result
        if "toolResult" in bedrock_event:
            tr = bedrock_event["toolResult"]
            yield _sse("tool_result", {
                "tool_use_id": tr.get("toolUseId", ""),
                "output":      str(tr.get("content", "")),
            })
            continue


def handler(event, context):
    # CORS preflight
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 204, "headers": _cors_headers(), "body": ""}

    try:
        body       = json.loads(event.get("body") or "{}")
        prompt     = body.get("prompt", "").strip()
        session_id = body.get("session_id", "") or ""
        if len(session_id) < 33:
            session_id = str(uuid.uuid4())
    except Exception:
        return {
            "statusCode": 400,
            "headers": {**_cors_headers(), "Content-Type": "application/json"},
            "body": json.dumps({"error": "Invalid request body"}),
        }

    if not prompt:
        return {
            "statusCode": 400,
            "headers": {**_cors_headers(), "Content-Type": "application/json"},
            "body": json.dumps({"error": "prompt is required"}),
        }

    def _stream_events():
        client = _agentcore_client()
        resp   = client.invoke_agent_runtime(
            agentRuntimeArn=AGENT_ARN,
            runtimeSessionId=session_id,
            payload=json.dumps({"prompt": prompt}),
        )
        streaming_body = resp.get("response")
        if streaming_body is None:
            print("No response key; got:", list(resp.keys()))
            return
        raw = streaming_body.read()
        print("AgentCore raw bytes:", len(raw))
        raw_text = raw.decode("utf-8", errors="replace")
        yield from _extract_sse_chunks(_parse_agentcore_sse(raw_text))

    return {
        "statusCode": 200,
        "headers": {
            **_cors_headers(),
            "Content-Type":    "text/event-stream",
            "Cache-Control":   "no-cache",
            "X-Accel-Buffering": "no",
        },
        "body": "".join(_stream_events()),
    }
