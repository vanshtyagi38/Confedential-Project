export const countries = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "Brazil", "United Arab Emirates",
  "Singapore", "South Korea", "Italy", "Spain", "Netherlands",
  "Sweden", "Switzerland", "New Zealand", "South Africa", "Mexico",
];

export const statesByCountry: Record<string, string[]> = {
  India: [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal",
  ],
  "United States": [
    "California", "Texas", "Florida", "New York", "Illinois",
    "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Michigan",
    "New Jersey", "Virginia", "Washington", "Arizona", "Massachusetts",
    "Tennessee", "Indiana", "Missouri", "Maryland", "Colorado",
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland",
  ],
  Canada: [
    "Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba",
    "Saskatchewan", "Nova Scotia", "New Brunswick",
  ],
  Australia: [
    "New South Wales", "Victoria", "Queensland", "Western Australia",
    "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory",
  ],
  Germany: [
    "Bavaria", "Berlin", "Hamburg", "Hesse", "North Rhine-Westphalia",
    "Baden-Württemberg", "Lower Saxony", "Saxony",
  ],
  France: [
    "Île-de-France", "Provence-Alpes-Côte d'Azur", "Auvergne-Rhône-Alpes",
    "Occitanie", "Nouvelle-Aquitaine", "Brittany", "Normandy",
  ],
  Japan: [
    "Tokyo", "Osaka", "Hokkaido", "Kyoto", "Kanagawa",
    "Aichi", "Fukuoka", "Hyogo",
  ],
  Brazil: [
    "São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia",
    "Paraná", "Rio Grande do Sul", "Pernambuco", "Ceará",
  ],
  "United Arab Emirates": [
    "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah",
    "Fujairah", "Umm Al Quwain",
  ],
  Singapore: ["Singapore"],
  "South Korea": [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon",
    "Gwangju", "Gyeonggi",
  ],
  Italy: [
    "Lombardy", "Lazio", "Campania", "Sicily", "Veneto",
    "Piedmont", "Tuscany", "Emilia-Romagna",
  ],
  Spain: [
    "Madrid", "Catalonia", "Andalusia", "Valencia", "Galicia",
    "Basque Country", "Castile and León",
  ],
  Netherlands: [
    "North Holland", "South Holland", "Utrecht", "North Brabant",
    "Gelderland", "Overijssel",
  ],
  Sweden: [
    "Stockholm", "Västra Götaland", "Skåne", "Uppsala",
    "Östergötland", "Jönköping",
  ],
  Switzerland: [
    "Zurich", "Bern", "Geneva", "Basel", "Vaud", "Lucerne",
  ],
  "New Zealand": [
    "Auckland", "Wellington", "Canterbury", "Waikato", "Bay of Plenty",
  ],
  "South Africa": [
    "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
    "Free State", "Limpopo", "Mpumalanga", "North West",
  ],
  Mexico: [
    "Mexico City", "Jalisco", "Nuevo León", "Puebla",
    "Guanajuato", "Chihuahua", "Veracruz", "Quintana Roo",
  ],
};

