import csv
import datetime
import random

gujarati_profiles = [
    {
        "name": "Jignesh Patel",
        "city": "Ahmedabad",
        "business": "Hardware",
        "stock_mgmt": "Spreadsheet, Mix",
        "problems": "Slow stock updates, Late low-stock discovery, Wrong quantities",
        "ideal": "Track available stock, Alert low stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Counter par bheed hoti hai to entries miss ho jaati hain. Godown se item nikalte waqt staff Excel me update nahi karta, so Saturday audit me count mismatch rehta hai."
    },
    {
        "name": "Hitesh Shah",
        "city": "Surat",
        "business": "Clothing",
        "stock_mgmt": "Mix, Notebook",
        "problems": "Wrong quantities, Hard to find products, Late low-stock discovery",
        "ideal": "Track available stock, Find products quickly, Alert low stock",
        "satisfaction": "2",
        "biggest_problem": "We deal in dress materials and sarees. Multiple colour and size variants ban jaate hain, par register me sirf total thaan likha hota hai. Fast-moving design khatam hone par hi pata chalta hai."
    },
    {
        "name": "Bhavin Mehta",
        "city": "Rajkot",
        "business": "Grocery",
        "stock_mgmt": "Spreadsheet",
        "problems": "Slow stock updates, Late low-stock discovery, No stock history",
        "ideal": "Track available stock, Alert low stock, View stock history",
        "satisfaction": "3",
        "biggest_problem": "Wholesale pulses and oil tins. Weekly replenishment cycle hai par Excel daily maintain nahi ho paata. Supplier aane par physically godown me jakar bori ginni padti hai."
    },
    {
        "name": "Paresh Doshi",
        "city": "Vadodara",
        "business": "Electronics/mobile",
        "stock_mgmt": "Billing/POS software, Mix",
        "problems": "Wrong quantities, Hard to find products",
        "ideal": "Track available stock, Reduce stock mistakes, Find products quickly",
        "satisfaction": "3",
        "biggest_problem": "Accessories jaise cables, chargers aur covers ke 100 se zyada SKU hain. POS me sirf main phones ka record rehta hai, accessories ka stock daily 15-20 piece ka difference dikhata hai."
    },
    {
        "name": "Ketan Prajapati",
        "city": "Bhavnagar",
        "business": "Stationery",
        "stock_mgmt": "Notebook, Memory/verbal communication",
        "problems": "Late low-stock discovery, No stock history, Hard to find products",
        "ideal": "Alert low stock, Track available stock, Find products quickly",
        "satisfaction": "2",
        "biggest_problem": "Exam season aur school reopening me achanak notebook aur exam pads out of stock ho jate hain. Koi alert nahi milta jab buffer stock 10 packet se niche chala jaye."
    },
    {
        "name": "Tushar Trivedi",
        "city": "Jamnagar",
        "business": "Hardware",
        "stock_mgmt": "Mix",
        "problems": "Hard to find products, Slow stock updates, Wrong quantities",
        "ideal": "Find products quickly, Track available stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Brass screws, nuts aur small pipe fittings. Dukan me rakha hota hai par staff ko milta nahi hai to naya dabba khol dete hain. Dead inventory badhti ja rahi hai."
    },
    {
        "name": "Nilesh Soni",
        "city": "Morbi",
        "business": "Other",
        "stock_mgmt": "Spreadsheet",
        "problems": "Slow stock updates, Late low-stock discovery",
        "ideal": "Track available stock, Record sales/deliveries, Alert low stock",
        "satisfaction": "2",
        "biggest_problem": "Ceramic adhesive and grout trading. Orders phone par dispatch ho jate hain aur bill shaam ko banta hai, beech me stock count 4-5 ghante outdated rehta hai."
    },
    {
        "name": "Manish Desai",
        "city": "Anand",
        "business": "Grocery",
        "stock_mgmt": "Notebook, Mix",
        "problems": "Late low-stock discovery, Wrong quantities",
        "ideal": "Alert low stock, Track available stock, Reduce stock mistakes",
        "satisfaction": "1",
        "biggest_problem": "Dairy items aur packaged food ki expiry track nahi hoti. Notebook me incoming date likhte hain par purana stock pehle nikalna ensure karna mushkil hota hai."
    },
    {
        "name": "Sanjay Vora",
        "city": "Bharuch",
        "business": "Pharmacy",
        "stock_mgmt": "Billing/POS software",
        "problems": "Slow stock updates, Hard to find products",
        "ideal": "Track available stock, Alert low stock, Find products quickly",
        "satisfaction": "3",
        "biggest_problem": "Local software bahut rigid hai. Naya generic batch chadhane me 10 minute lagte hain, rush hours me counter boy manual entry chhod kar seedha cash le leta hai."
    },
    {
        "name": "Chirag Gandhi",
        "city": "Gandhinagar",
        "business": "Stationery",
        "stock_mgmt": "Spreadsheet, Notebook",
        "problems": "No stock history, Slow stock updates",
        "ideal": "View stock history, Track available stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Office supplies ke bulk tenders aate hain par pata nahi hota pichle mahine kitna consumption tha, isliye rate quote karne me margin miss ho jata hai."
    },
    {
        "name": "Dharmesh Panchal",
        "city": "Mehsana",
        "business": "Hardware",
        "stock_mgmt": "Notebook",
        "problems": "Wrong quantities, Late low-stock discovery",
        "ideal": "Alert low stock, Track available stock, Reduce stock mistakes",
        "satisfaction": "1",
        "biggest_problem": "Pumps aur motor spare parts ka record registers me maintain karte karte pages phat jate hain. Month-end par 30-40k ka stock unaccounted nikalta hai."
    },
    {
        "name": "Gaurang Raval",
        "city": "Navsari",
        "business": "Clothing",
        "stock_mgmt": "Spreadsheet",
        "problems": "Hard to find products, Wrong quantities",
        "ideal": "Find products quickly, Track available stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Readymade garments me size L aur XL khatam ho jate hain par sheet me sirf total shirts 25 dikhata hai. Customer aakar bina khareede laut jata hai."
    },
    {
        "name": "Ashwin Parikh",
        "city": "Surendranagar",
        "business": "Grocery",
        "stock_mgmt": "Memory/verbal communication, Mix",
        "problems": "Late low-stock discovery, Slow stock updates",
        "ideal": "Alert low stock, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Chana, besan aur spices ke stocks chhotu verbally batata hai. Kabhi bolta hai 5 kata hai par godown me sirf 1 bori bachi hoti hai."
    },
    {
        "name": "Pranav Bhatt",
        "city": "Junagadh",
        "business": "Electronics/mobile",
        "stock_mgmt": "Mix",
        "problems": "Slow stock updates, Wrong quantities, No stock history",
        "ideal": "Track available stock, Reduce stock mistakes, View stock history",
        "satisfaction": "2",
        "biggest_problem": "Warranty replacements aur returned stock normal inventory ke sath mix ho jata hai. Koi simple tagging ya tracking system nahi hai."
    },
    {
        "name": "Mitesh Solanki",
        "city": "Vapi",
        "business": "Other",
        "stock_mgmt": "Spreadsheet, Mix",
        "problems": "Slow stock updates, Late low-stock discovery",
        "ideal": "Track available stock, Alert low stock, Record sales/deliveries",
        "satisfaction": "2",
        "biggest_problem": "Packaging carton and bubble roll distributor. Urgent industrial dispatches me challan kat jata hai par sheet update hone me 2 din lag jate hain."
    },
    {
        "name": "Jayesh Somani",
        "city": "Nadiad",
        "business": "Pharmacy",
        "stock_mgmt": "Billing/POS software",
        "problems": "Late low-stock discovery, Slow stock updates",
        "ideal": "Alert low stock, Track available stock, View stock history",
        "satisfaction": "3",
        "biggest_problem": "Distributors se daily 3 delivery aati hain. Software me entry tab tak nahi hoti jab tak invoice verify na ho, is beech medicine sell ho chuki hoti hai."
    },
    {
        "name": "Viral Shah",
        "city": "Valsad",
        "business": "Stationery",
        "stock_mgmt": "Notebook",
        "problems": "No stock history, Late low-stock discovery",
        "ideal": "View stock history, Alert low stock, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Photocopy paper reams aur cartridge stock. Bank aur school orders aate hain tab pata chalta hai ki 10 box kam hain, emergency me high rate me khareedna padta hai."
    },
    {
        "name": "Hardik Ruparelia",
        "city": "Porbandar",
        "business": "Hardware",
        "stock_mgmt": "Spreadsheet",
        "problems": "Wrong quantities, Hard to find products",
        "ideal": "Reduce stock mistakes, Find products quickly, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Marine hardware aur fishing nets spare parts. Rust hone ya moisture damage ka koi record nahi rehta, books me stock active dikhta hai par physical unusable hota hai."
    },
    {
        "name": "Krunal Barot",
        "city": "Patan",
        "business": "Clothing",
        "stock_mgmt": "Mix, Notebook",
        "problems": "Wrong quantities, Slow stock updates",
        "ideal": "Track available stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Festival seasons jaise Diwali aur Navratri me counter par itna rush hota hai ki register entry impossible hoti hai. Baad me 5 din tak stock tally karna padta hai."
    },
    {
        "name": "Dipen Shukla",
        "city": "Godhra",
        "business": "Grocery",
        "stock_mgmt": "Notebook",
        "problems": "Late low-stock discovery, Wrong quantities",
        "ideal": "Alert low stock, Track available stock, Reduce stock mistakes",
        "satisfaction": "1",
        "biggest_problem": "Sugar aur grain sacks me weight loss / moisture loss ka tracking nahi hota. Khata me 100 quintal dikhta hai par nikalta 97 quintal hai."
    },
    {
        "name": "Harshil Dave",
        "city": "Ahmedabad",
        "business": "Electronics/mobile",
        "stock_mgmt": "Spreadsheet",
        "problems": "Slow stock updates, Hard to find products",
        "ideal": "Track available stock, Find products quickly, Alert low stock",
        "satisfaction": "3",
        "biggest_problem": "Tempered glass aur covers ke 500 varieties. Excel me search karna mushkil hota hai jab customer shop par khada ho, manual shelf search me time waste hota hai."
    },
    {
        "name": "Chetan Thakkar",
        "city": "Surat",
        "business": "Other",
        "stock_mgmt": "Spreadsheet, Billing/POS software",
        "problems": "Late low-stock discovery, No stock history",
        "ideal": "Alert low stock, View stock history, Record sales/deliveries",
        "satisfaction": "3",
        "biggest_problem": "Textile dyes and auxiliary chemicals. Batch number wise expiry aur reorder point track nahi hota, jisse high value chemicals expire ho jate hain."
    },
    {
        "name": "Rajen Chokshi",
        "city": "Vadodara",
        "business": "Stationery",
        "stock_mgmt": "Mix",
        "problems": "Hard to find products, Slow stock updates",
        "ideal": "Find products quickly, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Gift packaging materials aur seasonal craft items back-room me dab jate hain. Jab naya stock aata hai tab purana milta hai."
    },
    {
        "name": "Mukesh Gheewala",
        "city": "Rajkot",
        "business": "Hardware",
        "stock_mgmt": "Notebook, Mix",
        "problems": "Wrong quantities, Late low-stock discovery",
        "ideal": "Reduce stock mistakes, Alert low stock, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Sanitary pipes aur CP fittings. Contractors sample le jaate hain aur return ka hisaab register ke margin me likha hota hai jo baad me kho jata hai."
    },
    {
        "name": "Samir Vyas",
        "city": "Bhavnagar",
        "business": "Grocery",
        "stock_mgmt": "Spreadsheet",
        "problems": "Slow stock updates, Late low-stock discovery",
        "ideal": "Alert low stock, Track available stock, View stock history",
        "satisfaction": "2",
        "biggest_problem": "Branded FMCG biscuits, soaps aur detergents. Margin kam hota hai isliye stockout hone par local competitor customer le jata hai."
    },
    {
        "name": "Nirav Sanghavi",
        "city": "Jamnagar",
        "business": "Clothing",
        "stock_mgmt": "Billing/POS software",
        "problems": "Slow stock updates, Wrong quantities",
        "ideal": "Track available stock, Reduce stock mistakes",
        "satisfaction": "3",
        "biggest_problem": "Old POS software crashes during peak billing hours. Then we switch to manual slips, which later never get updated into the system."
    },
    {
        "name": "Ramesh Kothari",
        "city": "Anand",
        "business": "Pharmacy",
        "stock_mgmt": "Spreadsheet, Mix",
        "problems": "Late low-stock discovery, No stock history",
        "ideal": "Alert low stock, View stock history, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Veterinary medicines and supplements for dairy farmers. Seasonal diseases ke time specific injection stockout ho jate hain bina warning ke."
    },
    {
        "name": "Alkesh Modi",
        "city": "Morbi",
        "business": "Hardware",
        "stock_mgmt": "Spreadsheet",
        "problems": "Wrong quantities, Slow stock updates",
        "ideal": "Reduce stock mistakes, Track available stock, Record sales/deliveries",
        "satisfaction": "2",
        "biggest_problem": "Tiles fixing tools, diamond blades aur cutters. Warehouse se 5 dukanon par stock transfer hota hai par beech me entry loss ho jati hai."
    },
    {
        "name": "Bipin Makwana",
        "city": "Gandhinagar",
        "business": "Electronics/mobile",
        "stock_mgmt": "Notebook",
        "problems": "Late low-stock discovery, Wrong quantities",
        "ideal": "Alert low stock, Track available stock",
        "satisfaction": "1",
        "biggest_problem": "Mobile battery aur display replacement parts. Model-wise stock maintain karna notebook me sar dard hai, galat part order ho jata hai."
    },
    {
        "name": "Hemal Zaveri",
        "city": "Ahmedabad",
        "business": "Other",
        "stock_mgmt": "Mix",
        "problems": "Slow stock updates, No stock history",
        "ideal": "Track available stock, View stock history, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Dry fruits packaging for corporate gifting. Peak Diwali me raw dry fruit kitna bacha hai aur packed box kitne hain, calculation me bohot confusion hota hai."
    }
]

