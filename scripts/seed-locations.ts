import { PrismaClient, LocationType } from "@prisma/client";

const prisma = new PrismaClient();
type S = { name: string; cities: string[] };

async function upsert(data: { name: string; code: string; type: LocationType; parentId?: string }) {
  const loc = await prisma.location.upsert({ where: { code: data.code }, update: { name: data.name }, create: data });
  return loc.id;
}

async function seedCountry(code: string, name: string, states: Record<string, S>) {
  const countryId = await upsert({ name, code, type: LocationType.COUNTRY });
  for (const [sc, s] of Object.entries(states)) {
    const stateId = await upsert({ name: s.name, code: `${code}-${sc}`, type: LocationType.STATE, parentId: countryId });
    await prisma.location.createMany({
      data: s.cities.map((city) => ({
        name: city,
        code: `${code}-${sc}-${city.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "")}`,
        type: LocationType.CITY, parentId: stateId, isActive: true, isVerified: true,
      })),
      skipDuplicates: true,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _seedUK() {
  console.log("Seeding United Kingdom...");
  const countryId = await upsert({ name: "United Kingdom", code: "GB", type: LocationType.COUNTRY });
  const data: Record<string, Array<{ name: string; cities: string[] }>> = {
    England: [
      { name: "Greater London", cities: ["London", "Westminster", "Camden", "Greenwich"] },
      { name: "Manchester", cities: ["Manchester", "Salford", "Bolton", "Oldham"] },
      { name: "West Midlands", cities: ["Birmingham", "Coventry", "Wolverhampton"] },
      { name: "Lancashire", cities: ["Liverpool", "Preston", "Blackpool"] },
      { name: "Yorkshire", cities: ["Leeds", "Sheffield", "Bradford", "York"] },
      { name: "Kent", cities: ["Canterbury", "Maidstone", "Chatham"] },
      { name: "Hampshire", cities: ["Southampton", "Portsmouth", "Winchester"] },
      { name: "Devon", cities: ["Exeter", "Plymouth", "Torquay"] },
      { name: "Essex", cities: ["Chelmsford", "Colchester", "Southend"] },
      { name: "Sussex", cities: ["Brighton", "Eastbourne", "Hastings"] },
      { name: "Cambridgeshire", cities: ["Cambridge", "Peterborough", "Ely"] },
      { name: "Somerset", cities: ["Bath", "Taunton", "Bridgwater"] },
      { name: "Oxfordshire", cities: ["Oxford", "Abingdon"] },
      { name: "Norfolk", cities: ["Norwich", "Great Yarmouth"] },
      { name: "Staffordshire", cities: ["Stoke-on-Trent", "Stafford"] },
      { name: "Leicestershire", cities: ["Leicester", "Loughborough"] },
      { name: "Dorset", cities: ["Bournemouth", "Weymouth"] },
      { name: "Cornwall", cities: ["Truro", "Falmouth"] },
      { name: "Northumberland", cities: ["Newcastle", "Alnwick"] },
      { name: "Surrey", cities: ["Guildford", "Croydon"] },
    ],
    Scotland: [
      { name: "Central Belt", cities: ["Glasgow", "Edinburgh", "Falkirk"] },
      { name: "Aberdeenshire", cities: ["Aberdeen", "Peterhead"] },
      { name: "Highland", cities: ["Inverness", "Dingwall"] },
      { name: "Fife", cities: ["Dunfermline", "Kirkcaldy"] },
      { name: "Perth and Kinross", cities: ["Perth", "Crieff"] },
      { name: "Stirling", cities: ["Stirling"] },
    ],
    Wales: [
      { name: "South Wales", cities: ["Cardiff", "Swansea", "Newport"] },
      { name: "North Wales", cities: ["Bangor", "Wrexham", "Rhyl"] },
      { name: "Gwynedd", cities: ["Caernarfon", "Pwllheli"] },
      { name: "Powys", cities: ["Hay-on-Wye", "Builth Wells"] },
    ],
    "Northern Ireland": [
      { name: "Belfast", cities: ["Belfast", "Holywood"] },
      { name: "Derry", cities: ["Derry", "Coleraine"] },
      { name: "Armagh", cities: ["Armagh", "Newry"] },
    ],
  };
  let count = 0;
  for (const [region, counties] of Object.entries(data)) {
    const rid = await upsert({ name: region, code: `GB-${region.substring(0, 3).toUpperCase()}`, type: LocationType.STATE, parentId: countryId });
    count++;
    for (const c of counties) {
      const cid = await upsert({ name: c.name, code: `GB-${c.name.substring(0, 3).toUpperCase().replace(/ /g, "")}`, type: LocationType.DISTRICT, parentId: rid });
      await prisma.location.createMany({
        data: c.cities.map((city) => ({ name: city, code: `GB-${city.substring(0, 3).toUpperCase().replace(/ /g, "")}`, type: LocationType.CITY, parentId: cid, isActive: true, isVerified: true })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`  UK: ${count} constituent countries seeded`);
}

async function main() {
  console.log("=== Starting Location Seeder ===");
  const start = Date.now();

  await seedCountry("IN", "India", {
    MH: { name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Solapur"] },
    KA: { name: "Karnataka", cities: ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi"] },
    TN: { name: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"] },
    DL: { name: "Delhi", cities: ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"] },
    GJ: { name: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"] },
    TS: { name: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"] },
    AP: { name: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore"] },
    RJ: { name: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"] },
    WB: { name: "West Bengal", cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"] },
    KL: { name: "Kerala", cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"] },
    MP: { name: "Madhya Pradesh", cities: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"] },
    BR: { name: "Bihar", cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"] },
    UP: { name: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida", "Ghaziabad", "Meerut"] },
    PB: { name: "Punjab", cities: ["Chandigarh", "Amritsar", "Ludhiana", "Jalandhar", "Patiala"] },
    HR: { name: "Haryana", cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar"] },
    OR: { name: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"] },
    CG: { name: "Chhattisgarh", cities: ["Raipur", "Bhilai", "Bilaspur", "Korba"] },
    JK: { name: "Jammu and Kashmir", cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla"] },
    AS: { name: "Assam", cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"] },
    JH: { name: "Jharkhand", cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"] },
    UT: { name: "Uttarakhand", cities: ["Dehradun", "Haridwar", "Nainital", "Rishikesh"] },
    HP: { name: "Himachal Pradesh", cities: ["Shimla", "Dharamshala", "Mandi", "Solan"] },
    GA: { name: "Goa", cities: ["Panaji", "Margao", "Vasco da Gama"] },
    // UTs
    LD: { name: "Lakshadweep", cities: ["Kavaratti", "Agatti"] },
    AN: { name: "Andaman and Nicobar", cities: ["Port Blair", "Havelock"] },
    CH: { name: "Chandigarh", cities: ["Chandigarh"] },
    PY: { name: "Puducherry", cities: ["Puducherry", "Karaikal"] },
    DN: { name: "Dadra and Nagar Haveli", cities: ["Silvassa", "Dadra"] },
    DD: { name: "Daman and Diu", cities: ["Daman", "Diu"] },
  });

  await seedCountry("US", "United States", {
    CA: { name: "California", cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland"] },
    NY: { name: "New York", cities: ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"] },
    TX: { name: "Texas", cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"] },
    FL: { name: "Florida", cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale"] },
    WA: { name: "Washington", cities: ["Seattle", "Tacoma", "Spokane", "Bellevue"] },
    IL: { name: "Illinois", cities: ["Chicago", "Springfield", "Naperville", "Rockford"] },
    PA: { name: "Pennsylvania", cities: ["Philadelphia", "Pittsburgh", "Harrisburg", "Allentown"] },
    OH: { name: "Ohio", cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Dayton"] },
    GA: { name: "Georgia", cities: ["Atlanta", "Savannah", "Augusta", "Macon"] },
    NC: { name: "North Carolina", cities: ["Charlotte", "Raleigh", "Durham", "Winston-Salem"] },
    MI: { name: "Michigan", cities: ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing"] },
    NJ: { name: "New Jersey", cities: ["Newark", "Jersey City", "Trenton", "Princeton"] },
    VA: { name: "Virginia", cities: ["Richmond", "Virginia Beach", "Norfolk", "Arlington"] },
    CO: { name: "Colorado", cities: ["Denver", "Boulder", "Colorado Springs", "Aurora"] },
    MA: { name: "Massachusetts", cities: ["Boston", "Cambridge", "Worcester", "Springfield"] },
    AZ: { name: "Arizona", cities: ["Phoenix", "Scottsdale", "Tucson", "Mesa"] },
    MN: { name: "Minnesota", cities: ["Minneapolis", "Saint Paul", "Rochester"] },
    WI: { name: "Wisconsin", cities: ["Milwaukee", "Madison", "Green Bay"] },
    MO: { name: "Missouri", cities: ["Kansas City", "St. Louis", "Springfield", "Columbia"] },
    MD: { name: "Maryland", cities: ["Baltimore", "Annapolis", "Bethesda"] },
    IN: { name: "Indiana", cities: ["Indianapolis", "Fort Wayne", "Bloomington"] },
    NV: { name: "Nevada", cities: ["Las Vegas", "Reno", "Henderson"] },
    OR: { name: "Oregon", cities: ["Portland", "Salem", "Eugene"] },
    TN: { name: "Tennessee", cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga"] },
    UT: { name: "Utah", cities: ["Salt Lake City", "Provo", "Ogden"] },
    NM: { name: "New Mexico", cities: ["Albuquerque", "Santa Fe", "Las Cruces"] },
    CT: { name: "Connecticut", cities: ["Hartford", "New Haven", "Bridgeport"] },
    KS: { name: "Kansas", cities: ["Wichita", "Kansas City", "Topeka"] },
    HI: { name: "Hawaii", cities: ["Honolulu", "Hilo", "Maui"] },
    AK: { name: "Alaska", cities: ["Anchorage", "Fairbanks", "Juneau"] },
    KY: { name: "Kentucky", cities: ["Louisville", "Lexington", "Bowling Green"] },
    LA: { name: "Louisiana", cities: ["New Orleans", "Baton Rouge", "Shreveport"] },
    ME: { name: "Maine", cities: ["Portland", "Bangor", "Augusta"] },
    RI: { name: "Rhode Island", cities: ["Providence", "Newport"] },
    SC: { name: "South Carolina", cities: ["Charleston", "Columbia", "Myrtle Beach"] },
    DE: { name: "Delaware", cities: ["Wilmington", "Dover"] },
    DC: { name: "District of Columbia", cities: ["Washington DC"] },
    MS: { name: "Mississippi", cities: ["Jackson", "Biloxi", "Oxford"] },
    AR: { name: "Arkansas", cities: ["Little Rock", "Fayetteville"] },
    AL: { name: "Alabama", cities: ["Birmingham", "Montgomery", "Huntsville"] },
    IA: { name: "Iowa", cities: ["Des Moines", "Cedar Rapids", "Davenport"] },
    NE: { name: "Nebraska", cities: ["Omaha", "Lincoln"] },
    NH: { name: "New Hampshire", cities: ["Manchester", "Nashua", "Concord"] },
    VT: { name: "Vermont", cities: ["Burlington", "Montpelier"] },
    ND: { name: "North Dakota", cities: ["Fargo", "Bismarck"] },
    SD: { name: "South Dakota", cities: ["Sioux Falls", "Rapid City"] },
    WY: { name: "Wyoming", cities: ["Cheyenne", "Casper", "Jackson"] },
    MT: { name: "Montana", cities: ["Billings", "Missoula", "Bozeman"] },
    WV: { name: "West Virginia", cities: ["Charleston", "Huntington"] },
    ID: { name: "Idaho", cities: ["Boise", "Idaho Falls", "Pocatello"] },
  });

  await seedCountry("GB", "United Kingdom", {
    ENG: { name: "England", cities: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Bristol"] },
    SCT: { name: "Scotland", cities: ["Glasgow", "Edinburgh", "Aberdeen", "Dundee"] },
    WAL: { name: "Wales", cities: ["Cardiff", "Swansea", "Newport", "Bangor"] },
    NIR: { name: "Northern Ireland", cities: ["Belfast", "Derry", "Armagh", "Lisburn"] },
  });

  await seedCountry("DE", "Germany", {
    BW: { name: "Baden-Württemberg", cities: ["Stuttgart", "Karlsruhe", "Heidelberg", "Freiburg"] },
    BY: { name: "Bayern", cities: ["Munich", "Nuremberg", "Augsburg", "Regensburg"] },
    BE: { name: "Berlin", cities: ["Berlin"] },
    HE: { name: "Hessen", cities: ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt"] },
    NW: { name: "Nordrhein-Westfalen", cities: ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Bonn"] },
    NI: { name: "Niedersachsen", cities: ["Hanover", "Braunschweig", "Osnabrück"] },
    SN: { name: "Sachsen", cities: ["Dresden", "Leipzig", "Chemnitz"] },
    HH: { name: "Hamburg", cities: ["Hamburg"] },
    RP: { name: "Rheinland-Pfalz", cities: ["Mainz", "Koblenz", "Trier"] },
    SH: { name: "Schleswig-Holstein", cities: ["Kiel", "Lübeck"] },
  });

  await seedCountry("FR", "France", {
    IDF: { name: "Île-de-France", cities: ["Paris", "Versailles", "Saint-Denis"] },
    ARV: { name: "Auvergne-Rhône-Alpes", cities: ["Lyon", "Grenoble", "Saint-Étienne"] },
    PACA: { name: "Provence-Alpes-Côte d'Azur", cities: ["Marseille", "Nice", "Toulon", "Cannes"] },
    NOF: { name: "Nouvelle-Aquitaine", cities: ["Bordeaux", "Biarritz", "Limoges"] },
    OF: { name: "Occitanie", cities: ["Toulouse", "Montpellier", "Nîmes"] },
    HDF: { name: "Hauts-de-France", cities: ["Lille", "Amiens", "Dunkirk"] },
    BRF: { name: "Bretagne", cities: ["Rennes", "Brest", "Saint-Malo"] },
    GCF: { name: "Grand Est", cities: ["Strasbourg", "Reims", "Nancy"] },
    PDL: { name: "Pays de la Loire", cities: ["Nantes", "Le Mans", "Angers"] },
  });

  await seedCountry("IT", "Italy", {
    LAT: { name: "Lazio", cities: ["Rome", "Rieti", "Viterbo"] },
    LOM: { name: "Lombardia", cities: ["Milan", "Bergamo", "Brescia", "Como"] },
    VEN: { name: "Veneto", cities: ["Venice", "Verona", "Padua", "Treviso"] },
    CAM: { name: "Campania", cities: ["Naples", "Salerno", "Avellino"] },
    SIE: { name: "Sicilia", cities: ["Palermo", "Catania", "Messina"] },
    PIE: { name: "Piemonte", cities: ["Turin", "Novara", "Alessandria"] },
    TOS: { name: "Toscana", cities: ["Florence", "Siena", "Pisa", "Lucca"] },
    EMI: { name: "Emilia-Romagna", cities: ["Bologna", "Parma", "Modena", "Rimini"] },
    PUG: { name: "Puglia", cities: ["Bari", "Lecce", "Taranto"] },
    LIG: { name: "Liguria", cities: ["Genoa", "La Spezia", "Sanremo"] },
  });

  await seedCountry("ES", "Spain", {
    MCM: { name: "Comunidad de Madrid", cities: ["Madrid", "Alcalá de Henares", "Getafe"] },
    CAT: { name: "Cataluña", cities: ["Barcelona", "Girona", "Tarragona", "Lleida"] },
    AND: { name: "Andalucía", cities: ["Seville", "Malaga", "Cordoba", "Granada"] },
    VAS: { name: "País Vasco", cities: ["Bilbao", "San Sebastián", "Vitoria"] },
    GAL: { name: "Galicia", cities: ["Santiago de Compostela", "Vigo", "A Coruña"] },
    VAL: { name: "Comunidad Valenciana", cities: ["Valencia", "Alicante", "Castellón"] },
    CAN: { name: "Canarias", cities: ["Las Palmas", "Santa Cruz de Tenerife"] },
    BAL: { name: "Islas Baleares", cities: ["Palma de Mallorca", "Ibiza"] },
  });

  await seedCountry("NL", "Netherlands", {
    NH: { name: "Noord-Holland", cities: ["Amsterdam", "Haarlem", "Alkmaar"] },
    ZH: { name: "Zuid-Holland", cities: ["Rotterdam", "The Hague", "Delft", "Leiden"] },
    UT: { name: "Utrecht", cities: ["Utrecht", "Amersfoort"] },
    NB: { name: "Noord-Brabant", cities: ["Eindhoven", "Tilburg", "Breda"] },
    GE: { name: "Gelderland", cities: ["Nijmegen", "Arnhem", "Ede"] },
    OV: { name: "Overijssel", cities: ["Enschede", "Deventer", "Zwolle"] },
    GR: { name: "Groningen", cities: ["Groningen", "Delfzijl"] },
    LI: { name: "Limburg", cities: ["Maastricht", "Roermond", "Venlo"] },
  });

  await seedCountry("AU", "Australia", {
    NSW: { name: "New South Wales", cities: ["Sydney", "Newcastle", "Wollongong", "Albury"] },
    VIC: { name: "Victoria", cities: ["Melbourne", "Geelong", "Ballarat", "Bendigo"] },
    QLD: { name: "Queensland", cities: ["Brisbane", "Gold Coast", "Cairns", "Townsville"] },
    WA: { name: "Western Australia", cities: ["Perth", "Fremantle", "Bunbury", "Albany"] },
    SA: { name: "South Australia", cities: ["Adelaide", "Mount Gambier", "Murray Bridge"] },
    TAS: { name: "Tasmania", cities: ["Hobart", "Launceston", "Devonport"] },
    ACT: { name: "Australian Capital Territory", cities: ["Canberra"] },
    NT: { name: "Northern Territory", cities: ["Darwin", "Alice Springs", "Katherine"] },
  });

  const elapsed = Date.now() - start;
  const total = await prisma.location.count();
  console.log(`\nDone in ${elapsed}ms. Total locations in database: ${total}`);
}

main()
  .catch((e) => { console.error("Seeder failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
