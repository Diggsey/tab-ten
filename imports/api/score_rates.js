import { Records } from './records.js';

Tracker.autorun(() => {
    const playerMap = {};
    function accScoreRate(name, otherName, pointsWon, pointsPlayed) {
        if (!(name in playerMap))
            playerMap[name] = {"total": []};
        const player = playerMap[name];
        if (!(otherName in player))
            player[otherName] = []
    }

    Records.find({}).forEach((record) => {
        const total = record.winnerScore + record.loserScore;
        accScoreRate(record.winner, record.loser, record.winnerScore, total);
        accScoreRate(record.loser, record.winner, record.loserScore, total);
    });

    Players.set(players);
});