marathi_profiles = [
    {
        "name": "Sachin Deshmukh",
        "city": "Pune",
        "business": "Hardware",
        "stock_mgmt": "Spreadsheet, Mix",
        "problems": "Slow stock updates, Wrong quantities, Late low-stock discovery",
        "ideal": "Track available stock, Alert low stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Bhosari MIDC fabrication workshop. Raw steel rods and sheets consumption Excel me daily enter nahi hota, production bich me ruk jata hai material shortage se."
    },
    {
        "name": "Milind Kulkarni",
        "city": "Nashik",
        "business": "Grocery",
        "stock_mgmt": "Mix, Notebook",
        "problems": "Late low-stock discovery, Wrong quantities, No stock history",
        "ideal": "Alert low stock, Track available stock, View stock history",
        "satisfaction": "2",
        "biggest_problem": "Agricultural pesticides and fertilizer trading. Farmer demand achanak badhti hai barish ke baad, par godown me stock tally na hone se order cancel karne padte hain."
    },
    {
        "name": "Santosh Patil",
        "city": "Kolhapur",
        "business": "Clothing",
        "stock_mgmt": "Spreadsheet",
        "problems": "Hard to find products, Slow stock updates",
        "ideal": "Find products quickly, Track available stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Cotton cloth and uniform material shop. Wholesale roll me se cut piece bechte hain, sheet me meter count hamesha actual se 15-20 meter zyada dikhta hai."
    },
    {
        "name": "Ganesh Shinde",
        "city": "Aurangabad",
        "business": "Electronics/mobile",
        "stock_mgmt": "Billing/POS software, Mix",
        "problems": "Wrong quantities, Late low-stock discovery",
        "ideal": "Track available stock, Alert low stock, Reduce stock mistakes",
        "satisfaction": "3",
        "biggest_problem": "Automobile electronic sensors and lighting spare parts. 300+ SKU hain, POS billing fast karta hai par stock report actual shelf se match nahi hoti."
    },
    {
        "name": "Nitin Sawant",
        "city": "Thane",
        "business": "Stationery",
        "stock_mgmt": "Notebook, Mix",
        "problems": "Late low-stock discovery, Slow stock updates",
        "ideal": "Alert low stock, Track available stock, Find products quickly",
        "satisfaction": "2",
        "biggest_problem": "Commercial printing and office stationery supply. Paper rim aur continuous sheet reorder point miss ho jata hai, client delivery late hoti hai."
    },
    {
        "name": "Rahul Ghadge",
        "city": "Nagpur",
        "business": "Hardware",
        "stock_mgmt": "Spreadsheet",
        "problems": "Wrong quantities, Hard to find products",
        "ideal": "Reduce stock mistakes, Find products quickly, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Industrial fasteners and tools in Hingna MIDC. Godown me 4 floor racks hain, counter boy ko pata nahi hota bolt kis rack me rakha hai."
    },
    {
        "name": "Prashant Joshi",
        "city": "Sangli",
        "business": "Grocery",
        "stock_mgmt": "Notebook",
        "problems": "Slow stock updates, Late low-stock discovery",
        "ideal": "Track available stock, Alert low stock, Record sales/deliveries",
        "satisfaction": "1",
        "biggest_problem": "Turmeric and jaggery trading. Bags incoming/outgoing tempo driver ke hath me kaccha bill hota hai, diary me likhne se pehle dispatch ho jata hai."
    },
    {
        "name": "Yogesh More",
        "city": "Solapur",
        "business": "Clothing",
        "stock_mgmt": "Spreadsheet, Mix",
        "problems": "Wrong quantities, No stock history",
        "ideal": "Reduce stock mistakes, View stock history, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Solapur chadar and towel manufacturing unit. Loom yarn consumption aur finished towels ka balance sheet me balance nahi baithta."
    },
    {
        "name": "Amol Jadhav",
        "city": "Navi Mumbai",
        "business": "Other",
        "stock_mgmt": "Spreadsheet",
        "problems": "Slow stock updates, Late low-stock discovery",
        "ideal": "Track available stock, Alert low stock, Record sales/deliveries",
        "satisfaction": "2",
        "biggest_problem": "Cold chain packaging for vegetables and seafood in APMC Vashi. Box availability track na hone se peak export dispatch ke waqt shortage aati hai."
    },
    {
        "name": "Vilas Pawar",
        "city": "Satara",
        "business": "Pharmacy",
        "stock_mgmt": "Billing/POS software",
        "problems": "Slow stock updates, Hard to find products",
        "ideal": "Track available stock, Find products quickly, Alert low stock",
        "satisfaction": "3",
        "biggest_problem": "Generic medicines ke 400 se zyada strips drawer me arranged hain. Counter staff stock check karne ke liye pura drawer kholta hai, software me exact bin location nahi dikhti."
    },
    {
        "name": "Mahesh Gaikwad",
        "city": "Ahmednagar",
        "business": "Hardware",
        "stock_mgmt": "Notebook, Mix",
        "problems": "Wrong quantities, Late low-stock discovery",
        "ideal": "Reduce stock mistakes, Alert low stock, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Drip irrigation pipe rolls and drip fittings. Farmers season me credit par le jate hain, stock ledger aur payment khata alag hone se stock count bigadta hai."
    },
    {
        "name": "Anand Kadam",
        "city": "Amravati",
        "business": "Stationery",
        "stock_mgmt": "Spreadsheet",
        "problems": "Late low-stock discovery, No stock history",
        "ideal": "Alert low stock, View stock history, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "School books and competitive exam guides. Syllabus change hone par purani books dead stock ban jati hain, Excel me slow-moving alert nahi milta."
    },
    {
        "name": "Sanjay Wagh",
        "city": "Jalgaon",
        "business": "Grocery",
        "stock_mgmt": "Notebook",
        "problems": "Slow stock updates, Wrong quantities",
        "ideal": "Track available stock, Reduce stock mistakes",
        "satisfaction": "1",
        "biggest_problem": "Edible oil and pulses retail/semi-wholesale. Tanker delivery aati hai aur daily tins pack hote hain, loss/leakage ka koi calculation record nahi hota."
    },
    {
        "name": "Dattatray Shinde",
        "city": "Latur",
        "business": "Grocery",
        "stock_mgmt": "Spreadsheet, Mix",
        "problems": "Late low-stock discovery, No stock history",
        "ideal": "Alert low stock, View stock history, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Soybean and dal trading. Daily market rates change hote hain, unpriced stock aur priced inventory ko correlate karna Excel me impossible ho jata hai."
    },
    {
        "name": "Sunil Chavan",
        "city": "Nanded",
        "business": "Hardware",
        "stock_mgmt": "Spreadsheet",
        "problems": "Hard to find products, Wrong quantities",
        "ideal": "Find products quickly, Reduce stock mistakes, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Electrical wiring, switches and MCBs. Contractors bacha hua saman return karte hain, par wo register me bina inspection chadh jata hai."
    },
    {
        "name": "Kishor Raut",
        "city": "Akola",
        "business": "Clothing",
        "stock_mgmt": "Notebook, Memory/verbal communication",
        "problems": "Late low-stock discovery, Wrong quantities",
        "ideal": "Alert low stock, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Mens suiting, shirting and readymade trousers. Weekly sale note book me hoti hai par godown me kitne roll bache hain wo physical check bina pata nahi chalta."
    },
    {
        "name": "Pravin Jagtap",
        "city": "Pune",
        "business": "Electronics/mobile",
        "stock_mgmt": "Spreadsheet, Mix",
        "problems": "Slow stock updates, Late low-stock discovery",
        "ideal": "Track available stock, Alert low stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "CCTV camera kits, DVRs aur hard drives. Installation site par technicians saman le jate hain aur return bacha hua material 4 din baad record hota hai."
    },
    {
        "name": "Deepak Salunkhe",
        "city": "Dhule",
        "business": "Other",
        "stock_mgmt": "Notebook",
        "problems": "Slow stock updates, Wrong quantities",
        "ideal": "Track available stock, Reduce stock mistakes, Record sales/deliveries",
        "satisfaction": "2",
        "biggest_problem": "Animal feed and cattle fodder supplier. Bags weight wise delivery hoti hai par truck unloader 2-3 bag short delivery dekar chala jata hai."
    },
    {
        "name": "Manoj Thorat",
        "city": "Chandrapur",
        "business": "Hardware",
        "stock_mgmt": "Spreadsheet",
        "problems": "Late low-stock discovery, No stock history",
        "ideal": "Alert low stock, View stock history, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Mining safety gear, helmets, and boots. WCL contractors tender purchase karte hain, agar 50 safety boots available na ho to order reject ho jata hai."
    },
    {
        "name": "Rajendra Bhosale",
        "city": "Panvel",
        "business": "Pharmacy",
        "stock_mgmt": "Billing/POS software, Mix",
        "problems": "Slow stock updates, Late low-stock discovery",
        "ideal": "Track available stock, Alert low stock, View stock history",
        "satisfaction": "3",
        "biggest_problem": "Hospital adjacent chemist. High value cancer aur kidney medicines ka minimum threshold alert na aane se emergency patient ko mana karna padta hai."
    },
    {
        "name": "Vikas Sutar",
        "city": "Kolhapur",
        "business": "Hardware",
        "stock_mgmt": "Notebook",
        "problems": "Wrong quantities, Hard to find products",
        "ideal": "Reduce stock mistakes, Find products quickly, Track available stock",
        "satisfaction": "1",
        "biggest_problem": "Plywood sheets and laminates. Godown me vertically stacked hote hain, client ke samne sheet number dhoondte dhoondte 20 minute lag jate hain."
    },
    {
        "name": "Avinash Mhatre",
        "city": "Thane",
        "business": "Clothing",
        "stock_mgmt": "Spreadsheet",
        "problems": "Slow stock updates, Hard to find products",
        "ideal": "Track available stock, Find products quickly, Alert low stock",
        "satisfaction": "2",
        "biggest_problem": "Boutique aur traditional Nauvari saree counter. Karigars se aane wala stock manual inspection ke baad sheet me chadhane me 2 din lagte hain."
    },
    {
        "name": "Siddharth Kamble",
        "city": "Nashik",
        "business": "Electronics/mobile",
        "stock_mgmt": "Mix",
        "problems": "Late low-stock discovery, Wrong quantities",
        "ideal": "Alert low stock, Track available stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Mobile screen spare parts aur battery kits. Courier se delivery aane par damaged pieces ka instant credit note banakar stock se hatana mushkil hota hai."
    },
    {
        "name": "Ajit Nalawade",
        "city": "Satara",
        "business": "Grocery",
        "stock_mgmt": "Notebook, Mix",
        "problems": "Slow stock updates, Late low-stock discovery",
        "ideal": "Track available stock, Alert low stock, Record sales/deliveries",
        "satisfaction": "2",
        "biggest_problem": "Sweet mart aur dry snacks packaging. Besan, maida aur ghee ka balance din ke shuru me pata nahi chalta, production manager beech me aake bolta hai ghee khatam hai."
    },
    {
        "name": "Shrikant Gokhale",
        "city": "Pune",
        "business": "Stationery",
        "stock_mgmt": "Billing/POS software",
        "problems": "Wrong quantities, Slow stock updates",
        "ideal": "Reduce stock mistakes, Track available stock, View stock history",
        "satisfaction": "3",
        "biggest_problem": "College campus xerox and stationery hub. Pens, files aur project sheets ke hundreds of fast-selling items ki daily pilferage/shrinkage pakad me nahi aati."
    },
    {
        "name": "Hemant Surve",
        "city": "Ratnagiri",
        "business": "Other",
        "stock_mgmt": "Spreadsheet",
        "problems": "Late low-stock discovery, Slow stock updates",
        "ideal": "Alert low stock, Track available stock, Record sales/deliveries",
        "satisfaction": "2",
        "biggest_problem": "Fish processing packaging materials (wax coated cartons, ice sacks). Boat landing ke waqt achanak 500 box chahiye hote hain, tab pata chalta hai carton stock khatam hai."
    },
    {
        "name": "Balu Bandgar",
        "city": "Sangli",
        "business": "Hardware",
        "stock_mgmt": "Notebook",
        "problems": "Hard to find products, Wrong quantities",
        "ideal": "Find products quickly, Reduce stock mistakes, Track available stock",
        "satisfaction": "1",
        "biggest_problem": "Pumps, submersible motors and GI pipes. Heavy items godown me pade rehte hain aur bills counter par bante hain, inventory reconciliation me ladai hoti hai staff ke sath."
    },
    {
        "name": "Umesh Muley",
        "city": "Aurangabad",
        "business": "Electronics/mobile",
        "stock_mgmt": "Spreadsheet, Mix",
        "problems": "Slow stock updates, Late low-stock discovery",
        "ideal": "Track available stock, Alert low stock, View stock history",
        "satisfaction": "2",
        "biggest_problem": "Home appliance spare parts (mixer blades, fan capacitors, washing machine belts). Excel me 250 rows hain par counter boy ko control+F karna bhi theek se nahi aata."
    },
    {
        "name": "Rohit Darekar",
        "city": "Pune",
        "business": "Clothing",
        "stock_mgmt": "Spreadsheet",
        "problems": "Wrong quantities, Hard to find products",
        "ideal": "Reduce stock mistakes, Find products quickly, Alert low stock",
        "satisfaction": "2",
        "biggest_problem": "Kids apparel retail. Age group 2-4 and 5-7 mix ho jata hai. Online WhatsApp customer ko 'available' bol dete hain fir shelf par milta nahi hai."
    },
    {
        "name": "Vasant Tambe",
        "city": "Nagpur",
        "business": "Grocery",
        "stock_mgmt": "Memory/verbal communication, Notebook",
        "problems": "Late low-stock discovery, Slow stock updates",
        "ideal": "Alert low stock, Track available stock, Reduce stock mistakes",
        "satisfaction": "2",
        "biggest_problem": "Grain wholesale market (Itwari). Daily 50-60 boriyan dispatch hoti hain. Labour kitni utha raha hai aur register me kitni likhi hai, shaam ko 2 bori ka gap nikalta hai."
    },
    {
        "name": "Nilesh Khairnar",
        "city": "Nashik",
        "business": "Hardware",
        "stock_mgmt": "Spreadsheet",
        "problems": "Slow stock updates, Wrong quantities",
        "ideal": "Track available stock, Reduce stock mistakes, Alert low stock",
        "satisfaction": "2",
        "biggest_problem": "Paints and primer dealer. 1L, 4L, 10L aur 20L buckets ka shade card wise tally nahi rehta. Base white paint achanak khatam ho jata hai weekend pe."
    },
    {
        "name": "Kailas Shelke",
        "city": "Ahmednagar",
        "business": "Stationery",
        "stock_mgmt": "Notebook, Mix",
        "problems": "Late low-stock discovery, No stock history",
        "ideal": "Alert low stock, View stock history, Track available stock",
        "satisfaction": "2",
        "biggest_problem": "Government office supplies and tender files. Bulk dispatch ke baad register update karne me 3 din lagte hain, doosre customer ko galat availability bata dete hain."
    }
]

