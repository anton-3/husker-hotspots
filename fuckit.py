import json
import time
import requests
import threading
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

# === CONFIG ===
BASE_URL = "http://127.0.0.1:42042"  # no trailing slash
# Display term name, as used in the /courses page and /api/terms endpoints
TERM_NAME = "Spring 2026"
COURSE_ENDPOINT_TEMPLATE = (
    f"{BASE_URL}/api/terms/{{term_name}}/subjects/{{subject}}/courses/{{number}}/regblocks"
)
INPUT_FILE = "courses.json"
OUTPUT_FILE = "all_course_sections.json"
FAIL_FILE = "failed_courses.json"
REQUEST_LOG_FILE = "request_log.jsonl"
SLEEP_SECONDS = 0.0
TIMEOUT = 12
MAX_WORKERS = 32


thread_local = threading.local()


def first_non_empty(*vals):
    for v in vals:
        if v is not None and str(v).strip():
            return str(v).strip()
    return ""


def extract_course_fields(course):
    subject = first_non_empty(course.get("subjectId"), course.get("subject"))
    number = first_non_empty(course.get("number"), course.get("course"))
    return subject, number


def is_valid_json_response(resp):
    if resp.status_code != 200:
        return False
    ctype = resp.headers.get("content-type", "").lower()
    if "application/json" not in ctype and not resp.text.strip().startswith(("{", "[")):
        return False
    try:
        data = resp.json()
    except Exception:
        return False

    # Accept only shapes that actually contain section/registration data
    if isinstance(data, dict):
        if "sections" in data and isinstance(data["sections"], list) and data["sections"]:
            return True
        if "registrationBlocks" in data and isinstance(data["registrationBlocks"], list) and data["registrationBlocks"]:
            return True
    if isinstance(data, list) and len(data) > 0:
        return True
    return False


def try_fetch(session, subject, number):
    url = COURSE_ENDPOINT_TEMPLATE.format(
        term_name=TERM_NAME,
        subject=subject,
        number=str(number).strip(),
    )

    try:
        started = time.perf_counter()
        resp = session.get(url, timeout=TIMEOUT)
        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)

        print(f"Trying {subject} {number} -> GET {resp.url} [{resp.status_code}] {elapsed_ms}ms")

        if is_valid_json_response(resp):
            return resp.json(), resp.url, resp.status_code, elapsed_ms, None

        error = f"http_{resp.status_code}"
        return None, resp.url, resp.status_code, elapsed_ms, error
    except requests.RequestException as e:
        print(f"Request error on {subject} {number}: {e}")
        return None, None, None, None, f"request_exception: {e}"


def get_thread_session():
    if getattr(thread_local, "session", None) is None:
        session = requests.Session()
        session.headers.update({
            "Accept": "application/json",
            "User-Agent": "raikeshacks2026/1.0",
        })
        thread_local.session = session
    return thread_local.session


def process_course(course):
    subject, number = extract_course_fields(course)
    now_iso = datetime.now(timezone.utc).isoformat()

    if not subject or not number:
        return {
            "ok": False,
            "course": course,
            "error": "missing_subject_or_number",
            "log": {
                "timestamp": now_iso,
                "subject": subject,
                "number": number,
                "url": None,
                "status": None,
                "elapsedMs": None,
                "ok": False,
                "error": "missing_subject_or_number",
            },
        }

    session = get_thread_session()
    data, final_url, status, elapsed_ms, error = try_fetch(session, subject, number)

    if data is not None:
        return {
            "ok": True,
            "course": f"{subject} {number}",
            "url": final_url,
            "response": data,
            "log": {
                "timestamp": now_iso,
                "subject": subject,
                "number": number,
                "url": final_url,
                "status": status,
                "elapsedMs": elapsed_ms,
                "ok": True,
                "error": None,
            },
        }

    return {
        "ok": False,
        "course": f"{subject} {number}",
        "status": status,
        "url": final_url,
        "error": error,
        "log": {
            "timestamp": now_iso,
            "subject": subject,
            "number": number,
            "url": final_url,
            "status": status,
            "elapsedMs": elapsed_ms,
            "ok": False,
            "error": error,
        },
    }


def persist(all_results, failed, logs):
    with open(OUTPUT_FILE, "w") as f:
        json.dump(all_results, f, indent=2)

    with open(FAIL_FILE, "w") as f:
        json.dump(failed, f, indent=2)

    with open(REQUEST_LOG_FILE, "w") as f:
        for row in logs:
            f.write(json.dumps(row) + "\n")


def main():
    with open(INPUT_FILE, "r") as f:
        courses = json.load(f)

    all_results = []
    failed = []
    logs = []
    workers = max(1, min(MAX_WORKERS, len(courses)))

    print(f"Starting fetch for {len(courses)} courses with {workers} workers...")

    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(process_course, course) for course in courses]

            for i, future in enumerate(as_completed(futures), start=1):
                result = future.result()
                logs.append(result["log"])

                if result["ok"]:
                    all_results.append({
                        "course": result["course"],
                        "url": result["url"],
                        "response": result["response"],
                    })
                    print(f"✓ Fetched {result['course']}")
                else:
                    failure_record = {
                        "course": result["course"],
                        "status": result.get("status"),
                        "url": result.get("url"),
                        "error": result.get("error"),
                    }
                    failed.append(failure_record)
                    print(f"✗ Failed {result['course']}")

                if i % 100 == 0:
                    print(f"Progress: {i}/{len(courses)}")
                    persist(all_results, failed, logs)

                if SLEEP_SECONDS > 0:
                    time.sleep(SLEEP_SECONDS)
    except KeyboardInterrupt:
        print("\nInterrupted. Saving partial results...")
    finally:
        persist(all_results, failed, logs)

    print(f"\nDone. Saved {len(all_results)} successes to {OUTPUT_FILE}")
    print(f"Saved {len(failed)} failures to {FAIL_FILE}")
    print(f"Saved {len(logs)} request logs to {REQUEST_LOG_FILE}")


if __name__ == "__main__":
    main()