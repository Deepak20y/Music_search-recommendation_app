const clientId = '273c9b2076ad4e4cb282bbf69f198707';
const clientSecret = 'bc935b687ab74aab808ee948663a86b4'; 
async function getAccessToken() {
    const encodedCredentials = btoa(`${clientId}:${clientSecret}`);
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + encodedCredentials
        },
        body: new URLSearchParams({
            'grant_type': 'client_credentials'
        })
    });

    const data = await response.json();
    return data.access_token;
}

async function searchTracks(query, type) {
    const token = await getAccessToken();
    let apiUrl = '';

    if (type === 'artist') {
        apiUrl = `https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(query)}&type=track&limit=50`;
    } else if (type === 'year') {
        apiUrl = `https://api.spotify.com/v1/search?q=year:${encodeURIComponent(query)}&type=track&limit=50`;
    } else {
        apiUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`;
    }

    const response = await fetch(apiUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    return data.tracks.items;
}

async function getRecommendations(trackId) {
    const token = await getAccessToken();
    const apiUrl = `https://api.spotify.com/v1/recommendations?seed_tracks=${trackId}&limit=10`;

    const response = await fetch(apiUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    return data.tracks;
}

function toggleFavorite(trackId, button) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
    if (favorites[trackId]) {
        delete favorites[trackId];
        button.classList.remove('favorited');
    } else {
        favorites[trackId] = true;
        button.classList.add('favorited');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isFavorite(trackId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || {};
    return !!favorites[trackId];
}

async function displayResults(tracks) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    if (tracks.length === 0) {
        resultsContainer.innerHTML = '<p>No results found</p>';
    } else {
        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('track');

            const trackImage = document.createElement('img');
            trackImage.src = track.album.images[0]?.url || 'https://via.placeholder.com/220';

            const trackInfo = document.createElement('div');
            trackInfo.classList.add('track-info');
            trackInfo.innerHTML = `<strong>${track.name}</strong><br>by ${track.artists[0].name}<br>Popularity: ${track.popularity}<br>Release Date: ${track.album.release_date}`;

            const favoriteButton = document.createElement('button');
            favoriteButton.classList.add('favorite-button');
            favoriteButton.textContent = '♥';

            if (isFavorite(track.id)) {
                favoriteButton.classList.add('favorited');
            }

            favoriteButton.addEventListener('click', () => {
                toggleFavorite(track.id, favoriteButton);
            });

            trackElement.appendChild(trackImage);
            trackElement.appendChild(trackInfo);
            trackElement.appendChild(favoriteButton);

            resultsContainer.appendChild(trackElement);
        });

        // Get the most popular track and fetch recommendations
        const mostListenedTrack = tracks.reduce((prev, current) => (prev.popularity > current.popularity) ? prev : current, tracks[0]);
        const recommendations = await getRecommendations(mostListenedTrack.id);
        displayRecommendations(recommendations);
    }
}

function displayRecommendations(recommendations) {
    const suggestionsContainer = document.getElementById('suggestions');
    suggestionsContainer.innerHTML = '';

    if (recommendations.length === 0) {
        suggestionsContainer.innerHTML = '<p>No suggestions found</p>';
    } else {
        recommendations.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('track');

            const trackImage = document.createElement('img');
            trackImage.src = track.album.images[0]?.url || 'https://via.placeholder.com/220';

            const trackInfo = document.createElement('div');
            trackInfo.classList.add('track-info');
            trackInfo.innerHTML = `<strong>${track.name}</strong><br>by ${track.artists[0].name}<br>Popularity: ${track.popularity}<br>Release Date: ${track.album.release_date}`;

            trackElement.appendChild(trackImage);
            trackElement.appendChild(trackInfo);

            suggestionsContainer.appendChild(trackElement);
        });
    }
}

document.getElementById('search-button').addEventListener('click', async () => {
    const query = document.getElementById('search-input').value;
    const searchType = document.querySelector('input[name="search-type"]:checked').value;

    if (query) {
        const tracks = await searchTracks(query, searchType);
        await displayResults(tracks);
    }
});
