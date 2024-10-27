const worldColors = {
    main: '#ffffff',
    bg: '#01010F',
    muted: '#777777',
}

const playerColors = {
    blue: {
        main: '#0E93E0',
        dark: '#252F9D',
        light: '#78D9F4',
    },
    orange: {
        main: '#FF7704',
        dark: '#800B00',
        light: '#FFB45F',
    },
    green: {
        main: '#0AD69C',
        dark: '#02551E',
        light: '#80F6E3',
    },
    yellow: {
        main: '#F7D126',
        dark: '#6B4900',
        light: '#FEE780',
    }
}

export const COLOR = {
    get: function(name) {
        name = name || 'main'
        return worldColors[name] || worldColors.main
    },

    player: function(name, variant) {
        name = name || 'blue'
        variant = variant || 'main'

        if (playerColors[name] && playerColors[name][variant]) {
            return playerColors[name][variant]
        }

        return Object.keys(playerColors)[0]
    },

    getRandomName: function() {
        const playerColorNames = Object.keys(playerColors)
        // playerColorNames.shift()
        return playerColorNames[playerColorNames.length * Math.floor(Math.random())]
    }
}

