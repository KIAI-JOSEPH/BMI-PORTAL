"""
PocketBase ID Linker
====================
Run this AFTER you have imported collections 1–3 into PocketBase:
  1_campuses.csv  → campuses
  2_modules.csv   → modules
  3_courses.csv   → courses (with module_name column still as text)

This script:
  1. Fetches all records from campuses, modules, courses, students
     in your live PocketBase instance
  2. Rewrites 3_courses.csv   → replaces module_name  with real module_id
  3. Rewrites 4_students.csv  → replaces campus_name  with real campus_id
  4. Rewrites 5_academic_records.csv → replaces student_code + course_code
     with real student_id + course_id

Then you import the rewritten files in order: courses → students → academic_records

Usage
-----
  python link_ids.py --url http://127.0.0.1:8090 --token YOUR_ADMIN_TOKEN

Get the admin token from PocketBase → Settings → API keys (or log in via the
/api/admins/auth-with-password endpoint and copy the token from the response).
"""

import argparse, csv, json, os, sys
import urllib.request, urllib.error

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def fetch_all(base_url: str, token: str, collection: str) -> list[dict]:
    """Paginate through all records in a collection."""
    records, page = [], 1
    while True:
        url = f"{base_url}/api/collections/{collection}/records?page={page}&perPage=200&fields=id,name,code,student_code"
        req = urllib.request.Request(url, headers={"Authorization": token})
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read())
        except urllib.error.HTTPError as e:
            print(f"  ✗ HTTP {e.code} fetching {collection}: {e.read().decode()}")
            sys.exit(1)
        records.extend(data["items"])
        if page >= data["totalPages"]:
            break
        page += 1
    return records

def rewrite_csv(path: str, old_col: str, new_col: str, mapping: dict[str, str]) -> int:
    """Replace old_col values with IDs from mapping, rename column to new_col."""
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        print(f"  ⚠ {os.path.basename(path)} is empty — skipping")
        return 0

    missing = set()
    for row in rows:
        key = row[old_col]
        if key not in mapping:
            missing.add(key)
        else:
            row[new_col] = mapping[key]
            if old_col != new_col:
                del row[old_col]

    if missing:
        print(f"  ⚠ Could not map these '{old_col}' values — check spelling/casing:")
        for m in sorted(missing):
            print(f"      • {repr(m)}")

    fields = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return len(rows)

def main():
    parser = argparse.ArgumentParser(description="Link PocketBase IDs into import CSVs")
    parser.add_argument("--url",   required=True, help="PocketBase base URL, e.g. http://127.0.0.1:8090")
    parser.add_argument("--token", required=True, help="PocketBase admin auth token")
    args = parser.parse_args()

    base = args.url.rstrip("/")
    token = args.token

    print("\n── Fetching records from PocketBase ──────────────────────────────")

    # Campuses: id ← name
    print("  Fetching campuses …")
    campus_records = fetch_all(base, token, "campuses")
    campus_map = {r["name"]: r["id"] for r in campus_records}
    print(f"  Found {len(campus_map)} campuses: {list(campus_map.keys())}")

    # Modules: id ← name
    print("  Fetching modules …")
    module_records = fetch_all(base, token, "modules")
    module_map = {r["name"]: r["id"] for r in module_records}
    print(f"  Found {len(module_map)} modules: {list(module_map.keys())}")

    # Courses: id ← code
    print("  Fetching courses …")
    course_records = fetch_all(base, token, "courses")
    course_map = {r["code"]: r["id"] for r in course_records}
    print(f"  Found {len(course_map)} courses")

    # Students: id ← student_code
    print("  Fetching students …")
    student_records = fetch_all(base, token, "students")
    student_map = {r["student_code"]: r["id"] for r in student_records}
    print(f"  Found {len(student_map)} students")

    print("\n── Rewriting CSVs ────────────────────────────────────────────────")

    # 3_courses.csv: module_name → module_id
    path = os.path.join(SCRIPT_DIR, "3_courses.csv")
    n = rewrite_csv(path, "module_name", "module_id", module_map)
    print(f"  ✓ 3_courses.csv — {n} rows updated (module_name → module_id)")

    # 4_students.csv: campus_name → campus_id
    path = os.path.join(SCRIPT_DIR, "4_students.csv")
    n = rewrite_csv(path, "campus_name", "campus_id", campus_map)
    print(f"  ✓ 4_students.csv — {n} rows updated (campus_name → campus_id)")

    # 5_academic_records.csv: student_code → student_id, course_code → course_id
    path = os.path.join(SCRIPT_DIR, "5_academic_records.csv")
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    missing_students, missing_courses = set(), set()
    for row in rows:
        sc = row["student_code"]
        cc = row["course_code"]
        if sc in student_map:
            row["student_id"] = student_map[sc]
        else:
            missing_students.add(sc)
            row["student_id"] = ""
        if cc in course_map:
            row["course_id"] = course_map[cc]
        else:
            missing_courses.add(cc)
            row["course_id"] = ""
        del row["student_code"]
        del row["course_code"]

    if missing_students:
        print(f"  ⚠ Unmapped student_codes: {sorted(missing_students)}")
    if missing_courses:
        print(f"  ⚠ Unmapped course_codes: {sorted(missing_courses)}")

    fields = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"  ✓ 5_academic_records.csv — {len(rows)} rows updated (student_code → student_id, course_code → course_id)")

    print("\n── Done ──────────────────────────────────────────────────────────")
    print("  Import order for PocketBase Admin UI:")
    print("    3_courses.csv          (now has module_id)")
    print("    4_students.csv         (now has campus_id)")
    print("    5_academic_records.csv (now has student_id + course_id)")
    print()

if __name__ == "__main__":
    main()
