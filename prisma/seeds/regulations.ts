import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categories
const categories = [
  { name: 'Safety', description: 'Ship construction, fire protection, life-saving appliances, and emergency procedures', icon: 'shield-check', sortOrder: 1 },
  { name: 'Pollution Prevention', description: 'Environmental protection, pollution control, and emissions standards', icon: 'globe-americas', sortOrder: 2 },
  { name: 'Training & Certification', description: 'Seafarer competency standards, qualifications, and watchkeeping', icon: 'academic-cap', sortOrder: 3 },
  { name: 'Labor & Welfare', description: 'Working conditions, hours of rest, accommodation, and seafarer rights', icon: 'users', sortOrder: 4 },
  { name: 'Security', description: 'Ship and port facility security measures and protocols', icon: 'lock-closed', sortOrder: 5 },
  { name: 'Navigation', description: 'Navigation rules, equipment requirements, and collision prevention', icon: 'map', sortOrder: 6 },
  { name: 'Cargo', description: 'Cargo handling, stowage, dangerous goods, and load line requirements', icon: 'cube', sortOrder: 7 },
];

// Conventions
const conventions = [
  {
    code: 'SOLAS',
    name: 'International Convention for the Safety of Life at Sea',
    description: 'The most important international treaty concerning the safety of merchant ships. Specifies minimum standards for construction, equipment, and operation.',
    adoptionDate: new Date('1974-11-01'),
    effectiveDate: new Date('1980-05-25'),
    imoLink: 'https://www.imo.org/en/About/Conventions/Pages/International-Convention-for-the-Safety-of-Life-at-Sea-(SOLAS),-1974.aspx',
  },
  {
    code: 'MARPOL',
    name: 'International Convention for the Prevention of Pollution from Ships',
    description: 'The main international convention covering prevention of pollution of the marine environment by ships from operational or accidental causes.',
    adoptionDate: new Date('1973-11-02'),
    effectiveDate: new Date('1983-10-02'),
    imoLink: 'https://www.imo.org/en/About/Conventions/Pages/International-Convention-for-the-Prevention-of-Pollution-from-Ships-(MARPOL).aspx',
  },
  {
    code: 'STCW',
    name: 'International Convention on Standards of Training, Certification and Watchkeeping for Seafarers',
    description: 'Sets qualification standards for masters, officers, and watch personnel on seagoing merchant ships.',
    adoptionDate: new Date('1978-07-07'),
    effectiveDate: new Date('1984-04-28'),
    imoLink: 'https://www.imo.org/en/OurWork/HumanElement/Pages/STCW-Conv-LINK.aspx',
  },
  {
    code: 'MLC',
    name: 'Maritime Labour Convention',
    description: 'Sets out seafarers\' rights to decent conditions of work including minimum age, employment agreements, hours of work and rest, payment of wages, accommodation, and health protection.',
    adoptionDate: new Date('2006-02-23'),
    effectiveDate: new Date('2013-08-20'),
    imoLink: 'https://www.ilo.org/global/standards/maritime-labour-convention/lang--en/index.htm',
  },
  {
    code: 'COLREGS',
    name: 'Convention on the International Regulations for Preventing Collisions at Sea',
    description: 'Establishes the "rules of the road" at sea, including navigation lights, shapes, and steering and sailing rules.',
    adoptionDate: new Date('1972-10-20'),
    effectiveDate: new Date('1977-07-15'),
    imoLink: 'https://www.imo.org/en/About/Conventions/Pages/COLREG.aspx',
  },
  {
    code: 'ISM',
    name: 'International Safety Management Code',
    description: 'Provides an international standard for the safe management and operation of ships and for pollution prevention.',
    adoptionDate: new Date('1993-11-04'),
    effectiveDate: new Date('1998-07-01'),
    imoLink: 'https://www.imo.org/en/OurWork/HumanElement/Pages/ISMCode.aspx',
  },
  {
    code: 'ISPS',
    name: 'International Ship and Port Facility Security Code',
    description: 'A comprehensive set of measures to enhance the security of ships and port facilities.',
    adoptionDate: new Date('2002-12-12'),
    effectiveDate: new Date('2004-07-01'),
    imoLink: 'https://www.imo.org/en/OurWork/Security/Pages/SOLAS-XI-2%20ISPS%20Code.aspx',
  },
  {
    code: 'LOADLINES',
    name: 'International Convention on Load Lines',
    description: 'Establishes limits to which a ship may be loaded, ensuring ship safety and preventing overloading.',
    adoptionDate: new Date('1966-04-05'),
    effectiveDate: new Date('1968-07-21'),
    imoLink: 'https://www.imo.org/en/About/Conventions/Pages/International-Convention-on-Load-Lines.aspx',
  },
  {
    code: 'IMDG',
    name: 'International Maritime Dangerous Goods Code',
    description: 'International guidelines for the safe transport of dangerous goods by sea, covering classification, packing, marking, and segregation.',
    adoptionDate: new Date('1965-01-01'),
    effectiveDate: new Date('1965-01-01'),
    imoLink: 'https://www.imo.org/en/Publications/Pages/IMDG%20Code.aspx',
  },
  {
    code: 'BWM',
    name: 'International Convention for the Control and Management of Ships\' Ballast Water and Sediments',
    description: 'Aims to prevent the spread of harmful aquatic organisms from one region to another through ballast water.',
    adoptionDate: new Date('2004-02-13'),
    effectiveDate: new Date('2017-09-08'),
    imoLink: 'https://www.imo.org/en/About/Conventions/Pages/International-Convention-for-the-Control-and-Management-of-Ships%27-Ballast-Water-and-Sediments-(BWM).aspx',
  },
  {
    code: 'POLAR',
    name: 'International Code for Ships Operating in Polar Waters',
    description: 'Covers the full range of design, construction, equipment, operational, training, search and rescue and environmental protection matters relevant to ships operating in polar waters.',
    adoptionDate: new Date('2014-11-21'),
    effectiveDate: new Date('2017-01-01'),
    imoLink: 'https://www.imo.org/en/MediaCentre/HotTopics/Pages/Polar-default.aspx',
  },
];

// Chapter and Regulation data
interface RegulationData {
  code: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  keyPoints?: string[];
  applicableTo?: string;
  sortOrder: number;
}

interface ChapterData {
  code: string;
  title: string;
  description?: string;
  sortOrder: number;
  regulations: RegulationData[];
}

interface ConventionChapters {
  [conventionCode: string]: ChapterData[];
}

