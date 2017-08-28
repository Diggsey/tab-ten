import './score.html';
import './score.scss';
import { PlayerColors } from './colors.js';
import { HyperScore } from './hyperscore.js';
import { createPlayerGraph } from './player_graph.js';
import Chart from 'chart.js';

createPlayerGraph(Template.score_panel, {
    title() {
        return 'Score';
    },
    dataSource() {
        return HyperScore.get();
    },
    projection(data) {
        return data.score;
    }
});
