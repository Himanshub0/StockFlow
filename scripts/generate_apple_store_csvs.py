"""Generate large, realistic Apple Store CSV sheets matching StockFlow's schema."""

import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

SUPPLIERS = [
    ("SUP-APL-IND", "Apple India Pvt Ltd (Direct Cupertino Supply)", "Tier A", "Vikramaditya Rao", "b2b-supply@apple-india.example", "+91 80 4045 5100", 2, 4.95, "active"),
    ("SUP-INGRAM", "Ingram Micro India (Apple Authorized Dist.)", "Tier A", "Siddharth Kulkarni", "apple.desk@ingrammicro-in.example", "+91 22 6796 0100", 3, 4.85, "active"),
    ("SUP-REDING", "Redington Limited (Apple Enterprise & Retail)", "Tier A", "Meenakshi Sundaram", "orders.apple@redington-in.example", "+91 44 4224 3353", 3, 4.80, "active"),
    ("SUP-BEATS", "Beats Electronics Distribution", "Tier A", "Arjun Malhotra", "channel@beats-supply.example", "+91 22 4890 2210", 4, 4.70, "active"),
    ("SUP-APPCARE", "AppleCare Services & Protection India", "Tier A", "Neha Kapoor", "applecare.ops@apple-india.example", "+91 80 4045 5200", 1, 4.98, "active"),
    ("SUP-BELKIN", "Belkin Certified MagSafe & Power Supply", "Tier B", "Rohan Deshpande", "retail@belkin-dist.example", "+91 22 6128 7700", 5, 4.60, "active"),
    ("SUP-LOGI", "Logitech Apple Workspace Accessories", "Tier B", "Ananya Chatterjee", "apple.channel@logi-dist.example", "+91 11 4560 9900", 5, 4.55, "active"),
    ("SUP-OTTER", "OtterBox & Tech21 Protection Hub", "Tier B", "Karanveer Gill", "orders@otter-india.example", "+91 124 411 8820", 6, 4.40, "active"),
    ("SUP-SATECHI", "Satechi & Twelve South Studio Gear", "Tier B", "Divya Menon", "b2b@studiogear-in.example", "+91 80 4112 3400", 7, 4.50, "active"),
    ("SUP-LEGACY", "Legacy Lightning & Intel Service Parts", "Tier C", "Prakash Iyer", "parts@legacy-apple.example", "+91 44 2815 9011", 14, 4.10, "inactive"),
]

SUPPLIER_NAMES = {s[0]: s[1] for s in SUPPLIERS}


def status_for(stock, min_stock):
    if stock == 0:
        return "out_of_stock"
    if stock <= min_stock:
        return "low_stock"
    return "in_stock"


