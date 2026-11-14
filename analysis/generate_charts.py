"""
Generates lightweight SVG visualizations of survey and task metrics using standard library.
"""
from pathlib import Path

OUTPUT_SVG = Path(__file__).parent / "performance_chart.svg"

def generate_svg_barchart(labels, values, max_val, title="Task Completion Times (s)"):
    width, height = 500, 240
    bar_height = 24
    gap = 14
    margin_top = 45
    margin_left = 130
    chart_width = 320

    svg_lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" style="background:#0F172A;font-family:sans-serif;">',
        f'  <text x="20" y="28" fill="#F8FAFC" font-size="14" font-weight="bold">{title}</text>'
    ]

    for idx, (label, val) in enumerate(zip(labels, values)):
        y = margin_top + idx * (bar_height + gap)
        w = (val / max_val) * chart_width
        svg_lines.append(f'  <text x="{margin_left - 10}" y="{y + 16}" fill="#94A3B8" font-size="11" text-anchor="end">{label}</text>')
        svg_lines.append(f'  <rect x="{margin_left}" y="{y}" width="{w:.1f}" height="{bar_height}" rx="4" fill="#6366F1"/>')
        svg_lines.append(f'  <text x="{margin_left + w + 8}" y="{y + 16}" fill="#38BDF8" font-size="11" font-weight="600">{val}s</text>')

    svg_lines.append('</svg>')
    return "\n".join(svg_lines)

if __name__ == "__main__":
    labels = ["SKU Search", "Inbound Intake", "Product Create", "Transfer"]
    times = [3.2, 11.5, 22.0, 16.4]
    svg_content = generate_svg_barchart(labels, times, 25.0)
    with open(OUTPUT_SVG, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated chart at {OUTPUT_SVG}")
