"use strict";
// Copyright 2016-2018, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A sequence of widgets flowing either horizontally or vertically.  Widgets flowing horizontally
 * must wrap after 24 grid columns.  There is no effective vertical limit on widgets flowing
 * vertically.
 */
class FlowWidget {
    constructor(...widgets) {
        this.widgets = [];
        for (const widget of widgets) {
            this.addWidget(widget);
        }
    }
    addWidget(widget) {
        this.widgets.push(widget);
    }
    width() {
        let width = 0;
        const positions = this.getWidgetRelativePositions();
        for (const [widget, dimension] of positions) {
            // The width of the sequence is the rightmost grid column of all of the widgets in
            // the sequence.
            width = Math.max(width, dimension.relativeX + widget.width());
        }
        return width;
    }
    height() {
        let height = 0;
        const positions = this.getWidgetRelativePositions();
        for (const [widget, dimension] of positions) {
            // The height of the sequence is the bottommost grid column of all the widgets in
            // the sequence.
            height = Math.max(height, dimension.relativeY + widget.height());
        }
        return height;
    }
    /** For internal use only. */
    addWidgetJson(widgetJsons, xOffset, yOffset, region) {
        for (const [widget, dimension] of this.getWidgetRelativePositions()) {
            // Recurse into each of our children, asking them to add themselves into [widgetJsons].
            // We pass them their actual position based on the x/y offset of this FlowWidget and
            // their relative offset within us.
            widget.addWidgetJson(widgetJsons, xOffset + dimension.relativeX, yOffset + dimension.relativeY, region);
        }
    }
}
exports.FlowWidget = FlowWidget;
/**
 * Represents a vertical sequence of [Widget]s in the [Dashboard].  There is no limit on how long
 * this sequence will be.
 *
 * The final width of this widget will be the width of the largest item in the column. The final
 * height of this widget will be the sum of all the heights of all the widgets in the column.
 */
class ColumnWidget extends FlowWidget {
    constructor(...widgets) {
        super(...widgets);
    }
    getWidgetRelativePositions() {
        const result = new Map();
        const relativeX = 0;
        let relativeY = 0;
        for (const widget of this.widgets) {
            const widgetHeight = widget.height();
            // In a vertical flow, there is no wraparound.  So all subwidgets start at the same
            // x-position as their parent.  Each is placed below the last though.  So the relativeY
            // keeps getting incremented by the height of the last widget we added.
            result.set(widget, { relativeX, relativeY });
            relativeY += widgetHeight;
        }
        return result;
    }
}
exports.ColumnWidget = ColumnWidget;
/**
 * Represents a horizontal sequence of [Widget]s in the [Dashboard].  Widgets are laid out
 * horizontally in the grid until it would go past the max width of 24 columns.  When that happens,
 * the widgets will wrap to the next available grid row.
 *
 * Rows must start in the leftmost grid column.
 *
 * The final width of this widget will be the furthest column that a widget is placed at prior to
 * wrapping. The final height of this widget will be the bottommost row that a widget is placed at.
 */
class RowWidget extends FlowWidget {
    constructor(...widgets) {
        super(...widgets);
    }
    getWidgetRelativePositions() {
        const result = new Map();
        const maxWidth = 24;
        let height = 0;
        let relativeX = 0;
        let relativeY = 0;
        for (const widget of this.widgets) {
            const widgetHeight = widget.height();
            const widgetWidth = widget.width();
            if (widgetWidth > maxWidth) {
                throw new Error(`Widget width cannot be greater than ${maxWidth}.`);
            }
            // If this widget would go past 24 grid columns then wrap around.
            if (relativeX + widgetWidth > maxWidth) {
                relativeX = 0;
                relativeY = height;
            }
            height = Math.max(height, relativeY + widgetHeight);
            result.set(widget, { relativeX, relativeY });
            relativeX += widgetWidth;
        }
        return result;
    }
    /** For internal use only. */
    addWidgetJson(widgetJsons, xOffset, yOffset, region) {
        if (xOffset !== 0) {
            throw new Error(`A RowWidget must be placed in the leftmost grid column: ${xOffset}`);
        }
        return super.addWidgetJson(widgetJsons, xOffset, yOffset, region);
    }
}
exports.RowWidget = RowWidget;
//# sourceMappingURL=widgets_flow.js.map