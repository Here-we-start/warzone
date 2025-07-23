import React, { useState, useEffect } from 'react';
import { Users, Trophy, Settings, Download, Image, RotateCcw, Sliders, Clock, Key, Bell, AlertTriangle, Menu, X, Archive, UserPlus, Eye, Shield, Plus, Copy, Tv, Target } from 'lucide-react';
import GlassPanel from './GlassPanel';
import TournamentCreator from './TournamentCreator';
import MultiplierSettings from './MultiplierSettings';
import PendingSubmissions from './PendingSubmissions';
import TeamCodeDisplay from './TeamCodeDisplay';
import PenaltiesRewards from './PenaltiesRewards';
import ManagerManagement from './ManagerManagement';
import AuditLogViewer from './AuditLogViewer';
import TournamentArchive from './TournamentArchive';
import TournamentManagement from './TournamentManagement';
import OBSPluginManager from './OBSPluginManager';
import ManualScoreAssignment from './ManualScoreAssignment';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Team, Match, TeamStats, PendingSubmission, ScoreAdjustment, Manager, AuditLog, Tournament } from '../types';
import { generateUniqueTeamCode } from '../utils/teamCodeGenerator';
import { logAction } from '../utils/auditLogger';
import ApiService from '../services/api';
import html2canvas from 'html2canvas';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'teams' | 'scores' | 'pending' | 'adjustments' | 'managers' | 'audit' | 'archive'>('tournaments');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [showTournamentCreator, setShowTournamentCreator] = useState(false);
  const [teams, setTeams] = useRealTimeData<Record<string, Team>>('teams', {});
  const [matches, setMatches] = useRealTimeData<Match[]>('matches', []);
  const [pendingSubmissions, setPendingSubmissions] = useRealTimeData<PendingSubmission[]>('pendingSubmissions', []);
  const [scoreAdjustments, setScoreAdjustments] = useRealTimeData<ScoreAdjustment[]>('scoreAdjustments', []);
  const [managers, setManagers] = useRealTimeData<Record<string, Manager>>('managers', {});
  const [auditLogs, setAuditLogs] = useRealTimeData<AuditLog[]>('auditLogs', []);
  const [tournaments, setTournaments] = useRealTimeData<Record<string, Tournament>>('tournaments', {});
  const [multipliers, setMultipliers] = useRealTimeData('multipliers', {
    1: 2.0, 2: 1.8, 3: 1.8, 4: 1.6, 5: 1.6, 6: 1.6,
    7: 1.4, 8: 1.4, 9: 1.4, 10: 1.4, 11: 1.0, 12: 1.0,
    13: 1.0, 14: 1.0, 15: 1.0, 16: 1.0, 17: 1.0, 18: 1.0,
    19: 1.0, 20: 1.0
  });
  const [showMultiplierSettings, setShowMultiplierSettings] = useState(false);
  const [showTeamCode, setShowTeamCode] = useState<{ name: string; code: string } | null>(null);
  const [showLoginCodes, setShowLoginCodes] = useState(false);
  const [showOBSPlugin, setShowOBSPlugin] = useState(false);
  const [showScoreAssignment, setShowScoreAssignment] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ✅ FUNZIONE DI DEBUG TEMPORANEA
  const debugDatabaseConnection = async () => {
    console.log('🔍 [DEBUG] === DIAGNOSTICA COMPLETA DATABASE ===');
    
    // Test 1: Verifica esistenza ApiService
    console.log('🔍 [DEBUG] 1. ApiService disponibile:', typeof ApiService);
    console.log('🔍 [DEBUG] 2. getAllTeams disponibile:', typeof ApiService?.getAllTeams);
    
    // Test 2: Prova chiamata diretta
    if (typeof ApiService?.getAllTeams === 'function') {
      try {
        console.log('🔍 [DEBUG] 3. Chiamata diretta getAllTeams...');
        const result = await ApiService.getAllTeams();
        console.log('🔍 [DEBUG] 4. Risultato RAW:', result);
        console.log('🔍 [DEBUG] 5. Tipo risultato:', typeof result);
        console.log('🔍 [DEBUG] 6. È array?', Array.isArray(result));
        console.log('🔍 [DEBUG] 7. Chiavi oggetto:', Object.keys(result || {}));
        
        // Test proprietà specifiche
        if (result && typeof result === 'object') {
          console.log('🔍 [DEBUG] 8. Proprietà .teams:', result.teams);
          console.log('🔍 [DEBUG] 9. Proprietà .data:', result.data);
          
          if (Array.isArray(result)) {
            console.log('🔍 [DEBUG] 10. Lunghezza array:', result.length);
            if (result.length > 0) {
              console.log('🔍 [DEBUG] 11. Primo elemento:', result[0]);
            }
          }
        }
      } catch (error) {
        console.error('🔍 [DEBUG] 12. ERRORE chiamata:', error);
      }
    }
    
    // Test 3: Verifica localStorage
    const localTeams = localStorage.getItem('teams');
    console.log('🔍 [DEBUG] 13. localStorage teams:', localTeams ? JSON.parse(localTeams) : 'VUOTO');
    
    console.log('🔍 [DEBUG] === FINE DIAGNOSTICA ===');
  };

  // ✅ SISTEMA COMPLETO DI CARICAMENTO MULTI-DISPOSITIVO CON FIX TEAMS
  useEffect(() => {
    const loadAllDataWithMultiDeviceSync = async () => {
      try {
        console.log('🔄 [MULTI-DEVICE] Starting complete data synchronization...');
        setIsInitialLoading(true);
        
        // Check if ApiService exists
        if (typeof ApiService?.getAllTournaments === 'function') {
          try {
            console.log('📡 [MULTI-DEVICE] Loading ALL data from database for multi-device sync...');
            
            // LOAD ALL DATA FROM DATABASE SIMULTANEOUSLY
            const [
              dbTournaments,
              dbTeams,
              dbMatches,
              dbPendingSubmissions,
              dbScoreAdjustments,
              dbManagers,
              dbAuditLogs
            ] = await Promise.allSettled([
              ApiService.getAllTournaments?.() || Promise.resolve({}),
              ApiService.getAllTeams?.() || Promise.resolve({}),
              ApiService.getAllMatches?.() || Promise.resolve([]),
              ApiService.getAllPendingSubmissions?.() || Promise.resolve([]),
              ApiService.getAllScoreAdjustments?.() || Promise.resolve([]),
              ApiService.getAllManagers?.() || Promise.resolve({}),
              ApiService.getAllAuditLogs?.() || Promise.resolve([])
            ]);

            console.log('📊 [MULTI-DEVICE] Database responses received, processing...');

            // Process each result with detailed logging
            const processResult = (result: PromiseSettledResult<any>, name: string, isArray: boolean = false) => {
              if (result.status === 'fulfilled' && result.value) {
                const count = isArray ? result.value.length : Object.keys(result.value).length;
                console.log(`✅ [MULTI-DEVICE] ${name} loaded from database:`, count, 'items');
                return result.value;
              } else {
                console.warn(`⚠️ [MULTI-DEVICE] ${name} failed:`, result.status === 'rejected' ? result.reason?.message : 'No data');
                return isArray ? [] : {};
              }
            };

            // Extract and process all data
            const tournamentsFromDB = processResult(dbTournaments, 'Tournaments');
            
            // ✅ ENHANCED TEAMS PROCESSING WITH COMPREHENSIVE FORMAT HANDLING
            const teamsFromDB = (() => {
              const rawTeams = processResult(dbTeams, 'Teams');
              console.log('🔧 [TEAMS-SYNC] Raw teams from database:', rawTeams);
              
              // Handle different API response formats
              let teamsData = rawTeams;
              
              // Case 1: Response is wrapped (e.g., { teams: [...] } or { data: [...] })
              if (teamsData && typeof teamsData === 'object') {
                if (teamsData.teams && Array.isArray(teamsData.teams)) {
                  console.log('📦 [TEAMS-SYNC] Found teams in .teams property');
                  teamsData = teamsData.teams;
                } else if (teamsData.data && Array.isArray(teamsData.data)) {
                  console.log('📦 [TEAMS-SYNC] Found teams in .data property');
                  teamsData = teamsData.data;
                } else if (Array.isArray(teamsData)) {
                  console.log('📦 [TEAMS-SYNC] Teams data is direct array');
                } else if (!Array.isArray(teamsData) && Object.keys(teamsData).length > 0) {
                  console.log('📦 [TEAMS-SYNC] Teams data is already object format');
                  return teamsData;
                }
              }
              
              // Case 2: Convert array to object with smart key detection
              if (Array.isArray(teamsData) && teamsData.length > 0) {
                console.log(`🔄 [TEAMS-SYNC] Converting ${teamsData.length} teams from array to object`);
                
                const teamsObject = teamsData.reduce((acc: any, team: any) => {
                  console.log('🔍 [TEAMS-SYNC] Processing team:', team);
                  
                  // Smart key generation with multiple fallbacks
                  const possibleKeys = [
                    team.slotId,
                    team.lobby,
                    team._id,
                    team.id,
                    // Generate key from tournament + lobby + slot
                    team.tournamentId && team.lobbyNumber && team.slotNumber 
                      ? `${team.tournamentId}-Lobby${team.lobbyNumber}-Slot${team.slotNumber}`
                      : null,
                    team.tournamentId && team.lobbyNumber 
                      ? `${team.tournamentId}-Lobby${team.lobbyNumber}-Slot1`
                      : null,
                    // Fallback to code-based key
                    team.code ? `team-${team.code}` : null
                  ].filter(Boolean);
                  
                  const finalKey = possibleKeys[0];
                  
                  if (finalKey && team.code && team.name) {
                    console.log(`✅ [TEAMS-SYNC] Adding team "${team.name}" with key: ${finalKey}`);
                    
                    acc[finalKey] = {
                      ...team,
                      // Ensure required fields exist
                      id: team.id || finalKey,
                      slotId: team.slotId || finalKey,
                      lobby: team.lobby || finalKey,
                      // Preserve MongoDB _id if exists
                      ...(team._id && { _id: team._id })
                    };
                  } else {
                    console.warn('⚠️ [TEAMS-SYNC] Skipping invalid team - missing required fields:', {
                      key: finalKey,
                      code: team.code,
                      name: team.name,
                      team: team
                    });
                  }
                  
                  return acc;
                }, {});
                
                console.log(`✅ [TEAMS-SYNC] Successfully converted to object with ${Object.keys(teamsObject).length} teams`);
                return teamsObject;
              }
              
              // Case 3: Empty or invalid data
              console.log('📭 [TEAMS-SYNC] No valid teams data found, returning empty object');
              return {};
            })();

            console.log('📊 [TEAMS-SYNC] Final teams object:', teamsFromDB);
            console.log('📊 [TEAMS-SYNC] Teams count from DB:', Object.keys(teamsFromDB).length);

            const matchesFromDB = processResult(dbMatches, 'Matches', true);
            const pendingFromDB = processResult(dbPendingSubmissions, 'Pending Submissions', true);
            const adjustmentsFromDB = processResult(dbScoreAdjustments, 'Score Adjustments', true);
            const managersFromDB = processResult(dbManagers, 'Managers');
            const auditLogsFromDB = processResult(dbAuditLogs, 'Audit Logs', true);

            // ✅ ENHANCED DATA VALIDATION CHECK
            const hasValidData = (
              Object.keys(tournamentsFromDB).length > 0 ||
              Object.keys(teamsFromDB).length > 0 ||
              matchesFromDB.length > 0 ||
              pendingFromDB.length > 0 ||
              adjustmentsFromDB.length > 0 ||
              Object.keys(managersFromDB).length > 0 ||
              auditLogsFromDB.length > 0
            );

            console.log('🔍 [TEAMS-SYNC] Data validation result:', {
              hasValidData,
              tournaments: Object.keys(tournamentsFromDB).length,
              teams: Object.keys(teamsFromDB).length,
              matches: matchesFromDB.length,
              pending: pendingFromDB.length,
              adjustments: adjustmentsFromDB.length,
              managers: Object.keys(managersFromDB).length,
              auditLogs: auditLogsFromDB.length
            });

            if (hasValidData) {
              console.log('✅ [MULTI-DEVICE] Database contains data - updating all application states');
              
              // Update ALL states with database data (PRIORITY)
              setTournaments(tournamentsFromDB);
              
              // ✅ POST-LOAD VERIFICATION AND FALLBACK FOR TEAMS
              console.log('🔧 [TEAMS-SYNC] Setting teams state with:', Object.keys(teamsFromDB).length, 'teams');
              setTeams(teamsFromDB);

              setMatches(matchesFromDB);
              setPendingSubmissions(pendingFromDB);
              setScoreAdjustments(adjustmentsFromDB);
              setManagers(managersFromDB);
              setAuditLogs(auditLogsFromDB);

              // Update localStorage with fresh database data for offline access
              localStorage.setItem('tournaments', JSON.stringify(tournamentsFromDB));
              localStorage.setItem('teams', JSON.stringify(teamsFromDB));
              localStorage.setItem('matches', JSON.stringify(matchesFromDB));
              localStorage.setItem('pendingSubmissions', JSON.stringify(pendingFromDB));
              localStorage.setItem('scoreAdjustments', JSON.stringify(adjustmentsFromDB));
              localStorage.setItem('managers', JSON.stringify(managersFromDB));
              localStorage.setItem('auditLogs', JSON.stringify(auditLogsFromDB));

              // ✅ VERIFY TEAMS LOADED CORRECTLY AND ADD FALLBACK MECHANISM
              setTimeout(() => {
                console.log('🔍 [TEAMS-SYNC] Post-load verification...');
                
                const currentLocalStorage = localStorage.getItem('teams');
                const currentState = teamsFromDB;
                
                if (currentLocalStorage) {
                  try {
                    const localTeams = JSON.parse(currentLocalStorage);
                    const localCount = Object.keys(localTeams).length;
                    const stateCount = Object.keys(currentState).length;
                    
                    console.log('📊 [TEAMS-SYNC] Comparison:', {
                      localStorage: localCount,
                      currentState: stateCount,
                      shouldSync: localCount > stateCount
                    });
                    
                    // If localStorage has more teams than what we loaded from DB
                    if (localCount > stateCount && localCount > 0) {
                      console.log('🔄 [TEAMS-SYNC] localStorage has more teams, using as fallback');
                      setTeams(localTeams);
                      
                      // Try to sync the missing teams to database in background
                      setTimeout(async () => {
                        if (typeof ApiService?.syncAllData === 'function') {
                          try {
                            console.log('📡 [TEAMS-SYNC] Syncing localStorage teams to database...');
                            await ApiService.syncAllData({
                              tournaments: tournamentsFromDB,
                              teams: localTeams,
                              matches: matchesFromDB,
                              pendingSubmissions: pendingFromDB,
                              scoreAdjustments: adjustmentsFromDB,
                              managers: managersFromDB,
                              auditLogs: auditLogsFromDB
                            });
                            console.log('✅ [TEAMS-SYNC] Background sync completed');
                          } catch (syncError: any) {
                            console.warn('⚠️ [TEAMS-SYNC] Background sync failed:', syncError.message);
                          }
                        }
                      }, 1000);
                    }
                  } catch (parseError) {
                    console.error('❌ [TEAMS-SYNC] Failed to parse localStorage teams:', parseError);
                  }
                }
              }, 500); // Check after 500ms

              console.log('✅ [MULTI-DEVICE] Complete multi-device sync successful!');
              console.log('📊 [MULTI-DEVICE] Final data summary:', {
                tournaments: Object.keys(tournamentsFromDB).length,
                teams: Object.keys(teamsFromDB).length,
                matches: matchesFromDB.length,
                pendingSubmissions: pendingFromDB.length,
                scoreAdjustments: adjustmentsFromDB.length,
                managers: Object.keys(managersFromDB).length,
                auditLogs: auditLogsFromDB.length
              });
              
              setIsInitialLoading(false);
              return; // SUCCESS - database data loaded
            } else {
              console.log('📭 [MULTI-DEVICE] Database is empty, checking localStorage fallback...');
            }
          } catch (dbError: any) {
            console.warn('⚠️ [MULTI-DEVICE] Database connection failed, using localStorage fallback:', dbError.message);
          }
        } else {
          console.log('⚠️ [MULTI-DEVICE] ApiService not available, using localStorage fallback');
        }

        // FALLBACK: Load from localStorage if database fails or is empty
        console.log('📂 [MULTI-DEVICE] Loading from localStorage fallback...');
        
        const localTournaments = localStorage.getItem('tournaments');
        const localTeams = localStorage.getItem('teams');
        const localMatches = localStorage.getItem('matches');
        const localPendingSubmissions = localStorage.getItem('pendingSubmissions');
        const localScoreAdjustments = localStorage.getItem('scoreAdjustments');
        const localManagers = localStorage.getItem('managers');
        const localAuditLogs = localStorage.getItem('auditLogs');

        let hasLocalData = false;

        // Load each data type from localStorage
        if (localTournaments) {
          try {
            const parsed = JSON.parse(localTournaments);
            setTournaments(parsed);
            hasLocalData = true;
            console.log('📂 [MULTI-DEVICE] Tournaments loaded from localStorage:', Object.keys(parsed).length);
          } catch (e) { console.warn('⚠️ Failed to parse tournaments from localStorage'); }
        }

        if (localTeams) {
          try {
            const parsed = JSON.parse(localTeams);
            setTeams(parsed);
            hasLocalData = true;
            console.log('📂 [MULTI-DEVICE] Teams loaded from localStorage:', Object.keys(parsed).length);
          } catch (e) { console.warn('⚠️ Failed to parse teams from localStorage'); }
        }

        if (localMatches) {
          try {
            const parsed = JSON.parse(localMatches);
            setMatches(parsed);
            hasLocalData = true;
            console.log('📂 [MULTI-DEVICE] Matches loaded from localStorage:', parsed.length);
          } catch (e) { console.warn('⚠️ Failed to parse matches from localStorage'); }
        }

        if (localPendingSubmissions) {
          try {
            const parsed = JSON.parse(localPendingSubmissions);
            setPendingSubmissions(parsed);
            hasLocalData = true;
            console.log('📂 [MULTI-DEVICE] Pending submissions loaded from localStorage:', parsed.length);
          } catch (e) { console.warn('⚠️ Failed to parse pending submissions from localStorage'); }
        }

        if (localScoreAdjustments) {
          try {
            const parsed = JSON.parse(localScoreAdjustments);
            setScoreAdjustments(parsed);
            hasLocalData = true;
            console.log('📂 [MULTI-DEVICE] Score adjustments loaded from localStorage:', parsed.length);
          } catch (e) { console.warn('⚠️ Failed to parse score adjustments from localStorage'); }
        }

        if (localManagers) {
          try {
            const parsed = JSON.parse(localManagers);
            setManagers(parsed);
            hasLocalData = true;
            console.log('📂 [MULTI-DEVICE] Managers loaded from localStorage:', Object.keys(parsed).length);
          } catch (e) { console.warn('⚠️ Failed to parse managers from localStorage'); }
        }

        if (localAuditLogs) {
          try {
            const parsed = JSON.parse(localAuditLogs);
            setAuditLogs(parsed);
            hasLocalData = true;
            console.log('📂 [MULTI-DEVICE] Audit logs loaded from localStorage:', parsed.length);
          } catch (e) { console.warn('⚠️ Failed to parse audit logs from localStorage'); }
        }

        if (hasLocalData) {
          console.log('✅ [MULTI-DEVICE] Fallback data loaded from localStorage');
          
          // Try to sync localStorage data to database in background (for offline-first scenarios)
          if (typeof ApiService?.syncAllData === 'function') {
            console.log('🔄 [MULTI-DEVICE] Attempting background sync of local data to database...');
            setTimeout(async () => {
              try {
                const allLocalData = {
                  tournaments: localTournaments ? JSON.parse(localTournaments) : {},
                  teams: localTeams ? JSON.parse(localTeams) : {},
                  matches: localMatches ? JSON.parse(localMatches) : [],
                  pendingSubmissions: localPendingSubmissions ? JSON.parse(localPendingSubmissions) : [],
                  scoreAdjustments: localScoreAdjustments ? JSON.parse(localScoreAdjustments) : [],
                  managers: localManagers ? JSON.parse(localManagers) : {},
                  auditLogs: localAuditLogs ? JSON.parse(localAuditLogs) : []
                };
                
                await ApiService.syncAllData(allLocalData);
                console.log('✅ [MULTI-DEVICE] Background sync to database completed');
              } catch (syncError: any) {
                console.warn('⚠️ [MULTI-DEVICE] Background sync failed:', syncError.message);
              }
            }, 3000); // Wait 3 seconds before attempting background sync
          }
        } else {
          console.log('📭 [MULTI-DEVICE] No data found - fresh installation');
        }
        
        setIsInitialLoading(false);
        
      } catch (error: any) {
        console.error('❌ [MULTI-DEVICE] Critical error during data loading:', error);
        setIsInitialLoading(false);
      }
    };

    loadAllDataWithMultiDeviceSync();
  }, []); // Run once on component mount

  // ✅ HOOK DEDICATO PER SINCRONIZZAZIONE TEAMS TRA DISPOSITIVI
  useEffect(() => {
    const syncTeamsAcrossDevices = async () => {
      if (typeof ApiService?.getAllTeams === 'function') {
        try {
          console.log('🔄 [DEVICE-SYNC] Syncing teams across devices...');
          const serverTeams = await ApiService.getAllTeams();
          
          if (serverTeams) {
            // Gestisce diversi formati di risposta
            let teamsData = serverTeams;
            if (serverTeams.teams) teamsData = serverTeams.teams;
            if (serverTeams.data) teamsData = serverTeams.data;
            
            // Converte array in oggetto se necessario
            if (Array.isArray(teamsData)) {
              const teamsObject = teamsData.reduce((acc, team) => {
                const key = team.slotId || team._id?.toString() || `team-${team.code}`;
                if (key && team.code) {
                  acc[key] = { 
                    ...team, 
                    id: team._id?.toString() || key,
                    slotId: team.slotId || key 
                  };
                }
                return acc;
              }, {});
              
              // Aggiorna solo se ci sono cambiamenti
              const currentTeamsStr = JSON.stringify(teams);
              const newTeamsStr = JSON.stringify(teamsObject);
              
              if (currentTeamsStr !== newTeamsStr) {
                console.log('✅ [DEVICE-SYNC] Teams updated:', Object.keys(teamsObject).length);
                setTeams(teamsObject);
                localStorage.setItem('teams', JSON.stringify(teamsObject));
              }
            } else if (typeof teamsData === 'object') {
              const currentTeamsStr = JSON.stringify(teams);
              const newTeamsStr = JSON.stringify(teamsData);
              
              if (currentTeamsStr !== newTeamsStr) {
                console.log('✅ [DEVICE-SYNC] Teams updated:', Object.keys(teamsData).length);
                setTeams(teamsData);
                localStorage.setItem('teams', JSON.stringify(teamsData));
              }
            }
          }
        } catch (error) {
          console.log('⚠️ [DEVICE-SYNC] Sync failed (offline?):', error.message);
        }
      }
    };
    
    // Sincronizza all'avvio immediatamente
    syncTeamsAcrossDevices();
    
    // E poi ogni 10 secondi per aggiornamenti in tempo reale
    const interval = setInterval(syncTeamsAcrossDevices, 10000);
    
    return () => clearInterval(interval);
  }, []); // Esegui solo una volta all'avvio

  // ✅ SINCRONIZZAZIONE PERIODICA MIGLIORATA CON TEAMS FIX
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;

    if (typeof ApiService?.getAllTournaments === 'function') {
      console.log('🔄 [MULTI-DEVICE] Setting up periodic sync for real-time multi-device updates...');
      
      syncInterval = setInterval(async () => {
        try {
          console.log('🔄 [MULTI-DEVICE] Periodic sync check...');
          
          // Check for updates in all data types
          const [newTournaments, newTeams, newMatches, newPending, newAdjustments, newManagers] = await Promise.allSettled([
            ApiService.getAllTournaments?.() || Promise.resolve({}),
            ApiService.getAllTeams?.() || Promise.resolve({}),
            ApiService.getAllMatches?.() || Promise.resolve([]),
            ApiService.getAllPendingSubmissions?.() || Promise.resolve([]),
            ApiService.getAllScoreAdjustments?.() || Promise.resolve([]),
            ApiService.getAllManagers?.() || Promise.resolve({})
          ]);

          let hasChanges = false;

          // Check tournaments for changes
          if (newTournaments.status === 'fulfilled' && newTournaments.value) {
            const currentTournamentsStr = JSON.stringify(tournaments);
            const newTournamentsStr = JSON.stringify(newTournaments.value);
            
            if (currentTournamentsStr !== newTournamentsStr) {
              console.log('🔄 [MULTI-DEVICE] Tournament changes detected');
              setTournaments(newTournaments.value);
              localStorage.setItem('tournaments', newTournamentsStr);
              hasChanges = true;
            }
          }

          // ✅ ENHANCED TEAMS SYNC CHECK WITH PROCESSING
          if (newTeams.status === 'fulfilled' && newTeams.value) {
            // Process teams with the same logic as initial load
            const processedTeams = (() => {
              let teamsData = newTeams.value;
              
              // Handle wrapped responses
              if (teamsData && typeof teamsData === 'object') {
                if (teamsData.teams && Array.isArray(teamsData.teams)) {
                  teamsData = teamsData.teams;
                } else if (teamsData.data && Array.isArray(teamsData.data)) {
                  teamsData = teamsData.data;
                } else if (!Array.isArray(teamsData) && Object.keys(teamsData).length > 0) {
                  return teamsData;
                }
              }
              
              // Convert array to object if needed
              if (Array.isArray(teamsData) && teamsData.length > 0) {
                return teamsData.reduce((acc: any, team: any) => {
                  const possibleKeys = [
                    team.slotId,
                    team.lobby,
                    team._id,
                    team.id,
                    team.tournamentId && team.lobbyNumber 
                      ? `${team.tournamentId}-Lobby${team.lobbyNumber}-Slot${team.slotNumber || 1}`
                      : null,
                    team.code ? `team-${team.code}` : null
                  ].filter(Boolean);
                  
                  const finalKey = possibleKeys[0];
                  if (finalKey && team.code && team.name) {
                    acc[finalKey] = {
                      ...team,
                      id: team.id || finalKey,
                      slotId: team.slotId || finalKey,
                      lobby: team.lobby || finalKey,
                      ...(team._id && { _id: team._id })
                    };
                  }
                  return acc;
                }, {});
              }
              
              return {};
            })();

            const currentTeamsStr = JSON.stringify(teams);
            const newTeamsStr = JSON.stringify(processedTeams);
            
            if (currentTeamsStr !== newTeamsStr) {
              console.log('🔄 [MULTI-DEVICE] Team changes detected');
              setTeams(processedTeams);
              localStorage.setItem('teams', newTeamsStr);
              hasChanges = true;
            }
          }

          // Check matches for changes
          if (newMatches.status === 'fulfilled' && newMatches.value) {
            const currentMatchesStr = JSON.stringify(matches);
            const newMatchesStr = JSON.stringify(newMatches.value);
            
            if (currentMatchesStr !== newMatchesStr) {
              console.log('🔄 [MULTI-DEVICE] Match changes detected');
              setMatches(newMatches.value);
              localStorage.setItem('matches', newMatchesStr);
              hasChanges = true;
            }
          }

          // Check pending submissions for changes
          if (newPending.status === 'fulfilled' && newPending.value) {
            const currentPendingStr = JSON.stringify(pendingSubmissions);
            const newPendingStr = JSON.stringify(newPending.value);
            
            if (currentPendingStr !== newPendingStr) {
              console.log('🔄 [MULTI-DEVICE] Pending submission changes detected');
              setPendingSubmissions(newPending.value);
              localStorage.setItem('pendingSubmissions', newPendingStr);
              hasChanges = true;
            }
          }

          // Check score adjustments for changes
          if (newAdjustments.status === 'fulfilled' && newAdjustments.value) {
            const currentAdjustmentsStr = JSON.stringify(scoreAdjustments);
            const newAdjustmentsStr = JSON.stringify(newAdjustments.value);
            
            if (currentAdjustmentsStr !== newAdjustmentsStr) {
              console.log('🔄 [MULTI-DEVICE] Score adjustment changes detected');
              setScoreAdjustments(newAdjustments.value);
              localStorage.setItem('scoreAdjustments', newAdjustmentsStr);
              hasChanges = true;
            }
          }

          // Check managers for changes
          if (newManagers.status === 'fulfilled' && newManagers.value) {
            const currentManagersStr = JSON.stringify(managers);
            const newManagersStr = JSON.stringify(newManagers.value);
            
            if (currentManagersStr !== newManagersStr) {
              console.log('🔄 [MULTI-DEVICE] Manager changes detected');
              setManagers(newManagers.value);
              localStorage.setItem('managers', newManagersStr);
              hasChanges = true;
            }
          }

          if (hasChanges) {
            console.log('✅ [MULTI-DEVICE] Data synchronized across devices');
          }
          
        } catch (error: any) {
          console.log('⚠️ [MULTI-DEVICE] Periodic sync failed (probably offline):', error.message);
        }
      }, 15000); // Sync every 15 seconds for better real-time experience
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
        console.log('🔄 [MULTI-DEVICE] Periodic sync stopped');
      }
    };
  }, [tournaments, teams, matches, pendingSubmissions, scoreAdjustments, managers]); // Re-run when any data changes

  // ✅ USEEFFECT DI DEBUG
  useEffect(() => {
    // Debug automatico dopo 2 secondi
    const debugTimer = setTimeout(() => {
      debugDatabaseConnection();
    }, 2000);
    
    return () => clearTimeout(debugTimer);
  }, []); // Esegui solo una volta

  // ✅ APPROVE SUBMISSION WITH MULTI-DEVICE SYNC
  const approveSubmission = async (submissionId: string) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    const multiplier = multipliers[submission.position] || 1;
    const score = submission.kills * multiplier;

    const newMatch: Match = {
      id: `${submission.teamCode}-${Date.now()}`,
      position: submission.position,
      kills: submission.kills,
      score,
      teamCode: submission.teamCode,
      photos: submission.photos,
      status: 'approved',
      submittedAt: submission.submittedAt,
      reviewedAt: Date.now(),
      reviewedBy: 'admin',
      tournamentId: submission.tournamentId
    };

    console.log('🔄 [MULTI-DEVICE] Approving submission with database sync...');

    try {
      // Update database first
      if (typeof ApiService?.createMatch === 'function') {
        await ApiService.createMatch(newMatch);
        console.log('✅ [MULTI-DEVICE] Match created in database');
      }

      if (typeof ApiService?.deletePendingSubmission === 'function') {
        await ApiService.deletePendingSubmission(submissionId);
        console.log('✅ [MULTI-DEVICE] Pending submission removed from database');
      }

      // Update local state
      setMatches(prev => [...prev, newMatch]);
      setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));

      // Update localStorage
      const updatedMatches = [...matches, newMatch];
      const updatedPending = pendingSubmissions.filter(s => s.id !== submissionId);
      localStorage.setItem('matches', JSON.stringify(updatedMatches));
      localStorage.setItem('pendingSubmissions', JSON.stringify(updatedPending));

      console.log('✅ [MULTI-DEVICE] Submission approval synced across all devices');

    } catch (error: any) {
      console.warn('⚠️ [MULTI-DEVICE] Database sync failed, updating locally:', error.message);
      
      // Fallback: update locally even if database fails
      setMatches(prev => [...prev, newMatch]);
      setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));
    }

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'SUBMISSION_APPROVED',
      `Sottomissione approvata per ${submission.teamName}: ${submission.position}° posto, ${submission.kills} kills`,
      'admin',
      'admin',
      { teamCode: submission.teamCode, submissionId, tournamentId: submission.tournamentId }
    );
  };

  // ✅ REJECT SUBMISSION WITH MULTI-DEVICE SYNC
  const rejectSubmission = async (submissionId: string) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    console.log('🔄 [MULTI-DEVICE] Rejecting submission with database sync...');

    try {
      // Update database first
      if (typeof ApiService?.deletePendingSubmission === 'function') {
        await ApiService.deletePendingSubmission(submissionId);
        console.log('✅ [MULTI-DEVICE] Pending submission rejected in database');
      }

      // Update local state
      setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));

      // Update localStorage
      const updatedPending = pendingSubmissions.filter(s => s.id !== submissionId);
      localStorage.setItem('pendingSubmissions', JSON.stringify(updatedPending));

      console.log('✅ [MULTI-DEVICE] Submission rejection synced across all devices');

    } catch (error: any) {
      console.warn('⚠️ [MULTI-DEVICE] Database sync failed, updating locally:', error.message);
      
      // Fallback: update locally even if database fails
      setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));
    }

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'SUBMISSION_REJECTED',
      `Sottomissione rifiutata per ${submission.teamName}`,
      'admin',
      'admin',
      { teamCode: submission.teamCode, submissionId, tournamentId: submission.tournamentId }
    );
  };

  // ✅ NUOVE FUNZIONI PER ASSEGNAZIONE PUNTEGGI MANUALE

  // Handle manual score update
  const handleManualScoreUpdate = async (teamCode: string, matchNumber: number, scoreData: any) => {
    try {
      console.log('🎯 [MANUAL-SCORE] Updating score:', { teamCode, matchNumber, scoreData });
      
      // Check if match already exists
      const existingMatchIndex = matches.findIndex(m => 
        m.teamCode === teamCode && 
        (m.matchNumber === matchNumber || (!m.matchNumber && matches.filter(x => x.teamCode === teamCode).indexOf(m) === matchNumber - 1))
      );

      if (existingMatchIndex >= 0) {
        // Update existing match
        const updatedMatch = { ...matches[existingMatchIndex], ...scoreData };
        
        if (typeof ApiService?.updateMatch === 'function') {
          await ApiService.updateMatch(updatedMatch.id, updatedMatch);
        }
        
        setMatches(prev => {
          const updated = [...prev];
          updated[existingMatchIndex] = updatedMatch;
          return updated;
        });
        
        console.log('✅ [MANUAL-SCORE] Match updated successfully');
      } else {
        // Create new match
        const newMatch = {
          ...scoreData,
          id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        
        if (typeof ApiService?.createMatch === 'function') {
          await ApiService.createMatch(newMatch);
        }
        
        setMatches(prev => [...prev, newMatch]);
        
        console.log('✅ [MANUAL-SCORE] New match created successfully');
      }

      // Update localStorage
      const updatedMatches = existingMatchIndex >= 0 
        ? matches.map((m, i) => i === existingMatchIndex ? { ...m, ...scoreData } : m)
        : [...matches, { ...scoreData, id: `manual-${Date.now()}` }];
      
      localStorage.setItem('matches', JSON.stringify(updatedMatches));

      // Log action
      logAction(
        auditLogs,
        setAuditLogs,
        'MANUAL_SCORE_ASSIGNMENT',
        `Punteggio assegnato manualmente a ${teamCode}: ${scoreData.position}° posto, ${scoreData.kills} kills, ${scoreData.score} punti`,
        'admin',
        'admin',
        { teamCode, matchNumber, tournamentId: selectedTournament }
      );

    } catch (error: any) {
      console.error('❌ [MANUAL-SCORE] Error updating score:', error);
      alert('Errore nel salvataggio del punteggio: ' + error.message);
    }
  };

  // Handle score deletion
  const handleManualScoreDelete = async (matchId: string) => {
    try {
      console.log('🗑️ [MANUAL-SCORE] Deleting match:', matchId);
      
      if (typeof ApiService?.deleteMatch === 'function') {
        await ApiService.deleteMatch(matchId);
      }
      
      setMatches(prev => prev.filter(m => m.id !== matchId));
      
      // Update localStorage
      const updatedMatches = matches.filter(m => m.id !== matchId);
      localStorage.setItem('matches', JSON.stringify(updatedMatches));
      
      console.log('✅ [MANUAL-SCORE] Match deleted successfully');
      
      // Log action
      logAction(
        auditLogs,
        setAuditLogs,
        'MANUAL_SCORE_DELETION',
        `Punteggio eliminato manualmente: ${matchId}`,
        'admin',
        'admin',
        { matchId, tournamentId: selectedTournament }
      );

    } catch (error: any) {
      console.error('❌ [MANUAL-SCORE] Error deleting score:', error);
      alert('Errore nell\'eliminazione del punteggio: ' + error.message);
    }
  };

  // Handle multiplier update
  const handleMultiplierUpdate = async (newMultipliers: Record<number, number>) => {
    try {
      console.log('🔢 [MULTIPLIERS] Updating multipliers:', newMultipliers);
      
      // Update local state
      setMultipliers(newMultipliers);
      
      // Update localStorage
      localStorage.setItem('multipliers', JSON.stringify(newMultipliers));
      
      console.log('✅ [MULTIPLIERS] Multipliers updated successfully');
      
      // Log action
      logAction(
        auditLogs,
        setAuditLogs,
        'MULTIPLIERS_UPDATED',
        `Moltiplicatori aggiornati: ${Object.entries(newMultipliers).map(([pos, mult]) => `${pos}°=${mult}x`).join(', ')}`,
        'admin',
        'admin',
        { multipliers: newMultipliers, tournamentId: selectedTournament }
      );

    } catch (error: any) {
      console.error('❌ [MULTIPLIERS] Error updating multipliers:', error);
      alert('Errore nell\'aggiornamento dei moltiplicatori: ' + error.message);
    }
  };

  // ✅ NUOVE FUNZIONI MANAGER CON DATABASE SYNC

  // CREATE MANAGER WITH DATABASE SYNC
  const createManagerWithSync = async (managerData: Omit<Manager, 'id' | 'createdAt'>) => {
    const newManager: Manager = {
      ...managerData,
      id: `mgr-${Date.now()}`,
      createdAt: Date.now()
    };

    console.log('🔄 [MANAGER-SYNC] Creating manager with database sync...', newManager);

    try {
      // Update database first
      if (typeof ApiService?.createManager === 'function') {
        await ApiService.createManager(newManager);
        console.log('✅ [MANAGER-SYNC] Manager created in database');
      }

      // Update local state
      setManagers(prev => ({ ...prev, [newManager.code]: newManager }));

      // Update localStorage
      const updatedManagers = { ...managers, [newManager.code]: newManager };
      localStorage.setItem('managers', JSON.stringify(updatedManagers));

      console.log('✅ [MANAGER-SYNC] Manager synced across all devices');

      // Log action
      logAction(
        auditLogs,
        setAuditLogs,
        'MANAGER_CREATED',
        `Gestore creato: ${newManager.name} (${newManager.code})`,
        'admin',
        'admin',
        { managerCode: newManager.code, permissions: newManager.permissions }
      );

      return newManager;

    } catch (error: any) {
      console.warn('⚠️ [MANAGER-SYNC] Database sync failed, updating locally:', error.message);
      
      // Fallback: update locally even if database fails
      setManagers(prev => ({ ...prev, [newManager.code]: newManager }));
      
      // Update localStorage
      const updatedManagers = { ...managers, [newManager.code]: newManager };
      localStorage.setItem('managers', JSON.stringify(updatedManagers));
      
      return newManager;
    }
  };

  // UPDATE MANAGER WITH DATABASE SYNC
  const updateManagerWithSync = async (managerCode: string, updateData: Partial<Manager>) => {
    const existingManager = managers[managerCode];
    if (!existingManager) return;

    const updatedManager = { ...existingManager, ...updateData };

    console.log('🔄 [MANAGER-SYNC] Updating manager with database sync...', updatedManager);

    try {
      // Update database first
      if (typeof ApiService?.updateManager === 'function') {
        await ApiService.updateManager(existingManager.id, updatedManager);
        console.log('✅ [MANAGER-SYNC] Manager updated in database');
      }

      // Update local state
      setManagers(prev => ({ ...prev, [managerCode]: updatedManager }));

      // Update localStorage
      const updatedManagers = { ...managers, [managerCode]: updatedManager };
      localStorage.setItem('managers', JSON.stringify(updatedManagers));

      console.log('✅ [MANAGER-SYNC] Manager update synced across all devices');

      // Log action
      logAction(
        auditLogs,
        setAuditLogs,
        'MANAGER_UPDATED',
        `Gestore aggiornato: ${updatedManager.name} (${updatedManager.code})`,
        'admin',
        'admin',
        { managerCode: updatedManager.code, changes: updateData }
      );

    } catch (error: any) {
      console.warn('⚠️ [MANAGER-SYNC] Database sync failed, updating locally:', error.message);
      
      // Fallback: update locally even if database fails
      setManagers(prev => ({ ...prev, [managerCode]: updatedManager }));
      
      // Update localStorage
      const updatedManagers = { ...managers, [managerCode]: updatedManager };
      localStorage.setItem('managers', JSON.stringify(updatedManagers));
    }
  };

  // DELETE MANAGER WITH DATABASE SYNC
  const deleteManagerWithSync = async (managerCode: string) => {
    const existingManager = managers[managerCode];
    if (!existingManager) return;

    console.log('🔄 [MANAGER-SYNC] Deleting manager with database sync...', managerCode);

    try {
      // Update database first
      if (typeof ApiService?.deleteManager === 'function') {
        await ApiService.deleteManager(existingManager.id);
        console.log('✅ [MANAGER-SYNC] Manager deleted from database');
      }

      // Update local state
      setManagers(prev => {
        const updated = { ...prev };
        delete updated[managerCode];
        return updated;
      });

      // Update localStorage
      const updatedManagers = { ...managers };
      delete updatedManagers[managerCode];
      localStorage.setItem('managers', JSON.stringify(updatedManagers));

      console.log('✅ [MANAGER-SYNC] Manager deletion synced across all devices');

      // Log action
      logAction(
        auditLogs,
        setAuditLogs,
        'MANAGER_DELETED',
        `Gestore eliminato: ${existingManager.name} (${existingManager.code})`,
        'admin',
        'admin',
        { managerCode: existingManager.code }
      );

    } catch (error: any) {
      console.warn('⚠️ [MANAGER-SYNC] Database sync failed, updating locally:', error.message);
      
      // Fallback: update locally even if database fails
      setManagers(prev => {
        const updated = { ...prev };
        delete updated[managerCode];
        return updated;
      });
      
      // Update localStorage
      const updatedManagers = { ...managers };
      delete updatedManagers[managerCode];
      localStorage.setItem('managers', JSON.stringify(updatedManagers));
    }
  };

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
      }
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      if (id) {
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
      }
    }
  };

  // Raggruppa le submission pendenti per team
  const pendingByTeam = pendingSubmissions.reduce((acc, submission) => {
    if (!acc[submission.teamCode]) {
      acc[submission.teamCode] = [];
    }
    acc[submission.teamCode].push(submission);
    return acc;
  }, {} as Record<string, PendingSubmission[]>);

  // Conta i team con submission pendenti
  const teamsWithPendingCount = Object.keys(pendingByTeam).length;

  const activeTournaments = Object.values(tournaments).filter(t => t.status === 'active');
  const archivedTournaments = Object.values(tournaments).filter(t => t.status === 'archived');
  
  // Get pending submissions count
  const totalPendingCount = pendingSubmissions.length;

  const tabItems = [
    { id: 'tournaments', label: 'TORNEI', icon: Trophy },
    { id: 'scores', label: 'ASSEGNA PUNTEGGI', icon: Target },
    { id: 'pending', label: 'APPROVAZIONI', icon: Clock, badge: teamsWithPendingCount, count: totalPendingCount },
    { id: 'managers', label: 'GESTORI', icon: UserPlus },
    { id: 'audit', label: 'AUDIT LOG', icon: Eye },
    { id: 'archive', label: 'ARCHIVIO', icon: Archive }
  ];

  // ✅ LOADING SCREEN DURANTE SINCRONIZZAZIONE INIZIALE
  if (isInitialLoading) {
    return (
      <div className="min-h-screen p-2 sm:p-4 relative z-10 flex items-center justify-center">
        <GlassPanel className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 relative mb-6">
            <Shield className="w-8 h-8 text-ice-blue animate-spin" />
            <div className="absolute inset-0 rounded-full bg-ice-blue/10 animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-white font-mono mb-4">ADMIN CONTROL</h2>
          <div className="space-y-2">
            <div className="w-64 h-2 bg-black/30 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-ice-blue to-ice-blue-dark rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            <p className="text-ice-blue font-mono text-sm">Sincronizzazione multi-dispositivo in corso...</p>
            <p className="text-ice-blue/60 font-mono text-xs">Caricamento dati da database e localStorage</p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <GlassPanel className="p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-ice-blue hover:bg-ice-blue/10 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 relative">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-ice-blue animate-float" />
                <div className="absolute inset-0 rounded-full bg-ice-blue/10 animate-ping" />
              </div>
              <div>
                <h1 className="text-lg sm:text-3xl font-bold text-white font-mono tracking-wider animate-glow">
                  ADMIN CONTROL
                </h1>
                <p className="text-ice-blue/80 font-mono text-xs sm:text-base">
                  Sistema di Gestione Tornei Multi-Dispositivo
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowLoginCodes(true)}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                <Key className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">CODICI</span>
              </button>
              <button
                onClick={() => setShowOBSPlugin(true)}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                <Tv className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">OBS</span>
              </button>
              
              {/* ✅ PULSANTE DEBUG TEMPORANEO */}
              <button
                onClick={debugDatabaseConnection}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                🔍 DEBUG DB
              </button>
              
              <button
                onClick={() => setShowTournamentCreator(true)}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">CREA TORNEO</span>
              </button>
              
              <button
                onClick={onLogout}
                className="px-2 sm:px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </GlassPanel>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <GlassPanel className="sm:hidden p-4 mb-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {tabItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-xl font-mono transition-all duration-300 relative ${
                    activeTab === item.id
                      ? 'bg-ice-blue/20 text-ice-blue border border-ice-blue/50'
                      : 'text-ice-blue/60 hover:text-ice-blue hover:bg-ice-blue/10'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setShowLoginCodes(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-xs"
              >
                <Key className="w-4 h-4" />
                <span>CODICI ACCESSO</span>
              </button>
              <button
                onClick={debugDatabaseConnection}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-mono text-xs"
              >
                🔍 DEBUG DATABASE
              </button>
              <button
                onClick={() => setShowTournamentCreator(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>CREA TORNEO</span>
              </button>
              <button
                onClick={() => setShowOBSPlugin(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-mono text-xs"
              >
                <Tv className="w-4 h-4" />
                <span>OBS STREAMING</span>
              </button>
            </div>
          </GlassPanel>
        )}

        {/* Desktop Navigation Tabs */}
        <GlassPanel className="hidden sm:block p-6 mb-6">
          <div className="flex space-x-4 overflow-x-auto">
            {tabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-mono transition-all duration-300 relative whitespace-nowrap ${
                  activeTab === item.id
                    ? 'bg-ice-blue/20 text-ice-blue border border-ice-blue/50'
                    : 'text-ice-blue/60 hover:text-ice-blue hover:bg-ice-blue/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label} {item.count ? `(${item.count})` : ''}</span>
              </button>
            ))}
          </div>
        </GlassPanel>

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <GlassPanel className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono">TORNEI ATTIVI</h2>
                <div className="space-y-3">
                  {activeTournaments.length === 0 ? (
                    <div className="text-center text-ice-blue/60 font-mono py-8">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nessun torneo attivo</p>
                    </div>
                  ) : (
                    activeTournaments.map(tournament => (
                      <div key={tournament.id} className="p-4 border rounded-lg bg-black/20 border-ice-blue/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold font-mono">{tournament.name}</div>
                            <div className="text-ice-blue/60 text-sm font-mono">
                              {tournament.type} • {tournament.startDate} {tournament.startTime}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedTournament(tournament.id)}
                            className="px-3 py-1 bg-ice-blue/20 border border-ice-blue/50 text-ice-blue rounded text-sm font-mono hover:bg-ice-blue/30 transition-colors"
                          >
                            GESTISCI
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassPanel>

              <GlassPanel className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono">AZIONI RAPIDE</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowTournamentCreator(true)}
                    className="w-full flex items-center space-x-3 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors font-mono"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crea Nuovo Torneo</span>
                  </button>
                  <button
                    onClick={debugDatabaseConnection}
                    className="w-full flex items-center space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors font-mono"
                  >
                    🔍
                    <span>Debug Database</span>
                  </button>
                  <button
                    onClick={() => setShowLoginCodes(true)}
                    className="w-full flex items-center space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors font-mono"
                  >
                    <Key className="w-5 h-5" />
                    <span>Visualizza Codici Accesso</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('managers')}
                    className="w-full flex items-center space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors font-mono"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Gestisci Gestori</span>
                  </button>
                  <button
                    onClick={() => setShowOBSPlugin(true)}
                    className="w-full flex items-center space-x-3 p-4 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors font-mono"
                  >
                    <Tv className="w-5 h-5" />
                    <span>OBS PLUGIN</span>
                  </button>
                </div>
              </GlassPanel>
            </div>

            {/* Tournament Management */}
            {selectedTournament && (
              <TournamentManagement
                tournamentId={selectedTournament}
                onClose={() => setSelectedTournament('')}
                tournaments={tournaments}
                setTournaments={setTournaments}
                teams={teams}
                setTeams={setTeams}
                matches={matches}
                setMatches={setMatches}
                pendingSubmissions={pendingSubmissions}
                setPendingSubmissions={setPendingSubmissions}
                scoreAdjustments={scoreAdjustments}
                setScoreAdjustments={setScoreAdjustments}
                managers={managers}
                setManagers={setManagers}
                auditLogs={auditLogs}
                setAuditLogs={setAuditLogs}
                multipliers={multipliers}
              />
            )}
          </div>
        )}

        {/* Score Assignment Tab */}
        {activeTab === 'scores' && (
          <div className="space-y-4 sm:space-y-6">
            <GlassPanel className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2 font-mono">ASSEGNAZIONE PUNTEGGI</h2>
                  <p className="text-ice-blue/80 font-mono text-sm">
                    Controllo manuale completo di punteggi, posizioni e moltiplicatori per admin e gestori
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-8 h-8 text-ice-blue animate-pulse" />
                </div>
              </div>

              {/* Tournament Selection */}
              <div className="space-y-4">
                <div className="p-4 bg-ice-blue/10 border border-ice-blue/30 rounded-lg">
                  <h3 className="text-white font-mono font-bold mb-4">SELEZIONA TORNEO</h3>
                  
                  {activeTournaments.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 mx-auto text-ice-blue/50 mb-4" />
                      <p className="text-ice-blue/60 font-mono mb-4">Nessun torneo attivo disponibile</p>
                      <button
                        onClick={() => setShowTournamentCreator(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>CREA TORNEO</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeTournaments.map(tournament => (
                        <button
                          key={tournament.id}
                          onClick={() => setSelectedTournament(tournament.id)}
                          className={`p-4 rounded-lg text-left transition-all border ${
                            selectedTournament === tournament.id
                              ? 'bg-ice-blue/20 border-ice-blue text-ice-blue'
                              : 'bg-black/20 border-ice-blue/20 text-white hover:bg-ice-blue/10 hover:border-ice-blue/40'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-bold font-mono text-sm mb-1">{tournament.name}</div>
                              <div className="text-xs font-mono opacity-80">
                                {tournament.type} • {tournament.startDate}
                              </div>
                              <div className="text-xs font-mono opacity-60 mt-1">
                                {Object.values(teams).filter(team => team.tournamentId === tournament.id).length} squadre
                              </div>
                            </div>
                            {selectedTournament === tournament.id && (
                              <div className="ml-2">
                                <div className="w-3 h-3 bg-ice-blue rounded-full animate-pulse"></div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tournament Details & Action */}
                {selectedTournament ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <h3 className="text-green-400 font-mono font-bold mb-3">
                        TORNEO SELEZIONATO: {tournaments[selectedTournament]?.name}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-green-400/60 font-mono">Squadre</div>
                          <div className="text-white font-mono font-bold">
                            {Object.values(teams).filter(team => team.tournamentId === selectedTournament).length}
                          </div>
                        </div>
                        <div>
                          <div className="text-green-400/60 font-mono">Partite totali</div>
                          <div className="text-white font-mono font-bold">
                            {tournaments[selectedTournament]?.settings?.totalMatches || 4}
                          </div>
                        </div>
                        <div>
                          <div className="text-green-400/60 font-mono">Punteggi inseriti</div>
                          <div className="text-white font-mono font-bold">
                            {matches.filter(match => match.tournamentId === selectedTournament).length}
                          </div>
                        </div>
                        <div>
                          <div className="text-green-400/60 font-mono">Status</div>
                          <div className={`font-mono font-bold ${
                            tournaments[selectedTournament]?.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {tournaments[selectedTournament]?.status?.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowScoreAssignment(true)}
                      className="w-full flex items-center justify-center space-x-3 p-6 bg-gradient-to-r from-ice-blue/20 to-ice-blue-dark/20 border border-ice-blue/30 text-ice-blue rounded-xl hover:from-ice-blue/30 hover:to-ice-blue-dark/30 transition-all font-mono font-bold text-lg shadow-lg"
                    >
                      <Target className="w-6 h-6" />
                      <span>APRI SISTEMA ASSEGNAZIONE PUNTEGGI</span>
                    </button>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => setActiveTab('pending')}
                        className="flex items-center justify-center space-x-2 p-3 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/20 transition-colors font-mono text-sm"
                      >
                        <Clock className="w-4 h-4" />
                        <span>APPROVAZIONI</span>
                        {pendingSubmissions.filter(p => p.tournamentId === selectedTournament).length > 0 && (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                            {pendingSubmissions.filter(p => p.tournamentId === selectedTournament).length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab('managers')}
                        className="flex items-center justify-center space-x-2 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors font-mono text-sm"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>GESTORI</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('tournaments');
                        }}
                        className="flex items-center justify-center space-x-2 p-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors font-mono text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        <span>GESTISCI TORNEO</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 mx-auto text-ice-blue/50 mb-4" />
                    <h3 className="text-white font-mono font-bold mb-2">SELEZIONA UN TORNEO</h3>
                    <p className="text-ice-blue/60 font-mono text-sm">
                      Scegli un torneo dalla lista sopra per accedere al sistema di assegnazione punteggi
                    </p>
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        )}

        {/* Pending Submissions Tab */}
        {activeTab === 'pending' && (
          <PendingSubmissions
            isAdmin={true}
            submissions={pendingSubmissions}
            onApprove={approveSubmission}
            onReject={rejectSubmission}
            onManualSubmit={() => selectedTournament ? alert('Usa il sistema di assegnazione punteggi nel tab ASSEGNA PUNTEGGI') : alert('Seleziona prima un torneo')}
          />
        )}

        {/* Manager Management Tab */}
        {activeTab === 'managers' && (
          <ManagerManagement
            managers={managers}
            setManagers={setManagers}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            createManager={createManagerWithSync}
            updateManager={updateManagerWithSync}
            deleteManager={deleteManagerWithSync}
          />
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <AuditLogViewer 
            auditLogs={auditLogs} 
            setAuditLogs={setAuditLogs}
            isAdmin={true}
          />
        )}

        {/* Tournament Archive Tab */}
        {activeTab === 'archive' && (
          <TournamentArchive
            tournaments={archivedTournaments}
            setTournaments={setTournaments}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
          />
        )}

        {/* Copyright */}
        <div className="mt-8 text-center">
          <div className="text-xs text-ice-blue/40 font-mono">
            © 2025 BM Solution - Sviluppo Applicazioni
          </div>
          <div className="text-xs text-ice-blue/30 font-mono mt-1">
            Advanced Tournament Management System v4.3 - Clean Production Version
          </div>
        </div>
      </div>

      {/* Tournament Creator */}
      <TournamentCreator
        isOpen={showTournamentCreator}
        onClose={() => setShowTournamentCreator(false)}
        auditLogs={auditLogs}
        setAuditLogs={setAuditLogs}
        tournaments={tournaments}
        setTournaments={setTournaments}
      />

      <MultiplierSettings 
        isOpen={showMultiplierSettings}
        onClose={() => setShowMultiplierSettings(false)}
      />

      <OBSPluginManager
        isOpen={showOBSPlugin}
        onClose={() => setShowOBSPlugin(false)}
      />

      {/* Manual Score Assignment Modal */}
      {showScoreAssignment && selectedTournament && (
        <ManualScoreAssignment
          isOpen={showScoreAssignment}
          onClose={() => setShowScoreAssignment(false)}
          tournament={tournaments[selectedTournament]}
          teams={Object.values(teams).filter(team => team.tournamentId === selectedTournament)}
          matches={matches.filter(match => match.tournamentId === selectedTournament)}
          multipliers={multipliers}
          onScoreUpdate={handleManualScoreUpdate}
          onScoreDelete={handleManualScoreDelete}
          onMultiplierUpdate={handleMultiplierUpdate}
          userRole="admin"
        />
      )}

      {showTeamCode && (
        <TeamCodeDisplay
          teamName={showTeamCode.name}
          teamCode={showTeamCode.code}
          onClose={() => setShowTeamCode(null)}
        />
      )}

      {/* Login Codes Modal */}
      {showLoginCodes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassPanel className="w-full max-w-2xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                <Key className="w-5 h-5 text-ice-blue" />
                <span>CODICI DI ACCESSO</span>
              </h2>
              <button
                onClick={() => setShowLoginCodes(false)}
                className="text-ice-blue/60 hover:text-ice-blue transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Admin Codes */}
              <div className="p-4 bg-ice-blue/10 border border-ice-blue/30 rounded-lg">
                <h3 className="text-ice-blue font-mono font-bold mb-3">CODICI AMMINISTRATORE</h3>
                <div className="space-y-2">
                  {['MISOKIETI', 'MISOKIETI8'].map((code, index) => (
                    <div key={code} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <span className="text-white font-mono text-lg">{code}</span>
                      <button
                        onClick={() => copyToClipboard(code, `admin-${index}`)}
                        className="flex items-center space-x-1 px-3 py-1 bg-ice-blue/20 border border-ice-blue/50 text-ice-blue rounded text-sm font-mono hover:bg-ice-blue/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied === `admin-${index}` ? 'COPIATO!' : 'COPIA'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Codes */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <h3 className="text-purple-400 font-mono font-bold mb-3">CODICI GESTORI</h3>
                <div className="space-y-2">
                  {Object.values(managers).filter(m => m.isActive).map((manager) => (
                    <div key={manager.code} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div>
                        <span className="text-white font-mono text-lg">{manager.code}</span>
                        <div className="text-purple-400/60 text-sm font-mono">{manager.name}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(manager.code, `manager-${manager.code}`)}
                        className="flex items-center space-x-1 px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded text-sm font-mono hover:bg-purple-500/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied === `manager-${manager.code}` ? 'COPIATO!' : 'COPIA'}</span>
                      </button>
                    </div>
                  ))}
                  {Object.values(managers).filter(m => m.isActive).length === 0 && (
                    <div className="text-center text-purple-400/60 font-mono py-4">
                      Nessun gestore attivo
                    </div>
                  )}
                </div>
              </div>

              {/* Team Codes */}
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h3 className="text-green-400 font-mono font-bold mb-3">CODICI SQUADRE ATTIVE</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.values(teams).filter(team => {
                    const tournament = tournaments[team.tournamentId];
                    return tournament && tournament.status === 'active';
                  }).map((team) => (
                    <div key={team.code} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div>
                        <span className="text-white font-mono text-lg">{team.code}</span>
                        <div className="text-green-400/60 text-sm font-mono">{team.name}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(team.code, `team-${team.code}`)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm font-mono hover:bg-green-500/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied === `team-${team.code}` ? 'COPIATO!' : 'COPIA'}</span>
                      </button>
                    </div>
                  ))}
                  {Object.values(teams).filter(team => {
                    const tournament = tournaments[team.tournamentId];
                    return tournament && tournament.status === 'active';
                  }).length === 0 && (
                    <div className="text-center text-green-400/60 font-mono py-4">
                      Nessuna squadra attiva
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowLoginCodes(false)}
                className="px-6 py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono"
              >
                CHIUDI
              </button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