export const citiesByState: Record<string, string[]> = {
  // India
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kurnool", "Rajahmundry"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Tawang"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Purnia", "Darbhanga"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Dwarka", "Rohini"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kannur"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Navi Mumbai"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur"],
  "Meghalaya": ["Shillong", "Tura", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
  "Sikkim": ["Gangtok", "Namchi", "Pelling"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Vellore"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Ghaziabad", "Agra", "Varanasi", "Kanpur", "Prayagraj", "Meerut", "Greater Noida"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Nainital", "Haldwani"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],

  // United States
  "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland"],
  "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"],
  "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale"],
  "New York": ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"],
  "Illinois": ["Chicago", "Aurora", "Naperville", "Rockford", "Springfield"],
  "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie"],
  "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"],
  "Georgia": ["Atlanta", "Augusta", "Savannah", "Athens"],
  "North Carolina": ["Charlotte", "Raleigh", "Durham", "Greensboro"],
  "Michigan": ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing"],
  "New Jersey": ["Newark", "Jersey City", "Princeton", "Trenton"],
  "Virginia": ["Virginia Beach", "Richmond", "Arlington", "Norfolk"],
  "Washington": ["Seattle", "Spokane", "Tacoma", "Bellevue"],
  "Arizona": ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Chandler"],
  "Massachusetts": ["Boston", "Cambridge", "Worcester", "Springfield"],
  "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  "Indiana": ["Indianapolis", "Fort Wayne", "Bloomington", "Evansville"],
  "Missouri": ["Kansas City", "St. Louis", "Springfield", "Columbia"],
  "Maryland": ["Baltimore", "Bethesda", "Rockville", "Annapolis"],
  "Colorado": ["Denver", "Colorado Springs", "Boulder", "Aurora", "Fort Collins"],

  // United Kingdom
  "England": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Bristol", "Oxford", "Cambridge"],
  "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness"],
  "Wales": ["Cardiff", "Swansea", "Newport", "Bangor"],
  "Northern Ireland": ["Belfast", "Derry", "Lisburn", "Newry"],

  // Canada
  "Ontario": ["Toronto", "Ottawa", "Mississauga", "Hamilton", "London", "Waterloo"],
  "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau"],
  "British Columbia": ["Vancouver", "Victoria", "Burnaby", "Surrey", "Kelowna"],
  "Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge"],
  "Manitoba": ["Winnipeg", "Brandon", "Steinbach"],
  "Saskatchewan": ["Saskatoon", "Regina", "Prince Albert"],
  "Nova Scotia": ["Halifax", "Dartmouth", "Sydney"],
  "New Brunswick": ["Fredericton", "Saint John", "Moncton"],

  // Australia
  "New South Wales": ["Sydney", "Newcastle", "Wollongong", "Central Coast"],
  "Victoria": ["Melbourne", "Geelong", "Ballarat", "Bendigo"],
  "Queensland": ["Brisbane", "Gold Coast", "Sunshine Coast", "Cairns", "Townsville"],
  "Western Australia": ["Perth", "Fremantle", "Bunbury", "Mandurah"],
  "South Australia": ["Adelaide", "Mount Gambier", "Whyalla"],
  "Tasmania": ["Hobart", "Launceston", "Devonport"],
  "Australian Capital Territory": ["Canberra"],
  "Northern Territory": ["Darwin", "Alice Springs"],

  // Germany
  "Bavaria": ["Munich", "Nuremberg", "Augsburg", "Regensburg"],
  "Berlin": ["Berlin"],
  "Hamburg": ["Hamburg"],
  "Hesse": ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt"],
  "North Rhine-Westphalia": ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Bonn"],
  "Baden-Württemberg": ["Stuttgart", "Mannheim", "Karlsruhe", "Freiburg", "Heidelberg"],
  "Lower Saxony": ["Hanover", "Braunschweig", "Oldenburg", "Göttingen"],
  "Saxony": ["Dresden", "Leipzig", "Chemnitz"],

  // France
  "Île-de-France": ["Paris", "Versailles", "Boulogne-Billancourt", "Saint-Denis"],
  "Provence-Alpes-Côte d'Azur": ["Marseille", "Nice", "Toulon", "Aix-en-Provence"],
  "Auvergne-Rhône-Alpes": ["Lyon", "Grenoble", "Saint-Étienne", "Clermont-Ferrand"],
  "Occitanie": ["Toulouse", "Montpellier", "Nîmes", "Perpignan"],
  "Nouvelle-Aquitaine": ["Bordeaux", "Limoges", "Poitiers", "La Rochelle"],
  "Brittany": ["Rennes", "Brest", "Quimper", "Saint-Malo"],
  "Normandy": ["Rouen", "Caen", "Le Havre"],

  // Japan
  "Tokyo": ["Tokyo", "Shibuya", "Shinjuku", "Akihabara", "Ginza"],
  "Osaka": ["Osaka", "Sakai", "Toyonaka"],
  "Hokkaido": ["Sapporo", "Hakodate", "Asahikawa"],
  "Kyoto": ["Kyoto", "Uji", "Kameoka"],
  "Kanagawa": ["Yokohama", "Kawasaki", "Kamakura"],
  "Aichi": ["Nagoya", "Toyota", "Okazaki"],
  "Fukuoka": ["Fukuoka", "Kitakyushu", "Kurume"],
  "Hyogo": ["Kobe", "Himeji", "Nishinomiya"],

  // Brazil
  "São Paulo": ["São Paulo", "Campinas", "Santos", "Guarulhos"],
  "Rio de Janeiro": ["Rio de Janeiro", "Niterói", "Petrópolis"],
  "Minas Gerais": ["Belo Horizonte", "Uberlândia", "Juiz de Fora"],
  "Bahia": ["Salvador", "Feira de Santana", "Vitória da Conquista"],
  "Paraná": ["Curitiba", "Londrina", "Maringá"],
  "Rio Grande do Sul": ["Porto Alegre", "Caxias do Sul", "Pelotas"],
  "Pernambuco": ["Recife", "Olinda", "Caruaru"],
  "Ceará": ["Fortaleza", "Juazeiro do Norte", "Sobral"],

  // UAE
  "Dubai": ["Dubai", "Deira", "Jumeirah", "Dubai Marina"],
  "Abu Dhabi": ["Abu Dhabi", "Al Ain", "Khalifa City"],
  "Sharjah": ["Sharjah"],
  "Ajman": ["Ajman"],
  "Ras Al Khaimah": ["Ras Al Khaimah"],
  "Fujairah": ["Fujairah"],
  "Umm Al Quwain": ["Umm Al Quwain"],

  // Singapore
  "Singapore": ["Singapore"],

  // South Korea
  "Seoul": ["Seoul", "Gangnam", "Mapo", "Jongno"],
  "Busan": ["Busan", "Haeundae"],
  "Incheon": ["Incheon", "Songdo"],
  "Daegu": ["Daegu"],
  "Daejeon": ["Daejeon"],
  "Gwangju": ["Gwangju"],
  "Gyeonggi": ["Suwon", "Seongnam", "Goyang", "Yongin"],

  // Italy
  "Lombardy": ["Milan", "Bergamo", "Brescia", "Como"],
  "Lazio": ["Rome", "Latina", "Viterbo"],
  "Campania": ["Naples", "Salerno", "Caserta"],
  "Sicily": ["Palermo", "Catania", "Messina"],
  "Veneto": ["Venice", "Verona", "Padua"],
  "Piedmont": ["Turin", "Novara", "Alessandria"],
  "Tuscany": ["Florence", "Pisa", "Siena", "Livorno"],
  "Emilia-Romagna": ["Bologna", "Parma", "Modena", "Rimini"],

  // Spain
  "Madrid": ["Madrid", "Alcalá de Henares", "Getafe"],
  "Catalonia": ["Barcelona", "Girona", "Tarragona", "Lleida"],
  "Andalusia": ["Seville", "Málaga", "Granada", "Córdoba"],
  "Valencia": ["Valencia", "Alicante", "Castellón"],
  "Galicia": ["Santiago de Compostela", "Vigo", "A Coruña"],
  "Basque Country": ["Bilbao", "San Sebastián", "Vitoria-Gasteiz"],
  "Castile and León": ["Valladolid", "Salamanca", "León", "Burgos"],

  // Netherlands
  "North Holland": ["Amsterdam", "Haarlem", "Hilversum"],
  "South Holland": ["Rotterdam", "The Hague", "Leiden", "Delft"],
  "Utrecht": ["Utrecht", "Amersfoort"],
  "North Brabant": ["Eindhoven", "Tilburg", "Breda"],
  "Gelderland": ["Arnhem", "Nijmegen", "Apeldoorn"],
  "Overijssel": ["Enschede", "Zwolle", "Deventer"],

  // Sweden
  "Stockholm": ["Stockholm", "Solna", "Sundbyberg"],
  "Västra Götaland": ["Gothenburg", "Borås", "Trollhättan"],
  "Skåne": ["Malmö", "Helsingborg", "Lund"],
  "Uppsala": ["Uppsala"],
  "Östergötland": ["Linköping", "Norrköping"],
  "Jönköping": ["Jönköping"],

  // Switzerland
  "Zurich": ["Zurich", "Winterthur"],
  "Bern": ["Bern", "Thun", "Biel"],
  "Geneva": ["Geneva", "Carouge"],
  "Basel": ["Basel"],
  "Vaud": ["Lausanne", "Montreux"],
  "Lucerne": ["Lucerne"],

  // New Zealand
  "Auckland": ["Auckland", "Manukau", "North Shore"],
  "Wellington": ["Wellington", "Lower Hutt", "Porirua"],
  "Canterbury": ["Christchurch", "Timaru"],
  "Waikato": ["Hamilton", "Tauranga"],
  "Bay of Plenty": ["Tauranga", "Rotorua", "Whakatane"],

  // South Africa
  "Gauteng": ["Johannesburg", "Pretoria", "Soweto", "Sandton"],
  "Western Cape": ["Cape Town", "Stellenbosch", "Paarl"],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Richards Bay"],
  "Eastern Cape": ["Port Elizabeth", "East London", "Mthatha"],
  "Free State": ["Bloemfontein", "Welkom"],
  "Limpopo": ["Polokwane", "Thohoyandou"],
  "Mpumalanga": ["Nelspruit", "Witbank"],
  "North West": ["Rustenburg", "Mahikeng", "Potchefstroom"],

  // Mexico
  "Mexico City": ["Mexico City", "Coyoacán", "Tlalpan"],
  "Jalisco": ["Guadalajara", "Zapopan", "Tlaquepaque", "Puerto Vallarta"],
  "Nuevo León": ["Monterrey", "San Pedro Garza García", "San Nicolás"],
  "Puebla": ["Puebla", "Tehuacán", "Atlixco"],
  "Guanajuato": ["León", "Guanajuato", "Irapuato", "Celaya"],
  "Chihuahua": ["Chihuahua", "Ciudad Juárez", "Delicias"],
  "Veracruz": ["Veracruz", "Xalapa", "Coatzacoalcos"],
  "Quintana Roo": ["Cancún", "Playa del Carmen", "Tulum", "Chetumal"],
};