def build_products():
    rng = random.Random(20261110)
    items = []

    def add(sku, name, category, unit_price, current_stock, min_stock, max_stock, supplier_code):
        items.append({
            "sku": sku,
            "name": name,
            "category": category,
            "unit_price": f"{unit_price:.2f}",
            "current_stock": current_stock,
            "min_stock": min_stock,
            "max_stock": max_stock,
            "supplier_code": supplier_code,
            "supplier_name": SUPPLIER_NAMES[supplier_code],
            "status": status_for(current_stock, min_stock),
        })

    # 1. iPhone Lineup (~60 SKUs)
    ip16pm_colors = [("DT", "Desert Titanium"), ("NT", "Natural Titanium"), ("WT", "White Titanium"), ("BT", "Black Titanium")]
    for cap, price, min_s, max_s in [("256GB", 144900, 12, 120), ("512GB", 164900, 8, 80), ("1TB", 184900, 5, 45)]:
        for c_code, c_name in ip16pm_colors:
            if cap == "1TB" and c_code == "DT":
                stock = 0  # Hot seller out of stock
            elif cap == "256GB" and c_code == "DT":
                stock = 6  # Low stock alert
            elif cap == "512GB" and c_code == "WT":
                stock = 5
            else:
                stock = rng.randint(min_s + 6, int(max_s * 0.75))
            add(f"APL-IP16PM-{cap}-{c_code}", f"iPhone 16 Pro Max {cap} ({c_name})", "iPhone", price, stock, min_s, max_s, "SUP-APL-IND")

    for cap, price, min_s, max_s in [("128GB", 119900, 14, 140), ("256GB", 129900, 14, 140), ("512GB", 149900, 8, 70), ("1TB", 169900, 4, 35)]:
        for c_code, c_name in ip16pm_colors:
            if cap == "128GB" and c_code == "NT":
                stock = 9
            elif cap == "1TB" and c_code == "WT":
                stock = 0
            elif cap == "256GB" and c_code == "DT":
                stock = 11
            else:
                stock = rng.randint(min_s + 5, int(max_s * 0.8))
            add(f"APL-IP16P-{cap}-{c_code}", f"iPhone 16 Pro {cap} ({c_name})", "iPhone", price, stock, min_s, max_s, "SUP-APL-IND")

    ip16_colors = [("UM", "Ultramarine"), ("TL", "Teal"), ("PK", "Pink"), ("WT", "White"), ("BK", "Black")]
    for cap, price, min_s, max_s in [("128GB", 79900, 18, 180), ("256GB", 89900, 14, 140), ("512GB", 109900, 6, 55)]:
        for c_code, c_name in ip16_colors:
            stock = 10 if (cap == "128GB" and c_code == "UM") else rng.randint(min_s + 8, int(max_s * 0.85))
            add(f"APL-IP16-{cap}-{c_code}", f"iPhone 16 {cap} ({c_name})", "iPhone", price, stock, min_s, max_s, "SUP-INGRAM")

    for cap, price, min_s, max_s in [("128GB", 89900, 10, 100), ("256GB", 99900, 8, 80), ("512GB", 119900, 4, 40)]:
        for c_code, c_name in ip16_colors[:4]:
            stock = 4 if (cap == "256GB" and c_code == "TL") else rng.randint(min_s + 4, int(max_s * 0.75))
            add(f"APL-IP16PL-{cap}-{c_code}", f"iPhone 16 Plus {cap} ({c_name})", "iPhone", price, stock, min_s, max_s, "SUP-INGRAM")

    for cap, price in [("128GB", 59900), ("256GB", 69900), ("512GB", 89900)]:
        for c_code, c_name in [("BK", "Black"), ("WT", "White")]:
            stock = 12 if (cap == "128GB" and c_code == "BK") else rng.randint(22, 85)
            add(f"APL-IP16E-{cap}-{c_code}", f"iPhone 16e {cap} ({c_name})", "iPhone", price, stock, 15, 130, "SUP-REDING")

    for cap, price in [("128GB", 69900), ("256GB", 79900)]:
        for c_code, c_name in [("BK", "Black"), ("BL", "Blue"), ("PK", "Pink"), ("GR", "Green")]:
            stock = 0 if (cap == "256GB" and c_code == "GR") else rng.randint(14, 60)
            add(f"APL-IP15-{cap}-{c_code}", f"iPhone 15 {cap} ({c_name})", "iPhone", price, stock, 10, 90, "SUP-REDING")

    for c_code, c_name in [("MD", "Midnight"), ("SL", "Starlight"), ("BL", "Blue")]:
        add(f"APL-IP14-128-{c_code}", f"iPhone 14 128GB ({c_name})", "iPhone", 59900, rng.randint(8, 35), 6, 50, "SUP-REDING")

    # 2. Mac Lineup (~54 SKUs)
    mba_colors = [("SB", "Sky Blue"), ("MD", "Midnight"), ("SL", "Starlight"), ("SV", "Silver")]
    for size, base_p in [("13", 99900), ("15", 124900)]:
        for spec, delta, min_s, max_s in [("16GB-256GB", 0, 8, 60), ("16GB-512GB", 20000, 6, 50), ("24GB-512GB", 40000, 4, 30)]:
            for c_code, c_name in mba_colors:
                stock = 3 if (size == "13" and spec == "16GB-256GB" and c_code == "SB") else (0 if (size == "15" and spec == "24GB-512GB" and c_code == "SL") else rng.randint(min_s + 3, int(max_s * 0.8)))
                add(f"APL-MBA{size}-M4-{spec}-{c_code}", f"MacBook Air {size}-inch M4 ({spec.replace('-', ' / ')}, {c_name})", "Mac", base_p + delta, stock, min_s, max_s, "SUP-APL-IND")

    for spec, price in [("16GB-256GB", 94900), ("16GB-512GB", 114900)]:
        for c_code, c_name in [("MD", "Midnight"), ("SG", "Space Gray"), ("SL", "Starlight")]:
            add(f"APL-MBA13-M3-{spec}-{c_code}", f"MacBook Air 13-inch M3 ({spec.replace('-', ' / ')}, {c_name})", "Mac", price, rng.randint(6, 28), 4, 40, "SUP-INGRAM")

    mbp_colors = [("SPB", "Space Black"), ("SV", "Silver")]
    mbp14_configs = [
        ("M4-16GB-512GB", "M4 16GB / 512GB", 169900, 6, 40),
        ("M4-16GB-1TB", "M4 16GB / 1TB", 189900, 4, 30),
        ("M4P-24GB-512GB", "M4 Pro 24GB / 512GB", 199900, 5, 35),
        ("M4P-24GB-1TB", "M4 Pro 24GB / 1TB", 239900, 4, 25),
        ("M4X-36GB-1TB", "M4 Max 36GB / 1TB", 319900, 2, 14),
    ]
    for cfg, desc, price, min_s, max_s in mbp14_configs:
        for c_code, c_name in mbp_colors:
            stock = 2 if (cfg == "M4P-24GB-512GB" and c_code == "SPB") else rng.randint(min_s + 2, int(max_s * 0.75))
            add(f"APL-MBP14-{cfg}-{c_code}", f"MacBook Pro 14-inch {desc} ({c_name})", "Mac", price, stock, min_s, max_s, "SUP-APL-IND")

    mbp16_configs = [
        ("M4P-24GB-512GB", "M4 Pro 24GB / 512GB", 249900, 4, 25),
        ("M4P-48GB-512GB", "M4 Pro 48GB / 512GB", 289900, 3, 18),
        ("M4X-36GB-1TB", "M4 Max 36GB / 1TB", 349900, 2, 12),
        ("M4X-48GB-1TB", "M4 Max 48GB / 1TB", 399900, 2, 10),
    ]
    for cfg, desc, price, min_s, max_s in mbp16_configs:
        for c_code, c_name in mbp_colors:
            stock = 0 if (cfg == "M4X-48GB-1TB" and c_code == "SV") else rng.randint(min_s + 1, int(max_s * 0.7))
            add(f"APL-MBP16-{cfg}-{c_code}", f"MacBook Pro 16-inch {desc} ({c_name})", "Mac", price, stock, min_s, max_s, "SUP-APL-IND")

    for c_code, c_name in [("BL", "Blue"), ("PR", "Purple"), ("PK", "Pink"), ("OR", "Orange"), ("GR", "Green"), ("SV", "Silver")]:
        add(f"APL-IMAC24-M4-256-{c_code}", f"iMac 24-inch M4 16GB / 256GB ({c_name})", "Mac", 134900, rng.randint(4, 16), 3, 22, "SUP-REDING")
    for c_code, c_name in [("BL", "Blue"), ("SV", "Silver")]:
        add(f"APL-IMAC24-M4-512-{c_code}", f"iMac 24-inch M4 16GB / 512GB ({c_name})", "Mac", 154900, rng.randint(3, 12), 2, 18, "SUP-REDING")

    mac_desktops = [
        ("APL-MMINI-M4-256", "Mac mini M4 16GB / 256GB", 59900, 24, 8, 60, "SUP-INGRAM"),
        ("APL-MMINI-M4-512", "Mac mini M4 16GB / 512GB", 79900, 18, 6, 45, "SUP-INGRAM"),
        ("APL-MMINI-M4-24-512", "Mac mini M4 24GB / 512GB", 99900, 11, 4, 30, "SUP-INGRAM"),
        ("APL-MMINI-M4P-512", "Mac mini M4 Pro 24GB / 512GB", 149900, 3, 4, 20, "SUP-APL-IND"),
        ("APL-MSTUDIO-M2MAX", "Mac Studio M2 Max 32GB / 512GB", 209900, 6, 2, 15, "SUP-APL-IND"),
        ("APL-MSTUDIO-M3ULT", "Mac Studio M3 Ultra 96GB / 1TB", 419900, 0, 2, 8, "SUP-APL-IND"),
        ("APL-MACPRO-M2ULT", "Mac Pro Tower M2 Ultra 64GB / 1TB", 729900, 2, 1, 5, "SUP-APL-IND"),
        ("APL-SDISPLAY-STD", "Apple Studio Display 27-inch 5K (Standard Glass, Tilt)", 159900, 9, 3, 20, "SUP-APL-IND"),
        ("APL-SDISPLAY-NANO", "Apple Studio Display 27-inch 5K (Nano-texture, Tilt/Height)", 199900, 1, 2, 10, "SUP-APL-IND"),
        ("APL-PROXDR-STD", "Apple Pro Display XDR 32-inch 6K Retina", 449900, 2, 1, 6, "SUP-APL-IND"),
    ]
    for row in mac_desktops:
        add(*row[:2], "Mac", *row[2:])

    # 3. iPad Lineup (~40 SKUs)
    for size, base_p in [("11", 99900), ("13", 129900)]:
        for cap, delta, min_s, max_s in [("256GB-WIFI", 0, 8, 55), ("512GB-WIFI", 20000, 5, 35), ("1TB-WIFI", 60000, 3, 20), ("256GB-CELL", 20000, 4, 25), ("1TB-NANO-CELL", 90000, 2, 12)]:
            for c_code, c_name in mbp_colors:
                stock = 2 if (size == "13" and cap == "256GB-WIFI" and c_code == "SPB") else (0 if (size == "13" and cap == "1TB-NANO-CELL" and c_code == "SV") else rng.randint(min_s + 2, int(max_s * 0.75)))
                add(f"APL-IPADP{size}-M4-{cap}-{c_code}", f"iPad Pro {size}-inch M4 {cap.replace('-', ' ')} ({c_name})", "iPad", base_p + delta, stock, min_s, max_s, "SUP-APL-IND")

    air_colors = [("SG", "Space Gray"), ("BL", "Blue"), ("PR", "Purple"), ("SL", "Starlight")]
    for size, base_p in [("11", 59900), ("13", 79900)]:
        for cap, delta in [("128GB-WIFI", 0), ("256GB-WIFI", 10000), ("512GB-WIFI", 30000)]:
            for c_code, c_name in air_colors[:3]:
                stock = 5 if (size == "11" and cap == "128GB-WIFI" and c_code == "BL") else rng.randint(10, 42)
                add(f"APL-IPADA{size}-M3-{cap}-{c_code}", f"iPad Air {size}-inch M3 {cap.replace('-', ' ')} ({c_name})", "iPad", base_p + delta, stock, 6, 55, "SUP-INGRAM")

    for cap, price in [("128GB-WIFI", 34900), ("256GB-WIFI", 44900), ("512GB-WIFI", 64900)]:
        for c_code, c_name in [("BL", "Blue"), ("PK", "Pink"), ("YL", "Yellow"), ("SV", "Silver")]:
            add(f"APL-IPAD11-{cap}-{c_code}", f"iPad (A16) {cap.replace('-', ' ')} ({c_name})", "iPad", price, rng.randint(15, 70), 10, 90, "SUP-REDING")

    for cap, price in [("128GB-WIFI", 49900), ("256GB-WIFI", 59900), ("512GB-WIFI", 79900)]:
        for c_code, c_name in [("SG", "Space Gray"), ("BL", "Blue"), ("PR", "Purple")]:
            add(f"APL-IPADM7-{cap}-{c_code}", f"iPad mini (A17 Pro) {cap.replace('-', ' ')} ({c_name})", "iPad", price, rng.randint(8, 32), 5, 45, "SUP-INGRAM")

    # 4. Apple Watch Lineup (~36 SKUs)
    watch_items = [
        ("APL-AWU2-NT-TRAIL", "Apple Watch Ultra 2 49mm Natural Titanium (Blue Trail Loop)", 89900, 14, 5, 40, "SUP-APL-IND"),
        ("APL-AWU2-NT-OCEAN", "Apple Watch Ultra 2 49mm Natural Titanium (Navy Ocean Band)", 89900, 11, 5, 40, "SUP-APL-IND"),
        ("APL-AWU2-BT-ALPINE", "Apple Watch Ultra 2 49mm Black Titanium (Dark Green Alpine Loop)", 89900, 4, 5, 40, "SUP-APL-IND"),
        ("APL-AWU2-BT-MILAN", "Apple Watch Ultra 2 49mm Black Titanium (Black Milanese Loop)", 99900, 0, 3, 25, "SUP-APL-IND"),
        ("APL-AWS10-42G-JB", "Apple Watch Series 10 GPS 42mm Jet Black Aluminum (Sport Band)", 46900, 28, 10, 80, "SUP-INGRAM"),
        ("APL-AWS10-42G-RG", "Apple Watch Series 10 GPS 42mm Rose Gold Aluminum (Plum Sport Loop)", 46900, 22, 10, 80, "SUP-INGRAM"),
        ("APL-AWS10-42G-SV", "Apple Watch Series 10 GPS 42mm Silver Aluminum (Denim Sport Band)", 46900, 19, 10, 80, "SUP-INGRAM"),
        ("APL-AWS10-46G-JB", "Apple Watch Series 10 GPS 46mm Jet Black Aluminum (Sport Band)", 49900, 7, 10, 90, "SUP-INGRAM"),
        ("APL-AWS10-46G-RG", "Apple Watch Series 10 GPS 46mm Rose Gold Aluminum (Sport Loop)", 49900, 16, 8, 70, "SUP-INGRAM"),
        ("APL-AWS10-46G-SV", "Apple Watch Series 10 GPS 46mm Silver Aluminum (Sport Band)", 49900, 24, 8, 70, "SUP-INGRAM"),
        ("APL-AWS10-42C-JB", "Apple Watch Series 10 GPS+Cellular 42mm Jet Black Aluminum", 56900, 12, 6, 50, "SUP-REDING"),
        ("APL-AWS10-46C-JB", "Apple Watch Series 10 GPS+Cellular 46mm Jet Black Aluminum", 59900, 15, 6, 50, "SUP-REDING"),
        ("APL-AWS10-42T-SL", "Apple Watch Series 10 GPS+Cellular 42mm Slate Titanium (Milanese)", 79900, 6, 3, 24, "SUP-APL-IND"),
        ("APL-AWS10-46T-NT", "Apple Watch Series 10 GPS+Cellular 46mm Natural Titanium (Milanese)", 84900, 2, 3, 24, "SUP-APL-IND"),
        ("APL-AWS10-46T-GD", "Apple Watch Series 10 GPS+Cellular 46mm Gold Titanium (Milanese)", 84900, 5, 3, 20, "SUP-APL-IND"),
        ("APL-AWSE-40G-MD", "Apple Watch SE (2nd Gen) GPS 40mm Midnight Aluminum", 24900, 42, 12, 100, "SUP-REDING"),
        ("APL-AWSE-40G-SL", "Apple Watch SE (2nd Gen) GPS 40mm Starlight Aluminum", 24900, 35, 12, 100, "SUP-REDING"),
        ("APL-AWSE-44G-MD", "Apple Watch SE (2nd Gen) GPS 44mm Midnight Aluminum", 27900, 31, 10, 90, "SUP-REDING"),
        ("APL-AWSE-44G-SV", "Apple Watch SE (2nd Gen) GPS 44mm Silver Aluminum", 27900, 24, 10, 90, "SUP-REDING"),
        ("APL-AWSE-44C-MD", "Apple Watch SE (2nd Gen) GPS+Cellular 44mm Midnight Aluminum", 32900, 14, 6, 50, "SUP-REDING"),
        ("APL-AWB-MILAN-SL", "46mm Slate Milanese Loop Band", 9500, 18, 6, 45, "SUP-APL-IND"),
        ("APL-AWB-MILAN-NT", "46mm Natural Milanese Loop Band", 9500, 14, 6, 45, "SUP-APL-IND"),
        ("APL-AWB-LINK-SB", "46mm Space Black Link Bracelet", 34900, 4, 2, 15, "SUP-APL-IND"),
        ("APL-AWB-OCEAN-NV", "49mm Navy Ocean Band (Natural Titanium Finish)", 9500, 21, 6, 50, "SUP-APL-IND"),
        ("APL-AWB-TRAIL-BL", "49mm Blue Trail Loop M/L", 9500, 16, 6, 50, "SUP-APL-IND"),
        ("APL-AWB-ALPINE-DG", "49mm Dark Green Alpine Loop M", 9500, 5, 6, 45, "SUP-APL-IND"),
        ("APL-AWB-NIKE-SL", "46mm Nike Sport Loop (Black/Blue)", 4500, 38, 12, 90, "SUP-INGRAM"),
        ("APL-AWB-NIKE-VG", "46mm Nike Sport Band (Volt/Anthracite)", 4500, 29, 12, 90, "SUP-INGRAM"),
        ("APL-AWB-SPORT-MD", "46mm Midnight Sport Band M/L", 4500, 54, 15, 120, "SUP-INGRAM"),
        ("APL-AWB-SPORT-PL", "42mm Plum Sport Band S/M", 4500, 31, 10, 80, "SUP-INGRAM"),
        ("APL-AWB-BRAID-LB", "46mm Lake Green Braided Solo Loop (Size 6)", 9500, 9, 4, 30, "SUP-APL-IND"),
        ("APL-AWB-BRAID-DN", "42mm Denim Braided Solo Loop (Size 5)", 9500, 0, 4, 30, "SUP-APL-IND"),
        ("APL-AWB-MAG-SB", "46mm Magnetic Link (Black S/M)", 9500, 11, 5, 35, "SUP-APL-IND"),
        ("APL-AWB-MAG-DK", "46mm Magnetic Link (Dark Taupe M/L)", 9500, 13, 5, 35, "SUP-APL-IND"),
        ("APL-AWB-HERM-OR", "Apple Watch Hermes 46mm Orange Kilim Single Tour", 34900, 3, 2, 10, "SUP-APL-IND"),
        ("APL-AWB-HERM-NO", "Apple Watch Hermes 46mm Noir Toile H Single Tour", 34900, 2, 2, 10, "SUP-APL-IND"),
    ]
    for row in watch_items:
        add(*row[:2], "Apple Watch", *row[2:])

    # 5. AirPods & Audio (~18 SKUs)
    audio_items = [
        ("APL-AP4-STD", "AirPods 4 (Open-Ear, USB-C Charging Case)", 12900, 95, 25, 220, "SUP-APL-IND"),
        ("APL-AP4-ANC", "AirPods 4 with Active Noise Cancellation", 17900, 74, 25, 200, "SUP-APL-IND"),
        ("APL-APP2-USBC", "AirPods Pro (2nd Gen) with MagSafe Case (USB-C)", 24900, 118, 30, 260, "SUP-APL-IND"),
        ("APL-APM-USBC-MD", "AirPods Max (USB-C) — Midnight", 59900, 16, 6, 45, "SUP-APL-IND"),
        ("APL-APM-USBC-SL", "AirPods Max (USB-C) — Starlight", 59900, 12, 6, 40, "SUP-APL-IND"),
        ("APL-APM-USBC-BL", "AirPods Max (USB-C) — Blue", 59900, 9, 5, 35, "SUP-APL-IND"),
        ("APL-APM-USBC-PR", "AirPods Max (USB-C) — Purple", 59900, 5, 5, 35, "SUP-APL-IND"),
        ("APL-APM-USBC-OR", "AirPods Max (USB-C) — Orange", 59900, 2, 5, 30, "SUP-APL-IND"),
        ("APL-HMP2-MD", "HomePod (2nd Gen) — Midnight", 32900, 14, 5, 35, "SUP-INGRAM"),
        ("APL-HMP2-WT", "HomePod (2nd Gen) — White", 32900, 11, 5, 35, "SUP-INGRAM"),
        ("APL-HMPM-SG", "HomePod mini — Space Gray", 10900, 34, 12, 90, "SUP-REDING"),
        ("APL-HMPM-WT", "HomePod mini — White", 10900, 29, 12, 90, "SUP-REDING"),
        ("APL-HMPM-BL", "HomePod mini — Blue", 10900, 18, 8, 70, "SUP-REDING"),
        ("APL-HMPM-YL", "HomePod mini — Yellow", 10900, 12, 8, 60, "SUP-REDING"),
        ("APL-HMPM-OR", "HomePod mini — Orange", 10900, 7, 8, 60, "SUP-REDING"),
        ("APL-EARP-USBC", "EarPods (USB-C)", 2000, 145, 30, 300, "SUP-INGRAM"),
        ("APL-EARP-35MM", "EarPods (3.5mm Headphone Plug)", 2000, 48, 15, 120, "SUP-INGRAM"),
        ("APL-EARP-LGT", "EarPods (Lightning Connector)", 2000, 0, 10, 80, "SUP-LEGACY"),
    ]
    for row in audio_items:
        add(*row[:2], "AirPods & Audio", *row[2:])

    # 6. Beats (~14 SKUs)
    beats_items = [
        ("BTS-STPRO-BK", "Beats Studio Pro Wireless Headphones — Black", 37900, 18, 6, 45, "SUP-BEATS"),
        ("BTS-STPRO-NV", "Beats Studio Pro Wireless Headphones — Navy", 37900, 12, 5, 40, "SUP-BEATS"),
        ("BTS-STPRO-SS", "Beats Studio Pro Wireless Headphones — Sandstone", 37900, 0, 5, 35, "SUP-BEATS"),
        ("BTS-SOLO4-BK", "Beats Solo 4 On-Ear Headphones — Matte Black", 22900, 26, 8, 60, "SUP-BEATS"),
        ("BTS-SOLO4-SB", "Beats Solo 4 On-Ear Headphones — Slate Blue", 22900, 19, 8, 55, "SUP-BEATS"),
        ("BTS-SOLO4-PK", "Beats Solo 4 On-Ear Headphones — Cloud Pink", 22900, 14, 6, 50, "SUP-BEATS"),
        ("BTS-SBUD-BK", "Beats Solo Buds True Wireless — Matte Black", 6900, 58, 15, 140, "SUP-BEATS"),
        ("BTS-SBUD-TR", "Beats Solo Buds True Wireless — Transparent Red", 6900, 32, 12, 100, "SUP-BEATS"),
        ("BTS-SBP-TR", "Beats Studio Buds + — Transparent", 18900, 22, 8, 65, "SUP-BEATS"),
        ("BTS-SBP-BG", "Beats Studio Buds + — Black / Gold", 18900, 15, 8, 60, "SUP-BEATS"),
        ("BTS-PILL-BK", "Beats Pill Portable Bluetooth Speaker — Matte Black", 16900, 24, 8, 65, "SUP-BEATS"),
        ("BTS-PILL-RD", "Beats Pill Portable Bluetooth Speaker — Statement Red", 16900, 6, 8, 60, "SUP-BEATS"),
        ("BTS-FITPRO-BK", "Beats Fit Pro Wireless Earbuds — Beats Black", 22000, 19, 6, 50, "SUP-BEATS"),
        ("BTS-PBP2-OR", "Powerbeats Pro 2 — Electric Orange", 29900, 11, 5, 40, "SUP-BEATS"),
    ]
    for row in beats_items:
        add(*row[:2], "Beats", *row[2:])

    # 7. Apple TV & Vision (~8 SKUs)
    tv_vision_items = [
        ("APL-ATV4K-64", "Apple TV 4K (3rd Gen) 64GB Wi-Fi", 14900, 36, 10, 90, "SUP-INGRAM"),
        ("APL-ATV4K-128", "Apple TV 4K (3rd Gen) 128GB Wi-Fi + Ethernet", 16900, 44, 12, 110, "SUP-INGRAM"),
        ("APL-SIRI-REM3", "Siri Remote (3rd Gen, USB-C)", 6500, 28, 8, 65, "SUP-REDING"),
        ("APL-AVP-256", "Apple Vision Pro 256GB (Retail Allocation)", 289900, 4, 2, 10, "SUP-APL-IND"),
        ("APL-AVP-512", "Apple Vision Pro 512GB (Retail Allocation)", 309900, 3, 2, 10, "SUP-APL-IND"),
        ("APL-AVP-1TB", "Apple Vision Pro 1TB (Enterprise Demo Unit)", 329900, 1, 2, 6, "SUP-APL-IND"),
        ("APL-AVP-CASE", "Apple Vision Pro Travel Case", 19900, 7, 3, 20, "SUP-APL-IND"),
        ("APL-AVP-BATT", "Apple Vision Pro External Battery Pack", 19900, 9, 3, 20, "SUP-APL-IND"),
    ]
    for row in tv_vision_items:
        add(*row[:2], "Apple TV & Vision", *row[2:])

    # 8. iPad & Mac Input Devices (~22 SKUs)
    input_items = [
        ("APL-PEN-PRO", "Apple Pencil Pro", 11900, 64, 18, 150, "SUP-APL-IND"),
        ("APL-PEN-USBC", "Apple Pencil (USB-C)", 7900, 82, 20, 180, "SUP-INGRAM"),
        ("APL-PEN-G2", "Apple Pencil (2nd Generation)", 11900, 24, 8, 70, "SUP-REDING"),
        ("APL-PEN-G1", "Apple Pencil (1st Generation)", 9500, 9, 5, 35, "SUP-LEGACY"),
        ("APL-MKIP13-BK", "Magic Keyboard for iPad Pro 13-inch (M4) — Black", 33900, 18, 6, 45, "SUP-APL-IND"),
        ("APL-MKIP13-WT", "Magic Keyboard for iPad Pro 13-inch (M4) — White", 33900, 11, 6, 40, "SUP-APL-IND"),
        ("APL-MKIP11-BK", "Magic Keyboard for iPad Pro 11-inch (M4) — Black", 29900, 22, 8, 55, "SUP-APL-IND"),
        ("APL-MKIP11-WT", "Magic Keyboard for iPad Pro 11-inch (M4) — White", 29900, 14, 6, 45, "SUP-APL-IND"),
        ("APL-MKFOLIO-11", "Magic Keyboard Folio for iPad (A16 / 10th Gen)", 24900, 16, 6, 45, "SUP-INGRAM"),
        ("APL-SFOLIO-P13", "Smart Folio for iPad Pro 13-inch (M4) — Black", 9900, 21, 8, 60, "SUP-INGRAM"),
        ("APL-SFOLIO-A11", "Smart Folio for iPad Air 11-inch (M3) — Sage", 7900, 17, 6, 50, "SUP-INGRAM"),
        ("APL-SFOLIO-MN7", "Smart Folio for iPad mini (A17 Pro) — Charcoal Gray", 5900, 19, 6, 50, "SUP-INGRAM"),
        ("APL-MKTID-NUM-BK", "Magic Keyboard with Touch ID & Numeric Keypad (USB-C) — Black", 19500, 14, 5, 40, "SUP-APL-IND"),
        ("APL-MKTID-NUM-WT", "Magic Keyboard with Touch ID & Numeric Keypad (USB-C) — White", 17500, 21, 6, 50, "SUP-APL-IND"),
        ("APL-MKTID-WT", "Magic Keyboard with Touch ID (USB-C) — White", 14500, 18, 6, 45, "SUP-INGRAM"),
        ("APL-MK-COMP-WT", "Magic Keyboard (USB-C) — White", 9500, 32, 10, 80, "SUP-INGRAM"),
        ("APL-MMOUSE-BK", "Magic Mouse (USB-C) — Black Multi-Touch", 9500, 24, 8, 65, "SUP-APL-IND"),
        ("APL-MMOUSE-WT", "Magic Mouse (USB-C) — White Multi-Touch", 7500, 48, 15, 110, "SUP-INGRAM"),
        ("APL-MTRACK-BK", "Magic Trackpad (USB-C) — Black Multi-Touch", 14500, 12, 5, 40, "SUP-APL-IND"),
        ("APL-MTRACK-WT", "Magic Trackpad (USB-C) — White Multi-Touch", 12500, 19, 6, 50, "SUP-INGRAM"),
        ("LOGI-COMB-IP11", "Logitech Combo Touch Keyboard Case for iPad Air 11-inch", 17995, 11, 5, 35, "SUP-LOGI"),
        ("LOGI-MXM3S-MAC", "Logitech MX Master 3S for Mac (Space Gray)", 9995, 22, 8, 60, "SUP-LOGI"),
    ]
    for row in input_items:
        add(*row[:2], "iPad & Mac Input Devices", *row[2:])

    # 9. Cases & Protection (~26 SKUs)
    cases_items = [
        ("APL-CS16PM-SIL-BK", "iPhone 16 Pro Max Silicone Case with MagSafe — Black", 4900, 72, 20, 160, "SUP-APL-IND"),
        ("APL-CS16PM-SIL-UM", "iPhone 16 Pro Max Silicone Case with MagSafe — Ultramarine", 4900, 48, 15, 130, "SUP-APL-IND"),
        ("APL-CS16PM-SIL-SF", "iPhone 16 Pro Max Silicone Case with MagSafe — Star Fruit", 4900, 14, 15, 100, "SUP-APL-IND"),
        ("APL-CS16PM-SIL-LP", "iPhone 16 Pro Max Silicone Case with MagSafe — Lake Green", 4900, 39, 15, 120, "SUP-APL-IND"),
        ("APL-CS16PM-CLR", "iPhone 16 Pro Max Clear Case with MagSafe", 4900, 84, 20, 180, "SUP-APL-IND"),
        ("APL-CS16P-SIL-BK", "iPhone 16 Pro Silicone Case with MagSafe — Black", 4900, 68, 20, 160, "SUP-APL-IND"),
        ("APL-CS16P-SIL-PN", "iPhone 16 Pro Silicone Case with MagSafe — Peony", 4900, 31, 12, 110, "SUP-APL-IND"),
        ("APL-CS16P-SIL-ST", "iPhone 16 Pro Silicone Case with MagSafe — Stone Gray", 4900, 42, 12, 110, "SUP-APL-IND"),
        ("APL-CS16P-CLR", "iPhone 16 Pro Clear Case with MagSafe", 4900, 76, 20, 170, "SUP-APL-IND"),
        ("APL-CS16-SIL-UM", "iPhone 16 Silicone Case with MagSafe — Ultramarine", 4900, 54, 15, 130, "SUP-INGRAM"),
        ("APL-CS16-SIL-BK", "iPhone 16 Silicone Case with MagSafe — Black", 4900, 61, 15, 130, "SUP-INGRAM"),
        ("APL-CS16-CLR", "iPhone 16 Clear Case with MagSafe", 4900, 66, 15, 140, "SUP-INGRAM"),
        ("APL-CS16PL-CLR", "iPhone 16 Plus Clear Case with MagSafe", 4900, 29, 10, 90, "SUP-INGRAM"),
        ("BTS-CS16PM-BK", "Beats iPhone 16 Pro Max Case with MagSafe — Midnight Black", 4900, 38, 12, 100, "SUP-BEATS"),
        ("BTS-CS16P-PR", "Beats iPhone 16 Pro Case with MagSafe — Sunset Purple", 4900, 27, 10, 90, "SUP-BEATS"),
        ("OTR-LUM16PM-BK", "OtterBox Lumen Series MagSafe Case for iPhone 16 Pro Max", 4500, 33, 10, 80, "SUP-OTTER"),
        ("OTR-FIG16P-CL", "OtterBox Figura Series Case for iPhone 16 Pro", 4500, 22, 8, 70, "SUP-OTTER"),
        ("BLK-UG2-16PM", "Belkin UltraGlass 2 Screen Protector (iPhone 16 Pro Max)", 3500, 115, 30, 250, "SUP-BELKIN"),
        ("BLK-UG2-16P", "Belkin UltraGlass 2 Screen Protector (iPhone 16 Pro / 16)", 3500, 104, 30, 250, "SUP-BELKIN"),
        ("BLK-UG2-16PL", "Belkin UltraGlass 2 Screen Protector (iPhone 16 Plus)", 3500, 42, 15, 120, "SUP-BELKIN"),
        ("OTR-SLEEVE-MB14", "Incase ICON Sleeve with Woolenex for MacBook Pro 14-inch", 6900, 18, 6, 50, "SUP-OTTER"),
        ("OTR-SLEEVE-MA15", "Incase Compact Sleeve for MacBook Air 15-inch", 5900, 21, 6, 55, "SUP-OTTER"),
        ("APL-AIRTAG-1PK", "AirTag (Single Pack)", 3490, 165, 40, 350, "SUP-APL-IND"),
        ("APL-AIRTAG-4PK", "AirTag (4-Pack)", 11900, 88, 25, 220, "SUP-APL-IND"),
        ("APL-ATRING-FW-BK", "AirTag FineWoven Key Ring — Black", 3900, 36, 12, 90, "SUP-INGRAM"),
        ("APL-ATLOOP-WT", "AirTag Loop — White", 3490, 28, 10, 80, "SUP-INGRAM"),
    ]
    for row in cases_items:
        add(*row[:2], "Cases & Protection", *row[2:])

    # 10. Chargers, MagSafe & Cables (~28 SKUs)
    power_items = [
        ("APL-MSAFE-1M", "MagSafe Charger (1m, Qi2 25W)", 4500, 134, 35, 300, "SUP-APL-IND"),
        ("APL-MSAFE-2M", "MagSafe Charger (2m, Qi2 25W)", 5500, 68, 20, 160, "SUP-APL-IND"),
        ("APL-WALLET-FW-BK", "iPhone FineWoven Wallet with MagSafe — Black", 5900, 24, 10, 75, "SUP-INGRAM"),
        ("APL-WALLET-FW-DB", "iPhone FineWoven Wallet with MagSafe — Deep Blue", 5900, 19, 10, 75, "SUP-INGRAM"),
        ("BLK-BOOST-3IN1", "Belkin BoostCharge Pro 3-in-1 Wireless Charging Dock (Qi2)", 14900, 21, 8, 60, "SUP-BELKIN"),
        ("BLK-BOOST-2IN1", "Belkin BoostCharge Pro 2-in-1 MagSafe Travel Pad", 11900, 17, 6, 50, "SUP-BELKIN"),
        ("BLK-CAR-VENT", "Belkin MagSafe Car Vent Mount PRO", 3900, 34, 10, 90, "SUP-BELKIN"),
        ("APL-PWR-20W", "20W USB-C Power Adapter", 1900, 340, 80, 600, "SUP-APL-IND"),
        ("APL-PWR-30W", "30W USB-C Power Adapter", 3800, 76, 20, 180, "SUP-INGRAM"),
        ("APL-PWR-35W-DUAL", "35W Dual USB-C Port Compact Power Adapter", 5800, 64, 20, 160, "SUP-INGRAM"),
        ("APL-PWR-70W", "70W USB-C Power Adapter", 5800, 48, 15, 120, "SUP-INGRAM"),
        ("APL-PWR-96W", "96W USB-C Power Adapter", 7900, 28, 10, 80, "SUP-REDING"),
        ("APL-PWR-140W", "140W USB-C Power Adapter", 9500, 22, 8, 70, "SUP-REDING"),
        ("APL-CBL-60W-1M", "60W USB-C Charge Cable (1m, Woven)", 1900, 210, 50, 450, "SUP-APL-IND"),
        ("APL-CBL-240W-2M", "240W USB-C Charge Cable (2m, Woven)", 2900, 112, 30, 250, "SUP-APL-IND"),
        ("APL-CBL-TB5-1M", "Thunderbolt 5 (USB-C) Pro Cable (1m)", 6900, 19, 8, 60, "SUP-APL-IND"),
        ("APL-CBL-TB4-18M", "Thunderbolt 4 (USB-C) Pro Cable (1.8m)", 12900, 14, 5, 45, "SUP-REDING"),
        ("APL-CBL-TB4-3M", "Thunderbolt 4 (USB-C) Pro Cable (3m)", 15900, 8, 4, 25, "SUP-REDING"),
        ("APL-CBL-MS3-MD", "USB-C to MagSafe 3 Cable (2m) — Midnight", 4900, 34, 10, 90, "SUP-INGRAM"),
        ("APL-CBL-MS3-SB", "USB-C to MagSafe 3 Cable (2m) — Space Black", 4900, 28, 10, 90, "SUP-INGRAM"),
        ("APL-CBL-MS3-SV", "USB-C to MagSafe 3 Cable (2m) — Silver", 4900, 25, 10, 90, "SUP-INGRAM"),
        ("APL-ADP-USBC-AV", "USB-C Digital AV Multiport Adapter", 6900, 46, 15, 120, "SUP-INGRAM"),
        ("APL-ADP-USBC-SD", "USB-C to SD Card Reader", 3900, 32, 10, 90, "SUP-REDING"),
        ("APL-ADP-USBC-35", "USB-C to 3.5mm Headphone Jack Adapter", 900, 185, 40, 350, "SUP-INGRAM"),
        ("APL-ADP-USBC-LGT", "USB-C to Lightning Adapter", 2900, 14, 15, 90, "SUP-LEGACY"),
        ("APL-TRAVEL-KIT", "Apple World Travel Adapter Kit", 2900, 27, 8, 70, "SUP-REDING"),
        ("APL-CLOTH-POL", "Apple Polishing Cloth", 1900, 92, 25, 220, "SUP-APL-IND"),
        ("SAT-HUB-USBC7", "Satechi Pro Hub Max 8-in-2 USB-C Adapter (Space Gray)", 8990, 16, 6, 45, "SUP-SATECHI"),
        ("SAT-STAND-MAC", "Twelve South Curve SE Aluminum Laptop Stand", 6490, 14, 5, 40, "SUP-SATECHI"),
    ]
    for row in power_items:
        add(*row[:2], "Chargers, MagSafe & Cables", *row[2:])

    # 11. AppleCare+ & Services (~12 SKUs)
    applecare_items = [
        ("APC-IP16PM-2Y", "AppleCare+ for iPhone 16 Pro Max (2 Years)", 20900, 180, 30, 400, "SUP-APPCARE"),
        ("APC-IP16P-2Y", "AppleCare+ for iPhone 16 Pro (2 Years)", 20900, 195, 30, 400, "SUP-APPCARE"),
        ("APC-IP16-2Y", "AppleCare+ for iPhone 16 / 16 Plus (2 Years)", 14900, 210, 30, 450, "SUP-APPCARE"),
        ("APC-IP16E-2Y", "AppleCare+ for iPhone 16e (2 Years)", 11900, 120, 25, 300, "SUP-APPCARE"),
        ("APC-MBP16-3Y", "AppleCare+ for MacBook Pro 16-inch (3 Years)", 39900, 45, 10, 120, "SUP-APPCARE"),
        ("APC-MBP14-3Y", "AppleCare+ for MacBook Pro 14-inch (3 Years)", 27900, 68, 15, 160, "SUP-APPCARE"),
        ("APC-MBA15-3Y", "AppleCare+ for MacBook Air 15-inch (3 Years)", 22900, 74, 15, 180, "SUP-APPCARE"),
        ("APC-MBA13-3Y", "AppleCare+ for MacBook Air 13-inch (3 Years)", 19900, 115, 25, 250, "SUP-APPCARE"),
        ("APC-IPADP-2Y", "AppleCare+ for iPad Pro M4 (2 Years)", 14900, 62, 15, 150, "SUP-APPCARE"),
        ("APC-IPADA-2Y", "AppleCare+ for iPad Air / iPad (2 Years)", 7900, 94, 20, 220, "SUP-APPCARE"),
        ("APC-AWU2-2Y", "AppleCare+ for Apple Watch Ultra 2 (2 Years)", 9900, 48, 12, 120, "SUP-APPCARE"),
        ("APC-AWS10-2Y", "AppleCare+ for Apple Watch Series 10 / SE (2 Years)", 7900, 86, 20, 200, "SUP-APPCARE"),
        ("APC-AUDIO-2Y", "AppleCare+ for Headphones (AirPods / Beats, 2 Years)", 2900, 240, 40, 500, "SUP-APPCARE"),
    ]
    for row in applecare_items:
        add(*row[:2], "AppleCare+ & Services", *row[2:])

    return items


