/**
 * Dynamic BookMyShow Ticket Tracker Telegram Bot
 * Pre-loaded with 87 Indian Cities & 1,397 Cinemas across India
 * 100% Free & Autonomous on Cloudflare Workers + KV
 * Flow: City (Top / Search) -> Theatre (All / Paginated / Search) -> Movie (Live / Custom) -> Screen Format -> 24/7 Monitor
 */

const SHOWTIMES_API = "https://in.bookmyshow.com/api/movies-data/v4/showtimes-by-event/primary-dynamic";
const VENUES_API = "https://in.bookmyshow.com/api/v2/mobile/venues";
const QUICKBOOK_API = "https://in.bookmyshow.com/serv/getData?cmd=QUICKBOOK&type=MT";
const REGIONS_API = "https://in.bookmyshow.com/serv/getData?cmd=GETREGIONS";

// Quick-pick popular cities for Step 1 (6 Core Metros)
const POPULAR_CITIES = [
  {
    "code": "HYD",
    "name": "Hyderabad"
  },
  {
    "code": "NCR",
    "name": "Delhi-NCR"
  },
  {
    "code": "MUMBAI",
    "name": "Mumbai"
  },
  {
    "code": "BANG",
    "name": "Bengaluru"
  },
  {
    "code": "KANP",
    "name": "Kanpur"
  },
  {
    "code": "LUCK",
    "name": "Lucknow"
  }
];

// Preloaded database of 6 Core Indian cities
const TOP_CITIES = {
  "HYD": {
    "code": "HYD",
    "name": "Hyderabad",
    "slug": "hyderabad",
    "lat": "17.385044",
    "lon": "78.486671"
  },
  "NCR": {
    "code": "NCR",
    "name": "Delhi-NCR",
    "slug": "national-capital-region-ncr",
    "lat": "28.6139",
    "lon": "77.209"
  },
  "MUMBAI": {
    "code": "MUMBAI",
    "name": "Mumbai",
    "slug": "mumbai",
    "lat": "19.076",
    "lon": "72.8777"
  },
  "BANG": {
    "code": "BANG",
    "name": "Bengaluru",
    "slug": "bengaluru",
    "lat": "12.9715987",
    "lon": "77.5945627"
  },
  "KANP": {
    "code": "KANP",
    "name": "Kanpur",
    "slug": "kanpur",
    "lat": "26.4634",
    "lon": "80.3229"
  },
  "LUCK": {
    "code": "LUCK",
    "name": "Lucknow",
    "slug": "lucknow",
    "lat": "26.8465108",
    "lon": "80.9466832"
  }
};

// Lightweight reference index of all 87 known BookMyShow cities across India for instant search & request validation
const BMS_ALL_REGIONS = {"MUMBAI": {"code": "MUMBAI", "name": "Mumbai", "slug": "mumbai", "lat": "19.076", "lon": "72.8777"}, "NCR": {"code": "NCR", "name": "Delhi-NCR", "slug": "national-capital-region-ncr", "lat": "28.6139", "lon": "77.209"}, "BANG": {"code": "BANG", "name": "Bengaluru", "slug": "bengaluru", "lat": "12.9715987", "lon": "77.5945627"}, "HYD": {"code": "HYD", "name": "Hyderabad", "slug": "hyderabad", "lat": "17.385044", "lon": "78.486671"}, "CHD": {"code": "CHD", "name": "Chandigarh", "slug": "chandigarh", "lat": "30.7333148", "lon": "76.7794179"}, "AHD": {"code": "AHD", "name": "Ahmedabad", "slug": "ahmedabad", "lat": "23.0395677", "lon": "72.5660045"}, "PUNE": {"code": "PUNE", "name": "Pune", "slug": "pune", "lat": "18.5204303", "lon": "73.8567437"}, "CHEN": {"code": "CHEN", "name": "Chennai", "slug": "chennai", "lat": "13.056", "lon": "80.206"}, "KOLK": {"code": "KOLK", "name": "Kolkata", "slug": "kolkata", "lat": "22.641", "lon": "88.411"}, "KOCH": {"code": "KOCH", "name": "Kochi", "slug": "kochi", "lat": "9.9312328", "lon": "76.2673041"}, "AGRA": {"code": "AGRA", "name": "Agra", "slug": "agra", "lat": "27.1766701", "lon": "78.0080745"}, "AJMER": {"code": "AJMER", "name": "Ajmer", "slug": "ajmer", "lat": "26.45", "lon": "74.64"}, "AMRI": {"code": "AMRI", "name": "Amritsar", "slug": "amritsar", "lat": "31.6339793", "lon": "74.8722642"}, "ATKK": {"code": "ATKK", "name": "Atmakur (Kurnool)", "slug": "atmakur-kurnool", "lat": "15.8791", "lon": "78.5837"}, "ATMK": {"code": "ATMK", "name": "Atmakur (Nellore)", "slug": "atmakur-nellore", "lat": "14.6167", "lon": "79.6245"}, "AUBI": {"code": "AUBI", "name": "Aurangabad (Bihar)", "slug": "aurangabad-bihar", "lat": "24.7033", "lon": "84.3542"}, "AURW": {"code": "AURW", "name": "Aurangabad (West Bengal)", "slug": "aurangabad-west-bengal", "lat": "24.5976", "lon": "88.0339"}, "BKOT": {"code": "BKOT", "name": "B. Kothakota", "slug": "b-kothakota", "lat": "13.65674", "lon": "78.265857"}, "BELG": {"code": "BELG", "name": "Belagavi (Belgaum)", "slug": "belagavi-belgaum", "lat": "15.85036", "lon": "74.504669"}, "BHAW": {"code": "BHAW", "name": "Bhawanipatna", "slug": "bhawanipatna", "lat": "19.9074", "lon": "83.1642"}, "BHOP": {"code": "BHOP", "name": "Bhopal", "slug": "bhopal", "lat": "23.2599333", "lon": "77.412615"}, "BHUB": {"code": "BHUB", "name": "Bhubaneswar", "slug": "bhubaneswar", "lat": "20.2960587", "lon": "85.8245398"}, "CPTN": {"code": "CPTN", "name": "Channapatna", "slug": "channapatna", "lat": "12.6510995", "lon": "77.1946192"}, "CHNN": {"code": "CHNN", "name": "Channarayapatna", "slug": "channarayapatna", "lat": "12.9", "lon": "76.3899"}, "AURA": {"code": "AURA", "name": "Chhatrapati Sambhajinagar (Aurangabad)", "slug": "chhatrapati-sambhajinagar-aurangabad", "lat": "19.876", "lon": "75.349"}, "COIM": {"code": "COIM", "name": "Coimbatore", "slug": "coimbatore", "lat": "11.0168445", "lon": "76.9558321"}, "DEH": {"code": "DEH", "name": "Dehradun", "slug": "dehradun", "lat": "30.3164945", "lon": "78.0321918"}, "GOA": {"code": "GOA", "name": "Goa", "slug": "goa", "lat": "15.378", "lon": "74.019"}, "GOAL": {"code": "GOAL", "name": "Goalpara", "slug": "goalpara", "lat": "26.1641", "lon": "90.6252"}, "GUNT": {"code": "GUNT", "name": "Guntur", "slug": "guntur", "lat": "16.3008", "lon": "80.4428"}, "GUW": {"code": "GUW", "name": "Guwahati", "slug": "guwahati", "lat": "26.144435", "lon": "91.733179"}, "HUBL": {"code": "HUBL", "name": "Hubballi (Hubli)", "slug": "hubballi-hubli", "lat": "15.3647", "lon": "75.124"}, "IND": {"code": "IND", "name": "Indore", "slug": "indore", "lat": "22.7287", "lon": "75.8654"}, "JGRO": {"code": "JGRO", "name": "Jagraon", "slug": "jagraon", "lat": "30.7916", "lon": "75.4694"}, "JAIJ": {"code": "JAIJ", "name": "Jaijaipur", "slug": "jaijaipur", "lat": "21.8313", "lon": "82.8164"}, "JAIP": {"code": "JAIP", "name": "Jaipur", "slug": "jaipur", "lat": "26.9124165", "lon": "75.7872879"}, "JALA": {"code": "JALA", "name": "Jalandhar", "slug": "jalandhar", "lat": "31.3260152", "lon": "75.5761829"}, "JAMM": {"code": "JAMM", "name": "Jammu", "slug": "jammu", "lat": "34.024288", "lon": "76.092468"}, "JMDP": {"code": "JMDP", "name": "Jamshedpur", "slug": "jamshedpur", "lat": "22.805235", "lon": "86.207356"}, "JODH": {"code": "JODH", "name": "Jodhpur", "slug": "jodhpur", "lat": "26.2389469", "lon": "73.0243094"}, "KAKI": {"code": "KAKI", "name": "Kakinada", "slug": "kakinada", "lat": "16.945181", "lon": "82.238647"}, "KPKT": {"code": "KPKT", "name": "Kamavarapukota", "slug": "kamavarapukota", "lat": "17.0098", "lon": "81.1939"}, "KANP": {"code": "KANP", "name": "Kanpur", "slug": "kanpur", "lat": "26.4634", "lon": "80.3229"}, "KOTA": {"code": "KOTA", "name": "Kota", "slug": "kota", "lat": "25.1695114", "lon": "75.8539898"}, "KOAN": {"code": "KOAN", "name": "Kota (AP)", "slug": "kota-ap", "lat": "14.0352", "lon": "80.0465"}, "KTAB": {"code": "KTAB", "name": "Kotabommali", "slug": "kotabommali", "lat": "18.5184", "lon": "84.1514"}, "KTND": {"code": "KTND", "name": "Kotananduru", "slug": "kotananduru", "lat": "17.482865", "lon": "82.488968"}, "KOTL": {"code": "KOTL", "name": "Kothakota", "slug": "kothakota", "lat": "16.3787", "lon": "77.941"}, "KOVR": {"code": "KOVR", "name": "Kovur (Nellore)", "slug": "kovur-nellore", "lat": "14.5012", "lon": "79.9881"}, "KURN": {"code": "KURN", "name": "Kurnool", "slug": "kurnool", "lat": "15.8281", "lon": "78.0373"}, "LUCK": {"code": "LUCK", "name": "Lucknow", "slug": "lucknow", "lat": "26.8465108", "lon": "80.9466832"}, "LUDH": {"code": "LUDH", "name": "Ludhiana", "slug": "ludhiana", "lat": "30.900965", "lon": "75.8572758"}, "MAPM": {"code": "MAPM", "name": "Machilipatnam", "slug": "machilipatnam", "lat": "16.1905", "lon": "81.1362"}, "MADU": {"code": "MADU", "name": "Madurai", "slug": "madurai", "lat": "9.9252007", "lon": "78.1197754"}, "MNMI": {"code": "MNMI", "name": "Manamadurai", "slug": "manamadurai", "lat": "9.689", "lon": "78.4581"}, "MLR": {"code": "MLR", "name": "Mangaluru (Mangalore)", "slug": "mangaluru-mangalore", "lat": "12.91379", "lon": "74.853977"}, "MERT": {"code": "MERT", "name": "Meerut", "slug": "meerut", "lat": "28.9844618", "lon": "77.7064137"}, "MYS": {"code": "MYS", "name": "Mysuru (Mysore)", "slug": "mysuru-mysore", "lat": "12.2958104", "lon": "76.6393805"}, "NGKL": {"code": "NGKL", "name": "Nagarkurnool", "slug": "nagarkurnool", "lat": "16.4939", "lon": "78.3102"}, "NAGP": {"code": "NAGP", "name": "Nagpur", "slug": "nagpur", "lat": "21.1458004", "lon": "79.0881546"}, "NARS": {"code": "NARS", "name": "Narsipatnam", "slug": "narsipatnam", "lat": "17.6664", "lon": "82.6105"}, "NASK": {"code": "NASK", "name": "Nashik", "slug": "nashik", "lat": "20.0014", "lon": "73.7869"}, "NELL": {"code": "NELL", "name": "Nellore", "slug": "nellore", "lat": "14.4426", "lon": "79.9865"}, "NZPT": {"code": "NZPT", "name": "Nizampatnam", "slug": "nizampatnam", "lat": "15.9069", "lon": "80.6691"}, "PTPT": {"code": "PTPT", "name": "Pathapatnam", "slug": "pathapatnam", "lat": "18.7505", "lon": "84.0916"}, "PATN": {"code": "PATN", "name": "Patna", "slug": "patna", "lat": "25.61046", "lon": "85.141667"}, "PERI": {"code": "PERI", "name": "Periyapatna", "slug": "periyapatna", "lat": "12.3374", "lon": "76.0987"}, "ALLH": {"code": "ALLH", "name": "Prayagraj (Allahabad)", "slug": "prayagraj-allahabad", "lat": "25.4022472", "lon": "81.7315448"}, "RAIPUR": {"code": "RAIPUR", "name": "Raipur", "slug": "raipur", "lat": "21.2513844", "lon": "81.6296413"}, "YAYA": {"code": "YAYA", "name": "Raipuriya", "slug": "raipuriya", "lat": "23.744812", "lon": "76.658272"}, "RJMU": {"code": "RJMU", "name": "Rajamahendravaram (Rajahmundry)", "slug": "rajamahendravaram-rajahmundry", "lat": "17.0005", "lon": "81.804"}, "RANC": {"code": "RANC", "name": "Ranchi", "slug": "ranchi", "lat": "23.3440997", "lon": "85.309562"}, "SAMA": {"code": "SAMA", "name": "Samalkota", "slug": "samalkota", "lat": "17.0504", "lon": "82.1659"}, "SOLA": {"code": "SOLA", "name": "Solapur", "slug": "solapur", "lat": "17.659834", "lon": "75.906601"}, "SRNG": {"code": "SRNG", "name": "Srinagar", "slug": "srinagar", "lat": "34.0837", "lon": "74.7973"}, "SRIR": {"code": "SRIR", "name": "Srirangapatna", "slug": "srirangapatna", "lat": "12.4216", "lon": "76.6931"}, "SURT": {"code": "SURT", "name": "Surat", "slug": "surat", "lat": "21.195", "lon": "72.819444"}, "SRTK": {"code": "SRTK", "name": "Surathkal", "slug": "surathkal", "lat": "12.9951", "lon": "74.8094"}, "TRIV": {"code": "TRIV", "name": "Thiruvananthapuram (Trivandrum)", "slug": "thiruvananthapuram-trivandrum", "lat": "8.4875", "lon": "76.9525"}, "TIRU": {"code": "TIRU", "name": "Tirupati", "slug": "tirupati", "lat": "13.6288", "lon": "79.4192"}, "UDAI": {"code": "UDAI", "name": "Udaipur", "slug": "udaipur", "lat": "24.58", "lon": "73.68"}, "VAD": {"code": "VAD", "name": "Vadodara", "slug": "vadodara", "lat": "22.3073095", "lon": "73.1810976"}, "VAR": {"code": "VAR", "name": "Varanasi", "slug": "varanasi", "lat": "25.3176452", "lon": "82.9739144"}, "VIJP": {"code": "VIJP", "name": "Vijayapura (Bengaluru Rural)", "slug": "vijayapura-bengaluru-rural", "lat": "13.2955", "lon": "77.801"}, "VIJA": {"code": "VIJA", "name": "Vijayawada", "slug": "vijayawada", "lat": "16.519", "lon": "80.6215"}, "VIZA": {"code": "VIZA", "name": "Vizag (Visakhapatnam)", "slug": "vizag-visakhapatnam", "lat": "17.6868159", "lon": "83.2184815"}, "WAR": {"code": "WAR", "name": "Warangal", "slug": "warangal", "lat": "18.000055", "lon": "79.588167"}};

