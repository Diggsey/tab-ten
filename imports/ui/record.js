import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './record.html';
import './record.scss';

// More efficiently manage record info than the naive reactive
// approach.
const recordInfo = new ReactiveDict('recordInfo');
function setRecordProperty(id, key, value) {
    if (!id)
        return;
    Tracker.nonreactive(() => {
        props = recordInfo.get(id) || {};
        props[key] = value;
        recordInfo.set(id, props);
    })
}

export function getSelectedRecordId() {
    return FlowRouter.getQueryParam('record');
}

var lastSelectedId = null;
Tracker.autorun(() => {
    const newId = getSelectedRecordId();
    if (newId != lastSelectedId) {
        setRecordProperty(lastSelectedId, 'selected', false);
        setRecordProperty(newId, 'selected', true);
        lastSelectedId = newId;
    }
});

function selectRecord(id) {
    FlowRouter.withReplaceState(() => {
        FlowRouter.setQueryParams({ 'record': id });
    });
}

const recordMime = 'text/x-record-id';

Template.record.helpers({
    recordClass() {
        info = recordInfo.get(this._id) || {};
        classes = [];
        if (info.selected)
            classes.push('selected');
        if (info.dragover)
            classes.push('dragover');
        return classes.join(' ');
    }
})

var draggedRecordId = null;
var dragOverRecordId = null;

function dragOverRecord(id) {
    setRecordProperty(dragOverRecordId, 'dragover', false);
    dragOverRecordId = id;
    setRecordProperty(dragOverRecordId, 'dragover', true);
}

Template.record.events({
    'mousedown tr'() {
        selectRecord(this._id);
    },
    'drag tr'() {
        draggedRecordId = this._id;
    },
    'dragover tr'(ev) {
        if (draggedRecordId) {
            ev.preventDefault();
            dragOverRecord(this._id);
        }
    },
    'dragleave tr'() {
        if (draggedRecordId) {
            dragOverRecord(null);
        }
    },
    'drop tr'() {
        if (draggedRecordId) {
            dragOverRecord(null);

            if (this._id != draggedRecordId) {
                Meteor.call('records.move', {
                    fromId: draggedRecordId,
                    toId: this._id
                });
            }
        }
    },
    'dragend tr'() {
        if (draggedRecordId) {
            dragOverRecord(null);
        }
    }
});