const conventionChapters: ConventionChapters = {
  SOLAS: [
    {
      code: 'I',
      title: 'General Provisions',
      description: 'Application, definitions, exemptions, and equivalents',
      sortOrder: 1,
      regulations: [
        {
          code: 'Reg 1',
          title: 'Application',
          category: 'Safety',
          summary: 'Defines which ships the convention applies to',
          content: 'Unless expressly provided otherwise, the present regulations apply only to ships engaged on international voyages. Ships include all vessels capable of navigating in sea areas.',
          keyPoints: ['Applies to ships on international voyages', 'Excludes warships and fishing vessels', 'Covers passenger and cargo ships'],
          applicableTo: 'All ships on international voyages',
          sortOrder: 1,
        },
        {
          code: 'Reg 2',
          title: 'Definitions',
          category: 'Safety',
          summary: 'Key definitions used throughout the convention',
          content: 'For the purpose of the present regulations, unless expressly provided otherwise: (a) "Regulations" means the regulations contained in the annex to the present Convention; (b) "Administration" means the Government of the State whose flag the ship is entitled to fly; (c) "Approved" means approved by the Administration.',
          keyPoints: ['Defines Administration authority', 'Defines ship types', 'Establishes terminology'],
          sortOrder: 2,
        },
      ],
    },
    {
      code: 'II-1',
      title: 'Construction - Subdivision and Stability, Machinery and Electrical Installations',
      description: 'Structural requirements for ship construction, subdivision, and mechanical systems',
      sortOrder: 2,
      regulations: [
        {
          code: 'Reg 3',
          title: 'Definitions',
          category: 'Safety',
          summary: 'Definitions relating to Parts B, B-1, B-2, B-3 and B-4',
          content: 'For the purpose of this chapter: Subdivision load line is a waterline used in determining the subdivision of the ship. Deepest subdivision load line is the waterline which corresponds to the greatest draught permitted by the subdivision requirements.',
          keyPoints: ['Defines subdivision load lines', 'Establishes damage stability terms', 'Defines bulkhead deck'],
          applicableTo: 'All passenger ships and cargo ships',
          sortOrder: 1,
        },
        {
          code: 'Reg 5',
          title: 'Intact Stability Information',
          category: 'Safety',
          summary: 'Requirements for stability information to be provided to ship masters',
          content: 'Every passenger ship regardless of size and every cargo ship having a length of 24 m and upwards, shall be inclined upon completion and the elements of stability determined. The master shall be supplied with such information as is necessary to enable him to obtain accurate guidance as to stability.',
          keyPoints: ['Inclining test required', 'Stability booklet must be provided', 'Loading conditions specified'],
          applicableTo: 'Passenger ships and cargo ships ≥24m',
          sortOrder: 2,
        },
        {
          code: 'Reg 22',
          title: 'Watertight Doors',
          category: 'Safety',
          summary: 'Requirements for watertight doors in subdivision bulkheads',
          content: 'The number of openings in watertight bulkheads shall be kept to the minimum compatible with the design and proper working of the ship. Where penetrations of watertight bulkheads are necessary for access, piping, ventilation, electrical cables, etc., arrangements shall be made to maintain the watertight integrity.',
          keyPoints: ['Minimize openings in watertight bulkheads', 'Power-operated doors required in passenger ships', 'Doors must be testable'],
          applicableTo: 'All passenger and cargo ships',
          sortOrder: 3,
        },
      ],
    },
    {
      code: 'II-2',
      title: 'Construction - Fire Protection, Detection and Extinction',
      description: 'Fire safety measures, detection systems, and firefighting equipment',
      sortOrder: 3,
      regulations: [
        {
          code: 'Reg 4',
          title: 'Probability of Ignition',
          category: 'Safety',
          summary: 'Requirements to minimize probability of fire ignition',
          content: 'The purpose of this regulation is to limit the probability of ignition of a fire. For this purpose, the following functional requirements shall be met: means shall be provided to control leaks of flammable liquids; means shall be provided to limit the accumulation of flammable vapours.',
          keyPoints: ['Control flammable liquid leaks', 'Limit flammable vapor accumulation', 'Restrict ignition sources'],
          applicableTo: 'All ships',
          sortOrder: 1,
        },
        {
          code: 'Reg 10',
          title: 'Firefighting',
          category: 'Safety',
          summary: 'Requirements for firefighting equipment and systems',
          content: 'The purpose of this regulation is to suppress and swiftly extinguish a fire in the space of origin. Ships shall be provided with fire pumps, fire mains, hydrants and hoses. Fire extinguishers shall be provided in accommodation and service spaces.',
          keyPoints: ['Fire pumps and mains required', 'Portable extinguishers in all spaces', 'Fixed fire-extinguishing systems for machinery spaces'],
          applicableTo: 'All ships',
          sortOrder: 2,
        },
        {
          code: 'Reg 13',
          title: 'Means of Escape',
          category: 'Safety',
          summary: 'Requirements for escape routes and emergency exits',
          content: 'Escape routes shall be provided so that persons onboard can safely and swiftly escape to the lifeboat and liferaft embarkation deck from any space. Stairways and corridors designated as escape routes shall be at least 900mm wide.',
          keyPoints: ['Two means of escape from all spaces', 'Emergency lighting required', 'Low-location lighting in corridors'],
          applicableTo: 'All ships',
          sortOrder: 3,
        },
      ],
    },
    {
      code: 'III',
      title: 'Life-Saving Appliances and Arrangements',
      description: 'Lifeboats, liferafts, personal life-saving equipment, and rescue procedures',
      sortOrder: 4,
      regulations: [
        {
          code: 'Reg 7',
          title: 'Personal Life-Saving Appliances',
          category: 'Safety',
          summary: 'Requirements for lifebuoys, lifejackets, and immersion suits',
          content: 'Every ship shall carry lifebuoys, lifejackets and immersion suits. Lifebuoys shall be capable of supporting at least two persons for 24 hours in fresh water. Each lifebuoy shall be fitted with a self-igniting light.',
          keyPoints: ['Lifebuoys with self-igniting lights', 'Lifejackets for each person onboard', 'Immersion suits for watch personnel'],
          applicableTo: 'All ships',
          sortOrder: 1,
        },
        {
          code: 'Reg 19',
          title: 'Emergency Training and Drills',
          category: 'Safety',
          summary: 'Requirements for crew training and emergency drills',
          content: 'Crew members with emergency duties shall be trained prior to assuming those duties. Abandon ship drills and fire drills shall take place weekly. Each lifeboat shall be launched with its assigned operating crew at least once every three months.',
          keyPoints: ['Weekly abandon ship and fire drills', 'New crew members trained within 2 weeks', 'Lifeboat launching every 3 months'],
          applicableTo: 'All ships',
          sortOrder: 2,
        },
        {
          code: 'Reg 21',
          title: 'Survival Craft and Rescue Boat Muster and Embarkation',
          category: 'Safety',
          summary: 'Requirements for muster stations and embarkation procedures',
          content: 'Survival craft muster and embarkation stations shall be close to the survival craft. The embarkation arrangements shall be such that survival craft can be loaded within 30 minutes from the time the signal to abandon ship is given.',
          keyPoints: ['Muster stations clearly marked', 'Embarkation within 30 minutes', 'Emergency lighting at muster stations'],
          applicableTo: 'All ships',
          sortOrder: 3,
        },
      ],
    },
    {
      code: 'V',
      title: 'Safety of Navigation',
      description: 'Navigation equipment, voyage planning, and ship reporting systems',
      sortOrder: 6,
      regulations: [
        {
          code: 'Reg 19',
          title: 'Carriage Requirements for Shipborne Navigational Systems and Equipment',
          category: 'Navigation',
          summary: 'Mandatory navigation equipment based on ship size and type',
          content: 'All ships shall be fitted with a magnetic compass, radar, ECDIS or adequate nautical charts, receiver for global navigation satellite system, AIS, and other navigation equipment as specified.',
          keyPoints: ['Radar required for ships ≥300GT', 'AIS mandatory for international voyages', 'ECDIS mandatory for new ships', 'GMDSS equipment required'],
          applicableTo: 'All ships based on tonnage thresholds',
          sortOrder: 1,
        },
        {
          code: 'Reg 34',
          title: 'Safe Navigation and Avoidance of Dangerous Situations',
          category: 'Navigation',
          summary: 'General requirements for voyage planning and safe navigation',
          content: 'Prior to proceeding to sea, the master shall ensure that the intended voyage has been planned using appropriate nautical charts and publications, taking into account guidelines developed by the Organization.',
          keyPoints: ['Voyage plan required before departure', 'Consider weather and sea conditions', 'Identify dangers to navigation'],
          applicableTo: 'All ships',
          sortOrder: 2,
        },
        {
          code: 'Reg 35',
          title: 'Misuse of Distress Signals',
          category: 'Navigation',
          summary: 'Prohibition of false distress signals',
          content: 'The use of an international distress signal, except for the purpose of indicating distress, and the use of any signal which may be confused with an international distress signal, are prohibited.',
          keyPoints: ['False distress signals prohibited', 'Applies to all signal types', 'Penalties apply'],
          applicableTo: 'All ships',
          sortOrder: 3,
        },
      ],
    },
    {
      code: 'IX',
      title: 'Management for the Safe Operation of Ships',
      description: 'International Safety Management (ISM) Code requirements',
      sortOrder: 10,
      regulations: [
        {
          code: 'Reg 3',
          title: 'Safety Management Requirements',
          category: 'Safety',
          summary: 'Company and ship safety management obligations',
          content: 'The Company and the ship shall comply with the requirements of the International Safety Management (ISM) Code. Every company shall develop, implement, and maintain a Safety Management System (SMS).',
          keyPoints: ['SMS required for all companies', 'Document of Compliance (DOC) required', 'Safety Management Certificate (SMC) for ships'],
          applicableTo: 'All passenger ships, cargo ships ≥500GT',
          sortOrder: 1,
        },
      ],
    },
    {
      code: 'XI-2',
      title: 'Special Measures to Enhance Maritime Security',
      description: 'ISPS Code implementation and ship security measures',
      sortOrder: 13,
      regulations: [
        {
          code: 'Reg 4',
          title: 'Ship Security Plan',
          category: 'Security',
          summary: 'Requirements for Ship Security Plan development and approval',
          content: 'Each ship shall carry on board a Ship Security Plan approved by the Administration. The plan shall make provisions for the three security levels: Security Level 1 (normal), Security Level 2 (heightened), and Security Level 3 (exceptional).',
          keyPoints: ['Ship Security Plan approved by Administration', 'Three security levels defined', 'Ship Security Officer designated'],
          applicableTo: 'Ships on international voyages',
          sortOrder: 1,
        },
        {
          code: 'Reg 6',
          title: 'International Ship Security Certificate',
          category: 'Security',
          summary: 'Requirements for ISSC issuance and validity',
          content: 'An International Ship Security Certificate shall be issued to every ship after verifying that the ship complies with the applicable requirements of this chapter and part A of the ISPS Code.',
          keyPoints: ['ISSC valid for 5 years', 'Subject to verification audits', 'Must be carried onboard'],
          applicableTo: 'Ships on international voyages',
          sortOrder: 2,
        },
      ],
    },
  ],
  MARPOL: [
    {
      code: 'Annex I',
      title: 'Prevention of Pollution by Oil',
      description: 'Regulations for the prevention of pollution by oil from ships',
      sortOrder: 1,
      regulations: [
        {
          code: 'Reg 14',
          title: 'Oil Filtering Equipment',
          category: 'Pollution Prevention',
          summary: 'Requirements for oil filtering equipment to prevent oil discharge',
          content: 'Any ship of 400 gross tonnage and above shall be fitted with oil filtering equipment. The equipment shall ensure that any oily mixture discharged into the sea has an oil content not exceeding 15 parts per million.',
          keyPoints: ['15 ppm maximum oil content in discharge', 'Automatic stopping device required', 'Oil content meter mandatory'],
          applicableTo: 'Ships ≥400GT',
          sortOrder: 1,
        },
        {
          code: 'Reg 15',
          title: 'Control of Discharge of Oil',
          category: 'Pollution Prevention',
          summary: 'Operational requirements for oil discharge at sea',
          content: 'Any discharge into the sea of oil or oily mixtures from ships shall be prohibited except when all conditions are satisfied: the ship is proceeding en route, the oil content does not exceed 15 ppm, and the ship has in operation approved equipment.',
          keyPoints: ['No discharge within 50nm of land', 'Must be en route', 'Equipment must be operating'],
          applicableTo: 'All ships',
          sortOrder: 2,
        },
        {
          code: 'Reg 20',
          title: 'Oil Record Book',
          category: 'Pollution Prevention',
          summary: 'Requirements for maintaining Oil Record Book',
          content: 'Every oil tanker of 150 gross tonnage and above and every ship of 400 gross tonnage and above shall be provided with an Oil Record Book. Operations shall be recorded without delay.',
          keyPoints: ['Part I for machinery space operations', 'Part II for cargo/ballast operations (tankers)', 'Retained for 3 years'],
          applicableTo: 'Tankers ≥150GT, other ships ≥400GT',
          sortOrder: 3,
        },
      ],
    },
    {
      code: 'Annex II',
      title: 'Control of Pollution by Noxious Liquid Substances',
      description: 'Regulations for control of pollution by noxious liquid substances in bulk',
      sortOrder: 2,
      regulations: [
        {
          code: 'Reg 13',
          title: 'Control of Discharge of Residues',
          category: 'Pollution Prevention',
          summary: 'Discharge criteria for noxious liquid substances',
          content: 'The discharge of residues of noxious liquid substances shall be made only to a reception facility until the concentration of the substance is at or below specified levels and the ship is proceeding en route at minimum speed.',
          keyPoints: ['Category X: no discharge permitted', 'Category Y: discharge with restrictions', 'Category Z: less strict limitations'],
          applicableTo: 'Chemical tankers',
          sortOrder: 1,
        },
      ],
    },
    {
      code: 'Annex IV',
      title: 'Prevention of Pollution by Sewage from Ships',
      description: 'Regulations for the prevention of pollution by sewage from ships',
      sortOrder: 4,
      regulations: [
        {
          code: 'Reg 11',
          title: 'Discharge of Sewage',
          category: 'Pollution Prevention',
          summary: 'Conditions for discharge of sewage at sea',
          content: 'The discharge of sewage into the sea is prohibited, except when the ship has in operation an approved sewage treatment plant, or when the ship is discharging comminuted and disinfected sewage at a distance greater than 3 nautical miles from the nearest land.',
          keyPoints: ['Approved treatment plant required', 'Minimum distances from land', 'No discharge in special areas'],
          applicableTo: 'Ships ≥400GT or certified for >15 persons',
          sortOrder: 1,
        },
      ],
    },
    {
      code: 'Annex V',
      title: 'Prevention of Pollution by Garbage from Ships',
      description: 'Regulations for the prevention of pollution by garbage from ships',
      sortOrder: 5,
      regulations: [
        {
          code: 'Reg 3',
          title: 'General Prohibition on Discharge of Garbage',
          category: 'Pollution Prevention',
          summary: 'Prohibition of garbage discharge into the sea',
          content: 'The discharge of all garbage into the sea is prohibited except as otherwise specified in this Annex. Plastics, including synthetic ropes, fishing nets, and plastic garbage bags are never permitted to be discharged.',
          keyPoints: ['All plastics prohibited', 'Food waste only beyond 12nm', 'Garbage record book required'],
          applicableTo: 'All ships',
          sortOrder: 1,
        },
        {
          code: 'Reg 10',
          title: 'Garbage Management Plan and Garbage Record Book',
          category: 'Pollution Prevention',
          summary: 'Requirements for garbage management documentation',
          content: 'Every ship of 100 gross tonnage and above shall carry a garbage management plan. Every ship of 400 gross tonnage and above shall be provided with a Garbage Record Book.',
          keyPoints: ['Management plan for ships ≥100GT', 'Record book for ships ≥400GT', 'Retained for 2 years'],
          applicableTo: 'Ships ≥100GT (plan), Ships ≥400GT (record book)',
          sortOrder: 2,
        },
      ],
    },
    {
      code: 'Annex VI',
      title: 'Prevention of Air Pollution from Ships',
      description: 'Regulations for the prevention of air pollution from ships',
      sortOrder: 6,
      regulations: [
        {
          code: 'Reg 13',
          title: 'Nitrogen Oxides (NOx)',
          category: 'Pollution Prevention',
          summary: 'NOx emission limits for marine diesel engines',
          content: 'Marine diesel engines with power output more than 130 kW shall comply with NOx emission limits. Tier I applies to engines installed before 2011, Tier II from 2011, and Tier III in Emission Control Areas from 2016.',
          keyPoints: ['Tier I: engines pre-2011', 'Tier II: engines 2011+', 'Tier III: ECAs from 2016'],
          applicableTo: 'Ships with diesel engines >130kW',
          sortOrder: 1,
        },
        {
          code: 'Reg 14',
          title: 'Sulphur Oxides (SOx) and Particulate Matter',
          category: 'Pollution Prevention',
          summary: 'Fuel oil sulphur content limits',
          content: 'The sulphur content of any fuel oil used on board ships shall not exceed 0.50% m/m (global cap from 2020). Within Emission Control Areas, the limit is 0.10% m/m.',
          keyPoints: ['Global limit 0.50% sulphur from 2020', 'ECA limit 0.10% sulphur', 'Alternative compliance methods allowed'],
          applicableTo: 'All ships',
          sortOrder: 2,
        },
        {
          code: 'Reg 22A',
          title: 'Energy Efficiency Design Index (EEDI)',
          category: 'Pollution Prevention',
          summary: 'Energy efficiency requirements for new ships',
          content: 'The attained EEDI shall be calculated for each new ship and shall be verified by the Administration or a recognized organization. The attained EEDI shall be less than or equal to the required EEDI.',
          keyPoints: ['Applies to new ships from 2013', 'Phased reduction requirements', 'EEDI Technical File required'],
          applicableTo: 'New ships ≥400GT',
          sortOrder: 3,
        },
      ],
    },
  ],
  STCW: [
    {
      code: 'II',
      title: 'Master and Deck Department',
      description: 'Standards regarding master and deck department certification',
      sortOrder: 2,
      regulations: [
        {
          code: 'Reg II/1',
          title: 'Mandatory Requirements for Certification of Officers in Charge of a Navigational Watch',
          category: 'Training & Certification',
          summary: 'Requirements for OOW certification',
          content: 'Every officer in charge of a navigational watch shall hold a certificate and demonstrate competence in navigation, watchkeeping, meteorology, ship handling, and emergency procedures. Minimum seagoing service of not less than 12 months.',
          keyPoints: ['12 months minimum sea service', 'Approved training program', 'Competency demonstration required'],
          applicableTo: 'Deck officers',
          sortOrder: 1,
        },
        {
          code: 'Reg II/2',
          title: 'Mandatory Requirements for Certification of Masters and Chief Mates',
          category: 'Training & Certification',
          summary: 'Requirements for Master and Chief Mate certification',
          content: 'Every master and chief mate on a seagoing ship of 500 gross tonnage or more shall hold an appropriate certificate. Additional seagoing service as OOW is required before promotion.',
          keyPoints: ['36 months qualifying sea service for Master', 'Chief Mate: 12 months as OOW', 'Approved training required'],
          applicableTo: 'Masters and Chief Mates',
          sortOrder: 2,
        },
      ],
    },
    {
      code: 'III',
      title: 'Engine Department',
      description: 'Standards regarding engine department certification',
      sortOrder: 3,
      regulations: [
        {
          code: 'Reg III/1',
          title: 'Mandatory Requirements for Certification of Officers in Charge of an Engineering Watch',
          category: 'Training & Certification',
          summary: 'Requirements for engineering OOW certification',
          content: 'Every officer in charge of an engineering watch shall hold an appropriate certificate. Combined workshop skill training and seagoing service of not less than 12 months as part of approved training program.',
          keyPoints: ['12 months combined training', 'Workshop skills training', 'Engine room resource management'],
          applicableTo: 'Engineering officers',
          sortOrder: 1,
        },
      ],
    },
    {
      code: 'VI',
      title: 'Emergency, Occupational Safety, Medical Care and Survival Functions',
      description: 'Standards for emergency response and safety training',
      sortOrder: 6,
      regulations: [
        {
          code: 'Reg VI/1',
          title: 'Mandatory Basic Training for All Seafarers',
          category: 'Training & Certification',
          summary: 'Basic Safety Training requirements',
          content: 'Seafarers shall receive approved familiarization and basic training in personal survival techniques, fire prevention and fire fighting, elementary first aid, and personal safety and social responsibilities before being assigned to any shipboard duties.',
          keyPoints: ['Personal Survival Techniques (PST)', 'Fire Prevention and Fire Fighting (FPFF)', 'Elementary First Aid (EFA)', 'Personal Safety and Social Responsibility (PSSR)'],
          applicableTo: 'All seafarers',
          sortOrder: 1,
        },
        {
          code: 'Reg VI/2',
          title: 'Mandatory Certification for Survival Craft, Rescue Boats and Fast Rescue Boats',
          category: 'Training & Certification',
          summary: 'Requirements for lifeboat and rescue boat operation certification',
          content: 'Every person designated to command survival craft or rescue boats shall hold a certificate of proficiency in survival craft and rescue boats. Training shall include launching and recovery, management of survivors, and operation of davits.',
          keyPoints: ['Practical training in launching', 'Survivor management skills', 'Equipment operation'],
          applicableTo: 'Designated survival craft personnel',
          sortOrder: 2,
        },
      ],
    },
    {
      code: 'VIII',
      title: 'Watchkeeping',
      description: 'Standards regarding watchkeeping arrangements',
      sortOrder: 8,
      regulations: [
        {
          code: 'Reg VIII/1',
          title: 'Fitness for Duty',
          category: 'Training & Certification',
          summary: 'Requirements for rest periods and fitness for watchkeeping',
          content: 'Persons assigned duty as officer in charge of a watch or as a rating forming part of a watch shall be provided with minimum hours of rest. The minimum hours of rest shall not be less than 10 hours in any 24-hour period and 77 hours in any 7-day period.',
          keyPoints: ['10 hours rest in 24-hour period', '77 hours rest in 7-day period', 'Rest may be divided into 2 periods'],
          applicableTo: 'All watchkeeping personnel',
          sortOrder: 1,
        },
      ],
    },
  ],
  MLC: [
    {
      code: 'Title 1',
      title: 'Minimum Requirements for Seafarers to Work on a Ship',
      description: 'Age, medical certification, training, and recruitment standards',
      sortOrder: 1,
      regulations: [
        {
          code: 'Reg 1.1',
          title: 'Minimum Age',
          category: 'Labor & Welfare',
          summary: 'Minimum age requirements for seafarers',
          content: 'No person below the minimum age shall be employed or engaged or work on a ship. The minimum age is 16 years. Night work is prohibited for seafarers under 18. Hazardous work is prohibited for those under 18.',
          keyPoints: ['Minimum age 16 years', 'No night work under 18', 'No hazardous work under 18'],
          applicableTo: 'All seafarers',
          sortOrder: 1,
        },
        {
          code: 'Reg 1.2',
          title: 'Medical Certificate',
          category: 'Labor & Welfare',
          summary: 'Medical fitness requirements for seafarers',
          content: 'Seafarers shall not work on a ship unless they are certified as medically fit. Medical certificates shall be valid for a maximum period of 2 years, or 1 year for seafarers under 18.',
          keyPoints: ['Valid medical certificate required', '2-year maximum validity', '1-year validity for under-18s'],
          applicableTo: 'All seafarers',
          sortOrder: 2,
        },
      ],
    },
    {
      code: 'Title 2',
      title: 'Conditions of Employment',
      description: 'Employment agreements, wages, hours of work and rest',
      sortOrder: 2,
      regulations: [
        {
          code: 'Reg 2.1',
          title: 'Seafarers\' Employment Agreements',
          category: 'Labor & Welfare',
          summary: 'Requirements for written employment contracts',
          content: 'The terms and conditions for employment of a seafarer shall be set out or referred to in a clear written legally enforceable agreement. Seafarers shall be given opportunity to examine and seek advice on the agreement before signing.',
          keyPoints: ['Written agreement required', 'Copy retained by seafarer', 'Clear termination conditions'],
          applicableTo: 'All seafarers',
          sortOrder: 1,
        },
        {
          code: 'Reg 2.3',
          title: 'Hours of Work and Hours of Rest',
          category: 'Labor & Welfare',
          summary: 'Maximum working hours and minimum rest periods',
          content: 'The limits on hours of work or rest shall be: maximum hours of work shall not exceed 14 hours in any 24-hour period and 72 hours in any 7-day period; or minimum hours of rest shall not be less than 10 hours in any 24-hour period and 77 hours in any 7-day period.',
          keyPoints: ['Max 14 hours work per day', 'Max 72 hours work per week', 'Min 10 hours rest per day'],
          applicableTo: 'All seafarers',
          sortOrder: 2,
        },
        {
          code: 'Reg 2.4',
          title: 'Entitlement to Leave',
          category: 'Labor & Welfare',
          summary: 'Annual leave entitlements',
          content: 'Seafarers shall be granted paid annual leave. The minimum annual leave with pay shall be calculated on the basis of a minimum of 2.5 calendar days per month of employment.',
          keyPoints: ['2.5 days per month minimum', 'Leave cannot be forfeited', 'Shore leave to be granted'],
          applicableTo: 'All seafarers',
          sortOrder: 3,
        },
      ],
    },
    {
      code: 'Title 3',
      title: 'Accommodation, Recreational Facilities, Food and Catering',
      description: 'Living conditions on board ships',
      sortOrder: 3,
      regulations: [
        {
          code: 'Reg 3.1',
          title: 'Accommodation and Recreational Facilities',
          category: 'Labor & Welfare',
          summary: 'Standards for crew accommodation',
          content: 'Ships shall provide and maintain decent accommodations and recreational facilities for seafarers working or living on board. Sleeping rooms shall have adequate headroom, natural light, and ventilation.',
          keyPoints: ['Minimum floor area specified', 'Adequate ventilation and light', 'Sanitary facilities provided'],
          applicableTo: 'All ships',
          sortOrder: 1,
        },
        {
          code: 'Reg 3.2',
          title: 'Food and Catering',
          category: 'Labor & Welfare',
          summary: 'Standards for food and water provision',
          content: 'Seafarers on board shall be provided with food free of charge. Food shall be of appropriate quality, nutritional value and quantity. Drinking water of adequate quality, quantity and variety shall be provided.',
          keyPoints: ['Food provided free of charge', 'Adequate nutritional value', 'Drinking water quality standards'],
          applicableTo: 'All ships',
          sortOrder: 2,
        },
      ],
    },
  ],
  COLREGS: [
    {
      code: 'Part A',
      title: 'General',
      description: 'Application and definitions',
      sortOrder: 1,
      regulations: [
        {
          code: 'Rule 1',
          title: 'Application',
          category: 'Navigation',
          summary: 'Scope of application of collision regulations',
          content: 'These Rules shall apply to all vessels upon the high seas and in all waters connected therewith navigable by seagoing vessels. Nothing in these Rules shall interfere with special rules made by an appropriate authority for roadsteads, harbours, rivers, lakes or inland waterways.',
          keyPoints: ['Applies to all vessels', 'Applies to high seas and connected waters', 'Local rules may supplement'],
          applicableTo: 'All vessels',
          sortOrder: 1,
        },
        {
          code: 'Rule 2',
          title: 'Responsibility',
          category: 'Navigation',
          summary: 'General prudential rule for navigation',
          content: 'Nothing in these Rules shall exonerate any vessel, owner, master or crew thereof, from the consequences of any neglect to comply with these Rules or of the neglect of any precaution which may be required by the ordinary practice of seamen.',
          keyPoints: ['Rules do not exonerate negligence', 'Special circumstances allow departure', 'Good seamanship always required'],
          applicableTo: 'All vessels',
          sortOrder: 2,
        },
      ],
    },
    {
      code: 'Part B',
      title: 'Steering and Sailing Rules',
      description: 'Rules for vessel conduct in all visibility conditions',
      sortOrder: 2,
      regulations: [
        {
          code: 'Rule 5',
          title: 'Look-out',
          category: 'Navigation',
          summary: 'Requirement for proper look-out at all times',
          content: 'Every vessel shall at all times maintain a proper look-out by sight and hearing as well as by all available means appropriate in the prevailing circumstances and conditions so as to make a full appraisal of the situation and of the risk of collision.',
          keyPoints: ['Visual and audio look-out required', 'Use all appropriate means', 'Full situational awareness'],
          applicableTo: 'All vessels',
          sortOrder: 1,
        },
        {
          code: 'Rule 6',
          title: 'Safe Speed',
          category: 'Navigation',
          summary: 'Requirement to proceed at safe speed',
          content: 'Every vessel shall at all times proceed at a safe speed so that she can take proper and effective action to avoid collision and be stopped within a distance appropriate to the prevailing circumstances and conditions.',
          keyPoints: ['Consider visibility', 'Consider traffic density', 'Consider manoeuvrability'],
          applicableTo: 'All vessels',
          sortOrder: 2,
        },
        {
          code: 'Rule 7',
          title: 'Risk of Collision',
          category: 'Navigation',
          summary: 'Determination of risk of collision',
          content: 'Every vessel shall use all available means appropriate to the prevailing circumstances and conditions to determine if risk of collision exists. If there is any doubt such risk shall be deemed to exist.',
          keyPoints: ['Use all available means', 'If in doubt, risk exists', 'Radar plotting recommended'],
          applicableTo: 'All vessels',
          sortOrder: 3,
        },
        {
          code: 'Rule 8',
          title: 'Action to Avoid Collision',
          category: 'Navigation',
          summary: 'Requirements for collision avoidance action',
          content: 'Any action to avoid collision shall be taken in accordance with the Rules of this Part and shall, if the circumstances admit, be positive, made in ample time and with due regard to the observance of good seamanship.',
          keyPoints: ['Action shall be positive', 'Action in ample time', 'Large alterations preferred'],
          applicableTo: 'All vessels',
          sortOrder: 4,
        },
      ],
    },
    {
      code: 'Part C',
      title: 'Lights and Shapes',
      description: 'Navigation lights and day shapes requirements',
      sortOrder: 3,
      regulations: [
        {
          code: 'Rule 20',
          title: 'Application',
          category: 'Navigation',
          summary: 'When lights and shapes must be displayed',
          content: 'Rules in this Part shall be complied with in all weathers. The Rules concerning lights shall be complied with from sunset to sunrise. The Rules concerning shapes shall be complied with by day.',
          keyPoints: ['Lights from sunset to sunrise', 'Shapes displayed by day', 'Apply in all weather'],
          applicableTo: 'All vessels',
          sortOrder: 1,
        },
        {
          code: 'Rule 23',
          title: 'Power-driven Vessels Underway',
          category: 'Navigation',
          summary: 'Lights for power-driven vessels',
          content: 'A power-driven vessel underway shall exhibit: a masthead light forward; a second masthead light abaft of and higher than the forward one (if 50m or more in length); sidelights; and a sternlight.',
          keyPoints: ['Masthead light(s) forward', 'Red/green sidelights', 'White sternlight'],
          applicableTo: 'Power-driven vessels',
          sortOrder: 2,
        },
      ],
    },
    {
      code: 'Part D',
      title: 'Sound and Light Signals',
      description: 'Sound signals and light signals for vessels',
      sortOrder: 4,
      regulations: [
        {
          code: 'Rule 34',
          title: 'Manoeuvring and Warning Signals',
          category: 'Navigation',
          summary: 'Sound signals for vessel manoeuvres',
          content: 'When vessels are in sight of one another, a power-driven vessel underway shall indicate manoeuvres by signals on the whistle: one short blast for starboard turn, two short blasts for port turn, three short blasts for operating astern propulsion.',
          keyPoints: ['1 blast: altering to starboard', '2 blasts: altering to port', '3 blasts: engines astern'],
          applicableTo: 'Power-driven vessels in sight',
          sortOrder: 1,
        },
        {
          code: 'Rule 35',
          title: 'Sound Signals in Restricted Visibility',
          category: 'Navigation',
          summary: 'Fog signals for various vessel types',
          content: 'In or near an area of restricted visibility, whether by day or night, power-driven vessels making way shall sound one prolonged blast at intervals of not more than 2 minutes.',
          keyPoints: ['1 prolonged blast every 2 min (power vessel)', '2 prolonged blasts every 2 min (not making way)', 'Different signals for special vessels'],
          applicableTo: 'All vessels in restricted visibility',
          sortOrder: 2,
        },
      ],
    },
  ],
  ISM: [
    {
      code: 'Part A',
      title: 'Implementation',
      description: 'General requirements for Safety Management Systems',
      sortOrder: 1,
      regulations: [
        {
          code: 'Element 1',
          title: 'General',
          category: 'Safety',
          summary: 'Objectives of the ISM Code',
          content: 'The objectives of the Code are to ensure safety at sea, prevention of human injury or loss of life, and avoidance of damage to the environment and to property. The Company should establish a safety management system (SMS).',
          keyPoints: ['Safety at sea', 'Environmental protection', 'Safe practices'],
          applicableTo: 'All passenger ships, cargo ships ≥500GT',
          sortOrder: 1,
        },
        {
          code: 'Element 4',
          title: 'Designated Person Ashore (DPA)',
          category: 'Safety',
          summary: 'Requirements for Designated Person',
          content: 'The Company should designate a person ashore having direct access to the highest level of management. This designated person should monitor safety and pollution prevention aspects and ensure adequate resources and shore-based support.',
          keyPoints: ['Direct access to management', 'Monitor safety aspects', 'Ensure adequate resources'],
          applicableTo: 'All companies with ISM requirements',
          sortOrder: 2,
        },
        {
          code: 'Element 7',
          title: 'Development of Plans for Shipboard Operations',
          category: 'Safety',
          summary: 'Requirements for operational procedures',
          content: 'The Company should establish procedures, plans and instructions for key shipboard operations concerning the safety of the personnel, ship and protection of the environment.',
          keyPoints: ['Key operations identified', 'Procedures documented', 'Tasks assigned to qualified personnel'],
          applicableTo: 'All ships under ISM',
          sortOrder: 3,
        },
        {
          code: 'Element 9',
          title: 'Reports and Analysis of Non-conformities, Accidents and Hazardous Occurrences',
          category: 'Safety',
          summary: 'Requirements for incident reporting and analysis',
          content: 'The SMS should include procedures ensuring that non-conformities, accidents and hazardous situations are reported to the Company, investigated and analyzed with the objective of improving safety and pollution prevention.',
          keyPoints: ['Incident reporting required', 'Investigation and analysis', 'Corrective actions taken'],
          applicableTo: 'All ships under ISM',
          sortOrder: 4,
        },
      ],
    },
  ],
  ISPS: [
    {
      code: 'Part A',
      title: 'Mandatory Requirements',
      description: 'Mandatory security requirements for ships and port facilities',
      sortOrder: 1,
      regulations: [
        {
          code: 'Section 7',
          title: 'Ship Security',
          category: 'Security',
          summary: 'Ship security assessment and plan requirements',
          content: 'A Ship Security Assessment shall be carried out as an essential part of the process of developing the Ship Security Plan. The Company Security Officer shall ensure a Ship Security Assessment is carried out by persons with appropriate skills.',
          keyPoints: ['Security assessment required', 'Identify potential threats', 'Evaluate vulnerabilities'],
          applicableTo: 'Ships on international voyages',
          sortOrder: 1,
        },
        {
          code: 'Section 9',
          title: 'Ship Security Plan',
          category: 'Security',
          summary: 'Requirements for Ship Security Plan development',
          content: 'Each ship shall carry an approved Ship Security Plan on board. The Plan shall address the three security levels, describe organizational structure of security, detail measures for each security level, and provide for review and updating.',
          keyPoints: ['Approved SSP required', 'Three security levels addressed', 'Regular reviews and updates'],
          applicableTo: 'Ships on international voyages',
          sortOrder: 2,
        },
        {
          code: 'Section 12',
          title: 'Ship Security Officer',
          category: 'Security',
          summary: 'Duties and qualifications of Ship Security Officer',
          content: 'A Ship Security Officer (SSO) shall be designated on each ship. The SSO is responsible for security of the ship, implementation and maintenance of the SSP, and coordination with the CSO and PFSO.',
          keyPoints: ['SSO designated on each ship', 'Responsible for ship security', 'Coordinates with CSO and PFSO'],
          applicableTo: 'Ships on international voyages',
          sortOrder: 3,
        },
      ],
    },
  ],
  LOADLINES: [
    {
      code: 'Annex I',
      title: 'Regulations for Determining Load Lines',
      description: 'Technical requirements for freeboard and load line marks',
      sortOrder: 1,
      regulations: [
        {
          code: 'Reg 1',
          title: 'Strength of Hull',
          category: 'Cargo',
          summary: 'Requirements for hull structural strength',
          content: 'The Administration shall satisfy itself that the general structural strength of the hull is sufficient for the draught corresponding to the freeboard assigned. Ships built to classification society rules may be considered acceptable.',
          keyPoints: ['Structural strength verified', 'Classification society standards', 'Corresponds to assigned freeboard'],
          applicableTo: 'All ships requiring load line certificate',
          sortOrder: 1,
        },
        {
          code: 'Reg 5',
          title: 'Definitions',
          category: 'Cargo',
          summary: 'Key definitions for load line calculations',
          content: 'Length (L) is 96% of the total length on a waterline at 85% of the least moulded depth, or the length from the foreside of the stem to the axis of the rudder stock on that waterline, whichever is greater.',
          keyPoints: ['Length definition for calculations', 'Breadth and depth definitions', 'Freeboard deck identified'],
          applicableTo: 'All ships requiring load line certificate',
          sortOrder: 2,
        },
      ],
    },
  ],
  IMDG: [
    {
      code: 'Part 1',
      title: 'General Provisions',
      description: 'Application, definitions, training and security',
      sortOrder: 1,
      regulations: [
        {
          code: 'Section 1.1',
          title: 'Application',
          category: 'Cargo',
          summary: 'Scope of the IMDG Code',
          content: 'The IMDG Code applies to all ships to which SOLAS applies and that are carrying dangerous goods as defined in the Code. It also applies to dangerous goods carried as residues in emptied uncleaned tanks.',
          keyPoints: ['Applies to all SOLAS ships', 'Covers dangerous goods transport', 'Includes residues in tanks'],
          applicableTo: 'Ships carrying dangerous goods',
          sortOrder: 1,
        },
        {
          code: 'Section 1.3',
          title: 'Training',
          category: 'Cargo',
          summary: 'Training requirements for dangerous goods personnel',
          content: 'Shore-side personnel and ships\' crews involved in the transport of dangerous goods shall be trained in the contents of dangerous goods packages commensurate with their responsibilities.',
          keyPoints: ['Training commensurate with duties', 'Periodic refresher training', 'Records maintained'],
          applicableTo: 'Personnel handling dangerous goods',
          sortOrder: 2,
        },
      ],
    },
    {
      code: 'Part 2',
      title: 'Classification',
      description: 'Classification of dangerous goods by hazard class',
      sortOrder: 2,
      regulations: [
        {
          code: 'Section 2.0',
          title: 'Introduction to Classification',
          category: 'Cargo',
          summary: 'Overview of dangerous goods classification',
          content: 'Dangerous goods are divided into 9 classes according to their main hazard: Class 1 Explosives, Class 2 Gases, Class 3 Flammable Liquids, Class 4 Flammable Solids, Class 5 Oxidizers, Class 6 Toxic/Infectious, Class 7 Radioactive, Class 8 Corrosives, Class 9 Miscellaneous.',
          keyPoints: ['9 classes of dangerous goods', 'Sub-divisions within classes', 'Primary and subsidiary hazards'],
          applicableTo: 'All dangerous goods',
          sortOrder: 1,
        },
      ],
    },
  ],
  BWM: [
    {
      code: 'Section B',
      title: 'Management and Control Requirements',
      description: 'Ballast water management standards and requirements',
      sortOrder: 2,
      regulations: [
        {
          code: 'Reg B-3',
          title: 'Ballast Water Management for Ships',
          category: 'Pollution Prevention',
          summary: 'Ballast water exchange and treatment requirements',
          content: 'Ships shall manage their ballast water in accordance with the approved Ballast Water Management Plan. Ships performing ballast water exchange shall do so at least 200 nautical miles from the nearest land and in water at least 200 metres in depth.',
          keyPoints: ['Exchange 200nm from land', 'Water depth 200m minimum', 'Treatment standard D-2 applies'],
          applicableTo: 'Ships with ballast tanks',
          sortOrder: 1,
        },
        {
          code: 'Reg B-4',
          title: 'Ballast Water Exchange',
          category: 'Pollution Prevention',
          summary: 'Standards for ballast water exchange efficiency',
          content: 'Ships conducting ballast water exchange shall achieve an efficiency of at least 95% volumetric exchange. For ships exchanging by pumping through method, three times the volume shall be considered to meet the standard.',
          keyPoints: ['95% volumetric exchange', 'Flow-through: 3x volume', 'Sequential exchange allowed'],
          applicableTo: 'Ships using exchange method',
          sortOrder: 2,
        },
      ],
    },
  ],
  POLAR: [
    {
      code: 'Part I-A',
      title: 'General',
      description: 'Safety measures for ships operating in polar waters',
      sortOrder: 1,
      regulations: [
        {
          code: 'Chapter 1',
          title: 'General',
          category: 'Safety',
          summary: 'Goal, purpose and application of Polar Code',
          content: 'The goal of this Code is to provide for safe ship operation and the protection of the polar environment by addressing risks present in polar waters and not adequately mitigated by other instruments.',
          keyPoints: ['Applies to Arctic and Antarctic', 'Risk-based approach', 'Polar Ship Certificate required'],
          applicableTo: 'Ships operating in polar waters',
          sortOrder: 1,
        },
        {
          code: 'Chapter 2',
          title: 'Polar Water Operational Manual (PWOM)',
          category: 'Safety',
          summary: 'Requirements for Polar Water Operational Manual',
          content: 'Ships operating in polar waters shall carry a Polar Water Operational Manual setting out the ship\'s limitations and procedures, including voyage planning, ice navigation, and environmental protection measures.',
          keyPoints: ['PWOM required on board', 'Operational limitations documented', 'Emergency procedures included'],
          applicableTo: 'Ships in polar waters',
          sortOrder: 2,
        },
        {
          code: 'Chapter 12',
          title: 'Manning and Training',
          category: 'Training & Certification',
          summary: 'Training requirements for polar operations',
          content: 'Companies shall ensure that masters, chief mates and officers in charge of a navigational watch on ships operating in polar waters have completed appropriate training. Training shall include ice characteristics, cold weather operations, and survival.',
          keyPoints: ['Polar training for deck officers', 'Ice navigation competence', 'Cold weather survival training'],
          applicableTo: 'Officers on ships in polar waters',
          sortOrder: 3,
        },
      ],
    },
  ],
};

