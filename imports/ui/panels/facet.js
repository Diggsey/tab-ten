import './facet.html';
import './facet.scss';
import { PlayerColors } from './colors.js';
import { HyperScore, Facets } from './hyperscore.js';
import { createPlayerGraph } from './player_graph.js';
import Chart from 'chart.js';

Template.facet_panel.helpers({
    facets() {
        return Facets;
    }
});

createPlayerGraph(Template.facet_panel_graph, {
    title(instance) {
        return instance.data;
    },
    dataSource() {
        return HyperScore.get();
    },
    params(instance) {
        return Facets.indexOf(instance.data);
    },
    projection(data, facetIndex) {
        return data.facets[facetIndex];
    }
})