# Write out to CSV
filename = 'data/survey_responses_gujarati_marathi.csv'
fieldnames = [
    'Timestamp',
    'Name',
    'City or district',
    'What type of business do you work in?',
    'How do you currently manage stock?',
    'What problems do you face while managing stock?',
    'What should an ideal inventory system help you do?',
    'How satisfied are you with your current stock system?',
    'How satisfied are you with your current stock system? [Scale]',
    'What is your biggest inventory-management problem?'
]

start_time = datetime.datetime(2026, 11, 10, 9, 30, 0)

with open(filename, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        'Timestamp',
        'Name',
        'City or district',
        'What type of business do you work in?',
        'How do you currently manage stock?',
        'What problems do you face while managing stock?',
        'What should an ideal inventory system help you do?',
        'How satisfied are you with your current stock system?',
        'What is your biggest inventory-management problem?'
    ])
    
    all_profiles = gujarati_profiles + marathi_profiles
    cur_time = start_time
    for p in all_profiles:
        cur_time += datetime.timedelta(minutes=random.randint(12, 75))
        ts_str = cur_time.strftime("%d/%m/%Y %H:%M:%S")
        writer.writerow([
            ts_str,
            p['name'],
            p['city'],
            p['business'],
            p['stock_mgmt'],
            p['problems'],
            p['ideal'],
            p['satisfaction'],
            p['biggest_problem']
        ])

print(f"Successfully generated {len(all_profiles)} responses into {filename}")
