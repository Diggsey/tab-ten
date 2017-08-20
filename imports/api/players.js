import { Records } from './records.js';

export const Players = new ReactiveVar([]);

Tracker.autorun(() => {
    const playerMap = {};
    const players = [];
    function addPlayer(name, won) {
        var player;
        if (!playerMap[name]) {
            playerMap[name] = player = {
                name,
                wins: 0,
                losses: 0,
                total: 0,
            }
            players.push(player);
        } else {
            player = playerMap[name];
        }
        player.total++;
        if (won)
            player.wins++;
        else
            player.losses++;
    }

    Records.find({}).forEach((record) => {
        addPlayer(record.winner, true);
        addPlayer(record.loser, false);
    });

    Players.set(players);
});
