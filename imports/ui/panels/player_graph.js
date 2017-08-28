import { PlayerColors } from './colors.js';
import { HyperScore } from './hyperscore.js';
import Chart from 'chart.js';

export function createPlayerGraph(template, options) {
        
    template.onRendered(function () {
        const chart = new Chart(this.$("canvas")[0], {
            type: 'line',
            data: {
                datasets: []
            },
            options: {
                maintainAspectRatio: false,
                title: {
                    display: true,
                    text: options.title(this)
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            maxTicksLimit: 20
                        }
                    }]
                },
                tooltips: {
                    mode: 'nearest',
                    intersect: true
                }
            }
        });

        this.autorun(() => {
            const data = options.dataSource(this);
            const labels = new Array(data.length);
            for (let i = 0; i < labels.length; ++i)
                labels[i] = i.toString();
            chart.data.labels = labels;

            prevDatasets = {};
            if (chart.data.datasets)
                for (let dataset of chart.data.datasets)
                    prevDatasets[dataset.label] = dataset;
            chart.data.datasets = [];

            const players = Object.keys(data[data.length-1] || {});
            players.sort();
            const params = options.params && options.params(this);

            for (let index = 0; index < players.length; ++index) {
                const player = players[index];
                const values = new Array(data.length);
                for (let i = 0; i < data.length; ++i) {
                    const dataPoint = data[i][player];
                    if (dataPoint != null)
                        values[i] = options.projection(dataPoint, params);
                    else
                        values[i] = null;
                }

                const color = PlayerColors[index % PlayerColors.length];

                const dataset = prevDatasets[player] || {};
                dataset.label = player;
                dataset.data = values;
                dataset.pointRadius = 0;
                dataset.pointHitRadius = 5;
                dataset.borderColor = color;
                dataset.backgroundColor = color;
                dataset.fill = false;
                dataset.lineTension = 0;

                chart.data.datasets.push(dataset);
            }

            chart.update();
        });

        this.chart = chart;
    });

    template.onDestroyed(function() {
        this.chart.destroy();
    });

}