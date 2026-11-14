"""
Analyzes prototype task completion times and success rates using standard library.
"""
import csv
from pathlib import Path

TASKS_PATH = Path(__file__).parent / "prototype_testing_template.csv"

def analyze_prototype_results():
    if not TASKS_PATH.exists():
        print(f"Data file not found: {TASKS_PATH}")
        return

    tasks = []
    with open(TASKS_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tasks.append(row)

    print(f"Total prototype tasks tested: {len(tasks)}")
    success_count = sum(1 for t in tasks if t["completed_successfully"].strip().upper() == "TRUE")
    print(f"Success rate: {(success_count / len(tasks)) * 100:.1f}%" if tasks else "No tasks")

    for t in tasks:
        exp = float(t["expected_time_sec"])
        act = float(t["actual_time_sec"])
        delta = act - exp
        sign = "+" if delta > 0 else ""
        print(f"  {t['task_id']} ({t['task_name']}): {act}s (expected {exp}s, delta {sign}{delta:.1f}s)")

if __name__ == "__main__":
    analyze_prototype_results()
