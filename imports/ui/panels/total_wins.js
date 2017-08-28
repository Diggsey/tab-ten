import './total_wins.html';
import './total_wins.scss';
import './hyperscore.js';
import { PlayerColors } from './colors.js';
import { EJSON } from 'meteor/ejson';
import Chart from 'chart.js';
import { createPlayerGraph } from './player_graph.js';
import { createReactiveArray } from '../../api/stream.js';

const TotalWins = createReactiveArray({}, (prevState, record) => {
    const newState = EJSON.clone(prevState);
    if (!newState[record.winner])
        newState[record.winner] = 1;
    else
        newState[record.winner]++;
    return newState;
});

createPlayerGraph(Template.total_wins_panel, {
    title() {
        return 'Cumulative Wins';
    },
    dataSource() {
        return TotalWins.get();
    },
    projection(data) {
        return data;
    }
});
