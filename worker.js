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
const BMS_ALL_REGIONS = {"MUMBAI":{"code":"MUMBAI","name":"Mumbai","slug":"mumbai","lat":"19.076","lon":"72.8777"},"NCR":{"code":"NCR","name":"Delhi-NCR","slug":"national-capital-region-ncr","lat":"28.6139","lon":"77.209"},"BANG":{"code":"BANG","name":"Bengaluru","slug":"bengaluru","lat":"12.9715987","lon":"77.5945627"},"HYD":{"code":"HYD","name":"Hyderabad","slug":"hyderabad","lat":"17.385044","lon":"78.486671"},"CHD":{"code":"CHD","name":"Chandigarh","slug":"chandigarh","lat":"30.7333148","lon":"76.7794179"},"AHD":{"code":"AHD","name":"Ahmedabad","slug":"ahmedabad","lat":"23.0395677","lon":"72.5660045"},"PUNE":{"code":"PUNE","name":"Pune","slug":"pune","lat":"18.5204303","lon":"73.8567437"},"CHEN":{"code":"CHEN","name":"Chennai","slug":"chennai","lat":"13.056","lon":"80.206"},"KOLK":{"code":"KOLK","name":"Kolkata","slug":"kolkata","lat":"22.641","lon":"88.411"},"KOCH":{"code":"KOCH","name":"Kochi","slug":"kochi","lat":"9.9312328","lon":"76.2673041"},"AALU":{"code":"AALU","name":"Aalo","slug":"aalo","lat":"28.163707","lon":"94.787013"},"ABOR":{"code":"ABOR","name":"Abohar","slug":"abohar","lat":"30.1453","lon":"74.1993"},"ABRD":{"code":"ABRD","name":"Abu Road","slug":"abu-road","lat":"24.531445","lon":"72.73336"},"ACHM":{"code":"ACHM","name":"Achampet","slug":"achampet","lat":"16.399035","lon":"78.636713"},"ACHA":{"code":"ACHA","name":"Acharapakkam","slug":"acharapakkam","lat":"12.4035","lon":"79.8157"},"ADKI":{"code":"ADKI","name":"Addanki","slug":"addanki","lat":"15.8107","lon":"79.9724"},"ADIL":{"code":"ADIL","name":"Adilabad","slug":"adilabad","lat":"19.6667","lon":"78.5333"},"ADIM":{"code":"ADIM","name":"Adimali","slug":"adimali","lat":"10.0115","lon":"76.9528"},"ADPR":{"code":"ADPR","name":"Adipur","slug":"adipur","lat":"23.073639","lon":"70.090562"},"ADNI":{"code":"ADNI","name":"Adoni","slug":"adoni","lat":"15.6322","lon":"77.2728"},"AGOR":{"code":"AGOR","name":"Agar Malwa","slug":"agar-malwa","lat":"23.7114164","lon":"76.0097602"},"AGAR":{"code":"AGAR","name":"Agartala","slug":"agartala","lat":"23.8333","lon":"91.2667"},"AGIR":{"code":"AGIR","name":"Agiripalli","slug":"agiripalli","lat":"16.68","lon":"80.7852"},"AGRA":{"code":"AGRA","name":"Agra","slug":"agra","lat":"27.1766701","lon":"78.0080745"},"AHMED":{"code":"AHMED","name":"Ahilyanagar (Ahmednagar)","slug":"ahilyanagar-ahmednagar","lat":"19.1103296","lon":"74.672868"},"AHMG":{"code":"AHMG","name":"Ahmedgarh","slug":"ahmedgarh","lat":"30.678192","lon":"75.827631"},"AHOR":{"code":"AHOR","name":"Ahore","slug":"ahore","lat":"25.3723","lon":"72.7777"},"AIZW":{"code":"AIZW","name":"Aizawl","slug":"aizawl","lat":"23.7307","lon":"92.7173"},"AJMER":{"code":"AJMER","name":"Ajmer","slug":"ajmer","lat":"26.45","lon":"74.64"},"AKAL":{"code":"AKAL","name":"Akaltara","slug":"akaltara","lat":"22.024497","lon":"82.423551"},"AKBR":{"code":"AKBR","name":"Akbarpur","slug":"akbarpur","lat":"26.4332578","lon":"82.5186961"},"AKVD":{"code":"AKVD","name":"Akividu","slug":"akividu","lat":"16.5823","lon":"81.3784"},"AKLJ":{"code":"AKLJ","name":"Akluj","slug":"akluj","lat":"17.8824","lon":"75.0205"},"AKOL":{"code":"AKOL","name":"Akola","slug":"akola","lat":"20.70388","lon":"76.997093"},"TKOT":{"code":"TKOT","name":"Akot","slug":"akot","lat":"21.0973","lon":"77.0536"},"ALAK":{"code":"ALAK","name":"Alakode","slug":"alakode","lat":"12.191","lon":"75.4673"},"ALNI":{"code":"ALNI","name":"Alangudi","slug":"alangudi","lat":"10.3589","lon":"78.9769"},"ALKM":{"code":"ALKM","name":"Alangulam","slug":"alangulam","lat":"8.8646","lon":"77.496"},"ALPZ":{"code":"ALPZ","name":"Alappuzha","slug":"alappuzha","lat":"9.4981","lon":"76.3388"},"ALAR":{"code":"ALAR","name":"Alathur","slug":"alathur","lat":"10.6454","lon":"76.5458"},"ALBG":{"code":"ALBG","name":"Alibaug","slug":"alibaug","lat":"18.6554","lon":"72.8671"},"ALI":{"code":"ALI","name":"Aligarh","slug":"aligarh","lat":"27.89381","lon":"78.068138"},"ALIP":{"code":"ALIP","name":"Alipurduar","slug":"alipurduar","lat":"26.4922","lon":"89.532"},"ALGD":{"code":"ALGD","name":"Allagadda","slug":"allagadda","lat":"15.0735","lon":"78.2824"},"ALMO":{"code":"ALMO","name":"Almora","slug":"almora","lat":"29.815","lon":"79.2902"},"ALSR":{"code":"ALSR","name":"Alsisar (Rajasthan)","slug":"alsisar-rajasthan","lat":"28.3067","lon":"75.2873"},"ALUR":{"code":"ALUR","name":"Alur","slug":"alur","lat":"12.9793","lon":"75.9913"},"ALWR":{"code":"ALWR","name":"Alwar","slug":"alwar","lat":"27.5546374","lon":"76.6113564"},"ADAM":{"code":"ADAM","name":"Amadalavalasa","slug":"amadalavalasa","lat":"18.4101","lon":"83.903"},"AMAP":{"code":"AMAP","name":"Amalapuram","slug":"amalapuram","lat":"16.5721","lon":"82.0009"},"AMLN":{"code":"AMLN","name":"Amalner","slug":"amalner","lat":"21.0419","lon":"75.0582"},"AMAN":{"code":"AMAN","name":"Amangal","slug":"amangal","lat":"16.8494","lon":"78.5303"},"ZAMA":{"code":"ZAMA","name":"Amanpur","slug":"amanpur","lat":"27.7126","lon":"78.7391"},"AVTI":{"code":"AVTI","name":"Amaravathi","slug":"amaravathi","lat":"16.573","lon":"80.3575"},"AMBJ":{"code":"AMBJ","name":"Ambajipeta","slug":"ambajipeta","lat":"16.5946","lon":"81.9064"},"AMBG":{"code":"AMBG","name":"Ambajogai","slug":"ambajogai","lat":"18.7271","lon":"76.3811"},"AMB":{"code":"AMB","name":"Ambala","slug":"ambala","lat":"30.3781788","lon":"76.7766974"},"AMBZ":{"code":"AMBZ","name":"Ambalapuzha","slug":"ambalapuzha","lat":"9.38371","lon":"76.353723"},"AMBI":{"code":"AMBI","name":"Ambikapur","slug":"ambikapur","lat":"23.1355","lon":"83.1818"},"AMBR":{"code":"AMBR","name":"Ambur","slug":"ambur","lat":"12.7904","lon":"78.7166"},"AMGN":{"code":"AMGN","name":"Amgaon","slug":"amgaon","lat":"21.367209","lon":"80.381205"},"AMPA":{"code":"AMPA","name":"Ampara","slug":"ampara","lat":"7.289638","lon":"81.673481"},"AMRA":{"code":"AMRA","name":"Amravati","slug":"amravati","lat":"20.938882","lon":"77.780457"},"AMRE":{"code":"AMRE","name":"Amreli","slug":"amreli","lat":"21.60451","lon":"71.221475"},"AMRI":{"code":"AMRI","name":"Amritsar","slug":"amritsar","lat":"31.6339793","lon":"74.8722642"},"AMRO":{"code":"AMRO","name":"Amroha","slug":"amroha","lat":"28.9044","lon":"78.4673"},"ANAI":{"code":"ANAI","name":"Anaikatti","slug":"anaikatti","lat":"11.1048","lon":"76.7683"},"ANKP":{"code":"ANKP","name":"Anakapalle","slug":"anakapalle","lat":"17.6896","lon":"82.9977"},"AND":{"code":"AND","name":"Anand","slug":"anand","lat":"22.560869","lon":"72.954773"},"ANPR":{"code":"ANPR","name":"Anandapur","slug":"anandapur","lat":"21.2148","lon":"86.1249"},"ANTT":{"code":"ANTT","name":"Anantapalli","slug":"anantapalli","lat":"16.9755526","lon":"81.4393436"},"ANAN":{"code":"ANAN","name":"Anantapur","slug":"anantapur","lat":"14.5216","lon":"77.7452"},"ANPT":{"code":"ANPT","name":"Anaparthi","slug":"anaparthi","lat":"16.9341","lon":"81.9555"},"ANHL":{"code":"ANHL","name":"Anchal","slug":"anchal","lat":"8.93","lon":"76.9065"},"AANI":{"code":"AANI","name":"Andaman And Nicobar","slug":"andaman-and-nicobar","lat":"11.7401","lon":"92.6586"},"ANEK":{"code":"ANEK","name":"Anekal","slug":"anekal","lat":"12.7105","lon":"77.6911"},"ANDM":{"code":"ANDM","name":"Angadipuram","slug":"angadipuram","lat":"10.9718","lon":"76.2103"},"ANGA":{"code":"ANGA","name":"Angamaly","slug":"angamaly","lat":"10.1849","lon":"76.3753"},"ANGR":{"code":"ANGR","name":"Angara","slug":"angara","lat":"16.7727399","lon":"81.9245553"},"ANGL":{"code":"ANGL","name":"Angul","slug":"angul","lat":"20.9211","lon":"84.8568"},"ANJA":{"code":"ANJA","name":"Anjad","slug":"anjad","lat":"22.0431","lon":"75.0538"},"ANJR":{"code":"ANJR","name":"Anjar","slug":"anjar","lat":"23.1135","lon":"70.026"},"ANKV":{"code":"ANKV","name":"Anklav","slug":"anklav","lat":"22.3775","lon":"72.9992"},"ANKL":{"code":"ANKL","name":"Ankleshwar","slug":"ankleshwar","lat":"21.6264","lon":"73.0152"},"ANKO":{"code":"ANKO","name":"Ankola","slug":"ankola","lat":"14.6653","lon":"74.3001"},"ANVR":{"code":"ANVR","name":"Annavaram","slug":"annavaram","lat":"17.2789","lon":"82.4013"},"ANGI":{"code":"ANGI","name":"Annigeri","slug":"annigeri","lat":"15.4273","lon":"75.4316"},"ATYR":{"code":"ATYR","name":"Anthiyur","slug":"anthiyur","lat":"11.5771","lon":"77.5877"},"ANUR":{"code":"ANUR","name":"Anuradhapura","slug":"anuradhapura","lat":"8.30953","lon":"80.40262"},"APRA":{"code":"APRA","name":"Apra","slug":"apra","lat":"31.0861","lon":"75.8781"},"ARAK":{"code":"ARAK","name":"Arakkonam","slug":"arakkonam","lat":"13.0752","lon":"79.6558"},"AMBH":{"code":"AMBH","name":"Arambagh","slug":"arambagh","lat":"22.88615","lon":"87.78427"},"ARMB":{"code":"ARMB","name":"Arambol","slug":"arambol","lat":"15.684689","lon":"73.703284"},"ARNT":{"code":"ARNT","name":"Aranthangi","slug":"aranthangi","lat":"10.1692","lon":"79.0023"},"ARAV":{"code":"ARAV","name":"Aravakurichi","slug":"aravakurichi","lat":"10.7747","lon":"77.909"},"ARIY":{"code":"ARIY","name":"Ariyalur","slug":"ariyalur","lat":"11.2399","lon":"79.2902"},"ARGU":{"code":"ARGU","name":"Arkalgud","slug":"arkalgud","lat":"12.764","lon":"76.0609"},"ARMO":{"code":"ARMO","name":"Armoor","slug":"armoor","lat":"18.7895","lon":"78.2893"},"ARNI":{"code":"ARNI","name":"Arni","slug":"arni","lat":"12.67","lon":"79.28"},"ARSI":{"code":"ARSI","name":"Arsikere","slug":"arsikere","lat":"13.3105","lon":"76.2537"},"ARUP":{"code":"ARUP","name":"Aruppukottai","slug":"aruppukottai","lat":"9.5215968","lon":"78.0881955"},"ASANSOL":{"code":"ASANSOL","name":"Asansol","slug":"asansol","lat":"23.6739","lon":"86.9524"},"AKMP":{"code":"AKMP","name":"Ashoknagar","slug":"ashoknagar","lat":"24.577162","lon":"77.731527"},"ASNA":{"code":"ASNA","name":"Ashoknagar (West Bengal)","slug":"ashoknagar-west-bengal","lat":"22.8252","lon":"88.6287"},"ASTA":{"code":"ASTA","name":"Ashta","slug":"ashta","lat":"23.018","lon":"76.716"},"ASMA":{"code":"ASMA","name":"Ashta (Maharashtra)","slug":"ashta-maharashtra","lat":"16.9483","lon":"74.4115"},"ASIK":{"code":"ASIK","name":"Asika","slug":"asika","lat":"19.6159","lon":"84.6649"},"ASWA":{"code":"ASWA","name":"Aswaraopeta","slug":"aswaraopeta","lat":"17.2445","lon":"81.1313"},"ACPT":{"code":"ACPT","name":"Atchampeta (AP)","slug":"atchampeta-ap","lat":"16.6284","lon":"80.1189"},"ATHG":{"code":"ATHG","name":"Athagarh","slug":"athagarh","lat":"20.5174","lon":"85.6306"},"ATHN":{"code":"ATHN","name":"Athani","slug":"athani","lat":"16.7269","lon":"75.0641"},"ATKK":{"code":"ATKK","name":"Atmakur (Kurnool)","slug":"atmakur-kurnool","lat":"15.8791","lon":"78.5837"},"ATMK":{"code":"ATMK","name":"Atmakur (Nellore)","slug":"atmakur-nellore","lat":"14.6167","lon":"79.6245"},"ATPA":{"code":"ATPA","name":"Atpadi","slug":"atpadi","lat":"17.4287","lon":"74.9383"},"ATRA":{"code":"ATRA","name":"Atraulia","slug":"atraulia","lat":"26.3337","lon":"82.9468"},"ATTO":{"code":"ATTO","name":"Attibele","slug":"attibele","lat":"12.779","lon":"77.7702"},"ATLI":{"code":"ATLI","name":"Attili","slug":"attili","lat":"16.6885","lon":"81.6037"},"ATTI":{"code":"ATTI","name":"Attingal","slug":"attingal","lat":"8.6982","lon":"76.8137"},"ATTR":{"code":"ATTR","name":"Attur","slug":"attur","lat":"11.5963","lon":"78.5989"},"AURI":{"code":"AURI","name":"Auraiya","slug":"auraiya","lat":"26.47","lon":"79.52"},"AUBI":{"code":"AUBI","name":"Aurangabad (Bihar)","slug":"aurangabad-bihar","lat":"24.7033","lon":"84.3542"},"AURW":{"code":"AURW","name":"Aurangabad (West Bengal)","slug":"aurangabad-west-bengal","lat":"24.5976","lon":"88.0339"},"AURV":{"code":"AURV","name":"Auroville","slug":"auroville","lat":"12.003136","lon":"79.801769"},"AUSH":{"code":"AUSH","name":"Aushapur","slug":"aushapur","lat":"17.462","lon":"78.7356"},"AVII":{"code":"AVII","name":"Avinashi","slug":"avinashi","lat":"11.1914","lon":"77.2689"},"AYOD":{"code":"AYOD","name":"Ayodhya","slug":"ayodhya","lat":"26.7922","lon":"82.1998"},"AZMG":{"code":"AZMG","name":"Azamgarh","slug":"azamgarh","lat":"26.0737","lon":"83.1859"},"BKOT":{"code":"BKOT","name":"B. Kothakota","slug":"b-kothakota","lat":"13.65674","lon":"78.265857"},"BABT":{"code":"BABT","name":"Babra","slug":"babra","lat":"21.843286","lon":"71.305801"},"BAMA":{"code":"BAMA","name":"Badami","slug":"badami","lat":"15.9186","lon":"75.6761"},"BADN":{"code":"BADN","name":"Badaun","slug":"badaun","lat":"28.0337","lon":"79.1205"},"BADD":{"code":"BADD","name":"Baddi","slug":"baddi","lat":"30.9578","lon":"76.7914"},"BAHR":{"code":"BAHR","name":"Badhra","slug":"badhra","lat":"29.1043","lon":"75.1655"},"BADA":{"code":"BADA","name":"Badnagar","slug":"badnagar","lat":"23.0504","lon":"75.3774"},"BADR":{"code":"BADR","name":"Badnawar","slug":"badnawar","lat":"23.0208","lon":"75.2336"},"BADU":{"code":"BADU","name":"Badulla","slug":"badulla","lat":"6.991698","lon":"81.055925"},"BADV":{"code":"BADV","name":"Badvel","slug":"badvel","lat":"14.7309","lon":"79.0589"},"BAAG":{"code":"BAAG","name":"Bagaha","slug":"bagaha","lat":"27.1222","lon":"84.0722"},"BAGA":{"code":"BAGA","name":"Bagalkot","slug":"bagalkot","lat":"16.1725","lon":"75.6557"},"BBHA":{"code":"BBHA","name":"Bagbahara","slug":"bagbahara","lat":"21.0595","lon":"82.3723"},"BGPI":{"code":"BGPI","name":"Bagepalli","slug":"bagepalli","lat":"13.7835728","lon":"77.7922017"},"BAPU":{"code":"BAPU","name":"Bagha Purana","slug":"bagha-purana","lat":"30.685679","lon":"75.094003"},"BGAM":{"code":"BGAM","name":"Baghmari","slug":"baghmari","lat":"22.587","lon":"88.3876"},"BAGN":{"code":"BAGN","name":"Bagnan","slug":"bagnan","lat":"22.4671","lon":"87.9702"},"BAGU":{"code":"BAGU","name":"Bagru","slug":"bagru","lat":"26.8093","lon":"75.5417"},"BAHD":{"code":"BAHD","name":"Bahadurgarh","slug":"bahadurgarh","lat":"28.6924","lon":"76.924"},"BHRH":{"code":"BHRH","name":"Bahraich","slug":"bahraich","lat":"27.570867","lon":"81.598175"},"BAID":{"code":"BAID","name":"Baidyabati","slug":"baidyabati","lat":"22.7958","lon":"88.3191"},"BIAH":{"code":"BIAH","name":"Baihar","slug":"baihar","lat":"22.1012","lon":"80.5494"},"BAIJ":{"code":"BAIJ","name":"Baijnath","slug":"baijnath","lat":"32.0521","lon":"76.6493"},"BKTH":{"code":"BKTH","name":"Baikunthpur","slug":"baikunthpur","lat":"23.27915","lon":"82.563616"},"BAND":{"code":"BAND","name":"Baindur","slug":"baindur","lat":"13.866593","lon":"74.627623"},"BART":{"code":"BART","name":"Bakhrahat","slug":"bakhrahat","lat":"22.3879","lon":"88.20593"},"BLGT":{"code":"BLGT","name":"Balaghat","slug":"balaghat","lat":"21.9667","lon":"80.3333"},"BALG":{"code":"BALG","name":"Balangir","slug":"balangir","lat":"20.6723","lon":"83.1649"},"BLSR":{"code":"BLSR","name":"Balasore","slug":"balasore","lat":"21.3469","lon":"86.6611"},"BALE":{"code":"BALE","name":"Balehonnur","slug":"balehonnur","lat":"13.349007","lon":"75.46506"},"BLIJ":{"code":"BLIJ","name":"Balijipeta","slug":"balijipeta","lat":"18.6149","lon":"83.5297"},"ALBI":{"code":"ALBI","name":"Ballia","slug":"ballia","lat":"25.758671","lon":"84.148743"},"BALD":{"code":"BALD","name":"Balod","slug":"balod","lat":"20.7311","lon":"81.2023"},"BBCH":{"code":"BBCH","name":"Baloda Bazar","slug":"baloda-bazar","lat":"21.656966","lon":"82.155384"},"BALO":{"code":"BALO","name":"Balotra","slug":"balotra","lat":"25.8309","lon":"72.2401"},"BLUR":{"code":"BLUR","name":"Balrampur","slug":"balrampur","lat":"27.4307","lon":"82.1805"},"BALU":{"code":"BALU","name":"Balurghat","slug":"balurghat","lat":"25.2373","lon":"88.7831"},"BNPL":{"code":"BNPL","name":"Banaganapalli","slug":"banaganapalli","lat":"15.3184","lon":"78.2279"},"BANZ":{"code":"BANZ","name":"Banahatti","slug":"banahatti","lat":"16.4823","lon":"75.1224"},"BANA":{"code":"BANA","name":"Banaskantha","slug":"banaskantha","lat":"24.3455","lon":"71.7622"},"BADZ":{"code":"BADZ","name":"Banda","slug":"banda","lat":"25.476266","lon":"80.339544"},"BNGA":{"code":"BNGA","name":"Banga","slug":"banga","lat":"31.11","lon":"75.59"},"BAGO":{"code":"BAGO","name":"Bangaon","slug":"bangaon","lat":"23.0467","lon":"88.8291"},"BAGT":{"code":"BAGT","name":"Bangarpet","slug":"bangarpet","lat":"12.9915","lon":"78.1788"},"BGPM":{"code":"BGPM","name":"Bangarupalem","slug":"bangarupalem","lat":"13.5508","lon":"74.8185"},"BANK":{"code":"BANK","name":"Banki","slug":"banki","lat":"20.3766","lon":"85.529"},"BNKU":{"code":"BNKU","name":"Bankura","slug":"bankura","lat":"23.233061","lon":"87.048755"},"BNSA":{"code":"BNSA","name":"Banswada","slug":"banswada","lat":"18.3818","lon":"77.8758"},"BANS":{"code":"BANS","name":"Banswara","slug":"banswara","lat":"23.549983","lon":"74.450557"},"BANT":{"code":"BANT","name":"Bantumilli","slug":"bantumilli","lat":"16.3703","lon":"81.2714"},"BAPA":{"code":"BAPA","name":"Bapatla","slug":"bapatla","lat":"15.9059","lon":"80.4716"},"BARK":{"code":"BARK","name":"Barabanki","slug":"barabanki","lat":"26.9955","lon":"81.2519"},"BARA":{"code":"BARA","name":"Baramati","slug":"baramati","lat":"18.1841","lon":"74.6108"},"BRML":{"code":"BRML","name":"Baramulla","slug":"baramulla","lat":"34.1473","lon":"74.2649"},"BARN":{"code":"BARN","name":"Baran","slug":"baran","lat":"25.1011","lon":"76.5132"},"BSRT":{"code":"BSRT","name":"Barasat","slug":"barasat","lat":"22.341493","lon":"88.146189"},"BARL":{"code":"BARL","name":"Baraut","slug":"baraut","lat":"29.0999","lon":"77.2606"},"BABR":{"code":"BABR","name":"Barbil","slug":"barbil","lat":"22.105999","lon":"85.387459"},"BRDL":{"code":"BRDL","name":"Bardoli","slug":"bardoli","lat":"21.1257","lon":"73.1121"},"BARE":{"code":"BARE","name":"Bareilly","slug":"bareilly","lat":"28.364","lon":"79.415"},"BEJA":{"code":"BEJA","name":"Bareja","slug":"bareja","lat":"22.8545","lon":"72.5918"},"BARG":{"code":"BARG","name":"Bargarh","slug":"bargarh","lat":"21.255","lon":"83.507"},"BRWA":{"code":"BRWA","name":"Barharwa","slug":"barharwa","lat":"24.8566","lon":"87.7776"},"BHAI":{"code":"BHAI","name":"Barhi","slug":"barhi","lat":"24.3032516","lon":"85.4060789"},"BARI":{"code":"BARI","name":"Baripada","slug":"baripada","lat":"21.9322","lon":"86.7517"},"BARM":{"code":"BARM","name":"Barmer","slug":"barmer","lat":"25.7532","lon":"71.4181"},"BAR":{"code":"BAR","name":"Barnala","slug":"barnala","lat":"30.3819","lon":"75.5468"},"BARP":{"code":"BARP","name":"Barpeta","slug":"barpeta","lat":"26.3295","lon":"91.006104"},"BRPD":{"code":"BRPD","name":"Barpeta Road","slug":"barpeta-road","lat":"26.5028","lon":"90.9655"},"BARR":{"code":"BARR","name":"Barrackpore","slug":"barrackpore","lat":"22.7527091","lon":"88.3516562"},"BRHI":{"code":"BRHI","name":"Barshi","slug":"barshi","lat":"18.2334","lon":"75.6941"},"BARU":{"code":"BARU","name":"Baruipur","slug":"baruipur","lat":"22.3597","lon":"88.4318"},"BARQ":{"code":"BARQ","name":"Barwadih","slug":"barwadih","lat":"23.843732","lon":"84.116386"},"BARH":{"code":"BARH","name":"Barwaha","slug":"barwaha","lat":"22.2532","lon":"76.0408"},"BRWN":{"code":"BRWN","name":"Barwani","slug":"barwani","lat":"22.0363","lon":"74.9033"},"BABA":{"code":"BABA","name":"Basantpur","slug":"basantpur","lat":"26.1728","lon":"84.6642"},"BIRH":{"code":"BIRH","name":"Basirhat","slug":"basirhat","lat":"22.6574","lon":"88.8672"},"ASTB":{"code":"ASTB","name":"Basmat","slug":"basmat","lat":"19.3349","lon":"77.151802"},"BASN":{"code":"BASN","name":"Basna","slug":"basna","lat":"21.277329","lon":"82.822188"},"BAST":{"code":"BAST","name":"Basti","slug":"basti","lat":"26.814","lon":"82.763"},"BATA":{"code":"BATA","name":"Batala","slug":"batala","lat":"31.823462","lon":"75.205063"},"BHAT":{"code":"BHAT","name":"Bathinda","slug":"bathinda","lat":"30.210994","lon":"74.9454745"},"BTGD":{"code":"BTGD","name":"Batlagundu","slug":"batlagundu","lat":"10.1638","lon":"77.7591"},"BATI":{"code":"BATI","name":"Batticaloa","slug":"batticaloa","lat":"7.724147","lon":"81.695834"},"BAVL":{"code":"BAVL","name":"Bavla","slug":"bavla","lat":"22.8298","lon":"72.3638"},"BAYA":{"code":"BAYA","name":"Bayad","slug":"bayad","lat":"23.2298","lon":"73.2205"},"BANY":{"code":"BANY","name":"Bayana","slug":"bayana","lat":"26.9158","lon":"77.2894"},"BAZP":{"code":"BAZP","name":"Bazpur","slug":"bazpur","lat":"29.1585","lon":"79.1464"},"BEAW":{"code":"BEAW","name":"Beawar","slug":"beawar","lat":"0","lon":"0"},"BEED":{"code":"BEED","name":"Beed","slug":"beed","lat":"18.9964693","lon":"75.7316343"},"BEGU":{"code":"BEGU","name":"Beguniapada","slug":"beguniapada","lat":"19.6245","lon":"84.9411"},"BEGS":{"code":"BEGS","name":"Begusarai","slug":"begusarai","lat":"25.4182","lon":"86.1272"},"BEHR":{"code":"BEHR","name":"Behror","slug":"behror","lat":"27.8947","lon":"76.282"},"BELG":{"code":"BELG","name":"Belagavi (Belgaum)","slug":"belagavi-belgaum","lat":"15.85036","lon":"74.504669"},"BLVD":{"code":"BLVD","name":"Belakavadi","slug":"belakavadi","lat":"12.256719","lon":"77.122898"},"BELB":{"code":"BELB","name":"Belghoria","slug":"belghoria","lat":"22.667","lon":"88.3796"},"BELL":{"code":"BELL","name":"Bellampalli","slug":"bellampalli","lat":"19.0716","lon":"79.4912"},"BLRY":{"code":"BLRY","name":"Bellary","slug":"bellary","lat":"15.1394","lon":"76.9214"},"BELU":{"code":"BELU","name":"Belur","slug":"belur","lat":"13.1623","lon":"75.8679"},"BMTA":{"code":"BMTA","name":"Bemetara","slug":"bemetara","lat":"21.6894","lon":"81.5596"},"BEND":{"code":"BEND","name":"Bendamurulanka","slug":"bendamurulanka","lat":"16.444311","lon":"81.97121"},"BRAC":{"code":"BRAC","name":"Berachampa","slug":"berachampa","lat":"22.6968816","lon":"88.6696672"},"BEHA":{"code":"BEHA","name":"Berhampore (W.B.)","slug":"berhampore-wb","lat":"24.0988","lon":"88.2679"},"BERP":{"code":"BERP","name":"Berhampur (Odisha)","slug":"berhampur-odisha","lat":"19.315","lon":"84.7941"},"BEST":{"code":"BEST","name":"Bestavaripeta","slug":"bestavaripeta","lat":"15.5503","lon":"79.1026"},"BTBM":{"code":"BTBM","name":"Betalbatim","slug":"betalbatim","lat":"15.300619","lon":"73.919917"},"BETB":{"code":"BETB","name":"Betberia","slug":"betberia","lat":"22.3529","lon":"88.5771"},"BZDE":{"code":"BZDE","name":"Bethamangala","slug":"bethamangala","lat":"13.0066","lon":"78.3287"},"BETH":{"code":"BETH","name":"Bethamcherla","slug":"bethamcherla","lat":"15.4576","lon":"78.1518"},"BETA":{"code":"BETA","name":"Bettiah","slug":"bettiah","lat":"26.8026","lon":"84.5201"},"BETU":{"code":"BETU","name":"Betul","slug":"betul","lat":"21.9194077","lon":"78.0638116"},"BDRB":{"code":"BDRB","name":"Bhadrabaad","slug":"bhadrabaad","lat":"29.9158","lon":"78.0437"},"BHDR":{"code":"BHDR","name":"Bhadrachalam","slug":"bhadrachalam","lat":"17.6688","lon":"80.8936"},"BHAD":{"code":"BHAD","name":"Bhadrak","slug":"bhadrak","lat":"21.0574","lon":"86.4963"},"BDVT":{"code":"BDVT","name":"Bhadravati","slug":"bhadravati","lat":"13.833","lon":"75.7081"},"BHAG":{"code":"BHAG","name":"Bhagalpur","slug":"bhagalpur","lat":"25.2372","lon":"86.9746"},"BGWN":{"code":"BGWN","name":"Bhagwanpur","slug":"bhagwanpur","lat":"29.9417","lon":"77.8138"},"BHAN":{"code":"BHAN","name":"Bhainsa","slug":"bhainsa","lat":"19.1031","lon":"77.9653"},"BHAA":{"code":"BHAA","name":"Bhandara","slug":"bhandara","lat":"21.0736","lon":"79.8297"},"BHAJ":{"code":"BHAJ","name":"Bhanjanagar","slug":"bhanjanagar","lat":"19.9358","lon":"84.5825"},"BHAP":{"code":"BHAP","name":"Bhapel","slug":"bhapel","lat":"28.8068","lon":"78.6476"},"BASA":{"code":"BASA","name":"Bharamasagara","slug":"bharamasagara","lat":"14.3334","lon":"76.7048"},"BHRT":{"code":"BHRT","name":"Bharatpur","slug":"bharatpur","lat":"27.2180806","lon":"77.4932885"},"BHAR":{"code":"BHAR","name":"Bharuch","slug":"bharuch","lat":"21.7246442","lon":"73.0022939"},"BTAP":{"code":"BTAP","name":"Bhatapara","slug":"bhatapara","lat":"21.7384","lon":"81.948"},"BHAZ":{"code":"BHAZ","name":"Bhatgaon","slug":"bhatgaon","lat":"21.1576","lon":"81.7199"},"BAKL":{"code":"BAKL","name":"Bhatkal","slug":"bhatkal","lat":"13.9978","lon":"74.5405"},"BATT":{"code":"BATT","name":"Bhattiprolu","slug":"bhattiprolu","lat":"16.10376","lon":"80.78423"},"BHNI":{"code":"BHNI","name":"Bhavani","slug":"bhavani","lat":"11.4501","lon":"77.6822"},"BHNG":{"code":"BHNG","name":"Bhavnagar","slug":"bhavnagar","lat":"21.763997","lon":"72.156404"},"BHMD":{"code":"BHMD","name":"Bhawani Mandi","slug":"bhawani-mandi","lat":"24.42","lon":"75.82972"},"BHAW":{"code":"BHAW","name":"Bhawanipatna","slug":"bhawanipatna","lat":"19.9074","lon":"83.1642"},"BHMG":{"code":"BHMG","name":"Bheemgal","slug":"bheemgal","lat":"18.7016","lon":"78.4553"},"BHILAI":{"code":"BHILAI","name":"Bhilai","slug":"bhilai","lat":"0","lon":"0"},"BHIL":{"code":"BHIL","name":"Bhilwara","slug":"bhilwara","lat":"25.3214","lon":"74.587"},"BMDE":{"code":"BMDE","name":"Bhimadole","slug":"bhimadole","lat":"16.8175","lon":"81.2601"},"BHIM":{"code":"BHIM","name":"Bhimavaram","slug":"bhimavaram","lat":"16.5449","lon":"81.5212"},"BIND":{"code":"BIND","name":"Bhind","slug":"bhind","lat":"26.5638","lon":"78.7861"},"BHWD":{"code":"BHWD","name":"Bhiwadi","slug":"bhiwadi","lat":"28.2036813","lon":"76.8224089"},"BHWN":{"code":"BHWN","name":"Bhiwani","slug":"bhiwani","lat":"28.799","lon":"76.1335"},"BHOG":{"code":"BHOG","name":"Bhogapuram","slug":"bhogapuram","lat":"18.0307","lon":"83.4937"},"BJPU":{"code":"BJPU","name":"Bhojpur","slug":"bhojpur","lat":"25.719033","lon":"84.577087"},"BHON":{"code":"BHON","name":"Bhongir","slug":"bhongir","lat":"17.5035","lon":"78.8892"},"BHOP":{"code":"BHOP","name":"Bhopal","slug":"bhopal","lat":"23.2599333","lon":"77.412615"},"BHOR":{"code":"BHOR","name":"Bhor","slug":"bhor","lat":"18.1458","lon":"73.843"},"BHUB":{"code":"BHUB","name":"Bhubaneswar","slug":"bhubaneswar","lat":"20.2960587","lon":"85.8245398"},"BHUJ":{"code":"BHUJ","name":"Bhuj","slug":"bhuj","lat":"23.2507356","lon":"69.6339007"},"BHUN":{"code":"BHUN","name":"Bhuntar","slug":"bhuntar","lat":"31.8944","lon":"77.2178"},"BHUP":{"code":"BHUP","name":"Bhupalpalle","slug":"bhupalpalle","lat":"18.4314","lon":"79.8605"},"BHUS":{"code":"BHUS","name":"Bhusawal","slug":"bhusawal","lat":"21.0455204","lon":"75.8010962"},"BHUT":{"code":"BHUT","name":"Bhutan","slug":"bhutan","lat":"27.413755","lon":"90.404506"},"BHUV":{"code":"BHUV","name":"Bhuvanagiri","slug":"bhuvanagiri","lat":"11.4459","lon":"79.653"},"BIAR":{"code":"BIAR","name":"Biaora","slug":"biaora","lat":"23.9186","lon":"76.9113"},"BBNG":{"code":"BBNG","name":"Bibinagar","slug":"bibinagar","lat":"17.4723","lon":"78.7974"},"BHCK":{"code":"BHCK","name":"Bichkunda","slug":"bichkunda","lat":"18.4014","lon":"77.7066"},"BIDI":{"code":"BIDI","name":"Bidadi","slug":"bidadi","lat":"12.7984","lon":"77.3872"},"BIDR":{"code":"BIDR","name":"Bidar","slug":"bidar","lat":"17.920053","lon":"77.519781"},"BIHS":{"code":"BIHS","name":"Bihar Sharif","slug":"bihar-sharif","lat":"25.205","lon":"85.5174"},"BIHP":{"code":"BIHP","name":"Bihpuria","slug":"bihpuria","lat":"27.0191","lon":"93.9216"},"BINW":{"code":"BINW","name":"Bijainagar","slug":"bijainagar","lat":"25.9268","lon":"74.6506"},"BIJ":{"code":"BIJ","name":"Bijnor","slug":"bijnor","lat":"29.3724422","lon":"78.1358472"},"BIJO":{"code":"BIJO","name":"Bijoynagar","slug":"bijoynagar","lat":"26.1007322","lon":"91.5032084"},"BIK":{"code":"BIK","name":"Bikaner","slug":"bikaner","lat":"28.009436","lon":"73.300653"},"BANJ":{"code":"BANJ","name":"Bikramganj","slug":"bikramganj","lat":"25.2233","lon":"84.2664"},"BILR":{"code":"BILR","name":"Bilara","slug":"bilara","lat":"26.168768","lon":"73.70036"},"BILA":{"code":"BILA","name":"Bilaspur","slug":"bilaspur","lat":"22.0630766","lon":"82.1035762"},"BIPS":{"code":"BIPS","name":"Bilaspur (Himachal Pradesh)","slug":"bilaspur-himachal-pradesh","lat":"31.4009003","lon":"76.3796908"},"BILG":{"code":"BILG","name":"Bilgi","slug":"bilgi","lat":"16.340545","lon":"75.629668"},"BILI":{"code":"BILI","name":"Bilimora","slug":"bilimora","lat":"20.769","lon":"72.9778"},"BILL":{"code":"BILL","name":"Billawar","slug":"billawar","lat":"32.6136","lon":"75.6041"},"BIRL":{"code":"BIRL","name":"Biraul","slug":"biraul","lat":"25.9426","lon":"86.2438"},"BIRR":{"code":"BIRR","name":"Birra","slug":"birra","lat":"21.7553","lon":"82.7935"},"VVDF":{"code":"VVDF","name":"Bishnupur","slug":"bishnupur","lat":"23.0679","lon":"87.3165"},"BSRM":{"code":"BSRM","name":"Bishrampur","slug":"bishrampur","lat":"23.22001","lon":"82.84999"},"BICH":{"code":"BICH","name":"Biswanath Chariali","slug":"biswanath-chariali","lat":"26.7267","lon":"93.1479"},"BOBB":{"code":"BOBB","name":"Bobbili","slug":"bobbili","lat":"18.573504","lon":"83.357791"},"BDGY":{"code":"BDGY","name":"Bodh Gaya","slug":"bodh-gaya","lat":"24.6961","lon":"84.987"},"BODH":{"code":"BODH","name":"Bodhan","slug":"bodhan","lat":"18.6794","lon":"77.8767"},"BODI":{"code":"BODI","name":"Bodinayakanur","slug":"bodinayakanur","lat":"10.0106","lon":"77.3497"},"BOIS":{"code":"BOIS","name":"Boisar","slug":"boisar","lat":"19.8","lon":"72.75"},"BOKK":{"code":"BOKK","name":"Bokakhat","slug":"bokakhat","lat":"26.613427","lon":"93.614526"},"BOKA":{"code":"BOKA","name":"Bokaro","slug":"bokaro","lat":"23.6693","lon":"86.1511"},"BLPR":{"code":"BLPR","name":"Bolpur","slug":"bolpur","lat":"23.66837","lon":"87.682201"},"BMDA":{"code":"BMDA","name":"Bomdila","slug":"bomdila","lat":"27.264494","lon":"92.415932"},"BOMM":{"code":"BOMM","name":"Bommidi","slug":"bommidi","lat":"11.9836","lon":"78.2463"},"BNKL":{"code":"BNKL","name":"Bonakal","slug":"bonakal","lat":"17.0252","lon":"80.2642"},"BONG":{"code":"BONG","name":"Bongaigaon","slug":"bongaigaon","lat":"26.489553","lon":"90.500879"},"BONI":{"code":"BONI","name":"Bongaon","slug":"bongaon","lat":"23.044","lon":"88.8277"},"BORM":{"code":"BORM","name":"Borsad","slug":"borsad","lat":"22.4171","lon":"72.8967"},"BOTA":{"code":"BOTA","name":"Botad","slug":"botad","lat":"22.172062","lon":"71.659544"},"KHUB":{"code":"KHUB","name":"Brahmapur","slug":"brahmapur","lat":"19.3082318","lon":"84.7382165"},"BHMP":{"code":"BHMP","name":"Brahmapuri","slug":"brahmapuri","lat":"20.609698","lon":"79.855912"},"BJNG":{"code":"BJNG","name":"Brajrajnagar","slug":"brajrajnagar","lat":"21.8286","lon":"83.9215"},"BCHR":{"code":"BCHR","name":"Buchireddypalem","slug":"buchireddypalem","lat":"14.5351","lon":"79.8773"},"DHUA":{"code":"DHUA","name":"Budhana","slug":"budhana","lat":"29.289301","lon":"77.4711"},"BUDL":{"code":"BUDL","name":"Budhlada","slug":"budhlada","lat":"29.9267","lon":"75.5542"},"BUHA":{"code":"BUHA","name":"Buhari","slug":"buhari","lat":"22.16469","lon":"73.04608"},"BULA":{"code":"BULA","name":"Bulandshahr","slug":"bulandshahr","lat":"28.407","lon":"77.8498"},"BULD":{"code":"BULD","name":"Buldana","slug":"buldana","lat":"20.4561","lon":"76.3637"},"BUID":{"code":"BUID","name":"Bundi","slug":"bundi","lat":"25.433881","lon":"75.642846"},"BUND":{"code":"BUND","name":"Bundu","slug":"bundu","lat":"23.16","lon":"85.5869"},"BURD":{"code":"BURD","name":"Burdwan","slug":"burdwan","lat":"23.23243","lon":"87.863731"},"BRHP":{"code":"BRHP","name":"Burhanpur","slug":"burhanpur","lat":"21.31939","lon":"76.222426"},"BRHR":{"code":"BRHR","name":"Burhar","slug":"burhar","lat":"23.192","lon":"81.5706"},"BUTY":{"code":"BUTY","name":"Buttayagudem","slug":"buttayagudem","lat":"17.2027","lon":"81.32"},"BYAD":{"code":"BYAD","name":"Byadagi","slug":"byadagi","lat":"14.6814","lon":"75.4869"},"BYDA":{"code":"BYDA","name":"Byadgi","slug":"byadgi","lat":"14.6814","lon":"75.4869"},"BYAS":{"code":"BYAS","name":"Byasanagar","slug":"byasanagar","lat":"20.9551","lon":"86.1271"},"CALC":{"code":"CALC","name":"Calicut","slug":"calicut","lat":"11.2588","lon":"75.7804"},"CANN":{"code":"CANN","name":"Canning","slug":"canning","lat":"22.314022","lon":"88.667895"},"CHAG":{"code":"CHAG","name":"Chagallu","slug":"chagallu","lat":"16.993","lon":"81.6668"},"CHAK":{"code":"CHAK","name":"Chakan","slug":"chakan","lat":"18.7632","lon":"73.8613"},"CHAL":{"code":"CHAL","name":"Chalakudy","slug":"chalakudy","lat":"10.307","lon":"76.3341"},"CHLS":{"code":"CHLS","name":"Chalisgaon","slug":"chalisgaon","lat":"20.4641","lon":"74.9969"},"CHLA":{"code":"CHLA","name":"Challakere","slug":"challakere","lat":"14.3134","lon":"76.6528"},"CHAP":{"code":"CHAP","name":"Challapalli","slug":"challapalli","lat":"16.1148","lon":"80.9291"},"CHAJ":{"code":"CHAJ","name":"Chamarajnagar","slug":"chamarajnagar","lat":"11.926147","lon":"76.943733"},"CHMB":{"code":"CHMB","name":"Chamba","slug":"chamba","lat":"32.5534","lon":"76.1258"},"CHMK":{"code":"CHMK","name":"Chamoli","slug":"chamoli","lat":"30.2937","lon":"79.5603"},"CHAM":{"code":"CHAM","name":"Champa","slug":"champa","lat":"22.032","lon":"82.6537"},"CHAI":{"code":"CHAI","name":"Champahati","slug":"champahati","lat":"22.4011678","lon":"88.4749387"},"CCWC":{"code":"CCWC","name":"Chanchal","slug":"chanchal","lat":"25.383","lon":"88.0167"},"CHDD":{"code":"CHDD","name":"Chandannagar","slug":"chandannagar","lat":"22.8616353","lon":"88.3509187"},"CHDN":{"code":"CHDN","name":"Chandausi","slug":"chandausi","lat":"28.4481","lon":"78.7796"},"CHAZ":{"code":"CHAZ","name":"Chandbali","slug":"chandbali","lat":"20.774","lon":"86.7437"},"CHHA":{"code":"CHHA","name":"Chandpur Siau","slug":"chandpur-siau","lat":"29.1345764","lon":"78.24978"},"CKNA":{"code":"CKNA","name":"Chandrakona","slug":"chandrakona","lat":"22.7329","lon":"87.5169"},"CHAN":{"code":"CHAN","name":"Chandrapur","slug":"chandrapur","lat":"19.95","lon":"79.3"},"CAND":{"code":"CAND","name":"Chandur","slug":"chandur","lat":"16.9795","lon":"79.056"},"CNSY":{"code":"CNSY","name":"Changanassery","slug":"changanassery","lat":"9.4459","lon":"76.541"},"CHAA":{"code":"CHAA","name":"Changaramkulam","slug":"changaramkulam","lat":"10.7363","lon":"76.029"},"CHGI":{"code":"CHGI","name":"Channagiri","slug":"channagiri","lat":"14.0242","lon":"75.926"},"CPTN":{"code":"CPTN","name":"Channapatna","slug":"channapatna","lat":"12.6510995","lon":"77.1946192"},"CHNN":{"code":"CHNN","name":"Channarayapatna","slug":"channarayapatna","lat":"12.9","lon":"76.3899"},"CHAT":{"code":"CHAT","name":"Chanpatia","slug":"chanpatia","lat":"26.9445","lon":"84.5379"},"CHPR":{"code":"CHPR","name":"Chapra","slug":"chapra","lat":"25.7811","lon":"84.7543"},"CCDD":{"code":"CCDD","name":"Charkhi Dadri","slug":"charkhi-dadri","lat":"28.5921","lon":"76.2653"},"CHOG":{"code":"CHOG","name":"Chaygaon","slug":"chaygaon","lat":"26.0481","lon":"91.3867"},"CHEB":{"code":"CHEB","name":"Chebrolu","slug":"chebrolu","lat":"16.2007","lon":"80.5286"},"CHEK":{"code":"CHEK","name":"Cheeka","slug":"cheeka","lat":"30.049","lon":"76.342"},"CHEE":{"code":"CHEE","name":"Cheepurupalli","slug":"cheepurupalli","lat":"18.3105","lon":"83.5683"},"CHEL":{"code":"CHEL","name":"Chelpur","slug":"chelpur","lat":"18.3705","lon":"79.8451"},"CHEO":{"code":"CHEO","name":"Chelur","slug":"chelur","lat":"13.7096","lon":"78.1006"},"CNPI":{"code":"CNPI","name":"Chendrapinni","slug":"chendrapinni","lat":"10.3564","lon":"76.1276"},"CHET":{"code":"CHET","name":"Chengalpattu","slug":"chengalpattu","lat":"12.684","lon":"79.9833"},"CHEG":{"code":"CHEG","name":"Chengannur","slug":"chengannur","lat":"9.3183","lon":"76.6111"},"CHNU":{"code":"CHNU","name":"Chennur","slug":"chennur","lat":"0","lon":"0"},"CHEI":{"code":"CHEI","name":"Chenthrapini","slug":"chenthrapini","lat":"10.3564838","lon":"76.1236131"},"CHRY":{"code":"CHRY","name":"Cherial","slug":"cherial","lat":"17.9283","lon":"78.9684"},"CHRL":{"code":"CHRL","name":"Cherla","slug":"cherla","lat":"18.0725","lon":"80.8267"},"CHER":{"code":"CHER","name":"Cherpulassery","slug":"cherpulassery","lat":"10.8789","lon":"76.3114"},"CHPU":{"code":"CHPU","name":"Cherrapunji","slug":"cherrapunji","lat":"25.273684","lon":"91.725358"},"CRTL":{"code":"CRTL","name":"Cherthala","slug":"cherthala","lat":"9.6836","lon":"76.3365"},"EHRK":{"code":"EHRK","name":"Cherukupalli","slug":"cherukupalli","lat":"16.048255","lon":"80.679094"},"CRUZ":{"code":"CRUZ","name":"Cherupuzha","slug":"cherupuzha","lat":"12.27284","lon":"75.367203"},"PPPT":{"code":"PPPT","name":"Chetpet","slug":"chetpet","lat":"13.0714","lon":"80.2417"},"CHEV":{"code":"CHEV","name":"Chevella","slug":"chevella","lat":"17.3124","lon":"78.1385"},"CHEY":{"code":"CHEY","name":"Cheyyar","slug":"cheyyar","lat":"12.662","lon":"79.5435"},"CHYR":{"code":"CHYR","name":"Cheyyur","slug":"cheyyur","lat":"12.34264","lon":"80.0114"},"CHHB":{"code":"CHHB","name":"Chhabra","slug":"chhabra","lat":"24.66472","lon":"76.84379"},"CHHT":{"code":"CHHT","name":"Chhatarpur","slug":"chhatarpur","lat":"24.9164","lon":"79.5812"},"AURA":{"code":"AURA","name":"Chhatrapati Sambhajinagar (Aurangabad)","slug":"chhatrapati-sambhajinagar-aurangabad","lat":"19.876","lon":"75.349"},"CHHI":{"code":"CHHI","name":"Chhibramau","slug":"chhibramau","lat":"27.15","lon":"79.4999"},"CIHB":{"code":"CIHB","name":"Chhibramau","slug":"chhibramau","lat":"27.1451","lon":"79.511101"},"CHIN":{"code":"CHIN","name":"Chhindwara","slug":"chhindwara","lat":"22.057314","lon":"78.93602"},"CHKA":{"code":"CHKA","name":"Chickmagaluru","slug":"chickmagaluru","lat":"13.3153","lon":"75.7754"},"CHID":{"code":"CHID","name":"Chidambaram","slug":"chidambaram","lat":"11.3982","lon":"79.6954"},"CHIH":{"code":"CHIH","name":"Chikhli","slug":"chikhli","lat":"20.345909","lon":"76.252764"},"CHIK":{"code":"CHIK","name":"Chikkaballapur","slug":"chikkaballapur","lat":"13.4324","lon":"77.728"},"CHUR":{"code":"CHUR","name":"Chikmagalur","slug":"chikmagalur","lat":"13.3153","lon":"75.7754"},"CHOK":{"code":"CHOK","name":"Chikodi","slug":"chikodi","lat":"16.4292","lon":"74.5879"},"CHIL":{"code":"CHIL","name":"Chilakaluripet","slug":"chilakaluripet","lat":"16.0924","lon":"80.1624"},"CNPT":{"code":"CNPT","name":"Chinnalapatti","slug":"chinnalapatti","lat":"10.2851","lon":"77.9225"},"CHNA":{"code":"CHNA","name":"Chinnamandem","slug":"chinnamandem","lat":"13.9365","lon":"78.6824"},"CHAR":{"code":"CHAR","name":"Chinnamanur","slug":"chinnamanur","lat":"9.8422","lon":"77.3828"},"CHSA":{"code":"CHSA","name":"Chinsurah","slug":"chinsurah","lat":"22.9012","lon":"88.3899"},"CHPD":{"code":"CHPD","name":"Chintalapudi","slug":"chintalapudi","lat":"17.0697","lon":"80.9876"},"CHTI":{"code":"CHTI","name":"Chintamani","slug":"chintamani","lat":"13.402","lon":"78.0551"},"CHTN":{"code":"CHTN","name":"Chinturu","slug":"chinturu","lat":"17.743896","lon":"81.397595"},"CHPL":{"code":"CHPL","name":"Chiplun","slug":"chiplun","lat":"17.5319","lon":"73.5151"},"CHYO":{"code":"CHYO","name":"Chiraiyakot","slug":"chiraiyakot","lat":"25.8824","lon":"83.3308"},"CHIR":{"code":"CHIR","name":"Chirala","slug":"chirala","lat":"15.8136","lon":"80.3547"},"CWRJ":{"code":"CWRJ","name":"Chirawa","slug":"chirawa","lat":"28.2416","lon":"75.6499"},"CHIT":{"code":"CHIT","name":"Chitradurga","slug":"chitradurga","lat":"14.1823","lon":"76.5488"},"CHTT":{"code":"CHTT","name":"Chittoor","slug":"chittoor","lat":"13.2218","lon":"79.101"},"COTT":{"code":"COTT","name":"Chittorgarh","slug":"chittorgarh","lat":"24.879999","lon":"74.629997"},"CDVM":{"code":"CDVM","name":"Chodavaram","slug":"chodavaram","lat":"17.8313806","lon":"82.9340217"},"CHBR":{"code":"CHBR","name":"Chon Buri","slug":"chon-buri","lat":"13.2017","lon":"101.2524"},"CHOT":{"code":"CHOT","name":"Chotila","slug":"chotila","lat":"22.4236","lon":"71.1946"},"CHOU":{"code":"CHOU","name":"Choutuppal","slug":"choutuppal","lat":"17.250523","lon":"78.897665"},"CHUC":{"code":"CHUC","name":"Churachandpur","slug":"churachandpur","lat":"24.3311683","lon":"92.8764921"},"CHRU":{"code":"CHRU","name":"Churu","slug":"churu","lat":"28.3254","lon":"74.4057"},"COIM":{"code":"COIM","name":"Coimbatore","slug":"coimbatore","lat":"11.0168445","lon":"76.9558321"},"COLO":{"code":"COLO","name":"Colombo","slug":"colombo","lat":"6.9271","lon":"79.8612"},"COBE":{"code":"COBE","name":"Cooch Behar","slug":"cooch-behar","lat":"26.3234","lon":"89.3227"},"CUNR":{"code":"CUNR","name":"Coonoor","slug":"coonoor","lat":"11.353","lon":"76.7959"},"CUDD":{"code":"CUDD","name":"Cuddalore","slug":"cuddalore","lat":"11.7447","lon":"79.768"},"CMBM":{"code":"CMBM","name":"Cumbum","slug":"cumbum","lat":"9.7344","lon":"77.2807"},"CUMB":{"code":"CUMB","name":"Cumbum (AP)","slug":"cumbum-ap","lat":"15.590055","lon":"79.112387"},"CUTT":{"code":"CUTT","name":"Cuttack","slug":"cuttack","lat":"20.4625","lon":"85.883"},"DABH":{"code":"DABH","name":"Dabhara","slug":"dabhara","lat":"21.7808","lon":"83.0818"},"DABR":{"code":"DABR","name":"Dabra","slug":"dabra","lat":"25.8907","lon":"78.3325"},"DHAU":{"code":"DHAU","name":"Dahanu","slug":"dahanu","lat":"19.9811","lon":"72.7452"},"DHGM":{"code":"DHGM","name":"Dahegam","slug":"dahegam","lat":"23.164362","lon":"72.810512"},"DAHO":{"code":"DAHO","name":"Dahod","slug":"dahod","lat":"22.8596","lon":"74.124"},"DAKS":{"code":"DAKS","name":"Dakshin Barasat","slug":"dakshin-barasat","lat":"22.2251","lon":"88.4452"},"DKJK":{"code":"DKJK","name":"Dakshin Dinajpur","slug":"dakshin-dinajpur","lat":"25.3715","lon":"88.5565"},"DALL":{"code":"DALL","name":"Dalli Rajhara","slug":"dalli-rajhara","lat":"20.5831","lon":"81.081"},"DAAL":{"code":"DAAL","name":"Dalmianagar","slug":"dalmianagar","lat":"24.9247","lon":"84.1883"},"DSRI":{"code":"DSRI","name":"Dalsinghsarai","slug":"dalsinghsarai","lat":"25.6727","lon":"85.8362"},"DATG":{"code":"DATG","name":"Daltonganj","slug":"daltonganj","lat":"24.0465","lon":"84.0768"},"DAMA":{"code":"DAMA","name":"Daman","slug":"daman","lat":"20.4283","lon":"72.8397"},"DAMC":{"code":"DAMC","name":"Damarcherla","slug":"damarcherla","lat":"79.6355","lon":"16.7274"},"DMPT":{"code":"DMPT","name":"Dammapeta","slug":"dammapeta","lat":"17.2674","lon":"81.0106"},"DAMO":{"code":"DAMO","name":"Damoh","slug":"damoh","lat":"23.8381","lon":"79.4422"},"DANA":{"code":"DANA","name":"Danapur","slug":"danapur","lat":"25.6241","lon":"85.0414"},"DAND":{"code":"DAND","name":"Dandeli","slug":"dandeli","lat":"15.2497","lon":"74.6174"},"DANG":{"code":"DANG","name":"Dang","slug":"dang","lat":"20.8254","lon":"73.7007"},"DAUK":{"code":"DAUK","name":"Dankaur","slug":"dankaur","lat":"28.3477","lon":"77.5533"},"DTWD":{"code":"DTWD","name":"Dantewada","slug":"dantewada","lat":"18.8998","lon":"81.3474"},"DAPO":{"code":"DAPO","name":"Daporijo","slug":"daporijo","lat":"27.9863","lon":"94.2205"},"DARB":{"code":"DARB","name":"Darbhanga","slug":"darbhanga","lat":"26.1119","lon":"85.896"},"DARJ":{"code":"DARJ","name":"Darjeeling","slug":"darjeeling","lat":"27.035718","lon":"88.262358"},"DRLA":{"code":"DRLA","name":"Darlapudi","slug":"darlapudi","lat":"17.484624","lon":"82.735847"},"DARS":{"code":"DARS","name":"Darsi","slug":"darsi","lat":"15.77","lon":"79.6794"},"DARA":{"code":"DARA","name":"Darwha","slug":"darwha","lat":"20.3104","lon":"77.7738"},"DASU":{"code":"DASU","name":"Dasuya","slug":"dasuya","lat":"31.8132","lon":"75.6637"},"DATI":{"code":"DATI","name":"Datia","slug":"datia","lat":"25.6653","lon":"78.4609"},"DAUN":{"code":"DAUN","name":"Daund","slug":"daund","lat":"18.4631","lon":"74.584"},"DAUS":{"code":"DAUS","name":"Dausa","slug":"dausa","lat":"26.873968","lon":"76.326712"},"DAVA":{"code":"DAVA","name":"Davanagere","slug":"davanagere","lat":"14.4663","lon":"75.9238"},"DVLR":{"code":"DVLR","name":"Davuluru","slug":"davuluru","lat":"16.2633","lon":"80.7429"},"DEES":{"code":"DEES","name":"Deesa","slug":"deesa","lat":"24.2585","lon":"72.1907"},"DEH":{"code":"DEH","name":"Dehradun","slug":"dehradun","lat":"30.3164945","lon":"78.0321918"},"DHRE":{"code":"DHRE","name":"Dehri","slug":"dehri","lat":"24.91427","lon":"84.186157"},"DEOD":{"code":"DEOD","name":"Deogadh","slug":"deogadh","lat":"18.649045","lon":"73.498393"},"DOGH":{"code":"DOGH","name":"Deoghar","slug":"deoghar","lat":"24.4763","lon":"86.6913"},"DEOL":{"code":"DEOL","name":"Deoli","slug":"deoli","lat":"20.65","lon":"78.4786"},"DEOY":{"code":"DEOY","name":"Deoli (Rajasthan)","slug":"deoli-rajasthan","lat":"25.7582","lon":"75.3818"},"DEEO":{"code":"DEEO","name":"Deoria","slug":"deoria","lat":"26.5024","lon":"83.7791"},"DERA":{"code":"DERA","name":"Deralakatte","slug":"deralakatte","lat":"12.8083","lon":"74.8936"},"DEVD":{"code":"DEVD","name":"Devadurga","slug":"devadurga","lat":"16.4235","lon":"76.9355"},"DEVA":{"code":"DEVA","name":"Devakottai","slug":"devakottai","lat":"9.944","lon":"78.8219"},"DEVR":{"code":"DEVR","name":"Devarakadra","slug":"devarakadra","lat":"16.6248","lon":"77.841"},"DEVK":{"code":"DEVK","name":"Devarakonda","slug":"devarakonda","lat":"16.6885307","lon":"78.9063619"},"DVRL":{"code":"DVRL","name":"Devarapalle","slug":"devarapalle","lat":"17.9878","lon":"82.9838"},"DVRP":{"code":"DVRP","name":"Devarapalli","slug":"devarapalli","lat":"17.035","lon":"81.5624"},"DEGA":{"code":"DEGA","name":"Devgad","slug":"devgad","lat":"16.3754","lon":"73.3886"},"DEWAS":{"code":"DEWAS","name":"Dewas","slug":"dewas","lat":"22.9623","lon":"76.0508"},"DMND":{"code":"DMND","name":"Dhamnod","slug":"dhamnod","lat":"22.2139","lon":"75.4723"},"DHPR":{"code":"DHPR","name":"Dhampur","slug":"dhampur","lat":"29.309565","lon":"78.51083"},"DHMT":{"code":"DHMT","name":"Dhamtari","slug":"dhamtari","lat":"20.7015","lon":"81.5542"},"CFFG":{"code":"CFFG","name":"Dhanaura","slug":"dhanaura","lat":"28.9546","lon":"78.2647"},"DHAN":{"code":"DHAN","name":"Dhanbad","slug":"dhanbad","lat":"23.7956531","lon":"86.4303859"},"DHAC":{"code":"DHAC","name":"Dhanera","slug":"dhanera","lat":"24.5064","lon":"72.0258"},"DARH":{"code":"DARH","name":"Dhar","slug":"dhar","lat":"22.4959","lon":"75.1545"},"SHGA":{"code":"SHGA","name":"Dharamjaigarh","slug":"dharamjaigarh","lat":"22.4622","lon":"83.2104"},"DPUR":{"code":"DPUR","name":"Dharampur","slug":"dharampur","lat":"20.5401","lon":"73.1792"},"DMSL":{"code":"DMSL","name":"Dharamsala","slug":"dharamsala","lat":"32.219393","lon":"76.324487"},"DHAR":{"code":"DHAR","name":"Dharapuram","slug":"dharapuram","lat":"10.7329","lon":"77.5218"},"OSMA":{"code":"OSMA","name":"Dharashiv (Osmanabad)","slug":"dharashiv-osmanabad","lat":"18.207","lon":"76.1784"},"DXCF":{"code":"DXCF","name":"Dharmajigudem","slug":"dharmajigudem","lat":"16.8937","lon":"80.9954"},"DHAT":{"code":"DHAT","name":"Dharmanagar","slug":"dharmanagar","lat":"24.3783","lon":"92.1548"},"DMPI":{"code":"DMPI","name":"Dharmapuri","slug":"dharmapuri","lat":"12.0933","lon":"78.202"},"DDMA":{"code":"DDMA","name":"Dharmavaram","slug":"dharmavaram","lat":"14.4137","lon":"77.7126"},"DPLL":{"code":"DPLL","name":"Dharpally","slug":"dharpally","lat":"18.7848479","lon":"78.2951871"},"DUUU":{"code":"DUUU","name":"Dharpur","slug":"dharpur","lat":"23.8444","lon":"72.2016"},"DHRA":{"code":"DHRA","name":"Dharuhera","slug":"dharuhera","lat":"28.20598","lon":"76.788995"},"DHAW":{"code":"DHAW","name":"Dharwad","slug":"dharwad","lat":"15.4589","lon":"75.0078"},"DHAL":{"code":"DHAL","name":"Dhaulana","slug":"dhaulana","lat":"28.6324","lon":"77.6507"},"DEKJ":{"code":"DEKJ","name":"Dhekiajuli","slug":"dhekiajuli","lat":"26.629483","lon":"92.347232"},"DHEM":{"code":"DHEM","name":"Dhemaji","slug":"dhemaji","lat":"27.472","lon":"94.5588"},"DNAL":{"code":"DNAL","name":"Dhenkanal","slug":"dhenkanal","lat":"20.8424","lon":"85.4376"},"DHOL":{"code":"DHOL","name":"Dholka","slug":"dholka","lat":"22.7428","lon":"72.4436"},"DHUR":{"code":"DHUR","name":"Dholpur","slug":"dholpur","lat":"26.7025","lon":"77.8934"},"DHON":{"code":"DHON","name":"Dhone","slug":"dhone","lat":"15.396","lon":"77.8732"},"DHOR":{"code":"DHOR","name":"Dhoraji","slug":"dhoraji","lat":"21.7398","lon":"70.4491"},"DHRN":{"code":"DHRN","name":"Dhrangadhra","slug":"dhrangadhra","lat":"22.983225","lon":"71.474461"},"DHBR":{"code":"DHBR","name":"Dhubri","slug":"dhubri","lat":"26.022339","lon":"89.978896"},"DHLE":{"code":"DHLE","name":"Dhule","slug":"dhule","lat":"20.9042","lon":"74.7749"},"DHAA":{"code":"DHAA","name":"Dhulian","slug":"dhulian","lat":"24.6707","lon":"87.9482"},"DHUI":{"code":"DHUI","name":"Dhuliyan","slug":"dhuliyan","lat":"24.6707","lon":"87.9482"},"DHRI":{"code":"DHRI","name":"Dhuri","slug":"dhuri","lat":"30.37183","lon":"75.861707"},"MNHR":{"code":"MNHR","name":"Diamond Harbour","slug":"diamond-harbour","lat":"22.192499","lon":"88.189499"},"DIB":{"code":"DIB","name":"Dibrugarh","slug":"dibrugarh","lat":"27.4728327","lon":"94.9119621"},"DIGR":{"code":"DIGR","name":"Digras","slug":"digras","lat":"20.1073","lon":"77.7166"},"DLDR":{"code":"DLDR","name":"Dildar Nagar","slug":"dildar-nagar","lat":"25.426151","lon":"83.672076"},"DMHO":{"code":"DMHO","name":"Dima Hasao","slug":"dima-hasao","lat":"25.3478","lon":"93.0176"},"DMPR":{"code":"DMPR","name":"Dimapur","slug":"dimapur","lat":"25.863","lon":"93.7537"},"DINA":{"code":"DINA","name":"Dinanagar","slug":"dinanagar","lat":"32.1266","lon":"75.4636"},"DIND":{"code":"DIND","name":"Dindigul","slug":"dindigul","lat":"10.3673","lon":"77.9803"},"DIPH":{"code":"DIPH","name":"Diphu","slug":"diphu","lat":"25.8465","lon":"93.4299"},"DGGD":{"code":"DGGD","name":"Dirang","slug":"dirang","lat":"27.3584","lon":"92.2409"},"DDBP":{"code":"DDBP","name":"Doddaballapura","slug":"doddaballapura","lat":"13.2957","lon":"77.5364"},"MDHK":{"code":"MDHK","name":"Doimukh","slug":"doimukh","lat":"27.150007","lon":"93.749993"},"DMKL":{"code":"DMKL","name":"Domkal","slug":"domkal","lat":"24.1236","lon":"88.5432"},"DOAP":{"code":"DOAP","name":"Dong","slug":"dong","lat":"28.170179","lon":"97.041676"},"DONG":{"code":"DONG","name":"Dongargarh","slug":"dongargarh","lat":"21.1802","lon":"80.7602"},"DLBZ":{"code":"DLBZ","name":"Doolahat Bazar","slug":"doolahat-bazar","lat":"0","lon":"0"},"DORH":{"code":"DORH","name":"Doraha","slug":"doraha","lat":"30.8039","lon":"76.0334"},"DORN":{"code":"DORN","name":"Dornakal","slug":"dornakal","lat":"17.4451","lon":"80.1568"},"DOWL":{"code":"DOWL","name":"Dowlaiswaram","slug":"dowlaiswaram","lat":"16.9558","lon":"81.7927"},"DAKR":{"code":"DAKR","name":"Draksharamam","slug":"draksharamam","lat":"16.7914","lon":"82.0598"},"DBBK":{"code":"DBBK","name":"Dubbaka","slug":"dubbaka","lat":"18.1765","lon":"78.6654"},"DUBR":{"code":"DUBR","name":"Dubrajpur","slug":"dubrajpur","lat":"23.794709","lon":"87.341091"},"DUDH":{"code":"DUDH","name":"Dudhi","slug":"dudhi","lat":"24.2129","lon":"83.2403"},"DUGG":{"code":"DUGG","name":"Duggirala","slug":"duggirala","lat":"16.327999","lon":"80.624298"},"DIJN":{"code":"DIJN","name":"Duliajan","slug":"duliajan","lat":"27.3572","lon":"95.3223"},"DUMKA":{"code":"DUMKA","name":"Dumka","slug":"dumka","lat":"24.267348","lon":"87.252246"},"DUNG":{"code":"DUNG","name":"Dungarpur","slug":"dungarpur","lat":"23.8417","lon":"73.7147"},"DURG":{"code":"DURG","name":"Durg","slug":"durg","lat":"21.189367","lon":"81.283039"},"DURGA":{"code":"DURGA","name":"Durgapur","slug":"durgapur","lat":"23.48","lon":"87.32"},"DWAR":{"code":"DWAR","name":"Dwarka","slug":"dwarka","lat":"22.250728","lon":"68.980374"},"ESTG":{"code":"ESTG","name":"East Godavari","slug":"east-godavari","lat":"17.3213","lon":"82.0407"},"EDPL":{"code":"EDPL","name":"Edappal","slug":"edappal","lat":"10.7839","lon":"76.0076"},"EDLP":{"code":"EDLP","name":"Edlapadu","slug":"edlapadu","lat":"16.1718","lon":"80.2286"},"EKMA":{"code":"EKMA","name":"Ekma","slug":"ekma","lat":"25.9651053","lon":"84.5353247"},"ELES":{"code":"ELES","name":"Elesvaram","slug":"elesvaram","lat":"17.288251","lon":"82.106207"},"ELRU":{"code":"ELRU","name":"Eluru","slug":"eluru","lat":"0","lon":"0"},"ENKR":{"code":"ENKR","name":"Enkoor","slug":"enkoor","lat":"17.331","lon":"80.4403"},"ERMR":{"code":"ERMR","name":"Eramalloor","slug":"eramalloor","lat":"9.8247","lon":"76.3145"},"ERAN":{"code":"ERAN","name":"Erandol","slug":"erandol","lat":"20.9266","lon":"75.3325"},"ERAT":{"code":"ERAT","name":"Erattupetta","slug":"erattupetta","lat":"9.6858","lon":"76.7751"},"ERNK":{"code":"ERNK","name":"Ernakulam","slug":"ernakulam","lat":"10.0718","lon":"76.5488"},"EROD":{"code":"EROD","name":"Erode","slug":"erode","lat":"11.340399","lon":"77.716942"},"ETAH":{"code":"ETAH","name":"Etah","slug":"etah","lat":"27.5588","lon":"78.6626"},"ETWH":{"code":"ETWH","name":"Etawah","slug":"etawah","lat":"26.8117","lon":"79.0047"},"ETTU":{"code":"ETTU","name":"Ettumanoor","slug":"ettumanoor","lat":"9.6706","lon":"76.5579"},"ETNR":{"code":"ETNR","name":"Eturnagaram","slug":"eturnagaram","lat":"18.337729","lon":"80.429824"},"FAZA":{"code":"FAZA","name":"Faizabad","slug":"faizabad","lat":"26.7732","lon":"82.1442"},"FALA":{"code":"FALA","name":"Falakata","slug":"falakata","lat":"26.5175","lon":"89.2039"},"FALN":{"code":"FALN","name":"Falna","slug":"falna","lat":"25.2411","lon":"73.247"},"DKOT":{"code":"DKOT","name":"Faridkot","slug":"faridkot","lat":"30.677","lon":"74.7584"},"FARU":{"code":"FARU","name":"Farrukhabad","slug":"farrukhabad","lat":"27.381211","lon":"79.557098"},"FATD":{"code":"FATD","name":"Fatehabad","slug":"fatehabad","lat":"29.5077","lon":"75.452"},"FASA":{"code":"FASA","name":"Fatehgarh Sahib","slug":"fatehgarh-sahib","lat":"30.647836","lon":"76.388616"},"FATE":{"code":"FATE","name":"Fatehpur","slug":"fatehpur","lat":"25.85","lon":"80.8987"},"FATR":{"code":"FATR","name":"Fatehpur(Rajasthan)","slug":"fatehpurrajasthan","lat":"27.9964034","lon":"74.9228953"},"FAKA":{"code":"FAKA","name":"Fazilka","slug":"fazilka","lat":"30.4036","lon":"74.028"},"FRZD":{"code":"FRZD","name":"Firozabad","slug":"firozabad","lat":"27.159122","lon":"78.395733"},"FRZR":{"code":"FRZR","name":"Firozpur","slug":"firozpur","lat":"30.9331","lon":"74.6225"},"FORB":{"code":"FORB","name":"Forbesganj","slug":"forbesganj","lat":"26.2993","lon":"87.2666"},"FULK":{"code":"FULK","name":"Fulkusma","slug":"fulkusma","lat":"22.71","lon":"86.8659"},"GMAD":{"code":"GMAD","name":"G.Mamidada","slug":"gmamidada","lat":"16.9385","lon":"82.0761"},"GADG":{"code":"GADG","name":"Gadag","slug":"gadag","lat":"15.4325","lon":"75.638"},"GDWR":{"code":"GDWR","name":"Gadarwara","slug":"gadarwara","lat":"22.9225","lon":"78.7834"},"GDRO":{"code":"GDRO","name":"Gadchiroli","slug":"gadchiroli","lat":"19.4969","lon":"80.2767"},"GDNG":{"code":"GDNG","name":"Gadhinglaj","slug":"gadhinglaj","lat":"16.226444","lon":"74.349968"},"GVDM":{"code":"GVDM","name":"Gadivemula","slug":"gadivemula","lat":"15.679932","lon":"78.422607"},"GADW":{"code":"GADW","name":"Gadwal","slug":"gadwal","lat":"16.2337","lon":"77.8081"},"GJPT":{"code":"GJPT","name":"Gajapathinagaram","slug":"gajapathinagaram","lat":"18.2798","lon":"83.3333"},"GJGH":{"code":"GJGH","name":"Gajendragarh","slug":"gajendragarh","lat":"15.7361","lon":"75.971"},"GAJW":{"code":"GAJW","name":"Gajwel","slug":"gajwel","lat":"17.8452","lon":"78.6818"},"GALL":{"code":"GALL","name":"Galle","slug":"galle","lat":"6.044571","lon":"80.207009"},"GAMP":{"code":"GAMP","name":"Gampaha","slug":"gampaha","lat":"7.08795","lon":"79.991582"},"GMPL":{"code":"GMPL","name":"Gampalagudem","slug":"gampalagudem","lat":"16.9923","lon":"80.5272"},"GANP":{"code":"GANP","name":"Ganapavaram","slug":"ganapavaram","lat":"16.6994","lon":"81.4635"},"GDHAM":{"code":"GDHAM","name":"Gandhidham","slug":"gandhidham","lat":"23.0753","lon":"70.1337"},"GNAGAR":{"code":"GNAGAR","name":"Gandhinagar","slug":"gandhinagar","lat":"23.2248196","lon":"72.6463769"},"GNGR":{"code":"GNGR","name":"Gangarampur","slug":"gangarampur","lat":"25.4009","lon":"88.5324"},"GAVT":{"code":"GAVT","name":"Gangavati","slug":"gangavati","lat":"15.4319","lon":"76.5315"},"GANZ":{"code":"GANZ","name":"Gangoh","slug":"gangoh","lat":"29.7788","lon":"77.2606"},"GANG":{"code":"GANG","name":"Gangtok","slug":"gangtok","lat":"27.3389","lon":"88.6065"},"GHZA":{"code":"GHZA","name":"Ganjam","slug":"ganjam","lat":"19.586","lon":"84.6897"},"GANJ":{"code":"GANJ","name":"Ganjbasoda","slug":"ganjbasoda","lat":"23.8515","lon":"77.9263"},"GANN":{"code":"GANN","name":"Gannavaram","slug":"gannavaram","lat":"16.5419","lon":"80.805"},"WASS":{"code":"WASS","name":"Garhwa","slug":"garhwa","lat":"24.1549","lon":"83.7996"},"GRAH":{"code":"GRAH","name":"Garhwal","slug":"garhwal","lat":"29.86876","lon":"78.83826"},"GARY":{"code":"GARY","name":"Gariyadhar","slug":"gariyadhar","lat":"21.539706","lon":"71.577558"},"GALA":{"code":"GALA","name":"Garla","slug":"garla","lat":"17.488","lon":"80.1428"},"GAUR":{"code":"GAUR","name":"Gauribidanur","slug":"gauribidanur","lat":"13.611159","lon":"77.51696"},"GNGJ":{"code":"GNGJ","name":"Gauriganj","slug":"gauriganj","lat":"26.2073","lon":"81.6823"},"GAYA":{"code":"GAYA","name":"Gaya","slug":"gaya","lat":"24.7955","lon":"84.9994"},"GAZP":{"code":"GAZP","name":"Gazole","slug":"gazole","lat":"25.2109","lon":"88.1924"},"GEOR":{"code":"GEOR","name":"Georai","slug":"georai","lat":"19.2606","lon":"75.7546"},"GHAG":{"code":"GHAG","name":"Gharghoda","slug":"gharghoda","lat":"22.178","lon":"83.3443"},"GHAT":{"code":"GHAT","name":"Ghatanji","slug":"ghatanji","lat":"20.1437","lon":"78.3117"},"GHAR":{"code":"GHAR","name":"Ghazipur","slug":"ghazipur","lat":"25.6135","lon":"83.507"},"GHIR":{"code":"GHIR","name":"Ghiror","slug":"ghiror","lat":"27.1888","lon":"78.8006"},"GHOR":{"code":"GHOR","name":"Ghorasahan","slug":"ghorasahan","lat":"26.8202","lon":"85.1307"},"GHUM":{"code":"GHUM","name":"Ghumarwin","slug":"ghumarwin","lat":"31.4491","lon":"76.7048"},"GDAL":{"code":"GDAL","name":"Giddalur","slug":"giddalur","lat":"15.376358","lon":"78.925087"},"GING":{"code":"GING","name":"Gingee","slug":"gingee","lat":"12.2524","lon":"79.4113"},"GIRI":{"code":"GIRI","name":"Giridih","slug":"giridih","lat":"24.191351","lon":"86.299637"},"GOA":{"code":"GOA","name":"Goa","slug":"goa","lat":"15.378","lon":"74.019"},"GOAL":{"code":"GOAL","name":"Goalpara","slug":"goalpara","lat":"26.1641","lon":"90.6252"},"GOBI":{"code":"GOBI","name":"Gobichettipalayam","slug":"gobichettipalayam","lat":"11.4504","lon":"77.43"},"GDVK":{"code":"GDVK","name":"Godavarikhani","slug":"godavarikhani","lat":"18.7511","lon":"79.5059"},"GDDA":{"code":"GDDA","name":"Godda","slug":"godda","lat":"24.8255","lon":"87.2135"},"GODH":{"code":"GODH","name":"Godhra","slug":"godhra","lat":"22.7788","lon":"73.6143"},"GOGA":{"code":"GOGA","name":"Gogawa","slug":"gogawa","lat":"22.19915","lon":"75.75295"},"GOHA":{"code":"GOHA","name":"Gohana","slug":"gohana","lat":"29.1393","lon":"76.6945"},"GKGK":{"code":"GKGK","name":"Gokak","slug":"gokak","lat":"16.1592","lon":"74.8156"},"GOKA":{"code":"GOKA","name":"Gokarna","slug":"gokarna","lat":"14.5479","lon":"74.3188"},"GOKM":{"code":"GOKM","name":"Gokavaram","slug":"gokavaram","lat":"17.2563","lon":"81.8484"},"GABR":{"code":"GABR","name":"Gola Bazar","slug":"gola-bazar","lat":"26.3519","lon":"83.3429"},"GOLA":{"code":"GOLA","name":"Gola Gokaran Nath","slug":"gola-gokaran-nath","lat":"28.0448","lon":"80.2812"},"GHT":{"code":"GHT","name":"Golaghat","slug":"golaghat","lat":"26.5239","lon":"93.9623"},"GOLL":{"code":"GOLL","name":"Gollaprolu","slug":"gollaprolu","lat":"17.1562","lon":"82.2861"},"GOND":{"code":"GOND","name":"Gonda","slug":"gonda","lat":"27.134","lon":"81.9619"},"GONA":{"code":"GONA","name":"Gondal","slug":"gondal","lat":"21.9612","lon":"70.7939"},"GNDA":{"code":"GNDA","name":"Gondia","slug":"gondia","lat":"21.4624","lon":"80.221"},"GONI":{"code":"GONI","name":"Gonikoppal","slug":"gonikoppal","lat":"12.1843","lon":"75.9263"},"GOOL":{"code":"GOOL","name":"Goolikkadavu","slug":"goolikkadavu","lat":"11.0956","lon":"76.6412"},"GOOT":{"code":"GOOT","name":"Gooty","slug":"gooty","lat":"15.1101","lon":"77.6362"},"GOPG":{"code":"GOPG","name":"Gopalganj","slug":"gopalganj","lat":"26.4685","lon":"84.4433"},"GOPA":{"code":"GOPA","name":"Gopalpet","slug":"gopalpet","lat":"18.109691","lon":"78.123248"},"GOPI":{"code":"GOPI","name":"Gopiganj","slug":"gopiganj","lat":"25.2859","lon":"82.4322"},"GRKP":{"code":"GRKP","name":"Gorakhpur","slug":"gorakhpur","lat":"26.7605545","lon":"83.3731675"},"GMDU":{"code":"GMDU","name":"Goramadagu","slug":"goramadagu","lat":"13.374895","lon":"77.943228"},"GORA":{"code":"GORA","name":"Gorantla","slug":"gorantla","lat":"13.9838","lon":"77.7723"},"GTGN":{"code":"GTGN","name":"Gotegaon","slug":"gotegaon","lat":"23.0487","lon":"79.4873"},"GOWP":{"code":"GOWP","name":"Gownipalli","slug":"gownipalli","lat":"13.506","lon":"78.2241"},"DGLT":{"code":"DGLT","name":"Gudalur","slug":"gudalur","lat":"11.503","lon":"76.4917"},"GUDI":{"code":"GUDI","name":"Gudivada","slug":"gudivada","lat":"16.441","lon":"80.9926"},"GDTM":{"code":"GDTM","name":"Gudiyatham","slug":"gudiyatham","lat":"12.9447","lon":"78.8709"},"GULU":{"code":"GULU","name":"Gudlavalleru","slug":"gudlavalleru","lat":"16.3487","lon":"81.0492"},"GUDR":{"code":"GUDR","name":"Gudur","slug":"gudur","lat":"14.146042","lon":"79.850736"},"GUHA":{"code":"GUHA","name":"Guhagar","slug":"guhagar","lat":"17.479096","lon":"73.194771"},"GULL":{"code":"GULL","name":"Gulaothi","slug":"gulaothi","lat":"28.5902","lon":"77.7936"},"GULD":{"code":"GULD","name":"Guledgudda","slug":"guledgudda","lat":"16.0496","lon":"75.7895"},"GUML":{"code":"GUML","name":"Gumla","slug":"gumla","lat":"23.050326","lon":"84.541097"},"GUMM":{"code":"GUMM","name":"Gummadidala","slug":"gummadidala","lat":"17.6847","lon":"78.3686"},"GUNA":{"code":"GUNA","name":"Guna","slug":"guna","lat":"24.6348","lon":"77.298"},"GUND":{"code":"GUND","name":"Gundlupet","slug":"gundlupet","lat":"11.8083","lon":"76.6927"},"GUNL":{"code":"GUNL","name":"Guntakal","slug":"guntakal","lat":"15.1674","lon":"77.3736"},"GUNT":{"code":"GUNT","name":"Guntur","slug":"guntur","lat":"16.3008","lon":"80.4428"},"GRAP":{"code":"GRAP","name":"Gurap","slug":"gurap","lat":"23.0348","lon":"88.1218"},"GURZ":{"code":"GURZ","name":"Gurazala","slug":"gurazala","lat":"16.5557","lon":"79.6362"},"GSPR":{"code":"GSPR","name":"Gurdaspur","slug":"gurdaspur","lat":"31.94","lon":"75.2479"},"GRRM":{"code":"GRRM","name":"Gurramkonda","slug":"gurramkonda","lat":"13.783288","lon":"78.590576"},"GUVY":{"code":"GUVY","name":"Guruvayur","slug":"guruvayur","lat":"10.5946","lon":"76.0369"},"GUW":{"code":"GUW","name":"Guwahati","slug":"guwahati","lat":"26.144435","lon":"91.733179"},"GWAL":{"code":"GWAL","name":"Gwalior","slug":"gwalior","lat":"26.2182871","lon":"78.1828308"},"HARR":{"code":"HARR","name":"Habra","slug":"habra","lat":"22.8489","lon":"88.664"},"HALG":{"code":"HALG","name":"Haflong","slug":"haflong","lat":"25.1633","lon":"93.0128"},"HHGG":{"code":"HHGG","name":"Hagaribommanahalli","slug":"hagaribommanahalli","lat":"15.0456","lon":"76.2074"},"HAJI":{"code":"HAJI","name":"Hajipur","slug":"hajipur","lat":"25.6858","lon":"85.2146"},"HLDI":{"code":"HLDI","name":"Haldia","slug":"haldia","lat":"22.0667","lon":"88.0698"},"HUCR":{"code":"HUCR","name":"Halduchaur","slug":"halduchaur","lat":"29.1121","lon":"79.5237"},"HALD":{"code":"HALD","name":"Haldwani","slug":"haldwani","lat":"29.2183","lon":"79.513"},"HALI":{"code":"HALI","name":"Haliya","slug":"haliya","lat":"16.7796106","lon":"79.3197973"},"HALO":{"code":"HALO","name":"Halol","slug":"halol","lat":"22.5072","lon":"73.4718"},"HAMB":{"code":"HAMB","name":"Hambantota","slug":"hambantota","lat":"6.144417","lon":"81.113715"},"HAMI":{"code":"HAMI","name":"Hamirpur (HP)","slug":"hamirpur-hp","lat":"31.6861745","lon":"76.5213092"},"HMPI":{"code":"HMPI","name":"Hampi","slug":"hampi","lat":"15.351771","lon":"76.475344"},"HNKD":{"code":"HNKD","name":"Hanamkonda","slug":"hanamkonda","lat":"18.020778","lon":"79.550516"},"HNDW":{"code":"HNDW","name":"Handwara","slug":"handwara","lat":"34.3996","lon":"74.2817"},"HNSI":{"code":"HNSI","name":"Hansi","slug":"hansi","lat":"29.101225","lon":"75.962377"},"HANU":{"code":"HANU","name":"Hanuman Junction","slug":"hanuman-junction","lat":"16.6385","lon":"80.9705"},"HNMG":{"code":"HNMG","name":"Hanumangarh","slug":"hanumangarh","lat":"29.5815","lon":"74.3294"},"HAPR":{"code":"HAPR","name":"Hapur","slug":"hapur","lat":"28.7306","lon":"77.7759"},"HRDA":{"code":"HRDA","name":"Harda","slug":"harda","lat":"22.1984","lon":"77.1025"},"HRDI":{"code":"HRDI","name":"Hardoi","slug":"hardoi","lat":"27.398774","lon":"80.128488"},"HARI":{"code":"HARI","name":"Haria","slug":"haria","lat":"25.840739","lon":"88.062317"},"HRDR":{"code":"HRDR","name":"Haridwar","slug":"haridwar","lat":"29.9456906","lon":"78.1642478"},"HRRR":{"code":"HRRR","name":"Harihar","slug":"harihar","lat":"14.5182104","lon":"75.7820427"},"HRPD":{"code":"HRPD","name":"Haripad","slug":"haripad","lat":"9.2815","lon":"76.4534"},"HARU":{"code":"HARU","name":"Harugeri","slug":"harugeri","lat":"16.5177","lon":"74.9497"},"HRUR":{"code":"HRUR","name":"Harur","slug":"harur","lat":"12.047","lon":"78.4833"},"HASA":{"code":"HASA","name":"Hasanparthy","slug":"hasanparthy","lat":"18.0691","lon":"79.5252"},"HASZ":{"code":"HASZ","name":"Hasanparthy","slug":"hasanparthy","lat":"18.0691","lon":"79.5252"},"HANS":{"code":"HANS","name":"Hasanpur","slug":"hasanpur","lat":"28.7238","lon":"78.2846"},"HSNA":{"code":"HSNA","name":"Hasnabad","slug":"hasnabad","lat":"22.5745","lon":"88.9174"},"HASN":{"code":"HASN","name":"Hassan","slug":"hassan","lat":"13.0753","lon":"76.1784"},"HATH":{"code":"HATH","name":"Hathras","slug":"hathras","lat":"27.6056","lon":"78.0538"},"HRE":{"code":"HRE","name":"Haveri","slug":"haveri","lat":"14.661","lon":"75.4345"},"HAZA":{"code":"HAZA","name":"Hazaribagh","slug":"hazaribagh","lat":"23.9966","lon":"85.3691"},"HIMM":{"code":"HIMM","name":"Himmatnagar","slug":"himmatnagar","lat":"23.612356","lon":"72.960591"},"HIND":{"code":"HIND","name":"Hindaun City","slug":"hindaun-city","lat":"26.731142","lon":"77.033752"},"HNDP":{"code":"HNDP","name":"Hindupur","slug":"hindupur","lat":"13.8185","lon":"77.4989"},"HINA":{"code":"HINA","name":"Hinganghat","slug":"hinganghat","lat":"20.5517","lon":"78.8418"},"HING":{"code":"HING","name":"Hingoli","slug":"hingoli","lat":"19.5781","lon":"77.1025"},"HIRA":{"code":"HIRA","name":"Hiramandalam","slug":"hiramandalam","lat":"18.6718","lon":"83.9506"},"HIRE":{"code":"HIRE","name":"Hirekerur","slug":"hirekerur","lat":"14.4555","lon":"75.3951"},"HIRI":{"code":"HIRI","name":"Hiriyur","slug":"hiriyur","lat":"13.9438","lon":"76.6161"},"HISR":{"code":"HISR","name":"Hisar","slug":"hisar","lat":"29.1492","lon":"75.7217"},"HOJA":{"code":"HOJA","name":"Hojai","slug":"hojai","lat":"26.0017","lon":"92.8477"},"HOLE":{"code":"HOLE","name":"Holenarasipura","slug":"holenarasipura","lat":"12.7849","lon":"76.2436"},"HONV":{"code":"HONV","name":"Honnali","slug":"honnali","lat":"14.2342","lon":"75.647"},"HNVR":{"code":"HNVR","name":"Honnavara","slug":"honnavara","lat":"14.2798","lon":"74.4439"},"HOOG":{"code":"HOOG","name":"Hooghly","slug":"hooghly","lat":"22.8963","lon":"88.2461"},"HSGB":{"code":"HSGB","name":"Hoshangabad","slug":"hoshangabad","lat":"22.744108","lon":"77.736969"},"HOSH":{"code":"HOSH","name":"Hoshiarpur","slug":"hoshiarpur","lat":"31.5143","lon":"75.9115"},"HOKT":{"code":"HOKT","name":"Hoskote","slug":"hoskote","lat":"13.0693","lon":"77.7982"},"HOSP":{"code":"HOSP","name":"Hospet","slug":"hospet","lat":"15.2689","lon":"76.3909"},"HSUR":{"code":"HSUR","name":"Hosur","slug":"hosur","lat":"12.735519","lon":"77.827987"},"HWRH":{"code":"HWRH","name":"Howrah","slug":"howrah","lat":"22.5958","lon":"88.2636"},"HUBL":{"code":"HUBL","name":"Hubballi (Hubli)","slug":"hubballi-hubli","lat":"15.3647","lon":"75.124"},"HNGN":{"code":"HNGN","name":"Hunagunda","slug":"hunagunda","lat":"16.0576","lon":"76.0609"},"HUSR":{"code":"HUSR","name":"Hunsur","slug":"hunsur","lat":"12.3009","lon":"76.2885"},"HSBD":{"code":"HSBD","name":"Husnabad","slug":"husnabad","lat":"18.132","lon":"79.2085"},"HULI":{"code":"HULI","name":"Huvinahadagali","slug":"huvinahadagali","lat":"15.02","lon":"75.9318"},"HZUB":{"code":"HZUB","name":"Huzurabad","slug":"huzurabad","lat":"18.2019","lon":"79.3967"},"HUZU":{"code":"HUZU","name":"Huzurnagar","slug":"huzurnagar","lat":"16.9003","lon":"79.8745"},"ICHL":{"code":"ICHL","name":"Ichalkaranji","slug":"ichalkaranji","lat":"16.709","lon":"74.4561"},"ICPR":{"code":"ICPR","name":"Ichchapuram","slug":"ichchapuram","lat":"19.1174","lon":"84.6845"},"IDPI":{"code":"IDPI","name":"Idappadi","slug":"idappadi","lat":"11.5848","lon":"77.8388"},"IDAR":{"code":"IDAR","name":"Idar","slug":"idar","lat":"23.82538","lon":"73.000556"},"IDKI":{"code":"IDKI","name":"Idukki","slug":"idukki","lat":"9.9189","lon":"77.1025"},"IEEJ":{"code":"IEEJ","name":"Ieeja","slug":"ieeja","lat":"16.0195","lon":"77.6679"},"IMPH":{"code":"IMPH","name":"Imphal","slug":"imphal","lat":"24.8061343","lon":"93.8663701"},"INDA":{"code":"INDA","name":"Indapur","slug":"indapur","lat":"18.114","lon":"75.0319"},"IIND":{"code":"IIND","name":"Indi","slug":"indi","lat":"17.1751648","lon":"75.9554927"},"IND":{"code":"IND","name":"Indore","slug":"indore","lat":"22.7287","lon":"75.8654"},"IDPA":{"code":"IDPA","name":"Indukurpeta","slug":"indukurpeta","lat":"14.4713","lon":"80.0996"},"IRNK":{"code":"IRNK","name":"Irinjalakuda","slug":"irinjalakuda","lat":"10.3447","lon":"76.2094"},"ISHW":{"code":"ISHW","name":"Ishwarpur","slug":"ishwarpur","lat":"17.049947","lon":"74.265236"},"ITNG":{"code":"ITNG","name":"Itanagar","slug":"itanagar","lat":"27.084223","lon":"93.605238"},"ITAR":{"code":"ITAR","name":"Itarsi","slug":"itarsi","lat":"22.6055","lon":"77.7535"},"JABL":{"code":"JABL","name":"Jabalpur","slug":"jabalpur","lat":"23.1667","lon":"79.95"},"JADC":{"code":"JADC","name":"Jadcherla","slug":"jadcherla","lat":"16.7626","lon":"78.1393"},"JAFF":{"code":"JAFF","name":"Jaffna","slug":"jaffna","lat":"9.660309","lon":"80.023231"},"JFFF":{"code":"JFFF","name":"Jafrabad","slug":"jafrabad","lat":"20.207","lon":"76.004"},"JAGA":{"code":"JAGA","name":"Jagalur","slug":"jagalur","lat":"14.5201","lon":"76.3377"},"JGDL":{"code":"JGDL","name":"Jagatdal","slug":"jagatdal","lat":"22.861516","lon":"88.39841"},"JATG":{"code":"JATG","name":"Jagatsinghpur","slug":"jagatsinghpur","lat":"20.2549","lon":"86.1706"},"JAGD":{"code":"JAGD","name":"Jagdalpur","slug":"jagdalpur","lat":"19.07","lon":"82.03"},"JAGG":{"code":"JAGG","name":"Jaggampeta","slug":"jaggampeta","lat":"17.1711","lon":"82.0637"},"JGGY":{"code":"JGGY","name":"Jaggayyapeta","slug":"jaggayyapeta","lat":"16.902408","lon":"80.103929"},"JGRO":{"code":"JGRO","name":"Jagraon","slug":"jagraon","lat":"30.7916","lon":"75.4694"},"JGTL":{"code":"JGTL","name":"Jagtial","slug":"jagtial","lat":"18.7909","lon":"78.9119"},"JAIJ":{"code":"JAIJ","name":"Jaijaipur","slug":"jaijaipur","lat":"21.8313","lon":"82.8164"},"JAIP":{"code":"JAIP","name":"Jaipur","slug":"jaipur","lat":"26.9124165","lon":"75.7872879"},"JSMR":{"code":"JSMR","name":"Jaisalmer","slug":"jaisalmer","lat":"26.92","lon":"70.9"},"JAJP":{"code":"JAJP","name":"Jajpur Road","slug":"jajpur-road","lat":"20.9484","lon":"86.1192"},"JTTT":{"code":"JTTT","name":"Jajpur Town (Odisha)","slug":"jajpur-town-odisha","lat":"20.8341","lon":"86.3326"},"JAKA":{"code":"JAKA","name":"Jalakandapuram","slug":"jalakandapuram","lat":"11.6966","lon":"77.8772"},"JLAB":{"code":"JLAB","name":"Jalalabad","slug":"jalalabad","lat":"30.605","lon":"74.2558"},"JALA":{"code":"JALA","name":"Jalandhar","slug":"jalandhar","lat":"31.3260152","lon":"75.5761829"},"JAUN":{"code":"JAUN","name":"Jalaun","slug":"jalaun","lat":"26.1042593","lon":"79.1657973"},"JALG":{"code":"JALG","name":"Jalgaon","slug":"jalgaon","lat":"20.998138","lon":"75.567184"},"JALN":{"code":"JALN","name":"Jalna","slug":"jalna","lat":"19.8297","lon":"75.88"},"LALO":{"code":"LALO","name":"Jalore","slug":"jalore","lat":"25.3445","lon":"72.6254"},"JPG":{"code":"JPG","name":"Jalpaiguri","slug":"jalpaiguri","lat":"26.6835","lon":"88.7689"},"JAMI":{"code":"JAMI","name":"Jami","slug":"jami","lat":"18.0508","lon":"83.2626"},"JKMY":{"code":"JKMY","name":"Jamkhambhaliya","slug":"jamkhambhaliya","lat":"22.2176","lon":"69.6579"},"JAAM":{"code":"JAAM","name":"Jamkhandi","slug":"jamkhandi","lat":"16.5043","lon":"75.2918"},"JAMK":{"code":"JAMK","name":"Jamkhed","slug":"jamkhed","lat":"18.738","lon":"75.3121"},"JAMD":{"code":"JAMD","name":"Jammalamadugu","slug":"jammalamadugu","lat":"14.8474","lon":"78.3899"},"JMKN":{"code":"JMKN","name":"Jammikunta","slug":"jammikunta","lat":"18.2891","lon":"79.4739"},"JAMM":{"code":"JAMM","name":"Jammu","slug":"jammu","lat":"34.024288","lon":"76.092468"},"JAM":{"code":"JAM","name":"Jamnagar","slug":"jamnagar","lat":"22.4707019","lon":"70.05773"},"JAMN":{"code":"JAMN","name":"Jamner","slug":"jamner","lat":"20.8096","lon":"75.7787"},"JMDP":{"code":"JMDP","name":"Jamshedpur","slug":"jamshedpur","lat":"22.805235","lon":"86.207356"},"JUMI":{"code":"JUMI","name":"Jamui","slug":"jamui","lat":"86.2259","lon":"24.9256"},"JNGN":{"code":"JNGN","name":"Jangaon","slug":"jangaon","lat":"17.7288","lon":"79.1605"},"JANG":{"code":"JANG","name":"Jangareddy Gudem","slug":"jangareddy-gudem","lat":"17.122213","lon":"81.292868"},"JANR":{"code":"JANR","name":"Janjgir","slug":"janjgir","lat":"22.0105","lon":"82.5727"},"JNNM":{"code":"JNNM","name":"Jannaram","slug":"jannaram","lat":"19.118895","lon":"78.998973"},"JAOR":{"code":"JAOR","name":"Jaora","slug":"jaora","lat":"23.6376","lon":"75.126"},"JASD":{"code":"JASD","name":"Jasdan","slug":"jasdan","lat":"22.0356","lon":"71.2018"},"JASH":{"code":"JASH","name":"Jashpur","slug":"jashpur","lat":"22.7875","lon":"83.8473"},"JATN":{"code":"JATN","name":"Jatni","slug":"jatni","lat":"20.1704","lon":"85.7059"},"JANP":{"code":"JANP","name":"Jaunpur","slug":"jaunpur","lat":"25.74909","lon":"82.696831"},"JAWA":{"code":"JAWA","name":"Jawalamukhi (Jwalaji)","slug":"jawalamukhi-jwalaji","lat":"31.875248","lon":"76.320298"},"JYAM":{"code":"JYAM","name":"Jayamkondacholapuram","slug":"jayamkondacholapuram","lat":"11.2072","lon":"79.3676"},"JYSP":{"code":"JYSP","name":"Jaysingpur","slug":"jaysingpur","lat":"16.777168","lon":"74.55036"},"JEHA":{"code":"JEHA","name":"Jehanabad","slug":"jehanabad","lat":"25.213928","lon":"84.989555"},"JEJU":{"code":"JEJU","name":"Jejuri","slug":"jejuri","lat":"18.269781","lon":"74.172478"},"JETP":{"code":"JETP","name":"Jetpur","slug":"jetpur","lat":"21.754354","lon":"70.622134"},"JEWR":{"code":"JEWR","name":"Jewar","slug":"jewar","lat":"28.1207","lon":"77.5562"},"JEYP":{"code":"JEYP","name":"Jeypore","slug":"jeypore","lat":"18.8606","lon":"82.551"},"JHAB":{"code":"JHAB","name":"Jhabua","slug":"jhabua","lat":"22.9159","lon":"74.6869"},"JHAA":{"code":"JHAA","name":"Jhajha","slug":"jhajha","lat":"24.7745","lon":"86.3757"},"JHAJ":{"code":"JHAJ","name":"Jhajjar","slug":"jhajjar","lat":"28.6176","lon":"76.6875"},"JHAL":{"code":"JHAL","name":"Jhalawar","slug":"jhalawar","lat":"24.591136","lon":"76.157659"},"JNSI":{"code":"JNSI","name":"Jhansi","slug":"jhansi","lat":"25.4484","lon":"78.5685"},"JARG":{"code":"JARG","name":"Jhargram","slug":"jhargram","lat":"22.454399","lon":"86.998199"},"JRSG":{"code":"JRSG","name":"Jharsuguda","slug":"jharsuguda","lat":"21.8554","lon":"84.0062"},"JHUN":{"code":"JHUN","name":"Jhunjhunu","slug":"jhunjhunu","lat":"28.1317","lon":"75.4022"},"JAGJ":{"code":"JAGJ","name":"Jiaganj","slug":"jiaganj","lat":"24.244104","lon":"88.268021"},"JIIG":{"code":"JIIG","name":"Jigani","slug":"jigani","lat":"12.7844","lon":"77.6419"},"JIND":{"code":"JIND","name":"Jind","slug":"jind","lat":"29.3613","lon":"76.3637"},"JINT":{"code":"JINT","name":"Jintur","slug":"jintur","lat":"19.6087","lon":"76.6846"},"JIRA":{"code":"JIRA","name":"Jirapur","slug":"jirapur","lat":"24.0180863","lon":"76.3719427"},"JODA":{"code":"JODA","name":"Joda","slug":"joda","lat":"22.0189","lon":"85.4219"},"JODH":{"code":"JODH","name":"Jodhpur","slug":"jodhpur","lat":"26.2389469","lon":"73.0243094"},"JLPI":{"code":"JLPI","name":"Jolarpettai","slug":"jolarpettai","lat":"12.5541","lon":"78.5718"},"JORT":{"code":"JORT","name":"Jorhat","slug":"jorhat","lat":"26.7465","lon":"94.2026"},"MAPR":{"code":"MAPR","name":"Joynagar Majilpur","slug":"joynagar-majilpur","lat":"22.1758","lon":"88.4178"},"JUGH":{"code":"JUGH","name":"Junagadh","slug":"junagadh","lat":"21.5222","lon":"70.4579"},"JUNA":{"code":"JUNA","name":"Junagarh","slug":"junagarh","lat":"19.8621","lon":"82.9405"},"PTDK":{"code":"PTDK","name":"K.D Peta","slug":"kd-peta","lat":"17.68969","lon":"83.01964"},"KDKL":{"code":"KDKL","name":"Kadakkal","slug":"kadakkal","lat":"8.8293","lon":"76.9222"},"KADL":{"code":"KADL","name":"Kadalundi","slug":"kadalundi","lat":"11.136","lon":"75.8272"},"KDPA":{"code":"KDPA","name":"Kadapa","slug":"kadapa","lat":"14.4674","lon":"78.8241"},"KDYM":{"code":"KDYM","name":"Kadayam","slug":"kadayam","lat":"8.832","lon":"77.357"},"KADI":{"code":"KADI","name":"Kadi","slug":"kadi","lat":"23.2979","lon":"72.331"},"KADR":{"code":"KADR","name":"Kadiri","slug":"kadiri","lat":"0","lon":"0"},"KADY":{"code":"KADY","name":"Kadiyam","slug":"kadiyam","lat":"16.9136","lon":"81.8183"},"KADT":{"code":"KADT","name":"Kadthal","slug":"kadthal","lat":"16.9837","lon":"78.5008"},"JAIK":{"code":"JAIK","name":"Kaij","slug":"kaij","lat":"18.665251","lon":"75.943092"},"KAIK":{"code":"KAIK","name":"Kaikaluru","slug":"kaikaluru","lat":"16.552723","lon":"81.212936"},"KAIT":{"code":"KAIT","name":"Kaithal","slug":"kaithal","lat":"29.799904","lon":"76.379271"},"KAAP":{"code":"KAAP","name":"Kakarapalli","slug":"kakarapalli","lat":"17.4849","lon":"82.4949"},"KAKI":{"code":"KAKI","name":"Kakinada","slug":"kakinada","lat":"16.945181","lon":"82.238647"},"GULB":{"code":"GULB","name":"Kalaburagi (Gulbarga)","slug":"kalaburagi-gulbarga","lat":"17.329731","lon":"76.8342957"},"KLDY":{"code":"KLDY","name":"Kalady","slug":"kalady","lat":"10.171","lon":"76.446"},"KANR":{"code":"KANR","name":"Kalanaur","slug":"kalanaur","lat":"28.8312","lon":"76.3956"},"KLKL":{"code":"KLKL","name":"Kalikiri","slug":"kalikiri","lat":"13.653","lon":"78.8039"},"KALI":{"code":"KALI","name":"Kalimpong","slug":"kalimpong","lat":"27.0594","lon":"88.4695"},"KLLL":{"code":"KLLL","name":"Kalla","slug":"kalla","lat":"16.5373","lon":"81.4087"},"KALC":{"code":"KALC","name":"Kallachi","slug":"kallachi","lat":"11.6863","lon":"75.6775"},"KALD":{"code":"KALD","name":"Kalladikode","slug":"kalladikode","lat":"10.8984","lon":"76.5402"},"KALL":{"code":"KALL","name":"Kallakurichi","slug":"kallakurichi","lat":"11.7387","lon":"78.9609"},"KARR":{"code":"KARR","name":"Kallara","slug":"kallara","lat":"8.759068","lon":"76.946278"},"KLUR":{"code":"KLUR","name":"Kallur","slug":"kallur","lat":"13.5572","lon":"78.9995"},"KALR":{"code":"KALR","name":"Kalluru","slug":"kalluru","lat":"17.201","lon":"80.5522"},"KALN":{"code":"KALN","name":"Kalna","slug":"kalna","lat":"23.226202","lon":"88.345525"},"KALG":{"code":"KALG","name":"Kalol (Gandhinagar)","slug":"kalol-gandhinagar","lat":"23.2464","lon":"72.5087"},"PANH":{"code":"PANH","name":"Kalol (Panchmahal)","slug":"kalol-panchmahal","lat":"22.6087","lon":"73.4622"},"KALU":{"code":"KALU","name":"Kalutara","slug":"kalutara","lat":"6.584759","lon":"79.961508"},"KALW":{"code":"KALW","name":"Kalwakurthy","slug":"kalwakurthy","lat":"16.6685","lon":"78.4906"},"KALY":{"code":"KALY","name":"Kalyani","slug":"kalyani","lat":"22.9751","lon":"88.4345"},"KMLA":{"code":"KMLA","name":"Kamalaapur","slug":"kamalaapur","lat":"18.1795","lon":"79.5223"},"KMLR":{"code":"KMLR","name":"Kamalapur","slug":"kamalapur","lat":"18.2669","lon":"80.4826"},"KMPL":{"code":"KMPL","name":"Kamalapuram","slug":"kamalapuram","lat":"14.5994","lon":"78.6698"},"KPLA":{"code":"KPLA","name":"Kamanaickenpalayam","slug":"kamanaickenpalayam","lat":"10.9067","lon":"77.2184"},"KMRD":{"code":"KMRD","name":"Kamareddy","slug":"kamareddy","lat":"18.324","lon":"78.3343"},"KPKT":{"code":"KPKT","name":"Kamavarapukota","slug":"kamavarapukota","lat":"17.0098","lon":"81.1939"},"KAMR":{"code":"KAMR","name":"Kambainallur","slug":"kambainallur","lat":"12.2079","lon":"78.3188"},"KAMP":{"code":"KAMP","name":"Kamptee","slug":"kamptee","lat":"21.2205378","lon":"79.1783575"},"KMRJ":{"code":"KMRJ","name":"Kamrej","slug":"kamrej","lat":"21.2695","lon":"72.9577"},"KAKP":{"code":"KAKP","name":"Kanakapura","slug":"kanakapura","lat":"12.546244","lon":"77.419882"},"KANA":{"code":"KANA","name":"Kanatal","slug":"kanatal","lat":"30.4137","lon":"78.3458"},"KNCH":{"code":"KNCH","name":"Kanchikacherla","slug":"kanchikacherla","lat":"16.6834","lon":"80.3904"},"KNPM":{"code":"KNPM","name":"Kanchipuram","slug":"kanchipuram","lat":"12.834368","lon":"79.698943"},"KANO":{"code":"KANO","name":"Kanchrapara","slug":"kanchrapara","lat":"22.9431","lon":"88.4361"},"KNDM":{"code":"KNDM","name":"Kandamangalam","slug":"kandamangalam","lat":"11.9133","lon":"79.6867"},"KAND":{"code":"KAND","name":"Kandukur","slug":"kandukur","lat":"15.2197","lon":"79.9025"},"KANY":{"code":"KANY","name":"Kandy","slug":"kandy","lat":"7.290889","lon":"80.632425"},"KGKM":{"code":"KGKM","name":"Kangayam","slug":"kangayam","lat":"11.005413","lon":"77.560671"},"KANG":{"code":"KANG","name":"Kangra","slug":"kangra","lat":"32.0998","lon":"76.2691"},"KKNN":{"code":"KKNN","name":"Kanhangad","slug":"kanhangad","lat":"12.3325","lon":"75.0962"},"KANC":{"code":"KANC","name":"Kanichar","slug":"kanichar","lat":"11.9054","lon":"75.7855"},"KANI":{"code":"KANI","name":"Kanigiri","slug":"kanigiri","lat":"15.4338651","lon":"79.5322344"},"KAAM":{"code":"KAAM","name":"Kanipakam","slug":"kanipakam","lat":"13.2776","lon":"79.0355"},"KNNJ":{"code":"KNNJ","name":"Kanjirappally","slug":"kanjirappally","lat":"9.5573","lon":"76.7894"},"KNKS":{"code":"KNKS","name":"Kankavli","slug":"kankavli","lat":"16.2655","lon":"73.7083"},"KANK":{"code":"KANK","name":"Kanker","slug":"kanker","lat":"20.199","lon":"81.0755"},"KADU":{"code":"KADU","name":"Kankipadu","slug":"kankipadu","lat":"16.4344","lon":"80.7678"},"KANL":{"code":"KANL","name":"Kankroli","slug":"kankroli","lat":"25.0558","lon":"73.8894"},"KANJ":{"code":"KANJ","name":"Kannauj","slug":"kannauj","lat":"27.0514","lon":"79.9137"},"KAKM":{"code":"KAKM","name":"Kanniyakumari","slug":"kanniyakumari","lat":"8.0883","lon":"77.5385"},"KANN":{"code":"KANN","name":"Kannur","slug":"kannur","lat":"11.9709","lon":"75.6208"},"KANP":{"code":"KANP","name":"Kanpur","slug":"kanpur","lat":"26.4634","lon":"80.3229"},"KTBJ":{"code":"KTBJ","name":"Kantabanji","slug":"kantabanji","lat":"20.2859","lon":"82.55"},"KAPP":{"code":"KAPP","name":"Kapadvanj","slug":"kapadvanj","lat":"23.02","lon":"73.07"},"IKGP":{"code":"IKGP","name":"Kapurthala","slug":"kapurthala","lat":"75.4018","lon":"31.3723"},"KARD":{"code":"KARD","name":"Karad","slug":"karad","lat":"17.276","lon":"74.2003"},"KARA":{"code":"KARA","name":"Karaikal","slug":"karaikal","lat":"10.9254","lon":"79.838"},"KRBK":{"code":"KRBK","name":"Karambakkudi","slug":"karambakkudi","lat":"10.4584","lon":"79.1351"},"KLAD":{"code":"KLAD","name":"Karanja Lad","slug":"karanja-lad","lat":"20.4827","lon":"77.4817"},"KARJ":{"code":"KARJ","name":"Karanjia","slug":"karanjia","lat":"21.7633","lon":"85.9739"},"KARE":{"code":"KARE","name":"Kareli","slug":"kareli","lat":"22.9286","lon":"79.0617"},"KRPL":{"code":"KRPL","name":"Karepalli","slug":"karepalli","lat":"17.5096","lon":"80.272"},"KRRD":{"code":"KRRD","name":"Kargi Road","slug":"kargi-road","lat":"22.2976","lon":"82.0263"},"KARI":{"code":"KARI","name":"Karimangalam","slug":"karimangalam","lat":"12.306","lon":"78.2045"},"KRNJ":{"code":"KRNJ","name":"Karimganj","slug":"karimganj","lat":"24.8649","lon":"92.3592"},"KARIM":{"code":"KARIM","name":"Karimnagar","slug":"karimnagar","lat":"18.5962","lon":"79.2902"},"KRYD":{"code":"KRYD","name":"Kariyad","slug":"kariyad","lat":"11.6835","lon":"75.567"},"KART":{"code":"KART","name":"Karjat","slug":"karjat","lat":"18.9192","lon":"73.3277"},"KARK":{"code":"KARK","name":"Karkala","slug":"karkala","lat":"13.214184","lon":"74.999843"},"KMML":{"code":"KMML","name":"Karmala","slug":"karmala","lat":"18.4045","lon":"75.1954"},"KRMA":{"code":"KRMA","name":"Karmamthody","slug":"karmamthody","lat":"75.1564","lon":"12.5319"},"KARN":{"code":"KARN","name":"Karnal","slug":"karnal","lat":"29.6856929","lon":"76.9904825"},"KAKC":{"code":"KAKC","name":"Karukachal","slug":"karukachal","lat":"9.512257","lon":"76.604927"},"KARG":{"code":"KARG","name":"Karunagapally","slug":"karunagapally","lat":"9.0654","lon":"76.5315"},"KARU":{"code":"KARU","name":"Karur","slug":"karur","lat":"10.8855","lon":"78.1564"},"KWAR":{"code":"KWAR","name":"Karwar","slug":"karwar","lat":"14.8185","lon":"74.1416"},"KASA":{"code":"KASA","name":"Kasaragod","slug":"kasaragod","lat":"12.5102","lon":"74.9852"},"KASD":{"code":"KASD","name":"Kasdol","slug":"kasdol","lat":"21.6275479","lon":"82.4238122"},"KASG":{"code":"KASG","name":"Kasganj","slug":"kasganj","lat":"27.8129","lon":"78.6498"},"KSHG":{"code":"KSHG","name":"Kashig","slug":"kashig","lat":"18.613073","lon":"73.539986"},"KASH":{"code":"KASH","name":"Kashipur","slug":"kashipur","lat":"29.2104","lon":"78.9619"},"KAST":{"code":"KAST","name":"Kashti","slug":"kashti","lat":"18.5499","lon":"74.5829"},"KSBG":{"code":"KSBG","name":"Kasibugga","slug":"kasibugga","lat":"18.7665","lon":"84.433"},"KATG":{"code":"KATG","name":"Katghora","slug":"katghora","lat":"22.505","lon":"82.5457"},"KATP":{"code":"KATP","name":"Kathipudi","slug":"kathipudi","lat":"17.2418","lon":"82.3371"},"KATM":{"code":"KATM","name":"Kathmandu","slug":"kathmandu","lat":"27.7090319","lon":"85.2911134"},"KATH":{"code":"KATH","name":"Kathua","slug":"kathua","lat":"32.3865","lon":"75.5173"},"KATI":{"code":"KATI","name":"Katihar","slug":"katihar","lat":"25.552","lon":"87.5719"},"KATN":{"code":"KATN","name":"Katni","slug":"katni","lat":"23.8308","lon":"80.4072"},"KATR":{"code":"KATR","name":"Katra","slug":"katra","lat":"32.991809","lon":"74.932401"},"KTRN":{"code":"KTRN","name":"Katrenikona","slug":"katrenikona","lat":"16.5828","lon":"82.1537"},"KATT":{"code":"KATT","name":"Kattanam","slug":"kattanam","lat":"9.176939","lon":"76.563574"},"AWCK":{"code":"AWCK","name":"Kattappana","slug":"kattappana","lat":"9.753502","lon":"77.112271"},"KATW":{"code":"KATW","name":"Katwa","slug":"katwa","lat":"23.6412803","lon":"88.095648"},"KAUS":{"code":"KAUS","name":"Kaushambi","slug":"kaushambi","lat":"25.3611","lon":"81.4032"},"KVLI":{"code":"KVLI","name":"Kavali","slug":"kavali","lat":"14.9132","lon":"79.993"},"KVMT":{"code":"KVMT","name":"Kavathe Mahankal","slug":"kavathe-mahankal","lat":"17.009","lon":"74.8653"},"KANM":{"code":"KANM","name":"Kaveripattinam","slug":"kaveripattinam","lat":"12.4215","lon":"78.2174"},"KAVT":{"code":"KAVT","name":"Kaviti","slug":"kaviti","lat":"19.0094","lon":"84.6884"},"KAWA":{"code":"KAWA","name":"Kawardha","slug":"kawardha","lat":"22.009","lon":"81.2243"},"KAYA":{"code":"KAYA","name":"Kayamkulam","slug":"kayamkulam","lat":"9.1748","lon":"76.5013"},"KAZK":{"code":"KAZK","name":"Kazhakkoottam","slug":"kazhakkoottam","lat":"8.5686","lon":"76.8731"},"KAZI":{"code":"KAZI","name":"Kazipet","slug":"kazipet","lat":"17.972366","lon":"79.503448"},"KEGL":{"code":"KEGL","name":"Kegalle","slug":"kegalle","lat":"7.252298","lon":"80.340821"},"KEKR":{"code":"KEKR","name":"Kekri","slug":"kekri","lat":"25.9748","lon":"75.1529"},"KNDR":{"code":"KNDR","name":"Kendrapara","slug":"kendrapara","lat":"20.5035","lon":"86.4199"},"KNJH":{"code":"KNJH","name":"Keonjhar","slug":"keonjhar","lat":"21.6289","lon":"85.5817"},"KESA":{"code":"KESA","name":"Kesamudram","slug":"kesamudram","lat":"17.6978","lon":"79.8913"},"KEGA":{"code":"KEGA","name":"Kesinga","slug":"kesinga","lat":"20.185","lon":"83.2104"},"KEVA":{"code":"KEVA","name":"Kevadia","slug":"kevadia","lat":"21.882","lon":"73.7037"},"KHCU":{"code":"KHCU","name":"Khachrod","slug":"khachrod","lat":"23.4216","lon":"75.2798"},"KADA":{"code":"KADA","name":"Khadda","slug":"khadda","lat":"26.9256","lon":"83.9473"},"KHAI":{"code":"KHAI","name":"Khajani","slug":"khajani","lat":"26.6559","lon":"83.2519"},"KHAJ":{"code":"KHAJ","name":"Khajipet","slug":"khajipet","lat":"14.6587","lon":"78.7533"},"KHRH":{"code":"KHRH","name":"Khajuraho","slug":"khajuraho","lat":"24.857005","lon":"79.92434"},"KHAZ":{"code":"KHAZ","name":"Khajuri","slug":"khajuri","lat":"24.1736","lon":"83.7491"},"KHBD":{"code":"KHBD","name":"Khalilabad","slug":"khalilabad","lat":"26.7774","lon":"83.0657"},"KHBH":{"code":"KHBH","name":"Khambhat","slug":"khambhat","lat":"22.3181","lon":"72.619"},"KHMG":{"code":"KHMG","name":"Khamgaon","slug":"khamgaon","lat":"20.713197","lon":"76.565047"},"KHAM":{"code":"KHAM","name":"Khammam","slug":"khammam","lat":"17.25","lon":"80.15"},"KHPR":{"code":"KHPR","name":"Khanapur","slug":"khanapur","lat":"19.041206","lon":"78.648404"},"KHND":{"code":"KHND","name":"Khandela","slug":"khandela","lat":"25.2225","lon":"76.8894"},"KHDW":{"code":"KHDW","name":"Khandwa","slug":"khandwa","lat":"21.849689","lon":"76.324942"},"KHAN":{"code":"KHAN","name":"Khanna","slug":"khanna","lat":"30.6979","lon":"76.2112"},"KGPR":{"code":"KGPR","name":"Kharagpur","slug":"kharagpur","lat":"22.346","lon":"87.232"},"KHAG":{"code":"KHAG","name":"Kharghar","slug":"kharghar","lat":"19.0473","lon":"73.0699"},"KHAR":{"code":"KHAR","name":"Khargone","slug":"khargone","lat":"21.9029","lon":"75.8069"},"KHRR":{"code":"KHRR","name":"Khariar Road","slug":"khariar-road","lat":"20.8968","lon":"82.5105"},"KHAS":{"code":"KHAS","name":"Kharsia","slug":"kharsia","lat":"21.9893","lon":"83.0976"},"KTEG":{"code":"KTEG","name":"Khategaon","slug":"khategaon","lat":"22.5918","lon":"76.9068"},"KHTM":{"code":"KHTM","name":"Khatima","slug":"khatima","lat":"28.9209","lon":"79.9696"},"KHAT":{"code":"KHAT","name":"Khatta","slug":"khatta","lat":"28.9177","lon":"77.3296"},"KHED":{"code":"KHED","name":"Khed","slug":"khed","lat":"17.7196","lon":"73.3968"},"KHDA":{"code":"KHDA","name":"Kheda","slug":"kheda","lat":"22.748842","lon":"72.68635"},"KHMA":{"code":"KHMA","name":"Khedbrahma","slug":"khedbrahma","lat":"24.0291","lon":"73.0435"},"KHIL":{"code":"KHIL","name":"Khila","slug":"khila","lat":"22.668635","lon":"88.008171"},"KHOP":{"code":"KHOP","name":"Khopoli","slug":"khopoli","lat":"18.789","lon":"73.3414"},"KHOW":{"code":"KHOW","name":"Khowai","slug":"khowai","lat":"24.0672","lon":"91.6057"},"KHUM":{"code":"KHUM","name":"Khumulwng","slug":"khumulwng","lat":"23.7983","lon":"91.4386"},"KHUR":{"code":"KHUR","name":"Khurja","slug":"khurja","lat":"28.2514","lon":"77.8539"},"KCHA":{"code":"KCHA","name":"Kichha","slug":"kichha","lat":"28.9087","lon":"79.5098"},"KILI":{"code":"KILI","name":"Kilimanoor","slug":"kilimanoor","lat":"8.7701","lon":"76.8808"},"KILL":{"code":"KILL","name":"Kilinochchi","slug":"kilinochchi","lat":"9.377604","lon":"80.380375"},"KIMG":{"code":"KIMG","name":"Kim","slug":"kim","lat":"21.402986","lon":"72.925386"},"KIAV":{"code":"KIAV","name":"Kinathukadavu","slug":"kinathukadavu","lat":"10.8181096","lon":"76.9904493"},"KNRU":{"code":"KNRU","name":"Kinnaur","slug":"kinnaur","lat":"31.424543","lon":"78.264756"},"KIDI":{"code":"KIDI","name":"Kirlampudi","slug":"kirlampudi","lat":"17.2005","lon":"82.1795"},"KSGJ":{"code":"KSGJ","name":"Kishanganj","slug":"kishanganj","lat":"26.0938978","lon":"87.9121249"},"KISH":{"code":"KISH","name":"Kishangarh","slug":"kishangarh","lat":"26.588","lon":"74.8589"},"KODA":{"code":"KODA","name":"Kodad","slug":"kodad","lat":"16.9951","lon":"79.972"},"COOR":{"code":"COOR","name":"Kodagu (Coorg)","slug":"kodagu-coorg","lat":"12.3375","lon":"75.8069"},"KDGP":{"code":"KDGP","name":"Kodagu (Siddapura)","slug":"kodagu-siddapura","lat":"12.4183","lon":"75.7408"},"KODI":{"code":"KODI","name":"Kodaikanal","slug":"kodaikanal","lat":"10.2381","lon":"77.4892"},"KDKR":{"code":"KDKR","name":"Kodakara","slug":"kodakara","lat":"10.3723","lon":"76.3053"},"KOLY":{"code":"KOLY","name":"Kodaly","slug":"kodaly","lat":"10.3759","lon":"76.374"},"KODZ":{"code":"KODZ","name":"Koderma","slug":"koderma","lat":"24.466786","lon":"85.589836"},"KODM":{"code":"KODM","name":"Kodumur","slug":"kodumur","lat":"15.686339","lon":"77.770747"},"KODU":{"code":"KODU","name":"Kodungallur","slug":"kodungallur","lat":"10.2244","lon":"76.1978"},"KOHI":{"code":"KOHI","name":"Kohima","slug":"kohima","lat":"25.6586","lon":"94.1053"},"KOIL":{"code":"KOIL","name":"Koilkuntla","slug":"koilkuntla","lat":"15.2304","lon":"78.3174"},"KKJR":{"code":"KKJR","name":"Kokrajhar","slug":"kokrajhar","lat":"26.5136","lon":"90.2245"},"OLAR":{"code":"OLAR","name":"Kolar","slug":"kolar","lat":"13.136089","lon":"78.129937"},"KOLH":{"code":"KOLH","name":"Kolhapur","slug":"kolhapur","lat":"16.691308","lon":"74.244866"},"KOLM":{"code":"KOLM","name":"Kollam","slug":"kollam","lat":"8.8932","lon":"76.6141"},"KOLL":{"code":"KOLL","name":"Kollapur","slug":"kollapur","lat":"16.106384","lon":"78.318735"},"KOLE":{"code":"KOLE","name":"Kollengode","slug":"kollengode","lat":"10.6139","lon":"76.6908"},"KOLP":{"code":"KOLP","name":"Kolluru","slug":"kolluru","lat":"16.1826","lon":"80.7969"},"KOMA":{"code":"KOMA","name":"Komarapalayam","slug":"komarapalayam","lat":"11.4467","lon":"77.6943"},"KOMG":{"code":"KOMG","name":"Kommugudem","slug":"kommugudem","lat":"16.9282","lon":"81.2491"},"KNGN":{"code":"KNGN","name":"Kondagaon","slug":"kondagaon","lat":"19.5959","lon":"81.6638"},"KNDA":{"code":"KNDA","name":"Kondamallepally","slug":"kondamallepally","lat":"16.4257","lon":"78.585"},"KNAI":{"code":"KNAI","name":"Kondlahalli","slug":"kondlahalli","lat":"14.596319","lon":"76.716336"},"KNTH":{"code":"KNTH","name":"Konithiwada","slug":"konithiwada","lat":"16.6","lon":"81.6556"},"KONI":{"code":"KONI","name":"Konni","slug":"konni","lat":"9.2267","lon":"76.8497"},"KTTM":{"code":"KTTM","name":"Koothattukulam","slug":"koothattukulam","lat":"9.8627","lon":"76.5942"},"KOPG":{"code":"KOPG","name":"Kopargaon","slug":"kopargaon","lat":"19.8849","lon":"74.4728"},"KOPP":{"code":"KOPP","name":"Koppam","slug":"koppam","lat":"10.8652","lon":"76.1866"},"KOPT":{"code":"KOPT","name":"Koraput","slug":"koraput","lat":"18.8135","lon":"82.7123"},"ORAG":{"code":"ORAG","name":"Koratagere","slug":"koratagere","lat":"13.5212","lon":"77.239403"},"KRBA":{"code":"KRBA","name":"Korba","slug":"korba","lat":"22.3595","lon":"82.7501"},"KRKN":{"code":"KRKN","name":"Korukonda","slug":"korukonda","lat":"17.1702","lon":"81.8273"},"KCKA":{"code":"KCKA","name":"Korutla","slug":"korutla","lat":"18.8269","lon":"78.714"},"KORW":{"code":"KORW","name":"Korwa","slug":"korwa","lat":"26.2075","lon":"81.8252"},"KOSA":{"code":"KOSA","name":"Kosamba","slug":"kosamba","lat":"21.4554","lon":"72.9579"},"KOSG":{"code":"KOSG","name":"Kosgi","slug":"kosgi","lat":"16.9878","lon":"77.7169"},"KOOO":{"code":"KOOO","name":"Kosi Kalan","slug":"kosi-kalan","lat":"27.7873","lon":"77.4371"},"KOTA":{"code":"KOTA","name":"Kota","slug":"kota","lat":"25.1695114","lon":"75.8539898"},"KOAN":{"code":"KOAN","name":"Kota (AP)","slug":"kota-ap","lat":"14.0352","lon":"80.0465"},"KTAB":{"code":"KTAB","name":"Kotabommali","slug":"kotabommali","lat":"18.5184","lon":"84.1514"},"KTND":{"code":"KTND","name":"Kotananduru","slug":"kotananduru","lat":"17.482865","lon":"82.488968"},"KOTD":{"code":"KOTD","name":"Kotdwara","slug":"kotdwara","lat":"29.7524","lon":"78.5269"},"KTCR":{"code":"KTCR","name":"Kothacheruvu","slug":"kothacheruvu","lat":"14.1884","lon":"77.7652"},"KTGM":{"code":"KTGM","name":"Kothagudem","slug":"kothagudem","lat":"17.556","lon":"80.6144"},"KOTL":{"code":"KOTL","name":"Kothakota","slug":"kothakota","lat":"16.3787","lon":"77.941"},"KTMM":{"code":"KTMM","name":"Kothamangalam","slug":"kothamangalam","lat":"10.0602","lon":"76.6351"},"KOTC":{"code":"KOTC","name":"Kothapalli","slug":"kothapalli","lat":"17.2878","lon":"81.8943"},"KTPE":{"code":"KTPE","name":"Kothapeta","slug":"kothapeta","lat":"16.716","lon":"81.8958"},"KTVL":{"code":"KTVL","name":"Kothavalasa","slug":"kothavalasa","lat":"17.8909","lon":"83.1908"},"KOTK":{"code":"KOTK","name":"Kotkapura","slug":"kotkapura","lat":"30.5913","lon":"74.8115"},"KOTM":{"code":"KOTM","name":"Kotma","slug":"kotma","lat":"23.208326","lon":"81.97924"},"KTPD":{"code":"KTPD","name":"Kotpad","slug":"kotpad","lat":"19.141944","lon":"82.328376"},"KPLI":{"code":"KPLI","name":"Kotputli","slug":"kotputli","lat":"27.7046","lon":"76.2013"},"KOKK":{"code":"KOKK","name":"Kottakkal","slug":"kottakkal","lat":"10.999","lon":"75.9918"},"KTYM":{"code":"KTYM","name":"Kottayam","slug":"kottayam","lat":"9.591649","lon":"76.522065"},"KOTT":{"code":"KOTT","name":"Kottayi","slug":"kottayi","lat":"10.7469","lon":"76.543"},"KTTY":{"code":"KTTY","name":"Kottiyam","slug":"kottiyam","lat":"8.86601","lon":"76.670837"},"KTUR":{"code":"KTUR","name":"Kotturu","slug":"kotturu","lat":"18.73073","lon":"84.09572"},"KOVI":{"code":"KOVI","name":"Kovilpatti","slug":"kovilpatti","lat":"9.1674","lon":"77.8767"},"KOVR":{"code":"KOVR","name":"Kovur (Nellore)","slug":"kovur-nellore","lat":"14.5012","lon":"79.9881"},"KOVU":{"code":"KOVU","name":"Kovvur","slug":"kovvur","lat":"17.012685","lon":"81.726888"},"KOEM":{"code":"KOEM","name":"Koyyalagudem","slug":"koyyalagudem","lat":"17.4521","lon":"81.6528"},"KOZH":{"code":"KOZH","name":"Kozhikode","slug":"kozhikode","lat":"11.2558266","lon":"75.740774"},"KOZA":{"code":"KOZA","name":"Kozhinjampara","slug":"kozhinjampara","lat":"10.7402","lon":"76.8346"},"KRHN":{"code":"KRHN","name":"Krishnagiri","slug":"krishnagiri","lat":"12.5186","lon":"78.2137"},"KNWB":{"code":"KNWB","name":"Krishnanagar","slug":"krishnanagar","lat":"23.4016752","lon":"88.4633082"},"KRJT":{"code":"KRJT","name":"Krishnarajanagara","slug":"krishnarajanagara","lat":"12.44","lon":"76.3811"},"KEKE":{"code":"KEKE","name":"Krishnarajpete (K.R.Pete)","slug":"krishnarajpete-krpete","lat":"12.6558","lon":"76.4881"},"KRSR":{"code":"KRSR","name":"Krosuru","slug":"krosuru","lat":"16.5453","lon":"80.1401"},"KRTH":{"code":"KRTH","name":"Kruthivennu","slug":"kruthivennu","lat":"16.3746","lon":"81.3564"},"KHCY":{"code":"KHCY","name":"Kuchaman City","slug":"kuchaman-city","lat":"27.147","lon":"74.8566"},"KCPD":{"code":"KCPD","name":"Kuchipudi","slug":"kuchipudi","lat":"16.2542","lon":"80.918"},"KUDU":{"code":"KUDU","name":"Kudus","slug":"kudus","lat":"19.5328","lon":"73.0974"},"KUAG":{"code":"KUAG","name":"Kujang","slug":"kujang","lat":"20.3174","lon":"86.5274"},"KUJU":{"code":"KUJU","name":"Kuju","slug":"kuju","lat":"23.7297","lon":"85.5112"},"KUKS":{"code":"KUKS","name":"Kukshi","slug":"kukshi","lat":"22.2068","lon":"74.7557"},"KULI":{"code":"KULI","name":"Kulithalai","slug":"kulithalai","lat":"10.9373","lon":"78.4212"},"KULU":{"code":"KULU","name":"Kullu","slug":"kullu","lat":"31.957851","lon":"77.1094597"},"KMOA":{"code":"KMOA","name":"Kumarakom","slug":"kumarakom","lat":"9.5946","lon":"76.430946"},"KUMB":{"code":"KUMB","name":"Kumbakonam","slug":"kumbakonam","lat":"10.9617","lon":"79.3881"},"KUMI":{"code":"KUMI","name":"Kumily","slug":"kumily","lat":"9.6037","lon":"77.1675"},"KUDD":{"code":"KUDD","name":"Kunda","slug":"kunda","lat":"25.7175","lon":"81.5212"},"KUNA":{"code":"KUNA","name":"Kundapura","slug":"kundapura","lat":"13.6236106","lon":"74.6759175"},"KUUN":{"code":"KUUN","name":"Kunigal","slug":"kunigal","lat":"13.0255","lon":"77.0255"},"KKRI":{"code":"KKRI","name":"Kunkuri","slug":"kunkuri","lat":"22.742543","lon":"83.953349"},"KUNN":{"code":"KUNN","name":"Kunnamkulam","slug":"kunnamkulam","lat":"10.6516","lon":"76.0711"},"KUPP":{"code":"KUPP","name":"Kuppam","slug":"kuppam","lat":"12.7482","lon":"78.3461"},"KURA":{"code":"KURA","name":"Kuravilangad","slug":"kuravilangad","lat":"9.7576","lon":"76.561"},"KURN":{"code":"KURN","name":"Kurnool","slug":"kurnool","lat":"15.8281","lon":"78.0373"},"KURS":{"code":"KURS","name":"Kurseong","slug":"kurseong","lat":"26.882313","lon":"88.279193"},"KRDU":{"code":"KRDU","name":"Kurud","slug":"kurud","lat":"20.8304","lon":"81.7084"},"KURU":{"code":"KURU","name":"Kurukshetra","slug":"kurukshetra","lat":"29.9695121","lon":"76.878282"},"KURY":{"code":"KURY","name":"Kurumaseri","slug":"kurumaseri","lat":"10.1803","lon":"76.3319"},"KURD":{"code":"KURD","name":"Kurundwad","slug":"kurundwad","lat":"16.6809","lon":"74.5906"},"KUUR":{"code":"KUUR","name":"Kurunegala","slug":"kurunegala","lat":"7.482175","lon":"80.359503"},"KUSA":{"code":"KUSA","name":"Kushalnagar","slug":"kushalnagar","lat":"12.4555","lon":"75.957"},"KUSH":{"code":"KUSH","name":"Kushinagar","slug":"kushinagar","lat":"26.7399","lon":"83.887"},"KKKL":{"code":"KKKL","name":"Kusumgram","slug":"kusumgram","lat":"23.389038","lon":"88.12944"},"KTCH":{"code":"KTCH","name":"Kutch","slug":"kutch","lat":"23.7337","lon":"69.8597"},"KUTH":{"code":"KUTH","name":"Kuthuparamba","slug":"kuthuparamba","lat":"11.8319","lon":"75.5655"},"LEHA":{"code":"LEHA","name":"Ladakh","slug":"ladakh","lat":"34.15258","lon":"77.57704"},"ALKP":{"code":"ALKP","name":"Lakhanpur","slug":"lakhanpur","lat":"22.968267","lon":"83.022842"},"LAHA":{"code":"LAHA","name":"Lakhimpur","slug":"lakhimpur","lat":"27.2064","lon":"94.1514"},"LKPK":{"code":"LKPK","name":"Lakhimpur Kheri","slug":"lakhimpur-kheri","lat":"27.947147","lon":"80.777747"},"LASK":{"code":"LASK","name":"Lakhisarai","slug":"lakhisarai","lat":"25.1571","lon":"86.0952"},"LRAM":{"code":"LRAM","name":"Lakkavaram","slug":"lakkavaram","lat":"15.6995","lon":"79.7947"},"LKSR":{"code":"LKSR","name":"Laksar","slug":"laksar","lat":"29.4456","lon":"78.0126"},"LKSH":{"code":"LKSH","name":"Lakshmeshwara","slug":"lakshmeshwara","lat":"15.1275","lon":"75.4723"},"LKMP":{"code":"LKMP","name":"Lakshmikantapur","slug":"lakshmikantapur","lat":"22.1099","lon":"88.3209"},"LALG":{"code":"LALG","name":"Lalgudi","slug":"lalgudi","lat":"10.8750317","lon":"78.8071847"},"LLTP":{"code":"LLTP","name":"Lalitpur","slug":"lalitpur","lat":"24.68813","lon":"78.39659"},"LADW":{"code":"LADW","name":"Lansdowne","slug":"lansdowne","lat":"29.8377","lon":"78.6871"},"LAT":{"code":"LAT","name":"Latur","slug":"latur","lat":"18.399821","lon":"76.559543"},"LAVA":{"code":"LAVA","name":"Lavasa","slug":"lavasa","lat":"18.4077","lon":"73.5075"},"LEEJ":{"code":"LEEJ","name":"Leeja","slug":"leeja","lat":"16.0195","lon":"77.6679"},"LEHL":{"code":"LEHL","name":"Leh","slug":"leh","lat":"34.1526","lon":"77.5771"},"LIKA":{"code":"LIKA","name":"Likabali","slug":"likabali","lat":"27.67285","lon":"94.687"},"LING":{"code":"LING","name":"Lingasugur","slug":"lingasugur","lat":"16.155","lon":"76.5199"},"LOHA":{"code":"LOHA","name":"Lohardaga","slug":"lohardaga","lat":"23.4770797","lon":"84.3900577"},"LONZ":{"code":"LONZ","name":"Lonand","slug":"lonand","lat":"18.0417","lon":"74.1862"},"LONA":{"code":"LONA","name":"Lonar","slug":"lonar","lat":"19.984737","lon":"76.521237"},"LNVL":{"code":"LNVL","name":"Lonavala","slug":"lonavala","lat":"18.748101","lon":"73.405629"},"LONI":{"code":"LONI","name":"Loni","slug":"loni","lat":"18.6558","lon":"75.4083"},"LUCK":{"code":"LUCK","name":"Lucknow","slug":"lucknow","lat":"26.8465108","lon":"80.9466832"},"LUDH":{"code":"LUDH","name":"Ludhiana","slug":"ludhiana","lat":"30.900965","lon":"75.8572758"},"LUNA":{"code":"LUNA","name":"Lunawada","slug":"lunawada","lat":"23.13","lon":"73.6109"},"LAKS":{"code":"LAKS","name":"Luxettipet","slug":"luxettipet","lat":"18.8755","lon":"79.2028"},"MUNN":{"code":"MUNN","name":"MUNNAR","slug":"munnar","lat":"10.0889","lon":"77.0595"},"MACH":{"code":"MACH","name":"Macherla","slug":"macherla","lat":"16.476","lon":"79.4394"},"MAPM":{"code":"MAPM","name":"Machilipatnam","slug":"machilipatnam","lat":"16.1905","lon":"81.1362"},"MADA":{"code":"MADA","name":"Madalu","slug":"madalu","lat":"13.4749","lon":"76.3695"},"MDNP":{"code":"MDNP","name":"Madanapalle","slug":"madanapalle","lat":"13.5603","lon":"78.5036"},"MADD":{"code":"MADD","name":"Maddur","slug":"maddur","lat":"12.5839","lon":"77.0435"},"MDHA":{"code":"MDHA","name":"Madhavaram","slug":"madhavaram","lat":"16.9065357","lon":"80.6937077"},"MHEA":{"code":"MHEA","name":"Madhepura","slug":"madhepura","lat":"25.924","lon":"86.7946"},"MADR":{"code":"MADR","name":"Madhira","slug":"madhira","lat":"16.9236","lon":"80.3686"},"MADZ":{"code":"MADZ","name":"Madhubani","slug":"madhubani","lat":"26.3483","lon":"86.0712"},"MADH":{"code":"MADH","name":"Madhugiri","slug":"madhugiri","lat":"13.66013","lon":"77.21232"},"MADI":{"code":"MADI","name":"Madikeri","slug":"madikeri","lat":"12.4244","lon":"75.7382"},"MDGL":{"code":"MDGL","name":"Madugula","slug":"madugula","lat":"17.9154","lon":"82.8124"},"MADU":{"code":"MADU","name":"Madurai","slug":"madurai","lat":"9.9252007","lon":"78.1197754"},"MCCV":{"code":"MCCV","name":"Maduranthakam","slug":"maduranthakam","lat":"12.51167","lon":"79.88485"},"MAGA":{"code":"MAGA","name":"Magadi","slug":"magadi","lat":"12.9577","lon":"77.2261"},"MABL":{"code":"MABL","name":"Mahabaleshwar","slug":"mahabaleshwar","lat":"17.9307","lon":"73.6477"},"MAHA":{"code":"MAHA","name":"Mahabubabad","slug":"mahabubabad","lat":"17.5975","lon":"80.0015"},"MHAD":{"code":"MHAD","name":"Mahad","slug":"mahad","lat":"18.109394","lon":"73.418459"},"MAGP":{"code":"MAGP","name":"Mahalingpur","slug":"mahalingpur","lat":"16.3897","lon":"75.1108"},"RAJG":{"code":"RAJG","name":"Maharajganj","slug":"maharajganj","lat":"27.1494321","lon":"83.544834"},"MAMU":{"code":"MAMU","name":"Mahasamund","slug":"mahasamund","lat":"21.1091","lon":"82.0979"},"MAHB":{"code":"MAHB","name":"Mahbubnagar","slug":"mahbubnagar","lat":"16.3841","lon":"78.1108"},"MAHM":{"code":"MAHM","name":"Mahemdavad","slug":"mahemdavad","lat":"22.8256","lon":"72.7571"},"MAHS":{"code":"MAHS","name":"Maheshtala","slug":"maheshtala","lat":"22.5056","lon":"88.25"},"MAHE":{"code":"MAHE","name":"Maheshwar","slug":"maheshwar","lat":"22.1773","lon":"75.583"},"MHSR":{"code":"MHSR","name":"Maheshwaram","slug":"maheshwaram","lat":"17.132875","lon":"78.43665"},"MMAI":{"code":"MMAI","name":"Mahishadal","slug":"mahishadal","lat":"22.1814","lon":"87.9898"},"MHBA":{"code":"MHBA","name":"Mahoba","slug":"mahoba","lat":"25.294978","lon":"79.869063"},"MAHU":{"code":"MAHU","name":"Mahudha","slug":"mahudha","lat":"22.8187","lon":"72.941"},"MAHV":{"code":"MAHV","name":"Mahuva","slug":"mahuva","lat":"21.0942","lon":"71.756104"},"MAIN":{"code":"MAIN","name":"Mainpuri","slug":"mainpuri","lat":"79.025167","lon":"27.228197"},"MAKA":{"code":"MAKA","name":"Makrana","slug":"makrana","lat":"27.0377016","lon":"74.6931442"},"MAKT":{"code":"MAKT","name":"Makthal","slug":"makthal","lat":"16.5021","lon":"77.5075"},"MALP":{"code":"MALP","name":"Malappuram","slug":"malappuram","lat":"11.0732","lon":"76.074"},"MALD":{"code":"MALD","name":"Malda","slug":"malda","lat":"25.1786","lon":"88.2461"},"MEBN":{"code":"MEBN","name":"Malebennur","slug":"malebennur","lat":"14.352182","lon":"75.739651"},"MALE":{"code":"MALE","name":"Malegaon","slug":"malegaon","lat":"20.5505","lon":"74.5309"},"MALR":{"code":"MALR","name":"Malerkotla","slug":"malerkotla","lat":"30.5232","lon":"75.8883"},"MALK":{"code":"MALK","name":"Malikipuram","slug":"malikipuram","lat":"16.4043","lon":"81.806"},"MALG":{"code":"MALG","name":"Malkangiri","slug":"malkangiri","lat":"18.3504807","lon":"81.8708595"},"MAMA":{"code":"MAMA","name":"Malkapur","slug":"malkapur","lat":"20.8865","lon":"76.2163"},"MAAL":{"code":"MAAL","name":"Mall","slug":"mall","lat":"16.9691835","lon":"78.7290468"},"MALO":{"code":"MALO","name":"Malout","slug":"malout","lat":"30.1892","lon":"74.5053"},"MLLR":{"code":"MLLR","name":"Malur","slug":"malur","lat":"13.0037","lon":"77.9383"},"MMLL":{"code":"MMLL","name":"Mamallapuram","slug":"mamallapuram","lat":"12.6269","lon":"80.1927"},"MANA":{"code":"MANA","name":"Manali","slug":"manali","lat":"32.2396325","lon":"77.1887145"},"MNMI":{"code":"MNMI","name":"Manamadurai","slug":"manamadurai","lat":"9.689","lon":"78.4581"},"MAVY":{"code":"MAVY","name":"Mananthavady","slug":"mananthavady","lat":"11.8014","lon":"76.0044"},"MAPI":{"code":"MAPI","name":"Manapparai","slug":"manapparai","lat":"10.607463","lon":"78.421338"},"MANW":{"code":"MANW","name":"Manawar","slug":"manawar","lat":"22.2367","lon":"75.0874"},"MANC":{"code":"MANC","name":"Mancherial","slug":"mancherial","lat":"18.8756","lon":"79.4591"},"MAND":{"code":"MAND","name":"Mandapeta","slug":"mandapeta","lat":"16.8653","lon":"81.9262"},"MNWS":{"code":"MNWS","name":"Mandarmoni","slug":"mandarmoni","lat":"21.6681","lon":"87.7025"},"MDAS":{"code":"MDAS","name":"Mandasa","slug":"mandasa","lat":"18.872422","lon":"84.460637"},"MMND":{"code":"MMND","name":"Mandav","slug":"mandav","lat":"22.334701","lon":"75.402345"},"MARJ":{"code":"MARJ","name":"Mandawa","slug":"mandawa","lat":"28.0529974","lon":"75.1312383"},"MIHP":{"code":"MIHP","name":"Mandi","slug":"mandi","lat":"31.7082","lon":"76.9314"},"DABW":{"code":"DABW","name":"Mandi Dabwali","slug":"mandi-dabwali","lat":"29.9671","lon":"74.7001"},"MBBH":{"code":"MBBH","name":"Mandi Gobindgarh","slug":"mandi-gobindgarh","lat":"30.6637","lon":"76.3"},"MADL":{"code":"MADL","name":"Mandla","slug":"mandla","lat":"22.5957857","lon":"80.3618789"},"MNDS":{"code":"MNDS","name":"Mandsaur","slug":"mandsaur","lat":"24.0768","lon":"75.0693"},"MAVI":{"code":"MAVI","name":"Mandvi","slug":"mandvi","lat":"22.84817","lon":"69.37743"},"MNDW":{"code":"MNDW","name":"Mandwa","slug":"mandwa","lat":"17.5567","lon":"73.9704"},"MND":{"code":"MND","name":"Mandya","slug":"mandya","lat":"12.5644","lon":"76.7337"},"MANE":{"code":"MANE","name":"Manendragarh","slug":"manendragarh","lat":"23.2146552","lon":"82.1878944"},"MGLR":{"code":"MGLR","name":"Mangalagiri","slug":"mangalagiri","lat":"16.4332546","lon":"80.5521406"},"MANG":{"code":"MANG","name":"Mangaldoi","slug":"mangaldoi","lat":"26.4463","lon":"92.0322"},"MLR":{"code":"MLR","name":"Mangaluru (Mangalore)","slug":"mangaluru-mangalore","lat":"12.91379","lon":"74.853977"},"MNGW":{"code":"MNGW","name":"Mangalwedha","slug":"mangalwedha","lat":"17.511","lon":"75.452"},"MNGR":{"code":"MNGR","name":"Mangar","slug":"mangar","lat":"28.3787451","lon":"77.1742558"},"MNAP":{"code":"MNAP","name":"Manikonda (AP)","slug":"manikonda-ap","lat":"16.4502","lon":"80.8366"},"MANI":{"code":"MANI","name":"Manipal","slug":"manipal","lat":"13.350338","lon":"74.787312"},"MAJR":{"code":"MAJR","name":"Manjeri","slug":"manjeri","lat":"11.1203","lon":"76.12"},"MNMD":{"code":"MNMD","name":"Manmad","slug":"manmad","lat":"20.2512","lon":"74.4366"},"MANN":{"code":"MANN","name":"Mannar","slug":"mannar","lat":"8.979887","lon":"79.901359"},"MANB":{"code":"MANB","name":"Mannargudi","slug":"mannargudi","lat":"10.6649","lon":"79.4507"},"MKKA":{"code":"MKKA","name":"Mannarkkad","slug":"mannarkkad","lat":"10.9932","lon":"76.461"},"MANR":{"code":"MANR","name":"Mannur","slug":"mannur","lat":"13.0231","lon":"79.957"},"MNSA":{"code":"MNSA","name":"Mansa","slug":"mansa","lat":"29.9995","lon":"75.3937"},"MATY":{"code":"MATY","name":"Manthani","slug":"manthani","lat":"18.651","lon":"79.6682"},"MNGU":{"code":"MNGU","name":"Manuguru","slug":"manuguru","lat":"17.9312","lon":"80.8266"},"MLAK":{"code":"MLAK","name":"Manvi","slug":"manvi","lat":"15.9951","lon":"77.0478"},"MMNR":{"code":"MMNR","name":"Maraimalai Nagar","slug":"maraimalai-nagar","lat":"12.793","lon":"80.0252"},"MAYR":{"code":"MAYR","name":"Marayur","slug":"marayur","lat":"10.2762","lon":"77.1615"},"MARG":{"code":"MARG","name":"Margao","slug":"margao","lat":"15.2832","lon":"73.9862"},"MARH":{"code":"MARH","name":"Margherita","slug":"margherita","lat":"27.2911","lon":"95.6695"},"MARK":{"code":"MARK","name":"Markapur","slug":"markapur","lat":"15.7361535","lon":"79.269125"},"MRPL":{"code":"MRPL","name":"Marpalle","slug":"marpalle","lat":"17.5403","lon":"77.7667"},"MARR":{"code":"MARR","name":"Marripeda","slug":"marripeda","lat":"17.3729","lon":"79.8829"},"MRDM":{"code":"MRDM","name":"Marthandam","slug":"marthandam","lat":"8.3075","lon":"77.2218"},"MART":{"code":"MART","name":"Martur","slug":"martur","lat":"15.9938","lon":"80.1038"},"MASL":{"code":"MASL","name":"Maslandapur","slug":"maslandapur","lat":"22.855522","lon":"88.743988"},"DAMB":{"code":"DAMB","name":"Matale","slug":"matale","lat":"7.467271","lon":"80.624069"},"MATA":{"code":"MATA","name":"Matara","slug":"matara","lat":"5.949243","lon":"80.543229"},"MPUR":{"code":"MPUR","name":"Math Chandipur","slug":"math-chandipur","lat":"22.0914","lon":"87.8582"},"MABH":{"code":"MABH","name":"Mathabhanga","slug":"mathabhanga","lat":"26.3427","lon":"89.2153"},"MATH":{"code":"MATH","name":"Mathura","slug":"mathura","lat":"27.4924134","lon":"77.673673"},"MATT":{"code":"MATT","name":"Mattannur","slug":"mattannur","lat":"11.9293","lon":"75.5735"},"MAAU":{"code":"MAAU","name":"Mau","slug":"mau","lat":"25.9431","lon":"83.5562"},"MVLR":{"code":"MVLR","name":"Mavelikkara","slug":"mavelikkara","lat":"9.250324","lon":"76.539568"},"MAWA":{"code":"MAWA","name":"Mawana","slug":"mawana","lat":"29.096956","lon":"77.920494"},"MAYA":{"code":"MAYA","name":"Mayannur","slug":"mayannur","lat":"10.7507","lon":"76.3811"},"MAYI":{"code":"MAYI","name":"Mayiladuthurai","slug":"mayiladuthurai","lat":"11.1018","lon":"79.6526"},"MDAK":{"code":"MDAK","name":"Medak","slug":"medak","lat":"17.8716","lon":"78.1108"},"MDRM":{"code":"MDRM","name":"Medarametla","slug":"medarametla","lat":"15.7221","lon":"80.0158"},"MDCH":{"code":"MDCH","name":"Medchal","slug":"medchal","lat":"17.6302","lon":"78.4842"},"FFF":{"code":"FFF","name":"Medininagar","slug":"medininagar","lat":"84.079662","lon":"24.047563"},"MERT":{"code":"MERT","name":"Meerut","slug":"meerut","lat":"28.9844618","lon":"77.7064137"},"MEHK":{"code":"MEHK","name":"Mehkar","slug":"mehkar","lat":"20.1478","lon":"76.5713"},"MEHS":{"code":"MEHS","name":"Mehsana","slug":"mehsana","lat":"23.588","lon":"72.3693"},"MELA":{"code":"MELA","name":"Melattur","slug":"melattur","lat":"11.0684","lon":"76.2682"},"MELL":{"code":"MELL","name":"Melli","slug":"melli","lat":"27.0908","lon":"88.4567"},"MMRR":{"code":"MMRR","name":"Memari","slug":"memari","lat":"23.1745","lon":"88.1047"},"METT":{"code":"METT","name":"Metpally","slug":"metpally","lat":"18.279756","lon":"79.579837"},"MTPM":{"code":"MTPM","name":"Mettuppalayam","slug":"mettuppalayam","lat":"11.2891","lon":"76.941"},"METZ":{"code":"METZ","name":"Mettur","slug":"mettur","lat":"11.7863","lon":"77.8008"},"MHOW":{"code":"MHOW","name":"Mhow","slug":"mhow","lat":"22.550749","lon":"75.762211"},"MDIP":{"code":"MDIP","name":"Midnapore","slug":"midnapore","lat":"22.427756","lon":"87.294056"},"MIRJ":{"code":"MIRJ","name":"Miraj","slug":"miraj","lat":"16.8165","lon":"74.6425"},"MRGJ":{"code":"MRGJ","name":"Mirganj","slug":"mirganj","lat":"26.3696","lon":"84.3358"},"MRGD":{"code":"MRGD","name":"Miryalaguda","slug":"miryalaguda","lat":"16.8753","lon":"79.566"},"MIZP":{"code":"MIZP","name":"Mirzapur","slug":"mirzapur","lat":"25.1337","lon":"82.5644"},"MOGA":{"code":"MOGA","name":"Moga","slug":"moga","lat":"30.8","lon":"75.17"},"MOKA":{"code":"MOKA","name":"Mokama","slug":"mokama","lat":"25.3984","lon":"85.9158"},"MOLA":{"code":"MOLA","name":"Molakalmuru","slug":"molakalmuru","lat":"14.7165","lon":"76.7466"},"MOMT":{"code":"MOMT","name":"Mominpet","slug":"mominpet","lat":"17.5165","lon":"77.8982"},"MONE":{"code":"MONE","name":"Moneragala","slug":"moneragala","lat":"6.872186","lon":"81.351593"},"MOOD":{"code":"MOOD","name":"Moodbidri","slug":"moodbidri","lat":"13.0688","lon":"74.998187"},"MORA":{"code":"MORA","name":"Moradabad","slug":"moradabad","lat":"28.8315925","lon":"78.7782764"},"MORH":{"code":"MORH","name":"Moranhat","slug":"moranhat","lat":"27.175325","lon":"94.8949069"},"MOBI":{"code":"MOBI","name":"Morbi","slug":"morbi","lat":"22.812","lon":"70.8236"},"MRMP":{"code":"MRMP","name":"Morena","slug":"morena","lat":"0","lon":"0"},"MRGO":{"code":"MRGO","name":"Morigaon","slug":"morigaon","lat":"26.22221","lon":"92.239487"},"MORI":{"code":"MORI","name":"Morinda","slug":"morinda","lat":"30.7893","lon":"76.4997"},"MTKR":{"code":"MTKR","name":"Mothkur","slug":"mothkur","lat":"17.4569","lon":"79.2592"},"MOTI":{"code":"MOTI","name":"Motihari","slug":"motihari","lat":"26.647","lon":"84.9089"},"MAYN":{"code":"MAYN","name":"Moyna","slug":"moyna","lat":"22.2738","lon":"87.7697"},"MUDG":{"code":"MUDG","name":"Mudalagi","slug":"mudalagi","lat":"16.337302","lon":"74.9665"},"MUDD":{"code":"MUDD","name":"Muddebihal","slug":"muddebihal","lat":"0","lon":"0"},"MUDL":{"code":"MUDL","name":"Mudhol","slug":"mudhol","lat":"16.3333","lon":"75.2858"},"MDGR":{"code":"MDGR","name":"Mudigere","slug":"mudigere","lat":"13.1365","lon":"75.6403"},"MGSI":{"code":"MGSI","name":"Mughalsarai","slug":"mughalsarai","lat":"25.2815","lon":"83.1198"},"MUKE":{"code":"MUKE","name":"Mukerian","slug":"mukerian","lat":"31.9563","lon":"75.6168"},"MUKM":{"code":"MUKM","name":"Mukkam","slug":"mukkam","lat":"11.3212","lon":"75.9963"},"MKST":{"code":"MKST","name":"Muktsar","slug":"muktsar","lat":"30.4766","lon":"74.5112"},"MULB":{"code":"MULB","name":"Mulbagal","slug":"mulbagal","lat":"13.1667","lon":"78.3941"},"MULK":{"code":"MULK","name":"Mulkanoor","slug":"mulkanoor","lat":"18.087094","lon":"79.367931"},"MULA":{"code":"MULA","name":"Mullaitivu","slug":"mullaitivu","lat":"9.26713","lon":"80.813423"},"MULL":{"code":"MULL","name":"Mullanpur","slug":"mullanpur","lat":"30.8427","lon":"75.6732"},"MULZ":{"code":"MULZ","name":"Mulleria","slug":"mulleria","lat":"12.551","lon":"75.1633"},"MULU":{"code":"MULU","name":"Mulugu","slug":"mulugu","lat":"18.1932","lon":"79.9414"},"GHNP":{"code":"GHNP","name":"Mulugu Ghanpur","slug":"mulugu-ghanpur","lat":"18.2941","lon":"79.8689"},"MUMM":{"code":"MUMM","name":"Mummidivaram","slug":"mummidivaram","lat":"16.6415","lon":"82.1043"},"MUAM":{"code":"MUAM","name":"Mundakayam","slug":"mundakayam","lat":"9.537","lon":"76.8868"},"MNDR":{"code":"MNDR","name":"Mundargi","slug":"mundargi","lat":"15.2075","lon":"75.884598"},"MUDA":{"code":"MUDA","name":"Mundra","slug":"mundra","lat":"22.8395","lon":"69.7213"},"MUNG":{"code":"MUNG","name":"Munger","slug":"munger","lat":"25.371009","lon":"86.473443"},"BDPR":{"code":"BDPR","name":"Mungra Badshahpur","slug":"mungra-badshahpur","lat":"25.658","lon":"82.1904"},"MUNI":{"code":"MUNI","name":"Muniguda","slug":"muniguda","lat":"19.6212","lon":"83.4987"},"MRDG":{"code":"MRDG","name":"Muradnagar","slug":"muradnagar","lat":"28.7689789","lon":"77.4833953"},"MURS":{"code":"MURS","name":"Murshidabad","slug":"murshidabad","lat":"24.229","lon":"88.2461"},"MUUR":{"code":"MUUR","name":"Murtizapur","slug":"murtizapur","lat":"20.7296","lon":"77.3679"},"MUSI":{"code":"MUSI","name":"Musiri","slug":"musiri","lat":"10.954855","lon":"78.443654"},"MSS":{"code":"MSS","name":"Mussoorie","slug":"mussoorie","lat":"30.4599","lon":"78.0664"},"MUVA":{"code":"MUVA","name":"Muvattupuzha","slug":"muvattupuzha","lat":"9.9818145","lon":"76.5667302"},"MUZ":{"code":"MUZ","name":"Muzaffarnagar","slug":"muzaffarnagar","lat":"29.4727","lon":"77.7085"},"MUZA":{"code":"MUZA","name":"Muzaffarpur","slug":"muzaffarpur","lat":"26.122272","lon":"85.377883"},"MYDU":{"code":"MYDU","name":"Mydukur","slug":"mydukur","lat":"14.7302","lon":"78.7294"},"MYLA":{"code":"MYLA","name":"Mylavaram","slug":"mylavaram","lat":"16.7638","lon":"80.6382"},"MYS":{"code":"MYS","name":"Mysuru (Mysore)","slug":"mysuru-mysore","lat":"12.2958104","lon":"76.6393805"},"NIRA":{"code":"NIRA","name":"NIRA","slug":"nira","lat":"18.0607","lon":"74.125"},"NABB":{"code":"NABB","name":"Nabadwip","slug":"nabadwip","lat":"23.4036","lon":"88.3676"},"NAGU":{"code":"NAGU","name":"Nabarangpur","slug":"nabarangpur","lat":"19.2281","lon":"82.547"},"NABH":{"code":"NABH","name":"Nabha","slug":"nabha","lat":"30.3737","lon":"76.1452"},"DNUA":{"code":"DNUA","name":"Nadaun","slug":"nadaun","lat":"31.7812","lon":"76.3424"},"NDWB":{"code":"NDWB","name":"Nadia","slug":"nadia","lat":"23.471","lon":"88.5565"},"NADI":{"code":"NADI","name":"Nadiad","slug":"nadiad","lat":"22.7","lon":"72.8667"},"NAGA":{"code":"NAGA","name":"Nagamangala","slug":"nagamangala","lat":"12.8271","lon":"76.7596"},"NAAM":{"code":"NAAM","name":"Nagaon","slug":"nagaon","lat":"26.3464","lon":"92.684"},"NGPT":{"code":"NGPT","name":"Nagapattinam","slug":"nagapattinam","lat":"10.7656","lon":"79.8424"},"NGGM":{"code":"NGGM","name":"Nagaram","slug":"nagaram","lat":"17.4853","lon":"78.6099"},"NAGZ":{"code":"NAGZ","name":"Nagaram (AP)","slug":"nagaram-ap","lat":"16.007162","lon":"80.717859"},"NAGI":{"code":"NAGI","name":"Nagari","slug":"nagari","lat":"13.3201","lon":"79.5856"},"NGKL":{"code":"NGKL","name":"Nagarkurnool","slug":"nagarkurnool","lat":"16.4939","lon":"78.3102"},"NAGR":{"code":"NAGR","name":"Nagaur","slug":"nagaur","lat":"27.1854","lon":"74.03"},"NYLK":{"code":"NYLK","name":"Nagayalanka","slug":"nagayalanka","lat":"15.9455","lon":"80.918"},"NAGD":{"code":"NAGD","name":"Nagda","slug":"nagda","lat":"23.4455","lon":"75.417"},"NAGE":{"code":"NAGE","name":"Nagercoil","slug":"nagercoil","lat":"8.1833","lon":"77.4119"},"NAGO":{"code":"NAGO","name":"Nagothane","slug":"nagothane","lat":"18.543596","lon":"73.1301781"},"NAGP":{"code":"NAGP","name":"Nagpur","slug":"nagpur","lat":"21.1458004","lon":"79.0881546"},"NAHA":{"code":"NAHA","name":"Naharlagun","slug":"naharlagun","lat":"27.1086","lon":"93.6984"},"NDPT":{"code":"NDPT","name":"Naidupeta","slug":"naidupeta","lat":"13.9066","lon":"79.894"},"NHTA":{"code":"NHTA","name":"Naihati","slug":"naihati","lat":"22.8929","lon":"88.422"},"NAIN":{"code":"NAIN","name":"Nainital","slug":"nainital","lat":"29.3803","lon":"79.4636"},"NAJA":{"code":"NAJA","name":"Najafgarh","slug":"najafgarh","lat":"28.609","lon":"76.9855"},"NAJI":{"code":"NAJI","name":"Najibabad","slug":"najibabad","lat":"29.6123","lon":"78.3442"},"NKHT":{"code":"NKHT","name":"Nakhatrana","slug":"nakhatrana","lat":"23.3431","lon":"69.2669"},"NAKO":{"code":"NAKO","name":"Nakodar","slug":"nakodar","lat":"31.126958","lon":"75.481584"},"NKRL":{"code":"NKRL","name":"Nakrekal","slug":"nakrekal","lat":"17.1647","lon":"79.4275"},"NALB":{"code":"NALB","name":"Nalbari","slug":"nalbari","lat":"26.4446","lon":"91.4411"},"NALK":{"code":"NALK","name":"Nalgonda","slug":"nalgonda","lat":"17.1883","lon":"79.2"},"NALJ":{"code":"NALJ","name":"Nallajerla","slug":"nallajerla","lat":"16.9479","lon":"81.4045"},"NMKL":{"code":"NMKL","name":"Namakkal","slug":"namakkal","lat":"11.284","lon":"78.1108"},"NAMI":{"code":"NAMI","name":"Namchi","slug":"namchi","lat":"27.167","lon":"88.3652"},"RAMS":{"code":"RAMS","name":"Namkhana","slug":"namkhana","lat":"21.7699","lon":"88.2315"},"NAMS":{"code":"NAMS","name":"Namsai","slug":"namsai","lat":"27.6692","lon":"95.8644"},"NAKM":{"code":"NAKM","name":"Nandakumar","slug":"nandakumar","lat":"22.188597","lon":"87.919014"},"NAND":{"code":"NAND","name":"Nanded","slug":"nanded","lat":"19.153061","lon":"77.305847"},"NDGM":{"code":"NDGM","name":"Nandigama","slug":"nandigama","lat":"16.772621","lon":"80.286005"},"NDKT":{"code":"NDKT","name":"Nandikotkur","slug":"nandikotkur","lat":"15.8556","lon":"78.2646"},"NANZ":{"code":"NANZ","name":"Nandipet","slug":"nandipet","lat":"18.8786","lon":"78.1498"},"NDNB":{"code":"NDNB","name":"Nandurbar","slug":"nandurbar","lat":"21.375731","lon":"74.246417"},"NADY":{"code":"NADY","name":"Nandyal","slug":"nandyal","lat":"15.4786","lon":"78.4831"},"NJGU":{"code":"NJGU","name":"Nanjanagudu","slug":"nanjanagudu","lat":"12.12","lon":"76.6801"},"NANP":{"code":"NANP","name":"Nanpara","slug":"nanpara","lat":"27.8675","lon":"81.4993"},"NRPT":{"code":"NRPT","name":"Narasannapeta","slug":"narasannapeta","lat":"18.4164","lon":"84.0459"},"NSPT":{"code":"NSPT","name":"Narasaraopeta","slug":"narasaraopeta","lat":"16.2354","lon":"80.0479"},"NRGY":{"code":"NRGY","name":"Narayangaon","slug":"narayangaon","lat":"19.11799","lon":"73.973633"},"NARY":{"code":"NARY","name":"Narayankhed","slug":"narayankhed","lat":"18.0328","lon":"77.7732"},"NRYN":{"code":"NRYN","name":"Narayanpet","slug":"narayanpet","lat":"16.7445","lon":"77.496"},"NRYA":{"code":"NRYA","name":"Narayanpur","slug":"narayanpur","lat":"19.4524","lon":"81.2519"},"NSAZ":{"code":"NSAZ","name":"Narayanpur (Assam)","slug":"narayanpur-assam","lat":"26.952","lon":"93.8561"},"NRGD":{"code":"NRGD","name":"Nargund","slug":"nargund","lat":"15.7214","lon":"75.3849"},"NARN":{"code":"NARN","name":"Narnaul","slug":"narnaul","lat":"28.0658","lon":"76.1015"},"NASP":{"code":"NASP","name":"Narsampet","slug":"narsampet","lat":"17.9281","lon":"79.8945"},"NARP":{"code":"NARP","name":"Narsapur","slug":"narsapur","lat":"16.433","lon":"81.6966"},"NRPR":{"code":"NRPR","name":"Narsapur (Medak)","slug":"narsapur-medak","lat":"17.7394","lon":"78.2846"},"NARR":{"code":"NARR","name":"Narsinghpur","slug":"narsinghpur","lat":"22.9113","lon":"79.1097"},"NARS":{"code":"NARS","name":"Narsipatnam","slug":"narsipatnam","lat":"17.6664","lon":"82.6105"},"NARA":{"code":"NARA","name":"Narwana","slug":"narwana","lat":"29.590949","lon":"76.114698"},"NASK":{"code":"NASK","name":"Nashik","slug":"nashik","lat":"20.0014","lon":"73.7869"},"NATH":{"code":"NATH","name":"Natham","slug":"natham","lat":"10.2222","lon":"78.2334"},"NATW":{"code":"NATW","name":"Nathdwara","slug":"nathdwara","lat":"24.932","lon":"73.8191"},"NAUT":{"code":"NAUT","name":"Nautanwa","slug":"nautanwa","lat":"27.424166","lon":"83.427002"},"NVSR":{"code":"NVSR","name":"Navsari","slug":"navsari","lat":"20.946849","lon":"72.950914"},"NAWD":{"code":"NAWD","name":"Nawada","slug":"nawada","lat":"24.8906525","lon":"85.4997247"},"NANA":{"code":"NANA","name":"Nawalgarh","slug":"nawalgarh","lat":"27.8454","lon":"75.2546"},"NAVN":{"code":"NAVN","name":"Nawanshahr","slug":"nawanshahr","lat":"31.124325","lon":"76.114783"},"NAWA":{"code":"NAWA","name":"Nawapara","slug":"nawapara","lat":"20.982144","lon":"81.855582"},"NAYG":{"code":"NAYG","name":"Nayagarh","slug":"nayagarh","lat":"20.1231","lon":"85.1038"},"NZRA":{"code":"NZRA","name":"Nazira","slug":"nazira","lat":"26.9058926","lon":"94.6532939"},"NAZR":{"code":"NAZR","name":"Nazirpur","slug":"nazirpur","lat":"23.8740442","lon":"88.5238193"},"NEDM":{"code":"NEDM","name":"Nedumbassery","slug":"nedumbassery","lat":"10.1677859","lon":"76.3550969"},"NEDU":{"code":"NEDU","name":"Nedumkandam","slug":"nedumkandam","lat":"9.8363","lon":"77.1571"},"NELP":{"code":"NELP","name":"Neelapalli","slug":"neelapalli","lat":"16.7349","lon":"82.2271"},"NEEM":{"code":"NEEM","name":"Neemrana","slug":"neemrana","lat":"27.9854","lon":"76.3827"},"NMCH":{"code":"NMCH","name":"Neemuch","slug":"neemuch","lat":"24.4764","lon":"74.8624"},"NELA":{"code":"NELA","name":"Nelakondapalli","slug":"nelakondapalli","lat":"17.1009","lon":"80.0507"},"NMGL":{"code":"NMGL","name":"Nelamangala","slug":"nelamangala","lat":"13.0874","lon":"77.411"},"NLEM":{"code":"NLEM","name":"Nellimarla","slug":"nellimarla","lat":"18.1649","lon":"83.451"},"NELM":{"code":"NELM","name":"Nellimoodu","slug":"nellimoodu","lat":"8.3811","lon":"77.0421"},"NELL":{"code":"NELL","name":"Nellore","slug":"nellore","lat":"14.4426","lon":"79.9865"},"NENM":{"code":"NENM","name":"Nemmara","slug":"nemmara","lat":"10.5934","lon":"76.6006"},"NEPJ":{"code":"NEPJ","name":"Nepalgunj","slug":"nepalgunj","lat":"28.059325","lon":"81.61159"},"NERP":{"code":"NERP","name":"Ner Parsopant","slug":"ner-parsopant","lat":"20.4913","lon":"77.8669"},"NERA":{"code":"NERA","name":"Neral","slug":"neral","lat":"19.023","lon":"73.3175"},"NDRL":{"code":"NDRL","name":"Nereducharla","slug":"nereducharla","lat":"16.8862","lon":"79.6937"},"TEHR":{"code":"TEHR","name":"New Tehri","slug":"new-tehri","lat":"30.3739","lon":"78.4325"},"NYVL":{"code":"NYVL","name":"Neyveli","slug":"neyveli","lat":"11.5432","lon":"79.476"},"NCUL":{"code":"NCUL","name":"Nichlaul","slug":"nichlaul","lat":"27.3092","lon":"83.7252"},"NDVD":{"code":"NDVD","name":"Nidadavolu","slug":"nidadavolu","lat":"16.9016","lon":"81.6638"},"NIGA":{"code":"NIGA","name":"Nilagiri","slug":"nilagiri","lat":"21.4619","lon":"86.7567"},"NILA":{"code":"NILA","name":"Nilakottai","slug":"nilakottai","lat":"10.1655","lon":"77.8525"},"NILM":{"code":"NILM","name":"Nilambur","slug":"nilambur","lat":"11.2855","lon":"76.2386"},"NLNG":{"code":"NLNG","name":"Nilanga","slug":"nilanga","lat":"18.125875","lon":"76.750969"},"NILG":{"code":"NILG","name":"Nilgiris","slug":"nilgiris","lat":"76.622649","lon":"11.44633"},"NIMA":{"code":"NIMA","name":"Nimapara","slug":"nimapara","lat":"20.0537","lon":"86.0071"},"NIPA":{"code":"NIPA","name":"Nimbahera","slug":"nimbahera","lat":"24.6257","lon":"74.681"},"NNDR":{"code":"NNDR","name":"Nindra","slug":"nindra","lat":"13.3618","lon":"79.7007"},"NIPN":{"code":"NIPN","name":"Nipani","slug":"nipani","lat":"16.407409","lon":"74.376458"},"NIPD":{"code":"NIPD","name":"Niphad","slug":"niphad","lat":"20.08","lon":"74.1093"},"NIRJ":{"code":"NIRJ","name":"Nirjuli","slug":"nirjuli","lat":"27.1236938","lon":"93.7376689"},"NIZA":{"code":"NIZA","name":"Nizamabad","slug":"nizamabad","lat":"18.6833","lon":"78.1"},"NZPT":{"code":"NZPT","name":"Nizampatnam","slug":"nizampatnam","lat":"15.9069","lon":"80.6691"},"NKHA":{"code":"NKHA","name":"Nokha","slug":"nokha","lat":"27.5562","lon":"73.4732"},"NOOR":{"code":"NOOR","name":"Nooranad","slug":"nooranad","lat":"9.1637","lon":"76.6429"},"NURP":{"code":"NURP","name":"Nurpur","slug":"nurpur","lat":"32.300133","lon":"75.885345"},"NUWA":{"code":"NUWA","name":"Nuwara Eliya","slug":"nuwara-eliya","lat":"6.959373","lon":"80.767727"},"NZVD":{"code":"NZVD","name":"Nuzvid","slug":"nuzvid","lat":"16.787527","lon":"80.848968"},"NYNT":{"code":"NYNT","name":"Nyamathi","slug":"nyamathi","lat":"14.150287","lon":"75.565445"},"OACH":{"code":"OACH","name":"Oachira","slug":"oachira","lat":"9.1255","lon":"76.5097"},"ODDA":{"code":"ODDA","name":"Oddanchatram","slug":"oddanchatram","lat":"10.4851","lon":"77.7481"},"HJOR":{"code":"HJOR","name":"Ojhar","slug":"ojhar","lat":"20.095699","lon":"73.925301"},"OKAH":{"code":"OKAH","name":"Okha","slug":"okha","lat":"22.455182","lon":"69.071194"},"OLPA":{"code":"OLPA","name":"Olpad","slug":"olpad","lat":"21.3401","lon":"72.7554"},"ONGL":{"code":"ONGL","name":"Ongole","slug":"ongole","lat":"15.5057","lon":"80.0499"},"OOTY":{"code":"OOTY","name":"Ooty","slug":"ooty","lat":"11.4064","lon":"76.6932"},"ORAI":{"code":"ORAI","name":"Orai","slug":"orai","lat":"25.9875","lon":"79.4489"},"ORHH":{"code":"ORHH","name":"Orchha","slug":"orchha","lat":"25.3683","lon":"78.6285"},"OTTP":{"code":"OTTP","name":"Ottapalam","slug":"ottapalam","lat":"10.7723","lon":"76.3695"},"PDHR":{"code":"PDHR","name":"P. Dharmavaram","slug":"p-dharmavaram","lat":"17.4745","lon":"82.7786"},"PPGG":{"code":"PPGG","name":"P.Gannavaram","slug":"pgannavaram","lat":"16.4117","lon":"81.7448"},"PACH":{"code":"PACH","name":"Pachore","slug":"pachore","lat":"76.730759","lon":"23.713457"},"PADA":{"code":"PADA","name":"Padampur","slug":"padampur","lat":"29.7075","lon":"73.6257"},"PADX":{"code":"PADX","name":"Paddhari","slug":"paddhari","lat":"70.6019","lon":"22.4356"},"PADR":{"code":"PADR","name":"Padrauna","slug":"padrauna","lat":"26.8984","lon":"83.9797"},"PUYI":{"code":"PUYI","name":"Padubidri","slug":"padubidri","lat":"13.1408","lon":"74.7721"},"PAKA":{"code":"PAKA","name":"Pakala","slug":"pakala","lat":"13.4505","lon":"79.1165"},"PALL":{"code":"PALL","name":"Pala","slug":"pala","lat":"9.7138","lon":"76.6829"},"PLKK":{"code":"PLKK","name":"Palakkad","slug":"palakkad","lat":"10.7867","lon":"76.6548"},"PLKL":{"code":"PLKL","name":"Palakollu","slug":"palakollu","lat":"16.5175","lon":"81.7253"},"PALK":{"code":"PALK","name":"Palakonda","slug":"palakonda","lat":"18.6007","lon":"83.7576"},"PLAT":{"code":"PLAT","name":"Palakurthy","slug":"palakurthy","lat":"17.6599","lon":"79.4311"},"PLMN":{"code":"PLMN","name":"Palamaner","slug":"palamaner","lat":"13.1949","lon":"78.7474"},"PALM":{"code":"PALM","name":"Palampur","slug":"palampur","lat":"32.1109","lon":"76.5363"},"PALA":{"code":"PALA","name":"Palani","slug":"palani","lat":"10.4489","lon":"77.5209"},"PALN":{"code":"PALN","name":"Palanpur","slug":"palanpur","lat":"24.171181","lon":"72.438393"},"PALT":{"code":"PALT","name":"Palapetty","slug":"palapetty","lat":"10.3628","lon":"76.1175"},"PALS":{"code":"PALS","name":"Palasa","slug":"palasa","lat":"18.7747","lon":"84.4094"},"PALG":{"code":"PALG","name":"Palghar","slug":"palghar","lat":"19.6936","lon":"72.7655"},"PAAL":{"code":"PAAL","name":"Pali","slug":"pali","lat":"25.7711","lon":"73.3234"},"PAKN":{"code":"PAKN","name":"Palia Kalan","slug":"palia-kalan","lat":"28.435954","lon":"80.571446"},"PALI":{"code":"PALI","name":"Palitana","slug":"palitana","lat":"21.5346","lon":"71.8275"},"PLDM":{"code":"PLDM","name":"Palladam","slug":"palladam","lat":"10.9957","lon":"77.2795"},"PKTU":{"code":"PKTU","name":"Pallickathodu","slug":"pallickathodu","lat":"9.6042","lon":"76.6813"},"PLLI":{"code":"PLLI","name":"Pallipalayam","slug":"pallipalayam","lat":"11.375","lon":"77.7509"},"PALY":{"code":"PALY","name":"Palluruthy","slug":"palluruthy","lat":"9.9087","lon":"76.273"},"PALU":{"code":"PALU","name":"Palus","slug":"palus","lat":"17.098709","lon":"74.449753"},"PLWL":{"code":"PLWL","name":"Palwal","slug":"palwal","lat":"28.1487","lon":"77.332"},"PLWA":{"code":"PLWA","name":"Palwancha","slug":"palwancha","lat":"18.3198","lon":"78.4359"},"PAMA":{"code":"PAMA","name":"Pamarru","slug":"pamarru","lat":"16.323","lon":"80.9612"},"PAGH":{"code":"PAGH","name":"Pamgarh","slug":"pamgarh","lat":"21.8746","lon":"82.4504"},"PAMI":{"code":"PAMI","name":"Pamidi","slug":"pamidi","lat":"14.952117","lon":"77.594795"},"PMMR":{"code":"PMMR","name":"Pamuru","slug":"pamuru","lat":"15.09612","lon":"79.41102"},"PAMO":{"code":"PAMO","name":"Panachamoodu","slug":"panachamoodu","lat":"8.4281","lon":"77.1956"},"PANA":{"code":"PANA","name":"Panaji","slug":"panaji","lat":"15.4909","lon":"73.8278"},"PANP":{"code":"PANP","name":"Panapakkam","slug":"panapakkam","lat":"12.9225","lon":"79.5674"},"PANC":{"code":"PANC","name":"Panchgani","slug":"panchgani","lat":"17.9236","lon":"73.7983"},"PNCH":{"code":"PNCH","name":"Panchkula","slug":"panchkula","lat":"30.6942","lon":"76.8606"},"PADM":{"code":"PADM","name":"Pandalam","slug":"pandalam","lat":"9.2251","lon":"76.6785"},"PAVA":{"code":"PAVA","name":"Pandavapura","slug":"pandavapura","lat":"12.4929","lon":"76.6643"},"PAND":{"code":"PAND","name":"Pandhana","slug":"pandhana","lat":"21.6948","lon":"76.2204"},"PANR":{"code":"PANR","name":"Pandharkawada","slug":"pandharkawada","lat":"20.023","lon":"78.549"},"PNDH":{"code":"PNDH","name":"Pandharpur","slug":"pandharpur","lat":"17.6746","lon":"75.3237"},"PANU":{"code":"PANU","name":"Pandua","slug":"pandua","lat":"23.082645","lon":"88.27252"},"PAN":{"code":"PAN","name":"Panipat","slug":"panipat","lat":"29.391126","lon":"76.962233"},"PANN":{"code":"PANN","name":"Panna","slug":"panna","lat":"24.718","lon":"80.1819"},"PANT":{"code":"PANT","name":"Panruti","slug":"panruti","lat":"11.7666","lon":"79.5629"},"PNSM":{"code":"PNSM","name":"Pansemal","slug":"pansemal","lat":"21.6582","lon":"74.6971"},"POTA":{"code":"POTA","name":"Paonta Sahib","slug":"paonta-sahib","lat":"30.4453","lon":"77.6021"},"PAPA":{"code":"PAPA","name":"Papanasam","slug":"papanasam","lat":"10.9252","lon":"79.2708"},"ANPP":{"code":"ANPP","name":"Pappanadu","slug":"pappanadu","lat":"10.483318","lon":"79.472221"},"PARD":{"code":"PARD","name":"Paradeep","slug":"paradeep","lat":"20.2858192","lon":"86.6220468"},"PRKM":{"code":"PRKM","name":"Paralakhemundi","slug":"paralakhemundi","lat":"18.7783","lon":"84.0936"},"PAVL":{"code":"PAVL","name":"Paramathi Velur","slug":"paramathi-velur","lat":"11.152491","lon":"78.02525"},"PAVP":{"code":"PAVP","name":"Parappanangadi","slug":"parappanangadi","lat":"11.054","lon":"75.8555"},"PARA":{"code":"PARA","name":"Paratwada","slug":"paratwada","lat":"21.2576","lon":"77.5087"},"PARB":{"code":"PARB","name":"Parbhani","slug":"parbhani","lat":"19.261063","lon":"76.775894"},"PARC":{"code":"PARC","name":"Parchur","slug":"parchur","lat":"15.9639","lon":"80.2739"},"PARI":{"code":"PARI","name":"Parigi (Telangana)","slug":"parigi-telangana","lat":"13.8865","lon":"77.4659"},"PAHB":{"code":"PAHB","name":"Parihar","slug":"parihar","lat":"26.7083","lon":"85.6765"},"PARL":{"code":"PARL","name":"Parkal","slug":"parkal","lat":"18.1977","lon":"79.7027"},"PRLI":{"code":"PRLI","name":"Parli","slug":"parli","lat":"18.8558667","lon":"76.4884412"},"PRVT":{"code":"PRVT","name":"Parvathipuram","slug":"parvathipuram","lat":"18.7817","lon":"83.4268"},"PARW":{"code":"PARW","name":"Parwanoo","slug":"parwanoo","lat":"30.8372","lon":"76.9614"},"PAZA":{"code":"PAZA","name":"Pasara","slug":"pasara","lat":"18.193851","lon":"80.16658"},"PSMP":{"code":"PSMP","name":"Paschim Medinipur","slug":"paschim-medinipur","lat":"22.424","lon":"87.319"},"PSHG":{"code":"PSHG","name":"Pasighat","slug":"pasighat","lat":"28.0667","lon":"95.3275"},"PATA":{"code":"PATA","name":"Patan","slug":"patan","lat":"23.849204","lon":"72.125502"},"TNPR":{"code":"TNPR","name":"Patan (CG)","slug":"patan-cg","lat":"21.0408","lon":"81.5429"},"PATM":{"code":"PATM","name":"Patan (Satara)","slug":"patan-satara","lat":"17.3735","lon":"73.8992"},"PAHT":{"code":"PAHT","name":"Pathalgaon","slug":"pathalgaon","lat":"22.5564","lon":"83.461"},"PTNM":{"code":"PTNM","name":"Pathanamthitta","slug":"pathanamthitta","lat":"9.2601","lon":"76.9643"},"PTPM":{"code":"PTPM","name":"Pathanapuram","slug":"pathanapuram","lat":"9.0927","lon":"76.8612"},"PATH":{"code":"PATH","name":"Pathankot","slug":"pathankot","lat":"32.2706402","lon":"75.6425537"},"PTPT":{"code":"PTPT","name":"Pathapatnam","slug":"pathapatnam","lat":"18.7505","lon":"84.0916"},"PATS":{"code":"PATS","name":"Pathsala","slug":"pathsala","lat":"26.5119","lon":"91.1809"},"PATI":{"code":"PATI","name":"Patiala","slug":"patiala","lat":"30.32062","lon":"76.395126"},"PATN":{"code":"PATN","name":"Patna","slug":"patna","lat":"25.61046","lon":"85.141667"},"PATR":{"code":"PATR","name":"Patran","slug":"patran","lat":"29.9593","lon":"76.0566"},"PARY":{"code":"PARY","name":"Patratu","slug":"patratu","lat":"23.6329","lon":"85.3033"},"PTTB":{"code":"PTTB","name":"Pattabiram","slug":"pattabiram","lat":"13.12696","lon":"80.059952"},"PTMB":{"code":"PTMB","name":"Pattambi","slug":"pattambi","lat":"10.8068","lon":"76.1965"},"PATU":{"code":"PATU","name":"Pattukkottai","slug":"pattukkottai","lat":"10.4253","lon":"79.314"},"PAGD":{"code":"PAGD","name":"Pavagada","slug":"pavagada","lat":"14.1031","lon":"77.2807"},"PATE":{"code":"PATE","name":"Payakaraopeta","slug":"payakaraopeta","lat":"17.3617","lon":"82.5592"},"PAYY":{"code":"PAYY","name":"Payyanur","slug":"payyanur","lat":"12.1051","lon":"75.2058"},"PAYO":{"code":"PAYO","name":"Payyoli","slug":"payyoli","lat":"11.5129","lon":"75.6179"},"PLYN":{"code":"PLYN","name":"Pazhayannur","slug":"pazhayannur","lat":"10.6824","lon":"76.423"},"PEIR":{"code":"PEIR","name":"Pebbair","slug":"pebbair","lat":"16.2074","lon":"77.9932"},"PEDZ":{"code":"PEDZ","name":"Pedana","slug":"pedana","lat":"16.2579","lon":"81.1444"},"PEDN":{"code":"PEDN","name":"Pedanandipadu","slug":"pedanandipadu","lat":"16.071","lon":"80.3297"},"PEDD":{"code":"PEDD","name":"Pedapadu","slug":"pedapadu","lat":"16.637","lon":"81.0334"},"PEDA":{"code":"PEDA","name":"Peddapalli","slug":"peddapalli","lat":"18.6151","lon":"79.3827"},"PEDP":{"code":"PEDP","name":"Peddapuram","slug":"peddapuram","lat":"17.0757","lon":"82.136"},"PEN":{"code":"PEN","name":"Pen","slug":"pen","lat":"18.737532","lon":"73.094415"},"PEND":{"code":"PEND","name":"Pendra","slug":"pendra","lat":"22.7774","lon":"81.9562"},"PENM":{"code":"PENM","name":"Pennagaram","slug":"pennagaram","lat":"12.1334","lon":"77.8967"},"PENU":{"code":"PENU","name":"Penuganchiprolu","slug":"penuganchiprolu","lat":"16.9017","lon":"80.2475"},"PDDG":{"code":"PDDG","name":"Penugonda","slug":"penugonda","lat":"16.6547","lon":"81.7445"},"PERL":{"code":"PERL","name":"Peralam","slug":"peralam","lat":"10.9612","lon":"79.66"},"PERA":{"code":"PERA","name":"Perambalur","slug":"perambalur","lat":"11.2266","lon":"78.9288"},"PPVR":{"code":"PPVR","name":"Peravoor","slug":"peravoor","lat":"11.8962","lon":"75.7342"},"PRGM":{"code":"PRGM","name":"Peringamala","slug":"peringamala","lat":"8.76973","lon":"77.034264"},"PERN":{"code":"PERN","name":"Peringottukurissi","slug":"peringottukurissi","lat":"10.7527","lon":"76.4881"},"PNTM":{"code":"PNTM","name":"Perinthalmanna","slug":"perinthalmanna","lat":"10.9755","lon":"76.2305"},"PERI":{"code":"PERI","name":"Periyapatna","slug":"periyapatna","lat":"12.3374","lon":"76.0987"},"PERM":{"code":"PERM","name":"Pernambut","slug":"pernambut","lat":"12.9393","lon":"78.719"},"PERU":{"code":"PERU","name":"Perumpuzha","slug":"perumpuzha","lat":"8.9386","lon":"76.6788"},"PEDR":{"code":"PEDR","name":"Perundurai","slug":"perundurai","lat":"11.2758","lon":"77.583"},"PETL":{"code":"PETL","name":"Petlad","slug":"petlad","lat":"22.4836","lon":"72.8014"},"PHAG":{"code":"PHAG","name":"Phagwara","slug":"phagwara","lat":"31.224","lon":"75.7708"},"PHLD":{"code":"PHLD","name":"Phalodi","slug":"phalodi","lat":"27.1312","lon":"72.3589"},"PHAL":{"code":"PHAL","name":"Phaltan","slug":"phaltan","lat":"17.9845","lon":"74.436"},"PRND":{"code":"PRND","name":"Pharenda","slug":"pharenda","lat":"27.099032","lon":"83.272202"},"PHBN":{"code":"PHBN","name":"Phulbani","slug":"phulbani","lat":"20.4797","lon":"84.2331"},"PIDU":{"code":"PIDU","name":"Piduguralla","slug":"piduguralla","lat":"16.4852","lon":"79.8901"},"PILA":{"code":"PILA","name":"Pilani","slug":"pilani","lat":"28.3802","lon":"75.6092"},"PLRU":{"code":"PLRU","name":"Pileru","slug":"pileru","lat":"13.6556","lon":"78.9432"},"PIHI":{"code":"PIHI","name":"Pilibhit","slug":"pilibhit","lat":"28.5835","lon":"80.0088"},"PPAL":{"code":"PPAL","name":"Pimpalner","slug":"pimpalner","lat":"18.9142","lon":"74.3907"},"PIMP":{"code":"PIMP","name":"Pimpri","slug":"pimpri","lat":"18.6298","lon":"73.7997"},"PINJ":{"code":"PINJ","name":"Pinjore","slug":"pinjore","lat":"30.797","lon":"76.9178"},"PIPY":{"code":"PIPY","name":"Pipariya","slug":"pipariya","lat":"22.762886","lon":"78.352478"},"PIPR":{"code":"PIPR","name":"Pipraich","slug":"pipraich","lat":"26.8294","lon":"83.5294"},"PIRA":{"code":"PIRA","name":"Piravom","slug":"piravom","lat":"9.8731","lon":"76.492"},"PITH":{"code":"PITH","name":"Pithampur","slug":"pithampur","lat":"22.6133","lon":"75.6823"},"PITA":{"code":"PITA","name":"Pithapuram","slug":"pithapuram","lat":"17.1127","lon":"82.252828"},"PHOR":{"code":"PHOR","name":"Pithora","slug":"pithora","lat":"21.2525","lon":"82.5159"},"PITO":{"code":"PITO","name":"Pithoragarh","slug":"pithoragarh","lat":"29.5829","lon":"80.2182"},"PILM":{"code":"PILM","name":"Pitlam","slug":"pitlam","lat":"18.317835","lon":"78.347131"},"POCH":{"code":"POCH","name":"Pochampally","slug":"pochampally","lat":"17.3454","lon":"78.8241"},"PODA":{"code":"PODA","name":"Podalakur","slug":"podalakur","lat":"14.3841","lon":"79.7324"},"PODI":{"code":"PODI","name":"Podili","slug":"podili","lat":"15.607","lon":"79.6146"},"PLAB":{"code":"PLAB","name":"Polavaram","slug":"polavaram","lat":"17.2479","lon":"81.6432"},"POLL":{"code":"POLL","name":"Pollachi","slug":"pollachi","lat":"10.6573","lon":"77.0107"},"POLO":{"code":"POLO","name":"Polonnaruwa","slug":"polonnaruwa","lat":"7.914218","lon":"81.00116"},"PONA":{"code":"PONA","name":"Ponda","slug":"ponda","lat":"15.4027","lon":"74.0078"},"POND":{"code":"POND","name":"Pondicherry","slug":"pondicherry","lat":"11.931","lon":"79.7852"},"PONU":{"code":"PONU","name":"Ponduru","slug":"ponduru","lat":"18.3497","lon":"83.7584"},"PONK":{"code":"PONK","name":"Ponkunnam","slug":"ponkunnam","lat":"9.5656","lon":"76.7546"},"PONM":{"code":"PONM","name":"Ponnamaravathi","slug":"ponnamaravathi","lat":"10.283563","lon":"78.540006"},"PONN":{"code":"PONN","name":"Ponnani","slug":"ponnani","lat":"10.767731","lon":"75.926757"},"PONE":{"code":"PONE","name":"Ponneri","slug":"ponneri","lat":"13.3378","lon":"80.1929"},"POOV":{"code":"POOV","name":"Poovar","slug":"poovar","lat":"8.3177","lon":"77.0708"},"PORB":{"code":"PORB","name":"Porbandar","slug":"porbandar","lat":"21.635461","lon":"69.630286"},"PORT":{"code":"PORT","name":"Port Blair","slug":"port-blair","lat":"11.6683","lon":"92.7378"},"PORU":{"code":"PORU","name":"Porumamilla","slug":"porumamilla","lat":"14.9994","lon":"78.9915"},"PTRT":{"code":"PTRT","name":"Pratapgarh (Rajasthan)","slug":"pratapgarh-rajasthan","lat":"24.0317","lon":"74.7787"},"PRAT":{"code":"PRAT","name":"Pratapgarh (UP)","slug":"pratapgarh-up","lat":"25.8973","lon":"81.9453"},"ALLH":{"code":"ALLH","name":"Prayagraj (Allahabad)","slug":"prayagraj-allahabad","lat":"25.4022472","lon":"81.7315448"},"PROD":{"code":"PROD","name":"Proddatur","slug":"proddatur","lat":"14.7492","lon":"78.5532"},"PUDH":{"code":"PUDH","name":"Pudukkottai","slug":"pudukkottai","lat":"10.379849","lon":"78.822098"},"PUDN":{"code":"PUDN","name":"Pudunagaram","slug":"pudunagaram","lat":"10.683","lon":"76.6838"},"PUON":{"code":"PUON","name":"Pulgaon","slug":"pulgaon","lat":"20.7238","lon":"78.3216"},"PAPT":{"code":"PAPT","name":"Puliampatti","slug":"puliampatti","lat":"11.353225","lon":"77.167951"},"PLVN":{"code":"PLVN","name":"Pulivendula","slug":"pulivendula","lat":"14.4222","lon":"78.2263"},"PULI":{"code":"PULI","name":"Puliyangudi","slug":"puliyangudi","lat":"9.1725","lon":"77.3956"},"PULA":{"code":"PULA","name":"Pulluvila","slug":"pulluvila","lat":"8.347412","lon":"77.037736"},"PULP":{"code":"PULP","name":"Pulpally","slug":"pulpally","lat":"11.792271","lon":"76.167295"},"PULW":{"code":"PULW","name":"Pulwama","slug":"pulwama","lat":"33.8716","lon":"74.8946"},"PUNA":{"code":"PUNA","name":"Punalur","slug":"punalur","lat":"9.0098","lon":"76.9297"},"PGNR":{"code":"PGNR","name":"Punganur","slug":"punganur","lat":"13.3659","lon":"78.575"},"PAPN":{"code":"PAPN","name":"Puranpur","slug":"puranpur","lat":"28.512945","lon":"80.147736"},"PUNR":{"code":"PUNR","name":"Purba Medinipur","slug":"purba-medinipur","lat":"22.065327","lon":"87.808264"},"PURI":{"code":"PURI","name":"Puri","slug":"puri","lat":"19.8134","lon":"85.8315"},"PURN":{"code":"PURN","name":"Purnea","slug":"purnea","lat":"25.7771","lon":"87.4753"},"PURU":{"code":"PURU","name":"Purulia","slug":"purulia","lat":"23.2483","lon":"86.4997"},"PUSD":{"code":"PUSD","name":"Pusad","slug":"pusad","lat":"19.9092797","lon":"77.5283283"},"PREG":{"code":"PREG","name":"Pusapatirega","slug":"pusapatirega","lat":"18.093","lon":"83.551"},"PUSH":{"code":"PUSH","name":"Pushkar","slug":"pushkar","lat":"26.4897","lon":"74.5511"},"PUTH":{"code":"PUTH","name":"Puthenvelikara","slug":"puthenvelikara","lat":"10.1847","lon":"76.2421"},"PUTD":{"code":"PUTD","name":"Puthenvelikkara","slug":"puthenvelikkara","lat":"10.1847","lon":"76.2421"},"PUTR":{"code":"PUTR","name":"Puthoor","slug":"puthoor","lat":"9.0425","lon":"76.7134"},"PUTA":{"code":"PUTA","name":"Puttalam","slug":"puttalam","lat":"8.022915","lon":"79.841149"},"PUTT":{"code":"PUTT","name":"Puttur (Andhra Pradesh)","slug":"puttur-andhra-pradesh","lat":"13.4384","lon":"79.5519"},"PTTU":{"code":"PTTU","name":"Puttur (Karnataka)","slug":"puttur-karnataka","lat":"12.7687","lon":"75.2071"},"RBKH":{"code":"RBKH","name":"Rabkavi Banhatti","slug":"rabkavi-banhatti","lat":"16.482677","lon":"75.12256"},"RDHM":{"code":"RDHM","name":"Radhamoni","slug":"radhamoni","lat":"22.3141","lon":"87.8714"},"RAEB":{"code":"RAEB","name":"Raebareli","slug":"raebareli","lat":"26.2345","lon":"81.2409"},"RAHO":{"code":"RAHO","name":"Raghopur","slug":"raghopur","lat":"25.5338","lon":"85.3835"},"RAGH":{"code":"RAGH","name":"Raghunathganj","slug":"raghunathganj","lat":"24.45705","lon":"88.060055"},"RAHA":{"code":"RAHA","name":"Rahata","slug":"rahata","lat":"19.7115","lon":"74.4837"},"RAHI":{"code":"RAHI","name":"Rahimatpur","slug":"rahimatpur","lat":"17.5904","lon":"74.1989"},"RAHU":{"code":"RAHU","name":"Rahuri","slug":"rahuri","lat":"19.3927","lon":"74.6488"},"RAIB":{"code":"RAIB","name":"Raibag","slug":"raibag","lat":"16.4941","lon":"74.7747"},"RAUR":{"code":"RAUR","name":"Raichur","slug":"raichur","lat":"16.212","lon":"77.3439"},"RAI":{"code":"RAI","name":"Raigad","slug":"raigad","lat":"18.5158","lon":"73.1822"},"RAIJ":{"code":"RAIJ","name":"Raiganj","slug":"raiganj","lat":"25.6185","lon":"88.1256"},"RAIG":{"code":"RAIG","name":"Raigarh","slug":"raigarh","lat":"21.8974","lon":"83.395"},"RYKL":{"code":"RYKL","name":"Raikal","slug":"raikal","lat":"18.905","lon":"78.8128"},"RKOT":{"code":"RKOT","name":"Raikot","slug":"raikot","lat":"30.6536","lon":"75.5917"},"RLKD":{"code":"RLKD","name":"Railway Koduru","slug":"railway-koduru","lat":"13.95739","lon":"79.350618"},"RAIPUR":{"code":"RAIPUR","name":"Raipur","slug":"raipur","lat":"21.2513844","lon":"81.6296413"},"YAYA":{"code":"YAYA","name":"Raipuriya","slug":"raipuriya","lat":"23.744812","lon":"76.658272"},"RSNG":{"code":"RSNG","name":"Raisinghnagar","slug":"raisinghnagar","lat":"29.5337","lon":"73.447139"},"RJKB":{"code":"RJKB","name":"Raja Ka Bagh","slug":"raja-ka-bagh","lat":"32.27","lon":"75.8156"},"RAAJ":{"code":"RAAJ","name":"Rajakumari","slug":"rajakumari","lat":"9.9735","lon":"77.1686"},"RJAM":{"code":"RJAM","name":"Rajam","slug":"rajam","lat":"18.4556","lon":"83.6494"},"RJMU":{"code":"RJMU","name":"Rajamahendravaram (Rajahmundry)","slug":"rajamahendravaram-rajahmundry","lat":"17.0005","lon":"81.804"},"RAYM":{"code":"RAYM","name":"Rajapalayam","slug":"rajapalayam","lat":"9.4653","lon":"77.5275"},"RJPR":{"code":"RJPR","name":"Rajapur","slug":"rajapur","lat":"16.657301","lon":"73.5215"},"RJRP":{"code":"RJRP","name":"Rajarampalli","slug":"rajarampalli","lat":"18.6774","lon":"79.1104"},"RJVM":{"code":"RJVM","name":"Rajavommangi","slug":"rajavommangi","lat":"17.5467","lon":"82.2331"},"RJGR":{"code":"RJGR","name":"Rajgangpur","slug":"rajgangpur","lat":"22.1902","lon":"84.5799"},"RAJR":{"code":"RAJR","name":"Rajgurunagar","slug":"rajgurunagar","lat":"18.855","lon":"73.8875"},"RIJA":{"code":"RIJA","name":"Rajiana","slug":"rajiana","lat":"30.662","lon":"75.0655"},"RAJK":{"code":"RAJK","name":"Rajkot","slug":"rajkot","lat":"22.3038945","lon":"70.8021599"},"RAJA":{"code":"RAJA","name":"Rajnandgaon","slug":"rajnandgaon","lat":"21.0971","lon":"81.0302"},"RJPA":{"code":"RJPA","name":"Rajpipla","slug":"rajpipla","lat":"21.8715","lon":"73.5031"},"RAJP":{"code":"RAJP","name":"Rajpur","slug":"rajpur","lat":"21.9401","lon":"75.1356"},"RARA":{"code":"RARA","name":"Rajpura","slug":"rajpura","lat":"30.484","lon":"76.594"},"RAJS":{"code":"RAJS","name":"Rajsamand","slug":"rajsamand","lat":"25.071486","lon":"73.883072"},"RJLA":{"code":"RJLA","name":"Rajula","slug":"rajula","lat":"21.03627","lon":"71.443757"},"RCPR":{"code":"RCPR","name":"Ramachandrapuram","slug":"ramachandrapuram","lat":"16.8372","lon":"82.0325"},"RANG":{"code":"RANG","name":"Ramanagara","slug":"ramanagara","lat":"12.6003","lon":"77.4702"},"RAPU":{"code":"RAPU","name":"Ramanathapuram","slug":"ramanathapuram","lat":"9.364185","lon":"78.838759"},"RAMP":{"code":"RAMP","name":"Ramayampet","slug":"ramayampet","lat":"18.1159","lon":"78.4326"},"RAMD":{"code":"RAMD","name":"Ramdurg","slug":"ramdurg","lat":"15.95","lon":"75.2975"},"RMPR":{"code":"RMPR","name":"Rameswarpur","slug":"rameswarpur","lat":"20.8791","lon":"86.456"},"GGHH":{"code":"GGHH","name":"Ramgarh","slug":"ramgarh","lat":"23.6363","lon":"85.5124"},"RGHA":{"code":"RGHA","name":"Ramgarhwa","slug":"ramgarhwa","lat":"26.8714","lon":"84.7786"},"PUUR":{"code":"PUUR","name":"Ramjibanpur","slug":"ramjibanpur","lat":"22.8226","lon":"87.6137"},"RAMN":{"code":"RAMN","name":"Ramnagar","slug":"ramnagar","lat":"29.394747","lon":"79.126634"},"RACD":{"code":"RACD","name":"Rampachodavaram","slug":"rampachodavaram","lat":"17.4367","lon":"81.776"},"RAMU":{"code":"RAMU","name":"Rampur","slug":"rampur","lat":"25.4842","lon":"82.5916"},"RMTE":{"code":"RMTE","name":"Ramtek","slug":"ramtek","lat":"21.39351","lon":"79.299541"},"RANA":{"code":"RANA","name":"Ranaghat","slug":"ranaghat","lat":"23.174","lon":"88.5639"},"RNST":{"code":"RNST","name":"Ranastalam","slug":"ranastalam","lat":"18.202529","lon":"83.690337"},"RNSL":{"code":"RNSL","name":"Ranastalam","slug":"ranastalam","lat":"18.1976","lon":"83.7038"},"RANC":{"code":"RANC","name":"Ranchi","slug":"ranchi","lat":"23.3440997","lon":"85.309562"},"RANZ":{"code":"RANZ","name":"Randheja","slug":"randheja","lat":"23.2922","lon":"72.6417"},"RANE":{"code":"RANE","name":"Ranebennur","slug":"ranebennur","lat":"14.6113","lon":"75.6383"},"RAAA":{"code":"RAAA","name":"Rangia","slug":"rangia","lat":"26.4322495","lon":"91.6012194"},"RANL":{"code":"RANL","name":"Rani","slug":"rani","lat":"25.3583","lon":"73.2913"},"RNPK":{"code":"RNPK","name":"Rani Pokhari","slug":"rani-pokhari","lat":"30.1822","lon":"78.2113"},"RNGJ":{"code":"RNGJ","name":"Raniganj","slug":"raniganj","lat":"23.6291","lon":"87.0924"},"RANI":{"code":"RANI","name":"Ranipet","slug":"ranipet","lat":"12.9321","lon":"79.3335"},"RANN":{"code":"RANN","name":"Ranni","slug":"ranni","lat":"9.3866","lon":"76.7856"},"RAPR":{"code":"RAPR","name":"Rapur","slug":"rapur","lat":"14.1998","lon":"79.5336"},"RSPM":{"code":"RSPM","name":"Rasipuram","slug":"rasipuram","lat":"11.4429","lon":"78.1792"},"ATRH":{"code":"ATRH","name":"Rath","slug":"rath","lat":"25.5935","lon":"79.565"},"RATL":{"code":"RATL","name":"Ratlam","slug":"ratlam","lat":"23.334332","lon":"75.037394"},"RATN":{"code":"RATN","name":"Ratnagiri","slug":"ratnagiri","lat":"17.2478","lon":"73.3709"},"RATO":{"code":"RATO","name":"Ratnagiri (Odisha)","slug":"ratnagiri-odisha","lat":"20.642637","lon":"86.336708"},"RATP":{"code":"RATP","name":"Ratnapura","slug":"ratnapura","lat":"6.70556","lon":"80.384178"},"RAVE":{"code":"RAVE","name":"Raver","slug":"raver","lat":"21.242662","lon":"76.034317"},"RVPL":{"code":"RVPL","name":"Ravulapalem","slug":"ravulapalem","lat":"16.7635","lon":"81.842"},"RAXA":{"code":"RAXA","name":"Raxaul","slug":"raxaul","lat":"26.9806109","lon":"84.8290282"},"RYCT":{"code":"RYCT","name":"Rayachoti","slug":"rayachoti","lat":"14.058599","lon":"78.75192"},"RADA":{"code":"RADA","name":"Rayagada","slug":"rayagada","lat":"19.1712","lon":"83.4163"},"RTTA":{"code":"RTTA","name":"Rayakottai","slug":"rayakottai","lat":"12.5165","lon":"78.0304"},"RAYA":{"code":"RAYA","name":"Rayavaram","slug":"rayavaram","lat":"16.9006","lon":"82.0053"},"RAZO":{"code":"RAZO","name":"Razole","slug":"razole","lat":"16.4743","lon":"81.8402"},"RENT":{"code":"RENT","name":"Rentachintala","slug":"rentachintala","lat":"16.5515","lon":"79.5519"},"RENU":{"code":"RENU","name":"Renukoot","slug":"renukoot","lat":"24.2195","lon":"83.0335"},"REPA":{"code":"REPA","name":"Repalle","slug":"repalle","lat":"16.0174","lon":"80.8295"},"REVD":{"code":"REVD","name":"Revdanda","slug":"revdanda","lat":"18.553123","lon":"72.915285"},"RWAA":{"code":"RWAA","name":"Rewa","slug":"rewa","lat":"24.5373","lon":"81.3042"},"REWA":{"code":"REWA","name":"Rewari","slug":"rewari","lat":"28.1928","lon":"76.6239"},"RIBH":{"code":"RIBH","name":"RiBhoi","slug":"ribhoi","lat":"25.745401","lon":"92.121634"},"RGAS":{"code":"RGAS","name":"Ringas","slug":"ringas","lat":"27.3766","lon":"75.558"},"RKES":{"code":"RKES","name":"Rishikesh","slug":"rishikesh","lat":"30.0869","lon":"78.2676"},"RSRA":{"code":"RSRA","name":"Rishra","slug":"rishra","lat":"22.7244","lon":"88.3288"},"ROBE":{"code":"ROBE","name":"Robertsganj","slug":"robertsganj","lat":"24.685001","lon":"83.068352"},"ROH":{"code":"ROH","name":"Rohtak","slug":"rohtak","lat":"28.892361","lon":"76.59124"},"RONC":{"code":"RONC","name":"Ron","slug":"ron","lat":"15.6996","lon":"75.733"},"RNG":{"code":"RNG","name":"Rongjeng","slug":"rongjeng","lat":"25.6308","lon":"90.7786"},"ROOR":{"code":"ROOR","name":"Roorkee","slug":"roorkee","lat":"29.8543","lon":"77.888"},"RKOR":{"code":"RKOR","name":"Rourkela","slug":"rourkela","lat":"22.221935","lon":"84.857382"},"ROUT":{"code":"ROUT","name":"Routhulapudi","slug":"routhulapudi","lat":"17.3773","lon":"82.3689"},"RUDU":{"code":"RUDU","name":"Rudauli","slug":"rudauli","lat":"26.7509","lon":"81.7514"},"RUDP":{"code":"RUDP","name":"Rudrapur","slug":"rudrapur","lat":"28.979682","lon":"79.400876"},"RUPN":{"code":"RUPN","name":"Rupnagar","slug":"rupnagar","lat":"30.96595","lon":"76.522522"},"SABB":{"code":"SABB","name":"Sabbavaram","slug":"sabbavaram","lat":"17.7893","lon":"83.118"},"SADA":{"code":"SADA","name":"Sadasivpet","slug":"sadasivpet","lat":"17.6203","lon":"77.9539"},"SAFI":{"code":"SAFI","name":"Safidon","slug":"safidon","lat":"29.4060653","lon":"76.6614853"},"SAMP":{"code":"SAMP","name":"Sagar","slug":"sagar","lat":"23.8388","lon":"78.7378"},"GSRA":{"code":"GSRA","name":"Sagara","slug":"sagara","lat":"15.1291","lon":"74.658302"},"SAGA":{"code":"SAGA","name":"Sagwara","slug":"sagwara","lat":"23.6657","lon":"74.0241"},"SAHA":{"code":"SAHA","name":"Saharanpur","slug":"saharanpur","lat":"29.9667","lon":"77.55"},"SAHH":{"code":"SAHH","name":"Saharsa","slug":"saharsa","lat":"25.8835","lon":"86.6006"},"SBBB":{"code":"SBBB","name":"Sahibganj","slug":"sahibganj","lat":"25.2381","lon":"87.6454"},"SAHJ":{"code":"SAHJ","name":"Sahjanwa","slug":"sahjanwa","lat":"26.7538","lon":"83.2135"},"SASA":{"code":"SASA","name":"Sakleshpur","slug":"sakleshpur","lat":"12.9442","lon":"75.7866"},"SAKT":{"code":"SAKT","name":"Sakti","slug":"sakti","lat":"22.0238","lon":"82.9602"},"SALM":{"code":"SALM","name":"Salem","slug":"salem","lat":"11.65","lon":"78.16"},"SGMA":{"code":"SGMA","name":"Saligrama","slug":"saligrama","lat":"12.5603","lon":"76.2682"},"SAHM":{"code":"SAHM","name":"Salihundam","slug":"salihundam","lat":"18.3263","lon":"84.0564"},"SALI":{"code":"SALI","name":"Salipur","slug":"salipur","lat":"20.4843","lon":"86.1192"},"SALU":{"code":"SALU","name":"Salur","slug":"salur","lat":"18.5164","lon":"83.2051"},"SAMA":{"code":"SAMA","name":"Samalkota","slug":"samalkota","lat":"17.0504","lon":"82.1659"},"SMST":{"code":"SMST","name":"Samastipur","slug":"samastipur","lat":"25.856","lon":"85.7868"},"SAMB":{"code":"SAMB","name":"Sambalpur","slug":"sambalpur","lat":"21.4669","lon":"83.9812"},"SAML":{"code":"SAML","name":"Sambhal","slug":"sambhal","lat":"28.5904","lon":"78.5718"},"SABH":{"code":"SABH","name":"Sambhar","slug":"sambhar","lat":"26.9096","lon":"75.1859"},"SAMS":{"code":"SAMS","name":"Samsi","slug":"samsi","lat":"25.2735","lon":"88.004"},"SANA":{"code":"SANA","name":"Sanand","slug":"sanand","lat":"22.991703","lon":"72.368061"},"SNWD":{"code":"SNWD","name":"Sanawad","slug":"sanawad","lat":"22.1764","lon":"76.0682"},"SMNE":{"code":"SMNE","name":"Sangamner","slug":"sangamner","lat":"19.5771","lon":"74.208"},"SARE":{"code":"SARE","name":"Sangareddy","slug":"sangareddy","lat":"17.6194","lon":"78.0823"},"SAGR":{"code":"SAGR","name":"Sangaria","slug":"sangaria","lat":"24.33785","lon":"75.93625"},"SANG":{"code":"SANG","name":"Sangli","slug":"sangli","lat":"16.85438","lon":"74.564171"},"SNGO":{"code":"SNGO","name":"Sangola","slug":"sangola","lat":"17.4341","lon":"75.1954"},"SANR":{"code":"SANR","name":"Sangrur","slug":"sangrur","lat":"30.2506","lon":"75.8442"},"SAKL":{"code":"SAKL","name":"Sankarankoil","slug":"sankarankoil","lat":"9.1791","lon":"77.5309"},"SKPM":{"code":"SKPM","name":"Sankarapuram","slug":"sankarapuram","lat":"11.8895","lon":"78.9147"},"SKHW":{"code":"SKHW","name":"Sankeshwar","slug":"sankeshwar","lat":"16.26","lon":"74.4836"},"SANK":{"code":"SANK","name":"Sankri","slug":"sankri","lat":"31.078224","lon":"78.184439"},"STHB":{"code":"STHB","name":"Santhebennur","slug":"santhebennur","lat":"14.17074","lon":"76.001366"},"SAWR":{"code":"SAWR","name":"Sanwer","slug":"sanwer","lat":"22.9737","lon":"75.826"},"SAOR":{"code":"SAOR","name":"Saoner","slug":"saoner","lat":"21.3856","lon":"78.9218"},"SPAL":{"code":"SPAL","name":"Saraipali","slug":"saraipali","lat":"21.332","lon":"82.9975"},"SARH":{"code":"SARH","name":"Sarangarh","slug":"sarangarh","lat":"21.5877","lon":"83.0737"},"SARA":{"code":"SARA","name":"Sarangpur","slug":"sarangpur","lat":"23.5665","lon":"76.4723"},"SARP":{"code":"SARP","name":"Sarapaka","slug":"sarapaka","lat":"17.6943","lon":"80.8628"},"SRDS":{"code":"SRDS","name":"Sardarshahar","slug":"sardarshahar","lat":"28.4404","lon":"74.4937"},"DDDD":{"code":"DDDD","name":"Sardhana","slug":"sardhana","lat":"29.1451","lon":"77.6164"},"SARD":{"code":"SARD","name":"Sardulgarh","slug":"sardulgarh","lat":"29.6949","lon":"75.2352"},"SART":{"code":"SART","name":"Sarnath","slug":"sarnath","lat":"25.3762","lon":"83.0227"},"SARN":{"code":"SARN","name":"Sarni","slug":"sarni","lat":"22.1012669","lon":"78.1688619"},"SARS":{"code":"SARS","name":"Sarsiwa","slug":"sarsiwa","lat":"21.6306","lon":"82.93"},"SARM":{"code":"SARM","name":"Sasaram","slug":"sasaram","lat":"24.949","lon":"84.0314"},"STNA":{"code":"STNA","name":"Satana","slug":"satana","lat":"20.5982","lon":"74.2033"},"SATA":{"code":"SATA","name":"Satara","slug":"satara","lat":"17.6805","lon":"74.0183"},"SNTK":{"code":"SNTK","name":"Sathankulam","slug":"sathankulam","lat":"8.4413","lon":"77.9139"},"SATH":{"code":"SATH","name":"Sathupally","slug":"sathupally","lat":"17.2055","lon":"80.8378"},"STHY":{"code":"STHY","name":"Sathyamangalam","slug":"sathyamangalam","lat":"11.5048","lon":"77.2384"},"SATI":{"code":"SATI","name":"Satmile","slug":"satmile","lat":"21.8119","lon":"87.647"},"SATN":{"code":"SATN","name":"Satna","slug":"satna","lat":"24.6005","lon":"80.8322"},"SATL":{"code":"SATL","name":"Sattenapalle","slug":"sattenapalle","lat":"16.3944","lon":"80.1512"},"SAUN":{"code":"SAUN","name":"Saundatti","slug":"saundatti","lat":"15.7522","lon":"75.1253"},"SWMP":{"code":"SWMP","name":"Sawai Madhopur","slug":"sawai-madhopur","lat":"26.019006","lon":"76.357489"},"SAWA":{"code":"SAWA","name":"Sawantwadi","slug":"sawantwadi","lat":"15.9053","lon":"73.8213"},"SYAN":{"code":"SYAN","name":"Sayan","slug":"sayan","lat":"21.3179","lon":"72.8812"},"SCBD":{"code":"SCBD","name":"Secunderabad","slug":"secunderabad","lat":"17.4399","lon":"78.4983"},"SEET":{"code":"SEET","name":"Seethanagaram","slug":"seethanagaram","lat":"17.176976","lon":"81.692616"},"SXCF":{"code":"SXCF","name":"Seethathodu","slug":"seethathodu","lat":"9.3225","lon":"76.9709"},"SEHL":{"code":"SEHL","name":"Sehmalpur","slug":"sehmalpur","lat":"25.4064","lon":"82.8843"},"SEHO":{"code":"SEHO","name":"Sehore","slug":"sehore","lat":"23.205","lon":"77.0851"},"SELU":{"code":"SELU","name":"Selu","slug":"selu","lat":"19.4532","lon":"76.439"},"SIMI":{"code":"SIMI","name":"Semiliguda","slug":"semiliguda","lat":"18.7112","lon":"82.8508"},"SENA":{"code":"SENA","name":"Senapati","slug":"senapati","lat":"25.270311","lon":"94.022498"},"SEND":{"code":"SEND","name":"Sendhwa","slug":"sendhwa","lat":"21.6819","lon":"75.0943"},"SEAI":{"code":"SEAI","name":"Sendurai","slug":"sendurai","lat":"11.2534","lon":"79.1729"},"SENG":{"code":"SENG","name":"Sengottai","slug":"sengottai","lat":"8.9751","lon":"77.2491"},"SEON":{"code":"SEON","name":"Seoni","slug":"seoni","lat":"22.0869","lon":"79.5435"},"SEMA":{"code":"SEMA","name":"Seoni Malwa","slug":"seoni-malwa","lat":"22.4514","lon":"77.466"},"SEPP":{"code":"SEPP","name":"Seppa","slug":"seppa","lat":"27.35","lon":"93.04556"},"SERA":{"code":"SERA","name":"Serampore","slug":"serampore","lat":"22.7488406","lon":"88.3202373"},"SHAD":{"code":"SHAD","name":"Shadnagar","slug":"shadnagar","lat":"17.0712","lon":"78.2049"},"SHHA":{"code":"SHHA","name":"Shahada","slug":"shahada","lat":"21.5456","lon":"74.4683"},"SHAP":{"code":"SHAP","name":"Shahapur","slug":"shahapur","lat":"16.6957","lon":"76.8432"},"SHAH":{"code":"SHAH","name":"Shahdol","slug":"shahdol","lat":"23.6213","lon":"81.4279"},"SHJH":{"code":"SHJH","name":"Shahjahanpur","slug":"shahjahanpur","lat":"27.884054","lon":"79.912503"},"SUPH":{"code":"SUPH","name":"Shahpur","slug":"shahpur","lat":"32.21231","lon":"76.17634"},"SHAA":{"code":"SHAA","name":"Shahpura","slug":"shahpura","lat":"27.3858","lon":"75.9609"},"SJUR":{"code":"SJUR","name":"Shajapur","slug":"shajapur","lat":"23.4273","lon":"76.273"},"SGAH":{"code":"SGAH","name":"Shamgarh","slug":"shamgarh","lat":"24.1883","lon":"75.6353"},"SHAM":{"code":"SHAM","name":"Shamli","slug":"shamli","lat":"77.31028","lon":"29.448055"},"SHAN":{"code":"SHAN","name":"Shankarampet","slug":"shankarampet","lat":"18.0502","lon":"77.9125"},"SKRP":{"code":"SKRP","name":"Shankarpally","slug":"shankarpally","lat":"17.4554","lon":"78.1312"},"SHNC":{"code":"SHNC","name":"Shankarpur","slug":"shankarpur","lat":"21.648789","lon":"87.570792"},"SHEG":{"code":"SHEG","name":"Shegaon","slug":"shegaon","lat":"20.793","lon":"76.691"},"SHEL":{"code":"SHEL","name":"Shela","slug":"shela","lat":"23.0003","lon":"72.459"},"SHPR":{"code":"SHPR","name":"Sheopur","slug":"sheopur","lat":"25.669748","lon":"76.69784"},"SHER":{"code":"SHER","name":"Sheoraphuli","slug":"sheoraphuli","lat":"22.7705","lon":"88.322"},"SHEO":{"code":"SHEO","name":"Sheorinarayan","slug":"sheorinarayan","lat":"21.7218","lon":"82.5949"},"SHKR":{"code":"SHKR","name":"Shikaripur","slug":"shikaripur","lat":"14.2633419","lon":"75.3351831"},"SHIP":{"code":"SHIP","name":"Shikarpur","slug":"shikarpur","lat":"28.2798","lon":"78.011"},"SKHR":{"code":"SKHR","name":"Shikrapur","slug":"shikrapur","lat":"18.692181","lon":"74.132599"},"SHLG":{"code":"SHLG","name":"Shillong","slug":"shillong","lat":"25.577967","lon":"91.893982"},"SMLA":{"code":"SMLA","name":"Shimla","slug":"shimla","lat":"31.104605","lon":"77.173424"},"SHDK":{"code":"SHDK","name":"Shindkheda","slug":"shindkheda","lat":"21.2726","lon":"74.7455"},"SHTI":{"code":"SHTI","name":"Shirahatti","slug":"shirahatti","lat":"15.2313","lon":"75.5772"},"OKKL":{"code":"OKKL","name":"Shiralakoppa","slug":"shiralakoppa","lat":"14.3797","lon":"75.2508"},"SHIR":{"code":"SHIR","name":"Shirali","slug":"shirali","lat":"14.030851","lon":"74.528472"},"SRUR":{"code":"SRUR","name":"Shirpur","slug":"shirpur","lat":"21.3496","lon":"74.8797"},"SHRU":{"code":"SHRU","name":"Shirur","slug":"shirur","lat":"18.8272","lon":"74.373"},"SHIA":{"code":"SHIA","name":"Shivamogga","slug":"shivamogga","lat":"13.9299","lon":"75.5681"},"SHIV":{"code":"SHIV","name":"Shivpuri","slug":"shivpuri","lat":"25.4358","lon":"77.6651"},"SPHN":{"code":"SPHN","name":"Shopian","slug":"shopian","lat":"74.8361","lon":"33.717"},"SHNR":{"code":"SHNR","name":"Shoranur","slug":"shoranur","lat":"10.7593","lon":"76.2714"},"SHRI":{"code":"SHRI","name":"Shrigonda","slug":"shrigonda","lat":"18.617544","lon":"74.698128"},"SHUR":{"code":"SHUR","name":"Shrirampur","slug":"shrirampur","lat":"19.6222","lon":"74.6576"},"SHLP":{"code":"SHLP","name":"Shujalpur","slug":"shujalpur","lat":"23.3882","lon":"76.7163"},"SKLG":{"code":"SKLG","name":"Shuklaganj","slug":"shuklaganj","lat":"26.4763","lon":"80.3813"},"SDDU":{"code":"SDDU","name":"Siddapura","slug":"siddapura","lat":"12.95524","lon":"77.731087"},"SIDZ":{"code":"SIDZ","name":"Siddharthnagar","slug":"siddharthnagar","lat":"27.2991","lon":"83.0928"},"SIDD":{"code":"SIDD","name":"Siddhpur","slug":"siddhpur","lat":"23.9309","lon":"72.3621"},"SDDP":{"code":"SDDP","name":"Siddipet","slug":"siddipet","lat":"18.1019","lon":"78.8521"},"SDPR":{"code":"SDPR","name":"Sidhpura","slug":"sidhpura","lat":"27.6331","lon":"78.8692"},"SIDL":{"code":"SIDL","name":"Sidlaghatta","slug":"sidlaghatta","lat":"13.3937","lon":"77.8653"},"SIIR":{"code":"SIIR","name":"Sihor","slug":"sihor","lat":"21.7113","lon":"71.9618"},"SIHO":{"code":"SIHO","name":"Sihora","slug":"sihora","lat":"23.4866","lon":"80.1066"},"SKND":{"code":"SKND","name":"Sikandra","slug":"sikandra","lat":"26.3678","lon":"79.6292"},"SIKR":{"code":"SIKR","name":"Sikar","slug":"sikar","lat":"27.6094","lon":"75.1399"},"SIL":{"code":"SIL","name":"Silchar","slug":"silchar","lat":"24.820142","lon":"92.797995"},"SILI":{"code":"SILI","name":"Siliguri","slug":"siliguri","lat":"26.708698","lon":"88.425536"},"SILV":{"code":"SILV","name":"Silvassa","slug":"silvassa","lat":"20.27643","lon":"73.008077"},"SIMD":{"code":"SIMD","name":"Simdega","slug":"simdega","lat":"22.616521","lon":"84.493811"},"SIND":{"code":"SIND","name":"Sindhanur","slug":"sindhanur","lat":"15.7917","lon":"76.6875"},"SNDH":{"code":"SNDH","name":"Sindhudurg","slug":"sindhudurg","lat":"16.3492","lon":"73.5594"},"SING":{"code":"SING","name":"Singapore","slug":"singapore","lat":"1.282056","lon":"103.854336"},"SIGN":{"code":"SIGN","name":"Singarayakonda","slug":"singarayakonda","lat":"15.25","lon":"80.0212"},"SNGR":{"code":"SNGR","name":"Singrauli","slug":"singrauli","lat":"24.1443","lon":"82.3886"},"SINA":{"code":"SINA","name":"Sinnar","slug":"sinnar","lat":"19.8503377","lon":"73.9764713"},"SIRA":{"code":"SIRA","name":"Sira","slug":"sira","lat":"13.7451","lon":"76.898"},"SIRC":{"code":"SIRC","name":"Sircilla","slug":"sircilla","lat":"18.4042","lon":"78.8305"},"SIRK":{"code":"SIRK","name":"Sirkali","slug":"sirkali","lat":"11.2407","lon":"79.7372"},"SIRM":{"code":"SIRM","name":"Sirmaur","slug":"sirmaur","lat":"30.699305","lon":"77.094301"},"SIRO":{"code":"SIRO","name":"Sirohi","slug":"sirohi","lat":"24.7467","lon":"72.8043"},"SISA":{"code":"SISA","name":"Sirsa","slug":"sirsa","lat":"29.5333","lon":"75.0167"},"SRSI":{"code":"SRSI","name":"Sirsi","slug":"sirsi","lat":"14.6187728","lon":"74.8201529"},"SPPA":{"code":"SPPA","name":"Siruguppa","slug":"siruguppa","lat":"15.6175","lon":"76.9006"},"SIMA":{"code":"SIMA","name":"Sitamarhi","slug":"sitamarhi","lat":"26.5952","lon":"85.4808"},"SITA":{"code":"SITA","name":"Sitapur","slug":"sitapur","lat":"27.5325","lon":"80.8987"},"SHVG":{"code":"SHVG","name":"Sivaganga","slug":"sivaganga","lat":"9.9726","lon":"78.5661"},"SIV":{"code":"SIV","name":"Sivakasi","slug":"sivakasi","lat":"9.4533","lon":"77.8024"},"SVSG":{"code":"SVSG","name":"Sivasagar","slug":"sivasagar","lat":"26.9826","lon":"94.6425"},"SWNB":{"code":"SWNB","name":"Siwan","slug":"siwan","lat":"26.2243","lon":"84.36"},"SCO":{"code":"SCO","name":"Solan","slug":"solan","lat":"30.9045","lon":"77.0967"},"SOLA":{"code":"SOLA","name":"Solapur","slug":"solapur","lat":"17.659834","lon":"75.906601"},"SLRM":{"code":"SLRM","name":"Solasiramani","slug":"solasiramani","lat":"11.243535","lon":"77.874029"},"SOLU":{"code":"SOLU","name":"Solukhumbu","slug":"solukhumbu","lat":"27.791","lon":"86.6611"},"SOMA":{"code":"SOMA","name":"Sompeta","slug":"sompeta","lat":"18.9456","lon":"84.5825"},"SOYW":{"code":"SOYW","name":"Sonari","slug":"sonari","lat":"27.028","lon":"95.0312"},"SONE":{"code":"SONE","name":"Sonepur","slug":"sonepur","lat":"25.696079","lon":"85.166694"},"SONG":{"code":"SONG","name":"Songadh","slug":"songadh","lat":"21.1664","lon":"73.5645"},"RAIH":{"code":"RAIH","name":"Sonipat","slug":"sonipat","lat":"28.9288","lon":"77.0913"},"SONH":{"code":"SONH","name":"Sonkatch","slug":"sonkatch","lat":"22.9729","lon":"76.3469"},"SORO":{"code":"SORO","name":"Soron","slug":"soron","lat":"27.8866","lon":"78.7448"},"SPAR":{"code":"SPAR","name":"South 24 Parganas","slug":"south-24-parganas","lat":"22.0843799","lon":"88.0349845"},"SRIG":{"code":"SRIG","name":"Sri Ganganagar","slug":"sri-ganganagar","lat":"29.9167","lon":"73.8833"},"SRRS":{"code":"SRRS","name":"Sri Sathya Sai","slug":"sri-sathya-sai","lat":"14.158099","lon":"77.812202"},"SRKL":{"code":"SRKL","name":"Srikakulam","slug":"srikakulam","lat":"18.4285","lon":"84.0167"},"SRNG":{"code":"SRNG","name":"Srinagar","slug":"srinagar","lat":"34.0837","lon":"74.7973"},"SRIR":{"code":"SRIR","name":"Srirangapatna","slug":"srirangapatna","lat":"12.4216","lon":"76.6931"},"SRTA":{"code":"SRTA","name":"Srivaikuntam","slug":"srivaikuntam","lat":"8.6312","lon":"77.9125"},"SRIV":{"code":"SRIV","name":"Srivilliputhur","slug":"srivilliputhur","lat":"9.5121","lon":"77.6341"},"STGH":{"code":"STGH","name":"Station Ghanpur","slug":"station-ghanpur","lat":"17.8471","lon":"79.3972"},"SSBI":{"code":"SSBI","name":"Sugauli","slug":"sugauli","lat":"26.7577","lon":"84.7211"},"SJNG":{"code":"SJNG","name":"Sujangarh","slug":"sujangarh","lat":"27.7045","lon":"74.4643"},"SUKU":{"code":"SUKU","name":"Sukma","slug":"sukma","lat":"18.3909","lon":"81.6588"},"SLIA":{"code":"SLIA","name":"Sulia","slug":"sulia","lat":"12.5606","lon":"75.3804"},"SULX":{"code":"SULX","name":"Sultanabad","slug":"sultanabad","lat":"18.5217","lon":"79.3184"},"SLUT":{"code":"SLUT","name":"Sultanpur","slug":"sultanpur","lat":"26.2648","lon":"82.0727"},"SULY":{"code":"SULY","name":"Sulthan Bathery","slug":"sulthan-bathery","lat":"11.6656","lon":"76.2627"},"SURJ":{"code":"SURJ","name":"Sumerpur","slug":"sumerpur","lat":"25.1526","lon":"73.0823"},"SUMA":{"code":"SUMA","name":"Sunam","slug":"sunam","lat":"30.1306","lon":"75.8014"},"SUNA":{"code":"SUNA","name":"Sunam","slug":"sunam","lat":"30.1306","lon":"75.8014"},"SUNR":{"code":"SUNR","name":"Sundar Nagar","slug":"sundar-nagar","lat":"31.5332","lon":"76.8923"},"SUND":{"code":"SUND","name":"Sundargarh","slug":"sundargarh","lat":"22.0571","lon":"84.6897"},"SUNG":{"code":"SUNG","name":"Sunguvarchatram","slug":"sunguvarchatram","lat":"12.9246","lon":"79.879"},"SPUL":{"code":"SPUL","name":"Supaul","slug":"supaul","lat":"26.1234","lon":"86.6045"},"SURA":{"code":"SURA","name":"Surajpur","slug":"surajpur","lat":"23.2148","lon":"82.8694"},"SURT":{"code":"SURT","name":"Surat","slug":"surat","lat":"21.195","lon":"72.819444"},"SRTK":{"code":"SRTK","name":"Surathkal","slug":"surathkal","lat":"12.9951","lon":"74.8094"},"SRDN":{"code":"SRDN","name":"Surendranagar","slug":"surendranagar","lat":"22.7201","lon":"71.6495"},"BSRI":{"code":"BSRI","name":"Suri","slug":"suri","lat":"23.9056852","lon":"87.4817269"},"SURI":{"code":"SURI","name":"Suriya","slug":"suriya","lat":"24.174795","lon":"85.887634"},"SURY":{"code":"SURY","name":"Suryapet","slug":"suryapet","lat":"17.1353","lon":"79.6334"},"TNRP":{"code":"TNRP","name":"T.Narasapuram","slug":"tnarasapuram","lat":"17.1012","lon":"81.0775"},"TIHU":{"code":"TIHU","name":"TIHU","slug":"tihu","lat":"26.4758","lon":"91.2674"},"TADP":{"code":"TADP","name":"Tadepalligudem","slug":"tadepalligudem","lat":"16.8138","lon":"81.5212"},"TADK":{"code":"TADK","name":"Tadikalapudi","slug":"tadikalapudi","lat":"16.9002","lon":"81.1755"},"TDPT":{"code":"TDPT","name":"Tadipatri","slug":"tadipatri","lat":"14.907","lon":"78.0093"},"TAJP":{"code":"TAJP","name":"Tajpur","slug":"tajpur","lat":"25.8499","lon":"85.6666"},"TALC":{"code":"TALC","name":"Talcher","slug":"talcher","lat":"20.9501","lon":"85.2168"},"TALI":{"code":"TALI","name":"Taliparamba","slug":"taliparamba","lat":"12.0351","lon":"75.3611"},"TTPP":{"code":"TTPP","name":"Tallapudi","slug":"tallapudi","lat":"17.1257","lon":"81.6651"},"TALL":{"code":"TALL","name":"Tallarevu","slug":"tallarevu","lat":"16.7819","lon":"82.2325"},"TALW":{"code":"TALW","name":"Talwandi Bhai","slug":"talwandi-bhai","lat":"30.8576","lon":"74.9267"},"TMLU":{"code":"TMLU","name":"Tamluk","slug":"tamluk","lat":"22.2788","lon":"87.9188"},"TNDA":{"code":"TNDA","name":"Tanda","slug":"tanda","lat":"31.678074","lon":"75.638641"},"TAND":{"code":"TAND","name":"Tandur","slug":"tandur","lat":"17.2576","lon":"77.5875"},"TAAA":{"code":"TAAA","name":"Tangla","slug":"tangla","lat":"26.6573","lon":"91.9124"},"TANG":{"code":"TANG","name":"Tangutur","slug":"tangutur","lat":"15.337688","lon":"80.0333"},"TANK":{"code":"TANK","name":"Tanuku","slug":"tanuku","lat":"16.7572","lon":"81.68"},"TARK":{"code":"TARK","name":"Tarakeswar","slug":"tarakeswar","lat":"22.8787","lon":"88.0143"},"TRPM":{"code":"TRPM","name":"Tarapur","slug":"tarapur","lat":"19.861181","lon":"72.68272"},"TERE":{"code":"TERE","name":"Tarikere","slug":"tarikere","lat":"13.7087","lon":"75.8159"},"TASG":{"code":"TASG","name":"Tasgaon","slug":"tasgaon","lat":"17.0295","lon":"74.6078"},"TATI":{"code":"TATI","name":"Tatipaka","slug":"tatipaka","lat":"16.505","lon":"81.8784"},"TAWA":{"code":"TAWA","name":"Tawang","slug":"tawang","lat":"27.6325","lon":"91.7539"},"TKLI":{"code":"TKLI","name":"Tekkali","slug":"tekkali","lat":"18.6058","lon":"84.2302"},"TMBH":{"code":"TMBH","name":"Tembhurni","slug":"tembhurni","lat":"18.029453","lon":"75.190842"},"TENA":{"code":"TENA","name":"Tenali","slug":"tenali","lat":"16.243152","lon":"80.639716"},"TENK":{"code":"TENK","name":"Tenkasi","slug":"tenkasi","lat":"8.959157","lon":"77.312795"},"TERD":{"code":"TERD","name":"Terdal","slug":"terdal","lat":"16.49469","lon":"75.052028"},"TEZP":{"code":"TEZP","name":"Tezpur","slug":"tezpur","lat":"26.6760687","lon":"92.7605897"},"TEZU":{"code":"TEZU","name":"Tezu","slug":"tezu","lat":"27.9277","lon":"96.1533"},"THAY":{"code":"THAY","name":"Thalassery","slug":"thalassery","lat":"11.7533","lon":"75.4929"},"THAL":{"code":"THAL","name":"Thalayolaparambu","slug":"thalayolaparambu","lat":"9.785442","lon":"76.448922"},"THAI":{"code":"THAI","name":"Thalikulam","slug":"thalikulam","lat":"10.4446","lon":"76.0908"},"THDA":{"code":"THDA","name":"Thallada","slug":"thallada","lat":"17.2171","lon":"80.4226"},"TMRY":{"code":"TMRY","name":"Thamarassery","slug":"thamarassery","lat":"11.4152","lon":"75.9405"},"THPD":{"code":"THPD","name":"Thanipadi","slug":"thanipadi","lat":"12.107423","lon":"78.834099"},"TANJ":{"code":"TANJ","name":"Thanjavur","slug":"thanjavur","lat":"10.787","lon":"79.1378"},"THRD":{"code":"THRD","name":"Tharad","slug":"tharad","lat":"24.3967","lon":"71.6272"},"THEN":{"code":"THEN","name":"Theni","slug":"theni","lat":"9.933","lon":"77.4702"},"TMPR":{"code":"TMPR","name":"Thimmapuram (Addu Road)","slug":"thimmapuram-addu-road","lat":"17.4319","lon":"82.7495"},"THIZ":{"code":"THIZ","name":"Thirthahalli","slug":"thirthahalli","lat":"13.6895","lon":"75.245"},"THRU":{"code":"THRU","name":"Thirubuvanai","slug":"thirubuvanai","lat":"11.923525","lon":"79.647842"},"THIK":{"code":"THIK","name":"Thirukkattupalli","slug":"thirukkattupalli","lat":"10.849","lon":"78.9542"},"THRM":{"code":"THRM","name":"Thirumalagiri","slug":"thirumalagiri","lat":"16.7231","lon":"79.3374"},"UNGS":{"code":"UNGS","name":"Thirunageswaram","slug":"thirunageswaram","lat":"10.96502","lon":"79.428673"},"THND":{"code":"THND","name":"Thiruthuraipoondi","slug":"thiruthuraipoondi","lat":"10.5251","lon":"79.6362"},"THTN":{"code":"THTN","name":"Thiruttani","slug":"thiruttani","lat":"13.1758","lon":"79.6109"},"THVL":{"code":"THVL","name":"Thiruvalla","slug":"thiruvalla","lat":"9.3835","lon":"76.5741"},"TRIV":{"code":"TRIV","name":"Thiruvananthapuram (Trivandrum)","slug":"thiruvananthapuram-trivandrum","lat":"8.4875","lon":"76.9525"},"THVR":{"code":"THVR","name":"Thiruvarur","slug":"thiruvarur","lat":"10.7713","lon":"79.637"},"THOD":{"code":"THOD","name":"Thodupuzha","slug":"thodupuzha","lat":"9.893","lon":"76.7221"},"THOO":{"code":"THOO","name":"Thoothukudi","slug":"thoothukudi","lat":"8.7642","lon":"78.1348"},"THOR":{"code":"THOR","name":"Thorrur","slug":"thorrur","lat":"17.5834","lon":"79.6586"},"THYM":{"code":"THYM","name":"Thottiyam","slug":"thottiyam","lat":"10.9896","lon":"78.3359"},"THPR":{"code":"THPR","name":"Thriprayar","slug":"thriprayar","lat":"10.4171","lon":"76.1059"},"THSR":{"code":"THSR","name":"Thrissur","slug":"thrissur","lat":"10.5276","lon":"76.2144"},"THUL":{"code":"THUL","name":"Thullur","slug":"thullur","lat":"16.5246443","lon":"80.4586132"},"THYR":{"code":"THYR","name":"Thuraiyur","slug":"thuraiyur","lat":"11.1415","lon":"78.5945"},"KTTT":{"code":"KTTT","name":"Tikamgarh","slug":"tikamgarh","lat":"24.7438","lon":"78.8324"},"TNO":{"code":"TNO","name":"Tilda Neora","slug":"tilda-neora","lat":"21.5528","lon":"81.7842"},"TNVM":{"code":"TNVM","name":"Tindivanam","slug":"tindivanam","lat":"12.2369","lon":"79.65"},"TINS":{"code":"TINS","name":"Tinsukia","slug":"tinsukia","lat":"27.489464","lon":"95.360144"},"TIPT":{"code":"TIPT","name":"Tiptur","slug":"tiptur","lat":"13.2638","lon":"76.4703"},"TRCD":{"code":"TRCD","name":"Tiruchendur","slug":"tiruchendur","lat":"8.4963","lon":"78.1251"},"TIRC":{"code":"TIRC","name":"Tiruchengode","slug":"tiruchengode","lat":"11.379026","lon":"77.894941"},"TRII":{"code":"TRII","name":"Tiruchirappalli","slug":"tiruchirappalli","lat":"10.7905","lon":"78.7047"},"TRKR":{"code":"TRKR","name":"Tirukoilur","slug":"tirukoilur","lat":"11.9687","lon":"79.2087"},"TINA":{"code":"TINA","name":"Tirumakudalu Narasipura","slug":"tirumakudalu-narasipura","lat":"12.211","lon":"76.9038"},"TIRV":{"code":"TIRV","name":"Tirunelveli","slug":"tirunelveli","lat":"8.73","lon":"77.7"},"TIRU":{"code":"TIRU","name":"Tirupati","slug":"tirupati","lat":"13.6288","lon":"79.4192"},"TRPR":{"code":"TRPR","name":"Tirupattur","slug":"tirupattur","lat":"12.5081","lon":"78.5702"},"TIRP":{"code":"TIRP","name":"Tiruppur","slug":"tiruppur","lat":"11.1085242","lon":"77.3410656"},"TRUR":{"code":"TRUR","name":"Tirur","slug":"tirur","lat":"10.9146","lon":"75.9221"},"TRVL":{"code":"TRVL","name":"Tiruvallur","slug":"tiruvallur","lat":"13.1444","lon":"79.894"},"TVNM":{"code":"TVNM","name":"Tiruvannamalai","slug":"tiruvannamalai","lat":"12.2253","lon":"79.0747"},"TIVA":{"code":"TIVA","name":"Tiruvarur","slug":"tiruvarur","lat":"10.6683","lon":"79.5154"},"TRVR":{"code":"TRVR","name":"Tiruvuru","slug":"tiruvuru","lat":"17.1099","lon":"80.6094"},"TIRW":{"code":"TIRW","name":"Tirwaganj","slug":"tirwaganj","lat":"26.9594","lon":"79.789"},"TTGH":{"code":"TTGH","name":"Titagarh","slug":"titagarh","lat":"22.7391989","lon":"88.3667278"},"TITL":{"code":"TITL","name":"Titlagarh","slug":"titlagarh","lat":"20.2871","lon":"83.1466"},"TITT":{"code":"TITT","name":"Tittakudi","slug":"tittakudi","lat":"11.4096","lon":"79.1182"},"THAA":{"code":"THAA","name":"Tohana","slug":"tohana","lat":"29.718954","lon":"75.906815"},"TONK":{"code":"TONK","name":"Tonk","slug":"tonk","lat":"26.162","lon":"75.7895"},"TOOP":{"code":"TOOP","name":"Toopran","slug":"toopran","lat":"17.8443","lon":"78.478"},"TRIC":{"code":"TRIC","name":"Trichy","slug":"trichy","lat":"10.805","lon":"78.6856"},"TRIN":{"code":"TRIN","name":"Trincomalee","slug":"trincomalee","lat":"8.587017","lon":"81.214836"},"TUMK":{"code":"TUMK","name":"Tumakuru (Tumkur)","slug":"tumakuru-tumkur","lat":"13.340138","lon":"77.100098"},"TUSR":{"code":"TUSR","name":"Tumsar","slug":"tumsar","lat":"21.3808","lon":"79.7456"},"TUNI":{"code":"TUNI","name":"Tuni","slug":"tuni","lat":"17.3573","lon":"82.5443"},"TURA":{"code":"TURA","name":"Tura","slug":"tura","lat":"25.525359","lon":"90.197153"},"TUPP":{"code":"TUPP","name":"Turputallu","slug":"turputallu","lat":"16.4295","lon":"81.6425"},"TUKE":{"code":"TUKE","name":"Turuvekere","slug":"turuvekere","lat":"13.1605","lon":"76.6673"},"UDAI":{"code":"UDAI","name":"Udaipur","slug":"udaipur","lat":"24.58","lon":"73.68"},"UDG":{"code":"UDG","name":"Udalguri","slug":"udalguri","lat":"26.7451","lon":"92.0959"},"UDGZ":{"code":"UDGZ","name":"Udalguri","slug":"udalguri","lat":"26.7451","lon":"92.0959"},"UDAY":{"code":"UDAY","name":"Udaynarayanpur","slug":"udaynarayanpur","lat":"22.7174","lon":"87.9751"},"UDGR":{"code":"UDGR","name":"Udgir","slug":"udgir","lat":"18.3943","lon":"77.1126"},"UDHM":{"code":"UDHM","name":"Udhampur","slug":"udhampur","lat":"32.916","lon":"75.1416"},"UDMP":{"code":"UDMP","name":"Udumalaipettai","slug":"udumalaipettai","lat":"10.584301","lon":"77.250333"},"UDUP":{"code":"UDUP","name":"Udupi","slug":"udupi","lat":"13.3409","lon":"74.7421"},"UJHA":{"code":"UJHA","name":"Ujhani","slug":"ujhani","lat":"28.0014478","lon":"78.9905891"},"UJJN":{"code":"UJJN","name":"Ujjain","slug":"ujjain","lat":"23.1828","lon":"75.7772"},"ULLI":{"code":"ULLI","name":"Ulikkal","slug":"ulikkal","lat":"12.0375","lon":"75.6703"},"ULUR":{"code":"ULUR","name":"Uluberia","slug":"uluberia","lat":"22.4744","lon":"88.1"},"ULPT":{"code":"ULPT","name":"Ulundurpet","slug":"ulundurpet","lat":"11.6849","lon":"79.2874"},"UMR":{"code":"UMR","name":"Umaria","slug":"umaria","lat":"23.604447","lon":"80.504907"},"UMER":{"code":"UMER","name":"Umbergaon","slug":"umbergaon","lat":"20.1756747","lon":"72.7347663"},"UMBR":{"code":"UMBR","name":"Umbraj","slug":"umbraj","lat":"17.396294","lon":"74.084697"},"UMEK":{"code":"UMEK","name":"Umerkote","slug":"umerkote","lat":"19.6647","lon":"82.2121"},"UMRD":{"code":"UMRD","name":"Umred","slug":"umred","lat":"20.8421","lon":"79.3261"},"BEEL":{"code":"BEEL","name":"Una","slug":"una","lat":"31.4685","lon":"76.2708"},"UNAU":{"code":"UNAU","name":"Una (Gujarat)","slug":"una-gujarat","lat":"20.8235","lon":"71.0409"},"UVLI":{"code":"UVLI","name":"Undavalli","slug":"undavalli","lat":"16.4957","lon":"80.58"},"UNDI":{"code":"UNDI","name":"Undi","slug":"undi","lat":"16.586361","lon":"81.4636"},"UNNA":{"code":"UNNA","name":"Unnao","slug":"unnao","lat":"26.539233","lon":"80.487848"},"UPDA":{"code":"UPDA","name":"Uppada","slug":"uppada","lat":"17.0883","lon":"82.3333"},"UTHM":{"code":"UTHM","name":"Uthamapalayam","slug":"uthamapalayam","lat":"9.8086","lon":"77.3281"},"UHGR":{"code":"UHGR","name":"Uthangarai","slug":"uthangarai","lat":"12.31106","lon":"78.38567"},"UTHI":{"code":"UTHI","name":"Uthiramerur","slug":"uthiramerur","lat":"12.6149","lon":"79.7594"},"UTHU":{"code":"UTHU","name":"Uthukottai","slug":"uthukottai","lat":"13.3339","lon":"79.8927"},"UTRA":{"code":"UTRA","name":"Utraula","slug":"utraula","lat":"27.3175","lon":"82.4184"},"UDJB":{"code":"UDJB","name":"Uttar Dinajpur","slug":"uttar-dinajpur","lat":"25.981","lon":"88.051"},"UTK":{"code":"UTK","name":"Uttara Kannada","slug":"uttara-kannada","lat":"14.7937","lon":"74.6869"},"UTTA":{"code":"UTTA","name":"Uttarkashi","slug":"uttarkashi","lat":"30.7268","lon":"78.4354"},"VDKR":{"code":"VDKR","name":"Vadakara","slug":"vadakara","lat":"11.6085","lon":"75.5917"},"VDCY":{"code":"VDCY","name":"Vadakkencherry","slug":"vadakkencherry","lat":"10.5928","lon":"76.4823"},"VADA":{"code":"VADA","name":"Vadalur","slug":"vadalur","lat":"11.5573","lon":"79.5547"},"VADN":{"code":"VADN","name":"Vadanappally","slug":"vadanappally","lat":"10.474478","lon":"76.069517"},"VAD":{"code":"VAD","name":"Vadodara","slug":"vadodara","lat":"22.3073095","lon":"73.1810976"},"VADJ":{"code":"VADJ","name":"Vaduj","slug":"vaduj","lat":"17.5935","lon":"74.4511"},"VAIJ":{"code":"VAIJ","name":"Vaijapur","slug":"vaijapur","lat":"19.9257","lon":"74.7285"},"VAIT":{"code":"VAIT","name":"Vaitheeswarankoil","slug":"vaitheeswarankoil","lat":"11.1949","lon":"79.7105"},"VALA":{"code":"VALA","name":"Valanchery","slug":"valanchery","lat":"10.8878","lon":"76.0732"},"VLAP":{"code":"VLAP","name":"Valaparla","slug":"valaparla","lat":"15.93216","lon":"80.044487"},"VALI":{"code":"VALI","name":"Valigonda","slug":"valigonda","lat":"17.376347","lon":"79.021693"},"VALL":{"code":"VALL","name":"Valluru","slug":"valluru","lat":"16.558","lon":"81.83"},"VLSD":{"code":"VLSD","name":"Valsad","slug":"valsad","lat":"20.610069","lon":"72.925858"},"VANI":{"code":"VANI","name":"Vaniyambadi","slug":"vaniyambadi","lat":"12.695","lon":"78.6219"},"VAPI":{"code":"VAPI","name":"Vapi","slug":"vapi","lat":"20.371237","lon":"72.90634"},"VARA":{"code":"VARA","name":"Varadaiahpalem","slug":"varadaiahpalem","lat":"13.6012","lon":"79.9347"},"VRYM":{"code":"VRYM","name":"Varadiyam","slug":"varadiyam","lat":"10.5916","lon":"76.174"},"VAR":{"code":"VAR","name":"Varanasi","slug":"varanasi","lat":"25.3176452","lon":"82.9739144"},"VKAL":{"code":"VKAL","name":"Varkala","slug":"varkala","lat":"8.743375","lon":"76.720871"},"VASI":{"code":"VASI","name":"Vasind","slug":"vasind","lat":"19.4082","lon":"73.2646"},"VAST":{"code":"VAST","name":"Vatsavai","slug":"vatsavai","lat":"16.9804","lon":"80.2447"},"VAVU":{"code":"VAVU","name":"Vavuniya","slug":"vavuniya","lat":"8.751247","lon":"80.497272"},"VAZH":{"code":"VAZH","name":"Vazhapadi","slug":"vazhapadi","lat":"11.6555","lon":"78.4013"},"VEDA":{"code":"VEDA","name":"Vedasandur","slug":"vedasandur","lat":"10.5315","lon":"77.9482"},"VEER":{"code":"VEER","name":"Veeraghattam","slug":"veeraghattam","lat":"18.6886","lon":"83.6096"},"VELG":{"code":"VELG","name":"Velangi","slug":"velangi","lat":"16.8697","lon":"82.1142"},"VELA":{"code":"VELA","name":"Velanja","slug":"velanja","lat":"21.3082","lon":"72.9151"},"VELM":{"code":"VELM","name":"Velanthavalam","slug":"velanthavalam","lat":"10.8129","lon":"76.8577"},"VELI":{"code":"VELI","name":"Vellakoil","slug":"vellakoil","lat":"10.946","lon":"77.7126"},"VMPL":{"code":"VMPL","name":"Vellampalli","slug":"vellampalli","lat":"18.1691","lon":"79.6744"},"VELL":{"code":"VELL","name":"Vellore","slug":"vellore","lat":"12.9202","lon":"79.1333"},"VLGD":{"code":"VLGD","name":"Velugodu","slug":"velugodu","lat":"15.7183","lon":"78.5746"},"VAIM":{"code":"VAIM","name":"Vempalli","slug":"vempalli","lat":"14.3662","lon":"78.4586"},"VERU":{"code":"VERU","name":"Vemulawada","slug":"vemulawada","lat":"18.4681","lon":"78.8671"},"VENG":{"code":"VENG","name":"Vengurla","slug":"vengurla","lat":"15.760721","lon":"73.663858"},"VNKT":{"code":"VNKT","name":"Venkatapuram","slug":"venkatapuram","lat":"18.3062","lon":"80.5504"},"VRAL":{"code":"VRAL","name":"Veraval","slug":"veraval","lat":"20.9159","lon":"70.3629"},"VLEM":{"code":"VLEM","name":"Vetapalem","slug":"vetapalem","lat":"10.7723","lon":"76.3695"},"VETA":{"code":"VETA","name":"Vettaikaranpudur","slug":"vettaikaranpudur","lat":"10.562","lon":"76.9211"},"VETT":{"code":"VETT","name":"Vettavalam","slug":"vettavalam","lat":"12.1092","lon":"79.2437"},"VIDI":{"code":"VIDI","name":"Vidisha","slug":"vidisha","lat":"23.5251","lon":"77.8081"},"VIUR":{"code":"VIUR","name":"Vijapur","slug":"vijapur","lat":"23.5609","lon":"72.7511"},"VIJP":{"code":"VIJP","name":"Vijayapura (Bengaluru Rural)","slug":"vijayapura-bengaluru-rural","lat":"13.2955","lon":"77.801"},"VJPR":{"code":"VJPR","name":"Vijayapura (Bijapur)","slug":"vijayapura-bijapur","lat":"16.8302","lon":"75.71"},"VRAI":{"code":"VRAI","name":"Vijayarai","slug":"vijayarai","lat":"16.8121","lon":"81.0327"},"VIJA":{"code":"VIJA","name":"Vijayawada","slug":"vijayawada","lat":"16.519","lon":"80.6215"},"VKBD":{"code":"VKBD","name":"Vikarabad","slug":"vikarabad","lat":"17.3364","lon":"77.9048"},"VKNG":{"code":"VKNG","name":"Vikasnagar","slug":"vikasnagar","lat":"30.475322","lon":"77.764275"},"VIVI":{"code":"VIVI","name":"Vikravandi","slug":"vikravandi","lat":"12.0372","lon":"79.5458"},"VILL":{"code":"VILL","name":"Villupuram","slug":"villupuram","lat":"11.9369","lon":"79.4873"},"VJMR":{"code":"VJMR","name":"Vinjamur","slug":"vinjamur","lat":"15.1167","lon":"79.4167"},"VNKD":{"code":"VNKD","name":"Vinukonda","slug":"vinukonda","lat":"16.0568","lon":"79.7453"},"VIRA":{"code":"VIRA","name":"Viralimalai","slug":"viralimalai","lat":"10.6037","lon":"78.5462"},"VIDM":{"code":"VIDM","name":"Virudhachalam","slug":"virudhachalam","lat":"11.5196","lon":"79.3252"},"VIRU":{"code":"VIRU","name":"Virudhunagar","slug":"virudhunagar","lat":"9.568","lon":"77.9624"},"VISN":{"code":"VISN","name":"Visnagar","slug":"visnagar","lat":"23.6977","lon":"72.5382"},"VSNP":{"code":"VSNP","name":"Vissannapeta","slug":"vissannapeta","lat":"16.9426","lon":"80.7796"},"VITA":{"code":"VITA","name":"Vita","slug":"vita","lat":"17.273096","lon":"74.538826"},"VTHC":{"code":"VTHC","name":"Vithlapur","slug":"vithlapur","lat":"23.3637","lon":"72.0542"},"VIZA":{"code":"VIZA","name":"Vizag (Visakhapatnam)","slug":"vizag-visakhapatnam","lat":"17.6868159","lon":"83.2184815"},"VIZI":{"code":"VIZI","name":"Vizianagaram","slug":"vizianagaram","lat":"18.107144","lon":"83.392975"},"VRIN":{"code":"VRIN","name":"Vrindavan","slug":"vrindavan","lat":"27.565","lon":"77.6593"},"VYUR":{"code":"VYUR","name":"Vuyyuru","slug":"vuyyuru","lat":"16.3675","lon":"80.8435"},"VYAR":{"code":"VYAR","name":"Vyara","slug":"vyara","lat":"21.1104","lon":"73.3861"},"WADA":{"code":"WADA","name":"Wadakkancherry","slug":"wadakkancherry","lat":"10.6617","lon":"76.2363"},"WAIP":{"code":"WAIP","name":"Wai","slug":"wai","lat":"17.9487","lon":"73.8919"},"WALU":{"code":"WALU","name":"Waluj","slug":"waluj","lat":"19.839911","lon":"75.236237"},"WANA":{"code":"WANA","name":"Wanaparthy","slug":"wanaparthy","lat":"16.362514","lon":"78.063183"},"WANI":{"code":"WANI","name":"Wani","slug":"wani","lat":"20.060804","lon":"78.957059"},"WAR":{"code":"WAR","name":"Warangal","slug":"warangal","lat":"18.000055","lon":"79.588167"},"WARD":{"code":"WARD","name":"Wardha","slug":"wardha","lat":"20.745257","lon":"78.600217"},"VDPT":{"code":"VDPT","name":"Wardhannapet","slug":"wardhannapet","lat":"17.773376","lon":"79.571875"},"WRRA":{"code":"WRRA","name":"Warora","slug":"warora","lat":"20.2407","lon":"79.0136"},"WARU":{"code":"WARU","name":"Warud","slug":"warud","lat":"21.41667","lon":"78.4"},"WASH":{"code":"WASH","name":"Washim","slug":"washim","lat":"20.139","lon":"77.1025"},"WAYA":{"code":"WAYA","name":"Wayanad","slug":"wayanad","lat":"11.6854","lon":"76.132"},"WELE":{"code":"WELE","name":"Wele","slug":"wele","lat":"17.9962","lon":"73.9929"},"WTKN":{"code":"WTKN","name":"West Kameng","slug":"west-kameng","lat":"27.3428","lon":"92.3024"},"WWAR":{"code":"WWAR","name":"Wyra","slug":"wyra","lat":"17.1938248","lon":"80.34712"},"YADG":{"code":"YADG","name":"Yadagirigutta","slug":"yadagirigutta","lat":"17.5892","lon":"78.9448"},"YAMU":{"code":"YAMU","name":"Yamunanagar","slug":"yamunanagar","lat":"30.129","lon":"77.2674"},"YANM":{"code":"YANM","name":"Yanam","slug":"yanam","lat":"16.7272","lon":"82.2176"},"MYAN":{"code":"MYAN","name":"Yangon","slug":"yangon","lat":"16.8661","lon":"96.1951"},"YAVA":{"code":"YAVA","name":"Yavatmal","slug":"yavatmal","lat":"20.117","lon":"78.1108"},"YLGA":{"code":"YLGA","name":"Yelagiri","slug":"yelagiri","lat":"12.5750448","lon":"78.6249018"},"YELB":{"code":"YELB","name":"Yelburga","slug":"yelburga","lat":"15.6142","lon":"76.0131"},"YELE":{"code":"YELE","name":"Yeleswaram","slug":"yeleswaram","lat":"17.2883","lon":"82.1064"},"YLMN":{"code":"YLMN","name":"Yellamanchili","slug":"yellamanchili","lat":"17.5497","lon":"82.8518"},"YRLL":{"code":"YRLL","name":"Yellandu","slug":"yellandu","lat":"17.5941","lon":"80.3224"},"YLLR":{"code":"YLLR","name":"Yellareddy","slug":"yellareddy","lat":"18.191229","lon":"78.023183"},"YLRD":{"code":"YLRD","name":"Yellareddypet","slug":"yellareddypet","lat":"18.3965","lon":"78.8186"},"YEMM":{"code":"YEMM","name":"Yemmiganur","slug":"yemmiganur","lat":"15.7600855","lon":"77.4654578"},"YEOL":{"code":"YEOL","name":"Yeola","slug":"yeola","lat":"20.0432","lon":"74.484"},"YERA":{"code":"YERA","name":"Yerragondapalem","slug":"yerragondapalem","lat":"16.0367","lon":"79.3071"},"YERR":{"code":"YERR","name":"Yerraguntla","slug":"yerraguntla","lat":"14.6394","lon":"78.5349"},"YEWE":{"code":"YEWE","name":"Yewat","slug":"yewat","lat":"18.478185","lon":"74.269946"},"YUKS":{"code":"YUKS","name":"Yuksom","slug":"yuksom","lat":"27.372462","lon":"88.222472"},"ZAGE":{"code":"ZAGE","name":"Zaheerabad","slug":"zaheerabad","lat":"17.6748","lon":"77.6164"},"ZARA":{"code":"ZARA","name":"Zarap","slug":"zarap","lat":"15.9474","lon":"73.7341"},"ZIRA":{"code":"ZIRA","name":"Zira","slug":"zira","lat":"30.9685","lon":"74.9881"},"ZIRO":{"code":"ZIRO","name":"Ziro","slug":"ziro","lat":"27.5448","lon":"93.8196"}};

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
  const allowedList = env.ALLOWED_CHAT_IDS ? env.ALLOWED_CHAT_IDS.split(",").map(s => s.trim()) : null;

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
  const cleanQ = q.replace(/[\s\-_]+/g, "");

  for (const [code, c] of Object.entries(BMS_ALL_REGIONS)) {
    const cname = c.name.toLowerCase();
    const cslug = c.slug.toLowerCase();
    const ccode = code.toLowerCase();
    const cleanName = cname.replace(/[\s\-_]+/g, "");
    const cleanSlug = cslug.replace(/[\s\-_]+/g, "");

    if (cname === q || cslug === q || ccode === q || cleanName === cleanQ || cleanSlug === cleanQ) {
      exactMatches.push(c);
    } else if (cname.includes(q) || q.includes(cname) || cslug.includes(q) || cleanName.includes(cleanQ)) {
      partialMatches.push(c);
    } else if (q.length >= 4) {
      const dist = Math.min(levenshteinDistance(q, cname), levenshteinDistance(cleanQ, cleanName));
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

  // 3. Search in all 2,076 BookMyShow cities index
  const cleanQ = q.replace(/[\s\-_]+/g, "");
  for (const [code, c] of Object.entries(BMS_ALL_REGIONS)) {
    if (!results.find(r => r.code === code)) {
      const cleanName = c.name.toLowerCase().replace(/[\s\-_]+/g, "");
      if (c.name.toLowerCase().includes(q) || code.toLowerCase() === q || c.slug.toLowerCase().includes(q) || cleanName.includes(cleanQ)) {
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
