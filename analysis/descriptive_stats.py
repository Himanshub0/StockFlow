"""
Computes descriptive statistics from survey results using Python standard library.
"""
import csv
import statistics
from pathlib import Path

DATA_PATH = Path(__file__).parent / "survey_template.csv"

def compute_stats():
    if not DATA_PATH.exists():
        print(f"Data file not found: {DATA_PATH}")
        return

    speeds = []
    clarity_scores = []

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                speeds.append(float(row["intake_speed_seconds"]))
                clarity_scores.append(int(row["clarity_rating"]))
            except (ValueError, KeyError):
                continue

    if speeds:
        print("=== INTAKE SPEED (SECONDS) ===")
        print(f"  Count:  {len(speeds)}")
        print(f"  Mean:   {statistics.mean(speeds):.2f}s")
        print(f"  Median: {statistics.median(speeds):.2f}s")
        print(f"  StDev:  {statistics.stdev(speeds):.2f}s" if len(speeds) > 1 else "  StDev: N/A")

    if clarity_scores:
        print("\n=== CLARITY RATING (1-5 SCALE) ===")
        print(f"  Mean:   {statistics.mean(clarity_scores):.2f}")
        print(f"  Median: {statistics.median(clarity_scores):.2f}")

if __name__ == "__main__":
    compute_stats()