// Cross-references to be created after regulations are seeded
const crossReferenceData = [
  { from: { conv: 'SOLAS', chapter: 'III', reg: 'Reg 19' }, to: { conv: 'STCW', chapter: 'VI', reg: 'Reg VI/1' }, type: 'related', notes: 'Training requirements for emergency drills' },
  { from: { conv: 'SOLAS', chapter: 'IX', reg: 'Reg 3' }, to: { conv: 'ISM', chapter: 'Part A', reg: 'Element 1' }, type: 'implements', notes: 'SOLAS Chapter IX implements ISM Code' },
  { from: { conv: 'SOLAS', chapter: 'XI-2', reg: 'Reg 4' }, to: { conv: 'ISPS', chapter: 'Part A', reg: 'Section 9' }, type: 'implements', notes: 'SOLAS XI-2 implements ISPS Code' },
  { from: { conv: 'STCW', chapter: 'VIII', reg: 'Reg VIII/1' }, to: { conv: 'MLC', chapter: 'Title 2', reg: 'Reg 2.3' }, type: 'related', notes: 'Hours of rest requirements' },
  { from: { conv: 'MARPOL', chapter: 'Annex I', reg: 'Reg 15' }, to: { conv: 'MARPOL', chapter: 'Annex I', reg: 'Reg 14' }, type: 'related', notes: 'Equipment requirements for discharge control' },
  { from: { conv: 'COLREGS', chapter: 'Part B', reg: 'Rule 5' }, to: { conv: 'STCW', chapter: 'II', reg: 'Reg II/1' }, type: 'related', notes: 'Watchkeeping competency for look-out' },
];

