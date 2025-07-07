// Input validation utilities
export const ValidationRules = {
  tournament: {
    name: {
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_]+$/
    },
    settings: {
      lobbies: { min: 1, max: 10 },
      totalMatches: { min: 1, max: 20 },
      countedMatches: { min: 1, max: 20 },
      slotsPerLobby: { min: 1, max: 100 }
    }
  },
  
  team: {
    name: {
      minLength: 1,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9\s\-_]+$/
    },
    code: {
      length: 7,
      pattern: /^[A-Z]{3}-[0-9]{3}$/
    }
  },
  
  match: {
    position: { min: 1, max: 100 },
    kills: { min: 0, max: 100 },
    photos: { min: 1, max: 5 }
  },
  
  manager: {
    name: {
      minLength: 1,
      maxLength: 50,
      pattern: /^[a-zA-Z\s\-_]+$/
    },
    code: {
      minLength: 6,
      maxLength: 20,
      pattern: /^[A-Z0-9\-]+$/
    }
  }
};

export function validateTournamentName(name: string): boolean {
  const rules = ValidationRules.tournament.name;
  return name.length >= rules.minLength && 
         name.length <= rules.maxLength && 
         rules.pattern.test(name);
}

export function validateTeamCode(code: string): boolean {
  const rules = ValidationRules.team.code;
  return code.length === rules.length && rules.pattern.test(code);
}

export function validateMatchData(position: number, kills: number, photos: string[]): boolean {
  const positionValid = position >= ValidationRules.match.position.min && 
                       position <= ValidationRules.match.position.max;
  const killsValid = kills >= ValidationRules.match.kills.min && 
                    kills <= ValidationRules.match.kills.max;
  const photosValid = photos.length >= ValidationRules.match.photos.min && 
                     photos.length <= ValidationRules.match.photos.max;
  
  return positionValid && killsValid && photosValid;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordPattern.test(password);
}