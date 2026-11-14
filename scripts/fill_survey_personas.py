import time
import json
import urllib.request
import urllib.parse
import sys

URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc_QFRc51DNsLM-xpqW4KUQ9Nzq5ROO2UNRHa-zSJJPlYNMLQ/formResponse'

# 75 diverse Indian business respondents with unique personas, industries, and locations
PERSONAS = [
    # Gujarat - West Coast Trade & Manufacturing
    {
        "name": "Rajeshbhai Singhania",
        "location": "Gujarat, Surat",
        "business": "Wholesale Textile & Saree Trading",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Bhavikbhai Patel",
        "location": "Gujarat, Morbi",
        "business": "Ceramic Vitrified Tiles Manufacturing",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Slow moving items",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Hiren Shah",
        "location": "Gujarat, Ahmedabad",
        "business": "Industrial Chemical & Polymer Distribution",
        "system": "Cloud based software",
        "audit": "Monthly",
        "challenge": "Stockouts",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },
    {
        "name": "Jignesh Vora",
        "location": "Gujarat, Rajkot",
        "business": "Submersible Pumps & Diesel Engine Foundry",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Manual data entry errors",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Praful Chotai",
        "location": "Gujarat, Patan",
        "business": "Unjha Cumin & Spices Wholesale Mandi Trading",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "3",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Dharmeshbhai Zaveri",
        "location": "Gujarat, Surat",
        "business": "Cut & Polished Diamond Export",
        "system": "On premise software",
        "audit": "Weekly",
        "challenge": "Manual data entry errors",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "3",
        "warehouses": "1",
        "recommend": "Definitely"
    },
    {
        "name": "Nilesh Panchal",
        "location": "Gujarat, Vadodara",
        "business": "Electrical Switchgear & Panel Fabrication",
        "system": "Cloud based software",
        "audit": "Monthly",
        "challenge": "Overstocking",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },
    {
        "name": "Mukesh Solanki",
        "location": "Gujarat, Bhavnagar",
        "business": "Alang Ship Recycling Hardware & Scrap Steel",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "1",
        "integration": "No",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "No"
    },

    # Maharashtra - Commercial Hub & Industrial Belt
    {
        "name": "Vikram Kulkarni",
        "location": "Maharashtra, Pune",
        "business": "Automotive Tier-2 Precision CNC Components",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Stockouts",
        "satisfaction": "3",
        "integration": "Yes",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Sameer Merchant",
        "location": "Maharashtra, Mumbai",
        "business": "Lamington Road Computer Hardware & Networking Wholesaler",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "3",
        "integration": "Yes",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Dattatray Shinde",
        "location": "Maharashtra, Kolhapur",
        "business": "Jaggery & Sugar Mill Machinery Spares",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Girish Deshmukh",
        "location": "Maharashtra, Nagpur",
        "business": "Orange Agro-Processing & Cold Storage Logistics",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Slow moving items",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Pooja Mehta",
        "location": "Maharashtra, Mumbai",
        "business": "D2C Clean Beauty & Cosmetics Brand",
        "system": "Cloud based software",
        "audit": "Monthly",
        "challenge": "Stockouts",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "5",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },
    {
        "name": "Sanjay Mandhare",
        "location": "Maharashtra, Nashik",
        "business": "Grape Export & Packaging Supplies",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Overstocking",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Kailash Agarwal",
        "location": "Maharashtra, Thane",
        "business": "Bhiwandi 3PL Logistics & Corrugated Box Warehousing",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Manual data entry errors",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "6 to 10",
        "recommend": "Definitely"
    },
    {
        "name": "Mahendra Jain",
        "location": "Maharashtra, Solapur",
        "business": "Solapuri Chaddar & Terry Towel Handloom Mill",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "3",
        "warehouses": "1",
        "recommend": "No"
    },

    # Punjab & Haryana - Northern Industrial & Agro Hub
    {
        "name": "Harpreet Singh Dhillon",
        "location": "Punjab, Ludhiana",
        "business": "Bicycle Frames & Fasteners Manufacturing",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Manual data entry errors",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Gurinder Pal Sethi",
        "location": "Punjab, Jalandhar",
        "business": "Leather Cricket Ball & Sports Goods Exporter",
        "system": "Manual spreadsheets",
        "audit": "Quarterly",
        "challenge": "Slow moving items",
        "satisfaction": "2",
        "integration": "Planning to",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Manjit Kaur Sandhu",
        "location": "Punjab, Amritsar",
        "business": "Traditional Phulkari & Amritsari Papad-Wadi Processing",
        "system": "None",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "1",
        "integration": "No",
        "ease": "1",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Jaswinder Bhullar",
        "location": "Punjab, Fatehgarh Sahib",
        "business": "Mandi Gobindgarh Steel Re-rolling & TMT Bars",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "3",
        "integration": "No",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Ramesh Goyal",
        "location": "Haryana, Panipat",
        "business": "Recycled Shoddy Yarn & Mink Blanket Weaving",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Overstocking",
        "satisfaction": "2",
        "integration": "Planning to",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Sumit Ahluwalia",
        "location": "Haryana, Gurugram",
        "business": "Omnichannel Direct-to-Consumer Electronics & Audio",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "6 to 10",
        "recommend": "Definitely"
    },
    {
        "name": "Balbir Chahal",
        "location": "Haryana, Hisar",
        "business": "Galvanized Iron Pipes & Agricultural Tubes",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Slow moving items",
        "satisfaction": "3",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "Maybe"
    },
    {
        "name": "Naresh Batra",
        "location": "Haryana, Faridabad",
        "business": "Sheet Metal Stamping & Automobile Press Tools",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Manual data entry errors",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "1",
        "recommend": "Maybe"
    },

    # Delhi NCR - Northern Trading Arteries
    {
        "name": "Omprakash Gupta",
        "location": "Delhi, Central Delhi",
        "business": "Chandni Chowk FMCG & Dry Fruits Wholesale",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "No"
    },
    {
        "name": "Amitav Khurana",
        "location": "Delhi, South Delhi",
        "business": "Luxury Furniture & Imported Interior Architecture",
        "system": "Cloud based software",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },
    {
        "name": "Ravinder Taneja",
        "location": "Delhi, North West Delhi",
        "business": "Netaji Subhash Place Mobile Accessories Import & Distribution",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "2",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Satish Aggarwal",
        "location": "Delhi, East Delhi",
        "business": "Gandhi Nagar Ready-made Hosiery Bulk Distribution",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "No"
    },
    {
        "name": "Karan Malhotra",
        "location": "Delhi, New Delhi",
        "business": "B2B Medical Consumables & Diagnostic Kit Supply",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "5",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },

    # Uttar Pradesh - Heritage Crafts, Manufacturing & Mandis
    {
        "name": "Faizan Akhtar",
        "location": "Uttar Pradesh, Kanpur",
        "business": "Industrial Safety Footwear & Tannery Leather OEM",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Vipin Kumar Bansal",
        "location": "Uttar Pradesh, Agra",
        "business": "Export Quality Leather Shoes & Belts",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Anurag Maurya",
        "location": "Uttar Pradesh, Varanasi",
        "business": "Banarasi Silk Weaving & Heritage Brocade Trading",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "2",
        "integration": "No",
        "ease": "3",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Mohammad Tariq",
        "location": "Uttar Pradesh, Aligarh",
        "business": "Architectural Mortise Locks & Zinc Die-Casting",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Manual data entry errors",
        "satisfaction": "3",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "Maybe"
    },
    {
        "name": "Sharad Chandra Rastogi",
        "location": "Uttar Pradesh, Lucknow",
        "business": "Chikan Embroidery Kurti Wholesale & E-commerce Supply",
        "system": "Cloud based software",
        "audit": "Monthly",
        "challenge": "Stockouts",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "1",
        "recommend": "Definitely"
    },
    {
        "name": "Intezar Hussain",
        "location": "Uttar Pradesh, Moradabad",
        "business": "Handcrafted Brassware, Planters & Home Decor Export",
        "system": "Manual spreadsheets",
        "audit": "Quarterly",
        "challenge": "Overstocking",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "No"
    },
    {
        "name": "Dinesh Chandra Sharma",
        "location": "Uttar Pradesh, Meerut",
        "business": "Sports Goods & Willow Cricket Bat Manufacturing",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Pawan Khemka",
        "location": "Uttar Pradesh, Gorakhpur",
        "business": "Regional FMCG C&F Distributorship",
        "system": "On premise software",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },

    # Rajasthan - Handicrafts, Minerals & Marbles
    {
        "name": "Madan Lal Rathore",
        "location": "Rajasthan, Jodhpur",
        "business": "Sheesham Wood Handcrafted Furniture Export",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Slow moving items",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Deepak Kothari",
        "location": "Rajasthan, Jaipur",
        "business": "Precious Gemstones & Jaipur Silver Jewellery",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Manual data entry errors",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "1",
        "recommend": "Definitely"
    },
    {
        "name": "Govind Ram Patidar",
        "location": "Rajasthan, Ajmer",
        "business": "Kishangarh Italian Marble & Granite Slab Yards",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "No"
    },
    {
        "name": "Chhaganlal Bishnoi",
        "location": "Rajasthan, Bikaner",
        "business": "Bikaneri Bhujia, Namkeen & Sweets Large-Scale Bakery",
        "system": "On premise software",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Surendra Singh Shekhawat",
        "location": "Rajasthan, Udaipur",
        "business": "Mineral Soapstone & Calcite Powder Micronizing Mill",
        "system": "Manual spreadsheets",
        "audit": "Quarterly",
        "challenge": "Overstocking",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },

    # Karnataka - Silicon Valley & Agro Plantations
    {
        "name": "Kavitha Subramaniam",
        "location": "Karnataka, Bengaluru Urban",
        "business": "Quick-Commerce Dark Store Network Operations",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "More than 10",
        "recommend": "Definitely"
    },
    {
        "name": "Nagaraj Rao",
        "location": "Karnataka, Bengaluru Urban",
        "business": "SP Road Electronic Components & Robotics Sensor Kit Importer",
        "system": "Cloud based software",
        "audit": "Monthly",
        "challenge": "Manual data entry errors",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },
    {
        "name": "Prashanth Hegde",
        "location": "Karnataka, Dakshina Kannada",
        "business": "Mangaluru Cashew Kernel Processing & Export",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Mahadevappa Patil",
        "location": "Karnataka, Hubballi-Dharwad",
        "business": "Cotton Ginning & Agricultural Seeds Distribution",
        "system": "Manual spreadsheets",
        "audit": "Quarterly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Raghavendra Bhat",
        "location": "Karnataka, Mysuru",
        "business": "Pure Sandalwood Oil & Agarbatti Fragrance Blending",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "1",
        "recommend": "Maybe"
    },

    # Tamil Nadu - Auto, Engineering & Textile Giants
    {
        "name": "S. Murugan",
        "location": "Tamil Nadu, Chennai",
        "business": "Ambattur Automotive Gaskets & Rubber Bushings",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Manual data entry errors",
        "satisfaction": "3",
        "integration": "Yes",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "P. Palaniswami",
        "location": "Tamil Nadu, Tiruppur",
        "business": "Circular Knitted Cotton Garment & T-Shirt Export Mill",
        "system": "On premise software",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "3",
        "integration": "Yes",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "K. R. Soundararajan",
        "location": "Tamil Nadu, Coimbatore",
        "business": "Wet Grinders & Industrial Monobloc Pumps Manufacturing",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Slow moving items",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Arunachalam Chettiar",
        "location": "Tamil Nadu, Madurai",
        "business": "Sungudi Sarees & Handloom Cloth Wholesaling",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "G. Ganesan",
        "location": "Tamil Nadu, Virudhunagar",
        "business": "Sivakasi Safety Matches & Printing Packaging Factory",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Overstocking",
        "satisfaction": "3",
        "integration": "No",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Deepa Sundaram",
        "location": "Tamil Nadu, Chennai",
        "business": "D2C Ayurvedic Hair Care & Herbal Wellness Brand",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "5",
        "integration": "Yes",
        "ease": "5",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },

    # Telangana & Andhra Pradesh - Pharma, Agri & Tech
    {
        "name": "V. Venkat Reddy",
        "location": "Telangana, Hyderabad",
        "business": "Balanagar Bulk Drugs & Active Pharmaceutical Ingredients (API)",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "6 to 10",
        "recommend": "Definitely"
    },
    {
        "name": "B. Srinivas Rao",
        "location": "Telangana, Medchal-Malkajgiri",
        "business": "HDPE Pipe Fittings & Drip Irrigation Equipment",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "K. Sambasiva Rao",
        "location": "Andhra Pradesh, Guntur",
        "business": "Dry Red Chilli Mandi Export & Cold Storage Operations",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "No"
    },
    {
        "name": "T. Ramakrishna Raju",
        "location": "Andhra Pradesh, Visakhapatnam",
        "business": "Marine Shrimp & Frozen Seafood Export Processing",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },
    {
        "name": "P. Venkateswara Rao",
        "location": "Andhra Pradesh, Vijayawada",
        "business": "Automobile Commercial Spares Wholesale Market",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "2",
        "integration": "No",
        "ease": "3",
        "warehouses": "1",
        "recommend": "No"
    },

    # Kerala - Spices, Coir & Natural Processing
    {
        "name": "Venkatesh Iyer",
        "location": "Kerala, Ernakulam",
        "business": "Mattancherry Cardamom, Pepper & Spices Trading",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "Planning to",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Mathew P. Kurian",
        "location": "Kerala, Kottayam",
        "business": "Natural Rubber Sheet Processing & Latex Centrifuging",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Overstocking",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "1",
        "recommend": "Maybe"
    },
    {
        "name": "Shamsudheen V. K.",
        "location": "Kerala, Kozhikode",
        "business": "Timber Log Sawmill & Hardwood Plywood Wholesale",
        "system": "Manual spreadsheets",
        "audit": "Quarterly",
        "challenge": "Slow moving items",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Jose Thomas",
        "location": "Kerala, Thrissur",
        "business": "Wholesale Gold Ornaments & Jewellery Karigar Workshop",
        "system": "On premise software",
        "audit": "Weekly",
        "challenge": "Manual data entry errors",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "3",
        "warehouses": "1",
        "recommend": "Definitely"
    },

    # West Bengal & North-East - Tea, Jute & Cross-Border Logistics
    {
        "name": "Ananya Roy",
        "location": "West Bengal, Kolkata",
        "business": "Premium Darjeeling Tea & CTC Blends Export House",
        "system": "Cloud based software",
        "audit": "Monthly",
        "challenge": "Stockouts",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },
    {
        "name": "Subir Mukherjee",
        "location": "West Bengal, Howrah",
        "business": "Foundry Cast Iron Sanitary Castings & Pipe Flanges",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Manual data entry errors",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Pranab Banik",
        "location": "West Bengal, Siliguri",
        "business": "North-East Corridor FMCG Stockist & Transshipment Depot",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Bhaben Barua",
        "location": "Assam, Kamrup Metropolitan",
        "business": "Guwahati Bamboo Board & Engineered Timber Products",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Debojit Gogoi",
        "location": "Assam, Dibrugarh",
        "business": "Tea Garden Organic Fertilizer & Pesticide Distribution",
        "system": "Manual spreadsheets",
        "audit": "Quarterly",
        "challenge": "Overstocking",
        "satisfaction": "3",
        "integration": "No",
        "ease": "3",
        "warehouses": "1",
        "recommend": "Maybe"
    },

    # Central India - Madhya Pradesh & Chhattisgarh
    {
        "name": "Kailash Chand Jain",
        "location": "Madhya Pradesh, Indore",
        "business": "Siyaganj Wholesale Grocery & Confectionery Mart",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "No"
    },
    {
        "name": "Vivek Porwal",
        "location": "Madhya Pradesh, Ujjain",
        "business": "Soybean Solvent Extraction & Crude Oil Refining",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Manual data entry errors",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Ashok Agrawal",
        "location": "Chhattisgarh, Raipur",
        "business": "Urla Industrial Area Sponge Iron & Billet Rolling",
        "system": "On premise software",
        "audit": "Monthly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "3",
        "warehouses": "2 to 5",
        "recommend": "Maybe"
    },
    {
        "name": "Narendra Sahu",
        "location": "Chhattisgarh, Bilaspur",
        "business": "Rice Milling & Grain Silo Warehousing",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },

    # Eastern & Hill Regions - Bihar, Jharkhand, Odisha, Uttarakhand, HP, Goa
    {
        "name": "Alok Kumar Jha",
        "location": "Bihar, Patna",
        "business": "Marufganj Mandi Grains & Pulses Wholesale Depot",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "1",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Ravi Shankar Prasad",
        "location": "Bihar, Muzaffarpur",
        "business": "Shahi Litchi Pulp Processing & Cold Storage Facility",
        "system": "Manual spreadsheets",
        "audit": "Monthly",
        "challenge": "Stockouts",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "1",
        "recommend": "No"
    },
    {
        "name": "Sanjay Soren",
        "location": "Jharkhand, East Singhbhum",
        "business": "Jamshedpur Heavy Earthmoving Spares & Fabrication",
        "system": "On premise software",
        "audit": "Quarterly",
        "challenge": "Manual data entry errors",
        "satisfaction": "3",
        "integration": "Planning to",
        "ease": "2",
        "warehouses": "1",
        "recommend": "Maybe"
    },
    {
        "name": "Debasis Pattnaik",
        "location": "Odisha, Cuttack",
        "business": "Malgodown Bulk Food Commodities & Edible Oil Stockist",
        "system": "Manual spreadsheets",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "2",
        "integration": "No",
        "ease": "2",
        "warehouses": "2 to 5",
        "recommend": "No"
    },
    {
        "name": "Harish Rawat",
        "location": "Uttarakhand, Dehradun",
        "business": "Ayurvedic Herbs & Natural Essential Oil Extraction",
        "system": "Cloud based software",
        "audit": "Monthly",
        "challenge": "Slow moving items",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "1",
        "recommend": "Definitely"
    },
    {
        "name": "Rohan Sood",
        "location": "Himachal Pradesh, Solan",
        "business": "Baddi Contract Pharma Formulations & Capsule Blistering",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Inaccurate stock levels",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "4",
        "warehouses": "2 to 5",
        "recommend": "Definitely"
    },
    {
        "name": "Anthony Fernandes",
        "location": "Goa, North Goa",
        "business": "Hospitality Beverage & Gourmet Bakery Ingredients Supply",
        "system": "Cloud based software",
        "audit": "Weekly",
        "challenge": "Stockouts",
        "satisfaction": "4",
        "integration": "Yes",
        "ease": "5",
        "warehouses": "1",
        "recommend": "Definitely"
    }
]

