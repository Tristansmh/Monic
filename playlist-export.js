// Playlist import/export functionality
export function initPlaylistImportExport() {
    // Add export button to playlist view
    const exportButton = document.createElement('button');
    exportButton.className = 'export-playlist-btn';
    exportButton.innerHTML = '<i class="fas fa-file-export"></i> Export';
    exportButton.title = 'Export playlist as JSON file';
    
    // Add import button to playlist view
    const importButton = document.createElement('button');
    importButton.className = 'import-playlist-btn';
    importButton.innerHTML = '<i class="fas fa-file-import"></i> Import';
    importButton.title = 'Import playlist from JSON file';
    
    // Add buttons to playlist buttons container
    const playlistButtons = document.querySelector('.playlist-buttons');
    playlistButtons.appendChild(exportButton);
    playlistButtons.appendChild(importButton);
    
    // Create hidden file input for import
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'playlist-file-input';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Add event listeners
    exportButton.addEventListener('click', exportCurrentPlaylist);
    importButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importPlaylist);
    
    // Also add import/export buttons to library view
    addLibraryImportExportButtons();
}

function addLibraryImportExportButtons() {
    // Create container for import/export buttons in library view
    const importExportContainer = document.createElement('div');
    importExportContainer.className = 'library-import-export';
    importExportContainer.innerHTML = `
        <h3>Import & Export</h3>
        <div class="library-buttons">
            <button class="library-import-btn">
                <i class="fas fa-file-import"></i> Import Playlist
            </button>
            <button class="library-export-all-btn">
                <i class="fas fa-file-export"></i> Export All Playlists
            </button>
        </div>
    `;
    
    // Check if library sections exist first
    const librarySections = document.querySelector('.library-sections');
    if (librarySections) {
        librarySections.appendChild(importExportContainer);
        
        // Add event listeners only after the elements are added to DOM
        document.querySelector('.library-import-btn').addEventListener('click', () => libraryFileInput.click());
        document.querySelector('.library-export-all-btn').addEventListener('click', exportAllPlaylists);
    } else {
        // If library sections don't exist yet, try again after a delay
        setTimeout(() => {
            const laterLibrarySections = document.querySelector('.library-sections');
            if (laterLibrarySections) {
                laterLibrarySections.appendChild(importExportContainer);
                
                // Add event listeners after delay
                document.querySelector('.library-import-btn')?.addEventListener('click', () => libraryFileInput.click());
                document.querySelector('.library-export-all-btn')?.addEventListener('click', exportAllPlaylists);
            }
        }, 1000); // Increased delay for better reliability
    }
    
    // Create hidden file input for library import
    const libraryFileInput = document.createElement('input');
    libraryFileInput.type = 'file';
    libraryFileInput.id = 'library-file-input';
    libraryFileInput.accept = '.json';
    libraryFileInput.style.display = 'none';
    document.body.appendChild(libraryFileInput);
    
    libraryFileInput.addEventListener('change', importPlaylistToLibrary);
}

// Export current playlist as JSON file
function exportCurrentPlaylist() {
    const playlists = JSON.parse(localStorage.getItem('monic_playlists')) || [];
    const currentPlaylistIndex = window.currentPlaylistIndex;
    
    if (currentPlaylistIndex === -1 || !playlists[currentPlaylistIndex]) {
        alert('No playlist selected to export');
        return;
    }
    
    const playlist = playlists[currentPlaylistIndex];
    const playlistJSON = JSON.stringify(playlist, null, 2);
    
    // Create blob and download link
    const blob = new Blob([playlistJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/\s+/g, '_')}_playlist.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Export all playlists as single JSON file
function exportAllPlaylists() {
    const playlists = JSON.parse(localStorage.getItem('monic_playlists')) || [];
    
    if (playlists.length === 0) {
        alert('No playlists to export');
        return;
    }
    
    const playlistsJSON = JSON.stringify(playlists, null, 2);
    
    // Create blob and download link
    const blob = new Blob([playlistsJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monic_playlists.json';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Import playlist from file (single playlist)
function importPlaylist(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedPlaylist = JSON.parse(e.target.result);
            
            // Validate imported data
            if (!importedPlaylist.name || !Array.isArray(importedPlaylist.videos)) {
                throw new Error('Invalid playlist format');
            }
            
            // Get current playlists
            const playlists = JSON.parse(localStorage.getItem('monic_playlists')) || [];
            
            // Check for duplicate name
            const playlistName = getUniquePlaylistName(importedPlaylist.name, playlists);
            importedPlaylist.name = playlistName;
            
            // Add to playlists
            playlists.push(importedPlaylist);
            localStorage.setItem('monic_playlists', JSON.stringify(playlists));
            
            // Update UI
            window.renderPlaylists();
            alert(`Playlist "${playlistName}" imported successfully`);
            
            // Reset file input
            event.target.value = '';
        } catch (error) {
            alert('Error importing playlist: ' + error.message);
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// Import playlist to library (can be single or multiple)
function importPlaylistToLibrary(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Get current playlists
            const currentPlaylists = JSON.parse(localStorage.getItem('monic_playlists')) || [];
            let importCount = 0;
            
            // Check if it's an array (multiple playlists) or single playlist
            if (Array.isArray(importedData)) {
                // Multiple playlists
                importedData.forEach(playlist => {
                    if (playlist.name && Array.isArray(playlist.videos)) {
                        // Get unique name
                        const playlistName = getUniquePlaylistName(playlist.name, currentPlaylists);
                        playlist.name = playlistName;
                        
                        // Add to playlists
                        currentPlaylists.push(playlist);
                        importCount++;
                    }
                });
            } else if (importedData.name && Array.isArray(importedData.videos)) {
                // Single playlist
                const playlistName = getUniquePlaylistName(importedData.name, currentPlaylists);
                importedData.name = playlistName;
                
                // Add to playlists
                currentPlaylists.push(importedData);
                importCount = 1;
            } else {
                throw new Error('Invalid playlist format');
            }
            
            // Save and update UI
            localStorage.setItem('monic_playlists', JSON.stringify(currentPlaylists));
            window.renderPlaylists();
            window.updateLibraryView();
            
            alert(`Imported ${importCount} playlist(s) successfully`);
            event.target.value = '';
        } catch (error) {
            alert('Error importing playlist(s): ' + error.message);
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// Utility function to get unique playlist name
function getUniquePlaylistName(name, playlists) {
    let newName = name;
    let counter = 1;
    
    // Check if name already exists, if so, append a number
    while (playlists.some(p => p.name === newName)) {
        newName = `${name} (${counter})`;
        counter++;
    }
    
    return newName;
}