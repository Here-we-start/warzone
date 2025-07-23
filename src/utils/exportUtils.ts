import html2canvas from 'html2canvas';

export interface ExportOptions {
  backgroundColor?: string;
  theme?: 'dark' | 'light';
  includeTimestamp?: boolean;
  customStyles?: string;
}

export async function exportLeaderboardImage(
  elementId: string, 
  filename: string,
  options: ExportOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const {
    backgroundColor = '#000000',
    theme = 'dark',
    includeTimestamp = true,
    customStyles = ''
  } = options;

  try {
    // Applica stili temporanei per l'export
    const originalStyle = element.style.cssText;
    
    // Stili per export con sfondo nero
    const exportStyles = `
      background-color: ${backgroundColor} !important;
      color: ${theme === 'dark' ? '#ffffff' : '#000000'} !important;
      padding: 20px !important;
      border-radius: 12px !important;
      font-family: 'Orbitron', 'Courier New', monospace !important;
      ${customStyles}
    `;
    
    element.style.cssText = originalStyle + exportStyles;

    // Applica stili alle righe della tabella
    const rows = element.querySelectorAll('tr');
    rows.forEach((row, index) => {
      const originalRowStyle = (row as HTMLElement).style.cssText;
      
      if (index === 1) { // Prima posizione (header è index 0)
        (row as HTMLElement).style.cssText = originalRowStyle + `
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, transparent 100%) !important;
          border-left: 4px solid #ffd700 !important;
        `;
      } else if (index === 2) { // Seconda posizione
        (row as HTMLElement).style.cssText = originalRowStyle + `
          background: linear-gradient(90deg, rgba(192, 192, 192, 0.2) 0%, transparent 100%) !important;
          border-left: 4px solid #c0c0c0 !important;
        `;
      } else if (index === 3) { // Terza posizione
        (row as HTMLElement).style.cssText = originalRowStyle + `
          background: linear-gradient(90deg, rgba(205, 127, 50, 0.2) 0%, transparent 100%) !important;
          border-left: 4px solid #cd7f32 !important;
        `;
      }
    });

    // Aggiungi timestamp se richiesto
    let timestampElement: HTMLElement | null = null;
    if (includeTimestamp) {
      timestampElement = document.createElement('div');
      timestampElement.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 10px;
        color: ${theme === 'dark' ? '#a1e0ff' : '#666666'};
        font-size: 12px;
        font-family: 'Orbitron', monospace;
        opacity: 0.8;
      `;
      timestampElement.textContent = `Esportato il ${new Date().toLocaleString('it-IT')}`;
      element.style.position = 'relative';
      element.appendChild(timestampElement);
    }

    // Genera l'immagine
    const canvas = await html2canvas(element, {
      backgroundColor,
      scale: 2, // Alta qualità
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight + (includeTimestamp ? 40 : 0)
    });

    // Ripristina stili originali
    element.style.cssText = originalStyle;
    rows.forEach((row) => {
      (row as HTMLElement).style.cssText = '';
    });
    
    if (timestampElement) {
      element.removeChild(timestampElement);
    }

    // Download dell'immagine
    const url = canvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting leaderboard image:', error);
    throw error;
  }
}

export function exportLeaderboardCSV(
  leaderboard: any[], 
  tournamentName: string,
  includeDetails: boolean = true
): void {
  let csv = 'Rank,Team,Code,Match Score,Adjustments,Final Score,Matches Played';
  
  if (includeDetails) {
    csv += ',Tournament,Export Date\n';
  } else {
    csv += '\n';
  }
  
  leaderboard.forEach(team => {
    let row = `${team.rank},${team.teamName},${team.teamCode},${team.totalScore.toFixed(1)},${team.adjustmentTotal > 0 ? '+' : ''}${team.adjustmentTotal.toFixed(1)},${team.finalScore.toFixed(1)},${team.matches.length}`;
    
    if (includeDetails) {
      row += `,${tournamentName},${new Date().toLocaleString('it-IT')}`;
    }
    
    csv += row + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tournamentName.toLowerCase().replace(/\s+/g, '_')}_classifica.csv`;
  a.click();
  URL.revokeObjectURL(url);
}