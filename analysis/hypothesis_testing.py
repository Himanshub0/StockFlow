"""
Performs standard two-sample hypothesis testing calculations using pure Python math.
"""
import math
import statistics

def two_sample_t_test(sample1, sample2):
    """
    Computes two-sample t-statistic and degrees of freedom for independent samples.
    """
    n1, n2 = len(sample1), len(sample2)
    if n1 < 2 or n2 < 2:
        raise ValueError("Each sample must have at least 2 observations.")

    m1, m2 = statistics.mean(sample1), statistics.mean(sample2)
    s1, s2 = statistics.stdev(sample1), statistics.stdev(sample2)

    # Pooled variance
    sp2 = (((n1 - 1) * (s1 ** 2)) + ((n2 - 1) * (s2 ** 2))) / (n1 + n2 - 2)
    se = math.sqrt(sp2 * (1 / n1 + 1 / n2))

    t_stat = (m1 - m2) / se if se != 0 else 0.0
    df = n1 + n2 - 2

    return {
        "mean_diff": m1 - m2,
        "t_statistic": t_stat,
        "degrees_of_freedom": df
    }

if __name__ == "__main__":
    # Baseline manual system times vs StockFlow prototype times
    legacy_times = [18.2, 22.5, 19.8, 25.1, 21.0, 24.3]
    stockflow_times = [11.5, 12.0, 9.8, 14.2, 10.5, 11.0]

    result = two_sample_t_test(legacy_times, stockflow_times)
    print("=== HYPOTHESIS TEST: INTAKE SPEED COMPARISON ===")
    print(f"  Mean Legacy Time:    {statistics.mean(legacy_times):.2f}s")
    print(f"  Mean StockFlow Time: {statistics.mean(stockflow_times):.2f}s")
    print(f"  Mean Time Reduction: {result['mean_diff']:.2f}s")
    print(f"  t-statistic:         {result['t_statistic']:.4f}")
    print(f"  Degrees of Freedom:  {result['degrees_of_freedom']}")