// Preloaded database of 519 cinemas across the 6 Core Indian cities
const ALL_VENUES = {"HYD": [{"code": "PRHN", "name": "Prasads Multiplex", "subRegion": ""}, {"code": "AMBH", "name": "AMB Cinemas: Gachibowli", "subRegion": ""}, {"code": "ALUC", "name": "ALLU Cinemas: Kokapet", "subRegion": ""}, {"code": "ACPM", "name": "Asian Lakshmikala Cinepride: Moosapet", "subRegion": ""}, {"code": "ACEV", "name": "ART CINEMAS: Vanasthalipuram", "subRegion": ""}, {"code": "PVFS", "name": "PVR: Nexus Mall Kukatpally, Hyderabad", "subRegion": ""}, {"code": "ACAS", "name": "AAA Cinemas: Ameerpet", "subRegion": ""}, {"code": "AACN", "name": "Aparna Cinemas: Nallagandla", "subRegion": ""}, {"code": "CTNR", "name": "Cinepolis: TNR North City, Suchitra, Hyderabad", "subRegion": ""}, {"code": "ILKS", "name": "PVR Lakeshore PXL 4K Laser ATMOS DTS-X Y Junction", "subRegion": ""}, {"code": "SRMO", "name": "Sree Ramulu 70mm 4K Laser: Moosapet", "subRegion": ""}, {"code": "IGMH", "name": "INOX: GSM Mall, Hyderabad", "subRegion": ""}, {"code": "MMAH", "name": "MovieMax: AMR, ECIL Secunderabad", "subRegion": ""}, {"code": "GPRH", "name": "GPR Multiplex: Nizampet, Hyderabad", "subRegion": ""}, {"code": "CPMH", "name": "Cinepolis: Lulu Mall, Hyderabad", "subRegion": ""}, {"code": "CVMU", "name": "Cineverse Multiplex: Uppal", "subRegion": ""}, {"code": "MMCA", "name": "Miraj Cinemas: CineTown, Miyapur", "subRegion": ""}, {"code": "ASHN", "name": "Asian Cinemart: RC Puram", "subRegion": ""}, {"code": "MAHM", "name": "Mallikarjuna 70mm A/C DTS: Kukatpally", "subRegion": ""}, {"code": "AMCA", "name": "Asian M Cube Mall: Attapur", "subRegion": ""}, {"code": "SRCM", "name": "Sai Ranga70MM 4KLaser Dolby7.1 AirCooled: Miyapur", "subRegion": ""}, {"code": "ABCS", "name": "Cinepolis: DSL Virtue Mall Uppal, Hyderabad", "subRegion": ""}, {"code": "BRKH", "name": "Bhramaramba 70MM A/C 4K Dolby: Kukatpally", "subRegion": ""}, {"code": "CPHY", "name": "Asian Cineplanet Multiplex: Kompally", "subRegion": ""}, {"code": "PNNG", "name": "PVR: Next Galleria Mall, Panjagutta", "subRegion": ""}, {"code": "CMMA", "name": "Cinepolis: Mantra Mall, Attapur", "subRegion": ""}, {"code": "ISTN", "name": "INOX: Sattva Necklace Mall, Kavadiguda", "subRegion": ""}, {"code": "GOKU", "name": "Gokul 70MM 4K DTS: Erragadda", "subRegion": ""}, {"code": "PVTS", "name": "PVR: Atrium Gachibowli, Hyderabad", "subRegion": ""}, {"code": "JJPP", "name": "JP Cinemas: Chandanagar", "subRegion": ""}, {"code": "AKYJ", "name": "INOX: Ashoka One, 4K LASER Dolby ATMOS: Kukatpally", "subRegion": ""}, {"code": "SSRM", "name": "Sri Sai Ram 70mm A/C 4k Laser Dolby 7.1:Malkajgiri", "subRegion": ""}, {"code": "SMMR", "name": "Sandhya 70MM 4K Dolby Atmos: RTC X Roads", "subRegion": ""}, {"code": "HMHD", "name": "BR Hitech 70mm: Madhapur", "subRegion": ""}, {"code": "ARJU", "name": "Arjun 70MM: Kukatpally", "subRegion": ""}, {"code": "PIMH", "name": "PVR: Irrum Manzil, Hyderabad", "subRegion": ""}, {"code": "PVTP", "name": "PVR: Preston, Gachibowli Hyderabad", "subRegion": ""}, {"code": "PIIC", "name": "PVR Superplex Inorbit: LUXE, PXL, 4DX: Cyberabad", "subRegion": ""}, {"code": "IOMH", "name": "INOX: Odeon 4K, LASER, ATMOS, DTS-X: RTC X Roads", "subRegion": ""}, {"code": "APNS", "name": "Aparna Cinemas: Shamshabad", "subRegion": ""}, {"code": "ARMH", "name": "Asian Radhika Multiplex: ECIL", "subRegion": ""}, {"code": "PVHM", "name": "PVR ICON: Hitech, Madhapur, Hyderabad", "subRegion": ""}, {"code": "INKM", "name": "Cine Town Indra Nagendra: Karmanghat", "subRegion": ""}, {"code": "ACHI", "name": "Asian Sha & Shahensha: Chintal", "subRegion": ""}, {"code": "PVUM", "name": "PVR: Musarambagh, Hyderabad", "subRegion": ""}, {"code": "IPRS", "name": "INOX: Prism Mall, Hyderabad", "subRegion": ""}, {"code": "MRAD", "name": "Miraj Cinemas: Anand Mall and Movies, Narsingi", "subRegion": ""}, {"code": "SNKH", "name": "Asian Mukta A2 Sensation Cinema: Kairathabad", "subRegion": ""}, {"code": "MCSS", "name": "Miraj Cinemas: Shalini Shivani, Kothapet", "subRegion": ""}, {"code": "SNDY", "name": "Sandhya 35mm 2k Dolby Atmos: RTC X Roads", "subRegion": ""}, {"code": "DVRR", "name": "Devi 70MM 4K Laser & Dolby Atmos: RTC X Roads", "subRegion": ""}, {"code": "PVYH", "name": "PVR: Central Mall, Panjagutta", "subRegion": ""}, {"code": "ASJY", "name": "Asian Jyothi: RC Puram", "subRegion": ""}, {"code": "MCKT", "name": "Mahalaxmi Complex: Kothapet", "subRegion": ""}, {"code": "ARYH", "name": "Asian Rajya Lakshmi: Uppal", "subRegion": ""}, {"code": "MRAA", "name": "Miraj Cinemas: A2A Central Mall, Balanagar", "subRegion": ""}, {"code": "INHY", "name": "INOX GVK One, Banjara Hills", "subRegion": ""}, {"code": "INMH", "name": "INOX: Maheshwari Parmeshwari Mall, Kachiguda", "subRegion": ""}, {"code": "VRKC", "name": "Indra Venkataramana Padmavati Cinema: Kachiguda", "subRegion": ""}, {"code": "VTRB", "name": "Vijetha 70MM 4k Atmos: Borabanda", "subRegion": ""}, {"code": "SPCB", "name": "Asian Super Cinema: Balapur", "subRegion": ""}, {"code": "TVHY", "name": "Tivoli Cinemas: Secunderabad", "subRegion": ""}, {"code": "SUDA", "name": "Sudarshan 35MM 4k Laser & Dolby Atmos: RTC X Roads", "subRegion": ""}, {"code": "IVNM", "name": "INOX: SMR Vinay Metro Mall, Dolby ATMOS: Miyapur", "subRegion": ""}, {"code": "PRCX", "name": "PVR: RK Cineplex, Hyderabad", "subRegion": ""}, {"code": "MRGT", "name": "Miraj Cinemas: Geeta, Chandanagar", "subRegion": ""}, {"code": "STHD", "name": "Cinepolis: Sudha Cinemas, Hyderabad", "subRegion": ""}, {"code": "MRRG", "name": "Miraj Cinemas: Raghavendra, Malkajgiri", "subRegion": ""}, {"code": "SCHC", "name": "VLS Sridevi 2K A/C Dts: Chilakalguda", "subRegion": ""}, {"code": "UKCC", "name": "UK Cineplex: Nacharam, Hyderabad", "subRegion": ""}, {"code": "CPCL", "name": "Cinepolis: CCPL Mall Malkajgiri, Hyderabad", "subRegion": ""}, {"code": "AMCM", "name": "Asian Mukund Cinema: Medchal", "subRegion": ""}, {"code": "PSMJ", "name": "Movietime Cinemas: SKY Mall, Erragadda X Road", "subRegion": ""}, {"code": "MTHY", "name": "Platinum Movietime Cinema: Gachibowli SLN Terminus", "subRegion": ""}, {"code": "VAJA", "name": "Vyjayanthi Cinema A/C 2K: Nacharam", "subRegion": ""}, {"code": "PRCS", "name": "Prashant Cinema: Secunderabad (Newly Renovated)", "subRegion": ""}, {"code": "TRHY", "name": "Asian Tarakarama Cineplex: Kachiguda", "subRegion": ""}, {"code": "RKMH", "name": "Rama Krishna 70mm: Abids", "subRegion": ""}, {"code": "PTTH", "name": "Alankar (Pratap Theatre): Langer House", "subRegion": ""}, {"code": "SCVM", "name": "Sushma 2K Dolby Digital Cinema: Vanasthalipuram", "subRegion": ""}, {"code": "CPLK", "name": "CONNPLEX Luxuriance Cinemas: Mpm Mall, Banjara Hil", "subRegion": ""}, {"code": "BJNG", "name": "Bhujanga 70MM: Jeedimetla", "subRegion": ""}, {"code": "ARTH", "name": "Aradhana Theatre", "subRegion": ""}, {"code": "SRCA", "name": "Sree Ramana 70MM 4K Laser & Dolby 7.1: Amberpet", "subRegion": ""}, {"code": "SRKR", "name": "Sri Krishna 70MM: Uppal", "subRegion": ""}, {"code": "RMKN", "name": "Ramakrishna 35mm: Abids", "subRegion": ""}, {"code": "RCNH", "name": "ROONGTA CINEMAS: NOVUM, NAMPALLY", "subRegion": ""}, {"code": "SRCH", "name": "Sree Ramana Gold 4K & Dolby 7.1: Amberpet", "subRegion": ""}, {"code": "SSRJ", "name": "Sree Sai Raja Theatre: Musheerabad", "subRegion": ""}, {"code": "KTKT", "name": "Kumar Theatre: Kachiguda", "subRegion": ""}, {"code": "SNIB", "name": "Santosh Theatre: Ibrahimpatnam", "subRegion": ""}, {"code": "SLRT", "name": "Laxmi 70MM A/C LASER DOLBY 7.1: Shamshabad", "subRegion": ""}, {"code": "MCBH", "name": "Metro Cinema: Bahadurpura", "subRegion": ""}, {"code": "LKMT", "name": "Lakshmi Kala Mandir: Alwal", "subRegion": ""}, {"code": "SART", "name": "Saptagiri 70MM 4K & Dolby Digital: RTC X Roads", "subRegion": ""}, {"code": "SKTA", "name": "Sri Krishna Theatre: Aliabad (Shameerpet)", "subRegion": ""}, {"code": "YAKT", "name": "Yakut Mahal Theater: Yakutpura", "subRegion": ""}], "NCR": [{"code": "PVVW", "name": "PVR: Vegas Dwarka", "subRegion": ""}, {"code": "CPNS", "name": "Cinepolis: Pacific NSP2, Delhi", "subRegion": ""}, {"code": "DTYN", "name": "PVR: Superplex Mall Of India, Noida", "subRegion": ""}, {"code": "PVLE", "name": "PVR: Superplex Logix, Noida", "subRegion": ""}, {"code": "PAEG", "name": "Gurugram Pepsi PVR Ambience", "subRegion": ""}, {"code": "PTCW", "name": "PVR: Select City Walk, Delhi", "subRegion": ""}, {"code": "PGND", "name": "PVR: Gaur City, Greater Noida", "subRegion": ""}, {"code": "USEB", "name": "US CINEMAS: Galaxy Blue Sapphire, Noida Ext", "subRegion": ""}, {"code": "PPGV", "name": "PVR: Promenade, Vasant Kunj", "subRegion": ""}, {"code": "G3SR", "name": "G3S Cinema: Rohini (Newly Renovated)", "subRegion": ""}, {"code": "IPMJ", "name": "INOX: Pacific Mall, Jasola", "subRegion": ""}, {"code": "CIPS", "name": "Cinepolis: DLF Avenue, Saket", "subRegion": ""}, {"code": "INVM", "name": "INOX: Vishal Mall, Rajouri Garden", "subRegion": ""}, {"code": "DVDC", "name": "Delite Cinema: Asaf Ali Road", "subRegion": ""}, {"code": "PCSN", "name": "PVR: Pacific, Subhash Nagar, Delhi", "subRegion": ""}, {"code": "PCEL", "name": "PVR: Cinemagic, Unity One Elegante, NSP, Pitampura", "subRegion": ""}, {"code": "SPIA", "name": "Cinepolis: Modi Mall (Formerly Spice Mall)", "subRegion": ""}, {"code": "PGGM", "name": "HDFC Millennia PVR: MGF, Gurugram", "subRegion": ""}, {"code": "MXGN", "name": "MovieMax Laserplex: Gulshan One 29 Mall, Noida", "subRegion": ""}, {"code": "LBDL", "name": "Liberty Cinema: Karol Bagh", "subRegion": ""}, {"code": "SCJN", "name": "INOX: Janak Place", "subRegion": ""}, {"code": "FNLN", "name": "Cinepolis: V3S Mall, Laxmi Nagar", "subRegion": ""}, {"code": "PMMS", "name": "PVR: Shalimar Bagh", "subRegion": ""}, {"code": "CRGM", "name": "Cinepolis: Airia Mall, Sohna Road, Gurgaon", "subRegion": ""}, {"code": "CNEV", "name": "1 Cinemas: Spectrum Metro Mall, Noida", "subRegion": ""}, {"code": "PPDA", "name": "PVR: Pacific, Dwarka", "subRegion": ""}, {"code": "PVKS", "name": "PVR: Anupam Saket, Delhi", "subRegion": ""}, {"code": "PBLL", "name": "PVR: Pebble Downtown Sec-12, Faridabad", "subRegion": ""}, {"code": "WVRN", "name": "Wave Cinemas: Gaur Central Mall, RDC", "subRegion": ""}, {"code": "M2PP", "name": "M2K: Pitampura", "subRegion": ""}, {"code": "SCPT", "name": "INOX: Patel Nagar", "subRegion": ""}, {"code": "M2RH", "name": "M2K: Rohini", "subRegion": ""}, {"code": "CPUM", "name": "Cinepolis: Unity One Mall Rohini, Delhi", "subRegion": ""}, {"code": "SCND", "name": "INOX: Nehru Place", "subRegion": ""}, {"code": "INWM", "name": "INOX: World Mark, Gurugram", "subRegion": ""}, {"code": "PPMF", "name": "PVR: Pacific Mall (The Mall of Faridabad NIT)", "subRegion": ""}, {"code": "FNSD", "name": "Cinepolis: Cross River Mall, Shahdara", "subRegion": ""}, {"code": "WVND", "name": "Wave: Noida", "subRegion": ""}, {"code": "CUNT", "name": "Cinepolis: City Centre Dwarka,Delhi (Newly Opened)", "subRegion": ""}, {"code": "ISMG", "name": "INOX: Shipra Mall, Ghaziabad", "subRegion": ""}, {"code": "CPGV", "name": "Cinepolis: Grand Venice Mall, Greater Noida", "subRegion": ""}, {"code": "IOMG", "name": "INOX: Omaxe Connaught Place Mall, Greater Noida", "subRegion": ""}, {"code": "IAJS", "name": "INOX: AIPL Joy Street, Gurgaon", "subRegion": ""}, {"code": "MCTI", "name": "Miraj Cinemas: TGIP, Noida", "subRegion": ""}, {"code": "EMPS", "name": "PVR: Elan Miracle, Sec 84, Gurugram", "subRegion": ""}, {"code": "CTEE", "name": "Cinepolis: The Esplanade, Gurugram", "subRegion": ""}, {"code": "CEST", "name": "Cinepolis: V3S East Centre (New)", "subRegion": ""}, {"code": "PECD", "name": "PVR: ECX Chanakyapuri, Delhi", "subRegion": ""}, {"code": "CIJA", "name": "Cinepolis: Janak Cinema, New Delhi", "subRegion": ""}, {"code": "WVRG", "name": "Wave: Raja Garden", "subRegion": ""}, {"code": "CPMF", "name": "Cinepolis: Pacific Mall, Faridabad", "subRegion": ""}, {"code": "MHNU", "name": "PVR: Mahagun, Ghaziabad", "subRegion": ""}, {"code": "PVPU", "name": "PVR IMAX with Laser, Priya: Delhi", "subRegion": ""}, {"code": "PDIV", "name": "PVR: Vikaspuri, Delhi", "subRegion": ""}, {"code": "DPDC", "name": "Delhi: PVR Director`s Cut, Ambience Mall", "subRegion": ""}, {"code": "WVKS", "name": "Wave: The Wave Mall, Kaushambi", "subRegion": ""}, {"code": "INFR", "name": "INOX: Crown Interiorz Mall, Delhi Mathura Road", "subRegion": ""}, {"code": "NYCG", "name": "Devgn CineX: Elan Epic, Gurugram", "subRegion": ""}, {"code": "USCO", "name": "US CINEMAS: Aditya Mall, Indirapuram", "subRegion": ""}, {"code": "MTPP", "name": "Movietime Cinemas: Pitampura", "subRegion": ""}, {"code": "USCG", "name": "US CINEMAS: Eros Mall, Indirapuram", "subRegion": ""}, {"code": "MDDC", "name": "Miraj Cinemas: Vikas Cinemall, Shahdara", "subRegion": ""}, {"code": "BCWG", "name": "B18 Cinemas (Bhutani Cineplex) City Center GZB", "subRegion": ""}, {"code": "IOCP", "name": "INOX: Odeon, Connaught Place", "subRegion": ""}, {"code": "WUPG", "name": "Wave: Urbana Premium, Sector 67 Gurugram", "subRegion": ""}, {"code": "RONC", "name": "Rajhans Cinemas:Galaxy Diamond Plaza,Greater Noida", "subRegion": ""}, {"code": "IOTG", "name": "PVR: Opulent, Ghaziabad", "subRegion": ""}, {"code": "PVPD", "name": "PVR: Prashant Vihar, Delhi", "subRegion": ""}, {"code": "PNAD", "name": "PVR: Naraina, Delhi", "subRegion": ""}, {"code": "DCMV", "name": "PVR Directors Cut, DLF Mall Of India: Noida", "subRegion": ""}, {"code": "MCVM", "name": "Miraj Cinemas: Chand, Mayur Vihar Phase 1", "subRegion": ""}, {"code": "NYDU", "name": "Devgn CineX: Ghaziabad", "subRegion": ""}, {"code": "EDMP", "name": "PVR: EDM, Ghaziabad", "subRegion": ""}, {"code": "RRJM", "name": "RR Cinema: Jaipuria Mall, Indirapuram", "subRegion": ""}, {"code": "GPDC", "name": "Gurugram: PVR Director`s Cut, Ambience Mall", "subRegion": ""}, {"code": "MMAP", "name": "MovieMax: Ansal Plaza, Gurgaon", "subRegion": ""}, {"code": "VVGZ", "name": "PVR: VVIP, Ghaziabad", "subRegion": ""}, {"code": "AMCD", "name": "Amba Cinema: Delhi 4K Laser Projector Dolby Atmos", "subRegion": ""}, {"code": "PCCF", "name": "Pristine Mall: Sec-31, Faridabad", "subRegion": ""}, {"code": "IEFM", "name": "INOX: EF3 Mall, Faridabad", "subRegion": ""}, {"code": "CNVG", "name": "Cinepolis: Grand View High Street, Gurugram", "subRegion": ""}, {"code": "CCPZ", "name": "PVR: City Centre, Gurgaon", "subRegion": ""}, {"code": "PMTN", "name": "PVR: Midtown, Moti Nagar, Delhi", "subRegion": ""}, {"code": "IZOP", "name": "INOX: COCA-COLA IMAX Paras, Nehru Place, Delhi", "subRegion": ""}, {"code": "MCEF", "name": "Miraj Cinemas: Eldeco mall, Faridabad", "subRegion": ""}, {"code": "INRD", "name": "INOX: RCube, Monad Mall: Delhi", "subRegion": ""}, {"code": "PMGU", "name": "PVR: Mega Mall, Gurgaon", "subRegion": ""}, {"code": "WATG", "name": "Wave Cinema: iThum Galleria Mall, Greater Noida", "subRegion": ""}, {"code": "INSG", "name": "INOX Sapphire 90 Mall: Gurugram", "subRegion": ""}, {"code": "RNMT", "name": "MSX Silvercity, Haldiram Citymall Sec12: Faridabad", "subRegion": ""}, {"code": "PSDD", "name": "PVR: Sangam, Delhi", "subRegion": ""}, {"code": "MCAZ", "name": "Miraj Cinemas: Aakash, Azadpur", "subRegion": ""}, {"code": "MCDE", "name": "Miraj Cinemas: Ivory Tower, Subhash Nagar", "subRegion": ""}, {"code": "LSCM", "name": "Legend Cinema Lounges: Mall Fifty One, Gurgaon", "subRegion": ""}, {"code": "PETA", "name": "PVR: Elan Town Centre, Sec 67, Gurugram", "subRegion": ""}, {"code": "MERM", "name": "MovieMax Edition (Luxe): Rcube Monad Mall, Noida", "subRegion": ""}, {"code": "MIMU", "name": "Miraj Cinemas: M4U, Sahibabad", "subRegion": ""}, {"code": "PVMS", "name": "PVR: Elan Mercado, Sec 80, Gurugram", "subRegion": ""}, {"code": "MTND", "name": "Movietime Cinemas: Sector 18, Noida", "subRegion": ""}, {"code": "SLCU", "name": "Skylit Cinemas: Sahara Mall, Gurugram (Gurgaon)", "subRegion": ""}, {"code": "PCPL", "name": "PVR: Plaza-CP, Delhi", "subRegion": ""}, {"code": "RCGD", "name": "ROONGTA CINEMAS: SHOPPRIX Mall, Ghaziabad", "subRegion": ""}, {"code": "MDCD", "name": "Madhuban Cinema: Dasna", "subRegion": ""}, {"code": "MENL", "name": "Meenakshi Multiplex Cinema: Loni", "subRegion": ""}, {"code": "IDEN", "name": "INOX: Insignia At Epicuria, Nehru Place", "subRegion": ""}, {"code": "IBYG", "name": "INOX: IRIS Broadway Gurugram", "subRegion": ""}, {"code": "ISML", "name": "INOX: Gurgaon Sapphire 83", "subRegion": ""}, {"code": "ATSM", "name": "Miraj Cinemas: ATS Khyber Range Mall, Ghaziabad", "subRegion": ""}, {"code": "MJMM", "name": "Miraj Maximum: Metropollis Mall, Gurgaon", "subRegion": ""}, {"code": "PFDN", "name": "PVR: DLF Summit Plaza, Gurugram", "subRegion": ""}, {"code": "IGAM", "name": "INOX: Ardee Mall, Gurugram", "subRegion": ""}, {"code": "PDEI", "name": "PVR: 3CS Lajpat Nagar, Delhi", "subRegion": ""}, {"code": "MCIX", "name": "Miraj Cinemas: India Expo Plaza (Newly Opened)", "subRegion": ""}, {"code": "ONEG", "name": "1 Cinema Powered by Mukta A2, Star Mall: Gurugram", "subRegion": ""}, {"code": "GRNG", "name": "Grand Cinemaz@Choudhry Mall", "subRegion": ""}, {"code": "GMGX", "name": "Galaxie Multiplex: Ghaziabad", "subRegion": ""}, {"code": "MKLJ", "name": "Miraj Cinemas: KLJ Square, Gurugram", "subRegion": ""}, {"code": "GAGC", "name": "Gagan Theatre: Nand Nagri, Delhi", "subRegion": ""}, {"code": "PMPM", "name": "Fun Cinemas: PM Cinemas, Parsvnath Mall, Manhattan", "subRegion": ""}, {"code": "MCGN", "name": "Movietime Cinemas: Celebration Mall, Gurgaon", "subRegion": ""}, {"code": "QLAC", "name": "QLA Cinemas: Dremz Mall, Gurugram", "subRegion": ""}, {"code": "MXCS", "name": "MSX Cinemas: Greater Noida", "subRegion": ""}, {"code": "HVCD", "name": "Cineport Cinemas: SVH Metro Street, Sector 83", "subRegion": ""}, {"code": "RRCO", "name": "RR Cinema: Omaxe Gurgaon Mall, Gurgaon", "subRegion": ""}, {"code": "RVCV", "name": "Rajhans Cinemas: Ocus Medley, Sec-99, Gurugram", "subRegion": ""}, {"code": "CIGK", "name": "Cinepolis: Savitri Complex GK2", "subRegion": ""}, {"code": "STWA", "name": "Satyam VS Cinema: Pilkhuwa", "subRegion": ""}, {"code": "SCGZ", "name": "Silvercity Multiplex: Ghaziabad", "subRegion": ""}, {"code": "MTCV", "name": "Movietime Cinema: VSR 114 Avenue Sec 114 Gurgaon", "subRegion": ""}, {"code": "MWMG", "name": "Moviemax: Sector 56, Metro World Mall, Gurugram", "subRegion": ""}, {"code": "BTFD", "name": "Batra Reels Cinemas: New Friends Colony", "subRegion": ""}, {"code": "MMZG", "name": "MovieMax: Pacific Mall Ghaziabad", "subRegion": ""}, {"code": "MWSS", "name": "US Cinemas, Movie World, Ghaziabad (All New)", "subRegion": ""}, {"code": "VBOR", "name": "Vibhor Chitralok: Pilkhuwa", "subRegion": ""}, {"code": "MMOC", "name": "Movie Magic Cinema: Ghaziabad", "subRegion": ""}, {"code": "AKRF", "name": "AKR Cinemas: SLF Mall, Faridabad", "subRegion": ""}, {"code": "AKRC", "name": "AKR Cinemas,TDI Mall: Kundli", "subRegion": ""}, {"code": "MIDA", "name": "7D Masti: The Grand Venice Mall, Greater Noida", "subRegion": ""}, {"code": "MAGX", "name": "7D Masti: Shipra Mall, Ghaziabad", "subRegion": ""}, {"code": "MEDM", "name": "7D Masti: EDM Mall, Ghaziabad", "subRegion": ""}, {"code": "EEBC", "name": "eBox Cinema: Ansal Plaza Mall, Greater Noida", "subRegion": ""}, {"code": "EBCA", "name": "eBox Cinema: Parker Mall, Kundli", "subRegion": ""}, {"code": "SCUR", "name": "eBox Cinema: Sonic World Mall, Surajpur", "subRegion": ""}], "MUMBAI": [{"code": "CSWO", "name": "Cinepolis: Nexus Seawoods, Nerul, Navi Mumbai", "subRegion": ""}, {"code": "IMOB", "name": "INOX Megaplex: Sky City Mall, Borivali", "subRegion": ""}, {"code": "CPVM", "name": "Cinepolis: Lake Shore, Thane (EX Viviana Mall)", "subRegion": ""}, {"code": "FMMA", "name": "INOX: Megaplex, Inorbit Mall, Malad", "subRegion": ""}, {"code": "INRC", "name": "INOX: R-City, Ghatkopar", "subRegion": ""}, {"code": "PIPP", "name": "PVR ICON: Phoenix Palladium, Lower Parel Mumbai", "subRegion": ""}, {"code": "POVI", "name": "HDFC Millennia PVR ICON: Oberoi Mall, Goregaon (E)", "subRegion": ""}, {"code": "BMXC", "name": "BMX Cinemas(BalajiMovieplex): Littleworld Kharghar", "subRegion": ""}, {"code": "PCMM", "name": "PVR: The Capital Mall, Nalasopara (E)", "subRegion": ""}, {"code": "PMKM", "name": "PVR: Market City, Kurla (Premiere)", "subRegion": ""}, {"code": "IMCM", "name": "Metro INOX Cinemas: Marine Lines", "subRegion": ""}, {"code": "MCIW", "name": "Miraj Cinemas: IMAX, Wadala", "subRegion": ""}, {"code": "POPE", "name": "PVR: Orion Mall, Panvel", "subRegion": ""}, {"code": "PVAE", "name": "PVR:C&B Square Chakala Andheri E(Formerly Sangam)", "subRegion": ""}, {"code": "MXBY", "name": "Maxus Cinemas: Bhayander", "subRegion": ""}, {"code": "MTHB", "name": "MOVIETIME: HUB, Goregaon (E)", "subRegion": ""}, {"code": "FMKY", "name": "INOX:Metro Mall Junction,Kalyan(Newly Renovated)", "subRegion": ""}, {"code": "KKMB", "name": "BMX Cinemas (Balaji Movieplex): Koparkhairane", "subRegion": ""}, {"code": "PLXP", "name": "PVR: Lodha Xperia, Palava", "subRegion": ""}, {"code": "CAGL", "name": "Cinepolis: Aurum, Ghansoli, Navi Mumbai", "subRegion": ""}, {"code": "PDDV", "name": "PVR: Dynamix, Juhu", "subRegion": ""}, {"code": "PRCW", "name": "PVR ICON: Infiniti Andheri (W)", "subRegion": ""}, {"code": "CPNM", "name": "Cinepolis: Magnet Mall, Bhandup (W)", "subRegion": ""}, {"code": "MIFU", "name": "Funcity Big Cinema:UNR (OPEN 4 NEW RECLINER SCRNS)", "subRegion": ""}, {"code": "PVMI", "name": "PVR: Infiniti, Malad Mumbai", "subRegion": ""}, {"code": "STER", "name": "Sterling Cineplex: Fort", "subRegion": ""}, {"code": "MCRM", "name": "Miraj Cinemas: R Mall, Mulund", "subRegion": ""}, {"code": "FMDA", "name": "INOX: Thakur Mall, Dahisar", "subRegion": ""}, {"code": "MTCR", "name": "MOVIETIME Cubic Mall: Chembur", "subRegion": ""}, {"code": "INKO", "name": "INOX: Korum Mall, Eastern Express Highway, Thane", "subRegion": ""}, {"code": "MCFF", "name": "Miraj Cinemas: Funfiesta, Nalasopara (W)", "subRegion": ""}, {"code": "PITI", "name": "PVR: Citi Mall, Andheri (W)", "subRegion": ""}, {"code": "IPBG", "name": "INOX: Palm Beach Galleria Mall, Navi Mumbai", "subRegion": ""}, {"code": "MMHA", "name": "MovieMax: Huma, Kanjurmarg (Seats Renovated)", "subRegion": ""}, {"code": "POLM", "name": "PVR: Odeon Mall, Ghatkopar", "subRegion": ""}, {"code": "PVWJ", "name": "Maison PVR: Jio World Drive, Mumbai", "subRegion": ""}, {"code": "FNAN", "name": "Cinepolis: Fun Republic Mall, Andheri (W)", "subRegion": ""}, {"code": "DCTW", "name": "Devgn CineX: The Walk, Thane", "subRegion": ""}, {"code": "FMRL", "name": "INOX: Raghuleela Mall, Kandivali (W)", "subRegion": ""}, {"code": "IMJW", "name": "Maison INOX: Jio World Plaza, BKC", "subRegion": ""}, {"code": "THAB", "name": "Cinepolis: High Street Mall, Thane (EX Cinemastar)", "subRegion": ""}, {"code": "MXBO", "name": "Maxus Cinemas: Borivali (W)", "subRegion": ""}, {"code": "SMFV", "name": "MovieMax: SM5 Kalyan, Newly Renovated", "subRegion": ""}, {"code": "MMMR", "name": "MovieMax: Mira Road (Seats Renovated)", "subRegion": ""}, {"code": "MDVA", "name": "Miraj Cinemas: Dattani Mall, Vasai (W)", "subRegion": ""}, {"code": "FNCM", "name": "Fun Cinemas: K Star Mall, Chembur", "subRegion": ""}, {"code": "INNP", "name": "INOX Laserplex: CR2, Nariman Point", "subRegion": ""}, {"code": "BMXA", "name": "BMX Cinemas: Ambernath (New)", "subRegion": ""}, {"code": "MMET", "name": "MovieMax: Eternity Mall, Thane (Newly Renovated)", "subRegion": ""}, {"code": "HPVR", "name": "PVR: Haseen, Bhiwandi", "subRegion": ""}, {"code": "MIDO", "name": "Miraj Cinemas: Dombivali (E)", "subRegion": ""}, {"code": "MMWM", "name": "MovieMax: Wonder Mall, Thane", "subRegion": ""}, {"code": "MUCK", "name": "Mukta A2 Cinemas: Triveni Grande, Kalyan (West)", "subRegion": ""}, {"code": "MMSZ", "name": "MovieMax: Sion", "subRegion": ""}, {"code": "PLUS", "name": "PVR: Lido, Juhu Mumbai", "subRegion": ""}, {"code": "CTRR", "name": "Chitra Cinema: Dadar (Newly Renovated)", "subRegion": ""}, {"code": "AETE", "name": "Anand Cinema: Thane", "subRegion": ""}, {"code": "MCTG", "name": "Topiwala Mukta A2 Cinemas, Goregaon", "subRegion": ""}, {"code": "EMNC", "name": "EROS INOX IMAX Cinema: Churchgate", "subRegion": ""}, {"code": "MAJB", "name": "Mukta A2 Cinemas: Jai Hind, Lalbaugh", "subRegion": ""}, {"code": "MACE", "name": "Miraj Cinemas: Anupam Mall Goregaon (E)", "subRegion": ""}, {"code": "MCAA", "name": "Miraj Cinemas: Ashok Anil Multiplex, Ulhasnagar", "subRegion": ""}, {"code": "MTMA", "name": "MOVIETIME: MALAD (WEST)", "subRegion": ""}, {"code": "CPVV", "name": "Cinepolis: VIP Lake Shore, Thane (EX Viviana Mall)", "subRegion": ""}, {"code": "PMPK", "name": "PVR: Milap, Kandivali (W)", "subRegion": ""}, {"code": "MCNE", "name": "Mukta A2 Cinemas: New Excelsior, Fort", "subRegion": ""}, {"code": "AAAS", "name": "Ajanta Cinema Cinex: Borivali (W) Newly Renovated", "subRegion": ""}, {"code": "RCHG", "name": "Rajhans Cinemas: Helix 3, Ghatkopar (W)", "subRegion": ""}, {"code": "MXSN", "name": "Maxus Cinemas: Saki Naka", "subRegion": ""}, {"code": "GCMG", "name": "Gold Cinema: Malad Malvani", "subRegion": ""}, {"code": "RSMI", "name": "Rassaz Multiplex: Mira Road", "subRegion": ""}, {"code": "GOCS", "name": "Gold Cinema: Santacruz (W)", "subRegion": ""}, {"code": "MTSC", "name": "MOVIETIME Star City: Matunga (W)", "subRegion": ""}, {"code": "WAML", "name": "INOX: Insignia at Atria Mall, Worli", "subRegion": ""}, {"code": "FMDR", "name": "INOX: Nakshatra Mall, Dadar (W) (Newly Renovated)", "subRegion": ""}, {"code": "LEPV", "name": "PVR: Le Reve-Globus Mall, Bandra West, Mumbai", "subRegion": ""}, {"code": "CCMP", "name": "Miraj Cinemas: Cineraj, Panvel (Newly Renovated)", "subRegion": ""}, {"code": "TCDM", "name": "Tilak Cineplex (Pooja Newly Renovated): Dombivali", "subRegion": ""}, {"code": "IRGT", "name": "INOX: Insignia at R Mall, Thane", "subRegion": ""}, {"code": "MCAN", "name": "Miraj Cinemas: Star, Ambernath (Newly Renovated)", "subRegion": ""}, {"code": "MTGD", "name": "MOVIETIME: Dahisar (E)", "subRegion": ""}, {"code": "RGCM", "name": "Regal Cinema: Colaba", "subRegion": ""}, {"code": "OMCS", "name": "Mukta A2 Cinemas Orion: Santacruz", "subRegion": ""}, {"code": "PZCD", "name": "Plaza Cinema: Dadar", "subRegion": ""}, {"code": "KCMA", "name": "Kasturba Cinema (Newly Renovated): Malad", "subRegion": ""}, {"code": "MXCK", "name": "Maxus Cinemas: Kandivali (E) Newly Opened", "subRegion": ""}, {"code": "SNGL", "name": "Gold Cinema: Sona Borivali (E)", "subRegion": ""}, {"code": "MTSU", "name": "MOVIETIME Suburbia: Bandra (W)", "subRegion": ""}, {"code": "KTMV", "name": "KT Vision Cinema: Vasai (Screens)", "subRegion": ""}, {"code": "MMMC", "name": "Maratha Mandir", "subRegion": ""}, {"code": "GCDM", "name": "Gopi Cinema: Dombivali", "subRegion": ""}, {"code": "NYMD", "name": "Devgn Cinex: Mulund", "subRegion": ""}, {"code": "GDTH", "name": "Gold  Cinema: Shivaji Road, Thane (W)", "subRegion": ""}, {"code": "MMAA", "name": "MovieMax: Andheri (E)", "subRegion": ""}, {"code": "ONEB", "name": "1 Cinema by Mukta A2: Bharatmata (Newly Renovated)", "subRegion": ""}, {"code": "CNTX", "name": "ICONIX CINEMAS: (OLD AARADHANA TALKIES) THANE", "subRegion": ""}, {"code": "FQSA", "name": "Fun Square Cinema: Sanpada", "subRegion": ""}, {"code": "BRVP", "name": "Bahar Cinema: Vile Parle (E)", "subRegion": ""}, {"code": "KURL", "name": "Bharat Cineplex: Kurla (W)", "subRegion": ""}, {"code": "KMMV", "name": "K Movie Star Multiplex: Vasai (W)", "subRegion": ""}, {"code": "KKUI", "name": "KT Vision Cinema: Vasai(Screen 1)", "subRegion": ""}, {"code": "PJDW", "name": "Maison PVR: Jio World Drive-IN, Mumbai", "subRegion": ""}, {"code": "MMCV", "name": "Movie Max V Cinema: Virar (E)", "subRegion": ""}, {"code": "NHCG", "name": "Nishat Cinema: Grant Road", "subRegion": ""}, {"code": "NNNX", "name": "Nazrana Cinema: Bhiwandi", "subRegion": ""}, {"code": "VVVM", "name": "Vaishali Cinema: Badlapur", "subRegion": ""}, {"code": "VECU", "name": "Venus Cinema: Ulhasnagar", "subRegion": ""}, {"code": "WCVR", "name": "Woodland Cinemas: Virar (W)", "subRegion": ""}], "BANG": [{"code": "IMMO", "name": "INOX: Megaplex Mall of Asia Bangalore", "subRegion": ""}, {"code": "PVFF", "name": "PVR: Nexus (Formerly Forum), Koramangala", "subRegion": ""}, {"code": "PSPR", "name": "PVR: Superplex Forum Mall, Kanakapura Road", "subRegion": ""}, {"code": "PVOO", "name": "PVR: Orion Mall, Dr Rajkumar Road", "subRegion": ""}, {"code": "CFBS", "name": "Cinepolis: Nexus Shantiniketan, Bengaluru", "subRegion": ""}, {"code": "PVER", "name": "PVR: Vega City, Bannerghatta Road", "subRegion": ""}, {"code": "IMCB", "name": "INOX: M5 Ecity, Bengaluru", "subRegion": ""}, {"code": "ACKB", "name": "AMB Cinemas Kapali", "subRegion": ""}, {"code": "PVWW", "name": "PVR: VR Bengaluru, Whitefield Road", "subRegion": ""}, {"code": "CEHR", "name": "Cinephile HSR Layout: PNR Felicity Mall Haralur Rd", "subRegion": ""}, {"code": "PBMM", "name": "PVR: Bhartiya Mall of Bengaluru", "subRegion": ""}, {"code": "PPNX", "name": "PVR: Phoenix Marketcity Mall, Whitefield Road", "subRegion": ""}, {"code": "CLGM", "name": "Cinepolis: Lulu Mall, Bengaluru", "subRegion": ""}, {"code": "INRZ", "name": "INOX: Galleria Mall, Yelahanka", "subRegion": ""}, {"code": "CNRM", "name": "Cinepolis: Royal Meenakshi Mall", "subRegion": ""}, {"code": "PSLC", "name": "PVR: Soul Spirit Central Mall, Bellandur", "subRegion": ""}, {"code": "CPOE", "name": "Cinepolis: Orion Avenue Mall, Banaswadi", "subRegion": ""}, {"code": "INMB", "name": "INOX: Mantri Square, Malleshwaram", "subRegion": ""}, {"code": "PMSR", "name": "PVR: MSR Elements Mall, Tanisandhra Main Road", "subRegion": ""}, {"code": "PGFD", "name": "PVR: Global Mall, Mysore Road, Bengaluru", "subRegion": ""}, {"code": "SATB", "name": "Sandhya Cinema", "subRegion": ""}, {"code": "GPGM", "name": "Gopalan Grand Mall: Old Madras Road", "subRegion": ""}, {"code": "CPJR", "name": "Cinepolis: SJR (Central Mall) Arekere, Bannergatta", "subRegion": ""}, {"code": "PMBR", "name": "PVR: Orion Uptown, Old Madras Road, Bengaluru", "subRegion": ""}, {"code": "FMFB", "name": "INOX: Nexus, Whitefield", "subRegion": ""}, {"code": "SKMM", "name": "Sri Krishna Lazer Projection 4K: Bomanahalli", "subRegion": ""}, {"code": "MSMD", "name": "MIRAJ CINEMAS: TGN Lotus Elite, Sunkadakatte", "subRegion": ""}, {"code": "FMLB", "name": "INOX Lido: Off MG Road, Ulsoor", "subRegion": ""}, {"code": "PZVK", "name": "PVR: Vaishnavi Sapphire Mall, Yeshwanthpur", "subRegion": ""}, {"code": "VTGB", "name": "V Cinema (Vijayalakshmi Theatre): Garudacharpalya", "subRegion": ""}, {"code": "TDCA", "name": "Sri Thirumala 4K A/C Dolby Atmos: Agara", "subRegion": ""}, {"code": "LKTH", "name": "Lakshmi Cinema 4K Dolby Atmos RGB Laser Tavarekere", "subRegion": ""}, {"code": "PGWB", "name": "PVR: GT World Mall, Magadi Road", "subRegion": ""}, {"code": "BKDV", "name": "Brundha RGB Laser 4K Projection: Hongasandra DMart", "subRegion": ""}, {"code": "INBC", "name": "INOX: Central, JP Nagar, Mantri Junction", "subRegion": ""}, {"code": "PAAS", "name": "PVR: Aura Park Square, Whitefield", "subRegion": ""}, {"code": "SLTR", "name": "Sri Lakshmi A/C 4K Projection: Rammurthy Nagar", "subRegion": ""}, {"code": "SVTB", "name": "Venkateshwara A/c 4K Dolby Atmos: K.R.Puram", "subRegion": ""}, {"code": "INBG", "name": "INOX: Garuda Mall, Magrath Road", "subRegion": ""}, {"code": "GYBU", "name": "INOX: Garuda Yelahanka, Bengaluru", "subRegion": ""}, {"code": "NSBR", "name": "INOX:SBR Horizon, Seegehalli Whitefield-Hoskote Rd", "subRegion": ""}, {"code": "CPEB", "name": "Cinepolis: Binnypet Mall", "subRegion": ""}, {"code": "GPBR", "name": "Gopalan Cinemas: Bannerghatta Road", "subRegion": ""}, {"code": "VCTP", "name": "V Cinemas: T.C Palya Main Road, Ramamurthy Nagar", "subRegion": ""}, {"code": "VNKA", "name": "Venkateshwara Theatre - Konappana Agrahara (E.City", "subRegion": ""}, {"code": "SSNR", "name": "Swagath ShankarNag (ONYX) LED Cinema: MG Road", "subRegion": ""}, {"code": "KINO", "name": "Kino Cinemas: Seegehalli Kadugodi, Bengaluru", "subRegion": ""}, {"code": "MKBG", "name": "Mukunda 4K Dolby Atmos: M.S.Nagar", "subRegion": ""}, {"code": "GPAM", "name": "Gopalan Cinemas: Arcade Mall, Mysore Road", "subRegion": ""}, {"code": "PMMC", "name": "Movietime Cinemas: YGR Signature Mall, RR Nagar", "subRegion": ""}, {"code": "VTBR", "name": "Sri Venkateshwara Digital 4K Cinema: Girinagar", "subRegion": ""}, {"code": "RKCL", "name": "Rockline Cinemas: Jalahalli Cross", "subRegion": ""}, {"code": "INBJ", "name": "INOX: Garuda Swagath Mall, Jayanagar", "subRegion": ""}, {"code": "BALT", "name": "Balaji Theatre:Tavarekere(Next to Lakshmi Theatre)", "subRegion": ""}, {"code": "VRBL", "name": "Veeresh Cinemas: Magadi Road", "subRegion": ""}, {"code": "PTBK", "name": "Pushpanjali B N Pura: A/C 2K Dolby 7.1", "subRegion": ""}, {"code": "PDWR", "name": "PVR: Directors Cut, Forum Rex Walk Bengaluru", "subRegion": ""}, {"code": "VTSK", "name": "Vaibhav Digital 4k Dolby 7.1: Sanjaynagar", "subRegion": ""}, {"code": "SDJH", "name": "Sri Vinayaka 2K Digital 7.1 D J Halli", "subRegion": ""}, {"code": "ANBL", "name": "AANJANA Chitrra Mandira 4K A/C: Magadi Road", "subRegion": ""}, {"code": "SDCS", "name": "Srinivasa Cinema 4K Dolby Atmos SG Palya:Screen1", "subRegion": ""}, {"code": "MRGB", "name": "Manasa RGB Laser ATMOS: Konanakunte", "subRegion": ""}, {"code": "VOIB", "name": "Vaishnavi and Vaibhavi Cinema: Uttarahalli", "subRegion": ""}, {"code": "SAMP", "name": "Sampige Digital 2k Cinema: Malleshwaram", "subRegion": ""}, {"code": "GPMY", "name": "Gopalan Mall: Sirsi Circle", "subRegion": ""}, {"code": "AMNH", "name": "INOX: Arcadia, Brigade Utopia, Bengaluru", "subRegion": ""}, {"code": "NRBL", "name": "Navrang Theatre: Rajaji Nagar", "subRegion": ""}, {"code": "SDSD", "name": "Siddeshwara 4K Dolby Atmos 3D 7.1 Cinema: JP Nagar", "subRegion": ""}, {"code": "GPSM", "name": "Gopalan Miniplex: Signature Mall, Old Madras Road", "subRegion": ""}, {"code": "RKTB", "name": "Sri Radhakrishna Theatre, 4K Dolby Atmos: RT Nagar", "subRegion": ""}, {"code": "BHAC", "name": "Bharathi Theatre (Peenya) A/C 4K 7.1 Dolby Digital", "subRegion": ""}, {"code": "SBCR", "name": "Sri Balaji 4K A/C Dolby Atmos: Dommasandra", "subRegion": ""}, {"code": "ROON", "name": "Roopa Cinema 4K Dolby Atmos 3D A/C: Nelamangala", "subRegion": ""}, {"code": "ASTB", "name": "Ashoka Cinemas - Dolby Laser: Chikkabanavara", "subRegion": ""}, {"code": "RTHT", "name": "Sri Raghavendra Cinemas: Hoskote", "subRegion": ""}, {"code": "VTBE", "name": "Sri Vajreshwari Cinemas AC 4K Dolby ATMOS: Ullal", "subRegion": ""}, {"code": "PDRD", "name": "Prasanna Digital 4K Cinema: Magadi Road", "subRegion": ""}, {"code": "KCBI", "name": "Kamakya 4K Dolby Atmos 3D A/C Cinema: Banashankari", "subRegion": ""}, {"code": "PTBC", "name": "Swagath Poornima 4K Dolby Atmos: JC Road (New)", "subRegion": ""}, {"code": "RATK", "name": "Robin Theater 4K Dolby Atmos: Kengeri Upanagara", "subRegion": ""}, {"code": "SLTB", "name": "Sri Lakshmi A/C 4k Dolby 7.1: Gottigere", "subRegion": ""}, {"code": "SAED", "name": "Srinivasa Theater A/C 4K Dolby Atmos: Kadugudi", "subRegion": ""}, {"code": "MDKI", "name": "Mahadeshwara Cinema 4K Dolby ATMOS AC Banashankari", "subRegion": ""}, {"code": "CVLG", "name": "Cinepolis VIP: Lulu Mall, Bengaluru", "subRegion": ""}, {"code": "SRPJ", "name": "Sri Renuka Prasanna Theatre: J P Nagar", "subRegion": ""}, {"code": "AMRT", "name": "Amruth Digital 2K A/C Cinema: Lingarajapuram", "subRegion": ""}, {"code": "PDYA", "name": "Pushpanjali Sultanpalya:AC 2K LASER 3D Dolby Atmos", "subRegion": ""}, {"code": "SVYK", "name": "Sri Vinayaka Cinemas 4K Dolby 7.1 (A/C): Varthur", "subRegion": ""}, {"code": "SMRN", "name": "Maruthi Cinemas 4K AC Dolby 7.1: RajgopalNagar", "subRegion": ""}, {"code": "MLDT", "name": "Mohan Cinema Barco 4K A/C 7.1: Sunkadakatte", "subRegion": ""}, {"code": "VBWT", "name": "Veerabhadreshwara Theatre 4KDOLBY 7.1 Kamala Nagar", "subRegion": ""}, {"code": "SIDA", "name": "Siddalingeshwara A/C 4K 3D Dolby Digital:J.P.Nagar", "subRegion": ""}, {"code": "GDTY", "name": "Goverdhan Theatre: Yeshwantpur", "subRegion": ""}, {"code": "VCCB", "name": "Victory Cinema Barco-4K RGB-Laser: Kamakshipalya", "subRegion": ""}, {"code": "GDAK", "name": "Gowrishankar DOLBY 7.1 RGB Laser: Attibele", "subRegion": ""}, {"code": "VYCH", "name": "Vinayaka Cinemas 4K Dolby 11.5 A/C 3D: Harinagar", "subRegion": ""}, {"code": "STSV", "name": "Savitha Theatre:2K Dolby A/C Malleshwaram", "subRegion": ""}, {"code": "ARTS", "name": "Aruna Theatre A/C 4K 7.1 Dolby 3D: Srirampuram", "subRegion": ""}, {"code": "NFGD", "name": "Newfangled Miniplex (TWIN SEATED): MG Road", "subRegion": ""}, {"code": "SMHP", "name": "KRG Soundarya Mahal A/C 4K Dolby Doddaballapura", "subRegion": ""}, {"code": "SPAY", "name": "Srinivasa Cinema 4K Dolby Atmos SG Palya:Screen2", "subRegion": ""}, {"code": "TRIG", "name": "Triveni Theatre A/C 3D 4K Dolby: Gandhinagar", "subRegion": ""}, {"code": "SCPR", "name": "Sharada Cinemas A/C Laser Projector DTS Sound", "subRegion": ""}, {"code": "SSPA", "name": "Sri Srinivasa 4K Dolby Digital 7.1 Padmanabanagara", "subRegion": ""}, {"code": "ADCR", "name": "Akash Cinemas: Laggere", "subRegion": ""}, {"code": "PTYK", "name": "Prakash Theatre: Yelahanka", "subRegion": ""}, {"code": "RTEA", "name": "Ravi Digital 2K Dolby 7.1 HD Screen: Ejipura", "subRegion": ""}, {"code": "BDCG", "name": "Bhumika Digital 2K Cinema: Gandhinagar", "subRegion": ""}, {"code": "SKDD", "name": "Sapna 2K Dolby 5.1 Digital S R: Gandhi Nagar", "subRegion": ""}, {"code": "HASV", "name": "Sri Vinayaka Theatre: Harohalli", "subRegion": ""}, {"code": "CHTH", "name": "Chandrodaya Cinemas 4K Dolby A/C:Vidyapeeta Circle", "subRegion": ""}, {"code": "RKDO", "name": "Rajkamal Theatre 2K LASER Dolby 7.1:Doddaballapura", "subRegion": ""}, {"code": "STGR", "name": "Santosh 4K Dolby Theatre: Gandhinagar", "subRegion": ""}, {"code": "MUTB", "name": "Murali Cinemas(Gokula)4K Dolby7.1 A/C 3D:Mathikere", "subRegion": ""}, {"code": "DKTI", "name": "Deepak Talkies: Bidadi", "subRegion": ""}, {"code": "SRHK", "name": "Sri Rajmurali Theatre: Sahakar Nagar, Kodigehalli", "subRegion": ""}, {"code": "ATGN", "name": "Abhinay Theatre 4K A/C: Gandhinagar", "subRegion": ""}, {"code": "SNDC", "name": "Sri Narayan Theatre 4K lazer Atoms: Kolar", "subRegion": ""}, {"code": "SRRT", "name": "VR Cinemas 4K A/C 7.1 Dolby Atmos: Mallathalli", "subRegion": ""}, {"code": "SLND", "name": "SLN Theatre RGB Laser Projector: Hesaraghatta", "subRegion": ""}, {"code": "VACD", "name": "VaibhavCinemas RGBLaser4K Projection:Doddaballapur", "subRegion": ""}, {"code": "VDCS", "name": "Vainidhi Cinemas Dolby Lazer: Singapura", "subRegion": ""}, {"code": "GPTB", "name": "Galaxy Paradise (Miniplex): Begur Road", "subRegion": ""}, {"code": "ANTE", "name": "Anupama Theatre A/C 4K Dolby: Gandhinagar", "subRegion": ""}, {"code": "SNNN", "name": "Sri Nandeeshwara Theatre: Jigani", "subRegion": ""}, {"code": "GTYT", "name": "Ganesh Theatre: Yelahanka", "subRegion": ""}, {"code": "VECI", "name": "Venkateshwara Cinemas 2K, A/C Screen2: Gollarahati", "subRegion": ""}, {"code": "VECG", "name": "Venkateshwara Cinemas 4K, A/C Screen1: Gollarahati", "subRegion": ""}, {"code": "SVKT", "name": "Venkateshwara Digital 4K Dolby Atmos A/C: Kengeri", "subRegion": ""}, {"code": "SNGN", "name": "Narthaki 4K Dolby 7.1 Digital S R: Gandhi Nagar", "subRegion": ""}, {"code": "SKHK", "name": "Sri Lakshmi Narasimha Theatre: Anekal", "subRegion": ""}, {"code": "BALJ", "name": "Sri Balaji 2K Dolby Atmos 7.1: Viveknagar", "subRegion": ""}], "KANP": [{"code": "INZS", "name": "INOX: Z Square, Bada Chauraha", "subRegion": ""}, {"code": "RAVE", "name": "Rave 3 AV Cinemas", "subRegion": ""}, {"code": "RMIK", "name": "Rave Moti Cinemas", "subRegion": ""}, {"code": "PSXM", "name": "PVR: South X Mall, Kanpur", "subRegion": ""}, {"code": "PDDK", "name": "PVR: Deep, Kanpur", "subRegion": ""}, {"code": "NYCH", "name": "Devgn CineX: Heer Palace, Kanpur", "subRegion": ""}, {"code": "MCGP", "name": "Miraj Cinemas: Gurudev Pammi(Newly Renovated)", "subRegion": ""}, {"code": "SDPO", "name": "Shyam Palace Cinema", "subRegion": ""}, {"code": "MCRL", "name": "Movietime Cinemas: Ratan Elegance, Kanpur", "subRegion": ""}, {"code": "MHKT", "name": "Movietime Cinemas: Ratan Himachal Mall, Kanpur", "subRegion": ""}, {"code": "PCSK", "name": "PP Cinemall: Mandhana, Kanpur", "subRegion": ""}, {"code": "ANRR", "name": "Navrang Cineplex", "subRegion": ""}, {"code": "SAPK", "name": "Sapna Palace Cinema", "subRegion": ""}, {"code": "NCUK", "name": "Novelty Cinema", "subRegion": ""}, {"code": "GUCK", "name": "Gunjan Cinema", "subRegion": ""}, {"code": "DBSC", "name": "Delite Big Screen Cinema", "subRegion": ""}, {"code": "JUGA", "name": "Jugul Palace Cinema", "subRegion": ""}, {"code": "LALK", "name": "Lal Palace", "subRegion": ""}], "LUCK": [{"code": "PSLX", "name": "PVR: SUPERPLEX Lulu, Lucknow", "subRegion": ""}, {"code": "IPPL", "name": "INOX: Megaplex Phoenix Palassio Mall", "subRegion": ""}, {"code": "MMSG", "name": "MovieMax: Shalimar Gateway", "subRegion": ""}, {"code": "INEL", "name": "INOX: Megaplex Emerald, Lucknow", "subRegion": ""}, {"code": "COAC", "name": "Cinepolis: One Awadh Centre, Lucknow", "subRegion": ""}, {"code": "WVLK", "name": "Wave: The Wave Mall, Lucknow", "subRegion": ""}, {"code": "FNLK", "name": "Fun Cinemas: Fun Republic Mall, Lucknow", "subRegion": ""}, {"code": "PPXL", "name": "PVR: Phoenix, Lucknow", "subRegion": ""}, {"code": "ILCM", "name": "INOX: Crown Mall, Lucknow", "subRegion": ""}, {"code": "ILUM", "name": "INOX: Umrao Mall, Mahanagar", "subRegion": ""}, {"code": "PSML", "name": "PVR: Saharaganj Mall, Lucknow", "subRegion": ""}, {"code": "VINB", "name": "Vin Palace Multiplex Dolby Atmos: Vikas Nagar", "subRegion": ""}, {"code": "MSNL", "name": "Novelty Cinema: Dolby Atmos Laser 4K, Aliganj", "subRegion": ""}, {"code": "PCLA", "name": "Prominent Cinemas", "subRegion": ""}, {"code": "NCIL", "name": "Novelty MGS Cinemas Dolby Atmos: Lalbagh", "subRegion": ""}, {"code": "PRTB", "name": "Pratibha Cinema", "subRegion": ""}, {"code": "SALW", "name": "SRS Cinemas: City Mall, Lucknow", "subRegion": ""}, {"code": "PSUL", "name": "PVR: Sahu, Lucknow", "subRegion": ""}, {"code": "ADDC", "name": "Antas DD Cinemas", "subRegion": ""}, {"code": "UCTC", "name": "UVT Krishna Cinema", "subRegion": ""}, {"code": "SCLK", "name": "Shubham Cinema", "subRegion": ""}]};

