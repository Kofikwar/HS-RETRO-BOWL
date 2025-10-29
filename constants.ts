

import { Team } from './types';

export const MAX_SEASONS = 30;

export const POWERHOUSE_TEAMS: Pick<Team, 'id' | 'name'>[] = [
  { id: 1, name: "IMG Academy (FL)" },
  { id: 2, name: "Mater Dei (CA)" },
  { id: 3, name: "St. John Bosco (CA)" },
  { id: 4, name: "American Heritage (FL)" },
  { id: 5, name: "Duncanville (TX)" },
  { id: 6, name: "North Shore (TX)" },
  { id: 7, name: "Bishop Gorman (NV)" },
  { id: 8, name: "St. Frances Academy (MD)" },
  { id: 9, name: "Buford (GA)" },
  { id: 10, name: "Central (Miami, FL)" },
  { id: 11, name: "Westlake (TX)" },
  { id: 12, name: "De La Salle (CA)" },
  { id: 13, name: "St. Thomas Aquinas (FL)" },
  { id: 14, name: "Lake Travis (TX)" },
  { id: 15, name: "Chandler (AZ)" },
  { id: 16, name: "Allen (TX)" },
  { id: 17, name: "Trinity Christian (TX)" },
  { id: 18, name: "Pickerington Central (OH)" },
  { id: 19, name: "Catholic League (LA)" },
  { id: 20, name: "Bergen Catholic (NJ)" }
];

export const OTHER_TEAM_NAMES: string[] = [
  "Oak Ridge Pioneers", "Seminole Warhawks", "Apopka Blue Darters", "Dr. Phillips Panthers", "Jones Fightin' Tigers",
  "Hoover Buccaneers", "Thompson Warriors", "Colquitt County Packers", "Grayson Rams", "Lowndes Vikings",
  "Katy Tigers", "Guyer Wildcats", "Southlake Carroll Dragons", "Cedar Hill Longhorns", "Atascocita Eagles",
  "Corner Canyon Chargers", "Skyridge Falcons", "Timpview Thunderbirds", "Bingham Miners", "Lone Peak Knights",
  "Centennial Huskies", "Servite Friars", "Mission Viejo Diablos", "Sierra Canyon Trailblazers", "Serra Cavaliers",
  "St. Xavier Bombers", "Lakota West Firebirds", "Archbishop Moeller Crusaders", "St. Edward Eagles", "Massillon Tigers",
  "Dutch Fork Silver Foxes", "Gaffney Indians", "Fort Dorchester Patriots", "T.L. Hanna Yellow Jackets", "Byrnes Rebels",
  "Male Bulldogs", "Trinity Shamrocks", "Frederick Douglass Broncos", "Boyle County Rebels", "St. Xavier Tigers",
  "Center Grove Trojans", "Cathedral Fighting Irish", "Westfield Shamrocks", "Carmel Greyhounds", "Brownsburg Bulldogs",
  "Bixby Spartans", "Jenks Trojans", "Owasso Rams", "Booker T. Washington Hornets", "Union Redhawks",
  "Chaminade-Madonna Lions", "Jesuit Tigers", "Venice Indians", "Cardinal Gibbons Chiefs", "Edgewater Eagles",
  "Milton Eagles", "Collins Hill Eagles", "Lee County Trojans", "Warner Robins Demons", "Cartersville Hurricanes",
  "Oakland Patriots", "Maryville Rebels", "Alcoa Tornadoes", "Lipscomb Academy Mustangs", "Ravenwood Raptors",
  "Northwestern Bulls", "Columbus Explorers", "Dillard Panthers", "Booker T. Washington Tornadoes", "Miami Palmetto Panthers",
  "Cass Tech Technicians", "Belleville Tigers", "West Bloomfield Lakers", "De La Salle Collegiate Pilots", "Rockford Rams",
  "Cherry Creek Bruins", "Valor Christian Eagles", "Grandview Wolves", "Ralston Valley Mustangs", "Columbine Rebels"
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