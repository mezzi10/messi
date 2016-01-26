'use strict';

var ListDragon = require('list-dragon');

var Local = require('./Local');
var DataModelDecorator = require('./DataModelDecorator');
var DataModelJSON = require('../dataModels/JSON');
var features = require('../features/index');
var addStylesheet = require('../../css/stylesheets');
//var aggregations = require('hyper-analytics').util.aggregations;
//var aggregations = require('../local_node_modules/hyper-analytics').util.aggregations;
var aggregations = require('../local_node_modules/finanalytics').aggregations;

/**
 * @name behaviors.JSON
 * @desc > Same parameters as {@link behaviors.Behavior#initialize|initialize}, which is called by this constructor.
 * @constructor
 */
var JSON = Local.extend('behaviors.JSON', {

    /**
     * @summary Constructor logic, called _after_{@link Behavior#initialize|Behavior.initialize()}.
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     *
     * @param grid - the hypergrid
     * @param {object[]} dataRows - array of uniform data objects
     * @memberOf behaviors.JSON.prototype
     */
    initialize: function(grid, dataRows) {
        this.setData(dataRows);
    },

    features: [
        features.CellSelection,
        features.KeyPaging,
        features.ColumnPicker,
        features.ColumnResizing,
        features.RowResizing,
        features.Filters,
        features.RowSelection,
        features.ColumnSelection,
        features.ColumnMoving,
        features.ColumnSorting,
        features.CellEditing,
        features.CellClick,
        features.OnHover
    ],

    aggregations: aggregations,

    createColumns: function() {
        var dataModel = this.getDataModel();
        var columnCount = dataModel.getColumnCount();
        var headers = dataModel.getHeaders();
        var fields = dataModel.getFields();
        this.clearColumns();
        for (var i = 0; i < columnCount; i++) {
            var header = headers[i];
            var column = this.addColumn(i, header);
            var properties = column.getProperties();
            properties.field = fields[i];
            properties.header = header;
            properties.complexFilter = null;
        }
    },

    getDefaultDataModel: function() {
        var model = new DataModelJSON();
        var wrapper = new DataModelDecorator(this.grid, model);
        wrapper.setComponent(model); // TODO: Redundant? Already performed in DataModelDecorator()?
        return wrapper;
    },

    applyFilters: function() {
        var dataRows, selectedRows, selectedDataRows, offset, index,
            sm = this.grid.selectionModel,
            hasRowSelections = sm.hasRowSelections();

        // Make note of the actual objects backing the currently selected rows.
        if (hasRowSelections) {
            dataRows = this.getDataModel().getFilteredData();
            selectedRows = this.getSelectedRows();
            selectedDataRows = [];
            selectedRows.forEach(function(selectedRowIndex) {
                selectedDataRows.push(dataRows[selectedRowIndex]);
            });
        }

        // Filter the rows...
        this.dataModel.applyFilters();

        // Re-establish grid row selections based on actual data row objects noted above.
        if (hasRowSelections) {
            sm.clearRowSelection();
            offset = this.grid.getHeaderRowCount();
            dataRows = this.getDataModel().getFilteredData();
            selectedDataRows.forEach(function(dataRow) {
                index = dataRows.indexOf(dataRow);
                if (index >= 0) {
                    sm.selectRow(offset + index);
                }
            });
        }
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the header labels.
     * @param {string[]} headerLabels - The header labels.
     */
    setHeaders: function(headerLabels) {
        this.getDataModel().setHeaders(headerLabels);
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @desc * @returns {string[]} The header labels.
     */
    getHeaders: function() {
        return this.getDataModel().getHeaders();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the fields array.
     * @param {string[]} fieldNames - The field names.
     */
    setFields: function(fieldNames) {
        //were defining the columns based on field names....
        //we must rebuild the column definitions
        this.getDataModel().setFields(fieldNames);
        this.createColumns();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Get the field names.
     * @returns {string[]}
     */
    getFields: function() {
        return this.getDataModel().getFields();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the data field.
     * @param {object[]} objects - An array of uniform objects, each being a row in the grid.
     */
    setData: function(dataRows) {
        this.getDataModel().setData(dataRows);
        this.createColumns();
        var self = this;
        if (this.grid.isColumnAutosizing()) {
            setTimeout(function() {
                self.autosizeAllColumns();
            }, 100);
            self.changed();
        } else {
            setTimeout(function() {
                self.allColumns[-1].checkColumnAutosizing(true);
                self.changed();
            });
        }
    },

    /**
     * @summary Set the top totals.
     * @memberOf behaviors.JSON.prototype
     * @param {Array<Array>} totalRows - array of rows (arrays) of totals
     */
    setTopTotals: function(totalRows) {
        this.getDataModel().setTopTotals(totalRows);
    },

    /**
     * @summary Get the top totals.
     * @memberOf behaviors.JSON.prototype
     * @returns {Array<Array>}
     */
    getTopTotals: function() {
        return this.getDataModel().getTopTotals();
    },

    /**
     * @summary Set the bottom totals.
     * @memberOf behaviors.JSON.prototype
     * @param {Array<Array>} totalRows - array of rows (arrays) of totals
     */
    setBottomTotals: function(totalRows) {
        this.getDataModel().setBottomTotals(totalRows);
    },

    /**
     * @summary Get the bottom totals.
     * @memberOf behaviors.JSON.prototype
     * @returns {Array<Array>}
     */
    getBottomTotals: function() {
        return this.getDataModel().getBottomTotals();
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Build the fields and headers from the supplied column definitions.
     * ```javascript
     * myJsonBehavior.setColumns([
     *     { title: 'Stock Name', field: 'short_description' },
     *     { title: 'Status', field: 'trading_phase' },
     *     { title: 'Reference Price', field: 'reference_price' }
     * ]);
     * ```
     * @param {Array} columnDefinitions - an array of objects with fields 'title', and 'field'
     */
    setColumns: function(columnDefinitions) {
        this.getDataModel().setColumns(columnDefinitions);
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Enhance the double-click event just before it's broadcast to listeners.
     * @param {Point} event
     */
    enhanceDoubleClickEvent: function(event) {
        event.row = this.getRow(event.gridCell.y);
    },

    setDataProvider: function(dataProvider) {
        this.getDataModel().setDataProvider(dataProvider);
    },

    hasHierarchyColumn: function() {
        return this.getDataModel().hasHierarchyColumn();
    },

    getColumnAlignment: function(x) {
        if (x === 0 && this.hasHierarchyColumn()) {
            return 'left';
        } else {
            return 'center';
        }
    },

    getRowSelectionMatrix: function(selectedRows) {
        return this.getDataModel().getRowSelectionMatrix(selectedRows);
    },

    getColumnSelectionMatrix: function(selectedColumns) {
        return this.getDataModel().getColumnSelectionMatrix(selectedColumns);
    },

    getSelectionMatrix: function(selections) {
        return this.getDataModel().getSelectionMatrix(selections);
    },

    getRowSelection: function() {
        var selectedRows = this.getSelectedRows();
        return this.getDataModel().getRowSelection(selectedRows);
    },

    getColumnSelection: function() {
        var selectedColumns = this.getSelectedColumns();
        return this.getDataModel().getColumnSelection(selectedColumns);
    },

    getSelection: function() {
        var selections = this.getSelections();
        return this.getDataModel().getSelection(selections);
    },

    buildColumnPicker: function(div) {
        if (!this.isColumnReorderable()) {
            return false;
        }

        var listOptions = {
            cssStylesheetReferenceElement: div
        };

        var groups = { models: this.getGroups(), title: 'Groups' },
            availableGroups = { models: this.getAvailableGroups(), title: 'Available Groups' },
            hiddenColumns = { models: this.getHiddenColumns(), title: 'Hidden Columns' },
            visibleColumns = { models: this.getVisibleColumns(), title: 'Visible Columns'},
            groupLists = new ListDragon([groups, availableGroups], listOptions),
            columnLists = new ListDragon([hiddenColumns, visibleColumns], listOptions),
            listSets = [groupLists, columnLists];

        addStylesheet('list-dragon', div);

        listSets.forEach(function(listSet) {
            listSet.modelLists.forEach(function(list) {
                div.appendChild(list.container);
            });
        });

        //attach for later retrieval
        div.lists = {
            group: groups.models,
            availableGroups: availableGroups.models,
            hidden: hiddenColumns.models,
            visible: visibleColumns.models
        };

        return true;
    },
    getGroups: function() {
        return this.getDataModel().getGroups();
    },
    getAvailableGroups: function() {
        return this.getDataModel().getAvailableGroups();
    },
    getHiddenColumns: function() {
        return this.getDataModel().getHiddenColumns();
    },
    getVisibleColumns: function() {
        return this.getDataModel().getVisibleColumns();
    },
    setColumnDescriptors: function(lists) {
        //assumes there is one row....
        var tree = this.columns[0];
        this.columns.length = 0;
        if (tree && tree.label === 'Tree') {
            this.columns.push(tree);
        }
        for (var i = 0; i < lists.visible.length; i++) {
            this.columns.push(lists.visible[i]);
        }

        var groupBys = lists.group.map(function(e) {
            return e.id;
        });
        this.getDataModel().setGroups(groupBys);

        this.changed();
    },

    getSelectedRows: function() {
        var offset = -this.grid.getHeaderRowCount();
        var selections = this.grid.selectionModel.getSelectedRows();
        var result = selections.map(function(each) {
            return each + offset;
        });
        return result;
    },

    getSelectedColumns: function() {
        return this.grid.selectionModel.getSelectedColumns();
    },

    getSelections: function() {
        return this.grid.selectionModel.getSelections();
    }

});

module.exports = JSON;