const ALL_MOVIES_BY_CITY = {"MUMBAI": [{"code": "ET00444235", "title": "The Vvaan - Force of the Forrest"}, {"code": "ET00507738", "title": "Hanuman Ansh"}, {"code": "ET00506465", "title": "VIBE"}, {"code": "ET00436621", "title": "The Paradise (Telugu)"}, {"code": "ET00417686", "title": "Mirzapur: The Movie"}, {"code": "ET00504928", "title": "Heart of the Beast (English 3D)"}, {"code": "ET00514163", "title": "Avengers Endgame: Encore (English 2D)"}, {"code": "ET00498183", "title": "Resident Evil (English 3D)"}, {"code": "ET00514345", "title": "Primetime"}, {"code": "ET00505232", "title": "Jayanti 2"}, {"code": "ET00506305", "title": "Mitrata"}, {"code": "ET00464392", "title": "Daayra"}, {"code": "ET00518079", "title": "Bandkhor"}, {"code": "ET00518039", "title": "Dorothy"}, {"code": "ET00513462", "title": "Chatni"}, {"code": "ET00498770", "title": "Forgotten Island (Hindi 3D)"}, {"code": "ET00516813", "title": "Meesaya Murukku 2"}, {"code": "ET00516520", "title": "Tujhya Aaila"}, {"code": "ET00512696", "title": "Pradhama Drishtiya Kuttakkar"}, {"code": "ET00452034", "title": "The Odyssey"}, {"code": "ET00516853", "title": "Dhoomakethu"}, {"code": "ET00509404", "title": "Dahaan: The Evil Within"}, {"code": "ET00511400", "title": "The Magic Faraway Tree"}, {"code": "ET00502829", "title": "Bethlehem Kudumba Unit (Malayalam)"}, {"code": "ET00508081", "title": "Runner"}, {"code": "ET00442702", "title": "Mandaadi (Malayalam)"}, {"code": "ET00447840", "title": "Spider-Man: Brand New Day (2D)"}, {"code": "ET00000652", "title": "Dilwale Dulhania Le Jayenge"}, {"code": "ET00513554", "title": "Mahakavya Shri Ramayan Katha"}, {"code": "ET00515640", "title": "Devghar On Rent"}, {"code": "ET00516253", "title": "Aasha"}, {"code": "ET00488644", "title": "Love Lottery"}, {"code": "ET00517490", "title": "Om Ka Hari"}, {"code": "ET00506419", "title": "Fall 2: Deadpoint"}, {"code": "ET00517728", "title": "BTS World Tour Arirang in Buenos Aires: Live Viewing (Delayed)"}, {"code": "ET00517730", "title": "BTS World Tour Arirang in Sao Paulo: Live Viewing (Delayed)"}, {"code": "ET00500543", "title": "Mahaprabhu Jagannath"}, {"code": "ET00514653", "title": "Oye Chill Maar"}, {"code": "ET00502386", "title": "PAW Patrol: The Dino Movie"}, {"code": "ET00510578", "title": "Citylights"}, {"code": "ET00512660", "title": "Marham: Poetry & Music - Live on Stage"}, {"code": "ET00510575", "title": "Tony (2026)"}, {"code": "ET00489902", "title": "Village Rockstars 2"}, {"code": "ET00509388", "title": "Pidha Pachhi"}, {"code": "ET00510603", "title": "Psycho Ranga"}, {"code": "ET00465655", "title": "The Super Mario Galaxy Movie"}, {"code": "ET00516731", "title": "Avengers Endgame: Encore (English 3D)"}, {"code": "ET00516734", "title": "Avengers Endgame: Encore (English IMAX 2D)"}, {"code": "ET00517726", "title": "Avengers Endgame: Encore (Hindi 3D)"}, {"code": "ET00498186", "title": "Resident Evil (Hindi 3D)"}], "NCR": [{"code": "ET00444235", "title": "The Vvaan - Force of the Forrest"}, {"code": "ET00507738", "title": "Hanuman Ansh"}, {"code": "ET00417686", "title": "Mirzapur: The Movie"}, {"code": "ET00514163", "title": "Avengers Endgame: Encore (English 2D)"}, {"code": "ET00506465", "title": "VIBE"}, {"code": "ET00504928", "title": "Heart of the Beast (English 3D)"}, {"code": "ET00436621", "title": "The Paradise (Telugu)"}, {"code": "ET00498183", "title": "Resident Evil (English 3D)"}, {"code": "ET00514345", "title": "Primetime"}, {"code": "ET00464392", "title": "Daayra"}, {"code": "ET00516813", "title": "Meesaya Murukku 2"}, {"code": "ET00447840", "title": "Spider-Man: Brand New Day (2D)"}, {"code": "ET00518039", "title": "Dorothy"}, {"code": "ET00498770", "title": "Forgotten Island (Hindi 3D)"}, {"code": "ET00502829", "title": "Bethlehem Kudumba Unit (Malayalam)"}, {"code": "ET00452034", "title": "The Odyssey"}, {"code": "ET00488644", "title": "Love Lottery"}, {"code": "ET00502386", "title": "PAW Patrol: The Dino Movie"}, {"code": "ET00512696", "title": "Pradhama Drishtiya Kuttakkar"}, {"code": "ET00508081", "title": "Runner"}, {"code": "ET00514369", "title": "Saare Jagg Te Puwade Paaye Tutt Paini English Ne"}, {"code": "ET00513554", "title": "Mahakavya Shri Ramayan Katha"}, {"code": "ET00413205", "title": "Ramayana: The Legend of Prince Rama"}, {"code": "ET00459359", "title": "Colorful Stage! The Movie: A Miku Who Can't Sing"}, {"code": "ET00516853", "title": "Dhoomakethu"}, {"code": "ET00342811", "title": "The Place Promised in Our Early Days"}, {"code": "ET00510575", "title": "Tony (2026)"}, {"code": "ET00511400", "title": "The Magic Faraway Tree"}, {"code": "ET00513865", "title": "4 Rivers 6 Ranges Chushi Gangdruk"}, {"code": "ET00506419", "title": "Fall 2: Deadpoint"}, {"code": "ET00352085", "title": "Suzume"}, {"code": "ET00430496", "title": "My Hero Academia: You're Next"}, {"code": "ET00514653", "title": "Oye Chill Maar"}, {"code": "ET00517730", "title": "BTS World Tour Arirang in Sao Paulo: Live Viewing (Delayed)"}, {"code": "ET00517728", "title": "BTS World Tour Arirang in Buenos Aires: Live Viewing (Delayed)"}, {"code": "ET00452562", "title": "Na Ik Duje Ton Ghat Singh Vs Kaur 2 Na Ik Duje Ton Wake"}, {"code": "ET00514718", "title": "Azaad Singh"}, {"code": "ET00517922", "title": "Raibasi"}, {"code": "ET00489902", "title": "Village Rockstars 2"}, {"code": "ET00487783", "title": "Minions & Monsters"}, {"code": "ET00442702", "title": "Mandaadi (Malayalam)"}, {"code": "ET00508355", "title": "The Uprising"}, {"code": "ET00408547", "title": "Blue Lock: Episode Nagi"}, {"code": "ET00517757", "title": "Lutt Mubarak"}, {"code": "ET00512660", "title": "Marham: Poetry & Music - Live on Stage"}, {"code": "ET00315233", "title": "27 September"}, {"code": "ET00448286", "title": "Adventure of Iceberg 7D - Combo"}, {"code": "ET00448287", "title": "Adventure of Jetcat 7D - Combo"}, {"code": "ET00021991", "title": "Roller Coaster 7D - Combo"}, {"code": "ET00090482", "title": "Avengers: Endgame"}, {"code": "ET00506432", "title": "Haiwaan"}, {"code": "ET00516731", "title": "Avengers Endgame: Encore (English 3D)"}, {"code": "ET00516734", "title": "Avengers Endgame: Encore (English IMAX 2D)"}, {"code": "ET00517726", "title": "Avengers Endgame: Encore (Hindi 3D)"}, {"code": "ET00498186", "title": "Resident Evil (Hindi 3D)"}], "BANG": [{"code": "ET00436621", "title": "The Paradise (Telugu)"}, {"code": "ET00516813", "title": "Meesaya Murukku 2"}, {"code": "ET00444235", "title": "The Vvaan - Force of the Forrest"}, {"code": "ET00507738", "title": "Hanuman Ansh"}, {"code": "ET00504928", "title": "Heart of the Beast (English 3D)"}, {"code": "ET00412717", "title": "Premada Oorali"}, {"code": "ET00510578", "title": "Citylights"}, {"code": "ET00518039", "title": "Dorothy"}, {"code": "ET00498183", "title": "Resident Evil (English 3D)"}, {"code": "ET00514163", "title": "Avengers Endgame: Encore (English 2D)"}, {"code": "ET00506465", "title": "VIBE"}, {"code": "ET00442702", "title": "Mandaadi (Malayalam)"}, {"code": "ET00512696", "title": "Pradhama Drishtiya Kuttakkar"}, {"code": "ET00417686", "title": "Mirzapur: The Movie"}, {"code": "ET00502829", "title": "Bethlehem Kudumba Unit (Malayalam)"}, {"code": "ET00516853", "title": "Dhoomakethu"}, {"code": "ET00514345", "title": "Primetime"}, {"code": "ET00511528", "title": "America America 2"}, {"code": "ET00464392", "title": "Daayra"}, {"code": "ET00495643", "title": "Jadi: The Untold Side of If"}, {"code": "ET00447840", "title": "Spider-Man: Brand New Day (2D)"}, {"code": "ET00514426", "title": "Toss (Telugu)"}, {"code": "ET00513356", "title": "Spark"}, {"code": "ET00378770", "title": "Toxic: A Fairy Tale for Grown-ups"}, {"code": "ET00310216", "title": "Devara - Part 1"}, {"code": "ET00498770", "title": "Forgotten Island (Hindi 3D)"}, {"code": "ET00516253", "title": "Aasha"}, {"code": "ET00514378", "title": "Video"}, {"code": "ET00501839", "title": "Common Man"}, {"code": "ET00514267", "title": "Heggana Muddu"}, {"code": "ET00508081", "title": "Runner"}, {"code": "ET00518364", "title": "Doctor 24/7"}, {"code": "ET00452034", "title": "The Odyssey"}, {"code": "ET00518216", "title": "Rudrabhishekam"}, {"code": "ET00419437", "title": "Bingo"}, {"code": "ET00513616", "title": "Amartha"}, {"code": "ET00509404", "title": "Dahaan: The Evil Within"}, {"code": "ET00513285", "title": "Anireekshita Atithigalu"}, {"code": "ET00513554", "title": "Mahakavya Shri Ramayan Katha"}, {"code": "ET00517728", "title": "BTS World Tour Arirang in Buenos Aires: Live Viewing (Delayed)"}, {"code": "ET00517748", "title": "Anumana Pakshi"}, {"code": "ET00517730", "title": "BTS World Tour Arirang in Sao Paulo: Live Viewing (Delayed)"}, {"code": "ET00517027", "title": "Mahakavi"}, {"code": "ET00518066", "title": "Lenin Pandiyan"}, {"code": "ET00512528", "title": "Rou Sha Bi"}, {"code": "ET00439318", "title": "Awarapan 2"}, {"code": "ET00488644", "title": "Love Lottery"}, {"code": "ET00493836", "title": "Insidious: Out of The Further"}, {"code": "ET00489902", "title": "Village Rockstars 2"}, {"code": "ET00506419", "title": "Fall 2: Deadpoint"}, {"code": "ET00516731", "title": "Avengers Endgame: Encore (English 3D)"}, {"code": "ET00516734", "title": "Avengers Endgame: Encore (English IMAX 2D)"}, {"code": "ET00517726", "title": "Avengers Endgame: Encore (Hindi 3D)"}, {"code": "ET00498186", "title": "Resident Evil (Hindi 3D)"}], "HYD": [{"code": "ET00514163", "title": "Avengers Endgame: Encore (English 2D)"}, {"code": "ET00516731", "title": "Avengers Endgame: Encore (English 3D)"}, {"code": "ET00518791", "title": "Avengers Endgame: Encore (English HDR By Barco)"}, {"code": "ET00516224", "title": "Avengers Endgame: Encore (English MS - Infinity Vision)"}, {"code": "ET00516729", "title": "Avengers Endgame: Encore (English 4DX 3D)"}, {"code": "ET00516728", "title": "Avengers Endgame: Encore (English MS-Infinity Vsn 3d)"}, {"code": "ET00436621", "title": "The Paradise (Telugu 2D)"}, {"code": "ET00444235", "title": "The Vvaan - Force of the Forrest (Hindi 2D)"}, {"code": "ET00507738", "title": "Hanuman Ansh (Hindi 2D)"}, {"code": "ET00504928", "title": "Heart of the Beast (English 2D)"}, {"code": "ET00498183", "title": "Resident Evil (English 2D)"}, {"code": "ET00506465", "title": "VIBE (Hindi 2D)"}, {"code": "ET00518014", "title": "Forgotten Island (English 3D)"}, {"code": "ET00518417", "title": "Forgotten Island (English 4DX 3D)"}, {"code": "ET00514261", "title": "Mandaadi (Telugu 2D)"}, {"code": "ET00515244", "title": "Bethlehem Kudumba Unit (Telugu 2D)"}, {"code": "ET00514345", "title": "Primetime (English 2D)"}, {"code": "ET00508816", "title": "Happy Journey (Telugu 2D)"}, {"code": "ET00513554", "title": "Mahakavya Shri Ramayan Katha (Hindi 2D)"}, {"code": "ET00508081", "title": "Runner (English 2D)"}], "KANP": [{"code": "ET00507738", "title": "Hanuman Ansh"}, {"code": "ET00444235", "title": "The Vvaan - Force of the Forrest"}, {"code": "ET00417686", "title": "Mirzapur: The Movie"}, {"code": "ET00504928", "title": "Heart of the Beast (English 2D)"}, {"code": "ET00516731", "title": "Avengers Endgame: Encore (English 3D)"}, {"code": "ET00517726", "title": "Avengers Endgame: Encore (Hindi 3D)"}], "LUCK": [{"code": "ET00507738", "title": "Hanuman Ansh"}, {"code": "ET00444235", "title": "The Vvaan - Force of the Forrest"}, {"code": "ET00417686", "title": "Mirzapur: The Movie"}, {"code": "ET00514163", "title": "Avengers Endgame: Encore (English 2D)"}, {"code": "ET00436621", "title": "The Paradise (Telugu)"}, {"code": "ET00498183", "title": "Resident Evil (English 3D)"}, {"code": "ET00506465", "title": "VIBE"}, {"code": "ET00504928", "title": "Heart of the Beast (English 3D)"}, {"code": "ET00513554", "title": "Mahakavya Shri Ramayan Katha"}, {"code": "ET00464392", "title": "Daayra"}, {"code": "ET00439318", "title": "Awarapan 2"}, {"code": "ET00488644", "title": "Love Lottery"}, {"code": "ET00516731", "title": "Avengers Endgame: Encore (English 3D)"}, {"code": "ET00516734", "title": "Avengers Endgame: Encore (English IMAX 2D)"}, {"code": "ET00517726", "title": "Avengers Endgame: Encore (Hindi 3D)"}, {"code": "ET00498186", "title": "Resident Evil (Hindi 3D)"}]};

