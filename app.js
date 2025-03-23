import { config } from './config.js';

// Initialize YouTube API
let player;
let playerReady = false;
let currentVideoId = null;
let playerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 50,
    history: [],
    currentHistoryIndex: -1,
    previousVolume: 0
};

// Initialize playlists
let playlists = JSON.parse(localStorage.getItem('monic_playlists')) || [];
let currentPlaylistIndex = -1;

// Initial views state
let currentView = 'home';

// Load YouTube API
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Called by YouTube API when ready
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

// YouTube player is ready
function onPlayerReady(event) {
    playerReady = true;
    setVolume(playerState.volume);
    
    // Check if we have a default search term
    if (config.defaultSearch) {
        document.getElementById('search-input').value = config.defaultSearch;
        searchVideos();
    }
    
    // Load playlists from localStorage
    renderPlaylists();
}

// Player state change handler
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        playerState.isPlaying = true;
        updatePlayButton();
        startProgressUpdater();
    } else if (event.data === YT.PlayerState.PAUSED) {
        playerState.isPlaying = false;
        updatePlayButton();
        stopProgressUpdater();
    } else if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
}

// Update UI elements for player
function updatePlayButton() {
    const playButton = document.getElementById('play-button');
    if (playerState.isPlaying) {
        playButton.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        playButton.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// Progress bar updater
let progressInterval;
function startProgressUpdater() {
    if (progressInterval) clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
        if (playerReady && player && playerState.isPlaying) {
            const currentTime = player.getCurrentTime() || 0;
            const duration = player.getDuration() || 0;
            
            playerState.currentTime = currentTime;
            playerState.duration = duration;
            
            updateProgressBar(currentTime, duration);
        }
    }, 1000);
}

function stopProgressUpdater() {
    if (progressInterval) clearInterval(progressInterval);
}

function updateProgressBar(currentTime, duration) {
    const progress = document.querySelector('.progress');
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
    
    const currentTimeElement = document.querySelector('.current-time');
    const totalTimeElement = document.querySelector('.total-time');
    
    currentTimeElement.textContent = formatTime(currentTime);
    totalTimeElement.textContent = formatTime(duration);
}