def submit_response(persona, idx, total):
    form_data = {
        'entry.1068074926': persona['name'],
        'entry.1588711098': persona['location'],
        'entry.57387877': persona['system'],
        'entry.553130216': persona['audit'],
        'entry.309211772': persona['challenge'],
        'entry.1257046783': persona['satisfaction'],
        'entry.933093259': persona['integration'],
        'entry.1159152897': persona['ease'],
        'entry.457651037': persona['warehouses'],
        'entry.128087996': persona['recommend']
    }
    encoded = urllib.parse.urlencode(form_data).encode('utf-8')
    req = urllib.request.Request(URL, data=encoded, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            code = resp.getcode()
            if code == 200:
                print(f"[{idx}/{total}] SUCCESS: {persona['name']} | {persona['location']} | {persona['business']}")
                return True
            else:
                print(f"[{idx}/{total}] WARN: Status code {code} for {persona['name']}")
                return False
    except Exception as e:
        print(f"[{idx}/{total}] ERROR for {persona['name']}: {e}")
        return False

def main():
    print(f"Starting submission of {len(PERSONAS)} Indian Business personas...")
    success_count = 0
    results = []

    for idx, persona in enumerate(PERSONAS, start=1):
        ok = submit_response(persona, idx, len(PERSONAS))
        if ok:
            success_count += 1
        results.append({
            "index": idx,
            "name": persona['name'],
            "location": persona['location'],
            "business": persona['business'],
            "status": "RECORDED" if ok else "FAILED"
        })
        time.sleep(0.35)  # gentle pacing

    print(f"\n==========================================")
    print(f"Completed: {success_count}/{len(PERSONAS)} responses recorded successfully.")
    print(f"==========================================")

    # Save summary report
    with open("scratch/survey_submission_report.json", "w", encoding="utf-8") as f:
        json.dump({"total": len(PERSONAS), "successful": success_count, "records": results}, f, indent=2)

if __name__ == '__main__':
    main()
