


import { WVClass } from './types';

export const WV_TEAMS: { [key in WVClass]: { id: number; name: string }[] } = {
  'AAA': [
    { id: 1, name: "Martinsburg Bulldogs" },
    { id: 2, name: "Huntington Highlanders" },
    { id: 3, name: "Cabell Midland Knights" },
    { id: 4, name: "Parkersburg South Patriots" },
    { id: 5, name: "George Washington Patriots" },
    { id: 6, name: "Wheeling Park Patriots" },
    { id: 7, name: "Capital Cougars" },
    { id: 8, name: "Morgantown Mohigans" },
    { id: 9, name: "Spring Valley Timberwolves" },
    { id: 10, name: "University Hawks" },
    { id: 11, name: "Parkersburg Big Reds"},
  ],
  'AA': [
    { id: 101, name: "Fairmont Senior Polar Bears" },
    { id: 102, name: "Bluefield Beavers" },
    { id: 103, name: "Poca Dots" },
    { id: 104, name: "North Marion Huskies" },
    { id: 105, name: "Bridgeport Indians" },
    { id: 106, name: "Keyser Golden Tornado" },
    { id: 107, name: "Robert C. Byrd Eagles" },
    { id: 108, name: "Oak Glen Golden Bears" },
    { id: 109, name: "Winfield Generals" },
    { id: 110, name: "Herbert Hoover Huskies" },
  ],
  'A': [
    { id: 201, name: "Williamstown Yellowjackets" },
    { id: 202, name: "St. Marys Blue Devils" },
    { id: 203, name: "Wheeling Central Maroon Knights" },
    { id: 204, name: "Doddridge County Bulldogs" },
    { id: 205, name: "Greenbrier West Cavaliers" },
    { id: 206, name: "Tug Valley Panthers" },
    { id: 207, name: "Ritchie County Rebels" },
    { id: 208, name: "Mount View Golden Knights" },
    { id: 209, name: "Tolsia Rebels" },
    { id: 210, name: "Madonna Blue Dons" },
  ],
};

export const RIVALRIES: Record<number, number> = {
  201: 202, // Williamstown vs St. Marys
  4: 11, // P-South vs PHS (Parkersburg High)
  11: 4, // PHS vs P-South
};

export const POWERHOUSE_TEAMS: number[] = [1, 2, 3, 101, 102, 201, 203]; // Martinsburg, Huntington, Cabell Midland, Fairmont Sr, Bluefield, Williamstown, Wheeling Central

export const OTHER_WV_TEAM_NAMES: string[] = [
  "John Marshall Monarchs", "Brooke Bruins", "Princeton Tigers",
  "Point Pleasant Big Blacks", "Wayne Pioneers", "Sissonville Indians", "Nicholas County Grizzlies",
  "Independence Patriots", "Shady Spring Tigers", "Frankfort Falcons", "Grafton Bearcats",
  "East Hardy Cougars", "Pendleton County Wildcats", "Moorefield Yellow Jackets", "South Harrison Hawks"
];

export const FIRST_NAMES: string[] = [
  "Michael", "Chris", "Matt", "David", "James", "John", "Robert", "Daniel", "William", "Anthony",
  "Kevin", "Brian", "Mark", "Jason", "Jeff", "Ryan", "Eric", "Steve", "Tim", "Paul", "Jaylen",
  "Deion", "Marcus", "Andre", "Jamal", "Trey", "Kyle", "Caleb", "Elijah", "Jordan", "Xavier"
];

export const LAST_NAMES: string[] = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

export const STAFF_FIRST_NAMES: string[] = [
    "Bill", "Vince", "Tom", "Andy", "Sean", "Pete", "Mike", "John", "Kyle", "Nick", "Don"
];

export const STAFF_LAST_NAMES: string[] = [
    "Belichick", "Lombardi", "Landry", "Reid", "McVay", "Carroll", "Tomlin", "Harbaugh", "Shanahan", "Saban", "Shula"
];