export async function seedRegulations() {
  console.log('Seeding regulation categories...');

  // Create categories
  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.regulationCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryMap[cat.name] = created.id;
  }
  console.log(`Created ${Object.keys(categoryMap).length} categories`);

  // Create conventions
  console.log('Seeding conventions...');
  const conventionMap: Record<string, string> = {};
  for (const conv of conventions) {
    const created = await prisma.convention.upsert({
      where: { code: conv.code },
      update: {},
      create: conv,
    });
    conventionMap[conv.code] = created.id;
  }
  console.log(`Created ${Object.keys(conventionMap).length} conventions`);

  // Create chapters and regulations
  console.log('Seeding chapters and regulations...');
  let regCount = 0;
  const regulationMap: Record<string, string> = {}; // key: "CONV_CHAPTER_REG" -> id

  for (const [convCode, chapters] of Object.entries(conventionChapters)) {
    const conventionId = conventionMap[convCode];
    if (!conventionId) continue;

    for (const chapter of chapters) {
      // Create or update chapter
      const existingChapter = await prisma.chapter.findUnique({
        where: { conventionId_code: { conventionId, code: chapter.code } },
      });

      const chapterId = existingChapter?.id || (await prisma.chapter.create({
        data: {
          conventionId,
          code: chapter.code,
          title: chapter.title,
          description: chapter.description,
          sortOrder: chapter.sortOrder,
        },
      })).id;

      // Create regulations for this chapter
      for (const reg of chapter.regulations) {
        const categoryId = categoryMap[reg.category];
        if (!categoryId) continue;

        const existing = await prisma.regulation.findUnique({
          where: { chapterId_code: { chapterId, code: reg.code } },
        });

        const regulation = existing || await prisma.regulation.create({
          data: {
            chapterId,
            categoryId,
            code: reg.code,
            title: reg.title,
            summary: reg.summary,
            content: reg.content,
            keyPoints: reg.keyPoints ? JSON.stringify(reg.keyPoints) : null,
            applicableTo: reg.applicableTo,
            sortOrder: reg.sortOrder,
          },
        });

        regulationMap[`${convCode}_${chapter.code}_${reg.code}`] = regulation.id;
        regCount++;
      }
    }
  }
  console.log(`Created ${regCount} regulations`);

  // Create cross-references
  console.log('Creating cross-references...');
  let crossRefCount = 0;
  for (const ref of crossReferenceData) {
    const fromKey = `${ref.from.conv}_${ref.from.chapter}_${ref.from.reg}`;
    const toKey = `${ref.to.conv}_${ref.to.chapter}_${ref.to.reg}`;

    const fromId = regulationMap[fromKey];
    const toId = regulationMap[toKey];

    if (fromId && toId) {
      await prisma.regulationCrossRef.upsert({
        where: { fromRegulationId_toRegulationId: { fromRegulationId: fromId, toRegulationId: toId } },
        update: {},
        create: {
          fromRegulationId: fromId,
          toRegulationId: toId,
          relationshipType: ref.type,
          notes: ref.notes,
        },
      });
      crossRefCount++;
    }
  }
  console.log(`Created ${crossRefCount} cross-references`);

  console.log('Regulation seeding complete!');
}