function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Volume control
function setVolume(volume) {
    if (playerReady && player) {
        player.setVolume(volume);
        playerState.volume = volume;
        
        const volumeLevel = document.querySelector('.volume-level');
        volumeLevel.style.width = `${volume}%`;
        
        // Update volume icon
        const volumeIcon = document.querySelector('.volume-control i');
        if (volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (volume < 50) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }
}

// Search for videos
async function searchVideos() {
    const searchInput = document.getElementById('search-input').value.trim();
    if (!searchInput) return;
    
    const searchResults = document.querySelector('.search-results');
    searchResults.innerHTML = '<div class="loading">Searching...</div>';
    
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchInput)}&type=video&maxResults=${config.maxResults}&key=${config.apiKey}`);
        
        if (!response.ok) {
            throw new Error('YouTube search API error');
        }
        
        const data = await response.json();
        displaySearchResults(data.items);
        
    } catch (error) {
        console.error('Error searching videos:', error);
        searchResults.innerHTML = `<div class="error">Error searching videos. Please check your API key in config.js and try again.</div>`;
    }
}

// Display search results
function displaySearchResults(videos) {
    const searchResults = document.querySelector('.search-results');
    searchResults.innerHTML = '';
    
    if (!videos || videos.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No videos found</div>';
        return;
    }
    
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.dataset.videoId = video.id.videoId;
        videoCard.dataset.title = video.snippet.title;
        videoCard.dataset.channel = video.snippet.channelTitle;
        videoCard.dataset.thumbnail = video.snippet.thumbnails.high.url;
        
        videoCard.innerHTML = `
            <div class="thumbnail" style="background-image: url('${video.snippet.thumbnails.high.url}')"></div>
            <div class="video-title">${video.snippet.title}</div>
            <div class="video-channel">${video.snippet.channelTitle}</div>
            <div class="actions">
                <div class="add-to-playlist" title="Add to playlist">
                    <i class="fas fa-plus"></i>
                </div>
            </div>
        `;
        
        videoCard.addEventListener('click', (e) => {
            // Check if the click was on the add-to-playlist button
            if (e.target.closest('.add-to-playlist')) {
                e.stopPropagation();
                showAddToPlaylistModal(video.id.videoId, video.snippet.title, video.snippet.channelTitle, video.snippet.thumbnails.high.url);
            } else {
                playVideo(video.id.videoId, video.snippet.title, video.snippet.channelTitle, video.snippet.thumbnails.high.url);
            }
        });
        
        searchResults.appendChild(videoCard);
    });
}

// Play a video
function playVideo(videoId, title, channel, thumbnail) {
    currentVideoId = videoId;
    
    // Update player
    if (playerReady && player) {
        player.loadVideoById(videoId);
        document.getElementById('player-container').style.display = 'block';
    }
    
    // Update now playing bar
    const videoTitle = document.querySelector('.now-playing-left .video-title');
    const videoChannel = document.querySelector('.now-playing-left .video-channel');
    const videoThumbnail = document.querySelector('.now-playing-left .thumbnail');
    
    videoTitle.textContent = title;
    videoChannel.textContent = channel;
    videoThumbnail.style.backgroundImage = `url('${thumbnail}')`;
    
    // Add to history
    playerState.history = playerState.history.slice(0, playerState.currentHistoryIndex + 1);
    playerState.history.push({
        videoId,
        title,
        channel,
        thumbnail
    });
    playerState.currentHistoryIndex = playerState.history.length - 1;
    
    // Reset progress bar
    updateProgressBar(0, 0);
}

// Play/pause control
function togglePlayPause() {
    if (!playerReady || !player || !currentVideoId) return;
    
    if (playerState.isPlaying) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

// Play next video in history
function playNextVideo() {
    if (playerState.currentHistoryIndex < playerState.history.length - 1) {
        playerState.currentHistoryIndex++;
        const video = playerState.history[playerState.currentHistoryIndex];
        playVideo(video.videoId, video.title, video.channel, video.thumbnail);
    }
}

// Play previous video in history
function playPreviousVideo() {
    if (playerState.currentHistoryIndex > 0) {
        playerState.currentHistoryIndex--;
        const video = playerState.history[playerState.currentHistoryIndex];
        playVideo(video.videoId, video.title, video.channel, video.thumbnail);
    }
}

// Seek to position in video
function seekTo(event) {
    if (!playerReady || !player || !currentVideoId) return;
    
    const progressBar = document.querySelector('.progress-bar');
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (event.clientX - rect.left) / rect.width;
    const seekTime = playerState.duration * clickPosition;
    
    player.seekTo(seekTime, true);
    updateProgressBar(seekTime, playerState.duration);
}

// Setup volume control
function setupVolumeControl() {
    const volumeBar = document.querySelector('.volume-bar');
    
    volumeBar.addEventListener('click', (event) => {
        const rect = volumeBar.getBoundingClientRect();
        const clickPosition = (event.clientX - rect.left) / rect.width;
        const volumePercent = Math.round(clickPosition * 100);
        
        setVolume(volumePercent);
    });
    
    document.querySelector('.volume-control i').addEventListener('click', () => {
        if (playerState.volume > 0) {
            playerState.previousVolume = playerState.volume;
            setVolume(0);
        } else {
            setVolume(playerState.previousVolume || 50);
        }
    });
}

// Playlist Management Functions
function showAddToPlaylistModal(videoId, title, channel, thumbnail) {
    const modal = document.getElementById('playlist-modal');
    const modalTitle = document.querySelector('.modal-title');
    modalTitle.textContent = 'Add to Playlist';
    
    const playlistList = document.querySelector('.playlist-list');
    playlistList.innerHTML = '';
    
    // Add current playlists
    playlists.forEach((playlist, index) => {
        const playlistOption = document.createElement('div');
        playlistOption.className = 'playlist-option';
        playlistOption.innerHTML = `
            <i class="fas fa-list"></i>
            ${playlist.name}
        `;
        
        playlistOption.addEventListener('click', () => {
            addVideoToPlaylist(index, videoId, title, channel, thumbnail);
            modal.style.display = 'none';
        });
        
        playlistList.appendChild(playlistOption);
    });
    
    // Store the video info in the create button's data attributes
    const createBtn = document.querySelector('.create-new-playlist-btn');
    createBtn.dataset.videoId = videoId;
    createBtn.dataset.title = title;
    createBtn.dataset.channel = channel;
    createBtn.dataset.thumbnail = thumbnail;
    
    modal.style.display = 'flex';
}

function closePlaylistModal() {
    const modal = document.getElementById('playlist-modal');
    modal.style.display = 'none';
    document.getElementById('new-playlist-input').value = '';
}

function createNewPlaylist() {
    const playlistName = document.getElementById('new-playlist-input').value.trim();
    if (!playlistName) return;
    
    const createBtn = document.querySelector('.create-new-playlist-btn');
    const videoId = createBtn.dataset.videoId;
    const title = createBtn.dataset.title;
    const channel = createBtn.dataset.channel;
    const thumbnail = createBtn.dataset.thumbnail;
    
    // Create new playlist
    const newPlaylist = {
        name: playlistName,
        videos: []
    };
    
    // Add video if we have it
    if (videoId) {
        newPlaylist.videos.push({
            videoId,
            title,
            channel,
            thumbnail
        });
    }
    
    playlists.push(newPlaylist);
    savePlaylists();
    renderPlaylists();
    closePlaylistModal();
}

function addVideoToPlaylist(playlistIndex, videoId, title, channel, thumbnail) {
    // Check if video already exists in the playlist
    const exists = playlists[playlistIndex].videos.some(video => video.videoId === videoId);
    
    if (!exists) {
        playlists[playlistIndex].videos.push({
            videoId,
            title,
            channel,
            thumbnail
        });
        
        savePlaylists();
        
        // Show notification
        alert(`Added to ${playlists[playlistIndex].name}`);
    } else {
        alert('This video is already in the playlist');
    }
}

function savePlaylists() {
    localStorage.setItem('monic_playlists', JSON.stringify(playlists));
}

function renderPlaylists() {
    const playlistItems = document.querySelector('.playlist-items');
    playlistItems.innerHTML = '';
    
    playlists.forEach((playlist, index) => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'playlist-item';
        playlistItem.innerHTML = `
            <i class="fas fa-list"></i>
            ${playlist.name}
        `;
        
        playlistItem.addEventListener('click', () => {
            showPlaylist(index);
        });
        
        playlistItems.appendChild(playlistItem);
    });
}

function showPlaylist(index) {
    currentPlaylistIndex = index;
    const playlist = playlists[index];
    
    // Switch to playlist view through navigation module
    window.switchView('playlist');
    
    // Update playlist details
    document.querySelector('.playlist-info h2').textContent = playlist.name;
    document.querySelector('.playlist-info p').textContent = `${playlist.videos.length} videos`;
    
    // Render playlist tracks
    const tracksBody = document.querySelector('.playlist-tracks tbody');
    tracksBody.innerHTML = '';
    
    playlist.videos.forEach((video, videoIndex) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="playlist-track">
                    <div class="track-number">${videoIndex + 1}</div>
                    <div class="track-thumbnail" style="background-image: url('${video.thumbnail}')"></div>
                    <div class="track-info">
                        <div class="track-title">${video.title}</div>
                        <div class="track-channel">${video.channel}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="track-actions">
                    <button class="play-track" title="Play"><i class="fas fa-play"></i></button>
                    <button class="remove-track" title="Remove"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        
        // Add event listeners
        row.querySelector('.play-track').addEventListener('click', () => {
            playVideo(video.videoId, video.title, video.channel, video.thumbnail);
        });
        
        row.querySelector('.remove-track').addEventListener('click', () => {
            removeFromPlaylist(index, videoIndex);
        });
        
        tracksBody.appendChild(row);
    });
    
    // Set current view
    currentView = 'playlist';
}

function removeFromPlaylist(playlistIndex, videoIndex) {
    if (confirm('Remove this video from the playlist?')) {
        playlists[playlistIndex].videos.splice(videoIndex, 1);
        savePlaylists();
        showPlaylist(playlistIndex);
    }
}

function deletePlaylist(index) {
    if (confirm('Delete this playlist?')) {
        playlists.splice(index, 1);
        savePlaylists();
        renderPlaylists();
        returnToHome();
    }
}

function playAllFromPlaylist(index) {
    const playlist = playlists[index];
    if (playlist.videos.length > 0) {
        const firstVideo = playlist.videos[0];
        playVideo(firstVideo.videoId, firstVideo.title, firstVideo.channel, firstVideo.thumbnail);
        
        // Clear history and add all playlist videos
        playerState.history = [];
        playerState.currentHistoryIndex = 0;
        
        playlist.videos.forEach(video => {
            playerState.history.push({
                videoId: video.videoId,
                title: video.title,
                channel: video.channel,
                thumbnail: video.thumbnail
            });
        });
    }
}

function returnToHome() {
    window.switchView('home');
}

function updateLibraryView() {
    // Add your implementation here
}

// Initialize the app
function init() {
    // Load YouTube API
    loadYouTubeAPI();
    
    // Add event listeners
    document.getElementById('search-button').addEventListener('click', searchVideos);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchVideos();
    });
    
    document.getElementById('play-button').addEventListener('click', togglePlayPause);
    document.getElementById('next-button').addEventListener('click', playNextVideo);
    document.getElementById('previous-button').addEventListener('click', playPreviousVideo);
    
    document.querySelector('.progress-bar').addEventListener('click', seekTo);
    
    // Setup volume control
    setupVolumeControl();
    
    // Playlist modal listeners
    document.querySelector('.close-modal').addEventListener('click', closePlaylistModal);
    document.querySelector('.create-new-playlist-btn').addEventListener('click', createNewPlaylist);
    
    // Create playlist button
    document.querySelector('.create-playlist').addEventListener('click', () => {
        const modal = document.getElementById('playlist-modal');
        const modalTitle = document.querySelector('.modal-title');
        modalTitle.textContent = 'Create New Playlist';
        
        // Clear stored video data
        const createBtn = document.querySelector('.create-new-playlist-btn');
        createBtn.dataset.videoId = '';
        createBtn.dataset.title = '';
        createBtn.dataset.channel = '';
        createBtn.dataset.thumbnail = '';
        
        modal.style.display = 'flex';
    });
    
    // Playlist view listeners
    document.querySelector('.back-to-home').addEventListener('click', returnToHome);
    document.querySelector('.play-all-btn').addEventListener('click', () => {
        playAllFromPlaylist(currentPlaylistIndex);
    });
    document.querySelector('.delete-playlist-btn').addEventListener('click', () => {
        deletePlaylist(currentPlaylistIndex);
    });
    
    // Initialize navigation (using the new module)
    import('./navigation.js').then(module => {
        window.switchView = module.switchView;
        module.initNavigation();
        
        // Initialize playlist import/export after navigation is ready
        import('./playlist-export.js').then(exportModule => {
            exportModule.initPlaylistImportExport();
        });
    });
    
    // Initialize animations
    import('./animations.js').then(module => {
        module.initTiltEffect();
        module.initPlayerAnimations();
        module.initButtonEffects();
    });
    
    // Initialize player controls (loop function and video hiding)
    import('./player-controls.js').then(module => {
        module.initPlayerControls();
    });
    
    // Make functions accessible from the global scope for use in navigation.js
    window.showPlaylist = showPlaylist;
    window.playVideo = playVideo;
    window.playerState = playerState;
    window.renderPlaylists = renderPlaylists;
    window.updateLibraryView = updateLibraryView; 
    window.currentPlaylistIndex = currentPlaylistIndex; 
}

// Start app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);