def build_movements(products):
    """Build ~520 chronological, replay-safe movements across 30 days."""
    rng = random.Random(20261110)
    stock_map = {p["sku"]: int(p["current_stock"]) for p in products}
    min_map = {p["sku"]: int(p["min_stock"]) for p in products}
    max_map = {p["sku"]: int(p["max_stock"]) for p in products}
    cat_map = {p["sku"]: p["category"] for p in products}

    # Pre-group some transfer pairs (same product family / accessories)
    skus = [p["sku"] for p in products]
    base_time = datetime(2026, 10, 12, 9, 30, 0)

    movements = []
    po_seq = 1001
    so_seq = 5001
    trf_seq = 201
    adj_seq = 301

    # Generate 28 days of store operations (~18-20 events/day => ~530 rows)
    for day_offset in range(29):
        day_dt = base_time + timedelta(days=day_offset)

        # Morning Apple delivery / distributor INBOUND batch (4-6 SKUs per day)
        inbound_candidates = rng.sample(skus, 5)
        for sku in inbound_candidates:
            # Skip zero/out-of-stock hero SKUs so they stay out_of_stock at the end, or do balanced inbound+outbound
            if stock_map[sku] == 0:
                continue
            headroom = max_map[sku] - stock_map[sku]
            if headroom < 4:
                continue
            qty = min(headroom, rng.randint(4, max(6, min(35, max_map[sku] // 4))))
            ts = (day_dt + timedelta(minutes=rng.randint(0, 90))).strftime("%Y-%m-%d %H:%M:%S")
            movements.append({
                "sku": sku,
                "type": "INBOUND",
                "quantity": qty,
                "target_sku": "",
                "reference_no": f"PO-APL-2026-{po_seq}",
                "performed_by": rng.choice(["wholesaler", "manager"]),
                "notes": f"Morning flagship stock replenishment ({cat_map[sku]})",
                "created_at": ts,
            })
            stock_map[sku] += qty
            po_seq += 1

        # Retail floor & online pickup OUTBOUND sales (10-12 transactions per day)
        healthy_skus = [s for s in skus if stock_map[s] > max(2, min_map[s] + 2)]
        if healthy_skus:
            for sku in rng.sample(healthy_skus, min(11, len(healthy_skus))):
                max_sell = stock_map[sku] - (min_map[sku] + 1)
                if max_sell < 1:
                    continue
                qty = rng.randint(1, min(max_sell, 12 if cat_map[sku] in ("Chargers, MagSafe & Cables", "Cases & Protection", "AppleCare+ & Services") else 5))
                ts = (day_dt + timedelta(hours=rng.randint(2, 11), minutes=rng.randint(0, 59))).strftime("%Y-%m-%d %H:%M:%S")
                channel = rng.choice(["POS Counter Sale", "Apple Store Online Pickup", "B2B Corporate Order", "Today at Apple Bundle"])
                prefix = "SO-OPU" if "Pickup" in channel else ("SO-B2B" if "B2B" in channel else "SO-POS")
                movements.append({
                    "sku": sku,
                    "type": "OUTBOUND",
                    "quantity": qty,
                    "target_sku": "",
                    "reference_no": f"{prefix}-2026-{so_seq}",
                    "performed_by": rng.choice(["shopkeeper", "staff"]),
                    "notes": f"{channel} fulfilled at flagship floor",
                    "created_at": ts,
                })
                stock_map[sku] -= qty
                so_seq += 1

        # Occasional balanced round-trip on a few currently out_of_stock SKUs earlier in the month
        if day_offset in (3, 10, 18):
            zero_skus = [s for s in skus if stock_map[s] == 0]
            for sku in zero_skus[:2]:
                qty = rng.randint(4, 10)
                t_in = (day_dt + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")
                t_out = (day_dt + timedelta(hours=8)).strftime("%Y-%m-%d %H:%M:%S")
                movements.append({
                    "sku": sku, "type": "INBOUND", "quantity": qty, "target_sku": "",
                    "reference_no": f"PO-APL-2026-{po_seq}", "performed_by": "wholesaler",
                    "notes": "High-demand allocation arrival", "created_at": t_in,
                })
                po_seq += 1
                movements.append({
                    "sku": sku, "type": "OUTBOUND", "quantity": qty, "target_sku": "",
                    "reference_no": f"SO-OPU-2026-{so_seq}", "performed_by": "shopkeeper",
                    "notes": "Sold out via reservation queue", "created_at": t_out,
                })
                so_seq += 1

        # Occasional cycle count ADJUSTMENT or demo TRANSFER every 3 days
        if day_offset % 3 == 0:
            adj_candidates = [s for s in skus if stock_map[s] > min_map[s] + 4]
            if adj_candidates:
                sku = rng.choice(adj_candidates)
                ts = (day_dt + timedelta(hours=12, minutes=15)).strftime("%Y-%m-%d %H:%M:%S")
                movements.append({
                    "sku": sku,
                    "type": "ADJUSTMENT",
                    "quantity": -1,
                    "target_sku": "",
                    "reference_no": f"ADJ-APL-2026-{adj_seq}",
                    "performed_by": "manager",
                    "notes": "Display table demo unit allocation / cycle audit",
                    "created_at": ts,
                })
                stock_map[sku] -= 1
                adj_seq += 1

        if day_offset % 4 == 0:
            acc_skus = [s for s in skus if cat_map[s] == "Chargers, MagSafe & Cables" and stock_map[s] > min_map[s] + 10]
            if len(acc_skus) >= 2:
                src, dst = rng.sample(acc_skus, 2)
                qty = rng.randint(2, 5)
                ts = (day_dt + timedelta(hours=10, minutes=40)).strftime("%Y-%m-%d %H:%M:%S")
                movements.append({
                    "sku": src,
                    "type": "TRANSFER",
                    "quantity": qty,
                    "target_sku": dst,
                    "reference_no": f"TRF-APL-2026-{trf_seq}",
                    "performed_by": "staff",
                    "notes": f"Backroom bin reallocation to {dst}",
                    "created_at": ts,
                })
                stock_map[src] -= qty
                stock_map[dst] += qty
                trf_seq += 1

    movements.sort(key=lambda r: r["created_at"])
    return movements


def write_csv(path, fieldnames, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main():
    supplier_rows = [
        {
            "code": s[0], "name": s[1], "tier": s[2], "contact_name": s[3],
            "email": s[4], "phone": s[5], "lead_time_days": s[6], "rating": s[7], "status": s[8],
        }
        for s in SUPPLIERS
    ]
    products = build_products()
    movements = build_movements(products)

    write_csv(
        DATA_DIR / "apple_store_suppliers.csv",
        ["code", "name", "tier", "contact_name", "email", "phone", "lead_time_days", "rating", "status"],
        supplier_rows,
    )
    write_csv(
        DATA_DIR / "apple_store_products.csv",
        ["sku", "name", "category", "unit_price", "current_stock", "min_stock", "max_stock", "supplier_code", "supplier_name", "status"],
        products,
    )
    write_csv(
        DATA_DIR / "apple_store_movements.csv",
        ["sku", "type", "quantity", "target_sku", "reference_no", "performed_by", "notes", "created_at"],
        movements,
    )

    in_cnt = sum(1 for p in products if p["status"] == "in_stock")
    low_cnt = sum(1 for p in products if p["status"] == "low_stock")
    out_cnt = sum(1 for p in products if p["status"] == "out_of_stock")
    print(f"Generated {len(supplier_rows)} suppliers -> data/apple_store_suppliers.csv")
    print(f"Generated {len(products)} Apple Store products ({in_cnt} in_stock, {low_cnt} low_stock, {out_cnt} out_of_stock) -> data/apple_store_products.csv")
    print(f"Generated {len(movements)} stock movements -> data/apple_store_movements.csv")


if __name__ == "__main__":
    main()