// Cinema-to-movie mapping for core cinema halls
const VENUE_MOVIES_MAP = {"CSWO": ["ET00518793", "ET00516224", "ET00507738", "ET00518079", "ET00518039", "ET00506465", "ET00444235", "ET00508081", "ET00514345", "ET00417686", "ET00512696", "ET00516853", "ET00498183", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00504928"], "IMOB": ["ET00518079", "ET00516734", "ET00464392", "ET00506465", "ET00417686", "ET00507738", "ET00518793", "ET00444235", "ET00498183", "ET00516520", "ET00508081", "ET00514345", "ET00516731", "ET00514163", "ET00517726", "ET00498186", "ET00504928"], "CPVM": ["ET00498183", "ET00516728", "ET00507738", "ET00506465", "ET00512696", "ET00444235", "ET00518079", "ET00514345", "ET00502630", "ET00417686", "ET00508081", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186"], "FMMA": ["ET00516520", "ET00516734", "ET00489902", "ET00507738", "ET00464392", "ET00518871", "ET00444235", "ET00513554", "ET00506465", "ET00518014", "ET00514345", "ET00517503", "ET00417686", "ET00518079", "ET00488644", "ET00513462", "ET00508081", "ET00506305", "ET00516731", "ET00514163", "ET00517726", "ET00498183", "ET00498186", "ET00504928", "ET00518793", "ET00498770"], "INRC": ["ET00511400", "ET00516734", "ET00514345", "ET00506465", "ET00516520", "ET00417686", "ET00488644", "ET00498183", "ET00518014", "ET00444235", "ET00508081", "ET00518079", "ET00507738", "ET00506305", "ET00464392", "ET00504928", "ET00452034", "ET00516731", "ET00514163", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "PIPP": ["ET00504928", "ET00506465", "ET00417686", "ET00514345", "ET00507738", "ET00518014", "ET00498183", "ET00464392", "ET00512660", "ET00444235", "ET00516734", "ET00516731", "ET00514163", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "POVI": ["ET00518039", "ET00514345", "ET00516728", "ET00507738", "ET00518014", "ET00444235", "ET00506465", "ET00508081", "ET00518079", "ET00504928", "ET00513554", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "BMXC": ["ET00516731", "ET00513554", "ET00444235", "ET00498186", "ET00417686", "ET00436621", "ET00507738", "ET00504928", "ET00514163", "ET00516734", "ET00517726", "ET00498183", "ET00518793"], "PCMM": ["ET00505232", "ET00516728", "ET00507738", "ET00444235", "ET00518014", "ET00516520", "ET00518079", "ET00504928", "ET00506465", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "PMKM": ["ET00504928", "ET00509404", "ET00516729", "ET00417686", "ET00444235", "ET00516853", "ET00507738", "ET00516813", "ET00518039", "ET00514345", "ET00506465", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "IMCM": ["ET00518014", "ET00514345", "ET00508081", "ET00516731", "ET00504928", "ET00464392", "ET00507738", "ET00513462", "ET00506465", "ET00444235", "ET00506305", "ET00417686", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "MCIW": ["ET00516734", "ET00507738", "ET00504928", "ET00506465", "ET00444235", "ET00488644", "ET00518039", "ET00498183", "ET00417686", "ET00516731", "ET00514163", "ET00517726", "ET00498186", "ET00518793"], "POPE": ["ET00516731", "ET00507738", "ET00505232", "ET00444235", "ET00516520", "ET00518079", "ET00506465", "ET00514163", "ET00516734", "ET00517726"], "PVAE": ["ET00444235", "ET00516728", "ET00498183", "ET00507738", "ET00518014", "ET00504928", "ET00506465", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "MXBY": ["ET00444235", "ET00507738", "ET00506305", "ET00436631", "ET00513554", "ET00518079", "ET00514533", "ET00464392", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "MTHB": ["ET00498186", "ET00516813", "ET00436621", "ET00417686", "ET00507738", "ET00516520", "ET00444235", "ET00516731", "ET00518079", "ET00505232", "ET00506465", "ET00504928", "ET00464392", "ET00514163", "ET00516734", "ET00517726", "ET00498183", "ET00518793"], "FMKY": ["ET00516731", "ET00444235", "ET00507738", "ET00516253", "ET00506465", "ET00505232", "ET00498183", "ET00514163", "ET00516734", "ET00517726", "ET00498186"], "KKMB": ["ET00516731", "ET00436631", "ET00444235", "ET00417686", "ET00507738", "ET00504928", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "PLXP": ["ET00505232", "ET00516731", "ET00507738", "ET00513554", "ET00444235", "ET00518014", "ET00516520", "ET00506465", "ET00518079", "ET00504928", "ET00417686", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "CAGL": ["ET00507738", "ET00516731", "ET00504928", "ET00444235", "ET00417686", "ET00498183", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793"], "PDDV": ["ET00464392", "ET00516224", "ET00507738", "ET00444235", "ET00504928", "ET00514345", "ET00506465", "ET00517490", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "PRCW": ["ET00506305", "ET00506465", "ET00516731", "ET00514345", "ET00444235", "ET00464392", "ET00508081", "ET00518014", "ET00504928", "ET00507738", "ET00498183", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "CPNM": ["ET00504928", "ET00507738", "ET00505232", "ET00417686", "ET00518014", "ET00444235", "ET00516731", "ET00506465", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "MIFU": ["ET00507738", "ET00444235", "ET00436631", "ET00517726", "ET00506465", "ET00417686", "ET00505232", "ET00464392", "ET00498186", "ET00516731", "ET00514163", "ET00516734", "ET00498183"], "PVMI": ["ET00504928", "ET00417686", "ET00516729", "ET00444235", "ET00507738", "ET00518039", "ET00506465", "ET00498183", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793"], "STER": ["ET00436631", "ET00444235", "ET00518014", "ET00506465", "ET00504928", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "MCRM": ["ET00516731", "ET00504928", "ET00507738", "ET00444235", "ET00518079", "ET00506465", "ET00506305", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "FMDA": ["ET00444235", "ET00507738", "ET00518079", "ET00504928", "ET00516731", "ET00506465", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "MTCR": ["ET00436631", "ET00507738", "ET00516813", "ET00444235", "ET00516520", "ET00516731", "ET00506465", "ET00505232", "ET00514163", "ET00516734", "ET00517726"], "INKO": ["ET00507738", "ET00516728", "ET00444235", "ET00518079", "ET00518014", "ET00516520", "ET00506465", "ET00504928", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "MCFF": ["ET00517726", "ET00444235", "ET00507738", "ET00417686", "ET00518079", "ET00516731", "ET00514163", "ET00516734"], "PITI": ["ET00516731", "ET00417686", "ET00507738", "ET00504928", "ET00444235", "ET00514345", "ET00488644", "ET00506465", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "IPBG": ["ET00504928", "ET00516728", "ET00505232", "ET00518079", "ET00444235", "ET00507738", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "MMHA": ["ET00516731", "ET00444235", "ET00518039", "ET00436621", "ET00505232", "ET00507738", "ET00514163", "ET00516734", "ET00517726"], "POLM": ["ET00506305", "ET00507738", "ET00518079", "ET00444235", "ET00513462", "ET00506465", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "PVWJ": ["ET00504928", "ET00516731", "ET00508081", "ET00464392", "ET00444235", "ET00507738", "ET00514345", "ET00417686", "ET00506465", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "FNAN": ["ET00516728", "ET00507738", "ET00488644", "ET00444235", "ET00506465", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "DCTW": ["ET00516731", "ET00436631", "ET00507738", "ET00518014", "ET00516520", "ET00444235", "ET00417686", "ET00514163", "ET00516734", "ET00517726", "ET00498770"], "FMRL": ["ET00513462", "ET00444235", "ET00518014", "ET00516520", "ET00507738", "ET00517726", "ET00506305", "ET00516731", "ET00514163", "ET00516734", "ET00498770"], "IMJW": ["ET00498183", "ET00514345", "ET00518014", "ET00516734", "ET00444235", "ET00507738", "ET00504928", "ET00506465", "ET00464392", "ET00516731", "ET00514163", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "THAB": ["ET00516728", "ET00504928", "ET00507738", "ET00505232", "ET00444235", "ET00506465", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "MXBO": ["ET00444235", "ET00507738", "ET00516520", "ET00436631", "ET00518079", "ET00516731", "ET00417686", "ET00514163", "ET00516734", "ET00517726"], "SMFV": ["ET00444235", "ET00436621", "ET00507738", "ET00517726", "ET00505232", "ET00516731", "ET00514163", "ET00516734"], "MMMR": ["ET00436631", "ET00444235", "ET00498183", "ET00506465", "ET00507738", "ET00498186"], "MDVA": ["ET00507738", "ET00506465", "ET00516520", "ET00444235", "ET00516731", "ET00518079", "ET00488644", "ET00417686", "ET00514163", "ET00516734", "ET00517726"], "FNCM": ["ET00517726", "ET00515640", "ET00442702", "ET00507738", "ET00444235", "ET00516853", "ET00505232", "ET00518039", "ET00506465", "ET00516731", "ET00514163", "ET00516734"], "INNP": ["ET00444235", "ET00516731", "ET00514345", "ET00417686", "ET00518014", "ET00504928", "ET00507738", "ET00506465", "ET00508081", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "BMXA": ["ET00417686", "ET00516731", "ET00507738", "ET00436621", "ET00444235", "ET00514163", "ET00516734", "ET00517726"], "MMET": ["ET00506465", "ET00417686", "ET00436621", "ET00444235", "ET00507738", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "HPVR": ["ET00444235", "ET00507738", "ET00506465", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "MIDO": ["ET00507738", "ET00516731", "ET00444235", "ET00417686", "ET00518079", "ET00514163", "ET00516734", "ET00517726"], "MMWM": ["ET00507738", "ET00436631", "ET00444235", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "MUCK": ["ET00516520", "ET00444235", "ET00518079", "ET00436631", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "MMSZ": ["ET00507738", "ET00444235", "ET00436621"], "PLUS": ["ET00444235", "ET00504928", "ET00516731", "ET00514345", "ET00506465", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "CTRR": ["ET00518079", "ET00507738", "ET00444235"], "AETE": ["ET00444235", "ET00436621"], "MCTG": ["ET00517726", "ET00507738", "ET00436631", "ET00444235", "ET00516731", "ET00514163", "ET00516734"], "EMNC": ["ET00516734", "ET00516731", "ET00514163", "ET00517726"], "MAJB": ["ET00507738", "ET00444235", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "MACE": ["ET00517726", "ET00444235", "ET00507738", "ET00516731", "ET00514163", "ET00516734"], "MCAA": ["ET00517726", "ET00444235", "ET00505232", "ET00507738", "ET00516731", "ET00514163", "ET00516734"], "MTMA": ["ET00436631", "ET00444235", "ET00507738", "ET00506305"], "CPVV": ["ET00507738", "ET00444235", "ET00508081", "ET00516731", "ET00514345", "ET00506465", "ET00504928", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "PMPK": ["ET00444235", "ET00506305", "ET00513462", "ET00507738"], "MCNE": ["ET00444235", "ET00507738"], "AAAS": ["ET00507738", "ET00506305", "ET00513462"], "RCHG": ["ET00507738", "ET00436621", "ET00444235", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "MXSN": ["ET00444235", "ET00515640", "ET00507738", "ET00436631", "ET00464392", "ET00514533", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "GCMG": ["ET00444235", "ET00436631", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "RSMI": ["ET00444235", "ET00436631"], "GOCS": ["ET00436631", "ET00444235", "ET00507738"], "MTSC": ["ET00444235", "ET00436631"], "WAML": ["ET00514345", "ET00513554", "ET00444235", "ET00518014", "ET00516731", "ET00504928", "ET00507738", "ET00508081", "ET00506465", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "FMDR": ["ET00444235", "ET00507738"], "LEPV": ["ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "CCMP": ["ET00518079", "ET00507738", "ET00517726", "ET00444235", "ET00516731", "ET00514163", "ET00516734"], "TCDM": ["ET00518079", "ET00507738", "ET00444235", "ET00436631"], "IRGT": ["ET00507738", "ET00516731", "ET00444235", "ET00504928", "ET00518014", "ET00506465", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "MCAN": ["ET00444235", "ET00505232", "ET00507738", "ET00515640", "ET00518079", "ET00488644", "ET00514533", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "MTGD": ["ET00444235", "ET00436631"], "RGCM": ["ET00444235", "ET00436631"], "OMCS": ["ET00444235", "ET00507738"], "PZCD": ["ET00518079", "ET00505232"], "KCMA": ["ET00507738", "ET00444235"], "MXCK": ["ET00444235", "ET00507738"], "SNGL": ["ET00436631", "ET00507738", "ET00444235"], "MTSU": ["ET00504928", "ET00436631", "ET00444235", "ET00518793"], "KTMV": ["ET00507738", "ET00518079", "ET00509388", "ET00515640", "ET00506305"], "MMMC": ["ET00444235", "ET00436631"], "GCDM": ["ET00444235", "ET00505232"], "NYMD": ["ET00436631", "ET00516520", "ET00444235"], "GDTH": ["ET00436631", "ET00507738", "ET00444235"], "MMAA": ["ET00444235", "ET00436631"], "ONEB": ["ET00516520", "ET00515640", "ET00518079"], "CNTX": ["ET00436631", "ET00507738", "ET00518079", "ET00444235"], "FQSA": ["ET00436631", "ET00444235"], "BRVP": ["ET00516520", "ET00506305", "ET00436631"], "KURL": ["ET00436631", "ET00444235"], "KMMV": ["ET00516731", "ET00488644", "ET00444235", "ET00514163", "ET00516734", "ET00517726"], "KKUI": ["ET00444235", "ET00436631"], "PJDW": ["ET00444235"], "MMCV": ["ET00444235"], "NHCG": ["ET00436631", "ET00444235"], "NNNX": ["ET00436631"], "VVVM": ["ET00505232", "ET00436631"], "VECU": ["ET00436631", "ET00444235"], "WCVR": ["ET00444235", "ET00436631"], "PVVW": ["ET00417686", "ET00444235", "ET00516734", "ET00511400", "ET00488644", "ET00514345", "ET00507738", "ET00498186", "ET00504928", "ET00508081", "ET00506465", "ET00518039", "ET00512696", "ET00516731", "ET00514163", "ET00517726", "ET00498183", "ET00518793"], "CPNS": ["ET00444235", "ET00514369", "ET00517726", "ET00507738", "ET00488644", "ET00504928", "ET00417686", "ET00506465", "ET00498183", "ET00518014", "ET00516731", "ET00514163", "ET00516734", "ET00498186", "ET00518793", "ET00498770"], "DTYN": ["ET00516734", "ET00508081", "ET00452034", "ET00517400", "ET00507738", "ET00444235", "ET00417686", "ET00514345", "ET00518417", "ET00506465", "ET00518793", "ET00516731", "ET00514163", "ET00517726", "ET00498183", "ET00498186", "ET00504928", "ET00518014", "ET00498770"], "PVLE": ["ET00417686", "ET00507738", "ET00444235", "ET00516734", "ET00498183", "ET00518417", "ET00514345", "ET00464392", "ET00502386", "ET00502829", "ET00518793", "ET00508081", "ET00506465", "ET00518039", "ET00506419", "ET00516731", "ET00514163", "ET00517726", "ET00498186", "ET00504928", "ET00518014", "ET00498770"], "PAEG": ["ET00517533", "ET00516734", "ET00507738", "ET00504928", "ET00417686", "ET00444235", "ET00506465", "ET00514345", "ET00502386", "ET00518014", "ET00508081", "ET00502600", "ET00464392", "ET00516731", "ET00514163", "ET00517726", "ET00498183", "ET00498186", "ET00518793", "ET00498770"], "PTCW": ["ET00504928", "ET00444235", "ET00514345", "ET00516734", "ET00417686", "ET00507738", "ET00508081", "ET00518014", "ET00498183", "ET00506465", "ET00516731", "ET00514163", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "PGND": ["ET00504928", "ET00516728", "ET00444235", "ET00507738", "ET00464392", "ET00488644", "ET00518014", "ET00417686", "ET00514345", "ET00513554", "ET00506465", "ET00498183", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "USEB": ["ET00516731", "ET00513554", "ET00444235", "ET00417686", "ET00507738", "ET00498183", "ET00436631", "ET00488644", "ET00506465", "ET00504928", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793"], "PPGV": ["ET00417686", "ET00516728", "ET00518868", "ET00444235", "ET00514345", "ET00464392", "ET00517533", "ET00504928", "ET00506465", "ET00507738", "ET00489902", "ET00518039", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498183", "ET00498186", "ET00518793", "ET00518014", "ET00498770"], "G3SR": ["ET00417686", "ET00436631", "ET00444235", "ET00507738", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "IPMJ": ["ET00444235", "ET00417686", "ET00504928", "ET00518039", "ET00488644", "ET00516735", "ET00507738", "ET00513865", "ET00502829", "ET00498183", "ET00514369", "ET00506465", "ET00516853", "ET00512696", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793"], "CIPS": ["ET00516729", "ET00518039", "ET00518014", "ET00444235", "ET00514345", "ET00507738", "ET00504928", "ET00508081", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "INVM": ["ET00444235", "ET00518014", "ET00516734", "ET00507738", "ET00506465", "ET00504928", "ET00514369", "ET00514345", "ET00498183", "ET00417686", "ET00516731", "ET00514163", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "DVDC": ["ET00507738", "ET00436631", "ET00417686", "ET00444235", "ET00514533", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "PCSN": ["ET00417686", "ET00514369", "ET00516729", "ET00504928", "ET00507738", "ET00498183", "ET00444235", "ET00518014", "ET00513554", "ET00506465", "ET00452562", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "PCEL": ["ET00444235", "ET00504928", "ET00506465", "ET00507738", "ET00517726", "ET00498770", "ET00514369", "ET00417686", "ET00514345", "ET00516731", "ET00514163", "ET00516734", "ET00518793", "ET00518014"], "SPIA": ["ET00507738", "ET00417686", "ET00516728", "ET00444235", "ET00504928", "ET00488644", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "PGGM": ["ET00444235", "ET00506465", "ET00516729", "ET00507738", "ET00417686", "ET00508081", "ET00516853", "ET00518014", "ET00514345", "ET00518039", "ET00498183", "ET00504928", "ET00464392", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "MXGN": ["ET00417686", "ET00507738", "ET00516731", "ET00436631", "ET00506465", "ET00444235", "ET00513554", "ET00514163", "ET00516734", "ET00517726"], "LBDL": ["ET00436631", "ET00444235"], "SCJN": ["ET00507738", "ET00444235", "ET00506465", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "FNLN": ["ET00507738", "ET00444235", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "PMMS": ["ET00516728", "ET00507738", "ET00417686", "ET00444235", "ET00514369", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "CRGM": ["ET00504928", "ET00507738", "ET00516224", "ET00488644", "ET00518014", "ET00444235", "ET00514369", "ET00417686", "ET00498186", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498183", "ET00518793", "ET00498770"], "CNEV": ["ET00507738", "ET00436631", "ET00417686", "ET00516731", "ET00444235", "ET00498183", "ET00504928", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793"], "PPDA": ["ET00507738", "ET00516728", "ET00498183", "ET00444235", "ET00518014", "ET00417686", "ET00514369", "ET00506465", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00498770"], "PVKS": ["ET00517726", "ET00504928", "ET00444235", "ET00506465", "ET00417686", "ET00507738", "ET00516731", "ET00514163", "ET00516734", "ET00518793"], "PBLL": ["ET00417686", "ET00506465", "ET00507738", "ET00444235", "ET00517726", "ET00504928", "ET00516731", "ET00514163", "ET00516734", "ET00518793"], "WVRN": ["ET00507738", "ET00506465", "ET00444235", "ET00436631", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "M2PP": ["ET00436631", "ET00507738", "ET00444235", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "SCPT": ["ET00517726", "ET00507738", "ET00516853", "ET00444235", "ET00417686", "ET00516813", "ET00516731", "ET00514163", "ET00516734"], "M2RH": ["ET00507738", "ET00444235", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "CPUM": ["ET00516731", "ET00507738", "ET00504928", "ET00444235", "ET00506465", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "SCND": ["ET00444235", "ET00507738", "ET00417686", "ET00506465", "ET00514345", "ET00516731", "ET00498183", "ET00504928", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793"], "INWM": ["ET00516728", "ET00506465", "ET00514345", "ET00507738", "ET00444235", "ET00518014", "ET00504928", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "PPMF": ["ET00417686", "ET00516731", "ET00504928", "ET00514369", "ET00507738", "ET00444235", "ET00506465", "ET00518014", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "FNSD": ["ET00507738", "ET00513554", "ET00444235", "ET00516728", "ET00514369", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "WVND": ["ET00513554", "ET00504928", "ET00417686", "ET00507738", "ET00444235", "ET00436621", "ET00517726", "ET00516731", "ET00514163", "ET00516734", "ET00518793"], "CUNT": ["ET00488644", "ET00507738", "ET00506465", "ET00444235", "ET00417686", "ET00516728", "ET00504928", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "ISMG": ["ET00417686", "ET00507738", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "CPGV": ["ET00444235", "ET00516731", "ET00507738", "ET00488644", "ET00506465", "ET00417686", "ET00514163", "ET00516734", "ET00517726"], "IOMG": ["ET00516731", "ET00417686", "ET00507738", "ET00506465", "ET00444235", "ET00464392", "ET00514163", "ET00516734", "ET00517726"], "IAJS": ["ET00444235", "ET00516728", "ET00518014", "ET00507738", "ET00504928", "ET00498183", "ET00417686", "ET00518039", "ET00506465", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "MCTI": ["ET00417686", "ET00507738", "ET00444235", "ET00488644", "ET00464392", "ET00517726", "ET00513554", "ET00516731", "ET00514163", "ET00516734"], "EMPS": ["ET00517757", "ET00517726", "ET00506465", "ET00444235", "ET00507738", "ET00504928", "ET00417686", "ET00498183", "ET00516731", "ET00514163", "ET00516734", "ET00498186", "ET00518793"], "CTEE": ["ET00417686", "ET00517726", "ET00444235", "ET00507738", "ET00514369", "ET00506465", "ET00516731", "ET00514163", "ET00516734"], "CEST": ["ET00517726", "ET00507738", "ET00506465", "ET00444235", "ET00504928", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00518793"], "PECD": ["ET00504928", "ET00507738", "ET00444235", "ET00516224", "ET00514345", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "CIJA": ["ET00517726", "ET00507738", "ET00444235", "ET00514369", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "WVRG": ["ET00513554", "ET00507738", "ET00506465", "ET00444235", "ET00517726", "ET00514369", "ET00417686", "ET00436631", "ET00516731", "ET00514163", "ET00516734"], "CPMF": ["ET00507738", "ET00417686", "ET00514369", "ET00444235", "ET00516728", "ET00504928", "ET00506465", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "MHNU": ["ET00507738", "ET00506465", "ET00513554", "ET00444235", "ET00516731", "ET00504928", "ET00417686", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "PVPU": ["ET00516734", "ET00516731", "ET00514163", "ET00517726"], "PDIV": ["ET00444235", "ET00507738", "ET00517726", "ET00514369", "ET00516731", "ET00514163", "ET00516734"], "DPDC": ["ET00444235", "ET00502386", "ET00516731", "ET00506465", "ET00507738", "ET00504928", "ET00514345", "ET00508081", "ET00464392", "ET00498183", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793"], "WVKS": ["ET00513554", "ET00488644", "ET00507738", "ET00444235", "ET00436631", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "INFR": ["ET00507738", "ET00444235", "ET00506465", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "NYCG": ["ET00436631", "ET00504928", "ET00516731", "ET00507738", "ET00444235", "ET00417686", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "USCO": ["ET00436631", "ET00444235", "ET00507738", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "MTPP": ["ET00444235", "ET00507738", "ET00436631", "ET00516731", "ET00498186", "ET00514163", "ET00516734", "ET00517726", "ET00498183"], "USCG": ["ET00417686", "ET00436631", "ET00507738", "ET00444235", "ET00514163", "ET00516731", "ET00516734", "ET00517726"], "MDDC": ["ET00417686", "ET00507738", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "BCWG": ["ET00436631", "ET00507738", "ET00444235", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "IOCP": ["ET00444235", "ET00504928", "ET00507738", "ET00417686", "ET00518793"], "WUPG": ["ET00504928", "ET00417686", "ET00507738", "ET00436621", "ET00518014", "ET00444235", "ET00516731", "ET00506465", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "RONC": ["ET00444235", "ET00507738", "ET00436631", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "IOTG": ["ET00444235", "ET00507738", "ET00417686", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "PVPD": ["ET00516731", "ET00444235", "ET00507738", "ET00417686", "ET00514163", "ET00516734", "ET00517726"], "PNAD": ["ET00417686", "ET00444235", "ET00506465", "ET00507738", "ET00517726", "ET00514369", "ET00516731", "ET00514163", "ET00516734"], "DCMV": ["ET00464392", "ET00516731", "ET00506465", "ET00417686", "ET00518014", "ET00444235", "ET00504928", "ET00507738", "ET00508081", "ET00514345", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "MCVM": ["ET00417686", "ET00507738", "ET00488644", "ET00444235", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "NYDU": ["ET00436631", "ET00507738", "ET00517726", "ET00444235", "ET00516731", "ET00514163", "ET00516734"], "EDMP": ["ET00517726", "ET00417686", "ET00444235", "ET00507738", "ET00516731", "ET00514163", "ET00516734"], "RRJM": ["ET00507738", "ET00444235", "ET00514163", "ET00436631", "ET00516731", "ET00516734", "ET00517726"], "GPDC": ["ET00444235", "ET00507738", "ET00516731", "ET00504928", "ET00464392", "ET00518014", "ET00514345", "ET00498183", "ET00417686", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793", "ET00498770"], "MMAP": ["ET00417686", "ET00514533", "ET00444235", "ET00507738", "ET00498186", "ET00436631", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498183"], "VVGZ": ["ET00506465", "ET00444235", "ET00507738", "ET00516731", "ET00417686", "ET00514163", "ET00516734", "ET00517726"], "AMCD": ["ET00444235", "ET00436631"], "PCCF": ["ET00444235", "ET00507738", "ET00436631"], "IEFM": ["ET00507738", "ET00506465", "ET00444235", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "CNVG": ["ET00516728", "ET00444235", "ET00507738", "ET00504928", "ET00506465", "ET00498183", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00498186", "ET00518793"], "CCPZ": ["ET00507738", "ET00444235", "ET00504928", "ET00516731", "ET00417686", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "PMTN": ["ET00417686", "ET00506465", "ET00444235", "ET00516731", "ET00507738", "ET00464392", "ET00514163", "ET00516734", "ET00517726"], "IZOP": ["ET00516734", "ET00516731", "ET00514163", "ET00517726"], "MCEF": ["ET00417686", "ET00507738", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "INRD": ["ET00504928", "ET00464392", "ET00518014", "ET00507738", "ET00444235", "ET00417686", "ET00516731", "ET00506465", "ET00514369", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "PMGU": ["ET00444235", "ET00504928", "ET00507738", "ET00516731", "ET00417686", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "WATG": ["ET00436621", "ET00507738", "ET00498186", "ET00444235", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00498183"], "INSG": ["ET00417686", "ET00507738", "ET00488644", "ET00444235", "ET00516728", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "RNMT": ["ET00514533", "ET00444235", "ET00436631", "ET00507738", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "PSDD": ["ET00516731", "ET00444235", "ET00507738", "ET00417686", "ET00514163", "ET00516734", "ET00517726"], "MCAZ": ["ET00507738", "ET00444235", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "MCDE": ["ET00517726", "ET00507738", "ET00514369", "ET00444235", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "LSCM": ["ET00507738", "ET00514163", "ET00436631", "ET00417686", "ET00513554", "ET00506465", "ET00516731", "ET00516734", "ET00517726"], "PETA": ["ET00444235", "ET00507738", "ET00506465", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "MERM": ["ET00417686", "ET00507738", "ET00504928", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793"], "MIMU": ["ET00488644", "ET00513554", "ET00444235", "ET00516731", "ET00507738", "ET00417686", "ET00514163", "ET00516734", "ET00517726"], "PVMS": ["ET00507738", "ET00506465", "ET00444235", "ET00417686", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "MTND": ["ET00517726", "ET00444235", "ET00436621", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "SLCU": ["ET00517726", "ET00436631", "ET00507738", "ET00516731", "ET00514163", "ET00516734"], "PCPL": ["ET00507738", "ET00444235"], "RCGD": ["ET00507738", "ET00444235", "ET00436631", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "MDCD": ["ET00436631"], "MENL": ["ET00507738", "ET00436631"], "IDEN": ["ET00516731", "ET00507738", "ET00498770", "ET00506465", "ET00444235", "ET00504928", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00518014"], "IBYG": ["ET00507738", "ET00444235", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "ISML": ["ET00507738", "ET00444235", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "ATSM": ["ET00444235", "ET00488644", "ET00507738", "ET00514533", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "MJMM": ["ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "PFDN": ["ET00417686", "ET00507738", "ET00518014", "ET00444235", "ET00504928", "ET00514345", "ET00516731", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "IGAM": ["ET00504928", "ET00507738", "ET00506465", "ET00444235", "ET00518014", "ET00516731", "ET00514345", "ET00417686", "ET00514163", "ET00516734", "ET00517726", "ET00518793", "ET00498770"], "PDEI": ["ET00507738", "ET00444235"], "MCIX": ["ET00417686", "ET00507738", "ET00517726", "ET00444235", "ET00516731", "ET00514163", "ET00516734"], "ONEG": ["ET00507738", "ET00517726", "ET00436631", "ET00516731", "ET00514163", "ET00516734"], "GRNG": ["ET00514533", "ET00507738", "ET00436631", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "GMGX": ["ET00507738", "ET00444235", "ET00436631", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "MKLJ": ["ET00444235", "ET00507738", "ET00488644", "ET00513554", "ET00516731", "ET00417686", "ET00514163", "ET00516734", "ET00517726"], "GAGC": ["ET00507738", "ET00444235"], "PMPM": ["ET00517757", "ET00517726", "ET00444235", "ET00507738", "ET00514369", "ET00516731", "ET00514163", "ET00516734"], "MCGN": ["ET00517726", "ET00444235", "ET00436621", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "QLAC": ["ET00444235", "ET00436631", "ET00417686", "ET00517726", "ET00507738", "ET00516731", "ET00514163", "ET00516734"], "MXCS": ["ET00436631", "ET00514163", "ET00507738", "ET00444235", "ET00417686", "ET00516731", "ET00516734", "ET00517726"], "HVCD": ["ET00507738", "ET00436631", "ET00417686", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "RRCO": ["ET00507738", "ET00444235", "ET00436631"], "RVCV": ["ET00444235", "ET00507738", "ET00436621", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "CIGK": ["ET00507738", "ET00444235"], "STWA": ["ET00444235", "ET00436631", "ET00507738"], "SCGZ": ["ET00417686", "ET00444235", "ET00507738", "ET00436631", "ET00514533", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "MTCV": ["ET00436631", "ET00444235", "ET00514533", "ET00507738", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "MWMG": ["ET00417686", "ET00516731", "ET00444235", "ET00507738", "ET00436631", "ET00514163", "ET00516734", "ET00517726"], "BTFD": ["ET00436631", "ET00507738", "ET00444235"], "MMZG": ["ET00444235", "ET00507738", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "MWSS": ["ET00507738", "ET00444235", "ET00436631", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "VBOR": ["ET00506432"], "MMOC": ["ET00436631", "ET00444235", "ET00507738"], "AKRF": ["ET00436631", "ET00417686", "ET00507738"], "AKRC": ["ET00444235", "ET00507738", "ET00436631", "ET00514533", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "MIDA": ["ET00448286", "ET00021991", "ET00448287"], "MAGX": ["ET00448286", "ET00021991", "ET00448287"], "MEDM": ["ET00448286", "ET00021991", "ET00448287"], "EEBC": ["ET00444235", "ET00507738", "ET00436631", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "EBCA": ["ET00507738", "ET00436631", "ET00417686", "ET00514533", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "SCUR": ["ET00507738", "ET00444235", "ET00436631"], "IMMO": ["ET00516735", "ET00504928", "ET00436621", "ET00510578", "ET00507738", "ET00513356", "ET00516813", "ET00444235", "ET00464392", "ET00518014", "ET00514345", "ET00498183", "ET00502829", "ET00501839", "ET00442702", "ET00412717", "ET00506465", "ET00508081", "ET00516853", "ET00417686", "ET00495643", "ET00378770", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "PVFF": ["ET00516734", "ET00436621", "ET00417686", "ET00510578", "ET00518039", "ET00514345", "ET00508081", "ET00518014", "ET00507738", "ET00512696", "ET00444235", "ET00516813", "ET00504928", "ET00506465", "ET00442702", "ET00464392", "ET00516731", "ET00514163", "ET00516729", "ET00518793", "ET00498770"], "PSPR": ["ET00436621", "ET00444235", "ET00510578", "ET00507738", "ET00516813", "ET00516901", "ET00504928", "ET00514345", "ET00514744", "ET00498183", "ET00511528", "ET00442702", "ET00513356", "ET00518039", "ET00518868", "ET00417686", "ET00506465", "ET00502829", "ET00516853", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00518014", "ET00498770"], "PVOO": ["ET00516729", "ET00436621", "ET00518039", "ET00516813", "ET00501839", "ET00511528", "ET00510578", "ET00514345", "ET00498183", "ET00444235", "ET00504928", "ET00507738", "ET00513356", "ET00514267", "ET00518014", "ET00417686", "ET00464392", "ET00378770", "ET00506465", "ET00516731", "ET00514163", "ET00516734", "ET00498186", "ET00518793", "ET00498770"], "CFBS": ["ET00436621", "ET00502600", "ET00509404", "ET00513356", "ET00444235", "ET00518014", "ET00516729", "ET00417686", "ET00442702", "ET00506465", "ET00504928", "ET00516853", "ET00507738", "ET00495643", "ET00516813", "ET00514345", "ET00516731", "ET00514163", "ET00516734", "ET00518793", "ET00498770"], "PVER": ["ET00436621", "ET00412717", "ET00516813", "ET00444235", "ET00507738", "ET00513356", "ET00464392", "ET00518417", "ET00502829", "ET00504928", "ET00498183", "ET00516734", "ET00417686", "ET00510578", "ET00514267", "ET00506465", "ET00442702", "ET00514345", "ET00489902", "ET00508081", "ET00516853", "ET00516731", "ET00514163", "ET00516729", "ET00498186", "ET00518793", "ET00518014", "ET00498770"], "IMCB": ["ET00516253", "ET00417686", "ET00512696", "ET00436621", "ET00513356", "ET00516813", "ET00507738", "ET00514267", "ET00516731", "ET00518039", "ET00510578", "ET00444235", "ET00518014", "ET00504928", "ET00506465", "ET00442702", "ET00514163", "ET00516734", "ET00516729", "ET00518793", "ET00498770"], "ACKB": ["ET00517027", "ET00518039", "ET00515244", "ET00436621", "ET00518216", "ET00516813", "ET00510578", "ET00518866", "ET00518014", "ET00419437", "ET00514163", "ET00412717", "ET00516853", "ET00444235", "ET00498183", "ET00507738", "ET00516731", "ET00516734", "ET00516729", "ET00498186", "ET00504928", "ET00518793", "ET00498770"], "PVWW": ["ET00516734", "ET00417686", "ET00507738", "ET00518014", "ET00444235", "ET00464392", "ET00504928", "ET00498183", "ET00514345", "ET00436621", "ET00506465", "ET00516813", "ET00512696", "ET00502829", "ET00516731", "ET00514163", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "CEHR": ["ET00513356", "ET00444235", "ET00504928", "ET00498183", "ET00516731", "ET00507738", "ET00436621", "ET00516813", "ET00516853", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "PBMM": ["ET00516729", "ET00436621", "ET00510578", "ET00516813", "ET00444235", "ET00501839", "ET00516853", "ET00502829", "ET00507738", "ET00518039", "ET00504928", "ET00518014", "ET00512696", "ET00417686", "ET00506465", "ET00516731", "ET00514163", "ET00516734", "ET00518793", "ET00498770"], "PPNX": ["ET00518039", "ET00506465", "ET00518014", "ET00516729", "ET00436621", "ET00507738", "ET00444235", "ET00504928", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00518793", "ET00498770"], "CLGM": ["ET00436621", "ET00442702", "ET00444235", "ET00514744", "ET00412717", "ET00498183", "ET00514345", "ET00516728", "ET00513356", "ET00506465", "ET00507738", "ET00516813", "ET00510578", "ET00518014", "ET00512696", "ET00504928", "ET00417686", "ET00516853", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "INRZ": ["ET00516734", "ET00436621", "ET00513356", "ET00504928", "ET00510578", "ET00444235", "ET00511528", "ET00442702", "ET00516813", "ET00507738", "ET00516731", "ET00514163", "ET00516729", "ET00518793"], "CNRM": ["ET00442702", "ET00516813", "ET00510578", "ET00514744", "ET00518014", "ET00516728", "ET00513356", "ET00444235", "ET00436621", "ET00506465", "ET00507738", "ET00504928", "ET00516853", "ET00417686", "ET00512696", "ET00498183", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "PSLC": ["ET00516728", "ET00436621", "ET00516813", "ET00518417", "ET00513356", "ET00510578", "ET00498183", "ET00507738", "ET00444235", "ET00504928", "ET00514345", "ET00506465", "ET00417686", "ET00512696", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00518014", "ET00498770"], "CPOE": ["ET00436621", "ET00512696", "ET00507738", "ET00504928", "ET00516728", "ET00444235", "ET00516813", "ET00498183", "ET00442702", "ET00417686", "ET00516853", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "INMB": ["ET00516734", "ET00436621", "ET00514267", "ET00444235", "ET00514426", "ET00504928", "ET00513356", "ET00511528", "ET00507738", "ET00518014", "ET00506465", "ET00412717", "ET00516813", "ET00378770", "ET00516731", "ET00514163", "ET00516729", "ET00518793", "ET00498770"], "PMSR": ["ET00436621", "ET00444235", "ET00518039", "ET00516813", "ET00506465", "ET00504928", "ET00516731", "ET00502829", "ET00512696", "ET00412717", "ET00510578", "ET00442702", "ET00498183", "ET00507738", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "PGFD": ["ET00516729", "ET00436621", "ET00501839", "ET00510578", "ET00516813", "ET00513356", "ET00498183", "ET00511528", "ET00444235", "ET00507738", "ET00514267", "ET00518014", "ET00506465", "ET00504928", "ET00516731", "ET00514163", "ET00516734", "ET00498186", "ET00518793", "ET00498770"], "SATB": ["ET00436621"], "GPGM": ["ET00412717", "ET00507738", "ET00504928", "ET00436621", "ET00516813", "ET00444235", "ET00516853", "ET00516731", "ET00502829", "ET00518039", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "CPJR": ["ET00436621", "ET00442702", "ET00444235", "ET00506465", "ET00498183", "ET00516731", "ET00516813", "ET00507738", "ET00513356", "ET00504928", "ET00495643", "ET00417686", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "PMBR": ["ET00516731", "ET00436621", "ET00506465", "ET00516813", "ET00444235", "ET00507738", "ET00510578", "ET00514163", "ET00516734", "ET00516729"], "FMFB": ["ET00436621", "ET00506465", "ET00516813", "ET00498183", "ET00504928", "ET00512696", "ET00444235", "ET00518014", "ET00516731", "ET00507738", "ET00417686", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "SKMM": ["ET00436621", "ET00516813"], "MSMD": ["ET00436621", "ET00507738", "ET00412717", "ET00444235", "ET00513356", "ET00516731", "ET00513616", "ET00516813", "ET00510578", "ET00501839", "ET00514267", "ET00442702", "ET00518039", "ET00514163", "ET00516734", "ET00516729"], "FMLB": ["ET00498183", "ET00512696", "ET00442702", "ET00510578", "ET00444235", "ET00436621", "ET00506465", "ET00516813", "ET00504928", "ET00516731", "ET00507738", "ET00417686", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "PZVK": ["ET00498183", "ET00436621", "ET00444235", "ET00507738", "ET00510578", "ET00516853", "ET00516731", "ET00516813", "ET00518364", "ET00442702", "ET00506465", "ET00518039", "ET00514163", "ET00516734", "ET00516729", "ET00498186"], "VTGB": ["ET00436621"], "TDCA": ["ET00436621"], "LKTH": ["ET00516813", "ET00518039"], "PGWB": ["ET00516813", "ET00444235", "ET00442702", "ET00514426", "ET00412717", "ET00436621", "ET00513356", "ET00510578", "ET00507738", "ET00504928", "ET00516728", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "BKDV": ["ET00436621"], "INBC": ["ET00516813", "ET00444235", "ET00513356", "ET00436621", "ET00507738", "ET00514267", "ET00504928", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "PAAS": ["ET00507738", "ET00516813", "ET00516853", "ET00506465", "ET00518039", "ET00436621", "ET00444235", "ET00504928", "ET00516731", "ET00512696", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "SLTR": ["ET00516813", "ET00436621"], "SVTB": ["ET00436621"], "INBG": ["ET00516728", "ET00518014", "ET00507738", "ET00464392", "ET00504928", "ET00436621", "ET00516813", "ET00444235", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00518793", "ET00498770"], "GYBU": ["ET00436621", "ET00507738", "ET00412717", "ET00510578", "ET00513356", "ET00444235", "ET00516731", "ET00516853", "ET00514163", "ET00516734", "ET00516729"], "NSBR": ["ET00444235", "ET00436621", "ET00512696", "ET00504928", "ET00495643", "ET00516813", "ET00507738", "ET00516731", "ET00516853", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "CPEB": ["ET00436621", "ET00442702", "ET00514267", "ET00488644", "ET00498183", "ET00444235", "ET00506465", "ET00417686", "ET00516728", "ET00510578", "ET00516813", "ET00507738", "ET00412717", "ET00495643", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186"], "GPBR": ["ET00444235", "ET00516813", "ET00504928", "ET00436621", "ET00516853", "ET00516731", "ET00507738", "ET00518039", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "VCTP": ["ET00507738", "ET00444235", "ET00442702", "ET00510578", "ET00436621", "ET00412717", "ET00516813", "ET00516853", "ET00516731", "ET00518039", "ET00514163", "ET00516734", "ET00516729"], "VNKA": ["ET00436621"], "SSNR": ["ET00514163", "ET00444235", "ET00436621", "ET00516731", "ET00516734", "ET00516729"], "KINO": ["ET00436621", "ET00412717", "ET00444235", "ET00518039", "ET00516853"], "MKBG": ["ET00518039", "ET00516813", "ET00436621"], "GPAM": ["ET00436621", "ET00444235", "ET00511528", "ET00514267", "ET00513356", "ET00510578", "ET00516731", "ET00507738", "ET00514163", "ET00516734", "ET00516729"], "PMMC": ["ET00436621", "ET00507738", "ET00516853", "ET00444235", "ET00514267", "ET00504928", "ET00514378", "ET00516731", "ET00510578", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "VTBR": ["ET00510578"], "RKCL": ["ET00510578", "ET00412717", "ET00436621", "ET00444235", "ET00516853", "ET00514163", "ET00518039", "ET00516731", "ET00516734", "ET00516729"], "INBJ": ["ET00516728", "ET00507738", "ET00412717", "ET00436621", "ET00516813", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "BALT": ["ET00510578", "ET00436621"], "VRBL": ["ET00510578", "ET00501839", "ET00513356"], "PTBK": ["ET00436621", "ET00516813"], "PDWR": ["ET00444235", "ET00504928", "ET00514345", "ET00508081", "ET00516813", "ET00516731", "ET00506465", "ET00507738", "ET00436621", "ET00518014", "ET00452034", "ET00514163", "ET00516734", "ET00516729", "ET00518793", "ET00498770"], "VTSK": ["ET00436621", "ET00510578"], "SDJH": ["ET00444235"], "ANBL": ["ET00436621", "ET00516813"], "SDCS": ["ET00516853"], "MRGB": ["ET00436621"], "VOIB": ["ET00436621", "ET00510578"], "SAMP": ["ET00518066", "ET00516813"], "GPMY": ["ET00412717", "ET00514267", "ET00518364", "ET00444235", "ET00513554", "ET00436621", "ET00507738", "ET00516853", "ET00516813", "ET00510578", "ET00516731", "ET00518039", "ET00514163", "ET00516734", "ET00516729"], "AMNH": ["ET00495643", "ET00436621", "ET00518039", "ET00516853", "ET00504928", "ET00444235", "ET00506465", "ET00516813", "ET00516731", "ET00417686", "ET00507738", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "NRBL": ["ET00510578", "ET00412717"], "SDSD": ["ET00510578"], "GPSM": ["ET00513554", "ET00442702", "ET00436621", "ET00512696", "ET00514378", "ET00516853", "ET00507738"], "RKTB": ["ET00436621"], "BHAC": ["ET00436621", "ET00510578"], "SBCR": ["ET00436621"], "ROON": ["ET00510578", "ET00436621", "ET00412717"], "ASTB": ["ET00510578"], "RTHT": ["ET00436621"], "VTBE": ["ET00510578", "ET00412717", "ET00436621"], "PDRD": ["ET00436621", "ET00412717"], "KCBI": ["ET00513356", "ET00436621", "ET00510578"], "PTBC": ["ET00436621", "ET00516813"], "RATK": ["ET00436621"], "SLTB": ["ET00436621"], "SAED": ["ET00436621"], "MDKI": ["ET00516813", "ET00513356"], "CVLG": ["ET00507738", "ET00444235", "ET00498183", "ET00516731", "ET00436621", "ET00504928", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "SRPJ": ["ET00436621"], "AMRT": ["ET00516813", "ET00436621"], "PDYA": ["ET00516813", "ET00444235"], "SVYK": ["ET00436621"], "SMRN": ["ET00436621"], "MLDT": ["ET00510578"], "VBWT": ["ET00436621", "ET00510578"], "SIDA": ["ET00436621"], "GDTY": ["ET00510578"], "VCCB": ["ET00436621"], "GDAK": ["ET00510578"], "VYCH": ["ET00436621"], "STSV": ["ET00518039"], "ARTS": ["ET00436633", "ET00516813"], "NFGD": ["ET00493836", "ET00436631", "ET00506465", "ET00444235", "ET00504928", "ET00513554", "ET00507738", "ET00498183", "ET00516731", "ET00417686", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "SMHP": ["ET00436621"], "SPAY": ["ET00518039"], "TRIG": ["ET00501839"], "SCPR": ["ET00518039", "ET00442702"], "SSPA": ["ET00510578", "ET00436621"], "ADCR": ["ET00436621"], "PTYK": ["ET00436621"], "RTEA": ["ET00442702"], "BDCG": ["ET00436621"], "SKDD": ["ET00444235"], "HASV": ["ET00436621"], "CHTH": ["ET00436621"], "RKDO": ["ET00412717"], "STGR": ["ET00513356"], "MUTB": ["ET00436621"], "DKTI": ["ET00510578"], "SRHK": ["ET00436621"], "ATGN": ["ET00436631"], "SNDC": ["ET00514261"], "SRRT": ["ET00436621"], "SLND": ["ET00436621"], "VACD": ["ET00510578"], "VDCS": ["ET00436621"], "GPTB": ["ET00516813", "ET00412717"], "ANTE": ["ET00510578"], "SNNN": ["ET00510578", "ET00436621"], "GTYT": ["ET00518066", "ET00516853"], "VECI": ["ET00513356"], "VECG": ["ET00510578"], "SVKT": ["ET00436621"], "SNGN": ["ET00518216"], "SKHK": ["ET00436621"], "BALJ": ["ET00516813"], "PRHN": ["ET00514163", "ET00516731", "ET00518791", "ET00436621", "ET00444235", "ET00498183", "ET00507738", "ET00518014", "ET00504928"], "AMBH": ["ET00516224", "ET00436621", "ET00444235", "ET00504928", "ET00514261", "ET00514345", "ET00507738", "ET00506465", "ET00518014", "ET00513554", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00518793", "ET00498770"], "ALUC": ["ET00516728", "ET00518242", "ET00504928", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "ACPM": ["ET00514535", "ET00436621", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "ACEV": ["ET00516731", "ET00444235", "ET00436621", "ET00504928", "ET00508816", "ET00518014", "ET00507738", "ET00498183", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "PVFS": ["ET00436621", "ET00514261", "ET00518417", "ET00506465", "ET00498183", "ET00444235", "ET00504928", "ET00514345", "ET00516729", "ET00495643", "ET00508816", "ET00512696", "ET00516731", "ET00514163", "ET00516734", "ET00498186", "ET00518793", "ET00518014", "ET00498770"], "ACAS": ["ET00514163", "ET00436621", "ET00507738", "ET00498183", "ET00514261", "ET00518014", "ET00504928", "ET00444235", "ET00516731", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "AACN": ["ET00436621", "ET00504928", "ET00498770", "ET00514163", "ET00444235", "ET00507738", "ET00417686", "ET00516731", "ET00516734", "ET00516729", "ET00518793", "ET00518014"], "CTNR": ["ET00436621", "ET00516728", "ET00506465", "ET00444235", "ET00514345", "ET00488644", "ET00507738", "ET00518014", "ET00495643", "ET00504928", "ET00498183", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "ILKS": ["ET00436621", "ET00518014", "ET00498183", "ET00436673", "ET00444235", "ET00516853", "ET00507738", "ET00516731", "ET00510578", "ET00508081", "ET00505185", "ET00504928", "ET00508816", "ET00502600", "ET00506465", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "SRMO": ["ET00436621"], "IGMH": ["ET00518014", "ET00507738", "ET00436621", "ET00506465", "ET00512696", "ET00514261", "ET00498183", "ET00516731", "ET00504928", "ET00444235", "ET00510578", "ET00515244", "ET00516853", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "MMAH": ["ET00516731", "ET00436621", "ET00444235", "ET00504928", "ET00498183", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "GPRH": ["ET00508816", "ET00436621", "ET00464932", "ET00514163", "ET00498185", "ET00516731", "ET00516734", "ET00516729", "ET00498183", "ET00498186"], "CPMH": ["ET00436621", "ET00498183", "ET00504928", "ET00516728", "ET00515244", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "CVMU": ["ET00498185", "ET00436621", "ET00507738", "ET00518043", "ET00517748", "ET00508816", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498183", "ET00498186"], "MMCA": ["ET00436621", "ET00444235", "ET00498185", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498183", "ET00498186"], "ASHN": ["ET00436621", "ET00514535", "ET00514261", "ET00444235", "ET00517748", "ET00513554", "ET00508816", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "MAHM": ["ET00436621"], "AMCA": ["ET00436621", "ET00514163", "ET00444235", "ET00506465", "ET00507738", "ET00516731", "ET00516734", "ET00516729"], "SRCM": ["ET00436621"], "ABCS": ["ET00436621", "ET00507738", "ET00504928", "ET00516731", "ET00444235", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "BRKH": ["ET00436621"], "CPHY": ["ET00436621", "ET00514163", "ET00444235", "ET00516731", "ET00516734", "ET00516729"], "PNNG": ["ET00436621", "ET00498770", "ET00516731", "ET00508816", "ET00444235", "ET00506465", "ET00502386", "ET00514345", "ET00464932", "ET00498183", "ET00480372", "ET00514261", "ET00507738", "ET00504928", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00518014"], "CMMA": ["ET00436621", "ET00444235", "ET00516728", "ET00507738", "ET00498186", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498183"], "ISTN": ["ET00436621", "ET00518014", "ET00506465", "ET00509404", "ET00507738", "ET00513554", "ET00444235", "ET00498183", "ET00498186", "ET00498770"], "GOKU": ["ET00436621"], "PVTS": ["ET00444235", "ET00436621", "ET00516731", "ET00498183", "ET00508081", "ET00514345", "ET00504928", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "JJPP": ["ET00436621", "ET00514163", "ET00444235", "ET00508816", "ET00514261", "ET00517748", "ET00516731", "ET00516734", "ET00516729"], "AKYJ": ["ET00436621", "ET00444235", "ET00498183", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498186"], "SSRM": ["ET00436621"], "SMMR": ["ET00436621"], "HMHD": ["ET00436621"], "ARJU": ["ET00436621"], "PIMH": ["ET00516729", "ET00508081", "ET00436621", "ET00509404", "ET00444235", "ET00498183", "ET00506465", "ET00518014", "ET00504928", "ET00515244", "ET00516731", "ET00514163", "ET00516734", "ET00498186", "ET00518793", "ET00498770"], "PVTP": ["ET00518014", "ET00436621", "ET00444235", "ET00516731", "ET00512696", "ET00514163", "ET00516734", "ET00516729", "ET00498770"], "PIIC": ["ET00516729", "ET00436621", "ET00508081", "ET00506465", "ET00507738", "ET00518014", "ET00504928", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00518793", "ET00498770"], "IOMH": ["ET00436621", "ET00507738", "ET00516731", "ET00517748", "ET00444235", "ET00498183", "ET00512696", "ET00514261", "ET00518014", "ET00504928", "ET00514163", "ET00516734", "ET00516729", "ET00498186", "ET00518793", "ET00498770"], "APNS": ["ET00436621", "ET00513554", "ET00504928", "ET00514163", "ET00444235", "ET00507738", "ET00498183", "ET00516731", "ET00516734", "ET00516729", "ET00498186", "ET00518793"], "ARMH": ["ET00436621", "ET00514163", "ET00517748", "ET00516731", "ET00516734", "ET00516729"], "PVHM": ["ET00436621", "ET00506465", "ET00498770", "ET00489902", "ET00444235", "ET00514345", "ET00509404", "ET00504928", "ET00518793", "ET00518014"], "INKM": ["ET00514535", "ET00514261", "ET00436621", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "ACHI": ["ET00436621"], "PVUM": ["ET00436621", "ET00507738", "ET00506465", "ET00417686", "ET00498183", "ET00498770", "ET00444235", "ET00514163", "ET00516731", "ET00516734", "ET00516729", "ET00498186", "ET00518014"], "IPRS": ["ET00495643", "ET00436621", "ET00514163", "ET00512696", "ET00444235", "ET00504928", "ET00516731", "ET00516734", "ET00516729", "ET00518793"], "MRAD": ["ET00436621", "ET00507738", "ET00444235", "ET00517748", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "SNKH": ["ET00436621", "ET00514533", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "MCSS": ["ET00436621", "ET00444235", "ET00498183", "ET00517748", "ET00507281", "ET00514163", "ET00464932", "ET00516731", "ET00516734", "ET00516729", "ET00498186"], "SNDY": ["ET00436621"], "DVRR": ["ET00514535", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "PVYH": ["ET00417686", "ET00436621", "ET00495643", "ET00444235", "ET00516731", "ET00507738", "ET00504928", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "ASJY": ["ET00436621"], "MCKT": ["ET00514535", "ET00436621", "ET00514261", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "ARYH": ["ET00436621"], "MRAA": ["ET00436621", "ET00514261", "ET00498185", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498183", "ET00498186"], "INHY": ["ET00436621", "ET00504928", "ET00516731", "ET00444235", "ET00514163", "ET00516734", "ET00516729", "ET00518793"], "INMH": ["ET00517726", "ET00436621", "ET00507738", "ET00498186", "ET00444235", "ET00506465", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498183"], "VRKC": ["ET00517726", "ET00436621", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "VTRB": ["ET00436621"], "SPCB": ["ET00436621"], "TVHY": ["ET00436621", "ET00417686", "ET00507738", "ET00516731", "ET00444235", "ET00506465", "ET00514163", "ET00516734", "ET00516729"], "SUDA": ["ET00436621"], "IVNM": ["ET00436621", "ET00515244", "ET00504928", "ET00444235", "ET00518793"], "PRCX": ["ET00436621", "ET00516731", "ET00444235", "ET00514163", "ET00516734", "ET00516729"], "MRGT": ["ET00436621", "ET00517748", "ET00498185", "ET00444235", "ET00514535", "ET00514261", "ET00516731", "ET00514163", "ET00516734", "ET00516729", "ET00498183", "ET00498186"], "STHD": ["ET00436621", "ET00517726", "ET00507738", "ET00444235", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "MRRG": ["ET00516731", "ET00436621", "ET00498185", "ET00514261", "ET00514163", "ET00516734", "ET00516729", "ET00498183", "ET00498186"], "SCHC": ["ET00436621"], "UKCC": ["ET00517748", "ET00444235", "ET00436621", "ET00514261", "ET00514535", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "CPCL": ["ET00442702", "ET00436621", "ET00502829", "ET00512696", "ET00516731", "ET00516853", "ET00444235", "ET00514163", "ET00516734", "ET00516729"], "AMCM": ["ET00436621"], "PSMJ": ["ET00436621", "ET00517748", "ET00518043", "ET00444235", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "MTHY": ["ET00444235", "ET00436621", "ET00514163", "ET00504928", "ET00507738", "ET00498770", "ET00516731", "ET00516734", "ET00516729", "ET00518793", "ET00518014"], "VAJA": ["ET00436621"], "PRCS": ["ET00436621"], "TRHY": ["ET00436621"], "RKMH": ["ET00444235"], "PTTH": ["ET00436621"], "SCVM": ["ET00436621"], "CPLK": ["ET00507738", "ET00444235", "ET00436621", "ET00513554", "ET00514533", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "BJNG": ["ET00436621"], "ARTH": ["ET00436621"], "SRCA": ["ET00436621"], "SRKR": ["ET00436621"], "RMKN": ["ET00436621"], "RCNH": ["ET00444235", "ET00436621", "ET00517726", "ET00516731", "ET00514163", "ET00516734", "ET00516729"], "SRCH": ["ET00436621"], "SSRJ": ["ET00444235"], "KTKT": ["ET00436621"], "SNIB": ["ET00436621"], "SLRT": ["ET00436621"], "MCBH": ["ET00444235"], "LKMT": ["ET00487933"], "SART": ["ET00517748"], "SKTA": ["ET00436621"], "YAKT": ["ET00475599"], "INZS": ["ET00504928", "ET00507738", "ET00417686", "ET00516731", "ET00444235"], "RAVE": ["ET00444235", "ET00488644", "ET00517726", "ET00436631", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "RMIK": ["ET00444235", "ET00517726", "ET00507738", "ET00436631", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "PSXM": ["ET00507738", "ET00444235", "ET00417686", "ET00516731", "ET00514163", "ET00516734", "ET00517726"], "PDDK": ["ET00444235", "ET00507738", "ET00513554", "ET00517726", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "NYCH": ["ET00507738", "ET00417686", "ET00444235", "ET00516731", "ET00436631", "ET00514163", "ET00516734", "ET00517726"], "MCGP": ["ET00507738", "ET00444235", "ET00417686", "ET00517726", "ET00516731", "ET00514163", "ET00516734"], "SDPO": ["ET00444235", "ET00507738"], "MCRL": ["ET00517726", "ET00444235", "ET00436631", "ET00417686", "ET00516731", "ET00514163", "ET00516734"], "MHKT": ["ET00444235", "ET00436631"], "PCSK": ["ET00513554", "ET00444235", "ET00507738", "ET00436631"], "ANRR": ["ET00507738", "ET00444235"], "SAPK": ["ET00444235"], "NCUK": ["ET00444235"], "GUCK": ["ET00444235"], "DBSC": ["ET00444235"], "JUGA": ["ET00439318"], "LALK": ["ET00436631"]};

// Movie title lookup catalog with Language & Dimension
const MOVIES_CATALOG = {"ET00504928": "Heart of the Beast (English 2D)", "ET00506465": "VIBE", "ET00417686": "Mirzapur: The Movie", "ET00514345": "Primetime", "ET00507738": "Hanuman Ansh", "ET00518014": "Forgotten Island (English 3D)", "ET00498183": "Resident Evil (English 2D)", "ET00464392": "Daayra", "ET00512660": "Marham: Poetry & Music - Live on Stage", "ET00444235": "The Vvaan - Force of the Forrest", "ET00516734": "Avengers Endgame: Encore (English IMAX 2D)", "ET00519042": "Avengers Endgame: Encore (Hindi MX4D 3D)", "ET00505232": "Jayanti 2", "ET00516728": "Avengers Endgame: Encore (English MS-Infinity Vsn 3d)", "ET00516520": "Tujhya Aaila", "ET00518079": "Bandkhor", "ET00508081": "Runner", "ET00516731": "Avengers Endgame: Encore (English 3D)", "ET00513462": "Chatni", "ET00506305": "Mitrata", "ET00488644": "Love Lottery", "ET00518039": "Dorothy", "ET00518793": "Heart of the Beast (Hindi 3D)", "ET00489902": "Village Rockstars 2", "ET00518871": "Heart of the Beast (Marathi)", "ET00513554": "Mahakavya Shri Ramayan Katha", "ET00517503": "Resident Evil (Hindi 2D)", "ET00512696": "Pradhama Drishtiya Kuttakkar", "ET00502630": "Spider-Man: Brand New Day (Hindi 3D)", "ET00511400": "The Magic Faraway Tree", "ET00452034": "The Odyssey", "ET00509404": "Dahaan: The Evil Within", "ET00516729": "Avengers Endgame: Encore (English 4DX 3D)", "ET00516853": "Dhoomakethu", "ET00516813": "Meesaya Murukku 2", "ET00498186": "Resident Evil (Hindi 3D)", "ET00436621": "The Paradise (Telugu 2D)", "ET00516224": "Avengers Endgame: Encore (English MS - Infinity Vision)", "ET00518791": "Avengers Endgame: Encore (English HDR By Barco)", "ET00436631": "The Paradise (Hindi)", "ET00514533": "Avengers Endgame: Encore (Hindi 2D)", "ET00517490": "Om Ka Hari", "ET00517726": "Avengers Endgame: Encore (Hindi 3D)", "ET00516253": "Aasha", "ET00515640": "Devghar On Rent", "ET00442702": "Mandaadi (Malayalam)", "ET00509388": "Pidha Pachhi", "ET00518417": "Forgotten Island (Telugu 3D)", "ET00502386": "PAW Patrol: The Dino Movie", "ET00502829": "Bethlehem Kudumba Unit (Malayalam)", "ET00506419": "Fall 2: Deadpoint", "ET00517400": "Resident Evil (Hindi)", "ET00518868": "Forgotten Island (Kannada 3D)", "ET00517533": "Resident Evil (Telugu 3D)", "ET00502600": "Spider-Man: Brand New Day (English 3D)", "ET00516735": "Avengers Endgame: Encore (Hindi 2D)", "ET00513865": "4 Rivers 6 Ranges Chushi Gangdruk", "ET00514369": "Saare Jagg Te Puwade Paaye Tutt Paini English Ne", "ET00498770": "Forgotten Island (Hindi 3D)", "ET00452562": "Na Ik Duje Ton Ghat Singh Vs Kaur 2 Na Ik Duje Ton Wake", "ET00517757": "Lutt Mubarak", "ET00514163": "Avengers Endgame: Encore (English 2D)", "ET00448286": "Adventure of Iceberg 7D - Combo", "ET00021991": "Roller Coaster 7D - Combo", "ET00448287": "Adventure of Jetcat 7D - Combo", "ET00510578": "Citylights", "ET00513356": "Spark", "ET00501839": "Common Man", "ET00412717": "Premada Oorali", "ET00495643": "Jadi: The Untold Side of If", "ET00378770": "Toxic: A Fairy Tale for Grown-ups", "ET00506432": "Haiwaan", "ET00511528": "America America 2", "ET00514267": "Heggana Muddu", "ET00516901": "Avengers Endgame: Encore (Kannada 3D)", "ET00514744": "Toss (Kannada)", "ET00517027": "Mahakavi", "ET00515244": "Bethlehem Kudumba Unit (Telugu 2D)", "ET00518216": "Rudrabhishekam", "ET00518866": "Heart of the Beast (Kannada)", "ET00419437": "Bingo", "ET00514426": "Toss (Telugu)", "ET00513616": "Amartha", "ET00518364": "Doctor 24/7", "ET00514378": "Video", "ET00518066": "Lenin Pandiyan", "ET00493836": "Insidious: Out of The Further", "ET00436633": "The Paradise (Tamil)", "ET00514261": "Mandaadi (Telugu 2D)", "ET00514535": "Avengers Endgame: Encore (Telugu 2D)", "ET00508816": "Happy Journey", "ET00518242": "The Paradise (Telugu)", "ET00436673": "Demon Slayer: Kimetsu no Yaiba Infinity Castle", "ET00505185": "Minions & Monsters", "ET00464932": "Secret Soldier", "ET00498185": "Resident Evil (Tamil 3D)", "ET00518043": "Avengers Endgame: Encore (Telugu 3D)", "ET00517748": "Anumana Pakshi", "ET00480372": "The Sheep Detectives", "ET00507281": "Kalyanam Kamaniyam Jeevitam", "ET00487933": "Irumudi", "ET00475599": "Jai Kishen", "ET00514373": "Mitti De Putt", "ET00501011": "Jindagi Once More", "ET00505635": "Tom & Cherry", "ET00470536": "Firki", "ET00519018": "Ha Tuj Maro Prem Chhe", "ET00517111": "Avengers Endgame: Encore (Telugu 2D)", "ET00514748": "Manjar", "ET00508355": "The Uprising", "ET00510603": "Psycho Ranga", "ET00517346": "Avengers Endgame: Encore (Tamil 3D)", "ET00518010": "Avengers Endgame: Encore (Tamil 2D)", "ET00515005": "The Dark Heaven", "ET00439318": "Awarapan 2", "ET00516472": "Aaram", "ET00447840": "Spider-Man: Brand New Day (2D)"};

// Multi-lingual sibling code mapping for cross-language tracking
const AVENGERS_ALL = [
  "ET00514163", "ET00516731", "ET00518791", "ET00516734",
  "ET00517726", "ET00519042", "ET00516224", "ET00516729",
  "ET00516728", "ET00514533", "ET00516735",
  "ET00514535", "ET00518043", "ET00517111", "ET00517346", "ET00518010", "ET00516901"
];
const MULTILINGUAL_SIBLINGS = {
  "ET00516731": AVENGERS_ALL,
  "ET00514163": AVENGERS_ALL,
  "ET00518791": AVENGERS_ALL,
  "ET00516734": AVENGERS_ALL,
  "ET00519042": AVENGERS_ALL,
  "ET00517726": AVENGERS_ALL,
  "ET00514533": AVENGERS_ALL,
  "ET00516735": AVENGERS_ALL,
  "ET00516224": AVENGERS_ALL,
  "ET00516728": AVENGERS_ALL,
  "ET00516729": AVENGERS_ALL,
  "ET00514535": AVENGERS_ALL,
  "ET00518043": AVENGERS_ALL,
  "ET00517111": AVENGERS_ALL,
  "ET00517346": AVENGERS_ALL,
  "ET00518010": AVENGERS_ALL,
  "ET00516901": AVENGERS_ALL,
  "ET00498183": ["ET00498183", "ET00498186", "ET00517503"],
  "ET00498186": ["ET00498183", "ET00498186", "ET00517503"],
  "ET00517503": ["ET00498183", "ET00498186", "ET00517503"],
  "ET00517400": ["ET00498183", "ET00498186", "ET00517503"],
  "ET00504928": ["ET00504928", "ET00518793"],
  "ET00518793": ["ET00504928", "ET00518793"],
  "ET00518014": ["ET00518014", "ET00498770"],
  "ET00498770": ["ET00518014", "ET00498770"],
  "ET00502600": ["ET00502600", "ET00502630"],
  "ET00502630": ["ET00502600", "ET00502630"],
  "ET00436621": ["ET00436621", "ET00436631"],
  "ET00436631": ["ET00436621", "ET00436631"]
};
// Fallback trending movies
const POPULAR_MOVIES = [
  {
    "code": "ET00516731",
    "title": "Avengers: Endgame - Encore (3D)"
  },
  {
    "code": "ET00514163",
    "title": "Avengers: Endgame - Encore (2D)"
  },
  {
    "code": "ET00436621",
    "title": "The Paradise"
  },
  {
    "code": "ET00444235",
    "title": "The Vvaan - Force of the Forrest"
  },
  {
    "code": "ET00507738",
    "title": "Hanuman Ansh"
  },
  {
    "code": "ET00498183",
    "title": "Resident Evil"
  },
  {
    "code": "ET00504928",
    "title": "Heart of the Beast"
  },
  {
    "code": "ET00518014",
    "title": "Forgotten Island"
  },
  {
    "code": "ET00513554",
    "title": "Mahakavya Shri Ramayan Katha"
  },
  {
    "code": "ET00310216",
    "title": "Devara - Part 1"
  },
  {
    "code": "ET00447840",
    "title": "Spider-Man: Brand New Day"
  }
];


function getHeaders(regionCode = "HYD", citySlug = "hyderabad", lat = "17.385", lon = "78.487") {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "x-app-code": "WEB",
    "x-region-code": regionCode,
    "x-region-slug": citySlug,
    "x-geohash": "tep",
    "x-latitude": String(lat || "17.385"),
    "x-longitude": String(lon || "78.487"),
    "x-location-selection": "manual",
    "Referer": "https://in.bookmyshow.com/",
    "Cookie": `Rgn=|Code=${regionCode}|`,
  };
}

export default {
  // 1. Telegram Webhook Handler & Utilities
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /set-webhook: Automatically sets Telegram webhook to this Worker's URL
    if (url.pathname === "/set-webhook") {
      if (!env.TELEGRAM_BOT_TOKEN) {
        return new Response("TELEGRAM_BOT_TOKEN is not configured in Worker environment.", { status: 400 });
      }
      const host = url.origin;
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(host)}`);
      const data = await res.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // GET /webhook-info: Checks current webhook registration status
    if (url.pathname === "/webhook-info") {
      if (!env.TELEGRAM_BOT_TOKEN) {
        return new Response("TELEGRAM_BOT_TOKEN is not configured in Worker environment.", { status: 400 });
      }
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
      const data = await res.json();
      return new Response(JSON.stringify(data, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // GET /diag: Verifies environment variables and KV binding
    if (url.pathname === "/diag") {
      const cityTest = url.searchParams.get("city") || "KANP";
      const venues = await fetchVenuesForCity(cityTest, env);
      return new Response(JSON.stringify({
        status: "online",
        hasToken: !!env.TELEGRAM_BOT_TOKEN,
        hasChatId: !!env.TELEGRAM_CHAT_ID,
        hasKV: !!env.TRACKER_DB,
        testedCity: cityTest,
        venuesCount: venues.length,
        venuesSample: venues.slice(0, 5),
        moviesCount: (await fetchMoviesForCity(cityTest, "ALL", env)).movies.length
      }, null, 2), { headers: { "Content-Type": "application/json" } });
    }

    // GET /api/trackers: Export active trackers for external scanner (GitHub Actions)
    if (url.pathname === "/api/trackers") {
      const auth = request.headers.get("Authorization") || url.searchParams.get("token");
      if (auth !== env.TELEGRAM_BOT_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }

      const allTrackers = [];
      if (env.TRACKER_DB) {
        const list = await env.TRACKER_DB.list({ prefix: "trackers:" });
        for (const k of list.keys) {
          const raw = await env.TRACKER_DB.get(k.name);
          if (raw) {
            try {
              const listArr = JSON.parse(raw);
              for (const t of listArr) {
                if (!t.citySlug || !t.lat || !t.lon) {
                  const c = await resolveCity(t.cityCode || "HYD", env);
                  t.citySlug = c.slug;
                  t.lat = c.lat;
                  t.lon = c.lon;
                }
                allTrackers.push(t);
              }
            } catch (e) {}
          }
        }
      }

      return new Response(JSON.stringify(allTrackers, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // POST /api/trackers/sync: Update known sessions from external scanner
    if (url.pathname === "/api/trackers/sync" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || url.searchParams.get("token");
      if (auth !== env.TELEGRAM_BOT_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const payload = await request.json(); // { trackerId, knownSessions }
        if (env.TRACKER_DB && payload.trackerId) {
          const list = await env.TRACKER_DB.list({ prefix: "trackers:" });
          for (const k of list.keys) {
            const raw = await env.TRACKER_DB.get(k.name);
            if (!raw) continue;
            let trackers = JSON.parse(raw);
            let updated = false;
            for (let t of trackers) {
              if (t.id === payload.trackerId) {
                t.knownSessions = payload.knownSessions || [];
                if (payload.isInitialized !== undefined) {
                  t.isInitialized = payload.isInitialized;
                }
                updated = true;
              }
            }
            if (updated) {
              await env.TRACKER_DB.put(k.name, JSON.stringify(trackers));
              break;
            }
          }
        }
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      } catch (err) {
        return new Response("Error: " + err.message, { status: 400 });
      }
    }

    // POST /api/movies/sync: Push freshly scraped movies for cities into Cloudflare KV
    if (url.pathname === "/api/movies/sync" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || url.searchParams.get("token");
      if (auth !== env.TELEGRAM_BOT_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const payload = await request.json(); // { cityCode, movies, venues } or { venueCode, movies }
        if (env.TRACKER_DB && payload) {
          const ttl = 86400 * 7;
          // Atomic city-bundled write: Saves 99% of daily KV writes
          if (payload.cityCode && payload.venues && typeof payload.venues === "object") {
            await env.TRACKER_DB.put(`v_movies_city:${payload.cityCode}`, JSON.stringify(payload.venues), { expirationTtl: ttl });
          }
          if (payload.cityCode && Array.isArray(payload.movies)) {
            await env.TRACKER_DB.put(`movies:${payload.cityCode}`, JSON.stringify(payload.movies), { expirationTtl: ttl });
          }
          if (payload.venueCode && Array.isArray(payload.movies)) {
            await env.TRACKER_DB.put(`v_movies:${payload.venueCode}`, JSON.stringify(payload.movies), { expirationTtl: ttl });
          }
        }
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      } catch (err) {
        return new Response("Error: " + err.message, { status: 400 });
      }
    }

    if (request.method !== "POST") {
      return new Response("Movie Tracker Bot Running 24/7 on Cloudflare", { status: 200 });
    }

    try {
      const update = await request.json();
      await handleTelegramUpdate(update, env);
      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Fetch handler error:", err);
      return new Response("OK", { status: 200 });
    }
  }
};

// Handle Telegram Updates
async function handleTelegramUpdate(update, env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const configuredChatId = String(env.TELEGRAM_CHAT_ID || "").trim().replace(/['"]/g, "");

  // Optional whitelist if explicitly configured in env.ALLOWED_CHAT_IDS
  // Record user interaction for user analytics and admin broadcasts
  const activeChatId = String(update.callback_query?.message?.chat?.id || update.message?.chat?.id || "");
  if (activeChatId) {
    await recordUserInteraction(env, activeChatId);
  }

  // A. Handle Button Clicks
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = String(cb.message?.chat?.id || "");
    const userId = String(cb.from?.id || "");
    const messageId = cb.message?.message_id;
    const data = cb.data || "";

    if (allowedList && !allowedList.includes(chatId) && !allowedList.includes(userId)) {
      await answerCallbackQuery(botToken, cb.id, "Unauthorized user");
      return;
    }

    await answerCallbackQuery(botToken, cb.id);
    try {
      await handleCallbackData(botToken, chatId, messageId, data, env);
    } catch (err) {
      console.error("handleCallbackData error:", err);
      await sendTelegram(botToken, chatId, "⚠️ An error occurred while processing your request. Please try again or type /start.");
    }
    return;
  }

  // B. Handle Text Messages
  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) return;

  const chatId = String(msg.chat.id);
  const userId = String(msg.from?.id || "");
  const text = msg.text.trim();

  if (allowedList && !allowedList.includes(chatId) && !allowedList.includes(userId)) {
    return;
  }

  const cmd = text.toLowerCase().split(/\s+/)[0].split("@")[0];

  // Commands
  if (cmd === "/start" || cmd === "/track") {
    await clearSession(env, chatId);
    await sendCitySelection(botToken, chatId, null, env);
    return;
  }
  if (cmd === "/admin") {
    if (String(chatId) === configuredChatId && configuredChatId.length > 0) {
      await clearSession(env, chatId);
      await sendAdminDashboard(botToken, chatId, null, env);
    }
    return;
  }

  if (cmd === "/list") {
    await clearSession(env, chatId);
    await sendTrackerList(botToken, chatId, env);
    return;
  }
  if (cmd === "/status") {
    await clearSession(env, chatId);
    await sendStatusReport(botToken, chatId, env);
    return;
  }
  if (cmd === "/clear" || cmd === "/delete_all" || cmd === "/delete") {
    await clearSession(env, chatId);
    await deleteAllTrackersForUser(env, chatId);
    await sendTelegram(botToken, chatId, "🗑️ *All trackers for your account have been deleted.*");
    return;
  }
  if (cmd === "/help") {
    await sendTelegram(botToken, chatId,
      "🤖 *Movie Ticket Tracker Bot Commands:*\n\n" +
      "• /start — Track tickets (City ➔ Movie ➔ Theatre ➔ Screen)\n" +
      "• /list — View and manage your active trackers (Pause / Resume / Delete)\n" +
      "• /status — Check live status of all tracked shows\n" +
      "• /clear — Delete all your active trackers immediately\n" +
      "• /help — Show this help menu\n\n" +
      "💡 *Tip:* You can also paste any BookMyShow movie link directly into this chat anytime!"
    );
    return;
  }

  // Check if user has an active pending session (City search/request, Theatre search, Custom movie)
  const session = await getSession(env, chatId);

  if (session && session.step === "AWAITING_ADMIN_BROADCAST") {
    if (String(chatId) === configuredChatId && configuredChatId.length > 0) {
      if (text.toLowerCase() === "/cancel") {
        await clearSession(env, chatId);
        await sendTelegram(botToken, chatId, "❌ Broadcast cancelled.");
        await sendAdminDashboard(botToken, chatId, null, env);
      } else {
        await handleAdminBroadcastInput(botToken, chatId, text, env);
      }
    } else {
      await clearSession(env, chatId);
    }
    return;
  }

  if (session && (session.step === "AWAITING_CITY_REQUEST" || session.step === "AWAITING_CITY_QUERY")) {
    await handleCityRequestInput(botToken, chatId, text, env);
    return;
  }

  if (session && session.step === "AWAITING_THEATRE_QUERY") {
    await handleTheatreSearchInput(botToken, chatId, session.cityCode, text, env);
    return;
  }

  if (session && session.step === "AWAITING_MOVIE_QUERY") {
    await handleMovieSearchInput(botToken, chatId, session.cityCode, text, env);
    return;
  }

  if (session && session.step === "AWAITING_MOVIE_INPUT") {
    const parsed = parseBmsUrl(text);
    if (parsed.eventCode) {
      await clearSession(env, chatId);
      await sendFormatSelection(botToken, chatId, session.cityCode, session.venueCode, parsed.eventCode);
    } else {
      await sendTelegram(botToken, chatId,
        "⚠️ Could not find a valid BookMyShow event code in your message.\n\n" +
        "Please paste a valid BookMyShow URL (e.g. `https://in.bookmyshow.com/.../ET00516731`) or code like `ET00516731`."
      );
    }
    return;
  }

  // Check if user spontaneously sent a BookMyShow URL or Event Code
  const parsed = parseBmsUrl(text);
  if (parsed.eventCode) {
    const cityCode = parsed.cityCode || "HYD";
    await sendMovieTheatreSelection(botToken, chatId, cityCode, parsed.eventCode, 0, null, env);
    return;
  }

  // Default fallback
  await sendTelegram(botToken, chatId,
    "👋 Hello! Send /start to begin tracking movie tickets, or paste a BookMyShow link!"
  );
}

// Parse BMS URL or Event Code
function parseBmsUrl(input) {
  const codeMatch = input.match(/ET\d{6,10}/i);
  const eventCode = codeMatch ? codeMatch[0].toUpperCase() : null;

  let cityCode = "HYD";
  const lower = input.toLowerCase();
  for (const [c, info] of Object.entries(TOP_CITIES)) {
    if (lower.includes(`/${info.slug}/`) || lower.includes(`/${info.name.toLowerCase()}/`)) {
      cityCode = c;
      break;
    }
  }

  return { eventCode, cityCode };
}

// -------------------------------------------------------------
// STEP 1: CITY SELECTION & SEARCH
// -------------------------------------------------------------

async function getAvailableCities(env) {
  const cities = [...POPULAR_CITIES];
  if (env && env.TRACKER_DB) {
    try {
      const customRaw = await env.TRACKER_DB.get("custom_cities");
      if (customRaw) {
        const customList = JSON.parse(customRaw);
        for (const c of customList) {
          if (!cities.find(x => x.code === c.code)) {
            cities.push({ code: c.code, name: c.name });
          }
        }
      }
    } catch (e) {}
  }
  return cities;
}

async function sendCitySelection(botToken, chatId, messageId = null, env = null) {
  const availableCities = await getAvailableCities(env);
  const buttons = [];
  for (let i = 0; i < availableCities.length; i += 2) {
    const row = [
      { text: `🏙️ ${availableCities[i].name}`, callback_data: `c:${availableCities[i].code}` }
    ];
    if (i + 1 < availableCities.length) {
      row.push({ text: `🏙️ ${availableCities[i + 1].name}`, callback_data: `c:${availableCities[i + 1].code}` });
    }
    buttons.push(row);
  }

  buttons.push([
    { text: "➕ Request / Search Another City", callback_data: "act:request_city" }
  ]);
  buttons.push([
    { text: "📋 View Active Trackers", callback_data: "act:list" }
  ]);

  const configuredChatId = String(env?.TELEGRAM_CHAT_ID || "").trim().replace(/['"]/g, "");
  if (configuredChatId && String(chatId) === configuredChatId) {
    buttons.push([
      { text: "👑 Admin Dashboard", callback_data: "act:admin_panel" }
    ]);
  }

  const text =
    "📍 *Step 1/4: Choose Your City*\n\n" +
    "Select from available cities below, or request any other city in India:";

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
  } else {
    await sendTelegram(botToken, chatId, text, { inline_keyboard: buttons });
  }
}

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

async function registerCustomCity(city, env) {
  if (!env || !env.TRACKER_DB) return;
  try {
    await env.TRACKER_DB.put(`city:${city.code}`, JSON.stringify(city), { expirationTtl: 86400 * 30 });
    let current = [];
    const raw = await env.TRACKER_DB.get("custom_cities");
    if (raw) {
      try { current = JSON.parse(raw); } catch (e) {}
    }
    if (!current.find(c => c.code === city.code)) {
      current.push({ code: city.code, name: city.name, slug: city.slug, lat: city.lat, lon: city.lon });
      await env.TRACKER_DB.put("custom_cities", JSON.stringify(current), { expirationTtl: 86400 * 30 });
    }
  } catch (err) {
    console.error("Error registering custom city:", err);
  }
}

async function handleCityRequestInput(botToken, chatId, text, env) {
  const q = text.toLowerCase().trim();
  const configuredChatId = String(env?.TELEGRAM_CHAT_ID || "").trim().replace(/['"]/g, "");

  if (q === "/cancel") {
    await clearSession(env, chatId);
    await sendCitySelection(botToken, chatId, null, env);
    return;
  }

  // 1. Check if city already exists in TOP_CITIES
  for (const [code, c] of Object.entries(TOP_CITIES)) {
    if (c.name.toLowerCase() === q || code.toLowerCase() === q || c.slug.toLowerCase() === q) {
      await clearSession(env, chatId);
      await sendTelegram(botToken, chatId, `🏙️ *${c.name} is already available!*`, {
        inline_keyboard: [
          [{ text: `🎬 View Movies in ${c.name}`, callback_data: `c:${c.code}` }],
          [{ text: "« Back to Cities", callback_data: "act:cities" }]
        ]
      });
      return;
    }
  }

  // 2. Search against BMS_ALL_REGIONS
  const exactMatches = [];
  const partialMatches = [];

  for (const [code, c] of Object.entries(BMS_ALL_REGIONS)) {
    const cname = c.name.toLowerCase();
    const cslug = c.slug.toLowerCase();
    const ccode = code.toLowerCase();

    if (cname === q || cslug === q || ccode === q) {
      exactMatches.push(c);
    } else if (cname.includes(q) || q.includes(cname) || cslug.includes(q)) {
      partialMatches.push(c);
    } else if (q.length >= 4) {
      const dist = levenshteinDistance(q, cname);
      if (dist <= 2) {
        partialMatches.push(c);
      }
    }
  }

  if (exactMatches.length > 0) {
    const city = exactMatches[0];
    await registerCustomCity(city, env);
    if (configuredChatId) {
      await sendTelegram(botToken, configuredChatId, `🔔 *New City Added via Request!*\nCity: *${city.name}* (${city.code})\nRequested by user: \`${chatId}\``);
    }
    await clearSession(env, chatId);
    await sendTelegram(botToken, chatId,
      `✅ *${city.name} has been added!*\n\nYou can now browse movies and track shows in *${city.name}*.`,
      {
        inline_keyboard: [
          [{ text: `🎬 View Movies in ${city.name}`, callback_data: `c:${city.code}` }],
          [{ text: "« Back to Cities", callback_data: "act:cities" }]
        ]
      }
    );
    return;
  }

  if (partialMatches.length > 0) {
    const buttons = [];
    for (const c of partialMatches.slice(0, 5)) {
      buttons.push([{ text: `🏙️ Add ${c.name} (${c.code})`, callback_data: `add_city:${c.code}` }]);
    }
    buttons.push([{ text: "🔁 Try Another Name", callback_data: "act:request_city" }]);
    buttons.push([{ text: "« Back to Cities", callback_data: "act:cities" }]);

    await sendTelegram(botToken, chatId,
      `🤔 We found close matches on BookMyShow for "*${text}*". Did you mean one of these?`,
      { inline_keyboard: buttons }
    );
    return;
  }

  // Not found
  const keyboard = {
    inline_keyboard: [
      [{ text: "🔁 Try Again", callback_data: "act:request_city" }],
      [{ text: "« Back to Cities", callback_data: "act:cities" }]
    ]
  };
  await sendTelegram(botToken, chatId,
    `❌ *City Not Found on BookMyShow India*\n\nWe couldn't find a city matching "*${text}*".\n\nPlease check your spelling and try again (e.g., *Pune*, *Chennai*, *Jaipur*, *Kolkata*, *Ahmedabad*, *Kochi*).`,
    keyboard
  );
}

async function searchCities(query, env) {
  const q = query.toLowerCase().trim();
  const results = [];

  // 1. Search in local core cities
  for (const [code, c] of Object.entries(TOP_CITIES)) {
    if (c.name.toLowerCase().includes(q) || code.toLowerCase() === q || c.slug.toLowerCase().includes(q)) {
      results.push(c);
    }
  }

  // 2. Search in custom_cities from KV
  if (env && env.TRACKER_DB) {
    try {
      const customRaw = await env.TRACKER_DB.get("custom_cities");
      if (customRaw) {
        const customList = JSON.parse(customRaw);
        for (const c of customList) {
          if (!results.find(r => r.code === c.code)) {
            if (c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || (c.slug && c.slug.toLowerCase().includes(q))) {
              results.push(c);
            }
          }
        }
      }
    } catch (e) {}
  }

  // 3. Search in all 87 known BookMyShow cities index
  for (const [code, c] of Object.entries(BMS_ALL_REGIONS)) {
    if (!results.find(r => r.code === code)) {
      if (c.name.toLowerCase().includes(q) || code.toLowerCase() === q || c.slug.toLowerCase().includes(q)) {
        results.push(c);
      }
    }
  }

  return results;
}


async function resolveCity(cityCode, env) {
  if (TOP_CITIES[cityCode]) return TOP_CITIES[cityCode];
  if (env && env.TRACKER_DB) {
    const cached = await env.TRACKER_DB.get(`city:${cityCode}`);
    if (cached) return JSON.parse(cached);
  }
  return {
    code: cityCode,
    name: cityCode,
    slug: cityCode.toLowerCase(),
    lat: "17.385",
    lon: "78.487"
  };
}


function cleanBaseTitle(title) {
  if (!title) return "";
  return title
    .replace(/\s*\([^)]+\)$/, "")
    .replace(/[:\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupCityMovies(rawMovies) {
  const groups = new Map();
  for (const m of rawMovies) {
    const rawTitle = typeof m === "string" ? m : (m.title || m.code);
    const code = typeof m === "string" ? m : m.code;
    const base = cleanBaseTitle(rawTitle);
    const mFormat = rawTitle.match(/\(([^)]+)\)$/);
    const formatTag = mFormat ? mFormat[1].trim() : "";

    if (!groups.has(base)) {
      groups.set(base, {
        masterCode: code,
        baseTitle: base,
        variants: []
      });
    }

    const g = groups.get(base);
    if (!g.variants.some(v => v.code === code)) {
      g.variants.push({
        code: code,
        formatTag: formatTag,
        fullTitle: rawTitle
      });
    }
  }
  return Array.from(groups.values());
}

async function getMovieGroup(cityCode, masterCode, env) {
  const { movies } = await fetchMoviesForCity(cityCode, "ALL", true, env);
  const groups = groupCityMovies(movies);
  let found = groups.find(g => g.masterCode === masterCode || g.variants.some(v => v.code === masterCode));
  
  if (!found) {
    const title = await resolveMovieTitle(masterCode, null, cityCode, env);
    const base = cleanBaseTitle(title);
    found = groups.find(g => cleanBaseTitle(g.baseTitle).toLowerCase() === base.toLowerCase());
  }

  if (found) {
    // Merge known sibling codes so all format variants (PCX, 3D, 2D) are present
    const allSiblingCodes = new Set();
    if (typeof MULTILINGUAL_SIBLINGS !== "undefined" && MULTILINGUAL_SIBLINGS[masterCode]) {
      MULTILINGUAL_SIBLINGS[masterCode].forEach(c => allSiblingCodes.add(c));
    }
    for (const v of found.variants) {
      if (typeof MULTILINGUAL_SIBLINGS !== "undefined" && MULTILINGUAL_SIBLINGS[v.code]) {
        MULTILINGUAL_SIBLINGS[v.code].forEach(c => allSiblingCodes.add(c));
      }
    }
    for (const sc of allSiblingCodes) {
      if (!found.variants.some(v => v.code === sc)) {
        const title = (typeof MOVIES_CATALOG !== "undefined" && MOVIES_CATALOG[sc]) || "";
        const mFmt = title.match(/\(([^)]+)\)$/);
        found.variants.push({
          code: sc,
          formatTag: mFmt ? mFmt[1].trim() : "2D",
          fullTitle: title || found.baseTitle
        });
      }
    }
    return found;
  }

  const siblings = (typeof MULTILINGUAL_SIBLINGS !== "undefined" && MULTILINGUAL_SIBLINGS[masterCode]) || [masterCode];
  const variants = [];
  for (const c of siblings) {
    const t = await resolveMovieTitle(c, null, cityCode, env);
    const mFmt = t.match(/\(([^)]+)\)$/);
    variants.push({ code: c, formatTag: mFmt ? mFmt[1].trim() : "2D", fullTitle: t });
  }
  const title = await resolveMovieTitle(masterCode, null, cityCode, env);
  return { masterCode, baseTitle: cleanBaseTitle(title) || title, variants };
}

// -------------------------------------------------------------
// STEP 2: MOVIE SELECTION IN CITY (BOOKMYSHOW FLOW)
// -------------------------------------------------------------

async function sendCityMovieSelection(botToken, chatId, cityCode, page = 0, messageId = null, env = null) {
  const city = await resolveCity(cityCode, env);
  const { movies } = await fetchMoviesForCity(cityCode, "ALL", true, env);
  const groups = groupCityMovies(movies);

  const totalMovies = groups.length;
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(totalMovies / pageSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice = groups.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const buttons = [];
  for (const g of slice) {
    const fmtCount = g.variants.length > 1 ? ` (${g.variants.length} formats)` : "";
    const rawLabel = `${g.baseTitle}${fmtCount}`;
    const label = rawLabel.length > 36 ? rawLabel.slice(0, 34) + "…" : rawLabel;
    buttons.push([
      { text: `🎬 ${label}`, callback_data: `mvt:${cityCode}:${g.masterCode}:0` }
    ]);
  }

  // Pagination navigation row
  if (totalPages > 1) {
    const navRow = [];
    if (safePage > 0) {
      navRow.push({ text: "◀️ Prev", callback_data: `mv_p:${cityCode}:${safePage - 1}` });
    } else {
      navRow.push({ text: "·", callback_data: "noop" });
    }
    navRow.push({ text: `📄 ${safePage + 1}/${totalPages}`, callback_data: "noop" });
    if (safePage < totalPages - 1) {
      navRow.push({ text: "Next ▶️", callback_data: `mv_p:${cityCode}:${safePage + 1}` });
    } else {
      navRow.push({ text: "·", callback_data: "noop" });
    }
    buttons.push(navRow);
  }

  // Search Movie button
  buttons.push([
    { text: `🔍 Search Movie in ${city.name}`, callback_data: `act:search_mv:${cityCode}` }
  ]);

  // Option to browse all theatres in city directly
  buttons.push([
    { text: `🏛️ Browse Theatres in ${city.name}`, callback_data: `thp:${cityCode}:0:` }
  ]);

  // Back button
  buttons.push([
    { text: "« Back to Cities", callback_data: "act:cities" }
  ]);

  const text =
    `🎬 *Step 2/4: Choose Movie in ${city.name}*\n\n` +
    `Found *${totalMovies}* active movie(s) showing in *${city.name}*:\n\n` +
    `Select a movie below to see all theatres & showtimes:`;

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
  } else {
    await sendTelegram(botToken, chatId, text, { inline_keyboard: buttons });
  }
}

// -------------------------------------------------------------
// STEP 3: THEATRE SELECTION FOR MOVIE (BOOKMYSHOW FLOW)
// -------------------------------------------------------------

async function sendMovieTheatreSelection(botToken, chatId, cityCode, masterCode, page = 0, messageId = null, env = null) {
  const city = await resolveCity(cityCode, env);
  const movieGroup = await getMovieGroup(cityCode, masterCode, env);
  const movieTitle = movieGroup?.baseTitle || await resolveMovieTitle(masterCode, null, cityCode, env);

  const theatres = await findTheatresForMovieGroup(cityCode, movieGroup, env);
  const totalTheatres = theatres.length;
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(totalTheatres / pageSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice = theatres.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const buttons = [];
  // "All Theatres" option
  if (totalTheatres > 0) {
    buttons.push([
      { text: `⭐ All Theatres in ${city.name} (${totalTheatres} cinemas)`, callback_data: `th_shows:${cityCode}:ALL:${masterCode}` }
    ]);
  }

  for (const th of slice) {
    const cleanFormats = (th.formats || []).filter(f => {
      if (!f) return false;
      const l = f.trim().toLowerCase();
      return l !== "standard" && l !== "standard screen";
    });
    const fmtStr = cleanFormats.length > 0 ? ` (${cleanFormats.slice(0, 3).join(", ")})` : "";
    const rawLabel = `${th.name}${fmtStr}`;
    const label = rawLabel.length > 36 ? rawLabel.slice(0, 34) + "…" : rawLabel;
    buttons.push([
      { text: `🏛️ ${label}`, callback_data: `th_shows:${cityCode}:${th.code}:${masterCode}` }
    ]);
  }

  // Pagination navigation row
  if (totalPages > 1) {
    const navRow = [];
    if (safePage > 0) {
      navRow.push({ text: "◀️ Prev", callback_data: `mvt_p:${cityCode}:${masterCode}:${safePage - 1}` });
    } else {
      navRow.push({ text: "·", callback_data: "noop" });
    }
    navRow.push({ text: `📄 ${safePage + 1}/${totalPages}`, callback_data: "noop" });
    if (safePage < totalPages - 1) {
      navRow.push({ text: "Next ▶️", callback_data: `mvt_p:${cityCode}:${masterCode}:${safePage + 1}` });
    } else {
      navRow.push({ text: "·", callback_data: "noop" });
    }
    buttons.push(navRow);
  }

  // Back button
  buttons.push([
    { text: `« Back to Movies (${city.name})`, callback_data: `c:${cityCode}` }
  ]);

  let statusText = "";
  if (totalTheatres === 0) {
    statusText = `❌ *No Theatres Available*\n\n` +
      `No theatres in *${city.name}* are currently showing *${movieTitle}*.\n\n` +
      `Please select a different movie from the list:`;
  } else {
    statusText = `Showing at *${totalTheatres}* theatre(s) in ${city.name}.\n` +
      `Select a cinema below to view all screen formats & shows:`;
  }

  const text =
    `🏛️ *Step 3/4: Choose Theatre for ${movieTitle}*\n\n` +
    `• City: *${city.name}*\n` +
    `• Movie: *${movieTitle}*\n\n` +
    statusText;

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
  } else {
    await sendTelegram(botToken, chatId, text, { inline_keyboard: buttons });
  }
}

async function findTheatresForMovieGroup(cityCode, movieGroup, env) {
  const allVenues = await fetchVenuesForCity(cityCode, env);
  const variantCodes = new Set(movieGroup.variants.map(v => v.code));
  
  if (typeof MULTILINGUAL_SIBLINGS !== "undefined") {
    for (const v of movieGroup.variants) {
      if (MULTILINGUAL_SIBLINGS[v.code]) {
        MULTILINGUAL_SIBLINGS[v.code].forEach(c => variantCodes.add(c));
      }
    }
    if (MULTILINGUAL_SIBLINGS[movieGroup.masterCode]) {
      MULTILINGUAL_SIBLINGS[movieGroup.masterCode].forEach(c => variantCodes.add(c));
    }
  }

  const matchingTheatres = [];

  // Preload city-bundled venues map once (1 single KV read for the entire city!)
  let cityVenuesMap = null;
  if (env && env.TRACKER_DB && cityCode) {
    try {
      const cityRaw = await env.TRACKER_DB.get(`v_movies_city:${cityCode}`);
      if (cityRaw) cityVenuesMap = JSON.parse(cityRaw);
    } catch (e) {}
  }

  // 1. Check KV cityVenuesMap first, then local in-memory VENUE_MOVIES_MAP
  // CRITICAL: NEVER do env.TRACKER_DB.get in a loop here! Cloudflare Workers Free limits subrequests to 50 per invocation.
  for (const v of allVenues) {
    let list = cityVenuesMap ? cityVenuesMap[v.code] : null;
    if (!list && typeof VENUE_MOVIES_MAP !== "undefined" && VENUE_MOVIES_MAP[v.code]) {
      list = VENUE_MOVIES_MAP[v.code];
    }
    if (list && Array.isArray(list)) {
      const matched = list.filter(m => variantCodes.has(m.code || m));
      if (matched.length > 0) {
        let formats = matched.map(m => {
          const c = m.code || m;
          const title = m.title || (typeof MOVIES_CATALOG !== "undefined" ? MOVIES_CATALOG[c] : "") || "";
          const match = title.match(/\(([^)]+)\)$/);
          let tag = match ? match[1].replace(/English\s*|Hindi\s*|Telugu\s*|Tamil\s*/i, "").trim() : "2D";
          if (!tag) tag = "2D";
          return tag;
        }).filter(f => f && f.toLowerCase() !== "standard" && f.toLowerCase() !== "standard screen");

        const formatPriority = f => {
          const l = f.toLowerCase();
          if (l.includes("imax") || l.includes("4dx") || l.includes("hdr") || l.includes("barco") || l.includes("screenx") || l.includes("ice") || l.includes("mx4d") || l.includes("infinity")) return 0;
          if (l.includes("3d")) return 1;
          return 2;
        };
        const uniqueFormats = Array.from(new Set(formats)).sort((a, b) => formatPriority(a) - formatPriority(b));

        let variants = matched.map(m => {
          const c = m.code || m;
          const title = m.title || (typeof MOVIES_CATALOG !== "undefined" ? MOVIES_CATALOG[c] : "") || movieGroup.baseTitle;
          const match = title.match(/\(([^)]+)\)$/);
          return {
            code: c,
            formatTag: match ? match[1].trim() : "2D",
            fullTitle: title
          };
        });

        matchingTheatres.push({
          code: v.code,
          name: v.name || v.title || v.code,
          formats: uniqueFormats.length > 0 ? uniqueFormats : ["2D"],
          variants: variants
        });
      }
    }
  }

  // 2. If matching theatres found, return them immediately!
  if (matchingTheatres.length > 0) {
    return matchingTheatres;
  }

  // 3. Fallback: Query live BookMyShow SHOWTIMES_API
  try {
    const liveTheatres = await fetchTheatresForMovieLive(cityCode, Array.from(variantCodes), env);
    if (liveTheatres && liveTheatres.length > 0) {
      return liveTheatres;
    }
  } catch (e) {}

  // 4. A user should only see the theatres that have that movie. If none found, return empty array.
  return [];
}

async function fetchTheatresForMovieLive(cityCode, eventCodes, env) {
  const city = await resolveCity(cityCode, env);
  const venuesMap = new Map();
  const codesToCheck = eventCodes.slice(0, 4);

  for (const ev of codesToCheck) {
    const url = `${SHOWTIMES_API}?eventCode=${ev}&isDesktop=true&regionCode=${cityCode}&lat=${city.lat}&lon=${city.lon}`;
    try {
      const res = await fetch(url, { headers: getHeaders(cityCode, city.slug, city.lat, city.lon) });
      if (!res.ok) continue;
      const json = await res.json();
      for (const w of json.data?.showtimeWidgets || []) {
        if (w.type !== "groupList") continue;
        for (const grp of w.data || []) {
          for (const item of grp.data || []) {
            const vCode = item.additionalData?.venueCode;
            const vName = item.additionalData?.venueName;
            if (!vCode || !vName) continue;

            if (!venuesMap.has(vCode)) {
              venuesMap.set(vCode, {
                code: vCode,
                name: vName,
                formats: new Set(),
                variants: [],
                shows: []
              });
            }
            const vEntry = venuesMap.get(vCode);
            for (const s of item.showtimes || []) {
              let fmt = s.screenAttr || s.additionalData?.screenName || "2D";
              const fLower = fmt.toLowerCase();
              if (fLower === "standard" || fLower === "standard screen") {
                fmt = "2D";
              }
              vEntry.formats.add(fmt);
              const sTime = s.title || s.additionalData?.showTime;
              if (sTime && !vEntry.shows.includes(sTime)) vEntry.shows.push(`${sTime} (${fmt})`);
            }
            if (!vEntry.variants.some(v => v.code === ev)) {
              const title = await resolveMovieTitle(ev, vCode, cityCode, env);
              const mFmt = title.match(/\(([^)]+)\)$/);
              vEntry.variants.push({
                code: ev,
                formatTag: mFmt ? mFmt[1].trim() : "2D",
                fullTitle: title
              });
            }
          }
        }
      }
    } catch (e) {}
  }

  return Array.from(venuesMap.values()).map(v => ({
    code: v.code,
    name: v.name || v.title || v.code,
    formats: Array.from(v.formats),
    variants: v.variants,
    shows: v.shows
  }));
}

// -------------------------------------------------------------
// STEP 4: SHOWS & FORMATS INSIDE THEATRE (BOOKMYSHOW FLOW)
// -------------------------------------------------------------

function formatScreenLabel(tag, venueCode = "") {
  const cleanTag = (tag || "").trim();
  const lower = cleanTag.toLowerCase();
  
  const isPremium = lower.includes("imax") ||
    lower.includes("4dx") ||
    lower.includes("hdr") ||
    lower.includes("barco") ||
    lower.includes("pcx") ||
    lower.includes("screenx") ||
    lower.includes("ice") ||
    lower.includes("mx4d") ||
    lower.includes("infinity");

  let emoji = "🎟️";
  if (isPremium) {
    emoji = "🌟";
  } else if (lower.includes("3d")) {
    emoji = "👓";
  }

  // Preserve exact BookMyShow format name without artificial aliases
  const label = cleanTag || "2D";
  return { emoji, label, isPremium };
}

async function sendTheatreShowsSelection(botToken, chatId, cityCode, venueCode, masterCode, messageId = null, env = null) {
  const city = await resolveCity(cityCode, env);
  const movieGroup = await getMovieGroup(cityCode, masterCode, env);
  const baseTitle = movieGroup?.baseTitle || cleanBaseTitle(await resolveMovieTitle(masterCode, venueCode, cityCode, env));

  let venueName = "";
  if (venueCode === "ALL") {
    venueName = `All Theatres in ${city.name}`;
  } else {
    const venues = await fetchVenuesForCity(cityCode, env);
    const vObj = venues.find(v => v.code === venueCode);
    venueName = vObj?.name || venueCode;
  }

  const showsData = await getShowsForVenueAndMovie(cityCode, venueCode, movieGroup, env);
  const { variants, showSummaries, hasPremium, hasMultiLang, primaryCode } = showsData;

  const keyboardButtons = [];
  const premiumVariants = [];

  // Sort variants so Premium screens (PCX, IMAX, 4DX) appear first, followed by 3D, followed by 2D / Standard
  const sortedVariants = [...variants].sort((a, b) => {
    const fA = formatScreenLabel(a.formatTag, venueCode);
    const fB = formatScreenLabel(b.formatTag, venueCode);
    if (fA.isPremium && !fB.isPremium) return -1;
    if (!fA.isPremium && fB.isPremium) return 1;
    const aLower = (a.formatTag || "").toLowerCase();
    const bLower = (b.formatTag || "").toLowerCase();
    if (aLower.includes("3d") && !bLower.includes("3d")) return -1;
    if (!aLower.includes("3d") && bLower.includes("3d")) return 1;
    return 0;
  });

  // 1. Dedicated button for each specific format variant playing at this theatre (properly bifurcated)
  if (variants.length > 0) {
    for (const v of sortedVariants) {
      const f = formatScreenLabel(v.formatTag, venueCode);
      if (f.isPremium && !premiumVariants.includes(f.label)) {
        premiumVariants.push(f.label);
      }
      keyboardButtons.push([
        { text: `${f.emoji} Track ONLY ${f.label}`, callback_data: `flt:${cityCode}:${venueCode}:${v.code}:EXACT` }
      ]);
    }

    // 2. If multiple distinct premium screens available (e.g. IMAX and MX4D), offer bundle
    if (premiumVariants.length >= 2) {
      keyboardButtons.push([
        { text: `🌟 Any Premium Screen (${premiumVariants.join(" / ")})`, callback_data: `flt:${cityCode}:${venueCode}:${primaryCode}:PCX` }
      ]);
    }

    // 3. If multi-lingual available
    if (hasMultiLang) {
      keyboardButtons.push([
        { text: "🌐 Track Both English & Hindi Shows", callback_data: `flt:${cityCode}:${venueCode}:${primaryCode}:BOTH` }
      ]);
    }

    // 4. Any show / format option
    keyboardButtons.push([
      { text: `🎟️ All Shows at ${venueName}`, callback_data: `flt:${cityCode}:${venueCode}:${primaryCode}:ALL` }
    ]);
  } else {
    // Shows have not opened yet for this movie at this venue on BookMyShow
    keyboardButtons.push([
      { text: `🎟️ Alert Me When Shows Open at This Cinema`, callback_data: `flt:${cityCode}:${venueCode}:${primaryCode}:ALL` }
    ]);
  }

  // Back button
  keyboardButtons.push([
    { text: "« Back to Theatres", callback_data: `mvt:${cityCode}:${masterCode}:0` }
  ]);

  let showListText = "";
  if (showSummaries && showSummaries.length > 0) {
    showListText = "\n\n*Live Shows on BookMyShow:*\n" + showSummaries.slice(0, 5).map(s => `• ${s}`).join("\n");
  }

  let statusInstruction = "";
  if (variants.length > 0) {
    statusInstruction = "\n\nChoose which confirmed show, screen format, or language version to track:";
  } else {
    statusInstruction = "\n\nℹ️ *Shows have not opened yet for this movie at this cinema hall on BookMyShow.*\n\nYou can set an alert below to be notified instantly the moment bookings open!";
  }

  const text =
    `🎯 *Step 4/4: Screen & Format Selection*\n\n` +
    `• City: *${city.name}*\n` +
    `• Theatre: *${venueName}*\n` +
    `• Movie: *${baseTitle}*` +
    showListText +
    statusInstruction;

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: keyboardButtons });
  } else {
    await sendTelegram(botToken, chatId, text, { inline_keyboard: keyboardButtons });
  }
}

async function getShowsForVenueAndMovie(cityCode, venueCode, movieGroup, env) {
  let variants = [];
  const showSummaries = [];

  if (venueCode === "ALL") {
    variants = [...movieGroup.variants];
  } else {
    let vList = null;
    if (cityCode && env && env.TRACKER_DB) {
      try {
        const cityRaw = await env.TRACKER_DB.get(`v_movies_city:${cityCode}`);
        if (cityRaw) {
          const cvMap = JSON.parse(cityRaw);
          if (cvMap && cvMap[venueCode]) vList = cvMap[venueCode];
        }
      } catch (e) {}
    }
    if (!vList && env && env.TRACKER_DB) {
      try {
        const raw = await env.TRACKER_DB.get(`v_movies:${venueCode}`);
        if (raw) vList = JSON.parse(raw);
      } catch (e) {}
    }
    if (!vList && typeof VENUE_MOVIES_MAP !== "undefined" && VENUE_MOVIES_MAP[venueCode]) {
      vList = VENUE_MOVIES_MAP[venueCode];
    }
    if (vList && Array.isArray(vList)) {
      const vCodes = new Set(movieGroup.variants.map(v => v.code));
      if (typeof MULTILINGUAL_SIBLINGS !== "undefined") {
        for (const v of movieGroup.variants) {
          if (MULTILINGUAL_SIBLINGS[v.code]) MULTILINGUAL_SIBLINGS[v.code].forEach(c => vCodes.add(c));
        }
        if (MULTILINGUAL_SIBLINGS[movieGroup.masterCode]) {
          MULTILINGUAL_SIBLINGS[movieGroup.masterCode].forEach(c => vCodes.add(c));
        }
      }
      const matched = vList.filter(m => vCodes.has(m.code || m));
      if (matched.length > 0) {
        variants = matched.map(m => {
          const c = m.code || m;
          const mTitle = m.title || (typeof MOVIES_CATALOG !== "undefined" ? MOVIES_CATALOG[c] : "") || movieGroup.baseTitle;
          const mFmt = mTitle.match(/\(([^)]+)\)$/);
          return {
            code: c,
            formatTag: mFmt ? mFmt[1].trim() : "2D",
            fullTitle: mTitle
          };
        });
      }
    }

    // Ultimate fallback: if KV had stale/partial data for this venue that didn't include
    // this movie's codes, vList was set (non-null) so the VENUE_MOVIES_MAP branch above was
    // skipped. We retry against the static map here so known venues never show "not opened".
    if (variants.length === 0 && typeof VENUE_MOVIES_MAP !== "undefined" && VENUE_MOVIES_MAP[venueCode]) {
      const staticList = VENUE_MOVIES_MAP[venueCode];
      if (Array.isArray(staticList)) {
        const vCodes2 = new Set(movieGroup.variants.map(v => v.code));
        if (typeof MULTILINGUAL_SIBLINGS !== "undefined") {
          for (const v of movieGroup.variants) {
            if (MULTILINGUAL_SIBLINGS[v.code]) MULTILINGUAL_SIBLINGS[v.code].forEach(c => vCodes2.add(c));
          }
          if (MULTILINGUAL_SIBLINGS[movieGroup.masterCode]) {
            MULTILINGUAL_SIBLINGS[movieGroup.masterCode].forEach(c => vCodes2.add(c));
          }
        }
        const matched2 = staticList.filter(m => vCodes2.has(m.code || m));
        if (matched2.length > 0) {
          variants = matched2.map(m => {
            const c = m.code || m;
            const mTitle = m.title || (typeof MOVIES_CATALOG !== "undefined" ? MOVIES_CATALOG[c] : "") || movieGroup.baseTitle;
            const mFmt = mTitle.match(/\(([^)]+)\)$/);
            return {
              code: c,
              formatTag: mFmt ? mFmt[1].trim() : "2D",
              fullTitle: mTitle
            };
          });
        }
      }
    }
  }

  let hasPremium = false;
  let hasEnglish = false;
  let hasHindi = false;

  for (const v of variants) {
    const lower = (v.formatTag || "").toLowerCase();
    if (lower.includes("imax") || lower.includes("4dx") || lower.includes("hdr") || lower.includes("barco") || lower.includes("pcx") || lower.includes("screenx") || lower.includes("ice") || lower.includes("mx4d") || lower.includes("infinity")) {
      hasPremium = true;
    }
    if (lower.includes("english")) hasEnglish = true;
    if (lower.includes("hindi")) hasHindi = true;
  }

  const hasMultiLang = hasEnglish && hasHindi;
  const primaryCode = variants[0]?.code || movieGroup.masterCode;

  return { variants, showSummaries, hasPremium, hasMultiLang, primaryCode };
}

// -------------------------------------------------------------
// STEP 2: THEATRE SELECTION, SEARCH & PAGINATION
// -------------------------------------------------------------

async function sendTheatreSelection(botToken, chatId, cityCode, page = 0, messageId = null, env = null, preselectedEventCode = "") {
  const city = await resolveCity(cityCode, env);
  const venues = await fetchVenuesForCity(cityCode, env);

  const PAGE_SIZE = 6;
  const totalVenues = venues.length;
  const totalPages = Math.max(1, Math.ceil(totalVenues / PAGE_SIZE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));

  const startIdx = safePage * PAGE_SIZE;
  const pageVenues = venues.slice(startIdx, startIdx + PAGE_SIZE);

  const buttons = [];
  // All Theatres button
  buttons.push([
    { text: `⭐ All Theatres in ${city.name} (${totalVenues})`, callback_data: `th:${cityCode}:ALL:${preselectedEventCode || ""}` }
  ]);

  // Venue buttons on this page
  for (const v of pageVenues) {
    const label = v.name.length > 36 ? v.name.slice(0, 34) + "…" : v.name;
    buttons.push([
      { text: `🏛️ ${label}`, callback_data: `th:${cityCode}:${v.code}:${preselectedEventCode || ""}` }
    ]);
  }

  // Pagination navigation row
  if (totalPages > 1) {
    const navRow = [];
    if (safePage > 0) {
      navRow.push({ text: "◀️ Prev", callback_data: `thp:${cityCode}:${safePage - 1}:${preselectedEventCode || ""}` });
    } else {
      navRow.push({ text: "·", callback_data: "noop" });
    }

    navRow.push({ text: `📄 ${safePage + 1}/${totalPages}`, callback_data: "noop" });

    if (safePage < totalPages - 1) {
      navRow.push({ text: "Next ▶️", callback_data: `thp:${cityCode}:${safePage + 1}:${preselectedEventCode || ""}` });
    } else {
      navRow.push({ text: "·", callback_data: "noop" });
    }
    buttons.push(navRow);
  }

  // Search Theatre button
  buttons.push([
    { text: `🔍 Search Theatre in ${city.name}`, callback_data: `act:search_th:${cityCode}` }
  ]);

  // Back button
  buttons.push([
    { text: "« Back to Cities", callback_data: "act:cities" }
  ]);

  const text =
    `🏛️ *Step 2/4: Choose Theatre in ${city.name}*\n\n` +
    `Found *${totalVenues}* theatres. Select a cinema below, or choose *All Theatres*:`;

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
  } else {
    await sendTelegram(botToken, chatId, text, { inline_keyboard: buttons });
  }
}

async function handleTheatreSearchInput(botToken, chatId, cityCode, query, env) {
  const city = await resolveCity(cityCode, env);
  const venues = await fetchVenuesForCity(cityCode, env);
  const q = query.toLowerCase().trim();

  const matched = venues.filter(v => 
    v.name.toLowerCase().includes(q) || 
    v.code.toLowerCase().includes(q) ||
    (v.subRegion && v.subRegion.toLowerCase().includes(q))
  );

  if (matched.length === 0) {
    const keyboard = {
      inline_keyboard: [
        [{ text: `🔍 Search Again in ${city.name}`, callback_data: `act:search_th:${cityCode}` }],
        [{ text: "« Show All Theatres", callback_data: `thp:${cityCode}:0:` }]
      ]
    };
    await sendTelegram(botToken, chatId,
      `❌ No theatres found in *${city.name}* matching "*${query}*".\n\nTry searching for PVR, INOX, Cinepolis, Rave, Miraj, etc.:`,
      keyboard
    );
    return;
  }

  await clearSession(env, chatId);
  const buttons = [];
  for (const v of matched.slice(0, 10)) {
    const label = v.name.length > 36 ? v.name.slice(0, 34) + "…" : v.name;
    buttons.push([{ text: `🏛️ ${label}`, callback_data: `th:${cityCode}:${v.code}:` }]);
  }
  buttons.push([{ text: "🔍 Search Another Theatre", callback_data: `act:search_th:${cityCode}` }]);
  buttons.push([{ text: `« Browse All Theatres (${venues.length})`, callback_data: `thp:${cityCode}:0:` }]);

  await sendTelegram(botToken, chatId,
    `🏛️ *Theatres matching "${query}" in ${city.name}:*`,
    { inline_keyboard: buttons }
  );
}

function cleanVenueName(name, cityName) {
  if (!name) return "";
  let clean = name.trim();
  if (cityName) {
    const target = `: ${cityName.toLowerCase()}`;
    const lower = clean.toLowerCase();
    const idx = lower.lastIndexOf(target);
    if (idx !== -1) clean = clean.slice(0, idx).trim();
  }
  return clean || name;
}

async function fetchVenuesForCity(cityCode, env) {
  // 1. Check pre-loaded 1,397 venues across 87 Indian cities
  if (ALL_VENUES[cityCode] && ALL_VENUES[cityCode].length > 0) {
    return ALL_VENUES[cityCode];
  }

  // 2. Check KV cache
  if (env && env.TRACKER_DB) {
    const cached = await env.TRACKER_DB.get(`venues:${cityCode}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
  }

  // 3. Fallback to live API (if proxy configured or available)
  const city = await resolveCity(cityCode, env);
  const url = `${VENUES_API}?eventType=MT&regionCode=${cityCode}`;

  try {
    const res = await fetch(url, { headers: getHeaders(cityCode, city.slug, city.lat, city.lon) });
    if (res.ok) {
      const data = await res.json();
      const rawVenues = data.venues || [];
      const venues = rawVenues.map(v => ({
        code: v.VenueCode,
        name: cleanVenueName(v.VenueName, city.name),
        subRegion: v.SubRegionName || "",
        isPopular: v.tag === "POPULARITY"
      }));

      if (env && env.TRACKER_DB && venues.length > 0) {
        await env.TRACKER_DB.put(`venues:${cityCode}`, JSON.stringify(venues), { expirationTtl: 3600 * 24 });
      }
      return venues;
    }
  } catch (err) {
    console.error(`Error fetching venues for ${cityCode}:`, err);
  }

  return [];
}

// -------------------------------------------------------------
// STEP 3: MOVIE SELECTION FOR THEATRE (LINKED TO CINEMA HALL)
// -------------------------------------------------------------

async function sendMovieSelection(botToken, chatId, cityCode, venueCode, page = 0, showAllCity = false, messageId = null, env = null) {
  const city = await resolveCity(cityCode, env);
  const venues = await fetchVenuesForCity(cityCode, env);
  const vObj = venues.find(v => v.code === venueCode);
  const venueName = venueCode === "ALL" ? `All Theatres in ${city.name}` : (vObj?.name || venueCode);

  const { movies, isVenueSpecific } = await fetchMoviesForCity(cityCode, venueCode, showAllCity, env);
  const groups = groupCityMovies(movies);
  const totalMovies = groups.length;
  const pageSize = 8;
  const totalPages = Math.ceil(totalMovies / pageSize) || 1;
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice = groups.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const buttons = [];
  for (const g of slice) {
    const fmtList = g.variants.map(v => {
      const match = v.fullTitle?.match(/\(([^)]+)\)$/);
      let tag = match ? match[1].replace(/English\s*|Hindi\s*|Telugu\s*|Tamil\s*/i, "").trim() : "2D";
      if (!tag) tag = "2D";
      return tag;
    });
    const formatPriority = f => {
      const l = f.toLowerCase();
      if (l.includes("imax") || l.includes("4dx") || l.includes("hdr") || l.includes("barco") || l.includes("screenx") || l.includes("ice") || l.includes("mx4d") || l.includes("infinity")) return 0;
      if (l.includes("3d")) return 1;
      return 2;
    };
    const uniqueFmts = Array.from(new Set(fmtList))
      .filter(f => f && f.toLowerCase() !== "standard" && f.toLowerCase() !== "standard screen")
      .sort((a, b) => formatPriority(a) - formatPriority(b));
    const fmtStr = uniqueFmts.length > 1 ? ` (${uniqueFmts.slice(0, 3).join(", ")})` : "";
    const rawLabel = `${g.baseTitle}${fmtStr}`;
    const title = rawLabel.length > 36 ? rawLabel.slice(0, 34) + "…" : rawLabel;
    buttons.push([{ text: `🎬 ${title}`, callback_data: `th_shows:${cityCode}:${venueCode}:${g.masterCode}` }]);
  }

  // Pagination navigation row
  if (totalPages > 1) {
    const navRow = [];
    if (safePage > 0) {
      navRow.push({ text: "◀️ Prev", callback_data: `mvp:${cityCode}:${venueCode}:${safePage - 1}:${showAllCity ? "1" : "0"}` });
    } else {
      navRow.push({ text: "·", callback_data: "noop" });
    }

    navRow.push({ text: `📄 ${safePage + 1}/${totalPages}`, callback_data: "noop" });

    if (safePage < totalPages - 1) {
      navRow.push({ text: "Next ▶️", callback_data: `mvp:${cityCode}:${venueCode}:${safePage + 1}:${showAllCity ? "1" : "0"}` });
    } else {
      navRow.push({ text: "·", callback_data: "noop" });
    }
    buttons.push(navRow);
  }

  // If cinema-specific, allow viewing all city movies
  if (isVenueSpecific && venueCode !== "ALL") {
    buttons.push([
      { text: `🌟 Browse All ${city.name} Movies`, callback_data: `mv_all:${cityCode}:${venueCode}` }
    ]);
  } else if (showAllCity && VENUE_MOVIES_MAP[venueCode]) {
    buttons.push([
      { text: `🏛️ Show Only ${vObj?.name ? vObj.name.slice(0, 24) : "Cinema"}'s Shows`, callback_data: `th:${cityCode}:${venueCode}:` }
    ]);
  }

  // Search Movie button
  buttons.push([
    { text: `🔍 Search Movie by Name`, callback_data: `act:search_mv:${cityCode}:${venueCode}` }
  ]);

  // Paste Custom Link button
  buttons.push([
    { text: "🔗 Paste Custom BMS Link / Code...", callback_data: `custom:${cityCode}:${venueCode}` }
  ]);

  // Back button
  buttons.push([
    { text: "« Back to Theatres", callback_data: `thp:${cityCode}:0:` }
  ]);

  let headerPrefix = `🎬 *Step 3/4: Choose Movie*\n\n• City: *${city.name}*\n• Theatre: *${venueName}*\n\n`;
  if (isVenueSpecific && totalMovies === 0) {
    headerPrefix = `🏛️ *${venueName}*\n• City: *${city.name}*\n\nℹ️ *No active shows currently listed at this cinema hall on BookMyShow.*\n\nYou can track an upcoming movie here using the options below:\n`;
    buttons.length = 0;
    buttons.push([
      { text: `🌟 Browse All ${city.name} Movies to Track Here`, callback_data: `mv_all:${cityCode}:${venueCode}` }
    ]);
    buttons.push([
      { text: `🔍 Search Movie to Track Here`, callback_data: `act:search_mv:${cityCode}:${venueCode}` }
    ]);
    buttons.push([
      { text: "🔗 Paste Custom BMS Link / Code...", callback_data: `custom:${cityCode}:${venueCode}` }
    ]);
    buttons.push([
      { text: "« Back to Theatres", callback_data: `thp:${cityCode}:0:` }
    ]);
  } else if (isVenueSpecific) {
    headerPrefix += `Showing *${totalMovies}* movie(s) playing specifically at this cinema hall:\n`;
  } else {
    headerPrefix += `Select any active movie in *${city.name}* below to track when shows open at this theatre:\n`;
  }

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, headerPrefix, { inline_keyboard: buttons });
  } else {
    await sendTelegram(botToken, chatId, headerPrefix, { inline_keyboard: buttons });
  }
}

async function handleMovieSearchInput(botToken, chatId, cityCode, text, env) {
  const city = await resolveCity(cityCode, env);
  const { movies } = await fetchMoviesForCity(cityCode, "ALL", true, env);
  const groups = groupCityMovies(movies);
  const q = text.toLowerCase().trim();

  const matched = groups.filter(g =>
    g.baseTitle.toLowerCase().includes(q) ||
    g.variants.some(v => v.code.toLowerCase().includes(q) || v.fullTitle.toLowerCase().includes(q))
  );

  if (matched.length === 0) {
    const keyboard = {
      inline_keyboard: [
        [{ text: `🔍 Search Again in ${city.name}`, callback_data: `act:search_mv:${cityCode}` }],
        [{ text: `« Browse All Movies (${groups.length})`, callback_data: `c:${cityCode}` }]
      ]
    };
    await sendTelegram(botToken, chatId,
      `❌ No movies found in *${city.name}* matching "*${text}*".\n\nPlease check spelling or try another movie name:`,
      keyboard
    );
    return;
  }

  await clearSession(env, chatId);
  const buttons = [];
  for (const g of matched.slice(0, 8)) {
    const fmtCount = g.variants.length > 1 ? ` (${g.variants.length} formats)` : "";
    const rawLabel = `${g.baseTitle}${fmtCount}`;
    const label = rawLabel.length > 36 ? rawLabel.slice(0, 34) + "…" : rawLabel;
    buttons.push([{ text: `🎬 ${label}`, callback_data: `mvt:${cityCode}:${g.masterCode}:0` }]);
  }
  buttons.push([{ text: "🔍 Search Another Movie", callback_data: `act:search_mv:${cityCode}` }]);
  buttons.push([{ text: `« Back to All Movies (${groups.length})`, callback_data: `c:${cityCode}` }]);

  await sendTelegram(botToken, chatId,
    `🎬 *Movies matching "${text}" in ${city.name}:*\n\nSelect a movie to view theatres & showtimes:`,
    { inline_keyboard: buttons }
  );
}

async function fetchMoviesForCity(cityCode, venueCode = "ALL", showAllCity = false, env = null) {
  // 1. Check KV cache for venue-specific movies first (dynamic updates take precedence)
  if (venueCode !== "ALL" && !showAllCity && env && env.TRACKER_DB) {
    try {
      let arr = null;
      if (cityCode) {
        const cityRaw = await env.TRACKER_DB.get(`v_movies_city:${cityCode}`);
        if (cityRaw) {
          const cvMap = JSON.parse(cityRaw);
          if (cvMap && cvMap[venueCode]) arr = cvMap[venueCode];
        }
      }
      if (!arr) {
        const cached = await env.TRACKER_DB.get(`v_movies:${venueCode}`);
        if (cached) arr = JSON.parse(cached);
      }
      if (Array.isArray(arr)) {
        const resolved = arr.map(item => {
          if (typeof item === "string") return { code: item, title: MOVIES_CATALOG[item] || item };
          return item;
        });
        return { movies: resolved, isVenueSpecific: true };
      }
    } catch (e) {}
  }

  // 2. Check local preloaded venue mapping
  if (venueCode !== "ALL" && !showAllCity && VENUE_MOVIES_MAP[venueCode] && VENUE_MOVIES_MAP[venueCode].length > 0) {
    const rawList = VENUE_MOVIES_MAP[venueCode];
    const resolved = rawList.map(item => {
      if (typeof item === "string") return { code: item, title: MOVIES_CATALOG[item] || item };
      return item;
    });
    return { movies: resolved, isVenueSpecific: true };
  }

  // 3. Fallback to city-wide movies
  let list = [];
  if (ALL_MOVIES_BY_CITY[cityCode] && ALL_MOVIES_BY_CITY[cityCode].length > 0) {
    list = [...ALL_MOVIES_BY_CITY[cityCode]];
  }
  if (env && env.TRACKER_DB) {
    const cached = await env.TRACKER_DB.get(`movies:${cityCode}`);
    if (cached) {
      try {
        const kvMovies = JSON.parse(cached);
        if (Array.isArray(kvMovies) && kvMovies.length > 0) list = kvMovies;
      } catch (e) {}
    }
  }
  if (list.length === 0) list = [...POPULAR_MOVIES];

  return { movies: list, isVenueSpecific: false };
}

async function resolveMovieTitle(eventCode, venueCode, cityCode, env) {
  // 1. Check venue-specific KV cache first (highest fidelity live from BMS)
  if (env && env.TRACKER_DB && venueCode && venueCode !== "ALL") {
    try {
      let list = null;
      if (cityCode) {
        const cityRaw = await env.TRACKER_DB.get(`v_movies_city:${cityCode}`);
        if (cityRaw) {
          const cvMap = JSON.parse(cityRaw);
          if (cvMap && cvMap[venueCode]) list = cvMap[venueCode];
        }
      }
      if (!list) {
        const vRaw = await env.TRACKER_DB.get(`v_movies:${venueCode}`);
        if (vRaw) list = JSON.parse(vRaw);
      }
      if (Array.isArray(list)) {
        const found = list.find(m => (m.code || m) === eventCode);
        if (found && found.title) return found.title;
      }
    } catch (e) {}
  }

  // 2. Check city-wide KV cache
  if (env && env.TRACKER_DB && cityCode) {
    const cRaw = await env.TRACKER_DB.get(`movies:${cityCode}`);
    if (cRaw) {
      try {
        const list = JSON.parse(cRaw);
        const found = list.find(m => (m.code || m) === eventCode);
        if (found && found.title) return found.title;
      } catch (e) {}
    }
  }

  // 3. Fallback to static MOVIES_CATALOG or POPULAR_MOVIES
  if (typeof MOVIES_CATALOG !== "undefined" && MOVIES_CATALOG[eventCode]) {
    return MOVIES_CATALOG[eventCode];
  }
  const pop = (typeof POPULAR_MOVIES !== "undefined" ? POPULAR_MOVIES : []).find(m => m.code === eventCode);
  return pop?.title || `Movie (${eventCode})`;
}

// -------------------------------------------------------------
// STEP 4: SCREEN & FORMAT SELECTION (TAILORED TO CINEMA)
// -------------------------------------------------------------

async function sendFormatSelection(botToken, chatId, cityCode, venueCode, eventCode, messageId = null, env = null) {
  return sendTheatreShowsSelection(botToken, chatId, cityCode, venueCode, eventCode, messageId, env);
}
// -------------------------------------------------------------
// CALLBACK ACTIONS HANDLER
// -------------------------------------------------------------

async function handleCallbackData(botToken, chatId, messageId, data, env) {
  const parts = data.split(":");
  const action = parts[0];

  // 1. City clicked -> Step 2: Show Movies in City (BookMyShow flow)
  if (action === "c") {
    const cityCode = parts[1];
    await sendCityMovieSelection(botToken, chatId, cityCode, 0, messageId, env);
    return;
  }

  // 2. Movie in City pagination clicked
  if (action === "mv_p") {
    const [, cityCode, pageStr] = parts;
    const page = parseInt(pageStr, 10) || 0;
    await sendCityMovieSelection(botToken, chatId, cityCode, page, messageId, env);
    return;
  }

  // 3. Movie clicked -> Step 3: Show Theatres for Movie
  if (action === "mvt") {
    const [, cityCode, masterCode, pageStr] = parts;
    const page = parseInt(pageStr, 10) || 0;
    await sendMovieTheatreSelection(botToken, chatId, cityCode, masterCode, page, messageId, env);
    return;
  }

  // 4. Theatres pagination for movie clicked
  if (action === "mvt_p") {
    const [, cityCode, masterCode, pageStr] = parts;
    const page = parseInt(pageStr, 10) || 0;
    await sendMovieTheatreSelection(botToken, chatId, cityCode, masterCode, page, messageId, env);
    return;
  }

  // 5. Theatre clicked -> Step 4: Show Shows / Formats inside Theatre
  if (action === "th_shows") {
    const [, cityCode, venueCode, masterCode] = parts;
    await sendTheatreShowsSelection(botToken, chatId, cityCode, venueCode, masterCode, messageId, env);
    return;
  }

  // 2. Theatre pagination
  if (action === "thp") {
    const [, cityCode, pageStr, preselectedEventCode] = parts;
    const page = parseInt(pageStr, 10) || 0;
    await sendTheatreSelection(botToken, chatId, cityCode, page, messageId, env, preselectedEventCode);
    return;
  }

  // 3. Theatre clicked
  if (action === "th") {
    const [, cityCode, venueCode, preselectedEventCode] = parts;
    if (preselectedEventCode) {
      await sendFormatSelection(botToken, chatId, cityCode, venueCode, preselectedEventCode, messageId, env);
    } else {
      await sendMovieSelection(botToken, chatId, cityCode, venueCode, 0, false, messageId, env);
    }
    return;
  }

  // Show all city movies clicked
  if (action === "mv_all") {
    const [, cityCode, venueCode] = parts;
    await sendMovieSelection(botToken, chatId, cityCode, venueCode, 0, true, messageId, env);
    return;
  }

  // Movie pagination clicked
  if (action === "mvp") {
    const [, cityCode, venueCode, pageStr, showAllStr] = parts;
    const page = parseInt(pageStr, 10) || 0;
    const showAll = showAllStr === "1";
    await sendMovieSelection(botToken, chatId, cityCode, venueCode, page, showAll, messageId, env);
    return;
  }

  // 4. Movie clicked
  if (action === "mv") {
    const [, cityCode, venueCode, eventCode] = parts;
    await sendFormatSelection(botToken, chatId, cityCode, venueCode, eventCode, messageId, env);
    return;
  }

  // 5. Custom movie clicked
  if (action === "custom") {
    const [, cityCode, venueCode] = parts;
    await setSession(env, chatId, { step: "AWAITING_MOVIE_INPUT", cityCode, venueCode });
    await editTelegramMessage(botToken, chatId, messageId,
      "🔗 *Custom Movie Setup*\n\n" +
      "Please paste any BookMyShow movie URL or Event Code (e.g. `ET00516731`) directly in this chat!"
    );
    return;
  }

  // 6. Format picked -> Create Tracker!
  if (action === "flt") {
    const [, cityCode, venueCode, eventCode, filter] = parts;
    await createTracker(botToken, chatId, eventCode, venueCode, filter, cityCode, env, messageId);
    return;
  }

  // 7. Search city clicked
  if (action === "act" && parts[1] === "search_city") {
    await setSession(env, chatId, { step: "AWAITING_CITY_QUERY" });
    await editTelegramMessage(botToken, chatId, messageId,
      "🔍 *Search City in India*\n\n" +
      "Please type the name of your city (e.g. `Chandigarh`, `Jaipur`, `Kochi`, `Indore`, `Lucknow`, `Surat`, `Bhopal`, etc.):"
    );
    return;
  }

  // 8. Search theatre clicked
  if (action === "act" && parts[1] === "search_th") {
    const cityCode = parts[2] || "HYD";
    const city = await resolveCity(cityCode, env);
    await setSession(env, chatId, { step: "AWAITING_THEATRE_QUERY", cityCode });
    await editTelegramMessage(botToken, chatId, messageId,
      `🔍 *Search Theatre in ${city.name}*\n\n` +
      `Please type the name of the theatre (e.g., \`Prasads\`, \`PVR\`, \`INOX\`, \`Cinepolis\`, \`Rave\`, \`Miraj\`, etc.):`
    );
    return;
  }

  // Search movie clicked
  if (action === "act" && parts[1] === "search_mv") {
    const cityCode = parts[2] || "HYD";
    const city = await resolveCity(cityCode, env);
    await setSession(env, chatId, { step: "AWAITING_MOVIE_QUERY", cityCode });
    await editTelegramMessage(botToken, chatId, messageId,
      `🔍 *Search Movie in ${city.name}*\n\n` +
      `Please type the movie name (e.g. \`Avengers\`, \`Resident Evil\`, \`Spider-Man\`, \`Ramayan\`, \`Devara\`, \`Paradise\`):`
    );
    return;
  }

  // Navigation
  if (action === "act" && parts[1] === "cities") {
    await clearSession(env, chatId);
    await sendCitySelection(botToken, chatId, messageId, env);
    return;
  }
  if (action === "act" && (parts[1] === "request_city" || parts[1] === "search_city")) {
    await setSession(env, chatId, { step: "AWAITING_CITY_REQUEST" });
    await editTelegramMessage(botToken, chatId, messageId,
      "🏙️ *Request or Search a City*\n\n" +
      "Type the name of any city or town you would like to track on BookMyShow (e.g. *Pune*, *Chennai*, *Jaipur*, *Kolkata*, *Ahmedabad*, *Kochi*):\n\n" +
      "_Or send /cancel to return._"
    );
    return;
  }
  if (action === "add_city") {
    const code = parts[1];
    const city = BMS_ALL_REGIONS[code];
    if (city) {
      await registerCustomCity(city, env);
      const configuredChatId = String(env?.TELEGRAM_CHAT_ID || "").trim().replace(/['"]/g, "");
      if (configuredChatId) {
        await sendTelegram(botToken, configuredChatId, `🔔 *New City Added via Request!*\nCity: *${city.name}* (${city.code})\nRequested by user: \`${chatId}\``);
      }
      await clearSession(env, chatId);
      await editTelegramMessage(botToken, chatId, messageId,
        `✅ *${city.name} has been added!*\n\nOpening movie selection for *${city.name}*:`,
        {
          inline_keyboard: [
            [{ text: `🎬 View Movies in ${city.name}`, callback_data: `c:${city.code}` }],
            [{ text: "« Back to Cities", callback_data: "act:cities" }]
          ]
        }
      );
    }
    return;
  }
  if (action === "act" && parts[1] === "list") {
    await clearSession(env, chatId);
    await sendTrackerList(botToken, chatId, env);
    return;
  }

  // Admin Actions
  const configuredChatId = String(env?.TELEGRAM_CHAT_ID || "").trim().replace(/['"]/g, "");
  const isAdmin = (String(chatId) === configuredChatId && configuredChatId.length > 0);

  if (action === "act" && parts[1] === "admin_panel") {
    if (isAdmin) {
      await clearSession(env, chatId);
      await sendAdminDashboard(botToken, chatId, messageId, env);
    }
    return;
  }

  if (action === "act" && parts[1] === "admin_all_trackers") {
    if (isAdmin) {
      const page = parseInt(parts[2], 10) || 0;
      await sendAdminAllTrackers(botToken, chatId, messageId, env, page);
    }
    return;
  }

  if (action === "act" && parts[1] === "admin_custom_cities") {
    if (isAdmin) {
      await sendAdminCustomCities(botToken, chatId, messageId, env);
    }
    return;
  }

  if (action === "act" && parts[1] === "admin_broadcast") {
    if (isAdmin) {
      await setSession(env, chatId, { step: "AWAITING_ADMIN_BROADCAST" });
      await editTelegramMessage(botToken, chatId, messageId,
        "📢 *Admin Broadcast Center*\n\n" +
        "Please type the announcement message you wish to broadcast to *all registered users*.\n\n" +
        "_Tip: Send /cancel to discard and return._",
        {
          inline_keyboard: [
            [{ text: "« Cancel & Back to Dashboard", callback_data: "act:admin_panel" }]
          ]
        }
      );
    }
    return;
  }

  if (action === "adm_del_trk") {
    if (isAdmin) {
      const targetTrackerId = parts[1];
      const targetUserChatId = parts[2];
      await deleteTracker(env, targetTrackerId, targetUserChatId);
      await sendAdminAllTrackers(botToken, chatId, messageId, env, 0);
    }
    return;
  }

  if (action === "adm_del_city") {
    if (isAdmin) {
      const cityCode = parts[1];
      await removeCustomCity(cityCode, env);
      await sendAdminCustomCities(botToken, chatId, messageId, env);
    }
    return;
  }

  // Tracker Controls
  if (action === "t_pause") {
    const updated = await setTrackerPaused(env, parts[1], true, chatId);
    if (updated) {
      const { text, buttons } = renderTrackerCard(updated);
      await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
    } else {
      await editTelegramMessage(botToken, chatId, messageId, "⏸️ *Tracker Paused.* No alerts will be sent.");
    }
    return;
  }
  if (action === "t_res") {
    const updated = await setTrackerPaused(env, parts[1], false, chatId);
    if (updated) {
      const { text, buttons } = renderTrackerCard(updated);
      await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
    } else {
      await editTelegramMessage(botToken, chatId, messageId, "▶️ *Tracker Resumed.* Monitoring active.");
    }
    return;
  }
  if (action === "t_del") {
    await deleteTracker(env, parts[1], chatId);
    await editTelegramMessage(botToken, chatId, messageId, "🗑️ *Tracker Deleted.*");
    return;
  }
}

// -------------------------------------------------------------
// STEP 5: TRACKER CREATION & STORAGE IN KV
// -------------------------------------------------------------

async function createTracker(botToken, chatId, eventCode, venueCode, filter, cityCode, env, messageId = null) {
  const trackerId = "trk_" + Date.now().toString(36);
  const city = await resolveCity(cityCode, env);
  const venues = await fetchVenuesForCity(cityCode, env);
  const vObj = venues.find(v => v.code === venueCode);
  const venueDisplayName = venueCode === "ALL" ? `All Theatres in ${city.name}` : (vObj?.name || venueCode);

  let movieTitle = await resolveMovieTitle(eventCode, venueCode, cityCode, env);
  let finalEventCode = eventCode;

  if ((filter === "BOTH" || filter === "ALL") && typeof MULTILINGUAL_SIBLINGS !== "undefined" && MULTILINGUAL_SIBLINGS[eventCode]) {
    finalEventCode = MULTILINGUAL_SIBLINGS[eventCode].join(",");
    if (filter === "BOTH") {
      const baseName = movieTitle.replace(/\s*\([^)]+\)/g, "").trim();
      movieTitle = `${baseName} (English & Hindi)`;
    }
  }

  let formatName = "";
  const fmtMatch = movieTitle.match(/\(([^)]+)\)$/);
  if (filter === "EXACT") {
    formatName = fmtMatch ? `${fmtMatch[1].trim()} (Exact Match)` : "Exact Selected Format";
  } else if (filter === "ALL") {
    formatName = "All Formats / Screens";
  } else if (filter === "BOTH") {
    formatName = "Both English & Hindi Shows";
  } else if (filter === "PREMIUM" || filter === "PCX") {
    formatName = "Premium Screens (IMAX / Barco / 4DX)";
  } else if (filter === "3D") {
    formatName = "3D Shows Only";
  } else if (filter === "2D") {
    formatName = "2D Shows Only";
  } else {
    formatName = filter;
  }

  const cleanTitle = (movieTitle || "").replace(/\s*\([^)]*\)$/, "").replace(/[\(\)]+$/g, "").trim();

  const tracker = {
    id: trackerId,
    chatId: chatId,
    eventCode: finalEventCode,
    venueCode: venueCode,
    venueName: venueDisplayName,
    movieTitle: cleanTitle || movieTitle,
    formatName: formatName,
    filter: filter,
    cityCode: cityCode,
    cityName: city.name,
    citySlug: city.slug,
    lat: city.lat,
    lon: city.lon,
    isPaused: false,
    createdAt: new Date().toISOString(),
    knownSessions: [],
    isInitialized: false,
  };

  try {
    const shows = await fetchShowsForTracker(tracker, env);
    if (shows && shows.length > 0) {
      tracker.knownSessions = shows.map(s => s.sessionId);
      tracker.isInitialized = true;
    }
  } catch (e) {}

  if (env && env.TRACKER_DB) {
    const userTrackers = await getTrackersForUser(env, chatId);
    userTrackers.push(tracker);
    await env.TRACKER_DB.put(`trackers:${chatId}`, JSON.stringify(userTrackers));
    await clearSession(env, chatId);
  }

  const existingCount = tracker.knownSessions?.length || 0;
  const existingDisplay = tracker.isInitialized
    ? `${existingCount} (monitoring for new show drops)`
    : `Syncing baseline on first scan (silent)`;

  const successText =
    `✅ *Ticket Tracker Activated!*\n\n` +
    `• City: *${city.name}*\n` +
    `• Theatre: *${tracker.venueName}*\n` +
    `• Movie: *${tracker.movieTitle}*\n` +
    `• Screen Format: *${formatName}*\n` +
    `• Existing Shows: *${existingDisplay}*\n\n` +
    `🔔 *You will receive an instant notification the moment a NEW show drops!*`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📋 View My Trackers", callback_data: "act:list" },
        { text: "⏸️ Pause", callback_data: `t_pause:${trackerId}` }
      ]
    ]
  };

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, successText, keyboard);
  } else {
    await sendTelegram(botToken, chatId, successText, keyboard);
  }
}

// -------------------------------------------------------------
// 24/7 AUTONOMOUS SCANNER (Cloudflare Cron Trigger)
// -------------------------------------------------------------

async function scanAllTrackers(env) {
  if (!env.TRACKER_DB) return;
  const botToken = env.TELEGRAM_BOT_TOKEN;

  const list = await env.TRACKER_DB.list({ prefix: "trackers:" });
  for (const key of list.keys) {
    const raw = await env.TRACKER_DB.get(key.name);
    if (!raw) continue;
    let trackers = JSON.parse(raw);
    let updated = false;

    for (let tracker of trackers) {
      if (tracker.isPaused) continue;

      try {
        const currentShows = await fetchShowsForTracker(tracker, env);
        if (tracker.isInitialized === false) {
          tracker.knownSessions = currentShows.map(s => s.sessionId);
          tracker.isInitialized = true;
          updated = true;
          continue;
        }
        const knownSet = new Set(tracker.knownSessions || []);
        const newShows = currentShows.filter(s => !knownSet.has(s.sessionId));

        if (newShows.length > 0) {
          await sendNewShowsAlert(botToken, tracker.chatId, tracker, newShows);
          for (const s of newShows) knownSet.add(s.sessionId);
          tracker.knownSessions = Array.from(knownSet);
          updated = true;
        }
      } catch (err) {
        console.error(`Error scanning tracker ${tracker.id}:`, err);
      }
    }

    if (updated) {
      await env.TRACKER_DB.put(key.name, JSON.stringify(trackers));
    }
  }
}

// Query BookMyShow for shows matching tracker
async function fetchShowsForTracker(tracker, env) {
  const city = await resolveCity(tracker.cityCode, env);
  const codes = (tracker.eventCode || "").split(",").map(c => c.trim()).filter(Boolean);
  const allShows = [];
  const headers = getHeaders(tracker.cityCode, city.slug, city.lat, city.lon);

  for (const evCode of codes) {
    const url = `${SHOWTIMES_API}?eventCode=${evCode}&isDesktop=true&regionCode=${tracker.cityCode}&lat=${city.lat}&lon=${city.lon}`;

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const json = await res.json();

      const movieTitle = tracker.movieTitle || MOVIES_CATALOG[evCode] || json.metadata?.analytics?.title || "Movie";
      const dates = [];
      for (const w of json.data?.topStickyWidgets || []) {
        if (w.type === "horizontal-block-list") {
          for (const item of w.data || []) {
            if (item.id && item.styleId !== "date-disabled") dates.push(String(item.id).trim());
          }
        }
      }

      const datesToCheck = dates.length > 0 ? dates : [""];

      for (const d of datesToCheck) {
        const dateUrl = d ? `${url}&dateCode=${d}` : url;
        const dRes = await fetch(dateUrl, { headers });
        if (!dRes.ok) continue;
        const dJson = await dRes.json();

        for (const w of dJson.data?.showtimeWidgets || []) {
          if (w.type !== "groupList") continue;
          for (const grp of w.data || []) {
            for (const item of grp.data || []) {
              const vCode = item.additionalData?.venueCode;
              if (tracker.venueCode !== "ALL" && vCode !== tracker.venueCode) continue;

              const venueName = item.additionalData?.venueName || tracker.venueName || "Cinema";

              for (const s of item.showtimes || []) {
                const sid = String(s.additionalData?.sessionId || "");
                if (!sid) continue;

                const attr = (s.screenAttr || s.additionalData?.attributes || "").toLowerCase();
                const sName = (s.additionalData?.screenName || "").toLowerCase();

                // Apply screen filter
                if (tracker.filter === "EXACT" || tracker.filter === "ALL") {
                  // Specific event code chosen by user: keep all shows!
                } else if (tracker.filter === "PCX") {
                  const isPcx = attr.includes("pcx") || attr.includes("infinity") || sName.includes("screen 1") || attr.includes("imax") || attr.includes("4dx") || attr.includes("mx4d");
                  if (!isPcx) continue;
                } else if (tracker.filter === "3D") {
                  const is3d = attr.includes("3d") || sName.includes("3d");
                  if (!is3d) continue;
                } else if (tracker.filter === "2D") {
                  const is3d = attr.includes("3d") || sName.includes("3d");
                  if (is3d) continue;
                }

                allShows.push({
                  sessionId: sid,
                  date: d ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}` : "Today",
                  time: s.title || s.additionalData?.showTime || "Show",
                  screen: s.screenAttr || s.additionalData?.screenName || "2D",
                  venueName: venueName,
                  movieTitle: movieTitle,
                  bookingUrl: `https://in.bookmyshow.com/cinemas/${city.slug}/${vCode || "tickets"}/buytickets/${vCode}/${d}`
                });
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  return allShows;
}

// Send Alert Notification
async function sendNewShowsAlert(botToken, chatId, tracker, newShows) {
  let listText = "";
  for (const s of newShows) {
    listText += `• *${s.date}* at *${s.time}* (${s.screen})\n  📍 ${s.venueName}\n\n`;
  }

  const alertMsg =
    `🚨 *NEW SHOWS ADDED ON BOOKMYSHOW!* 🚨\n\n` +
    `🎬 *${tracker.movieTitle || "Movie"}*\n\n` +
    listText +
    `🎟️ [Book Instantly on BookMyShow](${newShows[0]?.bookingUrl || "https://in.bookmyshow.com"})\n\n` +
    `⚡ _Alert sent automatically by your Cloudflare Bot_`;

  await sendTelegram(botToken, chatId, alertMsg);
}

// -------------------------------------------------------------
// KV STORAGE & SESSION HELPERS
// -------------------------------------------------------------

async function getSession(env, chatId) {
  if (!env.TRACKER_DB) return null;
  const raw = await env.TRACKER_DB.get(`session:${chatId}`);
  return raw ? JSON.parse(raw) : null;
}

async function setSession(env, chatId, sessionData) {
  if (!env.TRACKER_DB) return;
  await env.TRACKER_DB.put(`session:${chatId}`, JSON.stringify(sessionData), { expirationTtl: 900 }); // 15 min TTL
}

async function clearSession(env, chatId) {
  if (!env.TRACKER_DB) return;
  await env.TRACKER_DB.delete(`session:${chatId}`);
}

async function getTrackersForUser(env, chatId) {
  if (!env.TRACKER_DB) return [];
  const raw = await env.TRACKER_DB.get(`trackers:${chatId}`);
  return raw ? JSON.parse(raw) : [];
}

async function setTrackerPaused(env, trackerId, isPaused, chatId = null) {
  if (!env.TRACKER_DB) return null;
  try {
    if (chatId) {
      const raw = await env.TRACKER_DB.get(`trackers:${chatId}`);
      if (raw) {
        let trackers = JSON.parse(raw);
        if (Array.isArray(trackers)) {
          let updatedTracker = null;
          for (let t of trackers) {
            if (t.id === trackerId) {
              t.isPaused = isPaused;
              updatedTracker = t;
            }
          }
          if (updatedTracker) {
            await env.TRACKER_DB.put(`trackers:${chatId}`, JSON.stringify(trackers));
            return updatedTracker;
          }
        }
      }
    }

    const list = await env.TRACKER_DB.list({ prefix: "trackers:" });
    for (const k of list.keys) {
      const raw = await env.TRACKER_DB.get(k.name);
      if (!raw) continue;
      try {
        let trackers = JSON.parse(raw);
        if (!Array.isArray(trackers)) continue;
        let updatedTracker = null;
        for (let t of trackers) {
          if (t.id === trackerId) {
            t.isPaused = isPaused;
            updatedTracker = t;
          }
        }
        if (updatedTracker) {
          await env.TRACKER_DB.put(k.name, JSON.stringify(trackers));
          return updatedTracker;
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error("setTrackerPaused error:", err);
  }
  return null;
}

async function deleteTracker(env, trackerId, chatId = null) {
  if (!env.TRACKER_DB) return false;
  try {
    if (chatId) {
      const raw = await env.TRACKER_DB.get(`trackers:${chatId}`);
      if (raw) {
        let trackers = JSON.parse(raw);
        if (Array.isArray(trackers)) {
          const filtered = trackers.filter(t => t.id !== trackerId);
          if (filtered.length !== trackers.length) {
            if (filtered.length === 0) {
              await env.TRACKER_DB.delete(`trackers:${chatId}`);
            } else {
              await env.TRACKER_DB.put(`trackers:${chatId}`, JSON.stringify(filtered));
            }
            return true;
          }
        }
      }
    }

    const list = await env.TRACKER_DB.list({ prefix: "trackers:" });
    for (const k of list.keys) {
      const raw = await env.TRACKER_DB.get(k.name);
      if (!raw) continue;
      try {
        let trackers = JSON.parse(raw);
        if (!Array.isArray(trackers)) continue;
        const filtered = trackers.filter(t => t.id !== trackerId);
        if (filtered.length !== trackers.length) {
          if (filtered.length === 0) {
            await env.TRACKER_DB.delete(k.name);
          } else {
            await env.TRACKER_DB.put(k.name, JSON.stringify(filtered));
          }
          return true;
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error("deleteTracker error:", err);
  }
  return false;
}

async function deleteAllTrackersForUser(env, chatId) {
  if (!env.TRACKER_DB || !chatId) return false;
  try {
    await env.TRACKER_DB.delete(`trackers:${chatId}`);
    return true;
  } catch (err) {
    console.error("deleteAllTrackersForUser error:", err);
    return false;
  }
}

// -------------------------------------------------------------
// LIST & STATUS REPORTS
// -------------------------------------------------------------

function getTrackerFormatDesc(t) {
  if (t.formatName) return t.formatName;
  const match = (t.movieTitle || "").match(/\(([^)]+)\)$/);
  if (match) return `${match[1].trim()} (Exact Match)`;

  if (t.filter === "EXACT") {
    const catTitle = (typeof MOVIES_CATALOG !== "undefined" && MOVIES_CATALOG[t.eventCode]) || "";
    const catMatch = catTitle.match(/\(([^)]+)\)$/);
    if (catMatch) return `${catMatch[1].trim()} (Exact Match)`;
    return "Exact Selected Format";
  }
  if (t.filter === "ALL") return "All Formats / Screens";
  if (t.filter === "BOTH") return "Both English & Hindi Shows";
  if (t.filter === "PREMIUM" || t.filter === "PCX") return "Premium Screens (IMAX / Barco / 4DX)";
  if (t.filter === "3D") return "3D Shows Only";
  if (t.filter === "2D") return "2D Shows Only";
  return t.filter || "All Formats";
}

function renderTrackerCard(t) {
  const status = t.isPaused ? "Paused ⏸️" : "Active 🟢";
  const buttons = [
    [
      t.isPaused
        ? { text: "▶️ Resume", callback_data: `t_res:${t.id}` }
        : { text: "⏸️ Pause", callback_data: `t_pause:${t.id}` },
      { text: "🗑️ Delete", callback_data: `t_del:${t.id}` }
    ]
  ];

  const displayTitle = (t.movieTitle || t.eventCode).replace(/\s*\([^)]*\)$/, "").replace(/[\(\)]+$/g, "").trim();
  const fmt = getTrackerFormatDesc(t);
  const existingCount = t.knownSessions?.length || 0;
  const isInit = t.isInitialized !== false;
  const showsDisplay = (!isInit && existingCount === 0)
    ? "Syncing baseline on first scan"
    : `${existingCount} (monitoring for new drops)`;

  const card =
    `🎬 *${displayTitle}*\n` +
    `• Status: *${status}*\n` +
    `• Theatre: ${t.venueName || t.venueCode}\n` +
    `• Screen Format: ${fmt}\n` +
    `• Existing Shows: ${showsDisplay}`;

  return { text: card, buttons };
}

async function sendTrackerList(botToken, chatId, env) {
  const trackers = await getTrackersForUser(env, chatId);
  if (!trackers || trackers.length === 0) {
    await sendTelegram(botToken, chatId,
      "📋 *No active trackers found.*\n\nSend /start or paste a BookMyShow link to start tracking a movie!"
    );
    return;
  }

  for (const t of trackers) {
    const { text, buttons } = renderTrackerCard(t);
    await sendTelegram(botToken, chatId, text, { inline_keyboard: buttons });
  }
}

async function sendStatusReport(botToken, chatId, env) {
  const trackers = await getTrackersForUser(env, chatId);
  if (!trackers || trackers.length === 0) {
    await sendTelegram(botToken, chatId, "📊 *No trackers configured yet.*\n\nSend /start to create one!");
    return;
  }

  let text = "📊 *Live Tracker Status Summary:*\n\n";
  for (const t of trackers) {
    const status = t.isPaused ? "⏸️ Paused" : "🟢 Active";
    const displayTitle = (t.movieTitle || t.eventCode).replace(/\s*\([^)]*\)$/, "").replace(/[\(\)]+$/g, "").trim();
    const fmt = getTrackerFormatDesc(t);
    const existingCount = t.knownSessions?.length || 0;
    const isInit = t.isInitialized !== false;
    const showsDisplay = (!isInit && existingCount === 0)
      ? "Syncing baseline"
      : `${existingCount}`;
    text += `• *${displayTitle}* (${status})\n  Theatre: ${t.venueName}\n  Format: ${fmt}\n  Existing Shows: ${showsDisplay}\n\n`;
  }
  text += "💡 Use /list to pause, resume, or remove trackers.";
  await sendTelegram(botToken, chatId, text);
}

// -------------------------------------------------------------
// ADMIN & ANALYTICS HELPERS
// -------------------------------------------------------------

function escapeMd(str) {
  if (!str) return "";
  return String(str).replace(/[*_`\[\]()]/g, " ");
}

async function recordUserInteraction(env, chatId) {
  if (!env || !env.TRACKER_DB || !chatId) return;
  try {
    const raw = await env.TRACKER_DB.get("registered_users");
    let users = [];
    if (raw) {
      try {
        users = JSON.parse(raw);
        if (!Array.isArray(users)) users = [];
      } catch (e) {
        users = [];
      }
    }
    const strId = String(chatId);
    if (!users.includes(strId)) {
      users.push(strId);
      await env.TRACKER_DB.put("registered_users", JSON.stringify(users));
    }
  } catch (err) {
    console.error("recordUserInteraction error:", err);
  }
}

async function getAllTrackersAcrossUsers(env) {
  if (!env || !env.TRACKER_DB) return [];
  const allTrackers = [];
  try {
    const list = await env.TRACKER_DB.list({ prefix: "trackers:" });
    for (const key of list.keys) {
      const ownerChatId = key.name.replace("trackers:", "");
      const raw = await env.TRACKER_DB.get(key.name);
      if (!raw) continue;
      try {
        const trackers = JSON.parse(raw);
        if (Array.isArray(trackers)) {
          for (const t of trackers) {
            allTrackers.push({ ...t, ownerChatId });
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error("getAllTrackersAcrossUsers error:", err);
  }
  return allTrackers;
}

async function removeCustomCity(cityCode, env) {
  if (!env || !env.TRACKER_DB || !cityCode) return false;
  try {
    const raw = await env.TRACKER_DB.get("custom_cities");
    if (raw) {
      let cities = JSON.parse(raw);
      if (Array.isArray(cities)) {
        cities = cities.filter(c => c.code !== cityCode);
        await env.TRACKER_DB.put("custom_cities", JSON.stringify(cities));
      }
    }
    await env.TRACKER_DB.delete(`city:${cityCode}`);
    return true;
  } catch (err) {
    console.error("removeCustomCity error:", err);
    return false;
  }
}

async function sendAdminDashboard(botToken, chatId, messageId = null, env = null) {
  let registeredCount = 0;
  let customCitiesCount = 0;
  let totalTrackers = 0;
  let activeTrackers = 0;
  let pausedTrackers = 0;

  if (env && env.TRACKER_DB) {
    try {
      const rawUsers = await env.TRACKER_DB.get("registered_users");
      const userList = rawUsers ? JSON.parse(rawUsers) : [];
      const userSet = new Set(Array.isArray(userList) ? userList : []);
      const trkList = await env.TRACKER_DB.list({ prefix: "trackers:" });
      for (const k of trkList.keys) {
        userSet.add(k.name.replace("trackers:", ""));
      }
      registeredCount = userSet.size;

      const rawCities = await env.TRACKER_DB.get("custom_cities");
      if (rawCities) {
        const cList = JSON.parse(rawCities);
        customCitiesCount = Array.isArray(cList) ? cList.length : 0;
      }
    } catch (e) {}

    const all = await getAllTrackersAcrossUsers(env);
    totalTrackers = all.length;
    activeTrackers = all.filter(t => !t.isPaused).length;
    pausedTrackers = all.filter(t => t.isPaused).length;
  }

  const text =
    "👑 *Movie Tracker Admin Dashboard*\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "📊 *Live Platform Statistics:*\n" +
    `• 👥 *Total Users:* ${registeredCount}\n` +
    `• 🎯 *Total Trackers:* ${totalTrackers} (${activeTrackers} active, ${pausedTrackers} paused)\n` +
    `• 🏙️ *Custom Cities Added:* ${customCitiesCount}\n` +
    `• 🤖 *Bot Engine:* Cloudflare Worker + Python Cron\n\n` +
    "Select an administration tool below:";

  const buttons = [
    [{ text: `📋 All Trackers (${totalTrackers})`, callback_data: "act:admin_all_trackers:0" }],
    [{ text: `🏙️ Custom Cities (${customCitiesCount})`, callback_data: "act:admin_custom_cities" }],
    [{ text: `📢 Broadcast to All Users (${registeredCount})`, callback_data: "act:admin_broadcast" }],
    [{ text: "« Return to Main Menu", callback_data: "act:cities" }]
  ];

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
  } else {
    await sendTelegram(botToken, chatId, text, { inline_keyboard: buttons });
  }
}

async function sendAdminAllTrackers(botToken, chatId, messageId = null, env = null, page = 0) {
  const allTrackers = await getAllTrackersAcrossUsers(env);
  if (!allTrackers || allTrackers.length === 0) {
    const emptyText = "📋 *No trackers found in the system across any users.*";
    const emptyButtons = [
      [{ text: "« Back to Admin Dashboard", callback_data: "act:admin_panel" }]
    ];
    if (messageId) {
      await editTelegramMessage(botToken, chatId, messageId, emptyText, { inline_keyboard: emptyButtons });
    } else {
      await sendTelegram(botToken, chatId, emptyText, { inline_keyboard: emptyButtons });
    }
    return;
  }

  const pageSize = 5;
  const totalPages = Math.ceil(allTrackers.length / pageSize);
  const curPage = Math.max(0, Math.min(page, totalPages - 1));
  const slice = allTrackers.slice(curPage * pageSize, (curPage + 1) * pageSize);

  let text = `📋 *All System Trackers* (Page ${curPage + 1}/${totalPages} — Total: ${allTrackers.length})\n━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const buttons = [];
  slice.forEach((t, i) => {
    const idx = curPage * pageSize + i + 1;
    const title = escapeMd((t.movieTitle || t.eventCode || "Movie").replace(/\s*\([^)]*\)$/, "").trim());
    const status = t.isPaused ? "⏸️ Paused" : "🟢 Active";
    const shows = t.knownSessions?.length || 0;
    const venue = escapeMd(t.venueName || t.venueCode);
    text += `*${idx}. ${title}*\n`;
    text += `• User: \`${t.ownerChatId}\`\n`;
    text += `• Venue: ${venue}\n`;
    text += `• Status: ${status} | Shows: ${shows}\n\n`;

    buttons.push([
      { text: `🗑️ Delete #${idx} (${title.slice(0, 15)})`, callback_data: `adm_del_trk:${t.id}:${t.ownerChatId}` }
    ]);
  });

  const navRow = [];
  if (curPage > 0) {
    navRow.push({ text: "« Prev", callback_data: `act:admin_all_trackers:${curPage - 1}` });
  }
  if (curPage < totalPages - 1) {
    navRow.push({ text: "Next »", callback_data: `act:admin_all_trackers:${curPage + 1}` });
  }
  if (navRow.length > 0) {
    buttons.push(navRow);
  }

  buttons.push([
    { text: "« Back to Admin Dashboard", callback_data: "act:admin_panel" }
  ]);

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
  } else {
    await sendTelegram(botToken, chatId, text, { inline_keyboard: buttons });
  }
}

async function sendAdminCustomCities(botToken, chatId, messageId = null, env = null) {
  let customList = [];
  if (env && env.TRACKER_DB) {
    try {
      const raw = await env.TRACKER_DB.get("custom_cities");
      if (raw) customList = JSON.parse(raw);
    } catch (e) {}
  }

  if (!customList || customList.length === 0) {
    const text =
      "🏙️ *Manage Custom Cities*\n\n" +
      "No custom cities have been requested yet.\n" +
      "Only the 6 core cities are currently active.";
    const buttons = [
      [{ text: "« Back to Admin Dashboard", callback_data: "act:admin_panel" }]
    ];
    if (messageId) {
      await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
    } else {
      await sendTelegram(botToken, chatId, text, { inline_keyboard: buttons });
    }
    return;
  }

  let text = `🏙️ *Custom Cities in Database (${customList.length}):*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  const buttons = [];

  for (const c of customList) {
    text += `• *${escapeMd(c.name)}* (Code: \`${c.code}\`, Slug: \`${c.slug}\`)\n`;
    buttons.push([
      { text: `🗑️ Remove ${c.name} (${c.code})`, callback_data: `adm_del_city:${c.code}` }
    ]);
  }

  buttons.push([
    { text: "« Back to Admin Dashboard", callback_data: "act:admin_panel" }
  ]);

  if (messageId) {
    await editTelegramMessage(botToken, chatId, messageId, text, { inline_keyboard: buttons });
  } else {
    await sendTelegram(botToken, chatId, text, { inline_keyboard: buttons });
  }
}

async function handleAdminBroadcastInput(botToken, chatId, text, env) {
  await clearSession(env, chatId);

  if (!env || !env.TRACKER_DB) {
    await sendTelegram(botToken, chatId, "❌ Database error: TRACKER_DB not available.");
    return;
  }

  const recipientSet = new Set();
  try {
    const rawUsers = await env.TRACKER_DB.get("registered_users");
    if (rawUsers) {
      const uList = JSON.parse(rawUsers);
      if (Array.isArray(uList)) {
        for (const u of uList) if (u) recipientSet.add(String(u));
      }
    }
  } catch (e) {}

  try {
    const trkList = await env.TRACKER_DB.list({ prefix: "trackers:" });
    for (const k of trkList.keys) {
      const id = k.name.replace("trackers:", "").trim();
      if (id) recipientSet.add(id);
    }
  } catch (e) {}

  recipientSet.add(String(chatId));

  const recipients = Array.from(recipientSet);
  if (recipients.length === 0) {
    await sendTelegram(botToken, chatId, "⚠️ No registered users found to broadcast to.");
    await sendAdminDashboard(botToken, chatId, null, env);
    return;
  }

  await sendTelegram(botToken, chatId, `🚀 Starting broadcast to *${recipients.length}* user(s)...`);

  let successCount = 0;
  let failCount = 0;

  const broadcastMsg =
    `📢 *ANNOUNCEMENT*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `${text}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ _Sent by BookMyShow Ticket Tracker Admin_`;

  for (const rChatId of recipients) {
    try {
      await sendTelegram(botToken, rChatId, broadcastMsg);
      successCount++;
    } catch (err) {
      console.error(`Broadcast failed for user ${rChatId}:`, err);
      failCount++;
    }
  }

  await sendTelegram(
    botToken,
    chatId,
    `✅ *Broadcast Completed!*\n\n` +
    `• Delivered: *${successCount}*\n` +
    `• Failed: *${failCount}*\n` +
    `• Total Target Users: *${recipients.length}*`,
    {
      inline_keyboard: [
        [{ text: "👑 Admin Dashboard", callback_data: "act:admin_panel" }]
      ]
    }
  );
}

// -------------------------------------------------------------
// TELEGRAM API HELPERS
// -------------------------------------------------------------

async function sendTelegram(token, chatId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  let res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Fallback: send without markdown if syntax error occurred
    body.text = text.replace(/[*_`\[\]()]/g, "");
    delete body.parse_mode;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
}

async function editTelegramMessage(token, chatId, messageId, text, replyMarkup = null) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  let res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    body.text = text.replace(/[*_`\[\]()]/g, "");
    delete body.parse_mode;
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
}

async function answerCallbackQuery(token, queryId, alertText = null) {
  const body = { callback_query_id: queryId };
  if (alertText) body.text = alertText;
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {}
}
