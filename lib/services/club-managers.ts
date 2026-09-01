/**
 * Danh sách Huấn luyện viên trưởng (Head Coach / Manager) được cập nhật mới nhất
 * chuẩn xác theo dữ liệu Google / Wikipedia cho mùa giải 2026-2027.
 */

export const CLUB_MANAGERS: Record<string, string> = {
  // ==========================================
  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 PREMIER LEAGUE & ENGLAND
  // ==========================================
  "Manchester United": "Michael Carrick",
  "Man United": "Michael Carrick",
  "Liverpool": "Andoni Iraola",
  "Arsenal": "Mikel Arteta",
  "Chelsea": "Xabi Alonso",
  "Tottenham Hotspur": "Roberto De Zerbi",
  "Tottenham": "Roberto De Zerbi",
  "Manchester City": "Enzo Maresca",
  "Man City": "Enzo Maresca",
  "Aston Villa": "Unai Emery",
  "Everton": "David Moyes",
  "Newcastle United": "Matthias Jaissle",
  "Newcastle": "Matthias Jaissle",
  "Brighton & Hove Albion": "Fabian Hürzeler",
  "Brighton": "Fabian Hürzeler",
  "Nottingham Forest": "Oliver Glasner",
  "Ipswich Town": "Gary O'Neil",
  "Ipswich": "Gary O'Neil",
  "AFC Bournemouth": "Marco Rose",
  "Bournemouth": "Marco Rose",
  "Brentford": "Keith Andrews",
  "Crystal Palace": "Oliver Glasner",
  "Fulham": "Marco Silva",
  "West Ham United": "Graham Potter",
  "West Ham": "Graham Potter",
  "Wolverhampton Wanderers": "Vítor Pereira",
  "Wolves": "Vítor Pereira",
  "Leicester City": "Ruud van Nistelrooy",
  "Southampton": "Russell Martin",
  "Leeds United": "Daniel Farke",
  "Burnley": "Scott Parker",
  "Sheffield United": "Chris Wilder",
  "Sunderland": "Régis Le Bris",
  "Coventry City": "Frank Lampard",
  "Middlesbrough": "Michael Carrick",
  "Hull City": "Tim Walter",
  "West Bromwich Albion": "Carlos Corberán",
  "West Brom": "Carlos Corberán",
  "Norwich City": "Johannes Hoff Thorup",
  "Watford": "Tom Cleverley",

  // ==========================================
  // 🇪🇸 LA LIGA & SPAIN
  // ==========================================
  "Real Madrid": "José Mourinho",
  "Barcelona": "Hansi Flick",
  "Atlético Madrid": "Diego Simeone",
  "Atletico Madrid": "Diego Simeone",
  "Athletic Club": "Ernesto Valverde",
  "Athletic Bilbao": "Ernesto Valverde",
  "Villarreal": "Marcelino",
  "Real Sociedad": "Imanol Alguacil",
  "Real Betis": "Manuel Pellegrini",
  "Girona": "Míchel",
  "Celta Vigo": "Claudio Giráldez",
  "Celta de Vigo": "Claudio Giráldez",
  "Mallorca": "Jagoba Arrasate",
  "Rayo Vallecano": "Iñigo Pérez",
  "Osasuna": "Vicente Moreno",
  "Sevilla": "García Pimienta",
  "Alavés": "Luis García",
  "Deportivo Alavés": "Luis García",
  "Leganés": "Borja Jiménez",
  "Getafe": "José Bordalás",
  "Espanyol": "Manolo González",
  "Las Palmas": "Diego Martínez",
  "Valencia": "Rubén Baraja",
  "Real Valladolid": "Paulo Pezzolano",

  // ==========================================
  // 🇮🇹 SERIE A & ITALY
  // ==========================================
  "Juventus": "Luciano Spalletti",
  "Internazionale": "Cristian Chivu",
  "Inter Milan": "Cristian Chivu",
  "Inter": "Cristian Chivu",
  "Napoli": "Antonio Conte",
  "Atalanta": "Gian Piero Gasperini",
  "Fiorentina": "Raffaele Palladino",
  "Lazio": "Marco Baroni",
  "Milan": "Paulo Fonseca",
  "AC Milan": "Paulo Fonseca",
  "Bologna": "Vincenzo Italiano",
  "Udinese": "Kosta Runjaic",
  "Empoli": "Roberto D'Aversa",
  "Torino": "Paolo Vanoli",
  "Roma": "Claudio Ranieri",
  "AS Roma": "Claudio Ranieri",
  "Parma": "Fabio Pecchia",
  "Verona": "Paolo Zanetti",
  "Hellas Verona": "Paolo Zanetti",
  "Como": "Cesc Fàbregas",
  "Cagliari": "Davide Nicola",
  "Genoa": "Patrick Vieira",
  "Lecce": "Marco Giampaolo",
  "Monza": "Alessandro Nesta",
  "Venezia": "Eusebio Di Francesco",
  "Sassuolo": "Fabio Grosso",

  // ==========================================
  // 🇩🇪 BUNDESLIGA & GERMANY
  // ==========================================
  "Bayern Munich": "Vincent Kompany",
  "Bayern München": "Vincent Kompany",
  "Bayer Leverkusen": "Sebastian Hoeneß",
  "Eintracht Frankfurt": "Dino Toppmöller",
  "RB Leipzig": "Marco Rose",
  "Leipzig": "Marco Rose",
  "SC Freiburg": "Julian Schuster",
  "Freiburg": "Julian Schuster",
  "Borussia Dortmund": "Nuri Şahin",
  "Dortmund": "Nuri Şahin",
  "VfB Stuttgart": "Sebastian Hoeneß",
  "Stuttgart": "Sebastian Hoeneß",
  "1. FSV Mainz 05": "Bo Henriksen",
  "Mainz 05": "Bo Henriksen",
  "Mainz": "Bo Henriksen",
  "Borussia Mönchengladbach": "Gerardo Seoane",
  "Gladbach": "Gerardo Seoane",
  "1. FC Union Berlin": "Bo Svensson",
  "Union Berlin": "Bo Svensson",
  "Werder Bremen": "Ole Werner",
  "Bremen": "Ole Werner",
  "FC Augsburg": "Jess Thorup",
  "Augsburg": "Jess Thorup",
  "VfL Wolfsburg": "Ralph Hasenhüttl",
  "Wolfsburg": "Ralph Hasenhüttl",
  "1. FC Heidenheim": "Frank Schmidt",
  "Heidenheim": "Frank Schmidt",
  "TSG Hoffenheim": "Christian Ilzer",
  "Hoffenheim": "Christian Ilzer",
  "FC St. Pauli": "Alexander Blessin",
  "St. Pauli": "Alexander Blessin",
  "Holstein Kiel": "Marcel Rapp",
  "VfL Bochum": "Dieter Hecking",
  "Bochum": "Dieter Hecking",
  "Schalke 04": "Kees van Wonderen",

  // ==========================================
  // 🇫🇷 LIGUE 1 & FRANCE
  // ==========================================
  "Paris Saint-Germain": "Luis Enrique",
  "PSG": "Luis Enrique",
  "AS Monaco": "Adi Hütter",
  "Monaco": "Adi Hütter",
  "Marseille": "Roberto De Zerbi",
  "Olympique de Marseille": "Roberto De Zerbi",
  "Lille": "Bruno Génésio",
  "LOSC Lille": "Bruno Génésio",
  "Lyon": "Pierre Sage",
  "Olympique Lyonnais": "Pierre Sage",
  "Nice": "Franck Haise",
  "OGC Nice": "Franck Haise",
  "Lens": "Will Still",
  "RC Lens": "Will Still",
  "Auxerre": "Christophe Pélissier",
  "AJ Auxerre": "Christophe Pélissier",
  "Toulouse": "Carles Martínez Novell",
  "Strasbourg": "Liam Rosenior",
  "RC Strasbourg": "Liam Rosenior",
  "Brest": "Éric Roy",
  "Stade Brestois": "Éric Roy",
  "Stade de Reims": "Luka Elsner",
  "Reims": "Luka Elsner",
  "Stade Rennais": "Jorge Sampaoli",
  "Rennes": "Jorge Sampaoli",
  "Nantes": "Antoine Kombouaré",
  "FC Nantes": "Antoine Kombouaré",
  "Angers": "Alexandre Dujeux",
  "Angers SCO": "Alexandre Dujeux",
  "Saint-Étienne": "Olivier Dall'Oglio",
  "AS Saint-Étienne": "Olivier Dall'Oglio",
  "Le Havre": "Didier Digard",
  "Montpellier": "Jean-Louis Gasset",

  // ==========================================
  // 🌍 OTHER TOP EUROPEAN & UCL CLUBS
  // ==========================================
  "Sporting CP": "João Pereira",
  "Sporting": "João Pereira",
  "Benfica": "Bruno Lage",
  "SL Benfica": "Bruno Lage",
  "Porto": "Vítor Bruno",
  "FC Porto": "Vítor Bruno",
  "Braga": "Carlos Carvalhal",
  "Feyenoord": "Brian Priske",
  "PSV Eindhoven": "Peter Bosz",
  "PSV": "Peter Bosz",
  "Ajax": "Francesco Farioli",
  "AZ Alkmaar": "Maarten Martens",
  "Celtic": "Brendan Rodgers",
  "Rangers": "Philippe Clement",
  "Galatasaray": "Okan Buruk",
  "Fenerbahce": "José Mourinho",
  "Fenerbahçe": "José Mourinho",
  "Besiktas": "Giovanni van Bronckhorst",
  "Beşiktaş": "Giovanni van Bronckhorst",
  "Club Brugge": "Nicky Hayen",
  "Anderlecht": "David Hubert",
  "Union St.-Gilloise": "Sébastien Pocognoli",
  "Gent": "Wouter Vrancken",
  "Red Bull Salzburg": "Pepijn Lijnders",
  "Salzburg": "Pepijn Lijnders",
  "Sturm Graz": "Christian Ilzer",
  "Young Boys": "Joël Magnin",
  "FC Basel": "Fabio Celestini",
  "Shakhtar Donetsk": "Marino Pušić",
  "Dynamo Kyiv": "Oleksandr Shovkovskyi",
  "Slavia Prague": "Jindřich Trpišovský",
  "Sparta Prague": "Lars Friis",
  "Viktoria Plzen": "Miroslav Koubek",
  "Bodø/Glimt": "Kjetil Knutsen",
  "Bodo/Glimt": "Kjetil Knutsen",
  "Olympiacos": "José Luis Mendilibar",
  "PAOK": "Răzvan Lucescu",
  "Panathinaikos": "Rui Vitória",
  "Crvena Zvezda": "Vladan Milojević",
  "Red Star Belgrade": "Vladan Milojević",
  "Dinamo Zagreb": "Nenad Bjelica",
  "Maccabi Tel Aviv": "Žarko Lazetić",
  "Midtjylland": "Thomas Thomasberg",
  "FC Copenhagen": "Jacob Neestrup",
  "Malmö FF": "Henrik Rydström",
};

/**
 * Lấy tên HLV trưởng theo tên câu lạc bộ
 */
export function getClubManager(clubName: string): string {
  if (!clubName) return "Đang cập nhật";

  const cleanName = clubName.trim();

  // 1. Exact match
  if (CLUB_MANAGERS[cleanName]) return CLUB_MANAGERS[cleanName];

  // 2. Fuzzy match
  const lowerName = cleanName.toLowerCase();
  for (const [teamKey, coach] of Object.entries(CLUB_MANAGERS)) {
    const lowerKey = teamKey.toLowerCase();
    if (lowerName === lowerKey || lowerName.includes(lowerKey) || lowerKey.includes(lowerName)) {
      return coach;
    }
  }

  // 3. Normalized stripped match (remove FC, CF, United, etc.)
  const stripped = lowerName.replace(/\b(fc|cf|afc|f\.c\.|c\.f\.|club|united|city|town|wanderers|hotspur|athletic)\b/g, "").trim();
  if (stripped.length >= 3) {
    for (const [teamKey, coach] of Object.entries(CLUB_MANAGERS)) {
      const lowerKey = teamKey.toLowerCase();
      if (lowerKey.includes(stripped)) {
        return coach;
      }
    }
  }

  return "Đang cập nhật";
}
