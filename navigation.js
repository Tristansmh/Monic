// Navigation module to handle sidebar navigation functionality
import { config } from './config.js';

// Track current active view 
let activeView = 'home';

// Initialize navigation
export function initNavigation() {
    // Get navigation items
    const homeNav = document.querySelector('nav ul li:nth-child(1)');
    const libraryNav = document.querySelector('nav ul li:nth-child(2)'); 
    
    // Add event listeners
    homeNav.addEventListener('click', () => switchView('home'));
    libraryNav.addEventListener('click', () => switchView('library'));
    
    // Initialize views
    setupViews();
}

// Setup initial view structure
function setupViews() {
    const contentArea = document.querySelector('.content-area');
    
    // Create library view if it doesn't exist
    if (!document.querySelector('.library-view')) {
        const libraryView = document.createElement('div');
        libraryView.className = 'library-view';
        libraryView.innerHTML = `
            <h2>Your Library</h2>
            <p>All your playlists and favorite videos in one place</p>
            <div class="library-sections">
                <div class="library-section">
                    <h3>Your Playlists</h3>
                    <div class="library-playlists"></div>
                </div>
                <div class="library-section">
                    <h3>Recently Played</h3>
                    <div class="recent-videos"></div>
                </div>
            </div>
        `;
        contentArea.appendChild(libraryView);
    }
    
    // Hide all views initially
    hideAllViews();
    
    // Show home view by default
    switchView('home');
}

// Switch between different views
export function switchView(view) {
    // First hide all views
    hideAllViews();
    
    // Update active nav item
    document.querySelectorAll('nav ul li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show requested view
    activeView = view;
    
    if (view === 'home') {
        // Show home elements
        document.querySelector('.content-area > h2').style.display = 'block';
        document.querySelector('.content-area > p').style.display = 'block';
        document.querySelector('.search-results').style.display = 'grid';
        document.querySelector('nav ul li:nth-child(1)').classList.add('active');
        
        // If we have a default search and results are empty, run the search
        if (config.defaultSearch && document.querySelector('.search-results').children.length === 0) {
            document.getElementById('search-input').value = config.defaultSearch;
            document.getElementById('search-button').click();
        }
        
        // Hide playlist view
        if (document.querySelector('.playlist-view')) {
            document.querySelector('.playlist-view').style.display = 'none';
        }
    } 
    else if (view === 'library') {
        // Show library view and update playlists
        document.querySelector('.library-view').style.display = 'block'; 
        document.querySelector('nav ul li:nth-child(2)').classList.add('active'); 
        updateLibraryView();
        
        // Hide playlist view
        if (document.querySelector('.playlist-view')) {
            document.querySelector('.playlist-view').style.display = 'none';
        }
    }
    else if (view === 'playlist') {
        // Show playlist view
        document.querySelector('.playlist-view').style.display = 'block';
        
        // Don't update nav items for playlist view
    }
}

// Hide all content views
function hideAllViews() {
    // Hide home elements
    document.querySelector('.content-area > h2').style.display = 'none';
    document.querySelector('.content-area > p').style.display = 'none';
    document.querySelector('.search-results').style.display = 'none';
    
    // Hide library view
    if (document.querySelector('.library-view')) {
        document.querySelector('.library-view').style.display = 'none';
    }
    
    // Hide playlist view
    if (document.querySelector('.playlist-view')) {
        document.querySelector('.playlist-view').style.display = 'none';
    }
}

// Update library view with playlists and recent videos
function updateLibraryView() {
    // Get playlists from localStorage
    const playlists = JSON.parse(localStorage.getItem('monic_playlists')) || [];
    const libraryPlaylists = document.querySelector('.library-playlists');
    libraryPlaylists.innerHTML = '';
    
    if (playlists.length === 0) {
        libraryPlaylists.innerHTML = '<p class="empty-message">No playlists created yet</p>';
    } else {
        playlists.forEach((playlist, index) => {
            const playlistCard = document.createElement('div');
            playlistCard.className = 'library-playlist-card';
            playlistCard.innerHTML = `
                <div class="playlist-card-cover">
                    <i class="fas fa-music"></i>
                </div>
                <div class="playlist-card-info">
                    <h4>${playlist.name}</h4>
                    <p>${playlist.videos.length} videos</p>
                </div>
            `;
            
            playlistCard.addEventListener('click', () => {
                // Call showPlaylist function from the global scope (defined in app.js)
                window.showPlaylist(index);
            });
            
            libraryPlaylists.appendChild(playlistCard);
        });
    }
    
    // Get recently played from history
    const recentVideos = document.querySelector('.recent-videos');
    recentVideos.innerHTML = '';
    
    // Check if playerState exists in the global scope
    if (window.playerState && window.playerState.history) {
        const history = [...window.playerState.history].reverse().slice(0, 5); // Get last 5 videos
        
        if (history.length === 0) {
            recentVideos.innerHTML = '<p class="empty-message">No videos played yet</p>';
        } else {
            history.forEach(video => {
                const videoCard = document.createElement('div');
                videoCard.className = 'recent-video-card';
                videoCard.innerHTML = `
                    <div class="recent-thumbnail" style="background-image: url('${video.thumbnail}')"></div>
                    <div class="recent-info">
                        <h4>${video.title}</h4>
                        <p>${video.channel}</p>
                    </div>
                `;
                
                videoCard.addEventListener('click', () => {
                    // Call playVideo function from the global scope (defined in app.js)
                    window.playVideo(video.videoId, video.title, video.channel, video.thumbnail);
                });
                
                recentVideos.appendChild(videoCard);
            });
        }
    } else {
        recentVideos.innerHTML = '<p class="empty-message">No videos played yet</p>';
    }
}