export function generateTeamCode(): string {
  // Avoid confusing characters: 0, O, I, 1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  // Generate format: ABC-123 (avoiding 0 and O)
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * 24)); // Letters only (excluding I and O)
  }
  
  result += '-';
  
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * 8) + 24); // Numbers only (excluding 0 and 1)
  }
  
  return result;
}

export function isCodeUnique(code: string, existingTeams: Record<string, any>): boolean {
  return !Object.values(existingTeams).some((team: any) => team.code === code);
}

export function generateUniqueTeamCode(existingTeams: Record<string, any>): string {
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateTeamCode();
    attempts++;
  } while (!isCodeUnique(code, existingTeams) && attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    // Fallback with timestamp
    code = generateTeamCode() + '-' + Date.now().toString().slice(-3);
  }
  
  return code;
}