import { Records } from './records.js'


// Like `Meteor.autorun`, but delayed & debounced
function delayedAutorun(f, delay) {
    const outerComputation = Tracker.currentComputation;
    var timeoutId = Meteor.setTimeout(() => {
        timeoutId = null;
        const innerComputation = Tracker.autorun(f);
        if (outerComputation) {
            outerComputation.onInvalidate(() => {
                innerComputation.stop();
            });
        }
    }, delay);

    if (outerComputation) {
        outerComputation.onInvalidate(() => {
            if (timeoutId != null)
                Meteor.clearTimeout(timeoutId);
        });
    }
}


function updateRemainingStream(initialState, stepFn, storeFn, offset) {
    delayedAutorun(() => {
        const batchSize = 10;
        const records = Records.find({}, {sort: { gameNo: 1 }, skip: offset, limit: batchSize}).fetch();
        let state = initialState;
        for (let i = 0; i < records.length; ++i) {
            Tracker.nonreactive(() => {
                storeFn(offset + i, state, false);
            });
            state = stepFn(state, records[i]);
        }

        if (records.length < batchSize) {
            Tracker.nonreactive(() => {
                storeFn(offset + records.length, state, true)
            });
        } else {
            updateRemainingStream(state, stepFn, storeFn, offset + batchSize);
        }
    }, 20);
}

export function createReactiveArray(initialState, stepFn) {
    const result = new ReactiveVar([]);
    function storeFn(index, state, isLast) {
        const arr = result.get();
        if (isLast)
            arr.splice(index);
        if (arr.length < index)
            arr.push(state);
        else
            arr[index] = state;
        result.set(arr);
    }
    updateRemainingStream(initialState, stepFn, storeFn, 0);
    return result;
}
